import { useEffect, useState } from 'react';
import { Card, Timeline, Flex, Typography } from 'antd';
import { CalendarDays } from 'lucide-react';
import ResourcePage from '../components/crud/ResourcePage';
import { useOptions } from '../hooks/useList';
import api from '../lib/axios';
import { Badge, EmptyState, formatDate } from '../components/ui';
import type { AcademicEvent, AcademicYear, ApiResponse } from '../types';

const categoryOptions = [
  { value: 'registrasi', label: 'Registrasi / KRS' },
  { value: 'perkuliahan', label: 'Perkuliahan' },
  { value: 'ujian', label: 'Ujian (UTS/UAS)' },
  { value: 'libur', label: 'Libur / Cuti' },
  { value: 'wisuda', label: 'Yudisium / Wisuda' },
  { value: 'lainnya', label: 'Lainnya' },
];

const categoryLabel: Record<string, string> = Object.fromEntries(
  categoryOptions.map((o) => [o.value, o.label]),
);

const toIso = (v: unknown) => (v ? new Date(String(v)).toISOString() : undefined);

// Admin: kelola agenda kalender akademik kampus.
export function AcademicCalendarPage() {
  const years = useOptions<AcademicYear>('/master/academic-years', (y) => `${y.name} ${y.semester}`);
  return (
    <ResourcePage<AcademicEvent>
      title="Kalender Akademik"
      endpoint="/academic-calendar"
      columns={[
        { key: 'title', label: 'Agenda' },
        { key: 'category', label: 'Kategori', render: (e) => <Badge value={categoryLabel[e.category] ?? e.category} /> },
        { key: 'start_date', label: 'Mulai', render: (e) => formatDate(e.start_date) },
        { key: 'end_date', label: 'Selesai', render: (e) => formatDate(e.end_date) },
        { key: 'academic_year', label: 'Tahun Akademik', render: (e) => e.academic_year?.name ?? '-' },
      ]}
      fields={[
        { name: 'title', label: 'Judul Agenda', type: 'text', required: true },
        { name: 'category', label: 'Kategori', type: 'select', options: categoryOptions, required: true },
        { name: 'academic_year_id', label: 'Tahun Akademik (opsional)', type: 'select', options: years },
        { name: 'start_date', label: 'Tanggal Mulai', type: 'date', required: true },
        { name: 'end_date', label: 'Tanggal Selesai', type: 'date', required: true },
        { name: 'description', label: 'Keterangan', type: 'textarea' },
        { name: 'is_holiday', label: 'Hari libur', type: 'checkbox' },
      ]}
      toForm={(e) => ({
        title: e.title,
        category: e.category,
        academic_year_id: e.academic_year_id ?? '',
        start_date: e.start_date?.slice(0, 10) ?? '',
        end_date: e.end_date?.slice(0, 10) ?? '',
        description: e.description,
        is_holiday: e.is_holiday,
      })}
      toPayload={(form) => ({
        ...form,
        academic_year_id: form.academic_year_id || null,
        start_date: toIso(form.start_date),
        end_date: toIso(form.end_date),
      })}
    />
  );
}

// Dosen & mahasiswa: tampilan kalender akademik (read-only, agenda mendatang).
export function AcademicCalendarViewPage() {
  const [items, setItems] = useState<AcademicEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void api
      .get<ApiResponse<AcademicEvent[]>>('/academic-calendar/upcoming')
      .then((res) => setItems(res.data.data ?? []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <Typography.Title level={4} style={{ marginTop: 0 }}>
        <CalendarDays size={20} className="mr-2 inline text-primary-600" /> Kalender Akademik
      </Typography.Title>
      {!loading && items.length === 0 && <EmptyState message="Belum ada agenda mendatang" />}
      <Card>
        <Timeline
          items={items.map((e) => ({
            color: e.is_holiday ? 'red' : 'blue',
            children: (
              <div>
                <Flex align="center" gap={8} wrap>
                  <span className="font-semibold">{e.title}</span>
                  <Badge value={categoryLabel[e.category] ?? e.category} />
                </Flex>
                <div className="text-xs text-slate-400">
                  {formatDate(e.start_date)}
                  {e.end_date && e.end_date.slice(0, 10) !== e.start_date.slice(0, 10) ? ` — ${formatDate(e.end_date)}` : ''}
                </div>
                {e.description && <div className="mt-1 whitespace-pre-line text-sm text-slate-600">{e.description}</div>}
              </div>
            ),
          }))}
        />
      </Card>
    </div>
  );
}
