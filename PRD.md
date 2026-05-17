# PRD — Foodbio v2.0
**SaaS de Delivery Multi-Tenant com Split de Pagamento**
**Documento de Requisitos de Produto + Guia de Implementação**
Versão: 2.0 | Data: 2026-05-13 | Responsável técnico: Claude Sonnet 4.6

---

## 0. Análise do Projeto Atual

### Estado real do repositório (`/foodbio`)

```
foodbio/                        ← Next.js 15.4.9 (App Router) standalone
├── app/
│   ├── cart/page.tsx           ← Carrinho: UI completa, sem estado real
│   ├── details/page.tsx        ← Detalhe de produto: UI completa, hardcoded
│   ├── globals.css             ← Design tokens: lime #D4FF00, zinc-900, app-bg #F1F9E8
│   ├── layout.tsx              ← Container 414px, Inter font, bg-gray-100
│   └── page.tsx                ← Home: categorias + grid de produtos, 4 cards hardcoded
├── hooks/use-mobile.ts         ← Hook de breakpoint (já existe)
├── lib/
│   ├── data.ts                 ← URLs de imagens hardcoded (Google CDN)
│   └── utils.ts                ← cn() helper (clsx + tailwind-merge)
├── next.config.ts              ← output: standalone, remotePatterns, HMR opcional
├── package.json                ← React 19, Next 15, Tailwind 4, @google/genai, motion
└── tsconfig.json               ← paths: @/* → ./*
```

### Design System já estabelecido (PRESERVAR)

| Token | Valor | Uso |
|-------|-------|-----|
| `--color-lime-primary` | `#D4FF00` | CTAs, active states, ícones de destaque |
| `--color-app-bg` | `#F1F9E8` | Fundo de cards de produto |
| `--color-app-accent` | `#bef264` | Botões secundários, quantity controls |
| `--color-app-dark` | `#1a1a1a` | Textos, botão Checkout |
| `bg-zinc-900` | Tailwind | Header, nav bar flutuante |
| `rounded-[28px]` | Tailwind | Cards de produto |
| `rounded-full` | Tailwind | Nav flutuante, botões de ação |

### Gap atual

O projeto é um showcase de UI sem nenhuma camada de negócio:
- Sem gestão de estado (Zustand/React Query ausentes)
- Sem autenticação
- Sem backend ou API
- Dados hardcoded em `lib/data.ts`
- Sem multi-tenancy (não há conceito de restaurante variável)

**Este PRD define como transformar o protótipo num produto completo, preservando integralmente o design já construído.**

---

## 1. Objetivos

### 1.1 Missão
Transformar o protótipo visual atual numa plataforma SaaS multi-tenant que:
1. Permite a restaurantes operar delivery online, PDV presencial, cozinha e logística numa única plataforma.
2. Se monetiza exclusivamente por split automático de pagamento (zero taxa de assinatura).
3. Suporta **1.000+ restaurantes ativos simultaneamente** com gestão de carga.

### 1.2 Metas de Negócio (6 meses)

| Indicador | Meta |
|-----------|------|
| Restaurantes ativos | 50 → 200 → 500 → 1.000+ |
| Pedidos processados/mês | 5.000 → 50.000 |
| Churn mensal | < 5% |
| MRR via comissão | R$ 15.000 → R$ 150.000 |
| Disponibilidade | 99,5% (horário comercial) |
| Latência p95 checkout | < 800ms |

### 1.3 Módulos a Entregar

| Módulo | Interface | Usuário | Prioridade |
|--------|-----------|---------|-----------|
| E-commerce (cardápio + checkout) | PWA mobile-first | Cliente final | P0 |
| Admin Dashboard | Web desktop | Dono do restaurante | P0 |
| Pagamento com Split | BFF + SDKs | Todos | P0 |
| KDS (Cozinha) | Web tablet | Cozinheiro | P1 |
| PDV Loja Presencial | Web desktop | Atendente | P1 |
| App Entregador | PWA mobile | Motorista | P1 |
| Onboarding Financeiro | Web | Admin | P1 |
| Relatórios e Split Report | Web | Admin | P2 |

---

## 2. Stack Técnica

### 2.1 Frontend (preserva dependências atuais + adiciona)

```
Manter (já instalado):
  next@15.4.9          App Router, SSR/SSG/ISR
  react@19.2.1
  tailwindcss@4.1.11   + @tailwindcss/postcss
  typescript@5.9.3
  lucide-react         ícones
  motion               animações
  clsx + tailwind-merge → cn()
  @google/genai        mantido para features de IA futuras

Adicionar:
  @tanstack/react-query@5    fetch/cache de dados server state
  zustand@5                  estado global (carrinho, sessão)
  next-auth@5                autenticação
  @hookform/resolvers@5      já instalado
  react-hook-form            formulários
  zod                        validação client-side
  socket.io-client@4         tempo real
  next-pwa                   PWA/service worker
```

### 2.2 Backend (BFF — pasta `/api`)

```
Node.js 20 LTS
fastify@4              HTTP server de alto desempenho (50k req/s single core)
@fastify/jwt           JWT auth
@fastify/cors          CORS
@fastify/helmet        headers de segurança
@fastify/rate-limit    rate limiting por tenant (Redis store)
prisma@5               ORM + migrations
@prisma/client
socket.io@4            WebSocket server
ioredis                cliente Redis (pool de conexões)
bullmq                 filas assíncronas de alta escala
pino                   logger JSON estruturado
zod                    validação de payloads
mercadopago            SDK oficial Mercado Pago
argon2                 hash de senhas (não bcrypt — mais rápido)
```

### 2.3 Banco e Cache

```
PostgreSQL 15          banco principal
  + PgBouncer          connection pooling (crítico para 1000+ tenants)
  + Read Replica       para queries de relatório
Redis 7 (Cluster)
  DB 0 — sessões JWT
  DB 1 — cache de cardápios (TTL 60s, por restaurantId)
  DB 2 — rate limiting (sliding window)
  DB 3 — BullMQ jobs
  DB 4 — Socket.io pub/sub (adapter multi-instância)
```

### 2.4 Infraestrutura para Escala

```
Vercel                 deploy frontend Next.js (CDN global, ISR)
Fly.io (3 regiões)     BFF Fastify (3 instâncias mínimo em prod)
Upstash Redis          Redis gerenciado com replicação
Supabase               PostgreSQL + Storage de imagens
Cloudflare             CDN de imagens + WAF
Sentry                 rastreamento de erros (front + back)
Grafana + Prometheus   métricas de carga por tenant
```

---

## 3. Estrutura de Pastas

### Visão geral

O projeto mantém a raiz como o app Next.js. O backend vive em `/api`. Componentes
são extraídos das pages existentes para a pasta `/components`.

