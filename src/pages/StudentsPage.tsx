import { useState } from 'react';
import toast from 'react-hot-toast';
import { History, TrendingUp } from 'lucide-react';
import ResourcePage from '../components/crud/ResourcePage';
import { useOptions } from '../hooks/useList';
import { createResource, errorMessage, getResource } from '../api/crud';
import { Badge, Button, Field, Modal, inputClass } from '../components/ui';
import { DataTable, type Column } from '@/components/ui/data-table';
import type { AcademicYear, ClassGroup, Lecturer, Student, StudentSemester, StudyProgram, UktGroup } from '../types';

const historyColumns: Column<StudentSemester>[] = [
  { title: 'Smt', dataIndex: 'semester_number', width: 60 },
  { title: 'Tahun Akademik', key: 'year', render: (_, h) => (h.academic_year ? `${h.academic_year.name} ${h.academic_year.semester}` : '-') },
  { title: 'SKS Ambil', dataIndex: 'sks_taken' },
  { title: 'SKS Lulus', dataIndex: 'sks_passed' },
  { title: 'IPS', key: 'ips', render: (_, h) => h.ips.toFixed(2) },
  { title: 'IPK', key: 'ipk', render: (_, h) => h.ipk.toFixed(2) },
  { title: 'Status', key: 'status', render: (_, h) => <Badge value={h.status} /> },
];

export default function StudentsPage() {
  const programs = useOptions<StudyProgram>('/master/programs', (p) => p.name);
  const classGroups = useOptions<ClassGroup>('/master/class-groups', (g) => g.code);
  const uktGroups = useOptions<UktGroup>('/ukt/groups', (u) => `Gol ${u.group_number} — ${u.study_program?.name ?? ''}`);
  const lecturers = useOptions<Lecturer>('/lecturers', (l) => l.name);
  const years = useOptions<AcademicYear>('/master/academic-years', (y) => `${y.name} ${y.semester}`);

  const [historyOpen, setHistoryOpen] = useState(false);
  const [history, setHistory] = useState<StudentSemester[]>([]);
  const [historyName, setHistoryName] = useState('');

  const [promoteOpen, setPromoteOpen] = useState(false);
  const [promoteYear, setPromoteYear] = useState('');
  const [promoteInvoice, setPromoteInvoice] = useState(true);

  const showHistory = async (student: Student) => {
    setHistoryName(`${student.nim} — ${student.name}`);
    const items = await getResource<StudentSemester[]>(`/students/${student.id}/semesters`);
    setHistory(items ?? []);
    setHistoryOpen(true);
  };

  const handlePromote = async (refresh: () => void) => {
    try {
      const result = await createResource<{ promoted: number }>('/students/promote', {
        academic_year_id: promoteYear,
        generate_invoice: promoteInvoice,
      });
      toast.success(`${result.promoted ?? 0} mahasiswa naik semester`);
      setPromoteOpen(false);
      refresh();
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };

  return (
    <>
      <ResourcePage<Student>
        title="Mahasiswa"
        endpoint="/students"
        columns={[
          { key: 'nim', label: 'NIM', sortable: true },
          { key: 'name', label: 'Nama', sortable: true },
          { key: 'study_program', label: 'Prodi', sortable: true, render: (s) => s.study_program?.name ?? '-' },
          { key: 'class_group', label: 'Rombel', sortable: true, render: (s) => s.class_group?.code ?? '-' },
          { key: 'entry_year', label: 'Angkatan', sortable: true },
          { key: 'current_semester', label: 'Smt', sortable: true },
          { key: 'status', label: 'Status', render: (s) => <Badge value={s.status} /> },
        ]}
        fields={[
          { name: 'study_program_id', label: 'Program Studi', type: 'select', options: programs, required: true },
          { name: 'class_group_id', label: 'Rombel', type: 'select', options: classGroups },
          { name: 'nim', label: 'NIM (kosongkan untuk generate otomatis)', type: 'text' },
          { name: 'name', label: 'Nama Lengkap', type: 'text', required: true },
          {
            name: 'gender',
            label: 'Jenis Kelamin',
            type: 'select',
            options: [
              { value: 'L', label: 'Laki-laki' },
              { value: 'P', label: 'Perempuan' },
            ],
          },
          { name: 'email', label: 'Email', type: 'text' },
          { name: 'phone', label: 'No. HP', type: 'text' },
          { name: 'entry_year', label: 'Tahun Angkatan', type: 'number', required: true },
          { name: 'photo_url', label: 'Foto Mahasiswa', type: 'file', folder: 'students' },
          { name: 'ukt_group_id', label: 'Golongan UKT', type: 'select', options: uktGroups },
          { name: 'advisor_lecturer_id', label: 'Dosen Wali (PA)', type: 'select', options: lecturers },
          { name: 'create_account', label: 'Buatkan akun login mahasiswa', type: 'checkbox' },
          { name: 'password', label: 'Password akun (min 8 karakter)', type: 'password' },
        ]}
        toForm={(s) => ({
          study_program_id: s.study_program_id,
          class_group_id: s.class_group_id ?? '',
          nim: s.nim,
          name: s.name,
          gender: s.gender,
          email: s.email,
          phone: s.phone,
          entry_year: s.entry_year,
          photo_url: (s as unknown as { photo_url?: string }).photo_url ?? '',
          ukt_group_id: s.ukt_group_id ?? '',
          advisor_lecturer_id: s.advisor_lecturer_id ?? '',
          create_account: false,
          password: '',
        })}
        toPayload={(form) => ({
          ...form,
          class_group_id: form.class_group_id || null,
          ukt_group_id: form.ukt_group_id || null,
          advisor_lecturer_id: form.advisor_lecturer_id || null,
        })}
        rowActions={(student) => (
          <Button variant="ghost" size="icon" className="h-8 w-8" title="Riwayat semester" onClick={() => void showHistory(student)}>
            <History className="h-4 w-4" />
          </Button>
        )}
        headerActions={() => (
          <Button variant="secondary" onClick={() => setPromoteOpen(true)}>
            <span className="flex items-center gap-1.5">
              <TrendingUp size={15} /> Naik Semester
            </span>
          </Button>
        )}
      />

      <Modal open={historyOpen} title={`Riwayat Semester — ${historyName}`} onClose={() => setHistoryOpen(false)} wide>
        <DataTable<StudentSemester> columns={historyColumns} rowKey={(h) => h.id} data={history} emptyText="Belum ada riwayat" />
      </Modal>

      <Modal open={promoteOpen} title="Naik Semester Massal (Herregistrasi)" onClose={() => setPromoteOpen(false)}>
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Semua mahasiswa berstatus aktif akan dinaikkan 1 semester dan dicatat pada tahun akademik tujuan.
          </p>
          <Field label="Tahun Akademik Tujuan">
            <select className={inputClass} value={promoteYear} onChange={(e) => setPromoteYear(e.target.value)}>
              <option value="">— pilih —</option>
              {years.map((y) => (
                <option key={y.value} value={y.value}>
                  {y.label}
                </option>
              ))}
            </select>
          </Field>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={promoteInvoice} onChange={(e) => setPromoteInvoice(e.target.checked)} />
            Sekalian generate tagihan UKT sesuai golongan
          </label>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setPromoteOpen(false)}>
              Batal
            </Button>
            <Button disabled={!promoteYear} onClick={() => void handlePromote(() => window.location.reload())}>
              Proses
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
