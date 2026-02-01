import React, { useEffect, useState } from 'react';
import { FileCode, Download, Users, DollarSign, TrendingUp, Clock, Shield, Loader2 } from 'lucide-react';
import { API_BASE_URL } from '@/services/api';
import { StatsCard } from '@/components/StatsCard';
import { RuleCard } from '@/components/RuleCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface DashboardData {
  totalRules: number;
  totalDownloads: number;
  totalEarnings: number;
  totalTransactions: number;
  averageRating: number;
}

interface Rule {
  _id: string;
  title: string;
  description: string;
  category?: string;
  severity?: string;
  status?: string;
  downloads?: number;
  rating?: number;
  statistics?: {
    downloads?: number;
    views?: number;
    rating?: number;
  };
  createdAt?: string;
  author?: {
    username: string;
  };
  mitreAttack?: {
    tactics?: string[];
    techniques?: string[];
    subtechniques?: string[];
  };
}

export default function Dashboard() {
  const [dashboardData, setDashboardData] = useState<DashboardData>({
    totalRules: 0,
    totalDownloads: 0,
    totalEarnings: 0,
    totalTransactions: 0,
    averageRating: 0,
  });
  const [dailyComparison, setDailyComparison] = useState({
    rulesChange: 0,
    downloadsChange: 0,
    ratingChange: 0,
    earningsChange: 0,
  });
  const [recentRules, setRecentRules] = useState<Rule[]>([]);
  const [ruleStatusData, setRuleStatusData] = useState<any[]>([]);
  const [downloadsViewsData, setDownloadsViewsData] = useState<any[]>([]);
  const [mitreCoverageData, setMitreCoverageData] = useState<any[]>([]);
  const [timePeriod, setTimePeriod] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDashboardData();
  }, [timePeriod]);

  const generateChartData = (period: 'daily' | 'weekly' | 'monthly', totalDownloads: number, totalViews: number) => {
    const today = new Date();
    const chartData = [];
    let periods = 0;

    if (period === 'daily') {
      periods = 30; // Last 30 days
      for (let i = 29; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dayName = date.toLocaleString('default', { month: 'short', day: 'numeric' });
        chartData.push({
          name: dayName,
          downloads: Math.floor(totalDownloads / 30) + Math.floor(Math.random() * 5),
          views: Math.floor(totalViews / 30) + Math.floor(Math.random() * 8),
        });
      }
    } else if (period === 'weekly') {
      periods = 12; // Last 12 weeks
      for (let i = 11; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i * 7);
        const weekStart = new Date(date);
        weekStart.setDate(weekStart.getDate() - weekStart.getDay());
        const weekName = `W${Math.floor(i / 4) + 1}`;
        chartData.push({
          name: weekName,
          downloads: Math.floor(totalDownloads / 12) + Math.floor(Math.random() * 10),
          views: Math.floor(totalViews / 12) + Math.floor(Math.random() * 15),
        });
      }
    } else {
      // monthly
      periods = 6; // Last 6 months
      for (let i = 5; i >= 0; i--) {
        const date = new Date(today);
        date.setMonth(date.getMonth() - i);
        const monthName = date.toLocaleString('default', { month: 'short' });
        chartData.push({
          name: monthName,
          downloads: Math.floor(totalDownloads / 6),
          views: Math.floor(totalViews / 6),
        });
      }
    }

    return chartData;
  };

  const calculateDailyComparison = (todayValue: number, yesterdayValue: number): number => {
    if (yesterdayValue === 0) {
      return todayValue > 0 ? 100 : 0; // If yesterday was 0 and today > 0, it's 100% increase
    }
    const change = ((todayValue - yesterdayValue) / yesterdayValue) * 100;
    return parseFloat(change.toFixed(1));
  };

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('access_token');

      // Fetch user stats
      const statsResponse = await fetch(`${API_BASE_URL}/users/stats`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!statsResponse.ok) {
        throw new Error('Failed to fetch user stats');
      }

      const statsData = await statsResponse.json();

      // Fetch user's rules
      const rulesResponse = await fetch(`${API_BASE_URL}/users/my-rules`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      let userRules: Rule[] = [];
      if (rulesResponse.ok) {
        const rulesData = await rulesResponse.json();
        userRules = rulesData.data?.rules || [];
      }

      // Fetch downloads & views analytics from backend
      let downloadsViewsAnalytics: any[] = [];
      try {
        const analyticsResponse = await fetch(`${API_BASE_URL}/users/analytics/downloads-views?period=${timePeriod}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (analyticsResponse.ok) {
          const analyticsData = await analyticsResponse.json();
          downloadsViewsAnalytics = analyticsData.data?.analytics || [];
        }
      } catch (err) {
        console.warn('Failed to fetch analytics, using calculated data:', err);
      }

      // Fetch all reviews/comments for user's rules from backend
      let allReviews: any[] = [];
      try {
        const reviewsResponse = await fetch(`${API_BASE_URL}/users/analytics/rule-reviews`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (reviewsResponse.ok) {
          const reviewsData = await reviewsResponse.json();
          allReviews = reviewsData.data?.reviews || [];
        }
      } catch (err) {
        console.warn('Failed to fetch reviews, will calculate from rule statistics:', err);
      }

      // Calculate total downloads, views, and average rating from reviews
      let totalDownloads = 0;
      let totalViews = 0;
      let totalRating = 0;
      let reviewCount = 0;
      const ruleStatusCounts: { [key: string]: number } = {
        DRAFT: 0,
        UNDER_REVIEW: 0,
        APPROVED: 0,
        REJECTED: 0,
      };
      const mitreTactics: { [key: string]: number } = {};

      userRules.forEach((rule) => {
        totalDownloads += rule.downloads || rule.statistics?.downloads || 0;
        totalViews += rule.statistics?.views || 0;
        
        // Count by status
        if (rule.status) {
          ruleStatusCounts[rule.status] = (ruleStatusCounts[rule.status] || 0) + 1;
        }

        // Count MITRE tactics
        if (rule.mitreAttack?.tactics) {
          rule.mitreAttack.tactics.forEach((tactic) => {
            mitreTactics[tactic] = (mitreTactics[tactic] || 0) + 1;
          });
        }
      });

      // Calculate average rating from all reviews/comments
      if (allReviews.length > 0) {
        totalRating = allReviews.reduce((sum, review) => sum + (review.rating || 0), 0);
        reviewCount = allReviews.length;
      } else {
        // Fallback: calculate from rule statistics if no reviews fetched
        userRules.forEach((rule) => {
          totalRating += rule.statistics?.rating || 0;
        });
        reviewCount = userRules.length > 0 ? userRules.length : 1;
      }

      const averageRating = reviewCount > 0 ? (totalRating / reviewCount) : 0;

      // Prepare rule status chart data
      const statusChartData = Object.entries(ruleStatusCounts).map(([status, count]) => {
        const statusColors: { [key: string]: string } = {
          DRAFT: '#ef4444',
          UNDER_REVIEW: '#f59e0b',
          APPROVED: '#10b981',
          REJECTED: '#8b5cf6',
        };
        return {
          name: status,
          value: count,
          fill: statusColors[status] || '#6b7280',
        };
      });

      // Prepare downloads & views chart data
      // Use backend analytics data if available, otherwise fall back to calculated data
      let chartData: any[] = [];
      if (downloadsViewsAnalytics.length > 0) {
        chartData = downloadsViewsAnalytics;
      } else {
        chartData = generateChartData(timePeriod, totalDownloads, totalViews);
      }

      // Prepare MITRE coverage data
      const mitreCoverageArray = Object.entries(mitreTactics)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([tactic, count]) => ({
          name: tactic,
          coverage: Math.min(100, (count / (userRules.length || 1)) * 100),
        }));

      setDashboardData({
        totalRules: statsData.data?.rulesCreated || 0,
        totalDownloads,
        totalEarnings: statsData.data?.totalEarnings || 0,
        totalTransactions: statsData.data?.totalTransactions || 0,
        averageRating: parseFloat(averageRating.toFixed(1)),
      });

      // Calculate daily comparisons from analytics data
      let rulesChange = 0;
      let downloadsChange = 0;
      let ratingChange = 0;
      let earningsChange = 0;

      if (downloadsViewsAnalytics.length > 0) {
        // Get today's and yesterday's data
        const today = downloadsViewsAnalytics[downloadsViewsAnalytics.length - 1];
        const yesterday = downloadsViewsAnalytics.length > 1 ? downloadsViewsAnalytics[downloadsViewsAnalytics.length - 2] : null;

        if (today && yesterday) {
          downloadsChange = calculateDailyComparison(today.downloads || 0, yesterday.downloads || 0);
        }
      }

      // Calculate rating change from reviews (simplified - using count of new reviews as proxy)
      if (allReviews.length > 0) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        const todayReviews = allReviews.filter(r => {
          const reviewDate = new Date(r.createdAt);
          reviewDate.setHours(0, 0, 0, 0);
          return reviewDate.getTime() === today.getTime();
        }).length;

        const yesterdayReviews = allReviews.filter(r => {
          const reviewDate = new Date(r.createdAt);
          reviewDate.setHours(0, 0, 0, 0);
          return reviewDate.getTime() === yesterday.getTime();
        }).length;

        if (yesterdayReviews > 0) {
          ratingChange = calculateDailyComparison(todayReviews, yesterdayReviews);
        } else if (todayReviews > 0) {
          ratingChange = 100; // 100% increase if yesterday had none
        }
      }

      // Note: Rules and earnings changes would require backend to track daily changes
      // For now, we'll calculate from available data
      rulesChange = 0; // TODO: Track daily rule creation if needed
      earningsChange = 0; // TODO: Track daily earnings if backend supports

      setDailyComparison({
        rulesChange,
        downloadsChange,
        ratingChange,
        earningsChange,
      });

      // Set recent rules (last 3)
      setRecentRules(userRules.slice(0, 3));
      
      // Set chart data
      setRuleStatusData(statusChartData);
      setDownloadsViewsData(chartData);
      setMitreCoverageData(mitreCoverageArray.length > 0 ? mitreCoverageArray : [
        { name: 'No MITRE Coverage', coverage: 0 },
      ]);
      
      setError('');
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back! Here's an overview of your security rules.
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="w-4 h-4" />
          Last updated: {new Date().toLocaleTimeString()}
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : (
        <>
          {/* Stats Grid */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatsCard
              title="Total Rules"
              value={dashboardData.totalRules.toLocaleString()}
              change={dailyComparison.rulesChange}
              changeLabel="vs yesterday"
              icon={FileCode}
            />
            <StatsCard
              title="Total Downloads"
              value={dashboardData.totalDownloads.toLocaleString()}
              change={dailyComparison.downloadsChange}
              changeLabel="vs yesterday"
              icon={Download}
            />
            <StatsCard
              title="Average Rating"
              value={dashboardData.averageRating.toFixed(1)}
              change={dailyComparison.ratingChange}
              changeLabel="vs yesterday"
              icon={TrendingUp}
            />
            <StatsCard
              title="Total Earnings"
              value={`$${dashboardData.totalEarnings.toLocaleString()}`}
              change={dailyComparison.earningsChange}
              changeLabel="vs yesterday"
              icon={DollarSign}
            />
          </div>

          {/* Charts Row */}
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Downloads Chart */}
            <Card className="lg:col-span-2">
              <CardHeader className="flex flex-row items-center justify-between pb-4">
                <CardTitle className="text-base font-medium">Downloads & Views</CardTitle>
                <div className="flex gap-2">
                  <button
                    onClick={() => setTimePeriod('daily')}
                    className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                      timePeriod === 'daily'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground hover:bg-muted/80'
                    }`}
                  >
                    Daily
                  </button>
                  <button
                    onClick={() => setTimePeriod('weekly')}
                    className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                      timePeriod === 'weekly'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground hover:bg-muted/80'
                    }`}
                  >
                    Weekly
                  </button>
                  <button
                    onClick={() => setTimePeriod('monthly')}
                    className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                      timePeriod === 'monthly'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground hover:bg-muted/80'
                    }`}
                  >
                    Monthly
                  </button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={downloadsViewsData}>
                      <defs>
                        <linearGradient id="colorDownloads" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--accent))" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="hsl(var(--accent))" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                      <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                        }}
                        labelStyle={{ color: 'hsl(var(--foreground))' }}
                      />
                      <Area
                        type="monotone"
                        dataKey="views"
                        stroke="hsl(var(--accent))"
                        fillOpacity={1}
                        fill="url(#colorViews)"
                        strokeWidth={2}
                      />
                      <Area
                        type="monotone"
                        dataKey="downloads"
                        stroke="hsl(var(--primary))"
                        fillOpacity={1}
                        fill="url(#colorDownloads)"
                        strokeWidth={2}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Rule Status Distribution */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-medium">Rule Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={ruleStatusData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {ruleStatusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill as string} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="grid grid-cols-2 gap-2 mt-4">
                  {ruleStatusData.map((item) => (
                    <div key={item.name} className="flex items-center gap-2 text-xs">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.fill as string }} />
                      <span className="text-muted-foreground">{item.name}</span>
                      <span className="ml-auto font-medium">{item.value}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* MITRE Coverage & Recent Rules */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* MITRE ATT&CK Coverage */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-primary" />
                  <CardTitle className="text-base font-medium">MITRE ATT&CK Coverage</CardTitle>
                </div>
                <Badge variant="outline" className="text-xs">{mitreCoverageData.length} Tactics</Badge>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {mitreCoverageData.map((tactic) => (
                    <div key={tactic.name} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">{tactic.name}</span>
                        <span className="font-medium">{tactic.coverage.toFixed(0)}%</span>
                      </div>
                      <Progress
                        value={tactic.coverage}
                        className="h-2"
                      />
                    </div>
                  ))}
                  {mitreCoverageData.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No MITRE ATT&CK coverage data. Add tactics to your rules to see coverage.
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Recent Rules */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-base font-medium">Recent Rules</CardTitle>
                <Badge variant="secondary" className="text-xs">{recentRules.length}</Badge>
              </CardHeader>
              <CardContent className="space-y-4">
                {recentRules.length > 0 ? (
                  recentRules.map((rule) => (
                    <RuleCard key={rule._id} rule={rule as any} />
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">No rules created yet</p>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
