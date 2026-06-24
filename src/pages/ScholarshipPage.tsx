import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Award, GraduationCap, Send } from 'lucide-react';
import ResourcePage from '../components/crud/ResourcePage';
import { useOptions } from '../hooks/useList';
import { createResource, errorMessage, listResource, patchResource } from '../api/crud';
import { downloadFile } from '../api/download';
import api from '../lib/axios';
import { Badge, Button, EmptyState, Field, Modal, formatDate, formatRupiah, inputClass } from '../components/ui';
import type { AcademicYear, ApiResponse, Scholarship, ScholarshipApplication } from '../types';

const toIso = (v: unknown) => (v ? new Date(String(v)).toISOString() : undefined);

const statusVariant: Record<string, string> = {
  diajukan: 'diajukan',
  diterima: 'lunas',
  ditolak: 'terlambat',
};

// Admin: kelola program beasiswa.
export function ScholarshipsPage() {
  const years = useOptions<AcademicYear>('/master/academic-years', (y) => `${y.name} ${y.semester}`);
  return (
    <ResourcePage<Scholarship>
      title="Program Beasiswa"
      endpoint="/scholarships"
      columns={[
        { key: 'name', label: 'Nama' },
        { key: 'provider', label: 'Penyedia' },
        { key: 'quota', label: 'Kuota' },
        { key: 'min_gpa', label: 'Min IPK', render: (s) => (s.min_gpa > 0 ? s.min_gpa.toFixed(2) : '-') },
        { key: 'amount_per_student', label: 'Nominal', render: (s) => formatRupiah(s.amount_per_student) },
        {
          key: 'close_date',
          label: 'Pendaftaran',
          render: (s) => `${formatDate(s.open_date)} – ${formatDate(s.close_date)}`,
        },
        { key: 'is_active', label: 'Status', render: (s) => <Badge value={s.is_active ? 'terdaftar' : 'keluar'} /> },
      ]}
      fields={[
        { name: 'name', label: 'Nama Program', type: 'text', required: true },
        { name: 'provider', label: 'Penyedia / Donatur', type: 'text' },
        { name: 'academic_year_id', label: 'Tahun Akademik (opsional)', type: 'select', options: years },
        { name: 'quota', label: 'Kuota Penerima', type: 'number', required: true },
        { name: 'amount_per_student', label: 'Nominal per Mahasiswa (Rp)', type: 'number' },
        { name: 'min_gpa', label: 'Syarat IPK Minimal (0 = bebas)', type: 'number' },
        { name: 'open_date', label: 'Pendaftaran Dibuka', type: 'date', required: true },
        { name: 'close_date', label: 'Pendaftaran Ditutup', type: 'date', required: true },
        { name: 'description', label: 'Deskripsi', type: 'textarea' },
        { name: 'requirements', label: 'Persyaratan', type: 'textarea' },
        { name: 'is_active', label: 'Aktif', type: 'checkbox' },
      ]}
      toForm={(s) => ({
        name: s.name,
        provider: s.provider,
        academic_year_id: s.academic_year_id ?? '',
        quota: s.quota,
        amount_per_student: s.amount_per_student,
        min_gpa: s.min_gpa,
        open_date: s.open_date?.slice(0, 10) ?? '',
        close_date: s.close_date?.slice(0, 10) ?? '',
        description: s.description,
        requirements: s.requirements,
        is_active: s.is_active,
      })}
      toPayload={(form) => ({
        ...form,
        academic_year_id: form.academic_year_id || null,
        open_date: toIso(form.open_date),
        close_date: toIso(form.close_date),
      })}
    />
  );
}

