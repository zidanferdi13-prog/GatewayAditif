import type { ReactNode } from 'react';
import { AppHeader } from './AppHeader';

interface MainLayoutProps {
  children: ReactNode;
}

/** Root layout: fixed header + scrollable main area */
export function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="flex flex-col h-screen overflow-hidden bg-bg-base text-t-primary">
      <AppHeader />
      <main className="flex-1 overflow-hidden">
        {children}
      </main>
    </div>
  );
}
