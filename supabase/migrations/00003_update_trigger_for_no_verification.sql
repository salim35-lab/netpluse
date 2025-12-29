
-- حذف المشغل القديم
DROP TRIGGER IF EXISTS on_auth_user_confirmed ON auth.users;

-- إنشاء مشغل جديد يعمل عند الإدراج مباشرة
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();
