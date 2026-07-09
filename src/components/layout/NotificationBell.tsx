import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell } from 'lucide-react';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import api from '../../lib/axios';
import { useAuthStore } from '../../store/auth';
import { formatDate } from '../../utils/format';
import type { ApiResponse, AppNotification } from '../../types';

// Lonceng notifikasi in-app: agregasi status surat/beasiswa/tiket/cuti/kegiatan.
// Notifikasi ber-scope kampus, jadi disembunyikan untuk SUPER_ADMIN (tanpa campus_id).
export default function NotificationBell() {
  const role = useAuthStore((s) => s.user?.role);
  const isSuperAdmin = role === 'SUPER_ADMIN';
  const [items, setItems] = useState<AppNotification[]>([]);
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const load = () => {
    void api
      .get<ApiResponse<{ items: AppNotification[]; unread: number }>>('/notifications')
      .then((res) => {
        setItems(res.data.data.items ?? []);
        setUnread(res.data.data.unread ?? 0);
      })
      .catch(() => {});
  };

  useEffect(() => {
    if (isSuperAdmin) return;
    load();
    const t = setInterval(load, 60000); // poll tiap 1 menit
    return () => clearInterval(t);
  }, [isSuperAdmin]);

  const markAllRead = async () => {
    await api.patch('/notifications/read-all');
    setUnread(0);
    setItems((prev) => prev.map((n) => ({ ...n, is_read: true })));
  };

  const openItem = async (n: AppNotification) => {
    if (!n.is_read) {
      await api.patch(`/notifications/${n.id}/read`);
      setUnread((u) => Math.max(0, u - 1));
      setItems((prev) => prev.map((x) => (x.id === n.id ? { ...x, is_read: true } : x)));
    }
    setOpen(false);
    if (n.link) navigate(n.link);
  };

  if (isSuperAdmin) return null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative text-muted-foreground">
          <Bell className="h-5 w-5" />
          {unread > 0 && (
            <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold text-destructive-foreground">
              {unread > 9 ? '9+' : unread}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between border-b px-4 py-2.5">
          <span className="text-sm font-semibold">Notifikasi</span>
          {unread > 0 && (
            <button className="text-xs font-medium text-primary hover:underline" onClick={() => void markAllRead()}>
              Tandai semua dibaca
            </button>
          )}
        </div>
        {items.length === 0 ? (
          <div className="px-4 py-8 text-center text-sm text-muted-foreground">Tidak ada notifikasi</div>
        ) : (
          <div className="max-h-96 overflow-y-auto py-1">
            {items.map((n) => (
              <button
                key={n.id}
                onClick={() => void openItem(n)}
                className={cn(
                  'flex w-full gap-2.5 px-4 py-2.5 text-left transition-colors hover:bg-accent',
                  !n.is_read && 'bg-primary/5',
                )}
              >
                <span className={cn('mt-1.5 h-2 w-2 shrink-0 rounded-full', n.is_read ? 'bg-transparent' : 'bg-primary')} />
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium leading-tight">{n.title}</span>
                  <span className="mt-0.5 block text-xs text-muted-foreground">{n.body}</span>
                  <span className="mt-0.5 block text-[11px] text-muted-foreground/70">{formatDate(n.created_at)}</span>
                </span>
              </button>
            ))}
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
