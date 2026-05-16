import Link from 'next/link';
import { Bike, ChefHat, Smartphone, Star, Clock, Shield, ArrowRight, MapPin, Zap } from 'lucide-react';

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
            <a href="#how-it-works" className="text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors">Como funciona</a>
            <a href="#partners" className="text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors">Para restaurantes</a>
          </nav>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 bg-[var(--color-lime-primary)] text-white font-bold text-sm px-5 py-2.5 rounded-xl hover:brightness-90 transition-all"
          >
            Entrar
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
                <Zap className="w-3.5 h-3.5 text-[var(--color-lime-primary)]" />
                <span className="text-xs font-bold text-[var(--color-lime-primary)]">Entrega expressa em minutos</span>
              </div>

              <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-gray-900 leading-[1.1] tracking-tight mb-6">
                Comida boa,{' '}
                <span className="text-[var(--color-lime-primary)]">rápida</span>{' '}
                e no seu ritmo.
              </h1>
              <p className="text-lg text-gray-500 leading-relaxed mb-10 max-w-xl">
                Peça do seu restaurante favorito, acompanhe em tempo real e receba fresquinho onde você estiver.
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center gap-2.5 bg-[var(--color-lime-primary)] text-white font-black text-base px-8 py-4 rounded-2xl hover:brightness-90 transition-all shadow-lg shadow-[var(--color-lime-primary)]/20 active:scale-[0.98]"
                >
                  Pedir agora
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <a
                  href="#how-it-works"
                  className="inline-flex items-center justify-center gap-2 border-2 border-gray-200 text-gray-700 font-bold text-base px-8 py-4 rounded-2xl hover:border-[var(--color-lime-primary)] hover:text-[var(--color-lime-primary)] transition-all"
                >
                  Como funciona
                </a>
              </div>

              {/* Social proof */}
              <div className="mt-12 flex flex-wrap gap-6">
                <div className="flex items-center gap-2">
                  <div className="flex -space-x-2">
                    {['bg-[var(--color-lime-primary)]', 'bg-[var(--color-app-accent)]', 'bg-orange-300', 'bg-rose-300'].map((c, i) => (
                      <div key={i} className={`w-8 h-8 rounded-full border-2 border-white ${c}`} />
                    ))}
                  </div>
                  <span className="text-sm text-gray-500 font-medium">+10k clientes ativos</span>
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
                  { label: 'Restaurantes parceiros', value: '500+' },
                  { label: 'Pedidos entregues', value: '2M+' },
                  { label: 'Tempo médio de entrega', value: '28 min' },
                  { label: 'Cidades atendidas', value: '80+' },
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

        {/* Features */}
        <section id="features" className="py-20 md:py-28 bg-white">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="text-center mb-14">
              <span className="text-xs font-black text-white bg-[var(--color-lime-primary)] px-3 py-1 rounded-full uppercase tracking-widest">Funcionalidades</span>
              <h2 className="text-3xl md:text-4xl font-black text-gray-900 mt-4 mb-3">Por que escolher o Foodbio?</h2>
              <p className="text-gray-500 max-w-lg mx-auto">Tudo que você precisa para uma experiência de delivery completa e sem complicações.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                {
                  icon: Clock,
                  bg: 'bg-[var(--color-lime-primary)]',
                  ic: 'text-white',
                  title: 'Entrega expressa',
                  desc: 'Acompanhe seu pedido em tempo real, desde o preparo até a sua porta.',
                },
                {
                  icon: Shield,
                  bg: 'bg-[var(--color-app-bg)]',
                  ic: 'text-[var(--color-lime-primary)]',
                  title: 'Pagamento seguro',
                  desc: 'Tokenização de cartão exclusivamente no browser. Seus dados nunca passam pelos nossos servidores.',
                },
                {
                  icon: MapPin,
                  bg: 'bg-blue-50',
                  ic: 'text-blue-500',
                  title: 'Rastreamento em tempo real',
                  desc: 'Veja exatamente onde seu entregador está e quando chega.',
                },
                {
                  icon: Star,
                  bg: 'bg-amber-50',
                  ic: 'text-amber-500',
                  title: 'Avaliações verificadas',
                  desc: 'Só avalia quem comprou. Opiniões reais de clientes reais.',
                },
                {
                  icon: Smartphone,
                  bg: 'bg-purple-50',
                  ic: 'text-purple-500',
                  title: 'App mobile-first',
                  desc: 'Interface otimizada para celular, tablet e desktop.',
                },
                {
                  icon: Zap,
                  bg: 'bg-emerald-50',
                  ic: 'text-emerald-500',
                  title: 'Atualização instantânea',
                  desc: 'Status do pedido atualizado ao vivo via WebSocket.',
                },
              ].map((feat) => (
                <div key={feat.title} className="bg-white rounded-2xl p-6 border border-gray-100 hover:border-[var(--color-lime-primary)]/30 hover:shadow-md transition-all">
                  <div className={`w-12 h-12 ${feat.bg} rounded-xl flex items-center justify-center mb-4`}>
                    <feat.icon className={`w-5 h-5 ${feat.ic}`} />
                  </div>
                  <h3 className="font-bold text-gray-900 mb-2">{feat.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{feat.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How it works */}
        <section id="how-it-works" className="py-20 md:py-28 bg-[var(--color-app-bg)]">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="text-center mb-14">
              <span className="text-xs font-black text-white bg-[var(--color-lime-primary)] px-3 py-1 rounded-full uppercase tracking-widest">Como funciona</span>
              <h2 className="text-3xl md:text-4xl font-black text-gray-900 mt-4 mb-3">Pedir é simples assim</h2>
              <p className="text-gray-500 max-w-lg mx-auto">Do cardápio à sua porta em poucos passos.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 relative">
              <div className="hidden md:block absolute top-10 left-[12.5%] right-[12.5%] h-0.5 bg-orange-100 z-0" />
              {[
                { step: '01', title: 'Escolha o restaurante', desc: 'Navegue por centenas de opções próximas a você.' },
                { step: '02', title: 'Monte seu pedido', desc: 'Selecione itens, personalize e adicione ao carrinho.' },
                { step: '03', title: 'Pague com segurança', desc: 'Cartão, Pix ou dinheiro — você escolhe.' },
                { step: '04', title: 'Acompanhe ao vivo', desc: 'Rastreamento em tempo real até a entrega.' },
              ].map((s) => (
                <div key={s.step} className="relative z-10 flex flex-col items-center text-center">
                  <div className="w-20 h-20 rounded-full bg-white border-4 border-[var(--color-lime-primary)]/20 flex items-center justify-center mb-4 shadow-sm">
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

        {/* For restaurants */}
        <section id="partners" className="py-20 md:py-28 bg-white">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <span className="text-xs font-black text-white bg-[var(--color-lime-primary)] px-3 py-1 rounded-full uppercase tracking-widest">Para restaurantes</span>
                <h2 className="text-3xl md:text-4xl font-black text-gray-900 mt-6 mb-4 leading-tight">
                  Leve seu restaurante<br />para o digital hoje.
                </h2>
                <p className="text-gray-500 leading-relaxed mb-8">
                  Painel completo de gestão de pedidos, cardápio digital, controle de entregas e relatórios financeiros.
                </p>
                <div className="grid grid-cols-2 gap-3 mb-8">
                  {[
                    { icon: ChefHat, label: 'Painel do restaurante' },
                    { icon: Bike, label: 'Gestão de entregadores' },
                    { icon: Star, label: 'Relatórios detalhados' },
                    { icon: Shield, label: 'Pagamento split' },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center gap-2.5 bg-[var(--color-app-bg)] rounded-xl px-4 py-3 border border-[var(--color-lime-primary)]/10">
                      <item.icon className="w-4 h-4 text-[var(--color-lime-primary)] shrink-0" />
                      <span className="text-sm font-semibold text-gray-800">{item.label}</span>
                    </div>
                  ))}
                </div>
                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 bg-[var(--color-lime-primary)] text-white font-black text-sm px-6 py-3.5 rounded-xl hover:brightness-90 transition-all shadow-md shadow-[var(--color-lime-primary)]/20"
                >
                  Acessar painel
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>

              {/* Dashboard preview card */}
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

        {/* CTA final */}
        <section className="py-20 bg-[var(--color-lime-primary)]">
          <div className="max-w-2xl mx-auto px-4 sm:px-6 text-center">
            <h2 className="text-3xl md:text-4xl font-black text-white mb-4">Pronto para pedir?</h2>
            <p className="text-white/80 mb-8">Faça login para acessar o cardápio do seu restaurante favorito.</p>
            <Link
              href="/login"
              className="inline-flex items-center gap-2.5 bg-white text-[var(--color-lime-primary)] font-black text-base px-10 py-4 rounded-2xl hover:bg-orange-50 transition-colors shadow-xl"
            >
              Entrar agora
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-gray-50 border-t border-gray-100 py-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-[var(--color-lime-primary)] rounded-lg flex items-center justify-center">
              <span className="text-white font-black text-xs">F</span>
            </div>
            <span className="font-black text-gray-900 text-sm">Foodbio</span>
          </div>
          <p className="text-xs text-gray-400 font-medium">© 2026 Foodbio. Todos os direitos reservados.</p>
          <div className="flex gap-6">
            <a href="#" className="text-xs text-gray-400 hover:text-gray-600 transition-colors font-medium">Privacidade</a>
            <a href="#" className="text-xs text-gray-400 hover:text-gray-600 transition-colors font-medium">Termos</a>
            <Link href="/login" className="text-xs text-[var(--color-lime-primary)] hover:brightness-90 transition-all font-bold">Login</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
