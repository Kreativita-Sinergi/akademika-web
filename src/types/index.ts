// Bentuk respons standar dari akademika-service.
export interface ApiResponse<T> {
  status: boolean;
  message: string;
  data: T;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    total_page: number;
  };
}

export interface Faculty {
  id: string;
  code: string;
  name: string;
  dean_name: string;
  is_active: boolean;
}

export interface StudyProgram {
  id: string;
  faculty_id: string;
  code: string;
  name: string;
  degree: string;
  is_teacher_education: boolean;
  head_name: string;
  accreditation: string;
  faculty?: Faculty;
}

export interface AcademicYear {
  id: string;
  name: string;
  semester: string;
  start_date: string;
  end_date: string;
  is_active: boolean;
}

export interface Room {
  id: string;
  code: string;
  name: string;
  building: string;
  floor: number;
  capacity: number;
  type: string;
}

export interface Course {
  id: string;
  study_program_id: string;
  code: string;
  name: string;
  sks: number;
  semester_number: number;
  is_mandatory: boolean;
  study_program?: StudyProgram;
}

export interface Lecturer {
  id: string;
  study_program_id: string;
  nidn: string;
  name: string;
  gender: string;
  email: string;
  phone: string;
  position: string;
  education_level: string;
  study_program?: StudyProgram;
}

export interface ClassGroup {
  id: string;
  study_program_id: string;
  code: string;
  name: string;
  entry_year: number;
  current_semester: number;
  advisor_lecturer_id: string | null;
  study_program?: StudyProgram;
  advisor?: Lecturer;
}

export interface UktGroup {
  id: string;
  study_program_id: string;
  group_number: number;
  amount_per_semester: number;
  description: string;
  study_program?: StudyProgram;
}

export interface Student {
  id: string;
  study_program_id: string;
  class_group_id: string | null;
  nim: string;
  name: string;
  gender: string;
  phone: string;
  email: string;
  entry_year: number;
  current_semester: number;
  ukt_group_id: string | null;
  advisor_lecturer_id: string | null;
  status: string;
  study_program?: StudyProgram;
  class_group?: ClassGroup;
  ukt_group?: UktGroup;
  advisor?: Lecturer;
}

export interface StudentSemester {
  id: string;
  semester_number: number;
  ips: number;
  ipk: number;
  sks_taken: number;
  sks_passed: number;
  status: string;
  academic_year?: AcademicYear;
}

export interface AdmissionWave {
  id: string;
  name: string;
  entry_year: number;
  start_date: string;
  end_date: string;
  registration_fee: number;
  passing_score: number;
  max_applicants: number;
  is_active: boolean;
}

export interface ExamSchedule {
  id: string;
  admission_wave_id: string;
  name: string;
  exam_date: string;
  start_time: string;
  end_time: string;
  room_id: string | null;
  capacity: number;
  room?: Room;
  admission_wave?: AdmissionWave;
}

export interface Applicant {
  id: string;
  admission_wave_id: string;
  registration_number: string;
  name: string;
  gender: string;
  phone: string;
  email: string;
  school_origin: string;
  first_choice_program_id: string;
  exam_schedule_id: string | null;
  exam_score: number | null;
  status: string;
  payment_status: string;
  admission_wave?: AdmissionWave;
  first_choice?: StudyProgram;
  exam_schedule?: ExamSchedule;
}

export interface TuitionInvoice {
  id: string;
  student_id: string;
  academic_year_id: string;
  invoice_number: string;
  amount: number;
  paid_amount: number;
  status: string;
  due_date: string | null;
  student?: Student;
  academic_year?: AcademicYear;
}

export interface Schedule {
  id: string;
  academic_year_id: string;
  class_group_id: string;
  course_id: string;
  lecturer_id: string;
  room_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  academic_year?: AcademicYear;
  class_group?: ClassGroup;
  course?: Course;
  lecturer?: Lecturer;
  room?: Room;
}

export interface Grade {
  id: string;
  student_id: string;
  course_id: string;
  academic_year_id: string;
  assignment_score: number;
  mid_score: number;
  final_score: number;
  total_score: number;
  letter_grade: string;
  grade_point: number;
  student?: Student;
  course?: Course;
}

export interface KhsItem {
  course_code: string;
  course_name: string;
  sks: number;
  total_score: number;
  letter_grade: string;
  grade_point: number;
}

export interface Khs {
  nim: string;
  student_name: string;
  academic_year: string;
  semester: string;
  semester_number: number;
  items: KhsItem[];
  total_sks: number;
  ips: number;
  ipk: number;
}

