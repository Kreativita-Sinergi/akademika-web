import {
  Banknote,
  BookOpen,
  Building2,
  CalendarDays,
  ClipboardList,
  GraduationCap,
  Home,
  School,
  ScrollText,
  Users,
  UserSquare2,
  Briefcase,
  Award,
  Contact,
  Megaphone,
  Mail,
  NotebookPen,
  Library,
  CalendarCheck,
  ClipboardCheck,
  Star,
  BadgeCheck,
  FileText,
  LifeBuoy,
  PauseCircle,
  Trophy,
  Activity,
  BookCheck,
  MapPin,
} from 'lucide-react';
import type { ReactNode } from 'react';

export interface MenuItem {
  to: string;
  label: string;
  icon: ReactNode;
}

export interface MenuSection {
  section: string;
  items: MenuItem[];
}

export const roleLabel: Record<string, string> = {
	SCHOOL_ADMIN: 'Admin Sekolah',
	TEACHER: 'Guru',
	PUPIL: 'Siswa',
	SCHOOL_APPLICANT: 'Calon Siswa',
  CAMPUS_ADMIN: 'Administrator',
  LECTURER: 'Dosen',
  STUDENT: 'Mahasiswa',
  SUPER_ADMIN: 'Super Admin',
};

// Menu admin disusun mengikuti ALUR PROSES AKADEMIK (pola SIAKAD kompetitor):
// Beranda → Data Pokok → Penerimaan (PMB) → Registrasi/Keuangan → Perkuliahan →
// Penilaian → Bimbingan/Layanan → Kemahasiswaan → Perpustakaan → Kelulusan.
export const adminMenu: MenuSection[] = [
  {
    section: 'Beranda',
    items: [
      { to: '/', label: 'Dashboard', icon: <Home size={17} /> },
      { to: '/announcements', label: 'Pengumuman', icon: <Megaphone size={17} /> },
      { to: '/academic-calendar', label: 'Kalender Akademik', icon: <CalendarDays size={17} /> },
      { to: '/reports', label: 'Laporan & Statistik', icon: <ScrollText size={17} /> },
      { to: '/audit-logs', label: 'Audit Log', icon: <ClipboardList size={17} /> },
    ],
  },
  {
    section: 'Data Pokok',
    items: [
      { to: '/master/faculties', label: 'Fakultas', icon: <Building2 size={17} /> },
      { to: '/master/programs', label: 'Program Studi', icon: <School size={17} /> },
      { to: '/master/academic-years', label: 'Tahun Akademik', icon: <CalendarDays size={17} /> },
      { to: '/master/rooms', label: 'Ruangan', icon: <MapPin size={17} /> },
      { to: '/master/courses', label: 'Mata Kuliah', icon: <BookOpen size={17} /> },
      { to: '/master/class-groups', label: 'Rombel / Kelas', icon: <Users size={17} /> },
      { to: '/lecturers', label: 'Data Dosen', icon: <Contact size={17} /> },
      { to: '/students', label: 'Data Mahasiswa', icon: <UserSquare2 size={17} /> },
    ],
  },
  {
    section: 'Penerimaan (PMB)',
    items: [
      { to: '/admission/waves', label: 'Gelombang', icon: <ClipboardList size={17} /> },
      { to: '/admission/exams', label: 'Jadwal Ujian Masuk', icon: <CalendarDays size={17} /> },
      { to: '/admission/questions', label: 'Bank Soal CBT', icon: <BookOpen size={17} /> },
      { to: '/admission/applicants', label: 'Pendaftar', icon: <UserSquare2 size={17} /> },
      { to: '/admission/attempts', label: 'Hasil CBT', icon: <ClipboardList size={17} /> },
    ],
  },
  {
    section: 'Registrasi & Keuangan',
    items: [
      { to: '/ukt/groups', label: 'Golongan UKT', icon: <Banknote size={17} /> },
      { to: '/ukt/invoices', label: 'Tagihan UKT', icon: <Banknote size={17} /> },
    ],
  },
  {
    section: 'Perkuliahan',
    items: [
      { to: '/schedules', label: 'Jadwal Kuliah', icon: <CalendarDays size={17} /> },
      { to: '/krs', label: 'Persetujuan KRS', icon: <ClipboardCheck size={17} /> },
      { to: '/attendance', label: 'Presensi', icon: <ClipboardList size={17} /> },
      { to: '/attendance/realization', label: 'Realisasi & Kehadiran Dosen', icon: <Activity size={17} /> },
      { to: '/attendance/settings', label: 'Pengaturan Presensi', icon: <MapPin size={17} /> },
      { to: '/elearning/materials', label: 'Materi Kuliah', icon: <Library size={17} /> },
      { to: '/elearning/assignments', label: 'Tugas (E-Learning)', icon: <ClipboardList size={17} /> },
    ],
  },
  {
    section: 'Penilaian & Evaluasi',
    items: [
      { to: '/exam-events', label: 'Jadwal Ujian UTS/UAS', icon: <CalendarCheck size={17} /> },
      { to: '/grades', label: 'Nilai', icon: <ScrollText size={17} /> },
      { to: '/evaluation/periods', label: 'Periode EDOM', icon: <Star size={17} /> },
      { to: '/evaluation/questions', label: 'Pertanyaan EDOM', icon: <NotebookPen size={17} /> },
      { to: '/bkd-review', label: 'Pengesahan BKD', icon: <BookCheck size={17} /> },
    ],
  },
  {
    section: 'Bimbingan & Layanan',
    items: [
      { to: '/guidances', label: 'Bimbingan (PA)', icon: <NotebookPen size={17} /> },
      { to: '/letters', label: 'Surat Akademik', icon: <Mail size={17} /> },
      { to: '/tickets', label: 'Helpdesk', icon: <LifeBuoy size={17} /> },
    ],
  },
  {
    section: 'Kemahasiswaan',
    items: [
      { to: '/organizations', label: 'Organisasi (Ormawa)', icon: <Users size={17} /> },
      { to: '/activities', label: 'Verifikasi Kegiatan/SKPI', icon: <Trophy size={17} /> },
      { to: '/scholarships', label: 'Program Beasiswa', icon: <Award size={17} /> },
      { to: '/scholarships/applications', label: 'Seleksi Beasiswa', icon: <BadgeCheck size={17} /> },
      { to: '/leave-requests', label: 'Cuti & Pengunduran', icon: <PauseCircle size={17} /> },
    ],
  },
  {
    section: 'Perpustakaan',
    items: [
      { to: '/library/books', label: 'Katalog Buku', icon: <BookOpen size={17} /> },
      { to: '/library/loans', label: 'Sirkulasi', icon: <Library size={17} /> },
    ],
  },
  {
    section: 'Kelulusan & Alumni',
    items: [
      { to: '/internships', label: 'PKL / KP', icon: <Briefcase size={17} /> },
      { to: '/theses', label: 'Tugas Akhir', icon: <ScrollText size={17} /> },
      { to: '/yudisium', label: 'Yudisium', icon: <BadgeCheck size={17} /> },
      { to: '/skpi', label: 'SKPI', icon: <FileText size={17} /> },
      { to: '/graduations', label: 'Wisuda', icon: <Award size={17} /> },
      { to: '/alumni', label: 'Alumni', icon: <GraduationCap size={17} /> },
    ],
  },
];

