# PRD — Foodin SaaS: Análise de Completude e Requisitos Pendentes
**Versão:** 1.0 | **Data:** 2026-05-16 | **Analista:** Claude Sonnet 4.6

---

## 1. Resumo Executivo

O **Foodin** é uma plataforma SaaS multi-tenant para gestão de delivery e restaurantes. Permite que donos de estabelecimento configurem seu próprio cardápio digital, recebam pedidos, processem pagamentos (PIX e cartão de crédito via Mercado Pago e PagBank com split automático) e gerenciem entregas — tudo em uma interface white-label acessada pelo slug do tenant (ex: `/meu-restaurante`).

**Estado atual:** O projeto possui uma base sólida de arquitetura e UI/UX, porém tem **bloqueadores críticos de produção** que impedem que várias telas funcionem, além de falhas de segurança, integrações incompletas e ausência de funcionalidades core. O sistema não está pronto para produção.

**Stack:**
- Frontend: Next.js 15 (App Router, SSR) + React 19 + Tailwind v4
- Backend API: Fastify (porta 3001) + Prisma ORM + PostgreSQL (Neon) + Redis + BullMQ
- Pagamentos: Mercado Pago + PagBank
- Real-time: Socket.IO
- Auth: NextAuth.js v5 (JWT strategy)

---

## 2. Análise da Lógica de Negócios

### O que o sistema deveria fazer (intenção)
1. **Cliente final** navega pela vitrine do restaurante, monta carrinho, faz checkout (delivery ou retirada), paga via PIX ou cartão, e acompanha o pedido em tempo real.
2. **Admin do restaurante** gerencia cardápio, acompanha pedidos em tempo real, acessa relatórios de vendas e repasses financeiros.
3. **Cozinha (KDS)** visualiza e avança pedidos em um display dedicado.
4. **Entregador** visualiza pedidos prontos, aceita entregas e confirma coleta/entrega.
5. **PDV** permite venda rápida no balcão sem o fluxo de e-commerce.
6. **Superadmin** cria e gerencia todas as empresas (tenants), planos e assinaturas.

### O que o sistema faz agora
- A vitrine do cliente funciona (SSR, cardápio, carrinho, checkout parcialmente).
- O PIX funciona (geração do QR Code, webhook do Mercado Pago atualiza o banco).
- O admin tem UI para pedidos, cardápio e configurações — mas muitas chamadas de API estão com rotas mortas.
- O KDS, o PDV, o entregador e o módulo de relatórios **não funcionam** em produção.
- A autenticação existe mas o middleware de proteção é incompleto.

---

## 3. Requisitos Funcionais Faltantes

### 🔴 PRIORIDADE ALTA — Bloqueadores de Produção

#### RF-001: Corrigir rotas BFF mortas (bloqueador crítico)
Diversas páginas chamam `/bff/...` que não existe como proxy nem no Next.js nem no Fastify. As seguintes chamadas estão quebradas:

| Página/Arquivo | Rota chamada (quebrada) | Rota correta |
|---|---|---|
| `dashboard/page.tsx` | `/bff/api/admin/reports/summary` | `/api/admin/orders` + novo endpoint |
| `dashboard/page.tsx` | `/bff/api/admin/orders` | `/api/admin/orders` |
| `dashboard/page.tsx` (mutation) | `/bff/api/admin/orders/${id}/status` | `/api/admin/orders/${id}` (PATCH) |
| `relatorios/page.tsx` | `/bff/api/admin/reports/sales?period=30d` | Endpoint inexistente no Next.js |
| `financeiro/page.tsx` | `/bff/api/admin/reports/summary` | Endpoint inexistente no Next.js |
| `financeiro/page.tsx` | `/bff/api/admin/reports/splits` | Endpoint inexistente no Next.js |
| `cozinha/page.tsx` (KDSBoard) | `/bff/admin/orders?...status=CONFIRMED` | `/api/admin/orders` |
| `pdv/page.tsx` | `/bff/store/${slug}/menu` | `/api/store/${slug}/info` ou direto |
| `entregas/page.tsx` | `/bff/api/delivery` | Endpoint Next.js inexistente |
| `entregas/page.tsx` | `/bff/api/delivery/${id}/pickup` | Endpoint Next.js inexistente |
| `entregas/page.tsx` | `/bff/api/delivery/${id}/deliver` | Endpoint Next.js inexistente |
| `hooks/use-orders.ts` `useAdminOrders` | `/bff/api/admin/orders` | `/api/admin/orders` |
| `hooks/use-orders.ts` `usePayOrder` | `/bff/api/client/orders/${id}/pay` | Endpoint inexistente |

**Critério de aceite:** Todas as páginas carregam dados sem erros 404/network na aba Network.

#### RF-002: Criar endpoints Next.js faltantes
Os seguintes Route Handlers não existem e precisam ser criados:

