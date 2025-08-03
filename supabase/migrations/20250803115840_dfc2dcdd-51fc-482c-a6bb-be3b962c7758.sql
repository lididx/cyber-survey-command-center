-- Fix RLS policy for findings_categories to allow all authenticated users to create
DROP POLICY IF EXISTS "Only admins can modify findings categories" ON findings_categories;

-- Create new policy that allows authenticated users to create, but only admins to update/delete
CREATE POLICY "Authenticated users can create findings categories" 
ON findings_categories 
FOR INSERT 
TO authenticated 
WITH CHECK (true);

CREATE POLICY "Only admins can update findings categories" 
ON findings_categories 
FOR UPDATE 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'::user_role
  )
);

CREATE POLICY "Only admins can delete findings categories" 
ON findings_categories 
FOR DELETE 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'::user_role
  )
);