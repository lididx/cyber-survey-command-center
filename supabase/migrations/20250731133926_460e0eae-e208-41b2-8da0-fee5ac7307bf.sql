-- עדכון מדיניות הגישה לטבלת audit_logs
-- מחיקת המדיניות הקיימת והוספת מדיניות חדשה שתעבוד נכון

DROP POLICY IF EXISTS "Users can create audit logs" ON public.audit_logs;

-- יצירת מדיניות חדשה לפי auth.uid()
CREATE POLICY "Users can create their own audit logs" 
ON public.audit_logs 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- וידוא שגם מנהלים יכולים לראות הכל
DROP POLICY IF EXISTS "Admins can view all audit logs" ON public.audit_logs;

CREATE POLICY "Admins can view all audit logs" 
ON public.audit_logs 
FOR SELECT 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND role = 'admin'
  )
  OR 
  auth.uid() = user_id
);

-- וידוא שמשתמשים יכולים לראות רק את הרישומים שלהם
CREATE POLICY "Users can view their own audit logs" 
ON public.audit_logs 
FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);