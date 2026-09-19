import React from 'react';
import { AppHeader } from './AppHeader';
import { BottomNav } from './BottomNav';
import { Sidebar } from './Sidebar';

interface AppLayoutProps {
  children: React.ReactNode;
  currentTab: string;
  onSelectTab: (tab: any) => void;
}

export const AppLayout: React.FC<AppLayoutProps> = ({
  children,
  currentTab,
  onSelectTab,
}) => {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <AppHeader
        onNotificationClick={() => onSelectTab('notifications')}
        onProfileClick={() => onSelectTab('profile')}
      />

      <div className="flex-1 flex max-w-6xl w-full mx-auto">
        <Sidebar currentTab={currentTab} onSelectTab={onSelectTab} />

        <main className="flex-1 px-4 sm:px-8 py-6 pb-24 sm:pb-12 max-w-4xl w-full mx-auto">
          {children}
        </main>
      </div>

      <BottomNav currentTab={currentTab} onSelectTab={onSelectTab} />
    </div>
  );
};
