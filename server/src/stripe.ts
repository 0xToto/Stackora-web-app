import { createHmac, timingSafeEqual } from "node:crypto";
import type { Pack } from "./catalog.js";

/**
 * Paiements web par Stripe Checkout, sans SDK (API REST + fetch).
 *
 * Activation : STRIPE_SECRET_KEY (sk_test_… en test, sk_live_… en production),
 * STRIPE_WEBHOOK_SECRET (whsec_…, recommandé pour les remboursements),
 * WEB_APP_URL (adresse publique de l'app web, pour le retour après paiement).
 * Le crédit n'a lieu qu'après lecture de la session auprès de Stripe ou
 * réception d'un webhook signé : jamais sur la parole du navigateur.
 */
export class StripeDisabled extends Error {
  constructor() {
    super("Le paiement web n'est pas configuré sur ce serveur (STRIPE_SECRET_KEY manquant).");
  }
}
export function stripeConfig() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  return {
    key,
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET ?? null,
    api: (process.env.STRIPE_API_BASE ?? "https://api.stripe.com").replace(/\/$/, ""),
    webUrl: (process.env.WEB_APP_URL ?? "http://localhost:8081").replace(/\/$/, ""),
    test: key.startsWith("sk_test_"),
  };
}
type Cfg = NonNullable<ReturnType<typeof stripeConfig>>;

async function call(cfg: Cfg, method: "GET" | "POST", path: string, form?: Record<string, string>, idempotencyKey?: string) {
  const res = await fetch(cfg.api + path, {
    method,
    headers: {
      authorization: `Bearer ${cfg.key}`,
      ...(form ? { "content-type": "application/x-www-form-urlencoded" } : {}),
      ...(idempotencyKey ? { "idempotency-key": idempotencyKey } : {}),
    },
    body: form ? new URLSearchParams(form).toString() : undefined,
  });
  const json = (await res.json().catch(() => ({}))) as Record<string, any>;
  if (!res.ok) throw Error(json?.error?.message ? `Stripe : ${json.error.message}` : `Stripe a répondu ${res.status}.`);
  return json;
}

export async function createCheckout(userId: string, pack: Pack, requestId: string) {
  const cfg = stripeConfig();
  if (!cfg) throw new StripeDisabled();
  const session = await call(
    cfg,
    "POST",
    "/v1/checkout/sessions",
    {
      mode: "payment",
      success_url: `${cfg.webUrl}/?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${cfg.webUrl}/?checkout=cancel`,
      client_reference_id: userId,
      "line_items[0][quantity]": "1",
      "line_items[0][price_data][currency]": pack.currency,
      "line_items[0][price_data][unit_amount]": String(pack.priceCents),
      "line_items[0][price_data][product_data][name]": `${pack.coins.toLocaleString("fr-FR")} StackCoins · ${pack.name}`,
      "line_items[0][price_data][product_data][description]": "Monnaie virtuelle STACKORA, cosmétiques uniquement, non convertible.",
      "metadata[userId]": userId,
      "metadata[productId]": pack.productId,
      "payment_intent_data[metadata][userId]": userId,
      "payment_intent_data[metadata][productId]": pack.productId,
    },
    requestId,
  );
  return { id: session.id as string, url: session.url as string, test: cfg.test };
}

export type PaidSession = { id: string; userId: string; productId: string; amount: number; currency: string; paymentRef: string | null; livemode: boolean };
/** Lit une session auprès de Stripe ; retourne null si elle n'est pas (encore) payée. */
export async function retrieveSession(id: string): Promise<PaidSession | null> {
  const cfg = stripeConfig();
  if (!cfg) throw new StripeDisabled();
  if (!/^cs_[A-Za-z0-9_]+$/.test(id)) throw Error("Session invalide.");
  return paid(await call(cfg, "GET", `/v1/checkout/sessions/${id}`));
}
export function paid(s: Record<string, any>): PaidSession | null {
  if (s?.object !== "checkout.session" || s.payment_status !== "paid") return null;
  const userId = s.metadata?.userId ?? s.client_reference_id;
  if (!userId || !s.metadata?.productId) return null;
  return {
    id: s.id,
    userId,
    productId: s.metadata.productId,
    amount: Number(s.amount_total),
    currency: String(s.currency),
    paymentRef: typeof s.payment_intent === "string" ? s.payment_intent : (s.payment_intent?.id ?? null),
    livemode: !!s.livemode,
  };
}

/** Vérifie l'en-tête Stripe-Signature (HMAC-SHA256, tolérance 5 min). */
export function verifyWebhook(raw: string, header: string | undefined, secret: string, now = Date.now()) {
  if (!header) throw Error("Signature absente.");
  const parts = Object.fromEntries(header.split(",").map((p) => p.split("=") as [string, string]).filter((p) => p.length === 2 && p[0] !== "v1"));
  const signatures = header.split(",").filter((p) => p.startsWith("v1=")).map((p) => p.slice(3));
  const t = Number(parts.t);
  if (!Number.isFinite(t) || Math.abs(now / 1000 - t) > 300) throw Error("Signature expirée.");
  const expected = createHmac("sha256", secret).update(`${t}.${raw}`).digest();
  const ok = signatures.some((sig) => {
    const got = Buffer.from(sig, "hex");
    return got.length === expected.length && timingSafeEqual(got, expected);
  });
  if (!ok) throw Error("Signature invalide.");
  return JSON.parse(raw) as { type: string; data: { object: Record<string, any> } };
}
