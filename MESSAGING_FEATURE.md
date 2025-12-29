# ميزة الرسائل - دليل شامل

## نظرة عامة

تم إكمال ميزة الرسائل بالكامل في منصة سوشيال كونكت. الآن يمكن للمستخدمين إرسال واستقبال رسائل خاصة، بدء محادثات جديدة، وتتبع الرسائل غير المقروءة.

## الميزات المتوفرة

### 1. قائمة المحادثات
- ✅ عرض جميع المحادثات النشطة
- ✅ عرض آخر رسالة في كل محادثة
- ✅ عرض وقت آخر رسالة
- ✅ عرض عدد الرسائل غير المقروءة لكل محادثة
- ✅ ترتيب المحادثات حسب آخر نشاط

### 2. عرض الرسائل
- ✅ عرض جميع الرسائل في المحادثة المحددة
- ✅ تمييز رسائل المستخدم الحالي عن رسائل الآخرين
- ✅ عرض صورة المرسل مع كل رسالة
- ✅ عرض وقت إرسال كل رسالة
- ✅ التمرير التلقائي إلى أحدث رسالة

### 3. إرسال الرسائل
- ✅ إرسال رسائل نصية
- ✅ إرسال بالضغط على Enter
- ✅ دعم الأسطر المتعددة (Shift + Enter)
- ✅ تعطيل زر الإرسال عند الرسالة فارغة
- ✅ مسح حقل الإدخال بعد الإرسال

### 4. بدء محادثة جديدة
- ✅ زر لبدء محادثة جديدة
- ✅ البحث عن مستخدمين
- ✅ اختيار مستخدم لبدء المحادثة
- ✅ واجهة حوار سهلة الاستخدام

### 5. التحديث التلقائي
- ✅ تحديث الرسائل كل 3 ثوانٍ
- ✅ تحديث قائمة المحادثات عند إرسال رسالة
- ✅ وضع علامة مقروء تلقائياً عند فتح المحادثة

### 6. إدارة حالة القراءة
- ✅ تتبع الرسائل المقروءة وغير المقروءة
- ✅ وضع علامة مقروء تلقائياً عند عرض المحادثة
- ✅ عرض عدد الرسائل غير المقروءة

## البنية التقنية

### المكونات

#### 1. MessagesPage
**الموقع**: `src/pages/MessagesPage.tsx`

المكون الرئيسي لصفحة الرسائل، يحتوي على:
- قائمة المحادثات على اليسار
- منطقة عرض الرسائل في الوسط
- حقل إدخال الرسالة في الأسفل

**الميزات الرئيسية**:
```typescript
// تحديث تلقائي كل 3 ثوانٍ
useEffect(() => {
  if (selectedConversation && user) {
    loadMessages(selectedConversation.id);
    markMessagesAsRead(user.id, selectedConversation.id);
    
    const interval = setInterval(() => {
      loadMessages(selectedConversation.id);
    }, 3000);
    
    return () => clearInterval(interval);
  }
}, [selectedConversation, user]);

// التمرير التلقائي إلى الأسفل
useEffect(() => {
  scrollToBottom();
}, [messages]);
```

#### 2. NewConversationDialog
**الموقع**: `src/components/messages/NewConversationDialog.tsx`

مكون حوار لبدء محادثة جديدة، يحتوي على:
- حقل بحث عن المستخدمين
- قائمة نتائج البحث
- إمكانية اختيار مستخدم

**الميزات الرئيسية**:
```typescript
// البحث عن المستخدمين
const handleSearch = async (query: string) => {
  if (query.trim().length < 2) {
    setSearchResults([]);
    return;
  }
  
  setIsSearching(true);
  const results = await searchUsers(query.trim());
  setSearchResults(results);
  setIsSearching(false);
};
```

### دوال API

#### 1. getConversations
**الوظيفة**: جلب جميع المحادثات للمستخدم

```typescript
export async function getConversations(userId: string): Promise<Conversation[]>
```

**الآلية**:
1. جلب جميع الرسائل التي يكون المستخدم مرسلاً أو مستقبلاً فيها
2. تجميع الرسائل حسب المستخدم الآخر
3. جلب معلومات الملف الشخصي لكل مستخدم
4. حساب عدد الرسائل غير المقروءة
5. ترتيب المحادثات حسب آخر رسالة

#### 2. getMessages
**الوظيفة**: جلب جميع الرسائل بين مستخدمين

```typescript
export async function getMessages(
  userId: string, 
  otherUserId: string, 
  limit = 50
): Promise<Message[]>
```

**الآلية**:
- جلب الرسائل المرسلة من userId إلى otherUserId
- جلب الرسائل المرسلة من otherUserId إلى userId
- ترتيب الرسائل حسب وقت الإرسال (تصاعدي)

