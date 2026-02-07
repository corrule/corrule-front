import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Mail, Clock } from 'lucide-react';

interface TwoFactorVerificationModalProps {
  userId: string;
  userEmail: string;
  onVerify: (code: string) => Promise<void>;
  onResend: () => Promise<void>;
  isLoading: boolean;
}

export function TwoFactorVerificationModal({
  userId,
  userEmail,
  onVerify,
  onResend,
  isLoading,
}: TwoFactorVerificationModalProps) {
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [codeExpiresIn, setCodeExpiresIn] = useState(120); // 2 minutes
  const [resendCooldown, setResendCooldown] = useState(0);
  const [isResending, setIsResending] = useState(false);

  // Countdown timer for code expiration
  useEffect(() => {
    if (codeExpiresIn <= 0) return;

    const timer = setInterval(() => {
      setCodeExpiresIn((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(timer);
  }, [codeExpiresIn]);

  // Countdown timer for resend cooldown
  useEffect(() => {
    if (resendCooldown <= 0) return;

    const timer = setInterval(() => {
      setResendCooldown((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(timer);
  }, [resendCooldown]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!code || code.length !== 6) {
      setError('Please enter a valid 6-digit code');
      return;
    }

    setError(null);

    try {
      await onVerify(code);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Verification failed';
      setError(message);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;

    setIsResending(true);
    setError(null);

    try {
      await onResend();
      setResendCooldown(30); // 30 second cooldown
      setCodeExpiresIn(120); // Reset expiration timer
      setCode('');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to resend code';
      setError(message);
    } finally {
      setIsResending(false);
    }
  };

  // Determine if code has expired
  const isCodeExpired = codeExpiresIn === 0;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Two-Factor Authentication</CardTitle>
          <CardDescription>Enter the code we sent to your email</CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Email Display */}
          <div className="flex items-center justify-center p-3 bg-muted rounded-lg">
            <Mail className="w-4 h-4 mr-2 text-muted-foreground" />
            <span className="text-sm font-medium">{userEmail}</span>
          </div>

          {/* Error Alert */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Code Expiration Warning */}
          {isCodeExpired && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Your verification code has expired. Please request a new one.
              </AlertDescription>
            </Alert>
          )}

          {/* Timer Display */}
          {!isCodeExpired && codeExpiresIn <= 30 && (
            <Alert className="bg-amber-50 border-amber-200">
              <Clock className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-amber-900">
                Code expires in <strong>{codeExpiresIn} seconds</strong>
              </AlertDescription>
            </Alert>
          )}

          {/* Verification Code Input */}
          <form onSubmit={handleVerify} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="verificationCode">Verification Code</Label>
              <Input
                id="verificationCode"
                type="text"
                placeholder="000000"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                disabled={isLoading || isCodeExpired}
                className="text-center text-3xl tracking-widest font-semibold"
                autoFocus
              />
              <p className="text-xs text-muted-foreground text-center">
                6-digit code from your email
              </p>
            </div>

            <Button
              type="submit"
              disabled={
                isLoading || code.length !== 6 || isCodeExpired || codeExpiresIn === 0
              }
              className="w-full"
              size="lg"
            >
              {isLoading ? 'Verifying...' : 'Verify Code'}
            </Button>
          </form>

          {/* Resend Code */}
          <div className="text-center">
            <p className="text-xs text-muted-foreground mb-2">
              {isCodeExpired ? "Your code has expired." : "Didn't receive the code?"}
            </p>
            <Button
              variant="link"
              size="sm"
              onClick={handleResend}
              disabled={isLoading || isResending || resendCooldown > 0}
              className="text-xs"
            >
              {resendCooldown > 0
                ? `Resend code (${resendCooldown}s)`
                : 'Send new code'}
            </Button>
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-xs text-blue-900 leading-relaxed">
              <strong>💡 Tip:</strong> Check your spam folder if you don't see the email in your inbox.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
