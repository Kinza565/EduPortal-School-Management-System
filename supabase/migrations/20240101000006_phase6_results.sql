-- Phase 6: Results / Marks Management
-- EduPortal - School Management System

-- =============================================
-- RESULTS
-- =============================================
CREATE TABLE IF NOT EXISTS public.results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  exam_id UUID NOT NULL REFERENCES public.exams(id) ON DELETE CASCADE,
  exam_subject_id UUID NOT NULL REFERENCES public.exam_subjects(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  section_id UUID REFERENCES public.sections(id) ON DELETE SET NULL,
  obtained_marks NUMERIC NOT NULL DEFAULT 0 CHECK (obtained_marks >= 0),
  total_marks NUMERIC NOT NULL DEFAULT 100 CHECK (total_marks > 0),
  passing_marks NUMERIC NOT NULL DEFAULT 35 CHECK (passing_marks >= 0),
  percentage NUMERIC(5,2) NOT NULL DEFAULT 0 CHECK (percentage >= 0 AND percentage <= 100),
  grade TEXT NOT NULL DEFAULT 'F' CHECK (grade IN ('A+', 'A', 'B', 'C', 'D', 'F')),
  status TEXT NOT NULL DEFAULT 'fail' CHECK (status IN ('pass', 'fail')),
  remarks TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_results_id_school_id UNIQUE (id, school_id),
  CONSTRAINT uq_results_exam_subject_student UNIQUE (school_id, exam_subject_id, student_id),
  CONSTRAINT chk_results_marks CHECK (obtained_marks <= total_marks),
  CONSTRAINT chk_results_passing CHECK (passing_marks <= total_marks),
  CONSTRAINT fk_results_exam_school FOREIGN KEY (exam_id, school_id)
    REFERENCES public.exams(id, school_id) ON DELETE CASCADE,
  CONSTRAINT fk_results_subject_school FOREIGN KEY (exam_subject_id, school_id)
    REFERENCES public.exam_subjects(id, school_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_results_school_id ON public.results(school_id);
CREATE INDEX IF NOT EXISTS idx_results_exam_id ON public.results(exam_id);
CREATE INDEX IF NOT EXISTS idx_results_exam_subject_id ON public.results(exam_subject_id);
CREATE INDEX IF NOT EXISTS idx_results_student_id ON public.results(student_id);
CREATE INDEX IF NOT EXISTS idx_results_class_id ON public.results(class_id);
CREATE INDEX IF NOT EXISTS idx_results_section_id ON public.results(section_id);
CREATE INDEX IF NOT EXISTS idx_results_status ON public.results(status);
CREATE INDEX IF NOT EXISTS idx_results_grade ON public.results(grade);

-- =============================================
-- UPDATED_AT TRIGGER
-- =============================================
CREATE TRIGGER set_results_updated_at
  BEFORE UPDATE ON public.results
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- =============================================
-- ROW LEVEL SECURITY
-- =============================================
ALTER TABLE public.results ENABLE ROW LEVEL SECURITY;

-- =============================================
-- RESULTS POLICIES
-- =============================================

-- Admin policies
CREATE POLICY "Admins can view results in their school" ON public.results
  FOR SELECT USING (
    school_id IN (
      SELECT school_id FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can insert results in their school" ON public.results
  FOR INSERT WITH CHECK (
    school_id IN (
      SELECT school_id FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can update results in their school" ON public.results
  FOR UPDATE USING (
    school_id IN (
      SELECT school_id FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can delete results in their school" ON public.results
  FOR DELETE USING (
    school_id IN (
      SELECT school_id FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Teacher policies
CREATE POLICY "Teachers can view results in their school" ON public.results
  FOR SELECT USING (
    school_id IN (
      SELECT school_id FROM public.profiles
      WHERE id = auth.uid() AND role = 'teacher'
    )
  );

CREATE POLICY "Teachers can insert results in their school" ON public.results
  FOR INSERT WITH CHECK (
    school_id IN (
      SELECT school_id FROM public.profiles
      WHERE id = auth.uid() AND role = 'teacher'
    )
  );

CREATE POLICY "Teachers can update results in their school" ON public.results
  FOR UPDATE USING (
    school_id IN (
      SELECT school_id FROM public.profiles
      WHERE id = auth.uid() AND role = 'teacher'
    )
  );
