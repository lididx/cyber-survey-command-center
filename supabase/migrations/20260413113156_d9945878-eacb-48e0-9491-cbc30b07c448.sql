-- Add new survey status enum values
ALTER TYPE public.survey_status ADD VALUE IF NOT EXISTS 'completion_questions_with_vendor';
ALTER TYPE public.survey_status ADD VALUE IF NOT EXISTS 'frozen';
ALTER TYPE public.survey_status ADD VALUE IF NOT EXISTS 'postponed_to_new_date';

-- Add order_index column for manual survey ordering within client groups
ALTER TABLE public.surveys ADD COLUMN IF NOT EXISTS order_index integer DEFAULT 0;

-- Add sf_hours_logged column for Salesforce tracking
ALTER TABLE public.surveys ADD COLUMN IF NOT EXISTS sf_hours_logged boolean DEFAULT false;