-- Add last_email_bounce_date column to surveys table
ALTER TABLE public.surveys 
ADD COLUMN last_email_bounce_date DATE;