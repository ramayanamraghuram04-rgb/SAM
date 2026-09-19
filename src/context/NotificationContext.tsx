import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { AppNotification } from '../types';
import { notificationService } from '../services/notificationService';
import { useAuth } from './AuthContext';

interface NotificationContextType {
  notifications: AppNotification[];
  unreadCount: number;
  loading: boolean;
  refreshNotifications: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  const fetchNotifications = useCallback(async () => {
    if (!user?.uid) {
      setNotifications([]);
      return;
    }
    try {
      setLoading(true);
      const list = await notificationService.getUserNotifications(user.uid);
      // Double check that every notification belongs strictly to this user
      const filtered = list.filter((n) => n.recipientUid === user.uid);
      setNotifications(filtered);
    } catch (err) {
      console.error('Failed to load notifications:', err);
    } finally {
      setLoading(false);
    }
  }, [user?.uid]);

  useEffect(() => {
    fetchNotifications();
    // Poll every 20 seconds if logged in for real-time like updates without aggressive listeners
    if (user?.uid) {
      const timer = setInterval(() => {
        fetchNotifications();
      }, 20000);
      return () => clearInterval(timer);
    }
  }, [fetchNotifications, user?.uid]);

  const markAsRead = async (id: string) => {
    await notificationService.markAsRead(id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const markAllAsRead = async () => {
    if (!user?.uid) return;
    await notificationService.markAllAsRead(user.uid);
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        loading,
        refreshNotifications: fetchNotifications,
        markAsRead,
        markAllAsRead,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = (): NotificationContextType => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};
