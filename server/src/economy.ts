import { randomUUID } from "node:crypto";
import type { DatabaseSync } from "node:sqlite";
import {
  CATALOG,
  DEFAULTS,
  PUBLIC_SLOTS,
  SLOTS,
  item,
  levelFor,
  packs,
  rewardConfig,
  type Slot,
} from "./catalog.js";
import type { Tournament } from "./tournament.js";

const DAY = 86400000;
export const dayStart = (now: number) => Math.floor(now / DAY) * DAY;
/** Lundi 00:00 UTC. */
export const weekStart = (now: number) => {
  const d = dayStart(now);
  const weekday = (new Date(d).getUTCDay() + 6) % 7;
  return d - weekday * DAY;
};
export type PublicLook = { avatar: string; frame: string; badge: string; cardBack: string; winFx: string; showdownFx: string; level: number };

/**
 * Domaine économie. Toutes les écritures passent par des transactions SQLite
 * synchrones (BEGIN IMMEDIATE) : le processus unique sérialise déjà les requêtes,
 * la contrainte UNIQUE(user_id, idem) et le CHECK(balance >= 0) garantissent
 * l'absence de double crédit et de solde négatif même en cas de rejeu.
 */
export class Economy {
  private depth = 0;
  constructor(private db: DatabaseSync, private now = () => Date.now()) {}

  tx<T>(fn: () => T): T {
    if (this.depth > 0) return fn();
    this.db.exec("BEGIN IMMEDIATE");
    this.depth++;
    try {
      const r = fn();
      this.db.exec("COMMIT");
      return r;
    } catch (e) {
      this.db.exec("ROLLBACK");
      throw e;
    } finally {
      this.depth--;
    }
  }

  ensure(userId: string) {
    this.tx(() => {
      this.db.prepare("INSERT OR IGNORE INTO wallets(user_id,balance,updated) VALUES(?,0,?)").run(userId, this.now());
      this.db.prepare("INSERT OR IGNORE INTO progress(user_id,xp) VALUES(?,0)").run(userId);
      const welcome = rewardConfig().welcome;
      if (welcome > 0) this.move(userId, welcome, "welcome", "welcome", null);
    });
  }

  balance(userId: string): number {
    const r = this.db.prepare("SELECT balance FROM wallets WHERE user_id=?").get(userId) as { balance: number } | undefined;
    return r?.balance ?? 0;
  }

  /** Mouvement atomique et idempotent. Retourne false si la clé a déjà été utilisée. */
  private move(userId: string, delta: number, kind: string, idem: string, ref: string | null): boolean {
    if (!Number.isSafeInteger(delta)) throw Error("Montant invalide.");
    return this.tx(() => {
      const seen = this.db.prepare("SELECT 1 FROM ledger WHERE user_id=? AND idem=?").get(userId, idem);
      if (seen) return false;
      this.db.prepare("INSERT OR IGNORE INTO wallets(user_id,balance,updated) VALUES(?,0,?)").run(userId, this.now());
      const changed = this.db
        .prepare("UPDATE wallets SET balance=balance+?, updated=? WHERE user_id=? AND balance+? >= 0")
        .run(delta, this.now(), userId, delta);
      if (Number(changed.changes) !== 1) throw Error("Solde insuffisant.");
      const after = this.balance(userId);
      this.db
        .prepare("INSERT INTO ledger(id,user_id,delta,kind,ref,idem,balance_after,created) VALUES(?,?,?,?,?,?,?,?)")
        .run(randomUUID(), userId, delta, kind, ref, idem, after, this.now());
      return true;
    });
  }

  private addXp(userId: string, xp: number) {
    if (xp > 0) this.db.prepare("UPDATE progress SET xp=xp+? WHERE user_id=?").run(xp, userId);
  }
  xp(userId: string) {
    const r = this.db.prepare("SELECT xp FROM progress WHERE user_id=?").get(userId) as { xp: number } | undefined;
    return levelFor(r?.xp ?? 0);
  }

  /** Gains (hors achats) déjà crédités depuis minuit UTC : base du plafond quotidien. */
  private earnedToday(userId: string) {
    const r = this.db
      .prepare("SELECT COALESCE(SUM(delta),0) s FROM ledger WHERE user_id=? AND created>=? AND delta>0 AND kind IN ('reward','mission','training')")
      .get(userId, dayStart(this.now())) as { s: number };
    return Number(r.s);
  }

