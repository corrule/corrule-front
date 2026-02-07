// rule-guardian/src/hooks/useRealtimeNotifications.tsx
import { useEffect } from 'react';
import { useNotifications } from './useNotifications';
import { getAccessToken, API_BASE_URL } from '../services/api';

/**
 * Hook to setup real-time notifications via WebSocket
 * Note: socket.io-client should be installed: npm install socket.io-client
 * 
 * This hook gracefully handles the case where socket.io-client is not installed
 * by falling back to standard polling via useNotifications hook
 */
export const useRealtimeNotifications = () => {
  const { getUnreadCount, fetchNotifications } = useNotifications();

  useEffect(() => {
    const token = getAccessToken();
    if (!token) return;

    // Lazy load socket.io-client to avoid requiring it
    const setupSocketIO = async () => {
      try {
        // Use a dynamic import with a try-catch to handle missing module gracefully
        // The import path is constructed to avoid Vite's static analysis
        const importPath = 'socket' + '.' + 'io' + '-' + 'client';
        // @ts-ignore - Using string concatenation to avoid static resolution
        const socketIOModule = await import(/* @vite-ignore */ importPath);
        const io = socketIOModule.io;

        const socketUrl = API_BASE_URL?.replace(/\/api\/v1/, '') || 'https://corrule.com';
        
        const socket = io(socketUrl, {
          auth: {
            token,
          },
          reconnection: true,
          reconnectionDelay: 1000,
          reconnectionDelayMax: 5000,
          reconnectionAttempts: 5,
        });

        // Connection events
        socket.on('connect', () => {
          console.log('✓ Connected to notification service');
          socket.emit('subscribe_notifications');
        });

        socket.on('disconnect', () => {
          console.log('✗ Disconnected from notification service');
        });

        // Listen for new notifications
        socket.on('notification:new', (data: any) => {
          console.log('📩 New notification:', data);
          fetchNotifications(1, 20, 'all');
          getUnreadCount();
        });

        // Listen for system notifications
        socket.on('new_notification', (data: any) => {
          console.log('📩 New notification (legacy):', data);
          fetchNotifications(1, 20, 'all');
          getUnreadCount();
        });

        socket.on('system_notification', (data: any) => {
          console.log('📢 System notification:', data);
          fetchNotifications(1, 20, 'all');
          getUnreadCount();
        });

        // Listen for rule updates
        socket.on('rule_stats_update', (data: any) => {
          console.log('📊 Rule stats updated:', data);
        });

        // Error handling
        socket.on('error', (error: any) => {
          console.error('❌ WebSocket error:', error);
        });

        return () => {
          socket.disconnect();
        };
      } catch (error) {
        // socket.io-client not installed - that's OK, polling fallback will be used
        console.log('ℹ Real-time notifications not available');
        console.log('ℹ To enable real-time notifications, run: npm install socket.io-client');
      }
    };

    setupSocketIO();
  }, [getUnreadCount, fetchNotifications]);

  return {};
};
