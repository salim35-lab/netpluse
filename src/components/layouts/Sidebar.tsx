import { Link, useLocation } from 'react-router-dom';
import { Home, Search, Compass, Bell, Mail, User, Menu } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

function SidebarContent() {
  const location = useLocation();
  const { profile } = useAuth();
  const { t } = useLanguage();

  const navItems = [
    { icon: Home, label: t('home'), path: '/' },
    { icon: Search, label: t('search'), path: '/search' },
    { icon: Compass, label: t('explore'), path: '/explore' },
    { icon: Bell, label: t('notifications'), path: '/notifications' },
    { icon: Mail, label: t('messages'), path: '/messages' },
  ];

  return (
    <div className="flex flex-col gap-2 p-4">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = location.pathname === item.path;
        
        return (
          <Button
            key={item.path}
            variant={isActive ? 'secondary' : 'ghost'}
            className={cn(
              'justify-start gap-3 text-base',
              isActive && 'bg-accent font-semibold'
            )}
            asChild
          >
            <Link to={item.path}>
              <Icon className="h-5 w-5" />
              <span>{item.label}</span>
            </Link>
          </Button>
        );
      })}

      <div className="my-2 border-t border-border" />

      <Button
        variant="ghost"
        className="justify-start gap-3 text-base"
        asChild
      >
        <Link to={`/profile/${profile?.username}`}>
          <User className="h-5 w-5" />
          <span>{t('profile')}</span>
        </Link>
      </Button>
    </div>
  );
}

export function Sidebar() {
  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden xl:block w-64 shrink-0 border-l border-border">
        <div className="sticky top-16 h-[calc(100vh-4rem)]">
          <SidebarContent />
        </div>
      </aside>

      {/* Mobile Menu */}
      <div className="xl:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background">
        <div className="flex items-center justify-around p-2">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/">
              <Home className="h-5 w-5" />
            </Link>
          </Button>
          <Button variant="ghost" size="icon" asChild>
            <Link to="/search">
              <Search className="h-5 w-5" />
            </Link>
          </Button>
          <Button variant="ghost" size="icon" asChild>
            <Link to="/explore">
              <Compass className="h-5 w-5" />
            </Link>
          </Button>
          <Button variant="ghost" size="icon" asChild>
            <Link to="/notifications">
              <Bell className="h-5 w-5" />
            </Link>
          </Button>
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-64 p-0">
              <SidebarContent />
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </>
  );
}
