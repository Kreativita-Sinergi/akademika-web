import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Badge, Button, Field, formatDate, inputClass } from '../../components/ui';
import { PublicShell, pub, publicError } from './PublicRegisterPage';
import type { ApiResponse, Applicant } from '../../types';

interface StatusResult {
  applicant: Applicant & {
    exam_schedule?: { name: string; exam_date: string; start_time: string; end_time: string; room?: { name: string; building: string } };
  };
  reenrollment?: { payment_status: string; document_complete: boolean };
  exam_attempt?: { status: string; score: number | null };
}

// Cek status pendaftaran — publik, verifikasi nomor pendaftaran + tanggal lahir.
export default function StatusCheckPage() {
  const { campusCode = '' } = useParams();
  const navigate = useNavigate();
  const [regNumber, setRegNumber] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [result, setResult] = useState<StatusResult | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await pub.post<ApiResponse<StatusResult>>(`/public/campuses/${campusCode}/status`, {
        registration_number: regNumber.trim(),
        birth_date: new Date(birthDate).toISOString(),
      });
      setResult(res.data.data);
    } catch (err) {
      toast.error(publicError(err));
    } finally {
      setLoading(false);
    }
  };

  const startExam = () => {
    // Simpan identitas untuk halaman ujian.
    sessionStorage.setItem(
      'akademika-exam-identity',
      JSON.stringify({ campusCode, registration_number: regNumber.trim(), birth_date: new Date(birthDate).toISOString() }),
    );
    navigate('/ujian');
  };

  const a = result?.applicant;

  return (
    <PublicShell title="Cek Status Pendaftaran" wide={Boolean(result)}>
      {!result && (
        <form onSubmit={handleSubmit} className="space-y-3">
          <Field label="Nomor Pendaftaran">
            <input className={inputClass} value={regNumber} onChange={(e) => setRegNumber(e.target.value)} placeholder="PMB-2026-0001" required />
          </Field>
          <Field label="Tanggal Lahir">
            <input type="date" className={inputClass} value={birthDate} onChange={(e) => setBirthDate(e.target.value)} required />
          </Field>
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? 'Memeriksa...' : 'Cek Status'}
          </Button>
          <Link to={`/daftar/${campusCode}`} className="block text-center text-sm text-primary hover:underline">
            Belum daftar? Daftar sekarang
          </Link>
        </form>
      )}

      {result && a && (
        <div className="space-y-4">
          <div className="rounded-xl border border-border p-4">
            <div className="mb-1 flex items-center justify-between">
              <span className="font-semibold">{a.name}</span>
              <Badge value={a.status} />
            </div>
            <div className="text-sm text-muted-foreground">
              {a.registration_number} · {a.first_choice?.name ?? '-'}
            </div>
            <div className="mt-2 text-sm">
              Pembayaran pendaftaran: <Badge value={a.payment_status} />
            </div>
          </div>

          {a.exam_schedule && (
            <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm">
              <div className="mb-1 font-semibold text-blue-800">Jadwal Ujian Anda</div>
              <div className="text-blue-700">
                {a.exam_schedule.name} — {formatDate(a.exam_schedule.exam_date)}, {a.exam_schedule.start_time}–{a.exam_schedule.end_time}
                {a.exam_schedule.room && (
                  <> · Ruang {a.exam_schedule.room.name} ({a.exam_schedule.room.building})</>
                )}
              </div>
            </div>
          )}

          {a.exam_schedule && (
            <Button
              variant="secondary"
              className="w-full"
              onClick={() => {
                void pub
                  .post(`/public/campuses/${campusCode}/exam-card`, {
                    registration_number: regNumber.trim(),
                    birth_date: new Date(birthDate).toISOString(),
                  }, { responseType: 'blob' })
                  .then((res) => {
                    const url = URL.createObjectURL(res.data as Blob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = `KartuUjian-${regNumber.trim()}.pdf`;
                    link.click();
                    URL.revokeObjectURL(url);
                  })
                  .catch(() => toast.error('Gagal mengunduh kartu ujian'));
              }}
            >
              Unduh Kartu Ujian (PDF)
            </Button>
          )}

          {a.status === 'ujian_dijadwalkan' && !result.exam_attempt?.status?.includes('selesai') && (
            <Button onClick={startExam} className="w-full">
              Kerjakan Ujian Online Sekarang
            </Button>
          )}

          {a.exam_score != null && (
            <div className={`rounded-xl p-4 text-center ${a.status === 'lulus' || a.status === 'daftar_ulang' || a.status === 'diterima' ? 'bg-emerald-50' : 'bg-red-50'}`}>
              <div className="text-sm text-muted-foreground">Nilai Ujian</div>
              <div className="text-3xl font-bold">{a.exam_score}</div>
              <div className={`mt-1 font-semibold ${a.status === 'tidak_lulus' ? 'text-red-600' : 'text-emerald-600'}`}>
                {a.status === 'tidak_lulus' ? 'Mohon maaf, Anda belum lulus' : 'Selamat, Anda LULUS ujian masuk! 🎉'}
              </div>
            </div>
          )}

          {a.status === 'lulus' && (
            <p className="text-center text-sm text-muted-foreground">
              Silakan datang ke kampus untuk <b>daftar ulang</b> (penetapan UKT & kelengkapan berkas).
            </p>
          )}
          {a.status === 'diterima' && (
            <p className="text-center text-sm text-emerald-600">
              Anda resmi menjadi mahasiswa. Akun login dikirim oleh kampus (password awal = nomor pendaftaran).
            </p>
          )}

          <Button variant="secondary" onClick={() => setResult(null)} className="w-full">
            Cek nomor lain
          </Button>
        </div>
      )}
    </PublicShell>
  );
}
