-- Tabela de verificação de WhatsApp
-- UNIQUE(phone): apenas um registro ativo por número, upsert substitui ao reenviar código
CREATE TABLE IF NOT EXISTS "WhatsAppVerification" (
  id         TEXT        NOT NULL DEFAULT gen_random_uuid()::text,
  phone      TEXT        NOT NULL,
  code       TEXT        NOT NULL,
  verified   BOOLEAN     NOT NULL DEFAULT false,
  attempts   INTEGER     NOT NULL DEFAULT 0,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT "WhatsAppVerification_pkey"  PRIMARY KEY (id),
  CONSTRAINT "WhatsAppVerification_phone_key" UNIQUE (phone)
);

CREATE INDEX IF NOT EXISTS "WhatsAppVerification_phone_idx" ON "WhatsAppVerification"(phone);
