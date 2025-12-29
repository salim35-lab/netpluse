import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { getComments, createComment, deleteComment } from '@/db/api';
import type { Comment } from '@/types/types';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { User, Trash2 } from 'lucide-react';
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
import { EmojiPicker } from '@/components/messages/EmojiPicker';

interface CommentSectionProps {
  postId: string;
  onCommentAdded?: () => void;
}

export function CommentSection({ postId, onCommentAdded }: CommentSectionProps) {
  const { user, profile } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadComments();
  }, [postId]);

  const loadComments = async () => {
    setIsLoading(true);
    const data = await getComments(postId);
    setComments(data);
    setIsLoading(false);
  };

  const handleSubmit = async () => {
    if (!user || !newComment.trim()) {
      toast({
        title: 'خطأ',
        description: 'يرجى كتابة تعليق',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    const comment = await createComment(postId, user.id, newComment.trim());
    setIsSubmitting(false);

    if (comment) {
      setComments(prev => [...prev, comment]);
      setNewComment('');
      toast({
        title: 'تم النشر',
        description: 'تم إضافة التعليق بنجاح',
      });
      if (onCommentAdded) onCommentAdded();
    } else {
      toast({
        title: 'خطأ',
        description: 'فشل إضافة التعليق',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (commentId: string) => {
    const success = await deleteComment(commentId);
    if (success) {
      setComments(prev => prev.filter(c => c.id !== commentId));
      toast({
        title: 'تم الحذف',
        description: 'تم حذف التعليق بنجاح',
      });
      if (onCommentAdded) onCommentAdded();
    } else {
      toast({
        title: 'خطأ',
        description: 'فشل حذف التعليق',
        variant: 'destructive',
      });
    }
  };

  const handleEmojiSelect = (emoji: string) => {
    setNewComment(prev => prev + emoji);
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

  return (
    <div className="space-y-4">
      {/* نموذج إضافة تعليق */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-3">
            <Avatar className="h-10 w-10 shrink-0">
              <AvatarImage src={profile?.avatar_url || undefined} alt={profile?.display_name || profile?.username} />
              <AvatarFallback>
                <User className="h-5 w-5" />
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-3">
              <Textarea
                placeholder="اكتب تعليقاً..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="min-h-[80px] resize-none"
                disabled={isSubmitting}
              />
              <div className="flex justify-between items-center">
                <EmojiPicker onEmojiSelect={handleEmojiSelect} />
                <Button
                  onClick={handleSubmit}
                  disabled={isSubmitting || !newComment.trim()}
                  size="sm"
                  type="button"
                >
                  {isSubmitting ? 'جاري النشر...' : 'نشر التعليق'}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* قائمة التعليقات */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold">
          التعليقات ({comments.length})
        </h3>
        
        {isLoading ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">جاري التحميل...</p>
          </div>
        ) : comments.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">لا توجد تعليقات بعد. كن أول من يعلق!</p>
          </div>
        ) : (
          comments.map((comment) => {
            const canDelete = user && (user.id === comment.user_id || profile?.role === 'admin');
            
            return (
              <Card key={comment.id}>
                <CardContent className="pt-6">
                  <div className="flex gap-3">
                    <Link
                      to={`/profile/${comment.profile?.username}`}
                      className="shrink-0"
                    >
                      <Avatar className="h-10 w-10">
                        <AvatarImage
                          src={comment.profile?.avatar_url || undefined}
                          alt={comment.profile?.display_name || comment.profile?.username}
                        />
                        <AvatarFallback>
                          <User className="h-5 w-5" />
                        </AvatarFallback>
                      </Avatar>
                    </Link>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <Link
                            to={`/profile/${comment.profile?.username}`}
                            className="font-semibold hover:underline"
                          >
                            {comment.profile?.display_name || comment.profile?.username}
                          </Link>
                          <span className="text-sm text-muted-foreground mx-2">
                            @{comment.profile?.username}
                          </span>
                          <span className="text-sm text-muted-foreground">
                            · {formatDate(comment.created_at)}
                          </span>
                        </div>
                        {canDelete && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon" className="shrink-0 h-8 w-8">
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>حذف التعليق</AlertDialogTitle>
                                <AlertDialogDescription>
                                  هل أنت متأكد من حذف هذا التعليق؟ لا يمكن التراجع عن هذا الإجراء.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>إلغاء</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDelete(comment.id)}>
                                  حذف
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                      </div>
                      <p className="text-sm mt-2 whitespace-pre-wrap break-words">
                        {comment.content}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
