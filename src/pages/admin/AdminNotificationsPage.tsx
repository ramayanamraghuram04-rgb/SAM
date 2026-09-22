import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  Send, 
  Search, 
  CheckCircle, 
  AlertCircle, 
  Users, 
  GraduationCap, 
  Layers, 
  Clock,
  Filter
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { notificationService } from '../../services/notificationService';
import { academicService } from '../../services/academicService';
import { authService } from '../../services/authService';
import { AppNotification, ClassItem, NotificationType } from '../../types';

export const AdminNotificationsPage: React.FC = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');

  // Broadcast modal / form
  const [showBroadcastModal, setShowBroadcastModal] = useState(false);
  const [broadcastTarget, setBroadcastTarget] = useState<'all' | 'students' | 'staff'>('all');
  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [user?.uid]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (user?.uid) {
        const notifs = await notificationService.getUserNotifications(user.uid);
        setNotifications(notifs);
      }
      const cls = await academicService.getAllClasses();
      setClasses(cls);
    } catch (err) {
      console.error('Failed to load notifications data:', err);
    } finally {
      setLoading(false);
    }
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleSendBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastTitle.trim() || !broadcastMessage.trim()) return;

    setIsSubmitting(true);
    try {
      if (user?.uid) {
        // Record in Admin's own audit notification feed
        await notificationService.createNotification({
          recipientUid: user.uid,
          senderUid: user.uid,
          senderName: 'Administrator',
          type: 'announcement',
          title: `[Broadcast] ${broadcastTitle.trim()}`,
          message: `Sent to ${broadcastTarget.toUpperCase()}: ${broadcastMessage.trim()}`
        });

        // Also fetch active students/staff to send notification to them if needed
        if (broadcastTarget === 'all' || broadcastTarget === 'staff') {
          const staffList = await authService.getAllStaff();
          for (const s of staffList) {
            if (s.active !== false && s.uid) {
              await notificationService.createNotification({
                recipientUid: s.uid,
                senderUid: user.uid,
                senderName: 'Department Admin',
                type: 'announcement',
                title: broadcastTitle.trim(),
                message: broadcastMessage.trim()
              });
            }
          }
        }

        if (broadcastTarget === 'all' || broadcastTarget === 'students') {
          const studentList = await authService.getAllStudents();
          for (const st of studentList) {
            if (st.active !== false && st.uid) {
              await notificationService.createNotification({
                recipientUid: st.uid,
                senderUid: user.uid,
                senderName: 'Department Admin',
                type: 'announcement',
                title: broadcastTitle.trim(),
                message: broadcastMessage.trim()
              });
            }
          }
        }
      }

      showToast('Announcement broadcast successfully!');
      setShowBroadcastModal(false);
      setBroadcastTitle('');
      setBroadcastMessage('');
      await loadData();
    } catch (err: any) {
      alert('Error broadcasting announcement: ' + (err.message || err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredNotifications = notifications.filter((n) => {
    const matchesSearch = 
      n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.message.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === 'all' || n.type === filterType;
    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-emerald-600 text-white px-5 py-3 rounded-xl shadow-lg flex items-center gap-3 animate-fade-in text-sm font-semibold">
          <CheckCircle className="w-5 h-5 text-white" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">System Notifications & Broadcasts</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
              Department CSE
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Dispatch announcements to faculty and students or audit system notification alerts.
          </p>
        </div>

        <button
          onClick={() => setShowBroadcastModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold shadow-xs transition-colors cursor-pointer self-start sm:self-auto"
        >
          <Send className="w-4 h-4" />
          <span>Send Broadcast</span>
        </button>
      </div>

      {/* Quick Stats Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <Bell className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-bold text-slate-900">{notifications.length}</div>
            <div className="text-xs text-slate-500 font-medium">Logged Alerts</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-bold text-slate-900">{classes.length}</div>
            <div className="text-xs text-slate-500 font-medium">Available CSE Classes</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <CheckCircle className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-bold text-slate-900">Active</div>
            <div className="text-xs text-slate-500 font-medium">Dispatch Gateway</div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search notifications by title or text..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-200 text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={filterType}
              onChange={(e: any) => setFilterType(e.target.value)}
              className="px-3 py-2 rounded-lg border border-slate-200 text-sm font-medium text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="all">All Types</option>
              <option value="announcement">Announcements</option>
              <option value="system">System Alerts</option>
              <option value="assignment_new">Assignments</option>
              <option value="submission_graded">Grades & Evaluations</option>
            </select>
          </div>
        </div>
      </div>

      {/* Notifications Feed */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs divide-y divide-slate-100">
        {loading ? (
          <div className="p-8 text-center text-slate-400">Loading notifications feed...</div>
        ) : filteredNotifications.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
              <Bell className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-800">No Notifications Found</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Broadcast announcements to faculty or students using the button above.
            </p>
          </div>
        ) : (
          filteredNotifications.map((notif) => (
            <div key={notif.id} className="p-4 hover:bg-slate-50/80 transition-colors flex items-start gap-4">
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                notif.type === 'announcement' ? 'bg-indigo-50 text-indigo-600' :
                notif.type === 'assignment_new' ? 'bg-blue-50 text-blue-600' :
                notif.type === 'submission_graded' ? 'bg-emerald-50 text-emerald-600' :
                'bg-slate-100 text-slate-600'
              }`}>
                <Bell className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="text-sm font-bold text-slate-900 truncate">{notif.title}</h4>
                  <span className="text-[11px] text-slate-400 shrink-0 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {new Date(notif.createdAt).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-1 whitespace-pre-line leading-relaxed">
                  {notif.message}
                </p>
                <div className="mt-2 flex items-center gap-2 text-[11px] text-slate-400">
                  <span>Sender: <strong className="text-slate-600">{notif.senderName || 'System'}</strong></span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Broadcast Modal */}
      {showBroadcastModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                  <Send className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-slate-900">Send Department Broadcast</h3>
              </div>
              <button
                onClick={() => setShowBroadcastModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSendBroadcast} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                  Target Audience
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setBroadcastTarget('all')}
                    className={`py-2 px-3 text-xs font-semibold rounded-lg border text-center transition-colors cursor-pointer ${
                      broadcastTarget === 'all'
                        ? 'bg-blue-50 border-blue-600 text-blue-700'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    Everyone
                  </button>
                  <button
                    type="button"
                    onClick={() => setBroadcastTarget('staff')}
                    className={`py-2 px-3 text-xs font-semibold rounded-lg border text-center transition-colors cursor-pointer ${
                      broadcastTarget === 'staff'
                        ? 'bg-blue-50 border-blue-600 text-blue-700'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    Staff Only
                  </button>
                  <button
                    type="button"
                    onClick={() => setBroadcastTarget('students')}
                    className={`py-2 px-3 text-xs font-semibold rounded-lg border text-center transition-colors cursor-pointer ${
                      broadcastTarget === 'students'
                        ? 'bg-blue-50 border-blue-600 text-blue-700'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    Students Only
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                  Title / Subject *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Lab Assessment Submission Schedule"
                  value={broadcastTitle}
                  onChange={(e) => setBroadcastTitle(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                  Broadcast Message *
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder="Enter important instructions or announcement for students/staff..."
                  value={broadcastMessage}
                  onChange={(e) => setBroadcastMessage(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowBroadcastModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? 'Sending...' : 'Send Broadcast'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
