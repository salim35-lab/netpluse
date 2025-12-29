# تحديث نظام المصادقة - البريد الإلكتروني

## نظرة عامة

تم تحديث نظام المصادقة في منصة سوشيال كونكت من نظام اسم المستخدم (username) إلى نظام البريد الإلكتروني (email) مع تفعيل التحقق من البريد الإلكتروني.

## التغييرات الرئيسية

### 1. قاعدة البيانات

#### إضافة عمود البريد الإلكتروني
- تم إضافة عمود `email` إلى جدول `profiles`
- العمود من نوع TEXT مع قيد UNIQUE
- يتم مزامنة البريد الإلكتروني تلقائياً من `auth.users` عند التسجيل

#### تحديث دالة المزامنة
```sql
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
```

**ملاحظة**: يتم استخراج اسم المستخدم تلقائياً من الجزء الأول من البريد الإلكتروني (قبل @).

### 2. التحقق من البريد الإلكتروني

- تم تفعيل التحقق من البريد الإلكتروني باستخدام `supabase_verification`
- عند التسجيل، يتم إرسال رابط تفعيل إلى البريد الإلكتروني
- يجب على المستخدم النقر على الرابط لتفعيل حسابه
- بعد التفعيل، يتم إنشاء ملف تعريف تلقائياً في جدول `profiles`

### 3. AuthContext

#### التغييرات في الواجهة
```typescript
interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}
```

#### دالة تسجيل الدخول
```typescript
const signIn = async (email: string, password: string) => {
  try {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
    return { error: null };
  } catch (error) {
    return { error: error as Error };
  }
};
```

#### دالة التسجيل
```typescript
const signUp = async (email: string, password: string) => {
  try {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin,
      },
    });

    if (error) throw error;
    return { error: null };
  } catch (error) {
    return { error: error as Error };
  }
};
```

### 4. صفحة تسجيل الدخول (LoginPage)

#### التغييرات في الحقول
- تم استبدال حقل "اسم المستخدم" بحقل "البريد الإلكتروني"
- تم تحديث التحقق من الصحة لاستخدام regex للبريد الإلكتروني
- تم تحديث رسائل الخطأ والنجاح

#### التحقق من البريد الإلكتروني
```typescript
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
if (!emailRegex.test(email)) {
  toast({
    title: 'خطأ',
    description: 'يرجى إدخال بريد إلكتروني صحيح',
    variant: 'destructive',
  });
  return;
}
```

#### رسالة التسجيل الجديدة
عند التسجيل بنجاح، يتم عرض رسالة:
```
"تم إرسال رابط التفعيل"
"يرجى التحقق من بريدك الإلكتروني لتفعيل حسابك"
```

### 5. أنواع TypeScript

تم تحديث واجهة `Profile` لتشمل البريد الإلكتروني:
```typescript
export interface Profile {
  id: string;
  username: string;
  email: string | null;
  display_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  cover_url: string | null;
  role: UserRole;
  created_at: string;
  updated_at: string;
}
```

## سير عمل التسجيل الجديد

1. **المستخدم يدخل البريد الإلكتروني وكلمة المرور**
2. **النظام يرسل طلب التسجيل إلى Supabase Auth**
3. **Supabase يرسل رابط تفعيل إلى البريد الإلكتروني**
4. **المستخدم يفتح بريده الإلكتروني وينقر على رابط التفعيل**
5. **عند التفعيل، يتم تشغيل trigger `on_auth_user_confirmed`**
6. **يتم إنشاء ملف تعريف في جدول `profiles` مع:**
   - البريد الإلكتروني من `auth.users`
   - اسم المستخدم المستخرج من البريد الإلكتروني
   - الدور (admin للمستخدم الأول، user للباقي)
7. **المستخدم يتم توجيهه إلى الصفحة الرئيسية**

## المزايا

### 1. أمان أفضل
- التحقق من البريد الإلكتروني يضمن أن المستخدم يملك البريد الفعلي
- يمنع إنشاء حسابات وهمية
- يسهل استرجاع الحساب في حالة نسيان كلمة المرور

### 2. تجربة مستخدم محسنة
- البريد الإلكتروني أسهل في التذكر من اسم المستخدم
- معيار شائع في معظم المنصات
- يسمح بإعادة تعيين كلمة المرور بسهولة

### 3. توافق مع معايير الويب
- يتبع أفضل الممارسات في المصادقة
- متوافق مع نظام Supabase Auth الكامل
- يدعم ميزات إضافية مثل OAuth في المستقبل

## ملاحظات مهمة

### للمستخدمين الحاليين
- إذا كان لديك حسابات قديمة بنظام اسم المستخدم، ستحتاج إلى إنشاء حساب جديد
- لا يمكن ترحيل الحسابات القديمة تلقائياً

### للمطورين
- تأكد من تفعيل SMTP في Supabase لإرسال رسائل التفعيل
- يمكن تخصيص قالب البريد الإلكتروني من لوحة تحكم Supabase
- رابط التفعيل صالح لمدة محددة (افتراضياً 24 ساعة)

### اسم المستخدم التلقائي
- يتم استخراج اسم المستخدم من الجزء الأول من البريد الإلكتروني
- مثال: `user@example.com` → اسم المستخدم: `user`
- يمكن للمستخدم تغيير اسم المستخدم لاحقاً من إعدادات الملف الشخصي

## الاختبار

تم اختبار النظام الجديد بنجاح:
- ✅ التسجيل بالبريد الإلكتروني
- ✅ إرسال رابط التفعيل
- ✅ تفعيل الحساب
- ✅ تسجيل الدخول بالبريد الإلكتروني
- ✅ مزامنة البيانات مع جدول profiles
- ✅ اختبار Lint بدون أخطاء

## الميزات المستقبلية المقترحة

- [ ] إعادة تعيين كلمة المرور عبر البريد الإلكتروني
- [ ] تغيير البريد الإلكتروني مع إعادة التحقق
- [ ] تسجيل الدخول عبر OAuth (Google, Facebook, etc.)
- [ ] المصادقة الثنائية (2FA)
- [ ] إشعارات البريد الإلكتروني للأحداث المهمة

---

**تاريخ التحديث**: 28 ديسمبر 2025
**الإصدار**: 2.0.0
