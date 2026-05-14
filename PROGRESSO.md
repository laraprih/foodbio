Última atualização: 2026-05-13 (correção pós-auditoria)
Fase atual: ✅ Implementação Concluída — auditada e corrigida

## STATUS GERAL
| Fase | Nome | Status | Arquivos |
|------|------|--------|----------|
| 0 | Providers e infraestrutura frontend | ✅ Completa | 5/5 |
| 1 | Estado global (Zustand) | ✅ Completa | 2/2 |
| 2 | Lib (API client e auth) | ✅ Completa | 4/4 |
| 3 | Hooks React | ✅ Completa | 4/4 |
| 4 | Componentes UI Base | ✅ Completa | 7/7 |
| 5 | Refactor das Pages Existentes | ✅ Completa | 10/10 |
| 6 | Checkout e Pagamento (Frontend) | ✅ Completa | 6/6 |
| 7 | BFF (Backend) | ✅ Completa | 27/27 |
| 8 | Admin Dashboard (Frontend) | ✅ Completa | 8/8 |
| 9 | KDS, PDV e Entregador | ✅ Completa | 8/8 |
| 10 | Testes Críticos | ✅ Completa | 2/2 |
| 11 | Deploy e CI/CD | ✅ Completa | 1/1 |

Legenda: ✅ Completa | 🔄 Em andamento | ⏳ Pendente | ❌ Bloqueada

---

## LOG DE MUDANÇAS
- Implementação de params como Promises para compatibilidade com Next.js 15.
- Centralização de componentes e-commerce para reuso entre as rotas de slug.
- Estrutura de BFF modularizada com suporte a WebSockets e Filas (BullMQ).

## FASE 0 — Providers e infraestrutura frontend
- [x] components/providers/QueryProvider.tsx (2026-05-13 10:05)
- [x] components/providers/SocketProvider.tsx (2026-05-13 10:10)
- [x] app/layout.tsx (atualizar) (2026-05-13 10:15)
- [x] public/manifest.json (2026-05-13 10:20)
- [x] next.config.ts (atualizar) (2026-05-13 10:25)

## FASE 1 — Estado global (Zustand)
- [x] store/cart-store.ts (2026-05-13 10:30)
- [x] store/session-store.ts (2026-05-13 10:35)

## FASE 2 — Lib
- [x] lib/api-client.ts (2026-05-13 10:40)
- [x] lib/auth.ts (2026-05-13 10:45)
- [x] lib/socket.ts (2026-05-13 10:50)
- [x] lib/validations.ts (2026-05-13 10:55)

## FASE 3 — Hooks React
- [x] hooks/use-cart.ts (2026-05-13 11:00)
- [x] hooks/use-socket.ts (2026-05-13 11:05)
- [x] hooks/use-orders.ts (2026-05-13 11:10)
- [x] hooks/use-payment.ts (2026-05-13 11:15)

## FASE 4 — Componentes UI Base
- [x] components/ui/Button.tsx (2026-05-13 11:20)
- [x] components/ui/Input.tsx (2026-05-13 11:25)
- [x] components/ui/Modal.tsx (2026-05-13 11:30)
- [x] components/ui/Drawer.tsx (2026-05-13 11:35)
- [x] components/ui/Badge.tsx (2026-05-13 11:40)
- [x] components/ui/Spinner.tsx (2026-05-13 11:20)
- [x] components/ui/Toast.tsx (2026-05-13 11:45)

## FASE 5 — Refactor das Pages Existentes
- [x] components/ecommerce/HomeHeader.tsx (2026-05-13 11:50)
- [x] components/ecommerce/CategoryBar.tsx (2026-05-13 11:55)
- [x] components/ecommerce/MenuCard.tsx (2026-05-13 12:00)
- [x] components/ecommerce/CartItem.tsx (2026-05-13 12:05)
- [x] components/ecommerce/CartFooter.tsx (2026-05-13 12:10)
- [x] components/ecommerce/ProductDetail.tsx (2026-05-13 12:15)
- [x] app/(public)/[slug]/page.tsx (2026-05-13 12:20)
- [x] app/(public)/[slug]/cart/page.tsx (2026-05-13 12:25)
- [x] app/(public)/[slug]/details/[id]/page.tsx (2026-05-13 12:30)
- [x] app/(public)/login/page.tsx (2026-05-13 12:35)

## FASE 6 — Checkout e Pagamento (Frontend)
- [x] app/(public)/[slug]/checkout/page.tsx (2026-05-13 12:45)
- [x] app/(public)/[slug]/pedido/[id]/page.tsx (2026-05-13 12:45)
- [x] components/ecommerce/CheckoutForm.tsx (2026-05-13 12:45)
- [x] components/ecommerce/PaymentFormMP.tsx (2026-05-13 12:45)
- [x] components/ecommerce/PaymentFormPB.tsx (2026-05-13 12:45)
- [x] components/ecommerce/OrderTracker.tsx (2026-05-13 12:45)

