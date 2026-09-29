import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../lib/axios';
import { errorMessage } from '../api/crud';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';

export default function SchoolRegisterPage() {
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ education_level: 'SD', campus_name: '', campus_code: '', city: '', admin_name: '', admin_email: '', admin_password: '' });
  const update = (key: keyof typeof form, value: string) => setForm((v) => ({ ...v, [key]: value }));
  const submit = async (event: React.FormEvent) => {
    event.preventDefault(); setSaving(true);
    try {
      await api.post('/campuses/register', form);
      toast.success('Sekolah berhasil didaftarkan. Silakan masuk.');
      navigate('/login');
    } catch (error) { toast.error(errorMessage(error)); }
    finally { setSaving(false); }
  };
  return <div className="min-h-screen bg-muted/30 p-5 flex items-center justify-center">
    <Card className="w-full max-w-xl"><CardContent className="p-7 space-y-5">
      <div><h1 className="text-2xl font-bold">Daftarkan sekolah</h1><p className="text-sm text-muted-foreground">Buat ruang kerja Akademika untuk SD, SMP, SMA, atau SMK.</p></div>
      <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
        <label className="space-y-1 text-sm">Jenjang<select className="w-full rounded-md border bg-background p-2" value={form.education_level} onChange={(e) => update('education_level', e.target.value)}>{['SD','SMP','SMA','SMK'].map((x) => <option key={x}>{x}</option>)}</select></label>
        <label className="space-y-1 text-sm">Kode sekolah<Input required maxLength={20} value={form.campus_code} onChange={(e) => update('campus_code', e.target.value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase())} placeholder="SMKN1BANDUNG" /></label>
        <label className="space-y-1 text-sm sm:col-span-2">Nama sekolah<Input required value={form.campus_name} onChange={(e) => update('campus_name', e.target.value)} placeholder="Nama lengkap sekolah" /></label>
        <label className="space-y-1 text-sm">Kota<Input value={form.city} onChange={(e) => update('city', e.target.value)} /></label>
        <label className="space-y-1 text-sm">Nama admin<Input required value={form.admin_name} onChange={(e) => update('admin_name', e.target.value)} /></label>
        <label className="space-y-1 text-sm">Email admin<Input required type="email" value={form.admin_email} onChange={(e) => update('admin_email', e.target.value)} /></label>
        <label className="space-y-1 text-sm">Password admin<Input required type="password" minLength={8} value={form.admin_password} onChange={(e) => update('admin_password', e.target.value)} /></label>
        <Button className="sm:col-span-2" disabled={saving}>{saving ? 'Mendaftarkan...' : 'Daftarkan sekolah'}</Button>
      </form>
      <p className="text-sm text-center">Sudah punya akun? <Link className="text-primary font-semibold" to="/login">Masuk</Link></p>
    </CardContent></Card>
  </div>;
}