- `GET /api/admin/reports/summary` — métricas do dia (faturamento, pedidos, ticket médio)
- `GET /api/admin/reports/sales?period=7d|30d|90d` — relatório por período com `byDay`, `topProducts`, `averageTicket`
- `GET /api/admin/reports/splits` — listagem de transações/repasses
- `GET /api/admin/reports/financeiro` — sumário financeiro (totalRevenue, totalFees, totalPayout, contadores)
- `GET /api/delivery` — entregas do motorista autenticado
- `POST /api/delivery/[id]/pickup` — confirmar coleta
- `POST /api/delivery/[id]/deliver` — confirmar entrega

**Critério de aceite:** Cada endpoint retorna dados corretos com autenticação e filtra por tenant/driver.

#### RF-003: Corrigir discrepância nos campos de métricas do Dashboard
O `getSummary` do Fastify retorna `{ ordersToday, revenueToday, avgTicket }`, mas o `Dashboard` espera `{ totalRevenue, orderCount }`. O endpoint Next.js a ser criado (RF-002) deve retornar o shape que o frontend espera, incluindo `totalRevenue`, `orderCount`, `averageTicket`, `newCustomers`.

**Critério de aceite:** Cards de métricas exibem valores reais (não zeros ou null).

#### RF-004: Corrigir status case no KDS
O `KDSBoard` filtra por `status === 'CONFIRMED'` e `status === 'PREPARING'` (maiúsculas) e envia mutações com `'READY'`, `'CANCELLED'` (maiúsculas), mas o banco armazena `confirmed`, `preparing`, `ready`, `cancelled` (minúsculas). Tudo deve ser minúsculo.

**Critério de aceite:** Pedidos aparecem no KDS e avançam de status corretamente.

#### RF-005: Implementar e popular o `useSessionStore` (tenant)
O `useSessionStore` de `session-store.ts` é consumido em `Dashboard`, `cozinha/page.tsx`, `pdv/page.tsx` e `relatorios/page.tsx`, mas `setTenant()` nunca é chamado em nenhum lugar. O `tenant` sempre é `null`, tornando as queries dependentes de `enabled: !!tenant?.id` nunca executadas.

Deve-se popular o store no layout admin (`app/(admin)/layout.tsx`) após autenticação, usando os dados do `useSession()`.

**Critério de aceite:** `tenant.id` e `tenant.slug` existem no store ao entrar em qualquer página admin.

#### RF-006: Implementar PDV completo
O botão "Finalizar" no PDV (`pdv/page.tsx`) está desabilitado quando o carrinho está vazio, mas quando há itens ele não cria pedido nem processa pagamento — não tem `onClick` handler implementado. O PDV precisa:

1. Criar pedido via `/api/store/orders` (tipo `in_store`)
2. Suportar pagamento em dinheiro (cash) — sem gateway
3. Suportar PIX (QR Code local)
4. Exibir recibo pós-venda
5. Suporte a descontos manuais

**Critério de aceite:** Atendente consegue finalizar uma venda do início ao fim sem o fluxo e-commerce.

#### RF-007: Correção da transição de status `pending → confirmed`
O `updateOrderStatus` em `order.controller.ts` define `validTransitions` apenas como `confirmed → preparing` e `preparing → ready`. A transição `pending → confirmed` (aprovação manual do admin) não está mapeada. O admin que clica em "Avançar" num pedido pendente recebe erro `Transição de status inválida`.

A rota admin direta (`PATCH /orders/:id/status` em `admin.routes.ts`) contorna isso, mas bypass a máquina de estados — qualquer status pode ser definido sem validação.

**Critério de aceite:** O fluxo completo `pending → confirmed → preparing → ready → dispatched → delivered` funciona com validações em ambos os backends.

#### RF-008: Socket não emite evento ao cliente após confirmação PIX via webhook
Quando o webhook do Mercado Pago (`/api/webhooks/mercadopago/route.ts`) recebe `status=approved`, ele atualiza o banco mas **não emite evento Socket.IO** para o cliente que está aguardando na página `/pedido/[id]`. A página de acompanhamento refaz poll a cada 5s como fallback, mas o usuário não recebe feedback imediato.

Deve ser integrada a emissão de evento `order:confirmed` via Socket.IO após aprovação do webhook.

**Critério de aceite:** A tela do pedido muda de "Aguardando PIX" para "Confirmado" em menos de 2s após pagamento.

---

### 🟠 PRIORIDADE MÉDIA — Funcionalidades Core Ausentes

#### RF-009: Histórico de pedidos do cliente
A página `/[slug]/conta` exibe apenas dados cadastrais. Não há listagem de pedidos passados do cliente. Deve ser criado endpoint `GET /api/store/orders?customerId=...` e UI de listagem na página de conta.

