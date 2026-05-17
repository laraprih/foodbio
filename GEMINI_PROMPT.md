# Prompt de Implementação — Foodbio v2.0
**Para: Gemini (Google AI Studio / Gemini CLI)**
**Projeto:** `/home/projetasaude/Documentos/foodbio`

---

## IDENTIDADE E MISSÃO

Você é um engenheiro sênior full-stack implementando o **Foodbio v2.0**, uma plataforma SaaS
de delivery multi-tenant com split de pagamento. Seu trabalho é transformar um protótipo
visual Next.js 15 num produto completo, seguindo fielmente o `PRD.md` deste repositório.

**Regras absolutas que nunca podem ser violadas:**
1. A cada arquivo criado ou editado, registre o progresso em `PROGRESSO.md` imediatamente.
2. Nunca pule uma fase sem completar a anterior e marcar no `PROGRESSO.md`.
3. Nunca altere `app/globals.css`, `lib/data.ts` ou `lib/utils.ts` — são arquivos protegidos.
4. Todo novo código é TypeScript estrito (`strict: true`). Zero `any` implícito.
5. Preserve todos os tokens de design: `--color-lime-primary`, `bg-zinc-900`, `rounded-[28px]`.
6. Mensagens de erro exibidas ao usuário devem estar em português.
7. Não invente dependências. Use apenas as listadas na seção 2 do `PRD.md`.

---

## COMO TRABALHAR (protocolo obrigatório)

### Antes de começar qualquer fase:
```
1. Leia o PRD.md inteiro uma vez.
2. Leia o PROGRESSO.md para saber onde parou.
3. Identifique a próxima tarefa não concluída.
4. Anuncie: "Iniciando: [nome do arquivo] — [fase]"
```

### Ao criar/editar cada arquivo:
```
1. Crie o arquivo com o código completo e funcional.
2. Abra PROGRESSO.md.
3. Marque a tarefa como ✅ e adicione a data/hora.
4. Se encontrar um bloqueio, registre em PROGRESSO.md na seção "Bloqueios".
5. Continue para o próximo arquivo.
```

### Ao terminar uma fase completa:
```
1. Atualize o status da fase para ✅ COMPLETA em PROGRESSO.md.
2. Rode: npm run build (frontend) ou cd api && npm run build (backend).
3. Se build falhar, corrija antes de avançar.
4. Anuncie: "Fase [N] concluída. Iniciando Fase [N+1]."
```

---

## ARQUIVO DE PROGRESSO

Crie o arquivo `PROGRESSO.md` na raiz do projeto assim que começar.
Atualize-o a cada arquivo concluído. Formato exato:

```markdown
# PROGRESSO — Foodbio v2.0
Última atualização: [data hora]
Fase atual: [nome da fase]

## STATUS GERAL
| Fase | Nome | Status | Arquivos |
|------|------|--------|----------|
| 0 | Providers e infraestrutura frontend | 🔄 Em andamento | 2/5 |
| 1 | Estado global (Zustand) | ⏳ Pendente | 0/2 |
| 2 | Lib (API client e auth) | ⏳ Pendente | 0/4 |
| 3 | Hooks React | ⏳ Pendente | 0/4 |
| 4 | Componentes UI Base | ⏳ Pendente | 0/7 |
| 5 | Refactor das Pages Existentes | ⏳ Pendente | 0/10 |
| 6 | Checkout e Pagamento (Frontend) | ⏳ Pendente | 0/3 |
| 7 | BFF (Backend) | ⏳ Pendente | 0/25 |
| 8 | Admin Dashboard (Frontend) | ⏳ Pendente | 0/4 |
| 9 | KDS, PDV e Entregador | ⏳ Pendente | 0/8 |
| 10 | Testes Críticos | ⏳ Pendente | 0/2 |
| 11 | Deploy e CI/CD | ⏳ Pendente | 0/2 |

Legenda: ✅ Completa | 🔄 Em andamento | ⏳ Pendente | ❌ Bloqueada

---

## FASE 0 — Providers e infraestrutura frontend
- [ ] components/providers/QueryProvider.tsx
- [ ] components/providers/SocketProvider.tsx
- [ ] app/layout.tsx (atualizar)
- [ ] public/manifest.json
- [ ] next.config.ts (atualizar)

## FASE 1 — Estado global (Zustand)
- [ ] store/cart-store.ts
- [ ] store/session-store.ts

## FASE 2 — Lib
- [ ] lib/api-client.ts
- [ ] lib/auth.ts
- [ ] lib/socket.ts
- [ ] lib/validations.ts

## FASE 3 — Hooks React
- [ ] hooks/use-cart.ts
- [ ] hooks/use-socket.ts
- [ ] hooks/use-orders.ts
- [ ] hooks/use-payment.ts

## FASE 4 — Componentes UI Base
- [ ] components/ui/Button.tsx
- [ ] components/ui/Input.tsx
- [ ] components/ui/Modal.tsx
- [ ] components/ui/Drawer.tsx
- [ ] components/ui/Badge.tsx
- [ ] components/ui/Spinner.tsx
- [ ] components/ui/Toast.tsx

## FASE 5 — Refactor das Pages Existentes
- [ ] components/ecommerce/HomeHeader.tsx
- [ ] components/ecommerce/CategoryBar.tsx
- [ ] components/ecommerce/MenuCard.tsx
- [ ] components/ecommerce/CartItem.tsx
- [ ] components/ecommerce/CartFooter.tsx
- [ ] components/ecommerce/ProductDetail.tsx
- [ ] app/(public)/[slug]/page.tsx
- [ ] app/(public)/[slug]/cart/page.tsx
- [ ] app/(public)/[slug]/details/[id]/page.tsx
- [ ] app/(public)/login/page.tsx

## FASE 6 — Checkout e Pagamento (Frontend)
- [ ] app/(public)/[slug]/checkout/page.tsx
- [ ] app/(public)/[slug]/pedido/[id]/page.tsx
- [ ] components/ecommerce/CheckoutForm.tsx
- [ ] components/ecommerce/PaymentFormMP.tsx
- [ ] components/ecommerce/PaymentFormPB.tsx
- [ ] components/ecommerce/OrderTracker.tsx

## FASE 7 — BFF (Backend)
- [ ] api/package.json
- [ ] api/tsconfig.json
- [ ] api/.env.example
- [ ] api/prisma/schema.prisma
- [ ] api/src/lib/redis.ts
- [ ] api/src/lib/prisma.ts
- [ ] api/src/lib/logger.ts
- [ ] api/src/queue/index.ts
- [ ] api/src/queue/payment.worker.ts
- [ ] api/src/queue/webhook.worker.ts
- [ ] api/src/queue/notification.worker.ts
- [ ] api/src/services/cache.service.ts
- [ ] api/src/services/tenant.service.ts
- [ ] api/src/services/mercadopago.service.ts
- [ ] api/src/services/pagbank.service.ts
- [ ] api/src/services/split.service.ts
- [ ] api/src/services/socket.service.ts
- [ ] api/src/middlewares/auth.middleware.ts
- [ ] api/src/middlewares/tenant.middleware.ts
- [ ] api/src/middlewares/rate-limit.middleware.ts
- [ ] api/src/controllers/auth.controller.ts
- [ ] api/src/controllers/menu.controller.ts
- [ ] api/src/controllers/order.controller.ts
- [ ] api/src/controllers/payment.controller.ts
- [ ] api/src/controllers/delivery.controller.ts
- [ ] api/src/controllers/report.controller.ts
- [ ] api/src/routes/health.routes.ts
- [ ] api/src/routes/admin.routes.ts
- [ ] api/src/routes/client.routes.ts
- [ ] api/src/routes/store.routes.ts
- [ ] api/src/routes/kitchen.routes.ts
- [ ] api/src/routes/delivery.routes.ts
- [ ] api/src/routes/webhooks.routes.ts
- [ ] api/src/socket.ts
- [ ] api/src/server.ts

## FASE 8 — Admin Dashboard
- [ ] app/(admin)/layout.tsx
- [ ] components/admin/MetricsCard.tsx
- [ ] components/admin/OrderList.tsx
- [ ] components/admin/ProductForm.tsx
- [ ] components/admin/PaymentOnboarding.tsx
- [ ] components/admin/SplitReport.tsx
- [ ] app/(admin)/dashboard/page.tsx
- [ ] app/(admin)/cardapio/page.tsx
- [ ] app/(admin)/pedidos/page.tsx
- [ ] app/(admin)/financeiro/page.tsx
- [ ] app/(admin)/financeiro/conectar/page.tsx
- [ ] app/(admin)/relatorios/page.tsx

## FASE 9 — KDS, PDV e Entregador
- [ ] components/kitchen/KDSCard.tsx
- [ ] components/kitchen/KDSBoard.tsx
- [ ] app/(cozinha)/layout.tsx
- [ ] app/(cozinha)/cozinha/page.tsx
- [ ] components/pdv/POSProductGrid.tsx
- [ ] components/pdv/POSCart.tsx
- [ ] app/(pdv)/layout.tsx
- [ ] app/(pdv)/pdv/page.tsx
- [ ] components/delivery/DeliveryCard.tsx
- [ ] app/(entregador)/layout.tsx
- [ ] app/(entregador)/entregas/page.tsx
- [ ] app/(entregador)/entregas/[id]/page.tsx

## FASE 10 — Testes Críticos
- [ ] api/src/services/__tests__/split.service.test.ts
- [ ] api/src/queue/__tests__/payment.worker.test.ts

## FASE 11 — Deploy e CI/CD
- [ ] api/Dockerfile
- [ ] fly.toml
- [ ] .github/workflows/ci.yml

---

## BLOQUEIOS
(registrar aqui qualquer bloqueio encontrado durante a implementação)

## LOG DE MUDANÇAS
(registrar decisões técnicas diferentes do PRD e o motivo)
```

