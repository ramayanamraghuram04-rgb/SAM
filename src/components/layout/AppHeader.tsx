import React from 'react';
import { Bell, LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { SamLogo } from '../brand/SamLogo';
import { DEPARTMENT } from '../../config/constants';

interface AppHeaderProps {
  onNotificationClick?: () => void;
  onProfileClick?: () => void;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  onNotificationClick,
  onProfileClick,
}) => {
  const { user, role, adminUser, staffUser, studentUser, logout } = useAuth();
  const { unreadCount } = useNotifications();

  const getPortalTitle = () => {
    if (role === 'admin') return 'Admin Portal';
    if (role === 'staff' || role === 'teacher') return 'Staff Portal';
    return 'Student Portal';
  };

  const getSubIdentity = () => {
    if (role === 'admin') return adminUser?.mobile || 'Administrator';
    if (role === 'staff' || role === 'teacher') return staffUser?.mobile || 'Faculty';
    return studentUser?.pin || 'Student';
  };

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200/80 safe-top">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Left: App Brand & Department */}
        <div className="flex items-center gap-3">
          <div className="shrink-0">
            <SamLogo
              size="md"
              className="shadow-sm shadow-blue-500/20"
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base font-extrabold tracking-tight text-slate-900">
                SAM
              </span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 border border-blue-200 tracking-wider uppercase">
                {DEPARTMENT}
              </span>
            </div>
            <p className="text-[11px] font-medium text-slate-500 line-clamp-1">
              {getPortalTitle()}
            </p>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Notifications button (for Staff & Students) */}
          {role !== 'admin' && (
            <button
              onClick={onNotificationClick}
              className="relative p-2 rounded-xl text-slate-600 hover:text-blue-600 hover:bg-blue-50 transition-colors"
              title="Notifications"
              aria-label="View notifications"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-white bg-rose-500 rounded-full ring-2 ring-white">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
          )}

          {/* User badge / Profile quick view */}
          <button
            onClick={onProfileClick}
            className="flex items-center gap-2 p-1.5 sm:px-3 sm:py-1.5 rounded-xl hover:bg-slate-100 transition-colors text-left"
          >
            <div className="w-8 h-8 rounded-full bg-blue-100 border border-blue-300/60 flex items-center justify-center text-xs font-bold text-blue-700">
              {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="hidden sm:block">
              <div className="text-xs font-bold text-slate-800 line-clamp-1">{user?.name}</div>
              <div className="text-[10px] font-medium text-slate-500">
                {getSubIdentity()}
              </div>
            </div>
          </button>

          {/* Logout Button */}
          <button
            onClick={logout}
            className="p-2 rounded-xl text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors"
            title="Sign out securely"
            aria-label="Sign out"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  );
};
