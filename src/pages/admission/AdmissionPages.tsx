import { useState } from 'react';
import toast from 'react-hot-toast';
import { Banknote, CalendarCheck, ClipboardCheck, GraduationCap, UserCheck } from 'lucide-react';
import ResourcePage from '../../components/crud/ResourcePage';
import { useOptions } from '../../hooks/useList';
import { createResource, errorMessage, patchResource } from '../../api/crud';
import { uploadFile } from '../../api/upload';
import { Badge, Button, Field, Modal, formatDate, formatRupiah, inputClass } from '../../components/ui';
import type { AcademicYear, AdmissionWave, Applicant, ClassGroup, ExamSchedule, Room, StudyProgram, UktGroup } from '../../types';

// ── Gelombang PMB ───────────────────────────────────────────────────────────

export function WavesPage() {
  return (
    <ResourcePage<AdmissionWave>
      title="Gelombang PMB"
      endpoint="/admission/waves"
      columns={[
        { key: 'name', label: 'Nama', sortable: true },
        { key: 'entry_year', label: 'Tahun Masuk', sortable: true },
        { key: 'start_date', label: 'Mulai', render: (w) => formatDate(w.start_date) },
        { key: 'end_date', label: 'Selesai', render: (w) => formatDate(w.end_date) },
        { key: 'registration_fee', label: 'Biaya Daftar', render: (w) => formatRupiah(w.registration_fee) },
        { key: 'passing_score', label: 'Nilai Lulus' },
      ]}
      fields={[
        { name: 'name', label: 'Nama Gelombang (cth: Gelombang 1)', type: 'text', required: true },
        { name: 'entry_year', label: 'Tahun Masuk (angkatan)', type: 'number', required: true },
        { name: 'start_date', label: 'Tanggal Buka', type: 'date' },
        { name: 'end_date', label: 'Tanggal Tutup', type: 'date' },
        { name: 'registration_fee', label: 'Biaya Pendaftaran (Rp)', type: 'number' },
        { name: 'passing_score', label: 'Ambang Nilai Lulus Ujian', type: 'number' },
        { name: 'max_applicants', label: 'Kuota Pendaftar (0 = tanpa batas)', type: 'number' },
      ]}
      toForm={(w) => ({
        name: w.name,
        entry_year: w.entry_year,
        start_date: w.start_date?.slice(0, 10) ?? '',
        end_date: w.end_date?.slice(0, 10) ?? '',
        registration_fee: w.registration_fee,
        passing_score: w.passing_score,
        max_applicants: w.max_applicants,
      })}
      toPayload={(form) => ({
        ...form,
        start_date: form.start_date ? new Date(String(form.start_date)).toISOString() : undefined,
        end_date: form.end_date ? new Date(String(form.end_date)).toISOString() : undefined,
      })}
    />
  );
}

// ── Jadwal Ujian Masuk ──────────────────────────────────────────────────────

