import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync, writeFileSync, readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createPrivateKey, sign } from "node:crypto";
import { buildApp } from "../src/app.js";
import { Economy } from "../src/economy.js";
import { createTournament, join as joinT } from "../src/tournament.js";

async function setup() {
  const dir = mkdtempSync(join(tmpdir(), "stackora-eco-"));
  const server = await buildApp(join(dir, "t.sqlite"), false);
  const call = (method: string, url: string, token = "", payload?: unknown) =>
    server.app.inject({ method: method as any, url, payload: payload as any, headers: { authorization: "Bearer " + token } });
  const register = async (n: string) =>
    (await call("POST", "/auth/register", "", { email: `${n}@x.test`, password: "password-" + n + "-long", name: n })).json();
  return { dir, server, call, register };
}

test("wallet: welcome bonus credited once, ledger consistent", async () => {
  const { dir, server, call, register } = await setup();
  try {
    const u = await register("Alice");
    const w = (await call("GET", "/wallet", u.token)).json();
    assert.equal(w.balance, 500);
    // ensure() is called by many routes: it must never credit twice
    await call("GET", "/me/profile", u.token);
    await call("GET", "/shop/catalog", u.token);
    const w2 = (await call("GET", "/wallet", u.token)).json();
    assert.equal(w2.balance, 500);
    assert.equal(w2.ledger.length, 1);
    assert.equal(w2.ledger[0].balance, 500);
  } finally {
    await server.app.close();
    rmSync(dir, { recursive: true, force: true });
  }
});

test("shop: purchase, insufficient funds, replay, duplicate ownership, equip rules", async () => {
  const { dir, server, call, register } = await setup();
  try {
    const u = await register("Boris");
    const buy = (itemId: string, key: string) => call("POST", "/shop/purchase", u.token, { itemId, idempotencyKey: key });
    const r1 = await buy("back-onyx", "key-00000001");
    assert.equal(r1.statusCode, 200);
    assert.equal(r1.json().balance, 150);
    // Same idempotency key = no second debit
    const replay = await buy("back-onyx", "key-00000001");
    assert.equal(replay.json().duplicate, true);
    assert.equal((await call("GET", "/wallet", u.token)).json().balance, 150);
    // Already owned with a new key = refused, no debit
    assert.equal((await buy("back-onyx", "key-00000002")).statusCode, 400);
    // Insufficient funds
    const poor = await buy("table-aurora", "key-00000003");
    assert.equal(poor.statusCode, 400);
    assert.match(poor.json().error, /insuffisant/);
    assert.equal((await call("GET", "/wallet", u.token)).json().balance, 150);
    // Unknown item
    assert.equal((await buy("does-not-exist", "key-00000004")).statusCode, 400);
    // Equip owned: ok ; not owned: refused ; wrong slot: refused
    assert.equal((await call("POST", "/shop/equip", u.token, { slot: "cardBack", itemId: "back-onyx" })).statusCode, 200);
    assert.equal((await call("POST", "/shop/equip", u.token, { slot: "cardBack", itemId: "back-royal" })).statusCode, 400);
    assert.equal((await call("POST", "/shop/equip", u.token, { slot: "avatar", itemId: "back-onyx" })).statusCode, 400);
    const p = (await call("GET", "/me/profile", u.token)).json();
    assert.equal(p.equipped.cardBack, "back-onyx");
  } finally {
    await server.app.close();
    rmSync(dir, { recursive: true, force: true });
  }
});

test("shop: concurrent purchases cannot overdraw", async () => {
  const { dir, server, call, register } = await setup();
  try {
    const u = await register("Chloe");
    // 500 coins, two items at 400 and 450 fired simultaneously: only one may pass
    const [a, b] = await Promise.all([
      call("POST", "/shop/purchase", u.token, { itemId: "table-bordeaux", idempotencyKey: "concurrent-a" }),
      call("POST", "/shop/purchase", u.token, { itemId: "frame-copper", idempotencyKey: "concurrent-b" }),
    ]);
    assert.deepEqual([a.statusCode, b.statusCode].sort(), [200, 400]);
    const w = (await call("GET", "/wallet", u.token)).json();
    assert.ok(w.balance >= 0);
    assert.equal(w.balance, w.ledger[0].balance);
  } finally {
    await server.app.close();
    rmSync(dir, { recursive: true, force: true });
  }
});

