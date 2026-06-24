import { Tag } from 'antd';
import ResourcePage from '../components/crud/ResourcePage';
import { Badge } from '../components/ui';

interface AuditLog {
  id: string;
  user_id: string | null;
  role: string;
  method: string;
  path: string;
  status_code: number;
  client_ip: string;
  created_at: string;
}

const methodColor: Record<string, string> = {
  POST: 'green',
  PUT: 'blue',
  PATCH: 'gold',
  DELETE: 'red',
};

// Jejak audit: semua request yang mengubah data, untuk akuntabilitas kampus.
export default function AuditLogsPage() {
  return (
    <ResourcePage<AuditLog>
      title="Audit Log"
      endpoint="/audit-logs"
      canCreate={false}
      canEdit={false}
      canDelete={false}
      columns={[
        {
          key: 'created_at',
          label: 'Waktu',
          render: (log) => new Date(log.created_at).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'medium' }),
        },
        { key: 'role', label: 'Role', render: (log) => <Badge value={log.role || '-'} /> },
        {
          key: 'method',
          label: 'Aksi',
          render: (log) => <Tag color={methodColor[log.method] ?? 'default'} bordered={false}>{log.method}</Tag>,
        },
        { key: 'path', label: 'Endpoint', render: (log) => <code className="text-xs">{log.path}</code> },
        {
          key: 'status_code',
          label: 'Status',
          render: (log) => (
            <span style={{ color: log.status_code < 400 ? '#059669' : '#dc2626' }}>{log.status_code}</span>
          ),
        },
        { key: 'client_ip', label: 'IP' },
      ]}
      fields={[]}
    />
  );
}
