import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Check, Plus, Send, Trash2, X } from 'lucide-react';
import { useOptions } from '../hooks/useList';
import api from '../lib/axios';
import { createResource, deleteResource, errorMessage, listResource } from '../api/crud';
import { Badge, Button, EmptyState, Field, Modal, inputClass } from '../components/ui';
import { DataTable, type Column, type ListParams } from '@/components/ui/data-table';
import { Textarea } from '@/components/ui/textarea';
import type { AcademicYear, ApiResponse, KrsItem, KrsPlan, Schedule } from '../types';

// ── Mahasiswa: menyusun KRS ──────────────────────────────────────────────────
export function MyKrsPage() {
  const years = useOptions<AcademicYear>('/master/academic-years', (y) => `${y.name} ${y.semester}`);
  const [yearId, setYearId] = useState('');
  const [plan, setPlan] = useState<KrsPlan | null>(null);
  const [offered, setOffered] = useState<Schedule[]>([]);

  const loadPlan = async (yid: string) => {
    if (!yid) {
      setPlan(null);
      return;
    }
    try {
      const res = await api.post<ApiResponse<KrsPlan>>('/krs/ensure', null, { params: { academic_year_id: yid } });
      setPlan(res.data.data);
    } catch {
      setPlan(null);
    }
    void api
      .get<ApiResponse<Schedule[]>>('/krs/offered', { params: { academic_year_id: yid } })
      .then((res) => setOffered(res.data.data ?? []))
      .catch(() => setOffered([]));
  };

  useEffect(() => {
    void loadPlan(yearId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [yearId]);

  const editable = plan && (plan.status === 'draft' || plan.status === 'ditolak');
  const takenCourseIds = new Set((plan?.items ?? []).map((i) => i.course_id));

  const addCourse = async (s: Schedule) => {
    if (!plan) return;
    try {
      const res = await createResource<KrsPlan>(`/krs/${plan.id}/items`, { course_id: s.course_id, schedule_id: s.id });
      setPlan(res);
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };

  const removeItem = async (itemId: string) => {
    try {
      await deleteResource(`/krs/items/${itemId}`);
      void loadPlan(yearId);
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };

  const submit = async () => {
    if (!plan) return;
    try {
      const res = await createResource<KrsPlan>(`/krs/${plan.id}/submit`, {});
      setPlan(res);
      toast.success('KRS diajukan ke dosen wali');
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };

  const itemCols: Column<KrsItem>[] = [
    { title: 'Mata Kuliah', key: 'course', render: (_, i) => i.course?.name ?? '-' },
    { title: 'SKS', key: 'sks', dataIndex: 'sks', width: 70 },
    {
      title: '',
      key: 'act',
      align: 'right',
      width: 56,
      render: (_, i) =>
        editable ? (
          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => void removeItem(i.id)}>
            <Trash2 className="h-4 w-4" />
          </Button>
        ) : null,
    },
  ];

  return (
    <div>
      <h1 className="mb-4 text-xl font-bold tracking-tight">Kartu Rencana Studi (KRS)</h1>

      <div className="mb-4 max-w-sm">
        <Field label="Tahun Akademik">
          <select className={inputClass} value={yearId} onChange={(e) => setYearId(e.target.value)}>
            <option value="">— pilih —</option>
            {years.map((y) => (
              <option key={y.value} value={y.value}>{y.label}</option>
            ))}
          </select>
        </Field>
      </div>

      {!plan ? (
        <EmptyState message="Pilih tahun akademik untuk menyusun KRS" />
      ) : (
        <div className="grid gap-5 lg:grid-cols-2">
          {/* KRS tersusun */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">KRS Saya</h2>
              <Badge value={plan.status} />
            </div>
            {plan.status === 'ditolak' && plan.advisor_note && (
              <div className="rounded-lg bg-destructive/10 p-2.5 text-sm text-destructive">Catatan PA: {plan.advisor_note}</div>
            )}
            <DataTable<KrsItem> columns={itemCols} rowKey={(i) => i.id} data={plan.items ?? []} emptyText="Belum ada mata kuliah" />
            <div className="flex items-center justify-between border-t border-border/70 pt-3">
              <span className="text-sm">Total: <span className="font-bold">{plan.total_sks} SKS</span></span>
              {editable && (
                <Button disabled={(plan.items ?? []).length === 0} onClick={() => void submit()}>
                  <span className="flex items-center gap-1.5"><Send size={14} /> Ajukan ke Dosen Wali</span>
                </Button>
              )}
            </div>
          </div>

          {/* MK ditawarkan */}
          {editable && (
            <div className="rounded-2xl border border-border/70 bg-card p-4 shadow-sm">
              <h2 className="mb-3 font-semibold">Mata Kuliah Ditawarkan</h2>
              <div className="space-y-2">
                {offered.map((s) => {
                  const taken = takenCourseIds.has(s.course_id);
                  return (
                    <div key={s.id} className="flex items-center justify-between rounded-lg border border-border p-2.5">
                      <div className="text-sm">
                        <div className="font-medium">{s.course?.name ?? 'MK'}</div>
                        <div className="text-xs text-muted-foreground">{s.course?.sks ?? 0} SKS · {s.lecturer?.name ?? '-'}</div>
                      </div>
                      <Button variant="outline" size="icon" className="h-8 w-8" disabled={taken} onClick={() => void addCourse(s)}>
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  );
                })}
                {offered.length === 0 && <div className="py-4 text-center text-sm text-muted-foreground">Belum ada jadwal ditawarkan</div>}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Dosen wali / admin: persetujuan KRS ──────────────────────────────────────
export function KrsApprovalPage() {
  const [reloadKey, setReloadKey] = useState(0);
  const reload = () => setReloadKey((k) => k + 1);
  const fetcher = useCallback((p: ListParams) => listResource<KrsPlan>('/krs', p), []);
  const [target, setTarget] = useState<KrsPlan | null>(null);
  const [note, setNote] = useState('');

  const review = async (approve: boolean) => {
    if (!target) return;
    try {
      await createResource(`/krs/${target.id}/review`, { approve, advisor_note: note });
      toast.success(approve ? 'KRS disetujui' : 'KRS ditolak');
      setTarget(null);
      setNote('');
      reload();
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };

  const columns: Column<KrsPlan>[] = [
    {
      title: 'Mahasiswa',
      key: 'mhs',
      render: (_, p) => (
        <div>
          {p.student?.name ?? '-'}
          <div className="text-xs text-muted-foreground">{p.student?.nim}</div>
        </div>
      ),
    },
    { title: 'Prodi', key: 'prodi', render: (_, p) => p.student?.study_program?.name ?? '-' },
    { title: 'Smt', key: 'smt', dataIndex: 'semester_number', width: 70 },
    { title: 'Total SKS', key: 'sks', dataIndex: 'total_sks', width: 100 },
    { title: 'Status', key: 'status', render: (_, p) => <Badge value={p.status} /> },
    {
      title: 'Aksi',
      key: 'act',
      align: 'right',
      width: 100,
      render: (_, p) => (
        <Button variant="secondary" onClick={() => { setTarget(p); setNote(''); }}>Tinjau</Button>
      ),
    },
  ];

  return (
    <div>
      <h1 className="mb-4 text-xl font-bold tracking-tight">Persetujuan KRS</h1>

      <DataTable<KrsPlan>
        fetcher={fetcher}
        columns={columns}
        rowKey={(p) => p.id}
        reloadKey={reloadKey}
        extraParams={{ status: 'diajukan' }}
        emptyText="Tidak ada KRS menunggu persetujuan"
      />

      <Modal open={Boolean(target)} title={`Tinjau KRS — ${target?.student?.name ?? ''}`} onClose={() => setTarget(null)}>
        {target && (
          <div className="mb-3 space-y-1 rounded-lg bg-muted p-3 text-sm">
            <div>Mahasiswa: <span className="font-medium">{target.student?.name}</span> ({target.student?.nim})</div>
            <div>Semester: {target.semester_number}</div>
            <div>Total beban: <span className="font-semibold">{target.total_sks} SKS</span></div>
          </div>
        )}
        <Field label="Catatan untuk mahasiswa (opsional)">
          <Textarea rows={2} value={note} onChange={(e) => setNote(e.target.value)} />
        </Field>
        <div className="flex justify-end gap-2 pt-3">
          <Button variant="danger" onClick={() => void review(false)}>
            <span className="flex items-center gap-1.5"><X size={14} /> Tolak</span>
          </Button>
          <Button onClick={() => void review(true)}>
            <span className="flex items-center gap-1.5"><Check size={14} /> Setujui</span>
          </Button>
        </div>
      </Modal>
    </div>
  );
}
