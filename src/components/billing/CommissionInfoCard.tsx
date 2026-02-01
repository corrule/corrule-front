import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';
import { API_BASE_URL } from '@/services/api';

interface CommissionConfig {
  adminCommissionPercent: number;
  sellerPercentage: number;
}

export function CommissionInfoCard() {
  const [config, setConfig] = useState<CommissionConfig | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        console.log('💰 CommissionInfoCard: Starting fetch');
        const url = `${API_BASE_URL}/billing/commission-config`;
        console.log('💰 Fetching URL:', url);

        const response = await fetch(url);
        console.log('💰 Response status:', response.status);
        console.log('💰 Response ok:', response.ok);
        console.log('💰 Content-Type:', response.headers.get('content-type'));

        const responseText = await response.text();
        console.log('💰 Raw response (first 500 chars):', responseText.substring(0, 500));

        if (!response.ok) {
          console.error('💰 Full response body:', responseText);
          throw new Error(`Failed to fetch config: ${response.status} ${response.statusText}`);
        }

        let data;
        try {
          data = JSON.parse(responseText);
        } catch (jsonError) {
          console.error('💰 Failed to parse JSON:', jsonError);
          console.error('💰 Response was:', responseText);
          throw new Error(`Invalid JSON response from server`);
        }
        console.log('💰 Response data:', data);
        setConfig(data.data.config);
        console.log('✅ CommissionInfoCard: Data loaded successfully');
      } catch (err) {
        console.error('🔴 Error fetching commission config:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchConfig();
  }, []);

  if (loading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Commission Structure</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (!config) {
    return null;
  }

  // Example calculation
  const examplePrice = 100;
  const adminCut = (examplePrice * config.adminCommissionPercent) / 100;
  const sellerCut = (examplePrice * config.sellerPercentage) / 100;

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Commission Structure</CardTitle>
        <CardDescription>How earnings are distributed from each purchase</CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Commission Split */}
        <div className="space-y-4">
          <div className="text-center space-y-2">
            <p className="text-sm text-muted-foreground">Platform Commission</p>
            <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
              {config.adminCommissionPercent}%
            </p>
            <p className="text-xs text-muted-foreground">Paid to platform administrators</p>
          </div>

          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <div className="flex-1 h-1 bg-orange-500/30 rounded-full"></div>
            <span>vs</span>
            <div className="flex-1 h-1 bg-green-500/30 rounded-full"></div>
          </div>

          <div className="text-center space-y-2">
            <p className="text-sm text-muted-foreground">Creator Earnings</p>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">
              {config.sellerPercentage}%
            </p>
            <p className="text-xs text-muted-foreground">Paid to rule creators</p>
          </div>
        </div>

        {/* Example Calculation */}
        <div className="space-y-3 rounded-lg bg-accent/30 p-4">
          <p className="text-sm font-semibold mb-3">Example: ${examplePrice.toFixed(2)} Sale</p>

          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Purchase Amount:</span>
              <span className="font-medium">${examplePrice.toFixed(2)}</span>
            </div>

            <div className="h-px bg-border my-2"></div>

            <div className="flex items-center justify-between text-orange-600 dark:text-orange-400">
              <span>Platform Commission ({config.adminCommissionPercent}%):</span>
              <span className="font-semibold">${adminCut.toFixed(2)}</span>
            </div>

            <div className="flex items-center justify-between text-green-600 dark:text-green-400">
              <span>Creator Earnings ({config.sellerPercentage}%):</span>
              <span className="font-semibold">${sellerCut.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Info */}
        <div className="rounded-lg bg-blue-500/10 p-3 text-xs text-blue-600 dark:text-blue-400 space-y-1">
          <p>
            <strong>Note:</strong> When you purchase a paid rule, the creator receives{' '}
            <strong>{config.sellerPercentage}%</strong> of the price immediately. The{' '}
            <strong>{config.adminCommissionPercent}%</strong> helps maintain the platform.
          </p>
          <p className="mt-2">
            All earnings are credited to your billing account and can be withdrawn once approved by the admin.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
