-- Create survey_findings table to link surveys with findings
CREATE TABLE IF NOT EXISTS public.survey_findings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  survey_id UUID NOT NULL REFERENCES public.surveys(id) ON DELETE CASCADE,
  finding_template_id UUID REFERENCES public.findings_templates(id) ON DELETE SET NULL,
  subject TEXT NOT NULL,
  test_description TEXT NOT NULL,
  test_findings TEXT NOT NULL,
  exposure_description TEXT NOT NULL,
  recommendations TEXT,
  severity severity_level NOT NULL,
  damage_potential damage_potential NOT NULL,
  tech_risk_level tech_risk_level NOT NULL,
  status TEXT NOT NULL DEFAULT 'open',
  custom_text TEXT,
  is_custom BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL
);

-- Create index for better query performance
CREATE INDEX idx_survey_findings_survey_id ON public.survey_findings(survey_id);
CREATE INDEX idx_survey_findings_severity ON public.survey_findings(severity);
CREATE INDEX idx_survey_findings_status ON public.survey_findings(status);

-- Enable RLS
ALTER TABLE public.survey_findings ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can view findings for their own surveys, managers/admins can view all
CREATE POLICY "Users can view their survey findings"
ON public.survey_findings
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.surveys 
    WHERE surveys.id = survey_findings.survey_id 
    AND (surveys.user_id = auth.uid() OR get_current_user_role() IN ('manager', 'admin'))
  )
);

-- RLS Policy: Users can manage findings for their own surveys
CREATE POLICY "Users can manage their survey findings"
ON public.survey_findings
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.surveys 
    WHERE surveys.id = survey_findings.survey_id 
    AND surveys.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.surveys 
    WHERE surveys.id = survey_findings.survey_id 
    AND surveys.user_id = auth.uid()
  )
);

-- Trigger to auto-update updated_at
CREATE TRIGGER update_survey_findings_updated_at
BEFORE UPDATE ON public.survey_findings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();