export function ExamSchedulesPage() {
  const waves = useOptions<AdmissionWave>('/admission/waves', (w) => `${w.name} (${w.entry_year})`);
  const rooms = useOptions<Room>('/master/rooms', (r) => `${r.code} — ${r.name}`);
  return (
    <ResourcePage<ExamSchedule>
      title="Jadwal Ujian Masuk"
      endpoint="/admission/exam-schedules"
      columns={[
        { key: 'name', label: 'Sesi', sortable: true },
        { key: 'admission_wave', label: 'Gelombang', render: (e) => e.admission_wave?.name ?? '-' },
        { key: 'exam_date', label: 'Tanggal', render: (e) => formatDate(e.exam_date) },
        { key: 'time', label: 'Jam', render: (e) => `${e.start_time} - ${e.end_time}` },
        { key: 'room', label: 'Ruangan', render: (e) => e.room?.name ?? '-' },
        { key: 'capacity', label: 'Kapasitas' },
      ]}
      fields={[
        { name: 'admission_wave_id', label: 'Gelombang', type: 'select', options: waves, required: true },
        { name: 'name', label: 'Nama Sesi (cth: Sesi 1)', type: 'text', required: true },
        { name: 'exam_date', label: 'Tanggal Ujian', type: 'date' },
        { name: 'start_time', label: 'Jam Mulai (HH:MM)', type: 'time' },
        { name: 'end_time', label: 'Jam Selesai (HH:MM)', type: 'time' },
        { name: 'room_id', label: 'Ruangan', type: 'select', options: rooms },
        { name: 'capacity', label: 'Kapasitas', type: 'number' },
        { name: 'duration_minutes', label: 'Durasi CBT (menit)', type: 'number' },
      ]}
      toForm={(e) => ({
        admission_wave_id: e.admission_wave_id,
        name: e.name,
        exam_date: e.exam_date?.slice(0, 10) ?? '',
        start_time: e.start_time,
        end_time: e.end_time,
        room_id: e.room_id ?? '',
        capacity: e.capacity,
        duration_minutes: (e as unknown as { duration_minutes?: number }).duration_minutes ?? 60,
      })}
      toPayload={(form) => ({
        ...form,
        exam_date: form.exam_date ? new Date(String(form.exam_date)).toISOString() : undefined,
        room_id: form.room_id || null,
      })}
    />
  );
}

// ── Pendaftar: alur lengkap PMB ─────────────────────────────────────────────

type FlowAction = 'exam' | 'score' | 'reenroll' | 'enroll' | null;

