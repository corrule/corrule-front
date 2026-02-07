import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Shield, Eye, EyeOff, Loader2 } from 'lucide-react';
import { useGoogleLogin } from '@react-oauth/google';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { api, setAccessToken, setRefreshToken } from '@/services/api';
import TwoFAVerificationModal from '@/components/TwoFAVerificationModal';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [requires2FA, setRequires2FA] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [is2FALoading, setIs2FALoading] = useState(false);
  const [twoFAError, setTwoFAError] = useState<string | null>(null);
  const { login, error, setUserSession } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast({ title: 'Error', description: 'Please fill in all fields', variant: 'destructive' });
      return;
    }

    setIsLoading(true);
    try {
      const response = await api.login({ email, password });

      // Check if 2FA is required
      if (response.success && (response as any).requires2FA) {
        setUserId((response as any).userId);
        setRequires2FA(true);
        toast({
          title: 'Two-Factor Authentication',
          description: 'Please enter the code sent to your email',
        });
      } else if (response.success && response.data) {
        // No 2FA required, login successful
        setAccessToken(response.data.tokens.accessToken);
        setRefreshToken(response.data.tokens.refreshToken);
        setUserSession(response.data.user, response.data.tokens.accessToken, response.data.tokens.refreshToken);
        
        toast({ title: 'Welcome back!', description: 'You have successfully logged in.' });
        navigate('/');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Invalid credentials';
      toast({ title: 'Error', description: message, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const handle2FAVerify = async (code: string) => {
    if (!userId) {
      toast({ title: 'Error', description: 'User ID missing', variant: 'destructive' });
      return;
    }

    setIs2FALoading(true);
    setTwoFAError(null);
    try {
      const response = await api.verify2FACode(code, userId);

      if (response.success && response.data) {
        setAccessToken(response.data.tokens.accessToken);
        setRefreshToken(response.data.tokens.refreshToken);
        setUserSession(response.data.user, response.data.tokens.accessToken, response.data.tokens.refreshToken);

        toast({ title: 'Welcome!', description: 'You have successfully logged in.' });
        setRequires2FA(false);
        setUserId(null);
        navigate('/');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Verification failed';
      setTwoFAError(message);
    } finally {
      setIs2FALoading(false);
    }
  };

  const handle2FAResend = async () => {
    if (!userId) {
      toast({ title: 'Error', description: 'User ID missing', variant: 'destructive' });
      return;
    }

    try {
      await api.resend2FACode();
      setTwoFAError(null);
      toast({
        title: 'Code Resent',
        description: 'A new verification code has been sent to your email',
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to resend code';
      toast({ title: 'Error', description: message, variant: 'destructive' });
    }
  };

  const googleLogin = useGoogleLogin({
    onSuccess: async (credentialResponse: any) => {
      setIsGoogleLoading(true);
      try {
        // With auth-code flow, we get a code that we can exchange for tokens
        // For now, we'll try to use the code or access_token if available
        const googleToken = credentialResponse.access_token || credentialResponse.code;
        
        const response = await api.googleLogin(googleToken);

        if (response.success && response.data) {
          // Set tokens in API client FIRST
          setAccessToken(response.data.token);
          setRefreshToken(response.data.refreshToken);
          
          // Now fetch complete profile with tokens set
          const profileResponse = await api.getProfile();
          const userData = profileResponse.data.user;
          
          // Update auth context with user session
          setUserSession(userData, response.data.token, response.data.refreshToken);
          
          toast({ title: 'Welcome!', description: 'Signed in successfully with Google.' });
          navigate('/dashboard');
        } else {
          toast({ title: 'Error', description: 'Failed to sign in', variant: 'destructive' });
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to sign in with Google';
        console.error('Google login error:', message);
        toast({ title: 'Error', description: message, variant: 'destructive' });
      } finally {
        setIsGoogleLoading(false);
      }
    },
    onError: (error: any) => {
      console.error('Google login error:', error);
      toast({ title: 'Error', description: 'Failed to authenticate with Google', variant: 'destructive' });
      setIsGoogleLoading(false);
    },
    flow: 'implicit',
  });

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-grid-pattern">
      {/* 2FA Verification Modal */}
      <TwoFAVerificationModal
        open={requires2FA}
        isLoading={is2FALoading}
        error={twoFAError}
        onVerify={handle2FAVerify}
        onResend={handle2FAResend}
        onCancel={() => {
          setRequires2FA(false);
          setUserId(null);
          setTwoFAError(null);
        }}
        expiresIn={120}
      />

      {/* Login Card */}
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 rounded-xl bg-primary">
              <Shield className="w-8 h-8 text-primary-foreground" />
            </div>
          </div>
          <CardTitle className="text-2xl">Welcome back</CardTitle>
          <CardDescription>Sign in to your Corrule account</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="analyst@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </Button>
              </div>
              <Link to="/forgot-password" className="text-xs text-primary hover:underline">
                Forgot password?
              </Link>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button type="submit" className="w-full" disabled={isLoading || isGoogleLoading}>
              {isLoading ? 'Signing in...' : 'Sign in'}
            </Button>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border"></span>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
              </div>
            </div>

            {/* Google Sign-in Button */}
            <Button
              type="button"
              variant="outline"
              className="w-full gap-2"
              onClick={() => googleLogin()}
              disabled={isLoading || isGoogleLoading}
            >
              {isGoogleLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path
                      fill="currentColor"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="currentColor"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  Google
                </>
              )}
            </Button>

            <p className="text-sm text-muted-foreground text-center">
              Don't have an account? <Link to="/register" className="text-primary hover:underline">Sign up</Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}

