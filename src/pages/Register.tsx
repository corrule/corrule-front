import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Shield, Eye, EyeOff, Loader2, CheckCircle2, Circle } from 'lucide-react';
import { useGoogleLogin } from '@react-oauth/google';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { api, API_BASE_URL, setAccessToken, setRefreshToken } from '@/services/api';

export default function Register() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const { register, error, setUserSession } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Password validation checks
  const getPasswordChecks = () => ({
    minLength: password.length >= 10,
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
    hasNumber: /\d/.test(password),
    hasSymbol: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
  });

  const passwordChecks = getPasswordChecks();
  const allChecksPassed = Object.values(passwordChecks).every(check => check);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationErrors([]);

    // Validation
    if (!username || !email || !password || !confirmPassword) {
      toast({ title: 'Error', description: 'Please fill in all fields', variant: 'destructive' });
      return;
    }

    if (password !== confirmPassword) {
      toast({ title: 'Error', description: 'Passwords do not match', variant: 'destructive' });
      return;
    }

    if (password.length < 10) {
      toast({ title: 'Error', description: 'Password must be at least 10 characters', variant: 'destructive' });
      return;
    }

    setIsLoading(true);
    try {
      await register(username, email, password);
      toast({
        title: 'Account created!',
        description: 'Please check your email to verify your account before logging in.',
      });
      // Redirect to login after successful registration
      navigate('/login');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Registration failed';
      
      // Try to parse detailed validation errors from the response
      try {
        const response = await fetch(`${API_BASE_URL}/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, email, password }),
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          if (errorData.errors && Array.isArray(errorData.errors)) {
            const errors = errorData.errors.map((err: any) => err.msg);
            setValidationErrors(errors);
            errors.forEach(error => {
              toast({ title: 'Validation Error', description: error, variant: 'destructive' });
            });
          } else {
            toast({ title: 'Error', description: errorMessage, variant: 'destructive' });
          }
        }
      } catch (parseErr) {
        toast({ title: 'Error', description: errorMessage, variant: 'destructive' });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const googleLogin = useGoogleLogin({
    onSuccess: async (credentialResponse: any) => {
      setIsGoogleLoading(true);
      try {
        // With auth-code flow, we get a code that we can exchange for tokens
        // For now, we'll try to use the code or access_token if available
        const googleToken = credentialResponse.access_token || credentialResponse.code;
        
        // Use googleLogin endpoint which handles both login and registration
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
          
          toast({ title: 'Account created!', description: 'Welcome to Corrule!' });
          navigate('/dashboard');
        } else {
          toast({ title: 'Error', description: 'Failed to create account', variant: 'destructive' });
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to register with Google';
        console.error('Google register error:', message);
        toast({ title: 'Error', description: message, variant: 'destructive' });
      } finally {
        setIsGoogleLoading(false);
      }
    },
    onError: (error: any) => {
      console.error('Google register error:', error);
      toast({ title: 'Error', description: 'Failed to authenticate with Google', variant: 'destructive' });
      setIsGoogleLoading(false);
    },
    flow: 'implicit',
  });

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-grid-pattern">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 rounded-xl bg-primary">
              <Shield className="w-8 h-8 text-primary-foreground" />
            </div>
          </div>
          <CardTitle className="text-2xl">Create an account</CardTitle>
          <CardDescription>Join the security detection community</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {validationErrors.length > 0 && (
              <Alert variant="destructive">
                <AlertDescription>
                  <ul className="list-disc list-inside">
                    {validationErrors.map((err, idx) => (
                      <li key={idx}>{err}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                placeholder="security_analyst"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
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
              
              {/* Password validation checkpoints */}
              {password && (
                <div className="mt-3 space-y-2 bg-card/50 p-3 rounded-lg border border-border">
                  <p className="text-xs font-medium text-muted-foreground mb-2">Password requirements:</p>
                  
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 text-sm">
                      {passwordChecks.minLength ? (
                        <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                      ) : (
                        <Circle className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                      )}
                      <span className={passwordChecks.minLength ? 'text-green-500' : 'text-muted-foreground'}>
                        At least 10 characters
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-sm">
                      {passwordChecks.hasUppercase ? (
                        <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                      ) : (
                        <Circle className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                      )}
                      <span className={passwordChecks.hasUppercase ? 'text-green-500' : 'text-muted-foreground'}>
                        Uppercase letter (A-Z)
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-sm">
                      {passwordChecks.hasLowercase ? (
                        <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                      ) : (
                        <Circle className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                      )}
                      <span className={passwordChecks.hasLowercase ? 'text-green-500' : 'text-muted-foreground'}>
                        Lowercase letter (a-z)
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-sm">
                      {passwordChecks.hasNumber ? (
                        <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                      ) : (
                        <Circle className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                      )}
                      <span className={passwordChecks.hasNumber ? 'text-green-500' : 'text-muted-foreground'}>
                        Number (0-9)
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-sm">
                      {passwordChecks.hasSymbol ? (
                        <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                      ) : (
                        <Circle className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                      )}
                      <span className={passwordChecks.hasSymbol ? 'text-green-500' : 'text-muted-foreground'}>
                        Symbol (!@#$%^&* etc.)
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  disabled={isLoading}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  disabled={isLoading}
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </Button>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button 
              type="submit" 
              className="w-full" 
              disabled={isLoading || isGoogleLoading || !allChecksPassed || password !== confirmPassword || !password || !confirmPassword}
            >
              {isLoading ? 'Creating account...' : 'Create account'}
            </Button>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border"></span>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">Or sign up with</span>
              </div>
            </div>

            {/* Google Sign-up Button */}
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
                  Signing up...
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
              Already have an account? <Link to="/login" className="text-primary hover:underline">Sign in</Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}

