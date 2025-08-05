-- Delete all survey-related data to prepare for production
-- Delete contacts first (they reference surveys)
DELETE FROM public.contacts;

-- Delete survey history records
DELETE FROM public.survey_history;

-- Delete audit logs related to surveys
DELETE FROM public.audit_logs WHERE table_name = 'surveys';

-- Finally delete all surveys
DELETE FROM public.surveys;