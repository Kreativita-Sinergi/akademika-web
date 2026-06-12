import api from '../lib/axios';
import type { ApiResponse } from '../types';

// Helper CRUD generik — semua halaman resource memakai ini.
export async function listResource<T>(
  endpoint: string,
  params?: Record<string, string | number | undefined>,
): Promise<ApiResponse<T[]>> {
  const res = await api.get<ApiResponse<T[]>>(endpoint, { params });
  return res.data;
}

export async function getResource<T>(endpoint: string): Promise<T> {
  const res = await api.get<ApiResponse<T>>(endpoint);
  return res.data.data;
}

export async function createResource<T>(endpoint: string, payload: unknown): Promise<T> {
  const res = await api.post<ApiResponse<T>>(endpoint, payload);
  return res.data.data;
}

export async function updateResource<T>(endpoint: string, payload: unknown): Promise<T> {
  const res = await api.put<ApiResponse<T>>(endpoint, payload);
  return res.data.data;
}

export async function patchResource<T>(endpoint: string, payload: unknown): Promise<T> {
  const res = await api.patch<ApiResponse<T>>(endpoint, payload);
  return res.data.data;
}

export async function deleteResource(endpoint: string): Promise<void> {
  await api.delete(endpoint);
}

export function errorMessage(err: unknown): string {
  if (typeof err === 'object' && err !== null && 'response' in err) {
    const resp = (err as { response?: { data?: { error?: { details?: string }; message?: string } } }).response;
    return resp?.data?.error?.details || resp?.data?.message || 'Terjadi kesalahan';
  }
  return 'Terjadi kesalahan';
}