```
foodbio/                           ← raiz do projeto (Next.js)
│
├── app/                           ← App Router (PRESERVADO + expandido)
│   ├── (public)/                  ← Rotas públicas sem auth
│   │   ├── page.tsx               ← Redirect → /[slug] ou landing
│   │   ├── [slug]/                ← Cardápio público do restaurante
│   │   │   ├── page.tsx           ← REFACTOR de app/page.tsx (preservar design)
│   │   │   ├── cart/
│   │   │   │   └── page.tsx       ← REFACTOR de app/cart/page.tsx
│   │   │   ├── details/[id]/
│   │   │   │   └── page.tsx       ← REFACTOR de app/details/page.tsx
│   │   │   ├── checkout/
│   │   │   │   └── page.tsx       ← NOVO
│   │   │   └── pedido/[id]/
│   │   │       └── page.tsx       ← NOVO (rastreio em tempo real)
│   │   └── login/
│   │       └── page.tsx           ← NOVO
│   │
│   ├── (admin)/                   ← Dashboard admin (auth: admin|attendant)
│   │   ├── layout.tsx
│   │   ├── dashboard/
│   │   │   └── page.tsx
│   │   ├── cardapio/
│   │   │   ├── page.tsx
│   │   │   └── [id]/page.tsx
│   │   ├── pedidos/
│   │   │   └── page.tsx
│   │   ├── financeiro/
│   │   │   ├── page.tsx
│   │   │   └── conectar/page.tsx
│   │   └── relatorios/
│   │       └── page.tsx
│   │
│   ├── (pdv)/                     ← PDV Loja (auth: admin|attendant)
│   │   ├── layout.tsx
│   │   └── pdv/page.tsx
│   │
│   ├── (cozinha)/                 ← KDS Cozinha (auth: cook)
│   │   ├── layout.tsx
│   │   └── cozinha/page.tsx
│   │
│   ├── (entregador)/              ← App Entregador (auth: driver)
│   │   ├── layout.tsx
│   │   └── entregas/
│   │       ├── page.tsx
│   │       └── [id]/page.tsx
│   │
│   ├── api/
│   │   └── auth/[...nextauth]/
│   │       └── route.ts
│   │
│   ├── globals.css                ← PRESERVADO (design tokens)
│   └── layout.tsx                 ← ATUALIZADO (adicionar QueryProvider, etc.)
│
├── components/                    ← Extraídos + novos
│   ├── ui/                        ← Primitivos reutilizáveis
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Modal.tsx
│   │   ├── Drawer.tsx
│   │   ├── Badge.tsx
│   │   ├── Spinner.tsx
│   │   └── Toast.tsx
│   ├── ecommerce/
│   │   ├── MenuCard.tsx           ← EXTRAI lógica de card de app/page.tsx
│   │   ├── CategoryBar.tsx        ← EXTRAI barra de categorias
│   │   ├── HomeHeader.tsx         ← EXTRAI header de app/page.tsx
│   │   ├── CartItem.tsx           ← EXTRAI item de app/cart/page.tsx
│   │   ├── CartFooter.tsx         ← EXTRAI footer de app/cart/page.tsx
│   │   ├── ProductDetail.tsx      ← EXTRAI conteúdo de app/details/page.tsx
│   │   ├── CheckoutForm.tsx
│   │   ├── PaymentFormMP.tsx
│   │   ├── PaymentFormPB.tsx
│   │   └── OrderTracker.tsx
│   ├── admin/
│   │   ├── Sidebar.tsx
│   │   ├── MetricsCard.tsx
│   │   ├── OrderList.tsx
│   │   ├── ProductForm.tsx
│   │   ├── PaymentOnboarding.tsx
│   │   └── SplitReport.tsx
│   ├── kitchen/
│   │   ├── KDSBoard.tsx
│   │   └── KDSCard.tsx
│   ├── pdv/
│   │   ├── POSProductGrid.tsx
│   │   └── POSCart.tsx
│   ├── delivery/
│   │   └── DeliveryCard.tsx
│   └── providers/
│       ├── QueryProvider.tsx      ← TanStack Query wrapper
│       └── SocketProvider.tsx     ← Socket.io context
│
├── hooks/
│   ├── use-mobile.ts              ← PRESERVADO
│   ├── use-cart.ts                ← NOVO
│   ├── use-socket.ts              ← NOVO
│   ├── use-orders.ts              ← NOVO
│   └── use-payment.ts             ← NOVO
│
├── lib/
│   ├── data.ts                    ← PRESERVADO (imagens de placeholder)
│   ├── utils.ts                   ← PRESERVADO (cn helper)
│   ├── api-client.ts              ← NOVO fetch wrapper
│   ├── auth.ts                    ← NOVO NextAuth config
│   ├── socket.ts                  ← NOVO singleton socket.io-client
│   └── validations.ts             ← NOVO schemas Zod
│
├── store/
│   ├── cart-store.ts              ← NOVO Zustand (persistido no localStorage)
│   └── session-store.ts           ← NOVO Zustand (tenant ativo)
│
├── public/
│   ├── manifest.json              ← NOVO PWA manifest
│   └── icons/                     ← NOVO app icons (192, 512, maskable)
│
├── api/                           ← NOVO BFF (Node.js / Fastify)
│   ├── src/
│   │   ├── server.ts              ← Bootstrap Fastify
│   │   ├── socket.ts              ← Setup Socket.io + Redis adapter
│   │   ├── queue/
│   │   │   ├── index.ts           ← Setup BullMQ queues
│   │   │   ├── payment.worker.ts  ← Worker de pagamento assíncrono
│   │   │   ├── webhook.worker.ts  ← Worker de webhooks
│   │   │   └── notification.worker.ts
│   │   ├── routes/
│   │   │   ├── admin.routes.ts
│   │   │   ├── client.routes.ts
│   │   │   ├── store.routes.ts
│   │   │   ├── kitchen.routes.ts
│   │   │   ├── delivery.routes.ts
│   │   │   ├── webhooks.routes.ts
│   │   │   └── health.routes.ts
│   │   ├── controllers/
│   │   │   ├── auth.controller.ts
│   │   │   ├── menu.controller.ts
│   │   │   ├── order.controller.ts
│   │   │   ├── payment.controller.ts
│   │   │   ├── delivery.controller.ts
│   │   │   └── report.controller.ts
│   │   ├── services/
│   │   │   ├── mercadopago.service.ts
│   │   │   ├── pagbank.service.ts
│   │   │   ├── split.service.ts
│   │   │   ├── socket.service.ts
│   │   │   ├── cache.service.ts   ← Redis cache (cardápio, sessão)
│   │   │   └── tenant.service.ts  ← Resolução e cache de tenants
│   │   ├── middlewares/
│   │   │   ├── auth.middleware.ts
│   │   │   ├── tenant.middleware.ts
│   │   │   └── rate-limit.middleware.ts
│   │   └── lib/
│   │       ├── prisma.ts          ← Singleton PrismaClient
│   │       ├── redis.ts           ← Singleton ioredis
│   │       └── logger.ts          ← Pino
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── migrations/
│   ├── Dockerfile
│   ├── .env.example
│   └── package.json
│
├── next.config.ts                 ← ATUALIZADO (PWA, proxy BFF)
├── package.json                   ← ATUALIZADO (adicionar deps)
└── tsconfig.json                  ← PRESERVADO
```

---

## 4. Modelagem de Dados

### 4.1 Schema Prisma Completo

