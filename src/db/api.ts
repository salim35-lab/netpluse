import { supabase } from './supabase';
import type { Profile, Post, Comment, Message, Notification, Conversation } from '@/types/types';

// دوال الملف الشخصي
export async function getProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();

  if (error) {
    console.error('خطأ في جلب الملف الشخصي:', error);
    return null;
  }
  return data;
}

export async function getProfileByUsername(username: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('username', username)
    .maybeSingle();

  if (error) {
    console.error('خطأ في جلب الملف الشخصي:', error);
    return null;
  }
  return data;
}

export async function updateProfile(userId: string, updates: Partial<Profile>): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', userId)
    .select()
    .maybeSingle();

  if (error) {
    console.error('خطأ في تحديث الملف الشخصي:', error);
    return null;
  }
  return data;
}

export async function searchProfiles(query: string, limit = 20): Promise<Profile[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .or(`username.ilike.%${query}%,display_name.ilike.%${query}%`)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('خطأ في البحث عن المستخدمين:', error);
    return [];
  }
  return Array.isArray(data) ? data : [];
}

// اسم بديل لنفس الدالة
export const searchUsers = searchProfiles;

// دوال المنشورات
export async function getPosts(limit = 20, offset = 0): Promise<Post[]> {
  const { data, error } = await supabase
    .from('posts')
    .select(`
      *,
      profile:profiles!posts_user_id_fkey(*),
      likes:likes(count),
      comments:comments(count)
    `)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error('خطأ في جلب المنشورات:', error);
    return [];
  }

  const userId = (await supabase.auth.getUser()).data.user?.id;
  
  return Array.isArray(data) ? await Promise.all(data.map(async (post) => ({
    ...post,
    likes_count: post.likes?.[0]?.count || 0,
    comments_count: post.comments?.[0]?.count || 0,
    is_liked: userId ? await checkIfLiked(post.id, userId) : false
  }))) : [];
}

