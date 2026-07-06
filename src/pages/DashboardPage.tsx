import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Contact, BookOpen, CalendarDays, UserCheck, FileText, Banknote, UserPlus, ScrollText, Megaphone, ClipboardCheck, ChevronRight } from 'lucide-react';
import { getResource } from '../api/crud';
import { Badge } from '../components/ui';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loading } from '../components/atoms/Loading';
import OnboardingChecklist from '../components/organisms/OnboardingChecklist';
import type { DashboardSummary } from '../types';
import type { ReactNode } from 'react';

const quickActions = [
  { label: 'Tambah Mahasiswa', to: '/students', icon: <UserPlus className="h-5 w-5" />, color: 'bg-blue-100 text-blue-600' },
  { label: 'Tambah Dosen', to: '/lecturers', icon: <Contact className="h-5 w-5" />, color: 'bg-indigo-100 text-indigo-600' },
  { label: 'Susun Jadwal', to: '/schedules', icon: <CalendarDays className="h-5 w-5" />, color: 'bg-cyan-100 text-cyan-600' },
  { label: 'Input Nilai', to: '/grades', icon: <ScrollText className="h-5 w-5" />, color: 'bg-violet-100 text-violet-600' },
  { label: 'Persetujuan KRS', to: '/krs', icon: <ClipboardCheck className="h-5 w-5" />, color: 'bg-emerald-100 text-emerald-600' },
  { label: 'Buat Pengumuman', to: '/announcements', icon: <Megaphone className="h-5 w-5" />, color: 'bg-amber-100 text-amber-600' },
];

function StatCard({ label, value, icon, color }: { label: string; value: number; icon: ReactNode; color: string }) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-5">
        <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${color}`}>{icon}</div>
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="text-2xl font-bold tracking-tight">{value.toLocaleString('id-ID')}</p>
        </div>
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardSummary | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    void getResource<DashboardSummary>('/dashboard').then(setData);
  }, []);

  if (!data) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loading size="lg" />
      </div>
    );
  }

  const stats = [
    { label: 'Total Mahasiswa', value: data.total_students, icon: <Users className="h-6 w-6 text-blue-600" />, color: 'bg-blue-100' },
    { label: 'Mahasiswa Aktif', value: data.active_students, icon: <UserCheck className="h-6 w-6 text-emerald-600" />, color: 'bg-emerald-100' },
    { label: 'Dosen', value: data.total_lecturers, icon: <Contact className="h-6 w-6 text-indigo-600" />, color: 'bg-indigo-100' },
    { label: 'Program Studi', value: data.total_programs, icon: <BookOpen className="h-6 w-6 text-violet-600" />, color: 'bg-violet-100' },
    { label: 'Pendaftar PMB', value: data.total_applicants, icon: <FileText className="h-6 w-6 text-amber-600" />, color: 'bg-amber-100' },
    { label: 'Jadwal Hari Ini', value: data.today_schedules, icon: <CalendarDays className="h-6 w-6 text-cyan-600" />, color: 'bg-cyan-100' },
  ];

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-bold tracking-tight">Dashboard</h1>

      <OnboardingChecklist />

      {/* Pintasan cepat */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {quickActions.map((a) => (
          <button
            key={a.to}
            onClick={() => navigate(a.to)}
            className="group flex flex-col items-start gap-2 rounded-2xl border border-border/70 bg-card p-4 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md"
          >
            <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${a.color}`}>{a.icon}</span>
            <span className="flex items-center gap-1 text-sm font-semibold leading-tight">
              {a.label}
              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
            </span>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
        {stats.map((s) => (
          <StatCard key={s.label} {...s} />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Mahasiswa per Status</CardTitle>
          </CardHeader>
          <CardContent>
            {Object.keys(data.students_by_status ?? {}).length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">Belum ada data mahasiswa</p>
            ) : (
              <div className="space-y-2.5">
                {Object.entries(data.students_by_status ?? {}).map(([status, count]) => (
                  <div key={status} className="flex items-center justify-between">
                    <Badge value={status} />
                    <span className="font-medium">{count.toLocaleString('id-ID')}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Perlu Perhatian</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between rounded-lg bg-amber-50 px-3 py-2.5 text-amber-700">
              <span className="flex items-center gap-2 text-sm"><FileText className="h-4 w-4" /> Pendaftar belum diproses</span>
              <b>{data.pending_applicants}</b>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-red-50 px-3 py-2.5 text-red-700">
              <span className="flex items-center gap-2 text-sm"><Banknote className="h-4 w-4" /> Tagihan UKT belum lunas</span>
              <b>{data.unpaid_invoices}</b>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
