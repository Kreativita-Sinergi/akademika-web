import { useState } from 'react';
import toast from 'react-hot-toast';
import { Table, Select, Input, Flex, Typography, Tooltip } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { DownloadOutlined, PlusOutlined } from '@ant-design/icons';
import { useList } from '../hooks/useList';
import { createResource, errorMessage } from '../api/crud';
import { downloadFile } from '../api/download';
import { Badge, Button, EmptyState, Field, Modal, Pagination, formatDate } from '../components/ui';
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

  const columns: ColumnsType<LetterRequest> = [
    { title: 'Tanggal', key: 'date', render: (_, l) => formatDate(l.created_at) },
    { title: 'Jenis Surat', key: 'type', render: (_, l) => letterTypeLabel[l.type] ?? l.type },
    { title: 'Keperluan', dataIndex: 'purpose', key: 'purpose' },
    { title: 'No. Surat', key: 'number', render: (_, l) => l.letter_number || '-' },
    { title: 'Status', key: 'status', render: (_, l) => <Badge value={l.status} /> },
    {
      title: 'Aksi',
      key: 'action',
      align: 'right',
      render: (_, l) =>
        l.status === 'disetujui' ? (
          <Button variant="ghost" onClick={() => void downloadFile(`/letters/${l.id}/my-pdf`, `surat-${l.id}.pdf`)}>
            <DownloadOutlined />
          </Button>
        ) : l.status === 'ditolak' && l.note ? (
          <Tooltip title={l.note}><span className="text-xs text-red-500">ditolak</span></Tooltip>
        ) : null,
    },
  ];

  return (
    <div>
      <Flex justify="space-between" align="center" style={{ marginBottom: 16 }}>
        <Typography.Title level={4} style={{ margin: 0 }}>Surat Akademik Saya</Typography.Title>
        <Button onClick={() => setOpen(true)}><span className="flex items-center gap-1"><PlusOutlined /> Ajukan Surat</span></Button>
      </Flex>

      <Table
        rowKey="id"
        loading={loading}
        columns={columns}
        dataSource={items}
        pagination={false}
        size="middle"
        locale={{ emptyText: <EmptyState message="Belum ada pengajuan surat" /> }}
      />
      <Pagination page={page} totalPage={totalPage} onChange={setPage} />

      <Modal open={open} title="Ajukan Surat Akademik" onClose={() => setOpen(false)}>
        <div className="space-y-3">
          <Field label="Jenis Surat">
            <Select className="w-full" value={type} options={typeOptions} onChange={setType} />
          </Field>
          <Field label="Keperluan">
            <Input.TextArea rows={3} value={purpose} onChange={(e) => setPurpose(e.target.value)} placeholder="cth: pengajuan beasiswa, keperluan administrasi, dll." />
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
