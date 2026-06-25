import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { LogOut, PauseCircle } from 'lucide-react';
import { createResource, errorMessage, listResource, patchResource } from '../api/crud';
import api from '../lib/axios';
import { Badge, Button, EmptyState, Field, Modal, formatDate, inputClass } from '../components/ui';
import { DataTable, type Column } from '@/components/ui/data-table';
import { Segmented } from '@/components/ui/segmented';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import type { ApiResponse, LeaveRequest } from '../types';

const typeLabel: Record<string, string> = {
  cuti: 'Cuti Akademik',
  aktif_kembali: 'Aktif Kembali',
  mengundurkan_diri: 'Pengunduran Diri',
};

const statusVariant: Record<string, string> = {
  diajukan: 'diajukan',
  disetujui: 'lunas',
  ditolak: 'terlambat',
};

// Admin: proses permohonan cuti/pengunduran diri.
export function LeaveRequestsPage() {
  const [items, setItems] = useState<LeaveRequest[]>([]);
  const [statusFilter, setStatusFilter] = useState('diajukan');
  const [loading, setLoading] = useState(false);
  const [reviewing, setReviewing] = useState<LeaveRequest | null>(null);
  const [note, setNote] = useState('');

  const refresh = async () => {
    setLoading(true);
    try {
      const res = await listResource<LeaveRequest>('/leave-requests', { status: statusFilter || undefined });
      setItems(res.data ?? []);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  const decide = async (status: 'disetujui' | 'ditolak') => {
    if (!reviewing) return;
    try {
      await patchResource(`/leave-requests/${reviewing.id}/process`, { status, review_note: note });
      toast.success(status === 'disetujui' ? 'Permohonan disetujui' : 'Permohonan ditolak');
      setReviewing(null);
      void refresh();
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };

  const columns: Column<LeaveRequest>[] = [
    { title: 'Mahasiswa', key: 'mhs', render: (_, l) => l.student_name },
    { title: 'Jenis', key: 'type', render: (_, l) => typeLabel[l.type] ?? l.type },
    { title: 'Alasan', key: 'reason', className: 'max-w-sm truncate text-muted-foreground', render: (_, l) => l.reason },
    { title: 'Status', key: 'status', render: (_, l) => <Badge value={statusVariant[l.status] ?? l.status} /> },
    {
      title: '',
      key: 'act',
      align: 'right',
      render: (_, l) =>
        l.status === 'diajukan' ? (
          <Button variant="secondary" onClick={() => { setReviewing(l); setNote(''); }}>Proses</Button>
        ) : null,
    },
  ];

  return (
    <div>
      <h1 className="mb-4 flex items-center gap-2 text-xl font-bold tracking-tight">
        <PauseCircle size={20} className="text-primary" /> Cuti & Pengunduran Diri
      </h1>
      <div className="mb-3">
        <Segmented
          value={statusFilter}
          onChange={setStatusFilter}
          options={[
            { value: 'diajukan', label: 'Diajukan' },
            { value: 'disetujui', label: 'Disetujui' },
            { value: 'ditolak', label: 'Ditolak' },
            { value: '', label: 'Semua' },
          ]}
        />
      </div>

      <DataTable<LeaveRequest> columns={columns} rowKey={(l) => l.id} data={items} loading={loading} emptyText="Tidak ada permohonan" />

      <Modal open={!!reviewing} title={`Proses — ${reviewing?.student_name ?? ''}`} onClose={() => setReviewing(null)}>
        {reviewing && (
          <div className="space-y-3">
            <div className="rounded-lg bg-muted p-3 text-sm">
              <p className="font-medium">{typeLabel[reviewing.type] ?? reviewing.type}</p>
              <p className="mt-1 whitespace-pre-line text-muted-foreground">{reviewing.reason}</p>
            </div>
            {reviewing.type === 'mengundurkan_diri' && (
              <p className="rounded-lg bg-amber-50 p-2 text-xs text-amber-700">Menyetujui akan mengubah status mahasiswa menjadi "keluar".</p>
            )}
            <Field label="Catatan"><Input value={note} onChange={(e) => setNote(e.target.value)} /></Field>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="danger" onClick={() => void decide('ditolak')}>Tolak</Button>
              <Button onClick={() => void decide('disetujui')}>Setujui</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

// Mahasiswa: ajukan cuti/aktif kembali/pengunduran diri & lihat riwayat.
export function MyLeavePage() {
  const [items, setItems] = useState<LeaveRequest[]>([]);
  const [open, setOpen] = useState(false);
  const [type, setType] = useState('cuti');
  const [reason, setReason] = useState('');

  const load = () => {
    void api.get<ApiResponse<LeaveRequest[]>>('/leave-requests/mine').then((res) => setItems(res.data.data ?? []));
  };
  useEffect(load, []);

  const submit = async () => {
    try {
      await createResource('/leave-requests', { type, reason });
      toast.success('Permohonan terkirim');
      setOpen(false);
      setReason('');
      load();
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="flex items-center gap-2 text-xl font-bold tracking-tight"><LogOut size={20} className="text-primary" /> Cuti & Status Studi</h1>
        <Button onClick={() => setOpen(true)}>Ajukan Permohonan</Button>
      </div>
      <div className="space-y-2">
        {items.length === 0 && <EmptyState message="Belum ada permohonan" />}
        {items.map((l) => (
          <Card key={l.id}>
            <CardContent className="flex items-center justify-between p-4">
              <div>
                <p className="font-medium">{typeLabel[l.type] ?? l.type}</p>
                <p className="text-xs text-muted-foreground">{formatDate(l.created_at ?? l.decided_at ?? '')}</p>
                {l.review_note && <p className="text-xs text-muted-foreground">Catatan: {l.review_note}</p>}
              </div>
              <Badge value={statusVariant[l.status] ?? l.status} />
            </CardContent>
          </Card>
        ))}
      </div>

      <Modal open={open} title="Ajukan Permohonan" onClose={() => setOpen(false)}>
        <div className="space-y-3">
          <Field label="Jenis Permohonan">
            <select className={inputClass} value={type} onChange={(e) => setType(e.target.value)}>
              <option value="cuti">Cuti Akademik</option>
              <option value="aktif_kembali">Aktif Kembali (setelah cuti)</option>
              <option value="mengundurkan_diri">Pengunduran Diri</option>
            </select>
          </Field>
          <Field label="Alasan"><Textarea rows={4} value={reason} onChange={(e) => setReason(e.target.value)} /></Field>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setOpen(false)}>Batal</Button>
            <Button disabled={!reason} onClick={() => void submit()}>Kirim</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
