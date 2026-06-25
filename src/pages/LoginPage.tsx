import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { GraduationCap, Mail, Lock } from 'lucide-react';
import api from '../lib/axios';
import { errorMessage } from '../api/crud';
import { useAuthStore } from '../store/auth';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
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
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const setAuth = useAuthStore((s) => s.setAuth);
  const navigate = useNavigate();

  const onSubmit = async (e: React.FormEvent) => {
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
      <Card className="w-full max-w-sm shadow-lg">
        <CardContent className="p-6">
          <div className="mb-6 flex flex-col items-center text-center">
            <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-gradient text-white shadow-md shadow-primary/30">
              <GraduationCap size={28} />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-gradient">Akademika</h1>
            <p className="text-sm text-muted-foreground">Sistem Informasi Akademik Kampus</p>
          </div>
          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="email"
                  required
                  className="pl-9"
                  placeholder="email@kampus.ac.id"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="password"
                  required
                  className="pl-9"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? 'Memproses...' : 'Masuk'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