#### RF-010: Pagamento em dinheiro (COD)
O schema permite `paymentMethod: cash` mas não há opção no checkout. Para pedidos de retirada (`pickup`), o cliente deve poder selecionar "Pagar na retirada" (dinheiro ou maquininha). Não requer gateway; apenas criar o pedido com `paymentStatus: pending` e deixar admin confirmar recebimento.

#### RF-011: Validação de pedido mínimo (`minOrderValue`)
O campo `minOrderValue` do tenant é configurável mas **não é validado** nem no frontend (carrinho) nem no backend (criação de pedido). O cliente pode finalizar um pedido abaixo do mínimo.

Adicionar:
- Aviso no carrinho quando subtotal < minOrderValue
- Bloqueio do checkout com mensagem clara
- Validação server-side no `POST /api/store/orders`

#### RF-012: Validação de raio de entrega
O `deliveryRadius` existe no schema mas nunca é verificado. O backend deve calcular a distância entre o CEP do restaurante e o CEP do cliente (usando a API ViaCEP + cálculo haversine ou geocoding) e rejeitar pedidos fora do raio configurado.

#### RF-013: Controle de horário de funcionamento
O campo `openingHours` existe no schema mas nunca é verificado. O sistema aceita pedidos 24h. Deve haver:
- Verificação server-side ao criar pedido
- Aviso visual na vitrine quando a loja está fechada
- Possibilidade de ativar/desativar aceite de pedidos manualmente

#### RF-014: Desconto / Cupom
O campo `discount` existe no `Order` mas não há UI nem lógica para aplicar descontos. O admin deve poder criar cupons de desconto (percentual ou valor fixo) e o cliente deve poder inserir no checkout.

#### RF-015: Gerenciamento de endereços do cliente
O `Customer.addresses` é um campo JSON mas nunca é populado nem usado. Deve haver:
- Opção de salvar endereço após primeiro pedido
- Listagem de endereços salvos no checkout
- Opção de excluir endereço

#### RF-016: Exportação CSV de relatórios
O botão "Exportar CSV" na página de Relatórios **não faz nada** (`onClick` não implementado). Deve gerar e baixar um arquivo CSV com os dados do período selecionado.

#### RF-017: Notificações por e-mail
Não há nenhum serviço de e-mail implementado. Devem ser enviados e-mails para:
- Cliente: confirmação de pedido, falha no pagamento, pedido pronto para retirada, entregador a caminho
- Admin: novo pedido recebido (opcional — por preferência)

Sugestão: Resend ou SendGrid.

#### RF-018: Imagem de produto obrigatória no cardápio (admin)
O admin pode criar produto sem imagem. Não há placeholder visual consistente. A UI deveria guiar para upload ou permitir produto sem imagem com placeholder padronizado.

#### RF-019: Gerenciamento de option groups/adicionais no admin
O modelo `OptionGroup` e `Option` existem no banco, o checkout/KDS os exibem, mas **não há UI no admin** para criar/editar grupos de adicionais (ex: "Ponto da carne", "Extras"). O admin não consegue gerenciar complementos pelo painel.

#### RF-020: Entregador — aceite manual de pedidos
A tela de entregador (`/entregas`) lista as entregas mas **não tem botão de aceite/recusa**. O `listAvailable` lista pedidos com `status: ready` sem delivery associado, mas não há endpoint de aceite exposto no Next.js. O endpoint Fastify (`POST /api/delivery/orders/:id/accept`) existe mas precisa de JWT Fastify, não NextAuth.

---

### 🟡 PRIORIDADE BAIXA — Melhorias e Funcionalidades Complementares

#### RF-021: Push notifications (PWA)
O `next-pwa` está instalado mas não há implementação de push notifications. Clientes deveriam receber push quando o pedido avança de status.

#### RF-022: Controle de estoque por produto
Não há campo de estoque. Produtos com estoque zero não podem ser marcados como indisponíveis automaticamente.

#### RF-023: Relatório de clientes
Não há relatório de clientes: quantidade de pedidos por cliente, ticket médio, frequência, churn.

#### RF-024: Multi-usuário no tenant (attendant/cook/driver)
Roles `attendant`, `cook`, `driver` existem no schema mas o admin não tem UI para criar/gerenciar membros da equipe. O superadmin cria apenas o admin inicial.

#### RF-025: Log de auditoria
Nenhuma ação administrativa é registrada (quem cancelou, quem alterou preço, etc.).

#### RF-026: Integração de entrega com mapa
A tela do entregador não exibe mapa. A coordenada do tenant (`coords`) está no schema mas nunca é usada.

---

## 4. Requisitos Não Funcionais Pendentes

### 🔴 SEGURANÇA

