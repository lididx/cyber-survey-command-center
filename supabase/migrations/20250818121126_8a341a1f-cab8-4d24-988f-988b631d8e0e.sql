-- מחיקת הסקר הספציפי
DELETE FROM surveys WHERE id = '5764c21a-f999-4e16-aa62-f2ff39093a32';

-- מחיקת המשתמש מורן מauth.users (יפתור את הבעיה של "User Already Registered")
DELETE FROM auth.users WHERE email = 'moran@citadel.co.il';

-- עדכון RLS policies לאפשר למנהלי מערכת למחוק סקרים
DROP POLICY IF EXISTS "Users can delete their own surveys" ON surveys;

CREATE POLICY "Users can delete their own surveys and admins can delete all"
ON surveys 
FOR DELETE 
USING (
  auth.uid() = user_id 
  OR get_current_user_role() = 'admin'
);

-- גם עדכון למדיניות UPDATE כדי שמנהלים יוכלו לערוך סקרים
DROP POLICY IF EXISTS "Users can update their own surveys" ON surveys;

CREATE POLICY "Users can update their own surveys and admins can update all"
ON surveys 
FOR UPDATE 
USING (
  auth.uid() = user_id 
  OR get_current_user_role() = 'admin'
);