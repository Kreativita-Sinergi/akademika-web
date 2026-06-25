import { useEffect, useState } from 'react';
import { listResource } from '../api/crud';

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
