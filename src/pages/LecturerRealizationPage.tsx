import { useEffect, useState } from 'react';
import { Activity } from 'lucide-react';
import { useOptions } from '../hooks/useList';
import { getResource } from '../api/crud';
import { EmptyState, dayNames } from '../components/ui';
import type { AcademicYear, LecturerRecapRow } from '../types';

function Bar({ value, danger }: { value: number; danger?: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <div className="h-2 w-24 rounded-full bg-slate-100">
        <div
          className={`h-2 rounded-full ${danger && value < 75 ? 'bg-amber-500' : 'bg-primary-500'}`}
          style={{ width: `${Math.min(100, value)}%` }}
        />
      </div>
      <span className="text-xs font-medium text-slate-600">{value.toFixed(0)}%</span>
    </div>
  );
}

// Monitoring realisasi perkuliahan & kehadiran dosen per jadwal.
// Admin melihat semua jadwal; dosen otomatis hanya jadwalnya sendiri.
export default function LecturerRealizationPage() {
  const years = useOptions<AcademicYear>('/master/academic-years', (y) => `${y.name} ${y.semester}`);
  const [yearId, setYearId] = useState('');
  const [rows, setRows] = useState<LecturerRecapRow[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    const q = yearId ? `?academic_year_id=${yearId}` : '';
    void getResource<LecturerRecapRow[]>(`/attendance/lecturer-recap${q}`)
      .then((r) => setRows(r ?? []))
      .finally(() => setLoading(false));
  }, [yearId]);

  return (
    <div>
      <h1 className="mb-4 flex items-center gap-2 text-xl font-semibold">
        <Activity size={20} className="text-primary-600" /> Realisasi Perkuliahan & Kehadiran Dosen
      </h1>

      <div className="mb-4 max-w-xs">
        <select
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          value={yearId}
          onChange={(e) => setYearId(e.target.value)}
        >
          <option value="">Semua tahun akademik</option>
          {years.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">Mata Kuliah</th>
              <th className="px-4 py-3">Dosen</th>
              <th className="px-4 py-3">Kelas / Jadwal</th>
              <th className="px-4 py-3">Pertemuan</th>
              <th className="px-4 py-3">Realisasi (/16)</th>
              <th className="px-4 py-3">Kehadiran Dosen</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.schedule.id} className="border-t border-slate-100">
                <td className="px-4 py-3 font-medium">{r.schedule.course?.name ?? '-'}</td>
                <td className="px-4 py-3">{r.schedule.lecturer?.name ?? '-'}</td>
                <td className="px-4 py-3 text-slate-500">
                  {r.schedule.class_group?.code ?? '-'} · {dayNames[r.schedule.day_of_week]} {r.schedule.start_time}
                </td>
                <td className="px-4 py-3">{r.meetings_held}/{r.target_meetings}</td>
                <td className="px-4 py-3"><Bar value={r.realization_pct} danger /></td>
                <td className="px-4 py-3"><Bar value={r.presence_pct} /></td>
              </tr>
            ))}
          </tbody>
        </table>
        {!loading && rows.length === 0 && <EmptyState message="Belum ada jadwal/realisasi" />}
      </div>
    </div>
  );
}
