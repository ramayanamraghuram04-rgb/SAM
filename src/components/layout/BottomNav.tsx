import React from 'react';
import { 
  Home, 
  Layers, 
  FileText, 
  Bell, 
  User, 
  Award 
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';

export type TeacherTab = 'home' | 'classes' | 'assignments' | 'notifications' | 'profile';
export type StudentTab = 'home' | 'classes' | 'assignments' | 'marks' | 'profile';

interface BottomNavProps {
  currentTab: string;
  onSelectTab: (tab: any) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ currentTab, onSelectTab }) => {
  const { role } = useAuth();
  const { unreadCount } = useNotifications();

  const teacherItems: { id: TeacherTab; label: string; icon: React.ReactNode; badge?: number }[] = [
    { id: 'home', label: 'Home', icon: <Home className="w-5 h-5" /> },
    { id: 'classes', label: 'Classes', icon: <Layers className="w-5 h-5" /> },
    { id: 'assignments', label: 'Assignments', icon: <FileText className="w-5 h-5" /> },
    { id: 'notifications', label: 'Alerts', icon: <Bell className="w-5 h-5" />, badge: unreadCount },
    { id: 'profile', label: 'Profile', icon: <User className="w-5 h-5" /> },
  ];

  const studentItems: { id: StudentTab; label: string; icon: React.ReactNode }[] = [
    { id: 'home', label: 'Home', icon: <Home className="w-5 h-5" /> },
    { id: 'classes', label: 'Classes', icon: <Layers className="w-5 h-5" /> },
    { id: 'assignments', label: 'Assignments', icon: <FileText className="w-5 h-5" /> },
    { id: 'marks', label: 'Marks', icon: <Award className="w-5 h-5" /> },
    { id: 'profile', label: 'Profile', icon: <User className="w-5 h-5" /> },
  ];

  const items = role === 'teacher' ? teacherItems : studentItems;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/80 safe-bottom sm:hidden">
      <div className="flex items-center justify-around h-16 px-2">
        {items.map((item) => {
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`relative flex flex-col items-center justify-center flex-1 py-1 transition-all duration-150 ${
                isActive ? 'text-blue-600 font-semibold' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <div className="relative">
                {item.icon}
                {(item as any).badge && (item as any).badge > 0 && (
                  <span className="absolute -top-1 -right-2 flex items-center justify-center min-w-[16px] h-4 px-1 text-[9px] font-bold text-white bg-rose-500 rounded-full ring-2 ring-white">
                    {(item as any).badge > 9 ? '9+' : (item as any).badge}
                  </span>
                )}
              </div>
              <span className="text-[11px] mt-1 tracking-tight">{item.label}</span>
              {isActive && (
                <span className="absolute bottom-1 w-6 h-0.5 bg-blue-600 rounded-full" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
