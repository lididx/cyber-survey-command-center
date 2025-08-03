-- Add RLS policies for user management
-- Allow admins to delete users from profiles table
CREATE POLICY "Admins can delete profiles" 
ON profiles 
FOR DELETE 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.id = auth.uid() AND p.role = 'admin'
  )
);

-- Allow admins to insert profiles (for creating users)
CREATE POLICY "Admins can insert profiles" 
ON profiles 
FOR INSERT 
TO authenticated 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.id = auth.uid() AND p.role = 'admin'
  )
);

-- Allow admins to update any profile, users can update their own
CREATE POLICY "Admins can update all profiles, users can update own" 
ON profiles 
FOR UPDATE 
TO authenticated 
USING (
  auth.uid() = id OR 
  EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.id = auth.uid() AND p.role = 'admin'
  )
)
WITH CHECK (
  auth.uid() = id OR 
  EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.id = auth.uid() AND p.role = 'admin'
  )
);