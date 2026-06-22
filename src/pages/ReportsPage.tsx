import { useEffect, useState } from 'react';
import { Download } from 'lucide-react';
import { getResource } from '../api/crud';
import { downloadFile } from '../api/download';
import { Badge, Button, formatRupiah } from '../components/ui';

interface Kv {
  key: string;
  total: number;
}

interface ReportSummary {
  applicant_funnel: Kv[];
  students_per_program: Kv[];
  students_per_year: Kv[];
  gpa_distribution: Kv[];
  ukt: { total_billed: number; total_paid: number; unpaid_count: number };
}

function BarList({ title, items, badge }: { title: string; items: Kv[]; badge?: boolean }) {
  const max = Math.max(1, ...items.map((i) => i.total));
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <h2 className="mb-4 font-semibold">{title}</h2>
      <div className="space-y-3">
        {items.map((item) => (
          <div key={item.key}>
            <div className="mb-1 flex items-center justify-between text-sm">
              {badge ? <Badge value={item.key} /> : <span className="text-slate-600">{item.key}</span>}
              <span className="font-semibold">{item.total.toLocaleString('id-ID')}</span>
            </div>
            <div className="h-2 rounded-full bg-slate-100">
              <div className="h-2 rounded-full bg-primary-500" style={{ width: `${(item.total / max) * 100}%` }} />
            </div>
          </div>
        ))}
        {items.length === 0 && <div className="text-sm text-slate-400">Belum ada data</div>}
      </div>
    </div>
  );
}

// Laporan & analitik kampus untuk admin (bahan rapat & akreditasi).
export default function ReportsPage() {
  const [data, setData] = useState<ReportSummary | null>(null);

  useEffect(() => {
    void getResource<ReportSummary>('/reports').then(setData);
  }, []);

  if (!data) return <div className="py-12 text-center text-slate-400">Memuat...</div>;

  const collectionRate = data.ukt.total_billed > 0 ? (data.ukt.total_paid / data.ukt.total_billed) * 100 : 0;

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Laporan & Analitik</h1>
        <Button
          variant="secondary"
          onClick={() => void downloadFile('/reports/students.csv', 'mahasiswa.csv')}
        >
          <span className="flex items-center gap-1.5">
            <Download size={15} /> Ekspor Mahasiswa (CSV)
          </span>
        </Button>
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="text-sm text-slate-500">Total Tagihan UKT</div>
          <div className="mt-1 text-2xl font-bold">{formatRupiah(data.ukt.total_billed)}</div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="text-sm text-slate-500">Terbayar ({collectionRate.toFixed(0)}%)</div>
          <div className="mt-1 text-2xl font-bold text-emerald-600">{formatRupiah(data.ukt.total_paid)}</div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="text-sm text-slate-500">Tagihan Belum Lunas</div>
          <div className="mt-1 text-2xl font-bold text-red-600">{data.ukt.unpaid_count}</div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <BarList title="Funnel PMB (pendaftar per status)" items={data.applicant_funnel} badge />
        <BarList title="Mahasiswa Aktif per Prodi" items={data.students_per_program} />
        <BarList title="Mahasiswa per Angkatan" items={data.students_per_year} />
        <BarList title="Distribusi IPK" items={data.gpa_distribution} />
      </div>
    </div>
  );
}
