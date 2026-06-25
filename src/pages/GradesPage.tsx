import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { createResource, errorMessage, listResource } from '../api/crud';
import { useOptions } from '../hooks/useList';
import { Button, Field } from '../components/ui';
import { Input } from '@/components/ui/input';
import { Combobox } from '@/components/ui/combobox';
import { DataTable, type Column } from '@/components/ui/data-table';
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

  const saveRow = async (row: GradeRow) => {
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
        prev.map((r) => (r.student.id === row.student.id ? { ...r, letter: saved.letter_grade, total: saved.total_score } : r)),
      );
      toast.success(`Nilai ${row.student.name}: ${saved.letter_grade}`);
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };

  const update = (id: string, key: 'assignment' | 'mid' | 'final', value: string) => {
    setRows((prev) => prev.map((r) => (r.student.id === id ? { ...r, [key]: value } : r)));
  };

  const scoreCell = (key: 'assignment' | 'mid' | 'final') => (_: unknown, row: GradeRow) => (
    <Input
      type="number"
      min={0}
      max={100}
      className="h-8 w-20"
      value={row[key]}
      onChange={(e) => update(row.student.id, key, e.target.value)}
    />
  );

  const columns: Column<GradeRow>[] = [
    { title: 'NIM', key: 'nim', render: (_, r) => r.student.nim },
    { title: 'Nama', key: 'name', render: (_, r) => r.student.name },
    { title: 'Tugas (30%)', key: 'assignment', render: scoreCell('assignment') },
    { title: 'UTS (30%)', key: 'mid', render: scoreCell('mid') },
    { title: 'UAS (40%)', key: 'final', render: scoreCell('final') },
    { title: 'Total', key: 'total', render: (_, r) => (r.total != null ? r.total.toFixed(1) : '-') },
    { title: 'Huruf', key: 'letter', className: 'font-semibold', render: (_, r) => r.letter ?? '-' },
    {
      title: '',
      key: 'act',
      align: 'right',
      render: (_, r) => (
        <Button variant="secondary" onClick={() => void saveRow(r)}>Simpan</Button>
      ),
    },
  ];

  return (
    <div>
      <h1 className="mb-4 text-xl font-bold tracking-tight">Input Nilai</h1>
      <div className="mb-4 grid max-w-2xl grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label="Mata Kuliah">
          <Combobox options={courses} value={courseId} onChange={setCourseId} allowClear placeholder="— pilih —" />
        </Field>
        <Field label="Tahun Akademik">
          <Combobox options={years} value={yearId} onChange={setYearId} allowClear placeholder="— pilih —" />
        </Field>
      </div>

      {courseId && yearId && (
        <DataTable<GradeRow>
          columns={columns}
          rowKey={(r) => r.student.id}
          data={rows}
          loading={loading}
          emptyText="Tidak ada mahasiswa aktif di prodi mata kuliah ini"
        />
      )}
    </div>
  );
}
