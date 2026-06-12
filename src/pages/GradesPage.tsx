import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { createResource, errorMessage, listResource } from '../api/crud';
import { useOptions } from '../hooks/useList';
import { Button, EmptyState, Field, inputClass } from '../components/ui';
import type { AcademicYear, Course, Grade, Student } from '../types';

interface GradeRow {
  student: Student;
  assignment: string;
  mid: string;
  final: string;
  letter?: string;
  total?: number;
}

// Input nilai per mata kuliah: tugas 30% + UTS 30% + UAS 40% → huruf otomatis.
export default function GradesPage() {
  const courses = useOptions<Course>('/master/courses', (c) => `${c.code} — ${c.name}`);
  const years = useOptions<AcademicYear>('/master/academic-years', (y) => `${y.name} ${y.semester}`);

  const [courseId, setCourseId] = useState('');
  const [yearId, setYearId] = useState('');
  const [rows, setRows] = useState<GradeRow[]>([]);
  const [loading, setLoading] = useState(false);

  const selectedCourse = courses.find((c) => c.value === courseId)?.raw;

  const load = useCallback(async () => {
    if (!courseId || !yearId || !selectedCourse) return;
    setLoading(true);
    try {
      // Ambil mahasiswa prodi tsb + nilai yang sudah ada.
      const [studentsRes, gradesRes] = await Promise.all([
        listResource<Student>('/students', {
          study_program_id: selectedCourse.study_program_id,
          status: 'aktif',
          limit: 100,
        }),
        listResource<Grade>('/grades', { course_id: courseId, academic_year_id: yearId, limit: 100 }),
      ]);
      const gradeMap = new Map((gradesRes.data ?? []).map((g) => [g.student_id, g]));
      setRows(
        (studentsRes.data ?? []).map((student) => {
          const g = gradeMap.get(student.id);
          return {
            student,
            assignment: g ? String(g.assignment_score) : '',
            mid: g ? String(g.mid_score) : '',
            final: g ? String(g.final_score) : '',
            letter: g?.letter_grade,
            total: g?.total_score,
          };
        }),
      );
    } finally {
      setLoading(false);
    }
  }, [courseId, yearId, selectedCourse]);

  useEffect(() => {
    void load();
  }, [load]);

  const saveRow = async (row: GradeRow, index: number) => {
    try {
      const saved = await createResource<Grade>('/grades', {
        student_id: row.student.id,
        course_id: courseId,
        academic_year_id: yearId,
        assignment_score: Number(row.assignment || 0),
        mid_score: Number(row.mid || 0),
        final_score: Number(row.final || 0),
      });
      setRows((prev) =>
        prev.map((r, i) => (i === index ? { ...r, letter: saved.letter_grade, total: saved.total_score } : r)),
      );
      toast.success(`Nilai ${row.student.name}: ${saved.letter_grade}`);
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };

  const update = (index: number, key: 'assignment' | 'mid' | 'final', value: string) => {
    setRows((prev) => prev.map((r, i) => (i === index ? { ...r, [key]: value } : r)));
  };

  return (
    <div>
      <h1 className="mb-4 text-xl font-semibold">Input Nilai</h1>
      <div className="mb-4 grid max-w-2xl grid-cols-2 gap-3">
        <Field label="Mata Kuliah">
          <select className={inputClass} value={courseId} onChange={(e) => setCourseId(e.target.value)}>
            <option value="">— pilih —</option>
            {courses.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
        </Field>
        <Field label="Tahun Akademik">
          <select className={inputClass} value={yearId} onChange={(e) => setYearId(e.target.value)}>
            <option value="">— pilih —</option>
            {years.map((y) => (
              <option key={y.value} value={y.value}>{y.label}</option>
            ))}
          </select>
        </Field>
      </div>

      {courseId && yearId && (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-slate-50 text-left text-xs uppercase text-slate-500">
                <th className="px-4 py-3">NIM</th>
                <th className="px-4 py-3">Nama</th>
                <th className="px-4 py-3">Tugas (30%)</th>
                <th className="px-4 py-3">UTS (30%)</th>
                <th className="px-4 py-3">UAS (40%)</th>
                <th className="px-4 py-3">Total</th>
                <th className="px-4 py-3">Huruf</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={row.student.id} className="border-b last:border-0">
                  <td className="px-4 py-2">{row.student.nim}</td>
                  <td className="px-4 py-2">{row.student.name}</td>
                  {(['assignment', 'mid', 'final'] as const).map((key) => (
                    <td key={key} className="px-4 py-2">
                      <input
                        type="number"
                        min={0}
                        max={100}
                        className="w-20 rounded border border-slate-300 px-2 py-1"
                        value={row[key]}
                        onChange={(e) => update(i, key, e.target.value)}
                      />
                    </td>
                  ))}
                  <td className="px-4 py-2">{row.total != null ? row.total.toFixed(1) : '-'}</td>
                  <td className="px-4 py-2 font-semibold">{row.letter ?? '-'}</td>
                  <td className="px-4 py-2 text-right">
                    <Button variant="secondary" onClick={() => void saveRow(row, i)}>
                      Simpan
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!loading && rows.length === 0 && <EmptyState message="Tidak ada mahasiswa aktif di prodi mata kuliah ini" />}
        </div>
      )}
    </div>
  );
}
