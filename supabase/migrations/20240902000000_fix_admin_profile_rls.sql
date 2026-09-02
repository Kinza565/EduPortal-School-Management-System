-- Fix admin cross-profile RLS access for Teacher Management.
-- The previous fix (fix_rls_profiles.sql) removed the admin SELECT policy
-- on public.profiles to avoid infinite recursion between profiles policies.
-- That broke the Faculty Members page because admins could no longer see
-- other profiles (teachers) in their school.
--
-- This migration restores admin access to profiles and teacher_details
-- within the caller's school using a SECURITY DEFINER helper that
-- reads the caller's school_id without triggering profiles RLS
-- (and therefore without recursion).
--
-- Idempotent: only creates objects that do not already exist.

-- 1) Helper: return the caller's (school_id, role) without invoking RLS.
CREATE OR REPLACE FUNCTION public.current_user_school()
RETURNS TABLE(school_id uuid, role text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT school_id, role
  FROM public.profiles
  WHERE id = auth.uid()
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.current_user_school() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.current_user_school() TO authenticated;

-- 2) Restore admin SELECT on profiles within their own school.
-- (This was the only profiles policy dropped by fix_rls_profiles.sql;
--  the INSERT/UPDATE/DELETE admin policies on profiles still exist.)
DROP POLICY IF EXISTS "Admins can view profiles in their school" ON public.profiles;
CREATE POLICY "Admins can view profiles in their school" ON public.profiles
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.current_user_school() me
      WHERE me.role = 'admin' AND me.school_id = profiles.school_id
    )
    OR id = auth.uid()
  );

-- 3) Recreate the recursion-prone teacher_details admin policies using the
-- non-recursive helper. The originals referenced public.profiles from within
-- a profiles-RLS context, which fails when the admin SELECT policy is the
-- "self only" one.
DROP POLICY IF EXISTS "Admins can view teacher details in their school" ON public.teacher_details;
CREATE POLICY "Admins can view teacher details in their school" ON public.teacher_details
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.profiles p
      JOIN public.current_user_school() me ON me.school_id = p.school_id
      WHERE p.id = teacher_details.profile_id AND me.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Admins can insert teacher details in their school" ON public.teacher_details;
CREATE POLICY "Admins can insert teacher details in their school" ON public.teacher_details
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.profiles p
      JOIN public.current_user_school() me ON me.school_id = p.school_id
      WHERE p.id = teacher_details.profile_id AND me.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Admins can update teacher details in their school" ON public.teacher_details;
CREATE POLICY "Admins can update teacher details in their school" ON public.teacher_details
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1
      FROM public.profiles p
      JOIN public.current_user_school() me ON me.school_id = p.school_id
      WHERE p.id = teacher_details.profile_id AND me.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.profiles p
      JOIN public.current_user_school() me ON me.school_id = p.school_id
      WHERE p.id = teacher_details.profile_id AND me.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Admins can delete teacher details in their school" ON public.teacher_details;
CREATE POLICY "Admins can delete teacher details in their school" ON public.teacher_details
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1
      FROM public.profiles p
      JOIN public.current_user_school() me ON me.school_id = p.school_id
      WHERE p.id = teacher_details.profile_id AND me.role = 'admin'
    )
  );
