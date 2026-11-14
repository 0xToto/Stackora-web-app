import Fastify from "fastify";
import cors from "@fastify/cors";
import websocket from "@fastify/websocket";
import rateLimit from "@fastify/rate-limit";
import { z } from "zod";
import { randomUUID } from "node:crypto";
import type { WebSocket } from "ws";
import { Store } from "./store.js";
import { CATALOG, SLOTS, packs, type Slot } from "./catalog.js";
import { IapDisabled, revocationFromNotification, verifyTransaction } from "./iap.js";
import { StripeDisabled, createCheckout, paid, retrieveSession, stripeConfig, verifyWebhook } from "./stripe.js";
import {
  createTournament,
  join,
  start,
  action,
  tick,
  view,
  assertTournament,
  type Tournament,
} from "./tournament.js";
const credentials = z.object({
  email: z.email().max(254),
  password: z.string().min(10).max(128),
});
const settings = z
  .object({
    name: z.string().trim().min(3).max(60),
    variant: z
      .enum(["classic", "sevenTwo", "ghost", "redRiver"])
      .default("classic"),
    maxPlayers: z.number().int().min(2).max(32).default(16),
    startingStack: z.number().int().min(100).max(100000).default(2000),
    initialBB: z.number().int().min(2).max(10000).default(50),
    levelSeconds: z.number().int().min(30).max(3600).default(180),
    decisionSeconds: z.number().int().min(5).max(120).default(20),
  })
  .refine((s) => s.startingStack >= s.initialBB * 2, {
    message: "Le stack doit être au moins égal à 2 BB.",
  });
