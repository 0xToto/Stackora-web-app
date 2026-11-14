-- STACKORA 0.2.1 : paiements web (Stripe Checkout). Une ligne par session payée.
CREATE TABLE IF NOT EXISTS payments(
  provider TEXT NOT NULL,
  external_id TEXT NOT NULL,
  payment_ref TEXT,
  user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  product_id TEXT NOT NULL,
  coins INTEGER NOT NULL,
  amount INTEGER NOT NULL,
  currency TEXT NOT NULL,
  status TEXT NOT NULL CHECK(status IN ('credited','refunded')),
  livemode INTEGER NOT NULL DEFAULT 0,
  created INTEGER NOT NULL,
  refunded INTEGER,
  PRIMARY KEY(provider, external_id)
);
CREATE INDEX IF NOT EXISTS payments_ref ON payments(provider, payment_ref);
PRAGMA user_version=3;
