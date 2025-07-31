-- Create system_settings table for dynamic configuration
CREATE TABLE public.system_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  setting_key TEXT NOT NULL UNIQUE,
  setting_value JSONB NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- Create policies for system_settings
CREATE POLICY "Admins can manage system settings"
ON public.system_settings
FOR ALL
USING ((EXISTS ( SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'::user_role)));

CREATE POLICY "All authenticated users can view system settings"
ON public.system_settings
FOR SELECT
USING (true);

-- Create audit_logs table for tracking changes
CREATE TABLE public.audit_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  action TEXT NOT NULL,
  table_name TEXT NOT NULL,
  record_id TEXT,
  old_values JSONB,
  new_values JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for audit_logs
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Create policies for audit_logs
CREATE POLICY "Admins can view all audit logs"
ON public.audit_logs
FOR SELECT
USING ((EXISTS ( SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'::user_role)));

CREATE POLICY "Users can create audit logs"
ON public.audit_logs
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Add trigger for system_settings updates
CREATE TRIGGER update_system_settings_updated_at
BEFORE UPDATE ON public.system_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default system settings
INSERT INTO public.system_settings (setting_key, setting_value, description) VALUES
('stuck_survey_threshold_days', '5', 'Number of days after which a survey is considered stuck'),
('status_colors', '{"received": "#4FC3F7", "email_sent_to_admin": "#7E57C2", "meeting_scheduled": "#81C784", "in_writing": "#FFB74D", "completion_questions_with_admin": "#FB8C00", "chen_review": "#8E24AA", "completed": "#388E3C"}', 'Color mapping for survey statuses'),
('email_templates', '{"reminder": "תזכורת לסקר", "stuck": "סקר תקוע"}', 'Email templates for notifications');