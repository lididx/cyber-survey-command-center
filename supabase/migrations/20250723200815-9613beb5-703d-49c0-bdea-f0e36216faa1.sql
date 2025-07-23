-- Fix function search path security issues
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public
AS $$
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
$$;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER 
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.track_survey_changes()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Track status changes
  IF OLD.status != NEW.status THEN
    INSERT INTO public.survey_history (survey_id, user_id, field_name, old_value, new_value)
    VALUES (NEW.id, auth.uid(), 'status', OLD.status::text, NEW.status::text);
  END IF;
  
  -- Track archive changes
  IF OLD.is_archived != NEW.is_archived THEN
    INSERT INTO public.survey_history (survey_id, user_id, field_name, old_value, new_value)
    VALUES (NEW.id, auth.uid(), 'is_archived', OLD.is_archived::text, NEW.is_archived::text);
  END IF;
  
  RETURN NEW;
END;
$$;