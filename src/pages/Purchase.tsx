import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  CreditCard,
  Lock,
  Check,
  AlertCircle,
  Loader2,
  CheckCircle2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { titleToSlug } from '@/lib/slugUtils';
import { api } from '@/services/api';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import type { Rule } from '@/types';

export default function Purchase() {
  const { ruleId } = useParams<{ ruleId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();

  const [rule, setRule] = useState<Rule | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [purchaseComplete, setPurchaseComplete] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);

  // Mock payment form state
  const [cardDetails, setCardDetails] = useState({
    cardNumber: '',
    cardHolder: '',
    expiryDate: '',
    cvv: '',
  });

  useEffect(() => {
    if (!ruleId || !user) return;
    fetchRuleDetails();
  }, [ruleId, user]);

  const fetchRuleDetails = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.getRule(ruleId!);
      setRule(response.rule);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load rule details';
      setError(message);
      toast({ title: 'Error', description: message, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCardInputChange = (field: keyof typeof cardDetails, value: string) => {
    let formattedValue = value;

    // Format card number (space every 4 digits)
    if (field === 'cardNumber') {
      formattedValue = value
        .replace(/\s/g, '')
        .replace(/(\d{4})/g, '$1 ')
        .trim();
    }

    // Format expiry date (MM/YY)
    if (field === 'expiryDate') {
      formattedValue = value
        .replace(/\D/g, '')
        .replace(/(\d{2})(\d{0,2})/, '$1/$2')
        .substring(0, 5);
    }

    // Limit CVV to 4 digits
    if (field === 'cvv') {
      formattedValue = value.replace(/\D/g, '').substring(0, 4);
    }

    setCardDetails(prev => ({ ...prev, [field]: formattedValue }));
  };

  const validateCardDetails = (): boolean => {
    if (!cardDetails.cardNumber || cardDetails.cardNumber.replace(/\s/g, '').length !== 16) {
      toast({ title: 'Invalid Card Number', description: 'Please enter a valid 16-digit card number', variant: 'destructive' });
      return false;
    }

    if (!cardDetails.cardHolder || cardDetails.cardHolder.trim().length < 3) {
      toast({ title: 'Invalid Cardholder Name', description: 'Please enter the cardholder name', variant: 'destructive' });
      return false;
    }

    if (!cardDetails.expiryDate || cardDetails.expiryDate.length !== 5) {
      toast({ title: 'Invalid Expiry Date', description: 'Please enter a valid expiry date (MM/YY)', variant: 'destructive' });
      return false;
    }

    if (!cardDetails.cvv || cardDetails.cvv.length < 3) {
      toast({ title: 'Invalid CVV', description: 'Please enter a valid CVV', variant: 'destructive' });
      return false;
    }

    return true;
  };

  const handleMockPurchase = async () => {
    if (!validateCardDetails()) return;
    if (!user || !ruleId) return;

    setIsPurchasing(true);
    try {
      // Simulate payment processing delay
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Mock successful purchase - call API to record purchase
      await api.mockPurchaseRule(ruleId);
      
      // Generate mock order ID
      const mockOrderId = `ORD-${Date.now()}`;
      setOrderId(mockOrderId);
      setPurchaseComplete(true);

      toast({
        title: 'Purchase Successful!',
        description: `Order ID: ${mockOrderId}. You now have full access to this rule.`,
      });

      // Auto-redirect to rule detail after 3 seconds
      setTimeout(() => {
        navigate(`/rules/${ruleId}`);
      }, 3000);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Purchase failed. Please try again.';
      toast({ title: 'Purchase Failed', description: message, variant: 'destructive' });
    } finally {
      setIsPurchasing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading purchase details...</p>
        </div>
      </div>
    );
  }

  if (error || !rule) {
    return (
      <div className="min-h-screen bg-background p-6 flex items-center justify-center">
        <div className="text-center">
          <Alert variant="destructive" className="max-w-md mb-4">
            <AlertCircle className="w-4 h-4" />
            <AlertDescription>{error || 'Rule not found'}</AlertDescription>
          </Alert>
          <Link to="/rules">
            <Button>Back to Rules</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (purchaseComplete) {
    return (
      <div className="min-h-screen bg-background p-6 flex items-center justify-center">
        <Card className="w-full max-w-md border-success/30 bg-success/5">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <CheckCircle2 className="w-16 h-16 text-success" />
            </div>
            <CardTitle className="text-2xl text-success">Purchase Successful!</CardTitle>
            <CardDescription>Your access has been granted</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-muted/50 p-4 rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">Order ID</p>
              <p className="font-mono text-sm font-semibold">{orderId}</p>
            </div>
            <p className="text-sm text-muted-foreground text-center">
              Redirecting to rule details in a moment...
            </p>
            <Button
              onClick={() => navigate(`/rules/${ruleId}`)}
              className="w-full"
            >
              View Rule Now
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const price = rule?.price || rule?.pricing?.price || 0;
  const tax = price * 0.1; // 10% tax for demo
  const total = price + tax;

  return (
    <div className="min-h-screen bg-background p-6 animate-fade-in">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
        <Link to={`/rules/${rule ? titleToSlug(rule.title) : ruleId}`} className="hover:text-foreground transition-colors">
          <ArrowLeft className="w-4 h-4 inline mr-1" />
          Back to Rule
        </Link>
        <span>/</span>
        <span className="text-foreground">Purchase</span>
      </div>

      <div className="grid gap-6 lg:grid-cols-2 max-w-6xl">
        {/* Order Summary */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Rule Details */}
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Rule</p>
                  <p className="font-semibold">{rule.title}</p>
                </div>
                <Separator />

                {/* Pricing Breakdown */}
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Price</span>
                    <span>${price.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tax (10%)</span>
                    <span>${tax.toFixed(2)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-semibold text-base">
                    <span>Total</span>
                    <span>${total.toFixed(2)}</span>
                  </div>
                </div>

                <Separator />

                {/* What You Get */}
                <div className="space-y-2">
                  <p className="text-sm font-medium">What You Get:</p>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-success" />
                      <span>Full rule content and documentation</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-success" />
                      <span>Complete version history</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-success" />
                      <span>Access to all reviews</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-success" />
                      <span>Ability to download and fork</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-success" />
                      <span>Lifetime access</span>
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Info Banner */}
          <Alert className="bg-primary/5 border-primary/30">
            <Lock className="w-4 h-4" />
            <AlertDescription>
              This is a mock payment flow for demonstration. No real charge will be made.
            </AlertDescription>
          </Alert>
        </div>

        {/* Payment Form */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                Payment Details
              </CardTitle>
              <CardDescription>Enter your card information (mock demo)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Test Card Info */}
              <div className="bg-muted/50 p-4 rounded-lg space-y-2">
                <p className="text-sm font-medium">Test Card (Demo)</p>
                <p className="font-mono text-sm">4532 1234 5678 9010</p>
                <p className="text-xs text-muted-foreground">
                  Use any date in the future and any 3-4 digit CVV
                </p>
              </div>

              <Separator />

              {/* Card Number */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Card Number</label>
                <Input
                  placeholder="4532 1234 5678 9010"
                  value={cardDetails.cardNumber}
                  onChange={(e) => handleCardInputChange('cardNumber', e.target.value)}
                  maxLength={19}
                  disabled={isPurchasing}
                />
              </div>

              {/* Cardholder Name */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Cardholder Name</label>
                <Input
                  placeholder="John Doe"
                  value={cardDetails.cardHolder}
                  onChange={(e) => handleCardInputChange('cardHolder', e.target.value)}
                  disabled={isPurchasing}
                />
              </div>

              {/* Expiry & CVV */}
              <div className="grid gap-4 grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Expiry Date</label>
                  <Input
                    placeholder="MM/YY"
                    value={cardDetails.expiryDate}
                    onChange={(e) => handleCardInputChange('expiryDate', e.target.value)}
                    disabled={isPurchasing}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">CVV</label>
                  <Input
                    placeholder="123"
                    value={cardDetails.cvv}
                    onChange={(e) => handleCardInputChange('cvv', e.target.value)}
                    type="password"
                    disabled={isPurchasing}
                  />
                </div>
              </div>

              <Separator />

              {/* Important Note */}
              <Alert>
                <AlertCircle className="w-4 h-4" />
                <AlertDescription className="text-xs">
                  <strong>Demo Mode:</strong> This payment is simulated. After clicking "Complete Purchase", 
                  you will immediately gain access to the rule without any real charge.
                </AlertDescription>
              </Alert>

              {/* Purchase Button */}
              <Button
                onClick={handleMockPurchase}
                disabled={isPurchasing || !cardDetails.cardNumber || !cardDetails.cardHolder}
                className="w-full"
                size="lg"
              >
                {isPurchasing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing Payment...
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4 mr-2" />
                    Complete Purchase - ${total.toFixed(2)}
                  </>
                )}
              </Button>

              {/* Security Note */}
              <p className="text-xs text-muted-foreground text-center">
                🔒 Secure mock payment. This is a demonstration only.
              </p>
            </CardContent>
          </Card>

          {/* FAQ */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Frequently Asked Questions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div>
                <p className="font-medium mb-1">What payment methods do you accept?</p>
                <p className="text-muted-foreground">Currently supporting credit cards. More options coming soon.</p>
              </div>
              <Separator />
              <div>
                <p className="font-medium mb-1">Is this purchase one-time?</p>
                <p className="text-muted-foreground">Yes, this is a one-time payment for lifetime access to the rule.</p>
              </div>
              <Separator />
              <div>
                <p className="font-medium mb-1">Can I get a refund?</p>
                <p className="text-muted-foreground">Refunds are available within 30 days of purchase.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
