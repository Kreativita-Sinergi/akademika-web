import { useEffect, useState } from 'react';
import { Row, Col, Card, Statistic, Spin, Empty, Flex, Typography } from 'antd';
import {
  TeamOutlined,
  SolutionOutlined,
  BankOutlined,
  CalendarOutlined,
  ContactsOutlined,
  ReadOutlined,
} from '@ant-design/icons';
import { getResource } from '../api/crud';
import { Badge } from '../components/ui';
import type { DashboardSummary } from '../types';
import type { ReactNode } from 'react';

function StatCard({ label, value, icon, color }: { label: string; value: number; icon: ReactNode; color: string }) {
  return (
    <Card>
      <Statistic
        title={label}
        value={value}
        prefix={<span style={{ color }}>{icon}</span>}
        groupSeparator="."
      />
    </Card>
  );
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardSummary | null>(null);

  useEffect(() => {
    void getResource<DashboardSummary>('/dashboard').then(setData);
  }, []);

  if (!data) {
    return (
      <Flex justify="center" align="center" style={{ minHeight: '50vh' }}>
        <Spin size="large" />
      </Flex>
    );
  }

  const stats = [
    { label: 'Total Mahasiswa', value: data.total_students, icon: <TeamOutlined />, color: '#2563eb' },
    { label: 'Mahasiswa Aktif', value: data.active_students, icon: <TeamOutlined />, color: '#059669' },
    { label: 'Dosen', value: data.total_lecturers, icon: <ContactsOutlined />, color: '#4f46e5' },
    { label: 'Program Studi', value: data.total_programs, icon: <ReadOutlined />, color: '#7c3aed' },
    { label: 'Pendaftar PMB', value: data.total_applicants, icon: <SolutionOutlined />, color: '#d97706' },
    { label: 'Jadwal Hari Ini', value: data.today_schedules, icon: <CalendarOutlined />, color: '#0891b2' },
  ];

  return (
    <div>
      <Typography.Title level={4} style={{ marginTop: 0 }}>Dashboard</Typography.Title>

      <Row gutter={[16, 16]}>
        {stats.map((s) => (
          <Col xs={12} md={8} xl={4} key={s.label}>
            <StatCard {...s} />
          </Col>
        ))}
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} lg={12}>
          <Card title="Mahasiswa per Status">
            {Object.keys(data.students_by_status ?? {}).length === 0 ? (
              <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Belum ada data mahasiswa" />
            ) : (
              <Flex vertical gap={10}>
                {Object.entries(data.students_by_status ?? {}).map(([status, count]) => (
                  <Flex key={status} justify="space-between" align="center">
                    <Badge value={status} />
                    <span className="font-medium">{count.toLocaleString('id-ID')}</span>
                  </Flex>
                ))}
              </Flex>
            )}
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="Perlu Perhatian">
            <Flex vertical gap={12}>
              <Flex justify="space-between" align="center" style={{ background: '#fffbeb', color: '#b45309', padding: '10px 12px', borderRadius: 8 }}>
                <span><SolutionOutlined /> Pendaftar belum diproses</span>
                <b>{data.pending_applicants}</b>
              </Flex>
              <Flex justify="space-between" align="center" style={{ background: '#fef2f2', color: '#b91c1c', padding: '10px 12px', borderRadius: 8 }}>
                <span><BankOutlined /> Tagihan UKT belum lunas</span>
                <b>{data.unpaid_invoices}</b>
              </Flex>
            </Flex>
          </Card>
        </Col>
      </Row>
    </div>
  );
}
