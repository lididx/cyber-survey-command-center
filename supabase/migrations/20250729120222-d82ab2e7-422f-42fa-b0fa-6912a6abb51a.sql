-- Fix the survey_date column to allow NULL values since the form allows empty dates
ALTER TABLE public.surveys ALTER COLUMN survey_date DROP NOT NULL;