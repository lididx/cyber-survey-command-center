-- Fix recursive RLS policy issue in contacts table
-- Replace the manager policy that directly queries profiles table with security definer function

-- Drop the existing problematic policy
DROP POLICY IF EXISTS "Managers can view all contacts" ON public.contacts;

-- Create new secure policy using the existing security definer function
CREATE POLICY "Managers can view all contacts" 
ON public.contacts 
FOR SELECT 
USING (get_current_user_role() = ANY (ARRAY['manager'::user_role, 'admin'::user_role]));

-- Also ensure the user-specific policies are optimized and secure
DROP POLICY IF EXISTS "Users can view contacts for their surveys" ON public.contacts;
DROP POLICY IF EXISTS "Users can manage contacts for their surveys" ON public.contacts;

-- Recreate user policies with better security checks
CREATE POLICY "Users can view contacts for their surveys" 
ON public.contacts 
FOR SELECT 
USING (
  auth.uid() IS NOT NULL AND
  EXISTS (
    SELECT 1 FROM public.surveys 
    WHERE surveys.id = contacts.survey_id 
    AND surveys.user_id = auth.uid()
  )
);

CREATE POLICY "Users can manage contacts for their surveys" 
ON public.contacts 
FOR ALL 
USING (
  auth.uid() IS NOT NULL AND
  EXISTS (
    SELECT 1 FROM public.surveys 
    WHERE surveys.id = contacts.survey_id 
    AND surveys.user_id = auth.uid()
  )
)
WITH CHECK (
  auth.uid() IS NOT NULL AND
  EXISTS (
    SELECT 1 FROM public.surveys 
    WHERE surveys.id = contacts.survey_id 
    AND surveys.user_id = auth.uid()
  )
);

-- Add additional security: policy to prevent any unauthorized access
CREATE POLICY "Deny all unauthorized access to contacts" 
ON public.contacts 
FOR ALL 
USING (false)
WITH CHECK (false);

-- Set policy priority by recreating in correct order
-- First deny all, then allow specific access
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;