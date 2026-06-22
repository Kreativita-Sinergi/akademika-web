import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Clock } from 'lucide-react';
import { Button } from '../../components/ui';
import { PublicShell, pub, publicError } from './PublicRegisterPage';
import type { ApiResponse } from '../../types';

interface PublicQuestion {
  id: string;
  question: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
}

interface StartExam {
  attempt_id: string;
  applicant_name: string;
  wave_name: string;
  duration_minutes: number;
  remaining_seconds: number;
  questions: PublicQuestion[];
  answers: Record<string, string>;
}

interface ExamResult {
  score: number;
  correct_count: number;
  total_count: number;
  passed: boolean;
}

// Halaman ujian online (CBT): timer countdown, jawaban auto-save per pilihan,
// submit → nilai & kelulusan langsung keluar.
export default function ExamPage() {
  const navigate = useNavigate();
  const [exam, setExam] = useState<StartExam | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [remaining, setRemaining] = useState(0);
  const [result, setResult] = useState<ExamResult | null>(null);
  const [error, setError] = useState('');
  const submittingRef = useRef(false);

  const submit = useCallback(async (attemptId: string) => {
    if (submittingRef.current) return;
    submittingRef.current = true;
    try {
      const res = await pub.post<ApiResponse<ExamResult>>('/public/exam/submit', { attempt_id: attemptId });
      setResult(res.data.data);
    } catch (err) {
      toast.error(publicError(err));
      submittingRef.current = false;
    }
  }, []);

  // Mulai/resume ujian dari identitas yang disimpan halaman cek status.
  useEffect(() => {
    const raw = sessionStorage.getItem('akademika-exam-identity');
    if (!raw) {
      setError('Sesi tidak ditemukan — silakan mulai dari halaman Cek Status.');
      return;
    }
    const identity = JSON.parse(raw) as { campusCode: string; registration_number: string; birth_date: string };
    void pub
      .post<ApiResponse<StartExam>>(`/public/campuses/${identity.campusCode}/exam/start`, {
        registration_number: identity.registration_number,
        birth_date: identity.birth_date,
      })
      .then((res) => {
        const data = res.data.data;
        setExam(data);
        setAnswers(data.answers ?? {});
        setRemaining(data.remaining_seconds);
      })
      .catch((err) => setError(publicError(err)));
  }, []);

  // Timer countdown; auto-submit saat habis.
  useEffect(() => {
    if (!exam || result) return;
    const interval = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          void submit(exam.attempt_id);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [exam, result, submit]);

  const choose = async (questionId: string, option: string) => {
    if (!exam || result) return;
    setAnswers((prev) => ({ ...prev, [questionId]: option }));
    try {
      await pub.post('/public/exam/answer', {
        attempt_id: exam.attempt_id,
        question_id: questionId,
        selected_option: option,
      });
    } catch (err) {
      toast.error(publicError(err));
    }
  };

  const fmtTime = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  if (error) {
    return (
      <PublicShell title="Ujian Online">
        <p className="mb-4 text-center text-sm text-red-600">{error}</p>
        <Button variant="secondary" className="w-full" onClick={() => navigate(-1)}>
          Kembali
        </Button>
      </PublicShell>
    );
  }

  if (result) {
    return (
      <PublicShell title="Hasil Ujian">
        <div className={`mb-4 rounded-xl p-6 text-center ${result.passed ? 'bg-emerald-50' : 'bg-red-50'}`}>
          <div className="text-sm text-slate-500">Nilai Anda</div>
          <div className="text-5xl font-bold">{result.score.toFixed(0)}</div>
          <div className="mt-1 text-sm text-slate-500">
            Benar {result.correct_count} dari {result.total_count} soal
          </div>
          <div className={`mt-3 text-lg font-semibold ${result.passed ? 'text-emerald-600' : 'text-red-600'}`}>
            {result.passed ? 'Selamat, Anda LULUS! 🎉' : 'Mohon maaf, Anda belum lulus'}
          </div>
        </div>
        {result.passed && (
          <p className="mb-4 text-center text-sm text-slate-500">
            Langkah berikutnya: <b>daftar ulang</b> di kampus untuk penetapan UKT dan kelengkapan berkas.
          </p>
        )}
        <Button className="w-full" onClick={() => navigate(-1)}>
          Selesai
        </Button>
      </PublicShell>
    );
  }

  if (!exam) {
    return <PublicShell title="Ujian Online">Menyiapkan soal...</PublicShell>;
  }

  const answered = Object.keys(answers).length;

  return (
    <div className="min-h-screen bg-slate-100 pb-24">
      {/* Header sticky: identitas + timer */}
      <div className="sticky top-0 z-10 border-b border-slate-200 bg-white px-4 py-3 shadow-sm">
        <div className="mx-auto flex max-w-2xl items-center justify-between">
          <div>
            <div className="font-semibold">{exam.applicant_name}</div>
            <div className="text-xs text-slate-500">
              {exam.wave_name} · terjawab {answered}/{exam.questions.length}
            </div>
          </div>
          <div className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-mono text-lg font-bold ${remaining < 300 ? 'bg-red-100 text-red-700' : 'bg-primary-50 text-primary-700'}`}>
            <Clock size={18} />
            {fmtTime(remaining)}
          </div>
        </div>
      </div>

      {/* Soal */}
      <div className="mx-auto max-w-2xl space-y-4 p-4">
        {exam.questions.map((q, i) => (
          <div key={q.id} className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="mb-3 font-medium">
              {i + 1}. {q.question}
            </div>
            <div className="space-y-2">
              {(
                [
                  ['A', q.option_a],
                  ['B', q.option_b],
                  ['C', q.option_c],
                  ['D', q.option_d],
                ] as const
              )
                .filter(([, text]) => text)
                .map(([opt, text]) => (
                  <button
                    key={opt}
                    onClick={() => void choose(q.id, opt)}
                    className={`flex w-full items-center gap-3 rounded-lg border px-3 py-2.5 text-left text-sm transition ${
                      answers[q.id] === opt
                        ? 'border-primary-500 bg-primary-50 font-medium text-primary-700'
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${answers[q.id] === opt ? 'bg-primary-600 text-white' : 'bg-slate-100'}`}>
                      {opt}
                    </span>
                    {text}
                  </button>
                ))}
            </div>
          </div>
        ))}
      </div>

      {/* Footer submit */}
      <div className="fixed inset-x-0 bottom-0 border-t border-slate-200 bg-white p-4">
        <div className="mx-auto max-w-2xl">
          <Button
            className="w-full"
            onClick={() => {
              if (answered < exam.questions.length && !confirm(`Masih ada ${exam.questions.length - answered} soal belum dijawab. Kumpulkan sekarang?`)) {
                return;
              }
              void submit(exam.attempt_id);
            }}
          >
            Kumpulkan Ujian
          </Button>
        </div>
      </div>
    </div>
  );
}
