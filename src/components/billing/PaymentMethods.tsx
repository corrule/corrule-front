import React, { useState, useEffect } from 'react';
import { CreditCard, Plus, Trash2, Check, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/services/api';
import { AddPaymentMethodModal } from './AddPaymentMethodModal';

interface PaymentMethod {
  _id: string;
  provider: 'stripe' | 'paypal';
  last4?: string;
  brand: string;
  paymentType: string;
  expiryMonth?: number;
  expiryYear?: number;
  isDefault: boolean;
  isActive: boolean;
  createdAt: string;
}

export function PaymentMethods() {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [settingDefault, setSettingDefault] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchPaymentMethods();
  }, []);

  const fetchPaymentMethods = async () => {
    try {
      setLoading(true);
      const data = await api.getPaymentMethods();
      setPaymentMethods(data || []);
    } catch (error) {
      console.error('Error fetching payment methods:', error);
      toast({
        title: 'Error',
        description: 'Failed to load payment methods',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePaymentMethod = async (paymentMethodId: string) => {
    if (!confirm('Are you sure you want to delete this payment method?')) {
      return;
    }

    try {
      setDeleting(paymentMethodId);
      await api.deletePaymentMethod(paymentMethodId);
      setPaymentMethods(paymentMethods.filter(pm => pm._id !== paymentMethodId));
      toast({
        title: 'Success',
        description: 'Payment method deleted successfully',
      });
    } catch (error) {
      console.error('Error deleting payment method:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete payment method',
        variant: 'destructive',
      });
    } finally {
      setDeleting(null);
    }
  };

  const handleSetDefault = async (paymentMethodId: string) => {
    try {
      setSettingDefault(paymentMethodId);
      await api.setDefaultPaymentMethod(paymentMethodId);

      setPaymentMethods(paymentMethods.map(pm => ({
        ...pm,
        isDefault: pm._id === paymentMethodId,
      })));

      toast({
        title: 'Success',
        description: 'Default payment method updated',
      });
    } catch (error) {
      console.error('Error setting default payment method:', error);
      toast({
        title: 'Error',
        description: 'Failed to set default payment method',
        variant: 'destructive',
      });
    } finally {
      setSettingDefault(null);
    }
  };

  const getBrandColor = (brand: string) => {
    const colors: Record<string, string> = {
      visa: 'from-blue-600 to-blue-700',
      mastercard: 'from-red-600 to-orange-700',
      amex: 'from-green-600 to-teal-700',
      discover: 'from-orange-600 to-yellow-700',
      paypal: 'from-indigo-600 to-blue-700',
      default: 'from-gray-600 to-gray-700',
    };
    return colors[brand.toLowerCase()] || colors.default;
  };

  const getProviderBadge = (provider: string) => {
    if (provider === 'stripe') {
      return '💳 Stripe';
    } else if (provider === 'paypal') {
      return '🅿️ PayPal';
    }
    return provider;
  };

  return (
    <div className="space-y-6">
      {/* Add Payment Method Button */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Payment Methods</h2>
          <p className="text-muted-foreground text-sm mt-1">
            Manage your saved payment methods for purchases and withdrawals
          </p>
        </div>
        <Button className="gap-2" onClick={() => setIsModalOpen(true)}>
          <Plus className="w-4 h-4" />
          Add Payment Method
        </Button>
      </div>

      {/* Payment Methods List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-muted-foreground">Loading payment methods...</div>
        </div>
      ) : paymentMethods.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <CreditCard className="w-12 h-12 text-muted-foreground" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">No payment methods</h3>
                <p className="text-sm text-muted-foreground">
                  Add a payment method to make purchases and request withdrawals
                </p>
              </div>
              <Button className="mt-4 gap-2" onClick={() => setIsModalOpen(true)}>
                <Plus className="w-4 h-4" />
                Add Your First Payment Method
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {paymentMethods.map((paymentMethod) => (
            <Card key={paymentMethod._id} className="overflow-hidden hover:shadow-md transition-shadow">
              <div className={`bg-gradient-to-br ${getBrandColor(paymentMethod.brand)} p-4 text-white relative min-h-[120px] flex flex-col justify-between`}>
                <div className="flex justify-between items-start">
                  <div>
                    <div className="text-xl font-bold">{paymentMethod.brand.toUpperCase()}</div>
                    <div className="text-xs opacity-90 mt-1">{getProviderBadge(paymentMethod.provider)}</div>
                  </div>
                  {paymentMethod.isDefault && (
                    <div className="bg-white/30 px-2 py-1 rounded text-xs font-semibold flex items-center gap-1">
                      <Check className="w-3 h-3" />
                      Default
                    </div>
                  )}
                </div>
                <div className="text-sm tracking-wider font-mono">
                  •••• •••• •••• {paymentMethod.last4 || '••••'}
                </div>
              </div>

              <CardContent className="p-3 space-y-3">
                {(paymentMethod.expiryMonth && paymentMethod.expiryYear) && (
                  <div className="text-xs text-muted-foreground">
                    Expires {paymentMethod.expiryMonth.toString().padStart(2, '0')}/{paymentMethod.expiryYear % 100}
                  </div>
                )}
                
                {!paymentMethod.isActive && (
                  <Badge variant="secondary" className="w-full text-center justify-center">
                    Inactive
                  </Badge>
                )}

                <div className="flex gap-2">
                  {!paymentMethod.isDefault && paymentMethod.isActive && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 text-xs"
                      disabled={settingDefault === paymentMethod._id}
                      onClick={() => handleSetDefault(paymentMethod._id)}
                    >
                      Set Default
                    </Button>
                  )}
                  <Button
                    variant="destructive"
                    size="sm"
                    className="flex-1 text-xs"
                    disabled={deleting === paymentMethod._id}
                    onClick={() => handleDeletePaymentMethod(paymentMethod._id)}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Security Notice */}
      <Alert>
        <Shield className="w-4 h-4" />
        <AlertDescription className="text-sm">
          <strong>🔒 Security:</strong> We never store raw card data. All payment information is tokenized and encrypted by our payment providers (Stripe, PayPal). Your data is PCI-compliant and secure.
        </AlertDescription>
      </Alert>

      {/* Add Payment Method Modal */}
      <AddPaymentMethodModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchPaymentMethods}
      />
    </div>
  );
}
