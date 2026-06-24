import { useEffect, useState } from 'react';
import { Row, Col, Card, Statistic, Progress, Flex, Spin, Typography } from 'antd';
import { DownloadOutlined } from '@ant-design/icons';
import { getResource } from '../api/crud';
import { downloadFile } from '../api/download';
import { Badge, Button, formatRupiah } from '../components/ui';

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

// Grafik batang vertikal untuk tren per bulan.
function TrendChart({ title, items }: { title: string; items: Kv[] }) {
  const max = Math.max(1, ...items.map((i) => i.total));
  const fmtMonth = (k: string) => {
    const [y, m] = k.split('-');
    return new Date(Number(y), Number(m) - 1, 1).toLocaleDateString('id-ID', { month: 'short' });
  };
  return (
    <Card title={title}>
      {items.length === 0 ? (
        <Typography.Text type="secondary">Belum ada data</Typography.Text>
      ) : (
        <div className="flex h-40 items-end justify-between gap-2">
          {items.map((item) => (
            <div key={item.key} className="flex flex-1 flex-col items-center gap-1">
              <span className="text-xs font-semibold text-slate-600">{item.total}</span>
              <div className="w-full rounded-t" style={{ height: `${(item.total / max) * 100}%`, minHeight: 4, background: '#4263eb' }} />
              <span className="text-[11px] text-slate-400">{fmtMonth(item.key)}</span>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

function BarList({ title, items, badge }: { title: string; items: Kv[]; badge?: boolean }) {
  const max = Math.max(1, ...items.map((i) => i.total));
  return (
    <Card title={title}>
      <Flex vertical gap={12}>
        {items.map((item) => (
          <div key={item.key}>
            <Flex justify="space-between" align="center" style={{ marginBottom: 2 }}>
              {badge ? <Badge value={item.key} /> : <span className="text-slate-600">{item.key}</span>}
              <span className="font-semibold">{item.total.toLocaleString('id-ID')}</span>
            </Flex>
            <Progress percent={Math.round((item.total / max) * 100)} showInfo={false} strokeColor="#4263eb" size="small" />
          </div>
        ))}
        {items.length === 0 && <Typography.Text type="secondary">Belum ada data</Typography.Text>}
      </Flex>
    </Card>
  );
}

// Laporan & analitik kampus untuk admin (bahan rapat & akreditasi).
export default function ReportsPage() {
  const [data, setData] = useState<ReportSummary | null>(null);

  useEffect(() => {
    void getResource<ReportSummary>('/reports').then(setData);
  }, []);

  if (!data) return <Flex justify="center" style={{ padding: 48 }}><Spin size="large" /></Flex>;

  const collectionRate = data.ukt.total_billed > 0 ? (data.ukt.total_paid / data.ukt.total_billed) * 100 : 0;

  return (
    <div>
      <Flex justify="space-between" align="center" style={{ marginBottom: 16 }}>
        <Typography.Title level={4} style={{ margin: 0 }}>Laporan & Analitik</Typography.Title>
        <Button variant="secondary" onClick={() => void downloadFile('/reports/students.csv', 'mahasiswa.csv')}>
          <span className="flex items-center gap-1.5"><DownloadOutlined /> Ekspor Mahasiswa (CSV)</span>
        </Button>
      </Flex>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={8}><Card><Statistic title="Total Tagihan UKT" value={formatRupiah(data.ukt.total_billed)} /></Card></Col>
        <Col xs={24} sm={8}><Card><Statistic title={`Terbayar (${collectionRate.toFixed(0)}%)`} value={formatRupiah(data.ukt.total_paid)} valueStyle={{ color: '#059669' }} /></Card></Col>
        <Col xs={24} sm={8}><Card><Statistic title="Tagihan Belum Lunas" value={data.ukt.unpaid_count} valueStyle={{ color: '#dc2626' }} /></Card></Col>
      </Row>

      <div style={{ marginBottom: 16 }}>
        <TrendChart title="Tren Pendaftar PMB (6 bulan terakhir)" items={data.applicant_trend ?? []} />
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}><BarList title="Funnel PMB (pendaftar per status)" items={data.applicant_funnel} badge /></Col>
        <Col xs={24} lg={12}><BarList title="Mahasiswa Aktif per Prodi" items={data.students_per_program} /></Col>
        <Col xs={24} lg={12}><BarList title="Mahasiswa per Angkatan" items={data.students_per_year} /></Col>
        <Col xs={24} lg={12}><BarList title="Distribusi IPK" items={data.gpa_distribution} /></Col>
      </Row>
    </div>
  );
}
