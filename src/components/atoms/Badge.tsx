import { Tag } from 'antd';

// Pemetaan status → warna Tag Ant Design (mengganti badge Tailwind lama).
const colorByValue: Record<string, string> = {
  aktif: 'green', lunas: 'green', lulus: 'green', diterima: 'green', wisuda: 'green',
  selesai: 'green', dinilai: 'green', bekerja: 'green',
  terdaftar: 'blue', ujian_dijadwalkan: 'blue', berjalan: 'blue', bimbingan: 'blue',
  disetujui: 'blue', daftar_ulang: 'geekblue', seminar: 'geekblue', sidang: 'geekblue',
  sebagian: 'gold', diajukan: 'gold', pengajuan: 'gold', revisi: 'gold', cuti: 'gold',
  menunggu: 'gold',
  belum_bayar: 'red', tidak_lulus: 'red', do: 'red', terlambat: 'red',
  keluar: 'default', mencari: 'default',
};

// Atom Badge — Ant Design Tag dengan pemetaan warna status.
export function Badge({ value }: { value: string }) {
  return (
    <Tag color={colorByValue[value] ?? 'default'} style={{ textTransform: 'capitalize', marginInlineEnd: 0 }}>
      {value.replace(/_/g, ' ')}
    </Tag>
  );
}
