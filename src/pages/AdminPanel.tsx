import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Users, FileText, TrendingUp, Settings, Shield, Loader2 } from 'lucide-react';
import { api } from '@/services/api';
import { useToast } from '@/hooks/use-toast';
import type { User, Rule } from '@/types';

export default function AdminPanel() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const { toast } = useToast();

  // Users state
  const [users, setUsers] = useState<User[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [userSearchQuery, setUserSearchQuery] = useState('');

  // Rules state
  const [rulesForModeration, setRulesForModeration] = useState<Rule[]>([]);
  const [rulesLoading, setRulesLoading] = useState(false);

  // Stats state
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalRules: 0,
    pendingReviews: 0,
  });

  // Fetch users
  const fetchUsers = async () => {
    setUsersLoading(true);
    try {
      const response = await api.getAdminUsers(1, 100);
      setUsers(response.data?.users || []);
      setStats(prev => ({ ...prev, totalUsers: response.data?.pagination?.totalItems || 0 }));
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load users',
        variant: 'destructive',
      });
      console.error('Failed to fetch users:', error);
    } finally {
      setUsersLoading(false);
    }
  };

  // Fetch rules for moderation
  const fetchRulesForModeration = async () => {
    setRulesLoading(true);
    try {
      const response = await api.getRulesForModeration(1, 100, 'UNDER_REVIEW');
      setRulesForModeration(response.data?.rules || []);
      setStats(prev => ({ ...prev, pendingReviews: response.data?.pagination?.totalItems || 0 }));
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load rules for moderation',
        variant: 'destructive',
      });
      console.error('Failed to fetch rules:', error);
    } finally {
      setRulesLoading(false);
    }
  };

  // Fetch all data on mount
  useEffect(() => {
    fetchUsers();
    fetchRulesForModeration();
  }, []);

  const suspendUser = async (userId: string) => {
    try {
      await api.suspendUser(userId, 'Manual suspension by admin', 30);
      toast({
        title: 'Success',
        description: 'User suspended for 30 days',
      });
      await fetchUsers();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to suspend user',
        variant: 'destructive',
      });
    }
  };

  const updateUserRole = async (userId: string, newRole: string) => {
    try {
      await api.updateUserRole(userId, newRole);
      toast({
        title: 'Success',
        description: `User role updated to ${newRole}`,
      });
      await fetchUsers();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update user role',
        variant: 'destructive',
      });
    }
  };

  const moderateRule = async (ruleId: string, approved: boolean) => {
    try {
      await api.moderateRule(ruleId, approved, approved ? 'Approved by admin' : 'Rejected by admin');
      toast({
        title: 'Success',
        description: `Rule ${approved ? 'approved' : 'rejected'}`,
      });
      await fetchRulesForModeration();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to moderate rule',
        variant: 'destructive',
      });
    }
  };

  const filteredUsers = users.filter(u =>
    u.username?.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
    u.email?.toLowerCase().includes(userSearchQuery.toLowerCase())
  );

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'suspended':
        return 'bg-yellow-100 text-yellow-800';
      case 'banned':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-slate-100 text-slate-800';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Admin Panel</h1>
        <p className="text-muted-foreground mt-2">
          Manage users, rules, moderation, and system settings
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="dashboard" className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            <span className="hidden sm:inline">Dashboard</span>
          </TabsTrigger>
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            <span className="hidden sm:inline">Users</span>
          </TabsTrigger>
          <TabsTrigger value="moderation" className="flex items-center gap-2">
            <Shield className="w-4 h-4" />
            <span className="hidden sm:inline">Moderation</span>
          </TabsTrigger>
          <TabsTrigger value="rules" className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            <span className="hidden sm:inline">Rules</span>
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            <span className="hidden sm:inline">Settings</span>
          </TabsTrigger>
        </TabsList>

        {/* Dashboard Tab */}
        <TabsContent value="dashboard" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Users
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalUsers}</div>
                <p className="text-xs text-muted-foreground mt-1">Registered users</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Pending Rules
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">{stats.pendingReviews}</div>
                <p className="text-xs text-muted-foreground mt-1">Awaiting action</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  System Health
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  <span className="font-semibold">Operational</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">All systems online</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>System Overview</CardTitle>
              <CardDescription>Key metrics and system status</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                  <span className="font-medium">API Status</span>
                  <span className="text-green-600 font-semibold">Healthy</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                  <span className="font-medium">Database</span>
                  <span className="text-green-600 font-semibold">Connected</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                  <span className="font-medium">Active Users</span>
                  <span className="text-blue-600 font-semibold">{stats.totalUsers}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Users Tab */}
        <TabsContent value="users" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>User Management</CardTitle>
              <CardDescription>Manage user accounts and permissions</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                placeholder="Search users by username or email..."
                value={userSearchQuery}
                onChange={(e) => setUserSearchQuery(e.target.value)}
              />

              {usersLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredUsers.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      No users found
                    </div>
                  ) : (
                    filteredUsers.map((user) => (
                      <div
                        key={user._id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-slate-50 transition"
                      >
                        <div>
                          <div className="font-semibold">{user.username}</div>
                          <div className="text-sm text-muted-foreground">{user.email}</div>
                          <div className="flex gap-2 mt-2">
                            <Badge variant="outline">{user.role}</Badge>
                            <Badge className={getStatusBadgeColor(user.isActive ? 'active' : 'inactive')}>
                              {user.isActive ? 'active' : 'inactive'}
                            </Badge>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          {user.isActive && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => suspendUser(user._id!)}
                              >
                                Suspend
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => updateUserRole(user._id!, 'VERIFIED_CONTRIBUTOR')}
                              >
                                Promote
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Moderation Tab */}
        <TabsContent value="moderation" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Rule Moderation Queue</CardTitle>
              <CardDescription>Review and approve pending rules</CardDescription>
            </CardHeader>
            <CardContent>
              {rulesLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <div className="space-y-4">
                  {rulesForModeration.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      No rules pending review
                    </div>
                  ) : (
                    rulesForModeration.map((rule) => (
                      <div
                        key={rule._id}
                        className="p-4 border rounded-lg space-y-3 hover:bg-slate-50 transition"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="font-semibold">{rule.title}</div>
                            <div className="text-sm text-muted-foreground">
                              By {(rule.author as any)?.username || 'Unknown'}
                            </div>
                          </div>
                          <Badge variant="outline">Pending Review</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {rule.description}
                        </p>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1"
                          >
                            Review Details
                          </Button>
                          <Button
                            size="sm"
                            className="flex-1"
                            onClick={() => moderateRule(rule._id!, true)}
                          >
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            className="flex-1"
                            onClick={() => moderateRule(rule._id!, false)}
                          >
                            Reject
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Rules Tab */}
        <TabsContent value="rules" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Rule Analytics</CardTitle>
              <CardDescription>Monitor rule submissions and performance</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="p-4 bg-slate-50 rounded-lg">
                    <div className="text-sm text-muted-foreground">Rules Pending Approval</div>
                    <div className="text-3xl font-bold mt-2">{stats.pendingReviews}</div>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-lg">
                    <div className="text-sm text-muted-foreground">Total Published</div>
                    <div className="text-3xl font-bold mt-2">{stats.totalRules}</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>System Settings</CardTitle>
              <CardDescription>Configure system-wide settings and policies</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 border rounded-lg space-y-3">
                <div className="font-semibold">Platform Configuration</div>
                <div className="text-sm space-y-2">
                  <div className="flex justify-between items-center p-2 bg-slate-50 rounded">
                    <span>Enable New User Registration</span>
                    <input type="checkbox" defaultChecked className="w-4 h-4" />
                  </div>
                  <div className="flex justify-between items-center p-2 bg-slate-50 rounded">
                    <span>Require Email Verification</span>
                    <input type="checkbox" defaultChecked className="w-4 h-4" />
                  </div>
                </div>
              </div>

              <div className="p-4 border rounded-lg space-y-3">
                <div className="font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  Danger Zone
                </div>
                <Button variant="destructive" className="w-full">
                  Clear Cache
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