#### NF-001: Autenticação nos admin.routes.ts do Fastify não verifica assinatura JWT
O arquivo `api/src/routes/admin.routes.ts` extrai o `tenantId` decodificando manualmente o JWT (`JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString())`) **sem verificar a assinatura**. Qualquer token forjado pode obter acesso de admin.

**Correção:** Substituir por `fastify.addHook('preHandler', requireAdmin)` ou `request.jwtVerify()`.

#### NF-002: Token do gateway não é criptografado
O schema do `TenantPaymentAccount.accessToken` tem o comentário "AES-256-GCM encrypted" mas **nenhuma criptografia é implementada**. O access token do Mercado Pago é salvo em texto plano no banco.

**Correção:** Implementar `crypto.createCipheriv('aes-256-gcm', key, iv)` antes de salvar e `createDecipheriv` antes de usar.

#### NF-003: Middleware de proteção não verifica role
O `middleware.ts` do Next.js apenas verifica se o cookie `authjs.session-token` existe, mas não verifica o role. Um cliente com conta pode acessar `/dashboard` se tiver o cookie de sessão (de um login anterior como customer).

**Correção:** Usar `auth()` do NextAuth no middleware e verificar `session.user.role`.

#### NF-004: CORS single-origin no Fastify
O Fastify configura CORS para apenas um `origin` (`FRONTEND_URL`). Em produção multi-tenant com domínios customizados, as requisições de domínios diferentes serão bloqueadas.

**Correção:** Aceitar lista de origens ou usar callback que verifica o tenant no banco.

#### NF-005: Segredos hardcoded no .env de desenvolvimento
`JWT_SECRET=foodin-super-secret-key-2026` é um segredo fraco e deve ser substituído por uma chave de 256 bits aleatória em produção. O `AUTH_SECRET` no `.env.local` deve ser rotacionado.

#### NF-006: MP_ACCESS_TOKEN da plataforma exposto no `.env` da API
O access token de produção do Mercado Pago (`APP_USR-3919983638581458-...`) está commitado no `.env` da API. Deve ser movido para variável de ambiente segura e nunca commitado.

#### NF-007: Webhook signature validation com bug de timestamp
O `validateWebhookSignature` em `api/src/services/mercadopago.service.ts` usa `Date.now()` para gerar e comparar o manifest, mas o timestamp correto vem no header `x-signature` (`ts=...`). A validação **sempre falha** em produção.

```typescript
// ERRADO (atual):
const manifest = `id:${requestId};request-id:${requestId};ts:${Date.now()};`
// CORRETO:
const ts = signature.match(/ts=([^,]+)/)?.[1] ?? ''
const manifest = `id:${dataId};request-id:${xRequestId};ts:${ts};`
```

#### NF-008: Rate limiting insuficiente
O rate limit está configurado globalmente mas com `global: false` no Fastify — só aplica onde explicitamente configurado. As rotas de criação de pedido, registro de cliente e webhooks não têm rate limit.

#### NF-009: Helmet com CSP desabilitado
`contentSecurityPolicy: false` no Helmet da API remove proteção contra XSS. Deve ser configurado adequadamente.

#### NF-010: Socket.IO sem autenticação nas rooms
Qualquer cliente que conheça o `orderId` ou `tenantId` pode fazer `socket.join('order:UUID')` e ouvir eventos. As rooms devem ser validadas com JWT antes de permitir join.

#### NF-011: Upload de imagem aceita qualquer tipo
O route handler de upload verifica `file.type.startsWith('image/')`, mas o MIME type pode ser forjado pelo cliente. Deve-se validar também por magic bytes (assinatura do arquivo).

---

### 🟠 PERFORMANCE

#### NF-012: Imagens armazenadas como base64 no banco
Quando Cloudinary não está configurado, o upload de imagem (`api/admin/upload/route.ts`) retorna uma data URL base64 que é salva como string no banco. Imagens de 5MB viram strings de ~7MB no PostgreSQL, degradando queries de tenant. 

**Correção:** Tornar Cloudinary (ou AWS S3) obrigatório em produção, ou usar storage local montado em volume persistente.

#### NF-013: Falta de paginação nos relatórios
`getSalesReport` busca todos os pedidos do período sem paginação. Para períodos de 90 dias com muitos pedidos, isso pode causar timeout.

#### NF-014: Admin orders sem paginação funcional
A listagem de pedidos admin (`GET /api/admin/orders`) retorna os últimos 100 pedidos sem controles de paginação na UI. A page de Pedidos não tem scroll infinito ou paginação.

#### NF-015: Polling excessivo no Dashboard
O dashboard faz poll a cada `POLL.DASHBOARD` ms mesmo com Socket.IO conectado. Quando há conexão de socket, o poll deve ser desabilitado.

#### NF-016: Cache do relatório de summary é por dia, não por tenant+hora
O cache `report:summary:${tenant.id}:${today}` expira apenas às 23:59, tornando os dados desatualizados por horas durante o dia.

