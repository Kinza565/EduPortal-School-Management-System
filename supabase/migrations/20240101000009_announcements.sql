-- Phase 8: Notifications & Announcements
-- EduPortal - School Management System

-- =============================================
-- FIX: Add missing UNIQUE constraint on sections(id, school_id)
-- This is required for the composite foreign key below
-- Safe because id is already PRIMARY KEY, making (id, school_id) inherently unique
-- Uses DO block because PostgreSQL does not support ADD CONSTRAINT IF NOT EXISTS
-- =============================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'uq_sections_id_school_id'
      AND conrelid = 'public.sections'::regclass
  ) THEN
    ALTER TABLE public.sections
      ADD CONSTRAINT uq_sections_id_school_id UNIQUE (id, school_id);
  END IF;
END $$;

-- =============================================
-- ANNOUNCEMENTS
-- =============================================
CREATE TABLE IF NOT EXISTS public.announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  target_type TEXT NOT NULL CHECK (target_type IN ('all', 'teachers', 'parents', 'class', 'section')),
  class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
  section_id UUID REFERENCES public.sections(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  published_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_announcements_id_school_id UNIQUE (id, school_id),
  CONSTRAINT fk_announcements_class_school FOREIGN KEY (class_id, school_id)
    REFERENCES public.classes(id, school_id) ON DELETE CASCADE,
  CONSTRAINT fk_announcements_section_school FOREIGN KEY (section_id, school_id)
    REFERENCES public.sections(id, school_id) ON DELETE CASCADE,
  CONSTRAINT chk_announcements_target_class CHECK (
    (target_type != 'class') OR (class_id IS NOT NULL)
  ),
  CONSTRAINT chk_announcements_target_section CHECK (
    (target_type != 'section') OR (section_id IS NOT NULL)
  )
);

CREATE INDEX IF NOT EXISTS idx_announcements_school_id ON public.announcements(school_id);
CREATE INDEX IF NOT EXISTS idx_announcements_target_type ON public.announcements(target_type);
CREATE INDEX IF NOT EXISTS idx_announcements_class_id ON public.announcements(class_id);
CREATE INDEX IF NOT EXISTS idx_announcements_section_id ON public.announcements(section_id);
CREATE INDEX IF NOT EXISTS idx_announcements_published_at ON public.announcements(published_at);
CREATE INDEX IF NOT EXISTS idx_announcements_expires_at ON public.announcements(expires_at);
CREATE INDEX IF NOT EXISTS idx_announcements_is_active ON public.announcements(is_active);
CREATE INDEX IF NOT EXISTS idx_announcements_created_by ON public.announcements(created_by);

-- =============================================
-- NOTIFICATION READS
-- =============================================
CREATE TABLE IF NOT EXISTS public.notification_reads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  announcement_id UUID NOT NULL REFERENCES public.announcements(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  read_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_notification_reads UNIQUE (announcement_id, user_id),
  CONSTRAINT uq_notification_reads_id_school_id UNIQUE (id, school_id)
);

CREATE INDEX IF NOT EXISTS idx_notification_reads_school_id ON public.notification_reads(school_id);
CREATE INDEX IF NOT EXISTS idx_notification_reads_announcement_id ON public.notification_reads(announcement_id);
CREATE INDEX IF NOT EXISTS idx_notification_reads_user_id ON public.notification_reads(user_id);

-- =============================================
-- UPDATED_AT TRIGGER
-- =============================================
CREATE TRIGGER set_announcements_updated_at
  BEFORE UPDATE ON public.announcements
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- =============================================
-- ROW LEVEL SECURITY
-- =============================================
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_reads ENABLE ROW LEVEL SECURITY;

-- =============================================
-- ANNOUNCEMENTS POLICIES
-- =============================================

-- Admin policies
CREATE POLICY "Admins can view announcements in their school" ON public.announcements
  FOR SELECT USING (
    school_id IN (
      SELECT school_id FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can insert announcements in their school" ON public.announcements
  FOR INSERT WITH CHECK (
    school_id IN (
      SELECT school_id FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can update announcements in their school" ON public.announcements
  FOR UPDATE USING (
    school_id IN (
      SELECT school_id FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can delete announcements in their school" ON public.announcements
  FOR DELETE USING (
    school_id IN (
      SELECT school_id FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Teacher policies - can view announcements relevant to them
CREATE POLICY "Teachers can view relevant announcements" ON public.announcements
  FOR SELECT USING (
    school_id IN (
      SELECT school_id FROM public.profiles
      WHERE id = auth.uid() AND role = 'teacher'
    )
    AND (
      target_type IN ('all', 'teachers')
      OR (target_type = 'class' AND class_id IN (
        SELECT class_id FROM public.teacher_assignments
        WHERE teacher_id = auth.uid()
      ))
      OR (target_type = 'section' AND section_id IN (
        SELECT section_id FROM public.teacher_assignments
        WHERE teacher_id = auth.uid()
      ))
    )
  );

-- Parent policies - can view announcements relevant to them
CREATE POLICY "Parents can view relevant announcements" ON public.announcements
  FOR SELECT USING (
    school_id IN (
      SELECT school_id FROM public.profiles
      WHERE id = auth.uid() AND role = 'parent'
    )
    AND (
      target_type IN ('all', 'parents')
      OR (target_type = 'class' AND class_id IN (
        SELECT s.class_id FROM public.parent_student ps
        JOIN public.students s ON s.id = ps.student_id
        WHERE ps.parent_id IN (
          SELECT id FROM public.parents WHERE profile_id = auth.uid()
        )
      ))
      OR (target_type = 'section' AND section_id IN (
        SELECT s.section_id FROM public.parent_student ps
        JOIN public.students s ON s.id = ps.student_id
        WHERE ps.parent_id IN (
          SELECT id FROM public.parents WHERE profile_id = auth.uid()
        )
      ))
    )
  );

-- =============================================
-- NOTIFICATION READS POLICIES
-- =============================================

-- Admin policies
CREATE POLICY "Admins can view notification reads in their school" ON public.notification_reads
  FOR SELECT USING (
    school_id IN (
      SELECT school_id FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can insert notification reads in their school" ON public.notification_reads
  FOR INSERT WITH CHECK (
    school_id IN (
      SELECT school_id FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Teacher policies
CREATE POLICY "Teachers can view their own notification reads" ON public.notification_reads
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Teachers can insert their own notification reads" ON public.notification_reads
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Parent policies
CREATE POLICY "Parents can view their own notification reads" ON public.notification_reads
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Parents can insert their own notification reads" ON public.notification_reads
  FOR INSERT WITH CHECK (user_id = auth.uid());
