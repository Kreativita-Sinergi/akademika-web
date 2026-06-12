import ResourcePage from '../components/crud/ResourcePage';
import { useOptions } from '../hooks/useList';
import { dayNames } from '../components/ui';
import type { AcademicYear, ClassGroup, Course, Lecturer, Room, Schedule } from '../types';

// Penjadwalan kuliah: satu input jadwal otomatis menjadi jadwal kelas (mahasiswa)
// sekaligus jadwal mengajar dosen. Backend menolak jadwal bentrok (ruang/dosen/kelas).
export default function SchedulesPage() {
  const years = useOptions<AcademicYear>('/master/academic-years', (y) => `${y.name} ${y.semester}`);
  const classGroups = useOptions<ClassGroup>('/master/class-groups', (g) => g.code);
  const courses = useOptions<Course>('/master/courses', (c) => `${c.code} — ${c.name} (smt ${c.semester_number})`);
  const lecturers = useOptions<Lecturer>('/lecturers', (l) => l.name);
  const rooms = useOptions<Room>('/master/rooms', (r) => `${r.code} — ${r.name}`);

  return (
    <ResourcePage<Schedule>
      title="Jadwal Kuliah"
      endpoint="/schedules"
      columns={[
        { key: 'day_of_week', label: 'Hari', render: (s) => dayNames[s.day_of_week] ?? '-' },
        { key: 'time', label: 'Jam', render: (s) => `${s.start_time} - ${s.end_time}` },
        { key: 'course', label: 'Mata Kuliah', render: (s) => s.course?.name ?? '-' },
        { key: 'class_group', label: 'Rombel', render: (s) => s.class_group?.code ?? '-' },
        { key: 'lecturer', label: 'Dosen', render: (s) => s.lecturer?.name ?? '-' },
        { key: 'room', label: 'Ruangan', render: (s) => (s.room ? `${s.room.code} (${s.room.building})` : '-') },
        { key: 'academic_year', label: 'Tahun', render: (s) => (s.academic_year ? `${s.academic_year.name} ${s.academic_year.semester}` : '-') },
      ]}
      fields={[
        { name: 'academic_year_id', label: 'Tahun Akademik', type: 'select', options: years, required: true },
        { name: 'class_group_id', label: 'Rombel/Kelas', type: 'select', options: classGroups, required: true },
        { name: 'course_id', label: 'Mata Kuliah', type: 'select', options: courses, required: true },
        { name: 'lecturer_id', label: 'Dosen Pengampu', type: 'select', options: lecturers, required: true },
        { name: 'room_id', label: 'Ruangan', type: 'select', options: rooms, required: true },
        {
          name: 'day_of_week',
          label: 'Hari',
          type: 'select',
          required: true,
          options: dayNames
            .map((d, i) => ({ value: String(i), label: d }))
            .filter((_, i) => i > 0),
        },
        { name: 'start_time', label: 'Jam Mulai', type: 'time', required: true },
        { name: 'end_time', label: 'Jam Selesai', type: 'time', required: true },
      ]}
      toForm={(s) => ({
        academic_year_id: s.academic_year_id,
        class_group_id: s.class_group_id,
        course_id: s.course_id,
        lecturer_id: s.lecturer_id,
        room_id: s.room_id,
        day_of_week: String(s.day_of_week),
        start_time: s.start_time,
        end_time: s.end_time,
      })}
      toPayload={(form) => ({
        ...form,
        day_of_week: Number(form.day_of_week),
      })}
    />
  );
}
