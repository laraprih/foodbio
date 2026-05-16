# Foodbio

Plataforma SaaS multi-tenant para restaurantes e delivery. Cada estabelecimento recebe uma vitrine white-label, painel de gestão, KDS de cozinha e app de entregador — com pagamentos via PIX e cartão processados diretamente no gateway do restaurante usando split automático.

---

## Visão Geral

```
Cliente final  →  /[slug]          Vitrine + carrinho + checkout
Admin          →  /dashboard       Pedidos, cardápio, financeiro, relatórios
Cozinha        →  /cozinha         KDS (Kitchen Display System) em tempo real
Entregador     →  /entregas        App de coleta e entrega
PDV            →  /pdv             Venda rápida no balcão
Superadmin     →  /superadmin      Gestão de tenants e assinaturas
```

---

## Stack

| Camada | Tecnologia |
|---|---|
| Frontend | Next.js 15 (App Router · SSR) · React 19 · Tailwind CSS v4 |
| Backend API | Fastify · Prisma ORM · BullMQ |
| Banco de dados | PostgreSQL (Neon) |
| Cache / Filas | Redis |
| Pagamentos | Mercado Pago · PagBank (split automático) |
| Real-time | Socket.IO |
| Autenticação | NextAuth.js v5 (JWT strategy · Facebook OAuth) |
| Storage | Cloudinary (imagens) |
| Deploy | Vercel (frontend) · Fly.io (API) |

---

## Pré-requisitos

- Node.js 20+
- Redis rodando localmente (`redis-server`) ou via Docker
- PostgreSQL acessível (Neon ou local)
- Conta Mercado Pago (para pagamentos)

---

## Instalação

### 1. Clone e instale as dependências

```bash
git clone https://github.com/seu-usuario/foodbio.git
cd foodbio

# Frontend (Next.js)
npm install

# Backend (Fastify)
cd api && npm install && cd ..
```

### 2. Configure as variáveis de ambiente

**Frontend — `.env.local`**

```env
# NextAuth
AUTH_SECRET=                        # openssl rand -base64 32

# URL do backend Fastify
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_SOCKET_URL=http://localhost:3001

# Mercado Pago — chave pública (tokenização no browser)
NEXT_PUBLIC_MP_PUBLIC_KEY=APP_USR-...

# Mercado Pago — webhook
MP_WEBHOOK_SECRET=

# Segredo compartilhado para o Next.js chamar o Fastify internamente (não exposto ao browser)
INTERNAL_SECRET=

# Facebook OAuth (opcional)
FACEBOOK_APP_ID=
FACEBOOK_APP_SECRET=

# Banco de dados (acesso direto para rotas Next.js)
DATABASE_URL=postgresql://user:pass@host/db?sslmode=require

# Cloudinary (storage de imagens)
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_UPLOAD_PRESET=
```

**Backend — `api/.env`**

```env
DATABASE_URL=postgresql://user:pass@host/db?sslmode=require
DIRECT_URL=postgresql://user:pass@host/db?sslmode=require
REDIS_URL=redis://localhost:6379
JWT_SECRET=                         # mínimo 32 caracteres aleatórios
INTERNAL_SECRET=                    # mesmo valor do INTERNAL_SECRET do frontend
PORT=3001

# Mercado Pago — token da plataforma (marketplace)
MP_ACCESS_TOKEN=APP_USR-...
MP_PUBLIC_KEY=APP_USR-...
MP_CLIENT_ID=
MP_CLIENT_SECRET=
MP_REDIRECT_URI=http://localhost:3001/api/admin/payment/mp/callback
MP_WEBHOOK_SECRET=

# PagBank
PB_API_TOKEN=
PB_WEBHOOK_SECRET=

# Frontend (para CORS e uploads)
FRONTEND_URL=http://localhost:3000
```

### 3. Execute as migrations

```bash
cd api
npx prisma migrate deploy
npx prisma db seed       # dados iniciais (opcional)
```

### 4. Inicie os servidores

Em terminais separados:

```bash
# Backend Fastify (porta 3001)
cd api && npm run dev

# Frontend Next.js (porta 3000)
npm run dev
```

Acesse `http://localhost:3000`.

---

## Estrutura do Projeto

