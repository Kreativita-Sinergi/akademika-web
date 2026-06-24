import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Layout as AntLayout, Menu, Avatar, Dropdown } from 'antd';
import {
  Banknote,
  BookOpen,
  Building2,
  CalendarDays,
  ClipboardList,
  GraduationCap,
  Home,
  LogOut,
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
import { useAuthStore } from '../../store/auth';
import NotificationBell from './NotificationBell';
import type { ReactNode } from 'react';

interface MenuItem {
  to: string;
  label: string;
  icon: ReactNode;
}

const adminMenu: { section: string; items: MenuItem[] }[] = [
  {
    section: 'Utama',
    items: [
      { to: '/', label: 'Dashboard', icon: <Home size={17} /> },
      { to: '/announcements', label: 'Pengumuman', icon: <Megaphone size={17} /> },
      { to: '/reports', label: 'Laporan', icon: <ScrollText size={17} /> },
      { to: '/audit-logs', label: 'Audit Log', icon: <ClipboardList size={17} /> },
    ],
  },
  {
    section: 'Master',
    items: [
      { to: '/master/faculties', label: 'Fakultas', icon: <Building2 size={17} /> },
      { to: '/master/programs', label: 'Program Studi', icon: <School size={17} /> },
      { to: '/master/academic-years', label: 'Tahun Akademik', icon: <CalendarDays size={17} /> },
      { to: '/master/rooms', label: 'Ruangan', icon: <Building2 size={17} /> },
      { to: '/master/courses', label: 'Mata Kuliah', icon: <BookOpen size={17} /> },
      { to: '/master/class-groups', label: 'Rombel/Kelas', icon: <Users size={17} /> },
    ],
  },
  {
    section: 'PMB',
    items: [
      { to: '/admission/waves', label: 'Gelombang', icon: <ClipboardList size={17} /> },
      { to: '/admission/exams', label: 'Jadwal Ujian', icon: <CalendarDays size={17} /> },
      { to: '/admission/applicants', label: 'Pendaftar', icon: <UserSquare2 size={17} /> },
      { to: '/admission/questions', label: 'Bank Soal CBT', icon: <BookOpen size={17} /> },
      { to: '/admission/attempts', label: 'Hasil CBT', icon: <ClipboardList size={17} /> },
    ],
  },
  {
    section: 'Akademik',
    items: [
      { to: '/lecturers', label: 'Dosen', icon: <Contact size={17} /> },
      { to: '/students', label: 'Mahasiswa', icon: <Users size={17} /> },
      { to: '/schedules', label: 'Jadwal Kuliah', icon: <CalendarDays size={17} /> },
      { to: '/attendance', label: 'Presensi', icon: <ClipboardList size={17} /> },
      { to: '/attendance/realization', label: 'Realisasi & Kehadiran Dosen', icon: <Activity size={17} /> },
      { to: '/bkd-review', label: 'Pengesahan BKD', icon: <BookCheck size={17} /> },
      { to: '/attendance/settings', label: 'Pengaturan Presensi', icon: <MapPin size={17} /> },
      { to: '/grades', label: 'Nilai', icon: <ScrollText size={17} /> },
      { to: '/guidances', label: 'Bimbingan (PA)', icon: <NotebookPen size={17} /> },
      { to: '/krs', label: 'Persetujuan KRS', icon: <ClipboardCheck size={17} /> },
      { to: '/exam-events', label: 'Jadwal Ujian', icon: <CalendarCheck size={17} /> },
      { to: '/elearning/materials', label: 'Materi Kuliah', icon: <Library size={17} /> },
      { to: '/elearning/assignments', label: 'Tugas', icon: <ClipboardList size={17} /> },
      { to: '/letters', label: 'Surat Akademik', icon: <Mail size={17} /> },
      { to: '/academic-calendar', label: 'Kalender Akademik', icon: <CalendarDays size={17} /> },
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
    section: 'Beasiswa',
    items: [
      { to: '/scholarships', label: 'Program Beasiswa', icon: <Award size={17} /> },
      { to: '/scholarships/applications', label: 'Seleksi', icon: <BadgeCheck size={17} /> },
    ],
  },
  {
    section: 'Kemahasiswaan',
    items: [
      { to: '/organizations', label: 'Organisasi (Ormawa)', icon: <Users size={17} /> },
      { to: '/activities', label: 'Verifikasi Kegiatan/SKPI', icon: <Trophy size={17} /> },
      { to: '/leave-requests', label: 'Cuti & Pengunduran', icon: <PauseCircle size={17} /> },
      { to: '/tickets', label: 'Helpdesk', icon: <LifeBuoy size={17} /> },
    ],
  },
  {
    section: 'EDOM',
    items: [
      { to: '/evaluation/periods', label: 'Periode EDOM', icon: <Star size={17} /> },
      { to: '/evaluation/questions', label: 'Pertanyaan EDOM', icon: <NotebookPen size={17} /> },
    ],
  },
  {
    section: 'Keuangan',
    items: [
      { to: '/ukt/groups', label: 'Golongan UKT', icon: <Banknote size={17} /> },
      { to: '/ukt/invoices', label: 'Tagihan UKT', icon: <Banknote size={17} /> },
    ],
  },
  {
    section: 'Kelulusan',
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

const lecturerMenu: { section: string; items: MenuItem[] }[] = [
  {
    section: 'Dosen',
    items: [
      { to: '/feed', label: 'Pengumuman', icon: <Megaphone size={17} /> },
      { to: '/my-schedule', label: 'Jadwal Mengajar', icon: <CalendarDays size={17} /> },
      { to: '/attendance', label: 'Presensi', icon: <ClipboardList size={17} /> },
      { to: '/attendance/realization', label: 'Realisasi Mengajar', icon: <Activity size={17} /> },
      { to: '/my-bkd', label: 'BKD Saya', icon: <BookCheck size={17} /> },
      { to: '/grades', label: 'Input Nilai', icon: <ScrollText size={17} /> },
      { to: '/elearning/materials', label: 'Materi Kuliah', icon: <Library size={17} /> },
      { to: '/elearning/assignments', label: 'Tugas', icon: <ClipboardList size={17} /> },
      { to: '/students', label: 'Mahasiswa', icon: <Users size={17} /> },
      { to: '/guidances', label: 'Bimbingan Wali (PA)', icon: <NotebookPen size={17} /> },
      { to: '/krs', label: 'Persetujuan KRS', icon: <ClipboardCheck size={17} /> },
      { to: '/theses', label: 'Bimbingan TA', icon: <ScrollText size={17} /> },
      { to: '/internships', label: 'Bimbingan PKL/KP', icon: <Briefcase size={17} /> },
      { to: '/calendar', label: 'Kalender Akademik', icon: <CalendarDays size={17} /> },
      { to: '/my-library', label: 'Perpustakaan', icon: <Library size={17} /> },
      { to: '/my-tickets', label: 'Bantuan/Helpdesk', icon: <LifeBuoy size={17} /> },
    ],
  },
];

const studentMenu: { section: string; items: MenuItem[] }[] = [
  {
    section: 'Mahasiswa',
    items: [
      { to: '/feed', label: 'Pengumuman', icon: <Megaphone size={17} /> },
      { to: '/my-schedule', label: 'Jadwal Kuliah', icon: <CalendarDays size={17} /> },
      { to: '/my-krs', label: 'KRS', icon: <ClipboardCheck size={17} /> },
      { to: '/my-khs', label: 'KHS & Transkrip', icon: <ScrollText size={17} /> },
      { to: '/my-exam-card', label: 'Kartu Ujian', icon: <CalendarCheck size={17} /> },
      { to: '/my-elearning', label: 'E-Learning', icon: <Library size={17} /> },
      { to: '/my-evaluation', label: 'Evaluasi Dosen', icon: <Star size={17} /> },
      { to: '/my-letters', label: 'Surat Akademik', icon: <Mail size={17} /> },
      { to: '/my-library', label: 'Perpustakaan', icon: <Library size={17} /> },
      { to: '/my-scholarship', label: 'Beasiswa', icon: <Award size={17} /> },
      { to: '/my-activities', label: 'Kegiatan & SKPI', icon: <Trophy size={17} /> },
      { to: '/my-leave', label: 'Cuti & Status', icon: <PauseCircle size={17} /> },
      { to: '/my-tickets', label: 'Bantuan/Helpdesk', icon: <LifeBuoy size={17} /> },
      { to: '/calendar', label: 'Kalender Akademik', icon: <CalendarDays size={17} /> },
    ],
  },
];

export default function Layout() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  const menu =
    user?.role === 'CAMPUS_ADMIN' ? adminMenu : user?.role === 'LECTURER' ? lecturerMenu : studentMenu;

  // Bangun item Menu Ant Design berkelompok per seksi.
  const menuItems = menu.map((group) => ({
    key: group.section,
    type: 'group' as const,
    label: group.section,
    children: group.items.map((item) => ({
      key: item.to,
      icon: item.icon,
      label: item.label,
    })),
  }));

  // Tentukan menu aktif berdasarkan path terpanjang yang cocok.
  const allPaths = menu.flatMap((g) => g.items.map((i) => i.to));
  const selectedKey =
    allPaths
      .filter((p) => (p === '/' ? location.pathname === '/' : location.pathname.startsWith(p)))
      .sort((a, b) => b.length - a.length)[0] ?? location.pathname;

  return (
    <AntLayout style={{ minHeight: '100vh' }}>
      <AntLayout.Sider width={248} theme="light" style={{ position: 'fixed', insetBlock: 0, insetInlineStart: 0, overflow: 'auto', borderInlineEnd: '1px solid #f0f0f0' }}>
        <div className="flex items-center gap-2 px-5 py-4">
          <GraduationCap className="text-primary-600" size={24} />
          <span className="text-lg font-bold tracking-tight">Akademika</span>
        </div>
        <Menu
          mode="inline"
          selectedKeys={[selectedKey]}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
          style={{ borderInlineEnd: 'none' }}
        />
      </AntLayout.Sider>
      <AntLayout style={{ marginInlineStart: 248 }}>
        <AntLayout.Header
          style={{ position: 'sticky', top: 0, zIndex: 30, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 12, background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(8px)', borderBottom: '1px solid #f0f0f0', paddingInline: 24 }}
        >
          <NotificationBell />
          <Dropdown
            menu={{
              items: [
                { key: 'email', label: user?.email, disabled: true },
                { type: 'divider' },
                { key: 'logout', icon: <LogOut size={15} />, label: 'Keluar', danger: true, onClick: () => { logout(); navigate('/login'); } },
              ],
            }}
          >
            <div className="flex cursor-pointer items-center gap-2">
              <Avatar style={{ backgroundColor: '#4263eb' }}>{user?.name?.charAt(0)?.toUpperCase()}</Avatar>
              <span className="text-sm font-medium">{user?.name}</span>
            </div>
          </Dropdown>
        </AntLayout.Header>
        <AntLayout.Content style={{ padding: 24 }}>
          <Outlet />
        </AntLayout.Content>
      </AntLayout>
    </AntLayout>
  );
}