// Admin: seleksi pengajuan beasiswa (terima/tolak).
export function ScholarshipApplicationsPage() {
  const [apps, setApps] = useState<ScholarshipApplication[]>([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(false);
  const [reviewing, setReviewing] = useState<ScholarshipApplication | null>(null);
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  const refresh = async () => {
    setLoading(true);
    try {
      const res = await listResource<ScholarshipApplication>('/scholarships/applications', {
        status: statusFilter || undefined,
      });
      setApps(res.data ?? []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  const decide = async (app: ScholarshipApplication, status: 'diterima' | 'ditolak') => {
    setSaving(true);
    try {
      await patchResource(`/scholarships/applications/${app.id}/review`, { status, review_note: note });
      toast.success(status === 'diterima' ? 'Pengajuan diterima' : 'Pengajuan ditolak');
      setReviewing(null);
      setNote('');
      void refresh();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <h1 className="mb-4 flex items-center gap-2 text-xl font-semibold">
        <Award size={20} className="text-primary-600" /> Seleksi Beasiswa
      </h1>
      <div className="mb-3 flex gap-2 text-sm">
        {['', 'diajukan', 'diterima', 'ditolak'].map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`rounded-lg px-3 py-1.5 ${statusFilter === s ? 'bg-primary-600 text-white' : 'bg-slate-100 text-slate-600'}`}
          >
            {s === '' ? 'Semua' : s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-slate-500">
            <tr>
              <th className="px-4 py-3">Mahasiswa</th>
              <th className="px-4 py-3">Program</th>
              <th className="px-4 py-3">IPK</th>
              <th className="px-4 py-3">Alasan</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {apps.map((a) => (
              <tr key={a.id} className="border-t border-slate-100">
                <td className="px-4 py-3">{a.student_name}</td>
                <td className="px-4 py-3">{a.scholarship?.name ?? '-'}</td>
                <td className="px-4 py-3">{a.gpa.toFixed(2)}</td>
                <td className="max-w-xs truncate px-4 py-3 text-slate-500">{a.reason}</td>
                <td className="px-4 py-3"><Badge value={statusVariant[a.status] ?? a.status} /></td>
                <td className="px-4 py-3 text-right">
                  {a.status === 'diajukan' && (
                    <Button variant="secondary" onClick={() => { setReviewing(a); setNote(''); }}>Tinjau</Button>
                  )}
                  {a.status === 'diterima' && (
                    <Button variant="secondary" onClick={() => void downloadFile(`/scholarships/applications/${a.id}/decree/pdf`, `sk-beasiswa-${a.student_name}.pdf`)}>Unduh SK</Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!loading && apps.length === 0 && <EmptyState message="Belum ada pengajuan" />}
      </div>

      <Modal open={!!reviewing} title={`Tinjau Pengajuan — ${reviewing?.student_name ?? ''}`} onClose={() => setReviewing(null)}>
        {reviewing && (
          <div className="space-y-3">
            <div className="rounded-lg bg-slate-50 p-3 text-sm">
              <p><span className="text-slate-400">Program:</span> {reviewing.scholarship?.name}</p>
              <p><span className="text-slate-400">IPK:</span> {reviewing.gpa.toFixed(2)} · <span className="text-slate-400">Syarat min:</span> {reviewing.scholarship?.min_gpa?.toFixed(2) ?? '-'}</p>
              <p className="mt-1 whitespace-pre-line text-slate-600">{reviewing.reason}</p>
              {reviewing.document_url && (
                <a href={reviewing.document_url} target="_blank" rel="noreferrer" className="text-primary-600 underline">Lihat dokumen</a>
              )}
            </div>
            <Field label="Catatan (opsional)">
              <textarea className={inputClass} rows={2} value={note} onChange={(e) => setNote(e.target.value)} />
            </Field>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="danger" disabled={saving} onClick={() => void decide(reviewing, 'ditolak')}>Tolak</Button>
              <Button disabled={saving} onClick={() => void decide(reviewing, 'diterima')}>Terima</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

// Mahasiswa: program terbuka + ajukan + riwayat pengajuan.
export function MyScholarshipPage() {
  const [programs, setPrograms] = useState<Scholarship[]>([]);
  const [apps, setApps] = useState<ScholarshipApplication[]>([]);
  const [applying, setApplying] = useState<Scholarship | null>(null);
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);

  const load = () => {
    void api.get<ApiResponse<Scholarship[]>>('/scholarships/open').then((res) => setPrograms(res.data.data ?? [])).catch(() => setPrograms([]));
    void api.get<ApiResponse<ScholarshipApplication[]>>('/scholarships/my-applications').then((res) => setApps(res.data.data ?? [])).catch(() => setApps([]));
  };

  useEffect(load, []);

  const appliedIds = new Set(apps.map((a) => a.scholarship_id));

  const submit = async () => {
    if (!applying) return;
    setSaving(true);
    try {
      await createResource('/scholarships/apply', { scholarship_id: applying.id, reason });
      toast.success('Pengajuan beasiswa terkirim');
      setApplying(null);
      setReason('');
      load();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <h1 className="mb-4 flex items-center gap-2 text-xl font-semibold">
        <GraduationCap size={20} className="text-primary-600" /> Beasiswa
      </h1>

      <h2 className="mb-2 text-sm font-semibold text-slate-500">Program Tersedia</h2>
      <div className="mb-6 grid gap-3 sm:grid-cols-2">
        {programs.length === 0 && <EmptyState message="Belum ada program beasiswa terbuka" />}
        {programs.map((s) => {
          const applied = appliedIds.has(s.id);
          return (
            <div key={s.id} className="rounded-xl border border-slate-200 bg-white p-4">
              <div className="mb-1 flex items-start justify-between gap-2">
                <h3 className="font-semibold leading-tight">{s.name}</h3>
                <span className="shrink-0 text-sm font-semibold text-primary-600">{formatRupiah(s.amount_per_student)}</span>
              </div>
              <p className="text-xs text-slate-400">{s.provider}</p>
              {s.description && <p className="mt-2 text-sm text-slate-600">{s.description}</p>}
              <p className="mt-2 text-xs text-slate-400">
                Kuota {s.quota} · {s.min_gpa > 0 ? `min IPK ${s.min_gpa.toFixed(2)}` : 'tanpa syarat IPK'} · tutup {formatDate(s.close_date)}
              </p>
              <div className="mt-3">
                {applied ? (
                  <Badge value="diajukan" />
                ) : (
                  <Button onClick={() => { setApplying(s); setReason(''); }}>
                    <Send size={14} className="mr-1 inline" /> Ajukan
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <h2 className="mb-2 text-sm font-semibold text-slate-500">Pengajuan Saya</h2>
      <div className="space-y-2">
        {apps.length === 0 && <EmptyState message="Belum ada pengajuan" />}
        {apps.map((a) => (
          <div key={a.id} className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4">
            <div>
              <p className="font-medium">{a.scholarship?.name ?? '-'}</p>
              {a.review_note && <p className="text-xs text-slate-400">Catatan: {a.review_note}</p>}
            </div>
            <Badge value={statusVariant[a.status] ?? a.status} />
          </div>
        ))}
      </div>

      <Modal open={!!applying} title={`Ajukan — ${applying?.name ?? ''}`} onClose={() => setApplying(null)}>
        {applying && (
          <div className="space-y-3">
            {applying.requirements && (
              <div className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
                <p className="font-medium">Persyaratan:</p>
                <p className="whitespace-pre-line">{applying.requirements}</p>
              </div>
            )}
            <Field label="Alasan / Motivasi">
              <textarea className={inputClass} rows={4} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Jelaskan alasan Anda mengajukan beasiswa ini" />
            </Field>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="secondary" onClick={() => setApplying(null)}>Batal</Button>
              <Button disabled={!reason || saving} onClick={() => void submit()}>Kirim Pengajuan</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
