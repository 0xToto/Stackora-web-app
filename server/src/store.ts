import { readFileSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import {
  randomBytes,
  randomUUID,
  scryptSync,
  timingSafeEqual,
  createHash,
} from "node:crypto";
import type { Tournament } from "./tournament.js";
import { Economy } from "./economy.js";
const MIGRATIONS = ["001_initial.sql", "002_economy.sql", "003_payments.sql"];
export class Store {
  db: DatabaseSync;
  economy: Economy;
  constructor(path: string) {
    this.db = new DatabaseSync(path);
    // Migrations idempotentes appliquées dans l'ordre ; user_version trace la dernière.
    for (const file of MIGRATIONS)
      this.db.exec(readFileSync(new URL("../migrations/" + file, import.meta.url), "utf8"));
    this.economy = new Economy(this.db);
  }
  register(email: string, name: string, password: string) {
    const salt = randomBytes(16).toString("hex");
    const hash = scryptSync(password, salt, 64).toString("hex");
    const id = randomUUID();
    try {
      this.db
        .prepare("INSERT INTO users VALUES(?,?,?,?,?)")
        .run(id, email.toLowerCase(), name, `${salt}:${hash}`, Date.now());
    } catch {
      throw Error("Adresse ou pseudo déjà utilisé.");
    }
    this.economy.ensure(id);
    return this.session(id);
  }
  login(email: string, password: string) {
    const u = this.db
      .prepare("SELECT * FROM users WHERE email=?")
      .get(email.toLowerCase()) as any;
    const [salt, expected] = (u?.password ?? "0000:" + "00".repeat(64)).split(
      ":",
    );
    const actual = scryptSync(password, salt, 64);
    if (!u || !timingSafeEqual(actual, Buffer.from(expected, "hex")))
      throw Error("Identifiants incorrects.");
    return this.session(u.id);
  }
  session(id: string) {
    const token = randomBytes(32).toString("hex");
    this.db
      .prepare("INSERT INTO sessions VALUES(?,?,?)")
      .run(this.hash(token), id, Date.now() + 30 * 86400000);
    return { token, user: this.user(id) };
  }
  hash(s: string) {
    return createHash("sha256").update(s).digest("hex");
  }
  auth(token: string) {
    const s = this.db
      .prepare("SELECT user_id FROM sessions WHERE token=? AND expires>?")
      .get(this.hash(token), Date.now()) as any;
    if (!s) throw Error("Session expirée.");
    return s.user_id as string;
  }
  logout(token: string) {
    this.db.prepare("DELETE FROM sessions WHERE token=?").run(this.hash(token));
  }
  user(id: string) {
    return this.db
      .prepare("SELECT id,name,email FROM users WHERE id=?")
      .get(id) as { id: string; name: string; email: string };
  }
  rename(id: string, name: string) {
    try {
      this.db.prepare("UPDATE users SET name=? WHERE id=?").run(name, id);
    } catch {
      throw Error("Ce pseudo est déjà pris.");
    }
    return this.user(id);
  }
  checkPassword(id: string, password: string) {
    const u = this.db.prepare("SELECT password FROM users WHERE id=?").get(id) as { password: string } | undefined;
    if (!u) throw Error("Compte introuvable.");
    const [salt, expected] = u.password.split(":");
    if (!timingSafeEqual(scryptSync(password, salt, 64), Buffer.from(expected, "hex")))
      throw Error("Mot de passe incorrect.");
  }
  /** Suppression RGPD : compte, sessions, wallet, inventaire, prefs (cascade). */
  deleteUser(id: string) {
    this.db.prepare("DELETE FROM users WHERE id=?").run(id);
  }
  getPrefs(id: string) {
    const r = this.db.prepare("SELECT json,updated FROM prefs WHERE user_id=?").get(id) as { json: string; updated: number } | undefined;
    return r ? { prefs: JSON.parse(r.json), updated: r.updated } : { prefs: null, updated: 0 };
  }
  setPrefs(id: string, prefs: unknown) {
    const updated = Date.now();
    this.db
      .prepare("INSERT INTO prefs(user_id,json,updated) VALUES(?,?,?) ON CONFLICT(user_id) DO UPDATE SET json=excluded.json, updated=excluded.updated")
      .run(id, JSON.stringify(prefs), updated);
    return { updated };
  }
  all(): Tournament[] {
    return (
      this.db.prepare("SELECT state FROM tournaments").all() as any[]
    ).map((r) => JSON.parse(r.state));
  }
  save(t: Tournament) {
    const json = JSON.stringify(t);
    this.db.exec("BEGIN IMMEDIATE");
    try {
      this.db
        .prepare(
          "INSERT INTO tournaments VALUES(?,?,?) ON CONFLICT(id) DO UPDATE SET state=excluded.state",
        )
        .run(t.id, t.code, json);
      this.db
        .prepare(
          "INSERT INTO audit(tournament_id,version,state,created) VALUES(?,?,?,?)",
        )
        .run(t.id, t.version, json, Date.now());
      this.db.exec("COMMIT");
    } catch (e) {
      this.db.exec("ROLLBACK");
      throw e;
    }
  }
  close() {
    this.db.close();
  }
}