---

## FASE 0 — Providers e infraestrutura frontend

### Objetivo
Preparar o app Next.js para receber os novos providers sem quebrar o que já existe.

### Tarefa 0.1 — `components/providers/QueryProvider.tsx`

Crie o arquivo `components/providers/QueryProvider.tsx`:

```
Requisitos:
- 'use client' no topo
- Importar QueryClient, QueryClientProvider de @tanstack/react-query
- Criar QueryClient com:
    defaultOptions: {
      queries: { staleTime: 30_000, retry: 2, refetchOnWindowFocus: false },
      mutations: { retry: 1 }
    }
- Instanciar com useState para evitar recriação em re-renders
- Envolver children com QueryClientProvider
- Exportar como default
```

### Tarefa 0.2 — `components/providers/SocketProvider.tsx`

Crie o arquivo `components/providers/SocketProvider.tsx`:

```
Requisitos:
- 'use client' no topo
- Context com: socket (Socket | null), connected (boolean)
- Exportar: SocketContext, SocketProvider, useSocketContext()
- No useEffect: importar getSocket() de @/lib/socket
- Conectar com auth: { token } usando getSession() do next-auth/react
- Reconexão: socket.on('disconnect', ...) tenta reconectar após 2s
- Limpar listener e desconectar no cleanup do useEffect
- Se sessão não disponível, não conectar (evitar erro em rotas públicas)
```

### Tarefa 0.3 — `app/layout.tsx` (ATUALIZAR)

ATENÇÃO: Este arquivo já existe. Edite apenas o necessário:
- Ler o arquivo atual antes de qualquer mudança
- Adicionar import de QueryProvider e SocketProvider
- Envolver o `<div className="mx-auto...">` com ambos os providers (QueryProvider por fora, SocketProvider por dentro)
- Adicionar `<link rel="manifest" href="/manifest.json" />` no `<head>`
- Adicionar `<meta name="theme-color" content="#1a1a1a" />` no `<head>`
- NÃO alterar: Inter font, className do body, max-w-[414px], bg-gray-100

### Tarefa 0.4 — `public/manifest.json`

```json
{
  "name": "Foodbio — Delivery",
  "short_name": "Foodbio",
  "description": "Peça comida do seu restaurante favorito",
  "start_url": "/",
  "display": "standalone",
  "orientation": "portrait",
  "theme_color": "#1a1a1a",
  "background_color": "#F1F9E8",
  "icons": [
    { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png" },
    { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable" }
  ]
}
```

### Tarefa 0.5 — `next.config.ts` (ATUALIZAR)

ATENÇÃO: Este arquivo já existe. Edite apenas o necessário:
- Ler o arquivo atual
- Adicionar em `images.remotePatterns`: hostname `*.supabase.co` para imagens de produtos
- Adicionar rewrite:
  ```typescript
  async rewrites() {
    return [
      {
        source: '/bff/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'}/:path*`,
      },
    ]
  }
  ```
- NÃO alterar: output standalone, remotePatterns existentes, webpack HMR config

### Checkpoint Fase 0
Antes de avançar para Fase 1:
- [ ] `npm install @tanstack/react-query zustand next-auth@beta socket.io-client zod react-hook-form next-pwa`
- [ ] `npm run build` deve passar sem erros de TypeScript

---

## FASE 1 — Estado global (Zustand)

### Tarefa 1.1 — `store/cart-store.ts`

```
Interface CartItem:
  productId: string
  name: string
  price: number          // preço base sem opcionais
  quantity: number
  imageUrl: string | null
  selectedOptions: Array<{ optionId: string; name: string; price: number }>
  itemTotal: number      // (price + soma options) * quantity

Interface CartState:
  items: CartItem[]
  restaurantId: string | null
  restaurantSlug: string | null

Actions (na store):
  addItem(product: { id, name, price, imageUrl }, options, restaurantId, restaurantSlug): void
    → Se restaurantId diferente do atual E items.length > 0: throw new Error("Você já tem itens de outro restaurante no carrinho. Limpe o carrinho antes de continuar.")
    → Se já existe item com mesmo productId e mesmas options (comparar JSON): incrementa quantity
    → Senão: push novo CartItem
  removeItem(productId: string): void
  updateQty(productId: string, qty: number): void
    → Se qty <= 0: remover item
  clearCart(): void
  setRestaurant(id: string, slug: string): void

Computed (getters via Zustand get):
  Exportar hooks separados: useCartItems(), useCartTotal(), useCartCount(), useCartRestaurant()

Persistência:
  persist middleware com key 'foodbio-cart-v1'
  partialize: salvar apenas items, restaurantId, restaurantSlug
  version: 1 (para migration futura)
```

### Tarefa 1.2 — `store/session-store.ts`

```
Interface TenantInfo:
  id: string
  slug: string
  name: string
  gateway: 'mercadopago' | 'pagbank' | null

Interface SessionState:
  tenant: TenantInfo | null
  setTenant(t: TenantInfo): void
  clearTenant(): void

Sem persist (dados de sessão são reconstruídos a cada visita).
Exportar useSessionStore como default.
```

---

## FASE 2 — Lib (API client e auth)

### Tarefa 2.1 — `lib/api-client.ts`

```
Função base: async function request<T>(path: string, options?: RequestInit): Promise<T>

Comportamento:
  - baseURL: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'
  - Headers padrão: { 'Content-Type': 'application/json' }
  - Se sessão NextAuth disponível: adicionar Authorization: Bearer <token>
  - Em resposta não-ok: retornar { error: string, status: number } (NÃO lançar exceção)
  - Em erro de rede: retornar { error: 'Sem conexão com o servidor', status: 0 }
  - Em resposta 401: chamar signOut() + redirect para /login

Atalhos exportados:
  get<T>(path: string, params?: Record<string, string>): Promise<T>
  post<T>(path: string, body: unknown): Promise<T>
  patch<T>(path: string, body: unknown): Promise<T>
  del<T>(path: string): Promise<T>

Tipo de retorno de erro:
  export type ApiError = { error: string; status: number }
  export function isApiError(r: unknown): r is ApiError
```

### Tarefa 2.2 — `lib/auth.ts`

```
NextAuth v5 config.

Providers:
  - GoogleProvider com clientId e clientSecret das envs
  - CredentialsProvider:
      name: 'Email e senha'
      credentials: { email, password }
      authorize: chama POST http://localhost:3001/api/auth/login
                 retorna { id, name, email, role, restaurantId, accessToken } ou null

Callbacks:
  jwt({ token, user }):
    se user (primeiro login): token.role = user.role, token.restaurantId = user.restaurantId, token.accessToken = user.accessToken
    retornar token

  session({ session, token }):
    session.user.role = token.role
    session.user.restaurantId = token.restaurantId
    session.user.accessToken = token.accessToken
    retornar session

Pages:
  signIn: '/login'

Exportar: { handlers, auth, signIn, signOut }
```

### Tarefa 2.3 — `lib/socket.ts`

```
Singleton socket.io-client.

let _socket: Socket | null = null

export function getSocket(): Socket {
  if (!_socket) {
    _socket = io(process.env.NEXT_PUBLIC_SOCKET_URL ?? 'http://localhost:3001', {
      autoConnect: false,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 10_000,
      reconnectionAttempts: Infinity,
      transports: ['websocket', 'polling'],
    })
  }
  return _socket
}

export function connectWithToken(token: string): void {
  const socket = getSocket()
  socket.auth = { token }
  if (!socket.connected) socket.connect()
}

