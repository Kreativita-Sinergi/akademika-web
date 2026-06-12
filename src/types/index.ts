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
  status: string;
  study_program?: StudyProgram;
  class_group?: ClassGroup;
  ukt_group?: UktGroup;
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
