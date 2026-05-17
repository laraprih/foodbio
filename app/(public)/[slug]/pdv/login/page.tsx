'use client';

import React, { Suspense } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema } from '@/lib/validations';
import { useRouter, useSearchParams, useParams } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Mail, Lock, Store } from 'lucide-react';

function PDVLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const params = useParams();
  const slug = params.slug as string;
  const callbackUrl = searchParams.get('callbackUrl') ?? `/${slug}/pdv`;

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: any) => {
    try {
      const res = await fetch('/api/auth/section', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: data.email, password: data.password, section: 'pdv', slug }),
      });
      const body = await res.json();
      if (!res.ok) {
        toast.error(body.error ?? 'Credenciais inválidas.');
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
        <div className="w-16 h-16 bg-gray-900 rounded-2xl flex items-center justify-center mb-4 border border-gray-700">
          <Store className="w-8 h-8" style={{ color: 'var(--color-lime-primary)' }} />
        </div>
        <h1 className="text-2xl font-black text-gray-900 tracking-tight">PDV</h1>
        <p className="text-gray-500 text-sm mt-1">Acesso exclusivo para atendentes</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="E-mail"
          type="email"
          placeholder="atendente@restaurante.com"
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
          Entrar no PDV
        </Button>
      </form>
    </div>
  );
}

export default function PDVLoginPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 w-full max-w-sm mx-4">
        <Suspense fallback={<div className="h-64 flex items-center justify-center"><div className="w-8 h-8 border-2 border-t-transparent border-gray-300 rounded-full animate-spin" /></div>}>
          <PDVLoginForm />
        </Suspense>
      </div>
    </div>
  );
}