---

### 🟡 ESCALABILIDADE E OPERAÇÃO

#### NF-017: Redis é single-instance sem HA
O BullMQ depende de Redis em `localhost:6379`. Não há configuração de Redis Cluster ou Sentinel para produção.

#### NF-018: Workers BullMQ não são iniciados automaticamente
Os workers (`payment.worker.ts`, `notification.worker.ts`, `webhook.worker.ts`) são importados no Fastify mas não são explicitamente inicializados. Se o arquivo `queue/index.ts` não for importado, os workers não iniciam.

#### NF-019: Graceful shutdown sem aguardar jobs em flight
O `shutdown()` do Fastify fecha a conexão Redis sem aguardar jobs em processamento no BullMQ terminarem. Jobs de pagamento podem ser perdidos.

#### NF-020: Retry não configurado no payment worker
O `payment.worker.ts` não configura `attempts` no worker, mas o `failed` handler verifica `job.opts.attempts ?? 3`. A opção correta é configurar no `add()` do job.

#### NF-021: Sem monitoramento/alertas
Não há integração com Sentry, Datadog, ou equivalente. Erros de produção não são visíveis.

---

## 5. Casos de Borda e Exceções Não Tratadas

### CE-001: Carrinho de restaurante diferente sem aviso ao usuário
O `cart-store.ts` lança um `Error` se o usuário tentar adicionar item de restaurante diferente. O erro é lançado mas o frontend (`ProductModal`) não tem um `try/catch` que mostre o toast amigável. O produto simplesmente não é adicionado sem feedback.

### CE-002: PIX expirado sem feedback ao cliente
A tela de pedido exibe a data de expiração do PIX, mas não há lógica para detectar quando o PIX expirou e redirecionar o cliente para refazer o pagamento. O pedido fica em `pending` indefinidamente.

### CE-003: Pedido criado mas PIX falhou na geração
No `POST /api/store/orders`, se a geração do PIX falha, o pedido é criado (`status: pending`) mas o response contém `pixError`. A UI redireciona para a página do pedido mostrando o erro, mas o pedido fica órfão sem forma de o cliente pagar novamente.

### CE-004: Cancelamento sem estorno automático
Quando o admin cancela um pedido já pago (`paymentStatus: approved`), o cancelamento ocorre mas o estorno precisa ser feito manualmente pelo admin em outra ação. Não há link nem alerta visível avisando que um estorno é necessário.

### CE-005: Entregador sem Driver record associado
O `listAvailable` retorna 404 se não houver `Driver` para o `userId`. Um usuário com role `driver` mas sem registro `Driver` fica preso numa tela de erro sem orientação.

### CE-006: Produto deletado quebra pedidos históricos
Se um produto for deletado via `DELETE /api/admin/menu/products/[id]`, pedidos históricos que referenciam `productId` ficam com join inválido. A query de `getOrder` usa `JOIN` sem `LEFT JOIN`, quebrando a exibição de pedidos antigos.

**Correção:** Usar `soft delete` (campo `deletedAt`) em vez de exclusão física.

### CE-007: Concorrência na criação de pedidos sem lock
Dois tabs do mesmo cliente podem submeter o mesmo pedido simultaneamente. Não há `idempotency key` no `POST /api/store/orders` do Next.js.

### CE-008: Slug do tenant com caracteres inválidos
O superadmin pode criar tenant com slug contendo espaços, maiúsculas ou caracteres especiais. O slug deve ser validado como URL-safe no backend antes de salvar.

### CE-009: `updateOrderStatus` no Fastify usa `request.tenant` mas a rota admin não aplica `tenantMiddleware`
O `order.controller.ts` acessa `(request as FastifyRequest & { tenant: { id: string } }).tenant` mas o `adminRoutes` não aplica o `tenantMiddleware`. O `request.tenant` é `undefined`, causando erro silencioso — a rota que usa este controller (`PATCH /orders/:id/start` no KDS) falha.

### CE-010: OAuth Facebook sem email retorna email sintético `fb_ID@foodin.social`
Se o Facebook não retornar e-mail (conta sem e-mail vinculado), o sistema cria uma conta com e-mail sintético. Futuras tentativas de login por e-mail para esse usuário falharão, e o usuário não sabe qual e-mail usar.

### CE-011: OAuth Facebook cria Customer sem tenantId
O fluxo de social login cria um `User` sem `tenantId` e cria o `Customer`. Mas esse usuário não aparece nos pedidos de nenhum tenant específico porque o login de cliente é scoped ao tenant via `slug` no checkout. Se o usuário logar pelo OAuth (que não passa `slug`), o `role` será `customer` mas `tenantId` será null — funciona para a sessão, mas pode causar bugs.

