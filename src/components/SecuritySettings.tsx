import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Shield, Lock, AlertTriangle, CheckCircle2, Clock } from 'lucide-react';
import { api } from '@/services/api';

interface Security2FAStatus {
  emailBased2FA: {
    enabled: boolean;
  };
  totpBased2FA: {
    enabled: boolean;
  };
}

export default function SecuritySettings() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [twoFAStatus, setTwoFAStatus] = useState<Security2FAStatus>({
    emailBased2FA: { enabled: false },
    totpBased2FA: { enabled: false },
  });

  // 2FA Setup Modal States
  const [show2FASetupModal, setShow2FASetupModal] = useState(false);
  const [setupStep, setSetupStep] = useState<'sending' | 'verifying'>('sending');
  const [verificationCode, setVerificationCode] = useState('');
  const [codeInput, setCodeInput] = useState('');
  const [codeExpiresAt, setCodeExpiresAt] = useState<Date | null>(null);
  const [timeRemaining, setTimeRemaining] = useState(120);

  // Disable 2FA Modal States
  const [showDisable2FAModal, setShowDisable2FAModal] = useState(false);
  const [disablePassword, setDisablePassword] = useState('');

  useEffect(() => {
    fetchTwoFAStatus();
  }, []);

  // Timer effect
  useEffect(() => {
    if (!codeExpiresAt) return;

    const interval = setInterval(() => {
      const now = new Date();
      const remaining = Math.max(0, Math.ceil((codeExpiresAt.getTime() - now.getTime()) / 1000));
      setTimeRemaining(remaining);

      if (remaining === 0) {
        clearInterval(interval);
        setCodeInput('');
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [codeExpiresAt]);

  const fetchTwoFAStatus = async () => {
    setIsLoading(true);
    try {
      const response = await api.get2FAStatus();
      setTwoFAStatus(response.data);
    } catch (err) {
      console.error('Failed to fetch 2FA status:', err);
      toast({
        title: 'Error',
        description: 'Failed to load 2FA settings',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEnable2FA = async () => {
    setIsSaving(true);
    setSetupStep('sending');
    try {
      const response = await api.enable2FAEmail();
      setCodeExpiresAt(new Date(Date.now() + 120 * 1000)); // 2 minutes
      setTimeRemaining(120);
      setSetupStep('verifying');
      setShow2FASetupModal(true);
      toast({
        title: 'Code Sent',
        description: `Verification code sent to ${response.data.email}`,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to enable 2FA';
      toast({ title: 'Error', description: message, variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleVerify2FASetup = async () => {
    if (!codeInput || codeInput.length !== 6) {
      toast({
        title: 'Invalid Code',
        description: 'Please enter a 6-digit code',
        variant: 'destructive',
      });
      return;
    }

    setIsSaving(true);
    try {
      await api.verify2FASetup(codeInput);
      setTwoFAStatus(prev => ({
        ...prev,
        emailBased2FA: { enabled: true },
      }));
      setShow2FASetupModal(false);
      setCodeInput('');
      toast({
        title: 'Success',
        description: 'Two-Factor Authentication has been enabled',
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to verify code';
      toast({ title: 'Error', description: message, variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleResend2FACode = async () => {
    setIsSaving(true);
    try {
      const response = await api.resend2FACode();
      setCodeExpiresAt(new Date(Date.now() + 120 * 1000));
      setTimeRemaining(120);
      setCodeInput('');
      toast({
        title: 'Code Resent',
        description: `New verification code sent to ${response.data.email}`,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to resend code';
      toast({ title: 'Error', description: message, variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDisable2FA = async () => {
    if (!disablePassword) {
      toast({
        title: 'Error',
        description: 'Password is required to disable 2FA',
        variant: 'destructive',
      });
      return;
    }

    setIsSaving(true);
    try {
      await api.disable2FAEmail(disablePassword);
      setTwoFAStatus(prev => ({
        ...prev,
        emailBased2FA: { enabled: false },
      }));
      setShowDisable2FAModal(false);
      setDisablePassword('');
      toast({
        title: 'Success',
        description: 'Two-Factor Authentication has been disabled',
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to disable 2FA';
      toast({ title: 'Error', description: message, variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-muted-foreground">Loading security settings...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Two-Factor Authentication Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-teal-600" />
            <div>
              <CardTitle>Two-Factor Authentication (2FA)</CardTitle>
              <CardDescription>
                Add an extra layer of security to your account
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {twoFAStatus.emailBased2FA.enabled ? (
            <>
              <Alert className="bg-teal-50 border-teal-200">
                <CheckCircle2 className="h-4 w-4 text-teal-600" />
                <AlertDescription className="text-teal-800">
                  Two-Factor Authentication is enabled. You will need to enter a verification code sent to your email when logging in.
                </AlertDescription>
              </Alert>
              <Button
                variant="destructive"
                onClick={() => setShowDisable2FAModal(true)}
                className="w-full"
              >
                <Lock className="w-4 h-4 mr-2" />
                Disable Two-Factor Authentication
              </Button>
            </>
          ) : (
            <>
              <Alert className="bg-amber-50 border-amber-200">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                <AlertDescription className="text-amber-800">
                  Two-Factor Authentication is not enabled. We recommend enabling it to protect your account.
                </AlertDescription>
              </Alert>
              <Button
                onClick={handleEnable2FA}
                disabled={isSaving}
                className="w-full bg-teal-600 hover:bg-teal-700"
              >
                <Shield className="w-4 h-4 mr-2" />
                Enable Two-Factor Authentication
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      {/* Security Tips */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Security Tips</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-3">
            <CheckCircle2 className="w-5 h-5 text-teal-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-sm">Use a strong password</p>
              <p className="text-sm text-muted-foreground">
                Combine uppercase, lowercase, numbers, and special characters
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <CheckCircle2 className="w-5 h-5 text-teal-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-sm">Enable 2FA</p>
              <p className="text-sm text-muted-foreground">
                Adds an extra verification step when signing in
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <CheckCircle2 className="w-5 h-5 text-teal-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-sm">Keep your email secure</p>
              <p className="text-sm text-muted-foreground">
                Your email is the primary way we communicate about account security
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 2FA Setup Modal */}
      <Dialog open={show2FASetupModal} onOpenChange={setShow2FASetupModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Verify Your Email</DialogTitle>
            <DialogDescription>
              We've sent a 6-digit verification code to your registered email address
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Code Input */}
            <div className="space-y-2">
              <Label htmlFor="code">Verification Code</Label>
              <Input
                id="code"
                type="text"
                placeholder="000000"
                value={codeInput}
                onChange={(e) => setCodeInput(e.target.value.replace(/\D/g, '').slice(0, 6))}
                maxLength={6}
                disabled={isSaving || timeRemaining === 0}
                className="text-center text-2xl tracking-widest"
              />
            </div>

            {/* Timer */}
            <div className="flex items-center gap-2 text-sm">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <span className={timeRemaining < 30 ? 'text-red-600 font-medium' : 'text-muted-foreground'}>
                Code expires in {timeRemaining} seconds
              </span>
            </div>

            {/* Resend Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleResend2FACode}
              disabled={isSaving || timeRemaining > 30}
              className="w-full"
            >
              Resend Code
            </Button>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setShow2FASetupModal(false);
                setCodeInput('');
              }}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button
              onClick={handleVerify2FASetup}
              disabled={isSaving || codeInput.length !== 6 || timeRemaining === 0}
              className="bg-teal-600 hover:bg-teal-700"
            >
              {isSaving ? 'Verifying...' : 'Verify & Enable'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Disable 2FA Modal */}
      <Dialog open={showDisable2FAModal} onOpenChange={setShowDisable2FAModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Disable Two-Factor Authentication</DialogTitle>
            <DialogDescription>
              Enter your password to confirm disabling 2FA
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Disabling 2FA will make your account less secure. You can re-enable it at any time.
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={disablePassword}
                onChange={(e) => setDisablePassword(e.target.value)}
                disabled={isSaving}
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowDisable2FAModal(false);
                setDisablePassword('');
              }}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDisable2FA}
              disabled={isSaving || !disablePassword}
            >
              {isSaving ? 'Disabling...' : 'Disable 2FA'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
