'use client';

import React, { useEffect, useState } from 'react';
import { Building2, TrendingUp, CheckCircle2, Clock, AlertCircle, DollarSign, XCircle } from 'lucide-react';

interface Stats {
  total: number; active: number; trial: number; suspended: number;
  cancelled: number; monthlyRevenue: number; annualRevenue: number;
}

function KpiCard({ icon: Icon, label, value, sub, color }: {
  icon: React.ElementType; label: string; value: string; sub?: string; color: string;
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 flex items-start gap-4">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-xs text-gray-400 font-medium mb-0.5">{label}</p>
        <p className="text-2xl font-black text-gray-900">{value}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

export default function SuperAdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/superadmin/stats')
      .then(r => r.json())
      .then(setStats)
      .finally(() => setLoading(false));
  }, []);

  const fmt = (v: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-black text-gray-900">Dashboard</h1>
        <p className="text-gray-400 text-sm mt-1">Visão geral de todas as empresas cadastradas</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 h-24 animate-pulse" />
          ))}
        </div>
      ) : stats && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
            <KpiCard icon={Building2} label="Total de Empresas" value={String(stats.total)}
              color="bg-violet-50 text-violet-600" />
            <KpiCard icon={CheckCircle2} label="Ativas" value={String(stats.active)}
              sub={stats.total ? `${Math.round((stats.active / stats.total) * 100)}% do total` : ''}
              color="bg-green-50 text-green-600" />
            <KpiCard icon={Clock} label="Em Trial" value={String(stats.trial)}
              color="bg-amber-50 text-amber-600" />
            <KpiCard icon={AlertCircle} label="Suspensas" value={String(stats.suspended)}
              color="bg-red-50 text-red-500" />
            <KpiCard icon={XCircle} label="Canceladas" value={String(stats.cancelled)}
              color="bg-gray-100 text-gray-400" />
            <KpiCard icon={DollarSign} label="Receita Mensal" value={fmt(stats.monthlyRevenue)}
              sub="empresas ativas" color="bg-emerald-50 text-emerald-600" />
            <KpiCard icon={TrendingUp} label="Receita Anual Est." value={fmt(stats.annualRevenue)}
              color="bg-blue-50 text-blue-600" />
          </div>
        </>
      )}

      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <h2 className="text-sm font-bold text-gray-700 mb-1">Acesso rápido</h2>
        <p className="text-xs text-gray-400 mb-4">Gerencie suas empresas cadastradas</p>
        <a
          href="/superadmin/empresas"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-violet-600 text-white text-sm font-bold rounded-xl hover:bg-violet-700 transition-colors"
        >
          <Building2 className="w-4 h-4" />
          Ver todas as empresas
        </a>
      </div>
    </div>
  );
}
