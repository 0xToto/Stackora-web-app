-- STACKORA 0.2 : économie StackCoins, inventaire cosmétique, progression, préférences.
-- Réexécutable (IF NOT EXISTS). Les StackCoins ne sont jamais mélangés aux jetons de tournoi.
CREATE TABLE IF NOT EXISTS wallets(
  user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  balance INTEGER NOT NULL DEFAULT 0 CHECK(balance >= 0),
  updated INTEGER NOT NULL
);
-- Ledger append-only. (user_id, idem) empêche tout double crédit / double débit.
CREATE TABLE IF NOT EXISTS ledger(
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  delta INTEGER NOT NULL,
  kind TEXT NOT NULL,
  ref TEXT,
  idem TEXT NOT NULL,
  balance_after INTEGER NOT NULL,
  created INTEGER NOT NULL,
  UNIQUE(user_id, idem)
);
CREATE INDEX IF NOT EXISTS ledger_user_created ON ledger(user_id, created);
CREATE TABLE IF NOT EXISTS inventory(
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  item_id TEXT NOT NULL,
  source TEXT NOT NULL,
  acquired INTEGER NOT NULL,
  PRIMARY KEY(user_id, item_id)
);
CREATE TABLE IF NOT EXISTS equipped(
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  slot TEXT NOT NULL,
  item_id TEXT NOT NULL,
  PRIMARY KEY(user_id, slot)
);
CREATE TABLE IF NOT EXISTS progress(
  user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  xp INTEGER NOT NULL DEFAULT 0 CHECK(xp >= 0)
);
-- Clés d'attribution uniques : une récompense ou une mission ne se réclame qu'une fois.
CREATE TABLE IF NOT EXISTS reward_claims(
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  key TEXT NOT NULL,
  coins INTEGER NOT NULL,
  xp INTEGER NOT NULL,
  created INTEGER NOT NULL,
  PRIMARY KEY(user_id, key)
);
CREATE TABLE IF NOT EXISTS prefs(
  user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  json TEXT NOT NULL,
  updated INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS training(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  session_id TEXT NOT NULL,
  module TEXT NOT NULL,
  category TEXT NOT NULL,
  correct INTEGER NOT NULL,
  total INTEGER NOT NULL,
  created INTEGER NOT NULL,
  UNIQUE(user_id, session_id)
);
-- Achats intégrés vérifiés côté serveur. transaction_id unique = pas de double crédit.
CREATE TABLE IF NOT EXISTS iap_transactions(
  transaction_id TEXT PRIMARY KEY,
  original_transaction_id TEXT,
  user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  product_id TEXT NOT NULL,
  coins INTEGER NOT NULL,
  status TEXT NOT NULL CHECK(status IN ('credited','revoked')),
  environment TEXT NOT NULL,
  created INTEGER NOT NULL,
  revoked INTEGER
);
PRAGMA user_version=2;
