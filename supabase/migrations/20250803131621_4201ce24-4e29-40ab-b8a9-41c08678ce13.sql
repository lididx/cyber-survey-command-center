-- Fix the function search path security issue
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- Add missing recommendations column to findings_templates
ALTER TABLE public.findings_templates 
ADD COLUMN IF NOT EXISTS recommendations TEXT;

-- Create or replace audit trigger function for surveys
CREATE OR REPLACE FUNCTION public.audit_survey_changes()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert audit log for any field change
  IF TG_OP = 'UPDATE' THEN
    -- Track system_name changes
    IF OLD.system_name IS DISTINCT FROM NEW.system_name THEN
      INSERT INTO public.audit_logs (user_id, table_name, record_id, action, old_values, new_values)
      VALUES (auth.uid(), 'surveys', NEW.id::text, 'UPDATE', 
        jsonb_build_object('system_name', OLD.system_name),
        jsonb_build_object('system_name', NEW.system_name));
    END IF;
    
    -- Track system_description changes
    IF OLD.system_description IS DISTINCT FROM NEW.system_description THEN
      INSERT INTO public.audit_logs (user_id, table_name, record_id, action, old_values, new_values)
      VALUES (auth.uid(), 'surveys', NEW.id::text, 'UPDATE',
        jsonb_build_object('system_description', OLD.system_description),
        jsonb_build_object('system_description', NEW.system_description));
    END IF;
    
    -- Track survey_date changes  
    IF OLD.survey_date IS DISTINCT FROM NEW.survey_date THEN
      INSERT INTO public.audit_logs (user_id, table_name, record_id, action, old_values, new_values)
      VALUES (auth.uid(), 'surveys', NEW.id::text, 'UPDATE',
        jsonb_build_object('survey_date', OLD.survey_date),
        jsonb_build_object('survey_date', NEW.survey_date));
    END IF;
    
    -- Track received_date changes
    IF OLD.received_date IS DISTINCT FROM NEW.received_date THEN
      INSERT INTO public.audit_logs (user_id, table_name, record_id, action, old_values, new_values)
      VALUES (auth.uid(), 'surveys', NEW.id::text, 'UPDATE',
        jsonb_build_object('received_date', OLD.received_date),
        jsonb_build_object('received_date', NEW.received_date));
    END IF;
    
    -- Track status changes
    IF OLD.status IS DISTINCT FROM NEW.status THEN
      INSERT INTO public.audit_logs (user_id, table_name, record_id, action, old_values, new_values)
      VALUES (auth.uid(), 'surveys', NEW.id::text, 'UPDATE',
        jsonb_build_object('status', OLD.status),
        jsonb_build_object('status', NEW.status));
    END IF;
    
    -- Track client_id changes
    IF OLD.client_id IS DISTINCT FROM NEW.client_id THEN
      INSERT INTO public.audit_logs (user_id, table_name, record_id, action, old_values, new_values)
      VALUES (auth.uid(), 'surveys', NEW.id::text, 'UPDATE',
        jsonb_build_object('client_id', OLD.client_id),
        jsonb_build_object('client_id', NEW.client_id));
    END IF;
    
    RETURN NEW;
  ELSIF TG_OP = 'INSERT' THEN
    INSERT INTO public.audit_logs (user_id, table_name, record_id, action, new_values)
    VALUES (auth.uid(), 'surveys', NEW.id::text, 'INSERT',
      jsonb_build_object(
        'system_name', NEW.system_name,
        'status', NEW.status,
        'client_id', NEW.client_id
      ));
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO public.audit_logs (user_id, table_name, record_id, action, old_values)
    VALUES (auth.uid(), 'surveys', OLD.id::text, 'DELETE',
      jsonb_build_object(
        'system_name', OLD.system_name,
        'status', OLD.status,
        'client_id', OLD.client_id
      ));
    RETURN OLD;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- Create trigger for survey audit logging
DROP TRIGGER IF EXISTS audit_surveys_trigger ON public.surveys;
CREATE TRIGGER audit_surveys_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.surveys
  FOR EACH ROW EXECUTE FUNCTION public.audit_survey_changes();