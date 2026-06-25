import { useCallback, useState } from 'react';
import toast from 'react-hot-toast';
import { Check, Download, X } from 'lucide-react';
import { patchResource, deleteResource, errorMessage, listResource } from '../api/crud';
import { downloadFile } from '../api/download';
import { Badge, Button, Field, Modal, inputClass, formatDate } from '../components/ui';
import { DataTable, type Column, type ListParams } from '@/components/ui/data-table';
import { Textarea } from '@/components/ui/textarea';
import type { LetterRequest } from '../types';

export const letterTypeLabel: Record<string, string> = {
  aktif_kuliah: 'Keterangan Aktif Kuliah',
  cuti: 'Keterangan Cuti',
  lulus: 'Keterangan Lulus',
  keterangan: 'Surat Keterangan',
};

// Admin: kelola & proses pengajuan surat akademik mahasiswa.
export default function LettersPage() {
  const [reloadKey, setReloadKey] = useState(0);
  const reload = () => setReloadKey((k) => k + 1);
  const fetcher = useCallback((p: ListParams) => listResource<LetterRequest>('/letters', p), []);
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
      reload();
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
      reload();
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };

  const columns: Column<LetterRequest>[] = [
    { title: 'Tanggal', key: 'date', render: (_, l) => formatDate(l.created_at) },
    {
      title: 'Mahasiswa',
      key: 'mhs',
      render: (_, l) => (
        <div>
          {l.student?.name ?? '-'}
          <div className="text-xs text-muted-foreground">{l.student?.nim}</div>
        </div>
      ),
    },
    { title: 'Jenis Surat', key: 'type', render: (_, l) => letterTypeLabel[l.type] ?? l.type },
    { title: 'Keperluan', dataIndex: 'purpose' },
    { title: 'No. Surat', key: 'number', render: (_, l) => l.letter_number || '-' },
    { title: 'Status', key: 'status', render: (_, l) => <Badge value={l.status} /> },
    {
      title: 'Aksi',
      key: 'act',
      align: 'right',
      render: (_, l) => (
        <div className="flex items-center justify-end gap-1">
          {l.status === 'diajukan' && (
            <Button variant="ghost" size="icon" className="h-8 w-8 text-emerald-600 hover:text-emerald-600" title="Proses" onClick={() => openProcess(l)}>
              <Check className="h-4 w-4" />
            </Button>
          )}
          {l.status === 'disetujui' && (
            <Button variant="ghost" size="icon" className="h-8 w-8 text-primary hover:text-primary" title="Unduh PDF" onClick={() => void downloadFile(`/letters/${l.id}/pdf`, `surat-${l.student?.nim ?? l.id}.pdf`)}>
              <Download className="h-4 w-4" />
            </Button>
          )}
          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" title="Hapus" onClick={() => void remove(l)}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <h1 className="mb-4 text-xl font-bold tracking-tight">Surat Akademik</h1>

      <DataTable<LetterRequest>
        fetcher={fetcher}
        columns={columns}
        rowKey={(l) => l.id}
        reloadKey={reloadKey}
        searchable
        searchPlaceholder="Cari surat..."
        emptyText="Belum ada pengajuan surat"
      />

      <Modal open={Boolean(target)} title="Proses Pengajuan Surat" onClose={() => setTarget(null)}>
        <div className="space-y-3">
          <div className="rounded-lg bg-muted p-3 text-sm">
            <div className="font-medium">{target?.student?.name}</div>
            <div className="text-muted-foreground">
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
            <Textarea rows={2} value={note} onChange={(e) => setNote(e.target.value)} />
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