  /** Enregistre une clé de récompense et crédite en respectant le plafond quotidien. */
  private claim(userId: string, key: string, coins: number, xp: number, kind: "reward" | "mission" | "training") {
    return this.tx(() => {
      const exists = this.db.prepare("SELECT 1 FROM reward_claims WHERE user_id=? AND key=?").get(userId, key);
      if (exists) return null;
      const room = Math.max(0, rewardConfig().dailyCoinCap - this.earnedToday(userId));
      const paid = Math.min(coins, room);
      this.db.prepare("INSERT INTO reward_claims(user_id,key,coins,xp,created) VALUES(?,?,?,?,?)").run(userId, key, paid, xp, this.now());
      if (paid > 0) this.move(userId, paid, kind, "claim:" + key, key);
      this.addXp(userId, xp);
      return { key, coins: paid, xp, capped: paid < coins };
    });
  }

  private countClaims(userId: string, pattern: string, since: number) {
    const r = this.db.prepare("SELECT COUNT(*) n FROM reward_claims WHERE user_id=? AND key LIKE ? AND created>=?").get(userId, pattern, since) as { n: number };
    return Number(r.n);
  }

  /**
   * Récompenses de fin de tournoi, une seule fois par joueur et par tournoi.
   * Pas de récompense par pot gagné (anti-collusion). Classement payé uniquement
   * si assez d'humains et si la partie a duré assez longtemps.
   */
  rewardTournament(t: Tournament) {
    if (t.status !== "finished") return [];
    const cfg = rewardConfig();
    const humans = t.players.filter((p) => !p.bot);
    const longEnough = this.now() - t.startedAt >= cfg.minTournamentSeconds * 1000;
    const ranked = humans.length >= cfg.minHumansForRank && longEnough;
    const out: { userId: string; coins: number; xp: number }[] = [];
    for (const p of humans) {
      const exists = this.db.prepare("SELECT 1 FROM users WHERE id=?").get(p.id);
      if (!exists) continue;
      this.ensure(p.id);
      const rank = t.results.find((r) => r.id === p.id)?.rank ?? t.players.length;
      this.tx(() => {
        const already = this.countClaims(p.id, `t:%:participation`, dayStart(this.now()));
        const allowed = already < cfg.maxRewardedTournamentsPerDay;
        const a = this.claim(p.id, `t:${t.id}:participation`, allowed ? cfg.participation.coins : 0, allowed ? cfg.participation.xp : 0, "reward");
        let coins = a?.coins ?? 0, xp = a?.xp ?? 0;
        if (a && ranked && allowed && rank <= 3) {
          const b = this.claim(p.id, `t:${t.id}:top3`, cfg.finishTop3.coins, cfg.finishTop3.xp, "reward");
          coins += b?.coins ?? 0; xp += b?.xp ?? 0;
        }
        if (a && ranked && allowed && rank === 1) {
          const c = this.claim(p.id, `t:${t.id}:win`, cfg.win.coins, cfg.win.xp, "reward");
          coins += c?.coins ?? 0; xp += c?.xp ?? 0;
        }
        if (a) out.push({ userId: p.id, coins, xp });
      });
    }
    return out;
  }

  /** Une session d'exercices terminée. Faible valeur et plafonnée : le client peut mentir sur ses bonnes réponses. */
  training(userId: string, s: { sessionId: string; module: string; category: string; correct: number; total: number }) {
    const cfg = rewardConfig().training;
    return this.tx(() => {
      const inserted = this.db
        .prepare("INSERT OR IGNORE INTO training(user_id,session_id,module,category,correct,total,created) VALUES(?,?,?,?,?,?,?)")
        .run(userId, s.sessionId, s.module, s.category, s.correct, s.total, this.now());
      if (Number(inserted.changes) !== 1) return { duplicate: true, coins: 0, xp: 0 };
      if (s.total < cfg.minQuestions) return { duplicate: false, coins: 0, xp: 0, reason: "Session trop courte pour une récompense." };
      const today = this.countClaims(userId, "train:%", dayStart(this.now()));
      if (today >= cfg.maxPerDay) return { duplicate: false, coins: 0, xp: 0, reason: "Plafond quotidien d'exercices récompensés atteint." };
      const r = this.claim(userId, `train:${s.sessionId}`, cfg.coins, cfg.xp, "training");
      return { duplicate: false, coins: r?.coins ?? 0, xp: r?.xp ?? 0 };
    });
  }

  trainingStats(userId: string) {
    return this.db
      .prepare("SELECT module, category, COUNT(*) sessions, SUM(correct) correct, SUM(total) total FROM training WHERE user_id=? GROUP BY module, category")
      .all(userId) as { module: string; category: string; sessions: number; correct: number; total: number }[];
  }