test("public cosmetics are projected to opponents; client cannot inject them", async () => {
  const { dir, server, call, register } = await setup();
  try {
    const a = await register("Dina");
    const b = await register("Elias");
    await call("POST", "/shop/purchase", a.token, { itemId: "frame-copper", idempotencyKey: "frame-key-1" });
    await call("POST", "/shop/equip", a.token, { slot: "frame", itemId: "frame-copper" });
    await call("POST", "/shop/equip", a.token, { slot: "table", itemId: "table-midnight" });
    const t = (await call("POST", "/tournaments", a.token, { name: "Look test" })).json();
    await call("POST", "/join", b.token, { code: t.code, cosmetics: { frame: "frame-nebula" } });
    const seen = (await call("GET", "/tournaments/" + t.id, b.token)).json();
    assert.equal(seen.cosmetics[a.user.id].frame, "frame-copper");
    assert.equal(seen.cosmetics[b.user.id].frame, "frame-none");
    // Local-only slot (table) is never published
    assert.equal(seen.cosmetics[a.user.id].table, undefined);
    assert.ok(seen.cosmetics[a.user.id].level >= 1);
    // Privacy preference hides the level from opponents
    await call("PUT", "/me/prefs", a.token, { showLevel: false });
    const hidden = (await call("GET", "/tournaments/" + t.id, b.token)).json();
    assert.equal(hidden.cosmetics[a.user.id].level, 0);
  } finally {
    await server.app.close();
    rmSync(dir, { recursive: true, force: true });
  }
});

test("rewards: once per tournament, no rank rewards against bots only, daily caps", async () => {
  const dir = mkdtempSync(join(tmpdir(), "stackora-eco-"));
  const { app, store } = await buildApp(join(dir, "r.sqlite"), false);
  try {
    let clock = 1_800_000_000_000;
    const eco = new Economy(store.db, () => clock);
    const solo = store.register("solo@x.test", "Solo", "password-solo-1").user.id;
    const friend = store.register("friend@x.test", "Friend", "password-friend").user.id;
    const base = eco.balance(solo);
    // Solo vs bot, won: participation only
    const t1 = createTournament(solo, "Bots");
    joinT(t1, solo, "Solo");
    joinT(t1, "bot-1", "Nova", true);
    t1.status = "finished";
    t1.startedAt = clock - 3600_000;
    t1.results = [{ id: solo, name: "Solo", rank: 1 }, { id: "bot-1", name: "Nova", rank: 2 }];
    eco.rewardTournament(t1);
    eco.rewardTournament(t1);
    assert.equal(eco.balance(solo), base + 20);
    // Two humans, long enough: participation + top3 + win
    const t2 = createTournament(solo, "Friends");
    joinT(t2, solo, "Solo");
    joinT(t2, friend, "Friend");
    t2.status = "finished";
    t2.startedAt = clock - 3600_000;
    t2.results = [{ id: solo, name: "Solo", rank: 1 }, { id: friend, name: "Friend", rank: 2 }];
    eco.rewardTournament(t2);
    assert.equal(eco.balance(solo), base + 20 + 20 + 60 + 150);
    // Too short tournament: no rank reward
    const t3 = structuredClone(t2);
    t3.id = "short";
    t3.startedAt = clock - 10_000;
    const before = eco.balance(friend);
    eco.rewardTournament(t3);
    assert.equal(eco.balance(friend), before + 20);
    // Missions: daily "play" is complete and claimable exactly once
    const m = eco.missions(solo).find((m) => m.id === "d-play")!;
    assert.equal(m.progress, 1);
    eco.claimMission(solo, "d-play");
    assert.throws(() => eco.claimMission(solo, "d-play"));
    // Training: short sessions unrewarded, replays ignored, daily cap enforced
    assert.equal(eco.training(solo, { sessionId: "s-short-1", module: "positions", category: "8max", correct: 3, total: 5 }).coins, 0);
    let paid = 0;
    for (let i = 0; i < 8; i++) paid += eco.training(solo, { sessionId: "s-long-" + i, module: "gto", category: "preflop", correct: 9, total: 10 }).coins;
    assert.equal(eco.training(solo, { sessionId: "s-long-0", module: "gto", category: "preflop", correct: 9, total: 10 }).duplicate, true);
    assert.ok(paid <= 4 * 15);
    // Next day the cap resets
    clock += 86400_000;
    assert.equal(eco.training(solo, { sessionId: "s-next-day", module: "gto", category: "preflop", correct: 9, total: 10 }).coins, 15);
    assert.ok(eco.xp(solo).xp > 0);
  } finally {
    await app.close();
    rmSync(dir, { recursive: true, force: true });
  }
});

