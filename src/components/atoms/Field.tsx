import type { ReactNode } from 'react';

// Atom Field — label + kontrol form (dipertahankan agar halaman lama kompatibel).
export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-foreground">{label}</span>
      {children}
    </label>
  );
}

export interface SelectOption {
  value: string;
  label: string;
}

// Kelas input native bergaya shadcn (dipakai input/select native di halaman lama).
export const inputClass =
  'flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50';
