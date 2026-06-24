import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { ClipboardCheck, Plus, QrCode, Trash2 } from 'lucide-react';
import api from '../lib/axios';
import { createResource, deleteResource, errorMessage, getResource, listResource, patchResource } from '../api/crud';
import { useAuthStore } from '../store/auth';
import { Badge, Button, EmptyState, Field, Modal, dayNames, formatDate, inputClass } from '../components/ui';
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

  return (
    <div>
      <h1 className="mb-4 text-xl font-semibold">Presensi Kuliah</h1>

      <div className="mb-4 max-w-xl">
        <Field label="Pilih Jadwal / Mata Kuliah">
          <select className={inputClass} value={scheduleId} onChange={(e) => setScheduleId(e.target.value)}>
            <option value="">— pilih —</option>
            {schedules.map((s) => (
              <option key={s.id} value={s.id}>
                {s.course?.name} · {s.class_group?.code} · {dayNames[s.day_of_week]} {s.start_time}
              </option>
            ))}
          </select>
        </Field>
      </div>

      {scheduleId && (
        <>
          <div className="mb-4 flex items-center justify-between">
            <div className="flex gap-1 rounded-lg border border-slate-200 bg-white p-1">
              {(['sessions', 'recap'] as const).map((v) => (
                <button
                  key={v}
                  onClick={() => setView(v)}
                  className={`rounded-md px-4 py-1.5 text-sm font-medium ${view === v ? 'bg-primary-600 text-white' : 'text-slate-600 hover:bg-slate-50'}`}
                >
                  {v === 'sessions' ? 'Pertemuan' : 'Rekap Kehadiran'}
                </button>
              ))}
            </div>
            <Button onClick={() => setCreateOpen(true)}>
              <span className="flex items-center gap-1"><Plus size={15} /> Pertemuan Baru</span>
            </Button>
          </div>

          {view === 'sessions' && (
            <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-slate-50 text-left text-xs uppercase text-slate-500">
                    <th className="px-4 py-3">Ke-</th>
                    <th className="px-4 py-3">Tanggal</th>
                    <th className="px-4 py-3">Materi / Berita Acara</th>
                    <th className="px-4 py-3">Dosen</th>
                    <th className="px-4 py-3 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {sessions.map((session) => (
                    <tr key={session.id} className="border-b last:border-0 hover:bg-slate-50">
                      <td className="px-4 py-3 font-medium">{session.meeting_number}</td>
                      <td className="px-4 py-3">{formatDate(session.date)}</td>
                      <td className="px-4 py-3">{session.topic}</td>
                      <td className="px-4 py-3">
                        <Badge value={session.lecturer_present ? 'lunas' : 'menunggu'} />
                        <span className="ml-1 text-xs capitalize text-slate-400">{session.lecturer_status?.replace('_', ' ')}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1">
                          <button
                            onClick={() => { setQrSession(session); }}
                            className={`rounded p-1.5 hover:bg-slate-100 ${session.qr_active ? 'text-emerald-600' : 'text-slate-500'}`}
                            title="Presensi QR mandiri"
                          >
                            <QrCode size={15} />
                          </button>
                          <button
                            onClick={() => void openDetail(session)}
                            className="rounded p-1.5 text-primary-600 hover:bg-primary-50"
                            title="Isi presensi"
                          >
                            <ClipboardCheck size={15} />
                          </button>
                          <button
                            onClick={() => void removeSession(session)}
                            className="rounded p-1.5 text-red-500 hover:bg-red-50"
                            title="Hapus"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {sessions.length === 0 && <EmptyState message="Belum ada pertemuan — klik Pertemuan Baru" />}
            </div>
          )}

          {view === 'recap' && (
            <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-slate-50 text-left text-xs uppercase text-slate-500">
                    <th className="px-4 py-3">NIM</th>
                    <th className="px-4 py-3">Nama</th>
                    <th className="px-4 py-3">Hadir</th>
                    <th className="px-4 py-3">Izin</th>
                    <th className="px-4 py-3">Sakit</th>
                    <th className="px-4 py-3">Alpa</th>
                    <th className="px-4 py-3">Kehadiran</th>
                  </tr>
                </thead>
                <tbody>
                  {recap.map((row) => (
                    <tr key={row.student.id} className="border-b last:border-0">
                      <td className="px-4 py-3">{row.student.nim}</td>
                      <td className="px-4 py-3">{row.student.name}</td>
                      <td className="px-4 py-3">{row.present}/{row.total_sessions}</td>
                      <td className="px-4 py-3">{row.permit}</td>
                      <td className="px-4 py-3">{row.sick}</td>
                      <td className="px-4 py-3">{row.absent}</td>
                      <td className="px-4 py-3">
                        <span className={`font-semibold ${row.percentage >= 75 ? 'text-emerald-600' : 'text-red-600'}`}>
                          {row.percentage.toFixed(0)}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {recap.length === 0 && <EmptyState message="Belum ada data kehadiran" />}
            </div>
          )}
        </>
      )}

      {/* Modal pertemuan baru */}
      <Modal open={createOpen} title={`Pertemuan Baru — ${selected?.course?.name ?? ''}`} onClose={() => setCreateOpen(false)}>
        <div className="space-y-3">
          <Field label="Materi / Berita Acara">
            <textarea className={inputClass} rows={3} value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="cth: Pengenalan OOP — class, object, method" />
          </Field>
          <p className="text-xs text-slate-400">Nomor pertemuan & tanggal terisi otomatis (hari ini).</p>
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
            <div key={row.student.id} className="flex items-center justify-between rounded-lg border border-slate-100 px-3 py-2">
              <div>
                <div className="text-sm font-medium">{row.student.name}</div>
                <div className="text-xs text-slate-400">{row.student.nim}</div>
              </div>
              <div className="flex gap-1">
                {statuses.map((status) => (
                  <button
                    key={status}
                    onClick={() => setMarks({ ...marks, [row.student.id]: status })}
                    className={`rounded-md px-2.5 py-1 text-xs font-medium capitalize transition ${
                      marks[row.student.id] === status
                        ? status === 'hadir'
                          ? 'bg-emerald-600 text-white'
                          : status === 'alpa'
                            ? 'bg-red-600 text-white'
                            : 'bg-amber-500 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
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
                <p className="text-sm text-slate-500">Mahasiswa scan QR ini dari HP untuk presensi mandiri:</p>
                <img
                  alt="QR Presensi"
                  className="mx-auto rounded-lg border border-slate-200"
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(`${window.location.origin}/presensi/${qrSession.qr_token}`)}`}
                />
                <p className="break-all text-xs text-slate-400">{window.location.origin}/presensi/{qrSession.qr_token}</p>
                <Button variant="danger" onClick={() => void toggleQr(qrSession, false)}>Tutup Presensi QR</Button>
              </>
            ) : (
              <>
                <QrCode size={64} className="mx-auto text-slate-300" />
                <p className="text-sm text-slate-500">Buka sesi presensi mandiri agar mahasiswa bisa scan QR dan mengisi kehadiran sendiri.</p>
                <Button onClick={() => void toggleQr(qrSession, true)}>Buka Presensi QR</Button>
              </>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
