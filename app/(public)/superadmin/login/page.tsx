'use client';

import React, { Suspense } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema } from '@/lib/validations';
import { signIn, getSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Mail, Lock, ShieldCheck } from 'lucide-react';

function SuperAdminLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') ?? '/superadmin/dashboard';

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
      if (role !== 'superadmin') {
        toast.error('Acesso exclusivo para administradores master.');
        return;
      }
      toast.success('Bem-vindo ao painel master!');
      router.push(callbackUrl);
    } catch {
      toast.error('Ocorreu um erro. Tente novamente.');
    }
  };

  return (
    <div className="flex-1 px-6 py-10 lg:py-0 flex flex-col justify-center max-w-sm mx-auto w-full lg:max-w-md lg:px-12">
      <div className="mb-8">
        <div className="w-12 h-12 bg-violet-600 rounded-2xl flex items-center justify-center mb-4">
          <ShieldCheck className="w-6 h-6 text-white" />
        </div>
        <h2 className="text-2xl font-black text-gray-900 mb-1.5">Painel Master</h2>
        <p className="text-gray-400 text-sm">Acesso exclusivo para administradores do sistema</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input label="E-mail" type="email" placeholder="master@foodbio.com.br"
          icon={<Mail className="w-4 h-4" />}
          error={errors.email?.message as string}
          {...register('email')} />
        <Input label="Senha" type="password" placeholder="••••••••"
          icon={<Lock className="w-4 h-4" />}
          error={errors.password?.message as string}
          {...register('password')} />
        <Button type="submit" variant="dark" size="xl" className="w-full mt-2 !bg-violet-600 hover:!bg-violet-700" loading={isSubmitting}>
          Entrar no painel master
        </Button>
      </form>
    </div>
  );
}

export default function SuperAdminLoginPage() {
  return (
    <div className="min-h-screen bg-white lg:bg-gray-50 flex flex-col lg:flex-row">
      <div className="hidden lg:flex lg:w-5/12 xl:w-1/2 bg-violet-600 flex-col items-center justify-center p-16 relative overflow-hidden">
        <div className="absolute top-1/4 -left-20 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 -right-20 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
        <div className="relative text-center">
          <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-2xl">
            <ShieldCheck className="w-8 h-8 text-violet-600" />
          </div>
          <h1 className="text-4xl font-black text-white mb-3 tracking-tight">Foodbio</h1>
          <p className="text-white/75 text-lg max-w-sm leading-relaxed">Master Admin — gerencie todas as empresas do ecossistema.</p>
          <div className="grid grid-cols-3 gap-4 mt-12">
            {[
              { value: 'Multi', label: 'Tenant' },
              { value: 'SaaS', label: 'Plataforma' },
              { value: '100%', label: 'Controle' },
            ].map(({ value, label }) => (
              <div key={label} className="bg-white/15 rounded-xl p-3 border border-white/20">
                <p className="font-black text-white text-lg">{value}</p>
                <p className="text-white/60 text-xs mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col lg:justify-center">
        <div className="lg:hidden flex items-center gap-3 px-5 py-4 border-b border-gray-100">
          <div className="w-9 h-9 bg-violet-600 rounded-xl flex items-center justify-center">
            <ShieldCheck className="w-5 h-5 text-white" />
          </div>
          <span className="font-black text-gray-900 text-lg">Foodbio <span className="text-violet-600 text-sm">master</span></span>
        </div>
        <Suspense fallback={<div className="flex-1" />}>
          <SuperAdminLoginForm />
        </Suspense>
      </div>
    </div>
  );
}
