import { X } from 'lucide-react';
import type { ReactNode } from 'react';

// ── Button ──────────────────────────────────────────────────────────────────

export function Button({
  children,
  onClick,
  type = 'button',
  variant = 'primary',
  disabled,
  className = '',
}: {
  children: ReactNode;
  onClick?: () => void;
  type?: 'button' | 'submit';
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  disabled?: boolean;
  className?: string;
}) {
  const styles: Record<string, string> = {
    primary: 'bg-primary-600 text-white hover:bg-primary-700',
    secondary: 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-50',
    danger: 'bg-red-600 text-white hover:bg-red-700',
    ghost: 'text-slate-600 hover:bg-slate-100',
  };
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`rounded-lg px-3 py-2 text-sm font-medium transition disabled:opacity-50 ${styles[variant]} ${className}`}
    >
      {children}
    </button>
  );
}

// ── Badge ───────────────────────────────────────────────────────────────────

const badgeColors: Record<string, string> = {
  // status umum
  aktif: 'bg-emerald-100 text-emerald-700',
  lunas: 'bg-emerald-100 text-emerald-700',
  lulus: 'bg-emerald-100 text-emerald-700',
  diterima: 'bg-emerald-100 text-emerald-700',
  wisuda: 'bg-emerald-100 text-emerald-700',
  selesai: 'bg-emerald-100 text-emerald-700',
  dinilai: 'bg-emerald-100 text-emerald-700',
  bekerja: 'bg-emerald-100 text-emerald-700',
  // proses
  terdaftar: 'bg-blue-100 text-blue-700',
  ujian_dijadwalkan: 'bg-blue-100 text-blue-700',
  daftar_ulang: 'bg-indigo-100 text-indigo-700',
  berjalan: 'bg-blue-100 text-blue-700',
  bimbingan: 'bg-blue-100 text-blue-700',
  seminar: 'bg-indigo-100 text-indigo-700',
  sidang: 'bg-indigo-100 text-indigo-700',
  sebagian: 'bg-amber-100 text-amber-700',
  diajukan: 'bg-amber-100 text-amber-700',
  pengajuan: 'bg-amber-100 text-amber-700',
  disetujui: 'bg-blue-100 text-blue-700',
  revisi: 'bg-amber-100 text-amber-700',
  cuti: 'bg-amber-100 text-amber-700',
  belum_bayar: 'bg-red-100 text-red-700',
  tidak_lulus: 'bg-red-100 text-red-700',
  do: 'bg-red-100 text-red-700',
  keluar: 'bg-slate-200 text-slate-600',
  mencari: 'bg-slate-200 text-slate-600',
};

export function Badge({ value }: { value: string }) {
  const color = badgeColors[value] || 'bg-slate-100 text-slate-600';
  return (
    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${color}`}>
      {value.replace(/_/g, ' ')}
    </span>
  );
}

// ── Modal ───────────────────────────────────────────────────────────────────

export function Modal({
  open,
  title,
  onClose,
  children,
  wide,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  wide?: boolean;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className={`max-h-[90vh] w-full overflow-y-auto rounded-xl bg-white p-5 shadow-xl ${wide ? 'max-w-3xl' : 'max-w-lg'}`}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button onClick={onClose} className="rounded p-1 text-slate-400 hover:bg-slate-100">
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ── Pagination ──────────────────────────────────────────────────────────────

export function Pagination({
  page,
  totalPage,
  onChange,
}: {
  page: number;
  totalPage: number;
  onChange: (page: number) => void;
}) {
  if (totalPage <= 1) return null;
  return (
    <div className="mt-4 flex items-center justify-end gap-2 text-sm">
      <Button variant="secondary" disabled={page <= 1} onClick={() => onChange(page - 1)}>
        Sebelumnya
      </Button>
      <span className="text-slate-500">
        Hal {page} dari {totalPage}
      </span>
      <Button variant="secondary" disabled={page >= totalPage} onClick={() => onChange(page + 1)}>
        Berikutnya
      </Button>
    </div>
  );
}

// ── FormField ───────────────────────────────────────────────────────────────

export interface SelectOption {
  value: string;
  label: string;
}

export function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-slate-600">{label}</span>
      {children}
    </label>
  );
}

export const inputClass =
  'w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none';

// ── EmptyState ──────────────────────────────────────────────────────────────

export function EmptyState({ message }: { message: string }) {
  return <div className="py-12 text-center text-sm text-slate-400">{message}</div>;
}

export function formatRupiah(value: number): string {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(value);
}

export function formatDate(value?: string | null): string {
  if (!value) return '-';
  const d = new Date(value);
  if (Number.isNaN(d.getTime()) || d.getFullYear() < 1971) return '-';
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
}

export const dayNames = ['', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];