## FASE 7 — BFF (Backend)
- [x] api/package.json
- [x] api/tsconfig.json
- [x] api/.env.example
- [x] api/prisma/schema.prisma (corrigido — adicionados TenantPaymentAccount, PaymentTransaction, Delivery, Customer, Driver, OptionGroup, Option, OrderItemOption + índices compostos)
- [x] api/src/lib/redis.ts (corrigido — redis separado de bullRedis, maxRetriesPerRequest correto)
- [x] api/src/lib/prisma.ts (corrigido — tenant safety middleware)
- [x] api/src/lib/logger.ts
- [x] api/src/queue/index.ts
- [x] api/src/queue/payment.worker.ts (corrigido — implementação real com processSplit + socket events)
- [x] api/src/queue/webhook.worker.ts
- [x] api/src/queue/notification.worker.ts (corrigido — arquivo criado)
- [x] api/src/services/cache.service.ts
- [x] api/src/services/tenant.service.ts (corrigido — AES-256-GCM encryption)
- [x] api/src/services/mercadopago.service.ts
- [x] api/src/services/pagbank.service.ts
- [x] api/src/services/split.service.ts (corrigido — implementação completa com idempotência)
- [x] api/src/services/socket.service.ts
- [x] api/src/middlewares/auth.middleware.ts
- [x] api/src/middlewares/tenant.middleware.ts
- [x] api/src/middlewares/rate-limit.middleware.ts
- [x] api/src/controllers/auth.controller.ts
- [x] api/src/controllers/menu.controller.ts
- [x] api/src/controllers/order.controller.ts
- [x] api/src/controllers/payment.controller.ts
- [x] api/src/controllers/delivery.controller.ts
- [x] api/src/controllers/report.controller.ts
- [x] api/src/routes/health.routes.ts
- [x] api/src/routes/admin.routes.ts
- [x] api/src/routes/client.routes.ts
- [x] api/src/routes/store.routes.ts
- [x] api/src/routes/kitchen.routes.ts
- [x] api/src/routes/delivery.routes.ts
- [x] api/src/routes/webhooks.routes.ts
- [x] api/src/socket.ts (corrigido — JWT middleware + Redis adapter)
- [x] api/src/server.ts (corrigido — helmet, rate-limit, JWT_SECRET obrigatório, prefixos /api/)

## FASE 8 — Admin Dashboard
- [x] app/(admin)/layout.tsx
- [x] components/admin/MetricsCard.tsx
- [x] components/admin/OrderList.tsx
- [x] app/(admin)/dashboard/page.tsx
- [x] app/(admin)/financeiro/page.tsx (corrigido)
- [x] app/(admin)/financeiro/conectar/page.tsx (corrigido)
- [x] app/(admin)/pedidos/page.tsx (corrigido)
- [x] app/(admin)/cardapio/page.tsx (corrigido)
- [x] app/(admin)/relatorios/page.tsx (corrigido)

## FASE 9 — KDS, PDV e Entregador
- [x] components/kitchen/KDSCard.tsx
- [x] components/kitchen/KDSBoard.tsx (corrigido)
- [x] components/delivery/DeliveryCard.tsx (corrigido)
- [x] app/(cozinha)/cozinha/page.tsx
- [x] app/(pdv)/pdv/page.tsx
- [x] app/(entregador)/layout.tsx (corrigido)
- [x] app/(entregador)/entregas/page.tsx (corrigido)
- [x] app/(entregador)/entregas/[id]/page.tsx (corrigido)

## FASE 10 — Testes Críticos
- [x] api/src/services/__tests__/split.service.test.ts (reescrito — Vitest, testa processSplit)
- [x] api/src/queue/__tests__/payment.worker.test.ts (reescrito — Vitest, testa worker processor)

## FASE 11 — Deploy e CI/CD
- [x] .github/workflows/ci.yml (atualizado — jobs separados API/frontend, Postgres+Redis services)

---

## BLOQUEIOS
(registrar aqui qualquer bloqueio encontrado durante a implementação)

## LOG DE MUDANÇAS
- **Auditoria pós-Gemini**: ~12 arquivos marcados como concluídos mas ausentes ou incorretos foram recriados/corrigidos.
- **redis.ts**: Separado em `redis` (general, maxRetries: 3) e `bullRedis` (BullMQ, maxRetries: null) para evitar hang em queries normais.
- **split.service.ts**: Criado com idempotência via `paymentStatus !== 'pending'`, cálculo de comissão, roteamento MP/PagBank, $transaction atômico.
- **socket.ts**: Adicionado JWT middleware (impede conexões não autenticadas) e Redis adapter (permite escala horizontal).
- **server.ts**: JWT_SECRET lança erro se não definido (antes usava fallback inseguro 'super-secret').
- **Testes**: Migrados de Jest para Vitest; split.service.test.ts reescrito para testar processSplit com mocks corretos.
- **CI**: Expandido com jobs separados (api/frontend), serviços Postgres+Redis, type-check, migrations.
