import api from '../lib/axios';
import type { ApiResponse } from '../types';

// Upload file ke Cloudinary lewat backend (kredensial tidak pernah ada di frontend).
// folder: students | lecturers | applicants | documents | theses | internships | campus
export async function uploadFile(file: File, folder: string): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('folder', folder);
  const res = await api.post<ApiResponse<{ url: string }>>('/uploads', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data.data.url;
}
