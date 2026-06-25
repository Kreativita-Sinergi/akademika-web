import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Award, Users } from 'lucide-react';
import ResourcePage from '../components/crud/ResourcePage';
import { useOptions } from '../hooks/useList';
import { createResource, errorMessage, listResource, patchResource } from '../api/crud';
import api from '../lib/axios';
import { Badge, Button, EmptyState, Field, Modal, formatDate, inputClass } from '../components/ui';
import { DataTable, type Column } from '@/components/ui/data-table';
import { Segmented } from '@/components/ui/segmented';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Combobox } from '@/components/ui/combobox';
import type { ApiResponse, Lecturer, StudentActivity, StudentOrganization } from '../types';

const typeOptions = [
  { value: 'bem', label: 'BEM' },
  { value: 'dpm', label: 'DPM' },
  { value: 'hmj', label: 'Himpunan (HMJ/HMP)' },
  { value: 'ukm', label: 'UKM' },
  { value: 'lainnya', label: 'Lainnya' },
];

const categoryOptions = [
  { value: 'kepanitiaan', label: 'Kepanitiaan' },
  { value: 'kompetisi', label: 'Kompetisi/Lomba' },
  { value: 'seminar', label: 'Seminar/Workshop' },
  { value: 'pengabdian', label: 'Pengabdian Masyarakat' },
  { value: 'organisasi', label: 'Organisasi' },
  { value: 'lainnya', label: 'Lainnya' },
];

const levelOptions = [
  { value: 'prodi', label: 'Prodi' },
  { value: 'fakultas', label: 'Fakultas' },
  { value: 'universitas', label: 'Universitas' },
  { value: 'nasional', label: 'Nasional' },
  { value: 'internasional', label: 'Internasional' },
];

const actStatusVariant: Record<string, string> = {
  diajukan: 'diajukan',
  terverifikasi: 'lunas',
  ditolak: 'terlambat',
};

// Admin: kelola organisasi kemahasiswaan.
export function OrganizationsPage() {
  const lecturers = useOptions<Lecturer>('/lecturers', (l) => l.name);
  return (
    <ResourcePage<StudentOrganization>
      title="Organisasi Kemahasiswaan"
      endpoint="/organizations"
      columns={[
        { key: 'name', label: 'Nama' },
        { key: 'type', label: 'Jenis', render: (o) => o.type.toUpperCase() },
        { key: 'period', label: 'Periode' },
        { key: 'advisor', label: 'Pembina', render: (o) => o.advisor?.name ?? '-' },
        { key: 'is_active', label: 'Status', render: (o) => <Badge value={o.is_active ? 'terdaftar' : 'keluar'} /> },
      ]}
      fields={[
        { name: 'name', label: 'Nama Organisasi', type: 'text', required: true },
        { name: 'type', label: 'Jenis', type: 'select', options: typeOptions, required: true },
        { name: 'period', label: 'Periode (cth: 2025/2026)', type: 'text' },
        { name: 'advisor_lecturer_id', label: 'Dosen Pembina', type: 'select', options: lecturers },
        { name: 'description', label: 'Deskripsi', type: 'textarea' },
        { name: 'is_active', label: 'Aktif', type: 'checkbox' },
      ]}
      toForm={(o) => ({
        name: o.name,
        type: o.type,
        period: o.period,
        advisor_lecturer_id: o.advisor_lecturer_id ?? '',
        description: o.description,
        is_active: o.is_active,
      })}
      toPayload={(form) => ({ ...form, advisor_lecturer_id: form.advisor_lecturer_id || null })}
    />
  );
}

const categoryLabel: Record<string, string> = Object.fromEntries(categoryOptions.map((o) => [o.value, o.label]));

