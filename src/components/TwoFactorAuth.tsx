import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { AlertCircle, Check, Lock, Mail, CheckCircle2, X } from 'lucide-react';
import { api } from '@/services/api';
import { useToast } from '@/hooks/use-toast';

interface TwoFactorSetupProps {
  onSuccess?: () => void;
}

export function TwoFactorAuthSetup({ onSuccess }: TwoFactorSetupProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isEnabled, setIsEnabled] = useState(false);
  const [step, setStep] = useState<'info' | 'verify' | 'complete'>('info');
  const [verificationCode, setVerificationCode] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const [codeExpiresIn, setCodeExpiresIn] = useState(120); // 2 minutes in seconds
  const [resendCooldown, setResendCooldown] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Load 2FA status on mount
  useEffect(() => {
    loadTwoFactorStatus();
  }, []);

  // Countdown timer for code expiration
  useEffect(() => {
    if (!codeSent || codeExpiresIn <= 0) return;

    const timer = setInterval(() => {
      setCodeExpiresIn((prev) => {
        if (prev <= 1) {
          setCodeSent(false);
          return 120;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [codeSent, codeExpiresIn]);

  // Countdown timer for resend cooldown
  useEffect(() => {
    if (resendCooldown <= 0) return;

    const timer = setInterval(() => {
      setResendCooldown((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(timer);
  }, [resendCooldown]);

  const loadTwoFactorStatus = async () => {
    try {
      const response = await api.get2FAStatus();
      setIsEnabled(response.data.emailBased2FA.enabled);
    } catch (err) {
      console.error('Failed to load 2FA status:', err);
    }
  };

  const handleEnable2FA = async () => {
    setError(null);
    setIsLoading(true);

    try {
      await api.enable2FAEmail();
      setCodeSent(true);
      setStep('verify');
      setCodeExpiresIn(120);
      toast({
        title: 'Verification Code Sent',
        description: 'A code has been sent to your email. It will expire in 2 minutes.',
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to send verification code';
      setError(message);
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      setError('Please enter a valid 6-digit code');
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      await api.verify2FASetup(verificationCode);
      setIsEnabled(true);
      setStep('complete');
      setCodeSent(false);
      setVerificationCode('');
      toast({
        title: 'Success',
        description: 'Two-Factor Authentication has been enabled successfully',
      });

      if (onSuccess) {
        setTimeout(() => onSuccess(), 2000);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to verify code';
      setError(message);
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (resendCooldown > 0) return;

    setError(null);
    setIsLoading(true);

    try {
      await api.resend2FACode();
      setResendCooldown(30);
      setCodeExpiresIn(120);
      setVerificationCode('');
      toast({
        title: 'Code Resent',
        description: 'A new verification code has been sent to your email',
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to resend code';
      setError(message);
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setStep('info');
    setVerificationCode('');
    setCodeSent(false);
    setError(null);
  };

  if (isEnabled) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
              <CardTitle>Two-Factor Authentication</CardTitle>
            </div>
          </div>
          <CardDescription>Protect your account with email-based 2FA</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert className="bg-green-50 border-green-200">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              Two-Factor Authentication is currently <strong>enabled</strong> on your account.
            </AlertDescription>
          </Alert>

          <div className="bg-muted p-4 rounded-lg">
            <p className="text-sm font-medium mb-2">How it works:</p>
            <ul className="text-sm text-muted-foreground space-y-2">
              <li>• You'll receive a 6-digit code via email when logging in</li>
              <li>• The code is valid for 2 minutes</li>
              <li>• You can request a new code if needed</li>
            </ul>
          </div>

          <Separator />

          <TwoFactorAuthDisable onDisabled={() => setIsEnabled(false)} />
        </CardContent>
      </Card>
    );
  }

  if (step === 'verify') {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Verify Your Email</CardTitle>
          <CardDescription>
            Enter the 6-digit code we sent to your email address
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-900">
              <Mail className="w-4 h-4 inline mr-2" />
              Verification code expires in <strong>{codeExpiresIn} seconds</strong>
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="verificationCode">Verification Code</Label>
            <Input
              id="verificationCode"
              type="text"
              placeholder="000000"
              maxLength={6}
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
              disabled={isLoading}
              className="text-center text-2xl tracking-widest"
            />
            <p className="text-xs text-muted-foreground text-center">
              Enter the 6-digit code
            </p>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={handleVerifyCode}
              disabled={isLoading || verificationCode.length !== 6 || !codeSent}
              className="flex-1"
            >
              {isLoading ? 'Verifying...' : 'Verify Code'}
            </Button>
            <Button variant="outline" onClick={handleCancel} disabled={isLoading}>
              Cancel
            </Button>
          </div>

          <div className="text-center">
            <Button
              variant="link"
              size="sm"
              onClick={handleResendCode}
              disabled={isLoading || resendCooldown > 0}
              className="text-xs"
            >
              {resendCooldown > 0 ? `Resend code (${resendCooldown}s)` : "Didn't receive the code?"}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (step === 'complete') {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-green-600" />
            Setup Complete
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert className="bg-green-50 border-green-200">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              Two-Factor Authentication has been successfully enabled on your account.
            </AlertDescription>
          </Alert>

          <div className="bg-muted p-4 rounded-lg space-y-2">
            <p className="text-sm font-medium">Next time you log in:</p>
            <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
              <li>Enter your email and password</li>
              <li>We'll send you a 6-digit code</li>
              <li>Enter the code to complete login</li>
            </ol>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Initial step
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Lock className="w-5 h-5" />
          <CardTitle>Two-Factor Authentication</CardTitle>
        </div>
        <CardDescription>Add an extra layer of security to your account</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Alert className="bg-amber-50 border-amber-200">
          <AlertCircle className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-900">
            Two-Factor Authentication is currently <strong>disabled</strong>. Enable it to better protect
            your account.
          </AlertDescription>
        </Alert>

        <div className="space-y-4">
          <div className="flex items-start gap-3 py-3 px-4 bg-muted rounded-lg">
            <Check className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium text-sm">Email-based Verification</p>
              <p className="text-xs text-muted-foreground mt-1">
                Receive a 6-digit code via email to verify your login
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 py-3 px-4 bg-muted rounded-lg">
            <Check className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium text-sm">Time-Limited Codes</p>
              <p className="text-xs text-muted-foreground mt-1">Codes expire after 2 minutes for security</p>
            </div>
          </div>

          <div className="flex items-start gap-3 py-3 px-4 bg-muted rounded-lg">
            <Check className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium text-sm">Easy to Use</p>
              <p className="text-xs text-muted-foreground mt-1">
                No special apps needed, codes come directly to your inbox
              </p>
            </div>
          </div>
        </div>

        <Button onClick={handleEnable2FA} disabled={isLoading} className="w-full" size="lg">
          {isLoading ? 'Setting up...' : 'Enable Two-Factor Authentication'}
        </Button>
      </CardContent>
    </Card>
  );
}

interface TwoFactorAuthDisableProps {
  onDisabled?: () => void;
}

function TwoFactorAuthDisable({ onDisabled }: TwoFactorAuthDisableProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [showPasswordInput, setShowPasswordInput] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleDisable2FA = async () => {
    if (!password) {
      setError('Password is required');
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      await api.disable2FAEmail(password);
      toast({
        title: 'Success',
        description: 'Two-Factor Authentication has been disabled',
      });
      setPassword('');
      setShowPasswordInput(false);

      if (onDisabled) {
        onDisabled();
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to disable 2FA';
      setError(message);
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!showPasswordInput) {
    return (
      <Button
        variant="destructive"
        onClick={() => setShowPasswordInput(true)}
        disabled={isLoading}
      >
        <X className="w-4 h-4 mr-2" />
        Disable Two-Factor Authentication
      </Button>
    );
  }

  return (
    <div className="space-y-4 p-4 bg-red-50 border border-red-200 rounded-lg">
      <p className="font-medium text-sm text-red-900">
        Confirm Password to Disable 2FA
      </p>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        <Label htmlFor="disablePassword" className="text-red-900">
          Your Password
        </Label>
        <Input
          id="disablePassword"
          type="password"
          placeholder="Enter your password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={isLoading}
        />
      </div>

      <div className="flex gap-2">
        <Button
          variant="destructive"
          onClick={handleDisable2FA}
          disabled={isLoading || !password}
          size="sm"
        >
          {isLoading ? 'Disabling...' : 'Confirm Disable'}
        </Button>
        <Button
          variant="outline"
          onClick={() => {
            setShowPasswordInput(false);
            setPassword('');
            setError(null);
          }}
          disabled={isLoading}
          size="sm"
        >
          Cancel
        </Button>
      </div>
    </div>
  );
}
