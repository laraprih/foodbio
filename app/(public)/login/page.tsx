'use client';

import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema } from '@/lib/validations';
import { signIn, getSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Mail, Lock, ArrowLeft, ExternalLink } from 'lucide-react';
import Link from 'next/link';

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
    </svg>
  )
}

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') ?? '/';

  const [isInstagramWebView, setIsInstagramWebView] = useState(false);
  const [loadingFacebook, setLoadingFacebook] = useState(false);

  useEffect(() => {
    setIsInstagramWebView(/Instagram/.test(navigator.userAgent));
  }, []);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: any) => {
    try {
      const result = await signIn('credentials', { redirect: false, email: data.email, password: data.password });
      if (result?.error) {
        toast.error('Credenciais inválidas. Tente novamente.');
      } else {
        toast.success('Login realizado com sucesso!');
        const session = await getSession();
        const role = (session?.user as any)?.role;
        router.push(role === 'admin' ? '/dashboard' : callbackUrl);
      }
    } catch {
      toast.error('Ocorreu um erro ao tentar fazer login.');
    }
  };

  const handleInstagramLogin = () => {
    setLoadingFacebook(true);
    signIn('facebook', { callbackUrl });
  };

  return (
    <div className="min-h-screen bg-white lg:bg-gray-50 flex flex-col lg:flex-row">
      {/* Desktop branding panel */}
      <div className="hidden lg:flex lg:w-5/12 xl:w-1/2 bg-[var(--color-lime-primary)] flex-col items-center justify-center p-16 relative overflow-hidden">
        <div className="absolute top-1/4 -left-20 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 -right-20 w-64 h-64 bg-white/10 rounded-full blur-3xl" />

        <div className="relative text-center">
          <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-2xl">
            <span className="text-[var(--color-lime-primary)] font-black text-2xl">F</span>
          </div>
          <h1 className="text-4xl font-black text-white mb-3 tracking-tight">Foodin</h1>
          <p className="text-white/75 text-lg max-w-sm leading-relaxed">
            Peça agora nos seus restaurantes favoritos com entrega rápida.
          </p>

          <div className="grid grid-cols-3 gap-4 mt-12">
            {[
              { value: '500+', label: 'Restaurantes' },
              { value: '30min', label: 'Entrega média' },
              { value: '4.9★', label: 'Avaliação' },
            ].map(({ value, label }) => (
              <div key={label} className="bg-white/15 rounded-xl p-3 border border-white/20">
                <p className="font-black text-white text-lg">{value}</p>
                <p className="text-white/60 text-xs mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Form side */}
      <div className="flex-1 flex flex-col lg:justify-center">
        {/* Mobile header */}
        <div className="lg:hidden flex items-center gap-3 px-5 py-4 border-b border-gray-100">
          <Link href="/" className="w-9 h-9 rounded-xl border border-gray-100 flex items-center justify-center">
            <ArrowLeft className="w-4 h-4 text-gray-700" />
          </Link>
          <div className="w-9 h-9 bg-[var(--color-lime-primary)] rounded-xl flex items-center justify-center">
            <span className="text-white font-black">F</span>
          </div>
          <span className="font-black text-gray-900 text-lg">Foodin</span>
        </div>

        {/* Instagram WebView banner */}
        {isInstagramWebView && (
          <div className="mx-4 mt-4 flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-2xl p-4">
            <ExternalLink className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-700 leading-relaxed">
              Para melhor experiência, toque em{' '}
              <strong>···</strong> e abra no navegador do seu celular.
              O login com Instagram também funciona aqui.
            </p>
          </div>
        )}

        <div className="flex-1 px-6 py-10 lg:py-0 flex flex-col justify-center max-w-sm mx-auto w-full lg:max-w-md lg:px-12">
          <div className="mb-8">
            <h2 className="text-2xl font-black text-gray-900 mb-1.5">Bem-vindo de volta!</h2>
            <p className="text-gray-400 text-sm">Entre na sua conta para continuar</p>
          </div>

          <button
            type="button"
            onClick={handleInstagramLogin}
            disabled={loadingFacebook}
            className="w-full flex items-center justify-center gap-3 py-3.5 px-4 rounded-2xl font-bold text-white text-sm transition-all hover:brightness-90 disabled:opacity-60 mb-6"
            style={{
              background:
                'linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)',
            }}
          >
            {loadingFacebook ? (
              <span className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            ) : (
              <InstagramIcon className="w-5 h-5 shrink-0" />
            )}
            Entrar com Instagram
          </button>

          <div className="flex items-center gap-3 mb-6">
            <div className="flex-1 h-px bg-gray-100" />
            <span className="text-xs text-gray-400 font-medium">ou use seu e-mail</span>
            <div className="flex-1 h-px bg-gray-100" />
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              label="E-mail"
              type="email"
              placeholder="seu@email.com"
              icon={<Mail className="w-4 h-4" />}
              error={errors.email?.message as string}
              {...register('email')}
            />
            <Input
              label="Senha"
              type="password"
              placeholder="••••••••"
              icon={<Lock className="w-4 h-4" />}
              error={errors.password?.message as string}
              {...register('password')}
            />
            <div className="flex justify-end">
              <button type="button" className="text-xs font-bold text-gray-500 hover:text-gray-900 transition-colors">
                Esqueceu a senha?
              </button>
            </div>
            <Button type="submit" variant="dark" size="xl" className="w-full mt-2" loading={isSubmitting}>
              Entrar
            </Button>
          </form>

          <div className="my-6 flex items-center gap-3">
            <div className="flex-1 h-px bg-gray-100" />
            <span className="text-xs text-gray-400 font-medium">ou continue com</span>
            <div className="flex-1 h-px bg-gray-100" />
          </div>

          <Button
            type="button"
            variant="outline"
            size="lg"
            className="w-full"
            onClick={() => signIn('google', { callbackUrl })}
          >
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            Entrar com Google
          </Button>

          <p className="text-center text-sm text-gray-400 mt-6">
            Não tem uma conta?{' '}
            <button className="font-bold text-gray-900 hover:text-zinc-700 transition-colors">
              Cadastre-se
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
