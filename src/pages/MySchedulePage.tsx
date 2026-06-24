import { useEffect, useState } from 'react';
import { Row, Col, Card, Spin, Empty, Flex, Tag, Typography } from 'antd';
import { EnvironmentOutlined, ClockCircleOutlined } from '@ant-design/icons';
import { getResource } from '../api/crud';
import { dayNames } from '../components/ui';
import { useAuthStore } from '../store/auth';
import type { Schedule } from '../types';

// Jadwal otomatis untuk dosen (mengajar) & mahasiswa (kuliah + ruangan).
export default function MySchedulePage() {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const role = useAuthStore((s) => s.user?.role);

  useEffect(() => {
    void getResource<Schedule[]>('/schedules/my')
      .then((items) => setSchedules(items ?? []))
      .finally(() => setLoading(false));
  }, []);

  const byDay = new Map<number, Schedule[]>();
  schedules.forEach((s) => {
    const list = byDay.get(s.day_of_week) ?? [];
    list.push(s);
    byDay.set(s.day_of_week, list);
  });

  return (
    <div>
      <Typography.Title level={4} style={{ marginTop: 0, marginBottom: 4 }}>
        {role === 'LECTURER' ? 'Jadwal Mengajar Saya' : 'Jadwal Kuliah Saya'}
      </Typography.Title>
      <Typography.Paragraph type="secondary">
        {role === 'LECTURER'
          ? 'Jadwal terbentuk otomatis dari penjadwalan yang diinput admin kampus.'
          : 'Jadwal kelas Anda lengkap dengan ruangan tiap mata kuliah.'}
      </Typography.Paragraph>

      {loading && (
        <Flex justify="center" style={{ padding: 48 }}><Spin size="large" /></Flex>
      )}
      {!loading && schedules.length === 0 && (
        <Empty description="Belum ada jadwal pada tahun akademik aktif" style={{ padding: 48 }} />
      )}

      <Row gutter={[16, 16]}>
        {[1, 2, 3, 4, 5, 6, 7]
          .filter((day) => byDay.has(day))
          .map((day) => (
            <Col xs={24} lg={12} xl={8} key={day}>
              <Card title={dayNames[day]} styles={{ body: { padding: 0 } }}>
                {(byDay.get(day) ?? [])
                  .sort((a, b) => a.start_time.localeCompare(b.start_time))
                  .map((s, i, arr) => (
                    <div key={s.id} style={{ padding: '12px 16px', borderBottom: i < arr.length - 1 ? '1px solid #f0f0f0' : 'none' }}>
                      <Flex justify="space-between" align="center">
                        <span className="font-medium">{s.course?.name ?? '-'}</span>
                        <Tag icon={<ClockCircleOutlined />} bordered={false}>{s.start_time}–{s.end_time}</Tag>
                      </Flex>
                      <Flex justify="space-between" align="center" style={{ marginTop: 4, color: '#64748b', fontSize: 13 }}>
                        <span>{role === 'LECTURER' ? `Kelas ${s.class_group?.code ?? '-'}` : s.lecturer?.name ?? '-'}</span>
                        <span style={{ color: '#4263eb', fontWeight: 500 }}>
                          <EnvironmentOutlined /> {s.room ? `${s.room.code} · ${s.room.building}` : '-'}
                        </span>
                      </Flex>
                    </div>
                  ))}
              </Card>
            </Col>
          ))}
      </Row>
    </div>
  );
}
