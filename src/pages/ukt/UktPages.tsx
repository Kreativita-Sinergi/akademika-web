import { useState } from 'react';
import toast from 'react-hot-toast';
import { Banknote, FilePlus2 } from 'lucide-react';
import ResourcePage from '../../components/crud/ResourcePage';
import { useOptions } from '../../hooks/useList';
import { createResource, errorMessage } from '../../api/crud';
import { Badge, Button, Field, Modal, formatRupiah, inputClass } from '../../components/ui';
import type { AcademicYear, StudyProgram, TuitionInvoice, UktGroup } from '../../types';

export function UktGroupsPage() {
  const programs = useOptions<StudyProgram>('/master/programs', (p) => p.name);
  return (
    <ResourcePage<UktGroup>
      title="Golongan UKT"
      endpoint="/ukt/groups"
      columns={[
        { key: 'group_number', label: 'Golongan' },
        { key: 'study_program', label: 'Prodi', render: (u) => u.study_program?.name ?? '-' },
        { key: 'amount_per_semester', label: 'Nominal/Semester', render: (u) => formatRupiah(u.amount_per_semester) },
        { key: 'description', label: 'Keterangan' },
      ]}
      fields={[
        { name: 'study_program_id', label: 'Program Studi', type: 'select', options: programs, required: true },
        { name: 'group_number', label: 'Nomor Golongan (1-7)', type: 'number', required: true },
        { name: 'amount_per_semester', label: 'Nominal per Semester (Rp)', type: 'number', required: true },
        { name: 'description', label: 'Keterangan', type: 'textarea' },
      ]}
      toForm={(u) => ({
        study_program_id: u.study_program_id,
        group_number: u.group_number,
        amount_per_semester: u.amount_per_semester,
        description: u.description,
      })}
    />
  );
}

export function InvoicesPage() {
  const years = useOptions<AcademicYear>('/master/academic-years', (y) => `${y.name} ${y.semester}`);

  const [generateOpen, setGenerateOpen] = useState(false);
  const [generateYear, setGenerateYear] = useState('');
  const [payTarget, setPayTarget] = useState<TuitionInvoice | null>(null);
  const [payForm, setPayForm] = useState({ amount: '', method: 'transfer', reference: '' });
  const [refreshFn, setRefreshFn] = useState<() => void>(() => () => {});

  const handleGenerate = async () => {
    try {
      const result = await createResource<{ created: number }>('/ukt/invoices/generate', {
        academic_year_id: generateYear,
      });
      toast.success(`${result.created ?? 0} tagihan dibuat`);
      setGenerateOpen(false);
      refreshFn();
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };

  const handlePay = async () => {
    try {
      await createResource('/ukt/payments', {
        invoice_id: payTarget!.id,
        amount: Number(payForm.amount),
        method: payForm.method,
        reference: payForm.reference,
      });
      toast.success('Pembayaran dicatat');
      setPayTarget(null);
      refreshFn();
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };

  return (
    <>
      <ResourcePage<TuitionInvoice>
        title="Tagihan UKT"
        endpoint="/ukt/invoices"
        canCreate={false}
        canEdit={false}
        canDelete={false}
        columns={[
          { key: 'invoice_number', label: 'No. Tagihan' },
          { key: 'student', label: 'Mahasiswa', render: (i) => (i.student ? `${i.student.nim} — ${i.student.name}` : '-') },
          { key: 'academic_year', label: 'Tahun', render: (i) => (i.academic_year ? `${i.academic_year.name} ${i.academic_year.semester}` : '-') },
          { key: 'amount', label: 'Tagihan', render: (i) => formatRupiah(i.amount) },
          { key: 'paid_amount', label: 'Terbayar', render: (i) => formatRupiah(i.paid_amount) },
          { key: 'status', label: 'Status', render: (i) => <Badge value={i.status} /> },
        ]}
        fields={[]}
        rowActions={(invoice, refresh) =>
          invoice.status !== 'lunas' && (
            <button
              onClick={() => {
                setPayTarget(invoice);
                setPayForm({ amount: String(invoice.amount - invoice.paid_amount), method: 'transfer', reference: '' });
                setRefreshFn(() => refresh);
              }}
              className="rounded p-1.5 text-emerald-600 hover:bg-emerald-50"
              title="Catat pembayaran"
            >
              <Banknote size={15} />
            </button>
          )
        }
        headerActions={(refresh) => (
          <Button
            variant="secondary"
            onClick={() => {
              setGenerateOpen(true);
              setRefreshFn(() => refresh);
            }}
          >
            <span className="flex items-center gap-1.5">
              <FilePlus2 size={15} /> Generate Tagihan
            </span>
          </Button>
        )}
      />

      <Modal open={generateOpen} title="Generate Tagihan UKT Massal" onClose={() => setGenerateOpen(false)}>
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Tagihan dibuat untuk semua mahasiswa aktif yang punya golongan UKT dan belum punya tagihan di tahun akademik terpilih.
          </p>
          <Field label="Tahun Akademik">
            <select className={inputClass} value={generateYear} onChange={(e) => setGenerateYear(e.target.value)}>
              <option value="">— pilih —</option>
              {years.map((y) => (
                <option key={y.value} value={y.value}>{y.label}</option>
              ))}
            </select>
          </Field>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setGenerateOpen(false)}>Batal</Button>
            <Button disabled={!generateYear} onClick={() => void handleGenerate()}>Generate</Button>
          </div>
        </div>
      </Modal>

      <Modal open={payTarget !== null} title={`Pembayaran — ${payTarget?.invoice_number ?? ''}`} onClose={() => setPayTarget(null)}>
        <div className="space-y-3">
          <Field label="Jumlah (Rp)">
            <input
              type="number"
              className={inputClass}
              value={payForm.amount}
              onChange={(e) => setPayForm({ ...payForm, amount: e.target.value })}
            />
          </Field>
          <Field label="Metode">
            <select className={inputClass} value={payForm.method} onChange={(e) => setPayForm({ ...payForm, method: e.target.value })}>
              <option value="transfer">Transfer</option>
              <option value="tunai">Tunai</option>
              <option value="va">Virtual Account</option>
            </select>
          </Field>
          <Field label="Referensi (opsional)">
            <input className={inputClass} value={payForm.reference} onChange={(e) => setPayForm({ ...payForm, reference: e.target.value })} />
          </Field>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setPayTarget(null)}>Batal</Button>
            <Button disabled={!payForm.amount} onClick={() => void handlePay()}>Simpan</Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
