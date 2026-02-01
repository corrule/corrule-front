import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, ArrowDown, ArrowUp, DollarSign } from 'lucide-react';
import { format } from 'date-fns';

interface BillingTransaction {
  _id: string;
  type: string;
  amount: number;
  description: string;
  status: string;
  createdAt: string;
  relatedTransaction?: any;
  relatedPurchase?: any;
}

const typeIcons = {
  PURCHASE_EARNINGS: <ArrowDown className="h-4 w-4 text-green-500" />,
  ADMIN_COMMISSION: <ArrowUp className="h-4 w-4 text-orange-500" />,
  WITHDRAWAL: <ArrowUp className="h-4 w-4 text-red-500" />,
  REFUND: <ArrowUp className="h-4 w-4 text-blue-500" />,
  ADJUSTMENT: <DollarSign className="h-4 w-4 text-purple-500" />,
  BONUS: <ArrowDown className="h-4 w-4 text-green-600" />,
};

const typeLabels = {
  PURCHASE_EARNINGS: 'Purchase Earnings',
  ADMIN_COMMISSION: 'Admin Commission',
  WITHDRAWAL: 'Withdrawal',
  REFUND: 'Refund',
  ADJUSTMENT: 'Adjustment',
  BONUS: 'Bonus',
};

const statusColors = {
  PENDING: 'bg-yellow-500/20 text-yellow-700 dark:text-yellow-400',
  COMPLETED: 'bg-green-500/20 text-green-700 dark:text-green-400',
  FAILED: 'bg-red-500/20 text-red-700 dark:text-red-400',
  REVERSED: 'bg-orange-500/20 text-orange-700 dark:text-orange-400',
};

export function BillingTransactionList() {
  const [transactions, setTransactions] = useState<BillingTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [filter, setFilter] = useState<string>('');

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const token = localStorage.getItem('token');
        let url = `/api/v1/billing/my-transactions?page=${page}&limit=10`;
        if (filter) url += `&type=${filter}`;

        const response = await fetch(url, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) throw new Error('Failed to fetch transactions');

        const data = await response.json();
        setTransactions(data.data.transactions);
        setTotal(data.data.pagination.total);
        setError('');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error loading transactions');
        console.error('Error fetching transactions:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, [page, filter]);

  if (loading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
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
            <CardTitle>Transaction History</CardTitle>
            <CardDescription>All your earnings and withdrawal transactions</CardDescription>
          </div>

          {/* Filters */}
          <div className="flex gap-2 flex-wrap">
            <Badge
              variant={filter === '' ? 'default' : 'outline'}
              className="cursor-pointer"
              onClick={() => {
                setFilter('');
                setPage(1);
              }}
            >
              All
            </Badge>
            {Object.entries(typeLabels).map(([key, label]) => (
              <Badge
                key={key}
                variant={filter === key ? 'default' : 'outline'}
                className="cursor-pointer"
                onClick={() => {
                  setFilter(key);
                  setPage(1);
                }}
              >
                {label}
              </Badge>
            ))}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {error && <p className="text-sm text-destructive">{error}</p>}

        {transactions.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-sm text-muted-foreground">No transactions found</p>
          </div>
        ) : (
          <div className="space-y-2">
            {transactions.map((transaction) => (
              <div
                key={transaction._id}
                className="flex items-center justify-between p-3 rounded-lg border border-border/50 hover:bg-accent/30 transition-colors"
              >
                <div className="flex items-center gap-3 flex-1">
                  {typeIcons[transaction.type as keyof typeof typeIcons] || <DollarSign className="h-4 w-4" />}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">
                      {typeLabels[transaction.type as keyof typeof typeLabels] || transaction.type}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">{transaction.description}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p
                      className={`text-sm font-semibold ${
                        transaction.amount > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                      }`}
                    >
                      {transaction.amount > 0 ? '+' : ''} ${Math.abs(transaction.amount).toFixed(2)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(transaction.createdAt), 'MMM d, yyyy')}
                    </p>
                  </div>
                  <Badge
                    variant="outline"
                    className={statusColors[transaction.status as keyof typeof statusColors] || ''}
                  >
                    {transaction.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {Math.ceil(total / 10) > 1 && (
          <div className="flex items-center justify-between pt-4 border-t border-border/50">
            <p className="text-xs text-muted-foreground">
              Page {page} of {Math.ceil(total / 10)} ({total} total)
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="px-3 py-1 text-xs border border-border rounded-md hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                onClick={() => setPage(Math.min(Math.ceil(total / 10), page + 1))}
                disabled={page >= Math.ceil(total / 10)}
                className="px-3 py-1 text-xs border border-border rounded-md hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
