import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { LifeBuoy, Plus } from 'lucide-react';
import { createResource, errorMessage, getResource, listResource, patchResource } from '../api/crud';
import { Badge, Button, EmptyState, Field, Modal, formatDate, inputClass } from '../components/ui';
import type { Ticket } from '../types';

const statusVariant: Record<string, string> = {
  terbuka: 'diajukan',
  diproses: 'menunggu',
  selesai: 'lunas',
  ditutup: 'keluar',
};

const categoryOptions = [
  { value: 'akademik', label: 'Akademik' },
  { value: 'keuangan', label: 'Keuangan' },
  { value: 'teknis', label: 'Teknis/Sistem' },
  { value: 'lainnya', label: 'Lainnya' },
];

const statusFlow = ['terbuka', 'diproses', 'selesai', 'ditutup'];

// Modal detail tiket + balasan (dipakai admin & mahasiswa).
function TicketDetail({ id, isAdmin, onClose, onChanged }: { id: string; isAdmin: boolean; onClose: () => void; onChanged: () => void }) {
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [message, setMessage] = useState('');

  const load = () => void getResource<Ticket>(`/tickets/${id}`).then(setTicket);
  useEffect(load, [id]);

  const sendReply = async () => {
    try {
      await createResource(`/tickets/${id}/replies`, { message });
      setMessage('');
      load();
      onChanged();
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };

  const changeStatus = async (status: string) => {
    try {
      await patchResource(`/tickets/${id}/status`, { status });
      toast.success('Status diperbarui');
      load();
      onChanged();
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };

  return (
    <Modal open title={ticket?.subject ?? 'Tiket'} onClose={onClose} wide>
      {ticket && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm">
            <Badge value={statusVariant[ticket.status] ?? ticket.status} />
            <span className="text-slate-400">{ticket.category} · prioritas {ticket.priority}</span>
          </div>
          <div className="rounded-lg bg-slate-50 p-3 text-sm">
            <p className="font-medium">{ticket.opener_name}</p>
            <p className="mt-1 whitespace-pre-line text-slate-600">{ticket.description}</p>
          </div>

          <div className="space-y-2">
            {(ticket.replies ?? []).map((r) => (
              <div key={r.id} className={`rounded-lg p-3 text-sm ${r.author_role === 'CAMPUS_ADMIN' ? 'bg-primary-50' : 'bg-slate-50'}`}>
                <p className="mb-0.5 text-xs font-medium text-slate-500">
                  {r.author_name} {r.author_role === 'CAMPUS_ADMIN' && '· Admin'} · {formatDate(r.created_at)}
                </p>
                <p className="whitespace-pre-line text-slate-700">{r.message}</p>
              </div>
            ))}
            {(ticket.replies ?? []).length === 0 && <p className="text-sm text-slate-400">Belum ada balasan.</p>}
          </div>

          {isAdmin && (
            <div className="flex flex-wrap gap-1.5">
              {statusFlow.map((s) => (
                <button key={s} onClick={() => void changeStatus(s)} disabled={ticket.status === s}
                  className={`rounded-lg px-2.5 py-1 text-xs ${ticket.status === s ? 'bg-primary-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                  {s}
                </button>
              ))}
            </div>
          )}

          {ticket.status !== 'ditutup' && (
            <div className="flex gap-2">
              <input className={inputClass} placeholder="Tulis balasan..." value={message} onChange={(e) => setMessage(e.target.value)} />
              <Button disabled={!message} onClick={() => void sendReply()}>Kirim</Button>
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}

function TicketTable({ items, onOpen }: { items: Ticket[]; onOpen: (t: Ticket) => void }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
      <table className="w-full text-sm">
        <thead className="bg-slate-50 text-left text-slate-500">
          <tr><th className="px-4 py-3">Subjek</th><th className="px-4 py-3">Pembuat</th><th className="px-4 py-3">Kategori</th><th className="px-4 py-3">Prioritas</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Update</th></tr>
        </thead>
        <tbody>
          {items.map((t) => (
            <tr key={t.id} className="cursor-pointer border-t border-slate-100 hover:bg-slate-50" onClick={() => onOpen(t)}>
              <td className="px-4 py-3 font-medium text-primary-700">{t.subject}</td>
              <td className="px-4 py-3">{t.opener_name}</td>
              <td className="px-4 py-3 capitalize">{t.category}</td>
              <td className="px-4 py-3 capitalize">{t.priority}</td>
              <td className="px-4 py-3"><Badge value={statusVariant[t.status] ?? t.status} /></td>
              <td className="px-4 py-3 text-slate-400">{formatDate(t.updated_at)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {items.length === 0 && <EmptyState message="Tidak ada tiket" />}
    </div>
  );
}

// Admin: kelola semua tiket helpdesk.
export function TicketsPage() {
  const [items, setItems] = useState<Ticket[]>([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [open, setOpen] = useState<Ticket | null>(null);

  const refresh = async () => {
    const res = await listResource<Ticket>('/tickets', { status: statusFilter || undefined });
    setItems(res.data ?? []);
  };
  useEffect(() => {
    void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  return (
    <div>
      <h1 className="mb-4 flex items-center gap-2 text-xl font-semibold"><LifeBuoy size={20} className="text-primary-600" /> Helpdesk</h1>
      <div className="mb-3 flex gap-2 text-sm">
        {['', 'terbuka', 'diproses', 'selesai', 'ditutup'].map((s) => (
          <button key={s} onClick={() => setStatusFilter(s)}
            className={`rounded-lg px-3 py-1.5 ${statusFilter === s ? 'bg-primary-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
            {s === '' ? 'Semua' : s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>
      <TicketTable items={items} onOpen={setOpen} />
      {open && <TicketDetail id={open.id} isAdmin onClose={() => setOpen(null)} onChanged={refresh} />}
    </div>
  );
}

// Mahasiswa/dosen: buat & pantau tiket sendiri.
export function MyTicketsPage() {
  const [items, setItems] = useState<Ticket[]>([]);
  const [open, setOpen] = useState<Ticket | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ category: 'akademik', subject: '', description: '', priority: 'sedang' });

  const refresh = () => void listResource<Ticket>('/tickets/mine').then((res) => setItems(res.data ?? []));
  useEffect(refresh, []);

  const submit = async () => {
    try {
      await createResource('/tickets', form);
      toast.success('Tiket dibuat');
      setCreating(false);
      setForm({ category: 'akademik', subject: '', description: '', priority: 'sedang' });
      refresh();
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="flex items-center gap-2 text-xl font-semibold"><LifeBuoy size={20} className="text-primary-600" /> Bantuan & Pengaduan</h1>
        <Button onClick={() => setCreating(true)}><Plus size={15} className="mr-1 inline" /> Tiket Baru</Button>
      </div>
      <TicketTable items={items} onOpen={setOpen} />
      {open && <TicketDetail id={open.id} isAdmin={false} onClose={() => setOpen(null)} onChanged={refresh} />}

      <Modal open={creating} title="Buat Tiket" onClose={() => setCreating(false)}>
        <div className="space-y-3">
          <Field label="Kategori">
            <select className={inputClass} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
              {categoryOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </Field>
          <Field label="Subjek"><input className={inputClass} value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} /></Field>
          <Field label="Prioritas">
            <select className={inputClass} value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
              <option value="rendah">Rendah</option><option value="sedang">Sedang</option><option value="tinggi">Tinggi</option>
            </select>
          </Field>
          <Field label="Deskripsi"><textarea className={inputClass} rows={4} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></Field>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setCreating(false)}>Batal</Button>
            <Button disabled={!form.subject || !form.description} onClick={() => void submit()}>Kirim</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