export function ApplicantsPage() {
  const waves = useOptions<AdmissionWave>('/admission/waves', (w) => `${w.name} (${w.entry_year})`);
  const programs = useOptions<StudyProgram>('/master/programs', (p) => p.name);
  const examSchedules = useOptions<ExamSchedule>('/admission/exam-schedules', (e) => `${e.name} — ${formatDate(e.exam_date)}`);
  const uktGroups = useOptions<UktGroup>('/ukt/groups', (u) => `Gol ${u.group_number} — ${formatRupiah(u.amount_per_semester)} (${u.study_program?.name ?? ''})`);
  const years = useOptions<AcademicYear>('/master/academic-years', (y) => `${y.name} ${y.semester}`);
  const classGroups = useOptions<ClassGroup>('/master/class-groups', (g) => g.code);

  const [action, setAction] = useState<FlowAction>(null);
  const [target, setTarget] = useState<Applicant | null>(null);
  const [form, setForm] = useState<Record<string, string | boolean>>({});
  const [refreshFn, setRefreshFn] = useState<() => void>(() => () => {});

  const openAction = (a: FlowAction, applicant: Applicant, refresh: () => void) => {
    setAction(a);
    setTarget(applicant);
    setForm({});
    setRefreshFn(() => refresh);
  };

  const close = () => {
    setAction(null);
    setTarget(null);
  };

  const run = async (fn: () => Promise<void>, successMsg: string) => {
    try {
      await fn();
      toast.success(successMsg);
      close();
      refreshFn();
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };

  const markPaid = (applicant: Applicant, refresh: () => void) =>
    run(async () => {
      await patchResource(`/admission/applicants/${applicant.id}/payment`, { payment_status: 'lunas' });
      refresh();
    }, 'Pembayaran pendaftaran dikonfirmasi');

  return (
    <>
      <ResourcePage<Applicant>
        title="Pendaftar PMB"
        endpoint="/admission/applicants"
        canEdit={false}
        canDelete={false}
        columns={[
          { key: 'registration_number', label: 'No. Daftar', sortable: true },
          { key: 'name', label: 'Nama', sortable: true },
          { key: 'first_choice', label: 'Pilihan 1', render: (a) => a.first_choice?.name ?? '-' },
          { key: 'admission_wave', label: 'Gelombang', render: (a) => a.admission_wave?.name ?? '-' },
          { key: 'payment_status', label: 'Bayar', render: (a) => <Badge value={a.payment_status} /> },
          { key: 'exam_score', label: 'Nilai', render: (a) => (a.exam_score != null ? a.exam_score : '-') },
          { key: 'status', label: 'Status', render: (a) => <Badge value={a.status} /> },
        ]}
        fields={[
          { name: 'admission_wave_id', label: 'Gelombang', type: 'select', options: waves, required: true },
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
          { name: 'school_origin', label: 'Asal Sekolah', type: 'text' },
          { name: 'photo_url', label: 'Foto Pendaftar', type: 'file', folder: 'applicants' },
          { name: 'first_choice_program_id', label: 'Pilihan Prodi 1', type: 'select', options: programs, required: true },
          { name: 'second_choice_program_id', label: 'Pilihan Prodi 2', type: 'select', options: programs },
        ]}
        toPayload={(form) => ({
          ...form,
          second_choice_program_id: form.second_choice_program_id || null,
        })}
        rowActions={(applicant, refresh) => (
          <div className="flex items-center gap-1">
            {applicant.payment_status !== 'lunas' && (
              <button
                onClick={() => void markPaid(applicant, refresh)}
                className="rounded p-1.5 text-emerald-600 hover:bg-emerald-50"
                title="Konfirmasi pembayaran pendaftaran"
              >
                <Banknote size={15} />
              </button>
            )}
            {applicant.payment_status === 'lunas' && applicant.status === 'terdaftar' && (
              <button
                onClick={() => openAction('exam', applicant, refresh)}
                className="rounded p-1.5 text-blue-600 hover:bg-blue-50"
                title="Jadwalkan ujian"
              >
                <CalendarCheck size={15} />
              </button>
            )}
            {applicant.status === 'ujian_dijadwalkan' && (
              <button
                onClick={() => openAction('score', applicant, refresh)}
                className="rounded p-1.5 text-indigo-600 hover:bg-indigo-50"
                title="Input nilai ujian"
              >
                <ClipboardCheck size={15} />
              </button>
            )}
            {applicant.status === 'lulus' && (
              <button
                onClick={() => openAction('reenroll', applicant, refresh)}
                className="rounded p-1.5 text-violet-600 hover:bg-violet-50"
                title="Proses daftar ulang + penetapan UKT"
              >
                <UserCheck size={15} />
              </button>
            )}
            {applicant.status === 'daftar_ulang' && (
              <button
                onClick={() => openAction('enroll', applicant, refresh)}
                className="rounded p-1.5 text-emerald-600 hover:bg-emerald-50"
                title="Jadikan mahasiswa (generate NIM + akun)"
              >
                <GraduationCap size={15} />
              </button>
            )}
          </div>
        )}
      />

      {/* Jadwalkan ujian */}
      <Modal open={action === 'exam'} title={`Jadwalkan Ujian — ${target?.name ?? ''}`} onClose={close}>
        <div className="space-y-3">
          <Field label="Sesi Ujian">
            <select className={inputClass} value={String(form.exam ?? '')} onChange={(e) => setForm({ ...form, exam: e.target.value })}>
              <option value="">— pilih —</option>
              {examSchedules.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </Field>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={close}>Batal</Button>
            <Button
              disabled={!form.exam}
              onClick={() =>
                void run(async () => {
                  await createResource('/admission/assign-exam', {
                    applicant_ids: [target!.id],
                    exam_schedule_id: form.exam,
                  });
                }, 'Pendaftar dijadwalkan ujian')
              }
            >
              Simpan
            </Button>
          </div>
        </div>
      </Modal>

      {/* Input nilai */}
      <Modal open={action === 'score'} title={`Nilai Ujian — ${target?.name ?? ''}`} onClose={close}>
        <div className="space-y-3">
          <Field label="Nilai (0-100). Kelulusan otomatis berdasar ambang gelombang.">
            <input
              type="number"
              className={inputClass}
              value={String(form.score ?? '')}
              onChange={(e) => setForm({ ...form, score: e.target.value })}
              min={0}
              max={100}
            />
          </Field>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={close}>Batal</Button>
            <Button
              disabled={form.score === undefined || form.score === ''}
              onClick={() =>
                void run(async () => {
                  await createResource('/admission/exam-score', {
                    applicant_id: target!.id,
                    score: Number(form.score),
                  });
                }, 'Nilai disimpan, kelulusan ditentukan otomatis')
              }
            >
              Simpan
            </Button>
          </div>
        </div>
      </Modal>

      {/* Daftar ulang */}
      <Modal open={action === 'reenroll'} title={`Daftar Ulang — ${target?.name ?? ''}`} onClose={close}>
        <div className="space-y-3">
          <Field label="Penetapan Golongan UKT">
            <select className={inputClass} value={String(form.ukt ?? '')} onChange={(e) => setForm({ ...form, ukt: e.target.value })}>
              <option value="">— pilih —</option>
              {uktGroups.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </Field>
          <Field label="Jumlah Pembayaran Daftar Ulang (Rp)">
            <input
              type="number"
              className={inputClass}
              value={String(form.amount ?? '')}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
            />
          </Field>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={Boolean(form.paid)} onChange={(e) => setForm({ ...form, paid: e.target.checked })} />
            Pembayaran lunas
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={Boolean(form.docs)} onChange={(e) => setForm({ ...form, docs: e.target.checked })} />
            Berkas lengkap
          </label>
          <Field label="Upload Berkas Daftar Ulang (PDF/scan)">
            <input
              type="file"
              className="block w-full text-sm text-muted-foreground file:mr-3 file:rounded-lg file:border-0 file:bg-primary/5 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-primary"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                void uploadFile(file, 'documents')
                  .then((url) => {
                    setForm((prev) => ({ ...prev, docUrl: url }));
                    toast.success('Berkas terunggah');
                  })
                  .catch((err) => toast.error(errorMessage(err)));
              }}
            />
            {Boolean(form.docUrl) && (
              <a href={String(form.docUrl)} target="_blank" rel="noreferrer" className="mt-1 block truncate text-xs text-primary underline">
                Lihat berkas terunggah
              </a>
            )}
          </Field>
          <p className="text-xs text-muted-foreground">Status berubah menjadi "daftar ulang" jika lunas & berkas lengkap.</p>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={close}>Batal</Button>
            <Button
              onClick={() =>
                void run(async () => {
                  await createResource('/admission/reenrollments', {
                    applicant_id: target!.id,
                    ukt_group_id: form.ukt || null,
                    payment_amount: Number(form.amount || 0),
                    payment_status: form.paid ? 'lunas' : 'belum_bayar',
                    document_complete: Boolean(form.docs),
                    document_url: form.docUrl || '',
                  });
                }, 'Daftar ulang diproses')
              }
            >
              Simpan
            </Button>
          </div>
        </div>
      </Modal>

      {/* Enroll jadi mahasiswa */}
      <Modal open={action === 'enroll'} title={`Jadikan Mahasiswa — ${target?.name ?? ''}`} onClose={close}>
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            NIM, akun login (password = nomor pendaftaran), tagihan UKT semester 1, dan riwayat semester akan dibuat otomatis.
          </p>
          <Field label="Tahun Akademik Masuk">
            <select className={inputClass} value={String(form.year ?? '')} onChange={(e) => setForm({ ...form, year: e.target.value })}>
              <option value="">— pilih —</option>
              {years.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </Field>
          <Field label="Rombel/Kelas (opsional)">
            <select className={inputClass} value={String(form.classGroup ?? '')} onChange={(e) => setForm({ ...form, classGroup: e.target.value })}>
              <option value="">— pilih —</option>
              {classGroups.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </Field>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={close}>Batal</Button>
            <Button
              disabled={!form.year}
              onClick={() =>
                void run(async () => {
                  await createResource('/admission/enroll', {
                    applicant_id: target!.id,
                    academic_year_id: form.year,
                    class_group_id: form.classGroup || null,
                  });
                }, 'Pendaftar resmi menjadi mahasiswa 🎉')
              }
            >
              Proses
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
