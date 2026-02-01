// rule-guardian/src/components/NotificationToast.tsx
import { useState, useEffect } from 'react';
import { X, AlertCircle, CheckCircle, Info, AlertTriangle } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface NotificationToastProps extends Toast {
  onClose: (id: string) => void;
}

const toastConfig = {
  success: {
    icon: CheckCircle,
    bgColor: 'bg-green-50 dark:bg-green-900/20',
    borderColor: 'border-green-200 dark:border-green-800',
    titleColor: 'text-green-900 dark:text-green-200',
    messageColor: 'text-green-700 dark:text-green-300',
    iconColor: 'text-green-500',
  },
  error: {
    icon: AlertCircle,
    bgColor: 'bg-red-50 dark:bg-red-900/20',
    borderColor: 'border-red-200 dark:border-red-800',
    titleColor: 'text-red-900 dark:text-red-200',
    messageColor: 'text-red-700 dark:text-red-300',
    iconColor: 'text-red-500',
  },
  warning: {
    icon: AlertTriangle,
    bgColor: 'bg-amber-50 dark:bg-amber-900/20',
    borderColor: 'border-amber-200 dark:border-amber-800',
    titleColor: 'text-amber-900 dark:text-amber-200',
    messageColor: 'text-amber-700 dark:text-amber-300',
    iconColor: 'text-amber-500',
  },
  info: {
    icon: Info,
    bgColor: 'bg-blue-50 dark:bg-blue-900/20',
    borderColor: 'border-blue-200 dark:border-blue-800',
    titleColor: 'text-blue-900 dark:text-blue-200',
    messageColor: 'text-blue-700 dark:text-blue-300',
    iconColor: 'text-blue-500',
  },
};

export function NotificationToast({
  id,
  type,
  title,
  message,
  duration = 5000,
  action,
  onClose,
}: NotificationToastProps) {
  const config = toastConfig[type];
  const Icon = config.icon;

  useEffect(() => {
    if (duration <= 0) return;

    const timer = setTimeout(() => {
      onClose(id);
    }, duration);

    return () => clearTimeout(timer);
  }, [id, duration, onClose]);

  return (
    <div
      className={`
        flex items-start gap-4 p-4 rounded-lg border
        ${config.bgColor} ${config.borderColor}
        animate-in slide-in-from-top-2 fade-in
        transition-all duration-300
      `}
    >
      <Icon className={`w-5 h-5 flex-shrink-0 mt-0.5 ${config.iconColor}`} />
      
      <div className="flex-1 min-w-0">
        <h3 className={`font-semibold text-sm ${config.titleColor}`}>
          {title}
        </h3>
        {message && (
          <p className={`text-sm mt-1 ${config.messageColor}`}>
            {message}
          </p>
        )}
        {action && (
          <button
            onClick={action.onClick}
            className={`
              text-sm font-medium mt-2
              ${config.titleColor} hover:opacity-80
              transition-opacity
            `}
          >
            {action.label}
          </button>
        )}
      </div>

      <button
        onClick={() => onClose(id)}
        className="flex-shrink-0 text-foreground/40 hover:text-foreground/60 transition-colors"
        aria-label="Close notification"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

// Toast Container Component
export interface ToastContainerProps {
  toasts: Toast[];
  onClose: (id: string) => void;
  position?: 'top' | 'bottom';
}

export function ToastContainer({
  toasts,
  onClose,
  position = 'top',
}: ToastContainerProps) {
  return (
    <div
      className={`
        fixed right-0 left-0 z-50 p-4 pointer-events-none
        flex flex-col gap-3 max-w-md mx-auto
        ${position === 'top' ? 'top-0' : 'bottom-0'}
      `}
    >
      {toasts.map((toast) => (
        <div key={toast.id} className="pointer-events-auto">
          <NotificationToast
            {...toast}
            onClose={onClose}
          />
        </div>
      ))}
    </div>
  );
}