### CE-012: Webhook sem idempotência no Next.js
O webhook do Mercado Pago pode ser enviado múltiplas vezes. A query de atualização usa `WHERE "paymentStatus" != 'approved'` para evitar reprocessamento, mas a PaymentTransaction pode ser criada mais de uma vez se a race condition ocorrer.

---

## 6. Integrações e Dependências Externas

### INT-001: Mercado Pago OAuth (MP Connect) não funciona em produção
O fluxo OAuth do MP (`getMpAuthorizeUrl` + `mpCallback`) verifica o state JWT chamando `request.jwtVerify()` — mas nesse handler não há `preHandler: requireAuth`, portanto o JWT não está na request. O decode do state é feito com `request.server.jwt.decode(state)` (sem verificação de assinatura). O callback falhará.

### INT-002: PagBank integração incompleta
- O `connectPagBank` salva o token como `'PENDING'` e diz "aguardando ativação manual" — não há fluxo de ativação
- Não há webhook receiver para PagBank no Next.js (apenas no Fastify)
- O `generatePixQR` do PagBank usa `PB_TOKEN` da plataforma, não o token do tenant — o split não funciona para PagBank
- O `receiverPercent` é calculado como `92` quando `commissionPercent === 8`, mas para outros valores a fórmula `100 - commissionPercent` não garante que a soma dos receivers seja 100%

### INT-003: Cloudinary não configurado
`CLOUDINARY_CLOUD_NAME` e `CLOUDINARY_UPLOAD_PRESET` não estão no `.env.local`. O upload cai no fallback base64. Necessário documentar e configurar antes do deploy.

### INT-004: Facebook OAuth não configurado
`FACEBOOK_APP_ID` e `FACEBOOK_APP_SECRET` estão comentados no `.env.local`. O login social não funciona até serem configurados.

### INT-005: Sem token de refresh para Mercado Pago OAuth
O `TenantPaymentAccount` tem `refreshToken` e `tokenExpiresAt` mas o `exchangeOAuthCode` não os salva e não há job de renovação. Os tokens do MP OAuth expiram e não são renovados automaticamente.

### INT-006: ViaCEP chamada diretamente do frontend
O `CheckoutForm` chama `https://viacep.com.br/ws/${digits}/json/` diretamente do browser. Não há cache, rate limit nem fallback. Se a ViaCEP estiver indisponível, o formulário não bloqueia mas exibe "CEP não encontrado".

### INT-007: MP Webhook Secret não configurado no `.env` da API
O `.env` da API não tem `MP_WEBHOOK_SECRET`, `MP_CLIENT_ID`, `MP_CLIENT_SECRET` ou `MP_REDIRECT_URI` — apenas `MP_ACCESS_TOKEN`. O `mpCallback` e `validateWebhookSignature` do Fastify falharão.

---

## 7. Validações e Regras de Negócio Incompletas

### RN-001: Criação de pedido sem validação de tenant ativo
O `POST /api/store/orders` do Next.js valida `active = true` mas não verifica `planStatus`. Um tenant com `planStatus: suspended` pode continuar recebendo pedidos.

### RN-002: Status de pedido sem máquina de estados no backend Next.js
A rota `PATCH /api/admin/orders/[id]/route.ts` permite qualquer transição de status sem validação. O admin pode colocar um pedido de `pending` direto para `delivered`.

### RN-003: Estorno sem verificação de janela temporal
O estorno via `/api/admin/orders/[id]/refund` não verifica se o pedido está dentro da janela de reembolso do Mercado Pago (180 dias). Tentativas de estorno após o prazo retornarão erro da API do gateway.

### RN-004: Preço do produto não é revalidado no backend ao pagar
Quando o cliente paga por cartão (`payOrder`), o `processSplit` usa `existing.total` do pedido já criado. O preço é calculado apenas na criação do pedido. Porém, um admin poderia alterar o preço do produto entre a criação e o pagamento. Deve-se usar o `total` já salvo no pedido (o que já ocorre), mas o backend deve garantir que este valor é imutável após a criação.

### RN-005: Validação de telefone no cadastro de cliente insuficiente
O `checkoutSchema` valida se há 10+ dígitos, mas não valida formato brasileiro (DDD válido, 8 ou 9 dígitos). Telefones inválidos são aceitos.

### RN-006: Nome do slug com conflito entre tenant e rotas do sistema
Se um tenant tiver slug `login`, `admin`, `api`, `cart`, `details`, etc., as rotas do sistema colidirão com o slug do tenant. Deve-se blacklistar slugs reservados.

### RN-007: Produto pode ser criado sem categoria existente
O `POST /api/admin/menu/products` recebe `categoryId` mas não verifica se a categoria pertence ao tenant. Um admin poderia usar o `categoryId` de outro tenant.

