-- Phase 4: Academic Assignments / Homework Management
-- EduPortal - School Management System

-- =============================================
-- ACADEMIC ASSIGNMENTS (Homework/Assignments)
-- =============================================
CREATE TABLE IF NOT EXISTS public.academic_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  teacher_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  section_id UUID NOT NULL REFERENCES public.sections(id) ON DELETE CASCADE,
  subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  assigned_date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'completed', 'cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_academic_assignments_id_school_id UNIQUE (id, school_id),
  CONSTRAINT fk_assignment_section_class FOREIGN KEY (section_id, class_id)
    REFERENCES public.sections(id, class_id) ON DELETE CASCADE,
  CONSTRAINT fk_assignment_teacher_school FOREIGN KEY (teacher_id, school_id)
    REFERENCES public.profiles(id, school_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_academic_assignments_school_id ON public.academic_assignments(school_id);
CREATE INDEX IF NOT EXISTS idx_academic_assignments_teacher_id ON public.academic_assignments(teacher_id);
CREATE INDEX IF NOT EXISTS idx_academic_assignments_class_id ON public.academic_assignments(class_id);
CREATE INDEX IF NOT EXISTS idx_academic_assignments_section_id ON public.academic_assignments(section_id);
CREATE INDEX IF NOT EXISTS idx_academic_assignments_subject_id ON public.academic_assignments(subject_id);
CREATE INDEX IF NOT EXISTS idx_academic_assignments_status ON public.academic_assignments(status);
CREATE INDEX IF NOT EXISTS idx_academic_assignments_due_date ON public.academic_assignments(due_date);
CREATE INDEX IF NOT EXISTS idx_academic_assignments_assigned_date ON public.academic_assignments(assigned_date);

-- =============================================
-- UPDATED_AT TRIGGERS
-- =============================================
CREATE TRIGGER set_academic_assignments_updated_at
  BEFORE UPDATE ON public.academic_assignments
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- =============================================
-- ROW LEVEL SECURITY
-- =============================================
ALTER TABLE public.academic_assignments ENABLE ROW LEVEL SECURITY;

-- =============================================
-- ACADEMIC ASSIGNMENTS POLICIES
-- =============================================

-- Admin policies
CREATE POLICY "Admins can view assignments in their school" ON public.academic_assignments
  FOR SELECT USING (
    school_id IN (
      SELECT school_id FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can insert assignments in their school" ON public.academic_assignments
  FOR INSERT WITH CHECK (
    school_id IN (
      SELECT school_id FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can update assignments in their school" ON public.academic_assignments
  FOR UPDATE USING (
    school_id IN (
      SELECT school_id FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can delete assignments in their school" ON public.academic_assignments
  FOR DELETE USING (
    school_id IN (
      SELECT school_id FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Teacher policies
CREATE POLICY "Teachers can view their own assignments" ON public.academic_assignments
  FOR SELECT USING (teacher_id = auth.uid());

CREATE POLICY "Teachers can view assignments for their classes" ON public.academic_assignments
  FOR SELECT USING (
    class_id IN (
      SELECT class_id FROM public.teacher_assignments
      WHERE teacher_id = auth.uid()
    )
  );

CREATE POLICY "Teachers can insert assignments for their classes" ON public.academic_assignments
  FOR INSERT WITH CHECK (
    teacher_id = auth.uid() AND
    class_id IN (
      SELECT class_id FROM public.teacher_assignments
      WHERE teacher_id = auth.uid()
    )
  );

CREATE POLICY "Teachers can update their own assignments" ON public.academic_assignments
  FOR UPDATE USING (teacher_id = auth.uid());

CREATE POLICY "Teachers can delete their own assignments" ON public.academic_assignments
  FOR DELETE USING (teacher_id = auth.uid());
