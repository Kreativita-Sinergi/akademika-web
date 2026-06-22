import api from '../lib/axios';

// Unduh file (PDF/CSV) dari endpoint terproteksi dan trigger save di browser.
export async function downloadFile(
  endpoint: string,
  filename: string,
  params?: Record<string, string | undefined>,
): Promise<void> {
  const res = await api.get(endpoint, { params, responseType: 'blob' });
  triggerSave(res.data as Blob, filename);
}

export function triggerSave(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
