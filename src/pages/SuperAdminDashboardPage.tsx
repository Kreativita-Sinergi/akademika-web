import { useEffect, useState } from 'react';
import { Building2, RefreshCw } from 'lucide-react';
import { listResource, errorMessage } from '../api/crud';
import { Badge, EmptyState } from '../components/ui';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Loading } from '../components/atoms/Loading';
import { formatDate } from '../utils/format';
import type { Campus } from '../types';

// Dashboard super admin platform — daftar tenant kampus (read-only).
export default function SuperAdminDashboardPage() {
  const [campuses, setCampuses] = useState<Campus[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = () => {
    setError(null);
    setCampuses(null);
    listResource<Campus>('/campuses', { page: 1, limit: 100 })
      .then((r) => setCampuses(r.data ?? []))
      .catch((err) => setError(errorMessage(err)));
  };

  useEffect(load, []);

  if (error) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 text-center">
        <p className="text-sm text-muted-foreground">{error}</p>
        <Button variant="outline" onClick={load}>
          <RefreshCw className="h-4 w-4" /> Coba lagi
        </Button>
      </div>
    );
  }

  if (!campuses) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loading size="lg" />
      </div>
    );
  }

  const active = campuses.filter((c) => c.is_active).length;

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-bold tracking-tight">Institusi (Tenant)</h1>

      <div className="grid grid-cols-2 gap-4 sm:max-w-md">
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100">
              <Building2 className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Institusi</p>
              <p className="text-2xl font-bold tracking-tight">{campuses.length.toLocaleString('id-ID')}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100">
              <Building2 className="h-6 w-6 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Institusi Aktif</p>
              <p className="text-2xl font-bold tracking-tight">{active.toLocaleString('id-ID')}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Daftar Institusi</CardTitle>
        </CardHeader>
        <CardContent>
          {campuses.length === 0 ? (
            <EmptyState message="Belum ada institusi terdaftar" />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Kode</TableHead>
                  <TableHead>Nama</TableHead>
                  <TableHead>Jenjang</TableHead>
                  <TableHead>Kota</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Terdaftar</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {campuses.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">{c.code}</TableCell>
                    <TableCell>{c.name}</TableCell>
                    <TableCell>{c.education_level || 'UNIVERSITY'}</TableCell>
                    <TableCell>{c.city || '-'}</TableCell>
                    <TableCell>{c.email || '-'}</TableCell>
                    <TableCell>
                      <Badge value={c.is_active ? 'aktif' : 'nonaktif'} />
                    </TableCell>
                    <TableCell>{formatDate(c.created_at)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
