import ResourcePage from '../../components/crud/ResourcePage';
import { useOptions } from '../../hooks/useList';
import { Badge } from '../../components/ui';
import type { AcademicYear, ClassGroup, Course, Faculty, Lecturer, Room, StudyProgram } from '../../types';

export function FacultiesPage() {
  return (
    <ResourcePage<Faculty>
      title="Fakultas"
      endpoint="/master/faculties"
      columns={[
        { key: 'code', label: 'Kode', sortable: true },
        { key: 'name', label: 'Nama', sortable: true },
        { key: 'dean_name', label: 'Dekan', sortable: true },
      ]}
      fields={[
        { name: 'code', label: 'Kode', type: 'text', required: true },
        { name: 'name', label: 'Nama Fakultas', type: 'text', required: true },
        { name: 'dean_name', label: 'Nama Dekan', type: 'text' },
      ]}
    />
  );
}

export function ProgramsPage() {
  const faculties = useOptions<Faculty>('/master/faculties', (f) => f.name);
  return (
    <ResourcePage<StudyProgram>
      title="Program Studi"
      endpoint="/master/programs"
      columns={[
        { key: 'code', label: 'Kode', sortable: true },
        { key: 'name', label: 'Nama', sortable: true },
        { key: 'degree', label: 'Jenjang', sortable: true },
        { key: 'faculty', label: 'Fakultas', render: (p) => p.faculty?.name ?? '-' },
        { key: 'accreditation', label: 'Akreditasi', sortable: true },
        {
          key: 'is_teacher_education',
          label: 'Keguruan',
          render: (p) => (p.is_teacher_education ? 'Ya (PKL/PPL)' : 'Tidak'),
        },
      ]}
      fields={[
        { name: 'faculty_id', label: 'Fakultas', type: 'select', options: faculties, required: true },
        { name: 'code', label: 'Kode Prodi (dipakai di NIM)', type: 'text', required: true },
        { name: 'name', label: 'Nama Prodi', type: 'text', required: true },
        {
          name: 'degree',
          label: 'Jenjang',
          type: 'select',
          required: true,
          options: ['D3', 'D4', 'S1', 'S2'].map((d) => ({ value: d, label: d })),
        },
        { name: 'is_teacher_education', label: 'Prodi Keguruan (wajib PKL/PPL)', type: 'checkbox' },
        { name: 'head_name', label: 'Ketua Prodi', type: 'text' },
        { name: 'accreditation', label: 'Akreditasi', type: 'text' },
      ]}
      toForm={(p) => ({
        faculty_id: p.faculty_id,
        code: p.code,
        name: p.name,
        degree: p.degree,
        is_teacher_education: p.is_teacher_education,
        head_name: p.head_name,
        accreditation: p.accreditation,
      })}
    />
  );
}

export function AcademicYearsPage() {
  return (
    <ResourcePage<AcademicYear>
      title="Tahun Akademik"
      endpoint="/master/academic-years"
      columns={[
        { key: 'name', label: 'Tahun', sortable: true },
        { key: 'semester', label: 'Semester', sortable: true },
        {
          key: 'is_active',
          label: 'Status',
          render: (y) => <Badge value={y.is_active ? 'aktif' : 'nonaktif'} />,
        },
      ]}
      fields={[
        { name: 'name', label: 'Tahun (cth: 2026/2027)', type: 'text', required: true },
        {
          name: 'semester',
          label: 'Semester',
          type: 'select',
          required: true,
          options: [
            { value: 'ganjil', label: 'Ganjil' },
            { value: 'genap', label: 'Genap' },
          ],
        },
        { name: 'start_date', label: 'Tanggal Mulai', type: 'date' },
        { name: 'end_date', label: 'Tanggal Selesai', type: 'date' },
        { name: 'is_active', label: 'Jadikan tahun akademik aktif', type: 'checkbox' },
      ]}
      toForm={(y) => ({
        name: y.name,
        semester: y.semester,
        start_date: y.start_date?.slice(0, 10) ?? '',
        end_date: y.end_date?.slice(0, 10) ?? '',
        is_active: y.is_active,
      })}
      toPayload={(form) => ({
        ...form,
        start_date: form.start_date ? new Date(String(form.start_date)).toISOString() : undefined,
        end_date: form.end_date ? new Date(String(form.end_date)).toISOString() : undefined,
      })}
    />
  );
}

