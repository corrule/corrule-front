import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, ArrowLeft } from 'lucide-react';
import { getRoleLabel } from '@/lib/permissions';

interface AccessDeniedProps {
  requiredRole?: string;
  panelName?: string;
}

export default function AccessDenied({ requiredRole, panelName }: AccessDeniedProps) {
  const navigate = useNavigate();
  const { user } = useAuth();

  const currentRole = user?.role ? getRoleLabel(user.role as any) : 'User';
  const requiredRoleName = requiredRole ? getRoleLabel(requiredRole as any) : 'Administrator';
  const panelTitle = panelName || 'requested';

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="max-w-md w-full border-2 border-red-200">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <AlertCircle className="w-16 h-16 text-red-600" />
          </div>
          <CardTitle className="text-2xl">Access Denied</CardTitle>
          <CardDescription>You don't have permission to access this resource</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg space-y-2">
            <div className="text-sm">
              <span className="font-semibold">Your Role:</span> {currentRole}
            </div>
            <div className="text-sm">
              <span className="font-semibold">Required Role:</span> {requiredRoleName}
            </div>
            <div className="text-sm">
              <span className="font-semibold">Resource:</span> {panelTitle} panel
            </div>
          </div>

          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-muted-foreground">
              To access this panel, you need to have the appropriate role assigned to your account. 
              Contact an administrator if you believe this is a mistake.
            </p>
          </div>

          <div className="space-y-3">
            <Button
              onClick={() => navigate('/')}
              className="w-full"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Return to Dashboard
            </Button>
            <Button
              onClick={() => navigate(-1)}
              variant="outline"
              className="w-full"
            >
              Go Back
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
