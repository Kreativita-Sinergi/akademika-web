import { BrowserRouter, Navigate, Outlet, Route, Routes } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuthStore } from './store/auth';
import Layout from './components/layout/Layout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import {
  AcademicYearsPage,
  ClassGroupsPage,
  CoursesPage,
  FacultiesPage,
  ProgramsPage,
  RoomsPage,
} from './pages/master/MasterPages';
import LecturersPage from './pages/LecturersPage';
import StudentsPage from './pages/StudentsPage';
import { ApplicantsPage, ExamSchedulesPage, WavesPage } from './pages/admission/AdmissionPages';
import { InvoicesPage, UktGroupsPage } from './pages/ukt/UktPages';
import SchedulesPage from './pages/SchedulesPage';
import MySchedulePage from './pages/MySchedulePage';
import GradesPage from './pages/GradesPage';
import MyKhsPage from './pages/MyKhsPage';
import { AlumniPage, GraduationsPage, InternshipsPage, ThesesPage } from './pages/FinalPages';

function RequireAuth() {
  const token = useAuthStore((s) => s.token);
  if (!token) return <Navigate to="/login" replace />;
  return <Outlet />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-right" />
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route element={<RequireAuth />}>
          <Route element={<Layout />}>
            <Route path="/" element={<DashboardPage />} />
            {/* Master */}
            <Route path="/master/faculties" element={<FacultiesPage />} />
            <Route path="/master/programs" element={<ProgramsPage />} />
            <Route path="/master/academic-years" element={<AcademicYearsPage />} />
            <Route path="/master/rooms" element={<RoomsPage />} />
            <Route path="/master/courses" element={<CoursesPage />} />
            <Route path="/master/class-groups" element={<ClassGroupsPage />} />
            {/* PMB */}
            <Route path="/admission/waves" element={<WavesPage />} />
            <Route path="/admission/exams" element={<ExamSchedulesPage />} />
            <Route path="/admission/applicants" element={<ApplicantsPage />} />
            {/* Akademik */}
            <Route path="/lecturers" element={<LecturersPage />} />
            <Route path="/students" element={<StudentsPage />} />
            <Route path="/schedules" element={<SchedulesPage />} />
            <Route path="/grades" element={<GradesPage />} />
            {/* Portal dosen & mahasiswa */}
            <Route path="/my-schedule" element={<MySchedulePage />} />
            <Route path="/my-khs" element={<MyKhsPage />} />
            {/* UKT */}
            <Route path="/ukt/groups" element={<UktGroupsPage />} />
            <Route path="/ukt/invoices" element={<InvoicesPage />} />
            {/* Kelulusan */}
            <Route path="/internships" element={<InternshipsPage />} />
            <Route path="/theses" element={<ThesesPage />} />
            <Route path="/graduations" element={<GraduationsPage />} />
            <Route path="/alumni" element={<AlumniPage />} />
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
