import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Wallet, TrendingUp, Banknote, ArrowUpRight, Loader2 } from 'lucide-react';
import { API_BASE_URL } from '@/services/api';

interface BillingAccount {
  _id: string;
  balance: number;
  totalEarnings: number;
  totalWithdrawals: number;
  currency: string;
  accountType: string;
  isActive: boolean;
  minimumWithdrawalAmount: number;
}

export function BillingOverviewCard() {
  const [billing, setBilling] = useState<BillingAccount | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchBilling = async () => {
      try {
        console.log('📊 BillingOverviewCard: Starting fetch');
        const token = localStorage.getItem('access_token');
        console.log('📊 Token exists:', !!token);

        const url = `${API_BASE_URL}/billing/my-account`;
        console.log('📊 Fetching URL:', url);

        const response = await fetch(url, {
          headers: { Authorization: `Bearer ${token}` },
        });

        console.log('📊 Response status:', response.status);
        console.log('📊 Response ok:', response.ok);
        console.log('📊 Content-Type:', response.headers.get('content-type'));

        const responseText = await response.text();
        console.log('📊 Raw response (first 500 chars):', responseText.substring(0, 500));

        if (!response.ok) {
          console.error('📊 Full response body:', responseText);
          throw new Error(`Failed to fetch billing: ${response.status} ${response.statusText}`);
        }

        let data;
        try {
          data = JSON.parse(responseText);
        } catch (jsonError) {
          console.error('📊 Failed to parse JSON:', jsonError);
          console.error('📊 Response was:', responseText);
          throw new Error(`Invalid JSON response from server`);
        }
        console.log('📊 Response data:', data);
        setBilling(data.data.billing);
        setError('');
        console.log('✅ BillingOverviewCard: Data loaded successfully');
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Error loading billing';
        console.error('🔴 Error fetching billing:', errorMsg);
        console.error('🔴 Full error:', err);
        setError(errorMsg);
      } finally {
        setLoading(false);
      }
    };

    fetchBilling();
  }, []);

  if (loading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Earnings Overview</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (error || !billing) {
    return (
      <Card className="w-full border-destructive/50">
        <CardHeader>
          <CardTitle>Earnings Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-destructive">{error || 'No billing data available'}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Earnings Overview</CardTitle>
            <CardDescription>Your account balance and earnings summary</CardDescription>
          </div>
          <Wallet className="h-6 w-6 text-primary" />
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Main Balance */}
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">Available Balance</p>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-bold">${billing.balance.toFixed(2)}</span>
            <span className="text-sm text-muted-foreground">{billing.currency}</span>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
          {/* Total Earnings */}
          <div className="space-y-2 rounded-lg bg-accent/30 p-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              <p className="text-xs font-medium text-muted-foreground">Total Earnings</p>
            </div>
            <p className="text-lg font-semibold">${billing.totalEarnings.toFixed(2)}</p>
          </div>

          {/* Total Withdrawals */}
          <div className="space-y-2 rounded-lg bg-accent/30 p-3">
            <div className="flex items-center gap-2">
              <ArrowUpRight className="h-4 w-4 text-orange-500" />
              <p className="text-xs font-medium text-muted-foreground">Withdrawn</p>
            </div>
            <p className="text-lg font-semibold">${billing.totalWithdrawals.toFixed(2)}</p>
          </div>
        </div>

        {/* Status */}
        <div className="flex items-center justify-between pt-2">
          <span className="text-xs text-muted-foreground">Account Status</span>
          <Badge variant={billing.isActive ? 'default' : 'destructive'}>
            {billing.isActive ? 'Active' : 'Suspended'}
          </Badge>
        </div>

        {/* Minimum Withdrawal Info */}
        <div className="rounded-lg bg-blue-500/10 p-3">
          <p className="text-xs text-blue-600 dark:text-blue-400">
            <Banknote className="inline-block h-3 w-3 mr-1" />
            Minimum withdrawal amount: ${billing.minimumWithdrawalAmount.toFixed(2)}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
