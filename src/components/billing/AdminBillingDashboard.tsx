import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Check, X, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { API_BASE_URL } from '@/services/api';
import { WithdrawalStatus } from '@/constants/enums';

interface WithdrawalRequest {
  _id: string;
  user: {
    _id: string;
    username: string;
    email: string;
  };
  amount: number;
  status: string;
  withdrawalMethod: string;
  createdAt: string;
  bankAccount?: any;
  paypalEmail?: string;
  cryptoAddress?: string;
  trackingNumber?: string;
  estimatedArrivalDate?: string;
}

interface EarningsOverview {
  balance: number;
  totalEarnings: number;
  totalWithdrawals: number;
}

const statusColors = {
  PENDING: 'bg-yellow-500/20 text-yellow-700 dark:text-yellow-400',
  APPROVED: 'bg-blue-500/20 text-blue-700 dark:text-blue-400',
  PROCESSING: 'bg-indigo-500/20 text-indigo-700 dark:text-indigo-400',
  COMPLETED: 'bg-green-500/20 text-green-700 dark:text-green-400',
  FAILED: 'bg-red-500/20 text-red-700 dark:text-red-400',
  CANCELLED: 'bg-gray-500/20 text-gray-700 dark:text-gray-400',
};

export function AdminBillingDashboard() {
  const [overview, setOverview] = useState<EarningsOverview | null>(null);
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [processingId, setProcessingId] = useState('');
  const [actionFeedback, setActionFeedback] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');

        // Fetch overview
        const overviewRes = await fetch(`${API_BASE_URL}/billing/admin/overview`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (overviewRes.ok) {
          const data = await overviewRes.json();
          setOverview(data.data.adminEarnings);
        }

        // Fetch pending withdrawals
        const withdrawalsRes = await fetch(`${API_BASE_URL}/billing/admin/withdrawals?status=${WithdrawalStatus.PENDING}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (withdrawalsRes.ok) {
          const data = await withdrawalsRes.json();
          setWithdrawals(data.data.withdrawals);
        }

        setError('');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error loading data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleApprove = async (withdrawalId: string) => {
    setProcessingId(withdrawalId);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/v1/billing/admin/withdrawals/${withdrawalId}/process`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ approved: true }),
      });

      if (response.ok) {
        setActionFeedback({ ...actionFeedback, [withdrawalId]: 'approved' });
        setWithdrawals(withdrawals.filter((w) => w._id !== withdrawalId));
        setTimeout(() => {
          setActionFeedback((prev) => {
            const newFeedback = { ...prev };
            delete newFeedback[withdrawalId];
            return newFeedback;
          });
        }, 2000);
      } else {
        throw new Error('Failed to approve');
      }
    } catch (err) {
      setActionFeedback({ ...actionFeedback, [withdrawalId]: 'error' });
    } finally {
      setProcessingId('');
    }
  };

  const handleReject = async (withdrawalId: string) => {
    const reason = prompt('Enter rejection reason:');
    if (!reason) return;

    setProcessingId(withdrawalId);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/v1/billing/admin/withdrawals/${withdrawalId}/process`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ approved: false, failureReason: reason }),
      });

      if (response.ok) {
        setActionFeedback({ ...actionFeedback, [withdrawalId]: 'rejected' });
        setWithdrawals(withdrawals.filter((w) => w._id !== withdrawalId));
        setTimeout(() => {
          setActionFeedback((prev) => {
            const newFeedback = { ...prev };
            delete newFeedback[withdrawalId];
            return newFeedback;
          });
        }, 2000);
      } else {
        throw new Error('Failed to reject');
      }
    } catch (err) {
      setActionFeedback({ ...actionFeedback, [withdrawalId]: 'error' });
    } finally {
      setProcessingId('');
    }
  };

  if (loading) {
    return (
      <div className="w-full">
        <Card>
          <CardContent className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 w-full">
      {/* Admin Earnings Overview */}
      {overview && (
        <Card className="w-full">
          <CardHeader>
            <CardTitle>Platform Earnings</CardTitle>
            <CardDescription>Your admin commission overview</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Current Balance</p>
              <p className="text-2xl font-bold">${overview.balance.toFixed(2)}</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Total Earnings</p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">${overview.totalEarnings.toFixed(2)}</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Total Withdrawn</p>
              <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">${overview.totalWithdrawals.toFixed(2)}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pending Withdrawals */}
      <Card className="w-full">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Pending Withdrawals</CardTitle>
              <CardDescription>Manage user withdrawal requests</CardDescription>
            </div>
            <Badge variant="outline">{withdrawals.length}</Badge>
          </div>
        </CardHeader>

        <CardContent>
          {error && (
            <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/30 text-sm text-destructive mb-4">
              {error}
            </div>
          )}

          {withdrawals.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No pending withdrawals</p>
            </div>
          ) : (
            <div className="space-y-3">
              {withdrawals.map((withdrawal) => (
                <div key={withdrawal._id} className="p-4 border border-border/50 rounded-lg space-y-3">
                  {/* Feedback Messages */}
                  {actionFeedback[withdrawal._id] === 'approved' && (
                    <div className="p-2 rounded-lg bg-green-500/10 border border-green-500/30 text-sm text-green-600 dark:text-green-400 flex items-center gap-2">
                      <Check className="h-4 w-4" />
                      Approved successfully!
                    </div>
                  )}
                  {actionFeedback[withdrawal._id] === 'rejected' && (
                    <div className="p-2 rounded-lg bg-orange-500/10 border border-orange-500/30 text-sm text-orange-600 dark:text-orange-400 flex items-center gap-2">
                      <Check className="h-4 w-4" />
                      Rejected successfully!
                    </div>
                  )}
                  {actionFeedback[withdrawal._id] === 'error' && (
                    <div className="p-2 rounded-lg bg-red-500/10 border border-red-500/30 text-sm text-red-600 dark:text-red-400 flex items-center gap-2">
                      <AlertCircle className="h-4 w-4" />
                      Action failed, please try again
                    </div>
                  )}

                  {/* Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-semibold">${withdrawal.amount.toFixed(2)}</p>
                        <Badge className={statusColors[withdrawal.status as keyof typeof statusColors]}>
                          {withdrawal.status}
                        </Badge>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm">
                          <span className="text-muted-foreground">User:</span> {withdrawal.user.username}
                        </p>
                        <p className="text-xs text-muted-foreground">{withdrawal.user.email}</p>
                      </div>
                    </div>
                    <div className="text-right text-xs text-muted-foreground">
                      <p>Requested: {format(new Date(withdrawal.createdAt), 'MMM d, yyyy HH:mm')}</p>
                    </div>
                  </div>

                  {/* Withdrawal Details */}
                  <div className="bg-accent/20 rounded p-2 text-xs space-y-1 font-mono">
                    <p>
                      <span className="text-muted-foreground">Method:</span> {withdrawal.withdrawalMethod}
                    </p>
                    {withdrawal.withdrawalMethod === 'PAYPAL' && withdrawal.paypalEmail && (
                      <p>
                        <span className="text-muted-foreground">Email:</span> {withdrawal.paypalEmail}
                      </p>
                    )}
                    {withdrawal.withdrawalMethod === 'BANK_TRANSFER' && withdrawal.bankAccount && (
                      <div>
                        <p>
                          <span className="text-muted-foreground">Bank:</span> {withdrawal.bankAccount.bankName}
                        </p>
                        <p>
                          <span className="text-muted-foreground">Account:</span> ••••
                          {withdrawal.bankAccount.accountNumber?.slice(-4) || 'XXXX'}
                        </p>
                      </div>
                    )}
                    {withdrawal.withdrawalMethod === 'CRYPTO' && withdrawal.cryptoAddress && (
                      <p>
                        <span className="text-muted-foreground">Address:</span> {withdrawal.cryptoAddress.slice(0, 20)}...
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-2">
                    <Button
                      size="sm"
                      variant="default"
                      onClick={() => handleApprove(withdrawal._id)}
                      disabled={processingId === withdrawal._id}
                      className="flex-1"
                    >
                      {processingId === withdrawal._id ? (
                        <>
                          <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <Check className="h-3 w-3 mr-1" />
                          Approve
                        </>
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleReject(withdrawal._id)}
                      disabled={processingId === withdrawal._id}
                      className="flex-1"
                    >
                      {processingId === withdrawal._id ? (
                        <>
                          <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <X className="h-3 w-3 mr-1" />
                          Reject
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
