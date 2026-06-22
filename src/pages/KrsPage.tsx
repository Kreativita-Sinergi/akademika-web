import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Check, Plus, Send, Trash2, X } from 'lucide-react';
import { useList, useOptions } from '../hooks/useList';
import api from '../lib/axios';
import { createResource, deleteResource, errorMessage } from '../api/crud';
import { Badge, Button, EmptyState, Field, Modal, Pagination, inputClass } from '../components/ui';
import type { AcademicYear, ApiResponse, KrsPlan, Schedule } from '../types';

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

  return (
    <div>
      <h1 className="mb-4 text-xl font-semibold">Kartu Rencana Studi (KRS)</h1>

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
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-semibold">KRS Saya</h2>
              <Badge value={plan.status} />
            </div>
            {plan.status === 'ditolak' && plan.advisor_note && (
              <div className="mb-2 rounded-lg bg-red-50 p-2 text-sm text-red-600">Catatan PA: {plan.advisor_note}</div>
            )}
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs uppercase text-slate-500">
                  <th className="py-2">Mata Kuliah</th>
                  <th>SKS</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {(plan.items ?? []).map((i) => (
                  <tr key={i.id} className="border-b last:border-0">
                    <td className="py-2">{i.course?.name ?? '-'}</td>
                    <td>{i.sks}</td>
                    <td className="text-right">
                      {editable && (
                        <button onClick={() => void removeItem(i.id)} className="rounded p-1 text-red-500 hover:bg-red-50">
                          <Trash2 size={14} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {(plan.items ?? []).length === 0 && <div className="py-4 text-center text-sm text-slate-400">Belum ada mata kuliah</div>}
            <div className="mt-3 flex items-center justify-between border-t pt-3">
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
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <h2 className="mb-3 font-semibold">Mata Kuliah Ditawarkan</h2>
              <div className="space-y-2">
                {offered.map((s) => {
                  const taken = takenCourseIds.has(s.course_id);
                  return (
                    <div key={s.id} className="flex items-center justify-between rounded-lg border border-slate-200 p-2.5">
                      <div className="text-sm">
                        <div className="font-medium">{s.course?.name ?? 'MK'}</div>
                        <div className="text-xs text-slate-400">{s.course?.sks ?? 0} SKS · {s.lecturer?.name ?? '-'}</div>
                      </div>
                      <button
                        disabled={taken}
                        onClick={() => void addCourse(s)}
                        className="rounded-lg border border-primary-200 p-1.5 text-primary-600 hover:bg-primary-50 disabled:opacity-30"
                      >
                        <Plus size={15} />
                      </button>
                    </div>
                  );
                })}
                {offered.length === 0 && <div className="py-4 text-center text-sm text-slate-400">Belum ada jadwal ditawarkan</div>}
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
  const { items, page, setPage, totalPage, loading, refresh } = useList<KrsPlan>('/krs', { status: 'diajukan' });
  const [target, setTarget] = useState<KrsPlan | null>(null);
  const [note, setNote] = useState('');

  const review = async (approve: boolean) => {
    if (!target) return;
    try {
      await createResource(`/krs/${target.id}/review`, { approve, advisor_note: note });
      toast.success(approve ? 'KRS disetujui' : 'KRS ditolak');
      setTarget(null);
      setNote('');
      void refresh();
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };

  return (
    <div>
      <h1 className="mb-4 text-xl font-semibold">Persetujuan KRS</h1>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase text-slate-500">
              <th className="px-4 py-3 font-medium">Mahasiswa</th>
              <th className="px-4 py-3 font-medium">Prodi</th>
              <th className="px-4 py-3 font-medium">Smt</th>
              <th className="px-4 py-3 font-medium">Total SKS</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 text-right font-medium">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {items.map((p) => (
              <tr key={p.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                <td className="px-4 py-3">
                  {p.student?.name ?? '-'}
                  <div className="text-xs text-slate-400">{p.student?.nim}</div>
                </td>
                <td className="px-4 py-3">{p.student?.study_program?.name ?? '-'}</td>
                <td className="px-4 py-3">{p.semester_number}</td>
                <td className="px-4 py-3">{p.total_sks}</td>
                <td className="px-4 py-3"><Badge value={p.status} /></td>
                <td className="px-4 py-3 text-right">
                  <Button variant="secondary" onClick={() => { setTarget(p); setNote(''); }}>Tinjau</Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!loading && items.length === 0 && <EmptyState message="Tidak ada KRS menunggu persetujuan" />}
      </div>

      <Pagination page={page} totalPage={totalPage} onChange={setPage} />

      <Modal open={Boolean(target)} title={`Tinjau KRS — ${target?.student?.name ?? ''}`} onClose={() => setTarget(null)}>
        {target && (
          <div className="mb-3 space-y-1 rounded-lg bg-slate-50 p-3 text-sm">
            <div>Mahasiswa: <span className="font-medium">{target.student?.name}</span> ({target.student?.nim})</div>
            <div>Semester: {target.semester_number}</div>
            <div>Total beban: <span className="font-semibold">{target.total_sks} SKS</span></div>
          </div>
        )}
        <Field label="Catatan untuk mahasiswa (opsional)">
          <textarea className={inputClass} rows={2} value={note} onChange={(e) => setNote(e.target.value)} />
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
