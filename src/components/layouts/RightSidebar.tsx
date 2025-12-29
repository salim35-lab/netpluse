import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { getSuggestedUsers, followUser } from '@/db/api';
import type { Profile } from '@/types/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { User } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function RightSidebar() {
  const { user } = useAuth();
  const [suggestedUsers, setSuggestedUsers] = useState<Profile[]>([]);
  const [followingIds, setFollowingIds] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      loadSuggestedUsers();
    }
  }, [user]);

  const loadSuggestedUsers = async () => {
    if (!user) return;
    const users = await getSuggestedUsers(user.id, 5);
    setSuggestedUsers(users);
  };

  const handleFollow = async (userId: string) => {
    if (!user) return;

    const success = await followUser(user.id, userId);
    if (success) {
      setFollowingIds(prev => new Set(prev).add(userId));
      toast({
        title: 'تمت المتابعة',
        description: 'تمت متابعة المستخدم بنجاح',
      });
    } else {
      toast({
        title: 'خطأ',
        description: 'فشلت عملية المتابعة',
        variant: 'destructive',
      });
    }
  };

  return (
    <aside className="hidden xl:block w-80 shrink-0 border-r border-border">
      <div className="sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto p-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">اقتراحات للمتابعة</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {suggestedUsers.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                لا توجد اقتراحات حالياً
              </p>
            ) : (
              suggestedUsers.map((suggestedUser) => (
                <div key={suggestedUser.id} className="flex items-center justify-between gap-3">
                  <Link
                    to={`/profile/${suggestedUser.username}`}
                    className="flex items-center gap-3 flex-1 min-w-0"
                  >
                    <Avatar className="h-10 w-10 shrink-0">
                      <AvatarImage src={suggestedUser.avatar_url || undefined} alt={suggestedUser.display_name || suggestedUser.username} />
                      <AvatarFallback>
                        <User className="h-5 w-5" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col min-w-0">
                      <span className="text-sm font-medium truncate">
                        {suggestedUser.display_name || suggestedUser.username}
                      </span>
                      <span className="text-xs text-muted-foreground truncate">
                        @{suggestedUser.username}
                      </span>
                    </div>
                  </Link>
                  <Button
                    size="sm"
                    variant={followingIds.has(suggestedUser.id) ? 'secondary' : 'default'}
                    onClick={() => handleFollow(suggestedUser.id)}
                    disabled={followingIds.has(suggestedUser.id)}
                  >
                    {followingIds.has(suggestedUser.id) ? 'تمت المتابعة' : 'متابعة'}
                  </Button>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </aside>
  );
}