```prisma
// api/prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  // Prisma Accelerate ou PgBouncer em produção:
  directUrl = env("DIRECT_URL")
}

// ─── TENANT ──────────────────────────────────────────────────────────────────

model Restaurant {
  id              String   @id @default(cuid())
  slug            String   @unique  // URL amigável: /cardapio-da-mari
  name            String
  phone           String
  address         String
  city            String
  state           String
  coords          Json     // { lat: -23.5, lng: -46.6 }
  logoUrl         String?
  coverUrl        String?
  openingHours    Json     // { mon: "11:00-22:00", ... }
  deliveryRadius  Float    @default(5.0)  // km
  deliveryFee     Float    @default(0.0)
  minOrderValue   Float    @default(0.0)
  plan            String   @default("free")
  active          Boolean  @default(true)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  paymentAccount  TenantPaymentAccount?
  menuCategories  MenuCategory[]
  orders          Order[]
  users           User[]

  @@index([slug])
  @@index([city, state, active])
}

// ─── PAGAMENTO (SPLIT) ────────────────────────────────────────────────────────

model TenantPaymentAccount {
  id                 String   @id @default(cuid())
  restaurantId       String   @unique
  gateway            String   // "mercadopago" | "pagbank"
  externalAccountId  String
  accessToken        String   // AES-256-GCM encrypted
  refreshToken       String?  // AES-256-GCM encrypted
  tokenExpiresAt     DateTime?
  onboardingStatus   String   @default("pending") // pending | active | suspended
  commissionPercent  Float    @default(8.0)
  createdAt          DateTime @default(now())
  updatedAt          DateTime @updatedAt

  restaurant  Restaurant @relation(fields: [restaurantId], references: [id])
}

// ─── CARDÁPIO ─────────────────────────────────────────────────────────────────

model MenuCategory {
  id           String    @id @default(cuid())
  restaurantId String
  name         String
  order        Int       @default(0)
  active       Boolean   @default(true)
  products     Product[]

  restaurant   Restaurant @relation(fields: [restaurantId], references: [id])

  @@index([restaurantId, active])
}

model Product {
  id           String        @id @default(cuid())
  categoryId   String
  restaurantId String        // desnormalizado para queries diretas por tenant
  name         String
  description  String?
  price        Float
  imageUrl     String?
  available    Boolean       @default(true)
  sortOrder    Int           @default(0)
  optionGroups OptionGroup[]
  orderItems   OrderItem[]

  category     MenuCategory @relation(fields: [categoryId], references: [id])

  @@index([restaurantId, available])
  @@index([categoryId])
}

model OptionGroup {
  id         String   @id @default(cuid())
  productId  String
  name       String
  required   Boolean  @default(false)
  maxChoices Int      @default(1)
  minChoices Int      @default(0)
  options    Option[]

  product    Product  @relation(fields: [productId], references: [id])
}

model Option {
  id            String            @id @default(cuid())
  groupId       String
  name          String
  priceModifier Float             @default(0)
  available     Boolean           @default(true)
  selectedIn    OrderItemOption[]

  group         OptionGroup @relation(fields: [groupId], references: [id])
}

// ─── USUÁRIOS ─────────────────────────────────────────────────────────────────

model User {
  id           String   @id @default(cuid())
  restaurantId String?  // null = cliente final sem vínculo
  name         String
  email        String   @unique
  phone        String?
  passwordHash String?  // argon2, null para OAuth
  role         String   // admin | attendant | cook | driver | customer
  active       Boolean  @default(true)
  createdAt    DateTime @default(now())

  restaurant   Restaurant? @relation(fields: [restaurantId], references: [id])
  customer     Customer?
  driver       Driver?

  @@index([email])
  @@index([restaurantId, role])
}

model Customer {
  id          String  @id @default(cuid())
  userId      String  @unique
  addresses   Json    @default("[]") // [{ label, street, number, city, coords }]
  user        User    @relation(fields: [userId], references: [id])
  orders      Order[]
}

model Driver {
  id           String     @id @default(cuid())
  userId       String     @unique
  restaurantId String
  vehicle      String
  plate        String
  active       Boolean    @default(true)
  user         User       @relation(fields: [userId], references: [id])
  deliveries   Delivery[]

  @@index([restaurantId, active])
}

// ─── PEDIDOS ──────────────────────────────────────────────────────────────────

model Order {
  id                String    @id @default(cuid())
  restaurantId      String
  customerId        String?
  type              String    // delivery | pickup | in_store
  status            String    @default("pending")
  // pending → confirmed → preparing → ready → dispatched → delivered | cancelled
  total             Float
  subtotal          Float
  deliveryFee       Float     @default(0)
  discount          Float     @default(0)
  paymentStatus     String    @default("pending")
  // pending | approved | failed | refunded | chargeback
  paymentMethod     String?   // pix | credit_card | debit_card | cash
  externalReference String?
  deliveryAddress   Json?
  notes             String?
  cancelReason      String?
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt

  restaurant         Restaurant          @relation(fields: [restaurantId], references: [id])
  customer           Customer?           @relation(fields: [customerId], references: [id])
  items              OrderItem[]
  delivery           Delivery?
  paymentTransaction PaymentTransaction?

  // Índices críticos para performance com 1000+ tenants
  @@index([restaurantId, status, createdAt])
  @@index([restaurantId, paymentStatus])
  @@index([externalReference])
  @@index([createdAt])
}

model OrderItem {
  id         String            @id @default(cuid())
  orderId    String
  productId  String
  quantity   Int
  unitPrice  Float
  totalPrice Float
  notes      String?
  options    OrderItemOption[]

  order      Order   @relation(fields: [orderId], references: [id], onDelete: Cascade)
  product    Product @relation(fields: [productId], references: [id])

  @@index([orderId])
}

model OrderItemOption {
  id          String @id @default(cuid())
  orderItemId String
  optionId    String
  name        String // desnormalizado para histórico
  price       Float  // desnormalizado para histórico

  orderItem   OrderItem @relation(fields: [orderItemId], references: [id], onDelete: Cascade)
  option      Option    @relation(fields: [optionId], references: [id])
}

// ─── ENTREGAS ─────────────────────────────────────────────────────────────────

model Delivery {
  id           String    @id @default(cuid())
  orderId      String    @unique
  driverId     String?
  pickupTime   DateTime?
  deliveryTime DateTime?
  estimatedMin Int?      // minutos estimados
  status       String    @default("waiting")
  // waiting | assigned | picked_up | delivered
  locationLog  Json?     // [{lat, lng, timestamp}] para rastreio

  order        Order  @relation(fields: [orderId], references: [id])
  driver       Driver? @relation(fields: [driverId], references: [id])

  @@index([driverId, status])
}

// ─── FINANCEIRO (SPLIT) ───────────────────────────────────────────────────────

model PaymentTransaction {
  id                   String   @id @default(cuid())
  orderId              String   @unique
  restaurantId         String   // desnormalizado para relatórios
  gateway              String   // mercadopago | pagbank
  gatewayTransactionId String?
  totalAmount          Float
  marketplaceFee       Float
  sellerAmount         Float
  gatewayFee           Float    @default(0)
  splitStatus          String   @default("pending")
  // pending | done | failed | refunded | chargeback
  payloadRequest       Json?
  payloadResponse      Json?
  processedAt          DateTime?
  createdAt            DateTime @default(now())

  order                Order @relation(fields: [orderId], references: [id])

  @@index([restaurantId, createdAt])
  @@index([gatewayTransactionId])
  @@index([splitStatus])
}
```

---

## 5. Arquitetura de Backend para 1.000+ Lojas

### 5.1 Diagrama de Camadas

```
                         ┌─────────────────────────────────┐
                         │         CLIENTES                │
                         │  Browser PWA / Tablet / Mobile  │
                         └──────────────┬──────────────────┘
                                        │ HTTPS
                         ┌──────────────▼──────────────────┐
                         │    Vercel CDN (Next.js 15)       │
                         │  SSG/ISR para cardápios públicos │
                         │  Edge Middleware para tenant auth│
                         └──────────────┬──────────────────┘
                                        │ REST / WebSocket
                    ┌───────────────────▼─────────────────────┐
                    │        Fly.io Load Balancer (Anycast)    │
                    │  Region: GRU (São Paulo) primary         │
                    └───┬───────────────┬──────────────────┬──┘
                        │               │                  │
              ┌─────────▼──┐  ┌─────────▼──┐  ┌──────────▼─┐
              │  BFF #1    │  │  BFF #2    │  │  BFF #3    │
              │ Fastify 4  │  │ Fastify 4  │  │ Fastify 4  │
              │ Socket.io  │  │ Socket.io  │  │ Socket.io  │
              └─────┬──────┘  └─────┬──────┘  └──────┬─────┘
                    │               │                  │
                    └───────────────┼──────────────────┘
                                    │
          ┌─────────────────────────┼──────────────────────────┐
          │                         │                          │
┌─────────▼──────────┐  ┌──────────▼─────────┐  ┌────────────▼────────┐
│  PostgreSQL 15      │  │  Redis Cluster 7   │  │  BullMQ Workers     │
│  Supabase           │  │  Upstash           │  │  (processos sep.)   │
│  + PgBouncer        │  │                    │  │                     │
│  + Read Replica     │  │  DB0: JWT sessions │  │  payment-worker     │
│                     │  │  DB1: menu cache   │  │  webhook-worker     │
│  Row-Level Security │  │  DB2: rate limits  │  │  notification-worker│
│  Índices tenant     │  │  DB3: BullMQ jobs  │  │  reconcile-worker   │
│  Partição por mês*  │  │  DB4: socket pubsub│  │                     │
└─────────────────────┘  └────────────────────┘  └─────────────────────┘

* Particionamento de Orders e PaymentTransactions por mês via pg_partman
```

### 5.2 Estratégias de Escala por Componente

#### 5.2.1 PostgreSQL — Conexões sob 1.000 tenants

Problema: 1.000 restaurantes × 3 instâncias BFF × 10 conexões Prisma = 30.000 conexões potenciais. O PostgreSQL suporta ~500 por padrão.

**Solução: PgBouncer no modo Transaction Pooling**

```
BFF → PgBouncer (pool de 100 conexões) → PostgreSQL (max 200 conexões)

pgbouncer.ini:
  pool_mode = transaction
  max_client_conn = 5000   ← aceita conexões dos BFFs
  default_pool_size = 20   ← por database
  server_pool_mode = transaction
```

**Índices obrigatórios (gerados nas migrations):**
```sql
-- Queries mais frequentes: pedidos por tenant + status
CREATE INDEX CONCURRENTLY idx_orders_tenant_status
  ON "Order"("restaurantId", status, "createdAt" DESC);

-- Relatórios: transações por tenant + data
CREATE INDEX CONCURRENTLY idx_payment_tenant_date
  ON "PaymentTransaction"("restaurantId", "createdAt" DESC);

-- Cardápio: produtos por restaurante disponíveis
CREATE INDEX CONCURRENTLY idx_product_tenant_available
  ON "Product"("restaurantId", available);
```

#### 5.2.2 Redis — Cache de Cardápio por Tenant

O cardápio é a operação mais frequente (lida a cada visita ao site). Cachear por tenant elimina 90% das queries ao banco.

```typescript
// api/src/services/cache.service.ts
const MENU_TTL = 60  // segundos

async function getMenu(restaurantId: string) {
  const key = `menu:${restaurantId}`
  const cached = await redis.get(key)
  if (cached) return JSON.parse(cached)

  const menu = await prisma.menuCategory.findMany({ where: { restaurantId, active: true }, include: { products: { where: { available: true } } } })
  await redis.set(key, JSON.stringify(menu), 'EX', MENU_TTL)
  return menu
}

// Invalidar cache ao editar cardápio:
async function invalidateMenu(restaurantId: string) {
  await redis.del(`menu:${restaurantId}`)
}
```