#### 3. sendMessage
**الوظيفة**: إرسال رسالة جديدة

```typescript
export async function sendMessage(
  senderId: string, 
  receiverId: string, 
  content: string
): Promise<Message | null>
```

**الآلية**:
- إدراج رسالة جديدة في جدول messages
- إرجاع الرسالة مع معلومات المرسل والمستقبل

#### 4. markMessagesAsRead
**الوظيفة**: وضع علامة مقروء على الرسائل

```typescript
export async function markMessagesAsRead(
  userId: string, 
  otherUserId: string
): Promise<boolean>
```

**الآلية**:
- تحديث جميع الرسائل غير المقروءة من otherUserId إلى userId
- وضع is_read = true

#### 5. getUnreadMessagesCount
**الوظيفة**: حساب عدد الرسائل غير المقروءة

```typescript
export async function getUnreadMessagesCount(userId: string): Promise<number>
```

**الآلية**:
- عد جميع الرسائل حيث receiver_id = userId و is_read = false

#### 6. searchUsers
**الوظيفة**: البحث عن مستخدمين

```typescript
export const searchUsers = searchProfiles;
```

**الآلية**:
- البحث في username و display_name
- استخدام ILIKE للبحث غير الحساس لحالة الأحرف

## قاعدة البيانات

### جدول messages

```sql
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### الفهارس

```sql
-- فهرس للبحث السريع عن رسائل مستخدم معين
CREATE INDEX idx_messages_receiver ON messages(receiver_id);
CREATE INDEX idx_messages_sender ON messages(sender_id);

-- فهرس للبحث عن الرسائل غير المقروءة
CREATE INDEX idx_messages_unread ON messages(receiver_id, is_read);
```

### السياسات الأمنية (RLS)

```sql
-- المستخدمون يمكنهم عرض رسائلهم
CREATE POLICY "Users can view their messages" ON messages
  FOR SELECT TO authenticated
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

-- المستخدمون يمكنهم إرسال رسائل
CREATE POLICY "Users can send messages" ON messages
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = sender_id);

-- المستخدمون يمكنهم تحديث حالة قراءة رسائلهم
CREATE POLICY "Users can update their received messages" ON messages
  FOR UPDATE TO authenticated
  USING (auth.uid() = receiver_id);
```

## تجربة المستخدم

### سير العمل الأساسي

#### 1. عرض المحادثات
```
المستخدم يفتح صفحة الرسائل
  ↓
يتم جلب جميع المحادثات
  ↓
عرض قائمة المحادثات مع آخر رسالة وعدد الرسائل غير المقروءة
```

#### 2. فتح محادثة
```
المستخدم ينقر على محادثة
  ↓
يتم جلب جميع الرسائل
  ↓
وضع علامة مقروء على الرسائل غير المقروءة
  ↓
عرض الرسائل مع التمرير إلى الأسفل
  ↓
بدء التحديث التلقائي كل 3 ثوانٍ
```

#### 3. إرسال رسالة
```
المستخدم يكتب رسالة
  ↓
المستخدم يضغط Enter أو زر الإرسال
  ↓
إرسال الرسالة إلى الخادم
  ↓
إضافة الرسالة إلى القائمة
  ↓
التمرير إلى الأسفل
  ↓
تحديث قائمة المحادثات
```

#### 4. بدء محادثة جديدة
```
المستخدم ينقر على "محادثة جديدة"
  ↓
فتح حوار البحث
  ↓
المستخدم يبحث عن مستخدم
  ↓
المستخدم يختار مستخدماً
  ↓
فتح محادثة مع المستخدم المحدد
  ↓
