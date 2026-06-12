import { useEffect, useState } from 'react';
import { Banknote, CalendarDays, Contact, School, UserSquare2, Users } from 'lucide-react';
import { getResource } from '../api/crud';
import { Badge } from '../components/ui';
import type { DashboardSummary } from '../types';
import type { ReactNode } from 'react';

function StatCard({ label, value, icon, accent }: { label: string; value: number; icon: ReactNode; accent: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm text-slate-500">{label}</div>
          <div className="mt-1 text-2xl font-bold">{value.toLocaleString('id-ID')}</div>
        </div>
        <div className={`rounded-lg p-2.5 ${accent}`}>{icon}</div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardSummary | null>(null);

  useEffect(() => {
    void getResource<DashboardSummary>('/dashboard').then(setData);
  }, []);

  if (!data) return <div className="py-12 text-center text-slate-400">Memuat...</div>;

  return (
    <div>
      <h1 className="mb-4 text-xl font-semibold">Dashboard</h1>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard label="Total Mahasiswa" value={data.total_students} icon={<Users size={20} className="text-blue-600" />} accent="bg-blue-50" />
        <StatCard label="Mahasiswa Aktif" value={data.active_students} icon={<Users size={20} className="text-emerald-600" />} accent="bg-emerald-50" />
        <StatCard label="Dosen" value={data.total_lecturers} icon={<Contact size={20} className="text-indigo-600" />} accent="bg-indigo-50" />
        <StatCard label="Program Studi" value={data.total_programs} icon={<School size={20} className="text-violet-600" />} accent="bg-violet-50" />
        <StatCard label="Pendaftar PMB" value={data.total_applicants} icon={<UserSquare2 size={20} className="text-amber-600" />} accent="bg-amber-50" />
        <StatCard label="Jadwal Hari Ini" value={data.today_schedules} icon={<CalendarDays size={20} className="text-cyan-600" />} accent="bg-cyan-50" />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="mb-3 font-semibold">Mahasiswa per Status</h2>
          <div className="space-y-2">
            {Object.entries(data.students_by_status ?? {}).map(([status, count]) => (
              <div key={status} className="flex items-center justify-between text-sm">
                <Badge value={status} />
                <span className="font-medium">{count.toLocaleString('id-ID')}</span>
              </div>
            ))}
            {Object.keys(data.students_by_status ?? {}).length === 0 && (
              <div className="text-sm text-slate-400">Belum ada data mahasiswa</div>
            )}
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="mb-3 font-semibold">Perlu Perhatian</h2>
          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between rounded-lg bg-amber-50 px-3 py-2.5">
              <span className="flex items-center gap-2 text-amber-700">
                <UserSquare2 size={16} /> Pendaftar belum diproses
              </span>
              <span className="font-semibold text-amber-700">{data.pending_applicants}</span>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-red-50 px-3 py-2.5">
              <span className="flex items-center gap-2 text-red-700">
                <Banknote size={16} /> Tagihan UKT belum lunas
              </span>
              <span className="font-semibold text-red-700">{data.unpaid_invoices}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
