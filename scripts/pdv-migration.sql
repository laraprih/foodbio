-- PDV Migration: Table, CashSession, CashMovement + colunas extras em Order
-- Execute no banco de dados do projeto (PostgreSQL)

-- Mesa
CREATE TABLE IF NOT EXISTS "Table" (
  id          TEXT        PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "tenantId"  TEXT        NOT NULL,
  number      INTEGER     NOT NULL,
  capacity    INTEGER     NOT NULL DEFAULT 4,
  label       TEXT,
  status      TEXT        NOT NULL DEFAULT 'free',  -- free | occupied | waiting_payment
  active      BOOLEAN     NOT NULL DEFAULT true,
  CONSTRAINT fk_table_tenant FOREIGN KEY ("tenantId") REFERENCES "Tenant"(id)
);

CREATE INDEX IF NOT EXISTS idx_table_tenant_status ON "Table" ("tenantId", status);
CREATE UNIQUE INDEX IF NOT EXISTS idx_table_tenant_number ON "Table" ("tenantId", number) WHERE active = true;

-- Sessão de caixa
CREATE TABLE IF NOT EXISTS "CashSession" (
  id              TEXT        PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "tenantId"      TEXT        NOT NULL,
  "operatorId"    TEXT        NOT NULL,
  "openedAt"      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "closedAt"      TIMESTAMPTZ,
  "initialAmount" FLOAT       NOT NULL DEFAULT 0,
  "closeAmount"   FLOAT,
  status          TEXT        NOT NULL DEFAULT 'open',  -- open | closed
  CONSTRAINT fk_cashsession_tenant   FOREIGN KEY ("tenantId")   REFERENCES "Tenant"(id),
  CONSTRAINT fk_cashsession_operator FOREIGN KEY ("operatorId") REFERENCES "User"(id)
);

CREATE INDEX IF NOT EXISTS idx_cashsession_tenant_status ON "CashSession" ("tenantId", status);

-- Movimentações de caixa (sangria / suprimento)
CREATE TABLE IF NOT EXISTS "CashMovement" (
  id          TEXT        PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "sessionId" TEXT        NOT NULL,
  type        TEXT        NOT NULL,    -- bleed | supply
  amount      FLOAT       NOT NULL,
  reason      TEXT        NOT NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT fk_cashmovement_session FOREIGN KEY ("sessionId") REFERENCES "CashSession"(id)
);

-- Colunas extras em Order para suporte a PDV
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "tableId"       TEXT;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "cashSessionId" TEXT;