يمكن إرسال الرسالة الأولى
```

## الأداء والتحسينات

### 1. التحديث التلقائي
- **المدة**: 3 ثوانٍ
- **السبب**: توازن بين التحديث الفوري واستهلاك الموارد
- **التحسين**: يتم التحديث فقط للمحادثة المفتوحة حالياً

### 2. التمرير التلقائي
- **الآلية**: استخدام useRef و scrollIntoView
- **السلوك**: smooth scroll للحصول على تجربة أفضل
- **التوقيت**: عند تحميل رسائل جديدة أو إرسال رسالة

### 3. البحث عن المستخدمين
- **الحد الأدنى**: حرفان للبدء في البحث
- **السبب**: تقليل عدد الاستعلامات غير الضرورية
- **التحسين**: إلغاء النتائج عند حذف النص

### 4. إدارة الحالة
- **useState**: لإدارة الحالة المحلية
- **useEffect**: للتحديث التلقائي والتمرير
- **useRef**: للإشارة إلى نهاية قائمة الرسائل

## الميزات المستقبلية المقترحة

### قصيرة المدى
- [ ] إشعارات الرسائل الجديدة في الوقت الفعلي
- [ ] صوت تنبيه عند استلام رسالة جديدة
- [ ] مؤشر "يكتب الآن..." عند كتابة الطرف الآخر
- [ ] إرسال الصور في الرسائل
- [ ] إرسال الإيموجي

### متوسطة المدى
- [ ] حذف الرسائل
- [ ] تعديل الرسائل المرسلة
- [ ] البحث في الرسائل
- [ ] أرشفة المحادثات
- [ ] كتم إشعارات محادثة معينة

### طويلة المدى
- [ ] المحادثات الجماعية
- [ ] مكالمات الصوت والفيديو
- [ ] مشاركة الموقع
- [ ] الرسائل الصوتية
- [ ] التشفير من طرف إلى طرف

## الاختبار

### اختبارات يدوية تم إجراؤها
- ✅ إرسال رسالة جديدة
- ✅ استقبال رسالة
- ✅ بدء محادثة جديدة
- ✅ البحث عن مستخدمين
- ✅ وضع علامة مقروء
- ✅ التحديث التلقائي
- ✅ التمرير التلقائي
- ✅ عرض الرسائل غير المقروءة

### سيناريوهات الاختبار

#### 1. إرسال رسالة
```
1. فتح محادثة
2. كتابة رسالة
3. الضغط على Enter
4. التحقق من ظهور الرسالة
5. التحقق من التمرير إلى الأسفل
```

#### 2. استقبال رسالة
```
1. فتح محادثة
2. انتظار 3 ثوانٍ (التحديث التلقائي)
3. التحقق من ظهور الرسائل الجديدة
4. التحقق من التمرير إلى الأسفل
```

#### 3. بدء محادثة جديدة
```
1. النقر على "محادثة جديدة"
2. البحث عن مستخدم
3. اختيار مستخدم
4. التحقق من فتح المحادثة
5. إرسال رسالة
6. التحقق من إضافة المحادثة إلى القائمة
```

## الأمان

### 1. السياسات الأمنية (RLS)
- المستخدمون يمكنهم فقط عرض رسائلهم الخاصة
- المستخدمون يمكنهم فقط إرسال رسائل من حساباتهم
- المستخدمون يمكنهم فقط تحديث حالة قراءة رسائلهم

### 2. التحقق من الصحة
- التحقق من أن المرسل هو المستخدم الحالي
- التحقق من أن الرسالة ليست فارغة
- التحقق من وجود المستقبل

### 3. الحماية من الهجمات
- حماية من SQL Injection (Supabase يستخدم Prepared Statements)
- حماية من XSS (React يقوم بـ escaping تلقائياً)
- حماية من CSRF (Supabase يستخدم JWT tokens)

## الدعم والصيانة

### المشاكل الشائعة وحلولها

#### 1. الرسائل لا تظهر
**الأسباب المحتملة**:
- مشكلة في الاتصال بالإنترنت
- خطأ في السياسات الأمنية
- المستخدم ليس لديه ملف تعريف

**الحل**:
```typescript
// التحقق من وجود ملف تعريف
const profile = await getProfile(userId);
if (!profile) {
  // إنشاء ملف تعريف
  await sync_missing_profiles();
}
```

#### 2. التحديث التلقائي لا يعمل
**الأسباب المحتملة**:
- المحادثة غير محددة
- المستخدم غير مسجل دخول
- خطأ في useEffect

**الحل**:
```typescript
// التحقق من الشروط
useEffect(() => {
  if (!selectedConversation || !user) return;
  
  // باقي الكود...
}, [selectedConversation, user]);
```

#### 3. الرسائل غير المقروءة لا تتحدث
**الأسباب المحتملة**:
- markMessagesAsRead لا يتم استدعاؤه
- خطأ في السياسات الأمنية

**الحل**:
```typescript
// التأكد من استدعاء markMessagesAsRead
useEffect(() => {
  if (selectedConversation && user) {
    loadMessages(selectedConversation.id);
    markMessagesAsRead(user.id, selectedConversation.id);
  }
}, [selectedConversation, user]);
```

## الخلاصة

تم إكمال ميزة الرسائل بنجاح مع جميع الوظائف الأساسية:
- ✅ إرسال واستقبال الرسائل
- ✅ قائمة المحادثات
- ✅ بدء محادثات جديدة
- ✅ التحديث التلقائي
- ✅ إدارة حالة القراءة
- ✅ واجهة مستخدم سهلة وجميلة

الميزة جاهزة للاستخدام وتوفر تجربة مراسلة كاملة للمستخدمين.

---

**تاريخ الإكمال**: 28 ديسمبر 2025
**الإصدار**: 2.3.0