export function disconnectSocket(): void {
  _socket?.disconnect()
  _socket = null
}

Tipos de eventos (ServerToClientEvents):
  'order:confirmed': (data: { orderId: string }) => void
  'order:update': (data: { orderId: string; status: string; updatedAt: string }) => void
  'order:payment-failed': (data: { orderId: string; message: string }) => void
  'order:ready': (data: { orderId: string }) => void
  'new_order': (data: { orderId: string; total: number; type: string; createdAt: string }) => void
  'order:assigned': (data: { orderId: string; driverName: string }) => void
  'order:dispatched': (data: { orderId: string }) => void
  'order:delivered': (data: { orderId: string }) => void
```

### Tarefa 2.4 — `lib/validations.ts`

```
Schemas Zod:

loginSchema:
  email: string().email('E-mail inválido')
  password: string().min(6, 'Senha com no mínimo 6 caracteres')

checkoutSchema:
  name: string().min(2, 'Nome obrigatório')
  phone: string().regex(/^\(\d{2}\)\s\d{4,5}-\d{4}$/, 'Telefone inválido')
  deliveryType: enum(['delivery', 'pickup'])
  address: optional object: { street, number, neighborhood, city }
    → refine: obrigatório se deliveryType === 'delivery'
  paymentMethod: enum(['pix', 'credit_card'])

connectPagBankSchema:
  email: string().email('E-mail da conta PagBank inválido')

productSchema:
  name: string().min(2).max(80)
  description: string().max(300).optional()
  price: number().positive('Preço deve ser positivo')
  categoryId: string().min(1, 'Selecione uma categoria')
  available: boolean().default(true)

Exportar todos como named exports.
```

---

## FASE 3 — Hooks React

### Tarefa 3.1 — `hooks/use-cart.ts`

```
Importa cartStore e sessionStore.

Retorno do hook useCart():
  items, total, count, isEmpty, restaurantId, restaurantSlug
  addToCart(product, options, restaurantId, restaurantSlug):
    → captura o erro de "outro restaurante" e retorna { needsConfirm: true }
    → caso normal: retorna { success: true }
  removeFromCart(productId)
  updateQuantity(productId, qty)
  clearCart()
  cartSubtotal: number
  deliveryFee: number    (placeholder: 5.99 para entrega, 0 para retirada)
  cartTotal: number      (subtotal + deliveryFee)
```

### Tarefa 3.2 — `hooks/use-socket.ts`

```
function useSocket(room?: string): {
  socket: Socket | null
  connected: boolean
  emit: (event: string, data?: unknown) => void
}

Comportamento:
  - Obtém socket de useSocketContext()
  - Se room fornecida: emite 'join' no mount, 'leave' no unmount
  - connected: estado derivado de socket?.connected
  - emit: wrapper seguro que verifica connected antes de emitir
```

### Tarefa 3.3 — `hooks/use-orders.ts`

```
Funções exportadas:

useOrder(id: string):
  → useQuery: GET /bff/client/orders/:id
  → refetchInterval: 30_000 (fallback polling)
  → Em sucesso com socket: cancelar polling

useCreateOrder():
  → useMutation: POST /bff/client/orders
  → onSuccess: navegar para /{slug}/checkout

usePayOrder():
  → useMutation: POST /bff/client/orders/:id/pay
  → onSuccess: navegar para /{slug}/pedido/:id (status 202 = processing)
  → invalidar query useOrder(id) após mutação

useAdminOrders(filters: { status?, page?, limit? }):
  → useQuery: GET /bff/admin/orders com query params
  → staleTime: 10_000
```

### Tarefa 3.4 — `hooks/use-payment.ts`

```
Estado local: { scriptLoaded, loading, error }

loadMercadoPagoScript():
  → Insere <script src="https://sdk.mercadopago.com/js/v2"> via document.createElement
  → Idempotente: verifica se window.MercadoPago já existe
  → Retorna Promise<void>

loadPagSeguroScript():
  → Insere script do PagBank
  → Idempotente

tokenizeMP(cardData: { number, holder, expMonth, expYear, cvv }):
  → Requer window.MercadoPago instanciado com NEXT_PUBLIC_MP_PUBLIC_KEY
  → Chama mp.createCardToken(cardData)
  → Retorna Promise<string> (token)

tokenizePagBank(cardData):
  → Usa PagSeguro.encryptCard()
  → Retorna Promise<string>

Retorno do hook:
  { loadMercadoPagoScript, loadPagSeguroScript, tokenizeMP, tokenizePagBank, loading, error }
```

---

## FASE 4 — Componentes UI Base

> REGRA DE ESTILO: Todos os componentes devem ser visualmente consistentes com
> o design system existente. Consulte `app/globals.css` para os tokens.

### Tarefa 4.1 — `components/ui/Button.tsx`

```
Props: variant, size, loading, disabled, children, className, ...buttonProps

Variantes (class-variance-authority):
  primary: bg-[var(--color-lime-primary)] text-black font-bold hover:opacity-90
  dark:    bg-[var(--color-app-dark)] text-white font-bold shadow-lg hover:opacity-90
  ghost:   border-2 border-current bg-transparent hover:bg-black/5
  danger:  bg-red-500 text-white hover:bg-red-600

Tamanhos:
  sm:   px-4 py-2 text-sm rounded-[14px]
  md:   px-6 py-3.5 text-sm rounded-[18px]   (padrão)
  lg:   px-8 py-4 text-base rounded-[20px]

Loading: mostrar Spinner.tsx inline + desabilitar click
Disabled: opacity-50 cursor-not-allowed

Transição: active:scale-95 transition-transform (igual aos botões existentes)
```

### Tarefa 4.2 — `components/ui/Input.tsx`

```
Props: label, error, icon (ReactNode), ...inputProps

Estilo base do input:
  w-full bg-white rounded-[20px] py-4 px-4 text-sm
  border border-transparent focus:ring-2 focus:ring-[var(--color-lime-primary)]/50
  (igual ao search bar de app/page.tsx)

Com ícone: adicionar pl-12 e posicionar ícone absoluto à esquerda
Com erro: border-red-400 + <p className="text-xs text-red-500 mt-1">{error}</p>
Label: text-sm font-semibold text-zinc-700 mb-1.5
```

### Tarefa 4.3 — `components/ui/Modal.tsx`

```
Props: open, onClose, title?, children, size? ('sm'|'md'|'lg')

Overlay: fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center
Card: bg-white rounded-t-[40px] sm:rounded-[28px] w-full sm:max-w-md p-6
  (rounded-t no mobile para parecer sheet; arredondado no desktop)

Comportamento:
  - Fechar com ESC (addEventListener no document)
  - Fechar clicando no overlay
  - Foco trap: primeiro elemento focável recebe focus no open
  - Animação de entrada: motion.div com initial/animate/exit (opacity + y)
  - Portal: usar createPortal para renderizar fora do DOM pai

title: h2 font-bold text-zinc-900 text-lg mb-4 (se fornecido)
```

### Tarefa 4.4 — `components/ui/Drawer.tsx`

```
Props: open, onClose, children, title?

Visual:
  - Desliza de baixo para cima no mobile
  - Drag handle: barra cinza centralizada no topo
  - Overlay com backdrop-blur
  - Card: rounded-t-[40px] bg-white max-h-[90dvh] overflow-y-auto

Animação com motion.div:
  initial: { y: '100%' }
  animate: { y: 0 }
  exit: { y: '100%' }
  transition: { type: 'spring', damping: 30, stiffness: 300 }
```

### Tarefa 4.5 — `components/ui/Badge.tsx`

```
Props: status: OrderStatus | string, className?

Mapa de cores (usar objeto lookup):
  pending:    bg-yellow-100 text-yellow-800
  confirmed:  bg-blue-100 text-blue-800
  preparing:  bg-orange-100 text-orange-800
  ready:      bg-lime-100 text-lime-800
  dispatched: bg-purple-100 text-purple-800
  delivered:  bg-green-100 text-green-800
  cancelled:  bg-red-100 text-red-800

Texto em português:
  pending: "Aguardando"  confirmed: "Confirmado"  preparing: "Preparando"
  ready: "Pronto"  dispatched: "A caminho"  delivered: "Entregue"  cancelled: "Cancelado"

Estilo base: px-3 py-1 rounded-full text-xs font-semibold
```

### Tarefa 4.6 — `components/ui/Spinner.tsx`

```
Props: size? ('sm'|'md'|'lg'), className?

