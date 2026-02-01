import React, { useState, useEffect } from 'react';
import { ArrowUp, ArrowDown, Loader2, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/services/api';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface PaymentTransaction {
  id: string;
  type: 'purchase' | 'earnings' | 'withdrawal' | 'refund';
  amount: number;
  status: 'completed' | 'pending' | 'failed';
  description: string;
  ruleTitle?: string;
  date: string;
  paymentMethod?: string;
}

export function PaymentHistory() {
  const [transactions, setTransactions] = useState<PaymentTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const { toast } = useToast();

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const data = await api.getPaymentHistory(1, 100, filter !== 'all' ? filter : undefined);
      let sortedTransactions = data || [];

      // Apply sorting
      if (sortBy === 'newest') {
        sortedTransactions.sort((a: PaymentTransaction, b: PaymentTransaction) => 
          new Date(b.date).getTime() - new Date(a.date).getTime()
        );
      } else if (sortBy === 'oldest') {
        sortedTransactions.sort((a: PaymentTransaction, b: PaymentTransaction) => 
          new Date(a.date).getTime() - new Date(b.date).getTime()
        );
      } else if (sortBy === 'highest') {
        sortedTransactions.sort((a: PaymentTransaction, b: PaymentTransaction) => 
          b.amount - a.amount
        );
      } else if (sortBy === 'lowest') {
        sortedTransactions.sort((a: PaymentTransaction, b: PaymentTransaction) => 
          a.amount - b.amount
        );
      }

      setTransactions(sortedTransactions);
    } catch (error) {
      console.error('Error fetching transactions:', error);
      toast({
        title: 'Error',
        description: 'Failed to load payment history',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredTransactions = filter === 'all' 
    ? transactions 
    : transactions.filter(t => t.type === filter);

  const getTransactionIcon = (type: string) => {
    if (type === 'purchase' || type === 'withdrawal') {
      return <ArrowUp className="w-5 h-5 text-red-500" />;
    }
    return <ArrowDown className="w-5 h-5 text-green-500" />;
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      completed: 'default',
      pending: 'secondary',
      failed: 'destructive',
    };
    return variants[status] || 'default';
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      purchase: 'Rule Purchase',
      earnings: 'Earnings',
      withdrawal: 'Withdrawal',
      refund: 'Refund',
    };
    return labels[type] || type;
  };

  const getAmountColor = (type: string) => {
    if (type === 'earnings') return 'text-green-600 dark:text-green-400';
    if (type === 'purchase' || type === 'withdrawal') return 'text-red-600 dark:text-red-400';
    return 'text-foreground';
  };

  const getAmountSign = (type: string) => {
    if (type === 'earnings') return '+';
    if (type === 'purchase' || type === 'withdrawal') return '-';
    return '';
  };

  const calculateTotals = () => {
    const totals = {
      spent: 0,
      earned: 0,
      withdrawn: 0,
    };

    filteredTransactions.forEach(t => {
      if (t.type === 'purchase') totals.spent += t.amount;
      if (t.type === 'earnings') totals.earned += t.amount;
      if (t.type === 'withdrawal') totals.withdrawn += t.amount;
    });

    return totals;
  };

  const totals = calculateTotals();

  return (
    <div className="space-y-6">
      {/* Header with Summary */}
      <div>
        <h2 className="text-2xl font-bold">Payment History</h2>
        <p className="text-muted-foreground text-sm mt-1">
          View all your transactions, purchases, and withdrawals
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <div className="text-sm font-medium text-muted-foreground">Total Earned</div>
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                +${totals.earned.toFixed(2)}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <div className="text-sm font-medium text-muted-foreground">Total Spent</div>
              <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                -${totals.spent.toFixed(2)}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <div className="text-sm font-medium text-muted-foreground">Total Withdrawn</div>
              <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                -${totals.withdrawn.toFixed(2)}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-4 flex-wrap">
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Transactions</SelectItem>
            <SelectItem value="purchase">Purchases</SelectItem>
            <SelectItem value="earnings">Earnings</SelectItem>
            <SelectItem value="withdrawal">Withdrawals</SelectItem>
            <SelectItem value="refund">Refunds</SelectItem>
          </SelectContent>
        </Select>

        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Newest First</SelectItem>
            <SelectItem value="oldest">Oldest First</SelectItem>
            <SelectItem value="highest">Highest Amount</SelectItem>
            <SelectItem value="lowest">Lowest Amount</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Transactions List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      ) : filteredTransactions.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <h3 className="font-semibold text-foreground">No transactions found</h3>
              <p className="text-sm text-muted-foreground mt-2">
                You don't have any {filter !== 'all' ? `${filter} ` : ''}transactions yet
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="divide-y">
              {filteredTransactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between p-6 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-2 rounded-lg bg-muted">
                      {getTransactionIcon(transaction.type)}
                    </div>

                    <div className="space-y-1">
                      <div className="font-medium">
                        {getTypeLabel(transaction.type)}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {transaction.ruleTitle || transaction.description}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(transaction.date).toLocaleDateString()} at{' '}
                        {new Date(transaction.date).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className={`text-lg font-bold ${getAmountColor(transaction.type)}`}>
                      {getAmountSign(transaction.type)}${transaction.amount.toFixed(2)}
                    </div>

                    <Badge variant={getStatusBadge(transaction.status)}>
                      {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
