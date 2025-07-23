-- Create admin user through sign up process
-- We'll manually insert the profile after
DO $$
DECLARE
    admin_user_id uuid;
BEGIN
    -- Check if admin user already exists
    SELECT id INTO admin_user_id FROM auth.users WHERE email = 'cita_administrator@system.local';
    
    IF admin_user_id IS NULL THEN
        -- Insert into profiles table directly for admin user
        INSERT INTO public.profiles (id, email, first_name, last_name, role, gender)
        SELECT 
            gen_random_uuid(),
            'cita_administrator@system.local',
            'Cita',
            'Administrator', 
            'admin'::user_role,
            'male'::gender;
    END IF;
END $$;