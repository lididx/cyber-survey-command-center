-- Create enum types for findings
CREATE TYPE public.severity_level AS ENUM ('נמוכה', 'בינונית', 'גבוהה', 'קריטית');
CREATE TYPE public.damage_potential AS ENUM ('נמוך', 'בינוני', 'גבוה', 'קריטי');
CREATE TYPE public.tech_risk_level AS ENUM ('נמוכה', 'בינונית', 'גבוהה', 'קריטית');

-- Create findings_categories table
CREATE TABLE public.findings_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create findings_templates table
CREATE TABLE public.findings_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  category_id UUID NOT NULL REFERENCES public.findings_categories(id) ON DELETE CASCADE,
  created_by UUID REFERENCES auth.users(id),
  subject TEXT NOT NULL,
  test_description TEXT NOT NULL,
  severity severity_level NOT NULL,
  damage_potential damage_potential NOT NULL,
  tech_risk_level tech_risk_level NOT NULL,
  test_findings TEXT NOT NULL,
  exposure_description TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.findings_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.findings_templates ENABLE ROW LEVEL SECURITY;

-- RLS policies for findings_categories
CREATE POLICY "All authenticated users can view findings categories"
ON public.findings_categories
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Only admins can modify findings categories"
ON public.findings_categories
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- RLS policies for findings_templates
CREATE POLICY "All authenticated users can view findings templates"
ON public.findings_templates
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users can create findings templates"
ON public.findings_templates
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = created_by OR created_by IS NULL);

CREATE POLICY "Users can update their own findings templates"
ON public.findings_templates
FOR UPDATE
TO authenticated
USING (auth.uid() = created_by OR created_by IS NULL);

CREATE POLICY "Users can delete their own findings templates"
ON public.findings_templates
FOR DELETE
TO authenticated
USING (auth.uid() = created_by OR created_by IS NULL);

-- Insert initial categories
INSERT INTO public.findings_categories (name, display_name, description) VALUES
('system_description', 'תיאור מערכת', 'ממצאים הקשורים לתיאור ותיעוד המערכת'),
('architecture', 'ארכיטקטורה', 'ממצאים הקשורים לארכיטקטורה המערכת'),
('authentication', 'הזדהות וסיסמאות', 'ממצאים הקשורים למנגנוני הזדהות וניהול סיסמאות'),
('permissions', 'הרשאות ומשתמשים', 'ממצאים הקשורים לניהול הרשאות ומשתמשים'),
('interfaces', 'ממשקים', 'ממצאים הקשורים לממשקי המערכת'),
('alerts', 'חיווים', 'ממצאים הקשורים למערכת החיווים'),
('error_messages', 'הודעות שגיאה', 'ממצאים הקשורים לטיפול בשגיאות והודעות שגיאה'),
('session_management', 'ניהול Session', 'ממצאים הקשורים לניהול הפעלות משתמש'),
('input_validation', 'בדיקת קלטים', 'ממצאים הקשורים לוולידציה ובדיקת קלטים'),
('database', 'בסיס נתונים', 'ממצאים הקשורים לבסיס הנתונים'),
('environments', 'סביבות עבודה', 'ממצאים הקשורים לסביבות העבודה השונות'),
('traffic_medium', 'תווך תעבורה', 'ממצאים הקשורים לתווך התעבורה והתקשורת');

-- Create triggers for updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_findings_categories_updated_at
  BEFORE UPDATE ON public.findings_categories
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_findings_templates_updated_at
  BEFORE UPDATE ON public.findings_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();