// Admin: verifikasi kegiatan mahasiswa & tetapkan poin SKPI.
export function ActivitiesReviewPage() {
  const [items, setItems] = useState<StudentActivity[]>([]);
  const [statusFilter, setStatusFilter] = useState('diajukan');
  const [loading, setLoading] = useState(false);
  const [reviewing, setReviewing] = useState<StudentActivity | null>(null);
  const [points, setPoints] = useState(0);
  const [note, setNote] = useState('');

  const refresh = async () => {
    setLoading(true);
    try {
      const res = await listResource<StudentActivity>('/activities', { status: statusFilter || undefined });
      setItems(res.data ?? []);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  const decide = async (status: 'terverifikasi' | 'ditolak') => {
    if (!reviewing) return;
    try {
      await patchResource(`/activities/${reviewing.id}/verify`, { status, points, verify_note: note });
      toast.success(status === 'terverifikasi' ? 'Kegiatan diverifikasi' : 'Kegiatan ditolak');
      setReviewing(null);
      void refresh();
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };

  const columns: Column<StudentActivity>[] = [
    { title: 'Mahasiswa', key: 'mhs', render: (_, a) => a.student_name },
    { title: 'Kegiatan', key: 'title', render: (_, a) => a.title },
    { title: 'Kategori', key: 'cat', render: (_, a) => categoryLabel[a.category] ?? a.category },
    { title: 'Tingkat', key: 'level', className: 'capitalize', render: (_, a) => a.level },
    { title: 'Poin', key: 'points', render: (_, a) => a.points },
    { title: 'Status', key: 'status', render: (_, a) => <Badge value={actStatusVariant[a.status] ?? a.status} /> },
    {
      title: '',
      key: 'act',
      align: 'right',
      render: (_, a) =>
        a.status === 'diajukan' ? (
          <Button variant="secondary" onClick={() => { setReviewing(a); setPoints(a.points); setNote(''); }}>Verifikasi</Button>
        ) : null,
    },
  ];

  return (
    <div>
      <h1 className="mb-4 flex items-center gap-2 text-xl font-bold tracking-tight">
        <Award size={20} className="text-primary" /> Verifikasi Kegiatan (SKPI)
      </h1>
      <div className="mb-3">
        <Segmented
          value={statusFilter}
          onChange={setStatusFilter}
          options={[
            { value: 'diajukan', label: 'Diajukan' },
            { value: 'terverifikasi', label: 'Terverifikasi' },
            { value: 'ditolak', label: 'Ditolak' },
            { value: '', label: 'Semua' },
          ]}
        />
      </div>

      <DataTable<StudentActivity> columns={columns} rowKey={(a) => a.id} data={items} loading={loading} emptyText="Tidak ada kegiatan" />

      <Modal open={!!reviewing} title={`Verifikasi — ${reviewing?.title ?? ''}`} onClose={() => setReviewing(null)}>
        {reviewing && (
          <div className="space-y-3">
            <div className="rounded-lg bg-muted p-3 text-sm">
              <p>{reviewing.student_name} · {reviewing.role} · <span className="capitalize">{reviewing.level}</span></p>
              <p className="text-muted-foreground">{formatDate(reviewing.date)}</p>
              {reviewing.certificate_url && <a href={reviewing.certificate_url} target="_blank" rel="noreferrer" className="text-primary underline">Lihat sertifikat</a>}
            </div>
            <Field label="Poin SKPI"><Input type="number" value={points} onChange={(e) => setPoints(Number(e.target.value))} /></Field>
            <Field label="Catatan"><Input value={note} onChange={(e) => setNote(e.target.value)} /></Field>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="danger" onClick={() => void decide('ditolak')}>Tolak</Button>
              <Button onClick={() => void decide('terverifikasi')}>Verifikasi</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

// Mahasiswa: ajukan kegiatan & lihat poin SKPI terkumpul.
export function MyActivitiesPage() {
  const [items, setItems] = useState<StudentActivity[]>([]);
  const [points, setPoints] = useState(0);
  const [open, setOpen] = useState(false);
  const orgs = useOptions<StudentOrganization>('/organizations', (o) => o.name);
  const [form, setForm] = useState({ title: '', category: 'kepanitiaan', role: '', level: 'prodi', date: '', organization_id: '', certificate_url: '' });

  const load = () => {
    void api.get<ApiResponse<{ items: StudentActivity[]; total_points: number }>>('/activities/mine').then((res) => {
      setItems(res.data.data.items ?? []);
      setPoints(res.data.data.total_points ?? 0);
    });
  };
  useEffect(load, []);

  const submit = async () => {
    try {
      await createResource('/activities', {
        ...form,
        organization_id: form.organization_id || null,
        date: form.date ? new Date(form.date).toISOString() : undefined,
        points: 0,
      });
      toast.success('Kegiatan diajukan');
      setOpen(false);
      setForm({ title: '', category: 'kepanitiaan', role: '', level: 'prodi', date: '', organization_id: '', certificate_url: '' });
      load();
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="flex items-center gap-2 text-xl font-bold tracking-tight"><Users size={20} className="text-primary" /> Kegiatan & SKPI</h1>
        <Button onClick={() => setOpen(true)}>Ajukan Kegiatan</Button>
      </div>
      <div className="mb-4 rounded-2xl border border-primary/15 bg-primary/5 p-4">
        <p className="text-sm text-primary">Total Poin SKPI Terverifikasi</p>
        <p className="text-3xl font-bold text-primary">{points}</p>
      </div>
      <div className="space-y-2">
        {items.length === 0 && <EmptyState message="Belum ada kegiatan" />}
        {items.map((a) => (
          <Card key={a.id}>
            <CardContent className="flex items-center justify-between p-4">
              <div>
                <p className="font-medium">{a.title}</p>
                <p className="text-xs text-muted-foreground">{categoryLabel[a.category] ?? a.category} · <span className="capitalize">{a.level}</span> · {formatDate(a.date)}</p>
                {a.verify_note && <p className="text-xs text-muted-foreground">Catatan: {a.verify_note}</p>}
              </div>
              <div className="text-right">
                <Badge value={actStatusVariant[a.status] ?? a.status} />
                <p className="mt-1 text-sm font-semibold text-primary">{a.points} poin</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Modal open={open} title="Ajukan Kegiatan" onClose={() => setOpen(false)}>
        <div className="space-y-3">
          <Field label="Judul Kegiatan"><input className={inputClass} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></Field>
          <Field label="Kategori">
            <select className={inputClass} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
              {categoryOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </Field>
          <Field label="Peran (cth: Ketua/Peserta/Juara 1)"><input className={inputClass} value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} /></Field>
          <Field label="Tingkat">
            <select className={inputClass} value={form.level} onChange={(e) => setForm({ ...form, level: e.target.value })}>
              {levelOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </Field>
          <Field label="Organisasi (opsional)">
            <Combobox options={orgs} value={form.organization_id} onChange={(v) => setForm({ ...form, organization_id: v })} allowClear placeholder="— tidak terkait —" />
          </Field>
          <Field label="Tanggal"><input type="date" className={inputClass} value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></Field>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setOpen(false)}>Batal</Button>
            <Button disabled={!form.title || !form.date} onClick={() => void submit()}>Ajukan</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
