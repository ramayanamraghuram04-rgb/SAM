import React, { useState, useEffect } from 'react';
import { AppHeader } from './AppHeader';
import { BottomNav } from './BottomNav';
import { Sidebar } from './Sidebar';
import { ChangePasswordModal } from '../common/ChangePasswordModal';
import { useAuth } from '../../context/AuthContext';

export function openChangePasswordDialog() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('sam:open-change-password'));
  }
}

interface AppLayoutProps {
  children: React.ReactNode;
  currentTab: string;
  onSelectTab: (tab: any) => void;
  onChangePassword?: () => void;
}

export const AppLayout: React.FC<AppLayoutProps> = ({
  children,
  currentTab,
  onSelectTab,
  onChangePassword,
}) => {
  const { user } = useAuth();
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);

  // Requirement: If initial password must be changed on first login, require the user to change it
  const mustChangePassword = Boolean(user?.mustChangePassword);

  useEffect(() => {
    const handleOpen = () => setIsChangePasswordOpen(true);
    window.addEventListener('sam:open-change-password', handleOpen);
    return () => window.removeEventListener('sam:open-change-password', handleOpen);
  }, []);

  const handleOpenPasswordModal = () => {
    setIsChangePasswordOpen(true);
    if (onChangePassword) onChangePassword();
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <AppHeader
        onNotificationClick={() => onSelectTab('notifications')}
        onProfileClick={() => onSelectTab('profile')}
        onChangePasswordClick={handleOpenPasswordModal}
      />

      <div className="flex-1 flex max-w-6xl w-full mx-auto">
        <Sidebar currentTab={currentTab} onSelectTab={onSelectTab} />

        <main className="flex-1 px-4 sm:px-8 py-6 pb-24 sm:pb-12 max-w-4xl w-full mx-auto">
          {children}
        </main>
      </div>

      <BottomNav currentTab={currentTab} onSelectTab={onSelectTab} />

      {/* Secure Password Update Modal */}
      <ChangePasswordModal
        isOpen={isChangePasswordOpen || mustChangePassword}
        onClose={() => setIsChangePasswordOpen(false)}
        isForcedFirstLogin={mustChangePassword}
      />
    </div>
  );
};
