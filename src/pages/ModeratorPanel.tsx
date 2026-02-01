import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle, XCircle, TrendingUp, Clock, Loader2, Users, Eye } from 'lucide-react';
import { api } from '@/services/api';
import { useToast } from '@/hooks/use-toast';
import { ModerationQueueCard } from '@/components/cards/ModerationQueueCard';
import { ModerationStatsCards } from '@/components/cards/ModerationStatsCards';
import { UserWarningModal } from '@/components/modals/UserWarningModal';
import { RuleReviewModal } from '@/components/modals/RuleReviewModal';
import type { Rule } from '@/types';

interface ModerationStats {
  totalReviews: number;
  approved: number;
  rejected: number;
  pending: number;
  averageReviewTime: string;
}

export default function ModeratorPanel() {
  const [activeTab, setActiveTab] = useState('queue');
  const { toast } = useToast();

  // Rules state
  const [pendingRules, setPendingRules] = useState<Rule[]>([]);
  const [approvedRules, setApprovedRules] = useState<Rule[]>([]);
  const [rejectedRules, setRejectedRules] = useState<Rule[]>([]);
  const [loading, setLoading] = useState(false);

  // Review modal state
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [selectedRuleForReview, setSelectedRuleForReview] = useState<Rule | null>(null);

  // Warning modal state
  const [warningModalOpen, setWarningModalOpen] = useState(false);
  const [warningUserId, setWarningUserId] = useState<string>('');
  const [warningUserName, setWarningUserName] = useState<string>('');

  const [stats, setStats] = useState<ModerationStats>({
    totalReviews: 0,
    approved: 0,
    rejected: 0,
    pending: 0,
    averageReviewTime: '2.3 hours',
  });

  // Fetch pending rules for review
  const fetchPendingRules = async () => {
    setLoading(true);
    try {
      const [pending, approved, rejected] = await Promise.all([
        api.getModerationQueue(1, 100, 'UNDER_REVIEW'),
        api.getModerationQueue(1, 100, 'APPROVED'),
        api.getModerationQueue(1, 100, 'REJECTED'),
      ]);

      const pendingRulesList = pending.data?.rules || [];
      const approvedRulesList = approved.data?.rules || [];
      const rejectedRulesList = rejected.data?.rules || [];

      setPendingRules(pendingRulesList);
      setApprovedRules(approvedRulesList);
      setRejectedRules(rejectedRulesList);

      setStats(prev => ({
        ...prev,
        pending: pendingRulesList.length,
        approved: approvedRulesList.length,
        rejected: rejectedRulesList.length,
        totalReviews: (pendingRulesList.length + approvedRulesList.length + rejectedRulesList.length),
      }));
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load moderation data',
        variant: 'destructive',
      });
      console.error('Failed to fetch moderation data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch all data on mount
  useEffect(() => {
    fetchPendingRules();
  }, []);

  const handleOpenReviewModal = (rule: Rule) => {
    setSelectedRuleForReview(rule);
    setReviewModalOpen(true);
  };

  const handleRuleApproved = () => {
    fetchPendingRules(); // Refresh all tabs
  };

  const handleRuleRejected = () => {
    fetchPendingRules(); // Refresh all tabs
  };

  const handleOpenWarningModal = (userId: string, userName: string) => {
    setWarningUserId(userId);
    setWarningUserName(userName);
    setWarningModalOpen(true);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'rejected':
        return <XCircle className="w-4 h-4 text-red-600" />;
      default:
        return <Clock className="w-4 h-4 text-orange-600" />;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Moderator Panel</h1>
        <p className="text-muted-foreground mt-2">
          Review and approve rule submissions to maintain quality standards
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="queue" className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            <span className="hidden sm:inline">Pending Rules</span>
          </TabsTrigger>
          <TabsTrigger value="dashboard" className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            <span className="hidden sm:inline">Dashboard</span>
          </TabsTrigger>
          <TabsTrigger value="approved" className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4" />
            <span className="hidden sm:inline">Approved</span>
          </TabsTrigger>
          <TabsTrigger value="rejected" className="flex items-center gap-2">
            <XCircle className="w-4 h-4" />
            <span className="hidden sm:inline">Rejected</span>
          </TabsTrigger>
        </TabsList>

        {/* Review Queue Tab */}
        <TabsContent value="queue" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Pending Rules</CardTitle>
              <CardDescription>
                {loading ? <Loader2 className="w-4 h-4 animate-spin inline" /> : `${pendingRules.length} rules awaiting your review`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin" />
                </div>
              ) : pendingRules.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle className="w-12 h-12 mx-auto mb-2 text-green-500" />
                  <p>No pending rules - Great job staying on top of things!</p>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {pendingRules.map((rule) => (
                    <ModerationQueueCard
                      key={rule._id}
                      rule={rule}
                      onReview={handleOpenReviewModal}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Dashboard Tab */}
        <TabsContent value="dashboard" className="space-y-6">
          <ModerationStatsCards
            pendingRules={stats.pending}
            approvedRules={stats.approved}
            rejectedRules={stats.rejected}
            averageReviewTime={parseFloat(stats.averageReviewTime)}
          />
        </TabsContent>

        {/* Approved Tab */}
        <TabsContent value="approved" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Approved Rules</CardTitle>
              <CardDescription>{approvedRules.length} rules approved</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {approvedRules.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No approved rules yet
                  </div>
                ) : (
                  approvedRules.map((rule) => (
                    <div
                      key={rule._id}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-slate-50 transition"
                    >
                      <div className="flex items-center gap-3">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                        <div>
                          <div className="font-semibold text-sm">{rule.title}</div>
                          <div className="text-xs text-muted-foreground">{typeof rule.author === 'object' ? rule.author.username : rule.author}</div>
                        </div>
                      </div>
                      <Badge className="bg-green-100 text-green-800">Approved</Badge>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Rejected Tab */}
        <TabsContent value="rejected" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Rejected Rules</CardTitle>
              <CardDescription>{rejectedRules.length} rules rejected</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {rejectedRules.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No rejected rules
                  </div>
                ) : (
                  rejectedRules.map((rule) => (
                    <div
                      key={rule._id}
                      className="p-3 border border-red-200 rounded-lg space-y-2 hover:bg-red-50 transition"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <XCircle className="w-5 h-5 text-red-600" />
                          <div>
                            <div className="font-semibold text-sm">{rule.title}</div>
                            <div className="text-xs text-muted-foreground">{typeof rule.author === 'object' ? rule.author.username : rule.author}</div>
                          </div>
                        </div>
                        <Badge className="bg-red-100 text-red-800">Rejected</Badge>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Warning Modal */}
      <UserWarningModal
        open={warningModalOpen}
        onOpenChange={setWarningModalOpen}
        userId={warningUserId}
        userName={warningUserName}
        onSuccess={() => {
          fetchPendingRules();
        }}
      />

      {/* Rule Review Modal */}
      <RuleReviewModal
        open={reviewModalOpen}
        onOpenChange={setReviewModalOpen}
        rule={selectedRuleForReview}
        onApproved={handleRuleApproved}
        onRejected={handleRuleRejected}
      />
    </div>
  );
}
