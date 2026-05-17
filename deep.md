# 📋 PRD Completo – Foodbio  
**SaaS de Delivery Multi-Tenant com Split de Pagamento**  
**Versão 2.0**

---

## 1. Introdução

### 1.1 Visão do Produto
O **Foodbio** é uma plataforma SaaS completa para restaurantes, lanchonetes e estabelecimentos de alimentação. Oferece um e-commerce integrado para pedidos online (com pagamento via Pix e cartão), um módulo de loja física (PDV), um painel de cozinha para gerenciar a produção por ordem e um app de entregador para logística da última milha. Com a nova versão, o Foodbio atua como marketplace, processando pagamentos e dividindo automaticamente os valores entre o restaurante (seller) e a plataforma por meio do **split de pagamento** das APIs do Mercado Pago ou PagBank, eliminando repasses manuais.

### 1.2 Problema Resolvido
- Pequenos restaurantes não têm capital ou conhecimento para montar um sistema próprio de delivery.
- Soluções atuais cobram altas taxas e não integram PDV, cozinha e entrega num único ecossistema.
- O modelo de repasse manual de pagamentos é trabalhoso, sujeito a erros e atritos.
- Falta de controle sobre a ordem de produção e status dos pedidos gera atrasos.

### 1.3 Proposta de Valor
- Plataforma **multi-tenant** com **comissão zero em assinatura** (monetização via split automático).
- Integração nativa com Mercado Pago e PagBank, com checkout transparente (sem redirecionamento).
- Divisão do valor do pedido entre restaurante e Foodbio no momento da transação.
- PDV, cozinha e entregador conectados em tempo real via WebSockets.
- Ferramentas de marketing local para aquisição de clientes por bairro.

---

## 2. Objetivos Estratégicos

| Objetivo | Meta (6 meses) |
| :--- | :--- |
| Restaurantes ativos | 50 (bairro) → 200 (cidade) → 500 (estado) |
| Pedidos processados/mês | 5.000 no estado |
| Taxa de churn mensal | < 5% |
| MRR (Receita Recorrente Mensal) | R$ 15 mil (comissão sobre vendas) |
| Cobertura geográfica | 3 cidades piloto até o mês 4 |

---

## 3. Personas

### 3.1 Dono do Restaurante (Admin)
- Quer receber pedidos online sem pagar altas taxas fixas.
- Necessita de um PDV simples para balcão.
- Deseja controlar cozinha e expedição em tempo real.
- Quer ferramentas de fidelização e divulgação no bairro.
- **Novo:** Precisa conectar sua conta financeira (Mercado Pago/PagBank) em menos de 2 minutos.

### 3.2 Atendente de Loja (Operador de PDV)
- Registra pedidos presenciais e por telefone.
- Consulta cardápio, aplica descontos, finaliza pagamentos.

### 3.3 Cozinheiro (Módulo Cozinha)
- Visualiza lista de pedidos por ordem de chegada/prioridade.
- Inicia preparo, marca como pronto para entrega/retirada.
- Comunica atrasos à equipe.

### 3.4 Entregador
- Recebe notificações de novas corridas.
- Visualiza rota, confirma entrega.
- Atualiza status do pedido em tempo real.

### 3.5 Cliente Final
- Navega no cardápio online, monta carrinho.
- Escolhe entrega ou retirada, paga via Pix ou cartão (checkout transparente).
- Acompanha status do pedido em tempo real.

---

## 4. Requisitos Funcionais

### 4.1 Módulo Administração (Dashboard Web)
- **Cadastro da loja:** nome, endereço, horários, raio de entrega.
- **Gerenciamento de cardápio:** categorias, produtos, fotos, preços, opções de personalização.
- **Controle de estoque simples:** marcar item indisponível.
- **Configuração de pagamentos:**
  - Conexão com conta Mercado Pago ou PagBank (fluxo de onboarding inline).
  - Visualização do status da conta (ativo, pendente).
  - Configuração da taxa de comissão do Foodbio (definida pela plataforma, exibida ao restaurante).
- **Relatórios:** vendas por período, ticket médio, pratos mais vendidos, faturamento, **relatório de repasses (split)**.
- **Usuários e permissões:** dono, atendente, cozinheiro, entregador.

### 4.2 E‑commerce (PWA – Next.js)
- Cardápio responsivo, busca e filtros.
- Carrinho com cálculo de taxa de entrega (distância ou valor fixo).
- Checkout com opção de retirada ou entrega.
- **Pagamento integrado (checkout transparente):**
  - Cliente insere dados do cartão ou seleciona Pix diretamente na página (sem sair).
  - Tokenização via SDK do Mercado Pago (`MercadoPago.js`) ou PagBank (`PagSeguro.js`).
  - Transação processada pelo BFF com split configurado para o restaurante.
  - Confirmação em tempo real; em caso de falha, mensagem amigável e tentativa de correção.
- Acompanhamento do pedido: status (confirmado, preparando, saiu para entrega, entregue).
- Cadastro/Login social + guest checkout.
- Notificações push via service worker.

