import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageSquarePlus, User, Search } from 'lucide-react';
import { searchUsers } from '@/db/api';
import type { Profile } from '@/types/types';
import { Skeleton } from '@/components/ui/skeleton';

interface NewConversationDialogProps {
  onSelectUser: (user: Profile) => void;
}

export function NewConversationDialog({ onSelectUser }: NewConversationDialogProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Profile[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    
    if (query.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    const results = await searchUsers(query.trim());
    setSearchResults(results);
    setIsSearching(false);
  };

  const handleSelectUser = (user: Profile) => {
    onSelectUser(user);
    setOpen(false);
    setSearchQuery('');
    setSearchResults([]);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="default" size="sm" className="w-full">
          <MessageSquarePlus className="h-4 w-4 ml-2" />
          محادثة جديدة
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>بدء محادثة جديدة</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="ابحث عن مستخدم..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="pr-10"
            />
          </div>

          <ScrollArea className="h-[300px]">
            {isSearching ? (
              <div className="space-y-3 p-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Skeleton className="h-10 w-10 rounded-full bg-muted" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-full bg-muted" />
                      <Skeleton className="h-3 w-3/4 bg-muted" />
                    </div>
                  </div>
                ))}
              </div>
            ) : searchResults.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {searchQuery.trim().length < 2
                  ? 'ابحث عن مستخدم لبدء محادثة'
                  : 'لم يتم العثور على نتائج'}
              </div>
            ) : (
              <div className="space-y-1 p-2">
                {searchResults.map((user) => (
                  <button
                    key={user.id}
                    onClick={() => handleSelectUser(user)}
                    className="w-full p-3 rounded-lg text-right transition-colors hover:bg-accent flex items-center gap-3"
                  >
                    <Avatar className="h-10 w-10 shrink-0">
                      <AvatarImage
                        src={user.avatar_url || undefined}
                        alt={user.display_name || user.username}
                      />
                      <AvatarFallback>
                        <User className="h-5 w-5" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0 text-right">
                      <p className="font-semibold truncate">
                        {user.display_name || user.username}
                      </p>
                      <p className="text-sm text-muted-foreground truncate">
                        @{user.username}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}
