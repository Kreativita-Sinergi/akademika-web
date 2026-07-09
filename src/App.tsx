import { BrowserRouter, Navigate, Outlet, Route, Routes } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuthStore } from './store/auth';
import Layout from './components/layout/Layout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import SuperAdminDashboardPage from './pages/SuperAdminDashboardPage';
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
import { AttemptsPage, QuestionsPage } from './pages/admission/CbtPages';
import PublicRegisterPage from './pages/public/PublicRegisterPage';
import StatusCheckPage from './pages/public/StatusCheckPage';
import ExamPage from './pages/public/ExamPage';
import { InvoicesPage, UktGroupsPage } from './pages/ukt/UktPages';
import SchedulesPage from './pages/SchedulesPage';
import MySchedulePage from './pages/MySchedulePage';
import GradesPage from './pages/GradesPage';
import MyKhsPage from './pages/MyKhsPage';
import { AlumniPage, GraduationsPage, InternshipsPage, ThesesPage } from './pages/FinalPages';
import AttendancePage from './pages/AttendancePage';
import ReportsPage from './pages/ReportsPage';
import AuditLogsPage from './pages/AuditLogsPage';
import { AnnouncementsPage, AnnouncementFeedPage } from './pages/AnnouncementsPage';
import GuidancePage from './pages/GuidancePage';
import LettersPage from './pages/LettersPage';
import MyLettersPage from './pages/MyLettersPage';
import { MaterialsPage, AssignmentsPage } from './pages/ElearningPage';
import MyElearningPage from './pages/MyElearningPage';
import { ExamEventsPage, MyExamCardPage } from './pages/ExamEventsPage';
import { EvaluationQuestionsPage, EvaluationPeriodsPage, MyEvaluationPage } from './pages/EvaluationPage';
import { KrsApprovalPage, MyKrsPage } from './pages/KrsPage';
import { YudisiumPage, SkpiPage } from './pages/YudisiumPage';
import { AcademicCalendarPage, AcademicCalendarViewPage } from './pages/AcademicCalendarPage';
import { BooksPage, LoansPage, MyLibraryPage } from './pages/LibraryPage';
import { ScholarshipsPage, ScholarshipApplicationsPage, MyScholarshipPage } from './pages/ScholarshipPage';
import { OrganizationsPage, ActivitiesReviewPage, MyActivitiesPage } from './pages/OrganizationPage';
import { LeaveRequestsPage, MyLeavePage } from './pages/LeavePage';
import { TicketsPage, MyTicketsPage } from './pages/TicketPage';
import SelfCheckinPage from './pages/SelfCheckinPage';
import LecturerRealizationPage from './pages/LecturerRealizationPage';
import AttendanceSettingsPage from './pages/AttendanceSettingsPage';
import { MyBkdPage, BkdReviewPage } from './pages/BkdPage';

function RequireAuth() {
  const token = useAuthStore((s) => s.token);
  if (!token) return <Navigate to="/login" replace />;
  return <Outlet />;
}

// Beranda menyesuaikan role: super admin melihat daftar tenant kampus.
function HomeByRole() {
  const role = useAuthStore((s) => s.user?.role);
  if (role === 'SUPER_ADMIN') return <SuperAdminDashboardPage />;
  return <DashboardPage />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-right" />
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        {/* Halaman publik PMB — tanpa login */}
        <Route path="/daftar/:campusCode" element={<PublicRegisterPage />} />
        <Route path="/status/:campusCode" element={<StatusCheckPage />} />
        <Route path="/ujian" element={<ExamPage />} />
        <Route element={<RequireAuth />}>
          <Route element={<Layout />}>
            <Route path="/" element={<HomeByRole />} />
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
            <Route path="/admission/questions" element={<QuestionsPage />} />
            <Route path="/admission/attempts" element={<AttemptsPage />} />
            {/* Akademik */}
            <Route path="/lecturers" element={<LecturersPage />} />
            <Route path="/students" element={<StudentsPage />} />
            <Route path="/schedules" element={<SchedulesPage />} />
            <Route path="/grades" element={<GradesPage />} />
            <Route path="/attendance" element={<AttendancePage />} />
            <Route path="/guidances" element={<GuidancePage />} />
            <Route path="/elearning/materials" element={<MaterialsPage />} />
            <Route path="/elearning/assignments" element={<AssignmentsPage />} />
            <Route path="/announcements" element={<AnnouncementsPage />} />
            <Route path="/letters" element={<LettersPage />} />
            <Route path="/exam-events" element={<ExamEventsPage />} />
            <Route path="/krs" element={<KrsApprovalPage />} />
            <Route path="/evaluation/questions" element={<EvaluationQuestionsPage />} />
            <Route path="/evaluation/periods" element={<EvaluationPeriodsPage />} />
            <Route path="/yudisium" element={<YudisiumPage />} />
            <Route path="/skpi" element={<SkpiPage />} />
            <Route path="/academic-calendar" element={<AcademicCalendarPage />} />
            <Route path="/library/books" element={<BooksPage />} />
            <Route path="/library/loans" element={<LoansPage />} />
            <Route path="/scholarships" element={<ScholarshipsPage />} />
            <Route path="/scholarships/applications" element={<ScholarshipApplicationsPage />} />
            <Route path="/organizations" element={<OrganizationsPage />} />
            <Route path="/activities" element={<ActivitiesReviewPage />} />
            <Route path="/leave-requests" element={<LeaveRequestsPage />} />
            <Route path="/tickets" element={<TicketsPage />} />
            <Route path="/attendance/realization" element={<LecturerRealizationPage />} />
            <Route path="/attendance/settings" element={<AttendanceSettingsPage />} />
            <Route path="/bkd-review" element={<BkdReviewPage />} />
            <Route path="/reports" element={<ReportsPage />} />
            <Route path="/audit-logs" element={<AuditLogsPage />} />
            {/* Portal dosen & mahasiswa */}
            <Route path="/my-schedule" element={<MySchedulePage />} />
            <Route path="/my-khs" element={<MyKhsPage />} />
            <Route path="/feed" element={<AnnouncementFeedPage />} />
            <Route path="/my-elearning" element={<MyElearningPage />} />
            <Route path="/my-letters" element={<MyLettersPage />} />
            <Route path="/my-krs" element={<MyKrsPage />} />
            <Route path="/my-exam-card" element={<MyExamCardPage />} />
            <Route path="/my-evaluation" element={<MyEvaluationPage />} />
            <Route path="/calendar" element={<AcademicCalendarViewPage />} />
            <Route path="/my-library" element={<MyLibraryPage />} />
            <Route path="/my-scholarship" element={<MyScholarshipPage />} />
            <Route path="/my-activities" element={<MyActivitiesPage />} />
            <Route path="/my-leave" element={<MyLeavePage />} />
            <Route path="/my-tickets" element={<MyTicketsPage />} />
            <Route path="/my-bkd" element={<MyBkdPage />} />
            <Route path="/presensi/:token" element={<SelfCheckinPage />} />
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
