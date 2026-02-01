import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertCircle } from 'lucide-react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import { api } from '@/services/api';
import { useToast } from '@/hooks/use-toast';
import StripePaymentForm from './StripePaymentForm';
import PayPalPaymentForm from './PayPalPaymentForm';

// Initialize Stripe (use import.meta.env for Vite, with VITE_ prefix)
const stripePromise = loadStripe(import.meta.env.VITE_REACT_APP_STRIPE_PUBLIC_KEY || 'pk_test_default');

interface AddPaymentMethodModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function AddPaymentMethodModal({ isOpen, onClose, onSuccess }: AddPaymentMethodModalProps) {
  const { toast } = useToast();
  const [selectedProvider, setSelectedProvider] = useState<string>('stripe');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleFormSuccess = async (
    token: string,
    details: any
  ) => {
    setIsSubmitting(true);
    setError('');

    try {
      const payload: any = {
        provider: selectedProvider,
      };

      if (selectedProvider === 'stripe') {
        payload.paymentMethodId = token;
      } else if (selectedProvider === 'paypal') {
        payload.setupTokenId = token;
      }

      await api.addPaymentMethod(payload);

      toast({
        title: 'Success',
        description: 'Payment method added successfully',
      });

      onSuccess();
      onClose();
      setSelectedProvider('stripe');
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to add payment method';
      setError(errorMessage);
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFormError = (errorMsg: string) => {
    setError(errorMsg);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add Payment Method</DialogTitle>
          <DialogDescription>
            Choose a payment provider and add your payment method securely
          </DialogDescription>
        </DialogHeader>

        {error && !isSubmitting && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">Payment Provider</label>
            <Select value={selectedProvider} onValueChange={setSelectedProvider} disabled={isSubmitting}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="stripe">
                  <div className="flex items-center gap-2">
                    💳 Stripe (Credit/Debit Card)
                  </div>
                </SelectItem>
                <SelectItem value="paypal">
                  <div className="flex items-center gap-2">
                    🅿️ PayPal
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {selectedProvider === 'stripe' && (
            <Elements stripe={stripePromise}>
              <StripePaymentForm
                onSuccess={handleFormSuccess}
                onError={handleFormError}
                isLoading={isSubmitting}
              />
            </Elements>
          )}

          {selectedProvider === 'paypal' && (
            <PayPalPaymentForm
              onSuccess={handleFormSuccess}
              onError={handleFormError}
              isLoading={isSubmitting}
            />
          )}

          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
        </div>

        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
          <p className="text-xs text-blue-800">
            <strong>🔒 Security Notice:</strong> Your payment information is encrypted and tokenized by
            the payment provider. We never store your full card details or payment credentials on our
            servers.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}


export default AddPaymentMethodModal;
