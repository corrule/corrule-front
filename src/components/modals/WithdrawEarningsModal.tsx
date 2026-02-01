import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, Loader2, CheckCircle, TrendingUp } from 'lucide-react';
import { api } from '@/services/api';
import { useToast } from '@/hooks/use-toast';

interface WithdrawEarningsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentBalance: number;
  onSuccess?: () => void;
}

type PaymentMethod = 'stripe' | 'bank';

interface EarningsBreakdown {
  date: string;
  amount: number;
}

export function WithdrawEarningsModal({
  open,
  onOpenChange,
  currentBalance,
  onSuccess,
}: WithdrawEarningsModalProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [amount, setAmount] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('stripe');
  const [step, setStep] = useState<'amount' | 'method' | 'review' | 'success'>('amount');
  const [earningsBreakdown, setEarningsBreakdown] = useState<EarningsBreakdown[]>([]);
  const [loadingEarnings, setLoadingEarnings] = useState(false);

  const amountNum = parseFloat(amount) || 0;
  const processingFee = amountNum > 0 ? amountNum * 0.025 : 0; // 2.5% fee
  const netAmount = amountNum - processingFee;

  // Fetch earnings breakdown on mount
  useEffect(() => {
    if (open) {
      fetchEarningsBreakdown();
    }
  }, [open]);

  const fetchEarningsBreakdown = async () => {
    setLoadingEarnings(true);
    try {
      const response = await api.getMyEarnings('year');
      if (response.data?.breakdown) {
        setEarningsBreakdown(response.data.breakdown);
      }
    } catch (error) {
      console.error('Failed to fetch earnings breakdown:', error);
    } finally {
      setLoadingEarnings(false);
    }
  };

  const handleRequestWithdrawal = async () => {
    if (!amount || amountNum <= 0) {
      toast({
        title: 'Validation Error',
        description: 'Please enter a valid amount',
        variant: 'destructive',
      });
      return;
    }

    if (amountNum > currentBalance) {
      toast({
        title: 'Insufficient Balance',
        description: `You can only withdraw up to $${currentBalance.toFixed(2)}`,
        variant: 'destructive',
      });
      return;
    }

    if (amountNum < 1) {
      toast({
        title: 'Minimum Amount Required',
        description: 'Minimum withdrawal amount is $1.00',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      await api.requestWithdrawal(amountNum, paymentMethod);

      toast({
        title: 'Success',
        description: `Withdrawal request submitted! You'll receive $${netAmount.toFixed(2)} to your ${paymentMethod === 'stripe' ? 'Stripe' : 'bank'} account.`,
      });

      setStep('success');
      setTimeout(() => {
        onOpenChange(false);
        onSuccess?.();
        // Reset state for next use
        setStep('amount');
        setAmount('');
        setPaymentMethod('stripe');
      }, 2000);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to request withdrawal',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const paymentMethodDescriptions: Record<PaymentMethod, string> = {
    stripe: 'Fast transfers to your connected Stripe account (1-2 business days)',
    bank: 'Direct bank transfer to your account (3-5 business days)',
  };

  const quickAmounts = [100, 250, 500, 1000];
  const maxWithdraw = Math.min(currentBalance, 50000); // Set reasonable max

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Withdraw Earnings</DialogTitle>
          <DialogDescription>
            Request a withdrawal from your Rule Guardian earnings account
          </DialogDescription>
        </DialogHeader>

        {step === 'amount' && (
          <div className="space-y-6 py-4">
            {/* Current Balance */}
            <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
              <CardHeader>
                <CardTitle className="text-lg">Available Balance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold text-green-600">
                  ${currentBalance.toFixed(2)}
                </div>
                <p className="text-sm text-green-700 mt-2 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  Total earnings from rule sales and downloads
                </p>
              </CardContent>
            </Card>

            {/* Amount Selection */}
            <div className="space-y-3">
              <div>
                <Label htmlFor="withdraw-amount" className="text-base font-semibold">
                  Withdrawal Amount
                </Label>
                <p className="text-sm text-muted-foreground mt-1">
                  Minimum: $1.00 | Maximum: ${maxWithdraw.toFixed(2)}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-2xl font-semibold">$</span>
                <Input
                  id="withdraw-amount"
                  type="number"
                  min="1"
                  max={maxWithdraw}
                  step="0.01"
                  placeholder="Enter amount"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="flex-1 text-lg"
                />
              </div>

              <div className="grid grid-cols-4 gap-2">
                {quickAmounts.map((quickAmount) =>
                  quickAmount <= currentBalance ? (
                    <button
                      key={quickAmount}
                      onClick={() => setAmount(quickAmount.toString())}
                      className={`p-2 rounded border text-sm font-medium transition ${
                        amountNum === quickAmount
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'bg-background border-input hover:bg-accent'
                      }`}
                    >
                      ${quickAmount}
                    </button>
                  ) : null
                )}
              </div>
            </div>

            {/* Fee Breakdown */}
            {amountNum > 0 && (
              <Card className="bg-slate-50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Fee Breakdown</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Withdrawal Amount</span>
                    <span className="font-medium">${amountNum.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Processing Fee (2.5%)</span>
                    <span className="text-muted-foreground">
                      -${processingFee.toFixed(2)}
                    </span>
                  </div>
                  <div className="border-t pt-2 flex justify-between font-semibold">
                    <span>Amount You'll Receive</span>
                    <span className="text-green-600">${netAmount.toFixed(2)}</span>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Earnings Breakdown */}
            {!loadingEarnings && earningsBreakdown.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Earnings This Year</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {earningsBreakdown.map((item) => (
                      <div
                        key={item.date}
                        className="flex justify-between text-sm py-1 px-2 rounded hover:bg-slate-50"
                      >
                        <span className="text-muted-foreground">{item.date}</span>
                        <span className="font-medium">${item.amount.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {step === 'method' && (
          <div className="space-y-6 py-4">
            <Card className="bg-blue-50 border-blue-200">
              <CardHeader>
                <CardTitle className="text-lg">Withdrawal Amount</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-600">
                  ${amountNum.toFixed(2)}
                </div>
                <p className="text-sm text-blue-700 mt-2">
                  You'll receive: ${netAmount.toFixed(2)} (after 2.5% fee)
                </p>
              </CardContent>
            </Card>

            <div className="space-y-3">
              <Label className="text-base font-semibold">Select Payment Method</Label>

              <div className="space-y-2">
                {(['stripe', 'bank'] as const).map((method) => (
                  <button
                    key={method}
                    onClick={() => setPaymentMethod(method)}
                    className={`w-full p-4 rounded-lg border-2 text-left transition ${
                      paymentMethod === method
                        ? 'border-primary bg-primary bg-opacity-5'
                        : 'border-input hover:border-primary'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mt-1 flex-shrink-0 ${
                          paymentMethod === method
                            ? 'border-primary bg-primary'
                            : 'border-input'
                        }`}
                      >
                        {paymentMethod === method && (
                          <div className="w-2 h-2 bg-white rounded-full" />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold capitalize">
                          {method === 'stripe' ? 'Stripe Account' : 'Bank Transfer'}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {paymentMethodDescriptions[method]}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-sm text-amber-900">
                <strong>Note:</strong> Make sure your {paymentMethod === 'stripe' ? 'Stripe account' : 'bank account'} is
                properly configured in your Profile settings before withdrawing.
              </p>
            </div>
          </div>
        )}

        {step === 'review' && (
          <div className="space-y-6 py-4">
            <Card>
              <CardHeader>
                <CardTitle>Confirm Withdrawal</CardTitle>
                <CardDescription>Review your withdrawal details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-slate-50 rounded-lg">
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">
                      Amount
                    </p>
                    <p className="font-semibold mt-1 text-lg">
                      ${amountNum.toFixed(2)}
                    </p>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-lg">
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">
                      Processing Fee
                    </p>
                    <p className="font-semibold mt-1">
                      -${processingFee.toFixed(2)}
                    </p>
                  </div>

                  <div className="p-3 bg-green-50 rounded-lg">
                    <p className="text-xs text-green-600 uppercase tracking-wide font-semibold">
                      You'll Receive
                    </p>
                    <p className="font-bold mt-1 text-lg text-green-600">
                      ${netAmount.toFixed(2)}
                    </p>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-lg">
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">
                      Payment Method
                    </p>
                    <p className="font-semibold mt-1 capitalize">
                      {paymentMethod === 'stripe' ? 'Stripe' : 'Bank Transfer'}
                    </p>
                  </div>
                </div>

                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-900">
                    ✓ Your withdrawal request will be processed immediately<br />
                    ✓ You'll receive a confirmation email<br />
                    ✓ Funds will arrive in {paymentMethod === 'stripe' ? '1-2 business days' : '3-5 business days'}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {step === 'success' && (
          <div className="space-y-6 py-8 text-center">
            <div className="flex justify-center">
              <div className="rounded-full bg-green-100 p-4">
                <CheckCircle className="w-12 h-12 text-green-600" />
              </div>
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-semibold">Withdrawal Submitted!</h3>
              <p className="text-muted-foreground">
                You'll receive ${netAmount.toFixed(2)} to your {paymentMethod === 'stripe' ? 'Stripe account' : 'bank account'} soon.
              </p>
              <p className="text-xs text-muted-foreground mt-4">
                Check your email for confirmation details.
              </p>
            </div>
          </div>
        )}

        <DialogFooter className="gap-2">
          {step !== 'success' && (
            <>
              <Button
                variant="outline"
                onClick={() => {
                  onOpenChange(false);
                  setStep('amount');
                  setAmount('');
                  setPaymentMethod('stripe');
                }}
                disabled={loading}
              >
                Cancel
              </Button>

              {step === 'amount' && (
                <Button
                  onClick={() => setStep('method')}
                  disabled={!amount || amountNum <= 0 || amountNum > currentBalance}
                >
                  Continue
                </Button>
              )}

              {step === 'method' && (
                <>
                  <Button variant="outline" onClick={() => setStep('amount')}>
                    Back
                  </Button>
                  <Button onClick={() => setStep('review')}>
                    Review Withdrawal
                  </Button>
                </>
              )}

              {step === 'review' && (
                <>
                  <Button variant="outline" onClick={() => setStep('method')}>
                    Back
                  </Button>
                  <Button onClick={handleRequestWithdrawal} disabled={loading}>
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      'Confirm Withdrawal'
                    )}
                  </Button>
                </>
              )}
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
