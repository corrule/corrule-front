// rule-guardian/src/pages/Notifications.tsx
import { useState, useEffect } from 'react';
import { useNotifications } from '../hooks/useNotifications';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Notification as NotificationType } from '../types';
import { Bell, Trash2, Check, CheckCheck, X } from 'lucide-react';
import { format } from 'date-fns';

export default function Notifications() {
  const {
    notifications,
    unreadCount,
    loading,
    error,
    filter,
    setFilter,
    markAsRead,
    markMultipleAsRead,
    deleteNotification,
    deleteMultiple,
    clearAll,
    nextPage,
    previousPage,
    hasMore,
    currentPage,
    totalPages,
  } = useNotifications();

  const [selectedNotifications, setSelectedNotifications] = useState<string[]>([]);

  // Toggle notification selection
  const toggleNotification = (id: string) => {
    setSelectedNotifications((prev) =>
      prev.includes(id) ? prev.filter((nid) => nid !== id) : [...prev, id]
    );
  };

  // Select/deselect all
  const toggleSelectAll = () => {
    if (selectedNotifications.length === notifications.length) {
      setSelectedNotifications([]);
    } else {
      setSelectedNotifications(notifications.map((n) => n._id || '').filter(Boolean));
    }
  };

  // Bulk actions
  const handleMarkSelectedAsRead = async () => {
    if (selectedNotifications.length === 0) return;
    await markMultipleAsRead(selectedNotifications);
    setSelectedNotifications([]);
  };

  const handleDeleteSelected = async () => {
    if (selectedNotifications.length === 0) return;
    if (confirm(`Delete ${selectedNotifications.length} notification(s)?`)) {
      await deleteMultiple(selectedNotifications);
      setSelectedNotifications([]);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'RULE_APPROVED':
        return '✅';
      case 'RULE_REJECTED':
        return '❌';
      case 'NEW_REVIEW':
        return '⭐';
      case 'RULE_PURCHASED':
      case 'sale':
        return '💰';
      case 'ACHIEVEMENT':
        return '🏆';
      default:
        return '📢';
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'RULE_APPROVED':
        return 'bg-green-500/10 dark:bg-green-950/40 border-green-500/30 dark:border-green-700/50 hover:bg-green-500/15 dark:hover:bg-green-950/50';
      case 'RULE_REJECTED':
        return 'bg-red-500/10 dark:bg-red-950/40 border-red-500/30 dark:border-red-700/50 hover:bg-red-500/15 dark:hover:bg-red-950/50';
      case 'NEW_REVIEW':
        return 'bg-blue-500/10 dark:bg-blue-950/40 border-blue-500/30 dark:border-blue-700/50 hover:bg-blue-500/15 dark:hover:bg-blue-950/50';
      case 'RULE_PURCHASED':
      case 'sale':
        return 'bg-amber-500/10 dark:bg-amber-950/40 border-amber-500/30 dark:border-amber-700/50 hover:bg-amber-500/15 dark:hover:bg-amber-950/50';
      case 'ACHIEVEMENT':
        return 'bg-purple-500/10 dark:bg-purple-950/40 border-purple-500/30 dark:border-purple-700/50 hover:bg-purple-500/15 dark:hover:bg-purple-950/50';
      default:
        return 'bg-slate-500/10 dark:bg-slate-900/40 border-slate-500/30 dark:border-slate-700/50 hover:bg-slate-500/15 dark:hover:bg-slate-900/50';
    }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Bell className="w-8 h-8 text-primary" />
            <h1 className="text-3xl font-bold text-foreground">Notifications</h1>
          </div>
          <p className="text-foreground/60">
            {unreadCount > 0 ? `You have ${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}` : 'All caught up!'}
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700 rounded-lg text-red-700 dark:text-red-200">
            {error}
          </div>
        )}

        {/* Filter and Actions */}
        <div className="mb-6 flex flex-col gap-4">
          {/* Filter Tabs */}
          <div className="flex gap-2 flex-wrap">
            {(['all', 'unread', 'read'] as const).map((f) => (
              <Button
                key={f}
                onClick={() => setFilter(f)}
                variant={filter === f ? 'default' : 'outline'}
                size="sm"
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </Button>
            ))}
          </div>

          {/* Bulk Actions */}
          {selectedNotifications.length > 0 && (
            <div className="flex gap-2 items-center p-3 bg-primary/10 border border-primary/30 rounded-lg">
              <span className="text-sm text-foreground">
                {selectedNotifications.length} selected
              </span>
              <div className="flex-1" />
              <Button
                onClick={handleMarkSelectedAsRead}
                size="sm"
                variant="outline"
                className="gap-2"
              >
                <Check className="w-4 h-4" />
                Mark as Read
              </Button>
              <Button
                onClick={handleDeleteSelected}
                size="sm"
                variant="outline"
                className="gap-2 text-destructive hover:text-destructive"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </Button>
            </div>
          )}

          {/* Header Actions */}
          {notifications.length > 0 && (
            <div className="flex gap-2 flex-wrap">
              <label className="flex items-center gap-2 p-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedNotifications.length === notifications.length && notifications.length > 0}
                  onChange={toggleSelectAll}
                  className="w-4 h-4 rounded"
                />
                <span className="text-sm text-foreground">
                  {selectedNotifications.length === notifications.length ? 'Deselect All' : 'Select All'}
                </span>
              </label>
              <div className="flex-1" />
              {unreadCount > 0 && (
                <Button
                  onClick={() => markMultipleAsRead(notifications.map((n) => n._id || '').filter(Boolean))}
                  size="sm"
                  variant="outline"
                  className="gap-2"
                >
                  <CheckCheck className="w-4 h-4" />
                  Mark All as Read
                </Button>
              )}
              <Button
                onClick={() => {
                  if (confirm('Delete all notifications?')) {
                    clearAll();
                  }
                }}
                size="sm"
                variant="outline"
                className="gap-2 text-destructive hover:text-destructive"
              >
                <Trash2 className="w-4 h-4" />
                Clear All
              </Button>
            </div>
          )}
        </div>

        {/* Notifications List */}
        <div className="space-y-3">
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
              <p className="text-foreground/60 mt-4">Loading notifications...</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-12">
              <Bell className="w-12 h-12 text-foreground/20 mx-auto mb-4" />
              <p className="text-foreground/60">
                {filter === 'all'
                  ? 'No notifications yet'
                  : filter === 'unread'
                    ? 'No unread notifications'
                    : 'No read notifications'}
              </p>
            </div>
          ) : (
            notifications.map((notification: NotificationType) => (
              <div
                key={notification._id}
                className={`
                  flex items-start gap-4 p-4 border rounded-lg transition-all cursor-pointer
                  ${selectedNotifications.includes(notification._id || '')
                    ? 'bg-primary/10 border-primary/60 ring-2 ring-primary/30'
                    : getNotificationColor(notification.type)
                  }
                  ${notification.read === false ? 'opacity-100 shadow-sm' : 'opacity-80'}
                `}
              >
                {/* Checkbox */}
                <input
                  type="checkbox"
                  checked={selectedNotifications.includes(notification._id || '')}
                  onChange={() => toggleNotification(notification._id || '')}
                  className="w-5 h-5 rounded mt-1 cursor-pointer flex-shrink-0"
                />

                {/* Icon and Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xl">{getNotificationIcon(notification.type)}</span>
                    <h3 className="font-semibold text-foreground/90 truncate">
                      {notification.title}
                    </h3>
                    {!notification.read && (
                      <Badge variant="default" className="ml-auto flex-shrink-0">
                        New
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-foreground/70 mb-2">
                    {notification.message}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-foreground/60">
                    <time>{format(new Date(notification.createdAt), 'MMM d, yyyy HH:mm')}</time>
                    {notification.actionUrl && (
                      <>
                        <span>•</span>
                        <a
                          href={notification.actionUrl}
                          className="text-primary hover:underline"
                        >
                          View
                        </a>
                      </>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 flex-shrink-0">
                  {!notification.read && (
                    <button
                      onClick={() => markAsRead(notification._id || '')}
                      title="Mark as read"
                      className="p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-lg transition-colors"
                    >
                      <Check className="w-4 h-4 text-foreground/60 hover:text-foreground" />
                    </button>
                  )}
                  <button
                    onClick={() => deleteNotification(notification._id || '')}
                    title="Delete"
                    className="p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-lg transition-colors"
                  >
                    <X className="w-4 h-4 text-foreground/60 hover:text-destructive" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && !loading && (
          <div className="mt-8 flex items-center justify-between">
            <Button
              onClick={previousPage}
              disabled={currentPage === 1}
              variant="outline"
            >
              Previous
            </Button>
            <span className="text-foreground/60">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              onClick={nextPage}
              disabled={!hasMore}
              variant="outline"
            >
              Next
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
