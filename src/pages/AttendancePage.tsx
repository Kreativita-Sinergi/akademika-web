import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { ClipboardCheck, Plus, QrCode, Trash2 } from 'lucide-react';
import api from '../lib/axios';
import { createResource, deleteResource, errorMessage, getResource, listResource, patchResource } from '../api/crud';
import { useAuthStore } from '../store/auth';
import { Badge, Button, EmptyState, Field, Modal, dayNames, formatDate } from '../components/ui';
import { DataTable, type Column } from '@/components/ui/data-table';
import { Segmented } from '@/components/ui/segmented';
import { Combobox } from '@/components/ui/combobox';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import type { ApiResponse, Schedule, Student } from '../types';

interface Session {
  id: string;
  meeting_number: number;
  date: string;
  topic: string;
  is_closed: boolean;
  lecturer_present: boolean;
  lecturer_status: string;
  qr_token: string;
  qr_active: boolean;
}

interface SessionStudent {
  student: Student;
  status: string;
  note: string;
}

interface RecapRow {
  student: Student;
  total_sessions: number;
  present: number;
  permit: number;
  sick: number;
  absent: number;
  percentage: number;
}

const statuses = ['hadir', 'izin', 'sakit', 'alpa'] as const;

// Presensi kuliah: dosen memilih jadwalnya → kelola pertemuan (berita acara)
// → tandai kehadiran per mahasiswa → lihat rekap persentase.
export default function AttendancePage() {
  const role = useAuthStore((s) => s.user?.role);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [scheduleId, setScheduleId] = useState('');
  const [sessions, setSessions] = useState<Session[]>([]);
  const [view, setView] = useState<'sessions' | 'recap'>('sessions');
  const [recap, setRecap] = useState<RecapRow[]>([]);

  const [createOpen, setCreateOpen] = useState(false);
  const [topic, setTopic] = useState('');

  const [detail, setDetail] = useState<{ session: Session; students: SessionStudent[] } | null>(null);
  const [marks, setMarks] = useState<Record<string, string>>({});
  const [qrSession, setQrSession] = useState<Session | null>(null);

  const toggleQr = async (session: Session, active: boolean) => {
    try {
      const updated = await patchResource<Session>(`/attendance/sessions/${session.id}/qr`, { active });
      setQrSession(updated);
      void loadSessions();
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };

  // Dosen melihat jadwal mengajarnya sendiri; admin melihat semua jadwal.
  useEffect(() => {
    if (role === 'LECTURER') {
      void getResource<Schedule[]>('/schedules/my').then((items) => setSchedules(items ?? []));
    } else {
      void listResource<Schedule>('/schedules', { limit: 100 }).then((res) => setSchedules(res.data ?? []));
    }
  }, [role]);

  const loadSessions = useCallback(async () => {
    if (!scheduleId) return;
    const items = await getResource<Session[]>(`/attendance/sessions?schedule_id=${scheduleId}`);
    setSessions(items ?? []);
  }, [scheduleId]);

  useEffect(() => {
    void loadSessions();
  }, [loadSessions]);

  useEffect(() => {
    if (view === 'recap' && scheduleId) {
      void getResource<RecapRow[]>(`/attendance/recap?schedule_id=${scheduleId}`).then((rows) => setRecap(rows ?? []));
    }
  }, [view, scheduleId, sessions.length]);

  const createSession = async () => {
    try {
      await createResource('/attendance/sessions', { schedule_id: scheduleId, topic });
      toast.success('Pertemuan dibuat');
      setCreateOpen(false);
      setTopic('');
      void loadSessions();
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };

  const openDetail = async (session: Session) => {
    const res = await api.get<ApiResponse<{ session: Session; students: SessionStudent[] }>>(`/attendance/sessions/${session.id}`);
    const data = res.data.data;
    setDetail(data);
    const initial: Record<string, string> = {};
    data.students.forEach((row) => {
      initial[row.student.id] = row.status || 'hadir';
    });
    setMarks(initial);
  };

  const saveMarks = async () => {
    if (!detail) return;
    try {
      await createResource(`/attendance/sessions/${detail.session.id}/mark`, {
        records: Object.entries(marks).map(([student_id, status]) => ({ student_id, status })),
      });
      toast.success('Presensi tersimpan');
      setDetail(null);
      void loadSessions();
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };

  const removeSession = async (session: Session) => {
    if (!confirm(`Hapus pertemuan ke-${session.meeting_number}?`)) return;
    try {
      await deleteResource(`/attendance/sessions/${session.id}`);
      toast.success('Pertemuan dihapus');
      void loadSessions();
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };

  const selected = schedules.find((s) => s.id === scheduleId);

  const sessionColumns: Column<Session>[] = [
    { title: 'Ke-', key: 'no', className: 'font-medium', dataIndex: 'meeting_number', width: 60 },
    { title: 'Tanggal', key: 'date', render: (_, s) => formatDate(s.date) },
    { title: 'Materi / Berita Acara', key: 'topic', render: (_, s) => s.topic },
    {
      title: 'Dosen',
      key: 'lec',
      render: (_, s) => (
        <span>
          <Badge value={s.lecturer_present ? 'lunas' : 'menunggu'} />
          <span className="ml-1 text-xs capitalize text-muted-foreground">{s.lecturer_status?.replace('_', ' ')}</span>
        </span>
      ),
    },
    {
      title: 'Aksi',
      key: 'act',
      align: 'right',
      render: (_, s) => (
        <div className="flex justify-end gap-1">
          <Button variant="ghost" size="icon" className={cn('h-8 w-8', s.qr_active ? 'text-emerald-600' : 'text-muted-foreground')} title="Presensi QR mandiri" onClick={() => setQrSession(s)}>
            <QrCode className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-primary hover:text-primary" title="Isi presensi" onClick={() => void openDetail(s)}>
            <ClipboardCheck className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" title="Hapus" onClick={() => void removeSession(s)}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  const recapColumns: Column<RecapRow>[] = [
    { title: 'NIM', key: 'nim', render: (_, r) => r.student.nim },
    { title: 'Nama', key: 'name', render: (_, r) => r.student.name },
    { title: 'Hadir', key: 'present', render: (_, r) => `${r.present}/${r.total_sessions}` },
    { title: 'Izin', key: 'permit', dataIndex: 'permit' },
    { title: 'Sakit', key: 'sick', dataIndex: 'sick' },
    { title: 'Alpa', key: 'absent', dataIndex: 'absent' },
    {
      title: 'Kehadiran',
      key: 'pct',
      render: (_, r) => (
        <span className={cn('font-semibold', r.percentage >= 75 ? 'text-emerald-600' : 'text-red-600')}>
          {r.percentage.toFixed(0)}%
        </span>
      ),
    },
  ];

  return (
    <div>
      <h1 className="mb-4 text-xl font-bold tracking-tight">Presensi Kuliah</h1>

      <div className="mb-4 max-w-xl">
        <Field label="Pilih Jadwal / Mata Kuliah">
          <Combobox
            options={schedules.map((s) => ({
              value: s.id,
              label: `${s.course?.name ?? 'MK'} · ${s.class_group?.code ?? ''} · ${dayNames[s.day_of_week]} ${s.start_time}`,
            }))}
            value={scheduleId}
            onChange={setScheduleId}
            allowClear
            placeholder="— pilih —"
          />
        </Field>
      </div>

      {scheduleId && (
        <>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <Segmented
              value={view}
              onChange={setView}
              options={[
                { value: 'sessions', label: 'Pertemuan' },
                { value: 'recap', label: 'Rekap Kehadiran' },
              ]}
            />
            <Button onClick={() => setCreateOpen(true)}>
              <span className="flex items-center gap-1"><Plus size={15} /> Pertemuan Baru</span>
            </Button>
          </div>

          {view === 'sessions' && (
            <DataTable<Session> columns={sessionColumns} rowKey={(s) => s.id} data={sessions} emptyText="Belum ada pertemuan — klik Pertemuan Baru" />
          )}

          {view === 'recap' && (
            <DataTable<RecapRow> columns={recapColumns} rowKey={(r) => r.student.id} data={recap} emptyText="Belum ada data kehadiran" />
          )}
        </>
      )}

      {/* Modal pertemuan baru */}
      <Modal open={createOpen} title={`Pertemuan Baru — ${selected?.course?.name ?? ''}`} onClose={() => setCreateOpen(false)}>
        <div className="space-y-3">
          <Field label="Materi / Berita Acara">
            <Textarea rows={3} value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="cth: Pengenalan OOP — class, object, method" />
          </Field>
          <p className="text-xs text-muted-foreground">Nomor pertemuan & tanggal terisi otomatis (hari ini).</p>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setCreateOpen(false)}>Batal</Button>
            <Button disabled={!topic} onClick={() => void createSession()}>Buat</Button>
          </div>
        </div>
      </Modal>

      {/* Modal isi presensi */}
      <Modal
        open={detail !== null}
        title={`Presensi Pertemuan ${detail?.session.meeting_number ?? ''} — ${detail?.session.topic ?? ''}`}
        onClose={() => setDetail(null)}
        wide
      >
        <div className="max-h-[55vh] space-y-2 overflow-y-auto">
          {detail?.students.map((row) => (
            <div key={row.student.id} className="flex items-center justify-between rounded-lg border border-border px-3 py-2">
              <div>
                <div className="text-sm font-medium">{row.student.name}</div>
                <div className="text-xs text-muted-foreground">{row.student.nim}</div>
              </div>
              <div className="flex gap-1">
                {statuses.map((status) => (
                  <button
                    key={status}
                    onClick={() => setMarks({ ...marks, [row.student.id]: status })}
                    className={cn(
                      'rounded-md px-2.5 py-1 text-xs font-medium capitalize transition',
                      marks[row.student.id] === status
                        ? status === 'hadir'
                          ? 'bg-emerald-600 text-white'
                          : status === 'alpa'
                            ? 'bg-red-600 text-white'
                            : 'bg-amber-500 text-white'
                        : 'bg-muted text-muted-foreground hover:bg-muted/80',
                    )}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>
          ))}
          {detail?.students.length === 0 && <EmptyState message="Tidak ada mahasiswa aktif di rombel ini" />}
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setDetail(null)}>Batal</Button>
          <Button onClick={() => void saveMarks()}>Simpan Presensi</Button>
        </div>
      </Modal>

      {/* Modal QR presensi mandiri */}
      <Modal
        open={qrSession !== null}
        title={`Presensi QR — Pertemuan ${qrSession?.meeting_number ?? ''}`}
        onClose={() => setQrSession(null)}
      >
        {qrSession && (
          <div className="space-y-4 text-center">
            {qrSession.qr_active ? (
              <>
                <p className="text-sm text-muted-foreground">Mahasiswa scan QR ini dari HP untuk presensi mandiri:</p>
                <img
                  alt="QR Presensi"
                  className="mx-auto rounded-lg border border-border"
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(`${window.location.origin}/presensi/${qrSession.qr_token}`)}`}
                />
                <p className="break-all text-xs text-muted-foreground">{window.location.origin}/presensi/{qrSession.qr_token}</p>
                <Button variant="danger" onClick={() => void toggleQr(qrSession, false)}>Tutup Presensi QR</Button>
              </>
            ) : (
              <>
                <QrCode size={64} className="mx-auto text-muted-foreground/40" />
                <p className="text-sm text-muted-foreground">Buka sesi presensi mandiri agar mahasiswa bisa scan QR dan mengisi kehadiran sendiri.</p>
                <Button onClick={() => void toggleQr(qrSession, true)}>Buka Presensi QR</Button>
              </>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
