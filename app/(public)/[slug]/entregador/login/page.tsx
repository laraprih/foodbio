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
import { Mail, Lock, Bike } from 'lucide-react';

function EntregadorLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const params = useParams();
  const slug = params.slug as string;
  const callbackUrl = searchParams.get('callbackUrl') ?? `/${slug}/entregas`;

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
      if (role !== 'driver' && role !== 'admin') {
        toast.error('Acesso restrito a entregadores.');
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
          <Bike className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-2xl font-black text-zinc-950 tracking-tight">Entregador</h1>
        <p className="text-gray-500 text-sm mt-1">Acesso exclusivo para entregadores</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="E-mail"
          type="email"
          placeholder="entregador@restaurante.com"
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
        <Button type="submit" variant="dark" size="xl" className="w-full mt-2" loading={isSubmitting}>
          Entrar
        </Button>
      </form>
    </div>
  );
}

export default function EntregadorLoginPage() {
  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center">
      <Suspense fallback={<div className="w-8 h-8 border-2 border-t-transparent border-gray-300 rounded-full animate-spin" />}>
        <EntregadorLoginForm />
      </Suspense>
    </div>
  );
}
