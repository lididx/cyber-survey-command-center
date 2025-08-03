-- Add order_index column to findings_categories table
ALTER TABLE findings_categories 
ADD COLUMN order_index INTEGER DEFAULT 0;

-- Set initial order_index values for existing categories
UPDATE findings_categories 
SET order_index = (
  SELECT ROW_NUMBER() OVER (ORDER BY display_name)
  FROM (SELECT display_name FROM findings_categories fc2 WHERE fc2.id = findings_categories.id) sub
);

-- Create index for better performance on ordering
CREATE INDEX idx_findings_categories_order ON findings_categories(order_index);