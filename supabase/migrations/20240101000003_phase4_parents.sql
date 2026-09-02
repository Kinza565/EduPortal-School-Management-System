-- Phase 4: Parents/Guardians Management
-- EduPortal - School Management System

-- =============================================
-- PARENTS
-- =============================================
CREATE TABLE IF NOT EXISTS public.parents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  relationship TEXT NOT NULL CHECK (relationship IN ('father', 'mother', 'guardian', 'other')),
  phone TEXT,
  email TEXT,
  address TEXT,
  occupation TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_parents_id_school_id UNIQUE (id, school_id)
);

CREATE INDEX IF NOT EXISTS idx_parents_school_id ON public.parents(school_id);
CREATE INDEX IF NOT EXISTS idx_parents_relationship ON public.parents(relationship);
CREATE INDEX IF NOT EXISTS idx_parents_phone ON public.parents(phone);
CREATE INDEX IF NOT EXISTS idx_parents_full_name ON public.parents(full_name);

-- =============================================
-- PARENT STUDENT RELATIONSHIPS
-- =============================================
CREATE TABLE IF NOT EXISTS public.parent_student (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  parent_id UUID NOT NULL REFERENCES public.parents(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  is_primary_contact BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_parent_student UNIQUE (parent_id, student_id),
  CONSTRAINT fk_parent_student_school FOREIGN KEY (student_id, school_id)
    REFERENCES public.students(id, school_id) ON DELETE CASCADE,
  CONSTRAINT fk_parent_school FOREIGN KEY (parent_id, school_id)
    REFERENCES public.parents(id, school_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_parent_student_parent_id ON public.parent_student(parent_id);
CREATE INDEX IF NOT EXISTS idx_parent_student_student_id ON public.parent_student(student_id);
CREATE INDEX IF NOT EXISTS idx_parent_student_school_id ON public.parent_student(school_id);

-- =============================================
-- UPDATED_AT TRIGGERS
-- =============================================
CREATE TRIGGER set_parents_updated_at
  BEFORE UPDATE ON public.parents
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- =============================================
-- ROW LEVEL SECURITY
-- =============================================
ALTER TABLE public.parents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parent_student ENABLE ROW LEVEL SECURITY;

-- =============================================
-- PARENTS POLICIES
-- =============================================
CREATE POLICY "Admins can view parents in their school" ON public.parents
  FOR SELECT USING (
    school_id IN (
      SELECT school_id FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can insert parents in their school" ON public.parents
  FOR INSERT WITH CHECK (
    school_id IN (
      SELECT school_id FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can update parents in their school" ON public.parents
  FOR UPDATE USING (
    school_id IN (
      SELECT school_id FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can delete parents in their school" ON public.parents
  FOR DELETE USING (
    school_id IN (
      SELECT school_id FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Parents can view their own data" ON public.parents
  FOR SELECT USING (
    id IN (
      SELECT parent_id FROM public.parent_student
      WHERE student_id IN (
        SELECT id FROM public.students
        WHERE id IN (
          SELECT student_id FROM public.parent_student ps
          JOIN public.parents p ON ps.parent_id = p.id
          WHERE p.id IN (
            SELECT parent_id FROM public.parent_student
            WHERE student_id IN (
              SELECT id FROM public.students
              WHERE school_id IN (
                SELECT school_id FROM public.profiles
                WHERE id = auth.uid() AND role = 'parent'
              )
            )
          )
        )
      )
    )
  );

-- =============================================
-- PARENT_STUDENT POLICIES
-- =============================================
CREATE POLICY "Admins can view parent_student in their school" ON public.parent_student
  FOR SELECT USING (
    school_id IN (
      SELECT school_id FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can insert parent_student in their school" ON public.parent_student
  FOR INSERT WITH CHECK (
    school_id IN (
      SELECT school_id FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can update parent_student in their school" ON public.parent_student
  FOR UPDATE USING (
    school_id IN (
      SELECT school_id FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can delete parent_student in their school" ON public.parent_student
  FOR DELETE USING (
    school_id IN (
      SELECT school_id FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
