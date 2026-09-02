-- Migration: Add composite unique constraint for sections (id, school_id)
-- This supports RLS policies that reference (id, school_id) pairs

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'uq_sections_id_school_id'
      AND table_name = 'sections'
      AND table_schema = 'public'
  ) THEN
    ALTER TABLE public.sections
      ADD CONSTRAINT uq_sections_id_school_id UNIQUE (id, school_id);
  END IF;
END $$;
