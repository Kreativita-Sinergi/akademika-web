import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../lib/axios';
import { errorMessage, getResource } from '../api/crud';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

type School = { code: string; name: string; education_level: string; city: string };

export default function SchoolApplyPage() {
  const { code } = useParams();
  const [school, setSchool] = useState<School | null>(null);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState('');
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', parent_name: '', email: '', phone: '', nisn: '', password: '' });
  useEffect(() => { getResource<School>(`/schools/${code}`).then(setSchool).catch((err) => setError(errorMessage(err))); }, [code]);
  const submit = async (event: React.FormEvent) => {
    event.preventDefault(); setSaving(true);
    try {
      const res = await api.post<{ data: { id: string } }>(`/schools/${code}/apply`, form);
      setSaved(res.data.data.id); toast.success('Pendaftaran terkirim');
    } catch (err) { toast.error(errorMessage(err)); }
    finally { setSaving(false); }
  };
  return <div className="min-h-screen bg-muted/30 flex items-center justify-center p-5"><Card className="w-full max-w-lg"><CardContent className="p-7 space-y-5">
    <div><p className="text-sm font-semibold text-primary">Pendaftaran Peserta Didik Baru</p><h1 className="text-2xl font-bold">{school?.name ?? 'Memuat sekolah...'}</h1><p className="text-sm text-muted-foreground">{school && `${school.education_level} · ${school.city}`}</p></div>
    {error && <p className="text-sm text-destructive">{error}</p>}
    {saved ? <div className="rounded-md bg-green-50 p-4 text-sm"><p className="font-semibold">Pendaftaran diterima.</p><p>Simpan nomor pendaftaran: {saved}</p><p>Masuk dengan email dan password yang dibuat untuk melihat status dan mengikuti ujian.</p><a className="font-semibold text-primary" href="/login">Masuk ke akun pendaftar →</a></div> : school && <form onSubmit={submit} className="space-y-3">
      {([['name', 'Nama calon siswa'], ['parent_name', 'Nama orang tua/wali'], ['email', 'Email'], ['phone', 'Nomor telepon'], ['nisn', 'NISN (jika ada)']] as const).map(([key, label]) => <label key={key} className="block space-y-1 text-sm"><span>{label}</span><Input required={key !== 'nisn'} type={key === 'email' ? 'email' : 'text'} value={form[key]} onChange={(e) => setForm((v) => ({ ...v, [key]: e.target.value }))} /></label>)}
      <label className="block space-y-1 text-sm"><span>Password akun pendaftar</span><Input required type="password" minLength={8} value={form.password} onChange={(e) => setForm((v) => ({ ...v, password: e.target.value }))} /></label>
      <Button className="w-full" disabled={saving}>{saving ? 'Mengirim...' : 'Kirim pendaftaran'}</Button>
    </form>}
  </CardContent></Card></div>;
}
