import { useState } from 'react';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertCircle, Loader2, CheckCircle } from 'lucide-react';
import { api } from '@/services/api';
import { useToast } from '@/hooks/use-toast';

interface PublishRuleModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ruleId: string;
  ruleName: string;
  onSuccess?: () => void;
}

type VisibilityType = 'PUBLIC' | 'PRIVATE' | 'PAID';

interface PricingConfig {
  isPaid: boolean;
  price?: number;
}

export function PublishRuleModal({
  open,
  onOpenChange,
  ruleId,
  ruleName,
  onSuccess,
}: PublishRuleModalProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [visibility, setVisibility] = useState<VisibilityType>('PUBLIC');
  const [price, setPrice] = useState<string>('');
  const [step, setStep] = useState<'config' | 'review' | 'success'>('config');

  const isPaid = visibility === 'PAID';
  const priceNum = isPaid ? parseFloat(price) || 0 : 0;

  const handlePublish = async () => {
    if (isPaid && (!price || parseFloat(price) <= 0)) {
      toast({
        title: 'Validation Error',
        description: 'Please enter a valid price for paid rules',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const pricingConfig: PricingConfig = isPaid
        ? { isPaid: true, price: priceNum }
        : { isPaid: false };

      await api.publishRule(ruleId, visibility, pricingConfig);

      toast({
        title: 'Success',
        description: `Your rule "${ruleName}" has been submitted for review!`,
      });

      setStep('success');
      setTimeout(() => {
        onOpenChange(false);
        onSuccess?.();
        // Reset state for next use
        setStep('config');
        setVisibility('PUBLIC');
        setPrice('');
      }, 1500);
    } catch (error: any) {
      // Handle "already published" case gracefully
      if (error.message && error.message.includes('Only draft rules can be published')) {
        toast({
          title: 'Already Submitted',
          description: `Your rule "${ruleName}" has already been submitted for review. You can track its status in My Rules.`,
        });
        setTimeout(() => {
          onOpenChange(false);
          onSuccess?.();
          setStep('config');
          setVisibility('PUBLIC');
          setPrice('');
        }, 2000);
      } else {
        toast({
          title: 'Error',
          description: error.message || 'Failed to publish rule',
          variant: 'destructive',
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const visibilityDescriptions: Record<VisibilityType, string> = {
    PUBLIC: 'Anyone can view and download your rule for free',
    PRIVATE: 'Only you and shared users can access this rule',
    PAID: 'Users must purchase to access your rule',
  };

  const pricingTiers = [
    { price: 9.99, description: 'Entry level' },
    { price: 19.99, description: 'Standard' },
    { price: 29.99, description: 'Premium' },
    { price: 49.99, description: 'Enterprise' },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Publish Rule</DialogTitle>
          <DialogDescription>
            Submit "{ruleName}" for public review and distribution
          </DialogDescription>
        </DialogHeader>

        {step === 'config' && (
          <div className="space-y-6 py-4">
            <div className="space-y-3">
              <Label className="text-base font-semibold">Visibility Level</Label>
              <Tabs value={visibility} onValueChange={(v) => setVisibility(v as VisibilityType)}>
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="PUBLIC">Public</TabsTrigger>
                  <TabsTrigger value="PRIVATE">Private</TabsTrigger>
                  <TabsTrigger value="PAID">Paid</TabsTrigger>
                </TabsList>

                <TabsContent value="PUBLIC" className="mt-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Public Rule</CardTitle>
                      <CardDescription>{visibilityDescriptions.PUBLIC}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg flex gap-3">
                        <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                        <div className="text-sm space-y-1">
                          <p className="font-medium">Best for:</p>
                          <ul className="list-disc list-inside text-slate-700">
                            <li>Open-source threat detection</li>
                            <li>Community contributions</li>
                            <li>Building your reputation</li>
                          </ul>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="PRIVATE" className="mt-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Private Rule</CardTitle>
                      <CardDescription>{visibilityDescriptions.PRIVATE}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg flex gap-3">
                        <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                        <div className="text-sm space-y-1">
                          <p className="font-medium">Best for:</p>
                          <ul className="list-disc list-inside text-slate-700">
                            <li>Organization-specific rules</li>
                            <li>Internal security tools</li>
                            <li>Testing before public release</li>
                          </ul>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="PAID" className="mt-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Paid Rule</CardTitle>
                      <CardDescription>{visibilityDescriptions.PAID}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="p-3 bg-green-50 border border-green-200 rounded-lg flex gap-3">
                        <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                        <div className="text-sm space-y-1">
                          <p className="font-medium">Best for:</p>
                          <ul className="list-disc list-inside text-slate-700">
                            <li>Advanced threat detection rules</li>
                            <li>Enterprise-grade security tools</li>
                            <li>Monetizing your expertise</li>
                          </ul>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <Label htmlFor="custom-price">Custom Price</Label>
                        <div className="flex items-center gap-2">
                          <span className="text-lg font-semibold">$</span>
                          <Input
                            id="custom-price"
                            type="number"
                            min="0.99"
                            max="999.99"
                            step="0.01"
                            placeholder="29.99"
                            value={price}
                            onChange={(e) => setPrice(e.target.value)}
                            className="flex-1"
                          />
                        </div>
                        <p className="text-xs text-slate-700">
                          You earn 10% of each purchase (${(priceNum * 0.1).toFixed(2)} per sale)
                        </p>
                      </div>

                      <div className="space-y-2">
                        <p className="text-sm font-medium">Suggested prices:</p>
                        <div className="grid grid-cols-2 gap-2">
                          {pricingTiers.map((tier) => (
                            <button
                              key={tier.price}
                              onClick={() => setPrice(tier.price.toString())}
                              className={`p-2 rounded border text-sm transition ${
                                priceNum === tier.price
                                  ? 'bg-primary text-primary-foreground border-primary'
                                  : 'bg-background border-input hover:bg-accent'
                              }`}
                            >
                              <div className="font-semibold">${tier.price.toFixed(2)}</div>
                              <div className="text-xs opacity-75">{tier.description}</div>
                            </button>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>

            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-900">
                <strong>Next step:</strong> Your rule will be submitted to our moderation team for review.
                This typically takes 24-48 hours.
              </p>
            </div>
          </div>
        )}

        {step === 'review' && (
          <div className="space-y-6 py-4">
            <Card>
              <CardHeader>
                <CardTitle>Confirm Publication Details</CardTitle>
                <CardDescription>Review your rule settings before submission</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-slate-50 rounded-lg">
                    <p className="text-xs text-black font-semibold uppercase tracking-wide">
                      Rule Name
                    </p>
                    <p className="font-semibold mt-1 text-black">{ruleName}</p>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-lg">
                    <p className="text-xs text-black font-semibold uppercase tracking-wide">
                      Visibility
                    </p>
                    <p className="font-semibold mt-1 text-black">{visibility}</p>
                  </div>

                  {isPaid && (
                    <>
                      <div className="p-3 bg-slate-50 rounded-lg">
                        <p className="text-xs text-black font-semibold uppercase tracking-wide">
                          Price
                        </p>
                        <p className="font-semibold mt-1 text-lg text-green-700">
                          ${priceNum.toFixed(2)}
                        </p>
                      </div>

                      <div className="p-3 bg-slate-50 rounded-lg">
                        <p className="text-xs text-black font-semibold uppercase tracking-wide">
                          Your Earning per Sale
                        </p>
                        <p className="font-semibold mt-1 text-green-700">
                          ${(priceNum * 0.1).toFixed(2)}
                        </p>
                      </div>
                    </>
                  )}
                </div>

                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <p className="text-sm text-amber-900">
                    ✓ Your rule will be reviewed by our moderation team<br />
                    ✓ It will appear in the Rules Marketplace upon approval<br />
                    ✓ You can edit settings after publication
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
              <h3 className="text-xl font-semibold text-black">Rule Submitted Successfully!</h3>
              <p className="text-slate-700">
                Your rule is now in our review queue. You'll receive an email notification
                when it's been reviewed.
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
                  setStep('config');
                  setVisibility('PUBLIC');
                  setPrice('');
                }}
                disabled={loading}
              >
                Cancel
              </Button>

              {step === 'config' && (
                <Button
                  onClick={() => setStep('review')}
                  disabled={isPaid && (!price || parseFloat(price) <= 0)}
                >
                  Continue
                </Button>
              )}

              {step === 'review' && (
                <>
                  <Button variant="outline" onClick={() => setStep('config')}>
                    Back
                  </Button>
                  <Button onClick={handlePublish} disabled={loading}>
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Publishing...
                      </>
                    ) : (
                      'Publish Rule'
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
