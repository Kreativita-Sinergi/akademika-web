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
  POST: 'bg-emerald-100 text-emerald-700',
  PUT: 'bg-blue-100 text-blue-700',
  PATCH: 'bg-amber-100 text-amber-700',
  DELETE: 'bg-red-100 text-red-700',
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
          render: (log) => (
            <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${methodColor[log.method] ?? 'bg-muted text-muted-foreground'}`}>
              {log.method}
            </span>
          ),
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