// Menu dosen: Beranda → Mengajar → Penilaian → Bimbingan → Kinerja → Data & Layanan.
export const lecturerMenu: MenuSection[] = [
  {
    section: 'Beranda',
    items: [
      { to: '/feed', label: 'Pengumuman', icon: <Megaphone size={17} /> },
      { to: '/calendar', label: 'Kalender Akademik', icon: <CalendarDays size={17} /> },
    ],
  },
  {
    section: 'Mengajar',
    items: [
      { to: '/my-schedule', label: 'Jadwal Mengajar', icon: <CalendarDays size={17} /> },
      { to: '/attendance', label: 'Presensi Kelas', icon: <ClipboardList size={17} /> },
      { to: '/attendance/realization', label: 'Realisasi Mengajar', icon: <Activity size={17} /> },
      { to: '/elearning/materials', label: 'Materi Kuliah', icon: <Library size={17} /> },
      { to: '/elearning/assignments', label: 'Tugas', icon: <ClipboardList size={17} /> },
    ],
  },
  {
    section: 'Penilaian',
    items: [{ to: '/grades', label: 'Input Nilai', icon: <ScrollText size={17} /> }],
  },
  {
    section: 'Bimbingan',
    items: [
      { to: '/guidances', label: 'Bimbingan Wali (PA)', icon: <NotebookPen size={17} /> },
      { to: '/krs', label: 'Persetujuan KRS', icon: <ClipboardCheck size={17} /> },
      { to: '/theses', label: 'Bimbingan TA', icon: <ScrollText size={17} /> },
      { to: '/internships', label: 'Bimbingan PKL/KP', icon: <Briefcase size={17} /> },
    ],
  },
  {
    section: 'Kinerja',
    items: [{ to: '/my-bkd', label: 'BKD Saya', icon: <BookCheck size={17} /> }],
  },
  {
    section: 'Data & Layanan',
    items: [
      { to: '/students', label: 'Data Mahasiswa', icon: <Users size={17} /> },
      { to: '/my-library', label: 'Perpustakaan', icon: <Library size={17} /> },
      { to: '/my-tickets', label: 'Bantuan / Helpdesk', icon: <LifeBuoy size={17} /> },
    ],
  },
];

