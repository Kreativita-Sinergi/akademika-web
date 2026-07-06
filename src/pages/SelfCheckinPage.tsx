import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { CheckCircle2, MapPin, XCircle } from 'lucide-react';
import { createResource, errorMessage } from '../api/crud';
import { Button } from '../components/ui';
import { Loading } from '../components/atoms/Loading';

type Phase = 'idle' | 'locating' | 'submitting' | 'success' | 'error';

// Halaman presensi mandiri: dibuka mahasiswa dari hasil scan QR dosen.
// Mengambil lokasi (untuk geofence) lalu mengirim check-in.
export default function SelfCheckinPage() {
  const { token = '' } = useParams();
  const [phase, setPhase] = useState<Phase>('idle');
  const [message, setMessage] = useState('');
  const [info, setInfo] = useState<{ meeting_number?: number; topic?: string }>({});

  const submit = (lat?: number, lng?: number) => {
    setPhase('submitting');
    void createResource<{ meeting_number: number; topic: string }>('/attendance/self-checkin', { token, lat, lng })
      .then((data) => {
        setInfo(data);
        setPhase('success');
      })
      .catch((err) => {
        setMessage(errorMessage(err));
        setPhase('error');
      });
  };

  const start = () => {
    if (!navigator.geolocation) {
      submit();
      return;
    }
    setPhase('locating');
    navigator.geolocation.getCurrentPosition(
      (pos) => submit(pos.coords.latitude, pos.coords.longitude),
      () => submit(), // tolak/izin lokasi gagal → kirim tanpa lokasi (backend tolak bila geofence aktif)
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  useEffect(() => {
    start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center text-center">
      {(phase === 'locating' || phase === 'submitting') && (
        <>
          <Loading size="lg" />
          <p className="mt-4 text-muted-foreground">
            {phase === 'locating' ? 'Mengambil lokasi Anda…' : 'Mengirim presensi…'}
          </p>
          {phase === 'locating' && (
            <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin size={12} /> Izinkan akses lokasi untuk verifikasi area kampus
            </p>
          )}
        </>
      )}

      {phase === 'success' && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-8">
          <CheckCircle2 size={56} className="mx-auto text-emerald-500" />
          <h1 className="mt-3 text-xl font-bold text-emerald-700">Presensi Berhasil</h1>
          <p className="mt-1 text-sm text-emerald-600">
            Pertemuan ke-{info.meeting_number}: {info.topic}
          </p>
        </div>
      )}

      {phase === 'error' && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-8">
          <XCircle size={56} className="mx-auto text-rose-500" />
          <h1 className="mt-3 text-xl font-bold text-rose-700">Presensi Gagal</h1>
          <p className="mt-1 text-sm text-rose-600">{message}</p>
          <div className="mt-4">
            <Button onClick={start}>Coba Lagi</Button>
          </div>
        </div>
      )}
    </div>
  );
}
