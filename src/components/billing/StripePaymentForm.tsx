import React, { useState } from 'react';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertCircle, CheckCircle } from 'lucide-react';

interface StripePaymentFormProps {
  onSuccess: (paymentMethodId: string, details: any) => void;
  onError: (error: string) => void;
  isLoading?: boolean;
}

export function StripePaymentForm({ onSuccess, onError, isLoading = false }: StripePaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();

  const [cardholderName, setCardholderName] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [processing, setProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (!stripe || !elements) {
      setError('Stripe is not loaded. Please refresh the page.');
      return;
    }

    if (!cardholderName.trim()) {
      setError('Cardholder name is required');
      return;
    }

    setProcessing(true);

    try {
      const cardElement = elements.getElement(CardElement);

      if (!cardElement) {
        throw new Error('Card element not found');
      }

      // Create payment method - this tokenizes the card
      const { paymentMethod, error: pmError } = await stripe.createPaymentMethod({
        type: 'card',
        card: cardElement,
        billing_details: {
          name: cardholderName,
        },
      });

      if (pmError) {
        throw new Error(pmError.message);
      }

      if (!paymentMethod) {
        throw new Error('Failed to create payment method');
      }

      setSuccess(true);

      // Call parent callback with token (NOT raw card data)
      onSuccess(paymentMethod.id, {
        brand: paymentMethod.card?.brand?.toUpperCase(),
        last4: paymentMethod.card?.last4,
        expMonth: paymentMethod.card?.exp_month,
        expYear: paymentMethod.card?.exp_year,
      });

      // Reset form
      setTimeout(() => {
        setCardholderName('');
        cardElement.clear();
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

  const cardElementOptions = {
    style: {
      base: {
        fontSize: '16px',
        color: '#424770',
        '::placeholder': {
          color: '#aab7c4',
        },
      },
      invalid: {
        color: '#fa755a',
      },
    },
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

      <div className="border border-input rounded-md p-3 bg-background">
        <label className="text-sm font-medium text-foreground mb-2 block">Card Details</label>
        <CardElement options={cardElementOptions} />
      </div>

      <Button
        type="submit"
        disabled={!stripe || processing || isLoading || success}
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
        Your card information is securely processed by Stripe. We never see your full card details.
      </p>
    </form>
  );
}

export default StripePaymentForm;
