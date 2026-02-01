import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertCircle, CheckCircle, Info } from 'lucide-react';

interface StripePaymentFormProps {
  onSuccess: (paymentMethodId: string, details: any) => void;
  onError: (error: string) => void;
  isLoading?: boolean;
}

export function StripePaymentForm({ onSuccess, onError, isLoading = false }: StripePaymentFormProps) {
  const [cardholderName, setCardholderName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvc, setCardCvc] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [processing, setProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (!cardholderName.trim()) {
      setError('Cardholder name is required');
      return;
    }

    if (!cardNumber || !cardExpiry || !cardCvc) {
      setError('Please fill in all card details');
      return;
    }

    setProcessing(true);

    try {
      // Validate card format
      const cardDigits = cardNumber.replace(/\s/g, '');
      if (cardDigits.length < 13 || cardDigits.length > 19) {
        throw new Error('Invalid card number');
      }

      if (cardCvc.length < 3 || cardCvc.length > 4) {
        throw new Error('Invalid CVC');
      }

      const [month, year] = cardExpiry.split('/');
      if (!month || !year || parseInt(month) > 12) {
        throw new Error('Invalid expiry date');
      }

      // Extract card brand from first digit
      const firstDigit = cardDigits[0];
      let brand = 'unknown';
      if (firstDigit === '4') brand = 'visa';
      else if (firstDigit === '5') brand = 'mastercard';
      else if (firstDigit === '3') brand = 'amex';
      else if (firstDigit === '6') brand = 'discover';

      // In production with Stripe.js installed, this would call stripe.createPaymentMethod()
      // For now, generate a mock token
      const mockToken = `pm_test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      setSuccess(true);

      // Call parent callback with token (NOT raw card data)
      onSuccess(mockToken, {
        brand: brand.toUpperCase(),
        last4: cardDigits.slice(-4),
        expMonth: parseInt(month),
        expYear: parseInt('20' + year),
      });

      // Reset form
      setTimeout(() => {
        setCardholderName('');
        setCardNumber('');
        setCardExpiry('');
        setCardCvc('');
        setSuccess(false);
      }, 1500);
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to create payment method';
      setError(errorMessage);
      onError(errorMessage);
    } finally {
      setProcessing(false);
    }
  };

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const parts = [];
    for (let i = 0; i < v.length; i += 4) {
      parts.push(v.substring(i, i + 4));
    }
    return parts.join(' ');
  };

  const formatExpiry = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    if (v.length >= 2) {
      return v.slice(0, 2) + '/' + v.slice(2, 4);
    }
    return v;
  };

  const formatCvc = (value: string) => {
    return value.replace(/\s+/g, '').replace(/[^0-9]/gi, '').slice(0, 4);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert variant="default" className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            Payment method added successfully!
          </AlertDescription>
        </Alert>
      )}

      <Alert variant="default" className="border-blue-200 bg-blue-50">
        <Info className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-800 text-xs">
          Development mode: To install full Stripe integration, run: <code className="bg-blue-100 px-1 rounded">npm install @stripe/react-stripe-js @stripe/js</code>
        </AlertDescription>
      </Alert>

      <div>
        <label className="text-sm font-medium text-foreground mb-2 block">Cardholder Name</label>
        <Input
          type="text"
          placeholder="John Doe"
          value={cardholderName}
          onChange={(e) => setCardholderName(e.target.value)}
          disabled={processing || isLoading}
          required
        />
      </div>

      <div>
        <label className="text-sm font-medium text-foreground mb-2 block">Card Number</label>
        <Input
          type="text"
          placeholder="1234 5678 9012 3456"
          value={formatCardNumber(cardNumber)}
          onChange={(e) => setCardNumber(e.target.value)}
          disabled={processing || isLoading}
          required
          maxLength={19}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-sm font-medium text-foreground mb-2 block">Expiry</label>
          <Input
            type="text"
            placeholder="MM/YY"
            value={cardExpiry}
            onChange={(e) => setCardExpiry(formatExpiry(e.target.value))}
            disabled={processing || isLoading}
            required
            maxLength={5}
          />
        </div>
        <div>
          <label className="text-sm font-medium text-foreground mb-2 block">CVC</label>
          <Input
            type="text"
            placeholder="123"
            value={cardCvc}
            onChange={(e) => setCardCvc(formatCvc(e.target.value))}
            disabled={processing || isLoading}
            required
            maxLength={4}
          />
        </div>
      </div>

      <Button
        type="submit"
        disabled={processing || isLoading || success}
        className="w-full"
      >
        {processing || isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Adding Card...
          </>
        ) : success ? (
          <>
            <CheckCircle className="mr-2 h-4 w-4" />
            Card Added!
          </>
        ) : (
          'Add Card'
        )}
      </Button>

      <p className="text-xs text-muted-foreground text-center">
        Your card information is securely processed. Full Stripe integration coming soon.
      </p>
    </form>
  );
}

export default StripePaymentForm;
