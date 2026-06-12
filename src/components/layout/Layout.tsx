import { NavLink, Outlet, useNavigate } from 'react-router-dom';
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
} from 'lucide-react';
import { useAuthStore } from '../../store/auth';
import type { ReactNode } from 'react';

interface MenuItem {
  to: string;
  label: string;
  icon: ReactNode;
}

const adminMenu: { section: string; items: MenuItem[] }[] = [
  {
    section: 'Utama',
    items: [{ to: '/', label: 'Dashboard', icon: <Home size={17} /> }],
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
    ],
  },
  {
    section: 'Akademik',
    items: [
      { to: '/lecturers', label: 'Dosen', icon: <Contact size={17} /> },
      { to: '/students', label: 'Mahasiswa', icon: <Users size={17} /> },
      { to: '/schedules', label: 'Jadwal Kuliah', icon: <CalendarDays size={17} /> },
      { to: '/grades', label: 'Nilai', icon: <ScrollText size={17} /> },
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
      { to: '/graduations', label: 'Wisuda', icon: <Award size={17} /> },
      { to: '/alumni', label: 'Alumni', icon: <GraduationCap size={17} /> },
    ],
  },
];

const lecturerMenu: { section: string; items: MenuItem[] }[] = [
  {
    section: 'Dosen',
    items: [
      { to: '/my-schedule', label: 'Jadwal Mengajar', icon: <CalendarDays size={17} /> },
      { to: '/grades', label: 'Input Nilai', icon: <ScrollText size={17} /> },
      { to: '/students', label: 'Mahasiswa', icon: <Users size={17} /> },
      { to: '/theses', label: 'Bimbingan TA', icon: <ScrollText size={17} /> },
      { to: '/internships', label: 'Bimbingan PKL/KP', icon: <Briefcase size={17} /> },
    ],
  },
];

const studentMenu: { section: string; items: MenuItem[] }[] = [
  {
    section: 'Mahasiswa',
    items: [
      { to: '/my-schedule', label: 'Jadwal Kuliah', icon: <CalendarDays size={17} /> },
      { to: '/my-khs', label: 'KHS & Transkrip', icon: <ScrollText size={17} /> },
    ],
  },
];

export default function Layout() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const menu =
    user?.role === 'CAMPUS_ADMIN' ? adminMenu : user?.role === 'LECTURER' ? lecturerMenu : studentMenu;

  return (
    <div className="flex min-h-screen">
      <aside className="fixed inset-y-0 left-0 flex w-60 flex-col border-r border-slate-200 bg-white">
        <div className="flex items-center gap-2 border-b border-slate-100 px-5 py-4">
          <GraduationCap className="text-primary-600" size={24} />
          <span className="text-lg font-bold tracking-tight">Akademika</span>
        </div>
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          {menu.map((group) => (
            <div key={group.section} className="mb-4">
              <div className="mb-1 px-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                {group.section}
              </div>
              {group.items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/'}
                  className={({ isActive }) =>
                    `mb-0.5 flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition ${
                      isActive
                        ? 'bg-primary-50 font-medium text-primary-700'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`
                  }
                >
                  {item.icon}
                  {item.label}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>
        <div className="border-t border-slate-100 p-3">
          <div className="mb-2 px-2">
            <div className="truncate text-sm font-medium">{user?.name}</div>
            <div className="truncate text-xs text-slate-400">{user?.email}</div>
          </div>
          <button
            onClick={() => {
              logout();
              navigate('/login');
            }}
            className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-sm text-red-600 hover:bg-red-50"
          >
            <LogOut size={16} /> Keluar
          </button>
        </div>
      </aside>
      <main className="ml-60 flex-1 p-6">
        <Outlet />
      </main>
    </div>
  );
}
