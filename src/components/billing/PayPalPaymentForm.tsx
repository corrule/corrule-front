import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertCircle, CheckCircle } from 'lucide-react';

interface PayPalPaymentFormProps {
  onSuccess: (setupTokenId: string, details: any) => void;
  onError: (error: string) => void;
  isLoading?: boolean;
}

declare global {
  interface Window {
    paypal?: any;
  }
}

export function PayPalPaymentForm({ onSuccess, onError, isLoading = false }: PayPalPaymentFormProps) {
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [paypalReady, setPaypalReady] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Check if PayPal SDK is loaded
    if (window.paypal?.Subscription) {
      setPaypalReady(true);
      renderPayPalButtons();
    } else {
      // Try again after a delay
      const timer = setTimeout(() => {
        if (window.paypal?.Subscription) {
          setPaypalReady(true);
          renderPayPalButtons();
        } else {
          setError('PayPal SDK not loaded. Please refresh the page.');
        }
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, []);

  const renderPayPalButtons = () => {
    if (!window.paypal?.Subscription || !containerRef.current) return;

    containerRef.current.innerHTML = '';

    window.paypal.Subscription.setup({
      client: {
        sandbox: process.env.REACT_APP_PAYPAL_CLIENT_ID,
      },
      subscribe: function (token: any) {
        // This is called after PayPal approval
        handlePayPalApproval(token);
      },
    });
  };

  const handlePayPalApproval = async (token: string) => {
    setProcessing(true);
    setError('');

    try {
      // PayPal returns a billing plan token
      setSuccess(true);

      onSuccess(token, {
        brand: 'PAYPAL',
        paymentType: 'paypal',
      });

      setTimeout(() => {
        setSuccess(false);
      }, 1500);
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to setup PayPal payment';
      setError(errorMessage);
      onError(errorMessage);
    } finally {
      setProcessing(false);
    }
  };

  if (!paypalReady) {
    return (
      <div className="text-center py-8">
        <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
        <p className="text-sm text-muted-foreground">Loading PayPal...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
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
            PayPal account linked successfully!
          </AlertDescription>
        </Alert>
      )}

      <div ref={containerRef} className="border border-input rounded-md p-4 bg-background min-h-[50px]">
        {/* PayPal buttons will be rendered here */}
      </div>

      <p className="text-xs text-muted-foreground text-center">
        Your PayPal information is securely handled by PayPal. We only store a token to process
        payments.
      </p>
    </div>
  );
}

export default PayPalPaymentForm;
