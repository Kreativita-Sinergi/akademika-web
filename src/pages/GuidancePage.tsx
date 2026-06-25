import { useEffect, useState } from 'react';
import { Users } from 'lucide-react';
import ResourcePage from '../components/crud/ResourcePage';
import { useOptions } from '../hooks/useList';
import api from '../lib/axios';
import { Badge, EmptyState, formatDate } from '../components/ui';
import { useAuthStore } from '../store/auth';
import type { ApiResponse, Guidance, Student } from '../types';

const typeOptions = [
  { value: 'akademik', label: 'Akademik' },
  { value: 'konseling', label: 'Konseling' },
  { value: 'lainnya', label: 'Lainnya' },
];

// Catatan bimbingan akademik (dosen wali / PA). Dipakai admin & dosen.
export default function GuidancePage() {
  const role = useAuthStore((s) => s.user?.role);
  const students = useOptions<Student>('/students', (s) => `${s.nim} — ${s.name}`);

  return (
    <div className="space-y-6">
      {role === 'LECTURER' && <AdviseesPanel />}

      <ResourcePage<Guidance>
        title="Catatan Bimbingan"
        endpoint="/guidances"
        canEdit
        canDelete
        columns={[
          { key: 'date', label: 'Tanggal', render: (g) => formatDate(g.date) },
          { key: 'student', label: 'Mahasiswa', render: (g) => g.student?.name ?? '-' },
          { key: 'lecturer', label: 'Dosen Wali', render: (g) => g.lecturer?.name ?? '-' },
          { key: 'type', label: 'Jenis', render: (g) => <Badge value={g.type === 'akademik' ? 'bimbingan' : g.type} /> },
          { key: 'topic', label: 'Topik' },
        ]}
        fields={[
          { name: 'student_id', label: 'Mahasiswa Wali', type: 'select', options: students, required: true },
          { name: 'date', label: 'Tanggal Bimbingan', type: 'date' },
          { name: 'type', label: 'Jenis', type: 'select', options: typeOptions, required: true },
          { name: 'topic', label: 'Topik / Permasalahan', type: 'text', required: true },
          { name: 'note', label: 'Catatan', type: 'textarea' },
          { name: 'follow_up', label: 'Rencana Tindak Lanjut', type: 'textarea' },
        ]}
        toForm={(g) => ({
          student_id: g.student_id,
          date: g.date?.slice(0, 10) ?? '',
          type: g.type,
          topic: g.topic,
          note: g.note,
          follow_up: g.follow_up,
        })}
        toPayload={(form) => ({
          ...form,
          date: form.date ? new Date(String(form.date)).toISOString() : undefined,
        })}
      />
    </div>
  );
}

// Panel daftar mahasiswa wali bagi dosen yang login.
function AdviseesPanel() {
  const [items, setItems] = useState<Student[]>([]);

  useEffect(() => {
    void api
      .get<ApiResponse<Student[]>>('/guidances/my-advisees')
      .then((res) => setItems(res.data.data ?? []))
      .catch(() => setItems([]));
  }, []);

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <h2 className="mb-3 flex items-center gap-2 font-semibold">
        <Users size={18} className="text-primary" /> Mahasiswa Wali Saya ({items.length})
      </h2>
      {items.length === 0 ? (
        <EmptyState message="Belum ada mahasiswa wali yang ditugaskan" />
      ) : (
        <div className="flex flex-wrap gap-2">
          {items.map((s) => (
            <span key={s.id} className="rounded-lg border border-border px-3 py-1.5 text-sm">
              <span className="font-medium">{s.name}</span>{' '}
              <span className="text-muted-foreground">{s.nim} · Smt {s.current_semester}</span>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
