import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { createResource, errorMessage, getResource, listResource, patchResource, updateResource } from '../api/crud';
import { useAuthStore } from '../store/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import type { Campus } from '../types';

type Class = { id: string; name: string; grade_level: number; major: string; academic_year: string };
type Subject = { id: string; code: string; name: string; teacher_user_id: string | null };
type Person = { id: string; name: string; email: string };
type Pupil = { id: string; user_id: string; class_id: string; nis: string; nisn: string; status: string; graduated_at?: string | null; user?: Person };
type Grade = { id: string; pupil_id: string; subject_id: string; academic_year: string; semester: number; score: number; note: string };
type Attendance = { id: string; pupil_id: string; date: string; status: string; note: string };
type Invoice = { id: string; pupil_id: string; title: string; amount: number; paid_amount: number; due_date: string };
type Applicant = { id: string; user_id: string | null; name: string; parent_name: string; email: string; phone: string; nisn: string; entry_grade: number; status: string };
type ExamQuestion = { id: string; prompt: string; option_a: string; option_b: string; option_c: string; option_d: string };
type ExamAttempt = { id: string; applicant_id: string; score: number; passed: boolean };
type Report = { name: string; class: Class; grades: Grade[]; attendance: Record<string, number> };

const titles: Record<string, string> = { dashboard: 'Dashboard Sekolah', classes: 'Kelas', subjects: 'Mata Pelajaran', teachers: 'Guru', pupils: 'Siswa dan Alumni', grades: 'Nilai Semester', attendance: 'Presensi', invoices: 'Tagihan Sekolah', applicants: 'Pendaftar Baru', exam: 'Ujian Masuk', 'report-card': 'Rapor' };
const Field = ({ label, ...props }: React.ComponentProps<typeof Input> & { label: string }) => <label className="space-y-1 text-sm"><span>{label}</span><Input {...props} /></label>;