  missions(userId: string) {
    const cfg = rewardConfig();
    const now = this.now();
    return cfg.missions.map((m) => {
      const since = m.period === "daily" ? dayStart(now) : weekStart(now);
      const progress =
        m.metric === "tournaments"
          ? this.countClaims(userId, "t:%:participation", since)
          : m.metric === "top3"
            ? this.countClaims(userId, "t:%:top3", since)
            : Number((this.db.prepare("SELECT COUNT(*) n FROM training WHERE user_id=? AND created>=? AND total>=?").get(userId, since, cfg.training.minQuestions) as { n: number }).n);
      const key = `mission:${m.id}:${since}`;
      const claimed = !!this.db.prepare("SELECT 1 FROM reward_claims WHERE user_id=? AND key=?").get(userId, key);
      return { ...m, progress: Math.min(progress, m.target), claimed, key, resetsAt: since + (m.period === "daily" ? DAY : 7 * DAY) };
    });
  }
  claimMission(userId: string, id: string) {
    const m = this.missions(userId).find((m) => m.id === id);
    if (!m) throw Error("Mission inconnue.");
    if (m.progress < m.target) throw Error("Mission non terminée.");
    const r = this.claim(userId, m.key, m.coins, m.xp, "mission");
    if (!r) throw Error("Récompense déjà récupérée.");
    return r;
  }

  owned(userId: string): Set<string> {
    const rows = this.db.prepare("SELECT item_id FROM inventory WHERE user_id=?").all(userId) as { item_id: string }[];
    return new Set([...CATALOG.filter((x) => x.free).map((x) => x.id), ...rows.map((r) => r.item_id)]);
  }
  equipped(userId: string): Record<Slot, string> {
    const rows = this.db.prepare("SELECT slot,item_id FROM equipped WHERE user_id=?").all(userId) as { slot: Slot; item_id: string }[];
    const out = { ...DEFAULTS };
    const owned = this.owned(userId);
    for (const r of rows) if (SLOTS.includes(r.slot) && owned.has(r.item_id)) out[r.slot] = r.item_id;
    return out;
  }

  /** Achat d'un cosmétique : débit + inventaire dans la même transaction, idempotent. */
  purchase(userId: string, itemId: string, idem: string) {
    const x = item(itemId);
    if (!x) throw Error("Article inconnu.");
    return this.tx(() => {
      const replay = this.db.prepare("SELECT 1 FROM ledger WHERE user_id=? AND idem=?").get(userId, "buy:" + idem);
      if (replay) return { duplicate: true, balance: this.balance(userId) };
      if (this.owned(userId).has(itemId)) throw Error("Vous possédez déjà cet article.");
      if (this.balance(userId) < x.price) throw Error("Solde insuffisant.");
      this.move(userId, -x.price, "spend", "buy:" + idem, itemId);
      this.db.prepare("INSERT INTO inventory(user_id,item_id,source,acquired) VALUES(?,?,?,?)").run(userId, itemId, "shop", this.now());
      return { duplicate: false, balance: this.balance(userId) };
    });
  }
  equip(userId: string, slot: Slot, itemId: string) {
    const x = item(itemId);
    if (!x || x.slot !== slot) throw Error("Article incompatible avec cet emplacement.");
    if (!this.owned(userId).has(itemId)) throw Error("Vous ne possédez pas cet article.");
    this.db.prepare("INSERT INTO equipped(user_id,slot,item_id) VALUES(?,?,?) ON CONFLICT(user_id,slot) DO UPDATE SET item_id=excluded.item_id").run(userId, slot, itemId);
    return this.equipped(userId);
  }
  publicLooks(ids: string[]): Record<string, PublicLook> {
    const out: Record<string, PublicLook> = {};
    for (const id of ids) {
      if (id.startsWith("bot-")) continue;
      const e = this.equipped(id);
      const pick = Object.fromEntries(PUBLIC_SLOTS.map((s) => [s, e[s]])) as Omit<PublicLook, "level">;
      // Préférence de confidentialité : niveau masqué si l'utilisateur l'a demandé.
      const pref = this.db.prepare("SELECT json FROM prefs WHERE user_id=?").get(id) as { json: string } | undefined;
      const hidden = pref ? JSON.parse(pref.json).showLevel === false : false;
      out[id] = { ...pick, level: hidden ? 0 : this.xp(id).level };
    }
    return out;
  }

  ledger(userId: string, limit = 30) {
    return this.db
      .prepare("SELECT delta,kind,ref,balance_after balance,created FROM ledger WHERE user_id=? ORDER BY created DESC, rowid DESC LIMIT ?")
      .all(userId, limit);
  }

