import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { ExternalLink, FileText, Upload } from 'lucide-react';
import api from '../lib/axios';
import { createResource, errorMessage } from '../api/crud';
import { uploadFile } from '../api/upload';
import { Badge, Button, EmptyState, Field, Modal, inputClass, formatDate } from '../components/ui';
import type { ApiResponse, Assignment, AssignmentSubmission, CourseMaterial } from '../types';

// Mahasiswa: materi & tugas kelasnya + pengumpulan tugas.
export default function MyElearningPage() {
  const [tab, setTab] = useState<'materi' | 'tugas'>('materi');
  const [materials, setMaterials] = useState<CourseMaterial[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [subs, setSubs] = useState<Record<string, AssignmentSubmission>>({});
  const [target, setTarget] = useState<Assignment | null>(null);

  const loadSubs = () => {
    void api.get<ApiResponse<AssignmentSubmission[]>>('/elearning/my-submissions').then((res) => {
      const map: Record<string, AssignmentSubmission> = {};
      (res.data.data ?? []).forEach((s) => (map[s.assignment_id] = s));
      setSubs(map);
    });
  };

  useEffect(() => {
    void api
      .get<ApiResponse<CourseMaterial[]>>('/elearning/my-materials')
      .then((res) => setMaterials(res.data.data ?? []))
      .catch(() => setMaterials([]));
    void api
      .get<ApiResponse<Assignment[]>>('/elearning/my-assignments')
      .then((res) => setAssignments(res.data.data ?? []))
      .catch(() => setAssignments([]));
    loadSubs();
  }, []);

  return (
    <div>
      <h1 className="mb-4 text-xl font-bold tracking-tight">E-Learning</h1>

      <div className="mb-4 flex gap-1 rounded-lg border border-border bg-card p-1 text-sm">
        {(['materi', 'tugas'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 rounded-md px-3 py-1.5 font-medium capitalize transition ${
              tab === t ? 'bg-primary text-white' : 'text-muted-foreground hover:bg-muted'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 'materi' && (
        <div className="space-y-3">
          {materials.length === 0 && <EmptyState message="Belum ada materi" />}
          {materials.map((m) => (
            <div key={m.id} className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-center justify-between">
                <h2 className="flex items-center gap-1.5 font-semibold">
                  <FileText size={16} className="text-primary" /> {m.title}
                </h2>
                <span className="text-xs text-muted-foreground">{m.schedule?.course?.name}</span>
              </div>
              {m.description && <p className="mt-1 text-sm text-muted-foreground">{m.description}</p>}
              {(m.file_url || m.link_url) && (
                <a
                  href={m.file_url || m.link_url}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-2 inline-flex items-center gap-1 text-sm text-primary"
                >
                  <ExternalLink size={14} /> Buka materi
                </a>
              )}
            </div>
          ))}
        </div>
      )}

      {tab === 'tugas' && (
        <div className="space-y-3">
          {assignments.length === 0 && <EmptyState message="Belum ada tugas" />}
          {assignments.map((a) => {
            const sub = subs[a.id];
            return (
              <div key={a.id} className="rounded-xl border border-border bg-card p-4">
                <div className="flex items-center justify-between gap-2">
                  <h2 className="font-semibold">{a.title}</h2>
                  {sub ? (
                    <Badge value={sub.score != null ? 'dinilai' : 'selesai'} />
                  ) : (
                    <Badge value="diajukan" />
                  )}
                </div>
                <div className="mt-0.5 text-xs text-muted-foreground">
                  {a.schedule?.course?.name} · Batas: {formatDate(a.due_date)}
                </div>
                {a.description && <p className="mt-1 text-sm text-muted-foreground">{a.description}</p>}
                {a.file_url && (
                  <a href={a.file_url} target="_blank" rel="noreferrer" className="mt-1 inline-flex items-center gap-1 text-sm text-primary">
                    <ExternalLink size={13} /> Lampiran soal
                  </a>
                )}
                <div className="mt-2 flex items-center gap-3">
                  <Button variant="secondary" onClick={() => setTarget(a)}>
                    <span className="flex items-center gap-1.5">
                      <Upload size={14} /> {sub ? 'Perbarui Kumpul' : 'Kumpulkan'}
                    </span>
                  </Button>
                  {sub?.score != null && (
                    <span className="text-sm">
                      Nilai: <span className="font-bold text-primary">{sub.score}</span>
                      {sub.feedback && <span className="text-muted-foreground"> — {sub.feedback}</span>}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {target && (
        <SubmitModal
          assignment={target}
          existing={subs[target.id]}
          onClose={() => setTarget(null)}
          onDone={() => {
            setTarget(null);
            loadSubs();
          }}
        />
      )}
    </div>
  );
}

function SubmitModal({
  assignment,
  existing,
  onClose,
  onDone,
}: {
  assignment: Assignment;
  existing?: AssignmentSubmission;
  onClose: () => void;
  onDone: () => void;
}) {
  const [fileUrl, setFileUrl] = useState(existing?.file_url ?? '');
  const [linkUrl, setLinkUrl] = useState(existing?.link_url ?? '');
  const [note, setNote] = useState(existing?.note ?? '');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleUpload = async (file: File) => {
    setUploading(true);
    try {
      const url = await uploadFile(file, 'elearning');
      setFileUrl(url);
      toast.success('File terunggah');
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setUploading(false);
    }
  };

  const submit = async () => {
    if (!fileUrl && !linkUrl) {
      toast.error('Lampirkan file atau tautan');
      return;
    }
    setSaving(true);
    try {
      await createResource(`/elearning/assignments/${assignment.id}/submit`, {
        file_url: fileUrl,
        link_url: linkUrl,
        note,
      });
      toast.success('Tugas terkumpul');
      onDone();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open title={`Kumpulkan — ${assignment.title}`} onClose={onClose}>
      <div className="space-y-3">
        <Field label="Unggah File Tugas">
          <input
            type="file"
            className="block w-full text-sm text-muted-foreground file:mr-3 file:rounded-lg file:border-0 file:bg-primary/5 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-primary"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void handleUpload(file);
            }}
          />
          {uploading && <span className="text-xs text-muted-foreground">Mengunggah...</span>}
          {fileUrl && !uploading && (
            <a href={fileUrl} target="_blank" rel="noreferrer" className="mt-1 block truncate text-xs text-primary underline">
              File terunggah
            </a>
          )}
        </Field>
        <Field label="Atau Tautan (Google Drive, dll)">
          <input className={inputClass} value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} />
        </Field>
        <Field label="Catatan (opsional)">
          <textarea className={inputClass} rows={2} value={note} onChange={(e) => setNote(e.target.value)} />
        </Field>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="secondary" onClick={onClose}>Batal</Button>
          <Button disabled={saving} onClick={() => void submit()}>
            {saving ? 'Mengirim...' : 'Kumpulkan'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
