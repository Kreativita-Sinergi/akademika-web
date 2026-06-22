import { useState } from 'react';
import toast from 'react-hot-toast';
import { Download, Plus } from 'lucide-react';
import { useList } from '../hooks/useList';
import { createResource, errorMessage } from '../api/crud';
import { downloadFile } from '../api/download';
import { Badge, Button, EmptyState, Field, Modal, Pagination, inputClass, formatDate } from '../components/ui';
import { letterTypeLabel } from './LettersPage';
import type { LetterRequest } from '../types';

const typeOptions = [
  { value: 'aktif_kuliah', label: 'Keterangan Aktif Kuliah' },
  { value: 'cuti', label: 'Keterangan Cuti' },
  { value: 'lulus', label: 'Keterangan Lulus' },
  { value: 'keterangan', label: 'Surat Keterangan Umum' },
];

// Mahasiswa: ajukan surat akademik & unduh yang sudah disetujui.
export default function MyLettersPage() {
  const { items, page, setPage, totalPage, loading, refresh } = useList<LetterRequest>('/letters/mine');
  const [open, setOpen] = useState(false);
  const [type, setType] = useState('aktif_kuliah');
  const [purpose, setPurpose] = useState('');
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!purpose.trim()) {
      toast.error('Keperluan wajib diisi');
      return;
    }
    setSaving(true);
    try {
      await createResource('/letters', { type, purpose });
      toast.success('Pengajuan surat terkirim');
      setOpen(false);
      setPurpose('');
      void refresh();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Surat Akademik Saya</h1>
        <Button onClick={() => setOpen(true)}>
          <span className="flex items-center gap-1">
            <Plus size={16} /> Ajukan Surat
          </span>
        </Button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase text-slate-500">
              <th className="px-4 py-3 font-medium">Tanggal</th>
              <th className="px-4 py-3 font-medium">Jenis Surat</th>
              <th className="px-4 py-3 font-medium">Keperluan</th>
              <th className="px-4 py-3 font-medium">No. Surat</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 text-right font-medium">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {items.map((l) => (
              <tr key={l.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                <td className="px-4 py-3">{formatDate(l.created_at)}</td>
                <td className="px-4 py-3">{letterTypeLabel[l.type] ?? l.type}</td>
                <td className="px-4 py-3">{l.purpose}</td>
                <td className="px-4 py-3">{l.letter_number || '-'}</td>
                <td className="px-4 py-3"><Badge value={l.status} /></td>
                <td className="px-4 py-3 text-right">
                  {l.status === 'disetujui' && (
                    <button
                      onClick={() => void downloadFile(`/letters/${l.id}/my-pdf`, `surat-${l.id}.pdf`)}
                      className="rounded p-1.5 text-primary-600 hover:bg-primary-50"
                      title="Unduh PDF"
                    >
                      <Download size={15} />
                    </button>
                  )}
                  {l.status === 'ditolak' && l.note && (
                    <span className="text-xs text-red-500">{l.note}</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!loading && items.length === 0 && <EmptyState message="Belum ada pengajuan surat" />}
      </div>

      <Pagination page={page} totalPage={totalPage} onChange={setPage} />

      <Modal open={open} title="Ajukan Surat Akademik" onClose={() => setOpen(false)}>
        <div className="space-y-3">
          <Field label="Jenis Surat">
            <select className={inputClass} value={type} onChange={(e) => setType(e.target.value)}>
              {typeOptions.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </Field>
          <Field label="Keperluan">
            <textarea
              className={inputClass}
              rows={3}
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              placeholder="cth: pengajuan beasiswa, keperluan administrasi, dll."
            />
          </Field>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setOpen(false)}>Batal</Button>
            <Button disabled={saving} onClick={() => void submit()}>
              {saving ? 'Mengirim...' : 'Kirim Pengajuan'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