export async function getPostsByUser(userId: string, limit = 20, offset = 0): Promise<Post[]> {
  const { data, error } = await supabase
    .from('posts')
    .select(`
      *,
      profile:profiles!posts_user_id_fkey(*),
      likes:likes(count),
      comments:comments(count)
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error('خطأ في جلب منشورات المستخدم:', error);
    return [];
  }

  const currentUserId = (await supabase.auth.getUser()).data.user?.id;
  
  return Array.isArray(data) ? await Promise.all(data.map(async (post) => ({
    ...post,
    likes_count: post.likes?.[0]?.count || 0,
    comments_count: post.comments?.[0]?.count || 0,
    is_liked: currentUserId ? await checkIfLiked(post.id, currentUserId) : false
  }))) : [];
}

export async function getFollowingPosts(userId: string, limit = 20, offset = 0): Promise<Post[]> {
  const { data: followingData } = await supabase
    .from('follows')
    .select('following_id')
    .eq('follower_id', userId);

  const followingIds = followingData?.map(f => f.following_id) || [];
  followingIds.push(userId);

  const { data, error } = await supabase
    .from('posts')
    .select(`
      *,
      profile:profiles!posts_user_id_fkey(*),
      likes:likes(count),
      comments:comments(count)
    `)
    .in('user_id', followingIds)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error('خطأ في جلب منشورات المتابَعين:', error);
    return [];
  }

  return Array.isArray(data) ? await Promise.all(data.map(async (post) => ({
    ...post,
    likes_count: post.likes?.[0]?.count || 0,
    comments_count: post.comments?.[0]?.count || 0,
    is_liked: await checkIfLiked(post.id, userId)
  }))) : [];
}

export async function createPost(userId: string, content: string, imageUrl: string | null = null): Promise<Post | null> {
  const { data, error } = await supabase
    .from('posts')
    .insert({ user_id: userId, content, image_url: imageUrl || null })
    .select(`
      *,
      profile:profiles!posts_user_id_fkey(*)
    `)
    .maybeSingle();

  if (error) {
    console.error('خطأ في إنشاء المنشور:', error);
    return null;
  }
  return data ? { ...data, likes_count: 0, comments_count: 0, is_liked: false } : null;
}

export async function deletePost(postId: string): Promise<boolean> {
  const { error } = await supabase
    .from('posts')
    .delete()
    .eq('id', postId);

  if (error) {
    console.error('خطأ في حذف المنشور:', error);
    return false;
  }
  return true;
}

export async function searchPosts(query: string, limit = 20): Promise<Post[]> {
  const { data, error } = await supabase
    .from('posts')
    .select(`
      *,
      profile:profiles!posts_user_id_fkey(*),
      likes:likes(count),
      comments:comments(count)
    `)
    .ilike('content', `%${query}%`)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('خطأ في البحث عن المنشورات:', error);
    return [];
  }

  const userId = (await supabase.auth.getUser()).data.user?.id;
  
  return Array.isArray(data) ? await Promise.all(data.map(async (post) => ({
    ...post,
    likes_count: post.likes?.[0]?.count || 0,
    comments_count: post.comments?.[0]?.count || 0,
    is_liked: userId ? await checkIfLiked(post.id, userId) : false
  }))) : [];
}

// دوال الإعجابات
export async function checkIfLiked(postId: string, userId: string): Promise<boolean> {
  const { data } = await supabase
    .from('likes')
    .select('id')
    .eq('post_id', postId)
    .eq('user_id', userId)
    .maybeSingle();

  return !!data;
}

export async function likePost(postId: string, userId: string): Promise<boolean> {
  const { error } = await supabase
    .from('likes')
    .insert({ post_id: postId, user_id: userId });

  if (error) {
    console.error('خطأ في الإعجاب بالمنشور:', error);
    return false;
  }
  return true;
}

export async function unlikePost(postId: string, userId: string): Promise<boolean> {
  const { error } = await supabase
    .from('likes')
    .delete()
    .eq('post_id', postId)
    .eq('user_id', userId);

  if (error) {
    console.error('خطأ في إلغاء الإعجاب:', error);
    return false;
  }
  return true;
}

// دوال التعليقات
export async function getComments(postId: string, limit = 50): Promise<Comment[]> {
  const { data, error } = await supabase
    .from('comments')
    .select(`
      *,
      profile:profiles!comments_user_id_fkey(*)
    `)
    .eq('post_id', postId)
    .order('created_at', { ascending: true })
    .limit(limit);

  if (error) {
    console.error('خطأ في جلب التعليقات:', error);
    return [];
  }
  return Array.isArray(data) ? data : [];
}

export async function createComment(postId: string, userId: string, content: string): Promise<Comment | null> {
  const { data, error } = await supabase
    .from('comments')
    .insert({ post_id: postId, user_id: userId, content })
    .select(`
      *,
      profile:profiles!comments_user_id_fkey(*)
    `)
    .maybeSingle();

  if (error) {
    console.error('خطأ في إنشاء التعليق:', error);
    return null;
  }
  return data;
}

export async function deleteComment(commentId: string): Promise<boolean> {
  const { error } = await supabase
    .from('comments')
    .delete()
    .eq('id', commentId);

  if (error) {
    console.error('خطأ في حذف التعليق:', error);
    return false;
  }
  return true;
}

// دوال المتابعة
export async function checkIfFollowing(followerId: string, followingId: string): Promise<boolean> {
  const { data } = await supabase
    .from('follows')
    .select('id')
    .eq('follower_id', followerId)
    .eq('following_id', followingId)
    .maybeSingle();

  return !!data;
}

export async function followUser(followerId: string, followingId: string): Promise<boolean> {
  const { error } = await supabase
    .from('follows')
    .insert({ follower_id: followerId, following_id: followingId });

  if (error) {
    console.error('خطأ في المتابعة:', error);
    return false;
  }
  return true;
}

export async function unfollowUser(followerId: string, followingId: string): Promise<boolean> {
  const { error } = await supabase
    .from('follows')
    .delete()
    .eq('follower_id', followerId)
    .eq('following_id', followingId);

  if (error) {
    console.error('خطأ في إلغاء المتابعة:', error);
    return false;
  }
  return true;
}

export async function getFollowers(userId: string, limit = 50): Promise<Profile[]> {
  const { data, error } = await supabase
    .from('follows')
    .select('follower:profiles!follows_follower_id_fkey(*)')
    .eq('following_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('خطأ في جلب المتابعين:', error);
    return [];
  }
  return Array.isArray(data) ? data.map((f: any) => f.follower).filter(Boolean) as Profile[] : [];
}

export async function getFollowing(userId: string, limit = 50): Promise<Profile[]> {
  const { data, error } = await supabase
    .from('follows')
    .select('following:profiles!follows_following_id_fkey(*)')
    .eq('follower_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('خطأ في جلب المتابَعين:', error);
    return [];
  }
  return Array.isArray(data) ? data.map((f: any) => f.following).filter(Boolean) as Profile[] : [];
}

export async function getFollowersCount(userId: string): Promise<number> {
  const { count, error } = await supabase
    .from('follows')
    .select('*', { count: 'exact', head: true })
    .eq('following_id', userId);

  if (error) {
    console.error('خطأ في عد المتابعين:', error);
    return 0;
  }
  return count || 0;
}

export async function getFollowingCount(userId: string): Promise<number> {
  const { count, error } = await supabase
    .from('follows')
    .select('*', { count: 'exact', head: true })
    .eq('follower_id', userId);

  if (error) {
    console.error('خطأ في عد المتابَعين:', error);
    return 0;
  }
  return count || 0;
}

export async function getPostsCount(userId: string): Promise<number> {
  const { count, error } = await supabase
    .from('posts')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId);

  if (error) {
    console.error('خطأ في عد المنشورات:', error);
    return 0;
  }
  return count || 0;
}

// دوال الرسائل
export async function getConversations(userId: string): Promise<Conversation[]> {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('خطأ في جلب المحادثات:', error);
    return [];
  }

  if (!Array.isArray(data)) return [];

  const conversationsMap = new Map<string, Message[]>();
  
  data.forEach(message => {
    const otherUserId = message.sender_id === userId ? message.receiver_id : message.sender_id;
    if (!conversationsMap.has(otherUserId)) {
      conversationsMap.set(otherUserId, []);
    }
    conversationsMap.get(otherUserId)?.push(message);
  });

  const conversations: Conversation[] = [];
  
  for (const [otherUserId, messages] of conversationsMap) {
    const profile = await getProfile(otherUserId);
    if (profile) {
      const unreadCount = messages.filter(m => m.receiver_id === userId && !m.is_read).length;
      conversations.push({
        user: profile,
        last_message: messages[0],
        unread_count: unreadCount
      });
    }
  }

  return conversations.sort((a, b) => 
    new Date(b.last_message.created_at).getTime() - new Date(a.last_message.created_at).getTime()
  );
}

export async function getMessages(userId: string, otherUserId: string, limit = 50): Promise<Message[]> {
  const { data, error } = await supabase
    .from('messages')
    .select(`
      *,
      sender:profiles!messages_sender_id_fkey(*),
      receiver:profiles!messages_receiver_id_fkey(*)
    `)
    .or(`and(sender_id.eq.${userId},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${userId})`)
    .order('created_at', { ascending: true })
    .limit(limit);

  if (error) {
    console.error('خطأ في جلب الرسائل:', error);
    return [];
  }
  return Array.isArray(data) ? data : [];
}

export async function sendMessage(senderId: string, receiverId: string, content: string): Promise<Message | null> {
  const { data, error } = await supabase
    .from('messages')
    .insert({ sender_id: senderId, receiver_id: receiverId, content })
    .select(`
      *,
      sender:profiles!messages_sender_id_fkey(*),
      receiver:profiles!messages_receiver_id_fkey(*)
    `)
    .maybeSingle();

  if (error) {
    console.error('خطأ في إرسال الرسالة:', error);
    return null;
  }
  return data;
}

export async function markMessagesAsRead(userId: string, otherUserId: string): Promise<boolean> {
  const { error } = await supabase
    .from('messages')
    .update({ is_read: true })
    .eq('sender_id', otherUserId)
    .eq('receiver_id', userId)
    .eq('is_read', false);

  if (error) {
    console.error('خطأ في تحديث حالة القراءة:', error);
    return false;
  }
  return true;
}

export async function getUnreadMessagesCount(userId: string): Promise<number> {
  const { count, error } = await supabase
    .from('messages')
    .select('*', { count: 'exact', head: true })
    .eq('receiver_id', userId)
    .eq('is_read', false);

  if (error) {
    console.error('خطأ في عد الرسائل غير المقروءة:', error);
    return 0;
  }
  return count || 0;
}

// دوال الإشعارات
export async function getNotifications(userId: string, limit = 50): Promise<Notification[]> {
  const { data, error } = await supabase
    .from('notifications')
    .select(`
      *,
      related_user:profiles!notifications_related_user_id_fkey(*)
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('خطأ في جلب الإشعارات:', error);
    return [];
  }
  return Array.isArray(data) ? data : [];
}