SVG animado com animate-spin
Tamanhos: sm=16px md=24px lg=40px
Cor: currentColor (herda do pai)
Acessibilidade: role="status" aria-label="Carregando"
```

### Tarefa 4.7 — `components/ui/Toast.tsx`

```
Usar react-hot-toast como base (adicionar à dep do package.json).

Exportar:
  toast.success(msg: string)
  toast.error(msg: string)
  toast.loading(msg: string)
  <Toaster /> componente (posicionar em app/layout.tsx, bottom-center)

Estilo customizado do toaster:
  style: { borderRadius: '20px', background: '#1a1a1a', color: '#fff', fontSize: '14px' }
  iconTheme (success): primary '#D4FF00', secondary '#1a1a1a'
```

---

## FASE 5 — Refactor das Pages Existentes

> ATENÇÃO: Os arquivos originais `app/page.tsx`, `app/cart/page.tsx` e `app/details/page.tsx`
> devem ser MANTIDOS (não deletados) até as rotas `(public)` estarem funcionando.
> O refactor cria novos componentes e novas rotas, não sobrescreve as existentes.

### Tarefa 5.1 — `components/ecommerce/HomeHeader.tsx`

Extrair e componentizar o header dark de `app/page.tsx` (linhas 1–80):

```
Props:
  restaurantName: string
  restaurantLogo?: string
  location?: string
  onSearch?: (query: string) => void
  searchValue?: string

Preservar EXATAMENTE:
  - bg-zinc-900 pt-12 pb-8 px-6 rounded-b-[40px]
  - Hero card com gradiente e imagem de produto
  - Search bar: bg-white rounded-[20px] py-4 pl-12 pr-4
  - Ícone de localização lime primary
  - Botão de sino com badge vermelho

Adaptar:
  - "Delivery location" → restaurantName
  - Hero card: exibir promoção genérica (pode ser hardcoded por ora)
  - Search input: controlado com onSearch prop
```

### Tarefa 5.2 — `components/ecommerce/CategoryBar.tsx`

Extrair a barra de categorias de `app/page.tsx`:

```
Props:
  categories: Array<{ id: string; name: string; iconUrl?: string }>
  activeId: string
  onSelect: (id: string) => void