### 4.3 Módulo Loja (PDV Presencial – Web Desktop)
- Interface para computador, otimizada para uso rápido.
- Tela de pedidos: montar pedido, selecionar itens, aplicar desconto.
- Formas de pagamento: dinheiro, Pix (QR na tela – gerado via API do gateway), cartão (leitura por terminal externo – integração futura).
- Integração com impressora térmica (via servidor local ou WebUSB).
- Registro de cliente para CRM e fidelidade.
- O pedido presencial também entra na fila da cozinha.

### 4.4 Módulo Cozinha (Web – Tablet/PC)
- Lista de pedidos por prioridade (mais antigo primeiro, reordenação manual possível).
- Exibição de itens, observações, horário, status.
- Ações: “Iniciar Preparo”, “Pedido Pronto”.
- Filtros: pendentes, em preparo, prontos.
- Alerta sonoro/visual para novos pedidos.

### 4.5 Módulo Entregador (App Mobile PWA)
- Lista de corridas disponíveis com endereços de coleta e entrega.
- Confirmação de recebimento do pedido na cozinha.
- Rota otimizada (link para Google Maps).
- Confirmação de entrega (status final).
- Histórico de corridas.
- Notificações push.

### 4.6 Integração de Pagamento com Split

#### 4.6.1 Onboarding Financeiro do Restaurante
- No dashboard admin, o restaurante clica em “Conectar conta financeira”.
- Escolhe Mercado Pago ou PagBank.
- Redirecionado para autorização OAuth (Mercado Pago) ou fluxo de cadastro/vinculação (PagBank).
- O Foodbio armazena o `external_account_id` e tokens necessários na tabela `tenant_payment_accounts`.

#### 4.6.2 Fluxo de Pagamento no Checkout
1. Cliente finaliza pedido e insere dados de pagamento (tokenização no frontend).
2. BFF do Foodbio cria requisição ao gateway escolhido:
   - **Mercado Pago:** POST `/v1/orders` com `processing_mode: "aggregator"` e `marketplace_fee` (comissão do Foodbio). O `seller` é identificado automaticamente porque a transação é feita com o token do marketplace que tem vínculo com a conta do restaurante.
   - **PagBank:** POST `/v1/orders` com `charges.split.receivers` contendo o `account_id` do restaurante e o percentual de divisão.
3. Gateway processa, retorna status.
4. Foodbio registra a transação na tabela `payment_transactions` e atualiza o pedido.

