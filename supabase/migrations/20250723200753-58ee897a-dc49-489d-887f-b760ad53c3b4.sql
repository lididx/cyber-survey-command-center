-- Fix the handle_new_user function with better error handling
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, first_name, last_name, role, gender)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    'surveyor'::user_role,
    COALESCE((NEW.raw_user_meta_data->>'gender')::gender, 'male'::gender)
  );
  RETURN NEW;
EXCEPTION
  WHEN others THEN
    RAISE LOG 'Error in handle_new_user for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create the admin user manually in profiles table
INSERT INTO public.profiles (id, email, first_name, last_name, role, gender)
SELECT 
  gen_random_uuid(),
  'cita_administrator@system.local',
  'Cita',
  'Administrator',
  'admin'::user_role,
  'male'::gender
WHERE NOT EXISTS (
  SELECT 1 FROM public.profiles WHERE email = 'cita_administrator@system.local'
);