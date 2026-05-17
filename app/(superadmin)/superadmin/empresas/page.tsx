'use client';

import React, { useCallback, useEffect, useState } from 'react';
import {
  Plus, Search, Building2, CheckCircle2, Clock, AlertCircle,
  XCircle, MoreVertical, ExternalLink, Pencil, Ban, RefreshCw, Trash2, X,
} from 'lucide-react';

interface Tenant {
  id: string; slug: string; name: string; phone: string | null;
  address: string | null; city: string | null; state: string | null;
  plan: string; planStatus: string; planPrice: number; planDueDate: string | null;
  active: boolean; createdAt: string; admin_count: number; order_count: number;
  admin_email: string | null; admin_id: string | null;
}

const STATUS_LABEL: Record<string, { label: string; className: string; icon: React.ElementType }> = {
  active:    { label: 'Ativa',      className: 'bg-green-100 text-green-700',  icon: CheckCircle2 },
  trial:     { label: 'Trial',      className: 'bg-amber-100 text-amber-700',  icon: Clock },
  suspended: { label: 'Suspensa',   className: 'bg-red-100 text-red-600',      icon: AlertCircle },
  cancelled: { label: 'Cancelada',  className: 'bg-gray-100 text-gray-500',    icon: XCircle },
};

const PLAN_LABEL: Record<string, string> = {
  free: 'Free', basic: 'Básico', pro: 'Pro', enterprise: 'Enterprise',
};

