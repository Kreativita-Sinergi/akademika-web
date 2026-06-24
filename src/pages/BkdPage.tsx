import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { BookCheck, Plus, Trash2 } from 'lucide-react';
import { useOptions } from '../hooks/useList';
import { createResource, deleteResource, errorMessage, listResource, patchResource } from '../api/crud';
import { Badge, Button, EmptyState, Field, Modal, inputClass } from '../components/ui';
import type { AcademicYear, BkdItem, BkdReport } from '../types';

const categoryOptions = [
  { value: 'pendidikan', label: 'Pendidikan & Pengajaran' },
  { value: 'penelitian', label: 'Penelitian' },
  { value: 'pengabdian', label: 'Pengabdian Masyarakat' },
  { value: 'penunjang', label: 'Penunjang' },
];

const catLabel: Record<string, string> = Object.fromEntries(categoryOptions.map((o) => [o.value, o.label]));

const statusVariant: Record<string, string> = {
  draft: 'menunggu',
  diajukan: 'diajukan',
  disetujui: 'lunas',
  ditolak: 'terlambat',
};

const itemsSks = (r: BkdReport) => (r.items ?? []).reduce((a, b) => a + b.sks, 0);

// Dosen: laporan Beban Kerja Dosen (Tridharma) per tahun akademik.
export function MyBkdPage() {
  const years = useOptions<AcademicYear>('/master/academic-years', (y) => `${y.name} ${y.semester}`);
  const [yearId, setYearId] = useState('');
  const [report, setReport] = useState<BkdReport | null>(null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ category: 'penelitian', description: '', sks: 0, evidence_url: '' });

  const ensure = (yId: string) => {
    if (!yId) return;
    void createResource<BkdReport>('/bkd/ensure', { academic_year_id: yId }).then(setReport).catch(() => setReport(null));
  };
  useEffect(() => ensure(yearId), [yearId]);

  const editable = report && (report.status === 'draft' || report.status === 'ditolak');

  const addItem = async () => {
    if (!report) return;
    try {
      await createResource(`/bkd/${report.id}/items`, form);
      toast.success('Butir ditambahkan');
      setOpen(false);
      setForm({ category: 'penelitian', description: '', sks: 0, evidence_url: '' });
      ensure(yearId);
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };

  const removeItem = async (item: BkdItem) => {
    try {
      await deleteResource(`/bkd/items/${item.id}`);
      ensure(yearId);
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };

  const submit = async () => {
    if (!report) return;
    try {
      await patchResource(`/bkd/${report.id}/submit`, {});
      toast.success('BKD diajukan');
      ensure(yearId);
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };

  return (
    <div>
      <h1 className="mb-4 flex items-center gap-2 text-xl font-semibold">
        <BookCheck size={20} className="text-primary-600" /> Beban Kerja Dosen (BKD)
      </h1>

      <div className="mb-4 max-w-xs">
        <select className={inputClass} value={yearId} onChange={(e) => setYearId(e.target.value)}>
          <option value="">— pilih tahun akademik —</option>
          {years.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>

      {!report && <EmptyState message="Pilih tahun akademik untuk menyiapkan laporan BKD" />}

      {report && (
        <>
          <div className="mb-4 grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <p className="text-sm text-slate-500">Beban Mengajar (otomatis)</p>
              <p className="text-2xl font-bold">{report.teaching_sks} SKS</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <p className="text-sm text-slate-500">SKS Tridharma Lain</p>
              <p className="text-2xl font-bold">{itemsSks(report)} SKS</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <p className="text-sm text-slate-500">Status</p>
              <div className="mt-1"><Badge value={statusVariant[report.status] ?? report.status} /></div>
            </div>
          </div>

          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-semibold">Butir Kegiatan Tridharma</h2>
            {editable && <Button onClick={() => setOpen(true)}><Plus size={15} className="mr-1 inline" /> Tambah Butir</Button>}
          </div>
          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
                <tr><th className="px-4 py-3">Kategori</th><th className="px-4 py-3">Deskripsi</th><th className="px-4 py-3">SKS</th><th className="px-4 py-3"></th></tr>
              </thead>
              <tbody>
                {(report.items ?? []).map((it) => (
                  <tr key={it.id} className="border-t border-slate-100">
                    <td className="px-4 py-3">{catLabel[it.category] ?? it.category}</td>
                    <td className="px-4 py-3">{it.description}</td>
                    <td className="px-4 py-3">{it.sks}</td>
                    <td className="px-4 py-3 text-right">
                      {editable && (
                        <button onClick={() => void removeItem(it)} className="rounded p-1.5 text-red-500 hover:bg-red-50"><Trash2 size={15} /></button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {(report.items ?? []).length === 0 && <EmptyState message="Belum ada butir kegiatan" />}
          </div>

          {report.review_note && <p className="mt-3 text-sm text-slate-500">Catatan penilai: {report.review_note}</p>}
          {editable && (
            <div className="mt-4 flex justify-end">
              <Button onClick={() => void submit()}>Ajukan BKD</Button>
            </div>
          )}
        </>
      )}

      <Modal open={open} title="Tambah Butir Tridharma" onClose={() => setOpen(false)}>
        <div className="space-y-3">
          <Field label="Kategori">
            <select className={inputClass} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
              {categoryOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </Field>
          <Field label="Deskripsi Kegiatan"><textarea className={inputClass} rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></Field>
          <Field label="Bobot SKS"><input type="number" step="0.5" className={inputClass} value={form.sks} onChange={(e) => setForm({ ...form, sks: Number(e.target.value) })} /></Field>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setOpen(false)}>Batal</Button>
            <Button disabled={!form.description} onClick={() => void addItem()}>Tambah</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

// Admin: tinjau & sahkan laporan BKD dosen.
export function BkdReviewPage() {
  const [reports, setReports] = useState<BkdReport[]>([]);
  const [statusFilter, setStatusFilter] = useState('diajukan');
  const [reviewing, setReviewing] = useState<BkdReport | null>(null);
  const [note, setNote] = useState('');

  const refresh = async () => {
    const res = await listResource<BkdReport>('/bkd', { status: statusFilter || undefined });
    setReports(res.data ?? []);
  };
  useEffect(() => {
    void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  const decide = async (status: 'disetujui' | 'ditolak') => {
    if (!reviewing) return;
    try {
      await patchResource(`/bkd/${reviewing.id}/review`, { status, review_note: note });
      toast.success(status === 'disetujui' ? 'BKD disahkan' : 'BKD ditolak');
      setReviewing(null);
      void refresh();
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };

  return (
    <div>
      <h1 className="mb-4 flex items-center gap-2 text-xl font-semibold">
        <BookCheck size={20} className="text-primary-600" /> Pengesahan BKD
      </h1>
      <div className="mb-3 flex gap-2 text-sm">
        {['diajukan', 'disetujui', 'ditolak', ''].map((s) => (
          <button key={s} onClick={() => setStatusFilter(s)}
            className={`rounded-lg px-3 py-1.5 ${statusFilter === s ? 'bg-primary-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
            {s === '' ? 'Semua' : s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
            <tr><th className="px-4 py-3">Dosen</th><th className="px-4 py-3">Tahun</th><th className="px-4 py-3">SKS Ajar</th><th className="px-4 py-3">SKS Lain</th><th className="px-4 py-3">Status</th><th className="px-4 py-3"></th></tr>
          </thead>
          <tbody>
            {reports.map((r) => (
              <tr key={r.id} className="border-t border-slate-100">
                <td className="px-4 py-3">{r.lecturer?.name ?? '-'}</td>
                <td className="px-4 py-3">{r.academic_year?.name} {r.academic_year?.semester}</td>
                <td className="px-4 py-3">{r.teaching_sks}</td>
                <td className="px-4 py-3">{itemsSks(r)}</td>
                <td className="px-4 py-3"><Badge value={statusVariant[r.status] ?? r.status} /></td>
                <td className="px-4 py-3 text-right">
                  {r.status === 'diajukan' && <Button variant="secondary" onClick={() => { setReviewing(r); setNote(''); }}>Tinjau</Button>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {reports.length === 0 && <EmptyState message="Tidak ada laporan" />}
      </div>

      <Modal open={!!reviewing} title={`Tinjau BKD — ${reviewing?.lecturer?.name ?? ''}`} onClose={() => setReviewing(null)} wide>
        {reviewing && (
          <div className="space-y-3">
            <div className="rounded-lg bg-slate-50 p-3 text-sm">
              <p>Beban mengajar: <b>{reviewing.teaching_sks} SKS</b> · Tridharma lain: <b>{itemsSks(reviewing)} SKS</b></p>
            </div>
            <div className="space-y-1">
              {(reviewing.items ?? []).map((it) => (
                <div key={it.id} className="flex justify-between rounded border border-slate-100 px-3 py-2 text-sm">
                  <span>{catLabel[it.category] ?? it.category}: {it.description}</span>
                  <span className="font-medium">{it.sks} SKS</span>
                </div>
              ))}
            </div>
            <Field label="Catatan"><input className={inputClass} value={note} onChange={(e) => setNote(e.target.value)} /></Field>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="danger" onClick={() => void decide('ditolak')}>Tolak</Button>
              <Button onClick={() => void decide('disetujui')}>Sahkan</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
