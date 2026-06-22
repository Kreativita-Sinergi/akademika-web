import { useState } from 'react';
import toast from 'react-hot-toast';
import { Check, Download, X } from 'lucide-react';
import { useList } from '../hooks/useList';
import { patchResource, deleteResource, errorMessage } from '../api/crud';
import { downloadFile } from '../api/download';
import { Badge, Button, EmptyState, Field, Modal, Pagination, inputClass, formatDate } from '../components/ui';
import type { LetterRequest } from '../types';

export const letterTypeLabel: Record<string, string> = {
  aktif_kuliah: 'Keterangan Aktif Kuliah',
  cuti: 'Keterangan Cuti',
  lulus: 'Keterangan Lulus',
  keterangan: 'Surat Keterangan',
};

// Admin: kelola & proses pengajuan surat akademik mahasiswa.
export default function LettersPage() {
  const { items, page, setPage, totalPage, loading, refresh } = useList<LetterRequest>('/letters');
  const [target, setTarget] = useState<LetterRequest | null>(null);
  const [letterNumber, setLetterNumber] = useState('');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  const openProcess = (letter: LetterRequest) => {
    setTarget(letter);
    setLetterNumber(letter.letter_number || '');
    setNote(letter.note || '');
  };

  const process = async (status: 'disetujui' | 'ditolak') => {
    if (!target) return;
    if (status === 'disetujui' && !letterNumber.trim()) {
      toast.error('Nomor surat wajib diisi');
      return;
    }
    setSaving(true);
    try {
      await patchResource(`/letters/${target.id}/process`, {
        status,
        letter_number: letterNumber,
        note,
      });
      toast.success(status === 'disetujui' ? 'Surat disetujui' : 'Pengajuan ditolak');
      setTarget(null);
      void refresh();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const remove = async (letter: LetterRequest) => {
    if (!confirm('Hapus pengajuan ini?')) return;
    try {
      await deleteResource(`/letters/${letter.id}`);
      toast.success('Pengajuan dihapus');
      void refresh();
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };

  return (
    <div>
      <h1 className="mb-4 text-xl font-semibold">Surat Akademik</h1>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase text-slate-500">
              <th className="px-4 py-3 font-medium">Tanggal</th>
              <th className="px-4 py-3 font-medium">Mahasiswa</th>
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
                <td className="px-4 py-3">
                  {l.student?.name ?? '-'}
                  <div className="text-xs text-slate-400">{l.student?.nim}</div>
                </td>
                <td className="px-4 py-3">{letterTypeLabel[l.type] ?? l.type}</td>
                <td className="px-4 py-3">{l.purpose}</td>
                <td className="px-4 py-3">{l.letter_number || '-'}</td>
                <td className="px-4 py-3"><Badge value={l.status} /></td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1">
                    {l.status === 'diajukan' && (
                      <button
                        onClick={() => openProcess(l)}
                        className="rounded p-1.5 text-emerald-600 hover:bg-emerald-50"
                        title="Proses"
                      >
                        <Check size={15} />
                      </button>
                    )}
                    {l.status === 'disetujui' && (
                      <button
                        onClick={() => void downloadFile(`/letters/${l.id}/pdf`, `surat-${l.student?.nim ?? l.id}.pdf`)}
                        className="rounded p-1.5 text-primary-600 hover:bg-primary-50"
                        title="Unduh PDF"
                      >
                        <Download size={15} />
                      </button>
                    )}
                    <button
                      onClick={() => void remove(l)}
                      className="rounded p-1.5 text-red-500 hover:bg-red-50"
                      title="Hapus"
                    >
                      <X size={15} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!loading && items.length === 0 && <EmptyState message="Belum ada pengajuan surat" />}
      </div>

      <Pagination page={page} totalPage={totalPage} onChange={setPage} />

      <Modal open={Boolean(target)} title="Proses Pengajuan Surat" onClose={() => setTarget(null)}>
        <div className="space-y-3">
          <div className="rounded-lg bg-slate-50 p-3 text-sm">
            <div className="font-medium">{target?.student?.name}</div>
            <div className="text-slate-500">
              {target && (letterTypeLabel[target.type] ?? target.type)} — {target?.purpose}
            </div>
          </div>
          <Field label="Nomor Surat (wajib untuk menyetujui)">
            <input
              className={inputClass}
              value={letterNumber}
              onChange={(e) => setLetterNumber(e.target.value)}
              placeholder="cth: 001/SKAK/VI/2026"
            />
          </Field>
          <Field label="Catatan (opsional / alasan penolakan)">
            <textarea className={inputClass} rows={2} value={note} onChange={(e) => setNote(e.target.value)} />
          </Field>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="danger" disabled={saving} onClick={() => void process('ditolak')}>
              Tolak
            </Button>
            <Button disabled={saving} onClick={() => void process('disetujui')}>
              {saving ? 'Memproses...' : 'Setujui'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
