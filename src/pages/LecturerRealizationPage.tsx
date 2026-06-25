import { useEffect, useState } from 'react';
import { Activity } from 'lucide-react';
import { useOptions } from '../hooks/useList';
import { getResource } from '../api/crud';
import { dayNames, inputClass } from '../components/ui';
import { DataTable, type Column } from '@/components/ui/data-table';
import type { AcademicYear, LecturerRecapRow } from '../types';

function Bar({ value, danger }: { value: number; danger?: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <div className="h-2 w-24 overflow-hidden rounded-full bg-muted">
        <div
          className={`h-2 rounded-full ${danger && value < 75 ? 'bg-amber-500' : 'bg-primary'}`}
          style={{ width: `${Math.min(100, value)}%` }}
        />
      </div>
      <span className="text-xs font-medium text-muted-foreground">{value.toFixed(0)}%</span>
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

  const columns: Column<LecturerRecapRow>[] = [
    { title: 'Mata Kuliah', key: 'course', className: 'font-medium', render: (_, r) => r.schedule.course?.name ?? '-' },
    { title: 'Dosen', key: 'lecturer', render: (_, r) => r.schedule.lecturer?.name ?? '-' },
    {
      title: 'Kelas / Jadwal',
      key: 'class',
      render: (_, r) => (
        <span className="text-muted-foreground">
          {r.schedule.class_group?.code ?? '-'} · {dayNames[r.schedule.day_of_week]} {r.schedule.start_time}
        </span>
      ),
    },
    { title: 'Pertemuan', key: 'meet', render: (_, r) => `${r.meetings_held}/${r.target_meetings}` },
    { title: 'Realisasi (/16)', key: 'real', render: (_, r) => <Bar value={r.realization_pct} danger /> },
    { title: 'Kehadiran Dosen', key: 'pres', render: (_, r) => <Bar value={r.presence_pct} /> },
  ];

  return (
    <div>
      <h1 className="mb-4 flex items-center gap-2 text-xl font-bold tracking-tight">
        <Activity size={20} className="text-primary" /> Realisasi Perkuliahan & Kehadiran Dosen
      </h1>

      <div className="mb-4 max-w-xs">
        <select className={inputClass} value={yearId} onChange={(e) => setYearId(e.target.value)}>
          <option value="">Semua tahun akademik</option>
          {years.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      <DataTable<LecturerRecapRow>
        columns={columns}
        rowKey={(r) => r.schedule.id}
        data={rows}
        loading={loading}
        emptyText="Belum ada jadwal/realisasi"
      />
    </div>
  );
}
