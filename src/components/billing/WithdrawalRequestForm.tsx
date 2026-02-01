import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, AlertCircle } from 'lucide-react';
import { API_BASE_URL } from '@/services/api';

interface WithdrawalFormProps {
  currentBalance: number;
  minimumAmount: number;
  onSuccess?: () => void;
}

type WithdrawalMethod = 'PAYPAL' | 'BANK_TRANSFER' | 'CRYPTO';

const methodLabels = {
  PAYPAL: 'PayPal',
  BANK_TRANSFER: 'Bank Transfer',
  CRYPTO: 'Cryptocurrency',
};

export function WithdrawalRequestForm({ currentBalance, minimumAmount, onSuccess }: WithdrawalFormProps) {
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState<WithdrawalMethod>('PAYPAL');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Form state for different methods
  const [paypalEmail, setPaypalEmail] = useState('');
  const [bankAccount, setBankAccount] = useState({
    accountHolder: '',
    accountNumber: '',
    bankName: '',
    routingNumber: '',
    accountType: 'CHECKING',
  });
  const [cryptoDetails, setCryptoDetails] = useState({
    address: '',
    network: 'ETHEREUM',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const numAmount = parseFloat(amount);

      // Validation
      if (!numAmount || numAmount <= 0) {
        throw new Error('Please enter a valid amount');
      }

      if (numAmount < minimumAmount) {
        throw new Error(`Minimum withdrawal amount is $${minimumAmount.toFixed(2)}`);
      }

      if (numAmount > currentBalance) {
        throw new Error('Insufficient balance');
      }

      if (method === 'PAYPAL' && !paypalEmail) {
        throw new Error('Please enter your PayPal email');
      }

      if (method === 'BANK_TRANSFER' && (!bankAccount.accountNumber || !bankAccount.bankName)) {
        throw new Error('Please fill in all bank details');
      }

      if (method === 'CRYPTO' && !cryptoDetails.address) {
        throw new Error('Please enter your crypto address');
      }

      // Prepare request body
      const body: any = {
        amount: numAmount,
        withdrawalMethod: method,
      };

      if (method === 'PAYPAL') {
        body.paypalEmail = paypalEmail;
      } else if (method === 'BANK_TRANSFER') {
        body.bankAccount = bankAccount;
      } else if (method === 'CRYPTO') {
        body.cryptoAddress = cryptoDetails.address;
        body.cryptoNetwork = cryptoDetails.network;
      }

      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/billing/withdrawals/request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to request withdrawal');
      }

      setSuccess(true);
      setAmount('');
      setPaypalEmail('');
      setBankAccount({
        accountHolder: '',
        accountNumber: '',
        bankName: '',
        routingNumber: '',
        accountType: 'CHECKING',
      });
      setCryptoDetails({ address: '', network: 'ETHEREUM' });

      if (onSuccess) onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to request withdrawal');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Request Withdrawal</CardTitle>
        <CardDescription>Withdraw your earnings to your preferred account</CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Success Message */}
          {success && (
            <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/30 text-sm text-green-700 dark:text-green-400">
              Withdrawal request submitted successfully! The admin will process it soon.
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/30 text-sm text-destructive flex gap-2">
              <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
              {error}
            </div>
          )}

          {/* Balance Info */}
          <div className="bg-accent/50 p-3 rounded-lg text-sm space-y-1">
            <p className="text-muted-foreground">Current Balance</p>
            <p className="text-xl font-semibold">${currentBalance.toFixed(2)}</p>
            <p className="text-xs text-muted-foreground">Minimum withdrawal: ${minimumAmount.toFixed(2)}</p>
          </div>

          {/* Amount */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Withdrawal Amount</label>
            <input
              type="number"
              step="0.01"
              min="0"
              max={currentBalance}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Enter amount"
              className="w-full px-3 py-2 rounded-md border border-input bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              disabled={loading}
            />
            {amount && (
              <p className="text-xs text-muted-foreground">
                Remaining after withdrawal: ${(currentBalance - parseFloat(amount || '0')).toFixed(2)}
              </p>
            )}
          </div>

          {/* Withdrawal Method */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Withdrawal Method</label>
            <select
              value={method}
              onChange={(e) => setMethod(e.target.value as WithdrawalMethod)}
              className="w-full px-3 py-2 rounded-md border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              disabled={loading}
            >
              {Object.entries(methodLabels).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          {/* PayPal Fields */}
          {method === 'PAYPAL' && (
            <div className="space-y-2">
              <label className="text-sm font-medium">PayPal Email Address</label>
              <input
                type="email"
                value={paypalEmail}
                onChange={(e) => setPaypalEmail(e.target.value)}
                placeholder="your@email.com"
                className="w-full px-3 py-2 rounded-md border border-input bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                disabled={loading}
                required
              />
            </div>
          )}

          {/* Bank Transfer Fields */}
          {method === 'BANK_TRANSFER' && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-sm font-medium">Account Holder Name</label>
                  <input
                    type="text"
                    value={bankAccount.accountHolder}
                    onChange={(e) => setBankAccount({ ...bankAccount, accountHolder: e.target.value })}
                    placeholder="John Doe"
                    className="w-full px-3 py-2 rounded-md border border-input bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                    disabled={loading}
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium">Account Type</label>
                  <select
                    value={bankAccount.accountType}
                    onChange={(e) => setBankAccount({ ...bankAccount, accountType: e.target.value })}
                    className="w-full px-3 py-2 rounded-md border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                    disabled={loading}
                  >
                    <option value="CHECKING">Checking</option>
                    <option value="SAVINGS">Savings</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium">Bank Name</label>
                <input
                  type="text"
                  value={bankAccount.bankName}
                  onChange={(e) => setBankAccount({ ...bankAccount, bankName: e.target.value })}
                  placeholder="Chase Bank"
                  className="w-full px-3 py-2 rounded-md border border-input bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                  disabled={loading}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-sm font-medium">Account Number</label>
                  <input
                    type="password"
                    value={bankAccount.accountNumber}
                    onChange={(e) => setBankAccount({ ...bankAccount, accountNumber: e.target.value })}
                    placeholder="••••••••"
                    className="w-full px-3 py-2 rounded-md border border-input bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                    disabled={loading}
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium">Routing Number</label>
                  <input
                    type="password"
                    value={bankAccount.routingNumber}
                    onChange={(e) => setBankAccount({ ...bankAccount, routingNumber: e.target.value })}
                    placeholder="••••••••"
                    className="w-full px-3 py-2 rounded-md border border-input bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                    disabled={loading}
                    required
                  />
                </div>
              </div>
            </div>
          )}

          {/* Crypto Fields */}
          {method === 'CRYPTO' && (
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-sm font-medium">Blockchain Network</label>
                <select
                  value={cryptoDetails.network}
                  onChange={(e) => setCryptoDetails({ ...cryptoDetails, network: e.target.value })}
                  className="w-full px-3 py-2 rounded-md border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  disabled={loading}
                >
                  <option value="ETHEREUM">Ethereum (ETH)</option>
                  <option value="BITCOIN">Bitcoin (BTC)</option>
                  <option value="POLYGON">Polygon (MATIC)</option>
                  <option value="BINANCE">Binance Smart Chain (BSC)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium">Wallet Address</label>
                <input
                  type="text"
                  value={cryptoDetails.address}
                  onChange={(e) => setCryptoDetails({ ...cryptoDetails, address: e.target.value })}
                  placeholder="0x742d35Cc6634C0532925a3b844Bc9e7595f42453"
                  className="w-full px-3 py-2 rounded-md border border-input bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm font-mono"
                  disabled={loading}
                  required
                />
              </div>

              <p className="text-xs text-amber-600 dark:text-amber-400 bg-amber-500/10 p-2 rounded">
                ⚠️ Please ensure the wallet address is correct. We cannot reverse crypto transactions.
              </p>
            </div>
          )}

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={loading || !amount}
            className="w-full"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              'Request Withdrawal'
            )}
          </Button>

          <p className="text-xs text-muted-foreground text-center">
            Withdrawals are subject to admin approval and may take 1-5 business days to process.
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
