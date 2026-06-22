import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Check, Download, FilePlus, Plus, Trash2 } from 'lucide-react';
import { useList, useOptions } from '../hooks/useList';
import api from '../lib/axios';
import { createResource, deleteResource, patchResource, errorMessage } from '../api/crud';
import { downloadFile } from '../api/download';
import { Badge, Button, EmptyState, Field, Modal, Pagination, inputClass, formatDate } from '../components/ui';
import type { ApiResponse, Skpi, Student, Yudisium } from '../types';

// ── Yudisium ─────────────────────────────────────────────────────────────────
export function YudisiumPage() {
  const { items, page, setPage, totalPage, loading, refresh } = useList<Yudisium>('/yudisium');
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
      void refresh();
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
      void refresh();
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };

  const remove = async (y: Yudisium) => {
    if (!confirm('Hapus data yudisium ini?')) return;
    try {
      await deleteResource(`/yudisium/${y.id}`);
      void refresh();
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Yudisium</h1>
        <Button onClick={() => setProposeOpen(true)}>
          <span className="flex items-center gap-1"><Plus size={16} /> Ajukan Yudisium</span>
        </Button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase text-slate-500">
              <th className="px-4 py-3 font-medium">Mahasiswa</th>
              <th className="px-4 py-3 font-medium">IPK</th>
              <th className="px-4 py-3 font-medium">Predikat</th>
              <th className="px-4 py-3 font-medium">No. Yudisium</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 text-right font-medium">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {items.map((y) => (
              <tr key={y.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                <td className="px-4 py-3">
                  {y.student?.name ?? '-'}
                  <div className="text-xs text-slate-400">{y.student?.nim}</div>
                </td>
                <td className="px-4 py-3 font-semibold text-primary-600">{y.ipk.toFixed(2)}</td>
                <td className="px-4 py-3 capitalize">{y.predicate}</td>
                <td className="px-4 py-3">{y.number || '-'}</td>
                <td className="px-4 py-3"><Badge value={y.status === 'disahkan' ? 'lulus' : 'diajukan'} /></td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1">
                    {y.status !== 'disahkan' && (
                      <button onClick={() => { setApprove(y); setForm({ number: '', decree_number: '', date: '', note: '' }); }} className="rounded p-1.5 text-emerald-600 hover:bg-emerald-50" title="Sahkan">
                        <Check size={15} />
                      </button>
                    )}
                    {y.status === 'disahkan' && (
                      <button onClick={() => void downloadFile(`/yudisium/${y.id}/pdf`, `yudisium-${y.student?.nim ?? y.id}.pdf`)} className="rounded p-1.5 text-primary-600 hover:bg-primary-50" title="Unduh PDF">
                        <Download size={15} />
                      </button>
                    )}
                    <button onClick={() => void remove(y)} className="rounded p-1.5 text-red-500 hover:bg-red-50" title="Hapus">
                      <Trash2 size={15} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!loading && items.length === 0 && <EmptyState message="Belum ada data yudisium" />}
      </div>

      <Pagination page={page} totalPage={totalPage} onChange={setPage} />

      <Modal open={proposeOpen} title="Ajukan Yudisium" onClose={() => setProposeOpen(false)}>
        <div className="space-y-3">
          <p className="text-sm text-slate-500">Syarat otomatis diperiksa: tugas akhir lulus & UKT lunas. IPK & predikat dihitung sistem.</p>
          <Field label="Mahasiswa">
            <select className={inputClass} value={studentId} onChange={(e) => setStudentId(e.target.value)}>
              <option value="">— pilih —</option>
              {students.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
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
          <Field label="Catatan (opsional)"><textarea className={inputClass} rows={2} value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} /></Field>
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
  const { items, page, setPage, totalPage, loading, refresh } = useList<Skpi>('/skpi');
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
      void refresh();
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };

  const remove = async (sk: Skpi) => {
    if (!confirm('Hapus SKPI ini?')) return;
    try {
      await deleteResource(`/skpi/${sk.id}`);
      void refresh();
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold">SKPI (Surat Keterangan Pendamping Ijazah)</h1>
        <Button onClick={() => setCreateOpen(true)}>
          <span className="flex items-center gap-1"><FilePlus size={16} /> Buat SKPI</span>
        </Button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase text-slate-500">
              <th className="px-4 py-3 font-medium">Mahasiswa</th>
              <th className="px-4 py-3 font-medium">No. SKPI</th>
              <th className="px-4 py-3 font-medium">Capaian</th>
              <th className="px-4 py-3 font-medium">Terbit</th>
              <th className="px-4 py-3 text-right font-medium">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {items.map((sk) => (
              <tr key={sk.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                <td className="px-4 py-3">
                  {sk.student?.name ?? '-'}
                  <div className="text-xs text-slate-400">{sk.student?.nim}</div>
                </td>
                <td className="px-4 py-3">{sk.number || '-'}</td>
                <td className="px-4 py-3">{sk.activities?.length ?? 0} item</td>
                <td className="px-4 py-3">{formatDate(sk.issued_date)}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1">
                    <Button variant="secondary" onClick={() => setDetail(sk)}>Capaian</Button>
                    <button onClick={() => void downloadFile(`/skpi/${sk.id}/pdf`, `skpi-${sk.student?.nim ?? sk.id}.pdf`)} className="rounded p-1.5 text-primary-600 hover:bg-primary-50" title="Unduh PDF">
                      <Download size={15} />
                    </button>
                    <button onClick={() => void remove(sk)} className="rounded p-1.5 text-red-500 hover:bg-red-50" title="Hapus">
                      <Trash2 size={15} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!loading && items.length === 0 && <EmptyState message="Belum ada SKPI" />}
      </div>

      <Pagination page={page} totalPage={totalPage} onChange={setPage} />

      <Modal open={createOpen} title="Buat / Perbarui SKPI" onClose={() => setCreateOpen(false)}>
        <div className="space-y-3">
          <Field label="Mahasiswa">
            <select className={inputClass} value={form.student_id} onChange={(e) => setForm({ ...form, student_id: e.target.value })}>
              <option value="">— pilih —</option>
              {students.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
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
          <div key={a.id} className="flex items-start justify-between rounded-lg border border-slate-200 p-2.5">
            <div className="text-sm">
              <div className="font-medium">{a.title}</div>
              <div className="text-xs text-slate-400 capitalize">
                {a.category}{a.organizer ? ` · ${a.organizer}` : ''}{a.level ? ` · ${a.level}` : ''}{a.year ? ` · ${a.year}` : ''}
              </div>
            </div>
            <button onClick={() => void remove(a.id)} className="rounded p-1 text-red-500 hover:bg-red-50">
              <Trash2 size={14} />
            </button>
          </div>
        ))}
        {(data.activities ?? []).length === 0 && <div className="py-3 text-center text-sm text-slate-400">Belum ada capaian</div>}
      </div>

      <div className="mt-4 rounded-lg border border-slate-200 p-3">
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