### RN-008: Superadmin senha criada como placeholder sem aviso ao admin
Quando o superadmin cria uma empresa e o `require('argon2')` falha, a senha fica como `$temp$randomHex`. O admin da empresa não consegue logar e não há e-mail de reset. O sistema não avisa que o hash falhou.

---

## 8. UX/UI — Pendências

### UX-001: Dashboard com dados hardcoded visíveis
O `Dashboard` exibe `value={8}` para "Clientes" e `trend={{ value: 12, isPositive: true }}` para faturamento — valores hardcoded que enganam o admin. Devem vir da API.

### UX-002: Admin layout sem indicação de nome/loja logada
O sidebar admin não exibe nome do restaurante nem do usuário logado. O admin não sabe qual tenant está gerenciando.

### UX-003: Sem feedback de erro global no admin
Quando uma query falha (ex: rota morta retorna 404), o card mostra dados em branco sem mensagem de erro. Não há retry automático.

### UX-004: Entregador sem UI para aceitar pedidos disponíveis
A tela de entregador mostra apenas entregas atribuídas. Não há tela para o entregador ver pedidos disponíveis e aceitar manualmente. O sistema atual pressupõe atribuição automática que não existe.

### UX-005: Página conta sem histórico de pedidos
A página `/conta` exibe apenas nome, e-mail e telefone. Sem histórico, o cliente não tem motivo para criar conta.

### UX-006: Sem confirmação antes de cancelar pedido no admin
O admin pode clicar em "Cancelar" no modal de pedido sem confirmação secundária. Uma confirmação com campo de motivo deve ser exibida.

### UX-007: KDS sem som de alerta para novo pedido
A cozinha não recebe alerta sonoro quando chega novo pedido. Em ambiente de cozinha barulhento, a notificação visual pode ser perdida.

### UX-008: Loading do PDV após 404 do BFF fica infinito
Com a rota `/bff/store/.../menu` retornando 404, o PDV fica em skeleton infinito sem mensagem de erro.

### UX-009: Checkout sem feedback de qual item está indisponível
Se um produto ficar indisponível entre adicionar ao carrinho e fazer o checkout, o erro retorna `"Produto indisponível: UUID"` — o UUID não é amigável ao usuário.

### UX-010: Relatorios sem dados exibe tela em branco
Quando não há dados no período selecionado, o relatório exibe uma mensagem simples mas não oferece links de ação ou dicas.

### UX-011: Sem acessibilidade (a11y) básica
Botões sem `aria-label`, modais sem `role="dialog"` e `aria-modal`, ausência de foco gerenciado em modais, sem `alt` descritivo nas imagens de produto.

### UX-012: Formulário de checkout sem autofill de CEP em mobile
O campo CEP tem `inputMode="numeric"` correto mas a máscara no `onChange` não funciona bem em composição de teclado virtual (especialmente iOS). Pode causar double-trigger do `fetchCep`.

---

## 9. Plano de Implementação Sugerido

### Fase 1 — Desbloquear Sistema (Sprint 1-2)
1. **[RF-001]** Mapear e corrigir todas as rotas BFF mortas — substituir por rotas reais
2. **[RF-002]** Criar endpoints Next.js faltantes (reports, delivery)
3. **[RF-003]** Alinhar shape dos dados entre frontend e backend (métricas)
4. **[RF-004]** Corrigir case dos status no KDS
5. **[RF-005]** Popular `useSessionStore` no layout admin
6. **[NF-001]** Corrigir auth no `admin.routes.ts` do Fastify (JWT verify)
7. **[NF-007]** Corrigir bug de validação de assinatura do webhook MP
8. **[CE-009]** Corrigir `request.tenant` undefined no updateOrderStatus

### Fase 2 — Segurança e Estabilidade (Sprint 3)
9. **[NF-002]** Implementar criptografia AES-256-GCM para tokens de gateway
10. **[NF-003]** Corrigir middleware Next.js para verificar role
11. **[NF-005/006]** Rotacionar segredos e remover credenciais do repositório
12. **[NF-010]** Autenticar rooms do Socket.IO
13. **[CE-006]** Implementar soft delete em produtos
14. **[CE-007]** Adicionar idempotency key na criação de pedido
15. **[RN-006]** Blacklist de slugs reservados
16. **[RN-007]** Validar `categoryId` pertence ao tenant

### Fase 3 — Funcionalidades Core Faltantes (Sprint 4-5)
17. **[RF-006]** Implementar PDV completo com finalização
18. **[RF-007]** Corrigir máquina de estados no backend Next.js
19. **[RF-008]** Emitir Socket.IO no webhook de confirmação PIX
20. **[RF-009]** Histórico de pedidos do cliente
21. **[RF-010]** Pagamento em dinheiro (COD)
22. **[RF-011]** Validação de pedido mínimo
23. **[RF-013]** Controle de horário de funcionamento
24. **[RF-019]** UI para gerenciar option groups/adicionais no admin

