import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Image as ImageIcon, User, X } from 'lucide-react';
import { createPost, uploadImage } from '@/db/api';
import { useToast } from '@/hooks/use-toast';
import { Progress } from '@/components/ui/progress';
import { EmojiPicker } from '@/components/messages/EmojiPicker';

interface CreatePostProps {
  onPostCreated?: () => void;
}

export function CreatePost({ onPostCreated }: CreatePostProps) {
  const { user, profile } = useAuth();
  const [content, setContent] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const { toast } = useToast();

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // التحقق من نوع الملف
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'خطأ',
        description: 'يرجى اختيار ملف صورة',
        variant: 'destructive',
      });
      return;
    }

    // التحقق من اسم الملف
    if (!/^[a-zA-Z0-9_.-]+$/.test(file.name)) {
      toast({
        title: 'خطأ',
        description: 'اسم الملف يجب أن يحتوي على أحرف إنجليزية وأرقام فقط',
        variant: 'destructive',
      });
      return;
    }

    setImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
  };

  const handleEmojiSelect = (emoji: string) => {
    setContent(prev => prev + emoji);
  };

  const handleSubmit = async () => {
    if (!user || !content.trim()) {
      toast({
        title: 'خطأ',
        description: 'يرجى كتابة محتوى المنشور',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    setUploadProgress(0);

    try {
      let imageUrl: string | null = null;

      if (imageFile) {
        setUploadProgress(30);
        imageUrl = await uploadImage(imageFile, user.id);
        
        if (!imageUrl) {
          toast({
            title: 'خطأ',
            description: 'فشل رفع الصورة',
            variant: 'destructive',
          });
          setIsSubmitting(false);
          return;
        }

        // إذا تم ضغط الصورة
        if (imageFile.size > 1024 * 1024) {
          toast({
            title: 'تم ضغط الصورة',
            description: 'تم ضغط الصورة تلقائياً لتقليل حجمها',
          });
        }
        
        setUploadProgress(60);
      }

      setUploadProgress(80);
      const post = await createPost(user.id, content.trim(), imageUrl);
      setUploadProgress(100);

      if (post) {
        toast({
          title: 'تم النشر',
          description: 'تم نشر المنشور بنجاح',
        });
        setContent('');
        setImageFile(null);
        setImagePreview(null);
        if (onPostCreated) onPostCreated();
      } else {
        toast({
          title: 'خطأ',
          description: 'فشل نشر المنشور',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'خطأ',
        description: 'حدث خطأ أثناء النشر',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
      setUploadProgress(0);
    }
  };

  return (
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
              placeholder="ماذا يحدث؟"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="min-h-[100px] resize-none"
              disabled={isSubmitting}
            />
            
            {imagePreview && (
              <div className="relative">
                <img
                  src={imagePreview}
                  alt="معاينة"
                  className="w-full rounded-lg object-cover max-h-64"
                />
                <Button
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 left-2"
                  onClick={handleRemoveImage}
                  disabled={isSubmitting}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}

            {isSubmitting && uploadProgress > 0 && (
              <div className="space-y-2">
                <Progress value={uploadProgress} />
                <p className="text-xs text-muted-foreground text-center">
                  جاري النشر... {uploadProgress}%
                </p>
              </div>
            )}

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageSelect}
                  className="hidden"
                  id="image-upload"
                  disabled={isSubmitting}
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => document.getElementById('image-upload')?.click()}
                  disabled={isSubmitting}
                  type="button"
                >
                  <ImageIcon className="h-5 w-5 text-primary" />
                </Button>
                <EmojiPicker onEmojiSelect={handleEmojiSelect} />
              </div>
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting || !content.trim()}
                type="button"
              >
                {isSubmitting ? 'جاري النشر...' : 'نشر'}
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
