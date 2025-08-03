-- Fix RLS policy to allow users to update order_index
DROP POLICY IF EXISTS "Only admins can update findings categories" ON findings_categories;

-- Create new policy that allows all authenticated users to update order_index
CREATE POLICY "Users can update category order" 
ON findings_categories 
FOR UPDATE 
TO authenticated 
USING (true)
WITH CHECK (true);

-- Reset order_index values with proper ordering
UPDATE findings_categories 
SET order_index = subquery.row_num
FROM (
  SELECT id, ROW_NUMBER() OVER (ORDER BY display_name) as row_num
  FROM findings_categories
) subquery
WHERE findings_categories.id = subquery.id;