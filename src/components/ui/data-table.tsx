import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { Loader2, Inbox, Search, ChevronUp, ChevronDown, ChevronsUpDown, Download } from 'lucide-react';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from './table';
import { Button } from './button';
import { Input } from './input';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from './dropdown-menu';
import { cn } from '@/lib/utils';
import type { ApiResponse } from '@/types';

export type ListParams = Record<string, string | number | undefined>;

export interface Column<T> {
  title: string;
  key?: string;
  dataIndex?: keyof T;
  align?: 'left' | 'right' | 'center';
  width?: number | string;
  className?: string;
  /** aktifkan sortir server-side untuk kolom ini */
  sortable?: boolean;
  /** nama kolom yang dikirim sebagai sort_by (default: String(dataIndex)) */
  sortKey?: string;
  render?: (value: unknown, record: T) => ReactNode;
  /** nilai teks untuk ekspor CSV (default: ambil dari dataIndex/key) */
  exportValue?: (record: T) => string | number;
}

// Ubah nilai (termasuk objek relasi) jadi teks untuk CSV.
function csvCell(v: unknown): string {
  if (v == null) return '';
  if (typeof v === 'object') {
    const o = v as Record<string, unknown>;
    return String(o.name ?? o.code ?? o.label ?? o.title ?? '');
  }
  if (typeof v === 'boolean') return v ? 'Ya' : 'Tidak';
  return String(v);
}

const alignClass = { left: 'text-left', right: 'text-right', center: 'text-center' };
const PAGE_SIZES = [10, 20, 50, 100];

// ── Mode statis (data sudah ada, mis. dashboard) ────────────────────────────
interface StaticProps<T> {
  columns: Column<T>[];
  rowKey: (record: T) => string;
  data: T[];
  loading?: boolean;
  emptyText?: string;
  fetcher?: undefined;
}

// ── Mode server (terintegrasi: fetch, search, sort, paginate sendiri) ───────
interface ServerProps<T> {
  columns: Column<T>[];
  rowKey: (record: T) => string;
  fetcher: (params: ListParams) => Promise<ApiResponse<T[]>>;
  /** filter tambahan. Berubah → reset ke halaman 1. */
  extraParams?: ListParams;
  searchable?: boolean;
  searchPlaceholder?: string;
  /** elemen di toolbar kanan (tombol Tambah, filter, dll) */
  toolbar?: ReactNode;
  defaultSortBy?: string;
  defaultOrder?: 'asc' | 'desc';
  defaultPageSize?: number;
  /** ubah angka ini untuk memaksa muat ulang (mis. setelah create/update/delete) */
  reloadKey?: number;
  /** tampilkan tombol Ekspor CSV (mengunduh seluruh data, bukan hanya 1 halaman) */
  exportable?: boolean;
  /** nama berkas CSV tanpa ekstensi */
  exportName?: string;
  emptyText?: string;
  data?: undefined;
}

type DataTableProps<T> = StaticProps<T> | ServerProps<T>;

export function DataTable<T>(props: DataTableProps<T>) {
  if (props.fetcher) return <ServerTable {...props} />;
  return <StaticTable {...props} />;
}

// ── Tabel statis ─────────────────────────────────────────────────────────────
function StaticTable<T>({ columns, rowKey, data, loading, emptyText }: StaticProps<T>) {
  return (
    <TableShell
      columns={columns}
      rowKey={rowKey}
      rows={data}
      loading={!!loading}
      emptyText={emptyText ?? 'Tidak ada data'}
    />
  );
}