### Fase 4 — Integrações e Qualidade (Sprint 6)
25. **[INT-001]** Corrigir fluxo OAuth Mercado Pago
26. **[INT-002]** Completar integração PagBank
27. **[INT-003]** Configurar e tornar obrigatório storage de imagem (Cloudinary/S3)
28. **[RF-016]** Exportação CSV de relatórios
29. **[RF-017]** Notificações por e-mail
30. **[NF-019]** Graceful shutdown com aguardo de jobs

### Fase 5 — Melhorias e Escalabilidade (Sprint 7-8)
31. **[RF-012]** Validação de raio de entrega
32. **[RF-014]** Sistema de cupons/descontos
33. **[RF-015]** Gerenciamento de endereços do cliente
34. **[RF-024]** UI para gerenciar membros da equipe (attendant/cook/driver)
35. **[NF-021]** Integração com Sentry para monitoramento de erros
36. **[UX-001 a UX-012]** Melhorias de UX priorizadas

---

## 10. Critérios de Aceite por Pendência

| ID | Critério de Aceite |
|---|---|
| RF-001 | Nenhuma request retorna 404 em produção por rota BFF. Network tab limpo. |
| RF-002 | Todos os endpoints retornam HTTP 200 com dados corretos e autenticados. |
| RF-003 | Cards do Dashboard exibem valores reais do dia, não zeros. |
| RF-004 | Pedidos "confirmed" e "preparing" aparecem no KDS. Avançar status funciona. |
| RF-005 | `useSessionStore().tenant` é not-null em todas as páginas admin após login. |
| RF-006 | PDV finaliza venda, cria pedido tipo `in_store`, imprime resumo na tela. |
| RF-007 | Pedido passa por `pending → confirmed → preparing → ready → delivered` sem erros. |
| RF-008 | Tela de pedido muda de estado em <2s após pagamento PIX confirmado. |
| RF-009 | Cliente vê lista de pedidos passados com status, itens e total. |
| RF-010 | Checkout exibe opção "Pagar na entrega" para tipo pickup. |
| RF-011 | Checkout bloqueia e exibe mensagem quando total < minOrderValue. |
| RF-013 | Vitrine exibe "Loja fechada" e bloqueia pedidos fora do horário. |
| NF-001 | Requisição com token forjado para rota admin retorna 401. |
| NF-002 | Token salvo no banco é ilegível sem a chave de criptografia. |
| NF-003 | Usuário com role `customer` não acessa `/dashboard` mesmo com cookie válido. |
| NF-007 | Webhook do MP é aceito (200) com assinatura válida e rejeitado (401) com inválida. |
| INT-001 | Fluxo completo OAuth MP: autorização → callback → token salvo → pagamento funciona. |
| INT-002 | PagBank PIX gera QR Code real; split credita % correto no tenant. |
| CE-006 | Pedido histórico com produto deletado ainda exibe nome do produto. |
| CE-007 | Dois submits simultâneos do checkout criam apenas 1 pedido. |

---

## 11. Riscos e Dependências

| Risco | Impacto | Probabilidade | Mitigação |
|---|---|---|---|
| Credenciais de produção do MP commitadas no `.env` da API | CRÍTICO — vazamento de dados financeiros | Alta — já aconteceu | Rotacionar token imediatamente, usar secrets manager |
| Redis single-instance em produção | Alto — BullMQ para, pagamentos falham | Média — depende do cloud provider | Usar Redis Cloud / Upstash com replicação |
| Custo inesperado do banco Neon em produção | Médio — queries sem índice em tabelas grandes | Baixa | Revisar índices existentes, adicionar em `PaymentTransaction.createdAt` |
| PagBank integração incompleta atrasa lançamento | Alto — metade dos tenants pode preferir PagBank | Alta | Priorizar MP first, deixar PagBank para v2 |
| Escalabilidade do Socket.IO single-instance | Médio — múltiplos pods perdem eventos | Baixa — enquanto single server | Usar Redis adapter para Socket.IO em multi-pod |
| argon2 não disponível no runtime Next.js (superadmin) | Médio — admin não consegue logar | Alta — já ocorre | Mover hash para a API Fastify ou usar bcryptjs no Next.js |
| Webhook PIX sem retry pode perder confirmações | Alto — pedidos ficam em pending | Baixa — MP tenta 3x | Implementar endpoint de verificação ativa de status |
| Base64 de imagens em DB com 5MB cada | Alto — banco cresce rapidamente, queries lentas | Alta — Cloudinary não configurado | Configurar Cloudinary antes do primeiro tenant em produção |

---

*Este PRD foi gerado com análise estática completa de todos os arquivos do projeto. Cada item foi identificado por leitura direta do código-fonte, sem suposições.*
