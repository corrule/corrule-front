import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PaymentMethods } from '@/components/billing/PaymentMethods';
import { PaymentHistory } from '@/components/billing/PaymentHistory';
import { CreditCard, History } from 'lucide-react';

export default function BillingPage() {
  const [activeTab, setActiveTab] = useState('payment-methods');

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground">Billing</h1>
          <p className="text-muted-foreground mt-2">
            Manage your payment methods and view your transaction history
          </p>
        </div>

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-8">
            <TabsTrigger value="payment-methods" className="gap-2">
              <CreditCard className="w-4 h-4" />
              <span className="hidden sm:inline">Payment Methods</span>
              <span className="sm:hidden">Methods</span>
            </TabsTrigger>
            <TabsTrigger value="payment-history" className="gap-2">
              <History className="w-4 h-4" />
              <span className="hidden sm:inline">Payment History</span>
              <span className="sm:hidden">History</span>
            </TabsTrigger>
          </TabsList>

          {/* Payment Methods Tab */}
          <TabsContent value="payment-methods" className="space-y-6 mt-6">
            <PaymentMethods />
          </TabsContent>

          {/* Payment History Tab */}
          <TabsContent value="payment-history" className="space-y-6 mt-6">
            <PaymentHistory />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}