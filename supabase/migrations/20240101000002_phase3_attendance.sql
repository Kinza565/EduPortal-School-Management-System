-- Phase 3: Attendance Management System
-- EduPortal - School Management System

-- =============================================
-- ATTENDANCE RECORDS
-- =============================================
CREATE TABLE IF NOT EXISTS public.attendance_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  section_id UUID NOT NULL REFERENCES public.sections(id) ON DELETE CASCADE,
  attendance_date DATE NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('present', 'absent', 'late', 'excused')),
  marked_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  remarks TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_attendance_per_student_date UNIQUE (school_id, student_id, attendance_date),
  CONSTRAINT fk_attendance_section_class FOREIGN KEY (section_id, class_id)
    REFERENCES public.sections(id, class_id) ON DELETE CASCADE,
  CONSTRAINT fk_attendance_student_school FOREIGN KEY (student_id, school_id)
    REFERENCES public.students(id, school_id) ON DELETE CASCADE
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_attendance_school_id ON public.attendance_records(school_id);
CREATE INDEX IF NOT EXISTS idx_attendance_student_id ON public.attendance_records(student_id);
CREATE INDEX IF NOT EXISTS idx_attendance_class_id ON public.attendance_records(class_id);
CREATE INDEX IF NOT EXISTS idx_attendance_section_id ON public.attendance_records(section_id);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON public.attendance_records(attendance_date);
CREATE INDEX IF NOT EXISTS idx_attendance_status ON public.attendance_records(status);
CREATE INDEX IF NOT EXISTS idx_attendance_school_date ON public.attendance_records(school_id, attendance_date);
CREATE INDEX IF NOT EXISTS idx_attendance_school_student_date ON public.attendance_records(school_id, student_id, attendance_date);
CREATE INDEX IF NOT EXISTS idx_attendance_marked_by ON public.attendance_records(marked_by);

-- Updated-at trigger
CREATE TRIGGER set_attendance_records_updated_at
  BEFORE UPDATE ON public.attendance_records
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- =============================================
-- ROW LEVEL SECURITY
-- =============================================
ALTER TABLE public.attendance_records ENABLE ROW LEVEL SECURITY;

-- =============================================
-- ATTENDANCE POLICIES
-- =============================================

-- Admin policies
CREATE POLICY "Admins can view attendance in their school" ON public.attendance_records
  FOR SELECT USING (
    school_id IN (
      SELECT school_id FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can insert attendance in their school" ON public.attendance_records
  FOR INSERT WITH CHECK (
    school_id IN (
      SELECT school_id FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can update attendance in their school" ON public.attendance_records
  FOR UPDATE USING (
    school_id IN (
      SELECT school_id FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can delete attendance in their school" ON public.attendance_records
  FOR DELETE USING (
    school_id IN (
      SELECT school_id FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Teacher policies
CREATE POLICY "Teachers can view attendance for their assigned classes" ON public.attendance_records
  FOR SELECT USING (
    class_id IN (
      SELECT class_id FROM public.teacher_assignments
      WHERE teacher_id = auth.uid()
    )
  );

CREATE POLICY "Teachers can insert attendance for their assigned classes" ON public.attendance_records
  FOR INSERT WITH CHECK (
    class_id IN (
      SELECT class_id FROM public.teacher_assignments
      WHERE teacher_id = auth.uid()
    )
  );

CREATE POLICY "Teachers can update attendance for their assigned classes" ON public.attendance_records
  FOR UPDATE USING (
    class_id IN (
      SELECT class_id FROM public.teacher_assignments
      WHERE teacher_id = auth.uid()
    )
  );

CREATE POLICY "Teachers can delete attendance for their assigned classes" ON public.attendance_records
  FOR DELETE USING (
    class_id IN (
      SELECT class_id FROM public.teacher_assignments
      WHERE teacher_id = auth.uid()
    )
  );

-- Parent policies (read-only)
CREATE POLICY "Parents can view attendance in their school" ON public.attendance_records
  FOR SELECT USING (
    school_id IN (
      SELECT school_id FROM public.profiles
      WHERE id = auth.uid() AND role = 'parent'
    )
  );
