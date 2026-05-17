'use client';

import React, { Suspense } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema } from '@/lib/validations';
import { signIn, getSession } from 'next-auth/react';
import { useRouter, useSearchParams, useParams } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Mail, Lock, ChefHat } from 'lucide-react';

function CozinhaLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const params = useParams();
  const slug = params.slug as string;
  const callbackUrl = searchParams.get('callbackUrl') ?? `/${slug}/cozinha`;

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: any) => {
    try {
      const result = await signIn('credentials', { redirect: false, email: data.email, password: data.password });
      if (result?.error) {
        toast.error('Credenciais inválidas.');
        return;
      }
      const session = await getSession();
      const role = (session?.user as any)?.role;
      if (role !== 'cook') {
        toast.error('Acesso restrito à equipe de cozinha.');
        return;
      }
      router.push(callbackUrl);
    } catch {
      toast.error('Erro ao fazer login.');
    }
  };

  return (
    <div className="w-full max-w-sm mx-auto px-6 py-10">
      <div className="flex flex-col items-center mb-8">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
          style={{ backgroundColor: 'var(--color-lime-primary)' }}>
          <ChefHat className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-2xl font-black text-white tracking-tight">Cozinha</h1>
        <p className="text-white/60 text-sm mt-1">Acesso exclusivo para a equipe</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="E-mail"
          type="email"
          placeholder="cozinheiro@restaurante.com"
          icon={<Mail className="w-4 h-4" />}
          error={errors.email?.message as string}
          className="bg-white/10 border-white/20 text-white placeholder-white/40"
          {...register('email')}
        />
        <Input
          label="Senha"
          type="password"
          placeholder="••••••••"
          icon={<Lock className="w-4 h-4" />}
          error={errors.password?.message as string}
          className="bg-white/10 border-white/20 text-white placeholder-white/40"
          {...register('password')}
        />
        <Button type="submit" variant="primary" size="xl" className="w-full mt-2" loading={isSubmitting}>
          Entrar na Cozinha
        </Button>
      </form>
    </div>
  );
}

export default function CozinhaLoginPage() {
  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center">
      <Suspense fallback={<div className="w-10 h-10 border-2 border-t-transparent border-white/30 rounded-full animate-spin" />}>
        <CozinhaLoginForm />
      </Suspense>
    </div>
  );
}
