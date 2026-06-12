import { useEffect, useState } from 'react';
import api from '../lib/axios';
import { useOptions } from '../hooks/useList';
import { Field, inputClass } from '../components/ui';
import type { AcademicYear, ApiResponse, Khs, Transcript } from '../types';

// KHS per semester + transkrip lengkap untuk mahasiswa yang login.
export default function MyKhsPage() {
  const years = useOptions<AcademicYear>('/master/academic-years', (y) => `${y.name} ${y.semester}`);
  const [yearId, setYearId] = useState('');
  const [khs, setKhs] = useState<Khs | null>(null);
  const [transcript, setTranscript] = useState<Transcript | null>(null);

  useEffect(() => {
    void api
      .get<ApiResponse<Transcript>>('/grades/my-transcript')
      .then((res) => setTranscript(res.data.data))
      .catch(() => {});
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
    <div>
      <h1 className="mb-4 text-xl font-semibold">KHS & Transkrip</h1>

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="text-sm text-slate-500">IPK</div>
          <div className="mt-1 text-3xl font-bold text-primary-600">{transcript ? transcript.ipk.toFixed(2) : '-'}</div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="text-sm text-slate-500">Total SKS</div>
          <div className="mt-1 text-3xl font-bold">{transcript?.total_sks ?? '-'}</div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="text-sm text-slate-500">Program Studi</div>
          <div className="mt-1 text-lg font-semibold">{transcript?.study_program || '-'}</div>
        </div>
      </div>

      <div className="mb-4 max-w-xs">
        <Field label="Lihat KHS Tahun Akademik">
          <select className={inputClass} value={yearId} onChange={(e) => setYearId(e.target.value)}>
            <option value="">— pilih —</option>
            {years.map((y) => (
              <option key={y.value} value={y.value}>{y.label}</option>
            ))}
          </select>
        </Field>
      </div>

      {khs && (
        <div className="mb-6 rounded-xl border border-slate-200 bg-white p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-semibold">
              KHS {khs.academic_year} {khs.semester} (Semester {khs.semester_number})
            </h2>
            <div className="text-sm">
              IPS: <span className="font-bold text-primary-600">{khs.ips.toFixed(2)}</span>
            </div>
          </div>
          <KhsTable items={khs.items} />
        </div>
      )}

      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="mb-3 font-semibold">Transkrip Lengkap</h2>
        <KhsTable items={transcript?.items ?? []} />
      </div>
    </div>
  );
}

function KhsTable({ items }: { items: Khs['items'] }) {
  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b text-left text-xs uppercase text-slate-500">
          <th className="py-2">Kode</th>
          <th>Mata Kuliah</th>
          <th>SKS</th>
          <th>Nilai</th>
          <th>Huruf</th>
          <th>Bobot</th>
        </tr>
      </thead>
      <tbody>
        {items.map((item, i) => (
          <tr key={i} className="border-b last:border-0">
            <td className="py-2">{item.course_code}</td>
            <td>{item.course_name}</td>
            <td>{item.sks}</td>
            <td>{item.total_score.toFixed(1)}</td>
            <td className="font-semibold">{item.letter_grade}</td>
            <td>{item.grade_point.toFixed(1)}</td>
          </tr>
        ))}
        {items.length === 0 && (
          <tr>
            <td colSpan={6} className="py-6 text-center text-slate-400">
              Belum ada nilai
            </td>
          </tr>
        )}
      </tbody>
    </table>
  );
}
