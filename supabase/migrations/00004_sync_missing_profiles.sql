
-- دالة لمزامنة الملفات الشخصية المفقودة
CREATE OR REPLACE FUNCTION sync_missing_profiles()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- إنشاء ملفات تعريف للمستخدمين الذين ليس لديهم ملف تعريف
  INSERT INTO profiles (id, email, username, role)
  SELECT 
    au.id,
    au.email,
    split_part(au.email, '@', 1) as username,
    'user'::user_role as role
  FROM auth.users au
  LEFT JOIN profiles p ON au.id = p.id
  WHERE p.id IS NULL;
  
  -- تحديث البريد الإلكتروني المفقود في الملفات الشخصية
  UPDATE profiles p
  SET email = au.email
  FROM auth.users au
  WHERE p.id = au.id AND p.email IS NULL;
END;
$$;

-- تشغيل الدالة لمزامنة الملفات الحالية
SELECT sync_missing_profiles();
