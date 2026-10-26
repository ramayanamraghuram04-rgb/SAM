import React, { useState, useRef, useEffect } from 'react';
import { Bell, LogOut, ChevronDown, User as UserIcon, KeyRound, Shield } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { SamLogo } from '../brand/SamLogo';
import { DEPARTMENT } from '../../config/constants';

interface AppHeaderProps {
  onNotificationClick?: () => void;
  onProfileClick?: () => void;
  onChangePasswordClick?: () => void;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  onNotificationClick,
  onProfileClick,
  onChangePasswordClick,
}) => {
  const { user, role, adminUser, staffUser, studentUser, logout } = useAuth();
  const { unreadCount } = useNotifications();

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
              className="relative p-2 rounded-xl text-slate-600 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
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

          {/* User badge with interactive Profile & Security dropdown menu */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsDropdownOpen((prev) => !prev)}
              aria-expanded={isDropdownOpen}
              aria-haspopup="true"
              className={`flex items-center gap-2 p-1.5 sm:px-3 sm:py-1.5 rounded-xl transition-all cursor-pointer ${
                isDropdownOpen ? 'bg-slate-100 ring-2 ring-blue-500/20' : 'hover:bg-slate-100'
              }`}
            >
              <div className="w-8 h-8 rounded-full bg-blue-100 border border-blue-300/60 flex items-center justify-center text-xs font-bold text-blue-700">
                {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </div>
              <div className="hidden sm:block text-left">
                <div className="text-xs font-bold text-slate-800 line-clamp-1">{user?.name}</div>
                <div className="text-[10px] font-medium text-slate-500">
                  {getSubIdentity()}
                </div>
              </div>
              <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
                isDropdownOpen ? 'rotate-180 text-blue-600' : ''
              }`} />
            </button>

            {/* Profile Dropdown Menu */}
            {isDropdownOpen && (
              <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-white shadow-xl border border-slate-200/90 py-1.5 z-50 animate-fadeIn divide-y divide-slate-100">
                {/* User Snapshot Header */}
                <div className="px-4 py-3 bg-slate-50/70">
                  <p className="text-xs font-bold text-slate-900 truncate">{user?.name}</p>
                  <p className="text-[11px] font-medium text-blue-600 truncate mt-0.5">
                    {getSubIdentity()}
                  </p>
                  <div className="flex items-center gap-1.5 mt-1 text-[10px] text-slate-400 uppercase font-semibold">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                    <span>{getPortalTitle()}</span>
                  </div>
                </div>

                {/* Menu items */}
                <div className="py-1">
                  <button
                    onClick={() => {
                      setIsDropdownOpen(false);
                      if (onProfileClick) onProfileClick();
                    }}
                    className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-blue-50 hover:text-blue-700 transition-colors text-left cursor-pointer"
                  >
                    <UserIcon className="w-4 h-4 text-slate-400" />
                    <span>View Profile</span>
                  </button>

                  <button
                    id="profile-dropdown-change-password-btn"
                    onClick={() => {
                      setIsDropdownOpen(false);
                      if (onChangePasswordClick) onChangePasswordClick();
                    }}
                    className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-blue-50 hover:text-blue-700 transition-colors text-left cursor-pointer"
                  >
                    <KeyRound className="w-4 h-4 text-blue-600" />
                    <span className="font-bold text-blue-900">Change Password</span>
                  </button>
                </div>

                {/* Sign out */}
                <div className="py-1">
                  <button
                    onClick={() => {
                      setIsDropdownOpen(false);
                      logout();
                    }}
                    className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors text-left cursor-pointer"
                  >
                    <LogOut className="w-4 h-4 text-rose-500" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Quick Logout Button */}
          <button
            onClick={logout}
            className="p-2 rounded-xl text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
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
