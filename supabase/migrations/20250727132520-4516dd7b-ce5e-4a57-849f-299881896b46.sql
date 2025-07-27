-- Add received_date column to surveys table
ALTER TABLE public.surveys 
ADD COLUMN received_date date;

-- Add default value for existing records
UPDATE public.surveys 
SET received_date = created_at::date 
WHERE received_date IS NULL;