#### 5.2.3 Rate Limiting por Tenant

Garante que um restaurante com tráfego anômalo não degrada os outros.

```typescript
// api/src/middlewares/rate-limit.middleware.ts
// Configuração no Fastify:
fastify.register(fastifyRateLimit, {
  global: false,  // configura por rota
  redis: redisClient,
  keyGenerator: (req) => `rl:${req.tenant?.id ?? req.ip}`,
})

// Por rota crítica:
// POST /orders → 30 req/min por tenant
// POST /orders/:id/pay → 10 req/min por tenant
// GET /menu → 200 req/min por tenant
```

#### 5.2.4 BullMQ — Processamento Assíncrono de Pagamentos

Pagamentos síncronos bloqueiam a thread. Com BullMQ, o checkout retorna imediatamente e o pagamento é processado em background.

```typescript
// Fluxo assíncrono:
// 1. POST /orders/:id/pay → enfileira job → resposta imediata 202 Accepted
// 2. payment-worker processa o job → chama gateway → atualiza DB
// 3. Socket.io notifica cliente do resultado

// Configuração da fila:
const paymentQueue = new Queue('payment', {
  connection: redis,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 2000 },
    removeOnComplete: { count: 1000 },
    removeOnFail: { count: 5000 },
  },
})

// Enfileirar:
await paymentQueue.add('process', { orderId, token, gateway }, {
  priority: 1,
  timeout: 30_000,  // 30s máximo
})
```

#### 5.2.5 Socket.io — Escala Horizontal com Redis Adapter

Com 3 instâncias BFF, eventos precisam ser sincronizados entre processos.

```typescript
// api/src/socket.ts
import { createAdapter } from '@socket.io/redis-adapter'

const pubClient = redis.duplicate()
const subClient = redis.duplicate()

io.adapter(createAdapter(pubClient, subClient))

// Agora: BFF #1 pode emitir para salas no BFF #2 e #3
// Uso de salas hierárquicas para isolar tenants:
// kitchen:{restaurantId}  → apenas cozinheiros daquele restaurante
// drivers:{restaurantId}  → apenas entregadores daquele restaurante
// order:{orderId}         → cliente específico
// admin:{restaurantId}    → dashboard do admin
```

#### 5.2.6 Isolamento de Tenant

Todo acesso ao banco inclui `restaurantId` na where clause. Um middleware valida isso.

```typescript
// api/src/middlewares/tenant.middleware.ts
// Decorates request.tenant com Restaurant
// Garante que o usuário autenticado pertence ao tenant

// Proteção extra: Prisma middleware global
prisma.$use(async (params, next) => {
  const tenantTables = ['Order', 'Product', 'MenuCategory', 'PaymentTransaction']
  if (tenantTables.includes(params.model ?? '') && params.action === 'findMany') {
    if (!params.args.where?.restaurantId) {
      throw new Error(`Query ${params.model}.findMany sem restaurantId`)
    }
  }
  return next(params)
})
```

### 5.3 Métricas de Capacidade

| Configuração | Pedidos/min | Tenants simultâneos |
|-------------|-------------|---------------------|
| 1 BFF, sem Redis | ~200 | ~50 |
| 3 BFFs + Redis cache | ~2.000 | ~500 |
| 3 BFFs + Redis + PgBouncer | ~5.000 | ~1.000+ |
| + BullMQ workers separados | ~10.000 | ~2.000+ |

---

## 6. Fluxos de Dados

### 6.1 Checkout com Split (fluxo completo)

```
Cliente (PWA) → Next.js → BFF → BullMQ → Gateway → Socket.io → Cliente

1. GET /{slug}
   Next.js ISR (cache 60s) → serve HTML do cardápio sem hit no banco

2. Montar carrinho
   Zustand + localStorage → zero rede

3. POST /api/client/orders
   BFF → Prisma → cria Order(status=pending, paymentStatus=pending)
   Retorna: { orderId, total }

4. Tokenização (BROWSER ONLY — nunca toca o servidor Foodbio)
   Mercado Pago: mp.fields.create() → mp.createCardToken() → { token }
   PagBank: PagSeguro.encryptCard() → { encryptedCard }

5. POST /api/client/orders/:id/pay
   Body: { token, gateway: "mercadopago" | "pagbank" }
   BFF:
     a. Valida rate limit (10 tentativas/min por tenant)
     b. Verifica TenantPaymentAccount (Redis cache 5min)
     c. Enfileira job BullMQ { orderId, token, gateway }
     d. Retorna 202 { status: "processing", orderId }

6. payment-worker (processo separado)
   a. Busca Order + TenantPaymentAccount
   b. Calcula: marketplaceFee = total × commissionPercent / 100
   c. Monta payload gateway:
      MP: { processing_mode: "aggregator", marketplace_fee, ... }
      PB: { charges[].split.receivers[{ account_id, percentual }] }
   d. Chama API gateway (timeout 25s, retry 3×)
   e. Atualiza Order(paymentStatus=approved, status=confirmed)
   f. Cria PaymentTransaction
   g. Socket.emit("order:confirmed", orderId) → sala order:{orderId}

7. Socket.io notifica:
   → Cliente recebe confirmação em tempo real
   → Admin recebe "new_order" no dashboard
   → Cozinha recebe "new_order" via kitchen:{restaurantId}
```

### 6.2 KDS Cozinha (tempo real)

```
Cozinheiro (Tablet) → Socket join kitchen:{restaurantId}
                    → GET /api/kitchen/orders (confirmed + preparing)

Novo pedido chega → Socket event "new_order" → KDSBoard.tsx re-renderiza
Cozinheiro clica "Iniciar" → PATCH /api/kitchen/orders/:id/start
                           → Order(status=preparing)
                           → Socket emit "order:update" → order:{orderId}
                           → Cliente recebe atualização em tempo real

Cozinheiro clica "Pronto" → PATCH /api/kitchen/orders/:id/ready
                          → Order(status=ready)
                          → Socket emit "order:ready" → drivers:{restaurantId}
                          → Entregador recebe notificação push
```

### 6.3 Onboarding Financeiro do Restaurante

```
Admin → GET /admin/financeiro/conectar

Mercado Pago:
  → Clica "Conectar MP"
  → Redirect para https://auth.mercadopago.com/authorization?...&redirect_uri=...
  → MP retorna para /api/admin/payment/mp/callback?code=AUTH_CODE
  → BFF: POST https://api.mercadopago.com/oauth/token { code }
  → Recebe { access_token, user_id }
  → Salva TenantPaymentAccount(gateway=mp, accessToken=encrypt(token), status=active)
  → Redirect para /admin/financeiro?success=true

PagBank:
  → Formulário inline (email da conta PagBank)
  → POST /api/admin/payment/pb/connect { email, restaurantId }
  → BFF vincula conta via PagBank API
  → Salva TenantPaymentAccount(gateway=pagbank)

Status dashboard: "Conta Mercado Pago ativa · Comissão: 8%"
```

### 6.4 Webhook de Conciliação

```
Gateway → POST /api/webhooks/payment/{gateway}
         (Sem JWT — autenticado por HMAC/assinatura do gateway)

BFF (síncrono, responde 200 em < 100ms):
  1. Valida assinatura HMAC
  2. Enfileira job webhook-worker { event, payload }
  3. Retorna 200 OK

webhook-worker (assíncrono):
  1. Parse do evento: payment.approved | payment.refunded | chargeback
  2. Busca PaymentTransaction por gatewayTransactionId
  3. Atualiza splitStatus
  4. Se chargeback: cria alerta, notifica admin via Socket
  5. Log estruturado para auditoria
```

---

## 7. Variáveis de Ambiente

### `api/.env`
```env
# Banco
DATABASE_URL=postgresql://user:pass@pgbouncer:5432/foodbio?pgbouncer=true
DIRECT_URL=postgresql://user:pass@db.supabase.co:5432/foodbio

# Redis
REDIS_URL=rediss://default:token@redis.upstash.io:6379

# JWT
JWT_SECRET=<64-char-random-string>
JWT_EXPIRES_IN=7d

# Mercado Pago
MP_MARKETPLACE_TOKEN=<marketplace-access-token>
MP_CLIENT_ID=<oauth-app-id>
MP_CLIENT_SECRET=<oauth-app-secret>
MP_REDIRECT_URI=https://api.foodbio.com.br/api/admin/payment/mp/callback
MP_WEBHOOK_SECRET=<hmac-secret>

# PagBank
PB_API_TOKEN=<pagbank-token>
PB_BASE_URL=https://api.pagseguro.com
PB_WEBHOOK_SECRET=<hmac-secret>

# Criptografia (tokens dos restaurantes)
ENCRYPTION_KEY=<32-bytes-hex>

# App
NODE_ENV=production
PORT=3001
LOG_LEVEL=info
```

