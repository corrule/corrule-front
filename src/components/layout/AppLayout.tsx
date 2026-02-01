import { Outlet } from 'react-router-dom';
import { AppSidebar } from './AppSidebar';
import { AppHeader } from './AppHeader';
import { useAuth } from '@/hooks/useAuth';
import { useRealtimeNotifications } from '@/hooks/useRealtimeNotifications';

export function AppLayout() {
  const { isAuthenticated } = useAuth();
  
  // Initialize real-time notifications
  useRealtimeNotifications();

  return (
    <div className="flex min-h-screen w-full bg-background">
      {isAuthenticated && <AppSidebar />}
      <div className="flex-1 flex flex-col min-w-0">
        <AppHeader />
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
