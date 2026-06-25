import { useEffect, useState } from 'react';
import { Megaphone, Pin } from 'lucide-react';
import ResourcePage from '../components/crud/ResourcePage';
import api from '../lib/axios';
import { Badge, EmptyState, formatDate } from '../components/ui';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { Announcement, ApiResponse } from '../types';

const audienceOptions = [
  { value: 'all', label: 'Semua warga kampus' },
  { value: 'lecturer', label: 'Dosen saja' },
  { value: 'student', label: 'Mahasiswa saja' },
];

const audienceLabel: Record<string, string> = {
  all: 'Semua',
  lecturer: 'Dosen',
  student: 'Mahasiswa',
};

// Admin: kelola pengumuman kampus.
export function AnnouncementsPage() {
  return (
    <ResourcePage<Announcement>
      title="Pengumuman"
      endpoint="/announcements"
      columns={[
        {
          key: 'title',
          label: 'Judul',
          render: (a) => (
            <span className="flex items-center gap-1.5">
              {a.is_pinned && <Pin size={13} className="text-amber-500" />}
              {a.title}
            </span>
          ),
        },
        { key: 'audience', label: 'Target', render: (a) => audienceLabel[a.audience] ?? a.audience },
        {
          key: 'is_published',
          label: 'Status',
          render: (a) => <Badge value={a.is_published ? 'terdaftar' : 'keluar'} />,
        },
        { key: 'created_at', label: 'Tanggal', render: (a) => formatDate(a.created_at) },
      ]}
      fields={[
        { name: 'title', label: 'Judul', type: 'text', required: true },
        { name: 'body', label: 'Isi Pengumuman', type: 'textarea', required: true },
        { name: 'audience', label: 'Target Audiens', type: 'select', options: audienceOptions, required: true },
        { name: 'is_pinned', label: 'Sematkan di atas (pin)', type: 'checkbox' },
        { name: 'is_published', label: 'Terbitkan', type: 'checkbox' },
      ]}
      toForm={(a) => ({
        title: a.title,
        body: a.body,
        audience: a.audience,
        is_pinned: a.is_pinned,
        is_published: a.is_published,
      })}
    />
  );
}

// Dosen & mahasiswa: papan pengumuman (read-only feed).
export function AnnouncementFeedPage() {
  const [items, setItems] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void api
      .get<ApiResponse<Announcement[]>>('/announcements/feed')
      .then((res) => setItems(res.data.data ?? []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-4">
      <h1 className="flex items-center gap-2 text-xl font-bold tracking-tight">
        <Megaphone size={20} className="text-primary" /> Pengumuman
      </h1>
      {!loading && items.length === 0 && <EmptyState message="Belum ada pengumuman" />}
      <div className="space-y-3">
        {items.map((a) => (
          <Card key={a.id} className={a.is_pinned ? 'border-amber-300' : undefined}>
            <CardHeader className="flex-row items-center justify-between gap-3 space-y-0 pb-2">
              <CardTitle className="flex items-center gap-1.5 text-base">
                {a.is_pinned && <Pin size={14} className="text-amber-500" />}
                {a.title}
              </CardTitle>
              <span className="text-xs text-muted-foreground">{formatDate(a.created_at)}</span>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-line text-sm text-muted-foreground">{a.body}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
