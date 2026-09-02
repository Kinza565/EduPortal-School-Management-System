-- Parent Portal: Link parents to auth users and add proper RLS policies
-- EduPortal - School Management System

-- =============================================
-- ADD profile_id TO parents TABLE
-- =============================================
ALTER TABLE public.parents
ADD COLUMN IF NOT EXISTS profile_id UUID UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_parents_profile_id ON public.parents(profile_id);

-- =============================================
-- UPDATE RLS POLICIES FOR PARENT DATA ISOLATION
-- =============================================

-- Drop existing parent policy that's too complex
DROP POLICY IF EXISTS "Parents can view their own data" ON public.parents;

-- Create simpler, more secure policy
CREATE POLICY "Parents can view their own data" ON public.parents
  FOR SELECT USING (
    profile_id = auth.uid()
  );

CREATE POLICY "Parents can update their own data" ON public.parents
  FOR UPDATE USING (
    profile_id = auth.uid()
  );

-- Parent-student relationship policies for parents
CREATE POLICY "Parents can view their own children links" ON public.parent_student
  FOR SELECT USING (
    parent_id IN (
      SELECT id FROM public.parents WHERE profile_id = auth.uid()
    )
  );

-- Students policies for parents (read-only, only linked children)
CREATE POLICY "Parents can view their linked children" ON public.students
  FOR SELECT USING (
    id IN (
      SELECT student_id FROM public.parent_student
      WHERE parent_id IN (
        SELECT id FROM public.parents WHERE profile_id = auth.uid()
      )
    )
  );

-- Attendance policies for parents (read-only, only linked children)
DROP POLICY IF EXISTS "Parents can view attendance in their school" ON public.attendance_records;

CREATE POLICY "Parents can view their children attendance" ON public.attendance_records
  FOR SELECT USING (
    student_id IN (
      SELECT student_id FROM public.parent_student
      WHERE parent_id IN (
        SELECT id FROM public.parents WHERE profile_id = auth.uid()
      )
    )
  );

-- Academic assignments policies for parents (read-only, for linked children's classes)
CREATE POLICY "Parents can view assignments for children classes" ON public.academic_assignments
  FOR SELECT USING (
    (class_id, section_id) IN (
      SELECT class_id, section_id FROM public.students
      WHERE id IN (
        SELECT student_id FROM public.parent_student
        WHERE parent_id IN (
          SELECT id FROM public.parents WHERE profile_id = auth.uid()
        )
      )
    )
  );

-- Exams policies for parents (read-only, for linked children's classes)
CREATE POLICY "Parents can view exams for children classes" ON public.exams
  FOR SELECT USING (
    class_id IN (
      SELECT class_id FROM public.students
      WHERE id IN (
        SELECT student_id FROM public.parent_student
        WHERE parent_id IN (
          SELECT id FROM public.parents WHERE profile_id = auth.uid()
        )
      )
    )
  );

-- Exam subjects policies for parents (read-only)
CREATE POLICY "Parents can view exam subjects for children exams" ON public.exam_subjects
  FOR SELECT USING (
    exam_id IN (
      SELECT id FROM public.exams
      WHERE class_id IN (
        SELECT class_id FROM public.students
        WHERE id IN (
          SELECT student_id FROM public.parent_student
          WHERE parent_id IN (
            SELECT id FROM public.parents WHERE profile_id = auth.uid()
          )
        )
      )
    )
  );

-- Results policies for parents (read-only, only linked children)
CREATE POLICY "Parents can view their children results" ON public.results
  FOR SELECT USING (
    student_id IN (
      SELECT student_id FROM public.parent_student
      WHERE parent_id IN (
        SELECT id FROM public.parents WHERE profile_id = auth.uid()
      )
    )
  );

-- Student fees policies for parents (read-only, only linked children)
CREATE POLICY "Parents can view their children fees" ON public.student_fees
  FOR SELECT USING (
    student_id IN (
      SELECT student_id FROM public.parent_student
      WHERE parent_id IN (
        SELECT id FROM public.parents WHERE profile_id = auth.uid()
      )
    )
  );

-- Fee payments policies for parents (read-only, only linked children)
CREATE POLICY "Parents can view their children payments" ON public.fee_payments
  FOR SELECT USING (
    student_id IN (
      SELECT student_id FROM public.parent_student
      WHERE parent_id IN (
        SELECT id FROM public.parents WHERE profile_id = auth.uid()
      )
    )
  );
