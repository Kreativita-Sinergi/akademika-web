import { useEffect, useState } from 'react';
import { Row, Col, Card, Statistic, Select, Table, Flex, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { DownloadOutlined } from '@ant-design/icons';
import api from '../lib/axios';
import { useOptions } from '../hooks/useList';
import { downloadFile } from '../api/download';
import { Button } from '../components/ui';
import type { AcademicYear, ApiResponse, Khs, KhsItem, Transcript } from '../types';

const gradeColumns: ColumnsType<KhsItem> = [
  { title: 'Kode', dataIndex: 'course_code', key: 'code' },
  { title: 'Mata Kuliah', dataIndex: 'course_name', key: 'name' },
  { title: 'SKS', dataIndex: 'sks', key: 'sks', width: 70 },
  { title: 'Nilai', key: 'score', width: 80, render: (_, r) => r.total_score.toFixed(1) },
  { title: 'Huruf', dataIndex: 'letter_grade', key: 'letter', width: 80, render: (v) => <b>{v}</b> },
  { title: 'Bobot', key: 'point', width: 80, render: (_, r) => r.grade_point.toFixed(1) },
];

// KHS per semester + transkrip lengkap untuk mahasiswa yang login.
export default function MyKhsPage() {
  const years = useOptions<AcademicYear>('/master/academic-years', (y) => `${y.name} ${y.semester}`);
  const [yearId, setYearId] = useState('');
  const [khs, setKhs] = useState<Khs | null>(null);
  const [transcript, setTranscript] = useState<Transcript | null>(null);

  useEffect(() => {
    void api.get<ApiResponse<Transcript>>('/grades/my-transcript').then((res) => setTranscript(res.data.data)).catch(() => {});
  }, []);

  useEffect(() => {
    if (!yearId) {
      setKhs(null);
      return;
    }
    void api
      .get<ApiResponse<Khs>>('/grades/my-khs', { params: { academic_year_id: yearId } })
      .then((res) => setKhs(res.data.data))
      .catch(() => setKhs(null));
  }, [yearId]);

  return (
    <div>
      <Flex justify="space-between" align="center" style={{ marginBottom: 16 }}>
        <Typography.Title level={4} style={{ margin: 0 }}>KHS & Transkrip</Typography.Title>
        <Button variant="secondary" onClick={() => void downloadFile('/grades/my-transcript/pdf', 'transkrip.pdf')}>
          <span className="flex items-center gap-1.5"><DownloadOutlined /> Unduh Transkrip (PDF)</span>
        </Button>
      </Flex>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={8}>
          <Card><Statistic title="IPK" value={transcript ? transcript.ipk : 0} precision={2} valueStyle={{ color: '#4263eb' }} /></Card>
        </Col>
        <Col xs={24} sm={8}><Card><Statistic title="Total SKS" value={transcript?.total_sks ?? 0} /></Card></Col>
        <Col xs={24} sm={8}>
          <Card>
            <Typography.Text type="secondary">Program Studi</Typography.Text>
            <div className="mt-1 text-lg font-semibold">{transcript?.study_program || '-'}</div>
          </Card>
        </Col>
      </Row>

      <div className="mb-4 max-w-xs">
        <Typography.Text type="secondary">Lihat KHS Tahun Akademik</Typography.Text>
        <Select
          className="mt-1 w-full"
          value={yearId || undefined}
          placeholder="— pilih —"
          options={years}
          onChange={setYearId}
          allowClear
        />
      </div>

      {khs && (
        <Card
          style={{ marginBottom: 24 }}
          title={`KHS ${khs.academic_year} ${khs.semester} (Semester ${khs.semester_number})`}
          extra={
            <Flex align="center" gap={12}>
              <span>IPS: <b style={{ color: '#4263eb' }}>{khs.ips.toFixed(2)}</b></span>
              <Button variant="secondary" onClick={() => void downloadFile('/grades/my-khs/pdf', `khs-smt${khs.semester_number}.pdf`, { academic_year_id: yearId })}>
                <span className="flex items-center gap-1"><DownloadOutlined /> PDF</span>
              </Button>
            </Flex>
          }
        >
          <Table rowKey={(_, i) => String(i)} columns={gradeColumns} dataSource={khs.items} pagination={false} size="small" />
        </Card>
      )}

      <Card title="Transkrip Lengkap">
        <Table rowKey={(_, i) => String(i)} columns={gradeColumns} dataSource={transcript?.items ?? []} pagination={false} size="small" />
      </Card>
    </div>
  );
}
