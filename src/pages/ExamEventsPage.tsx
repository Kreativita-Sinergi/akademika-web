import { useEffect, useState } from 'react';
import { Download } from 'lucide-react';
import ResourcePage from '../components/crud/ResourcePage';
import { useOptions } from '../hooks/useList';
import api from '../lib/axios';
import { downloadFile } from '../api/download';
import { Badge, Button, EmptyState, Field, inputClass, formatDate } from '../components/ui';
import { DataTable } from '@/components/ui/data-table';
import type { AcademicYear, ApiResponse, CourseExam, Room, Schedule } from '../types';

function scheduleLabel(s: Schedule): string {
  return `${s.course?.name ?? 'MK'} — ${s.class_group?.code ?? ''}`;
}

const examTypeOptions = [
  { value: 'uts', label: 'UTS' },
  { value: 'uas', label: 'UAS' },
];

// Admin: jadwal ujian semester (UTS/UAS).
export function ExamEventsPage() {
  const years = useOptions<AcademicYear>('/master/academic-years', (y) => `${y.name} ${y.semester}`);
  const schedules = useOptions<Schedule>('/schedules', scheduleLabel);
  const rooms = useOptions<Room>('/master/rooms', (r) => r.name);

  return (
    <ResourcePage<CourseExam>
      title="Jadwal Ujian (UTS/UAS)"
      endpoint="/exam-events"
      columns={[
        { key: 'exam_type', label: 'Jenis', render: (e) => <Badge value={e.exam_type === 'uts' ? 'seminar' : 'sidang'} /> },
        { key: 'schedule', label: 'Mata Kuliah', render: (e) => (e.schedule ? scheduleLabel(e.schedule) : '-') },
        { key: 'date', label: 'Tanggal', render: (e) => formatDate(e.date) },
        { key: 'time', label: 'Waktu', render: (e) => `${e.start_time || '-'}–${e.end_time || '-'}` },
        { key: 'room', label: 'Ruang', render: (e) => e.room?.name ?? '-' },
        { key: 'proctor_name', label: 'Pengawas' },
      ]}
      fields={[
        { name: 'academic_year_id', label: 'Tahun Akademik', type: 'select', options: years, required: true },
        { name: 'exam_type', label: 'Jenis Ujian', type: 'select', options: examTypeOptions, required: true },
        { name: 'schedule_id', label: 'Mata Kuliah / Jadwal', type: 'select', options: schedules, required: true },
        { name: 'date', label: 'Tanggal Ujian', type: 'date' },
        { name: 'start_time', label: 'Jam Mulai', type: 'time' },
        { name: 'end_time', label: 'Jam Selesai', type: 'time' },
        { name: 'room_id', label: 'Ruang Ujian', type: 'select', options: rooms },
        { name: 'proctor_name', label: 'Pengawas', type: 'text' },
      ]}
      toForm={(e) => ({
        academic_year_id: e.academic_year_id,
        exam_type: e.exam_type,
        schedule_id: e.schedule_id,
        date: e.date?.slice(0, 10) ?? '',
        start_time: e.start_time,
        end_time: e.end_time,
        room_id: e.room_id ?? '',
        proctor_name: e.proctor_name,
      })}
      toPayload={(form) => ({
        ...form,
        room_id: form.room_id || null,
        date: form.date ? new Date(String(form.date)).toISOString() : undefined,
      })}
    />
  );
}

// Mahasiswa: kartu ujian semester (lihat & unduh PDF).
export function MyExamCardPage() {
  const years = useOptions<AcademicYear>('/master/academic-years', (y) => `${y.name} ${y.semester}`);
  const [yearId, setYearId] = useState('');
  const [examType, setExamType] = useState('uas');
  const [items, setItems] = useState<CourseExam[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!yearId) {
      setItems([]);
      setLoaded(false);
      return;
    }
    void api
      .get<ApiResponse<CourseExam[]>>('/exam-events/my', { params: { academic_year_id: yearId, exam_type: examType } })
      .then((res) => setItems(res.data.data ?? []))
      .catch(() => setItems([]))
      .finally(() => setLoaded(true));
  }, [yearId, examType]);

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <h1 className="text-xl font-bold tracking-tight">Kartu Ujian</h1>
        <Button
          variant="secondary"
          disabled={items.length === 0}
          onClick={() => void downloadFile('/exam-events/my-card/pdf', `kartu-ujian-${examType}.pdf`, { academic_year_id: yearId, exam_type: examType })}
        >
          <span className="flex items-center gap-1.5">
            <Download size={15} /> Unduh Kartu (PDF)
          </span>
        </Button>
      </div>

      <div className="mb-4 grid max-w-xl gap-3 sm:grid-cols-2">
        <Field label="Tahun Akademik">
          <select className={inputClass} value={yearId} onChange={(e) => setYearId(e.target.value)}>
            <option value="">— pilih —</option>
            {years.map((y) => (
              <option key={y.value} value={y.value}>{y.label}</option>
            ))}
          </select>
        </Field>
        <Field label="Jenis Ujian">
          <select className={inputClass} value={examType} onChange={(e) => setExamType(e.target.value)}>
            {examTypeOptions.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </Field>
      </div>

      {!loaded ? (
        <EmptyState message="Pilih tahun akademik & jenis ujian" />
      ) : (
        <DataTable<CourseExam>
          columns={[
            { title: 'Mata Kuliah', key: 'course', render: (_, e) => e.schedule?.course?.name ?? '-' },
            { title: 'Tanggal', key: 'date', render: (_, e) => formatDate(e.date) },
            { title: 'Waktu', key: 'time', render: (_, e) => `${e.start_time}–${e.end_time}` },
            { title: 'Ruang', key: 'room', render: (_, e) => e.room?.name ?? '-' },
          ]}
          rowKey={(e) => e.id}
          data={items}
          emptyText="Belum ada jadwal ujian"
        />
      )}
    </div>
  );
}
