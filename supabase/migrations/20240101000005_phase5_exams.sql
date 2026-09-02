-- Phase 5: Exams Management
-- EduPortal - School Management System

-- =============================================
-- EXAMS
-- =============================================
CREATE TABLE IF NOT EXISTS public.exams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  exam_type TEXT NOT NULL CHECK (exam_type IN ('unit_test', 'mid_term', 'final', 'quarterly', 'half_yearly', 'annual', 'other')),
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  section_id UUID REFERENCES public.sections(id) ON DELETE SET NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'ongoing', 'completed', 'cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_exams_id_school_id UNIQUE (id, school_id),
  CONSTRAINT fk_exam_section_class FOREIGN KEY (section_id, class_id)
    REFERENCES public.sections(id, class_id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_exams_school_id ON public.exams(school_id);
CREATE INDEX IF NOT EXISTS idx_exams_class_id ON public.exams(class_id);
CREATE INDEX IF NOT EXISTS idx_exams_section_id ON public.exams(section_id);
CREATE INDEX IF NOT EXISTS idx_exams_status ON public.exams(status);
CREATE INDEX IF NOT EXISTS idx_exams_start_date ON public.exams(start_date);
CREATE INDEX IF NOT EXISTS idx_exams_end_date ON public.exams(end_date);
CREATE INDEX IF NOT EXISTS idx_exams_exam_type ON public.exams(exam_type);

-- =============================================
-- EXAM SUBJECTS
-- =============================================
CREATE TABLE IF NOT EXISTS public.exam_subjects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  exam_id UUID NOT NULL REFERENCES public.exams(id) ON DELETE CASCADE,
  subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  exam_date DATE NOT NULL,
  start_time TIME,
  end_time TIME,
  total_marks NUMERIC NOT NULL DEFAULT 100 CHECK (total_marks > 0),
  passing_marks NUMERIC NOT NULL DEFAULT 35 CHECK (passing_marks >= 0),
  room_number TEXT,
  invigilator_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_exam_subjects_id_school_id UNIQUE (id, school_id),
  CONSTRAINT uq_exam_subject UNIQUE (exam_id, subject_id),
  CONSTRAINT chk_passing_marks CHECK (passing_marks <= total_marks),
  CONSTRAINT fk_exam_subjects_exam_school FOREIGN KEY (exam_id, school_id)
    REFERENCES public.exams(id, school_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_exam_subjects_school_id ON public.exam_subjects(school_id);
CREATE INDEX IF NOT EXISTS idx_exam_subjects_exam_id ON public.exam_subjects(exam_id);
CREATE INDEX IF NOT EXISTS idx_exam_subjects_subject_id ON public.exam_subjects(subject_id);
CREATE INDEX IF NOT EXISTS idx_exam_subjects_exam_date ON public.exam_subjects(exam_date);
CREATE INDEX IF NOT EXISTS idx_exam_subjects_invigilator ON public.exam_subjects(invigilator_id);

-- =============================================
-- UPDATED_AT TRIGGERS
-- =============================================
CREATE TRIGGER set_exams_updated_at
  BEFORE UPDATE ON public.exams
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_exam_subjects_updated_at
  BEFORE UPDATE ON public.exam_subjects
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- =============================================
-- ROW LEVEL SECURITY
-- =============================================
ALTER TABLE public.exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_subjects ENABLE ROW LEVEL SECURITY;

-- =============================================
-- EXAMS POLICIES
-- =============================================

-- Admin policies
CREATE POLICY "Admins can view exams in their school" ON public.exams
  FOR SELECT USING (
    school_id IN (
      SELECT school_id FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can insert exams in their school" ON public.exams
  FOR INSERT WITH CHECK (
    school_id IN (
      SELECT school_id FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can update exams in their school" ON public.exams
  FOR UPDATE USING (
    school_id IN (
      SELECT school_id FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can delete exams in their school" ON public.exams
  FOR DELETE USING (
    school_id IN (
      SELECT school_id FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Teacher policies
CREATE POLICY "Teachers can view exams in their school" ON public.exams
  FOR SELECT USING (
    school_id IN (
      SELECT school_id FROM public.profiles
      WHERE id = auth.uid() AND role = 'teacher'
    )
  );

-- =============================================
-- EXAM SUBJECTS POLICIES
-- =============================================

-- Admin policies
CREATE POLICY "Admins can view exam subjects in their school" ON public.exam_subjects
  FOR SELECT USING (
    school_id IN (
      SELECT school_id FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can insert exam subjects in their school" ON public.exam_subjects
  FOR INSERT WITH CHECK (
    school_id IN (
      SELECT school_id FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can update exam subjects in their school" ON public.exam_subjects
  FOR UPDATE USING (
    school_id IN (
      SELECT school_id FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can delete exam subjects in their school" ON public.exam_subjects
  FOR DELETE USING (
    school_id IN (
      SELECT school_id FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Teacher policies
CREATE POLICY "Teachers can view exam subjects in their school" ON public.exam_subjects
  FOR SELECT USING (
    school_id IN (
      SELECT school_id FROM public.profiles
      WHERE id = auth.uid() AND role = 'teacher'
    )
  );