export function RoomsPage() {
  return (
    <ResourcePage<Room>
      title="Ruangan"
      endpoint="/master/rooms"
      columns={[
        { key: 'code', label: 'Kode', sortable: true },
        { key: 'name', label: 'Nama', sortable: true },
        { key: 'building', label: 'Gedung', sortable: true },
        { key: 'floor', label: 'Lantai', sortable: true },
        { key: 'capacity', label: 'Kapasitas', sortable: true },
        { key: 'type', label: 'Tipe' },
      ]}
      fields={[
        { name: 'code', label: 'Kode', type: 'text', required: true },
        { name: 'name', label: 'Nama Ruangan', type: 'text', required: true },
        { name: 'building', label: 'Gedung', type: 'text' },
        { name: 'floor', label: 'Lantai', type: 'number' },
        { name: 'capacity', label: 'Kapasitas', type: 'number' },
        {
          name: 'type',
          label: 'Tipe',
          type: 'select',
          options: [
            { value: 'kelas', label: 'Kelas' },
            { value: 'lab', label: 'Laboratorium' },
            { value: 'aula', label: 'Aula' },
          ],
        },
      ]}
    />
  );
}

export function CoursesPage() {
  const programs = useOptions<StudyProgram>('/master/programs', (p) => `${p.name} (${p.degree})`);
  return (
    <ResourcePage<Course>
      title="Mata Kuliah"
      endpoint="/master/courses"
      columns={[
        { key: 'code', label: 'Kode', sortable: true },
        { key: 'name', label: 'Nama', sortable: true },
        { key: 'sks', label: 'SKS', sortable: true },
        { key: 'semester_number', label: 'Semester (Paket)', sortable: true },
        { key: 'study_program', label: 'Prodi', render: (c) => c.study_program?.name ?? '-' },
      ]}
      fields={[
        { name: 'study_program_id', label: 'Program Studi', type: 'select', options: programs, required: true },
        { name: 'code', label: 'Kode MK', type: 'text', required: true },
        { name: 'name', label: 'Nama Mata Kuliah', type: 'text', required: true },
        { name: 'sks', label: 'SKS', type: 'number', required: true },
        { name: 'semester_number', label: 'Semester ke- (paket)', type: 'number', required: true },
        { name: 'is_mandatory', label: 'Mata kuliah wajib', type: 'checkbox' },
      ]}
      toForm={(c) => ({
        study_program_id: c.study_program_id,
        code: c.code,
        name: c.name,
        sks: c.sks,
        semester_number: c.semester_number,
        is_mandatory: c.is_mandatory,
      })}
    />
  );
}

export function ClassGroupsPage() {
  const programs = useOptions<StudyProgram>('/master/programs', (p) => p.name);
  const lecturers = useOptions<Lecturer>('/lecturers', (l) => l.name);
  return (
    <ResourcePage<ClassGroup>
      title="Rombel / Kelas"
      endpoint="/master/class-groups"
      columns={[
        { key: 'code', label: 'Kode', sortable: true },
        { key: 'study_program', label: 'Prodi', render: (g) => g.study_program?.name ?? '-' },
        { key: 'entry_year', label: 'Angkatan', sortable: true },
        { key: 'current_semester', label: 'Semester', sortable: true },
        { key: 'advisor', label: 'Dosen Wali', render: (g) => g.advisor?.name ?? '-' },
      ]}
      fields={[
        { name: 'study_program_id', label: 'Program Studi', type: 'select', options: programs, required: true },
        { name: 'code', label: 'Kode (cth: PGSD-26A)', type: 'text', required: true },
        { name: 'name', label: 'Nama', type: 'text' },
        { name: 'entry_year', label: 'Tahun Angkatan', type: 'number', required: true },
        { name: 'advisor_lecturer_id', label: 'Dosen Wali', type: 'select', options: lecturers },
      ]}
      toForm={(g) => ({
        study_program_id: g.study_program_id,
        code: g.code,
        name: g.name,
        entry_year: g.entry_year,
        advisor_lecturer_id: g.advisor_lecturer_id ?? '',
      })}
      toPayload={(form) => ({
        ...form,
        advisor_lecturer_id: form.advisor_lecturer_id || null,
      })}
    />
  );
}