### `.env.local` (Next.js)
```env
NEXT_PUBLIC_API_URL=https://api.foodbio.com.br
NEXT_PUBLIC_SOCKET_URL=https://api.foodbio.com.br
NEXT_PUBLIC_MP_PUBLIC_KEY=<mp-public-key>
NEXT_PUBLIC_PB_PUBLIC_KEY=<pb-public-key>
NEXTAUTH_SECRET=<random-string>
NEXTAUTH_URL=https://foodbio.com.br
GOOGLE_CLIENT_ID=<google-oauth-id>
GOOGLE_CLIENT_SECRET=<google-oauth-secret>
```

---

## 8. Lista de Arquivos a Criar — Delegação para Gemini

> **Instrução para Gemini:** Implemente cada arquivo exatamente na ordem das fases.
> - TypeScript estrito (`strict: true`)
> - Zero comentários explicativos de "o que faz" — código autoexplicativo
> - Mensagens de erro em português para o usuário
> - Preserve TODOS os tokens de design: `--color-lime-primary`, `bg-zinc-900`, `rounded-[28px]`
> - Não altere `app/globals.css` nem `lib/data.ts` nem `lib/utils.ts` existentes
> - Não invente bibliotecas — use apenas as listadas na seção 2

---

### FASE 0 — Providers e infraestrutura frontend

#### `components/providers/QueryProvider.tsx`
- Wrapper `QueryClientProvider` do TanStack Query
- `QueryClient` com `staleTime: 30_000`, `retry: 2`
- Deve ser `'use client'`

#### `components/providers/SocketProvider.tsx`
- Context que expõe `socket` (instância socket.io-client) e `connected: boolean`
- Conecta com `auth: { token }` do NextAuth session
- Reconexão automática com backoff exponencial
- `'use client'`

#### `app/layout.tsx` (ATUALIZAR — não recriar)
- Envolver `children` com `QueryProvider` e `SocketProvider`
- Adicionar `<link rel="manifest" href="/manifest.json">`
- Adicionar meta theme-color `#1a1a1a`
- Preservar Inter font, max-w-[414px], bg-gray-100

#### `public/manifest.json`
- `name: "Foodbio"`, `short_name: "Foodbio"`
- `theme_color: "#1a1a1a"`, `background_color: "#F1F9E8"`
- `display: "standalone"`, `orientation: "portrait"`
- `start_url: "/"`
- `icons`: 192×192, 512×512, maskable

#### `next.config.ts` (ATUALIZAR)
- Adicionar `withPWA` (next-pwa)
- Adicionar rewrite: `/bff/:path*` → `${API_URL}/:path*`
- Manter remotePatterns existentes + adicionar Supabase Storage domain
- Manter `output: 'standalone'`

---

### FASE 1 — Estado global (Zustand)

#### `store/cart-store.ts`
Zustand store persistido no localStorage.

Estado:
```typescript
interface CartState {
  items: CartItem[]
  restaurantId: string | null
  restaurantSlug: string | null
}
interface CartItem {
  productId: string
  name: string
  price: number
  quantity: number
  imageUrl: string | null
  selectedOptions: { optionId: string; name: string; price: number }[]
}
```

Actions: `addItem(product, options)`, `removeItem(productId)`, `updateQty(productId, qty)`, `clearCart()`, `setRestaurant(id, slug)`

Regra: se `addItem` com `restaurantId` diferente do atual → lançar erro `"Você já tem itens de outro restaurante no carrinho"`.

Computed (getters): `total: number`, `itemCount: number`, `isEmpty: boolean`

Persistência: `zustand/middleware/persist` com key `'foodbio-cart'`

#### `store/session-store.ts`
Estado não persistido.

```typescript
interface SessionState {
  tenant: { id: string; slug: string; name: string; gateway: string } | null
  setTenant(t): void
  clearTenant(): void
}
```

---

### FASE 2 — Lib (API client e auth)

#### `lib/api-client.ts`
Cliente HTTP sobre `fetch` nativo.

- `baseURL` de `NEXT_PUBLIC_API_URL`
- Função base: `request<T>(path, options): Promise<T>`
- Adiciona `Authorization: Bearer <token>` automaticamente via `getSession()` do NextAuth
- Em erro 401: chama `signOut()` e redirect para `/login`
- Erros HTTP retornam `{ error: string, status: number }` (não lançam exceção)
- Exportar atalhos: `get<T>`, `post<T>`, `patch<T>`, `del<T>`

#### `lib/auth.ts`
Configuração NextAuth v5.

Providers:
- `Google` — scopes: profile, email
- `Credentials` — chama `POST /api/auth/login` no BFF

Callbacks:
- `jwt`: adiciona `role`, `restaurantId`, `accessToken` (JWT do BFF) ao token
- `session`: expõe `role`, `restaurantId` em `session.user`

#### `lib/socket.ts`
Singleton socket.io-client.

- `getSocket()` retorna instância existente ou cria nova
- Conecta em `NEXT_PUBLIC_SOCKET_URL` com `autoConnect: false`
- `connectWithToken(token: string)` — chama `socket.auth = { token }; socket.connect()`
- Exportar tipos de eventos:
  ```typescript
  interface ServerToClientEvents {
    'order:confirmed': (orderId: string) => void
    'order:update': (data: { orderId: string; status: string }) => void
    'order:ready': (orderId: string) => void
    'new_order': (order: OrderSummary) => void
  }
  ```

#### `lib/validations.ts`
Schemas Zod para formulários do frontend.

- `checkoutSchema`: `{ name, phone, deliveryType, address?, paymentMethod }`
- `loginSchema`: `{ email, password }`
- `productSchema`: `{ name, description, price, categoryId, available }`
- `connectMPSchema`: void (OAuth redirect, sem form)
- `connectPBSchema`: `{ email }`

---

### FASE 3 — Hooks React

#### `hooks/use-cart.ts`
Wrapper sobre `cartStore` com lógica de negócio.

- `useCart()` retorna tudo do store +
- `addToCart(product, options)`: lida com conflito de restaurante (modal de confirmação)
- `cartTotal`: subtotal + delivery fee
- `deliveryFee`: calculada por distância (placeholder: valor fixo do restaurante)

#### `hooks/use-socket.ts`
Conecta ao Socket.io na montagem, desconecta na desmontagem.

```typescript
function useSocket(room?: string) {
  // join room on connect, leave on unmount
  return { socket, connected, on, emit }
}
```

Tipagem com os eventos de `lib/socket.ts`.

#### `hooks/use-orders.ts`
TanStack Query + mutations para pedidos.

- `useOrder(id)` — query com refetch a cada 30s (fallback se socket não conectar)
- `useCreateOrder()` — mutation que cria pedido
- `usePayOrder()` — mutation que enfileira pagamento
- Invalidar `useOrder` ao receber evento `order:update` via socket

#### `hooks/use-payment.ts`
Gerencia estado do checkout de pagamento.

- `loadMPScript()`: carrega `MercadoPago.js` via `<script>` dinâmico
- `loadPBScript()`: carrega `PagSeguro.js`
- `tokenizeCard(formData, gateway)`: chama SDK correto, retorna token
- `generatePixQR(orderId)`: busca QR code Pix gerado pelo BFF

---

### FASE 4 — Componentes UI Base

> Preservar o design system da aplicação. Todas as classes devem usar as variáveis de `globals.css` e as classes Tailwind já utilizadas no projeto.

#### `components/ui/Button.tsx`
Variantes (use `class-variance-authority` — já instalado):
- `primary`: `bg-[var(--color-lime-primary)] text-black font-bold`
- `dark`: `bg-[var(--color-app-dark)] text-white` (estilo do botão Checkout existente)
- `ghost`: borda, sem fundo
- `danger`: vermelho

States: `loading` (spinner inline), `disabled` (opacity-50)
Tamanhos: `sm`, `md` (padrão), `lg`

#### `components/ui/Input.tsx`
- Estilo: `bg-white rounded-[20px] py-4 px-4 text-sm` (igual ao search input existente)
- Props: `label`, `error`, `icon` (lucide)
- Estado de erro: borda vermelha + mensagem abaixo

#### `components/ui/Modal.tsx`
- Overlay escuro com blur
- Card `rounded-[28px]` (consistente com cards do projeto)
- Foco trap (acessibilidade)
- Fecha com ESC ou clique no overlay
- Animação de entrada com `motion` (já instalado)

