import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { LogOut, PauseCircle } from 'lucide-react';
import { createResource, errorMessage, listResource, patchResource } from '../api/crud';
import api from '../lib/axios';
import { Badge, Button, EmptyState, Field, Modal, formatDate, inputClass } from '../components/ui';
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
  const [reviewing, setReviewing] = useState<LeaveRequest | null>(null);
  const [note, setNote] = useState('');

  const refresh = async () => {
    const res = await listResource<LeaveRequest>('/leave-requests', { status: statusFilter || undefined });
    setItems(res.data ?? []);
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

  return (
    <div>
      <h1 className="mb-4 flex items-center gap-2 text-xl font-semibold">
        <PauseCircle size={20} className="text-primary-600" /> Cuti & Pengunduran Diri
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
          <thead className="bg-slate-50 text-left text-slate-500">
            <tr><th className="px-4 py-3">Mahasiswa</th><th className="px-4 py-3">Jenis</th><th className="px-4 py-3">Alasan</th><th className="px-4 py-3">Status</th><th className="px-4 py-3"></th></tr>
          </thead>
          <tbody>
            {items.map((l) => (
              <tr key={l.id} className="border-t border-slate-100">
                <td className="px-4 py-3">{l.student_name}</td>
                <td className="px-4 py-3">{typeLabel[l.type] ?? l.type}</td>
                <td className="max-w-sm truncate px-4 py-3 text-slate-500">{l.reason}</td>
                <td className="px-4 py-3"><Badge value={statusVariant[l.status] ?? l.status} /></td>
                <td className="px-4 py-3 text-right">
                  {l.status === 'diajukan' && (
                    <Button variant="secondary" onClick={() => { setReviewing(l); setNote(''); }}>Proses</Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {items.length === 0 && <EmptyState message="Tidak ada permohonan" />}
      </div>

      <Modal open={!!reviewing} title={`Proses — ${reviewing?.student_name ?? ''}`} onClose={() => setReviewing(null)}>
        {reviewing && (
          <div className="space-y-3">
            <div className="rounded-lg bg-slate-50 p-3 text-sm">
              <p className="font-medium">{typeLabel[reviewing.type] ?? reviewing.type}</p>
              <p className="mt-1 whitespace-pre-line text-slate-600">{reviewing.reason}</p>
            </div>
            {reviewing.type === 'mengundurkan_diri' && (
              <p className="rounded-lg bg-amber-50 p-2 text-xs text-amber-700">Menyetujui akan mengubah status mahasiswa menjadi "keluar".</p>
            )}
            <Field label="Catatan"><input className={inputClass} value={note} onChange={(e) => setNote(e.target.value)} /></Field>
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
        <h1 className="flex items-center gap-2 text-xl font-semibold"><LogOut size={20} className="text-primary-600" /> Cuti & Status Studi</h1>
        <Button onClick={() => setOpen(true)}>Ajukan Permohonan</Button>
      </div>
      <div className="space-y-2">
        {items.length === 0 && <EmptyState message="Belum ada permohonan" />}
        {items.map((l) => (
          <div key={l.id} className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4">
            <div>
              <p className="font-medium">{typeLabel[l.type] ?? l.type}</p>
              <p className="text-xs text-slate-400">{formatDate(l.created_at ?? l.decided_at ?? '')}</p>
              {l.review_note && <p className="text-xs text-slate-400">Catatan: {l.review_note}</p>}
            </div>
            <Badge value={statusVariant[l.status] ?? l.status} />
          </div>
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
          <Field label="Alasan"><textarea className={inputClass} rows={4} value={reason} onChange={(e) => setReason(e.target.value)} /></Field>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setOpen(false)}>Batal</Button>
            <Button disabled={!reason} onClick={() => void submit()}>Kirim</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