#### 4.6.3 Exemplo de Split (Mercado Pago)
```json
{
  "type": "online",
  "processing_mode": "aggregator",
  "total_amount": "100.00",
  "marketplace_fee": "8.00",
  "external_reference": "order_foodbio_789",
  "payer": { ... },
  "items": [ ... ],
  "payment_method": {
    "payment_method_id": "pix",
    "token": null
  }
}

O Mercado Pago cobra a taxa do seller e depois divide: R 92 00 para o restaurante R 8,00 para o Foodbio (já descontada a taxa do gateway do lado do seller).


4.6.4 Exemplo de Split (PagBank)
json
{
  "reference_id": "order_foodbio_789",
  "charges": [{
    "amount": { "value": 10000, "currency": "BRL" },
    "split": {
      "method": "PERCENT",
      "receivers": [
        { "account_id": "ACCO_RESTAURANTE_1", "percentual": 92.00 }
      ]
    },
    "payment_method": { "type": "CREDIT_CARD", "credit_card": { "token": "token_cartao" } }
  }]
}
A taxa do PagBank é debitada do recebedor primário (Foodbio), que configura sua margem no percentual de split.


5. Requisitos Não Funcionais
Categoria	Descrição
Performance	E‑commerce LCP < 2s; atualizações em tempo real via WebSocket.
Disponibilidade	99,5% no horário comercial (SLA).
Segurança	Token JWT, HTTPS, dados de cartão tokenizados (PCI-DSS do gateway). Conformidade LGPD.
Escalabilidade	BFF stateless, pool de conexões Prisma, arquitetura orientada a eventos.
Responsividade	Módulos loja/cozinha otimizados para desktop/tablet; e‑commerce mobile-first.
Manutenibilidade	Monorepo com separação clara (frontend Next.js, BFF Node.js, Prisma schema).
Observabilidade	Logs estruturados (JSON), Sentry para erros, métricas via Prometheus.

6. Arquitetura do Sistema
6.1 Stack Tecnológica
Camada	Tecnologia
Frontend (Cliente/PWA)	Next.js (SSR/SSG), Tailwind CSS, SWR/React Query, Zustand, next-pwa.
Backend (BFF)	Node.js com Express ou Fastify, autenticação JWT, rotas por domínio.
ORM	Prisma, migrations no PostgreSQL.
Banco de Dados	PostgreSQL (instância gerenciada na cloud).
Autenticação	NextAuth.js (Google, Facebook, e-mail/senha).
Pagamentos	SDKs do Mercado Pago e PagBank; APIs de Orders; webhooks para conciliação.
Tempo real	Socket.io (cozinha, entregador, rastreio do cliente).
Infraestrutura	Vercel (frontend), Railway/Fly.io (BFF), Supabase (DB opcional).

6.2 Modelo BFF (Backend for Frontend)
Rotas principais:

/api/store/* – PDV

/api/kitchen/* – cozinha

/api/delivery/* – entregador

/api/client/* – e‑commerce público

/api/admin/* – gestão

/api/webhooks/payment/* – notificações dos gateways (confirmação de pagamento, chargebacks)

6.3 Modelagem de Dados (Principais Entidades)


4.6.4 Exemplo de Split (PagBank)


{
  "reference_id": "order_foodbio_789",
  "charges": [{
    "amount": { "value": 10000, "currency": "BRL" },
    "split": {
      "method": "PERCENT",
      "receivers": [
        { "account_id": "ACCO_RESTAURANTE_1", "percentual": 92.00 }
      ]
    },
    "payment_method": { "type": "CREDIT_CARD", "credit_card": { "token": "token_cartao" } }
  }]
}

A taxa do PagBank é debitada do recebedor primário (Foodbio), que configura sua margem no percentual de split.

5. Requisitos Não Funcionais
Categoria	Descrição
Performance	E‑commerce LCP < 2s; atualizações em tempo real via WebSocket.
Disponibilidade	99,5% no horário comercial (SLA).
Segurança	Token JWT, HTTPS, dados de cartão tokenizados (PCI-DSS do gateway). Conformidade LGPD.
Escalabilidade	BFF stateless, pool de conexões Prisma, arquitetura orientada a eventos.
Responsividade	Módulos loja/cozinha otimizados para desktop/tablet; e‑commerce mobile-first.
Manutenibilidade	Monorepo com separação clara (frontend Next.js, BFF Node.js, Prisma schema).
Observabilidade	Logs estruturados (JSON), Sentry para erros, métricas via Prometheus.
6. Arquitetura do Sistema
6.1 Stack Tecnológica
Camada	Tecnologia
Frontend (Cliente/PWA)	Next.js (SSR/SSG), Tailwind CSS, SWR/React Query, Zustand, next-pwa.
Backend (BFF)	Node.js com Express ou Fastify, autenticação JWT, rotas por domínio.
ORM	Prisma, migrations no PostgreSQL.
Banco de Dados	PostgreSQL (instância gerenciada na cloud).
Autenticação	NextAuth.js (Google, Facebook, e-mail/senha).
Pagamentos	SDKs do Mercado Pago e PagBank; APIs de Orders; webhooks para conciliação.
Tempo real	Socket.io (cozinha, entregador, rastreio do cliente).
Infraestrutura	Vercel (frontend), Railway/Fly.io (BFF), Supabase (DB opcional).
6.2 Modelo BFF (Backend for Frontend)
Rotas principais:

/api/store/* – PDV

/api/kitchen/* – cozinha

/api/delivery/* – entregador

/api/client/* – e‑commerce público

/api/admin/* – gestão

/api/webhooks/payment/* – notificações dos gateways (confirmação de pagamento, chargebacks)

6.3 Modelagem de Dados (Principais Entidades)

-- Restaurante (tenant)
Restaurant: id, name, address, coords, phone, plan, active, created_at

-- Conta financeira do restaurante no gateway
TenantPaymentAccount: id, restaurantId (FK), gateway (MP/PB), external_account_id, access_token (encrypted), onboarding_status, created_at

-- Cardápio
MenuCategory: id, restaurantId, name, order
Product: id, categoryId, name, description, price, image, available
OptionGroup: id, productId, name, required, maxChoices
Option: id, groupId, name, priceModifier

-- Usuários
User: id, name, email, phone, password, role (admin|attendant|cook|driver|customer)
Customer: id, userId, address (JSON)
Driver: id, userId, vehicle, plate, active

-- Pedido
Order: id, restaurantId, customerId, type (delivery|pickup|in_store), status, total, paymentStatus, paymentMethod, external_reference, created_at

Item do Pedido
OrderItem: id, orderId, productId, quantity, unitPrice, notes
OrderItemOption: id, orderItemId, optionId

-- Entrega
Delivery: id, orderId, driverId, pickupTime, deliveryTime, status, signature

-- Transação financeira (split)
PaymentTransaction: id, orderId, gateway (MP/PB), gateway_transaction_id, total_amount, marketplace_fee, seller_amount, split_status (pending/done/refunded), payload_request (JSON), payload_response (JSON), created_at


6.4 Fluxo de Pedido e Split
Cliente/pedido criado (e‑commerce ou PDV).

No pagamento, BFF chama gateway com split configurado.

Gateway processa; se aprovado, retorna sucesso.

BFF salva PaymentTransaction, atualiza Order (status = "confirmed").

Cozinha recebe notificação via Socket.io.

Ao final do ciclo, o restaurante vê em seu dashboard o valor líquido recebido diretamente em sua conta do gateway.


