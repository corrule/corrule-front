import { useState, useEffect } from 'react';
import { API_BASE_URL } from '@/services/api';

interface BillingAccount {
  _id: string;
  balance: number;
  totalEarnings: number;
  totalWithdrawals: number;
  currency: string;
  minimumWithdrawalAmount: number;
}

interface BillingTransaction {
  _id: string;
  type: string;
  amount: number;
  description: string;
  status: string;
  createdAt: string;
}

interface WithdrawalRequest {
  _id: string;
  amount: number;
  status: string;
  createdAt: string;
  processedAt?: string;
}

export function useBillingAccount() {
  const [account, setAccount] = useState<BillingAccount | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchAccount = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE_URL}/billing/my-account`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) throw new Error('Failed to fetch billing account');

        const data = await response.json();
        setAccount(data.data);
        setError('');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error loading billing account');
      } finally {
        setLoading(false);
      }
    };

    fetchAccount();
  }, []);

  return { account, loading, error };
}

export function useBillingTransactions(page = 1, filter = '') {
  const [transactions, setTransactions] = useState<BillingTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [total, setTotal] = useState(0);

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        let url = `${API_BASE_URL}/billing/my-transactions?page=${page}&limit=20`;
        if (filter) url += `&type=${filter}`;

        const response = await fetch(url, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) throw new Error('Failed to fetch transactions');

        const data = await response.json();
        setTransactions(data.data.transactions);
        setTotal(data.data.pagination?.total || 0);
        setError('');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error loading transactions');
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, [page, filter]);

  return { transactions, loading, error, total };
}

export function useWithdrawals() {
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchWithdrawals = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/billing/my-withdrawals`, {
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

  useEffect(() => {
    fetchWithdrawals();
  }, []);

  return { withdrawals, loading, error, refetch: fetchWithdrawals };
}

export function useRequestWithdrawal() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const submitWithdrawal = async (amount: number, method: string, details: any) => {
    try {
      setLoading(true);
      setError('');

      const token = localStorage.getItem('token');
      const body: any = {
        amount,
        withdrawalMethod: method,
      };

      if (method === 'PAYPAL') {
        body.paypalEmail = details.paypalEmail;
      } else if (method === 'BANK_TRANSFER') {
        body.bankAccount = details;
      } else if (method === 'CRYPTO') {
        body.cryptoDetails = details;
      }

      const response = await fetch(`${API_BASE_URL}/billing/request-withdrawal`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to submit withdrawal request');
      }

      return await response.json();
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Error submitting withdrawal';
      setError(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { submitWithdrawal, loading, error };
}

export function useEarningsReport(period: 'day' | 'week' | 'month' | 'year' = 'month') {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchReport = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE_URL}/billing/earnings-report?period=${period}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) throw new Error('Failed to fetch earnings report');

        const data = await response.json();
        setReport(data.data);
        setError('');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error loading report');
      } finally {
        setLoading(false);
      }
    };

    fetchReport();
  }, [period]);

  return { report, loading, error };
}
