import { useState } from 'react';
import ResourcePage from '../../components/crud/ResourcePage';
import { useOptions } from '../../hooks/useList';
import { Badge, inputClass } from '../../components/ui';
import type { AdmissionWave } from '../../types';

interface ExamQuestion {
  id: string;
  admission_wave_id: string;
  question: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_option: string;
  points: number;
}

interface ExamAttempt {
  id: string;
  started_at: string;
  submitted_at: string | null;
  duration_minutes: number;
  total_questions: number;
  correct_count: number;
  score: number | null;
  status: string;
  applicant?: { registration_number: string; name: string; status: string };
}

// Bank soal CBT per gelombang PMB.
export function QuestionsPage() {
  const waves = useOptions<AdmissionWave>('/admission/waves', (w) => `${w.name} (${w.entry_year})`);
  const [waveId, setWaveId] = useState('');

  return (
    <ResourcePage<ExamQuestion>
      title="Bank Soal Ujian Masuk"
      endpoint="/admission/questions"
      extraParams={waveId ? { admission_wave_id: waveId } : undefined}
      headerActions={() => (
        <select
          className={`${inputClass} w-auto min-w-[12rem]`}
          value={waveId}
          onChange={(e) => setWaveId(e.target.value)}
        >
          <option value="">Semua gelombang</option>
          {waves.map((w) => (
            <option key={w.value} value={w.value}>{w.label}</option>
          ))}
        </select>
      )}
      columns={[
        { key: 'question', label: 'Soal', render: (q) => <span className="line-clamp-2 max-w-md">{q.question}</span> },
        { key: 'correct_option', label: 'Kunci', render: (q) => <b>{q.correct_option}</b> },
        { key: 'points', label: 'Poin', sortable: true },
      ]}
        fields={[
          { name: 'admission_wave_id', label: 'Gelombang', type: 'select', options: waves, required: true },
          { name: 'question', label: 'Pertanyaan', type: 'textarea', required: true },
          { name: 'option_a', label: 'Pilihan A', type: 'text', required: true },
          { name: 'option_b', label: 'Pilihan B', type: 'text', required: true },
          { name: 'option_c', label: 'Pilihan C', type: 'text' },
          { name: 'option_d', label: 'Pilihan D', type: 'text' },
          {
            name: 'correct_option',
            label: 'Kunci Jawaban',
            type: 'select',
            required: true,
            options: ['A', 'B', 'C', 'D'].map((o) => ({ value: o, label: o })),
          },
          { name: 'points', label: 'Poin', type: 'number' },
        ]}
        toForm={(q) => ({
          admission_wave_id: q.admission_wave_id,
          question: q.question,
          option_a: q.option_a,
          option_b: q.option_b,
          option_c: q.option_c,
          option_d: q.option_d,
          correct_option: q.correct_option,
          points: q.points,
        })}
      />
  );
}

// Monitoring hasil pengerjaan CBT.
export function AttemptsPage() {
  return (
    <ResourcePage<ExamAttempt>
      title="Hasil Ujian Online (CBT)"
      endpoint="/admission/attempts"
      canCreate={false}
      canEdit={false}
      canDelete={false}
      columns={[
        { key: 'applicant', label: 'Pendaftar', render: (a) => (a.applicant ? `${a.applicant.registration_number} — ${a.applicant.name}` : '-') },
        { key: 'progress', label: 'Benar', render: (a) => `${a.correct_count}/${a.total_questions}` },
        { key: 'score', label: 'Nilai', render: (a) => (a.score != null ? <b>{a.score.toFixed(0)}</b> : '-') },
        { key: 'status', label: 'Status Ujian', render: (a) => <Badge value={a.status} /> },
        { key: 'result', label: 'Kelulusan', render: (a) => (a.applicant ? <Badge value={a.applicant.status} /> : '-') },
      ]}
      fields={[]}
    />
  );
}
