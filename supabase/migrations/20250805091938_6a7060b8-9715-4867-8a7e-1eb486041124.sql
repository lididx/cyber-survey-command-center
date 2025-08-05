-- Temporarily disable all triggers that might interfere with bulk deletion
DROP TRIGGER IF EXISTS audit_surveys_trigger ON public.surveys;
DROP TRIGGER IF EXISTS track_survey_changes_trigger ON public.surveys;

-- Delete all survey-related data to prepare for production
-- Delete contacts first (they reference surveys)
DELETE FROM public.contacts;

-- Delete survey history records
DELETE FROM public.survey_history;

-- Delete audit logs related to surveys
DELETE FROM public.audit_logs WHERE table_name = 'surveys';

-- Finally delete all surveys
DELETE FROM public.surveys;

-- Re-enable the triggers
CREATE TRIGGER audit_surveys_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.surveys
  FOR EACH ROW EXECUTE FUNCTION public.audit_survey_changes();

CREATE TRIGGER track_survey_changes_trigger
  AFTER UPDATE ON public.surveys
  FOR EACH ROW EXECUTE FUNCTION public.track_survey_changes();