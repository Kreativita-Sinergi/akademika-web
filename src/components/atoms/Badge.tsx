import { Badge as UIBadge } from '@/components/ui/badge';

type BadgeVariant = 'default' | 'secondary' | 'success' | 'warning' | 'destructive' | 'info' | 'purple' | 'outline';

// Pemetaan status → variant Badge shadcn.
const variantByValue: Record<string, BadgeVariant> = {
  aktif: 'success', lunas: 'success', lulus: 'success', diterima: 'success', wisuda: 'success',
  selesai: 'success', dinilai: 'success', bekerja: 'success',
  terdaftar: 'info', ujian_dijadwalkan: 'info', berjalan: 'info', bimbingan: 'info',
  disetujui: 'info', daftar_ulang: 'purple', seminar: 'purple', sidang: 'purple',
  sebagian: 'warning', diajukan: 'warning', pengajuan: 'warning', revisi: 'warning', cuti: 'warning',
  menunggu: 'warning',
  belum_bayar: 'destructive', tidak_lulus: 'destructive', do: 'destructive', terlambat: 'destructive',
  keluar: 'secondary', mencari: 'secondary',
};

// Atom Badge — Badge shadcn dengan pemetaan warna status.
export function Badge({ value }: { value: string }) {
  return (
    <UIBadge variant={variantByValue[value] ?? 'secondary'} className="capitalize">
      {value.replace(/_/g, ' ')}
    </UIBadge>
  );
}
