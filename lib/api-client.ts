import { getSession, signOut } from 'next-auth/react';
import type { Session } from 'next-auth';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

export type ApiError = { error: string; status: number };

export function isApiError(r: unknown): r is ApiError {
  return typeof r === 'object' && r !== null && 'error' in r && 'status' in r;
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T | ApiError> {
  const session = await getSession() as (Session & { accessToken?: string }) | null;
  const token = session?.accessToken;

  const headers = new Headers(options.headers);
  headers.set('Content-Type', 'application/json');
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  // /bff/ and /api/ paths are same-origin (relative); others use BASE_URL
  const url = path.startsWith('http') || path.startsWith('/bff/') || path.startsWith('/api/')
    ? path
    : `${BASE_URL}${path}`;

  try {
    const response = await fetch(url, { ...options, headers });

    if (response.status === 401) {
      signOut({ callbackUrl: '/login' });
      return { error: 'Sessão expirada', status: 401 };
    }

    if (response.status === 204) return null as T;

    const data = await response.json();

    if (!response.ok) {
      return { error: data.error || 'Erro na requisição', status: response.status };
    }

    return data as T;
  } catch {
    return { error: 'Sem conexão com o servidor', status: 0 };
  }
}

export async function get<T>(path: string, params?: Record<string, string>): Promise<T | ApiError> {
  const url = params ? `${path}?${new URLSearchParams(params)}` : path;
  return request<T>(url, { method: 'GET' });
}

export async function post<T>(path: string, body: unknown): Promise<T | ApiError> {
  return request<T>(path, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function patch<T>(path: string, body: unknown): Promise<T | ApiError> {
  return request<T>(path, {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
}

export async function del<T>(path: string): Promise<T | ApiError> {
  return request<T>(path, { method: 'DELETE' });
}
