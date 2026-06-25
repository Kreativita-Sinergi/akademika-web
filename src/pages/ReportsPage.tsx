import { useEffect, useState } from 'react';
import { Download, Loader2 } from 'lucide-react';
import { getResource } from '../api/crud';
import { downloadFile } from '../api/download';
import { Badge, Button, formatRupiah } from '../components/ui';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface Kv {
  key: string;
  total: number;
}

interface ReportSummary {
  applicant_funnel: Kv[];
  applicant_trend: Kv[];
  students_per_program: Kv[];
  students_per_year: Kv[];
  gpa_distribution: Kv[];
  ukt: { total_billed: number; total_paid: number; unpaid_count: number };
}

function StatCard({ title, value, valueClass }: { title: string; value: string | number; valueClass?: string }) {
  return (
    <Card>
      <CardContent className="p-5">
        <p className="text-sm text-muted-foreground">{title}</p>
        <p className={`mt-1 text-2xl font-bold tracking-tight ${valueClass ?? ''}`}>{value}</p>
      </CardContent>
    </Card>
  );
}

// Grafik batang vertikal untuk tren per bulan.
function TrendChart({ title, items }: { title: string; items: Kv[] }) {
  const max = Math.max(1, ...items.map((i) => i.total));
  const fmtMonth = (k: string) => {
    const [y, m] = k.split('-');
    return new Date(Number(y), Number(m) - 1, 1).toLocaleDateString('id-ID', { month: 'short' });
  };
  return (
    <Card>
      <CardHeader><CardTitle className="text-base">{title}</CardTitle></CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">Belum ada data</p>
        ) : (
          <div className="flex h-40 items-end justify-between gap-2">
            {items.map((item) => (
              <div key={item.key} className="flex flex-1 flex-col items-center gap-1">
                <span className="text-xs font-semibold text-foreground">{item.total}</span>
                <div className="w-full rounded-t bg-primary" style={{ height: `${(item.total / max) * 100}%`, minHeight: 4 }} />
                <span className="text-[11px] text-muted-foreground">{fmtMonth(item.key)}</span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function BarList({ title, items, badge }: { title: string; items: Kv[]; badge?: boolean }) {
  const max = Math.max(1, ...items.map((i) => i.total));
  return (
    <Card>
      <CardHeader><CardTitle className="text-base">{title}</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        {items.map((item) => (
          <div key={item.key}>
            <div className="mb-1 flex items-center justify-between">
              {badge ? <Badge value={item.key} /> : <span className="text-muted-foreground">{item.key}</span>}
              <span className="font-semibold">{item.total.toLocaleString('id-ID')}</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
              <div className="h-full rounded-full bg-primary" style={{ width: `${Math.round((item.total / max) * 100)}%` }} />
            </div>
          </div>
        ))}
        {items.length === 0 && <p className="text-sm text-muted-foreground">Belum ada data</p>}
      </CardContent>
    </Card>
  );
}

// Laporan & analitik kampus untuk admin (bahan rapat & akreditasi).
export default function ReportsPage() {
  const [data, setData] = useState<ReportSummary | null>(null);

  useEffect(() => {
    void getResource<ReportSummary>('/reports').then(setData);
  }, []);

  if (!data) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary/70" />
      </div>
    );
  }

  const collectionRate = data.ukt.total_billed > 0 ? (data.ukt.total_paid / data.ukt.total_billed) * 100 : 0;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold tracking-tight">Laporan & Analitik</h1>
        <Button variant="secondary" onClick={() => void downloadFile('/reports/students.csv', 'mahasiswa.csv')}>
          <span className="flex items-center gap-1.5"><Download className="h-4 w-4" /> Ekspor Mahasiswa (CSV)</span>
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard title="Total Tagihan UKT" value={formatRupiah(data.ukt.total_billed)} />
        <StatCard title={`Terbayar (${collectionRate.toFixed(0)}%)`} value={formatRupiah(data.ukt.total_paid)} valueClass="text-emerald-600" />
        <StatCard title="Tagihan Belum Lunas" value={data.ukt.unpaid_count} valueClass="text-red-600" />
      </div>

      <TrendChart title="Tren Pendaftar PMB (6 bulan terakhir)" items={data.applicant_trend ?? []} />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <BarList title="Funnel PMB (pendaftar per status)" items={data.applicant_funnel} badge />
        <BarList title="Mahasiswa Aktif per Prodi" items={data.students_per_program} />
        <BarList title="Mahasiswa per Angkatan" items={data.students_per_year} />
        <BarList title="Distribusi IPK" items={data.gpa_distribution} />
      </div>
    </div>
  );
}
