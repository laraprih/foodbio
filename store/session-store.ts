import { create } from 'zustand';

export interface TenantInfo {
  id: string;
  slug: string;
  name: string;
  gateway: 'mercadopago' | 'pagbank' | null;
}

interface SessionState {
  tenant: TenantInfo | null;
  setTenant: (tenant: TenantInfo) => void;
  clearTenant: () => void;
}

const useSessionStore = create<SessionState>((set) => ({
  tenant: null,
  setTenant: (tenant) => set({ tenant }),
  clearTenant: () => set({ tenant: null }),
}));

export default useSessionStore;
