import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { createResource, errorMessage, getResource } from '../api/crud';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

type Applicant = { id: string; name: string; parent_name: string; entry_grade: number; status: string };
type Attempt = { score: number; passed: boolean };
type Question = { id: string; prompt: string; option_a: string; option_b: string; option_c: string; option_d: string };
type Profile = { school: { name: string; education_level: string }; applicant: Applicant; attempt: Attempt | null };
const statusText: Record<string, string> = { PENDING: 'Menunggu verifikasi pendaftaran', EXAM: 'Ujian masuk dibuka', ACCEPTED: 'Diterima, menunggu daftar ulang', REJECTED: 'Belum diterima', ENROLLED: 'Sudah menjadi siswa' };

export default function SchoolApplicantPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const load = useCallback(async () => {
    try {
      const data = await getResource<Profile>('/school/admissions/me');
      setProfile(data);
      setQuestions(data.applicant.status === 'EXAM' && !data.attempt ? await getResource<Question[]>('/school/admissions/exam') : []);
    } catch (error) { toast.error(errorMessage(error)); }
  }, []);
  useEffect(() => { void load(); }, [load]);
  const submit = async () => {
    if (questions.some((q) => !answers[q.id])) { toast.error('Semua soal wajib dijawab'); return; }
    setSaving(true);
    try {
      const attempt = await createResource<Attempt>('/school/admissions/exam/submit', { answers });
      toast.success(`Ujian selesai. Nilai ${attempt.score}`); await load();
    } catch (error) { toast.error(errorMessage(error)); }
    finally { setSaving(false); }
  };
  if (!profile) return <p className="p-5">Memuat pendaftaran...</p>;
  const { applicant, school, attempt } = profile;
  return <div className="space-y-5 max-w-3xl"><div><p className="text-sm font-semibold text-primary">PPDB {school.education_level} · {school.name}</p><h1 className="text-2xl font-bold">Pendaftaran {applicant.name}</h1></div>
    <Card><CardContent className="p-5 space-y-2"><p className="font-semibold">{statusText[applicant.status] ?? applicant.status}</p><p className="text-sm text-muted-foreground">Nomor pendaftaran: {applicant.id} · Masuk kelas {applicant.entry_grade}</p><p className="text-sm text-muted-foreground">Orang tua/wali: {applicant.parent_name}</p>{attempt && <p className="font-semibold">Hasil ujian: {attempt.score}/100 · {attempt.passed ? 'Lulus' : 'Belum lulus'}</p>}{applicant.status === 'ACCEPTED' && <p className="text-sm">Hubungi admin sekolah untuk penempatan kelas. Akun ini akan menjadi akun siswa setelah daftar ulang.</p>}</CardContent></Card>
    {applicant.status === 'EXAM' && !attempt && <div className="space-y-3"><h2 className="text-lg font-semibold">Ujian Masuk</h2>{questions.length === 0 && <p className="text-sm text-muted-foreground">Soal belum tersedia. Silakan hubungi sekolah.</p>}{questions.map((q, index) => <Card key={q.id}><CardContent className="p-5 space-y-3"><p className="font-semibold">{index + 1}. {q.prompt}</p>{(['A','B','C','D'] as const).map((option) => <label key={option} className="flex gap-2 items-center text-sm"><input type="radio" name={q.id} checked={answers[q.id] === option} onChange={() => setAnswers((a) => ({ ...a, [q.id]: option }))} /><span>{option}. {q[`option_${option.toLowerCase()}` as keyof Question]}</span></label>)}</CardContent></Card>)}{questions.length > 0 && <Button disabled={saving} onClick={() => void submit()}>{saving ? 'Mengirim...' : 'Kirim jawaban ujian'}</Button>}</div>}
  </div>;
}
