import type { ReactNode } from 'react';

// Atom Field — label + kontrol form (dipertahankan agar halaman lama kompatibel).
export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-slate-600">{label}</span>
      {children}
    </label>
  );
}

export interface SelectOption {
  value: string;
  label: string;
}

// Kelas input native agar selaras dengan tinggi/rounded Ant Design (untuk form custom).
export const inputClass =
  'w-full rounded-[8px] border border-[#d9d9d9] px-3 py-[7px] text-sm outline-none transition focus:border-[#4263eb] focus:shadow-[0_0_0_2px_rgba(66,99,235,0.1)]';