const command = z.object({
  actionId: z.string().min(8).max(100),
  version: z.number().int(),
  type: z.enum(["fold", "check", "call", "raise"]),
  amount: z.number().int().positive().max(100000000).optional(),
});
export async function buildApp(path = "stackora.sqlite", runTimers = true) {
  const app = Fastify({
    logger: process.env.LOG_LEVEL ? { level: process.env.LOG_LEVEL } : false,
    bodyLimit: 16384,
  });
  const store = new Store(path);
  const games = new Map(store.all().map((t) => [t.id, t]));
  const clients = new Set<{
    socket: WebSocket;
    id: string;
    token: string;
    tournament: string | null;
  }>();
  await app.register(cors, {
    origin: process.env.CORS_ORIGIN?.split(",") ?? false,
  });
  await app.register(rateLimit, { max: 120, timeWindow: "1 minute" });
  await app.register(websocket, { options: { maxPayload: 4096 } });
  app.setErrorHandler((error, req, reply) => {
    if (reply.statusCode === 429) {
      reply.send(error);
      return;
    }
    reply
      .code(error instanceof z.ZodError ? 400 : 400)
      .send({
        error:
          error instanceof z.ZodError
            ? "Données invalides."
            : error instanceof Error
              ? error.message
              : "Erreur inconnue.",
      });
  });
  function auth(req: any) {
    try {
      return store.auth(
        String(req.headers.authorization ?? "").replace(/^Bearer /, ""),
      );
    } catch {
      throw Error("Connexion requise.");
    }
  }
  function find(id: string) {
    const t = games.get(id);
    if (!t) throw Error("Tournoi introuvable.");
    return t;
  }
  /** Vue joueur + cosmétiques publics équipés (lus côté serveur, jamais fournis par le client). */
  function present(t: Tournament, id: string) {
    return { ...view(t, id), cosmetics: store.economy.publicLooks(t.players.map((p) => p.id)) };
  }
  function settle(before: Tournament["status"] | undefined, t: Tournament) {
    if (before !== "finished" && t.status === "finished") {
      try {
        store.economy.rewardTournament(t);
      } catch (error) {
        app.log.error(error);
      }
    }
  }
  function broadcast(t: Tournament) {
    const cosmetics = store.economy.publicLooks(t.players.map((p) => p.id));
    for (const c of clients)
      if (c.tournament === t.id && c.socket.readyState === 1) {
        try {
          store.auth(c.token);
          c.socket.send(
            JSON.stringify({ type: "state", state: { ...view(t, c.id), cosmetics } }),
          );
        } catch {
          c.socket.close(1008);
        }
      }
  }
  function commit(id: string, fn: (t: Tournament) => void) {
    const before = games.get(id)?.status;
    const t = structuredClone(find(id));
    fn(t);
    assertTournament(t);
    store.save(t);
    games.set(t.id, t);
    settle(before, t);
    broadcast(t);
    return t;
  }
  app.get("/health", async () => ({ ok: true, version: "0.2.1" }));
  app.post(
    "/auth/register",
    { config: { rateLimit: { max: 10, timeWindow: "1 minute" } } },
    async (req) => {
      const b = credentials
        .extend({
          name: z
            .string()
            .trim()
            .regex(/^[\p{L}\p{N}_-]{3,20}$/u),
        })
        .parse(req.body);
      return store.register(b.email, b.name, b.password);
    },
  );
  app.post(
    "/auth/login",
    { config: { rateLimit: { max: 10, timeWindow: "1 minute" } } },
    async (req) => {
      const b = credentials.parse(req.body);
      return store.login(b.email, b.password);
    },
  );
  app.get("/me", async (req) => store.user(auth(req)));
  app.post("/auth/logout", async (req) => {
    auth(req);
    const token = String(req.headers.authorization).replace(/^Bearer /, "");
    store.logout(token);
    for (const c of clients) if (c.token === token) c.socket.close(1008);
    return { ok: true };
  });
  app.get("/tournaments", async (req) => {
    const id = auth(req);
    return [...games.values()]
      .filter((t) => t.players.some((p) => p.id === id))
      .map((t) => ({
        id: t.id,
        name: t.name,
        code: t.code,
        status: t.status,
        count: t.players.length,
        variant: t.variant,
      }));
  });
  app.post("/tournaments", async (req) => {
    const id = auth(req);
    const b = settings.parse(req.body);
    const t = createTournament(id, b.name, b);
    join(t, id, store.user(id).name);
    store.save(t);
    games.set(t.id, t);
    return present(t, id);
  });
  app.post("/join", async (req) => {
    const id = auth(req);
    const { code } = z
      .object({ code: z.string().min(1).max(20) })
      .parse(req.body);
    const t = [...games.values()].find(
      (t) => t.code === code.trim().toUpperCase(),
    );
    if (!t) throw Error("Code inconnu.");
    return present(
      commit(t.id, (t) => join(t, id, store.user(id).name)),
      id,
    );
  });
  app.get<{ Params: { id: string } }>("/tournaments/:id", async (req) =>
    present(find(req.params.id), auth(req)),
  );
  app.post<{ Params: { id: string } }>("/tournaments/:id/bots", async (req) => {
    const id = auth(req);
    const { count } = z
      .object({ count: z.number().int().min(1).max(31) })
      .parse(req.body);
    return present(
      commit(req.params.id, (t) => {
        if (t.owner !== id) throw Error("Organisateur uniquement.");
        if (t.players.length + count > t.maxPlayers)
          throw Error("Capacité dépassée.");
        for (let i = 0; i < count; i++)
          join(
            t,
            "bot-" + randomUUID(),
            ["Nova", "Atlas", "Jade", "Orion", "Luna", "Oscar", "Iris", "Milo"][
              i % 8
            ] +
              " " +
              (t.players.length + 1),
            true,
          );
      }),
      id,
    );
  });
  app.post<{ Params: { id: string } }>(
    "/tournaments/:id/start",
    async (req) => {
      const id = auth(req);
      return present(
        commit(req.params.id, (t) => start(t, id)),
        id,
      );
    },
  );
  app.post<{ Params: { id: string } }>(
    "/tournaments/:id/action",
    async (req) => {
      const id = auth(req);
      const b = command.parse(req.body);
      return present(
        commit(req.params.id, (t) => action(t, id, b, b.version, b.actionId)),
        id,
      );
    },
  );
  // ───────── Profil, progression, préférences ─────────
  function profile(id: string) {
    const e = store.economy;
    e.ensure(id);
    const mine = [...games.values()].filter((t) => t.players.some((p) => p.id === id));
    const finished = mine.filter((t) => t.status === "finished");
    const rankOf = (t: Tournament) => t.results.find((r) => r.id === id)?.rank ?? t.players.length;
    return {
      user: store.user(id),
      wallet: { balance: e.balance(id) },
      progress: e.xp(id),
      equipped: e.equipped(id),
      owned: [...e.owned(id)],
      stats: {
        played: finished.length,
        wins: finished.filter((t) => rankOf(t) === 1).length,
        top3: finished.filter((t) => rankOf(t) <= 3).length,
        bestRank: finished.length ? Math.min(...finished.map(rankOf)) : null,
        active: mine.filter((t) => t.status !== "finished").length,
      },
      history: finished
        .sort((a, b) => b.startedAt - a.startedAt)
        .slice(0, 20)
        .map((t) => ({ id: t.id, name: t.name, variant: t.variant, rank: rankOf(t), players: t.players.length, at: t.startedAt })),
      training: e.trainingStats(id),
    };
  }
  app.get("/me/profile", async (req) => profile(auth(req)));
  app.patch("/me", async (req) => {
    const id = auth(req);
    const { name } = z.object({ name: z.string().trim().regex(/^[\p{L}\p{N}_-]{3,20}$/u) }).parse(req.body);
    return store.rename(id, name);
  });
  app.post("/me/delete", { config: { rateLimit: { max: 5, timeWindow: "1 minute" } } }, async (req) => {
    const id = auth(req);
    const { password } = z.object({ password: z.string().min(1).max(128) }).parse(req.body);
    store.checkPassword(id, password);
    if ([...games.values()].some((t) => t.status !== "finished" && t.players.some((p) => p.id === id)))
      throw Error("Quittez ou terminez vos tournois en cours avant de supprimer le compte.");
    for (const c of clients) if (c.id === id) c.socket.close(1008);
    store.deleteUser(id);
    return { ok: true };
  });
  const prefsBody = z.record(z.string().max(40), z.union([z.string().max(60), z.number(), z.boolean(), z.null()]));
  app.get("/me/prefs", async (req) => store.getPrefs(auth(req)));
  app.put("/me/prefs", async (req) => {
    const id = auth(req);
    const prefs = prefsBody.parse(req.body);
    if (Object.keys(prefs).length > 80) throw Error("Trop de préférences.");
    return store.setPrefs(id, prefs);
  });

  // ───────── Économie StackCoins ─────────
  app.get("/shop/catalog", async (req) => {
    const id = auth(req);
    const e = store.economy;
    e.ensure(id);
    const stripe = stripeConfig();
    return { items: CATALOG, packs: packs(), iapEnabled: !!process.env.APPLE_ROOT_CA_PEM_PATH && !!process.env.APPLE_BUNDLE_ID, webPayments: { enabled: !!stripe, test: !!stripe?.test }, balance: e.balance(id), owned: [...e.owned(id)], equipped: e.equipped(id) };
  });
  app.get("/wallet", async (req) => {
    const id = auth(req);
    store.economy.ensure(id);
    return { balance: store.economy.balance(id), ledger: store.economy.ledger(id) };
  });
  app.post("/shop/purchase", { config: { rateLimit: { max: 30, timeWindow: "1 minute" } } }, async (req) => {
    const id = auth(req);
    const b = z.object({ itemId: z.string().max(60), idempotencyKey: z.string().min(8).max(100) }).parse(req.body);
    const r = store.economy.purchase(id, b.itemId, b.idempotencyKey);
    return { ...r, owned: [...store.economy.owned(id)] };
  });
  app.post("/shop/equip", async (req) => {
    const id = auth(req);
    const b = z.object({ slot: z.enum(SLOTS as [Slot, ...Slot[]]), itemId: z.string().max(60) }).parse(req.body);
    const equipped = store.economy.equip(id, b.slot, b.itemId);
    for (const t of games.values()) if (t.status !== "finished" && t.players.some((p) => p.id === id)) broadcast(t);
    return { equipped };
  });
  app.get("/missions", async (req) => {
    const id = auth(req);
    store.economy.ensure(id);
    return store.economy.missions(id);
  });
  app.post("/missions/claim", async (req) => {
    const id = auth(req);
    const { id: mission } = z.object({ id: z.string().max(40) }).parse(req.body);
    return { ...store.economy.claimMission(id, mission), balance: store.economy.balance(id) };
  });
  app.post("/training/sessions", { config: { rateLimit: { max: 20, timeWindow: "1 minute" } } }, async (req) => {
    const id = auth(req);
    const b = z
      .object({
        sessionId: z.string().min(8).max(100),
        module: z.enum(["positions", "gto"]),
        category: z.string().max(30),
        correct: z.number().int().min(0).max(50),
        total: z.number().int().min(1).max(50),
      })
      .refine((s) => s.correct <= s.total)
      .parse(req.body);
    store.economy.ensure(id);
    return { ...store.economy.training(id, b), balance: store.economy.balance(id), progress: store.economy.xp(id) };
  });
  // Achats intégrés : vérification cryptographique obligatoire, jamais de crédit sur confirmation client.
  app.post("/iap/apple/verify", { config: { rateLimit: { max: 20, timeWindow: "1 minute" } } }, async (req, reply) => {
    const id = auth(req);
    const { signedTransaction } = z.object({ signedTransaction: z.string().min(20).max(20000) }).parse(req.body);
    try {
      const t = verifyTransaction(signedTransaction, packs().map((p) => p.productId));
      if (t.appAccountToken && t.appAccountToken !== id) throw Error("Transaction liée à un autre compte.");
      return store.economy.creditPurchase(id, t);
    } catch (e) {
      if (e instanceof IapDisabled) return reply.code(503).send({ error: e.message });
      throw e;
    }
  });
  app.post("/iap/apple/notifications", async (req, reply) => {
    const { signedPayload } = z.object({ signedPayload: z.string().min(20).max(60000) }).parse(req.body);
    try {
      const transactionId = revocationFromNotification(signedPayload);
      return transactionId ? store.economy.revokePurchase(transactionId) : { changed: false };
    } catch (e) {
      if (e instanceof IapDisabled) return reply.code(503).send({ error: e.message });
      throw e;
    }
  });
  // ───────── Paiement web (Stripe Checkout) ─────────
  app.post("/pay/stripe/checkout", { config: { rateLimit: { max: 10, timeWindow: "1 minute" } } }, async (req, reply) => {
    const id = auth(req);
    const { productId } = z.object({ productId: z.string().max(80) }).parse(req.body);
    const pack = packs().find((p) => p.productId === productId);
    if (!pack) throw Error("Pack inconnu.");
    try {
      return await createCheckout(id, pack, `${id}:${productId}:${randomUUID()}`);
    } catch (e) {
      if (e instanceof StripeDisabled) return reply.code(503).send({ error: e.message });
      throw e;
    }
  });
  // Retour de Checkout : le serveur relit la session chez Stripe avant tout crédit.
  app.post("/pay/stripe/confirm", { config: { rateLimit: { max: 30, timeWindow: "1 minute" } } }, async (req, reply) => {
    const id = auth(req);
    const { sessionId } = z.object({ sessionId: z.string().min(8).max(200) }).parse(req.body);
    try {
      const s = await retrieveSession(sessionId);
      if (!s) return { status: "pending", balance: store.economy.balance(id) };
      if (s.userId !== id) return reply.code(403).send({ error: "Ce paiement appartient à un autre compte." });
      const r = store.economy.creditPayment({ provider: "stripe", externalId: s.id, paymentRef: s.paymentRef, userId: s.userId, productId: s.productId, amount: s.amount, currency: s.currency, livemode: s.livemode });
      return { status: "paid", ...r };
    } catch (e) {
      if (e instanceof StripeDisabled) return reply.code(503).send({ error: e.message });
      throw e;
    }
  });
  // Webhook signé : corps brut nécessaire pour vérifier la signature HMAC.
  await app.register(async (scope) => {
    scope.addContentTypeParser("application/json", { parseAs: "string" }, (_req, body, done) => done(null, body));
    scope.post("/pay/stripe/webhook", async (req, reply) => {
      const secret = process.env.STRIPE_WEBHOOK_SECRET;
      if (!stripeConfig() || !secret) return reply.code(503).send({ error: "Webhook Stripe non configuré." });
      let event;
      try {
        event = verifyWebhook(String(req.body), req.headers["stripe-signature"] as string | undefined, secret);
      } catch (e) {
        return reply.code(400).send({ error: e instanceof Error ? e.message : "Signature invalide." });
      }
      const obj = event.data?.object ?? {};
      if (event.type === "checkout.session.completed" || event.type === "checkout.session.async_payment_succeeded") {
        const s = paid(obj);
        if (s && store.user(s.userId)) store.economy.creditPayment({ provider: "stripe", externalId: s.id, paymentRef: s.paymentRef, userId: s.userId, productId: s.productId, amount: s.amount, currency: s.currency, livemode: s.livemode });
      } else if (event.type === "charge.refunded" && obj.payment_intent) {
        store.economy.refundPayment("stripe", String(obj.payment_intent));
      }
      return { received: true };
    });
  });
  app.get("/ws", { websocket: true }, (socket) => {
    const client = {
      socket,
      id: "",
      token: "",
      tournament: null as string | null,
    };
    let messages = 0;
    let windowStart = Date.now();
    let alive = true;
    const authTimeout = setTimeout(() => {
      if (!client.id) socket.close(1008, "Authentication required");
    }, 5000);
    socket.on("pong", () => {
      alive = true;
    });
    const pulse = setInterval(() => {
      if (!alive) {
        socket.terminate();
        return;
      }
      alive = false;
      socket.ping();
    }, 30000);
    socket.on("message", (raw) => {
      try {
        if (Date.now() - windowStart > 10000) {
          messages = 0;
          windowStart = Date.now();
        }
        if (++messages > 40) throw Error("Trop de messages.");
        const b = JSON.parse(raw.toString());
        if (b.type === "auth") {
          client.token = z.string().max(128).parse(b.token);
          client.id = store.auth(client.token);
          clients.add(client);
          clearTimeout(authTimeout);
          socket.send(JSON.stringify({ type: "authenticated" }));
          return;
        }
        if (!client.id) throw Error("Connexion requise.");
        store.auth(client.token);
        if (b.type === "subscribe") {
          const id = z.string().uuid().parse(b.id);
          const state = present(find(id), client.id);
          client.tournament = id;
          socket.send(JSON.stringify({ type: "state", state }));
        } else if (b.type === "action") {
          if (!client.tournament) throw Error("Table absente");
          const c = command.parse(b.command);
          commit(client.tournament, (t) =>
            action(t, client.id, c, c.version, c.actionId),
          );
        } else throw Error("Message inconnu.");
      } catch (e) {
        socket.send(
          JSON.stringify({
            type: "error",
            error: e instanceof Error ? e.message : "Erreur",
          }),
        );
      }
    });
    socket.on("close", () => {
      clients.delete(client);
      clearInterval(pulse);
      clearTimeout(authTimeout);
    });
  });
  const timer = runTimers
    ? setInterval(() => {
        for (const t of games.values())
          if (t.status === "playing") {
            const copy = structuredClone(t);
            try {
              if (tick(copy)) {
                assertTournament(copy);
                store.save(copy);
                games.set(copy.id, copy);
                settle(t.status, copy);
                broadcast(copy);
              }
            } catch (error) {
              app.log.error(error);
            }
          }
      }, 500)
    : null;
  app.addHook("onClose", async () => {
    if (timer) clearInterval(timer);
    for (const c of clients) c.socket.terminate();
    store.close();
  });
  return { app, store, games };
}
