import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { LifeBuoy, Plus } from 'lucide-react';
import { createResource, errorMessage, getResource, listResource, patchResource } from '../api/crud';
import { Badge, Button, Field, Modal, formatDate, inputClass } from '../components/ui';
import { DataTable, type Column } from '@/components/ui/data-table';
import { Segmented } from '@/components/ui/segmented';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
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
            <span className="text-muted-foreground">{ticket.category} · prioritas {ticket.priority}</span>
          </div>
          <div className="rounded-lg bg-muted p-3 text-sm">
            <p className="font-medium">{ticket.opener_name}</p>
            <p className="mt-1 whitespace-pre-line text-muted-foreground">{ticket.description}</p>
          </div>

          <div className="space-y-2">
            {(ticket.replies ?? []).map((r) => (
              <div key={r.id} className={`rounded-lg p-3 text-sm ${r.author_role === 'CAMPUS_ADMIN' ? 'bg-primary/5' : 'bg-muted'}`}>
                <p className="mb-0.5 text-xs font-medium text-muted-foreground">
                  {r.author_name} {r.author_role === 'CAMPUS_ADMIN' && '· Admin'} · {formatDate(r.created_at)}
                </p>
                <p className="whitespace-pre-line text-foreground">{r.message}</p>
              </div>
            ))}
            {(ticket.replies ?? []).length === 0 && <p className="text-sm text-muted-foreground">Belum ada balasan.</p>}
          </div>

          {isAdmin && (
            <Segmented value={ticket.status} onChange={(s) => void changeStatus(s)} options={statusFlow.map((s) => ({ value: s, label: s }))} />
          )}

          {ticket.status !== 'ditutup' && (
            <div className="flex gap-2">
              <Input placeholder="Tulis balasan..." value={message} onChange={(e) => setMessage(e.target.value)} />
              <Button disabled={!message} onClick={() => void sendReply()}>Kirim</Button>
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}

function TicketTable({ items, onOpen }: { items: Ticket[]; onOpen: (t: Ticket) => void }) {
  const columns: Column<Ticket>[] = [
    {
      title: 'Subjek',
      key: 'subject',
      render: (_, t) => (
        <button className="font-medium text-primary hover:underline" onClick={() => onOpen(t)}>{t.subject}</button>
      ),
    },
    { title: 'Pembuat', key: 'opener', render: (_, t) => t.opener_name },
    { title: 'Kategori', key: 'category', className: 'capitalize', render: (_, t) => t.category },
    { title: 'Prioritas', key: 'priority', className: 'capitalize', render: (_, t) => t.priority },
    { title: 'Status', key: 'status', render: (_, t) => <Badge value={statusVariant[t.status] ?? t.status} /> },
    { title: 'Update', key: 'updated', className: 'text-muted-foreground', render: (_, t) => formatDate(t.updated_at) },
  ];
  return <DataTable<Ticket> columns={columns} rowKey={(t) => t.id} data={items} emptyText="Tidak ada tiket" />;
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
      <h1 className="mb-4 flex items-center gap-2 text-xl font-bold tracking-tight"><LifeBuoy size={20} className="text-primary" /> Helpdesk</h1>
      <div className="mb-3">
        <Segmented
          value={statusFilter}
          onChange={setStatusFilter}
          options={[
            { value: '', label: 'Semua' },
            { value: 'terbuka', label: 'Terbuka' },
            { value: 'diproses', label: 'Diproses' },
            { value: 'selesai', label: 'Selesai' },
            { value: 'ditutup', label: 'Ditutup' },
          ]}
        />
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
        <h1 className="flex items-center gap-2 text-xl font-bold tracking-tight"><LifeBuoy size={20} className="text-primary" /> Bantuan & Pengaduan</h1>
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
          <Field label="Deskripsi"><Textarea rows={4} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></Field>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setCreating(false)}>Batal</Button>
            <Button disabled={!form.subject || !form.description} onClick={() => void submit()}>Kirim</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
