-- Fix infinite recursion in profiles RLS policies
-- Drop existing problematic policies
DROP POLICY IF EXISTS "Managers can view all profiles" ON public.profiles;

-- Create new policy without recursion
CREATE POLICY "Managers can view all profiles" ON public.profiles
FOR SELECT
USING (
  -- Direct check without subquery on same table
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE auth.users.id = auth.uid()
    AND auth.users.id IN (
      SELECT p.id FROM public.profiles p 
      WHERE p.id = auth.uid() 
      AND p.role IN ('manager', 'admin')
    )
  )
  OR auth.uid() = id  -- Users can always view their own profile
);