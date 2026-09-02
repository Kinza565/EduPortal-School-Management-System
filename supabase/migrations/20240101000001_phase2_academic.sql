-- Phase 2: Academic Organization - Students, Classes, Sections, Teachers, Subjects, Assignments
-- EduPortal - School Management System

-- =============================================
-- CLASSES
-- =============================================
CREATE TABLE IF NOT EXISTS public.classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_classes_id_school_id UNIQUE (id, school_id)
);

CREATE INDEX IF NOT EXISTS idx_classes_school_id ON public.classes(school_id);
CREATE INDEX IF NOT EXISTS idx_classes_school_active ON public.classes(school_id, is_active);

-- =============================================
-- SECTIONS
-- =============================================
CREATE TABLE IF NOT EXISTS public.sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  capacity INTEGER NOT NULL DEFAULT 40 CHECK (capacity > 0 AND capacity <= 200),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_sections_id_class_id UNIQUE (id, class_id),
  CONSTRAINT fk_section_class_school FOREIGN KEY (class_id, school_id)
    REFERENCES public.classes(id, school_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_sections_school_id ON public.sections(school_id);
CREATE INDEX IF NOT EXISTS idx_sections_class_id ON public.sections(class_id);
CREATE INDEX IF NOT EXISTS idx_sections_school_class ON public.sections(school_id, class_id);
CREATE INDEX IF NOT EXISTS idx_sections_school_active ON public.sections(school_id, is_active);

-- =============================================
-- STUDENTS
-- =============================================
CREATE TABLE IF NOT EXISTS public.students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  student_id TEXT NOT NULL,
  roll_number TEXT,
  full_name TEXT NOT NULL,
  father_name TEXT,
  guardian_name TEXT,
  date_of_birth DATE,
  gender TEXT CHECK (gender IN ('male', 'female', 'other')),
  phone TEXT,
  address TEXT,
  admission_date DATE NOT NULL DEFAULT CURRENT_DATE,
  photo_url TEXT,
  class_id UUID REFERENCES public.classes(id) ON DELETE SET NULL,
  section_id UUID REFERENCES public.sections(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'graduated')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_students_id_school_id UNIQUE (id, school_id),
  CONSTRAINT uq_student_id_per_school UNIQUE (school_id, student_id),
  CONSTRAINT uq_roll_number_per_section UNIQUE (section_id, roll_number),
  CONSTRAINT fk_student_section_class FOREIGN KEY (section_id, class_id)
    REFERENCES public.sections(id, class_id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_students_school_id ON public.students(school_id);
CREATE INDEX IF NOT EXISTS idx_students_class_id ON public.students(class_id);
CREATE INDEX IF NOT EXISTS idx_students_section_id ON public.students(section_id);
CREATE INDEX IF NOT EXISTS idx_students_school_class ON public.students(school_id, class_id);
CREATE INDEX IF NOT EXISTS idx_students_school_section ON public.students(school_id, section_id);
CREATE INDEX IF NOT EXISTS idx_students_status ON public.students(status);
CREATE INDEX IF NOT EXISTS idx_students_full_name ON public.students(full_name);

-- =============================================
-- TEACHER DETAILS
-- =============================================
CREATE TABLE IF NOT EXISTS public.teacher_details (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  employee_id TEXT,
  joining_date DATE,
  qualification TEXT,
  specialization TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_teacher_details_profile_id ON public.teacher_details(profile_id);
CREATE INDEX IF NOT EXISTS idx_teacher_details_employee_id ON public.teacher_details(employee_id);

-- =============================================
-- SUBJECTS
-- =============================================
CREATE TABLE IF NOT EXISTS public.subjects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  code TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_subject_code_per_school UNIQUE (school_id, code)
);

CREATE INDEX IF NOT EXISTS idx_subjects_school_id ON public.subjects(school_id);
CREATE INDEX IF NOT EXISTS idx_subjects_school_active ON public.subjects(school_id, is_active);

-- =============================================
-- TEACHER ASSIGNMENTS
-- =============================================
CREATE TABLE IF NOT EXISTS public.teacher_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  teacher_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  section_id UUID NOT NULL REFERENCES public.sections(id) ON DELETE CASCADE,
  subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  is_class_teacher BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_teacher_assignment UNIQUE (teacher_id, class_id, section_id, subject_id),
  CONSTRAINT fk_assignment_section_class FOREIGN KEY (section_id, class_id)
    REFERENCES public.sections(id, class_id) ON DELETE CASCADE,
  CONSTRAINT fk_assignment_teacher_school FOREIGN KEY (teacher_id, school_id)
    REFERENCES public.profiles(id, school_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_teacher_assignments_school_id ON public.teacher_assignments(school_id);
CREATE INDEX IF NOT EXISTS idx_teacher_assignments_teacher_id ON public.teacher_assignments(teacher_id);
CREATE INDEX IF NOT EXISTS idx_teacher_assignments_class_id ON public.teacher_assignments(class_id);
CREATE INDEX IF NOT EXISTS idx_teacher_assignments_section_id ON public.teacher_assignments(section_id);
CREATE INDEX IF NOT EXISTS idx_teacher_assignments_subject_id ON public.teacher_assignments(subject_id);

-- =============================================
-- UPDATED_AT TRIGGERS
-- =============================================
CREATE TRIGGER set_classes_updated_at
  BEFORE UPDATE ON public.classes
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_sections_updated_at
  BEFORE UPDATE ON public.sections
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_students_updated_at
  BEFORE UPDATE ON public.students
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_teacher_details_updated_at
  BEFORE UPDATE ON public.teacher_details
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_subjects_updated_at
  BEFORE UPDATE ON public.subjects
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_teacher_assignments_updated_at
  BEFORE UPDATE ON public.teacher_assignments
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- =============================================
-- ROW LEVEL SECURITY
-- =============================================
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teacher_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teacher_assignments ENABLE ROW LEVEL SECURITY;

-- =============================================
-- CLASSES POLICIES
-- =============================================
CREATE POLICY "Admins can view classes in their school" ON public.classes
  FOR SELECT USING (
    school_id IN (
      SELECT school_id FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Teachers can view classes in their school" ON public.classes
  FOR SELECT USING (
    school_id IN (
      SELECT school_id FROM public.profiles
      WHERE id = auth.uid() AND role = 'teacher'
    )
  );

CREATE POLICY "Parents can view classes in their school" ON public.classes
  FOR SELECT USING (
    school_id IN (
      SELECT school_id FROM public.profiles
      WHERE id = auth.uid() AND role = 'parent'
    )
  );

CREATE POLICY "Admins can insert classes in their school" ON public.classes
  FOR INSERT WITH CHECK (
    school_id IN (
      SELECT school_id FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can update classes in their school" ON public.classes
  FOR UPDATE USING (
    school_id IN (
      SELECT school_id FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can delete classes in their school" ON public.classes
  FOR DELETE USING (
    school_id IN (
      SELECT school_id FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- =============================================
-- SECTIONS POLICIES
-- =============================================
CREATE POLICY "Admins can view sections in their school" ON public.sections
  FOR SELECT USING (
    school_id IN (
      SELECT school_id FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Teachers can view sections in their school" ON public.sections
  FOR SELECT USING (
    school_id IN (
      SELECT school_id FROM public.profiles
      WHERE id = auth.uid() AND role = 'teacher'
    )
  );

CREATE POLICY "Parents can view sections in their school" ON public.sections
  FOR SELECT USING (
    school_id IN (
      SELECT school_id FROM public.profiles
      WHERE id = auth.uid() AND role = 'parent'
    )
  );

CREATE POLICY "Admins can insert sections in their school" ON public.sections
  FOR INSERT WITH CHECK (
    school_id IN (
      SELECT school_id FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can update sections in their school" ON public.sections
  FOR UPDATE USING (
    school_id IN (
      SELECT school_id FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can delete sections in their school" ON public.sections
  FOR DELETE USING (
    school_id IN (
      SELECT school_id FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- =============================================
-- STUDENTS POLICIES
-- =============================================
CREATE POLICY "Admins can view students in their school" ON public.students
  FOR SELECT USING (
    school_id IN (
      SELECT school_id FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Teachers can view students in their assigned classes" ON public.students
  FOR SELECT USING (
    class_id IN (
      SELECT class_id FROM public.teacher_assignments
      WHERE teacher_id = auth.uid()
    )
  );

CREATE POLICY "Admins can insert students in their school" ON public.students
  FOR INSERT WITH CHECK (
    school_id IN (
      SELECT school_id FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can update students in their school" ON public.students
  FOR UPDATE USING (
    school_id IN (
      SELECT school_id FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can delete students in their school" ON public.students
  FOR DELETE USING (
    school_id IN (
      SELECT school_id FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- =============================================
-- TEACHER DETAILS POLICIES
-- =============================================
CREATE POLICY "Admins can view teacher details in their school" ON public.teacher_details
  FOR SELECT USING (
    profile_id IN (
      SELECT id FROM public.profiles
      WHERE school_id IN (
        SELECT school_id FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin'
      ) AND role = 'teacher'
    )
  );

CREATE POLICY "Teachers can view their own details" ON public.teacher_details
  FOR SELECT USING (profile_id = auth.uid());

CREATE POLICY "Admins can insert teacher details in their school" ON public.teacher_details
  FOR INSERT WITH CHECK (
    profile_id IN (
      SELECT id FROM public.profiles
      WHERE school_id IN (
        SELECT school_id FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin'
      ) AND role = 'teacher'
    )
  );

CREATE POLICY "Admins can update teacher details in their school" ON public.teacher_details
  FOR UPDATE USING (
    profile_id IN (
      SELECT id FROM public.profiles
      WHERE school_id IN (
        SELECT school_id FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin'
      ) AND role = 'teacher'
    )
  );

CREATE POLICY "Teachers can update their own details" ON public.teacher_details
  FOR UPDATE USING (profile_id = auth.uid());

CREATE POLICY "Admins can delete teacher details in their school" ON public.teacher_details
  FOR DELETE USING (
    profile_id IN (
      SELECT id FROM public.profiles
      WHERE school_id IN (
        SELECT school_id FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin'
      ) AND role = 'teacher'
    )
  );

-- =============================================
-- SUBJECTS POLICIES
-- =============================================
CREATE POLICY "Admins can view subjects in their school" ON public.subjects
  FOR SELECT USING (
    school_id IN (
      SELECT school_id FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Teachers can view subjects in their school" ON public.subjects
  FOR SELECT USING (
    school_id IN (
      SELECT school_id FROM public.profiles
      WHERE id = auth.uid() AND role = 'teacher'
    )
  );

CREATE POLICY "Parents can view subjects in their school" ON public.subjects
  FOR SELECT USING (
    school_id IN (
      SELECT school_id FROM public.profiles
      WHERE id = auth.uid() AND role = 'parent'
    )
  );

CREATE POLICY "Admins can insert subjects in their school" ON public.subjects
  FOR INSERT WITH CHECK (
    school_id IN (
      SELECT school_id FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can update subjects in their school" ON public.subjects
  FOR UPDATE USING (
    school_id IN (
      SELECT school_id FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can delete subjects in their school" ON public.subjects
  FOR DELETE USING (
    school_id IN (
      SELECT school_id FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- =============================================
-- TEACHER ASSIGNMENTS POLICIES
-- =============================================
CREATE POLICY "Admins can view assignments in their school" ON public.teacher_assignments
  FOR SELECT USING (
    school_id IN (
      SELECT school_id FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Teachers can view their own assignments" ON public.teacher_assignments
  FOR SELECT USING (teacher_id = auth.uid());

CREATE POLICY "Admins can insert assignments in their school" ON public.teacher_assignments
  FOR INSERT WITH CHECK (
    school_id IN (
      SELECT school_id FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can update assignments in their school" ON public.teacher_assignments
  FOR UPDATE USING (
    school_id IN (
      SELECT school_id FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can delete assignments in their school" ON public.teacher_assignments
  FOR DELETE USING (
    school_id IN (
      SELECT school_id FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
