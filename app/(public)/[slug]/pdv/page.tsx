'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { get, post } from '@/lib/api-client';
import { Search, ShoppingCart, X, Truck, Store, Loader2, MapPin } from 'lucide-react';
import Image from 'next/image';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { toast } from 'react-hot-toast';

interface AddressState {
  cep: string
  street: string
  number: string
  complement: string
  neighborhood: string
  city: string
  state: string
}

async function fetchCep(cep: string): Promise<Partial<AddressState> | null> {
  const digits = cep.replace(/\D/g, '')
  if (digits.length !== 8) return null
  try {
    const res = await fetch(`https://viacep.com.br/ws/${digits}/json/`)
    if (!res.ok) return null
    const data = await res.json()
    if (data.erro) return null
    return {
      street:       data.logradouro ?? '',
      neighborhood: data.bairro ?? '',
      city:         data.localidade ?? '',
      state:        data.uf ?? '',
    }
  } catch {
    return null
  }
}

export default function POSPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const { data: session, status } = useSession();
  const tenantId = (session?.user as any)?.tenantId;

  const [cart, setCart] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'pix' | 'credit_card'>('cash');
  const [showPayment, setShowPayment] = useState(false);

  // Customer + delivery
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [deliveryType, setDeliveryType] = useState<'pickup' | 'delivery'>('pickup');
  const [address, setAddress] = useState<AddressState>({
    cep: '', street: '', number: '', complement: '', neighborhood: '', city: '', state: '',
  });
  const [loadingCep, setLoadingCep] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace(`/${slug}/login?callbackUrl=/${slug}/pdv`);
    }
  }, [status, slug, router]);

  const { data: menu, isLoading } = useQuery({
    queryKey: ['pos-menu'],
    queryFn: () => get<any>(`/api/admin/menu`),
    enabled: status === 'authenticated',
  });

  const addToCart = (product: any) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.id === product.id);
      if (existing) return prev.map((i) => i.id === product.id ? { ...i, quantity: i.quantity + 1 } : i);
      return [...prev, { ...product, quantity: 1 }];
    });
    toast.success(`${product.name} adicionado`);
  };

  const removeFromCart = (id: string) => setCart((prev) => prev.filter((i) => i.id !== id));

  const cartTotal = cart.reduce((acc, i) => acc + i.price * i.quantity, 0);

  async function handleCepBlur() {
    const digits = address.cep.replace(/\D/g, '')
    if (digits.length !== 8) return
    setLoadingCep(true)
    const data = await fetchCep(digits)
    setLoadingCep(false)
    if (!data) { toast.error('CEP não encontrado'); return }
    setAddress(prev => ({ ...prev, ...data }))
  }

  const finalizeMutation = useMutation({
    mutationFn: () => {
      const isDelivery = deliveryType === 'delivery'
      return post<{ orderId: string }>('/api/store/orders', {
        restaurantId: tenantId,
        items: cart.map((i) => ({ productId: i.id, quantity: i.quantity, options: [] })),
        deliveryType,
        customerName: customerName.trim() || 'Balcão',
        customerPhone: customerPhone.trim() || '00000000000',
        paymentMethod,
        ...(isDelivery ? { address } : {}),
      })
    },
    onSuccess: () => {
      toast.success('Pedido criado com sucesso!');
      setCart([]);
      setShowPayment(false);
      setCustomerName('');
      setCustomerPhone('');
      setDeliveryType('pickup');
      setAddress({ cep: '', street: '', number: '', complement: '', neighborhood: '', city: '', state: '' });
    },
    onError: () => toast.error('Erro ao finalizar pedido'),
  });

  if (status === 'loading' || status === 'unauthenticated') {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-100">
        <div className="w-10 h-10 border-2 border-t-transparent rounded-full animate-spin"
          style={{ borderColor: 'var(--color-lime-primary)', borderTopColor: 'transparent' }} />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex h-screen bg-gray-100 overflow-hidden">
        <div className="flex-1 p-8 overflow-hidden">
          <div className="flex items-center justify-between mb-8">
            <div className="space-y-2"><Skeleton className="h-8 w-20" /><Skeleton className="h-4 w-40" /></div>
            <Skeleton className="h-12 w-96 rounded-2xl" />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="bg-white rounded-3xl p-4 space-y-3 shadow-sm">
                <Skeleton className="aspect-square w-full rounded-2xl" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-5 w-1/2" />
              </div>
            ))}
          </div>
        </div>
        <aside className="w-[400px] bg-white border-l border-gray-100 flex flex-col">
          <div className="p-8 border-b border-gray-50 flex items-center justify-between">
            <Skeleton className="h-6 w-32" /><Skeleton className="h-6 w-16 rounded-full" />
          </div>
          <div className="flex-1 p-8 space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 bg-gray-50 p-4 rounded-2xl">
                <Skeleton className="w-12 h-12 rounded-xl shrink-0" />
                <div className="flex-1 space-y-2"><Skeleton className="h-4 w-full" /><Skeleton className="h-3 w-1/2" /></div>
              </div>
            ))}
          </div>
        </aside>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      {/* Product Grid */}
      <div className="flex-1 flex flex-col p-8 overflow-y-auto no-scrollbar">
        <header className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-black text-gray-900 tracking-tight">PDV</h1>
            <p className="text-gray-500 font-medium">Venda rápida no balcão.</p>
          </div>
          <div className="relative w-96">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Buscar produto..."
              className="w-full bg-white rounded-2xl py-4 pl-12 pr-4 border-none shadow-sm focus:ring-2 focus:ring-[var(--color-lime-primary)]"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </header>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {(menu?.categories ?? [])
            .flatMap((c: any) => c.products ?? [])
            .filter((p: any) => p.available && p.name.toLowerCase().includes(search.toLowerCase()))
            .map((product: any) => (
              <div
                key={product.id}
                onClick={() => addToCart(product)}
                className="bg-white rounded-3xl p-4 border border-transparent hover:border-[var(--color-lime-primary)] cursor-pointer transition-all group shadow-sm"
              >
                <div className="aspect-square bg-gray-50 rounded-2xl mb-4 overflow-hidden relative">
                  {product.imageUrl && (
                    <Image src={product.imageUrl} alt={product.name} fill className="object-cover group-hover:scale-110 transition-transform" />
                  )}
                </div>
                <h3 className="font-bold text-gray-900 leading-tight mb-1">{product.name}</h3>
                <p className="text-lg font-black text-gray-900">R$ {product.price.toFixed(2)}</p>
              </div>
            ))}
        </div>
      </div>

      {/* Cart Sidebar */}
      <aside className="w-[400px] bg-white border-l border-gray-100 flex flex-col shadow-2xl">
        <div className="p-6 border-b border-gray-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ShoppingCart className="w-6 h-6 text-gray-900" />
            <h2 className="text-xl font-black text-gray-900 tracking-tight">Carrinho</h2>
          </div>
          <span className="bg-black text-[var(--color-lime-primary)] text-xs font-black px-3 py-1 rounded-full">
            {cart.length} ITENS
          </span>
        </div>

        {/* Scrollable area: cart items OR checkout form */}
        <div className="flex-1 overflow-y-auto no-scrollbar">
          {!showPayment ? (
            <div className="p-6 space-y-3">
              {cart.map((item) => (
                <div key={item.id} className="flex items-center gap-4 bg-gray-50 p-4 rounded-2xl group">
                  <div className="w-12 h-12 bg-white rounded-xl flex-shrink-0 flex items-center justify-center font-black text-sm">
                    {item.quantity}x
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-gray-900 text-sm leading-tight">{item.name}</p>
                    <p className="text-xs text-gray-400">R$ {(item.price * item.quantity).toFixed(2)}</p>
                  </div>
                  <button
                    onClick={() => removeFromCart(item.id)}
                    className="p-2 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              ))}
              {cart.length === 0 && (
                <div className="flex flex-col items-center justify-center text-center py-20">
                  <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                    <ShoppingCart className="w-8 h-8 text-gray-200" />
                  </div>
                  <p className="text-gray-400 font-bold text-sm">Carrinho vazio</p>
                </div>
              )}
            </div>
          ) : (
            <div className="p-6 space-y-5">
              {/* Cliente */}
              <div>
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">Cliente</p>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="Nome"
                    value={customerName}
                    onChange={e => setCustomerName(e.target.value)}
                    className="bg-gray-50 rounded-xl border border-gray-200 px-3 py-2.5 text-sm font-semibold text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[var(--color-lime-primary)]"
                  />
                  <input
                    type="tel"
                    placeholder="Telefone"
                    value={customerPhone}
                    onChange={e => setCustomerPhone(e.target.value)}
                    className="bg-gray-50 rounded-xl border border-gray-200 px-3 py-2.5 text-sm font-semibold text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[var(--color-lime-primary)]"
                  />
                </div>
              </div>

              {/* Tipo de entrega */}
              <div>
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">Tipo de entrega</p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setDeliveryType('pickup')}
                    className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold border-2 transition-all ${
                      deliveryType === 'pickup'
                        ? 'border-[var(--color-lime-primary)] bg-[var(--color-lime-primary)] text-white'
                        : 'border-gray-200 text-gray-600 bg-gray-50'
                    }`}
                  >
                    <Store className="w-4 h-4" />
                    Retirada
                  </button>
                  <button
                    onClick={() => setDeliveryType('delivery')}
                    className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold border-2 transition-all ${
                      deliveryType === 'delivery'
                        ? 'border-[var(--color-lime-primary)] bg-[var(--color-lime-primary)] text-white'
                        : 'border-gray-200 text-gray-600 bg-gray-50'
                    }`}
                  >
                    <Truck className="w-4 h-4" />
                    Delivery
                  </button>
                </div>
              </div>

              {/* Endereço — só quando delivery */}
              {deliveryType === 'delivery' && (
                <div>
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5 flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    Endereço de entrega
                  </p>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="CEP"
                        maxLength={9}
                        value={address.cep}
                        onChange={e => setAddress(prev => ({ ...prev, cep: e.target.value }))}
                        onBlur={handleCepBlur}
                        className="flex-1 bg-gray-50 rounded-xl border border-gray-200 px-3 py-2.5 text-sm font-semibold text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[var(--color-lime-primary)]"
                      />
                      {loadingCep && <Loader2 className="w-4 h-4 animate-spin text-gray-400 shrink-0" />}
                    </div>
                    <input
                      type="text"
                      placeholder="Rua / Avenida"
                      value={address.street}
                      onChange={e => setAddress(prev => ({ ...prev, street: e.target.value }))}
                      className="w-full bg-gray-50 rounded-xl border border-gray-200 px-3 py-2.5 text-sm font-semibold text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[var(--color-lime-primary)]"
                    />
                    <div className="grid grid-cols-5 gap-2">
                      <input
                        type="text"
                        placeholder="Nº"
                        value={address.number}
                        onChange={e => setAddress(prev => ({ ...prev, number: e.target.value }))}
                        className="col-span-2 bg-gray-50 rounded-xl border border-gray-200 px-3 py-2.5 text-sm font-semibold text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[var(--color-lime-primary)]"
                      />
                      <input
                        type="text"
                        placeholder="Complemento"
                        value={address.complement}
                        onChange={e => setAddress(prev => ({ ...prev, complement: e.target.value }))}
                        className="col-span-3 bg-gray-50 rounded-xl border border-gray-200 px-3 py-2.5 text-sm font-semibold text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[var(--color-lime-primary)]"
                      />
                    </div>
                    <input
                      type="text"
                      placeholder="Bairro"
                      value={address.neighborhood}
                      onChange={e => setAddress(prev => ({ ...prev, neighborhood: e.target.value }))}
                      className="w-full bg-gray-50 rounded-xl border border-gray-200 px-3 py-2.5 text-sm font-semibold text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[var(--color-lime-primary)]"
                    />
                  </div>
                </div>
              )}

              {/* Forma de pagamento */}
              <div>
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">Pagamento</p>
                <div className="grid grid-cols-3 gap-2">
                  {(['cash', 'pix', 'credit_card'] as const).map(m => (
                    <button
                      key={m}
                      onClick={() => setPaymentMethod(m)}
                      className={`py-2.5 rounded-xl text-xs font-bold border-2 transition-all ${
                        paymentMethod === m
                          ? 'border-[var(--color-lime-primary)] bg-[var(--color-lime-primary)] text-white'
                          : 'border-gray-200 text-gray-600 bg-gray-50'
                      }`}
                    >
                      {m === 'cash' ? 'Dinheiro' : m === 'pix' ? 'PIX' : 'Cartão'}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Fixed footer: total + action buttons */}
        <div className="shrink-0 p-6 bg-gray-50 border-t border-gray-100 space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-gray-500 font-bold uppercase tracking-widest text-xs">Total a pagar</span>
            <span className="text-3xl font-black text-gray-900">R$ {cartTotal.toFixed(2)}</span>
          </div>

          {showPayment ? (
            <div className="grid grid-cols-2 gap-3">
              <Button variant="ghost" className="py-4" onClick={() => setShowPayment(false)}>
                Voltar
              </Button>
              <Button
                variant="dark"
                className="py-4"
                loading={finalizeMutation.isPending}
                onClick={() => finalizeMutation.mutate()}
              >
                Confirmar
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              <Button variant="ghost" className="py-6 border-gray-200" onClick={() => setCart([])}>
                Limpar
              </Button>
              <Button
                variant="dark"
                className="py-6"
                disabled={cart.length === 0}
                onClick={() => setShowPayment(true)}
              >
                Finalizar
              </Button>
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}