function StatusBadge({ status }: { status: string }) {
  const s = STATUS_LABEL[status] ?? STATUS_LABEL.trial;
  const Icon = s.icon;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${s.className}`}>
      <Icon className="w-3 h-3" />
      {s.label}
    </span>
  );
}

function fmt(v: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);
}

function fmtDate(d: string | null) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('pt-BR');
}

// ─── Add/Edit Modal ────────────────────────────────────────────────────────────

interface ModalProps {
  tenant?: Tenant | null;
  onClose: () => void;
  onSaved: () => void;
}

function TenantModal({ tenant, onClose, onSaved }: ModalProps) {
  const isEdit = !!tenant;
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    name: tenant?.name ?? '',
    slug: tenant?.slug ?? '',
    phone: tenant?.phone ?? '',
    address: tenant?.address ?? '',
    city: tenant?.city ?? '',
    state: tenant?.state ?? '',
    plan: tenant?.plan ?? 'basic',
    planStatus: tenant?.planStatus ?? 'trial',
    planPrice: String(tenant?.planPrice ?? 99),
    planDueDate: tenant?.planDueDate ? tenant.planDueDate.split('T')[0] : '',
    adminEmail: tenant?.admin_email ?? '',
    adminPassword: '',
  });

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(prev => ({ ...prev, [k]: e.target.value }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const payload: any = {
        ...form,
        planPrice: parseFloat(form.planPrice) || 99,
        planDueDate: form.planDueDate || null,
      };
      // Don't send empty password on edit — only send if the user typed something
      if (isEdit && !payload.adminPassword) delete payload.adminPassword;
      const res = isEdit
        ? await fetch(`/api/superadmin/tenants/${tenant!.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
        : await fetch('/api/superadmin/tenants', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? 'Erro ao salvar');
      }
      onSaved();
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 sticky top-0 bg-white rounded-t-3xl z-10">
          <h2 className="text-lg font-black text-gray-900">{isEdit ? 'Editar Empresa' : 'Nova Empresa'}</h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-gray-100 transition-colors">
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-xl">{error}</p>}

          <section>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Dados da Empresa</p>
            <div className="space-y-3">
              <Field label="Nome da empresa *" value={form.name} onChange={set('name')} placeholder="Ex: Pizzaria do João" required />
              <Field label="Slug (URL) *" value={form.slug} onChange={set('slug')} placeholder="pizzaria-do-joao" required hint={`Acesso: /${form.slug}`} />
              {isEdit && form.slug !== (tenant?.slug ?? '') && (
                <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2.5 text-xs text-amber-800">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-amber-500" />
                  <span>
                    <strong>Atenção:</strong> alterar o slug muda a URL pública da loja de <code className="font-mono bg-amber-100 px-1 rounded">/{tenant?.slug}</code> para <code className="font-mono bg-amber-100 px-1 rounded">/{form.slug}</code>. Links e bookmarks antigos deixarão de funcionar.
                  </span>
                </div>
              )}
              <Field label="Telefone" value={form.phone} onChange={set('phone')} placeholder="(11) 99999-9999" />
              <Field label="Endereço" value={form.address} onChange={set('address')} placeholder="Rua das Flores, 123" />
              <div className="grid grid-cols-2 gap-3">
                <Field label="Cidade" value={form.city} onChange={set('city')} placeholder="São Paulo" />
                <Field label="Estado" value={form.state} onChange={set('state')} placeholder="SP" />
              </div>
            </div>
          </section>

          <section>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Assinatura</p>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <SelectField label="Plano" value={form.plan} onChange={set('plan')} options={[
                  { value: 'free', label: 'Free' },
                  { value: 'basic', label: 'Básico' },
                  { value: 'pro', label: 'Pro' },
                  { value: 'enterprise', label: 'Enterprise' },
                ]} />
                <SelectField label="Status" value={form.planStatus} onChange={set('planStatus')} options={[
                  { value: 'trial', label: 'Trial' },
                  { value: 'active', label: 'Ativa' },
                  { value: 'suspended', label: 'Suspensa' },
                  { value: 'cancelled', label: 'Cancelada' },
                ]} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Mensalidade (R$)" value={form.planPrice} onChange={set('planPrice')} type="number" placeholder="99.00" />
                <Field label="Vencimento" value={form.planDueDate} onChange={set('planDueDate')} type="date" />
              </div>
            </div>
          </section>

          <section>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Administrador da Loja</p>
            <div className="space-y-3">
              <Field label={isEdit ? 'E-mail do admin' : 'E-mail do admin *'} value={form.adminEmail} onChange={set('adminEmail')} type="email" placeholder="admin@empresa.com.br" required={!isEdit} />
              <Field label={isEdit ? 'Nova senha (deixe em branco para manter)' : 'Senha *'} value={form.adminPassword} onChange={set('adminPassword')} type="password" placeholder="••••••••" required={!isEdit} />
            </div>
          </section>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-3 rounded-2xl border border-gray-200 text-sm font-bold text-gray-600 hover:bg-gray-50 transition-colors">
              Cancelar
            </button>
            <button type="submit" disabled={saving} className="flex-1 py-3 rounded-2xl bg-violet-600 text-white text-sm font-bold hover:bg-violet-700 transition-colors disabled:opacity-60">
              {saving ? 'Salvando…' : isEdit ? 'Salvar alterações' : 'Criar empresa'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({ label, hint, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label: string; hint?: string }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-600 mb-1">{label}</label>
      <input
        {...props}
        className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400 transition disabled:bg-gray-50 disabled:text-gray-400"
      />
      {hint && <p className="text-xs text-gray-400 mt-0.5">{hint}</p>}
    </div>
  );
}

function SelectField({ label, options, ...props }: React.SelectHTMLAttributes<HTMLSelectElement> & { label: string; options: { value: string; label: string }[] }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-600 mb-1">{label}</label>
      <select
        {...props}
        className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400 transition bg-white"
      >
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}

// ─── Confirm Modal ──────────────────────────────────────────────────────────────
function ConfirmModal({ title, message, onConfirm, onClose, danger }: {
  title: string; message: string; onConfirm: () => void; onClose: () => void; danger?: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-6">
        <h3 className="text-lg font-black text-gray-900 mb-2">{title}</h3>
        <p className="text-sm text-gray-500 mb-6">{message}</p>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-bold text-gray-600 hover:bg-gray-50 transition-colors">Cancelar</button>
          <button onClick={onConfirm} className={`flex-1 py-2.5 rounded-xl text-white text-sm font-bold transition-colors ${danger ? 'bg-red-500 hover:bg-red-600' : 'bg-violet-600 hover:bg-violet-700'}`}>Confirmar</button>
        </div>
      </div>
    </div>
  );
}

// ─── Row Menu ──────────────────────────────────────────────────────────────────
function RowMenu({ tenant, onEdit, onRefresh }: { tenant: Tenant; onEdit: () => void; onRefresh: () => void }) {
  const [open, setOpen] = useState(false);
  const [confirm, setConfirm] = useState<'suspend' | 'activate' | 'cancel' | null>(null);

  async function patchStatus(planStatus: string, active = true) {
    await fetch(`/api/superadmin/tenants/${tenant.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ planStatus, active }),
    });
    setConfirm(null);
    setOpen(false);
    onRefresh();
  }

  return (
    <div className="relative">
      <button onClick={() => setOpen(p => !p)} className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-gray-100 transition-colors">
        <MoreVertical className="w-4 h-4 text-gray-400" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-9 z-20 bg-white border border-gray-100 rounded-2xl shadow-xl py-1.5 w-48 text-sm">
            <button onClick={() => { setOpen(false); onEdit(); }} className="flex items-center gap-2.5 w-full px-4 py-2 hover:bg-gray-50 text-gray-700">
              <Pencil className="w-3.5 h-3.5" /> Editar
            </button>
            <a href={`/${tenant.slug}`} target="_blank" rel="noreferrer" className="flex items-center gap-2.5 w-full px-4 py-2 hover:bg-gray-50 text-gray-700">
              <ExternalLink className="w-3.5 h-3.5" /> Ver loja
            </a>
            <div className="border-t border-gray-100 my-1" />
            {tenant.planStatus !== 'active' && (
              <button onClick={() => setConfirm('activate')} className="flex items-center gap-2.5 w-full px-4 py-2 hover:bg-green-50 text-green-600">
                <RefreshCw className="w-3.5 h-3.5" /> Ativar
              </button>
            )}
            {tenant.planStatus === 'active' && (
              <button onClick={() => setConfirm('suspend')} className="flex items-center gap-2.5 w-full px-4 py-2 hover:bg-red-50 text-red-500">
                <Ban className="w-3.5 h-3.5" /> Suspender
              </button>
            )}
            <button onClick={() => setConfirm('cancel')} className="flex items-center gap-2.5 w-full px-4 py-2 hover:bg-red-50 text-red-500">
              <Trash2 className="w-3.5 h-3.5" /> Cancelar plano
            </button>
          </div>
        </>
      )}

      {confirm === 'suspend' && (
        <ConfirmModal
          title="Suspender empresa?"
          message={`A empresa "${tenant.name}" perderá acesso ao painel.`}
          onConfirm={() => patchStatus('suspended', false)}
          onClose={() => setConfirm(null)}
          danger
        />
      )}
      {confirm === 'activate' && (
        <ConfirmModal
          title="Ativar empresa?"
          message={`A empresa "${tenant.name}" voltará a ter acesso.`}
          onConfirm={() => patchStatus('active', true)}
          onClose={() => setConfirm(null)}
        />
      )}
      {confirm === 'cancel' && (
        <ConfirmModal
          title="Cancelar plano?"
          message={`O plano de "${tenant.name}" será marcado como cancelado.`}
          onConfirm={() => patchStatus('cancelled', false)}
          onClose={() => setConfirm(null)}
          danger
        />
      )}
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function EmpresasPage() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [modal, setModal] = useState<'new' | Tenant | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set('q', search);
    if (statusFilter) params.set('status', statusFilter);
    fetch(`/api/superadmin/tenants?${params}`)
      .then(r => r.json())
      .then(setTenants)
      .finally(() => setLoading(false));
  }, [search, statusFilter]);

  useEffect(() => { load(); }, [load]);

  const statusTabs = [
    { value: '', label: 'Todas' },
    { value: 'active', label: 'Ativas' },
    { value: 'trial', label: 'Trial' },
    { value: 'suspended', label: 'Suspensas' },
    { value: 'cancelled', label: 'Canceladas' },
  ];

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Empresas</h1>
          <p className="text-gray-400 text-sm mt-0.5">{tenants.length} empresa{tenants.length !== 1 ? 's' : ''} encontrada{tenants.length !== 1 ? 's' : ''}</p>
        </div>
        <button
          onClick={() => setModal('new')}
          className="flex items-center gap-2 px-4 py-2.5 bg-violet-600 text-white text-sm font-bold rounded-xl hover:bg-violet-700 transition-colors shrink-0"
        >
          <Plus className="w-4 h-4" />
          Nova empresa
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por nome ou slug…"
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400 transition"
          />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {statusTabs.map(t => (
            <button
              key={t.value}
              onClick={() => setStatusFilter(t.value)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-colors ${statusFilter === t.value ? 'bg-violet-600 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="divide-y divide-gray-50">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="px-6 py-4 flex items-center gap-4">
                <div className="w-9 h-9 rounded-xl bg-gray-100 animate-pulse shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3.5 w-40 bg-gray-100 rounded animate-pulse" />
                  <div className="h-3 w-24 bg-gray-100 rounded animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        ) : tenants.length === 0 ? (
          <div className="py-16 text-center">
            <Building2 className="w-10 h-10 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">Nenhuma empresa encontrada</p>
          </div>
        ) : (
          <>
            {/* Desktop table header */}
            <div className="hidden md:grid grid-cols-[2fr_1fr_1fr_1fr_1fr_auto] gap-4 px-6 py-3 border-b border-gray-100 bg-gray-50/60">
              {['Empresa', 'Plano', 'Mensalidade', 'Vencimento', 'Status', ''].map(h => (
                <p key={h} className="text-xs font-bold text-gray-400 uppercase tracking-wide">{h}</p>
              ))}
            </div>

            <div className="divide-y divide-gray-50">
              {tenants.map(t => (
                <div key={t.id} className="grid grid-cols-1 md:grid-cols-[2fr_1fr_1fr_1fr_1fr_auto] gap-4 px-6 py-4 items-center hover:bg-gray-50/50 transition-colors">
                  {/* Name */}
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-violet-100 flex items-center justify-center shrink-0">
                      <Building2 className="w-4 h-4 text-violet-600" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-900">{t.name}</p>
                      <p className="text-xs text-gray-400">/{t.slug}</p>
                      {t.admin_email && <p className="text-xs text-gray-400">{t.admin_email}</p>}
                    </div>
                  </div>
                  {/* Plan */}
                  <p className="text-sm text-gray-600 font-medium">{PLAN_LABEL[t.plan] ?? t.plan}</p>
                  {/* Price */}
                  <p className="text-sm font-bold text-gray-900">{fmt(t.planPrice)}<span className="text-xs font-normal text-gray-400">/mês</span></p>
                  {/* Due date */}
                  <p className={`text-sm font-medium ${t.planDueDate && new Date(t.planDueDate) < new Date() ? 'text-red-500' : 'text-gray-600'}`}>
                    {fmtDate(t.planDueDate)}
                  </p>
                  {/* Status */}
                  <div><StatusBadge status={t.planStatus} /></div>
                  {/* Actions */}
                  <RowMenu tenant={t} onEdit={() => setModal(t)} onRefresh={load} />
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Modals */}
      {modal && (
        <TenantModal
          tenant={modal === 'new' ? null : modal}
          onClose={() => setModal(null)}
          onSaved={load}
        />
      )}
    </div>
  );
}
