import { useCallback, useEffect, useState } from 'react';
import { listResource } from '../api/crud';

// Hook list + pagination + search untuk semua halaman resource.
export function useList<T>(endpoint: string, extraParams?: Record<string, string | number | undefined>) {
  const [items, setItems] = useState<T[]>([]);
  const [page, setPage] = useState(1);
  const [totalPage, setTotalPage] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);

  const extraKey = JSON.stringify(extraParams ?? {});

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const res = await listResource<T>(endpoint, {
        page,
        limit: 20,
        search: search || undefined,
        ...(JSON.parse(extraKey) as Record<string, string | number | undefined>),
      });
      setItems(res.data ?? []);
      setTotalPage(res.pagination?.total_page ?? 1);
    } finally {
      setLoading(false);
    }
  }, [endpoint, page, search, extraKey]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { items, page, setPage, totalPage, search, setSearch, loading, refresh };
}

// Hook opsi dropdown (mengambil sampai 100 item dari endpoint).
export function useOptions<T extends { id: string }>(
  endpoint: string,
  toLabel: (item: T) => string,
  enabled = true,
) {
  const [options, setOptions] = useState<{ value: string; label: string; raw: T }[]>([]);

  useEffect(() => {
    if (!enabled) return;
    void listResource<T>(endpoint, { page: 1, limit: 100 }).then((res) => {
      setOptions((res.data ?? []).map((item) => ({ value: item.id, label: toLabel(item), raw: item })));
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [endpoint, enabled]);

  return options;
}
