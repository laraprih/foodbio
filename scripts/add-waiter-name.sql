-- Adiciona nome do garçom aos pedidos de mesa
-- Executar uma vez no banco de produção e desenvolvimento

ALTER TABLE "Order"
  ADD COLUMN IF NOT EXISTS "waiterName" TEXT;

-- Índice para filtrar pedidos por garçom no futuro
CREATE INDEX IF NOT EXISTS "Order_waiterName_idx"
  ON "Order" ("tenantId", "waiterName")
  WHERE "waiterName" IS NOT NULL;