// ── Tabel server terintegrasi ────────────────────────────────────────────────
function ServerTable<T>({
  columns,
  rowKey,
  fetcher,
  extraParams,
  searchable,
  searchPlaceholder = 'Cari...',
  toolbar,
  defaultSortBy = '',
  defaultOrder = 'asc',
  defaultPageSize = 10,
  reloadKey = 0,
  exportable = false,
  exportName = 'data',
  emptyText = 'Tidak ada data',
}: ServerProps<T>) {
  const [exporting, setExporting] = useState(false);
  const [rows, setRows] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(defaultPageSize);
  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');
  const [sortBy, setSortBy] = useState(defaultSortBy);
  const [order, setOrder] = useState<'asc' | 'desc'>(defaultOrder);
  const [total, setTotal] = useState(0);

  const extraKey = JSON.stringify(extraParams ?? {});

  // Debounce kotak pencarian agar tidak memukul backend tiap ketikan.
  useEffect(() => {
    const t = setTimeout(() => setDebounced(search), 350);
    return () => clearTimeout(t);
  }, [search]);

  // Reset ke halaman 1 saat search/filter/limit berubah.
  useEffect(() => {
    setPage(1);
  }, [debounced, extraKey, limit]);

  const load = useCallback(() => {
    setLoading(true);
    fetcher({
      page,
      limit,
      search: debounced || undefined,
      // Hanya kirim sort saat ada kolom sortable yang aktif dipilih,
      // agar entity tanpa kolom default tak memicu error order-by di backend.
      ...(sortBy ? { sort_by: sortBy, order_by: order } : {}),
      ...(JSON.parse(extraKey) as ListParams),
    })
      .then((r) => {
        setRows(r.data || []);
        setTotal(r.pagination?.total ?? (r.data?.length ?? 0));
      })
      .finally(() => setLoading(false));
  }, [fetcher, page, limit, debounced, sortBy, order, extraKey]);

  useEffect(() => {
    load();
  }, [load, reloadKey]);

  const totalPage = Math.max(1, Math.ceil(total / limit));

  const exportCsv = async () => {
    setExporting(true);
    try {
      const r = await fetcher({
        page: 1,
        limit: 100000,
        search: debounced || undefined,
        ...(JSON.parse(extraKey) as ListParams),
      });
      const allRows = r.data ?? [];
      const cols = columns.filter((c) => c.title && c.title !== 'Aksi' && !(c.key ?? '').startsWith('__'));
      const esc = (s: string) => (/[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s);
      const header = cols.map((c) => esc(c.title)).join(',');
      const body = allRows
        .map((rec) =>
          cols
            .map((c) => {
              const raw = c.exportValue
                ? c.exportValue(rec)
                : c.dataIndex
                  ? (rec as Record<string, unknown>)[c.dataIndex as string]
                  : c.key
                    ? (rec as Record<string, unknown>)[c.key]
                    : '';
              return esc(csvCell(raw));
            })
            .join(','),
        )
        .join('\n');
      const blob = new Blob(['﻿' + header + '\n' + body], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${exportName}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  };

  const onSort = (col: Column<T>) => {
    if (!col.sortable) return;
    const key = col.sortKey ?? String(col.dataIndex);
    if (sortBy === key) {
      setOrder((o) => (o === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(key);
      setOrder('asc');
    }
  };

  return (
    <div className="space-y-3">
      {(searchable || toolbar || exportable) && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {searchable ? (
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder={searchPlaceholder}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          ) : (
            <div className="hidden sm:block" />
          )}
          {(toolbar || exportable) && (
            <div className="flex flex-wrap items-center gap-2 [&>button]:flex-1 sm:[&>button]:flex-none">
              {exportable && (
                <Button variant="outline" size="sm" disabled={exporting} onClick={() => void exportCsv()}>
                  {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                  <span className="hidden sm:inline">Ekspor</span>
                </Button>
              )}
              {toolbar}
            </div>
          )}
        </div>
      )}

      <TableShell
        columns={columns}
        rowKey={rowKey}
        rows={rows}
        loading={loading}
        emptyText={emptyText}
        sortBy={sortBy}
        order={order}
        onSort={onSort}
        footer={
          total > 0 ? (
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border/70 bg-muted/30 px-4 py-2.5 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <span>Baris per halaman</span>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="h-7 gap-1 px-2">
                      {limit}
                      <ChevronsUpDown className="h-3 w-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="min-w-[4rem]">
                    {PAGE_SIZES.map((s) => (
                      <DropdownMenuItem key={s} onClick={() => setLimit(s)}>
                        {s}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div className="flex items-center gap-3">
                <span>
                  {(total === 0 ? 0 : (page - 1) * limit + 1)}–{Math.min(page * limit, total)} dari {total}
                </span>
                <div className="flex gap-1">
                  <Button variant="outline" size="sm" className="h-7 px-2" disabled={page <= 1} onClick={() => setPage(1)}>
                    «
                  </Button>
                  <Button variant="outline" size="sm" className="h-7 px-2" disabled={page <= 1} onClick={() => setPage(page - 1)}>
                    ‹
                  </Button>
                  <span className="flex h-7 items-center px-2 font-medium text-foreground">
                    {page}/{totalPage}
                  </span>
                  <Button variant="outline" size="sm" className="h-7 px-2" disabled={page >= totalPage} onClick={() => setPage(page + 1)}>
                    ›
                  </Button>
                  <Button variant="outline" size="sm" className="h-7 px-2" disabled={page >= totalPage} onClick={() => setPage(totalPage)}>
                    »
                  </Button>
                </div>
              </div>
            </div>
          ) : null
        }
      />
    </div>
  );
}

// ── Kerangka tabel bersama (header + body + footer slot) ─────────────────────
interface ShellProps<T> {
  columns: Column<T>[];
  rowKey: (record: T) => string;
  rows: T[];
  loading: boolean;
  emptyText: string;
  sortBy?: string;
  order?: 'asc' | 'desc';
  onSort?: (col: Column<T>) => void;
  footer?: ReactNode;
}

function TableShell<T>({ columns, rowKey, rows, loading, emptyText, sortBy, order, onSort, footer }: ShellProps<T>) {
  const colKey = useMemo(() => (c: Column<T>, i: number) => c.key ?? String(c.dataIndex) ?? i, []);

  return (
    <div className="overflow-x-auto rounded-2xl border border-border/70 bg-card shadow-sm">
      <Table>
        <TableHeader>
          <TableRow className="border-border/70 bg-muted/60 hover:bg-muted/60">
            {columns.map((col, i) => {
              const key = col.sortKey ?? String(col.dataIndex);
              const isActive = sortBy === key;
              return (
                <TableHead
                  key={colKey(col, i)}
                  className={cn(
                    'text-xs font-semibold uppercase tracking-wide',
                    alignClass[col.align ?? 'left'],
                    col.sortable && 'cursor-pointer select-none hover:text-foreground',
                    col.className,
                  )}
                  style={col.width ? { width: col.width } : undefined}
                  onClick={() => col.sortable && onSort?.(col)}
                >
                  <span className={cn('inline-flex items-center gap-1', col.align === 'right' && 'flex-row-reverse')}>
                    {col.title}
                    {col.sortable &&
                      (isActive ? (
                        order === 'asc' ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />
                      ) : (
                        <ChevronsUpDown className="h-3.5 w-3.5 opacity-40" />
                      ))}
                  </span>
                </TableHead>
              );
            })}
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            <TableRow className="hover:bg-transparent">
              <TableCell colSpan={columns.length} className="h-40 text-center">
                <Loader2 className="mx-auto h-6 w-6 animate-spin text-primary/70" />
              </TableCell>
            </TableRow>
          ) : rows.length === 0 ? (
            <TableRow className="hover:bg-transparent">
              <TableCell colSpan={columns.length} className="h-44 text-center">
                <div className="flex flex-col items-center gap-2 text-muted-foreground">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                    <Inbox className="h-6 w-6 opacity-60" />
                  </div>
                  <span className="text-sm">{emptyText}</span>
                </div>
              </TableCell>
            </TableRow>
          ) : (
            rows.map((record) => (
              <TableRow key={rowKey(record)} className="border-border/60">
                {columns.map((col, i) => {
                  const value = col.dataIndex ? record[col.dataIndex] : undefined;
                  return (
                    <TableCell
                      key={colKey(col, i)}
                      className={cn(alignClass[col.align ?? 'left'], col.className)}
                    >
                      {col.render ? col.render(value, record) : (value as ReactNode)}
                    </TableCell>
                  );
                })}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
      {footer}
    </div>
  );
}
