import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { BarChart3, Star } from 'lucide-react';
import ResourcePage from '../components/crud/ResourcePage';
import { useOptions } from '../hooks/useList';
import api from '../lib/axios';
import { createResource, errorMessage } from '../api/crud';
import { Badge, Button, EmptyState, Field, Modal, inputClass } from '../components/ui';
import type {
  AcademicYear,
  ApiResponse,
  EvaluationPeriod,
  EvaluationQuestion,
  LecturerEvalRecap,
  Schedule,
} from '../types';

// Admin: kelola butir pertanyaan EDOM.
export function EvaluationQuestionsPage() {
  return (
    <ResourcePage<EvaluationQuestion>
      title="Pertanyaan EDOM"
      endpoint="/evaluation/questions"
      columns={[
        { key: 'order_no', label: 'No' },
        { key: 'text', label: 'Pertanyaan' },
        { key: 'is_active', label: 'Status', render: (q) => <Badge value={q.is_active ? 'aktif' : 'keluar'} /> },
      ]}
      fields={[
        { name: 'text', label: 'Teks Pertanyaan', type: 'textarea', required: true },
        { name: 'order_no', label: 'Urutan', type: 'number' },
        { name: 'is_active', label: 'Aktif', type: 'checkbox' },
      ]}
      toForm={(q) => ({ text: q.text, order_no: q.order_no, is_active: q.is_active })}
    />
  );
}

// Admin: kelola periode EDOM + lihat rekap per dosen.
export function EvaluationPeriodsPage() {
  const years = useOptions<AcademicYear>('/master/academic-years', (y) => `${y.name} ${y.semester}`);
  const [recap, setRecap] = useState<EvaluationPeriod | null>(null);

  return (
    <>
      <ResourcePage<EvaluationPeriod>
        title="Periode EDOM"
        endpoint="/evaluation/periods"
        columns={[
          { key: 'name', label: 'Nama Periode' },
          { key: 'academic_year', label: 'Tahun Akademik', render: (p) => (p.academic_year ? `${p.academic_year.name} ${p.academic_year.semester}` : '-') },
          { key: 'is_open', label: 'Status', render: (p) => <Badge value={p.is_open ? 'berjalan' : 'selesai'} /> },
        ]}
        fields={[
          { name: 'name', label: 'Nama Periode (cth: EDOM Ganjil 2026/2027)', type: 'text', required: true },
          { name: 'academic_year_id', label: 'Tahun Akademik', type: 'select', options: years, required: true },
          { name: 'is_open', label: 'Buka pengisian EDOM', type: 'checkbox' },
        ]}
        toForm={(p) => ({ name: p.name, academic_year_id: p.academic_year_id, is_open: p.is_open })}
        rowActions={(p) => (
          <button onClick={() => setRecap(p)} className="rounded p-1.5 text-primary-600 hover:bg-primary-50" title="Rekap">
            <BarChart3 size={15} />
          </button>
        )}
      />
      {recap && <RecapModal period={recap} onClose={() => setRecap(null)} />}
    </>
  );
}

