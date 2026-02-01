import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, ArrowUp, ArrowDown, DollarSign, TrendingUp } from 'lucide-react';
import { API_BASE_URL } from '@/services/api';

interface EarningsStats {
  thisMonth: number;
  lastMonth: number;
  thisWeek: number;
  lastWeek: number;
  today: number;
  totalPendingWithdrawals: number;
  availableBalance: number;
  totalEarnings: number;
}

export function EarningsStatsCard() {
  const [stats, setStats] = useState<EarningsStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStats = async () => {
      try {
        console.log('🟢 EarningsStatsCard: Starting fetch');
        const token = localStorage.getItem('access_token');
        console.log('🟢 Token exists:', !!token);

        const url = `${API_BASE_URL}/billing/my-stats`;
        console.log('🟢 Fetching URL:', url);

        const response = await fetch(url, {
          headers: { Authorization: `Bearer ${token}` },
        });

        console.log('🟢 Response status:', response.status);
        console.log('🟢 Response statusText:', response.statusText);
        console.log('🟢 Response ok:', response.ok);

        if (response.ok) {
          const data = await response.json();
          console.log('🟢 Response data:', data);
          setStats(data.data.stats);
          console.log('✅ EarningsStatsCard: Stats loaded successfully');
        } else {
          const responseText = await response.text();
          console.error('🔴 Response body:', responseText.substring(0, 200));
          throw new Error(`Failed to fetch statistics: ${response.status} ${response.statusText}`);
        }
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Error loading statistics';
        console.error('🔴 EarningsStatsCard Error:', errorMsg);
        console.error('🔴 Full error object:', err);
        setError(errorMsg);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const monthlyChange = stats ? ((stats.thisMonth - stats.lastMonth) / Math.max(stats.lastMonth, 1)) * 100 : 0;
  const weeklyChange = stats ? ((stats.thisWeek - stats.lastWeek) / Math.max(stats.lastWeek, 1)) * 100 : 0;

  if (loading) {
    return (
      <Card className="w-full">
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="w-full">
        <CardContent className="py-4">
          <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/30 text-sm text-destructive">
            {error}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!stats) {
    return null;
  }

  return (
    <div className="space-y-4 w-full">
      {/* Main Balance and Earnings */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="w-full">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center justify-between">
              <span>Available Balance</span>
              <DollarSign className="h-4 w-4 text-blue-500" />
            </CardTitle>
            <CardDescription>Ready to withdraw</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              ${stats.availableBalance.toFixed(2)}
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              Pending withdrawals: ${stats.totalPendingWithdrawals.toFixed(2)}
            </p>
          </CardContent>
        </Card>

        <Card className="w-full">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center justify-between">
              <span>Total Earnings</span>
              <TrendingUp className="h-4 w-4 text-green-500" />
            </CardTitle>
            <CardDescription>All time earnings</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">
              ${stats.totalEarnings.toFixed(2)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Time Period Comparisons */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Today */}
        <Card className="w-full">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Today</CardTitle>
            <CardDescription>Current earnings</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              ${stats.today.toFixed(2)}
            </p>
          </CardContent>
        </Card>

        {/* This Week */}
        <Card className="w-full">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center justify-between">
              <span>This Week</span>
              {weeklyChange > 0 ? (
                <ArrowUp className="h-4 w-4 text-green-500" />
              ) : (
                <ArrowDown className="h-4 w-4 text-red-500" />
              )}
            </CardTitle>
            <CardDescription>
              {weeklyChange > 0 ? '+' : ''}
              {weeklyChange.toFixed(0)}% vs last week
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
              ${stats.thisWeek.toFixed(2)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Last week: ${stats.lastWeek.toFixed(2)}
            </p>
          </CardContent>
        </Card>

        {/* This Month */}
        <Card className="w-full">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center justify-between">
              <span>This Month</span>
              {monthlyChange > 0 ? (
                <ArrowUp className="h-4 w-4 text-green-500" />
              ) : (
                <ArrowDown className="h-4 w-4 text-red-500" />
              )}
            </CardTitle>
            <CardDescription>
              {monthlyChange > 0 ? '+' : ''}
              {monthlyChange.toFixed(0)}% vs last month
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-pink-600 dark:text-pink-400">
              ${stats.thisMonth.toFixed(2)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Last month: ${stats.lastMonth.toFixed(2)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Summary Information */}
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-base">Earnings Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between items-center p-3 rounded-lg bg-accent/20">
              <span className="text-muted-foreground">Today's Earnings</span>
              <span className="font-semibold text-green-600 dark:text-green-400">${stats.today.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center p-3 rounded-lg bg-accent/20">
              <span className="text-muted-foreground">This Week</span>
              <span className="font-semibold">${stats.thisWeek.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center p-3 rounded-lg bg-accent/20">
              <span className="text-muted-foreground">This Month</span>
              <span className="font-semibold">${stats.thisMonth.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center p-3 rounded-lg bg-accent/20">
              <span className="text-muted-foreground">Available to Withdraw</span>
              <span className="font-semibold text-blue-600 dark:text-blue-400">
                ${stats.availableBalance.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between items-center p-3 rounded-lg bg-accent/20 border-2 border-green-500/30">
              <span className="font-semibold">Total All Time</span>
              <span className="font-bold text-lg text-green-600 dark:text-green-400">
                ${stats.totalEarnings.toFixed(2)}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
