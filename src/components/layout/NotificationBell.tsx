import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Badge, Popover, List, Button, Empty, Flex, Typography } from 'antd';
import { BellOutlined } from '@ant-design/icons';
import api from '../../lib/axios';
import { formatDate } from '../../utils/format';
import type { ApiResponse, AppNotification } from '../../types';

// Lonceng notifikasi in-app: agregasi status surat/beasiswa/tiket/cuti/kegiatan.
export default function NotificationBell() {
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
    load();
    const t = setInterval(load, 60000); // poll tiap 1 menit
    return () => clearInterval(t);
  }, []);

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

  const content = (
    <div style={{ width: 320 }}>
      <Flex justify="space-between" align="center" style={{ marginBottom: 8 }}>
        <Typography.Text strong>Notifikasi</Typography.Text>
        {unread > 0 && <Button type="link" size="small" onClick={() => void markAllRead()}>Tandai semua dibaca</Button>}
      </Flex>
      {items.length === 0 ? (
        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Tidak ada notifikasi" />
      ) : (
        <List
          size="small"
          style={{ maxHeight: 360, overflowY: 'auto' }}
          dataSource={items}
          renderItem={(n) => (
            <List.Item
              onClick={() => void openItem(n)}
              style={{ cursor: 'pointer', background: n.is_read ? undefined : 'rgba(66,99,235,0.06)', borderRadius: 8, paddingInline: 8 }}
            >
              <List.Item.Meta
                avatar={<Badge dot={!n.is_read} />}
                title={<span style={{ fontSize: 13 }}>{n.title}</span>}
                description={
                  <>
                    <div style={{ fontSize: 12 }}>{n.body}</div>
                    <div style={{ fontSize: 11, color: '#94a3b8' }}>{formatDate(n.created_at)}</div>
                  </>
                }
              />
            </List.Item>
          )}
        />
      )}
    </div>
  );

  return (
    <Popover content={content} trigger="click" open={open} onOpenChange={setOpen} placement="bottomRight">
      <Badge count={unread} size="small">
        <Button type="text" shape="circle" icon={<BellOutlined style={{ fontSize: 18 }} />} />
      </Badge>
    </Popover>
  );
}
