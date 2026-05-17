'use client';

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema } from '@/lib/validations';
import { signIn, getSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Mail, Lock, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') ?? '/';

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
          <h1 className="text-4xl font-black text-white mb-3 tracking-tight">Foodbio</h1>
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
          <span className="font-black text-gray-900 text-lg">Foodbio</span>
        </div>

        <div className="flex-1 px-6 py-10 lg:py-0 flex flex-col justify-center max-w-sm mx-auto w-full lg:max-w-md lg:px-12">
          <div className="mb-8">
            <h2 className="text-2xl font-black text-gray-900 mb-1.5">Bem-vindo de volta!</h2>
            <p className="text-gray-400 text-sm">Entre na sua conta para continuar</p>
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