Preservar EXATAMENTE:
  - flex gap-4 overflow-x-auto no-scrollbar
  - Ícone: w-[66px] h-[66px] rounded-[22px]
  - Ativo: bg-[var(--color-lime-primary)] shadow-lg shadow-[#D4FF00]/30
  - Inativo: bg-white shadow border border-black/5
  - Texto ativo: text-[var(--color-lime-primary)]
```

### Tarefa 5.3 — `components/ecommerce/MenuCard.tsx`

Extrair e conectar o card de produto de `app/page.tsx`:

```
Props:
  product: {
    id: string; name: string; price: number
    imageUrl?: string; description?: string; available: boolean
  }
  onAdd: (productId: string) => void
  loading?: boolean  // mostra spinner no botão +

Preservar EXATAMENTE:
  - bg-white rounded-[28px] p-3 border border-black/5
  - Imagem: aspect-square rounded-[24px] bg-[var(--color-app-bg)]
  - Preço: font-extrabold text-zinc-900 text-[17px]
  - Botão +: bg-[var(--color-lime-primary)] w-8 h-8 rounded-[10px]
  - Hover: hover:shadow-md transition-shadow

Adicionar:
  - Se !available: overlay "Indisponível" semi-transparente + desabilitar botão
  - Se loading: Spinner no lugar do ícone +
```

### Tarefa 5.4 — `components/ecommerce/CartItem.tsx`

Extrair e conectar item de `app/cart/page.tsx`:

```
Props:
  item: CartItem  (do cart-store.ts)
  onRemove: () => void
  onIncrement: () => void
  onDecrement: () => void

Preservar EXATAMENTE:
  - bg-white rounded-[28px] p-3.5 border border-black/5
  - Imagem: w-[84px] h-[84px] rounded-[22px]
  - Controles: gap-3.5 bg-gray-50/80 border border-gray-100 rounded-full px-2.5 py-1.5
  - Botão +: w-[22px] h-[22px] bg-[#bef264] rounded-full
  - Checkbox negro rounded-[6px]
  - Lixeira: text-gray-300 hover:text-red-500

Adicionar:
  - Exibir opcionais selecionados como lista de pills pequenas abaixo do nome
  - itemTotal calculado: (price + options sum) × quantity
```

### Tarefa 5.5 — `components/ecommerce/CartFooter.tsx`

Extrair footer de `app/cart/page.tsx`:

```
Props:
  subtotal: number
  deliveryFee: number
  discount: number
  onCheckout: () => void
  loading?: boolean

Preservar EXATAMENTE:
  - absolute bottom-0 bg-white rounded-t-[40px] px-8 pt-6 pb-6
  - shadow-[0_-15px_30px_rgba(0,0,0,0.04)]
  - Linhas de detalhe: text-gray-500 font-semibold / font-extrabold text-gray-900
  - Desconto em text-[#9acc28]
  - Botão Checkout: bg-zinc-900 rounded-[20px] py-4 font-bold

Adaptar:
  - Total = subtotal + deliveryFee - discount
  - Se deliveryFee === 0: exibir "Grátis" em lime
  - Botão com loading state (Spinner)
```

### Tarefa 5.6 — `components/ecommerce/ProductDetail.tsx`

Extrair e conectar detalhe de `app/details/page.tsx`:

```
Props:
  product: {
    id, name, description, price, imageUrl
    optionGroups: Array<{
      id, name, required, maxChoices
      options: Array<{ id, name, priceModifier }>
    }>
  }
  onAddToCart: (selectedOptions: SelectedOption[]) => void
  loading?: boolean

Preservar EXATAMENTE:
  - Imagem: w-[280px] h-[280px] rounded-full drop-shadow
  - Seção info: rounded-t-[40px] bg-gray-50 -mt-6 z-20
  - Badges de info: rounded-[14px] com ícone + texto
  - Footer sticky: bg-white border-t com total e controles

Adicionar:
  - Renderizar OptionGroups: se required, pelo menos 1 deve ser selecionado
  - Quantity control conectado (não hardcoded)
  - Total dinâmico: price + sum(selectedOptions.priceModifier) × quantity
  - Botão "Adicionar ao Carrinho" chama onAddToCart com opções selecionadas
```

### Tarefa 5.7 — `app/(public)/[slug]/page.tsx`

```
Este é o cardápio público de cada restaurante.

Fetch de dados:
  - GET /bff/client/menu/:slug
  - generateStaticParams: buscar slugs de restaurantes ativos (máx 100 no build)
  - revalidate = 60 (ISR: revalida a cada 60 segundos)

Estado local (useState):
  - activeCategory: string (default: primeiro da lista)
  - searchQuery: string

Renderização:
  - <HomeHeader restaurantName={restaurant.name} onSearch={setSearchQuery} />
  - <CategoryBar categories={categories} activeId={activeCategory} onSelect={setActiveCategory} />
  - Grid 2 colunas de <MenuCard> filtrado por categoria e busca
  - Nav flutuante (igual ao existente): Home, Cart (com badge de count), Favorites, Profile

Ao clicar em MenuCard:
  - Se produto tem optionGroups: navegar para /[slug]/details/:id
  - Se produto sem opcionais: addToCart diretamente
```

### Tarefa 5.8 — `app/(public)/[slug]/cart/page.tsx`

```
Usar cartStore como fonte de dados.

Renderização:
  - Header igual ao existente (ArrowLeft + "Meu Carrinho" + MoreVertical)
  - "{count} itens" + "Selecionar todos"
  - Lista de <CartItem> mapeada de cartStore.items
  - <CartFooter> com totais reais + botão Checkout

Botão Checkout:
  - Se usuário não logado: redirect para /login?callbackUrl=/{slug}/checkout
  - Se logado: navegar para /{slug}/checkout

Estado vazio: exibir ilustração e mensagem "Seu carrinho está vazio"
```

### Tarefa 5.9 — `app/(public)/[slug]/details/[id]/page.tsx`

```
Fetch:
  - GET /bff/client/products/:id
  - generateStaticParams: não gerar (dinâmico para manter dados frescos)

Renderização:
  - Header com back button e heart button
  - <ProductDetail> com dados reais

onAddToCart:
  - Chama cartStore.addItem()
  - Se erro "outro restaurante": exibir Modal de confirmação
    "Você já tem itens de [nome]. Deseja limpar e adicionar este item?"
  - Em sucesso: toast.success("Adicionado ao carrinho") + voltar para /{slug}
```

### Tarefa 5.10 — `app/(public)/login/page.tsx`

```
Formulário com React Hook Form + loginSchema.

Visual: consistente com o design system
  - Container: max-w-sm mx-auto pt-16 px-6
  - Logo: "Foodbio" em font-extrabold text-3xl com punto lime
  - Campos: <Input> email + password
  - Botão: <Button variant="dark" size="lg">Entrar</Button>
  - Link "Entrar com Google" + ícone Google

Comportamento:
  - signIn('credentials', { email, password, callbackUrl })
  - signIn('google', { callbackUrl })
  - Exibir erro em toast se credenciais inválidas
  - Link "Criar conta" (placeholder, sem funcionalidade por ora)

Redirecionar para callbackUrl após login (NextAuth cuida disso automaticamente).
```

---

## FASE 6 — Checkout e Pagamento (Frontend)

### Tarefa 6.1 — `app/(public)/[slug]/checkout/page.tsx`

```
Server component com auth check via auth() do NextAuth.
Se não autenticado: redirect('/login?callbackUrl=...')

Renderiza <CheckoutForm> passando:
  - restaurantGateway (buscado via GET /bff/client/restaurant/:slug/gateway)
  - slug do restaurante
```

### Tarefa 6.2 — `components/ecommerce/CheckoutForm.tsx`

```
'use client'
React Hook Form + checkoutSchema

Seções visuais (usar estilo de card: bg-white rounded-[28px] p-6 mb-4):

1. Tipo de entrega
   - Pills "Entrega" e "Retirada"
   - Ativo: bg-[var(--color-lime-primary)] text-black
   - Inativo: bg-gray-100 text-gray-600

2. Endereço (condicional: só se deliveryType === 'delivery')
   - Campos: rua, número, bairro

3. Forma de pagamento
   - Tabs "Pix" / "Cartão de Crédito"
   - Condicional: renderizar <PaymentFormMP> ou <PaymentFormPB>

4. Resumo do pedido
   - Lista de items do cartStore
   - Subtotal, taxa de entrega, total

5. Botão "Confirmar Pedido"
   - useCreateOrder().mutate() → cria pedido
   - Em sucesso: usePayOrder().mutate() com token do formulário de pagamento
   - Loading state durante as mutations
   - Exibir erro em toast se falhar
```

### Tarefa 6.3 — `components/ecommerce/PaymentFormMP.tsx`

```
'use client'
Props: onTokenReady: (token: string) => void, paymentMethod: 'pix' | 'credit_card'

Para crédito:
  - useEffect: loadMercadoPagoScript() → depois criar campos MP via mp.fields
  - Campos: cardNumber, cardHolder, expirationDate, cvv (iframes do SDK)
  - Estilo dos containers: mesmo visual do Input.tsx (rounded-[20px])
  - Botão interno: useImperativeHandle ou callback para getToken()

Para Pix:
  - Exibir aviso: "Após confirmar, você receberá o QR Code e código copia-e-cola"
  - Sem campos (Pix não precisa de dados do pagador)
  - onTokenReady: chamar com string vazia ('') para Pix
```

### Tarefa 6.4 — `components/ecommerce/PaymentFormPB.tsx`

```
Mesma estrutura que PaymentFormMP, mas usando PagSeguro SDK.
Para crédito: PagSeguro.encryptCard(cardData) → token
Para Pix: mesmo comportamento
```

### Tarefa 6.5 — `app/(public)/[slug]/pedido/[id]/page.tsx`

```
'use client'
Renderiza <OrderTracker orderId={id} />
```

### Tarefa 6.6 — `components/ecommerce/OrderTracker.tsx`

```
'use client'
Props: orderId: string

Fonte de dados:
  - useOrder(orderId) para dados iniciais e fallback polling
  - useSocket(`order:${orderId}`) para updates em tempo real
  - Ouvir: 'order:update', 'order:dispatched', 'order:delivered'

Timeline visual (lista vertical com linha conectora):
  Passo 1: Pedido Confirmado (ícone CheckCircle)
  Passo 2: Preparando (ícone ChefHat)
  Passo 3: A Caminho (ícone Truck)
  Passo 4: Entregue (ícone Home)

Estado ativo: ícone lime primary com texto negro bold
Estado futuro: ícone cinza com texto cinza
Estado passado: ícone verde com check

Cada step: timestamp quando atingido (format: "às 19:42")

Seção entregador (quando status >= dispatched):
  Card com nome do entregador, veículo
  Link "Ver no Mapa" → Google Maps com endereço de entrega
```

---

## FASE 7 — BFF (Backend)

> NOTA: O backend vive em `/api` dentro do projeto raiz.
> Criar estrutura de pastas antes de criar os arquivos.

### Tarefa 7.1 — Estrutura inicial do backend

Criar a estrutura de diretórios:
```
api/
  src/
    lib/
    queue/
    services/
    middlewares/
    controllers/
    routes/
  prisma/
    migrations/
```

### Tarefa 7.2 — `api/package.json`

```json
{
  "name": "foodbio-api",
  "version": "1.0.0",
  "scripts": {
    "dev": "tsx watch src/server.ts",
    "build": "tsc --project tsconfig.json",
    "start": "node dist/server.js",
    "worker:payment": "tsx src/queue/payment.worker.ts",
    "worker:webhook": "tsx src/queue/webhook.worker.ts",
    "db:generate": "prisma generate",
    "db:migrate": "prisma migrate deploy",
    "db:push": "prisma db push",
    "test": "vitest run"
  },
  "dependencies": {
    "@fastify/cors": "^9",
    "@fastify/helmet": "^11",
    "@fastify/jwt": "^8",
    "@fastify/rate-limit": "^9",
    "@prisma/client": "^5",
    "@socket.io/redis-adapter": "^8",
    "argon2": "^0.40",
    "bullmq": "^5",
    "fastify": "^4",
    "ioredis": "^5",
    "mercadopago": "^2",
    "pino": "^9",
    "socket.io": "^4",
    "zod": "^3"
  },
  "devDependencies": {
    "@types/node": "^20",
    "prisma": "^5",
    "tsx": "^4",
    "typescript": "^5",
    "vitest": "^2"
  }
}
```

### Tarefa 7.3 — `api/tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "outDir": "dist",
    "rootDir": "src",
    "strict": true,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "resolveJsonModule": true,
    "declaration": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

### Tarefa 7.4 — `api/.env.example`

Copiar exatamente as variáveis da seção 7 do PRD.md, com valores `=<descrição>`.

### Tarefa 7.5 — `api/prisma/schema.prisma`

Copiar o schema COMPLETO da seção 4.1 do PRD.md.
Não omitir nenhum model, índice ou relação.

### Tarefa 7.6 — `api/src/lib/logger.ts`

```
import pino from 'pino'

Configuração:
  level: process.env.LOG_LEVEL ?? 'info'
  redact: ['body.token', 'body.cardNumber', 'body.cvv', 'body.password', '*.accessToken', '*.passwordHash']

export default logger
```

### Tarefa 7.7 — `api/src/lib/redis.ts`

```
Singleton ioredis:
  - lazyConnect: true
  - maxRetriesPerRequest: 3
  - enableReadyCheck: false
  - retryStrategy: (times) => Math.min(times * 100, 3000)
  - Em erro: logger.error (não crasha)

export { redis }
export default redis
```

### Tarefa 7.8 — `api/src/lib/prisma.ts`

```
Singleton PrismaClient:
  - Em desenvolvimento: usar globalThis para evitar múltiplas instâncias
  - log: ['error', 'warn']

Middleware de tenant safety (Prisma.$use):
  - Modelos protegidos: ['Order', 'Product', 'MenuCategory', 'PaymentTransaction']
  - Em findMany sem restaurantId na where: throw Error descritivo
  - Logar a query name no debug

export { prisma }
export default prisma
```

### Tarefa 7.9 — `api/src/queue/index.ts`

```
Criar 3 filas BullMQ usando a instância redis:

paymentQueue: defaultJobOptions { attempts: 3, backoff: { type: 'exponential', delay: 2000 }, removeOnComplete: { count: 1000 }, removeOnFail: { count: 5000 } }
webhookQueue: defaultJobOptions { attempts: 5, backoff: exponential 1000ms }
notificationQueue: defaultJobOptions { attempts: 2 }

export { paymentQueue, webhookQueue, notificationQueue }
```

### Tarefa 7.10 — `api/src/services/cache.service.ts`

```
Funções:

getMenu(restaurantId: string): Promise<MenuWithCategories | null>
  1. redis.get(`menu:${restaurantId}`)
  2. Se hit: JSON.parse e retornar
  3. Se miss: buscar no Prisma (categorias + produtos disponíveis ordenados)
  4. redis.set(key, JSON.stringify(data), 'EX', 60)
  5. Retornar

invalidateMenu(restaurantId: string): Promise<void>
  redis.del(`menu:${restaurantId}`)

getTenant(slug: string): Promise<Restaurant | null>
  Cache de 5min. Mesma lógica de get/set/miss.

invalidateTenant(slug: string): Promise<void>

setSession(userId: string, data: object, ttlSeconds: number): Promise<void>
getSession(userId: string): Promise<object | null>
```

### Tarefa 7.11 — `api/src/services/tenant.service.ts`

```
resolve(slugOrId: string): Promise<Restaurant & { paymentAccount: TenantPaymentAccount | null }>
  - Tenta buscar por slug, depois por id
  - Usa cache.getTenant()
  - Retorna null se não encontrado ou inativo

getPaymentAccount(restaurantId: string): Promise<TenantPaymentAccount>
  - Busca TenantPaymentAccount
  - Descriptografa accessToken (AES-256-GCM com ENCRYPTION_KEY do env)
  - Lança erro descritivo se conta não existir ou estiver suspensa

decryptToken(encrypted: string): string
encryptToken(plain: string): string
```

### Tarefa 7.12 — `api/src/services/mercadopago.service.ts`

```
createOrder(params: {
  total: number; marketplaceFee: number; paymentMethodId: string
  token?: string; externalReference: string; payerEmail: string
}): Promise<{ id: string; status: string; }>
  - POST https://api.mercadopago.com/v1/orders
  - Headers: Authorization Bearer MP_MARKETPLACE_TOKEN
  - Body: { processing_mode: "aggregator", marketplace_fee, ... }
  - Timeout: 25s
  - Em erro: logar sem PAN, relançar com mensagem amigável

exchangeOAuthCode(code: string): Promise<{ accessToken: string; userId: string }>
  - POST https://api.mercadopago.com/oauth/token

generatePixQR(orderId: string, amount: number): Promise<{ qrCode: string; qrBase64: string; expiresAt: string }>

validateWebhookSignature(signature: string, requestId: string, payload: string): boolean
  - HMAC-SHA256 com MP_WEBHOOK_SECRET
```

### Tarefa 7.13 — `api/src/services/pagbank.service.ts`

```
createOrder(params: {
  total: number; receiverAccountId: string; receiverPercent: number
  token?: string; paymentType: string; externalReference: string
}): Promise<{ id: string; status: string }>
  - POST https://api.pagseguro.com/orders

generatePixQR(amount: number, reference: string): Promise<{ qrCode: string; expiresAt: string }>

validateWebhookSignature(signature: string, payload: string): boolean
```

### Tarefa 7.14 — `api/src/services/split.service.ts`

```
ESTE É O ARQUIVO MAIS CRÍTICO. Implemente com cuidado.

async function process(params: {
  orderId: string; token: string; gateway: string
}): Promise<PaymentTransaction>

Fluxo OBRIGATÓRIO:
  1. Buscar Order com status
     - Se paymentStatus !== 'pending': throw new Error('Pedido já processado')  ← IDEMPOTÊNCIA
  2. Buscar TenantPaymentAccount via tenant.service.getPaymentAccount()
     - Se não existe: throw new Error('Restaurante sem conta de pagamento configurada')
  3. Calcular:
     marketplaceFee = Number((order.total * account.commissionPercent / 100).toFixed(2))
     sellerAmount   = Number((order.total - marketplaceFee).toFixed(2))
  4. Chamar gateway:
     - Se mercadopago: mercadopago.service.createOrder(...)
     - Se pagbank: pagbank.service.createOrder(...)
  5. Criar PaymentTransaction no banco
  6. Atualizar Order: paymentStatus='approved', status='confirmed'
  7. cache.invalidateMenu se necessário
  8. Retornar PaymentTransaction

Em qualquer erro do gateway:
  - Atualizar Order: paymentStatus='failed'
  - Criar PaymentTransaction com splitStatus='failed'
  - Relançar o erro com mensagem amigável
```

### Tarefa 7.15 — `api/src/services/socket.service.ts`

```
Importar getIO() de ../socket.ts

emitToOrder(orderId: string, event: string, data: unknown): void
  getIO().to(`order:${orderId}`).emit(event, data)

emitToKitchen(restaurantId: string, event: string, data: unknown): void
  getIO().to(`kitchen:${restaurantId}`).emit(event, data)

emitToAdmin(restaurantId: string, event: string, data: unknown): void
  getIO().to(`admin:${restaurantId}`).emit(event, data)

emitToDrivers(restaurantId: string, event: string, data: unknown): void
  getIO().to(`drivers:${restaurantId}`).emit(event, data)
```

### Tarefa 7.16 — `api/src/middlewares/auth.middleware.ts`

```
Tipos:
  declare module 'fastify' {
    interface FastifyRequest {
      user: { id: string; email: string; role: string; restaurantId: string | null }
    }
  }

requireAuth: FastifyPreHandler
  - Extrai Bearer token do Authorization header
  - Verifica com fastify.jwt.verify()
  - Decora request.user
  - 401 se inválido

requireRole(...roles: string[]): FastifyPreHandler
  - Usa requireAuth primeiro
  - 403 se request.user.role não está em roles

Atalhos exportados:
  requireAdmin = requireRole('admin')
  requireTenantStaff = requireRole('admin', 'attendant')
  requireCook = requireRole('admin', 'cook')
  requireDriver = requireRole('driver')
```

### Tarefa 7.17 — `api/src/middlewares/tenant.middleware.ts`

```
declare module 'fastify' {
  interface FastifyRequest { tenant: Restaurant }
}

requireTenant: FastifyPreHandler
  - Resolve via request.user.restaurantId (se logado) ou request.params.slug
  - Usa tenant.service.resolve()
  - Decora request.tenant
  - 404 se não encontrado
  - 403 se inativo
```

### Tarefa 7.18 — `api/src/middlewares/rate-limit.middleware.ts`

```
Exportar configurações de rate limit para uso nas rotas:

export const limits = {
  publicMenu:   { max: 200, timeWindow: '1 minute' },
  createOrder:  { max: 30,  timeWindow: '1 minute' },
  payOrder:     { max: 10,  timeWindow: '1 minute' },
  admin:        { max: 100, timeWindow: '1 minute' },
  auth:         { max: 10,  timeWindow: '1 minute' },
}

Key generator: tenant:${req.tenant?.id ?? req.ip}
```

### Tarefa 7.19 — `api/src/controllers/auth.controller.ts`

```
login(req, reply):
  - Valida email + password
  - Busca User por email
  - Verifica senha com argon2.verify()
  - Gera JWT: { id, email, role, restaurantId } exp 7d
  - Retorna { token, user: { id, name, email, role } }
  - 401 se credenciais inválidas

Não implementar register por ora (admin é criado via seed/migration).
```

### Tarefa 7.20 — `api/src/controllers/menu.controller.ts`

```
getMenu(req, reply):
  - Slug em req.params.slug
  - cache.getMenu(restaurantId)
  - Retorna { restaurant: { name, logo, deliveryFee, minOrder, gateway }, categories: [...] }
  - 404 se não encontrado

getProduct(req, reply):
  - Busca produto com optionGroups e options
  - Verifica que produto pertence ao tenant correto

createCategory, updateCategory, deleteCategory:
  - Auth: requireTenantStaff
  - Validação Zod
  - Invalidar cache após write

createProduct(req, reply):
  - Validação Zod productSchema
  - Upload de imagem: receber multipart, enviar para Supabase Storage, salvar URL
  - Invalidar cache

updateProduct, deleteProduct, toggleAvailability:
  - Auth: requireTenantStaff
  - Invalidar cache após cada mutação
```

### Tarefa 7.21 — `api/src/controllers/order.controller.ts`

```
createOrder(req, reply):
  - Validar: restaurantId, items[], deliveryAddress ou type=pickup
  - Verificar que todos os productIds pertencem ao restaurante
  - Calcular total (soma items × prices + deliveryFee)
  - Criar Order + OrderItems em transação Prisma ($transaction)
  - Retornar { orderId, total }

payOrder(req, reply):
  - rate limit: limits.payOrder
  - Validar que Order.restaurantId === req.tenant.id
  - Enfileirar job paymentQueue: { orderId, token, gateway }
  - Retornar 202 { status: 'processing', message: 'Pagamento em processamento' }

getOrder(req, reply):
  - Retornar Order com items e delivery
  - NÃO retornar payloadRequest/payloadResponse (dados sensíveis)
  - 404 se não encontrado

listAdminOrders(req, reply):
  - Filtros: status, date range, page, limit (default 20)
  - Apenas pedidos do tenant autenticado
  - Retornar paginado: { orders, total, page, pages }

updateOrderStatus(req, reply) [kitchen]:
  - Transições válidas: confirmed→preparing, preparing→ready
  - Emitir socket event após atualização
  - 400 se transição inválida

cancelOrder(req, reply) [admin]:
  - Só cancelar se status in ['pending', 'confirmed']
  - Salvar cancelReason
  - Emitir socket event
```

### Tarefa 7.22 — `api/src/controllers/payment.controller.ts`

```
getPaymentStatus(req, reply):
  - Buscar TenantPaymentAccount do tenant
  - Retornar { gateway, status, commissionPercent } (sem tokens)

getMpAuthorizeUrl(req, reply):
  - Gerar URL OAuth: https://auth.mercadopago.com/authorization?...
  - Incluir state = JWT assinado com restaurantId (CSRF protection)
  - Retornar { url }

mpCallback(req, reply):
  - Validar state JWT
  - Trocar code por token via mercadopago.service.exchangeOAuthCode()
  - Criptografar e salvar TenantPaymentAccount
  - Redirect para /admin/financeiro?success=true

connectPagBank(req, reply):
  - Validar email
  - Chamar pagbank.service (placeholder: salvar direto por ora)
  - Retornar { success: true }

handleWebhookMP(req, reply):
  - mercadopago.service.validateWebhookSignature()
  - Enfileirar job webhookQueue
  - Retornar 200 IMEDIATAMENTE (< 100ms)

handleWebhookPB(req, reply):
  - Mesma lógica
```

### Tarefa 7.23 — `api/src/controllers/delivery.controller.ts`

```
listAvailable(req, reply):
  - Pedidos com status='ready' e sem driverId no restaurante do driver logado
  - Incluir address, estimatedDistance

acceptDelivery(req, reply):
  - Criar/atualizar Delivery com driverId, status='assigned'
  - Emitir socket event

pickupDelivery(req, reply):
  - Delivery status='picked_up', pickupTime=now
  - Order status='dispatched'
  - Emitir 'order:dispatched' para cliente

completeDelivery(req, reply):
  - Delivery status='delivered', deliveryTime=now
  - Order status='delivered'
  - Emitir 'order:delivered' para cliente
```

### Tarefa 7.24 — `api/src/controllers/report.controller.ts`

```
getSalesSummary(req, reply):
  - Métricas do dia atual: count orders, sum total, avg ticket
  - Cache Redis 5min (key: `report:summary:${restaurantId}:${today}`)
  - Usar Prisma aggregate

getSalesReport(req, reply):
  - Filtro por from/to (date range)
  - Top 10 produtos por quantidade e por receita
  - Vendas por dia no período

getSplitReport(req, reply):
  - Lista PaymentTransactions paginada
  - Totais: totalAmount, totalFee, totalSeller
  - Exportar CSV: query param ?format=csv
```

### Tarefa 7.25 — `api/src/routes/health.routes.ts`

```
GET /health:
  1. Verificar prisma.$queryRaw`SELECT 1`
  2. Verificar redis.ping()
  3. Retornar:
     { status: 'ok', uptime: process.uptime(), version: '2.0.0', db: 'ok', redis: 'ok' }
  4. Em falha parcial: status 'degraded', HTTP 200 (não 500, para não derrubar o LB)
```

### Tarefa 7.26 — Arquivos de rotas

Criar cada arquivo de rotas com o padrão:

```typescript
// Padrão para todos:
import { FastifyInstance } from 'fastify'

export default async function xyzRoutes(fastify: FastifyInstance) {
  // registrar hooks preHandler
  // registrar cada rota com método, URL, config (rateLimit), handler
}
```

**`api/src/routes/admin.routes.ts`** — prefixo `/api/admin`, auth: requireTenantStaff
  - Cardápio: CRUD categorias e produtos
  - Relatórios, configurações, pagamentos
  - Pedidos: list, cancel

**`api/src/routes/client.routes.ts`** — prefixo `/api/client`, sem auth (exceto pay)
  - `GET /menu/:slug` — rateLimit publicMenu
  - `GET /products/:id`
  - `POST /orders` — rateLimit createOrder
  - `POST /orders/:id/pay` — requireAuth + rateLimit payOrder
  - `GET /orders/:id` — sem auth (acesso por ID público)

**`api/src/routes/kitchen.routes.ts`** — prefixo `/api/kitchen`, auth: requireCook
  - `GET /orders`
  - `PATCH /orders/:id/start`
  - `PATCH /orders/:id/ready`

**`api/src/routes/delivery.routes.ts`** — prefixo `/api/delivery`, auth: requireDriver
  - `GET /available`
  - `POST /orders/:id/accept`
  - `POST /orders/:id/pickup`
  - `POST /orders/:id/deliver`

**`api/src/routes/store.routes.ts`** — prefixo `/api/store`, auth: requireTenantStaff
  - `GET /products`
  - `POST /orders` (pedido presencial, type: in_store)
  - `PATCH /orders/:id/status`

**`api/src/routes/webhooks.routes.ts`** — prefixo `/api/webhooks`, sem auth JWT
  - `POST /payment/mercadopago`
  - `POST /payment/pagbank`
  - IMPORTANTE: desabilitar body parser (receber raw body para validação HMAC)

### Tarefa 7.27 — `api/src/socket.ts`

```
import { Server } from 'socket.io'
import { createAdapter } from '@socket.io/redis-adapter'
import { redis } from './lib/redis.js'

let io: Server

export function initSocket(httpServer: unknown): Server {
  io = new Server(httpServer, {
    cors: { origin: process.env.FRONTEND_URL ?? 'http://localhost:3000', credentials: true },
    adapter: createAdapter(redis, redis.duplicate()),
  })

  io.use(async (socket, next) => {
    const token = socket.handshake.auth.token
    if (!token) return next(new Error('Não autenticado'))
    try {
      // Verificar JWT (usar mesma chave do Fastify)
      // Decorar socket.data.user
      next()
    } catch {
      next(new Error('Token inválido'))
    }
  })

  io.on('connection', (socket) => {
    socket.on('join', (room: string) => socket.join(room))
    socket.on('leave', (room: string) => socket.leave(room))
  })

  return io
}

export function getIO(): Server {
  if (!io) throw new Error('Socket.io não inicializado')
  return io
}
```

### Tarefa 7.28 — `api/src/server.ts`

```
Bootstrap completo do Fastify:

1. Instanciar Fastify com { logger: pinoLogger, trustProxy: true }
2. Register @fastify/helmet
3. Register @fastify/cors com origin do FRONTEND_URL
4. Register @fastify/jwt com JWT_SECRET
5. Register @fastify/rate-limit com store Redis
6. Decorar request.user e request.tenant (defaults null)
7. Registrar todas as rotas com fastify.register(routes, { prefix })
8. initSocket(fastify.server)
9. Graceful shutdown:
   process.on('SIGTERM', async () => {
     await fastify.close()
     await prisma.$disconnect()
     await redis.quit()
     process.exit(0)
   })
10. fastify.listen({ port: PORT, host: '0.0.0.0' })
11. Log de inicialização com versão, porta, ambiente
```

### Tarefa 7.29 — Workers BullMQ

**`api/src/queue/payment.worker.ts`:**
```
Worker da fila 'payment'.
Ao receber job { orderId, token, gateway }:
  1. Log: `Processando pagamento para pedido ${orderId}`
  2. Chamar split.service.process({ orderId, token, gateway })
  3. Em sucesso: socket.service.emitToOrder(orderId, 'order:confirmed', { orderId })
              + socket.service.emitToKitchen(restaurantId, 'new_order', orderSummary)
              + socket.service.emitToAdmin(restaurantId, 'new_order', orderSummary)
  4. Em falha: socket.service.emitToOrder(orderId, 'order:payment-failed', { orderId, message })
  5. Log de cada tentativa e resultado
Concurrency: 5 (processar 5 pagamentos em paralelo por instância)
```

**`api/src/queue/webhook.worker.ts`:**
```
Worker da fila 'webhook'.
Ao receber job { gateway, event, payload }:
  1. Se evento 'payment.approved': atualizar PaymentTransaction.splitStatus = 'done'
  2. Se evento 'payment.refunded': splitStatus = 'refunded', Order.paymentStatus = 'refunded'
  3. Se evento 'chargeback': splitStatus = 'chargeback', emitToAdmin(restaurantId, 'chargeback_alert', ...)
  4. Log estruturado com gateway + event + resultado
Concurrency: 10
```

---

## FASE 8 — Admin Dashboard (Frontend)

### Tarefa 8.1 — `app/(admin)/layout.tsx`

```
Server component.
Verificar auth: se role não in ['admin', 'attendant'] → redirect('/login')

Layout dois-painéis:
  - Sidebar esquerda (hidden em mobile)
  - Main content à direita

Sidebar:
  - Header: Logo "Foodbio" + nome do restaurante
  - Links com Lucide icons:
    Dashboard (LayoutDashboard), Cardápio (UtensilsCrossed),
    Pedidos (ShoppingBag), Financeiro (CreditCard),
    Relatórios (BarChart2), Configurações (Settings), Sair (LogOut)
  - Fundo: bg-zinc-900 text-zinc-400
  - Link ativo: text-white border-l-2 border-[var(--color-lime-primary)]
  - Largura: w-64

Mobile: bottom nav com ícones (igual ao e-commerce)
```

### Tarefa 8.2 — `components/admin/MetricsCard.tsx`

```
Props: title, value, subtitle?, icon: ReactNode, trend?: { value: number; label: string }

Estilo: bg-white rounded-[28px] p-6 border border-black/5
  Ícone: bg-[var(--color-app-bg)] p-3 rounded-[16px]
  Trend positivo: text-green-600 | negativo: text-red-500
```

### Tarefa 8.3 — `app/(admin)/dashboard/page.tsx`

```
'use client'
useQuery: GET /bff/admin/reports/summary
useSocket room: admin:{restaurantId}
  Ouvir 'new_order': invalidar query de resumo + toast.success('Novo pedido!')

Renderizar:
  - Grid 2×2 de MetricsCard: Pedidos hoje, Faturamento, Ticket médio, Ativos agora
  - Lista dos últimos 10 pedidos com Badge de status
  - Card de status da conta gateway (se não configurada: CTA "Configurar pagamento")
```

### Tarefa 8.4 — `app/(admin)/financeiro/conectar/page.tsx`

```
Dois cards lado a lado:
  1. Mercado Pago: logo + "Checkout transparente + split automático"
     Botão: "Conectar Mercado Pago" → GET /bff/admin/payment/mp/authorize → redirect para URL retornada

  2. PagBank: logo + descrição
     Formulário: Input email + Botão "Conectar PagBank"
     Submit: POST /bff/admin/payment/pb/connect

Após conectar: redirect para /admin/financeiro?connected=true com toast.success
```

---

## FASE 9 — KDS, PDV e Entregador

### Tarefa 9.1 — `components/kitchen/KDSCard.tsx`

```
Props: order: OrderWithItems, onStart: () => void, onReady: () => void

Visual:
  - Fundo branco, borda esquerda colorida por tempo:
    < 10min: border-green-400
    10-20min: border-yellow-400
    > 20min: border-red-500 + animação de pulso
  - Cabeçalho: "#1234" + tempo decorrido (useInterval a cada segundo)
  - Lista de itens: quantity × nome + observações em italic
  - Badges das opcionais (pills pequenas)
  - Botões na base:
    status='confirmed': "Iniciar Preparo" (variant primary)
    status='preparing': "Marcar como Pronto" (variant dark)
  - Rounded-[28px], shadow, p-4
```

### Tarefa 9.2 — `components/kitchen/KDSBoard.tsx`

```
Três colunas: "Aguardando" | "Preparando" | "Pronto"
  Cabeçalho de coluna: bg-zinc-100 rounded-[20px] px-4 py-2 font-bold + badge com count

Dados:
  useQuery: GET /bff/kitchen/orders
  useSocket room: kitchen:{restaurantId}
  Ouvir 'new_order': adicionar ao estado local + som
  Ouvir 'order:update': mover card para coluna correta

Som de alerta:
  new Audio('/sounds/new-order.mp3').play() em novos pedidos
  (criar arquivo de som vazio, usuário substituirá)

Drag para reordenar dentro da coluna (usar @dnd-kit/sortable — adicionar dep)
```

### Tarefa 9.3 — `components/pdv/POSProductGrid.tsx`

```
Layout responsivo: 3 colunas no desktop, 2 no tablet
Cards menores que o e-commerce (sem texto de descrição, só nome + preço + foto)
Busca inline no topo
Click em produto: se tem opcionais, abrir Modal; senão, adicionar direto ao carrinho PDV
```

### Tarefa 9.4 — `components/pdv/POSCart.tsx`

```
Painel direito do PDV.
Lista de items com subtotal.
Formas de pagamento: radio group [Dinheiro] [Pix] [Cartão]
  Pix: ao selecionar, exibir botão "Gerar QR Code" → GET /bff/store/pix-qr
  Cartão: exibir mensagem "Passar no terminal externo"
  Dinheiro: campo "Valor recebido" → calcula troco
Botão "Finalizar Pedido" → POST /bff/store/orders { type: 'in_store', items, paymentMethod }
```

### Tarefa 9.5 — `components/delivery/DeliveryCard.tsx`

```
Props: delivery: DeliveryWithOrder, onAccept?, onPickup?, onDeliver?

Exibe:
  - Endereço de coleta (restaurante)
  - Endereço de entrega (cliente)
  - Valor do pedido + taxa estimada (placeholder)
  - Botão de ação condicionado ao status:
    waiting: "Aceitar Corrida"
    assigned: "Confirmar Coleta"
    picked_up: "Confirmar Entrega"
```

---

## FASE 10 — Testes Críticos

### Tarefa 10.1 — `api/src/services/__tests__/split.service.test.ts`

```
Framework: Vitest

Mocks necessários:
  - vi.mock('../mercadopago.service.js')
  - vi.mock('../pagbank.service.js')
  - vi.mock('../../lib/prisma.js')

Casos de teste OBRIGATÓRIOS:
  ✓ Calcula corretamente 8% de marketplaceFee (100.00 → fee=8.00, seller=92.00)
  ✓ Arredondamento correto de valores (evitar floating point: 33.33333...)
  ✓ Chama mercadopago.service.createOrder com processing_mode aggregator
  ✓ Chama pagbank.service.createOrder com receivers corretos
  ✓ Idempotência: Order já com paymentStatus='approved' → throw sem chamar gateway
  ✓ Restaurante sem TenantPaymentAccount → throw com mensagem amigável
  ✓ Gateway retorna erro → Order fica com paymentStatus='failed'
  ✓ Salva PaymentTransaction com todos os campos corretos
```

### Tarefa 10.2 — `api/src/queue/__tests__/payment.worker.test.ts`

```
Casos:
  ✓ Job processado com sucesso → socket emitido, DB atualizado
  ✓ Gateway timeout na primeira tentativa → worker retenta
  ✓ 3 falhas consecutivas → job marcado como failed, socket emite payment-failed
  ✓ Job com orderId inexistente → falha graceful sem crash do worker
```

---

## FASE 11 — Deploy e CI/CD

### Tarefa 11.1 — `api/Dockerfile`

Usar multi-stage build conforme definido na seção 8 do PRD.md.
Adicionar HEALTHCHECK e USER node (não rodar como root).

### Tarefa 11.2 — `fly.toml`

Copiar exatamente a configuração da seção 11 do PRD.md.
`min_machines_running = 2` em produção.

### Tarefa 11.3 — `.github/workflows/ci.yml`

Pipeline: lint → typecheck → test → build → deploy (apenas em push para main).

---

## VERIFICAÇÕES FINAIS

Antes de encerrar, verifique:

```bash
# Frontend
npm run build         # deve passar sem erros
npm run lint          # zero warnings

# Backend
cd api
npm run build         # tsc sem erros
npm test              # todos os testes passando

# Estrutura
ls components/ui/     # 7 arquivos
ls store/             # 2 arquivos
ls api/src/services/  # 7 arquivos
ls api/src/routes/    # 7 arquivos
```

Ao final, `PROGRESSO.md` deve ter **todas** as checkboxes marcadas com ✅.

---

## NOTAS IMPORTANTES PARA A GEMINI

1. **Não instale dependências sozinha sem registrar em `PROGRESSO.md` na seção "Log de Mudanças".**
2. **Se uma feature do PRD for impossível de implementar** (limitação de API, biblioteca depreciada, etc.), registre em "Bloqueios" e implemente um placeholder com comentário `// TODO: [razão]`.
3. **Dados sensíveis:** Nunca logar tokens, senhas ou dados de cartão. Usar as configurações `redact` do Pino.
4. **Arquivos protegidos:** `app/globals.css`, `lib/data.ts`, `lib/utils.ts` — NÃO MODIFICAR.
5. **Se não tiver certeza sobre um comportamento**, implemente a versão mais simples e registre em "Log de Mudanças" o que foi simplificado.
6. **Atualizar `PROGRESSO.md` a cada arquivo** — este é o contrato de trabalho entre você e o desenvolvedor humano.