#### `components/ui/Drawer.tsx`
- Slide-in de baixo para cima (mobile) ou da direita (desktop)
- Drag handle visual no topo
- Backdrop com blur

#### `components/ui/Badge.tsx`
Mapa de cores para `OrderStatus`:
- `pending` → amarelo
- `confirmed` → azul
- `preparing` → laranja
- `ready` → verde claro
- `dispatched` → roxo
- `delivered` → verde escuro
- `cancelled` → vermelho

---

### FASE 5 — Refactor das Pages Existentes

#### `components/ecommerce/HomeHeader.tsx`
**EXTRAIR** de `app/page.tsx` (linhas 10–80): o header `bg-zinc-900` com localização, hero card de desconto e barra de busca.

Props: `restaurantName: string`, `restaurantLogo?: string`, `onSearch: (q: string) => void`

Manter exatamente o design: `rounded-b-[40px]`, hero card com produto, lime primary.

#### `components/ecommerce/CategoryBar.tsx`
**EXTRAIR** de `app/page.tsx` (linhas 82–120): scroll horizontal de categorias.

Props: `categories: { id, name, iconUrl? }[]`, `active: string`, `onSelect: (id) => void`

Estilo preservado: `w-[66px] h-[66px] rounded-[22px]`, active com `bg-[var(--color-lime-primary)]`.

#### `components/ecommerce/MenuCard.tsx`
**EXTRAIR** de `app/page.tsx` (linhas 122–180): card de produto da grid.

Props: `product: Product`, `onAdd: (product) => void`

Estilo preservado: `rounded-[28px]`, aspect-square image, preço bold, botão `+` lime.

Adicionar: estado `loading` no botão enquanto adiciona; indicador "Indisponível".

#### `components/ecommerce/CartItem.tsx`
**EXTRAIR** de `app/cart/page.tsx` (linhas 97–175): item individual do carrinho.

Props: `item: CartItem`, `onRemove: () => void`, `onChangeQty: (qty: number) => void`

Estilo preservado: `rounded-[28px]`, checkbox negro, controls com `bg-[#bef264]`.

Conectar: ao clicar em `+` ou `-` → `cartStore.updateQty()`

#### `components/ecommerce/CartFooter.tsx`
**EXTRAIR** de `app/cart/page.tsx` (linhas 200–240): footer sticky com totais e botão Checkout.

Props: `subtotal: number`, `deliveryFee: number`, `discount: number`, `onCheckout: () => void`

Estilo preservado: `rounded-t-[40px]`, totais em cinza/preto/lime.

#### `components/ecommerce/ProductDetail.tsx`
**EXTRAIR** de `app/details/page.tsx`: conteúdo do produto.

Props: `product: Product`, `onAddToCart: (options) => void`

Adicionar: seleção real de opcionais (OptionGroup/Option), quantidade, total dinâmico.

Estilo preservado: imagem redonda com `rounded-full`, badges de info, footer com Add to cart.

#### `app/(public)/[slug]/page.tsx` (NOVO — substitui `app/page.tsx`)
```typescript
// generateStaticParams → slugs de restaurantes ativos
// revalidate = 60 (ISR)
// Fetch: GET /bff/client/menu/:slug
// Renderiza: HomeHeader + CategoryBar + grid de MenuCard
// Estado: categoriaAtiva, busca, carrinho via Zustand
```

#### `app/(public)/[slug]/cart/page.tsx` (REFACTOR de `app/cart/page.tsx`)
Conectar ao cartStore real:
- Mapear `cartStore.items` para `CartItem` components
- Calcular totais via `cartStore.total`
- Botão Checkout → navega para `/{slug}/checkout`
- Preservar todo o design existente

#### `app/(public)/[slug]/details/[id]/page.tsx` (REFACTOR de `app/details/page.tsx`)
- Fetch: `GET /bff/client/products/:id`
- Renderiza `ProductDetail` component
- "Add to cart" → `cartStore.addItem()`

#### `app/(public)/[slug]/checkout/page.tsx` (NOVO)
- Auth guard: se não logado, redirect para `/login?callbackUrl=...`
- Renderiza `CheckoutForm`
- On success: redirect para `/{slug}/pedido/:orderId`

#### `app/(public)/[slug]/pedido/[id]/page.tsx` (NOVO)
- Renderiza `OrderTracker`
- Socket room: `order:{id}`
- Fallback polling a cada 30s se socket offline

---

### FASE 6 — Checkout e Pagamento (Frontend)

#### `components/ecommerce/CheckoutForm.tsx`
Formulário de checkout com React Hook Form + Zod (`checkoutSchema`).

Seções:
1. **Tipo de pedido**: "Entrega" ou "Retirada" (radio, estilo pill com lime active)
2. **Endereço** (condicional se entrega): input de endereço
3. **Método de pagamento**: tabs "Pix" / "Cartão de Crédito"
4. Renderiza `PaymentFormMP` ou `PaymentFormPB` dependendo do gateway do restaurante
5. Botão "Confirmar Pedido" → `useCreateOrder` → `usePayOrder`

Estilo: consistente com o design existente — `rounded-[28px]` para seções, lime para selecionado.

#### `components/ecommerce/PaymentFormMP.tsx`
- Carrega `MercadoPago.js` via `useEffect` + `<script>` (apenas uma vez)
- Renderiza campos via `mp.fields.create('cardNumber', { style: {...} })` (iframes PCI)
- Cores dos campos: consistentes com Input.tsx
- Exibe QR Pix se método = Pix (imagem base64 + código copia-e-cola)
- Expõe `getToken(): Promise<string>` para o `CheckoutForm`

#### `components/ecommerce/PaymentFormPB.tsx`
- Equivalente para PagBank com `PagSeguro.encryptCard()`
- Mesma interface de props que `PaymentFormMP`

#### `components/ecommerce/OrderTracker.tsx`
Timeline de status do pedido.

- Conecta ao socket room `order:{orderId}`
- Steps visuais: Confirmado → Preparando → Saiu para Entrega → Entregue
- Cada step tem ícone, label e timestamp
- Step atual em `bg-[var(--color-lime-primary)]`, futuros em cinza
- Animação de transição com `motion`
- Seção "Entregador": nome + veículo (quando dispatched)
- Fallback: polling via `useOrder` a cada 30s

---

### FASE 7 — BFF (Backend)

#### `api/package.json`
```json
{
  "name": "foodbio-api",
  "scripts": {
    "dev": "tsx watch src/server.ts",
    "build": "tsc",
    "start": "node dist/server.js",
    "worker:payment": "tsx src/queue/payment.worker.ts",
    "worker:webhook": "tsx src/queue/webhook.worker.ts",
    "db:push": "prisma db push",
    "db:migrate": "prisma migrate deploy"
  }
}
```

Deps: fastify, @fastify/jwt, @fastify/cors, @fastify/helmet, @fastify/rate-limit, prisma, @prisma/client, ioredis, bullmq, socket.io, @socket.io/redis-adapter, mercadopago, argon2, pino, zod, tsx (dev), typescript (dev)

#### `api/src/lib/redis.ts`
- Singleton `ioredis` com `lazyConnect: true`, `maxRetriesPerRequest: 3`
- Exports: `redis` (instância principal), `getRedis()` (getter seguro)
- `redis.on('error', logger.error)` — não crasha o processo

#### `api/src/lib/prisma.ts`
- Singleton PrismaClient
- Em desenvolvimento: evitar múltiplas instâncias em hot-reload
- Middleware de tenant safety (descrito em 5.2.6)
- `log: ['error', 'warn']`

#### `api/src/lib/logger.ts`
- Pino com `level: process.env.LOG_LEVEL ?? 'info'`
- Serializer: `req` (método + url + tenant), `err` (stack sem dados sensíveis)
- Redact: `['body.token', 'body.cardNumber', 'body.cvv', '*.accessToken']`

#### `api/src/server.ts`
Bootstrap Fastify:

1. Instanciar Fastify com `logger: pinoLogger`
2. Register plugins na ordem: helmet → cors → jwt → rate-limit
3. Decorar `request.user` e `request.tenant`
4. Montar rotas: health, auth, client, admin, store, kitchen, delivery, webhooks
5. Integrar Socket.io ao `server.server` (HTTP nativo do Fastify)
6. Graceful shutdown: SIGTERM → fechar fila → fechar socket → fechar Prisma → fechar servidor

#### `api/src/socket.ts`
- Setup Socket.io com Redis adapter (para 3 instâncias)
- Middleware de auth: verifica JWT no `socket.handshake.auth.token`
- Decorar `socket.data.user` e `socket.data.restaurantId`
- `getIO()`: retorna instância global

