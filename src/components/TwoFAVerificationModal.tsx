import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Clock, AlertTriangle } from 'lucide-react';

interface TwoFAVerificationModalProps {
  open: boolean;
  isLoading: boolean;
  error?: string;
  onVerify: (code: string) => void;
  onResend: () => void;
  onCancel: () => void;
  expiresIn?: number;
}

export default function TwoFAVerificationModal({
  open,
  isLoading,
  error,
  onVerify,
  onResend,
  onCancel,
  expiresIn = 120,
}: TwoFAVerificationModalProps) {
  const [code, setCode] = useState('');
  const [timeRemaining, setTimeRemaining] = useState(expiresIn);
  const [canResend, setCanResend] = useState(false);

  // Timer effect
  useEffect(() => {
    if (!open) return;

    setTimeRemaining(expiresIn);
    setCanResend(false);

    const interval = setInterval(() => {
      setTimeRemaining(prev => {
        const newTime = Math.max(0, prev - 1);
        if (newTime === 0) {
          clearInterval(interval);
        }
        return newTime;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [open, expiresIn]);

  // Allow resend after 30 seconds
  useEffect(() => {
    if (timeRemaining > 0 && timeRemaining <= expiresIn - 30) {
      setCanResend(true);
    }
  }, [timeRemaining, expiresIn]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length === 6) {
      onVerify(code);
    }
  };

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
    setCode(value);
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      if (!isOpen) {
        onCancel();
        setCode('');
      }
    }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Two-Factor Authentication</DialogTitle>
          <DialogDescription>
            Enter the 6-digit code sent to your email
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Error Alert */}
          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Code Input */}
          <div className="space-y-2">
            <Label htmlFor="2fa-code">Verification Code</Label>
            <Input
              id="2fa-code"
              type="text"
              placeholder="000000"
              value={code}
              onChange={handleCodeChange}
              maxLength={6}
              disabled={isLoading || timeRemaining === 0}
              className="text-center text-2xl tracking-widest font-mono"
              autoFocus
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
            type="button"
            variant="ghost"
            size="sm"
            onClick={onResend}
            disabled={isLoading || !canResend}
            className="w-full"
          >
            Resend Code
          </Button>

          {/* Action Buttons */}
          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                onCancel();
                setCode('');
              }}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading || code.length !== 6 || timeRemaining === 0}
              className="bg-teal-600 hover:bg-teal-700"
            >
              {isLoading ? 'Verifying...' : 'Verify'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
