-- Create security definer function to get user role
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS user_role AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Drop and recreate profiles policies properly
DROP POLICY IF EXISTS "Managers can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

-- Create new policies using the security definer function
CREATE POLICY "Users can view their own profile" ON public.profiles
FOR SELECT
USING (auth.uid() = id);

CREATE POLICY "Managers can view all profiles" ON public.profiles
FOR SELECT  
USING (public.get_current_user_role() IN ('manager', 'admin'));

CREATE POLICY "Users can update their own profile" ON public.profiles
FOR UPDATE
USING (auth.uid() = id);