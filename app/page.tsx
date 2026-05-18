import Link from 'next/link';
import {
  Bike, ChefHat, Star, Clock, Shield, ArrowRight, Zap,
  QrCode, Monitor, BarChart3, Users, Utensils, CreditCard,
  MessageSquare, TrendingUp, CheckCircle, ChevronDown,
} from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white text-gray-900 flex flex-col">

      {/* Navbar */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-orange-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-[var(--color-lime-primary)] rounded-xl flex items-center justify-center">
              <span className="text-white font-black text-sm">F</span>
            </div>
            <span className="font-black text-gray-900 text-lg tracking-tight">Foodbio</span>
          </div>
          <nav className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors">Funcionalidades</a>
            <a href="#segments" className="text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors">Segmentos</a>
            <a href="#how-it-works" className="text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors">Como funciona</a>
            <a href="#faq" className="text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors">FAQ</a>
          </nav>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 bg-[var(--color-lime-primary)] text-white font-bold text-sm px-5 py-2.5 rounded-xl hover:brightness-90 transition-all"
          >
            Começar agora
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </header>

      <main className="flex-1">

        {/* Hero */}
        <section className="relative bg-[var(--color-app-bg)] overflow-hidden">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full bg-[var(--color-lime-primary)]/10 blur-3xl translate-x-1/2 -translate-y-1/4" />
            <div className="absolute bottom-0 left-0 w-[300px] h-[300px] rounded-full bg-[var(--color-app-accent)]/15 blur-2xl -translate-x-1/4" />
          </div>

          <div className="relative max-w-6xl mx-auto px-4 sm:px-6 pt-20 pb-24 md:pt-28 md:pb-32">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 bg-[var(--color-lime-primary)]/10 border border-[var(--color-lime-primary)]/20 rounded-full px-4 py-1.5 mb-8">
                <Utensils className="w-3.5 h-3.5 text-[var(--color-lime-primary)]" />
                <span className="text-xs font-bold text-[var(--color-lime-primary)]">Sistema ERP completo para restaurantes</span>
              </div>

              <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-gray-900 leading-[1.1] tracking-tight mb-6">
                PDV, delivery e{' '}
                <span className="text-[var(--color-lime-primary)]">cardápio digital</span>{' '}
                em um só lugar.
              </h1>
              <p className="text-lg text-gray-500 leading-relaxed mb-10 max-w-xl">
                Gerencie pedidos, mesas, cozinha e entregas com um sistema feito para o dia a dia do seu restaurante. Simples, rápido e completo.
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center gap-2.5 bg-[var(--color-lime-primary)] text-white font-black text-base px-8 py-4 rounded-2xl hover:brightness-90 transition-all shadow-lg shadow-[var(--color-lime-primary)]/20 active:scale-[0.98]"
                >
                  Começar gratuitamente
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <a
                  href="#features"
                  className="inline-flex items-center justify-center gap-2 border-2 border-gray-200 text-gray-700 font-bold text-base px-8 py-4 rounded-2xl hover:border-[var(--color-lime-primary)] hover:text-[var(--color-lime-primary)] transition-all"
                >
                  Ver funcionalidades
                </a>
              </div>

              <div className="mt-12 flex flex-wrap gap-6">
                <div className="flex items-center gap-2">
                  <div className="flex -space-x-2">
                    {['bg-[var(--color-lime-primary)]', 'bg-[var(--color-app-accent)]', 'bg-orange-300', 'bg-rose-300'].map((c, i) => (
                      <div key={i} className={`w-8 h-8 rounded-full border-2 border-white ${c}`} />
                    ))}
                  </div>
                  <span className="text-sm text-gray-500 font-medium">+500 restaurantes ativos</span>
                </div>
                <div className="flex items-center gap-1.5">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-[var(--color-app-accent)] text-[var(--color-app-accent)]" />
                  ))}
                  <span className="text-sm text-gray-500 font-medium ml-1">4.9 / 5.0</span>
                </div>
              </div>
            </div>
          </div>

          {/* Stats strip */}
          <div className="border-t border-orange-100 bg-white/60">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {[
                  { label: 'Restaurantes ativos', value: '500+' },
                  { label: 'Pedidos processados/mês', value: '150k+' },
                  { label: 'Tempo médio de preparo', value: '18 min' },
                  { label: 'Suporte especializado', value: '24/7' },
                ].map((stat) => (
                  <div key={stat.label} className="text-center">
                    <p className="text-2xl font-black text-[var(--color-lime-primary)]">{stat.value}</p>
                    <p className="text-xs text-gray-500 mt-0.5 font-medium">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Pain Points */}
        <section className="py-20 md:py-28 bg-white">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="text-center mb-14">
              <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-4">
                Seu restaurante está{' '}
                <span className="text-red-500">perdendo dinheiro</span>{' '}
                por falta de sistema?
              </h2>
              <p className="text-gray-500 max-w-xl mx-auto">Problemas comuns que o Foodbio resolve do primeiro dia.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
              {[
                {
                  emoji: '⏱️',
                  title: 'Atendimento lento',
                  desc: 'Comandas em papel causam erros, retrabalho e mesas paradas mais tempo que o necessário.',
                },
                {
                  emoji: '📦',
                  title: 'Pedidos perdidos no delivery',
                  desc: 'Sem integração entre delivery e cozinha, pedidos somem e clientes reclamam.',
                },
                {
                  emoji: '📊',
                  title: 'Sem controle financeiro',
                  desc: 'Caixa fechado no chute, sem saber quanto vendeu, por qual método ou por turno.',
                },
                {
                  emoji: '🔁',
                  title: 'Retrabalho manual',
                  desc: 'Cardápio atualizado num lugar mas não no outro. Esforço duplicado todo dia.',
                },
              ].map((item) => (
                <div key={item.title} className="bg-red-50 rounded-2xl p-6 border border-red-100">
                  <div className="text-3xl mb-3">{item.emoji}</div>
                  <h3 className="font-bold text-gray-900 mb-2">{item.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>

            <div className="bg-[var(--color-lime-primary)] rounded-2xl p-8 text-center text-white">
              <p className="text-2xl md:text-3xl font-black mb-2">
                Restaurantes com Foodbio vendem até{' '}
                <span className="underline decoration-wavy">35% mais</span>{' '}
                em 30 dias.
              </p>
              <p className="text-white/80 text-sm mt-1">*Baseado na média dos clientes ativos na plataforma</p>
            </div>
          </div>
        </section>

        {/* Main Features */}
        <section id="features" className="py-20 md:py-28 bg-[var(--color-app-bg)]">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="text-center mb-14">
              <span className="text-xs font-black text-white bg-[var(--color-lime-primary)] px-3 py-1 rounded-full uppercase tracking-widest">Funcionalidades</span>
              <h2 className="text-3xl md:text-4xl font-black text-gray-900 mt-4 mb-3">Tudo que seu restaurante precisa</h2>
              <p className="text-gray-500 max-w-lg mx-auto">Módulos integrados que funcionam juntos para você vender mais com menos esforço.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[
                {
                  icon: Monitor,
                  color: 'bg-[var(--color-lime-primary)]',
                  ic: 'text-white',
                  title: 'PDV Profissional',
                  desc: 'Frente de caixa completa para atendimento presencial.',
                  items: [
                    'Abertura e fechamento de caixa por turno',
                    'Gestão de mesas com status em tempo real',
                    'Múltiplas formas de pagamento + troco',
                  ],
                },
                {
                  icon: Utensils,
                  color: 'bg-orange-50',
                  ic: 'text-orange-500',
                  title: 'KDS — Display da Cozinha',
                  desc: 'Monitor inteligente para a equipe de produção.',
                  items: [
                    'Pedidos separados por online e PDV',
                    'Temporizador de preparo por item',
                    'Atualização em tempo real via WebSocket',
                  ],
                },
                {
                  icon: QrCode,
                  color: 'bg-blue-50',
                  ic: 'text-blue-500',
                  title: 'Cardápio Digital com QR Code',
                  desc: 'Link e QR Code únicos para cada restaurante.',
                  items: [
                    'URL exclusiva (seurestaurante.foodbio.app)',
                    'Categorias, produtos e fotos no painel',
                    'Grupos de opcionais e adicionais por produto',
                  ],
                },
                {
                  icon: Bike,
                  color: 'bg-purple-50',
                  ic: 'text-purple-500',
                  title: 'Pedidos Online',
                  desc: 'Receba pedidos pela internet com pagamento integrado.',
                  items: [
                    'Cálculo automático de taxa por CEP',
                    'Integração MercadoPago e PicPay',
                    'Notificação WhatsApp automática ao cliente',
                  ],
                },
                {
                  icon: BarChart3,
                  color: 'bg-emerald-50',
                  ic: 'text-emerald-500',
                  title: 'Relatórios e Financeiro',
                  desc: 'Visão completa do desempenho do seu negócio.',
                  items: [
                    'Faturamento por método de pagamento',
                    'Relatório de splits e repasses',
                    'Resumo de turno com saldo esperado',
                  ],
                },
                {
                  icon: Users,
                  color: 'bg-rose-50',
                  ic: 'text-rose-500',
                  title: 'Gestão de Equipe',
                  desc: 'Controle de acesso por função para cada colaborador.',
                  items: [
                    'Funções: gerente, caixa, cozinheiro, garçom',
                    'Login individual com permissões por módulo',
                    'Histórico de ações por usuário',
                  ],
                },
              ].map((feat) => (
                <div key={feat.title} className="bg-white rounded-2xl p-6 border border-gray-100 hover:border-[var(--color-lime-primary)]/30 hover:shadow-md transition-all">
                  <div className={`w-12 h-12 ${feat.color} rounded-xl flex items-center justify-center mb-4`}>
                    <feat.icon className={`w-5 h-5 ${feat.ic}`} />
                  </div>
                  <h3 className="font-bold text-gray-900 mb-1">{feat.title}</h3>
                  <p className="text-sm text-gray-400 mb-4">{feat.desc}</p>
                  <ul className="space-y-2">
                    {feat.items.map((item) => (
                      <li key={item} className="flex items-start gap-2 text-sm text-gray-600">
                        <CheckCircle className="w-4 h-4 text-[var(--color-lime-primary)] shrink-0 mt-0.5" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How it works */}
        <section id="how-it-works" className="py-20 md:py-28 bg-white">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="text-center mb-14">
              <span className="text-xs font-black text-white bg-[var(--color-lime-primary)] px-3 py-1 rounded-full uppercase tracking-widest">Como funciona</span>
              <h2 className="text-3xl md:text-4xl font-black text-gray-900 mt-4 mb-3">Do cadastro à primeira venda em minutos</h2>
              <p className="text-gray-500 max-w-lg mx-auto">Configure seu restaurante e comece a receber pedidos hoje mesmo.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 relative">
              <div className="hidden md:block absolute top-10 left-[12.5%] right-[12.5%] h-0.5 bg-orange-100 z-0" />
              {[
                { step: '01', title: 'Crie sua conta', desc: 'Cadastre-se, defina o slug do seu restaurante e acesse o painel administrativo.' },
                { step: '02', title: 'Monte seu cardápio', desc: 'Cadastre categorias, produtos, fotos e grupos de opcionais pelo painel.' },
                { step: '03', title: 'Ative os módulos', desc: 'Ligue PDV, KDS e cardápio digital. Configure pagamentos em minutos.' },
                { step: '04', title: 'Comece a vender', desc: 'Seu link está no ar. Receba pedidos e gerencie tudo pelo painel ao vivo.' },
              ].map((s) => (
                <div key={s.step} className="relative z-10 flex flex-col items-center text-center">
                  <div className="w-20 h-20 rounded-full bg-[var(--color-app-bg)] border-4 border-[var(--color-lime-primary)]/20 flex items-center justify-center mb-4 shadow-sm">
                    <span className="text-2xl font-black text-[var(--color-lime-primary)]">{s.step}</span>
                  </div>
                  <h3 className="font-bold text-gray-900 mb-2">{s.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{s.desc}</p>
                </div>
              ))}
            </div>

            <div className="text-center mt-14">
              <Link
                href="/login"
                className="inline-flex items-center gap-2.5 bg-[var(--color-lime-primary)] text-white font-black text-base px-8 py-4 rounded-2xl hover:brightness-90 transition-all shadow-lg shadow-[var(--color-lime-primary)]/20"
              >
                Começar agora
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>

        {/* Segments */}
        <section id="segments" className="py-20 md:py-28 bg-[var(--color-app-bg)]">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="text-center mb-14">
              <span className="text-xs font-black text-white bg-[var(--color-lime-primary)] px-3 py-1 rounded-full uppercase tracking-widest">Segmentos</span>
              <h2 className="text-3xl md:text-4xl font-black text-gray-900 mt-4 mb-3">
                Para restaurantes, bares, pizzarias e muito mais
              </h2>
              <p className="text-gray-500 max-w-lg mx-auto">Cada segmento tem seu fluxo. O Foodbio se adapta ao seu modelo de negócio.</p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10">
              {[
                { emoji: '🍕', title: 'Pizzarias', desc: 'Opcionais de sabor, tamanho e borda com lógica de preço automática.' },
                { emoji: '🍔', title: 'Hamburguerias', desc: 'Montagem de combo, adicionais e ingredientes por item.' },
                { emoji: '☕', title: 'Cafeterias', desc: 'Cardápio visual atraente com opções quentes, frias e sazonais.' },
                { emoji: '🌮', title: 'Lanchonetes', desc: 'Atendimento rápido no balcão com PDV ágil e integrado.' },
                { emoji: '🍺', title: 'Bares', desc: 'Gestão de mesas com comanda por mesa e fechamento fácil.' },
                { emoji: '🚚', title: 'Food Trucks', desc: 'Cardápio digital via QR Code sem precisar de estrutura fixa.' },
                { emoji: '🍰', title: 'Doceiras', desc: 'Pedidos online com agendamento e retirada no local.' },
                { emoji: '🥩', title: 'Churrascarias', desc: 'Controle por mesa, rodízio e lançamentos por garçom.' },
              ].map((seg) => (
                <div key={seg.title} className="bg-white rounded-2xl p-5 border border-gray-100 hover:border-[var(--color-lime-primary)]/30 hover:shadow-sm transition-all text-center">
                  <div className="text-3xl mb-2">{seg.emoji}</div>
                  <h3 className="font-bold text-gray-900 text-sm mb-1">{seg.title}</h3>
                  <p className="text-xs text-gray-400 leading-relaxed">{seg.desc}</p>
                </div>
              ))}
            </div>

            <p className="text-center text-sm text-gray-400">Cada módulo é personalizável para atender as necessidades específicas do seu negócio.</p>
          </div>
        </section>

        {/* PDV integration + dashboard preview */}
        <section className="py-20 md:py-28 bg-white">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <span className="text-xs font-black text-white bg-[var(--color-lime-primary)] px-3 py-1 rounded-full uppercase tracking-widest">Painel administrativo</span>
                <h2 className="text-3xl md:text-4xl font-black text-gray-900 mt-6 mb-4 leading-tight">
                  PDV integrado ao financeiro e à cozinha
                </h2>
                <p className="text-gray-500 leading-relaxed mb-8">
                  Tudo centralizado: vendas do salão, delivery online e retirada no balcão em um único painel. Nenhum pedido perdido, nenhum caixa fechado no chute.
                </p>
                <div className="space-y-4 mb-8">
                  {[
                    { icon: TrendingUp, label: 'Vendas automatizadas', desc: 'Pedido confirmado entra direto na comanda e no caixa.' },
                    { icon: CreditCard, label: 'Múltiplos métodos de pagamento', desc: 'Dinheiro, cartão, Pix, MercadoPago e PicPay integrados.' },
                    { icon: BarChart3, label: 'Relatórios em tempo real', desc: 'Faturamento por hora, método e turno — sempre atualizado.' },
                    { icon: MessageSquare, label: 'Notificação automática', desc: 'Cliente recebe status do pedido via WhatsApp sem esforço manual.' },
                  ].map((item) => (
                    <div key={item.label} className="flex items-start gap-3">
                      <div className="w-9 h-9 bg-[var(--color-app-bg)] rounded-xl flex items-center justify-center shrink-0">
                        <item.icon className="w-4 h-4 text-[var(--color-lime-primary)]" />
                      </div>
                      <div>
                        <p className="font-bold text-gray-900 text-sm">{item.label}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 bg-[var(--color-lime-primary)] text-white font-black text-sm px-6 py-3.5 rounded-xl hover:brightness-90 transition-all shadow-md shadow-[var(--color-lime-primary)]/20"
                >
                  Ver painel na prática
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>

              {/* Dashboard preview */}
              <div className="relative">
                <div className="bg-white rounded-3xl p-6 border-2 border-orange-100 shadow-xl shadow-orange-50">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <p className="text-xs text-gray-400 font-medium">Faturamento hoje</p>
                      <p className="text-3xl font-black text-gray-900 mt-0.5">R$ 3.842</p>
                    </div>
                    <div className="bg-[var(--color-lime-primary)]/10 text-[var(--color-lime-primary)] text-xs font-black px-3 py-1.5 rounded-full border border-[var(--color-lime-primary)]/20">
                      +18% vs ontem
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3 mb-6">
                    {[
                      { label: 'Pedidos', value: '47' },
                      { label: 'Em preparo', value: '6' },
                      { label: 'Entregando', value: '3' },
                    ].map((m) => (
                      <div key={m.label} className="bg-[var(--color-app-bg)] rounded-xl p-3 text-center">
                        <p className="text-xl font-black text-gray-900">{m.value}</p>
                        <p className="text-[10px] text-gray-400 font-medium mt-0.5">{m.label}</p>
                      </div>
                    ))}
                  </div>
                  <div className="space-y-2">
                    {[
                      { id: 'A4F2', status: 'Entregando', bg: 'bg-blue-50 text-blue-600' },
                      { id: 'B8C1', status: 'Em preparo', bg: 'bg-amber-50 text-amber-600' },
                      { id: 'C3D9', status: 'Confirmado', bg: 'bg-[var(--color-app-bg)] text-[var(--color-lime-primary)]' },
                    ].map((order) => (
                      <div key={order.id} className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3 border border-gray-100">
                        <span className="text-sm font-bold text-gray-900">#{order.id}</span>
                        <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${order.bg}`}>{order.status}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="absolute -top-4 -right-4 bg-[var(--color-lime-primary)] rounded-2xl px-4 py-2 shadow-xl">
                  <p className="text-xs font-black text-white">Ao vivo</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="py-20 md:py-28 bg-[var(--color-app-bg)]">
          <div className="max-w-3xl mx-auto px-4 sm:px-6">
            <div className="text-center mb-14">
              <span className="text-xs font-black text-white bg-[var(--color-lime-primary)] px-3 py-1 rounded-full uppercase tracking-widest">FAQ</span>
              <h2 className="text-3xl md:text-4xl font-black text-gray-900 mt-4 mb-3">Dúvidas frequentes</h2>
              <p className="text-gray-500">Tudo que você precisa saber antes de começar.</p>
            </div>

            <div className="space-y-3">
              {[
                {
                  q: 'O Foodbio funciona para restaurante físico e delivery ao mesmo tempo?',
                  a: 'Sim. O Foodbio integra PDV presencial (salão e balcão) com pedidos online de delivery e retirada. Tudo aparece no mesmo painel e vai para a mesma cozinha.',
                },
                {
                  q: 'Preciso instalar algum programa?',
                  a: 'Não. O Foodbio é 100% web. Funciona em qualquer navegador moderno — tablet, computador ou celular. Sem instalação, sem atualização manual.',
                },
                {
                  q: 'Quais formas de pagamento são aceitas?',
                  a: 'Dinheiro, cartão de crédito/débito, Pix, MercadoPago e PicPay. Para pagamentos online, basta conectar sua conta MercadoPago nas configurações.',
                },
                {
                  q: 'O cardápio digital precisa de aplicativo para o cliente?',
                  a: 'Não. Seu cliente acessa pelo navegador do celular via QR Code ou link. Nenhum app precisa ser instalado.',
                },
                {
                  q: 'Posso ter mais de um restaurante na mesma conta?',
                  a: 'Sim. O Foodbio suporta múltiplos estabelecimentos. Cada restaurante tem seu próprio cardápio, slug, equipe e painel independente.',
                },
                {
                  q: 'Como funciona o KDS (display de cozinha)?',
                  a: 'O KDS é um monitor separado para a equipe de produção. Pedidos online e do PDV aparecem automaticamente com temporizador. A cozinha atualiza o status e o painel reflete em tempo real.',
                },
                {
                  q: 'Os dados ficam seguros?',
                  a: 'Sim. Toda a comunicação usa HTTPS e os dados ficam em bancos isolados por restaurante. Pagamentos são processados diretamente pelo MercadoPago — nenhum dado de cartão passa pelo Foodbio.',
                },
              ].map((item) => (
                <details key={item.q} className="group bg-white rounded-2xl border border-gray-100 overflow-hidden">
                  <summary className="flex items-center justify-between gap-4 px-6 py-4 cursor-pointer font-bold text-gray-900 list-none hover:text-[var(--color-lime-primary)] transition-colors">
                    {item.q}
                    <ChevronDown className="w-5 h-5 shrink-0 text-gray-400 group-open:rotate-180 transition-transform" />
                  </summary>
                  <div className="px-6 pb-5">
                    <p className="text-sm text-gray-500 leading-relaxed">{item.a}</p>
                  </div>
                </details>
              ))}
            </div>

            <div className="text-center mt-10">
              <p className="text-sm text-gray-400 mb-4">Ainda tem dúvidas?</p>
              <Link
                href="/login"
                className="inline-flex items-center gap-2 bg-[var(--color-lime-primary)] text-white font-black text-sm px-6 py-3.5 rounded-xl hover:brightness-90 transition-all"
              >
                Falar com a equipe
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-20 bg-[var(--color-lime-primary)]">
          <div className="max-w-2xl mx-auto px-4 sm:px-6 text-center">
            <h2 className="text-3xl md:text-4xl font-black text-white mb-4">
              Pronto para transformar a gestão do seu restaurante?
            </h2>
            <p className="text-white/80 mb-8 text-lg">Configure em minutos. Suporte especializado. Sem compromisso.</p>
            <Link
              href="/login"
              className="inline-flex items-center gap-2.5 bg-white text-[var(--color-lime-primary)] font-black text-base px-10 py-4 rounded-2xl hover:bg-orange-50 transition-colors shadow-xl"
            >
              Começar gratuitamente
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-gray-50 border-t border-gray-100 py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-7 h-7 bg-[var(--color-lime-primary)] rounded-lg flex items-center justify-center">
                  <span className="text-white font-black text-xs">F</span>
                </div>
                <span className="font-black text-gray-900 text-sm">Foodbio</span>
              </div>
              <p className="text-xs text-gray-400 leading-relaxed">Sistema ERP completo para restaurantes — PDV, delivery e cardápio digital em uma única plataforma.</p>
            </div>
            <div>
              <p className="font-bold text-gray-900 text-sm mb-3">Produto</p>
              <ul className="space-y-2">
                {['PDV', 'KDS — Cozinha', 'Cardápio Digital', 'Pedidos Online', 'Relatórios'].map((l) => (
                  <li key={l}><a href="#features" className="text-xs text-gray-400 hover:text-gray-600 transition-colors">{l}</a></li>
                ))}
              </ul>
            </div>
            <div>
              <p className="font-bold text-gray-900 text-sm mb-3">Segmentos</p>
              <ul className="space-y-2">
                {['Restaurantes', 'Pizzarias', 'Hamburguerias', 'Bares', 'Food Trucks', 'Cafeterias'].map((l) => (
                  <li key={l}><a href="#segments" className="text-xs text-gray-400 hover:text-gray-600 transition-colors">{l}</a></li>
                ))}
              </ul>
            </div>
            <div>
              <p className="font-bold text-gray-900 text-sm mb-3">Empresa</p>
              <ul className="space-y-2">
                {['Sobre', 'Contato', 'Privacidade', 'Termos de Uso'].map((l) => (
                  <li key={l}><a href="#" className="text-xs text-gray-400 hover:text-gray-600 transition-colors">{l}</a></li>
                ))}
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-100 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-gray-400 font-medium">© 2026 Foodbio. Todos os direitos reservados.</p>
            <Link href="/login" className="text-xs text-[var(--color-lime-primary)] hover:brightness-90 transition-all font-bold">Acessar painel →</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
