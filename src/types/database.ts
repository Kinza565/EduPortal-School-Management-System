export type Role = "admin" | "teacher" | "parent";

export type StudentStatus = "active" | "inactive" | "graduated";
export type Gender = "male" | "female" | "other";
export type AttendanceStatus = "present" | "absent" | "late" | "excused";
export type ParentRelationship = "father" | "mother" | "guardian" | "other";
export type ExamType = "unit_test" | "mid_term" | "final" | "quarterly" | "half_yearly" | "annual" | "other";
export type ExamStatus = "upcoming" | "ongoing" | "completed" | "cancelled";

export type Profile = {
  id: string;
  school_id: string;
  full_name: string;
  email: string;
  phone: string | null;
  role: Role;
  avatar_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type School = {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  logo_url: string | null;
  created_at: string;
  updated_at: string;
};

export type Class = {
  id: string;
  school_id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type Section = {
  id: string;
  school_id: string;
  class_id: string;
  name: string;
  capacity: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type Student = {
  id: string;
  school_id: string;
  student_id: string;
  roll_number: string | null;
  full_name: string;
  father_name: string | null;
  guardian_name: string | null;
  date_of_birth: string | null;
  gender: Gender | null;
  phone: string | null;
  address: string | null;
  admission_date: string;
  photo_url: string | null;
  class_id: string | null;
  section_id: string | null;
  status: StudentStatus;
  created_at: string;
  updated_at: string;
};

export type TeacherDetail = {
  id: string;
  profile_id: string;
  employee_id: string | null;
  joining_date: string | null;
  qualification: string | null;
  specialization: string | null;
  created_at: string;
  updated_at: string;
};

export type Subject = {
  id: string;
  school_id: string;
  name: string;
  code: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type TeacherAssignment = {
  id: string;
  school_id: string;
  teacher_id: string;
  class_id: string;
  section_id: string;
  subject_id: string;
  is_class_teacher: boolean;
  created_at: string;
  updated_at: string;
};

export type AttendanceRecord = {
  id: string;
  school_id: string;
  student_id: string;
  class_id: string;
  section_id: string;
  attendance_date: string;
  status: AttendanceStatus;
  marked_by: string;
  remarks: string | null;
  created_at: string;
  updated_at: string;
};

export type ProfileWithSchool = Profile & {
  schools: School;
};

export type StudentWithClassSection = Student & {
  classes: Class | null;
  sections: Section | null;
};

export type SectionWithClass = Section & {
  classes: Class;
};

export type TeacherWithDetails = Profile & {
  teacher_details: TeacherDetail | null;
};

export type AssignmentWithDetails = TeacherAssignment & {
  profiles: Profile;
  classes: Class;
  sections: Section;
  subjects: Subject;
};

export type ClassWithStats = Class & {
  sections: Section[];
  student_count: number;
  teacher_count: number;
};

export type SectionWithStats = Section & {
  classes: Class;
  student_count: number;
  teachers: Profile[];
};

export type AttendanceRecordWithStudent = AttendanceRecord & {
  students: Student;
  profiles: Profile;
};

export type AttendanceRecordWithDetails = AttendanceRecord & {
  students: Student;
  classes: Class;
  sections: Section;
  profiles: Profile;
};

export type StudentAttendanceSummary = {
  student_id: string;
  student_name: string;
  present: number;
  absent: number;
  late: number;
  excused: number;
  total_days: number;
  attendance_percentage: number;
};

export type Parent = {
  id: string;
  school_id: string;
  full_name: string;
  relationship: ParentRelationship;
  phone: string | null;
  email: string | null;
  address: string | null;
  occupation: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type ParentStudent = {
  id: string;
  school_id: string;
  parent_id: string;
  student_id: string;
  is_primary_contact: boolean;
  created_at: string;
};

export type ParentWithStudents = Parent & {
  students: (Student & { class_name: string | null; section_name: string | null })[];
  student_count: number;
};

export type AcademicAssignment = {
  id: string;
  school_id: string;
  teacher_id: string;
  class_id: string;
  section_id: string;
  subject_id: string;
  title: string;
  description: string | null;
  assigned_date: string;
  due_date: string;
  status: "active" | "inactive" | "completed" | "cancelled";
  created_at: string;
  updated_at: string;
};

export type AcademicAssignmentWithDetails = AcademicAssignment & {
  profiles: Profile;
  classes: Class;
  sections: Section;
  subjects: Subject;
};

export type ClassAttendanceSummary = {
  class_id: string;
  section_id: string;
  class_name: string;
  section_name: string;
  total_students: number;
  present_today: number;
  absent_today: number;
  late_today: number;
  excused_today: number;
  attendance_percentage: number;
};

export type MonthlyAttendanceRow = {
  student_id: string;
  student_name: string;
  present: number;
  absent: number;
  late: number;
  excused: number;
  total_days: number;
  attendance_percentage: number;
};

export type YearlyAttendanceRow = {
  student_id: string;
  student_name: string;
  present: number;
  absent: number;
  late: number;
  excused: number;
  total_days: number;
  attendance_percentage: number;
  monthly_breakdown: { month: string; percentage: number }[];
};

export type Exam = {
  id: string;
  school_id: string;
  name: string;
  exam_type: ExamType;
  class_id: string;
  section_id: string | null;
  start_date: string;
  end_date: string;
  description: string | null;
  status: ExamStatus;
  created_at: string;
  updated_at: string;
};

export type ExamSubject = {
  id: string;
  school_id: string;
  exam_id: string;
  subject_id: string;
  exam_date: string;
  start_time: string | null;
  end_time: string | null;
  total_marks: number;
  passing_marks: number;
  room_number: string | null;
  invigilator_id: string | null;
  created_at: string;
  updated_at: string;
};

export type ExamWithDetails = Exam & {
  classes: Class;
  sections: Section | null;
  exam_subjects: (ExamSubject & { subjects: Subject; invigilator: Profile | null })[];
};

export type ExamSubjectWithDetails = ExamSubject & {
  subjects: Subject;
  exams: Exam;
  invigilator: Profile | null;
};

export type ResultStatus = "pass" | "fail";
export type Grade = "A+" | "A" | "B" | "C" | "D" | "F";

export type Result = {
  id: string;
  school_id: string;
  exam_id: string;
  exam_subject_id: string;
  student_id: string;
  class_id: string;
  section_id: string | null;
  obtained_marks: number;
  total_marks: number;
  passing_marks: number;
  percentage: number;
  grade: Grade;
  status: ResultStatus;
  remarks: string | null;
  created_at: string;
  updated_at: string;
};

export type ResultWithDetails = Result & {
  students: Student;
  exams: Exam;
  exam_subjects: ExamSubject & { subjects: Subject };
  classes: Class;
  sections: Section | null;
};

export type FeeFrequency = "monthly" | "quarterly" | "half_yearly" | "yearly" | "one_time";
export type FeeStatus = "paid" | "partial" | "pending" | "overdue" | "cancelled";
export type PaymentMethod = "cash" | "bank_transfer" | "online" | "cheque" | "other";

export type FeeCategory = {
  id: string;
  school_id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type FeeStructure = {
  id: string;
  school_id: string;
  category_id: string;
  class_id: string | null;
  section_id: string | null;
  amount: number;
  frequency: FeeFrequency;
  due_day: number | null;
  effective_from: string;
  effective_until: string | null;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type StudentFee = {
  id: string;
  school_id: string;
  student_id: string;
  category_id: string;
  class_id: string | null;
  section_id: string | null;
  fee_structure_id: string | null;
  amount: number;
  due_date: string;
  description: string | null;
  status: FeeStatus;
  created_at: string;
  updated_at: string;
};

export type FeePayment = {
  id: string;
  school_id: string;
  student_fee_id: string;
  student_id: string;
  amount: number;
  payment_date: string;
  payment_method: PaymentMethod;
  reference_number: string | null;
  remarks: string | null;
  received_by: string | null;
  created_at: string;
  updated_at: string;
};

export type StudentFeeWithDetails = StudentFee & {
  students: Student;
  fee_categories: FeeCategory;
  classes: Class | null;
  sections: Section | null;
  total_paid: number;
  balance: number;
};

export type FeePaymentWithDetails = FeePayment & {
  student_fees: StudentFee;
  students: Student;
  received_by_profile: Profile | null;
};

export type FeeStructureWithDetails = FeeStructure & {
  fee_categories: FeeCategory;
  classes: Class | null;
  sections: Section | null;
};

export type AnnouncementTargetType = "all" | "teachers" | "parents" | "class" | "section";

export type Announcement = {
  id: string;
  school_id: string;
  title: string;
  message: string;
  target_type: AnnouncementTargetType;
  class_id: string | null;
  section_id: string | null;
  created_by: string;
  is_active: boolean;
  published_at: string | null;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
};

export type AnnouncementWithDetails = Announcement & {
  profiles: Profile;
  classes: Class | null;
  sections: Section | null;
};

export type NotificationRead = {
  id: string;
  school_id: string;
  announcement_id: string;
  user_id: string;
  read_at: string;
};
