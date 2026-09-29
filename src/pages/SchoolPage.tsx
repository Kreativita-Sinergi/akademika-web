import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { createResource, errorMessage, getResource, listResource, updateResource } from '../api/crud';
import { useAuthStore } from '../store/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import type { Campus } from '../types';

type Class = { id: string; name: string; grade_level: number; major: string; academic_year: string };
type Subject = { id: string; code: string; name: string; teacher_user_id: string | null };
type Person = { id: string; name: string; email: string };
type Pupil = { id: string; user_id: string; class_id: string; nis: string; nisn: string; user?: Person };
type Grade = { id: string; pupil_id: string; subject_id: string; academic_year: string; semester: number; score: number; note: string };

const titles: Record<string, string> = { dashboard: 'Dashboard Sekolah', classes: 'Kelas', subjects: 'Mata Pelajaran', teachers: 'Guru', pupils: 'Siswa', grades: 'Nilai Semester' };
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
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<Record<string, string>>({});
  const set = (key: string, value: string) => setForm((v) => ({ ...v, [key]: value }));
  const load = useCallback(async () => {
    try {
      const [profile, classResult, subjectResult, teacherResult, pupilResult, gradeResult] = await Promise.all([
        getResource<Campus>('/school/profile'), listResource<Class>('/school/classes'), listResource<Subject>('/school/subjects'),
        listResource<Person>('/school/teachers'), listResource<Pupil>('/school/pupils'), listResource<Grade>('/school/grades'),
      ]);
      setSchool(profile); setClasses(classResult.data ?? []); setSubjects(subjectResult.data ?? []);
      setTeachers(teacherResult.data ?? []); setPupils(pupilResult.data ?? []); setGrades(gradeResult.data ?? []);
    } catch (error) { toast.error(errorMessage(error)); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { void load(); }, [load]);
  const submit = async (event: React.FormEvent) => {
    event.preventDefault(); setSaving(true);
    try {
      if (section === 'classes') await createResource('/school/classes', { name: form.name, grade_level: Number(form.grade_level), major: form.major || '', academic_year: form.academic_year });
      if (section === 'subjects') await createResource('/school/subjects', { code: form.code, name: form.name, teacher_user_id: form.teacher_user_id || null });
      if (section === 'teachers') await createResource('/school/teachers', form);
      if (section === 'pupils') await createResource('/school/pupils', { ...form, class_id: form.class_id });
      if (section === 'grades') await createResource('/school/grades', { ...form, score: Number(form.score), semester: Number(form.semester) });
      toast.success('Data tersimpan'); setForm({}); await load();
    } catch (error) { toast.error(errorMessage(error)); }
    finally { setSaving(false); }
  };
  const move = async (pupilId: string, classId: string) => {
    try { await updateResource(`/school/pupils/${pupilId}/class`, { class_id: classId }); toast.success('Kelas siswa diperbarui'); await load(); }
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
    {section === 'dashboard' && <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{[['Kelas', classes.length, '/school/classes'], ['Mata Pelajaran', subjects.length, '/school/subjects'], ['Guru', teachers.length, '/school/teachers'], ['Siswa', pupils.length, '/school/pupils']].map(([label, count, link]) => <Link key={label} to={String(link)}><Card><CardContent className="p-5"><p className="text-sm text-muted-foreground">{label}</p><p className="text-3xl font-bold">{count}</p></CardContent></Card></Link>)}</div>
      <Card><CardContent className="p-5"><p className="font-semibold">{role === 'PUPIL' ? 'Nilai saya' : 'Pengelolaan akademik'}</p><p className="text-sm text-muted-foreground mt-1">Kelola kelas sesuai jenjang, mata pelajaran, guru, siswa, dan nilai semester.</p><Link className="text-primary text-sm font-semibold" to="/school/grades">Lihat nilai →</Link></CardContent></Card>
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
      <div className="grid gap-3 sm:grid-cols-2">{pupils.map((x) => <Card key={x.id}><CardContent className="p-4"><p className="font-semibold">{x.user?.name ?? x.nis}</p><p className="text-sm text-muted-foreground">NIS {x.nis}{x.nisn && ` · NISN ${x.nisn}`}</p><p className="text-sm text-muted-foreground">{classes.find((cl) => cl.id === x.class_id)?.name ?? 'Kelas tidak ditemukan'}</p>{admin && <select aria-label={`Pindahkan kelas ${x.user?.name ?? x.nis}`} className="mt-2 w-full rounded-md border bg-background p-2 text-sm" value={x.class_id} onChange={(e) => void move(x.id, e.target.value)}>{classes.map((cl) => <option key={cl.id} value={cl.id}>{cl.name}</option>)}</select>}</CardContent></Card>)}</div>
    </>}
    {section === 'grades' && <>
      {(admin || teacher) && <Card><CardContent className="p-5"><form onSubmit={submit} className="grid gap-3 sm:grid-cols-2">{select('Siswa', 'pupil_id', pupils.map((x) => ({ value: x.id, label: `${x.user?.name ?? x.nis} (${x.nis})` })))}{select('Mapel', 'subject_id', visibleSubjects.map((x) => ({ value: x.id, label: x.name })))}<Field label="Tahun ajaran" required value={form.academic_year ?? ''} onChange={(e) => set('academic_year', e.target.value)} placeholder="2026/2027" />{select('Semester', 'semester', [{ value: '1', label: 'Ganjil' }, { value: '2', label: 'Genap' }])}<Field label="Nilai (0–100)" type="number" min="0" max="100" step="0.01" required value={form.score ?? ''} onChange={(e) => set('score', e.target.value)} /><Field label="Catatan" value={form.note ?? ''} onChange={(e) => set('note', e.target.value)} /><Button disabled={saving}>Simpan nilai</Button></form></CardContent></Card>}
      <div className="grid gap-3 sm:grid-cols-2">{grades.map((x) => <Card key={x.id}><CardContent className="p-4"><div className="flex justify-between"><p className="font-semibold">{subjectName(x.subject_id)}</p><p className="text-xl font-bold">{x.score}</p></div><p className="text-sm text-muted-foreground">{pupilName(x.pupil_id)} · {x.academic_year} semester {x.semester}</p>{x.note && <p className="mt-1 text-sm">{x.note}</p>}</CardContent></Card>)}</div>
    </>}
    {section !== 'dashboard' && section in titles && ((section === 'classes' && classes.length === 0) || (section === 'subjects' && subjects.length === 0) || (section === 'teachers' && teachers.length === 0) || (section === 'pupils' && pupils.length === 0) || (section === 'grades' && grades.length === 0)) && <p className="text-sm text-muted-foreground">Belum ada data.</p>}
  </div>;
}
