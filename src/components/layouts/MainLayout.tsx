import { ReactNode } from 'react';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { RightSidebar } from './RightSidebar';

interface MainLayoutProps {
  children: ReactNode;
  showRightSidebar?: boolean;
}

export function MainLayout({ children, showRightSidebar = true }: MainLayoutProps) {
  return (
    <div className="flex min-h-screen w-full flex-col">
      <Header />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 pb-16 xl:pb-0">
          {children}
        </main>
        {showRightSidebar && <RightSidebar />}
      </div>
    </div>
  );
}