#### `api/src/queue/index.ts`
- Instanciar filas BullMQ com Redis
- Exportar: `paymentQueue`, `webhookQueue`, `notificationQueue`
- Config padrão: 3 retries, backoff exponencial, TTL de jobs

#### `api/src/queue/payment.worker.ts`
Worker da fila de pagamento. **Processo separado.**

Loop:
1. Recebe job `{ orderId, token, gateway }`
2. Busca Order + TenantPaymentAccount
3. Valida que paymentStatus ainda é `pending`
4. Chama `split.service.process()`
5. Em sucesso: `socket.emit(orderId, 'order:confirmed')`
6. Em falha: `socket.emit(orderId, 'order:payment-failed', { message })`
7. Log de cada tentativa

#### `api/src/queue/webhook.worker.ts`
Worker de webhooks. **Processo separado.**

Processa eventos dos gateways assincronamente:
- `payment.approved` → atualiza splitStatus para "done"
- `payment.refunded` → cria refund, atualiza PaymentTransaction
- `chargeback` → alerta admin via socket admin:{restaurantId}

#### `api/src/services/cache.service.ts`
- `getMenu(restaurantId)` → Redis first, PostgreSQL fallback, TTL 60s
- `invalidateMenu(restaurantId)` → `redis.del(key)`
- `getTenant(slug)` → cache de dados do restaurante, TTL 5min
- `setSession(userId, data, ttl)` → cache de sessão JWT
- `getSession(userId)` → verifica cache antes do DB

#### `api/src/services/tenant.service.ts`
- `resolve(slugOrId: string)` → busca restaurante + conta de pagamento (cache 5min)
- `getPaymentAccount(restaurantId)` → `TenantPaymentAccount` + decrypt token
- `updateOnboardingStatus(restaurantId, status)`

#### `api/src/services/mercadopago.service.ts`
- `createOrder(params: MPOrderParams)` → POST `https://api.mercadopago.com/v1/orders`
  - `processing_mode: "aggregator"`, `marketplace_fee`
  - Timeout: 25s, retry: 2×
- `exchangeCode(code)` → troca OAuth code por access_token
- `generatePixQR(orderId, amount)` → retorna `{ qrCode: string, qrCodeBase64: string }`
- `validateWebhookSignature(signature, payload)` → HMAC-SHA256 com `MP_WEBHOOK_SECRET`
- Log: request sem PAN, response sem token

#### `api/src/services/pagbank.service.ts`
- `createOrder(params: PBOrderParams)` → POST `https://api.pagseguro.com/orders`
  - `charges[].split.receivers`
- `linkAccount(email, restaurantId)` → vincula conta
- `generatePixQR(amount, orderId)` → QR Pix PagBank
- `validateWebhookSignature(signature, payload)`

#### `api/src/services/split.service.ts`
Orquestrador de pagamento. Núcleo do negócio.

```typescript
async function process(orderId: string, token: string, gateway: string) {
  // 1. Busca Order + TenantPaymentAccount
  // 2. Calcula marketplaceFee = total * commissionPercent / 100
  // 3. Calcula sellerAmount = total - marketplaceFee
  // 4. Monta payload gateway
  // 5. Chama MP ou PagBank service
  // 6. Salva PaymentTransaction
  // 7. Atualiza Order(paymentStatus, status)
  // 8. Invalida cache de métricas do restaurante
}
```

Testes obrigatórios (TDD):
- Cálculo correto de comissão (8%)
- Falha graceful se TenantPaymentAccount não existe
- Retry em timeout do gateway
- Não processar pedido já pago (idempotência)

#### `api/src/services/socket.service.ts`
- `emitToOrder(orderId, event, data)` → `getIO().to(\`order:${orderId}\`).emit(...)`
- `emitToKitchen(restaurantId, event, data)`
- `emitToAdmin(restaurantId, event, data)`
- `emitToDrivers(restaurantId, event, data)`

#### `api/src/middlewares/auth.middleware.ts`
Hook `preHandler` do Fastify:
- Extrai `Bearer <token>` do header Authorization
- Verifica via `@fastify/jwt`
- Decora `request.user = { id, email, role, restaurantId }`
- 401 se token inválido/expirado
- Exportar: `requireAuth`, `requireRole(...roles)`, `requireAdmin`, `requireTenantStaff`

#### `api/src/middlewares/tenant.middleware.ts`
- Resolve restaurante do `request.user.restaurantId` ou param `:slug`
- Decora `request.tenant = Restaurant`
- 404 se restaurante não encontrado ou inativo
- Cache via `tenant.service.resolve()`

#### `api/src/middlewares/rate-limit.middleware.ts`
Configurações por rota:
```typescript
const limits = {
  '/api/client/orders': { max: 30, timeWindow: '1 minute' },
  '/api/client/orders/:id/pay': { max: 10, timeWindow: '1 minute' },
  '/api/client/menu/:slug': { max: 200, timeWindow: '1 minute' },
  '/api/admin/*': { max: 100, timeWindow: '1 minute' },
}
```
Key: `tenant:${restaurantId}` ou IP para rotas públicas.

#### `api/src/controllers/auth.controller.ts`
- `POST /api/auth/login` → verifica credenciais, retorna JWT
- `POST /api/auth/refresh` → troca refresh token
- `POST /api/auth/logout` → invalida sessão Redis

#### `api/src/controllers/menu.controller.ts`
- `GET /api/client/menu/:slug` → `cache.getMenu()` + dados do restaurante
- `POST /api/admin/menu/categories` → cria categoria
- `PATCH /api/admin/menu/categories/:id` → atualiza
- `DELETE /api/admin/menu/categories/:id` → remove se sem produtos
- `POST /api/admin/menu/products` → cria produto, faz upload de imagem para Supabase Storage
- `PATCH /api/admin/menu/products/:id` → atualiza, invalida `cache.invalidateMenu()`
- `PATCH /api/admin/menu/products/:id/toggle` → toggle available, invalida cache

#### `api/src/controllers/order.controller.ts`
- `POST /api/client/orders` → cria Order + OrderItems, valida itens do restaurante
- `POST /api/client/orders/:id/pay` → enfileira job pagamento, retorna 202
- `GET /api/client/orders/:id` → retorna Order com status (sem dados sensíveis)
- `GET /api/admin/orders` → lista pedidos do tenant (paginado, filtrado por status)
- `PATCH /api/kitchen/orders/:id/start` → status=preparing + socket emit
- `PATCH /api/kitchen/orders/:id/ready` → status=ready + socket emit
- `PATCH /api/admin/orders/:id/cancel` → cancela com razão

#### `api/src/controllers/payment.controller.ts`
- `GET /api/admin/payment/status` → status da conta gateway do tenant
- `GET /api/admin/payment/mp/authorize` → gera URL OAuth MP, retorna ao frontend
- `GET /api/admin/payment/mp/callback?code=` → troca code, salva token, redirect
- `POST /api/admin/payment/pb/connect` → vincula conta PagBank
- `POST /api/webhooks/payment/mercadopago` → valida HMAC, enfileira job
- `POST /api/webhooks/payment/pagbank` → valida HMAC, enfileira job

#### `api/src/controllers/delivery.controller.ts`
- `GET /api/delivery/available` → pedidos prontos sem entregador (por restaurantId do driver)
- `POST /api/delivery/orders/:id/accept` → atribui driver
- `POST /api/delivery/orders/:id/pickup` → registra coleta
- `POST /api/delivery/orders/:id/deliver` → confirma entrega

#### `api/src/controllers/report.controller.ts`
- `GET /api/admin/reports/sales?from=&to=` → total, ticket médio, top 10 produtos
- `GET /api/admin/reports/split?from=&to=` → lista PaymentTransactions com split breakdown
- `GET /api/admin/reports/summary` → métricas do dia atual (cached 5min)

Usar Read Replica para queries de relatório (configurado no `prisma.ts`).

#### `api/src/routes/*.routes.ts`
Cada arquivo registra o plugin Fastify com prefixo de rota, aplica middlewares e mapeia para controllers.

```typescript
// Padrão de cada arquivo:
export default async function routes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', requireAuth)
  fastify.addHook('preHandler', requireTenantStaff)

  fastify.get('/orders', { config: { rateLimit: limits.admin } }, orderController.list)
  // ...
}
```

#### `api/src/routes/health.routes.ts`
- `GET /health` → `{ status: "ok", uptime, version, db: "ok"|"degraded" }`
- Verifica conexão Prisma e Redis no handler
- Sem auth, sem rate limit
- Usado pelo load balancer para health checks

