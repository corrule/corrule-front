import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Shield,
  FileCode,
  Users,
  MessageCircle,
  Bell,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Plus,
  Search,
  GitFork,
  TrendingUp,
  ShoppingBag,
  User as UserIcon,
  Heart,
  Lock,
  Award,
  DollarSign,
  ChevronDown,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/hooks/useAuth';
import { usePermission } from '@/hooks/usePermission';
import { Badge } from '@/components/ui/badge';

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Rules', href: '/rules', icon: FileCode },
  { name: 'My Rules', href: '/my-rules', icon: GitFork },
  { name: 'Favorites', href: '/favorites', icon: Heart },
  { name: 'Marketplace', href: '/marketplace', icon: ShoppingBag },
  { name: 'Analytics', href: '/analytics', icon: TrendingUp },
];

const secondaryNavigation = [
  { name: 'Billing', href: '/billing', icon: DollarSign },
  { name: 'Profile', href: '/profile', icon: UserIcon },
  { name: 'Settings', href: '/settings', icon: Settings },
];

// Role-based management panels
const roleBasedNavigation = [
  {
    name: 'Admin Panel',
    href: '/admin',
    icon: Shield,
    requiredRole: 'ADMIN',
    badge: 'ADMIN',
    color: 'text-red-600',
  },
  {
    name: 'Moderator Panel',
    href: '/moderator',
    icon: Award,
    requiredRole: 'MODERATOR',
    badge: 'MOD',
    color: 'text-amber-600',
  },
  {
    name: 'Contributor Panel',
    href: '/contributor',
    icon: FileCode,
    requiredRole: 'VERIFIED_CONTRIBUTOR',
    badge: 'CONTRIB',
    color: 'text-blue-600',
  },
];

export function AppSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { isAdmin, isModerator, isVerifiedContributor } = usePermission();

  const isActive = (href: string) => {
    if (href === '/') return location.pathname === '/';
    return location.pathname.startsWith(href);
  };

  // Filter role-based navigation based on user permissions
  const visibleRoleNav = roleBasedNavigation.filter(item => {
    if (item.requiredRole === 'ADMIN') return isAdmin;
    if (item.requiredRole === 'MODERATOR') return isModerator;
    if (item.requiredRole === 'VERIFIED_CONTRIBUTOR') return isVerifiedContributor;
    return false;
  });

  return (
    <div
      className={cn(
        'flex flex-col h-screen bg-sidebar border-r border-sidebar-border transition-all duration-300',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Logo */}
      <div className={cn('flex items-center h-16 px-4 border-b border-sidebar-border', collapsed && 'justify-center')}>
        <Link to="/" className="flex items-center gap-3">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary">
            <Shield className="w-5 h-5 text-primary-foreground" />
          </div>
          {!collapsed && (
            <span className="text-lg font-semibold text-sidebar-foreground">
              Corrule
            </span>
          )}
        </Link>
      </div>

      {/* Quick Actions */}
      {!collapsed && (
        <div className="p-4 border-b border-sidebar-border">
          <Link to="/rules/new">
            <Button className="w-full gap-2" size="sm">
              <Plus className="w-4 h-4" />
              New Rule
            </Button>
          </Link>
        </div>
      )}

      {/* Main Navigation */}
      <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
        {navigation.map((item) => (
          <Link
            key={item.name}
            to={item.href}
            className={cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all',
              isActive(item.href)
                ? 'bg-primary/10 text-primary'
                : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
              collapsed && 'justify-center px-2'
            )}
          >
            <item.icon className={cn('w-5 h-5 shrink-0', isActive(item.href) && 'text-primary')} />
            {!collapsed && <span>{item.name}</span>}
          </Link>
        ))}

        {/* Community Dropdown - DISABLED FOR DEVELOPMENT */}
        {/* 
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all w-full text-left',
                isActive('/community')
                  ? 'bg-primary/10 text-primary'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                collapsed && 'justify-center px-2'
              )}
            >
              <Users className={cn('w-5 h-5 shrink-0', isActive('/community') && 'text-primary')} />
              {!collapsed && (
                <>
                  <span>Community</span>
                  <ChevronDown className="w-4 h-4 ml-auto" />
                </>
              )}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-48">
            <DropdownMenuLabel>Community</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link to="/chat" className="cursor-pointer">
                <MessageCircle className="w-4 h-4 mr-2" />
                Chat
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        */}

        {/* Role-Based Management Panels */}
        {visibleRoleNav.length > 0 && (
          <>
            <div className={cn('pt-4 mt-4 border-t border-sidebar-border')}>
              {!collapsed && (
                <p className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Management
                </p>
              )}
            </div>
            {visibleRoleNav.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group',
                  isActive(item.href)
                    ? 'bg-primary/10 text-primary'
                    : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                  collapsed && 'justify-center px-2'
                )}
                title={item.name}
              >
                <item.icon className={cn('w-5 h-5 shrink-0', isActive(item.href) && 'text-primary')} />
                {!collapsed && (
                  <div className="flex-1 flex items-center justify-between">
                    <span>{item.name}</span>
                    <Badge variant="outline" className={cn('text-xs', item.color)}>
                      {item.badge}
                    </Badge>
                  </div>
                )}
              </Link>
            ))}
          </>
        )}
      </nav>

      {/* Secondary Navigation */}
      <div className="p-2 border-t border-sidebar-border">
        {secondaryNavigation.map((item) => (
          <Link
            key={item.name}
            to={item.href}
            className={cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all',
              isActive(item.href)
                ? 'bg-primary/10 text-primary'
                : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
              collapsed && 'justify-center px-2'
            )}
          >
            <item.icon className="w-5 h-5 shrink-0" />
            {!collapsed && <span>{item.name}</span>}
          </Link>
        ))}
      </div>

      {/* User Section */}
      {user && (
        <div className={cn('p-4 border-t border-sidebar-border space-y-3', collapsed && 'p-2')}>
          {!collapsed && (
            <div className="flex items-center gap-2 px-2 py-1">
              <Lock className="w-3 h-3 text-muted-foreground" />
              <Badge variant="secondary" className="text-xs">
                {user.role}
              </Badge>
            </div>
          )}
          <Link to="/profile" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <Avatar className="w-8 h-8">
              <AvatarImage src={user.profile?.avatar} />
              <AvatarFallback className="bg-primary/20 text-primary text-xs">
                {user.profile?.firstName?.[0] || user.username[0].toUpperCase()}
              </AvatarFallback>
            </Avatar>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-sidebar-foreground truncate">
                  {user.profile?.firstName || user.username}
                </p>
                <p className="text-xs text-muted-foreground truncate">@{user.username}</p>
              </div>
            )}
            {!collapsed && (
              <Button
                variant="ghost"
                size="icon"
                className="shrink-0 text-muted-foreground hover:text-foreground"
                onClick={(e) => {
                  e.preventDefault();
                  logout().then(() => navigate('/'));
                }}
              >
                <LogOut className="w-4 h-4" />
              </Button>
            )}
          </Link>
        </div>
      )}

      {/* Collapse Toggle */}
      <div className="p-2 border-t border-sidebar-border">
        <Button
          variant="ghost"
          size="sm"
          className={cn('w-full', collapsed ? 'px-2' : 'justify-start')}
          onClick={() => setCollapsed(!collapsed)}
        >
          {collapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <>
              <ChevronLeft className="w-4 h-4 mr-2" />
              Collapse
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

