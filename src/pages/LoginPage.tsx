import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { GraduationCap } from 'lucide-react';
import { Card, Form, Input, Button, Typography } from 'antd';
import { MailOutlined, LockOutlined } from '@ant-design/icons';
import api from '../lib/axios';
import { errorMessage } from '../api/crud';
import { useAuthStore } from '../store/auth';
import type { ApiResponse } from '../types';

interface LoginData {
  token: string;
  user_id: string;
  campus_id: string | null;
  name: string;
  email: string;
  role: 'SUPER_ADMIN' | 'CAMPUS_ADMIN' | 'LECTURER' | 'STUDENT';
  ref_id: string | null;
}

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const setAuth = useAuthStore((s) => s.setAuth);
  const navigate = useNavigate();

  const onFinish = async (values: { email: string; password: string }) => {
    setLoading(true);
    try {
      const res = await api.post<ApiResponse<LoginData>>('/auth/login', values);
      const data = res.data.data;
      setAuth(data.token, {
        user_id: data.user_id,
        campus_id: data.campus_id,
        name: data.name,
        email: data.email,
        role: data.role,
        ref_id: data.ref_id,
      });
      toast.success(`Selamat datang, ${data.name}`);
      navigate(data.role === 'STUDENT' || data.role === 'LECTURER' ? '/my-schedule' : '/');
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary-50 to-slate-100 p-4">
      <Card style={{ width: '100%', maxWidth: 380 }} variant="borderless" className="shadow-lg">
        <div className="mb-6 flex flex-col items-center">
          <GraduationCap className="mb-2 text-primary-600" size={40} />
          <Typography.Title level={3} style={{ margin: 0 }}>Akademika</Typography.Title>
          <Typography.Text type="secondary">Sistem Informasi Akademik Kampus</Typography.Text>
        </div>
        <Form layout="vertical" onFinish={onFinish} requiredMark={false} size="large">
          <Form.Item name="email" label="Email" rules={[{ required: true, type: 'email', message: 'Email tidak valid' }]}>
            <Input prefix={<MailOutlined />} placeholder="email@kampus.ac.id" />
          </Form.Item>
          <Form.Item name="password" label="Password" rules={[{ required: true, message: 'Password wajib diisi' }]}>
            <Input.Password prefix={<LockOutlined />} placeholder="••••••••" />
          </Form.Item>
          <Button type="primary" htmlType="submit" loading={loading} block>
            Masuk
          </Button>
        </Form>
      </Card>
    </div>
  );
}
