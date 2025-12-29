-- إنشاء نوع دور المستخدم
CREATE TYPE public.user_role AS ENUM ('user', 'admin');

-- إنشاء جدول الملفات الشخصية
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  display_name TEXT,
  bio TEXT,
  avatar_url TEXT,
  cover_url TEXT,
  role public.user_role NOT NULL DEFAULT 'user',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- إنشاء جدول المنشورات
CREATE TABLE public.posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- إنشاء جدول الإعجابات
CREATE TABLE public.likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, post_id)
);

-- إنشاء جدول التعليقات
CREATE TABLE public.comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- إنشاء جدول المتابعة
CREATE TABLE public.follows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(follower_id, following_id),
  CHECK (follower_id != following_id)
);

-- إنشاء جدول الرسائل
CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- إنشاء جدول الإشعارات
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  content TEXT NOT NULL,
  related_user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  related_post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- إنشاء الفهارس
CREATE INDEX idx_posts_user_id ON public.posts(user_id);
CREATE INDEX idx_posts_created_at ON public.posts(created_at DESC);
CREATE INDEX idx_likes_post_id ON public.likes(post_id);
CREATE INDEX idx_likes_user_id ON public.likes(user_id);
CREATE INDEX idx_comments_post_id ON public.comments(post_id);
CREATE INDEX idx_comments_user_id ON public.comments(user_id);
CREATE INDEX idx_follows_follower_id ON public.follows(follower_id);
CREATE INDEX idx_follows_following_id ON public.follows(following_id);
CREATE INDEX idx_messages_sender_id ON public.messages(sender_id);
CREATE INDEX idx_messages_receiver_id ON public.messages(receiver_id);
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_is_read ON public.notifications(is_read);

-- إنشاء دالة مساعدة للتحقق من المسؤول
CREATE OR REPLACE FUNCTION public.is_admin(uid UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = uid AND p.role = 'admin'::public.user_role
  );
$$;

-- إنشاء trigger لمزامنة المستخدمين
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  user_count INT;
  extracted_username TEXT;
BEGIN
  SELECT COUNT(*) INTO user_count FROM public.profiles;
  
  -- استخراج اسم المستخدم من البريد الإلكتروني
  extracted_username := SPLIT_PART(NEW.email, '@', 1);
  
  INSERT INTO public.profiles (id, username, display_name, role)
  VALUES (
    NEW.id,
    extracted_username,
    extracted_username,
    CASE WHEN user_count = 0 THEN 'admin'::public.user_role ELSE 'user'::public.user_role END
  );
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_confirmed ON auth.users;
CREATE TRIGGER on_auth_user_confirmed
  AFTER UPDATE ON auth.users
  FOR EACH ROW
  WHEN (OLD.confirmed_at IS NULL AND NEW.confirmed_at IS NOT NULL)
  EXECUTE FUNCTION public.handle_new_user();

-- إنشاء عرض للملفات الشخصية العامة
CREATE VIEW public.public_profiles AS
  SELECT id, username, display_name, bio, avatar_url, cover_url, role, created_at
  FROM public.profiles;

-- سياسات الأمان للملفات الشخصية
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "المسؤولون لديهم وصول كامل للملفات الشخصية"
  ON public.profiles FOR ALL
  TO authenticated
  USING (public.is_admin(auth.uid()));

CREATE POLICY "المستخدمون يمكنهم عرض ملفهم الشخصي"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "المستخدمون يمكنهم تحديث ملفهم الشخصي"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (role IS NOT DISTINCT FROM (SELECT role FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "الجميع يمكنهم عرض الملفات الشخصية العامة"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (TRUE);

-- سياسات الأمان للمنشورات
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "الجميع يمكنهم عرض المنشورات"
  ON public.posts FOR SELECT
  TO authenticated
  USING (TRUE);

CREATE POLICY "المستخدمون يمكنهم إنشاء منشوراتهم"
  ON public.posts FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "المستخدمون يمكنهم تحديث منشوراتهم"
  ON public.posts FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "المستخدمون يمكنهم حذف منشوراتهم"
  ON public.posts FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "المسؤولون يمكنهم حذف أي منشور"
  ON public.posts FOR DELETE
  TO authenticated
  USING (public.is_admin(auth.uid()));

-- سياسات الأمان للإعجابات
ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "الجميع يمكنهم عرض الإعجابات"
  ON public.likes FOR SELECT
  TO authenticated
  USING (TRUE);

CREATE POLICY "المستخدمون يمكنهم إضافة إعجاباتهم"
  ON public.likes FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "المستخدمون يمكنهم حذف إعجاباتهم"
  ON public.likes FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- سياسات الأمان للتعليقات
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "الجميع يمكنهم عرض التعليقات"
  ON public.comments FOR SELECT
  TO authenticated
  USING (TRUE);

CREATE POLICY "المستخدمون يمكنهم إضافة تعليقاتهم"
  ON public.comments FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "المستخدمون يمكنهم تحديث تعليقاتهم"
  ON public.comments FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "المستخدمون يمكنهم حذف تعليقاتهم"
  ON public.comments FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "المسؤولون يمكنهم حذف أي تعليق"
  ON public.comments FOR DELETE
  TO authenticated
  USING (public.is_admin(auth.uid()));

-- سياسات الأمان للمتابعة
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "الجميع يمكنهم عرض المتابعات"
  ON public.follows FOR SELECT
  TO authenticated
  USING (TRUE);

CREATE POLICY "المستخدمون يمكنهم متابعة الآخرين"
  ON public.follows FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = follower_id);

CREATE POLICY "المستخدمون يمكنهم إلغاء المتابعة"
  ON public.follows FOR DELETE
  TO authenticated
  USING (auth.uid() = follower_id);

-- سياسات الأمان للرسائل
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "المستخدمون يمكنهم عرض رسائلهم"
  ON public.messages FOR SELECT
  TO authenticated
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "المستخدمون يمكنهم إرسال رسائل"
  ON public.messages FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "المستخدمون يمكنهم تحديث رسائلهم المستلمة"
  ON public.messages FOR UPDATE
  TO authenticated
  USING (auth.uid() = receiver_id);

-- سياسات الأمان للإشعارات
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "المستخدمون يمكنهم عرض إشعاراتهم"
  ON public.notifications FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "النظام يمكنه إنشاء إشعارات"
  ON public.notifications FOR INSERT
  TO authenticated
  WITH CHECK (TRUE);

CREATE POLICY "المستخدمون يمكنهم تحديث إشعاراتهم"
  ON public.notifications FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "المستخدمون يمكنهم حذف إشعاراتهم"
  ON public.notifications FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- إنشاء bucket للصور
INSERT INTO storage.buckets (id, name, public)
VALUES ('ogqizyholwsmgzfacqxp_social_images', 'ogqizyholwsmgzfacqxp_social_images', true)
ON CONFLICT (id) DO NOTHING;

-- سياسات الأمان للصور
CREATE POLICY "الجميع يمكنهم عرض الصور"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'ogqizyholwsmgzfacqxp_social_images');

CREATE POLICY "المستخدمون المصادقون يمكنهم رفع الصور"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'ogqizyholwsmgzfacqxp_social_images');

CREATE POLICY "المستخدمون يمكنهم حذف صورهم"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'ogqizyholwsmgzfacqxp_social_images' AND auth.uid()::text = (storage.foldername(name))[1]);