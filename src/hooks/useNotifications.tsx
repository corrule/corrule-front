// rule-guardian/src/hooks/useNotifications.tsx
import { useState, useCallback, useEffect } from 'react';
import { api } from '../services/api';
import { Notification } from '../types';

export interface UseNotificationsReturn {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  currentPage: number;
  totalPages: number;
  filter: 'all' | 'read' | 'unread';
  
  // Methods
  fetchNotifications: (page?: number, limit?: number, newFilter?: 'all' | 'read' | 'unread') => Promise<void>;
  getUnreadCount: () => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  markMultipleAsRead: (notificationIds: string[]) => Promise<void>;
  deleteNotification: (notificationId: string) => Promise<void>;
  deleteMultiple: (notificationIds: string[]) => Promise<void>;
  clearAll: () => Promise<void>;
  setFilter: (filter: 'all' | 'read' | 'unread') => void;
  nextPage: () => void;
  previousPage: () => void;
}

export const useNotifications = (): UseNotificationsReturn => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filter, setFilterState] = useState<'all' | 'read' | 'unread'>('all');

  // Fetch notifications with pagination
  const fetchNotifications = useCallback(
    async (page = 1, limit = 20, newFilter: 'all' | 'read' | 'unread' = filter) => {
      try {
        setLoading(true);
        setError(null);
        const response = await api.getNotifications(page, limit, newFilter);
        
        if (response.success) {
          setNotifications(response.data.notifications);
          setCurrentPage(response.data.pagination?.currentPage || page);
          setTotalPages(response.data.pagination?.totalPages || 1);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch notifications');
      } finally {
        setLoading(false);
      }
    },
    [filter]
  );

  // Get unread count
  const getUnreadCount = useCallback(async () => {
    try {
      const response = await api.getUnreadNotificationCount();
      if (response.success) {
        setUnreadCount(response.data.unreadCount);
      }
    } catch (err) {
      console.error('Failed to get unread count:', err);
    }
  }, []);

  // Mark single notification as read
  const markAsRead = useCallback(
    async (notificationId: string) => {
      try {
        await api.markNotificationAsRead(notificationId);
        
        // Update local state
        setNotifications((prev) =>
          prev.map((notif) =>
            notif._id === notificationId ? { ...notif, read: true } : notif
          )
        );
        
        // Update unread count
        await getUnreadCount();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to mark notification as read');
      }
    },
    [getUnreadCount]
  );

  // Mark multiple as read
  const markMultipleAsRead = useCallback(
    async (notificationIds: string[]) => {
      try {
        await api.markMultipleNotificationsAsRead(notificationIds);
        
        // Update local state
        setNotifications((prev) =>
          prev.map((notif) =>
            notificationIds.includes(notif._id || '') ? { ...notif, read: true } : notif
          )
        );
        
        // Update unread count
        await getUnreadCount();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to mark notifications as read');
      }
    },
    [getUnreadCount]
  );

  // Delete single notification
  const deleteNotification = useCallback(
    async (notificationId: string) => {
      try {
        await api.deleteNotification(notificationId);
        
        // Update local state
        setNotifications((prev) =>
          prev.filter((notif) => notif._id !== notificationId)
        );
        
        // Update unread count
        await getUnreadCount();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to delete notification');
      }
    },
    [getUnreadCount]
  );

  // Delete multiple notifications
  const deleteMultiple = useCallback(
    async (notificationIds: string[]) => {
      try {
        await api.deleteMultipleNotifications(notificationIds);
        
        // Update local state
        setNotifications((prev) =>
          prev.filter((notif) => !notificationIds.includes(notif._id || ''))
        );
        
        // Update unread count
        await getUnreadCount();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to delete notifications');
      }
    },
    [getUnreadCount]
  );

  // Clear all notifications
  const clearAll = useCallback(async () => {
    try {
      await api.clearAllNotifications();
      setNotifications([]);
      setUnreadCount(0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to clear notifications');
    }
  }, []);

  // Set filter and refetch
  const setFilter = useCallback(
    (newFilter: 'all' | 'read' | 'unread') => {
      setFilterState(newFilter);
      setCurrentPage(1);
    },
    []
  );

  // Pagination helpers
  const nextPage = useCallback(() => {
    if (currentPage < totalPages) {
      setCurrentPage((prev) => prev + 1);
    }
  }, [currentPage, totalPages]);

  const previousPage = useCallback(() => {
    if (currentPage > 1) {
      setCurrentPage((prev) => prev - 1);
    }
  }, [currentPage]);

  // Fetch notifications when page or filter changes
  useEffect(() => {
    fetchNotifications(currentPage, 20, filter);
  }, [currentPage, filter, fetchNotifications]);

  // Get initial unread count
  useEffect(() => {
    getUnreadCount();
  }, [getUnreadCount]);

  return {
    notifications,
    unreadCount,
    loading,
    error,
    hasMore: currentPage < totalPages,
    currentPage,
    totalPages,
    filter,
    fetchNotifications,
    getUnreadCount,
    markAsRead,
    markMultipleAsRead,
    deleteNotification,
    deleteMultiple,
    clearAll,
    setFilter,
    nextPage,
    previousPage,
  };
};
