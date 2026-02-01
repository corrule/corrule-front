import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, FileText, DollarSign, BarChart3, Eye, Download, Loader2 } from 'lucide-react';
import { api } from '@/services/api';
import { useToast } from '@/hooks/use-toast';
import { PublishRuleModal } from '@/components/modals/PublishRuleModal';
import { WithdrawEarningsModal } from '@/components/modals/WithdrawEarningsModal';
import { RuleStatus } from '@/constants/enums';
import type { Rule } from '@/types';

interface ContributorStats {
  totalRules: number;
  totalDownloads: number;
  totalEarnings: number;
  averageRating: number;
  pendingPublish: number;
}

interface Transaction {
  _id: string;
  type: string;
  amount: number;
  date: string;
  ruleId?: string;
  ruleName?: string;
}

export default function VerifiedContributorPanel() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const { toast } = useToast();

  const [myRules, setMyRules] = useState<Rule[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [earnings, setEarnings] = useState(0);
  const [loading, setLoading] = useState(false);

  // Modal states
  const [publishModalOpen, setPublishModalOpen] = useState(false);
  const [publishRuleId, setPublishRuleId] = useState<string>('');
  const [publishRuleName, setPublishRuleName] = useState<string>('');
  const [withdrawModalOpen, setWithdrawModalOpen] = useState(false);

  const [stats, setStats] = useState<ContributorStats>({
    totalRules: 0,
    totalDownloads: 0,
    totalEarnings: 0,
    averageRating: 0,
    pendingPublish: 0,
  });

  // Fetch my rules
  const fetchMyRules = async () => {
    setLoading(true);
    try {
      const response = await api.getMyRules({ visibility: 'PUBLIC' }, 1, 100);
      const rules = response.data?.rules || [];
      setMyRules(rules);
      const totalDownloads = rules.reduce((sum, r) => sum + (r.downloads || 0), 0);
      const avgRating = rules.length > 0 ? rules.reduce((sum, r) => sum + (r.rating || 0), 0) / rules.length : 0;
      setStats(prev => ({
        ...prev,
        totalRules: rules.length,
        totalDownloads,
        averageRating: parseFloat(avgRating.toFixed(1)),
      }));
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load your rules',
        variant: 'destructive',
      });
    }
  };

  // Fetch earnings
  const fetchEarnings = async () => {
    try {
      const response = await api.getMyEarnings('all');
      // API returns { total, breakdown }
      const totalEarnings = response.data?.total || 0;
      setEarnings(totalEarnings);
      setStats(prev => ({
        ...prev,
        totalEarnings,
      }));
    } catch (error) {
      console.error('Failed to fetch earnings:', error);
    }
  };

  // Fetch transactions
  const fetchTransactions = async () => {
    try {
      const response = await api.getMyTransactions(1, 100, 'purchase');
      const txns = response.data?.transactions || [];
      setTransactions(txns);
    } catch (error) {
      console.error('Failed to fetch transactions:', error);
    }
  };

  // Fetch all data on mount
  useEffect(() => {
    Promise.all([fetchMyRules(), fetchEarnings(), fetchTransactions()]);
    setLoading(false);
  }, []);

  const handleOpenPublishModal = (rule: Rule) => {
    setPublishRuleId(rule._id || '');
    setPublishRuleName(rule.title);
    setPublishModalOpen(true);
  };

  const handlePublishSuccess = async () => {
    // Refresh rules list after successful publish
    await fetchMyRules();
    toast({
      title: 'Success',
      description: 'Rule has been submitted for review',
    });
  };

  const handleWithdrawSuccess = async () => {
    // Refresh earnings after successful withdrawal
    await fetchEarnings();
    toast({
      title: 'Success',
      description: 'Withdrawal request has been submitted',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'draft':
        return 'bg-slate-100 text-slate-800';
      default:
        return 'bg-slate-100 text-slate-800';
    }
  };

  const publishedRules = myRules.filter(r => r.status === RuleStatus.APPROVED || r.status === RuleStatus.UNDER_REVIEW);
  const pendingRules = myRules.filter(r => r.status === RuleStatus.UNDER_REVIEW);
  const draftRules = myRules.filter(r => r.status === RuleStatus.DRAFT);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Verified Contributor Panel</h1>
        <p className="text-muted-foreground mt-2">
          Manage your rules, track earnings, and monitor performance
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="dashboard" className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            <span className="hidden sm:inline">Dashboard</span>
          </TabsTrigger>
          <TabsTrigger value="my-rules" className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            <span className="hidden sm:inline">My Rules</span>
          </TabsTrigger>
          <TabsTrigger value="earnings" className="flex items-center gap-2">
            <DollarSign className="w-4 h-4" />
            <span className="hidden sm:inline">Earnings</span>
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            <span className="hidden sm:inline">Analytics</span>
          </TabsTrigger>
        </TabsList>

        {/* Dashboard Tab */}
        <TabsContent value="dashboard" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Rules
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalRules}</div>
                <p className="text-xs text-muted-foreground mt-1">Published & Drafts</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Downloads
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalDownloads}</div>
                <p className="text-xs text-muted-foreground mt-1">Total downloads</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Earnings
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  ${stats.totalEarnings.toFixed(2)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">All time</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Avg Rating
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-amber-600">⭐ {stats.averageRating}</div>
                <p className="text-xs text-muted-foreground mt-1">Out of 5.0</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Pending
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">{stats.pendingPublish}</div>
                <p className="text-xs text-muted-foreground mt-1">Awaiting approval</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Published Rules
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex justify-center py-4">
                    <Loader2 className="w-4 h-4 animate-spin" />
                  </div>
                ) : publishedRules.length === 0 ? (
                  <div className="text-sm text-muted-foreground">No published rules yet</div>
                ) : (
                  <div className="space-y-2">
                    {publishedRules.slice(0, 3).map(rule => (
                      <div key={rule._id} className="text-sm p-2 bg-slate-50 rounded hover:bg-slate-100 cursor-pointer">
                        <div className="font-medium truncate">{rule.title}</div>
                        <div className="text-xs text-muted-foreground">
                          {rule.downloads || 0} downloads • ⭐ {rule.rating || 0}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Top Earners
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex justify-center py-4">
                    <Loader2 className="w-4 h-4 animate-spin" />
                  </div>
                ) : publishedRules.length === 0 ? (
                  <div className="text-sm text-muted-foreground">No earnings yet</div>
                ) : (
                  <div className="space-y-2">
                    {publishedRules.slice(0, 3).map(rule => (
                      <div key={rule._id} className="text-sm p-2 bg-slate-50 rounded hover:bg-slate-100 cursor-pointer">
                        <div className="font-medium truncate">{rule.title}</div>
                        <div className="text-xs text-green-600 font-semibold">
                          ${((rule.pricing?.price || 0) * (rule.downloads || 0) * 0.1).toFixed(2)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button size="sm" className="w-full">
                  Create New Rule
                </Button>
                <Button size="sm" variant="outline" className="w-full">
                  View Analytics
                </Button>
                <Button size="sm" variant="outline" className="w-full">
                  Withdraw Earnings
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* My Rules Tab */}
        <TabsContent value="my-rules" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>My Rules</CardTitle>
              <CardDescription>Manage your rule submissions ({myRules.length} total)</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin" />
                </div>
              ) : myRules.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="w-12 h-12 mx-auto mb-2 opacity-30" />
                  <p>No rules yet. Create your first rule to get started!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {myRules.map((rule) => (
                    <div
                      key={rule._id}
                      className="p-4 border rounded-lg space-y-3 hover:bg-slate-50 transition"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-semibold">{rule.title}</div>
                          <div className="text-sm text-muted-foreground">
                            {rule.description?.substring(0, 100)}...
                          </div>
                        </div>
                        <Badge className={getStatusColor(rule.status)}>
                          {(rule.status === RuleStatus.DRAFT ? 'Draft' : rule.status === RuleStatus.UNDER_REVIEW ? 'Pending' : rule.status === RuleStatus.APPROVED ? 'Published' : rule.status).charAt(0).toUpperCase() + (rule.status === RuleStatus.DRAFT ? 'Draft' : rule.status === RuleStatus.UNDER_REVIEW ? 'Pending' : rule.status === RuleStatus.APPROVED ? 'Published' : rule.status).slice(1)}
                        </Badge>
                      </div>

                      {(rule.status === RuleStatus.APPROVED) && (
                        <div className="grid grid-cols-4 gap-2 text-sm">
                          <div className="flex items-center gap-1 p-2 bg-slate-50 rounded">
                            <Download className="w-4 h-4 text-green-600" />
                            <div>
                              <div className="text-xs text-muted-foreground">Downloads</div>
                              <div className="font-semibold">{rule.downloads || 0}</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-1 p-2 bg-slate-50 rounded">
                            <span className="text-amber-600">⭐</span>
                            <div>
                              <div className="text-xs text-muted-foreground">Rating</div>
                              <div className="font-semibold">{rule.rating || 0}</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-1 p-2 bg-slate-50 rounded">
                            <Eye className="w-4 h-4 text-blue-600" />
                            <div>
                              <div className="text-xs text-muted-foreground">Views</div>
                              <div className="font-semibold">{rule.downloads || 0}</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-1 p-2 bg-slate-50 rounded">
                            <DollarSign className="w-4 h-4 text-green-600" />
                            <div>
                              <div className="text-xs text-muted-foreground">Earnings</div>
                              <div className="font-semibold">${((rule.pricing?.price || 0) * (rule.downloads || 0) * 0.1).toFixed(0)}</div>
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" className="flex-1">
                          View
                        </Button>
                        <Button size="sm" variant="outline" className="flex-1">
                          Edit
                        </Button>
                        {(rule.status === RuleStatus.DRAFT) && (
                          <Button 
                            size="sm" 
                            className="flex-1"
                            onClick={() => handleOpenPublishModal(rule)}
                          >
                            Publish
                          </Button>
                        )}
                        {(rule.status === RuleStatus.APPROVED) && (
                          <Button size="sm" variant="outline" className="flex-1">
                            Analytics
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Earnings Tab */}
        <TabsContent value="earnings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Earnings & Payouts</CardTitle>
              <CardDescription>Track your earnings and manage payments</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                  <div className="text-sm text-muted-foreground">Total Earnings</div>
                  <div className="text-3xl font-bold text-green-600 mt-2">
                    ${earnings.toFixed(2)}
                  </div>
                </div>

                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="text-sm text-muted-foreground">Pending Payout</div>
                  <div className="text-3xl font-bold text-blue-600 mt-2">
                    ${(earnings * 0.2).toFixed(2)}
                  </div>
                </div>

                <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
                  <div className="text-sm text-muted-foreground">Total Payouts</div>
                  <div className="text-3xl font-bold text-amber-600 mt-2">
                    ${(earnings * 0.8).toFixed(2)}
                  </div>
                </div>
              </div>

              <div className="p-4 border rounded-lg">
                <div className="font-semibold mb-3">Recent Transactions</div>
                <div className="space-y-2">
                  {loading ? (
                    <div className="flex justify-center py-4">
                      <Loader2 className="w-4 h-4 animate-spin" />
                    </div>
                  ) : transactions.length === 0 ? (
                    <div className="text-sm text-muted-foreground text-center py-4">No transactions yet</div>
                  ) : (
                    transactions.map(txn => (
                      <div key={txn._id} className="flex justify-between items-center p-2 bg-slate-50 rounded">
                        <span className="text-sm truncate flex-1">{txn.ruleName || txn.type}</span>
                        <span className="text-sm font-semibold text-green-600">
                          +${txn.amount.toFixed(2)}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="flex gap-2">
                <Button 
                  className="flex-1 bg-green-600 hover:bg-green-700"
                  onClick={() => setWithdrawModalOpen(true)}
                >
                  Request Payout
                </Button>
                <Button variant="outline" className="flex-1">
                  Payment Methods
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Performance Analytics</CardTitle>
              <CardDescription>Detailed metrics for your published rules</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {loading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin" />
                </div>
              ) : publishedRules.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No published rules to analyze
                </div>
              ) : (
                <div className="space-y-4">
                  {publishedRules.map(rule => (
                    <div key={rule._id} className="p-4 border rounded-lg">
                      <div className="font-semibold mb-3">{rule.title}</div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                        <div className="p-2 bg-slate-50 rounded">
                          <div className="text-muted-foreground text-xs">Downloads</div>
                          <div className="font-bold">{rule.downloads || 0}</div>
                        </div>
                        <div className="p-2 bg-slate-50 rounded">
                          <div className="text-muted-foreground text-xs">Rating</div>
                          <div className="font-bold">{rule.rating || 0} ⭐</div>
                        </div>
                        <div className="p-2 bg-slate-50 rounded">
                          <div className="text-muted-foreground text-xs">Reviews</div>
                          <div className="font-bold">{rule.reviewCount || 0}</div>
                        </div>
                        <div className="p-2 bg-slate-50 rounded">
                          <div className="text-muted-foreground text-xs">Earnings</div>
                          <div className="font-bold text-green-600">
                            ${((rule.pricing?.price || 0) * (rule.downloads || 0) * 0.1).toFixed(2)}
                          </div>
                        </div>
                      </div>

                      <div className="mt-3 space-y-1">
                        <div className="flex justify-between text-xs">
                          <span>Download Growth</span>
                          <span className="font-semibold">{rule.downloads || 0} total</span>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-1.5">
                          <div
                            className="bg-blue-500 h-1.5 rounded-full"
                            style={{
                              width: `${Math.min((rule.downloads || 0) / 100 * 100, 100)}%`
                            }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modals */}
      <PublishRuleModal
        open={publishModalOpen}
        onOpenChange={setPublishModalOpen}
        ruleId={publishRuleId}
        ruleName={publishRuleName}
        onSuccess={handlePublishSuccess}
      />

      <WithdrawEarningsModal
        open={withdrawModalOpen}
        onOpenChange={setWithdrawModalOpen}
        currentBalance={earnings}
        onSuccess={handleWithdrawSuccess}
      />
    </div>
  );
}
