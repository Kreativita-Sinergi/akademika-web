import { useEffect, useState } from 'react';
import { Download } from 'lucide-react';
import api from '../lib/axios';
import { useOptions } from '../hooks/useList';
import { downloadFile } from '../api/download';
import { Button } from '../components/ui';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Combobox } from '@/components/ui/combobox';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import type { AcademicYear, ApiResponse, Khs, KhsItem, Transcript } from '../types';

function GradeTable({ items }: { items: KhsItem[] }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-border/70">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/60 hover:bg-muted/60">
            <TableHead className="text-xs font-semibold uppercase tracking-wide">Kode</TableHead>
            <TableHead className="text-xs font-semibold uppercase tracking-wide">Mata Kuliah</TableHead>
            <TableHead className="text-xs font-semibold uppercase tracking-wide">SKS</TableHead>
            <TableHead className="text-xs font-semibold uppercase tracking-wide">Nilai</TableHead>
            <TableHead className="text-xs font-semibold uppercase tracking-wide">Huruf</TableHead>
            <TableHead className="text-xs font-semibold uppercase tracking-wide">Bobot</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.length === 0 ? (
            <TableRow><TableCell colSpan={6} className="py-6 text-center text-muted-foreground">Belum ada data</TableCell></TableRow>
          ) : (
            items.map((r, i) => (
              <TableRow key={`${r.course_code}-${i}`}>
                <TableCell>{r.course_code}</TableCell>
                <TableCell>{r.course_name}</TableCell>
                <TableCell>{r.sks}</TableCell>
                <TableCell>{r.total_score.toFixed(1)}</TableCell>
                <TableCell className="font-bold">{r.letter_grade}</TableCell>
                <TableCell>{r.grade_point.toFixed(1)}</TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}

// KHS per semester + transkrip lengkap untuk mahasiswa yang login.
export default function MyKhsPage() {
  const years = useOptions<AcademicYear>('/master/academic-years', (y) => `${y.name} ${y.semester}`);
  const [yearId, setYearId] = useState('');
  const [khs, setKhs] = useState<Khs | null>(null);
  const [transcript, setTranscript] = useState<Transcript | null>(null);

  useEffect(() => {
    void api.get<ApiResponse<Transcript>>('/grades/my-transcript').then((res) => setTranscript(res.data.data)).catch(() => {});
  }, []);

  useEffect(() => {
    if (!yearId) {
      setKhs(null);
      return;
    }
    void api
      .get<ApiResponse<Khs>>('/grades/my-khs', { params: { academic_year_id: yearId } })
      .then((res) => setKhs(res.data.data))
      .catch(() => setKhs(null));
  }, [yearId]);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold tracking-tight">KHS & Transkrip</h1>
        <Button variant="secondary" onClick={() => void downloadFile('/grades/my-transcript/pdf', 'transkrip.pdf')}>
          <span className="flex items-center gap-1.5"><Download className="h-4 w-4" /> Unduh Transkrip (PDF)</span>
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card><CardContent className="p-5"><p className="text-sm text-muted-foreground">IPK</p><p className="mt-1 text-2xl font-bold text-primary">{(transcript?.ipk ?? 0).toFixed(2)}</p></CardContent></Card>
        <Card><CardContent className="p-5"><p className="text-sm text-muted-foreground">Total SKS</p><p className="mt-1 text-2xl font-bold tracking-tight">{transcript?.total_sks ?? 0}</p></CardContent></Card>
        <Card><CardContent className="p-5"><p className="text-sm text-muted-foreground">Program Studi</p><p className="mt-1 text-lg font-semibold">{transcript?.study_program || '-'}</p></CardContent></Card>
      </div>

      <div className="max-w-xs">
        <p className="mb-1 text-sm text-muted-foreground">Lihat KHS Tahun Akademik</p>
        <Combobox options={years} value={yearId} onChange={setYearId} allowClear placeholder="— pilih —" />
      </div>

      {khs && (
        <Card>
          <CardHeader className="flex-row items-center justify-between gap-3 space-y-0">
            <CardTitle className="text-base">{`KHS ${khs.academic_year} ${khs.semester} (Semester ${khs.semester_number})`}</CardTitle>
            <div className="flex items-center gap-3">
              <span className="text-sm">IPS: <b className="text-primary">{khs.ips.toFixed(2)}</b></span>
              <Button variant="secondary" onClick={() => void downloadFile('/grades/my-khs/pdf', `khs-smt${khs.semester_number}.pdf`, { academic_year_id: yearId })}>
                <span className="flex items-center gap-1"><Download className="h-4 w-4" /> PDF</span>
              </Button>
            </div>
          </CardHeader>
          <CardContent><GradeTable items={khs.items} /></CardContent>
        </Card>
      )}

      <Card>
        <CardHeader><CardTitle className="text-base">Transkrip Lengkap</CardTitle></CardHeader>
        <CardContent><GradeTable items={transcript?.items ?? []} /></CardContent>
      </Card>
    </div>
  );
}