export interface Transcript {
  nim: string;
  student_name: string;
  study_program: string;
  items: KhsItem[];
  total_sks: number;
  ipk: number;
}

export interface Internship {
  id: string;
  student_id: string;
  type: string;
  company_name: string;
  field_supervisor_name: string;
  status: string;
  score: number | null;
  letter_grade: string;
  student?: Student;
  supervisor?: Lecturer;
}

export interface Thesis {
  id: string;
  student_id: string;
  title: string;
  status: string;
  score: number | null;
  letter_grade: string;
  student?: Student;
  supervisor1?: Lecturer;
  supervisor2?: Lecturer;
}

export interface GraduationCeremony {
  id: string;
  name: string;
  ceremony_date: string;
  location: string;
  fee: number;
}

export interface GraduationParticipant {
  id: string;
  ceremony_id: string;
  student_id: string;
  registration_number: string;
  ipk: number;
  thesis_title: string;
  predicate: string;
  status: string;
  ceremony?: GraduationCeremony;
  student?: Student;
}

export interface Alumni {
  id: string;
  student_id: string;
  graduation_year: number;
  degree: string;
  ipk: number;
  job_status: string;
  company_name: string;
  job_position: string;
  student?: Student;
}

export interface Announcement {
  id: string;
  title: string;
  body: string;
  audience: string; // all/lecturer/student
  is_pinned: boolean;
  is_published: boolean;
  author_name: string;
  created_at: string;
}

export interface Guidance {
  id: string;
  student_id: string;
  lecturer_id: string;
  date: string;
  type: string; // akademik/konseling/lainnya
  topic: string;
  note: string;
  follow_up: string;
  student?: Student;
  lecturer?: Lecturer;
}

export interface LetterRequest {
  id: string;
  student_id: string;
  type: string; // aktif_kuliah/cuti/lulus/keterangan
  purpose: string;
  status: string; // diajukan/disetujui/ditolak
  letter_number: string;
  note: string;
  approved_at: string | null;
  created_at: string;
  student?: Student;
}

export interface CourseMaterial {
  id: string;
  schedule_id: string;
  title: string;
  description: string;
  file_url: string;
  link_url: string;
  created_at: string;
  schedule?: Schedule;
}

export interface Assignment {
  id: string;
  schedule_id: string;
  title: string;
  description: string;
  file_url: string;
  due_date: string | null;
  created_at: string;
  schedule?: Schedule;
}

export interface AssignmentSubmission {
  id: string;
  assignment_id: string;
  student_id: string;
  file_url: string;
  link_url: string;
  note: string;
  score: number | null;
  feedback: string;
  submitted_at: string;
  graded_at: string | null;
  assignment?: Assignment;
  student?: Student;
}

export interface CourseExam {
  id: string;
  academic_year_id: string;
  schedule_id: string;
  exam_type: string; // uts/uas
  date: string;
  start_time: string;
  end_time: string;
  room_id: string | null;
  proctor_name: string;
  note: string;
  schedule?: Schedule;
  academic_year?: AcademicYear;
  room?: Room;
}

export interface EvaluationQuestion {
  id: string;
  text: string;
  order_no: number;
  is_active: boolean;
}

export interface EvaluationPeriod {
  id: string;
  academic_year_id: string;
  name: string;
  is_open: boolean;
  academic_year?: AcademicYear;
}

export interface LecturerEvalRecap {
  lecturer_id: string;
  lecturer_name: string;
  respondents: number;
  average_score: number;
}

export interface KrsItem {
  id: string;
  krs_plan_id: string;
  course_id: string;
  schedule_id: string | null;
  sks: number;
  course?: Course;
  schedule?: Schedule;
}

export interface KrsPlan {
  id: string;
  student_id: string;
  academic_year_id: string;
  semester_number: number;
  status: string; // draft/diajukan/disetujui/ditolak
  total_sks: number;
  advisor_note: string;
  submitted_at: string | null;
  approved_at: string | null;
  student?: Student;
  academic_year?: AcademicYear;
  items?: KrsItem[];
}

export interface Yudisium {
  id: string;
  student_id: string;
  academic_year_id: string;
  number: string;
  decree_number: string;
  date: string;
  ipk: number;
  total_sks: number;
  predicate: string;
  status: string; // diajukan/disahkan
  note: string;
  student?: Student;
  academic_year?: AcademicYear;
}

export interface SkpiActivity {
  id: string;
  skpi_id: string;
  category: string;
  title: string;
  organizer: string;
  year: number;
  level: string;
  description: string;
}

export interface Skpi {
  id: string;
  student_id: string;
  number: string;
  issued_date: string;
  student?: Student;
  activities?: SkpiActivity[];
}