test("IAP: disabled without configuration, never credits on client claim", async () => {
  const { dir, server, call, register } = await setup();
  try {
    const u = await register("Fanny");
    const r = await call("POST", "/iap/apple/verify", u.token, { signedTransaction: "x".repeat(40) });
    assert.equal(r.statusCode, 503);
    assert.equal((await call("GET", "/wallet", u.token)).json().balance, 500);
  } finally {
    await server.app.close();
    rmSync(dir, { recursive: true, force: true });
  }
});

test("IAP: verified JWS chain credits once, forged signature refused, refund revokes", async () => {
  const dir = mkdtempSync(join(tmpdir(), "stackora-iap-"));
  const sh = (...args: string[]) => execFileSync("openssl", args, { cwd: dir, stdio: "pipe" });
  // Test PKI : root -> intermediate -> leaf (ECDSA P-256), mimicking Apple's x5c chain.
  sh("ecparam", "-name", "prime256v1", "-genkey", "-noout", "-out", "root.key");
  sh("req", "-x509", "-new", "-key", "root.key", "-subj", "/CN=Test Root", "-days", "3", "-out", "root.pem");
  sh("ecparam", "-name", "prime256v1", "-genkey", "-noout", "-out", "int.key");
  sh("req", "-new", "-key", "int.key", "-subj", "/CN=Test Int", "-out", "int.csr");
  writeFileSync(join(dir, "ca.ext"), "basicConstraints=critical,CA:TRUE\n");
  sh("x509", "-req", "-in", "int.csr", "-CA", "root.pem", "-CAkey", "root.key", "-CAcreateserial", "-days", "3", "-extfile", "ca.ext", "-out", "int.pem");
  sh("ecparam", "-name", "prime256v1", "-genkey", "-noout", "-out", "leaf.key");
  sh("req", "-new", "-key", "leaf.key", "-subj", "/CN=Test Leaf", "-out", "leaf.csr");
  sh("x509", "-req", "-in", "leaf.csr", "-CA", "int.pem", "-CAkey", "int.key", "-CAcreateserial", "-days", "3", "-out", "leaf.pem");
  const der = (f: string) => readFileSync(join(dir, f), "utf8").replace(/-----[^-]+-----|\s/g, "");
  const leafKey = createPrivateKey(readFileSync(join(dir, "leaf.key")));
  const b64u = (b: Buffer | string) => Buffer.from(b).toString("base64url");
  const jws = (payload: object, key = leafKey) => {
    const head = b64u(JSON.stringify({ alg: "ES256", x5c: [der("leaf.pem"), der("int.pem"), der("root.pem")] }));
    const body = b64u(JSON.stringify(payload));
    const sig = sign("sha256", Buffer.from(head + "." + body), { key, dsaEncoding: "ieee-p1363" });
    return `${head}.${body}.${b64u(sig)}`;
  };
  process.env.APPLE_ROOT_CA_PEM_PATH = join(dir, "root.pem");
  process.env.APPLE_BUNDLE_ID = "com.stackora.mobile";
  const server = await buildApp(join(dir, "iap.sqlite"), false);
  const call = (url: string, token: string, payload: unknown) =>
    server.app.inject({ method: "POST", url, payload: payload as any, headers: { authorization: "Bearer " + token } });
  try {
    const u = (await call("/auth/register", "", { email: "g@x.test", password: "password-gaby-1", name: "Gaby" })).json();
    const tx = { transactionId: "2000000001", originalTransactionId: "2000000001", bundleId: "com.stackora.mobile", productId: "com.stackora.coins.1500", type: "Consumable", environment: "Sandbox" };
    const ok = await call("/iap/apple/verify", u.token, { signedTransaction: jws(tx) });
    assert.equal(ok.statusCode, 200, ok.body);
    assert.equal(ok.json().balance, 2000);
    const again = await call("/iap/apple/verify", u.token, { signedTransaction: jws(tx) });
    assert.equal(again.json().duplicate, true);
    // Forged: signed by the root key instead of the leaf
    const forged = await call("/iap/apple/verify", u.token, { signedTransaction: jws({ ...tx, transactionId: "2000000002" }, createPrivateKey(readFileSync(join(dir, "root.key")))) });
    assert.equal(forged.statusCode, 400);
    // Wrong bundle
    const wrong = await call("/iap/apple/verify", u.token, { signedTransaction: jws({ ...tx, transactionId: "2000000003", bundleId: "com.evil" }) });
    assert.equal(wrong.statusCode, 400);
    // Spend 1200, then refund: debit limited to remaining balance, never negative
    await call("/shop/purchase", u.token, { itemId: "table-graphite", idempotencyKey: "spend-before-refund" });
    const note = jws({ notificationType: "REFUND", data: { signedTransactionInfo: jws(tx) } });
    const refund = await call("/iap/apple/notifications", "", { signedPayload: note });
    assert.equal(refund.statusCode, 200, refund.body);
    assert.equal(refund.json().debited, 800);
    assert.equal(refund.json().shortfall, 700);
    const w = (await server.app.inject({ method: "GET", url: "/wallet", headers: { authorization: "Bearer " + u.token } })).json();
    assert.equal(w.balance, 0);
    // Replayed refund notification: no second debit
    assert.equal((await call("/iap/apple/notifications", "", { signedPayload: note })).json().changed, false);
  } finally {
    delete process.env.APPLE_ROOT_CA_PEM_PATH;
    delete process.env.APPLE_BUNDLE_ID;
    await server.app.close();
    rmSync(dir, { recursive: true, force: true });
  }
});

test("prefs sync and account deletion", async () => {
  const { dir, server, call, register } = await setup();
  try {
    const u = await register("Hugo");
    assert.equal((await call("PUT", "/me/prefs", u.token, { stackUnit: "bb", fourColor: true })).statusCode, 200);
    assert.equal((await call("GET", "/me/prefs", u.token)).json().prefs.stackUnit, "bb");
    assert.equal((await call("PUT", "/me/prefs", u.token, { nested: { evil: 1 } })).statusCode, 400);
    assert.equal((await call("PATCH", "/me", u.token, { name: "Hugo_2" })).json().name, "Hugo_2");
    assert.equal((await call("POST", "/me/delete", u.token, { password: "wrong" })).statusCode, 400);
    assert.equal((await call("POST", "/me/delete", u.token, { password: "password-Hugo-long" })).statusCode, 200);
    assert.equal((await call("GET", "/me", u.token)).statusCode, 400);
  } finally {
    await server.app.close();
    rmSync(dir, { recursive: true, force: true });
  }
});
