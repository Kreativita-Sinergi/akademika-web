import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { GraduationCap } from 'lucide-react';
import api from '../lib/axios';
import { errorMessage } from '../api/crud';
import { useAuthStore } from '../store/auth';
import { Button, Field, inputClass } from '../components/ui';
import type { ApiResponse } from '../types';

interface LoginData {
  token: string;
  user_id: string;
  campus_id: string | null;
  name: string;
  email: string;
  role: 'SUPER_ADMIN' | 'CAMPUS_ADMIN' | 'LECTURER' | 'STUDENT';
  ref_id: string | null;
}

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const setAuth = useAuthStore((s) => s.setAuth);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post<ApiResponse<LoginData>>('/auth/login', { email, password });
      const data = res.data.data;
      setAuth(data.token, {
        user_id: data.user_id,
        campus_id: data.campus_id,
        name: data.name,
        email: data.email,
        role: data.role,
        ref_id: data.ref_id,
      });
      toast.success(`Selamat datang, ${data.name}`);
      navigate(data.role === 'STUDENT' || data.role === 'LECTURER' ? '/my-schedule' : '/');
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary-50 to-slate-100 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-lg">
        <div className="mb-6 flex flex-col items-center">
          <GraduationCap className="mb-2 text-primary-600" size={40} />
          <h1 className="text-2xl font-bold tracking-tight">Akademika</h1>
          <p className="text-sm text-slate-500">Sistem Informasi Akademik Kampus</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Field label="Email">
            <input
              type="email"
              className={inputClass}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="email@kampus.ac.id"
            />
          </Field>
          <Field label="Password">
            <input
              type="password"
              className={inputClass}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
            />
          </Field>
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? 'Memproses...' : 'Masuk'}
          </Button>
        </form>
      </div>
    </div>
  );
}
