import { useCallback, useState } from 'react';
import toast from 'react-hot-toast';
import { Download, Plus } from 'lucide-react';
import { createResource, errorMessage, listResource } from '../api/crud';
import { downloadFile } from '../api/download';
import { Badge, Button, Field, Modal, formatDate } from '../components/ui';
import { Textarea } from '@/components/ui/textarea';
import { Combobox } from '@/components/ui/combobox';
import { DataTable, type Column, type ListParams } from '@/components/ui/data-table';
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
  const [reloadKey, setReloadKey] = useState(0);
  const reload = () => setReloadKey((k) => k + 1);
  const fetcher = useCallback((p: ListParams) => listResource<LetterRequest>('/letters/mine', p), []);
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
      reload();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const columns: Column<LetterRequest>[] = [
    { title: 'Tanggal', key: 'date', render: (_, l) => formatDate(l.created_at) },
    { title: 'Jenis Surat', key: 'type', render: (_, l) => letterTypeLabel[l.type] ?? l.type },
    { title: 'Keperluan', dataIndex: 'purpose' },
    { title: 'No. Surat', key: 'number', render: (_, l) => l.letter_number || '-' },
    { title: 'Status', key: 'status', render: (_, l) => <Badge value={l.status} /> },
    {
      title: 'Aksi',
      key: 'action',
      align: 'right',
      render: (_, l) =>
        l.status === 'disetujui' ? (
          <Button variant="ghost" onClick={() => void downloadFile(`/letters/${l.id}/my-pdf`, `surat-${l.id}.pdf`)}>
            <Download className="h-4 w-4" />
          </Button>
        ) : l.status === 'ditolak' && l.note ? (
          <span className="text-xs text-red-500" title={l.note}>ditolak</span>
        ) : null,
    },
  ];

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold tracking-tight">Surat Akademik Saya</h1>
        <Button onClick={() => setOpen(true)}><span className="flex items-center gap-1"><Plus className="h-4 w-4" /> Ajukan Surat</span></Button>
      </div>

      <DataTable<LetterRequest>
        fetcher={fetcher}
        columns={columns}
        rowKey={(l) => l.id}
        reloadKey={reloadKey}
        emptyText="Belum ada pengajuan surat"
      />

      <Modal open={open} title="Ajukan Surat Akademik" onClose={() => setOpen(false)}>
        <div className="space-y-3">
          <Field label="Jenis Surat">
            <Combobox options={typeOptions} value={type} onChange={setType} />
          </Field>
          <Field label="Keperluan">
            <Textarea rows={3} value={purpose} onChange={(e) => setPurpose(e.target.value)} placeholder="cth: pengajuan beasiswa, keperluan administrasi, dll." />
          </Field>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setOpen(false)}>Batal</Button>
            <Button disabled={saving} onClick={() => void submit()}>{saving ? 'Mengirim...' : 'Kirim Pengajuan'}</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
