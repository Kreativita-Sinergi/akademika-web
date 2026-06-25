import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { GraduationCap, Search } from 'lucide-react';
import axios from 'axios';
import { Button, Field, formatRupiah, inputClass } from '../../components/ui';
import type { AdmissionWave, ApiResponse, StudyProgram } from '../../types';

// Klien publik: tanpa token (axios instance utama meng-attach Authorization).
const pub = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8081/api/v1',
  timeout: 30000,
});

export function publicError(err: unknown): string {
  if (axios.isAxiosError(err)) {
    return err.response?.data?.error?.details || err.response?.data?.message || 'Terjadi kesalahan';
  }
  return 'Terjadi kesalahan';
}

interface PmbInfo {
  campus: { name: string; city: string };
  waves: AdmissionWave[];
  programs: StudyProgram[];
}

interface RegisterResult {
  registration_number: string;
  name: string;
}

// Halaman pendaftaran mahasiswa baru — publik, tanpa login.
export default function PublicRegisterPage() {
  const { campusCode = '' } = useParams();
  const [info, setInfo] = useState<PmbInfo | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [form, setForm] = useState<Record<string, string>>({ gender: 'L' });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<RegisterResult | null>(null);

  useEffect(() => {
    void pub
      .get<ApiResponse<PmbInfo>>(`/public/campuses/${campusCode}/info`)
      .then((res) => setInfo(res.data.data))
      .catch(() => setNotFound(true));
  }, [campusCode]);

  const set = (key: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm({ ...form, [key]: e.target.value });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await pub.post<ApiResponse<RegisterResult>>(`/public/campuses/${campusCode}/register`, {
        admission_wave_id: form.wave,
        name: form.name,
        gender: form.gender,
        birth_place: form.birth_place,
        birth_date: form.birth_date ? new Date(form.birth_date).toISOString() : null,
        address: form.address,
        phone: form.phone,
        email: form.email,
        school_origin: form.school_origin,
        first_choice_program_id: form.program1,
        second_choice_program_id: form.program2 || null,
      });
      setResult(res.data.data);
    } catch (err) {
      toast.error(publicError(err));
    } finally {
      setLoading(false);
    }
  };

  if (notFound) {
    return <PublicShell title="Kampus tidak ditemukan">Periksa kembali tautan pendaftaran Anda.</PublicShell>;
  }
  if (!info) {
    return <PublicShell title="Memuat...">Mengambil informasi PMB...</PublicShell>;
  }

  if (result) {
    return (
      <PublicShell title="Pendaftaran Berhasil 🎉">
        <p className="mb-2 text-muted-foreground">
          Terima kasih, <b>{result.name}</b>. Simpan nomor pendaftaran Anda:
        </p>
        <div className="mb-4 rounded-xl bg-primary/5 py-4 text-center text-2xl font-bold tracking-wider text-primary">
          {result.registration_number}
        </div>
        <p className="mb-4 text-sm text-muted-foreground">
          Selesaikan pembayaran biaya pendaftaran, lalu pantau status & jadwal ujian Anda di halaman{' '}
          <b>Cek Status</b> menggunakan nomor pendaftaran + tanggal lahir.
        </p>
        <Link to={`/status/${campusCode}`}>
          <Button className="w-full">Cek Status Pendaftaran</Button>
        </Link>
      </PublicShell>
    );
  }

  const selectedWave = info.waves.find((w) => w.id === form.wave);

  return (
    <PublicShell title={`PMB ${info.campus.name}`} wide>
      <form onSubmit={handleSubmit} className="grid gap-3 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Field label="Gelombang Pendaftaran">
            <select className={inputClass} value={form.wave ?? ''} onChange={set('wave')} required>
              <option value="">— pilih gelombang —</option>
              {info.waves.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name} — biaya {formatRupiah(w.registration_fee)}
                </option>
              ))}
            </select>
          </Field>
          {info.waves.length === 0 && (
            <p className="mt-1 text-sm text-amber-600">Belum ada gelombang pendaftaran yang dibuka.</p>
          )}
        </div>
        <Field label="Nama Lengkap">
          <input className={inputClass} value={form.name ?? ''} onChange={set('name')} required />
        </Field>
        <Field label="Jenis Kelamin">
          <select className={inputClass} value={form.gender} onChange={set('gender')}>
            <option value="L">Laki-laki</option>
            <option value="P">Perempuan</option>
          </select>
        </Field>
        <Field label="Tempat Lahir">
          <input className={inputClass} value={form.birth_place ?? ''} onChange={set('birth_place')} />
        </Field>
        <Field label="Tanggal Lahir (untuk verifikasi cek status)">
          <input type="date" className={inputClass} value={form.birth_date ?? ''} onChange={set('birth_date')} required />
        </Field>
        <Field label="No. HP / WhatsApp">
          <input className={inputClass} value={form.phone ?? ''} onChange={set('phone')} required />
        </Field>
        <Field label="Email">
          <input type="email" className={inputClass} value={form.email ?? ''} onChange={set('email')} required />
        </Field>
        <Field label="Asal Sekolah">
          <input className={inputClass} value={form.school_origin ?? ''} onChange={set('school_origin')} />
        </Field>
        <Field label="Alamat">
          <input className={inputClass} value={form.address ?? ''} onChange={set('address')} />
        </Field>
        <Field label="Pilihan Prodi 1">
          <select className={inputClass} value={form.program1 ?? ''} onChange={set('program1')} required>
            <option value="">— pilih prodi —</option>
            {info.programs.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.degree})
              </option>
            ))}
          </select>
        </Field>
        <Field label="Pilihan Prodi 2 (opsional)">
          <select className={inputClass} value={form.program2 ?? ''} onChange={set('program2')}>
            <option value="">— tidak ada —</option>
            {info.programs.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.degree})
              </option>
            ))}
          </select>
        </Field>
        <div className="sm:col-span-2">
          {selectedWave && (
            <p className="mb-2 text-sm text-muted-foreground">
              Biaya pendaftaran: <b>{formatRupiah(selectedWave.registration_fee)}</b> — instruksi pembayaran akan
              diinformasikan panitia setelah Anda mendaftar.
            </p>
          )}
          <Button type="submit" disabled={loading || info.waves.length === 0} className="w-full">
            {loading ? 'Mendaftar...' : 'Daftar Sekarang'}
          </Button>
          <Link to={`/status/${campusCode}`} className="mt-3 flex items-center justify-center gap-1 text-sm text-primary hover:underline">
            <Search size={14} /> Sudah daftar? Cek status pendaftaran
          </Link>
        </div>
      </form>
    </PublicShell>
  );
}

export function PublicShell({ title, children, wide }: { title: string; children: React.ReactNode; wide?: boolean }) {
  return (
    <div className="flex min-h-screen items-start justify-center bg-gradient-to-br from-primary-50 to-slate-100 p-4 py-10">
      <div className={`w-full rounded-2xl bg-card p-8 shadow-lg ${wide ? 'max-w-2xl' : 'max-w-md'}`}>
        <div className="mb-6 flex flex-col items-center text-center">
          <GraduationCap className="mb-2 text-primary" size={36} />
          <h1 className="text-xl font-bold tracking-tight">{title}</h1>
        </div>
        {children}
      </div>
    </div>
  );
}

export { pub };
