import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Check, Download, FilePlus, Plus, Trash2 } from 'lucide-react';
import { useOptions } from '../hooks/useList';
import api from '../lib/axios';
import { createResource, deleteResource, patchResource, errorMessage, listResource } from '../api/crud';
import { downloadFile } from '../api/download';
import { Badge, Button, Field, Modal, inputClass, formatDate } from '../components/ui';
import { DataTable, type Column, type ListParams } from '@/components/ui/data-table';
import { Textarea } from '@/components/ui/textarea';
import { Combobox } from '@/components/ui/combobox';
import type { ApiResponse, Skpi, Student, Yudisium } from '../types';

// ── Yudisium ─────────────────────────────────────────────────────────────────
export function YudisiumPage() {
  const [reloadKey, setReloadKey] = useState(0);
  const reload = () => setReloadKey((k) => k + 1);
  const fetcher = useCallback((p: ListParams) => listResource<Yudisium>('/yudisium', p), []);
  const students = useOptions<Student>('/students', (s) => `${s.nim} — ${s.name}`);
  const [proposeOpen, setProposeOpen] = useState(false);
  const [studentId, setStudentId] = useState('');
  const [approve, setApprove] = useState<Yudisium | null>(null);
  const [form, setForm] = useState({ number: '', decree_number: '', date: '', note: '' });

  const propose = async () => {
    if (!studentId) return;
    try {
      await createResource('/yudisium', { student_id: studentId });
      toast.success('Yudisium diajukan');
      setProposeOpen(false);
      setStudentId('');
      reload();
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };

  const doApprove = async () => {
    if (!approve) return;
    if (!form.number.trim()) {
      toast.error('Nomor yudisium wajib diisi');
      return;
    }
    try {
      await patchResource(`/yudisium/${approve.id}/approve`, {
        ...form,
        date: form.date ? new Date(form.date).toISOString() : undefined,
      });
      toast.success('Yudisium disahkan');
      setApprove(null);
      reload();
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };

  const remove = async (y: Yudisium) => {
    if (!confirm('Hapus data yudisium ini?')) return;
    try {
      await deleteResource(`/yudisium/${y.id}`);
      reload();
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };

  const columns: Column<Yudisium>[] = [
    {
      title: 'Mahasiswa',
      key: 'mhs',
      render: (_, y) => (
        <div>
          {y.student?.name ?? '-'}
          <div className="text-xs text-muted-foreground">{y.student?.nim}</div>
        </div>
      ),
    },
    { title: 'IPK', key: 'ipk', className: 'font-semibold text-primary', render: (_, y) => y.ipk.toFixed(2) },
    { title: 'Predikat', key: 'predicate', className: 'capitalize', render: (_, y) => y.predicate },
    { title: 'No. Yudisium', key: 'number', render: (_, y) => y.number || '-' },
    { title: 'Status', key: 'status', render: (_, y) => <Badge value={y.status === 'disahkan' ? 'lulus' : 'diajukan'} /> },
    {
      title: 'Aksi',
      key: 'act',
      align: 'right',
      render: (_, y) => (
        <div className="flex items-center justify-end gap-1">
          {y.status !== 'disahkan' && (
            <Button variant="ghost" size="icon" className="h-8 w-8 text-emerald-600 hover:text-emerald-600" title="Sahkan" onClick={() => { setApprove(y); setForm({ number: '', decree_number: '', date: '', note: '' }); }}>
              <Check className="h-4 w-4" />
            </Button>
          )}
          {y.status === 'disahkan' && (
            <Button variant="ghost" size="icon" className="h-8 w-8 text-primary hover:text-primary" title="Unduh PDF" onClick={() => void downloadFile(`/yudisium/${y.id}/pdf`, `yudisium-${y.student?.nim ?? y.id}.pdf`)}>
              <Download className="h-4 w-4" />
            </Button>
          )}
          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" title="Hapus" onClick={() => void remove(y)}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-bold tracking-tight">Yudisium</h1>
        <Button onClick={() => setProposeOpen(true)}>
          <span className="flex items-center gap-1"><Plus size={16} /> Ajukan Yudisium</span>
        </Button>
      </div>

      <DataTable<Yudisium> fetcher={fetcher} columns={columns} rowKey={(y) => y.id} reloadKey={reloadKey} searchable searchPlaceholder="Cari mahasiswa..." emptyText="Belum ada data yudisium" />

      <Modal open={proposeOpen} title="Ajukan Yudisium" onClose={() => setProposeOpen(false)}>
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">Syarat otomatis diperiksa: tugas akhir lulus & UKT lunas. IPK & predikat dihitung sistem.</p>
          <Field label="Mahasiswa">
            <Combobox options={students} value={studentId} onChange={setStudentId} allowClear placeholder="— pilih —" />
          </Field>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setProposeOpen(false)}>Batal</Button>
            <Button disabled={!studentId} onClick={() => void propose()}>Ajukan</Button>
          </div>
        </div>
      </Modal>

      <Modal open={Boolean(approve)} title="Sahkan Yudisium" onClose={() => setApprove(null)}>
        <div className="space-y-3">
          <Field label="Nomor Yudisium"><input className={inputClass} value={form.number} onChange={(e) => setForm({ ...form, number: e.target.value })} /></Field>
          <Field label="Nomor SK (opsional)"><input className={inputClass} value={form.decree_number} onChange={(e) => setForm({ ...form, decree_number: e.target.value })} /></Field>
          <Field label="Tanggal"><input type="date" className={inputClass} value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></Field>
          <Field label="Catatan (opsional)"><Textarea rows={2} value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} /></Field>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setApprove(null)}>Batal</Button>
            <Button onClick={() => void doApprove()}>Sahkan</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

// ── SKPI ─────────────────────────────────────────────────────────────────────
const categoryOptions = [
  { value: 'penghargaan', label: 'Penghargaan' },
  { value: 'organisasi', label: 'Organisasi' },
  { value: 'pelatihan', label: 'Pelatihan' },
  { value: 'sertifikasi', label: 'Sertifikasi' },
  { value: 'lainnya', label: 'Lainnya' },
];

export function SkpiPage() {
  const [reloadKey, setReloadKey] = useState(0);
  const reload = () => setReloadKey((k) => k + 1);
  const fetcher = useCallback((p: ListParams) => listResource<Skpi>('/skpi', p), []);
  const students = useOptions<Student>('/students', (s) => `${s.nim} — ${s.name}`);
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({ student_id: '', number: '', issued_date: '' });
  const [detail, setDetail] = useState<Skpi | null>(null);

  const save = async () => {
    if (!form.student_id) return;
    try {
      await createResource('/skpi', {
        ...form,
        issued_date: form.issued_date ? new Date(form.issued_date).toISOString() : undefined,
      });
      toast.success('SKPI tersimpan');
      setCreateOpen(false);
      setForm({ student_id: '', number: '', issued_date: '' });
      reload();
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };

  const remove = async (sk: Skpi) => {
    if (!confirm('Hapus SKPI ini?')) return;
    try {
      await deleteResource(`/skpi/${sk.id}`);
      reload();
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };

  const columns: Column<Skpi>[] = [
    {
      title: 'Mahasiswa',
      key: 'mhs',
      render: (_, sk) => (
        <div>
          {sk.student?.name ?? '-'}
          <div className="text-xs text-muted-foreground">{sk.student?.nim}</div>
        </div>
      ),
    },
    { title: 'No. SKPI', key: 'number', render: (_, sk) => sk.number || '-' },
    { title: 'Capaian', key: 'capaian', render: (_, sk) => `${sk.activities?.length ?? 0} item` },
    { title: 'Terbit', key: 'issued', render: (_, sk) => formatDate(sk.issued_date) },
    {
      title: 'Aksi',
      key: 'act',
      align: 'right',
      render: (_, sk) => (
        <div className="flex items-center justify-end gap-1">
          <Button variant="secondary" onClick={() => setDetail(sk)}>Capaian</Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-primary hover:text-primary" title="Unduh PDF" onClick={() => void downloadFile(`/skpi/${sk.id}/pdf`, `skpi-${sk.student?.nim ?? sk.id}.pdf`)}>
            <Download className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" title="Hapus" onClick={() => void remove(sk)}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-bold tracking-tight">SKPI (Surat Keterangan Pendamping Ijazah)</h1>
        <Button onClick={() => setCreateOpen(true)}>
          <span className="flex items-center gap-1"><FilePlus size={16} /> Buat SKPI</span>
        </Button>
      </div>

      <DataTable<Skpi> fetcher={fetcher} columns={columns} rowKey={(sk) => sk.id} reloadKey={reloadKey} searchable searchPlaceholder="Cari mahasiswa..." emptyText="Belum ada SKPI" />

      <Modal open={createOpen} title="Buat / Perbarui SKPI" onClose={() => setCreateOpen(false)}>
        <div className="space-y-3">
          <Field label="Mahasiswa">
            <Combobox options={students} value={form.student_id} onChange={(v) => setForm({ ...form, student_id: v })} allowClear placeholder="— pilih —" />
          </Field>
          <Field label="Nomor SKPI"><input className={inputClass} value={form.number} onChange={(e) => setForm({ ...form, number: e.target.value })} /></Field>
          <Field label="Tanggal Terbit"><input type="date" className={inputClass} value={form.issued_date} onChange={(e) => setForm({ ...form, issued_date: e.target.value })} /></Field>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setCreateOpen(false)}>Batal</Button>
            <Button disabled={!form.student_id} onClick={() => void save()}>Simpan</Button>
          </div>
        </div>
      </Modal>

      {detail && <ActivitiesModal skpi={detail} onClose={() => setDetail(null)} />}
    </div>
  );
}

function ActivitiesModal({ skpi, onClose }: { skpi: Skpi; onClose: () => void }) {
  const [data, setData] = useState<Skpi>(skpi);
  const [form, setForm] = useState({ category: 'sertifikasi', title: '', organizer: '', year: '', level: '', description: '' });

  const reload = () => {
    void api.get<ApiResponse<Skpi>>(`/skpi/${skpi.id}`).then((res) => setData(res.data.data));
  };

  useEffect(reload, [skpi.id]);

  const add = async () => {
    if (!form.title.trim()) {
      toast.error('Judul capaian wajib diisi');
      return;
    }
    try {
      await createResource(`/skpi/${skpi.id}/activities`, { ...form, year: Number(form.year) || 0 });
      setForm({ category: 'sertifikasi', title: '', organizer: '', year: '', level: '', description: '' });
      reload();
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };

  const remove = async (id: string) => {
    try {
      await deleteResource(`/skpi/activities/${id}`);
      reload();
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };

  return (
    <Modal open title={`Capaian SKPI — ${data.student?.name ?? ''}`} onClose={onClose} wide>
      <div className="space-y-2">
        {(data.activities ?? []).map((a) => (
          <div key={a.id} className="flex items-start justify-between rounded-lg border border-border p-2.5">
            <div className="text-sm">
              <div className="font-medium">{a.title}</div>
              <div className="text-xs text-muted-foreground capitalize">
                {a.category}{a.organizer ? ` · ${a.organizer}` : ''}{a.level ? ` · ${a.level}` : ''}{a.year ? ` · ${a.year}` : ''}
              </div>
            </div>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => void remove(a.id)}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
        {(data.activities ?? []).length === 0 && <div className="py-3 text-center text-sm text-muted-foreground">Belum ada capaian</div>}
      </div>

      <div className="mt-4 rounded-lg border border-border p-3">
        <div className="mb-2 text-sm font-medium">Tambah Capaian</div>
        <div className="grid gap-2 sm:grid-cols-2">
          <Field label="Kategori">
            <select className={inputClass} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
              {categoryOptions.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </Field>
          <Field label="Judul / Nama Kegiatan"><input className={inputClass} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></Field>
          <Field label="Penyelenggara"><input className={inputClass} value={form.organizer} onChange={(e) => setForm({ ...form, organizer: e.target.value })} /></Field>
          <Field label="Tingkat (lokal/nasional/dll)"><input className={inputClass} value={form.level} onChange={(e) => setForm({ ...form, level: e.target.value })} /></Field>
          <Field label="Tahun"><input className={inputClass} value={form.year} onChange={(e) => setForm({ ...form, year: e.target.value })} /></Field>
        </div>
        <div className="mt-2 flex justify-end">
          <Button onClick={() => void add()}>
            <span className="flex items-center gap-1.5"><Plus size={14} /> Tambah</span>
          </Button>
        </div>
      </div>
    </Modal>
  );
}
