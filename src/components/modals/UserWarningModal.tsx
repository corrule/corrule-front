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
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, Loader2, CheckCircle, AlertTriangle } from 'lucide-react';
import { api } from '@/services/api';
import { useToast } from '@/hooks/use-toast';

interface UserWarningModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  userName: string;
  onSuccess?: () => void;
}

type SeverityLevel = 'low' | 'medium' | 'high';

interface SeverityInfo {
  description: string;
  consequences: string[];
  icon: React.ReactNode;
}

export function UserWarningModal({
  open,
  onOpenChange,
  userId,
  userName,
  onSuccess,
}: UserWarningModalProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [reason, setReason] = useState('');
  const [severity, setSeverity] = useState<SeverityLevel>('medium');
  const [step, setStep] = useState<'reason' | 'severity' | 'review' | 'success'>('reason');

  const severityInfo: Record<SeverityLevel, SeverityInfo> = {
    low: {
      description: 'Minor violation or first-time offense',
      consequences: [
        'Warning recorded in user account',
        'Email notification sent to user',
        'No account restrictions',
      ],
      icon: <AlertCircle className="w-5 h-5 text-blue-600" />,
    },
    medium: {
      description: 'Repeated violations or moderate misconduct',
      consequences: [
        'Warning recorded in user account',
        'Email notification sent to user',
        'Account flagged for review',
        'Possible future restrictions',
      ],
      icon: <AlertTriangle className="w-5 h-5 text-amber-600" />,
    },
    high: {
      description: 'Severe violations or serious misconduct',
      consequences: [
        'Warning recorded in user account',
        'Email notification sent to user',
        'Account temporarily disabled',
        'Review by admin team required for reinstatement',
      ],
      icon: <AlertCircle className="w-5 h-5 text-red-600" />,
    },
  };

  const commonReasons = [
    'Submitted low-quality rules',
    'Plagiarized or copied rule content',
    'Inappropriate comments or reviews',
    'Spam or abusive behavior',
    'Multiple policy violations',
    'Suspicious account activity',
    'Violating community guidelines',
    'Other (specify below)',
  ];

  const handleWarnUser = async () => {
    if (!reason.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Please provide a reason for the warning',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      await api.warnUser(userId, reason, severity);

      toast({
        title: 'Success',
        description: `${userName} has been warned successfully`,
      });

      setStep('success');
      setTimeout(() => {
        onOpenChange(false);
        onSuccess?.();
        // Reset state for next use
        setStep('reason');
        setReason('');
        setSeverity('medium');
      }, 1500);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to warn user',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Warn User</DialogTitle>
          <DialogDescription>
            Issue a warning to {userName} for policy violations
          </DialogDescription>
        </DialogHeader>

        {step === 'reason' && (
          <div className="space-y-6 py-4">
            {/* User Info */}
            <Card className="bg-slate-50">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">User Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold">
                    {userName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-semibold">{userName}</p>
                    <p className="text-sm text-muted-foreground">ID: {userId}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Reason Selection */}
            <div className="space-y-3">
              <Label className="text-base font-semibold">Reason for Warning</Label>
              <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto p-2 border rounded-lg bg-background">
                {commonReasons.map((commonReason) => (
                  <button
                    key={commonReason}
                    onClick={() => setReason(commonReason === 'Other (specify below)' ? '' : commonReason)}
                    className={`p-2 rounded text-sm text-left transition ${
                      reason === commonReason
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-slate-50 border border-input hover:bg-accent'
                    }`}
                  >
                    {commonReason}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Reason */}
            <div className="space-y-2">
              <Label htmlFor="warning-reason" className="text-sm">
                Detailed Reason / Additional Notes
              </Label>
              <Textarea
                id="warning-reason"
                placeholder="Provide specific details about the violation..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={4}
                className="resize-none"
              />
              <p className="text-xs text-muted-foreground">
                This will be recorded in the user's warning history and visible to admins
              </p>
            </div>
          </div>
        )}

        {step === 'severity' && (
          <div className="space-y-6 py-4">
            {/* Reason Summary */}
            <Card className="bg-blue-50 border-blue-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Warning Reason</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{reason}</p>
              </CardContent>
            </Card>

            {/* Severity Selection */}
            <div className="space-y-3">
              <Label className="text-base font-semibold">Warning Severity Level</Label>
              <div className="space-y-2">
                {(['low', 'medium', 'high'] as const).map((level) => (
                  <button
                    key={level}
                    onClick={() => setSeverity(level)}
                    className={`w-full p-4 rounded-lg border-2 text-left transition ${
                      severity === level
                        ? 'border-primary bg-primary bg-opacity-5'
                        : 'border-input hover:border-primary'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-1 flex-shrink-0">
                        {severityInfo[level].icon}
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold capitalize mb-1">{level} Severity</p>
                        <p className="text-sm text-muted-foreground mb-2">
                          {severityInfo[level].description}
                        </p>
                        <div className="text-xs space-y-1">
                          <p className="font-medium text-foreground">Consequences:</p>
                          <ul className="list-disc list-inside text-muted-foreground space-y-0.5">
                            {severityInfo[level].consequences.map((consequence, idx) => (
                              <li key={idx}>{consequence}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {severity === 'high' && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex gap-3">
                <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-red-900">
                  <p className="font-medium mb-1">High Severity Warning</p>
                  <p>
                    This will temporarily disable the user's account. They can appeal by contacting support.
                    An admin will review the case for potential reinstatement.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {step === 'review' && (
          <div className="space-y-6 py-4">
            <Card>
              <CardHeader>
                <CardTitle>Confirm Warning Details</CardTitle>
                <CardDescription>Review before issuing warning</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4">
                  <div className="p-3 bg-slate-50 rounded-lg">
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">
                      User
                    </p>
                    <p className="font-semibold mt-1">{userName}</p>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-lg">
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">
                      Reason
                    </p>
                    <p className="mt-1 text-sm">{reason}</p>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-lg">
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">
                      Severity Level
                    </p>
                    <div className="mt-1 flex items-center gap-2">
                      {severityInfo[severity].icon}
                      <span className="font-semibold capitalize">{severity}</span>
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-900">
                    ✓ The user will receive an email notification<br />
                    ✓ This warning will be recorded in their account history<br />
                    ✓ All admins can see this warning in user details
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
              <h3 className="text-xl font-semibold">Warning Issued Successfully</h3>
              <p className="text-muted-foreground">
                {userName} has been notified of the warning and it has been recorded in their account history.
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
                  setStep('reason');
                  setReason('');
                  setSeverity('medium');
                }}
                disabled={loading}
              >
                Cancel
              </Button>

              {step === 'reason' && (
                <Button
                  onClick={() => setStep('severity')}
                  disabled={!reason.trim()}
                >
                  Continue
                </Button>
              )}

              {step === 'severity' && (
                <>
                  <Button variant="outline" onClick={() => setStep('reason')}>
                    Back
                  </Button>
                  <Button onClick={() => setStep('review')}>
                    Review Warning
                  </Button>
                </>
              )}

              {step === 'review' && (
                <>
                  <Button variant="outline" onClick={() => setStep('severity')}>
                    Back
                  </Button>
                  <Button onClick={handleWarnUser} disabled={loading} variant="destructive">
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Issuing Warning...
                      </>
                    ) : (
                      'Issue Warning'
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
