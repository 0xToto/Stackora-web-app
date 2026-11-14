import { X509Certificate, verify } from "node:crypto";
import { readFileSync } from "node:fs";

/**
 * Vérification des transactions StoreKit 2 (JWS signés par Apple).
 * Le serveur ne crédite JAMAIS sur la seule parole du client : il vérifie la
 * chaîne x5c jusqu'au certificat racine Apple fourni par l'opérateur, puis la
 * signature ES256, puis le bundle et le produit.
 *
 * Activation : APPLE_ROOT_CA_PEM_PATH (Apple Root CA - G3 au format PEM, à
 * télécharger sur apple.com/certificateauthority) et APPLE_BUNDLE_ID.
 * Sans cette configuration, les achats réels sont refusés (pas de simulation).
 */
export class IapDisabled extends Error {
  constructor() {
    super("Les achats intégrés ne sont pas encore activés sur ce serveur.");
  }
}
export type AppleTransaction = {
  transactionId: string;
  originalTransactionId: string;
  bundleId: string;
  productId: string;
  type?: string;
  environment: string;
  revocationDate?: number;
  appAccountToken?: string;
};
export function iapConfig() {
  const path = process.env.APPLE_ROOT_CA_PEM_PATH;
  const bundleId = process.env.APPLE_BUNDLE_ID;
  if (!path || !bundleId) return null;
  return { root: new X509Certificate(readFileSync(path)), bundleId };
}
const b64url = (s: string) => Buffer.from(s.replace(/-/g, "+").replace(/_/g, "/"), "base64");

export function verifyJws<T>(jws: string, root: X509Certificate, now = Date.now()): T {
  const parts = jws.split(".");
  if (parts.length !== 3) throw Error("JWS invalide.");
  const header = JSON.parse(b64url(parts[0]).toString("utf8")) as { alg: string; x5c?: string[] };
  if (header.alg !== "ES256" || !header.x5c?.length) throw Error("En-tête JWS non supporté.");
  const chain = header.x5c.map((c) => new X509Certificate(Buffer.from(c, "base64")));
  for (const cert of chain) {
    if (now < Date.parse(cert.validFrom) || now > Date.parse(cert.validTo)) throw Error("Certificat expiré.");
  }
  for (let i = 0; i < chain.length - 1; i++)
    if (!chain[i].verify(chain[i + 1].publicKey)) throw Error("Chaîne de certificats invalide.");
  const top = chain[chain.length - 1];
  const anchored = top.fingerprint256 === root.fingerprint256 || top.verify(root.publicKey);
  if (!anchored) throw Error("Certificat racine non reconnu.");
  const ok = verify(
    "sha256",
    Buffer.from(parts[0] + "." + parts[1]),
    { key: chain[0].publicKey, dsaEncoding: "ieee-p1363" },
    b64url(parts[2]),
  );
  if (!ok) throw Error("Signature JWS invalide.");
  return JSON.parse(b64url(parts[1]).toString("utf8")) as T;
}

export function verifyTransaction(signed: string, products: string[]): AppleTransaction {
  const cfg = iapConfig();
  if (!cfg) throw new IapDisabled();
  const t = verifyJws<AppleTransaction>(signed, cfg.root);
  if (t.bundleId !== cfg.bundleId) throw Error("Bundle inattendu.");
  if (!products.includes(t.productId)) throw Error("Produit inconnu.");
  if (t.type && t.type !== "Consumable") throw Error("Type de produit inattendu.");
  if (t.revocationDate) throw Error("Transaction révoquée.");
  return t;
}

/** App Store Server Notifications V2 : retourne l'identifiant à révoquer, s'il y en a un. */
export function revocationFromNotification(signedPayload: string): string | null {
  const cfg = iapConfig();
  if (!cfg) throw new IapDisabled();
  const n = verifyJws<{ notificationType: string; data?: { signedTransactionInfo?: string; bundleId?: string } }>(signedPayload, cfg.root);
  if (!["REFUND", "REVOKE"].includes(n.notificationType) || !n.data?.signedTransactionInfo) return null;
  const t = verifyJws<AppleTransaction>(n.data.signedTransactionInfo, cfg.root);
  if (t.bundleId !== cfg.bundleId) throw Error("Bundle inattendu.");
  return t.transactionId;
}