#### `api/Dockerfile`
```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json prisma/ ./
RUN npm ci
COPY src/ ./src/
RUN npx tsc

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma
EXPOSE 3001
HEALTHCHECK --interval=30s --timeout=10s CMD wget -qO- http://localhost:3001/health || exit 1
CMD ["node", "dist/server.js"]
```

---

### FASE 8 — Admin Dashboard (Frontend)

#### `app/(admin)/layout.tsx`
- Verificar sessão: `role` deve ser `admin` ou `attendant` → redirect para `/login` se não
- Sidebar esquerda (desktop) com links de navegação:
  - Dashboard, Cardápio, Pedidos, Financeiro, Relatórios, Configurações
- Estilo sidebar: `bg-zinc-900 text-white`, links ativos com `text-[var(--color-lime-primary)]`
- Mobile: bottom nav flutuante (mesmo padrão do e-commerce)

#### `components/admin/MetricsCard.tsx`
Card de métrica: ícone + label + valor + variação (%).

Estilo: `bg-white rounded-[28px] p-6 shadow-sm border border-black/5` (consistente com produto cards)

#### `app/(admin)/dashboard/page.tsx`
- Fetch: `GET /bff/admin/reports/summary` via React Query
- Socket room: `admin:{restaurantId}` → atualiza pedidos em tempo real
- Exibe: pedidos hoje, faturamento, ticket médio, status da conta gateway
- Lista dos últimos 10 pedidos com badges de status

#### `app/(admin)/financeiro/conectar/page.tsx`
- Dois cards: Mercado Pago e PagBank
- MP: botão "Autorizar com Mercado Pago" → chama `/bff/admin/payment/mp/authorize` → redirect OAuth
- PB: formulário com email → POST `/bff/admin/payment/pb/connect`

---

### FASE 9 — KDS, PDV e Entregador

#### `components/kitchen/KDSCard.tsx`
Card de pedido para cozinha:
- Cabeçalho: número do pedido + tempo decorrido (contador em tempo real)
- Lista de itens com observações
- Cor de borda dinâmica: verde (< 10min) → amarelo (10-20min) → vermelho (> 20min)
- Botões: "Iniciar Preparo" / "Marcar Pronto"
- Estilo: `rounded-[28px]`, shadow, consistent com cards do projeto

#### `components/kitchen/KDSBoard.tsx`
- Colunas: Aguardando | Preparando | Prontos
- Recebe pedidos via `GET /bff/kitchen/orders` + Socket room `kitchen:{restaurantId}`
- Alerta sonoro em novos pedidos: `new Audio('/sounds/bell.mp3').play()`
- Reordenação manual via drag-and-drop (@dnd-kit — adicionar como dep)

#### `app/(cozinha)/cozinha/page.tsx`
- Auth: role `cook`
- Renderiza KDSBoard
- Join Socket room `kitchen:{restaurantId}`

#### `components/pdv/POSProductGrid.tsx`
Grid de produtos com busca inline. Click → adiciona ao `cartStore`.
Desktop: 4 colunas. Tablet: 3 colunas. Estilo: cards menores que o e-commerce.

#### `components/pdv/POSCart.tsx`
- Lista de itens (sem imagem — versão condensada)
- Formas de pagamento: Dinheiro / Pix (QR gerado pelo BFF) / Cartão (leitura externa)
- Botão "Finalizar" → `POST /bff/store/orders` com `type: "in_store"`

#### `app/(pdv)/pdv/page.tsx`
Layout split 60/40: POSProductGrid + POSCart

#### `app/(entregador)/entregas/page.tsx`
- Auth: role `driver`
- Lista corridas disponíveis (Socket + query)
- `DeliveryCard` com botão "Aceitar"

#### `app/(entregador)/entregas/[id]/page.tsx`
- Corrida ativa: endereço, mapa (link Google Maps), botões de confirmação

---

### FASE 10 — Testes Críticos

#### `api/src/services/__tests__/split.service.test.ts`
TDD com Vitest:
1. `processSplit` calcula corretamente 8% de comissão
2. Falha graceful: TenantPaymentAccount não existe → erro descritivo
3. Idempotência: segundo `processSplit` no mesmo `orderId` → retorna transação existente sem chamar gateway
4. Falha do gateway → rollback de Order para `paymentStatus=failed`
5. Mock de `mercadopago.service` e `pagbank.service`

#### `api/src/queue/__tests__/payment.worker.test.ts`
1. Job processado com sucesso → socket emitido, DB atualizado
2. Retry em timeout do gateway (mock: 2 falhas + 1 sucesso)
3. Job falha após 3 tentativas → log de erro, Order marcado como failed

---

### FASE 11 — Deploy e CI/CD

#### `.github/workflows/ci.yml`
```yaml
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - run: npm ci
      - run: npm run lint
      - run: cd api && npm ci && npm test
      - run: npm run build
  deploy-frontend:
    needs: test
    if: github.ref == 'refs/heads/main'
    # Vercel deploy via webhook
  deploy-api:
    needs: test
    if: github.ref == 'refs/heads/main'
    # Fly.io deploy via flyctl
```

#### `fly.toml`
```toml
app = "foodbio-api"
primary_region = "gru"

[build]
  dockerfile = "api/Dockerfile"

[http_service]
  internal_port = 3001
  force_https = true
  auto_stop_machines = true
  auto_start_machines = true
  min_machines_running = 2  # mínimo 2 em produção

[[vm]]
  memory = "512mb"
  cpu_kind = "shared"
  cpus = 1

[checks]
  [checks.health]
    grace_period = "10s"
    interval = "30s"
    method = "get"
    path = "/health"
    timeout = "5s"
```

---

## 9. Checklist de Segurança

- [ ] Dados de cartão NUNCA passam pelos servidores Foodbio (tokenização apenas no browser)
- [ ] `access_token` dos gateways criptografado com AES-256-GCM antes de salvar no banco
- [ ] Chave de criptografia em variável de ambiente, nunca no código
- [ ] Webhooks validados por HMAC antes de qualquer processamento
- [ ] Rate limiting por tenant em todas as rotas críticas
- [ ] JWT com expiração curta (7d) + refresh token
- [ ] CORS configurado apenas para domínios Foodbio
- [ ] Headers de segurança via `@fastify/helmet`
- [ ] Inputs validados com Zod antes de tocar o banco
- [ ] Logs redact PAN, tokens, senhas
- [ ] LGPD: `DELETE /api/client/account` exclui todos os dados pessoais
- [ ] Middleware de tenant safety no Prisma impede query cross-tenant
- [ ] Idempotência no processamento de pagamento (não cobrar duas vezes)

---

## 10. Ordem de Implementação

```
Sprint 1 — Semana 1–2: Fundação
  FASE 0 (Providers) + FASE 1 (Zustand) + FASE 2 (lib)
  Resultado: frontend pode gerenciar estado e autenticar

Sprint 2 — Semana 3–4: BFF Core
  FASE 7 parcial: server, auth, menu controller, health
  Resultado: API funcionando com autenticação e cardápio

Sprint 3 — Semana 5–6: E-commerce + Pagamento
  FASE 3 (hooks) + FASE 4 (UI) + FASE 5 (refactor pages) + FASE 6 (checkout)
  FASE 7 completa: split service + payment controllers
  Resultado: fluxo completo de pedido + pagamento funcional

Sprint 4 — Semana 7–8: Módulos Operacionais
  FASE 9: KDS + PDV + Entregador
  Resultado: operação do restaurante em tempo real

Sprint 5 — Semana 9–10: Admin + Escala
  FASE 8: Dashboard admin
  BullMQ workers + Redis caching
  PgBouncer config
  Resultado: dashboard funcional + arquitetura pronta para 1000+ tenants

Sprint 6 — Semana 11–12: Testes + Deploy
  FASE 10 + FASE 11
  Testes de carga com k6 (simular 100 restaurantes × 10 pedidos/min)
  Resultado: sistema em produção
```

---

## 11. Referências Técnicas

- Mercado Pago Marketplace/Aggregator: `developers.mercadopago.com.br/pt/docs/marketplace`
- PagBank Orders API com Split: `dev.pagbank.uol.com.br/reference/split`
- Socket.io Redis Adapter: `socket.io/docs/v4/redis-adapter`
- BullMQ: `docs.bullmq.io`
- PgBouncer com Prisma: `prisma.io/docs/guides/performance-and-optimization/connection-management`
- Fastify Rate Limit: `github.com/fastify/fastify-rate-limit`
- Next.js ISR: `nextjs.org/docs/app/building-your-application/data-fetching/incremental-static-regeneration`