export default function SchoolPage({ section: forcedSection }: { section?: string }) {
  const { section: routeSection } = useParams();
  const section = forcedSection ?? routeSection ?? 'dashboard';
  const role = useAuthStore((s) => s.user?.role);
  const selfId = useAuthStore((s) => s.user?.user_id);
  const admin = role === 'SCHOOL_ADMIN';
  const teacher = role === 'TEACHER';
  const [school, setSchool] = useState<Campus | null>(null);
  const [classes, setClasses] = useState<Class[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [teachers, setTeachers] = useState<Person[]>([]);
  const [pupils, setPupils] = useState<Pupil[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [examQuestions, setExamQuestions] = useState<ExamQuestion[]>([]);
  const [examAttempts, setExamAttempts] = useState<ExamAttempt[]>([]);
  const [report, setReport] = useState<Report | null>(null);
  const [enrollingId, setEnrollingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<Record<string, string>>({});
  const set = (key: string, value: string) => setForm((v) => ({ ...v, [key]: value }));
  const load = useCallback(async () => {
    try {
      const [profile, classResult, subjectResult, teacherResult, pupilResult, gradeResult, attendanceResult, invoiceResult, applicantResult, questionResult, attemptResult] = await Promise.all([
        getResource<Campus>('/school/profile'), listResource<Class>('/school/classes'), listResource<Subject>('/school/subjects'),
        listResource<Person>('/school/teachers'), listResource<Pupil>('/school/pupils'), listResource<Grade>('/school/grades'),
        listResource<Attendance>('/school/attendance'),
        role === 'SCHOOL_ADMIN' || role === 'PUPIL' ? listResource<Invoice>('/school/invoices') : Promise.resolve({ data: [] as Invoice[] }),
        role === 'SCHOOL_ADMIN' ? listResource<Applicant>('/school/applicants') : Promise.resolve({ data: [] as Applicant[] }),
        role === 'SCHOOL_ADMIN' ? listResource<ExamQuestion>('/school/exam/questions') : Promise.resolve({ data: [] as ExamQuestion[] }),
        role === 'SCHOOL_ADMIN' ? listResource<ExamAttempt>('/school/exam/attempts') : Promise.resolve({ data: [] as ExamAttempt[] }),
      ]);
      setSchool(profile); setClasses(classResult.data ?? []); setSubjects(subjectResult.data ?? []);
      setTeachers(teacherResult.data ?? []); setPupils(pupilResult.data ?? []); setGrades(gradeResult.data ?? []);
      setAttendance(attendanceResult.data ?? []); setInvoices(invoiceResult.data ?? []); setApplicants(applicantResult.data ?? []);
      setExamQuestions(questionResult.data ?? []); setExamAttempts(attemptResult.data ?? []);
    } catch (error) { toast.error(errorMessage(error)); }
    finally { setLoading(false); }
  }, [role]);
  useEffect(() => { void load(); }, [load]);
  useEffect(() => {
    if (section === 'report-card' && role === 'PUPIL') getResource<Report>('/school/report-card').then(setReport).catch((err) => toast.error(errorMessage(err)));
  }, [section, role]);
  const submit = async (event: React.FormEvent) => {
    event.preventDefault(); setSaving(true);
    try {
      if (section === 'classes') await createResource('/school/classes', { name: form.name, grade_level: Number(form.grade_level), major: form.major || '', academic_year: form.academic_year });
      if (section === 'subjects') await createResource('/school/subjects', { code: form.code, name: form.name, teacher_user_id: form.teacher_user_id || null });
      if (section === 'teachers') await createResource('/school/teachers', form);
      if (section === 'pupils') await createResource('/school/pupils', { ...form, class_id: form.class_id });
      if (section === 'grades') await createResource('/school/grades', { ...form, score: Number(form.score), semester: Number(form.semester) });
      if (section === 'attendance') await createResource('/school/attendance', form);
      if (section === 'invoices') await createResource('/school/invoices', { ...form, amount: Number(form.amount) });
      if (section === 'exam') await createResource('/school/exam/questions', form);
      toast.success('Data tersimpan'); setForm({}); await load();
    } catch (error) { toast.error(errorMessage(error)); }
    finally { setSaving(false); }
  };
  const move = async (pupilId: string, classId: string) => {
    try { await updateResource(`/school/pupils/${pupilId}/class`, { class_id: classId }); toast.success('Kelas siswa diperbarui'); await load(); }
    catch (error) { toast.error(errorMessage(error)); }
  };
  const updateApplicant = async (id: string, status: string) => {
    try { await patchResource(`/school/applicants/${id}`, { status }); toast.success('Status pendaftar diperbarui'); await load(); }
    catch (error) { toast.error(errorMessage(error)); }
  };
  const pay = async (invoice: Invoice) => {
    const amount = invoice.amount - invoice.paid_amount;
    try { await createResource(`/school/invoices/${invoice.id}/pay`, { amount }); toast.success('Pembayaran dicatat'); await load(); }
    catch (error) { toast.error(errorMessage(error)); }
  };
  const showReport = async (id: string) => {
    try { setReport(await getResource<Report>(`/school/report-card?pupil_id=${id}`)); }
    catch (error) { toast.error(errorMessage(error)); }
  };
  const enroll = async (id: string) => {
    try { await createResource(`/school/applicants/${id}/enroll`, { class_id: form.class_id, nis: form.nis }); toast.success('Akun pendaftar menjadi akun siswa. Silakan masuk kembali.'); setForm({}); await load(); }
    catch (error) { toast.error(errorMessage(error)); }
  };
  const graduate = async (id: string) => {
    try { await createResource(`/school/pupils/${id}/graduate`, {}); toast.success('Siswa ditandai tamat'); await load(); }
    catch (error) { toast.error(errorMessage(error)); }
  };
  const select = (label: string, key: string, values: { value: string; label: string }[]) => <label className="space-y-1 text-sm"><span>{label}</span><select required className="w-full rounded-md border bg-background p-2" value={form[key] ?? ''} onChange={(e) => set(key, e.target.value)}><option value="">Pilih {label.toLowerCase()}</option>{values.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label>;
  if (loading) return <p className="p-6">Memuat data sekolah...</p>;
  if (!school) return <p className="p-6">Data sekolah tidak tersedia.</p>;
  const gradeLevels = school.education_level === 'SD' ? [1,2,3,4,5,6] : school.education_level === 'SMP' ? [7,8,9] : [10,11,12];
  const visibleSubjects = teacher ? subjects.filter((x) => x.teacher_user_id === selfId) : subjects;
  const pupilName = (id: string) => pupils.find((x) => x.id === id)?.user?.name ?? id;
  const subjectName = (id: string) => subjects.find((x) => x.id === id)?.name ?? id;
  return <div className="space-y-5">
    <div><p className="text-sm font-semibold text-primary">{school.education_level} · {school.name}</p><h1 className="text-2xl font-bold">{titles[section] ?? 'Sekolah'}</h1></div>
    {role === 'PUPIL' && pupils[0]?.status === 'GRADUATED' && <p className="rounded-lg bg-emerald-50 p-4 text-sm font-semibold text-emerald-800">Status: Alumni · Tamat {pupils[0].graduated_at ? new Date(pupils[0].graduated_at).toLocaleDateString('id-ID') : ''}</p>}
    {section === 'dashboard' && <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{[['Kelas', classes.length, '/school/classes'], ['Mata Pelajaran', subjects.length, '/school/subjects'], ['Guru', teachers.length, '/school/teachers'], ['Siswa', pupils.length, '/school/pupils']].map(([label, count, link]) => <Link key={label} to={String(link)}><Card><CardContent className="p-5"><p className="text-sm text-muted-foreground">{label}</p><p className="text-3xl font-bold">{count}</p></CardContent></Card></Link>)}</div>
      <Card><CardContent className="p-5"><p className="font-semibold">{role === 'PUPIL' ? 'Nilai saya' : 'Pengelolaan akademik'}</p><p className="text-sm text-muted-foreground mt-1">Kelola kelas, mata pelajaran, guru, siswa, nilai, dan presensi.</p><Link className="text-primary text-sm font-semibold" to="/school/grades">Lihat nilai →</Link>{admin && <p className="mt-3 text-sm">Tautan PPDB: <a className="text-primary font-semibold" href={`/sekolah/${school.code}/ppdb`}>{window.location.origin}/sekolah/{school.code}/ppdb</a></p>}</CardContent></Card>
    </>}
    {section === 'classes' && <>
      {admin && <Card><CardContent className="p-5"><form onSubmit={submit} className="grid gap-3 sm:grid-cols-2"><Field label="Nama kelas" required value={form.name ?? ''} onChange={(e) => set('name', e.target.value)} placeholder="7A / X TKJ 1" />{select('Tingkat', 'grade_level', gradeLevels.map((x) => ({ value: String(x), label: `Kelas ${x}` })))}<Field label="Tahun ajaran" required value={form.academic_year ?? ''} onChange={(e) => set('academic_year', e.target.value)} placeholder="2026/2027" />{school.education_level === 'SMK' && <Field label="Kompetensi keahlian" value={form.major ?? ''} onChange={(e) => set('major', e.target.value)} placeholder="Teknik Komputer dan Jaringan" />}<Button disabled={saving}>Tambah kelas</Button></form></CardContent></Card>}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{classes.map((x) => <Card key={x.id}><CardContent className="p-4"><p className="font-semibold">{x.name}</p><p className="text-sm text-muted-foreground">Kelas {x.grade_level} · {x.academic_year}{x.major ? ` · ${x.major}` : ''}</p></CardContent></Card>)}</div>
    </>}
    {section === 'subjects' && <>
      {admin && <Card><CardContent className="p-5"><form onSubmit={submit} className="grid gap-3 sm:grid-cols-2"><Field label="Kode mapel" required value={form.code ?? ''} onChange={(e) => set('code', e.target.value)} /><Field label="Nama mapel" required value={form.name ?? ''} onChange={(e) => set('name', e.target.value)} />{select('Guru pengampu', 'teacher_user_id', teachers.map((x) => ({ value: x.id, label: x.name })))}<Button disabled={saving}>Tambah mapel</Button></form></CardContent></Card>}
      <div className="grid gap-3 sm:grid-cols-2">{subjects.map((x) => <Card key={x.id}><CardContent className="p-4"><p className="font-semibold">{x.name}</p><p className="text-sm text-muted-foreground">{x.code} · {teachers.find((t) => t.id === x.teacher_user_id)?.name ?? 'Belum ada guru'}</p></CardContent></Card>)}</div>
    </>}
    {section === 'teachers' && <>
      {admin && <Card><CardContent className="p-5"><form onSubmit={submit} className="grid gap-3 sm:grid-cols-2"><Field label="Nama guru" required value={form.name ?? ''} onChange={(e) => set('name', e.target.value)} /><Field label="Email" type="email" required value={form.email ?? ''} onChange={(e) => set('email', e.target.value)} /><Field label="Password awal" type="password" minLength={8} required value={form.password ?? ''} onChange={(e) => set('password', e.target.value)} /><Button disabled={saving}>Tambah guru</Button></form></CardContent></Card>}
      <div className="grid gap-3 sm:grid-cols-2">{teachers.map((x) => <Card key={x.id}><CardContent className="p-4"><p className="font-semibold">{x.name}</p><p className="text-sm text-muted-foreground">{x.email}</p></CardContent></Card>)}</div>
    </>}
    {section === 'pupils' && <>
      {admin && <Card><CardContent className="p-5"><form onSubmit={submit} className="grid gap-3 sm:grid-cols-2"><Field label="Nama siswa" required value={form.name ?? ''} onChange={(e) => set('name', e.target.value)} /><Field label="Email" type="email" required value={form.email ?? ''} onChange={(e) => set('email', e.target.value)} /><Field label="Password awal" type="password" minLength={8} required value={form.password ?? ''} onChange={(e) => set('password', e.target.value)} />{select('Kelas', 'class_id', classes.map((x) => ({ value: x.id, label: x.name })))}<Field label="NIS" required value={form.nis ?? ''} onChange={(e) => set('nis', e.target.value)} /><Field label="NISN" value={form.nisn ?? ''} onChange={(e) => set('nisn', e.target.value)} /><Button disabled={saving}>Tambah siswa</Button></form></CardContent></Card>}
      <div className="grid gap-3 sm:grid-cols-2">{pupils.map((x) => <Card key={x.id}><CardContent className="p-4"><p className="font-semibold">{x.user?.name ?? x.nis} · {x.status === 'GRADUATED' ? 'Alumni' : 'Aktif'}</p><p className="text-sm text-muted-foreground">NIS {x.nis}{x.nisn && ` · NISN ${x.nisn}`}</p><p className="text-sm text-muted-foreground">{classes.find((cl) => cl.id === x.class_id)?.name ?? 'Kelas tidak ditemukan'}</p>{admin && x.status !== 'GRADUATED' && <select aria-label={`Pindahkan kelas ${x.user?.name ?? x.nis}`} className="mt-2 w-full rounded-md border bg-background p-2 text-sm" value={x.class_id} onChange={(e) => void move(x.id, e.target.value)}>{classes.map((cl) => <option key={cl.id} value={cl.id}>{cl.name}</option>)}</select>}{admin && x.status !== 'GRADUATED' && classes.find((cl) => cl.id === x.class_id)?.grade_level === Math.max(...gradeLevels) && <Button className="mt-2" size="sm" variant="outline" onClick={() => void graduate(x.id)}>Tandai tamat</Button>}</CardContent></Card>)}</div>
    </>}
    {section === 'grades' && <>
      {(admin || teacher) && <Card><CardContent className="p-5"><form onSubmit={submit} className="grid gap-3 sm:grid-cols-2">{select('Siswa', 'pupil_id', pupils.map((x) => ({ value: x.id, label: `${x.user?.name ?? x.nis} (${x.nis})` })))}{select('Mapel', 'subject_id', visibleSubjects.map((x) => ({ value: x.id, label: x.name })))}<Field label="Tahun ajaran" required value={form.academic_year ?? ''} onChange={(e) => set('academic_year', e.target.value)} placeholder="2026/2027" />{select('Semester', 'semester', [{ value: '1', label: 'Ganjil' }, { value: '2', label: 'Genap' }])}<Field label="Nilai (0–100)" type="number" min="0" max="100" step="0.01" required value={form.score ?? ''} onChange={(e) => set('score', e.target.value)} /><Field label="Catatan" value={form.note ?? ''} onChange={(e) => set('note', e.target.value)} /><Button disabled={saving}>Simpan nilai</Button></form></CardContent></Card>}
      <div className="grid gap-3 sm:grid-cols-2">{grades.map((x) => <Card key={x.id}><CardContent className="p-4"><div className="flex justify-between"><p className="font-semibold">{subjectName(x.subject_id)}</p><p className="text-xl font-bold">{x.score}</p></div><p className="text-sm text-muted-foreground">{pupilName(x.pupil_id)} · {x.academic_year} semester {x.semester}</p>{x.note && <p className="mt-1 text-sm">{x.note}</p>}</CardContent></Card>)}</div>
    </>}
    {section === 'attendance' && <>
      {(admin || teacher) && <Card><CardContent className="p-5"><form onSubmit={submit} className="grid gap-3 sm:grid-cols-2">{select('Siswa', 'pupil_id', pupils.map((x) => ({ value: x.id, label: x.user?.name ?? x.nis })))}<Field label="Tanggal" type="date" required value={form.date ?? ''} onChange={(e) => set('date', e.target.value)} />{select('Kehadiran', 'status', ['HADIR','IZIN','SAKIT','ALPA'].map((x) => ({ value: x, label: x })))}<Field label="Catatan" value={form.note ?? ''} onChange={(e) => set('note', e.target.value)} /><Button disabled={saving}>Simpan presensi</Button></form></CardContent></Card>}
      <div className="grid gap-3 sm:grid-cols-2">{attendance.map((x) => <Card key={x.id}><CardContent className="p-4"><p className="font-semibold">{pupilName(x.pupil_id)} · {x.status}</p><p className="text-sm text-muted-foreground">{x.date}{x.note ? ` · ${x.note}` : ''}</p></CardContent></Card>)}</div>
    </>}
    {section === 'invoices' && <>
      {admin && <Card><CardContent className="p-5"><form onSubmit={submit} className="grid gap-3 sm:grid-cols-2">{select('Siswa', 'pupil_id', pupils.map((x) => ({ value: x.id, label: x.user?.name ?? x.nis })))}<Field label="Nama tagihan" required value={form.title ?? ''} onChange={(e) => set('title', e.target.value)} placeholder="SPP Oktober" /><Field label="Jumlah (Rp)" type="number" min="1" required value={form.amount ?? ''} onChange={(e) => set('amount', e.target.value)} /><Field label="Jatuh tempo" type="date" required value={form.due_date ?? ''} onChange={(e) => set('due_date', e.target.value)} /><Button disabled={saving}>Buat tagihan</Button></form></CardContent></Card>}
      <div className="grid gap-3 sm:grid-cols-2">{invoices.map((x) => <Card key={x.id}><CardContent className="p-4"><p className="font-semibold">{x.title}</p><p className="text-sm text-muted-foreground">{pupilName(x.pupil_id)} · jatuh tempo {x.due_date}</p><p className="text-sm">Rp {x.paid_amount.toLocaleString('id-ID')} / {x.amount.toLocaleString('id-ID')}</p>{admin && x.paid_amount < x.amount && <Button className="mt-2" size="sm" variant="outline" onClick={() => void pay(x)}>Catat pelunasan</Button>}</CardContent></Card>)}</div>
    </>}
    {section === 'applicants' && admin && <>
      <p className="text-sm text-muted-foreground">Bagikan tautan <a className="text-primary" href={`/sekolah/${school.code}/ppdb`}>pendaftaran {school.name}</a> kepada calon siswa.</p>
      <div className="grid gap-3 sm:grid-cols-2">{applicants.map((x) => <Card key={x.id}><CardContent className="p-4 space-y-1"><p className="font-semibold">{x.name} · Kelas {x.entry_grade}</p><p className="text-sm text-muted-foreground">Wali {x.parent_name} · {x.phone}</p><p className="text-sm text-muted-foreground">{x.email}{x.nisn ? ` · NISN ${x.nisn}` : ''}</p><p className="text-sm">Status: {x.status}{examAttempts.find((a) => a.applicant_id === x.id) && ` · Nilai ujian ${examAttempts.find((a) => a.applicant_id === x.id)?.score}`}</p><div className="flex flex-wrap gap-2 items-center">{x.status === 'PENDING' && x.user_id && <Button size="sm" variant="outline" onClick={() => void updateApplicant(x.id, 'EXAM')}>Buka ujian</Button>}{x.status !== 'ACCEPTED' && x.status !== 'ENROLLED' && <Button size="sm" variant="outline" onClick={() => void updateApplicant(x.id, 'ACCEPTED')}>Terima</Button>}{x.status !== 'REJECTED' && x.status !== 'ENROLLED' && <Button size="sm" variant="outline" onClick={() => void updateApplicant(x.id, 'REJECTED')}>Tolak</Button>}{x.status === 'ACCEPTED' && x.user_id && <Button size="sm" variant="outline" onClick={() => setEnrollingId(x.id)}>Daftarkan jadi siswa</Button>}</div>{enrollingId === x.id && <div className="space-y-2 border-t pt-3"><select className="w-full rounded-md border bg-background p-2 text-sm" value={form.class_id ?? ''} onChange={(e) => set('class_id', e.target.value)}><option value="">Pilih kelas {x.entry_grade}</option>{classes.filter((cl) => cl.grade_level === x.entry_grade).map((cl) => <option key={cl.id} value={cl.id}>{cl.name}</option>)}</select><Field label="NIS baru" value={form.nis ?? ''} onChange={(e) => set('nis', e.target.value)} /><Button size="sm" disabled={!form.class_id || !form.nis} onClick={() => void enroll(x.id)}>Simpan siswa</Button></div>}</CardContent></Card>)}</div>
    </>}
    {section === 'exam' && admin && <>
      <Card><CardContent className="p-5"><form onSubmit={submit} className="grid gap-3 sm:grid-cols-2"><Field className="sm:col-span-2" label="Pertanyaan" required value={form.prompt ?? ''} onChange={(e) => set('prompt', e.target.value)} />{(['a','b','c','d'] as const).map((x) => <Field key={x} label={`Pilihan ${x.toUpperCase()}`} required value={form[`option_${x}`] ?? ''} onChange={(e) => set(`option_${x}`, e.target.value)} />)}{select('Jawaban benar', 'correct_option', ['A','B','C','D'].map((x) => ({ value:x,label:x })))}<Button disabled={saving}>Tambah soal</Button></form></CardContent></Card>
      <div className="grid gap-3 sm:grid-cols-2">{examQuestions.map((x, i) => <Card key={x.id}><CardContent className="p-4"><p className="font-semibold">{i + 1}. {x.prompt}</p><p className="text-sm text-muted-foreground">A. {x.option_a} · B. {x.option_b} · C. {x.option_c} · D. {x.option_d}</p></CardContent></Card>)}</div>
      <h2 className="font-semibold">Hasil ujian</h2><div className="grid gap-3 sm:grid-cols-2">{examAttempts.map((x) => <Card key={x.id}><CardContent className="p-4"><p className="font-semibold">{applicants.find((a) => a.id === x.applicant_id)?.name ?? x.applicant_id}</p><p className="text-sm">Nilai {x.score} · {x.passed ? 'Lulus' : 'Belum lulus'}</p></CardContent></Card>)}</div>
    </>}
    {section === 'report-card' && (admin || role === 'PUPIL') && <>
      {admin && <label className="block space-y-1 text-sm">Pilih siswa<select className="w-full max-w-md rounded-md border bg-background p-2" defaultValue="" onChange={(e) => { if (e.target.value) void showReport(e.target.value); }}><option value="">Pilih siswa</option>{pupils.map((x) => <option key={x.id} value={x.id}>{x.user?.name ?? x.nis}</option>)}</select></label>}
      {report && <Card><CardContent className="p-5 space-y-3"><div><p className="text-lg font-bold">{report.name}</p><p className="text-sm text-muted-foreground">{report.class?.name} · {report.class?.academic_year}</p></div><div className="grid grid-cols-4 gap-2 text-center">{['HADIR','IZIN','SAKIT','ALPA'].map((x) => <div key={x} className="rounded-md bg-muted p-2"><p className="text-xs">{x}</p><p className="font-bold">{report.attendance[x] ?? 0}</p></div>)}</div>{report.grades.map((x) => <div key={x.id} className="flex justify-between border-b pb-2 text-sm"><span>{subjectName(x.subject_id)} · semester {x.semester}</span><strong>{x.score}</strong></div>)}</CardContent></Card>}
    </>}
    {section !== 'dashboard' && section in titles && ((section === 'classes' && classes.length === 0) || (section === 'subjects' && subjects.length === 0) || (section === 'teachers' && teachers.length === 0) || (section === 'pupils' && pupils.length === 0) || (section === 'grades' && grades.length === 0)) && <p className="text-sm text-muted-foreground">Belum ada data.</p>}
  </div>;
}
