-- Fix RLS policy for profiles - NO RECURSION
-- Drop all existing SELECT policies
DROP POLICY IF EXISTS "Admins can view profiles in their school" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;

-- Simple policy: users can only read their own profile
-- Admin access to other profiles is handled in the application layer
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (id = auth.uid());