  /** Crédit d'un achat intégré déjà vérifié cryptographiquement (voir iap.ts). */
  creditPurchase(userId: string, t: { transactionId: string; originalTransactionId: string; productId: string; environment: string }) {
    const pack = packs().find((p) => p.productId === t.productId);
    if (!pack) throw Error("Produit inconnu.");
    return this.tx(() => {
      const existing = this.db.prepare("SELECT user_id,status FROM iap_transactions WHERE transaction_id=?").get(t.transactionId) as { user_id: string; status: string } | undefined;
      if (existing) {
        if (existing.user_id !== userId) throw Error("Transaction déjà associée à un autre compte.");
        return { duplicate: true, coins: 0, balance: this.balance(userId) };
      }
      this.db
        .prepare("INSERT INTO iap_transactions(transaction_id,original_transaction_id,user_id,product_id,coins,status,environment,created) VALUES(?,?,?,?,?,'credited',?,?)")
        .run(t.transactionId, t.originalTransactionId, userId, t.productId, pack.coins, t.environment, this.now());
      this.move(userId, pack.coins, "purchase", "iap:" + t.transactionId, t.productId);
      return { duplicate: false, coins: pack.coins, balance: this.balance(userId) };
    });
  }
  /**
   * Crédit d'un paiement web déjà confirmé par Stripe côté serveur.
   * Montant et devise doivent correspondre exactement au pack ; (provider, id) unique.
   */
  creditPayment(p: { provider: string; externalId: string; paymentRef: string | null; userId: string; productId: string; amount: number; currency: string; livemode: boolean }) {
    const pack = packs().find((x) => x.productId === p.productId);
    if (!pack) throw Error("Produit inconnu.");
    if (p.amount !== pack.priceCents || p.currency.toLowerCase() !== pack.currency) throw Error("Montant payé incohérent avec le pack.");
    return this.tx(() => {
      const existing = this.db.prepare("SELECT user_id FROM payments WHERE provider=? AND external_id=?").get(p.provider, p.externalId) as { user_id: string } | undefined;
      if (existing) {
        if (existing.user_id !== p.userId) throw Error("Paiement associé à un autre compte.");
        return { duplicate: true, coins: 0, balance: this.balance(p.userId) };
      }
      this.db
        .prepare("INSERT INTO payments(provider,external_id,payment_ref,user_id,product_id,coins,amount,currency,status,livemode,created) VALUES(?,?,?,?,?,?,?,?,'credited',?,?)")
        .run(p.provider, p.externalId, p.paymentRef, p.userId, p.productId, pack.coins, p.amount, p.currency, p.livemode ? 1 : 0, this.now());
      this.move(p.userId, pack.coins, "purchase", `pay:${p.provider}:${p.externalId}`, p.productId);
      return { duplicate: false, coins: pack.coins, balance: this.balance(p.userId) };
    });
  }
  /** Remboursement web : débit plafonné au solde, jamais négatif, une seule fois. */
  refundPayment(provider: string, paymentRef: string) {
    return this.tx(() => {
      const r = this.db.prepare("SELECT external_id,user_id,coins,status FROM payments WHERE provider=? AND payment_ref=?").get(provider, paymentRef) as { external_id: string; user_id: string | null; coins: number; status: string } | undefined;
      if (!r || r.status === "refunded") return { changed: false, debited: 0, shortfall: 0 };
      this.db.prepare("UPDATE payments SET status='refunded', refunded=? WHERE provider=? AND external_id=?").run(this.now(), provider, r.external_id);
      if (!r.user_id) return { changed: true, debited: 0, shortfall: r.coins };
      const debit = Math.min(r.coins, this.balance(r.user_id));
      if (debit > 0) this.move(r.user_id, -debit, "refund", `refund:${provider}:${r.external_id}`, `shortfall:${r.coins - debit}`);
      return { changed: true, debited: debit, shortfall: r.coins - debit };
    });
  }
  /** Remboursement / révocation Apple : débit dans la limite du solde, jamais négatif. */
  revokePurchase(transactionId: string) {
    return this.tx(() => {
      const r = this.db.prepare("SELECT user_id,coins,status FROM iap_transactions WHERE transaction_id=?").get(transactionId) as { user_id: string | null; coins: number; status: string } | undefined;
      if (!r || r.status === "revoked") return { changed: false, debited: 0, shortfall: 0 };
      this.db.prepare("UPDATE iap_transactions SET status='revoked', revoked=? WHERE transaction_id=?").run(this.now(), transactionId);
      if (!r.user_id) return { changed: true, debited: 0, shortfall: r.coins };
      const debit = Math.min(r.coins, this.balance(r.user_id));
      if (debit > 0) this.move(r.user_id, -debit, "refund", "refund:" + transactionId, `shortfall:${r.coins - debit}`);
      return { changed: true, debited: debit, shortfall: r.coins - debit };
    });
  }
}