// Menu mahasiswa: Beranda → Perkuliahan → Hasil Studi → Kemahasiswaan → Layanan.
export const studentMenu: MenuSection[] = [
  {
    section: 'Beranda',
    items: [
      { to: '/feed', label: 'Pengumuman', icon: <Megaphone size={17} /> },
      { to: '/calendar', label: 'Kalender Akademik', icon: <CalendarDays size={17} /> },
    ],
  },
  {
    section: 'Perkuliahan',
    items: [
      { to: '/my-krs', label: 'KRS', icon: <ClipboardCheck size={17} /> },
      { to: '/my-schedule', label: 'Jadwal Kuliah', icon: <CalendarDays size={17} /> },
      { to: '/my-elearning', label: 'E-Learning', icon: <Library size={17} /> },
      { to: '/my-exam-card', label: 'Kartu Ujian', icon: <CalendarCheck size={17} /> },
    ],
  },
  {
    section: 'Hasil Studi',
    items: [
      { to: '/my-khs', label: 'KHS & Transkrip', icon: <ScrollText size={17} /> },
      { to: '/my-evaluation', label: 'Evaluasi Dosen (EDOM)', icon: <Star size={17} /> },
    ],
  },
  {
    section: 'Kemahasiswaan',
    items: [
      { to: '/my-scholarship', label: 'Beasiswa', icon: <Award size={17} /> },
      { to: '/my-activities', label: 'Kegiatan & SKPI', icon: <Trophy size={17} /> },
      { to: '/my-leave', label: 'Cuti & Status', icon: <PauseCircle size={17} /> },
    ],
  },
  {
    section: 'Layanan',
    items: [
      { to: '/my-letters', label: 'Surat Akademik', icon: <Mail size={17} /> },
      { to: '/my-library', label: 'Perpustakaan', icon: <Library size={17} /> },
      { to: '/my-tickets', label: 'Bantuan / Helpdesk', icon: <LifeBuoy size={17} /> },
    ],
  },
];

// Menu super admin platform: hanya pengelolaan tenant kampus.
export const superAdminMenu: MenuSection[] = [
  {
    section: 'Platform',
    items: [{ to: '/', label: 'Institusi (Tenant)', icon: <Building2 size={17} /> }],
  },
];

export function menuForRole(role?: string): MenuSection[] {
  if (role === 'SUPER_ADMIN') return superAdminMenu;
  if (role === 'SCHOOL_APPLICANT') return [{ section: 'Pendaftaran', items: [{ to: '/', label: 'Status & Ujian', icon: <ClipboardList size={17} /> }] }];
  if (role === 'SCHOOL_ADMIN') return [{ section: 'Sekolah', items: [
    { to: '/', label: 'Dashboard', icon: <Home size={17} /> },
    { to: '/school/classes', label: 'Kelas', icon: <School size={17} /> },
    { to: '/school/subjects', label: 'Mata Pelajaran', icon: <BookOpen size={17} /> },
    { to: '/school/teachers', label: 'Guru', icon: <Contact size={17} /> },
    { to: '/school/pupils', label: 'Siswa', icon: <Users size={17} /> },
    { to: '/school/grades', label: 'Nilai', icon: <ScrollText size={17} /> },
    { to: '/school/attendance', label: 'Presensi', icon: <ClipboardList size={17} /> },
    { to: '/school/report-card', label: 'Rapor', icon: <FileText size={17} /> },
    { to: '/school/applicants', label: 'Pendaftar Baru', icon: <UserSquare2 size={17} /> },
    { to: '/school/exam', label: 'Ujian Masuk', icon: <ClipboardCheck size={17} /> },
    { to: '/school/invoices', label: 'Tagihan Sekolah', icon: <Banknote size={17} /> },
  ] }];
  if (role === 'TEACHER') return [{ section: 'Mengajar', items: [
    { to: '/', label: 'Dashboard', icon: <Home size={17} /> },
    { to: '/school/classes', label: 'Kelas', icon: <School size={17} /> },
    { to: '/school/subjects', label: 'Mata Pelajaran', icon: <BookOpen size={17} /> },
    { to: '/school/pupils', label: 'Siswa', icon: <Users size={17} /> },
    { to: '/school/grades', label: 'Nilai', icon: <ScrollText size={17} /> },
    { to: '/school/attendance', label: 'Presensi', icon: <ClipboardList size={17} /> },
  ] }];
  if (role === 'PUPIL') return [{ section: 'Belajar', items: [
    { to: '/', label: 'Dashboard', icon: <Home size={17} /> },
    { to: '/school/classes', label: 'Kelas', icon: <School size={17} /> },
    { to: '/school/subjects', label: 'Mata Pelajaran', icon: <BookOpen size={17} /> },
    { to: '/school/grades', label: 'Nilai Saya', icon: <ScrollText size={17} /> },
    { to: '/school/attendance', label: 'Presensi Saya', icon: <ClipboardList size={17} /> },
    { to: '/school/report-card', label: 'Rapor Saya', icon: <FileText size={17} /> },
    { to: '/school/invoices', label: 'Tagihan Saya', icon: <Banknote size={17} /> },
  ] }];
  if (role === 'CAMPUS_ADMIN') return adminMenu;
  if (role === 'LECTURER') return lecturerMenu;
  return studentMenu;
}
