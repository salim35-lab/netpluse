
-- إضافة عمود البريد الإلكتروني إلى جدول profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email TEXT UNIQUE;

-- تحديث دالة handle_new_user لمزامنة البريد الإلكتروني
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
user_count int;
new_username text;
BEGIN
SELECT COUNT(*) INTO user_count FROM profiles;

-- استخراج اسم المستخدم من البريد الإلكتروني (الجزء قبل @)
new_username := split_part(NEW.email, '@', 1);

-- إدراج ملف تعريف متزامن مع الحقول المجمعة عند التسجيل
INSERT INTO public.profiles (id, email, username, role)
VALUES (
  NEW.id,
  NEW.email,
  new_username,
  CASE WHEN user_count = 0 THEN 'admin'::public.user_role ELSE 'user'::public.user_role END
);
RETURN NEW;
END;
$$;

-- إعادة إنشاء المشغل
DROP TRIGGER IF EXISTS on_auth_user_confirmed ON auth.users;
CREATE TRIGGER on_auth_user_confirmed
  AFTER UPDATE ON auth.users
  FOR EACH ROW
  WHEN (OLD.confirmed_at IS NULL AND NEW.confirmed_at IS NOT NULL)
  EXECUTE FUNCTION handle_new_user();
