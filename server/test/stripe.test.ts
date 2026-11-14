import { test } from "node:test";
import assert from "node:assert/strict";
import { createServer, type Server } from "node:http";
import { createHmac } from "node:crypto";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { buildApp } from "../src/app.js";

/** Faux Stripe : enregistre les créations de session et renvoie l'état voulu. */
function fakeStripe() {
  const sessions = new Map<string, Record<string, any>>();
  const created: URLSearchParams[] = [];
  let n = 0;
  const server: Server = createServer((req, res) => {
    let body = "";
    req.on("data", (c) => (body += c));
    req.on("end", () => {
      res.setHeader("content-type", "application/json");
      if (req.headers.authorization !== "Bearer sk_test_fake") {
        res.statusCode = 401;
        return res.end(JSON.stringify({ error: { message: "bad key" } }));
      }
      if (req.method === "POST" && req.url === "/v1/checkout/sessions") {
        const form = new URLSearchParams(body);
        created.push(form);
        const id = `cs_test_${++n}`;
        sessions.set(id, {
          object: "checkout.session",
          id,
          payment_status: "unpaid",
          amount_total: Number(form.get("line_items[0][price_data][unit_amount]")),
          currency: form.get("line_items[0][price_data][currency]"),
          client_reference_id: form.get("client_reference_id"),
          metadata: { userId: form.get("metadata[userId]"), productId: form.get("metadata[productId]") },
          payment_intent: `pi_${n}`,
          livemode: false,
        });
        return res.end(JSON.stringify({ id, url: `https://checkout.stripe.test/${id}` }));
      }
      const m = req.url?.match(/^\/v1\/checkout\/sessions\/(cs_test_\d+)$/);
      if (req.method === "GET" && m && sessions.has(m[1])) return res.end(JSON.stringify(sessions.get(m[1])));
      res.statusCode = 404;
      res.end(JSON.stringify({ error: { message: "not found" } }));
    });
  });
  return { server, sessions, created };
}
const sign = (payload: string, secret: string, t = Math.floor(Date.now() / 1000)) =>
  `t=${t},v1=${createHmac("sha256", secret).update(`${t}.${payload}`).digest("hex")}`;

test("Stripe disabled: checkout refused, nothing simulated", async () => {
  const dir = mkdtempSync(join(tmpdir(), "stackora-pay-"));
  const { app } = await buildApp(join(dir, "p.sqlite"), false);
  try {
    const u = (await app.inject({ method: "POST", url: "/auth/register", payload: { email: "z@x.test", password: "password-zoe-01", name: "Zoe" } })).json();
    const r = await app.inject({ method: "POST", url: "/pay/stripe/checkout", payload: { productId: "com.stackora.coins.500" }, headers: { authorization: "Bearer " + u.token } });
    assert.equal(r.statusCode, 503);
    const c = (await app.inject({ method: "GET", url: "/shop/catalog", headers: { authorization: "Bearer " + u.token } })).json();
    assert.equal(c.webPayments.enabled, false);
  } finally {
    await app.close();
    rmSync(dir, { recursive: true, force: true });
  }
});

