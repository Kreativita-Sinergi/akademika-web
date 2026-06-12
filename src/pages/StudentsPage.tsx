import { useState } from 'react';
import toast from 'react-hot-toast';
import { History, TrendingUp } from 'lucide-react';
import ResourcePage from '../components/crud/ResourcePage';
import { useOptions } from '../hooks/useList';
import { createResource, errorMessage, getResource } from '../api/crud';
import { Badge, Button, Field, Modal, inputClass } from '../components/ui';
import type { AcademicYear, ClassGroup, Student, StudentSemester, StudyProgram, UktGroup } from '../types';

export default function StudentsPage() {
  const programs = useOptions<StudyProgram>('/master/programs', (p) => p.name);
  const classGroups = useOptions<ClassGroup>('/master/class-groups', (g) => g.code);
  const uktGroups = useOptions<UktGroup>('/ukt/groups', (u) => `Gol ${u.group_number} — ${u.study_program?.name ?? ''}`);
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
          { key: 'nim', label: 'NIM' },
          { key: 'name', label: 'Nama' },
          { key: 'study_program', label: 'Prodi', render: (s) => s.study_program?.name ?? '-' },
          { key: 'class_group', label: 'Rombel', render: (s) => s.class_group?.code ?? '-' },
          { key: 'entry_year', label: 'Angkatan' },
          { key: 'current_semester', label: 'Smt' },
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
          create_account: false,
          password: '',
        })}
        toPayload={(form) => ({
          ...form,
          class_group_id: form.class_group_id || null,
          ukt_group_id: form.ukt_group_id || null,
        })}
        rowActions={(student) => (
          <button
            onClick={() => void showHistory(student)}
            className="rounded p-1.5 text-primary-600 hover:bg-primary-50"
            title="Riwayat semester"
          >
            <History size={15} />
          </button>
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
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-xs uppercase text-slate-500">
              <th className="py-2">Smt</th>
              <th>Tahun Akademik</th>
              <th>SKS Ambil</th>
              <th>SKS Lulus</th>
              <th>IPS</th>
              <th>IPK</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {history.map((h) => (
              <tr key={h.id} className="border-b last:border-0">
                <td className="py-2">{h.semester_number}</td>
                <td>{h.academic_year ? `${h.academic_year.name} ${h.academic_year.semester}` : '-'}</td>
                <td>{h.sks_taken}</td>
                <td>{h.sks_passed}</td>
                <td>{h.ips.toFixed(2)}</td>
                <td>{h.ipk.toFixed(2)}</td>
                <td><Badge value={h.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
        {history.length === 0 && <div className="py-6 text-center text-sm text-slate-400">Belum ada riwayat</div>}
      </Modal>

      <Modal open={promoteOpen} title="Naik Semester Massal (Herregistrasi)" onClose={() => setPromoteOpen(false)}>
        <div className="space-y-3">
          <p className="text-sm text-slate-500">
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
