import React from 'react';
import { 
  Home, 
  Layers, 
  FileText, 
  Bell, 
  User, 
  Award, 
  LogOut, 
  GraduationCap, 
  BookOpen 
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { DEPARTMENT, DEPARTMENT_FULL } from '../../config/constants';

interface SidebarProps {
  currentTab: string;
  onSelectTab: (tab: any) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentTab, onSelectTab }) => {
  const { role, user, teacherUser, studentUser, logout } = useAuth();
  const { unreadCount } = useNotifications();

  const teacherItems = [
    { id: 'home', label: 'Dashboard', icon: <Home className="w-5 h-5" /> },
    { id: 'classes', label: 'My Classes', icon: <Layers className="w-5 h-5" /> },
    { id: 'assignments', label: 'Assignments', icon: <FileText className="w-5 h-5" /> },
    { id: 'notifications', label: 'Notifications', icon: <Bell className="w-5 h-5" />, badge: unreadCount },
    { id: 'profile', label: 'Profile', icon: <User className="w-5 h-5" /> },
  ];

  const studentItems = [
    { id: 'home', label: 'Dashboard', icon: <Home className="w-5 h-5" /> },
    { id: 'classes', label: 'My Classes', icon: <Layers className="w-5 h-5" /> },
    { id: 'assignments', label: 'Assignments', icon: <FileText className="w-5 h-5" /> },
    { id: 'marks', label: 'Marks & Grades', icon: <Award className="w-5 h-5" /> },
    { id: 'notifications', label: 'Notifications', icon: <Bell className="w-5 h-5" />, badge: unreadCount },
    { id: 'profile', label: 'Profile', icon: <User className="w-5 h-5" /> },
  ];

  const navItems = role === 'teacher' ? teacherItems : studentItems;

  return (
    <aside className="hidden sm:flex flex-col w-64 shrink-0 bg-white border-r border-slate-200/80 min-h-[calc(100vh-4rem)] p-4">
      {/* User Info Box */}
      <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/60 mb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-sm shadow-xs">
            {role === 'teacher' ? <GraduationCap className="w-5 h-5" /> : <BookOpen className="w-5 h-5" />}
          </div>
          <div className="overflow-hidden">
            <h4 className="text-xs font-bold text-slate-900 truncate">{user?.name}</h4>
            <p className="text-[11px] font-semibold text-blue-600 truncate">
              {role === 'teacher' ? `CSE Faculty` : `PIN: ${studentUser?.pin}`}
            </p>
          </div>
        </div>
      </div>

      {/* Nav List */}
      <nav className="flex-1 space-y-1">
        {navItems.map((item) => {
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 cursor-pointer ${
                isActive
                  ? 'bg-blue-600 text-white shadow-xs shadow-blue-500/20'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <div className="flex items-center gap-3">
                {item.icon}
                <span>{item.label}</span>
              </div>
              {item.badge && item.badge > 0 ? (
                <span
                  className={`px-2 py-0.5 text-xs font-bold rounded-full ${
                    isActive ? 'bg-white text-blue-700' : 'bg-rose-500 text-white'
                  }`}
                >
                  {item.badge}
                </span>
              ) : null}
            </button>
          );
        })}
      </nav>

      {/* Bottom info */}
      <div className="pt-4 border-t border-slate-100 mt-auto">
        <div className="px-3 py-2 text-[11px] text-slate-400 font-medium">
          {DEPARTMENT_FULL}
        </div>
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
};
