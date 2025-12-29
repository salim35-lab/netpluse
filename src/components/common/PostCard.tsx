import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, MessageCircle, Trash2, User } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import type { Post } from '@/types/types';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { likePost, unlikePost, deletePost } from '@/db/api';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface PostCardProps {
  post: Post;
  onDelete?: () => void;
  onUpdate?: () => void;
}

export function PostCard({ post, onDelete, onUpdate }: PostCardProps) {
  const { user, profile } = useAuth();
  const [isLiked, setIsLiked] = useState(post.is_liked || false);
  const [likesCount, setLikesCount] = useState(post.likes_count || 0);
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();

  const handleLike = async () => {
    if (!user) return;

    const newIsLiked = !isLiked;
    setIsLiked(newIsLiked);
    setLikesCount(prev => newIsLiked ? prev + 1 : prev - 1);

    const success = newIsLiked 
      ? await likePost(post.id, user.id)
      : await unlikePost(post.id, user.id);

    if (!success) {
      setIsLiked(!newIsLiked);
      setLikesCount(prev => newIsLiked ? prev - 1 : prev + 1);
      toast({
        title: 'خطأ',
        description: 'فشلت العملية',
        variant: 'destructive',
      });
    }

    if (onUpdate) onUpdate();
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    const success = await deletePost(post.id);
    setIsDeleting(false);

    if (success) {
      toast({
        title: 'تم الحذف',
        description: 'تم حذف المنشور بنجاح',
      });
      if (onDelete) onDelete();
    } else {
      toast({
        title: 'خطأ',
        description: 'فشل حذف المنشور',
        variant: 'destructive',
      });
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'الآن';
    if (diffInSeconds < 3600) return `منذ ${Math.floor(diffInSeconds / 60)} دقيقة`;
    if (diffInSeconds < 86400) return `منذ ${Math.floor(diffInSeconds / 3600)} ساعة`;
    if (diffInSeconds < 604800) return `منذ ${Math.floor(diffInSeconds / 86400)} يوم`;
    
    return date.toLocaleDateString('ar-SA', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const canDelete = user && (user.id === post.user_id || profile?.role === 'admin');

  return (
    <Card className="overflow-hidden shadow-card hover:shadow-hover transition-shadow">
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-3">
        <Link
          to={`/profile/${post.profile?.username}`}
          className="flex items-center gap-3 flex-1 min-w-0"
        >
          <Avatar className="h-10 w-10 shrink-0">
            <AvatarImage src={post.profile?.avatar_url || undefined} alt={post.profile?.display_name || post.profile?.username} />
            <AvatarFallback>
              <User className="h-5 w-5" />
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col min-w-0">
            <span className="text-sm font-semibold truncate">
              {post.profile?.display_name || post.profile?.username}
            </span>
            <span className="text-xs text-muted-foreground truncate">
              @{post.profile?.username} · {formatDate(post.created_at)}
            </span>
          </div>
        </Link>
        {canDelete && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="icon" className="shrink-0">
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>حذف المنشور</AlertDialogTitle>
                <AlertDialogDescription>
                  هل أنت متأكد من حذف هذا المنشور؟ لا يمكن التراجع عن هذا الإجراء.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>إلغاء</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} disabled={isDeleting}>
                  {isDeleting ? 'جاري الحذف...' : 'حذف'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </CardHeader>

      <CardContent className="space-y-3 pb-3">
        <p className="text-sm whitespace-pre-wrap break-words">{post.content}</p>
        {post.image_url && (
          <img
            src={post.image_url}
            alt="صورة المنشور"
            className="w-full rounded-lg object-cover max-h-96"
            loading="lazy"
          />
        )}
      </CardContent>

      <CardFooter className="flex items-center gap-4 pt-3 border-t border-border">
        <Button
          variant="ghost"
          size="sm"
          className="gap-2"
          onClick={handleLike}
        >
          <Heart className={`h-4 w-4 ${isLiked ? 'fill-destructive text-destructive' : ''}`} />
          <span className="text-sm">{likesCount}</span>
        </Button>
        <Button variant="ghost" size="sm" className="gap-2" asChild>
          <Link to={`/post/${post.id}`}>
            <MessageCircle className="h-4 w-4" />
            <span className="text-sm">{post.comments_count || 0}</span>
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