```
foodbio/
├── app/                        # Next.js App Router
│   ├── (admin)/                # Painel do restaurante
│   │   ├── dashboard/
│   │   ├── pedidos/
│   │   ├── cardapio/
│   │   ├── financeiro/
│   │   ├── relatorios/
│   │   └── configuracoes/
│   ├── (public)/[slug]/        # Vitrine do cliente (multi-tenant)
│   │   ├── page.tsx            # Cardápio (SSR)
│   │   ├── cart/
│   │   ├── checkout/
│   │   └── pedido/[id]/        # Acompanhamento do pedido
│   ├── (cozinha)/cozinha/      # KDS
│   ├── (entregador)/entregas/  # App do entregador
│   ├── (pdv)/pdv/              # Ponto de venda
│   ├── (superadmin)/           # Painel master
│   └── api/                    # Route Handlers Next.js
│       ├── admin/              # CRUD cardápio, pedidos, tenant
│       ├── store/              # Criação de pedidos, consulta
│       ├── superadmin/         # Gestão de tenants
│       └── webhooks/           # Callbacks de pagamento
│
├── api/                        # Backend Fastify (porta 3001)
│   ├── src/
│   │   ├── controllers/        # Lógica de negócio
│   │   ├── routes/             # Registro de rotas
│   │   ├── services/           # Integrações (MP, PagBank, Socket, Cache)
│   │   ├── middlewares/        # Auth, rate limit, tenant
│   │   ├── queue/              # Workers BullMQ (payment, notification, webhook)
│   │   └── lib/                # Prisma, Redis, Logger
│   └── prisma/
│       ├── schema.prisma
│       └── migrations/
│
├── components/
│   ├── admin/                  # OrderDetailModal, MetricsCard, OrderList
│   ├── ecommerce/              # MenuCard, CheckoutForm, OrderTracker, etc.
│   ├── kitchen/                # KDSBoard, KDSCard
│   ├── delivery/               # DeliveryCard
│   ├── providers/              # Auth, Query, Socket providers
│   └── ui/                     # Button, Modal, Input, Badge, Skeleton, etc.
│
├── hooks/                      # use-cart, use-orders, use-payment, use-socket
├── store/                      # Zustand (cart-store, session-store)
├── lib/                        # api-client, auth, db, validations, utils
└── types/                      # Tipos TypeScript compartilhados
```

---

## Modelo de Dados

```
Tenant  ──< User         (admin, attendant, cook, driver, customer)
        ──< Category ──< Product ──< OptionGroup ──< Option
        ──< Order    ──< OrderItem ──< OrderItemOption
        ──  TenantPaymentAccount

Order ──  Delivery ── Driver
      ──  PaymentTransaction
```

**Fluxo de status do pedido:**
```
pending → confirmed → preparing → ready → dispatched → delivered
       ↘                                             ↗
         cancelled (em qualquer etapa antes de ready)
```

---

## Pagamentos e Split

O Foodbio atua como marketplace. Ao processar um pagamento, a plataforma cobra a transação inteira e divide automaticamente:

- **Restaurante** recebe o valor líquido (ex.: 92%)
- **Plataforma** retém a comissão configurada (ex.: 8%)

Suporte a dois gateways:

| Gateway | PIX | Cartão | Split | OAuth |
|---|---|---|---|---|
| Mercado Pago | ✓ | ✓ | Aggregator mode | ✓ |
| PagBank | ✓ | ✓ | Receiver percent | — |

Webhooks processados de forma assíncrona via BullMQ para garantir idempotência e retentativas.

---

## Autenticação e Roles

| Role | Acesso |
|---|---|
| `superadmin` | Painel master — gerencia todos os tenants |
| `admin` | Painel do restaurante — pedidos, cardápio, financeiro |
| `attendant` | Pedidos e KDS (sem acesso financeiro) |
| `cook` | KDS apenas |
| `driver` | App de entregas |
| `customer` | Vitrine pública do restaurante |

---

## Scripts Disponíveis

```bash
# Frontend
npm run dev          # Inicia em modo desenvolvimento
npm run build        # Build de produção
npm run start        # Inicia build de produção
npm run lint         # ESLint

# Backend (dentro de api/)
npm run dev          # tsx watch src/server.ts
npm run build        # tsc
npm run start        # node dist/server.js

# Prisma (dentro de api/)
npx prisma studio    # Interface visual do banco
npx prisma migrate dev --name <nome>
npx prisma generate
```

---

## Deploy

### Frontend — Vercel

```bash
vercel --prod
```

Variáveis de ambiente configuradas no painel da Vercel.

### Backend — Fly.io

```bash
cd api
fly deploy
```

Configuração em `fly.toml`. Redis provisionado via `fly redis create`.

---

## Configuração do Webhook Mercado Pago

No painel de desenvolvedor do Mercado Pago, configure a URL de notificação:

```
https://seu-dominio.com/api/webhooks/mercadopago
```

Eventos necessários: `payment`

---

## Licença

Proprietário — todos os direitos reservados.