export interface DashboardSummary {
  total_students: number;
  active_students: number;
  total_lecturers: number;
  total_programs: number;
  total_applicants: number;
  pending_applicants: number;
  unpaid_invoices: number;
  today_schedules: number;
  students_by_status: Record<string, number>;
}

// ── Kalender Akademik ────────────────────────────────────────────────────────
export interface AcademicEvent {
  id: string;
  campus_id: string;
  academic_year_id?: string | null;
  title: string;
  description: string;
  category: string;
  start_date: string;
  end_date: string;
  is_holiday: boolean;
  academic_year?: AcademicYear | null;
}

// ── Perpustakaan ─────────────────────────────────────────────────────────────
export interface Book {
  id: string;
  campus_id: string;
  title: string;
  author: string;
  publisher: string;
  year: number;
  isbn: string;
  category: string;
  shelf_location: string;
  cover_url: string;
  total_copies: number;
  available_copies: number;
}

export interface BookLoan {
  id: string;
  campus_id: string;
  book_id: string;
  borrower_type: string;
  student_id?: string | null;
  lecturer_id?: string | null;
  borrower_name: string;
  loan_date: string;
  due_date: string;
  return_date?: string | null;
  status: string;
  fine: number;
  note: string;
  book?: Book | null;
}

// ── Beasiswa ─────────────────────────────────────────────────────────────────
export interface Scholarship {
  id: string;
  campus_id: string;
  academic_year_id?: string | null;
  name: string;
  provider: string;
  description: string;
  requirements: string;
  quota: number;
  amount_per_student: number;
  min_gpa: number;
  open_date: string;
  close_date: string;
  is_active: boolean;
  academic_year?: AcademicYear | null;
}

export interface ScholarshipApplication {
  id: string;
  campus_id: string;
  scholarship_id: string;
  student_id: string;
  student_name: string;
  gpa: number;
  reason: string;
  document_url: string;
  status: string;
  review_note: string;
  decided_at?: string | null;
  scholarship?: Scholarship | null;
  student?: Student | null;
}

// ── Ormawa & Kegiatan Mahasiswa (SKPI) ───────────────────────────────────────
export interface StudentOrganization {
  id: string;
  name: string;
  type: string;
  description: string;
  period: string;
  advisor_lecturer_id?: string | null;
  is_active: boolean;
  advisor?: Lecturer | null;
}

export interface StudentActivity {
  id: string;
  student_id: string;
  student_name: string;
  organization_id?: string | null;
  title: string;
  category: string;
  role: string;
  level: string;
  date: string;
  points: number;
  certificate_url: string;
  status: string;
  verify_note: string;
  organization?: StudentOrganization | null;
}

// ── Cuti & Pengunduran Diri ──────────────────────────────────────────────────
export interface LeaveRequest {
  id: string;
  student_id: string;
  student_name: string;
  type: string;
  academic_year_id?: string | null;
  reason: string;
  document_url: string;
  status: string;
  review_note: string;
  decided_at?: string | null;
  created_at?: string;
  academic_year?: AcademicYear | null;
}

// ── Helpdesk / Tiket ─────────────────────────────────────────────────────────
export interface TicketReply {
  id: string;
  ticket_id: string;
  author_name: string;
  author_role: string;
  message: string;
  created_at: string;
}

export interface Ticket {
  id: string;
  user_id: string;
  opener_name: string;
  opener_role: string;
  category: string;
  subject: string;
  description: string;
  priority: string;
  status: string;
  replies?: TicketReply[];
  created_at: string;
  updated_at: string;
}

// ── Notifikasi ───────────────────────────────────────────────────────────────
export interface AppNotification {
  id: string;
  title: string;
  body: string;
  type: string;
  link: string;
  is_read: boolean;
  created_at: string;
}

// ── Kehadiran/Realisasi Dosen ────────────────────────────────────────────────
export interface LecturerRecapRow {
  schedule: Schedule;
  meetings_held: number;
  lecturer_present: number;
  target_meetings: number;
  realization_pct: number;
  presence_pct: number;
}

// ── BKD (Beban Kerja Dosen) ──────────────────────────────────────────────────
export interface BkdItem {
  id: string;
  report_id: string;
  category: string;
  description: string;
  sks: number;
  evidence_url: string;
}

export interface BkdReport {
  id: string;
  lecturer_id: string;
  academic_year_id: string;
  teaching_sks: number;
  status: string;
  review_note: string;
  decided_at?: string | null;
  lecturer?: Lecturer | null;
  academic_year?: AcademicYear | null;
  items?: BkdItem[];
}
