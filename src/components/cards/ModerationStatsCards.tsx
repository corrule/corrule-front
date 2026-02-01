import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, CheckCircle, XCircle, Clock, TrendingUp, Users } from 'lucide-react';

interface ModerationStatsCardsProps {
  pendingRules: number;
  approvedRules: number;
  rejectedRules: number;
  averageReviewTime: number;
  topModerators?: Array<{
    name: string;
    actions: number;
  }>;
}

export function ModerationStatsCards({
  pendingRules,
  approvedRules,
  rejectedRules,
  averageReviewTime,
  topModerators,
}: ModerationStatsCardsProps) {
  const totalReviews = pendingRules + approvedRules + rejectedRules;
  const approvalRate = totalReviews > 0 
    ? ((approvedRules / (approvedRules + rejectedRules)) * 100).toFixed(1)
    : 'N/A';

  return (
    <div className="space-y-4">
      {/* Main Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Pending Rules */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600" />
              Pending Rule
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-amber-600">{pendingRules}</div>
            <p className="text-xs text-muted-foreground mt-1">Rules awaiting review</p>
          </CardContent>
        </Card>

        {/* Approved Rules */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              Approved
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{approvedRules}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {approvalRate !== 'N/A' && `${approvalRate}% approval rate`}
            </p>
          </CardContent>
        </Card>

        {/* Rejected Rules */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <XCircle className="w-4 h-4 text-red-600" />
              Rejected
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">{rejectedRules}</div>
            <p className="text-xs text-muted-foreground mt-1">Need improvements</p>
          </CardContent>
        </Card>

        {/* Average Review Time */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-600" />
              Avg Review Time
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">
              {averageReviewTime.toFixed(1)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Hours per rule</p>
          </CardContent>
        </Card>
      </div>

      {/* Progress Bars */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Review Progress</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Approval Rate */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Approval Rate</span>
              <span className="text-sm font-semibold text-green-600">
                {approvalRate}%
              </span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
              <div
                className="bg-green-600 h-full rounded-full transition-all"
                style={{
                  width: approvalRate !== 'N/A' ? `${approvalRate}%` : '0%',
                }}
              />
            </div>
          </div>

          {/* Distribution */}
          <div className="space-y-2">
            <p className="text-sm font-medium">Distribution</p>
            <div className="grid grid-cols-3 gap-2">
              <div className="p-2 rounded-lg bg-amber-50 border border-amber-200">
                <div className="text-xs text-muted-foreground">Pending</div>
                <div className="text-lg font-bold text-amber-600">{pendingRules}</div>
              </div>
              <div className="p-2 rounded-lg bg-green-50 border border-green-200">
                <div className="text-xs text-muted-foreground">Approved</div>
                <div className="text-lg font-bold text-green-600">{approvedRules}</div>
              </div>
              <div className="p-2 rounded-lg bg-red-50 border border-red-200">
                <div className="text-xs text-muted-foreground">Rejected</div>
                <div className="text-lg font-bold text-red-600">{rejectedRules}</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Top Moderators */}
      {topModerators && topModerators.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="w-5 h-5" />
              Top Moderators
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topModerators.map((moderator, idx) => (
                <div key={idx} className="flex items-center justify-between p-2 rounded hover:bg-slate-50">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-semibold">
                      {idx + 1}
                    </div>
                    <span className="font-medium">{moderator.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-muted-foreground" />
                    <span className="font-semibold">{moderator.actions}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