export async function getUnreadNotificationsCount(userId: string): Promise<number> {
  const { count, error } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('is_read', false);

  if (error) {
    console.error('خطأ في عد الإشعارات غير المقروءة:', error);
    return 0;
  }
  return count || 0;
}

export async function markNotificationAsRead(notificationId: string): Promise<boolean> {
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('id', notificationId);

  if (error) {
    console.error('خطأ في تحديث حالة الإشعار:', error);
    return false;
  }
  return true;
}

export async function markAllNotificationsAsRead(userId: string): Promise<boolean> {
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('user_id', userId)
    .eq('is_read', false);

  if (error) {
    console.error('خطأ في تحديث حالة الإشعارات:', error);
    return false;
  }
  return true;
}

export async function createNotification(
  userId: string,
  type: string,
  content: string,
  relatedUserId: string | null = null,
  relatedPostId: string | null = null
): Promise<Notification | null> {
  const { data, error } = await supabase
    .from('notifications')
    .insert({
      user_id: userId,
      type,
      content,
      related_user_id: relatedUserId || null,
      related_post_id: relatedPostId || null
    })
    .select(`
      *,
      related_user:profiles!notifications_related_user_id_fkey(*)
    `)
    .maybeSingle();

  if (error) {
    console.error('خطأ في إنشاء الإشعار:', error);
    return null;
  }
  return data;
}

