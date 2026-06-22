import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { ClipboardCheck, ExternalLink } from 'lucide-react';
import ResourcePage from '../components/crud/ResourcePage';
import { useOptions } from '../hooks/useList';
import api from '../lib/axios';
import { patchResource, errorMessage } from '../api/crud';
import { Button, EmptyState, Field, Modal, inputClass, formatDate } from '../components/ui';
import type { ApiResponse, Assignment, AssignmentSubmission, CourseMaterial, Schedule } from '../types';

function scheduleLabel(s: Schedule): string {
  return `${s.course?.name ?? 'Mata Kuliah'} — ${s.class_group?.code ?? ''}`;
}

function useScheduleOptions() {
  return useOptions<Schedule>('/schedules', scheduleLabel);
}

// Dosen/Admin: materi/bahan ajar per jadwal kuliah.
export function MaterialsPage() {
  const schedules = useScheduleOptions();
  return (
    <ResourcePage<CourseMaterial>
      title="Materi Kuliah"
      endpoint="/elearning/materials"
      columns={[
        { key: 'title', label: 'Judul' },
        { key: 'schedule', label: 'Mata Kuliah', render: (m) => (m.schedule ? scheduleLabel(m.schedule) : '-') },
        {
          key: 'file_url',
          label: 'Lampiran',
          render: (m) =>
            m.file_url || m.link_url ? (
              <a href={m.file_url || m.link_url} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-primary-600">
                <ExternalLink size={13} /> Buka
              </a>
            ) : (
              '-'
            ),
        },
        { key: 'created_at', label: 'Tanggal', render: (m) => formatDate(m.created_at) },
      ]}
      fields={[
        { name: 'schedule_id', label: 'Mata Kuliah / Jadwal', type: 'select', options: schedules, required: true },
        { name: 'title', label: 'Judul Materi', type: 'text', required: true },
        { name: 'description', label: 'Deskripsi', type: 'textarea' },
        { name: 'file_url', label: 'File Materi (PDF/PPT/dll)', type: 'file', folder: 'elearning' },
        { name: 'link_url', label: 'Atau Tautan Eksternal (mis. YouTube)', type: 'text' },
      ]}
      toForm={(m) => ({
        schedule_id: m.schedule_id,
        title: m.title,
        description: m.description,
        file_url: m.file_url,
        link_url: m.link_url,
      })}
    />
  );
}

// Dosen/Admin: tugas per jadwal + penilaian pengumpulan.
export function AssignmentsPage() {
  const schedules = useScheduleOptions();
  const [target, setTarget] = useState<Assignment | null>(null);

  return (
    <>
      <ResourcePage<Assignment>
        title="Tugas"
        endpoint="/elearning/assignments"
        columns={[
          { key: 'title', label: 'Judul' },
          { key: 'schedule', label: 'Mata Kuliah', render: (a) => (a.schedule ? scheduleLabel(a.schedule) : '-') },
          { key: 'due_date', label: 'Batas Waktu', render: (a) => formatDate(a.due_date) },
        ]}
        fields={[
          { name: 'schedule_id', label: 'Mata Kuliah / Jadwal', type: 'select', options: schedules, required: true },
          { name: 'title', label: 'Judul Tugas', type: 'text', required: true },
          { name: 'description', label: 'Instruksi', type: 'textarea' },
          { name: 'file_url', label: 'Lampiran Soal (opsional)', type: 'file', folder: 'elearning' },
          { name: 'due_date', label: 'Batas Waktu', type: 'date' },
        ]}
        toForm={(a) => ({
          schedule_id: a.schedule_id,
          title: a.title,
          description: a.description,
          file_url: a.file_url,
          due_date: a.due_date?.slice(0, 10) ?? '',
        })}
        toPayload={(form) => ({
          ...form,
          due_date: form.due_date ? new Date(String(form.due_date)).toISOString() : undefined,
        })}
        rowActions={(a) => (
          <button
            onClick={() => setTarget(a)}
            className="rounded p-1.5 text-primary-600 hover:bg-primary-50"
            title="Lihat & nilai pengumpulan"
          >
            <ClipboardCheck size={15} />
          </button>
        )}
      />

      {target && <SubmissionsModal assignment={target} onClose={() => setTarget(null)} />}
    </>
  );
}

function SubmissionsModal({ assignment, onClose }: { assignment: Assignment; onClose: () => void }) {
  const [subs, setSubs] = useState<AssignmentSubmission[]>([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    void api
      .get<ApiResponse<AssignmentSubmission[]>>(`/elearning/assignments/${assignment.id}/submissions`)
      .then((res) => setSubs(res.data.data ?? []))
      .catch(() => setSubs([]))
      .finally(() => setLoading(false));
  };

  useEffect(load, [assignment.id]);

  const grade = async (sub: AssignmentSubmission, score: string, feedback: string) => {
    const value = Number(score);
    if (Number.isNaN(value) || value < 0 || value > 100) {
      toast.error('Nilai harus 0–100');
      return;
    }
    try {
      await patchResource(`/elearning/submissions/${sub.id}/grade`, { score: value, feedback });
      toast.success('Nilai tersimpan');
      load();
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };

  return (
    <Modal open title={`Pengumpulan — ${assignment.title}`} onClose={onClose} wide>
      {loading ? (
        <div className="py-8 text-center text-sm text-slate-400">Memuat...</div>
      ) : subs.length === 0 ? (
        <EmptyState message="Belum ada mahasiswa yang mengumpulkan" />
      ) : (
        <div className="space-y-2">
          {subs.map((s) => (
            <SubmissionRow key={s.id} sub={s} onGrade={grade} />
          ))}
        </div>
      )}
    </Modal>
  );
}

function SubmissionRow({
  sub,
  onGrade,
}: {
  sub: AssignmentSubmission;
  onGrade: (sub: AssignmentSubmission, score: string, feedback: string) => void;
}) {
  const [score, setScore] = useState(sub.score != null ? String(sub.score) : '');
  const [feedback, setFeedback] = useState(sub.feedback || '');

  return (
    <div className="rounded-lg border border-slate-200 p-3">
      <div className="mb-2 flex items-center justify-between">
        <div>
          <div className="font-medium">{sub.student?.name ?? '-'}</div>
          <div className="text-xs text-slate-400">
            {sub.student?.nim} · dikumpulkan {formatDate(sub.submitted_at)}
          </div>
        </div>
        {(sub.file_url || sub.link_url) && (
          <a
            href={sub.file_url || sub.link_url}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1 text-sm text-primary-600"
          >
            <ExternalLink size={14} /> Buka tugas
          </a>
        )}
      </div>
      {sub.note && <p className="mb-2 text-sm text-slate-500">{sub.note}</p>}
      <div className="flex items-end gap-2">
        <div className="w-24">
          <Field label="Nilai">
            <input className={inputClass} value={score} onChange={(e) => setScore(e.target.value)} placeholder="0-100" />
          </Field>
        </div>
        <div className="flex-1">
          <Field label="Umpan Balik">
            <input className={inputClass} value={feedback} onChange={(e) => setFeedback(e.target.value)} />
          </Field>
        </div>
        <Button onClick={() => onGrade(sub, score, feedback)}>Simpan</Button>
      </div>
    </div>
  );
}
