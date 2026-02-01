// rule-guardian/src/hooks/useToast.ts
import { useState, useCallback } from 'react';
import { Toast, ToastType } from '../components/NotificationToast';

export const useToast = () => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback(
    (
      type: ToastType,
      title: string,
      message?: string,
      duration = 5000,
      action?: Toast['action']
    ) => {
      const id = `toast-${Date.now()}-${Math.random()}`;

      const toast: Toast = {
        id,
        type,
        title,
        message,
        duration,
        action,
      };

      setToasts((prev) => [...prev, toast]);

      return id;
    },
    []
  );

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const removeAllToasts = useCallback(() => {
    setToasts([]);
  }, []);

  // Convenience methods
  const success = useCallback(
    (title: string, message?: string, duration?: number) => {
      return addToast('success', title, message, duration);
    },
    [addToast]
  );

  const error = useCallback(
    (title: string, message?: string, duration?: number) => {
      return addToast('error', title, message, duration);
    },
    [addToast]
  );

  const warning = useCallback(
    (title: string, message?: string, duration?: number) => {
      return addToast('warning', title, message, duration);
    },
    [addToast]
  );

  const info = useCallback(
    (title: string, message?: string, duration?: number) => {
      return addToast('info', title, message, duration);
    },
    [addToast]
  );

  return {
    toasts,
    addToast,
    removeToast,
    removeAllToasts,
    success,
    error,
    warning,
    info,
  };
};
