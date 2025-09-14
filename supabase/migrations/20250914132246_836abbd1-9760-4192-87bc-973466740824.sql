-- Add order_index column to findings_templates table
ALTER TABLE public.findings_templates ADD COLUMN order_index INTEGER DEFAULT 0;

-- Add new survey status "returned_from_review" to enum
ALTER TYPE survey_status ADD VALUE 'returned_from_review';