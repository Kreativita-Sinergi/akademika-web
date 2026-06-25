import { useState } from 'react';
import toast from 'react-hot-toast';
import { Award, RefreshCw } from 'lucide-react';
import ResourcePage from './../components/crud/ResourcePage';
import { useOptions } from '../hooks/useList';
import { createResource, errorMessage, patchResource } from '../api/crud';
import { Badge, Button, Field, Modal, formatDate, formatRupiah, inputClass } from '../components/ui';
import type {
  AcademicYear,
  Alumni,
  GraduationCeremony,
  GraduationParticipant,
  Internship,
  Lecturer,
  Student,
  Thesis,
} from '../types';

// ── PKL / KP ────────────────────────────────────────────────────────────────

const internshipStatuses = ['diajukan', 'disetujui', 'berjalan', 'selesai', 'dinilai'];

export function InternshipsPage() {
  const students = useOptions<Student>('/students', (s) => `${s.nim} — ${s.name}`);
  const lecturers = useOptions<Lecturer>('/lecturers', (l) => l.name);
  const years = useOptions<AcademicYear>('/master/academic-years', (y) => `${y.name} ${y.semester}`);

  const [target, setTarget] = useState<Internship | null>(null);
  const [status, setStatus] = useState('');
  const [score, setScore] = useState('');
  const [refreshFn, setRefreshFn] = useState<() => void>(() => () => {});

  const submitStatus = async () => {
    try {
      await patchResource(`/internships/${target!.id}/status`, {
        status,
        score: status === 'dinilai' ? Number(score) : undefined,
      });
      toast.success('Status diperbarui');
      setTarget(null);
      refreshFn();
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };

  return (
    <>
      <ResourcePage<Internship>
        title="PKL / Kerja Praktek"
        endpoint="/internships"
        columns={[
          { key: 'student', label: 'Mahasiswa', render: (i) => (i.student ? `${i.student.nim} — ${i.student.name}` : '-') },
          { key: 'type', label: 'Jenis', render: (i) => i.type.toUpperCase() },
          { key: 'company_name', label: 'Tempat/Instansi' },
          { key: 'supervisor', label: 'Pembimbing', render: (i) => i.supervisor?.name ?? '-' },
          { key: 'status', label: 'Status', render: (i) => <Badge value={i.status} /> },
          { key: 'letter_grade', label: 'Nilai', render: (i) => i.letter_grade || '-' },
        ]}
        fields={[
          { name: 'student_id', label: 'Mahasiswa', type: 'select', options: students, required: true },
          { name: 'academic_year_id', label: 'Tahun Akademik', type: 'select', options: years, required: true },
          {
            name: 'type',
            label: 'Jenis',
            type: 'select',
            required: true,
            options: [
              { value: 'pkl', label: 'PKL (keguruan)' },
              { value: 'ppl', label: 'PPL' },
              { value: 'kp', label: 'Kerja Praktek' },
              { value: 'magang', label: 'Magang' },
            ],
          },
          { name: 'company_name', label: 'Tempat/Instansi/Sekolah Mitra', type: 'text', required: true },
          { name: 'company_address', label: 'Alamat', type: 'textarea' },
          { name: 'supervisor_lecturer_id', label: 'Dosen Pembimbing', type: 'select', options: lecturers },
          { name: 'field_supervisor_name', label: 'Pembimbing Lapangan', type: 'text' },
          { name: 'report_title', label: 'Judul Laporan', type: 'text' },
          { name: 'report_file_url', label: 'File Laporan (PDF)', type: 'file', folder: 'internships' },
        ]}
        toForm={(i) => ({
          student_id: i.student_id,
          academic_year_id: (i as unknown as { academic_year_id: string }).academic_year_id,
          type: i.type,
          company_name: i.company_name,
          company_address: (i as unknown as { company_address?: string }).company_address ?? '',
          supervisor_lecturer_id: (i as unknown as { supervisor_lecturer_id?: string }).supervisor_lecturer_id ?? '',
          field_supervisor_name: i.field_supervisor_name,
          report_title: (i as unknown as { report_title?: string }).report_title ?? '',
          report_file_url: (i as unknown as { report_file_url?: string }).report_file_url ?? '',
        })}
        toPayload={(form) => ({
          ...form,
          supervisor_lecturer_id: form.supervisor_lecturer_id || null,
        })}
        rowActions={(item, refresh) => (
          <button
            onClick={() => {
              setTarget(item);
              setStatus(item.status);
              setScore(item.score != null ? String(item.score) : '');
              setRefreshFn(() => refresh);
            }}
            className="rounded p-1.5 text-blue-600 hover:bg-blue-50"
            title="Ubah status / beri nilai"
          >
            <RefreshCw size={15} />
          </button>
        )}
      />

      <Modal open={target !== null} title="Ubah Status PKL/KP" onClose={() => setTarget(null)}>
        <div className="space-y-3">
          <Field label="Status">
            <select className={inputClass} value={status} onChange={(e) => setStatus(e.target.value)}>
              {internshipStatuses.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </Field>
          {status === 'dinilai' && (
            <Field label="Nilai (0-100)">
              <input type="number" min={0} max={100} className={inputClass} value={score} onChange={(e) => setScore(e.target.value)} />
            </Field>
          )}
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setTarget(null)}>Batal</Button>
            <Button onClick={() => void submitStatus()}>Simpan</Button>
          </div>
        </div>
      </Modal>
    </>
  );
}

// ── Tugas Akhir ─────────────────────────────────────────────────────────────

const thesisStatuses = ['pengajuan', 'disetujui', 'bimbingan', 'seminar', 'sidang', 'revisi', 'lulus', 'tidak_lulus'];

export function ThesesPage() {
  const students = useOptions<Student>('/students', (s) => `${s.nim} — ${s.name}`);
  const lecturers = useOptions<Lecturer>('/lecturers', (l) => l.name);

  const [target, setTarget] = useState<Thesis | null>(null);
  const [status, setStatus] = useState('');
  const [score, setScore] = useState('');
  const [refreshFn, setRefreshFn] = useState<() => void>(() => () => {});

  const submitStatus = async () => {
    try {
      await patchResource(`/theses/${target!.id}/status`, {
        status,
        score: status === 'lulus' || status === 'tidak_lulus' ? Number(score) : undefined,
      });
      toast.success('Status tugas akhir diperbarui');
      setTarget(null);
      refreshFn();
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };

  return (
    <>
      <ResourcePage<Thesis>
        title="Tugas Akhir"
        endpoint="/theses"
        columns={[
          { key: 'student', label: 'Mahasiswa', render: (t) => (t.student ? `${t.student.nim} — ${t.student.name}` : '-') },
          { key: 'title', label: 'Judul' },
          { key: 'supervisor1', label: 'Pembimbing 1', render: (t) => t.supervisor1?.name ?? '-' },
          { key: 'status', label: 'Status', render: (t) => <Badge value={t.status} /> },
          { key: 'letter_grade', label: 'Nilai', render: (t) => t.letter_grade || '-' },
        ]}
        fields={[
          { name: 'student_id', label: 'Mahasiswa', type: 'select', options: students, required: true },
          { name: 'title', label: 'Judul Tugas Akhir', type: 'textarea', required: true },
          { name: 'supervisor1_id', label: 'Pembimbing 1', type: 'select', options: lecturers, required: true },
          { name: 'supervisor2_id', label: 'Pembimbing 2', type: 'select', options: lecturers },
          { name: 'file_url', label: 'Naskah Tugas Akhir (PDF)', type: 'file', folder: 'theses' },
        ]}
        toForm={(t) => ({
          student_id: t.student_id,
          title: t.title,
          supervisor1_id: (t as unknown as { supervisor1_id: string }).supervisor1_id,
          supervisor2_id: (t as unknown as { supervisor2_id?: string }).supervisor2_id ?? '',
          file_url: (t as unknown as { file_url?: string }).file_url ?? '',
        })}
        toPayload={(form) => ({
          ...form,
          supervisor2_id: form.supervisor2_id || null,
        })}
        rowActions={(item, refresh) => (
          <button
            onClick={() => {
              setTarget(item);
              setStatus(item.status);
              setScore(item.score != null ? String(item.score) : '');
              setRefreshFn(() => refresh);
            }}
            className="rounded p-1.5 text-blue-600 hover:bg-blue-50"
            title="Ubah status (bimbingan→seminar→sidang→lulus)"
          >
            <RefreshCw size={15} />
          </button>
        )}
      />

      <Modal open={target !== null} title="Ubah Status Tugas Akhir" onClose={() => setTarget(null)}>
        <div className="space-y-3">
          <Field label="Status">
            <select className={inputClass} value={status} onChange={(e) => setStatus(e.target.value)}>
              {thesisStatuses.map((s) => (
                <option key={s} value={s}>{s.replace('_', ' ')}</option>
              ))}
            </select>
          </Field>
          {(status === 'lulus' || status === 'tidak_lulus') && (
            <Field label="Nilai Sidang (0-100)">
              <input type="number" min={0} max={100} className={inputClass} value={score} onChange={(e) => setScore(e.target.value)} />
            </Field>
          )}
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setTarget(null)}>Batal</Button>
            <Button onClick={() => void submitStatus()}>Simpan</Button>
          </div>
        </div>
      </Modal>
    </>
  );
}

// ── Wisuda ──────────────────────────────────────────────────────────────────

export function GraduationsPage() {
  const ceremonies = useOptions<GraduationCeremony>('/graduations/ceremonies', (c) => c.name);
  const students = useOptions<Student>('/students', (s) => `${s.nim} — ${s.name}`);

  const [registerOpen, setRegisterOpen] = useState(false);
  const [regForm, setRegForm] = useState({ ceremony: '', student: '' });

  const register = async () => {
    try {
      await createResource('/graduations/participants', {
        ceremony_id: regForm.ceremony,
        student_id: regForm.student,
      });
      toast.success('Peserta wisuda terdaftar (syarat TA lulus & UKT lunas terpenuhi)');
      setRegisterOpen(false);
      window.location.reload();
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };

  return (
    <>
      <ResourcePage<GraduationCeremony>
        title="Periode Wisuda"
        endpoint="/graduations/ceremonies"
        columns={[
          { key: 'name', label: 'Nama' },
          { key: 'ceremony_date', label: 'Tanggal', render: (c) => formatDate(c.ceremony_date) },
          { key: 'location', label: 'Lokasi' },
          { key: 'fee', label: 'Biaya', render: (c) => formatRupiah(c.fee) },
        ]}
        fields={[
          { name: 'name', label: 'Nama (cth: Wisuda Periode XXIV)', type: 'text', required: true },
          { name: 'ceremony_date', label: 'Tanggal Wisuda', type: 'date' },
          { name: 'location', label: 'Lokasi', type: 'text' },
          { name: 'registration_start', label: 'Buka Pendaftaran', type: 'date' },
          { name: 'registration_end', label: 'Tutup Pendaftaran', type: 'date' },
          { name: 'fee', label: 'Biaya (Rp)', type: 'number' },
        ]}
        toForm={(c) => ({
          name: c.name,
          ceremony_date: c.ceremony_date?.slice(0, 10) ?? '',
          location: c.location,
          registration_start: '',
          registration_end: '',
          fee: c.fee,
        })}
        toPayload={(form) => ({
          ...form,
          ceremony_date: form.ceremony_date ? new Date(String(form.ceremony_date)).toISOString() : undefined,
          registration_start: form.registration_start ? new Date(String(form.registration_start)).toISOString() : undefined,
          registration_end: form.registration_end ? new Date(String(form.registration_end)).toISOString() : undefined,
        })}
        headerActions={() => (
          <Button variant="secondary" onClick={() => setRegisterOpen(true)}>
            <span className="flex items-center gap-1.5">
              <Award size={15} /> Daftarkan Peserta
            </span>
          </Button>
        )}
      />

      <div className="mt-8">
        <ParticipantsTable />
      </div>

      <Modal open={registerOpen} title="Daftarkan Peserta Wisuda" onClose={() => setRegisterOpen(false)}>
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">Syarat otomatis dicek: tugas akhir lulus & seluruh tagihan UKT lunas.</p>
          <Field label="Periode Wisuda">
            <select className={inputClass} value={regForm.ceremony} onChange={(e) => setRegForm({ ...regForm, ceremony: e.target.value })}>
              <option value="">— pilih —</option>
              {ceremonies.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </Field>
          <Field label="Mahasiswa">
            <select className={inputClass} value={regForm.student} onChange={(e) => setRegForm({ ...regForm, student: e.target.value })}>
              <option value="">— pilih —</option>
              {students.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </Field>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setRegisterOpen(false)}>Batal</Button>
            <Button disabled={!regForm.ceremony || !regForm.student} onClick={() => void register()}>Daftarkan</Button>
          </div>
        </div>
      </Modal>
    </>
  );
}

function ParticipantsTable() {
  return (
    <ResourcePage<GraduationParticipant>
      title="Peserta Wisuda"
      endpoint="/graduations/participants"
      canCreate={false}
      canEdit={false}
      canDelete={false}
      columns={[
        { key: 'registration_number', label: 'No. Wisuda' },
        { key: 'student', label: 'Mahasiswa', render: (p) => (p.student ? `${p.student.nim} — ${p.student.name}` : '-') },
        { key: 'ceremony', label: 'Periode', render: (p) => p.ceremony?.name ?? '-' },
        { key: 'ipk', label: 'IPK', render: (p) => p.ipk.toFixed(2) },
        { key: 'predicate', label: 'Predikat' },
        { key: 'status', label: 'Status', render: (p) => <Badge value={p.status} /> },
      ]}
      fields={[]}
      rowActions={(p, refresh) =>
        p.status !== 'wisuda' && (
          <button
            onClick={() => {
              void (async () => {
                try {
                  await createResource(`/graduations/participants/${p.id}/graduate`, {});
                  toast.success('Mahasiswa resmi diwisuda & tercatat sebagai alumni 🎓');
                  refresh();
                } catch (err) {
                  toast.error(errorMessage(err));
                }
              })();
            }}
            className="rounded p-1.5 text-emerald-600 hover:bg-emerald-50"
            title="Tandai sudah wisuda (otomatis jadi alumni)"
          >
            <Award size={15} />
          </button>
        )
      }
    />
  );
}

// ── Alumni ──────────────────────────────────────────────────────────────────

export function AlumniPage() {
  return (
    <ResourcePage<Alumni>
      title="Alumni"
      endpoint="/alumni"
      canCreate={false}
      canDelete={false}
      columns={[
        { key: 'student', label: 'Nama', render: (a) => (a.student ? `${a.student.nim} — ${a.student.name}` : '-') },
        { key: 'graduation_year', label: 'Tahun Lulus' },
        { key: 'degree', label: 'Jenjang' },
        { key: 'ipk', label: 'IPK', render: (a) => a.ipk.toFixed(2) },
        { key: 'job_status', label: 'Status Kerja', render: (a) => <Badge value={a.job_status} /> },
        { key: 'company_name', label: 'Perusahaan/Instansi' },
      ]}
      fields={[
        {
          name: 'job_status',
          label: 'Status Pekerjaan',
          type: 'select',
          options: [
            { value: 'bekerja', label: 'Bekerja' },
            { value: 'wirausaha', label: 'Wirausaha' },
            { value: 'studi_lanjut', label: 'Studi Lanjut' },
            { value: 'mencari', label: 'Mencari Kerja' },
          ],
        },
        { name: 'company_name', label: 'Perusahaan/Instansi', type: 'text' },
        { name: 'job_position', label: 'Posisi', type: 'text' },
        { name: 'email', label: 'Email', type: 'text' },
        { name: 'phone', label: 'No. HP', type: 'text' },
        { name: 'first_job_wait_month', label: 'Masa Tunggu Kerja Pertama (bulan)', type: 'number' },
      ]}
      toForm={(a) => ({
        job_status: a.job_status,
        company_name: a.company_name,
        job_position: a.job_position,
        email: (a as unknown as { email?: string }).email ?? '',
        phone: (a as unknown as { phone?: string }).phone ?? '',
        first_job_wait_month: (a as unknown as { first_job_wait_month?: number }).first_job_wait_month ?? 0,
      })}
      toPayload={(form) => ({
        ...form,
        first_job_wait_month: form.first_job_wait_month ? Number(form.first_job_wait_month) : null,
      })}
    />
  );
}