function RecapModal({ period, onClose }: { period: EvaluationPeriod; onClose: () => void }) {
  const [rows, setRows] = useState<LecturerEvalRecap[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void api
      .get<ApiResponse<LecturerEvalRecap[]>>('/evaluation/recap', { params: { period_id: period.id } })
      .then((res) => setRows(res.data.data ?? []))
      .catch(() => setRows([]))
      .finally(() => setLoading(false));
  }, [period.id]);

  return (
    <Modal open title={`Rekap EDOM — ${period.name}`} onClose={onClose} wide>
      {loading ? (
        <div className="py-8 text-center text-sm text-slate-400">Memuat...</div>
      ) : rows.length === 0 ? (
        <EmptyState message="Belum ada data evaluasi" />
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-xs uppercase text-slate-500">
              <th className="py-2">Dosen</th>
              <th>Responden</th>
              <th>Rata-rata (1–5)</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.lecturer_id} className="border-b last:border-0">
                <td className="py-2">{r.lecturer_name}</td>
                <td>{r.respondents}</td>
                <td className="font-semibold text-primary-600">{r.average_score.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </Modal>
  );
}

// Mahasiswa: isi EDOM untuk mata kuliah yang belum dinilai pada periode terbuka.
export function MyEvaluationPage() {
  const [periods, setPeriods] = useState<EvaluationPeriod[]>([]);
  const [periodId, setPeriodId] = useState('');
  const [questions, setQuestions] = useState<EvaluationQuestion[]>([]);
  const [pending, setPending] = useState<Schedule[]>([]);
  const [target, setTarget] = useState<Schedule | null>(null);

  const loadPending = (pid: string) => {
    if (!pid) {
      setPending([]);
      return;
    }
    void api
      .get<ApiResponse<Schedule[]>>('/evaluation/pending', { params: { period_id: pid } })
      .then((res) => setPending(res.data.data ?? []))
      .catch(() => setPending([]));
  };

  useEffect(() => {
    void api.get<ApiResponse<EvaluationPeriod[]>>('/evaluation/periods').then((res) => {
      const open = (res.data.data ?? []).filter((p) => p.is_open);
      setPeriods(open);
      if (open[0]) setPeriodId(open[0].id);
    });
    void api
      .get<ApiResponse<EvaluationQuestion[]>>('/evaluation/questions', { params: { active: 'true' } })
      .then((res) => setQuestions(res.data.data ?? []));
  }, []);

  useEffect(() => loadPending(periodId), [periodId]);

  return (
    <div>
      <h1 className="mb-4 text-xl font-semibold">Evaluasi Dosen (EDOM)</h1>

      {periods.length === 0 ? (
        <EmptyState message="Belum ada periode EDOM yang dibuka" />
      ) : (
        <>
          <div className="mb-4 max-w-sm">
            <Field label="Periode EDOM">
              <select className={inputClass} value={periodId} onChange={(e) => setPeriodId(e.target.value)}>
                {periods.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </Field>
          </div>

          {pending.length === 0 ? (
            <EmptyState message="Semua mata kuliah sudah dievaluasi. Terima kasih!" />
          ) : (
            <div className="space-y-2">
              {pending.map((s) => (
                <div key={s.id} className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4">
                  <div>
                    <div className="font-medium">{s.course?.name ?? 'Mata Kuliah'}</div>
                    <div className="text-xs text-slate-400">{s.lecturer?.name ?? '-'}</div>
                  </div>
                  <Button onClick={() => setTarget(s)}>Isi Evaluasi</Button>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {target && (
        <FillModal
          schedule={target}
          periodId={periodId}
          questions={questions}
          onClose={() => setTarget(null)}
          onDone={() => {
            setTarget(null);
            loadPending(periodId);
          }}
        />
      )}
    </div>
  );
}

function FillModal({
  schedule,
  periodId,
  questions,
  onClose,
  onDone,
}: {
  schedule: Schedule;
  periodId: string;
  questions: EvaluationQuestion[];
  onClose: () => void;
  onDone: () => void;
}) {
  const [scores, setScores] = useState<Record<string, number>>({});
  const [comment, setComment] = useState('');
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    const answers = questions.map((q) => ({ question_id: q.id, score: scores[q.id] ?? 0 }));
    if (answers.some((a) => a.score < 1)) {
      toast.error('Beri nilai semua pertanyaan');
      return;
    }
    setSaving(true);
    try {
      await createResource('/evaluation/submit', {
        period_id: periodId,
        schedule_id: schedule.id,
        comment,
        answers,
      });
      toast.success('Evaluasi tersimpan');
      onDone();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open title={`EDOM — ${schedule.course?.name ?? ''}`} onClose={onClose} wide>
      <div className="space-y-3">
        <p className="text-sm text-slate-500">Dosen: {schedule.lecturer?.name ?? '-'} · Skala 1 (kurang) – 5 (sangat baik)</p>
        {questions.map((q) => (
          <div key={q.id} className="rounded-lg border border-slate-200 p-3">
            <div className="mb-2 text-sm">{q.text}</div>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  onClick={() => setScores((prev) => ({ ...prev, [q.id]: n }))}
                  className={`flex h-9 w-9 items-center justify-center rounded-lg border text-sm font-medium ${
                    (scores[q.id] ?? 0) >= n ? 'border-amber-400 bg-amber-50 text-amber-600' : 'border-slate-200 text-slate-400'
                  }`}
                >
                  <Star size={15} fill={(scores[q.id] ?? 0) >= n ? 'currentColor' : 'none'} />
                </button>
              ))}
            </div>
          </div>
        ))}
        <Field label="Komentar / Saran (opsional)">
          <textarea className={inputClass} rows={2} value={comment} onChange={(e) => setComment(e.target.value)} />
        </Field>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="secondary" onClick={onClose}>Batal</Button>
          <Button disabled={saving} onClick={() => void submit()}>
            {saving ? 'Menyimpan...' : 'Kirim Evaluasi'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
