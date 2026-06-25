import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, Circle, ArrowRight, Loader2, Sparkles } from 'lucide-react';
import { listResource } from '../../api/crud';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { AcademicYear } from '../../types';

interface Step {
  key: string;
  label: string;
  desc: string;
  path: string;
  done: boolean;
}

// Hitung jumlah baris sebuah resource (pakai limit=1, baca pagination.total).
const count = (endpoint: string) =>
  listResource(endpoint, { page: 1, limit: 1 })
    .then((r) => r.pagination?.total ?? r.data?.length ?? 0)
    .catch(() => 0);

// Panduan Memulai — checklist langkah setup dasar untuk admin kampus baru.
// Mengikuti alur akademik; tiap langkah otomatis ✅ saat datanya sudah terisi.
export default function OnboardingChecklist() {
  const [steps, setSteps] = useState<Step[] | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    void Promise.all([
      count('/master/faculties'),
      count('/master/programs'),
      listResource<AcademicYear>('/master/academic-years', { page: 1, limit: 100 })
        .then((r) => (r.data ?? []).some((y) => y.is_active))
        .catch(() => false),
      count('/master/rooms'),
      count('/master/courses'),
      count('/master/class-groups'),
      count('/lecturers'),
      count('/ukt/groups'),
      count('/students'),
      count('/schedules'),
    ]).then(([fac, prog, activeYear, rooms, courses, rombel, dosen, ukt, mhs, jadwal]) => {
      setSteps([
        { key: 'fac', label: 'Buat Fakultas', desc: 'Unit/jurusan tingkat atas kampus', path: '/master/faculties', done: fac > 0 },
        { key: 'prog', label: 'Buat Program Studi', desc: 'Prodi di bawah tiap fakultas', path: '/master/programs', done: prog > 0 },
        { key: 'year', label: 'Aktifkan Tahun Akademik', desc: 'Wajib — acuan semua modul perkuliahan', path: '/master/academic-years', done: activeYear },
        { key: 'room', label: 'Tambah Ruangan', desc: 'Dipakai untuk penjadwalan kelas & ujian', path: '/master/rooms', done: rooms > 0 },
        { key: 'course', label: 'Tambah Mata Kuliah', desc: 'Kurikulum per program studi', path: '/master/courses', done: courses > 0 },
        { key: 'rombel', label: 'Buat Rombel / Kelas', desc: 'Pengelompokan mahasiswa per angkatan', path: '/master/class-groups', done: rombel > 0 },
        { key: 'lec', label: 'Input Data Dosen', desc: 'Pengampu mata kuliah & dosen wali', path: '/lecturers', done: dosen > 0 },
        { key: 'ukt', label: 'Atur Golongan UKT', desc: 'Tarif per prodi (dipakai PMB & tagihan)', path: '/ukt/groups', done: ukt > 0 },
        { key: 'std', label: 'Data Mahasiswa', desc: 'Input manual atau hasil enroll PMB', path: '/students', done: mhs > 0 },
        { key: 'sch', label: 'Susun Jadwal Kuliah', desc: 'Mata kuliah × dosen × ruang × rombel', path: '/schedules', done: jadwal > 0 },
      ]);
    });
  }, []);

  if (!steps) {
    return (
      <Card>
        <CardContent className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Memeriksa kelengkapan setup…
        </CardContent>
      </Card>
    );
  }

  const doneCount = steps.filter((s) => s.done).length;
  const pct = Math.round((doneCount / steps.length) * 100);
  const allDone = doneCount === steps.length;
  const nextKey = steps.find((s) => !s.done)?.key;

  if (allDone) {
    return (
      <Card className="border-emerald-200 bg-emerald-50/60">
        <CardContent className="flex items-center gap-3 py-4 text-emerald-800">
          <Sparkles className="h-5 w-5 shrink-0" />
          <span className="text-sm font-medium">Setup dasar kampus sudah lengkap. Sistem siap dipakai untuk perkuliahan. 🎉</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Sparkles className="h-4 w-4 text-primary" /> Panduan Memulai
          </CardTitle>
          <span className="text-sm font-medium text-muted-foreground">
            {doneCount}/{steps.length} langkah selesai
          </span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
          <div className="h-full rounded-full bg-brand-gradient transition-all" style={{ width: `${pct}%` }} />
        </div>
      </CardHeader>
      <CardContent className="space-y-1">
        {steps.map((s) => {
          const isNext = s.key === nextKey;
          return (
            <div
              key={s.key}
              className={cn(
                'flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors',
                isNext && 'bg-accent',
              )}
            >
              {s.done ? (
                <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-500" />
              ) : (
                <Circle className={cn('h-5 w-5 shrink-0', isNext ? 'text-primary' : 'text-muted-foreground/40')} />
              )}
              <div className="min-w-0 flex-1">
                <p className={cn('text-sm font-medium', s.done && 'text-muted-foreground line-through')}>{s.label}</p>
                <p className="text-xs text-muted-foreground">{s.desc}</p>
              </div>
              {!s.done && (
                <Button
                  variant={isNext ? 'default' : 'outline'}
                  size="sm"
                  className="shrink-0"
                  onClick={() => navigate(s.path)}
                >
                  Isi <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
