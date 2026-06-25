import ResourcePage from '../components/crud/ResourcePage';
import { useOptions } from '../hooks/useList';
import type { Lecturer, StudyProgram } from '../types';

export default function LecturersPage() {
  const programs = useOptions<StudyProgram>('/master/programs', (p) => p.name);
  return (
    <ResourcePage<Lecturer>
      title="Dosen"
      endpoint="/lecturers"
      columns={[
        { key: 'nidn', label: 'NIDN', sortable: true },
        { key: 'name', label: 'Nama', sortable: true },
        { key: 'study_program', label: 'Homebase', render: (l) => l.study_program?.name ?? '-' },
        { key: 'position', label: 'Jabatan', sortable: true },
        { key: 'education_level', label: 'Pendidikan', sortable: true },
        { key: 'email', label: 'Email' },
      ]}
      fields={[
        { name: 'study_program_id', label: 'Prodi Homebase', type: 'select', options: programs, required: true },
        { name: 'nidn', label: 'NIDN', type: 'text' },
        { name: 'name', label: 'Nama Lengkap', type: 'text', required: true },
        {
          name: 'gender',
          label: 'Jenis Kelamin',
          type: 'select',
          options: [
            { value: 'L', label: 'Laki-laki' },
            { value: 'P', label: 'Perempuan' },
          ],
        },
        { name: 'email', label: 'Email', type: 'text' },
        { name: 'phone', label: 'No. HP', type: 'text' },
        { name: 'position', label: 'Jabatan Fungsional', type: 'text' },
        {
          name: 'education_level',
          label: 'Pendidikan Terakhir',
          type: 'select',
          options: [
            { value: 'S2', label: 'S2' },
            { value: 'S3', label: 'S3' },
          ],
        },
        { name: 'photo_url', label: 'Foto Dosen', type: 'file', folder: 'lecturers' },
        { name: 'create_account', label: 'Buatkan akun login dosen', type: 'checkbox' },
        { name: 'password', label: 'Password akun (min 8 karakter)', type: 'password' },
      ]}
      toForm={(l) => ({
        study_program_id: l.study_program_id,
        nidn: l.nidn,
        name: l.name,
        gender: l.gender,
        email: l.email,
        phone: l.phone,
        position: l.position,
        education_level: l.education_level,
        photo_url: (l as unknown as { photo_url?: string }).photo_url ?? '',
        create_account: false,
        password: '',
      })}
    />
  );
}
