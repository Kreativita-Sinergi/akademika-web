import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { GraduationCap, Mail, Lock, Eye, EyeOff, Users, CalendarDays, ScrollText } from 'lucide-react';
import api from '../lib/axios';
import { errorMessage } from '../api/crud';
import { useAuthStore } from '../store/auth';
import type { Role } from '../store/auth';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import type { ApiResponse } from '../types';

interface LoginData {
  token: string;
  user_id: string;
  campus_id: string | null;
  name: string;
  email: string;
  role: Role;
  ref_id: string | null;
}

const features = [
  { icon: Users, text: 'Kelola data mahasiswa & dosen terpusat' },
  { icon: CalendarDays, text: 'Susun jadwal kuliah otomatis' },
  { icon: ScrollText, text: 'Pantau nilai & KRS real-time' },
];

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
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
    <div className="flex min-h-screen bg-background">
      {/* ── Left: Hero Panel ── */}
      <div className="hidden lg:flex lg:w-1/2 relative flex-col justify-between overflow-hidden bg-brand-gradient p-12">
        <div className="absolute -top-24 -right-24 h-96 w-96 rounded-full bg-white/5" />
        <div className="absolute top-1/3 -right-16 h-64 w-64 rounded-full bg-white/10" />
        <div className="absolute -bottom-20 -left-20 h-80 w-80 rounded-full bg-white/5" />

        <div className="relative z-10 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/15 text-white">
            <GraduationCap size={22} />
          </div>
          <span className="text-2xl font-extrabold text-white">Akademika</span>
        </div>

        <div className="relative z-10 space-y-8">
          <div>
            <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-white/70">
              Sistem Informasi Akademik
            </p>
            <h1 className="text-4xl xl:text-5xl font-extrabold leading-tight text-white">
              Kelola Akademik Sekolah dan Kampus
            </h1>
            <p className="mt-4 max-w-md text-lg leading-relaxed text-white/80">
              Satu platform untuk SD, SMP, SMA, SMK, dan perguruan tinggi.
            </p>
          </div>

          <ul className="space-y-3">
            {features.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3 text-white/80">
                <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-white/10">
                  <Icon size={16} className="text-white" />
                </span>
                <span className="text-sm">{text}</span>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative z-10 text-xs text-white/60">
          © {new Date().getFullYear()} Akademika. All rights reserved.
        </p>
      </div>

      {/* ── Right: Form Panel ── */}
      <div className="flex flex-1 items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="mb-8 text-center lg:hidden">
            <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-gradient text-white shadow-md shadow-primary/30">
              <GraduationCap size={24} />
            </div>
            <p className="text-sm text-muted-foreground">Sistem Informasi Akademik</p>
          </div>

          <Card className="shadow-sm">
            <CardContent className="p-8">
              <div className="mb-7">
                <h2 className="text-2xl font-bold text-foreground">Masuk ke Akademika</h2>
                <p className="mt-1 text-sm text-muted-foreground">Selamat datang kembali!</p>
              </div>
              <form onSubmit={onSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      required
                      className="h-11 pl-9"
                      placeholder="email@sekolah.sch.id"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="password"
                      type={showPass ? 'text' : 'password'}
                      required
                      className="h-11 pl-9 pr-12"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => setShowPass(!showPass)}
                      className="absolute right-1 top-1/2 h-8 w-8 -translate-y-1/2 text-muted-foreground"
                    >
                      {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                    </Button>
                  </div>
                </div>
                <Button type="submit" disabled={loading} className="h-11 w-full" size="lg">
                  {loading ? 'Memproses...' : 'Masuk'}
                </Button>
              </form>
              <p className="mt-5 text-center text-sm text-muted-foreground">Belum punya akun sekolah? <a className="font-semibold text-primary" href="/sekolah/daftar">Daftarkan sekolah</a></p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
