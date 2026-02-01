import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, DollarSign } from 'lucide-react';
import { format } from 'date-fns';
import { API_BASE_URL } from '@/services/api';
import { WithdrawalStatus } from '@/constants/enums';

interface WithdrawalRequest {
  _id: string;
  amount: number;
  status: string;
  withdrawalMethod: string;
  createdAt: string;
  completedAt?: string;
  estimatedArrivalDate?: string;
  paypalEmail?: string;
  cryptoAddress?: string;
  bankAccount?: {
    bankName: string;
    accountNumber: string;
  };
  trackingNumber?: string;
}

const statusColors = {
  PENDING: 'bg-yellow-500/20 text-yellow-700 dark:text-yellow-400',
  APPROVED: 'bg-blue-500/20 text-blue-700 dark:text-blue-400',
  PROCESSING: 'bg-indigo-500/20 text-indigo-700 dark:text-indigo-400',
  COMPLETED: 'bg-green-500/20 text-green-700 dark:text-green-400',
  FAILED: 'bg-red-500/20 text-red-700 dark:text-red-400',
  CANCELLED: 'bg-gray-500/20 text-gray-700 dark:text-gray-400',
};

const withdrawalMethodLabels = {
  BANK_TRANSFER: 'Bank Transfer',
  PAYPAL: 'PayPal',
  CRYPTO: 'Cryptocurrency',
};

export function WithdrawalsList() {
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<string>('');

  React.useEffect(() => {
    const fetchWithdrawals = async () => {
      try {
        const token = localStorage.getItem('token');
        let url = `${API_BASE_URL}/billing/withdrawals/my-requests?page=1&limit=20`;
        if (filter) url += `&status=${filter}`;

        const response = await fetch(url, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) throw new Error('Failed to fetch withdrawals');

        const data = await response.json();
        setWithdrawals(data.data.withdrawals);
        setError('');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error loading withdrawals');
      } finally {
        setLoading(false);
      }
    };

    fetchWithdrawals();
  }, [filter]);

  if (loading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Withdrawal Requests</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="space-y-4">
          <div>
            <CardTitle>Withdrawal Requests</CardTitle>
            <CardDescription>Track your withdrawal history and status</CardDescription>
          </div>

          {/* Status Filters */}
          <div className="flex gap-2 flex-wrap">
            <Badge
              variant={filter === '' ? 'default' : 'outline'}
              className="cursor-pointer"
              onClick={() => setFilter('')}
            >
              All
            </Badge>
            {Object.keys(statusColors).map((status) => (
              <Badge
                key={status}
                variant={filter === status ? 'default' : 'outline'}
                className="cursor-pointer"
                onClick={() => setFilter(status)}
              >
                {status}
              </Badge>
            ))}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {error && <p className="text-sm text-destructive">{error}</p>}

        {withdrawals.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-sm text-muted-foreground">No withdrawal requests yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {withdrawals.map((withdrawal) => (
              <div
                key={withdrawal._id}
                className="p-4 rounded-lg border border-border/50 hover:bg-accent/30 transition-colors space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <DollarSign className="h-4 w-4 text-primary" />
                      <p className="font-semibold">${withdrawal.amount.toFixed(2)}</p>
                      <Badge className={statusColors[withdrawal.status as keyof typeof statusColors]}>
                        {withdrawal.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {withdrawalMethodLabels[withdrawal.withdrawalMethod as keyof typeof withdrawalMethodLabels]}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">
                      Requested: {format(new Date(withdrawal.createdAt), 'MMM d, yyyy')}
                    </p>
                    {withdrawal.completedAt && (
                      <p className="text-xs text-green-600 dark:text-green-400">
                        Completed: {format(new Date(withdrawal.completedAt), 'MMM d, yyyy')}
                      </p>
                    )}
                  </div>
                </div>

                {/* Withdrawal Details */}
                <div className="bg-accent/20 rounded p-2 text-xs space-y-1">
                  {withdrawal.withdrawalMethod === 'PAYPAL' && withdrawal.paypalEmail && (
                    <p>
                      <span className="text-muted-foreground">PayPal:</span> {withdrawal.paypalEmail}
                    </p>
                  )}
                  {withdrawal.withdrawalMethod === 'BANK_TRANSFER' && withdrawal.bankAccount && (
                    <div>
                      <p>
                        <span className="text-muted-foreground">Bank:</span> {withdrawal.bankAccount.bankName}
                      </p>
                      <p>
                        <span className="text-muted-foreground">Account:</span> ••••{withdrawal.bankAccount.accountNumber?.slice(-4)}
                      </p>
                    </div>
                  )}
                  {withdrawal.withdrawalMethod === 'CRYPTO' && withdrawal.cryptoAddress && (
                    <div>
                      <p>
                        <span className="text-muted-foreground">Address:</span>{' '}
                        {withdrawal.cryptoAddress.slice(0, 10)}...{withdrawal.cryptoAddress.slice(-10)}
                      </p>
                    </div>
                  )}
                  {withdrawal.trackingNumber && (
                    <p>
                      <span className="text-muted-foreground">Tracking:</span> {withdrawal.trackingNumber}
                    </p>
                  )}
                  {withdrawal.estimatedArrivalDate && (
                    <p>
                      <span className="text-muted-foreground">Est. Arrival:</span>{' '}
                      {format(new Date(withdrawal.estimatedArrivalDate), 'MMM d, yyyy')}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