test("Stripe Checkout: server-verified credit, idempotent, owner-bound, amount-checked, webhooks and refunds", async () => {
  const stripe = fakeStripe();
  await new Promise<void>((r) => stripe.server.listen(0, "127.0.0.1", r));
  const port = (stripe.server.address() as { port: number }).port;
  process.env.STRIPE_SECRET_KEY = "sk_test_fake";
  process.env.STRIPE_API_BASE = `http://127.0.0.1:${port}`;
  process.env.STRIPE_WEBHOOK_SECRET = "whsec_test";
  process.env.WEB_APP_URL = "https://stackora.example";
  const dir = mkdtempSync(join(tmpdir(), "stackora-pay-"));
  const { app } = await buildApp(join(dir, "p.sqlite"), false);
  const call = (method: string, url: string, token: string, payload?: unknown) => app.inject({ method: method as any, url, payload: payload as any, headers: { authorization: "Bearer " + token } });
  const balance = async (token: string) => (await call("GET", "/wallet", token)).json().balance as number;
  try {
    const reg = async (n: string) => (await app.inject({ method: "POST", url: "/auth/register", payload: { email: `${n}@x.test`, password: `password-${n}-01`, name: n } })).json();
    const a = await reg("Alba"), b = await reg("Bruno");
    assert.equal((await call("GET", "/shop/catalog", a.token)).json().webPayments.test, true);

    // 1. Création de session : prix et métadonnées imposés par le serveur
    const co = await call("POST", "/pay/stripe/checkout", a.token, { productId: "com.stackora.coins.1500" });
    assert.equal(co.statusCode, 200, co.body);
    assert.match(co.json().url, /^https:\/\/checkout\.stripe\.test\//);
    const form = stripe.created[0];
    assert.equal(form.get("line_items[0][price_data][unit_amount]"), "299");
    assert.equal(form.get("metadata[userId]"), a.user.id);
    assert.match(form.get("success_url")!, /^https:\/\/stackora\.example\/\?checkout=success&session_id=\{CHECKOUT_SESSION_ID\}$/);
    const sid = co.json().id;

    // 2. Pas encore payé : aucun crédit
    assert.equal((await call("POST", "/pay/stripe/confirm", a.token, { sessionId: sid })).json().status, "pending");
    assert.equal(await balance(a.token), 500);

    // 3. Payé : crédit une seule fois
    stripe.sessions.get(sid)!.payment_status = "paid";
    const ok = (await call("POST", "/pay/stripe/confirm", a.token, { sessionId: sid })).json();
    assert.equal(ok.status, "paid");
    assert.equal(ok.balance, 2000);
    assert.equal((await call("POST", "/pay/stripe/confirm", a.token, { sessionId: sid })).json().duplicate, true);
    assert.equal(await balance(a.token), 2000);

    // 4. Un autre compte ne peut pas encaisser la session
    assert.equal((await call("POST", "/pay/stripe/confirm", b.token, { sessionId: sid })).statusCode, 403);

    // 5. Montant falsifié côté session : refusé
    const co2 = (await call("POST", "/pay/stripe/checkout", b.token, { productId: "com.stackora.coins.8000" })).json();
    Object.assign(stripe.sessions.get(co2.id)!, { payment_status: "paid", amount_total: 1 });
    assert.equal((await call("POST", "/pay/stripe/confirm", b.token, { sessionId: co2.id })).statusCode, 400);
    assert.equal(await balance(b.token), 500);

    // 6. Webhook : signature fausse refusée, vraie signature créditée une fois
    const co3 = (await call("POST", "/pay/stripe/checkout", b.token, { productId: "com.stackora.coins.500" })).json();
    const session3 = { ...stripe.sessions.get(co3.id)!, payment_status: "paid" };
    const event = JSON.stringify({ type: "checkout.session.completed", data: { object: session3 } });
    const hook = (payload: string, sig: string) => app.inject({ method: "POST", url: "/pay/stripe/webhook", payload, headers: { "content-type": "application/json", "stripe-signature": sig } });
    assert.equal((await hook(event, sign(event, "whsec_wrong"))).statusCode, 400);
    assert.equal((await hook(event, sign(event, "whsec_test", Math.floor(Date.now() / 1000) - 3600))).statusCode, 400);
    assert.equal(await balance(b.token), 500);
    assert.equal((await hook(event, sign(event, "whsec_test"))).statusCode, 200);
    assert.equal((await hook(event, sign(event, "whsec_test"))).statusCode, 200);
    assert.equal(await balance(b.token), 1000);
    // Le retour navigateur après le webhook ne recrédite pas
    stripe.sessions.get(co3.id)!.payment_status = "paid";
    assert.equal((await call("POST", "/pay/stripe/confirm", b.token, { sessionId: co3.id })).json().duplicate, true);
    assert.equal(await balance(b.token), 1000);

    // 7. Remboursement : débit plafonné au solde, rejeu sans effet
    await call("POST", "/shop/purchase", a.token, { itemId: "table-graphite", idempotencyKey: "spend-before-refund" }); // 2000 → 800
    const refund = JSON.stringify({ type: "charge.refunded", data: { object: { object: "charge", payment_intent: stripe.sessions.get(sid)!.payment_intent } } });
    assert.equal((await hook(refund, sign(refund, "whsec_test"))).statusCode, 200);
    assert.equal(await balance(a.token), 0);
    assert.equal((await hook(refund, sign(refund, "whsec_test"))).statusCode, 200);
    assert.equal(await balance(a.token), 0);
  } finally {
    for (const k of ["STRIPE_SECRET_KEY", "STRIPE_API_BASE", "STRIPE_WEBHOOK_SECRET", "WEB_APP_URL"]) delete process.env[k];
    await app.close();
    stripe.server.close();
    rmSync(dir, { recursive: true, force: true });
  }
});