// دوال رفع الصور
export async function uploadImage(file: File, userId: string): Promise<string | null> {
  try {
    // التحقق من حجم الملف وضغطه إذا لزم الأمر
    let fileToUpload = file;
    if (file.size > 1024 * 1024) {
      fileToUpload = await compressImage(file);
    }

    const fileExt = fileToUpload.name.split('.').pop();
    const fileName = `${userId}/${Date.now()}.${fileExt}`;

    const { data, error } = await supabase.storage
      .from('ogqizyholwsmgzfacqxp_social_images')
      .upload(fileName, fileToUpload);

    if (error) {
      console.error('خطأ في رفع الصورة:', error);
      return null;
    }

    const { data: urlData } = supabase.storage
      .from('ogqizyholwsmgzfacqxp_social_images')
      .getPublicUrl(data.path);

    return urlData.publicUrl;
  } catch (error) {
    console.error('خطأ في رفع الصورة:', error);
    return null;
  }
}

async function compressImage(file: File): Promise<File> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // تقليل الدقة إلى 1080p كحد أقصى
        const maxDimension = 1080;
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = (height / width) * maxDimension;
            width = maxDimension;
          } else {
            width = (width / height) * maxDimension;
            height = maxDimension;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              const compressedFile = new File([blob], file.name.replace(/\.[^/.]+$/, '.webp'), {
                type: 'image/webp',
                lastModified: Date.now()
              });
              resolve(compressedFile);
            } else {
              resolve(file);
            }
          },
          'image/webp',
          0.8
        );
      };
    };
  });
}

// دوال الاستكشاف
export async function getTrendingPosts(limit = 20): Promise<Post[]> {
  const { data, error } = await supabase
    .from('posts')
    .select(`
      *,
      profile:profiles!posts_user_id_fkey(*),
      likes:likes(count),
      comments:comments(count)
    `)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('خطأ في جلب المنشورات الشائعة:', error);
    return [];
  }

  const userId = (await supabase.auth.getUser()).data.user?.id;
  
  const postsWithCounts = Array.isArray(data) ? await Promise.all(data.map(async (post) => ({
    ...post,
    likes_count: post.likes?.[0]?.count || 0,
    comments_count: post.comments?.[0]?.count || 0,
    is_liked: userId ? await checkIfLiked(post.id, userId) : false,
    engagement: (post.likes?.[0]?.count || 0) + (post.comments?.[0]?.count || 0)
  }))) : [];

  return postsWithCounts.sort((a, b) => b.engagement - a.engagement);
}

export async function getSuggestedUsers(userId: string, limit = 10): Promise<Profile[]> {
  const { data: followingData } = await supabase
    .from('follows')
    .select('following_id')
    .eq('follower_id', userId);

  const followingIds = followingData?.map(f => f.following_id) || [];
  followingIds.push(userId);

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .not('id', 'in', `(${followingIds.join(',')})`)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('خطأ في جلب المستخدمين المقترحين:', error);
    return [];
  }
  return Array.isArray(data) ? data : [];
}
