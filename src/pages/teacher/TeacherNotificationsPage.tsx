import React from 'react';
import { Bell, CheckCheck, UserCheck, FileText, RotateCcw } from 'lucide-react';
import { useNotifications } from '../../context/NotificationContext';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { EmptyState } from '../../components/common/EmptyState';
import { formatDateTime } from '../../utils/dateUtils';

export const TeacherNotificationsPage: React.FC = () => {
  const { notifications, unreadCount, loading, markAsRead, markAllAsRead } = useNotifications();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Teacher Notifications</h1>
          <p className="text-xs text-slate-500">
            Student invitation acceptances, new submissions, and resubmission alerts
          </p>
        </div>

        {unreadCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            leftIcon={<CheckCheck className="w-4 h-4 text-blue-600" />}
            onClick={markAllAsRead}
          >
            Mark All Read
          </Button>
        )}
      </div>

      {loading ? (
        <LoadingSpinner message="Loading notifications..." />
      ) : notifications.length === 0 ? (
        <EmptyState
          icon={<Bell className="w-7 h-7" />}
          title="No notifications yet"
          description="When students accept your class invitations or submit their notebook assignments via Google Drive, you will receive updates here."
        />
      ) : (
        <div className="space-y-2.5">
          {notifications.map((notif) => (
            <Card
              key={notif.id}
              hoverable
              padding="sm"
              onClick={() => !notif.read && markAsRead(notif.id)}
              className={`transition-all cursor-pointer ${
                notif.read ? 'bg-white opacity-85' : 'bg-blue-50/40 border-blue-200 shadow-xs'
              }`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                    notif.type === 'invitation_accepted'
                      ? 'bg-emerald-100 text-emerald-700'
                      : notif.type === 'submission_new'
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  {notif.type === 'invitation_accepted' ? (
                    <UserCheck className="w-5 h-5" />
                  ) : (
                    <FileText className="w-5 h-5" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="text-sm font-bold text-slate-900">{notif.title}</h4>
                    <span className="text-[10px] text-slate-400 shrink-0">
                      {formatDateTime(notif.createdAt)}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">{notif.message}</p>
                </div>

                {!notif.read && (
                  <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0 mt-2" />
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
