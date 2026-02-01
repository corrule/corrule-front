import { useState } from 'react';
import { X, AlertCircle, Check, Loader2, Copy, Check as CheckIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { api } from '@/services/api';
import { useToast } from '@/hooks/use-toast';
import type { Rule } from '@/types';

interface RuleReviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rule: Rule | null;
  onApproved?: () => void;
  onRejected?: () => void;
}

const severityColors: Record<string, string> = {
  LOW: 'bg-blue-100 text-blue-800',
  MEDIUM: 'bg-yellow-100 text-yellow-800',
  HIGH: 'bg-orange-100 text-orange-800',
  CRITICAL: 'bg-red-100 text-red-800',
};

export function RuleReviewModal({
  open,
  onOpenChange,
  rule,
  onApproved,
  onRejected,
}: RuleReviewModalProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('overview');
  const [isApproving, setIsApproving] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectionForm, setShowRejectionForm] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!rule) return null;

  const handleCopyContent = () => {
    navigator.clipboard.writeText(rule.ruleContent?.query || '');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleApprove = async () => {
    setIsApproving(true);
    try {
      await api.approveRule(rule._id || rule.id || '', 'Approved after review');
      toast({
        title: 'Success',
        description: `Rule "${rule.title}" has been approved and published.`,
      });
      onOpenChange(false);
      onApproved?.();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to approve rule';
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setIsApproving(false);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      toast({
        title: 'Error',
        description: 'Please provide a rejection reason',
        variant: 'destructive',
      });
      return;
    }

    setIsRejecting(true);
    try {
      await api.rejectRule(rule._id || rule.id || '', rejectionReason);
      toast({
        title: 'Success',
        description: `Rule "${rule.title}" has been rejected.`,
      });
      onOpenChange(false);
      setShowRejectionForm(false);
      setRejectionReason('');
      onRejected?.();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to reject rule';
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setIsRejecting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span>Review Rule: {rule.title}</span>
            <Badge variant="outline" className="ml-auto">
              {rule.status}
            </Badge>
          </DialogTitle>
          <DialogDescription>
            Review all rule details before approving or rejecting
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="content">Content</TabsTrigger>
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="metadata">Metadata</TabsTrigger>
          </TabsList>

          <ScrollArea className="flex-1 overflow-hidden">
            <div className="p-6">
              {/* Overview Tab */}
              <TabsContent value="overview" className="space-y-6 mt-0">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Title</h3>
                    <p className="text-foreground">{rule.title}</p>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-2">Description</h3>
                    <p className="text-foreground whitespace-pre-wrap">{rule.description}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Severity</p>
                      <Badge className={`mt-2 ${severityColors[rule.severity] || ''}`}>
                        {rule.severity}
                      </Badge>
                    </div>

                    <div>
                      <p className="text-sm text-muted-foreground">Category</p>
                      <Badge variant="outline" className="mt-2">
                        {rule.category}
                      </Badge>
                    </div>

                    <div>
                      <p className="text-sm text-muted-foreground">Query Language</p>
                      <Badge variant="outline" className="mt-2">
                        {rule.queryLanguage}
                      </Badge>
                    </div>

                    <div>
                      <p className="text-sm text-muted-foreground">Vendor</p>
                      <Badge variant="outline" className="mt-2">
                        {rule.vendor}
                      </Badge>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-2">Author</h3>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-semibold">
                        {rule.author?.username?.[0]?.toUpperCase() || 'U'}
                      </div>
                      <div>
                        <p className="font-medium">@{rule.author?.username}</p>
                        <p className="text-sm text-muted-foreground">{rule.author?.email}</p>
                      </div>
                    </div>
                  </div>

                  {rule.tags && rule.tags.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold mb-2">Tags</h3>
                      <div className="flex flex-wrap gap-2">
                        {rule.tags.map((tag) => (
                          <Badge key={tag} variant="secondary">
                            #{tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </TabsContent>

              {/* Content Tab */}
              <TabsContent value="content" className="space-y-4 mt-0">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Rule Query</h3>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleCopyContent}
                    className="gap-2"
                  >
                    {copied ? (
                      <>
                        <CheckIcon className="w-4 h-4" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        Copy
                      </>
                    )}
                  </Button>
                </div>
                <div className="bg-muted p-4 rounded-lg border border-border overflow-x-auto">
                  <pre className="text-sm font-mono whitespace-pre-wrap break-words">
                    {rule.ruleContent?.query || 'No content'}
                  </pre>
                </div>
              </TabsContent>

              {/* Details Tab */}
              <TabsContent value="details" className="space-y-4 mt-0">
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Version</p>
                      <p className="text-foreground mt-1">
                        {typeof rule.version === 'string'
                          ? rule.version
                          : (rule.version as any)?.current || '1.0.0'}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Visibility</p>
                      <Badge variant="outline" className="mt-2">
                        {rule.visibility || 'PRIVATE'}
                      </Badge>
                    </div>

                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Created</p>
                      <p className="text-foreground mt-1">
                        {rule.createdAt
                          ? new Date(rule.createdAt).toLocaleDateString()
                          : 'N/A'}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Status</p>
                      <Badge variant="outline" className="mt-2">
                        {rule.status}
                      </Badge>
                    </div>
                  </div>

                  {rule.pricing && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">Pricing</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Is Paid:</span>
                          <span className="font-medium">
                            {rule.pricing.isPaid ? 'Yes' : 'No'}
                          </span>
                        </div>
                        {rule.pricing.isPaid && rule.pricing.price && (
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Price:</span>
                            <span className="font-medium text-lg">
                              ${rule.pricing.price.toFixed(2)}
                            </span>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )}
                </div>
              </TabsContent>

              {/* Metadata Tab */}
              <TabsContent value="metadata" className="space-y-4 mt-0">
                <div className="space-y-4">
                  {rule.mitreAttack && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">MITRE ATT&CK Mapping</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        {rule.mitreAttack.tactics && rule.mitreAttack.tactics.length > 0 && (
                          <div>
                            <p className="text-sm text-muted-foreground mb-2">Tactics:</p>
                            <div className="flex flex-wrap gap-2">
                              {rule.mitreAttack.tactics.map((tactic) => (
                                <Badge key={tactic} variant="secondary">
                                  {tactic}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                        {rule.mitreAttack.techniques && rule.mitreAttack.techniques.length > 0 && (
                          <div>
                            <p className="text-sm text-muted-foreground mb-2">Techniques:</p>
                            <div className="flex flex-wrap gap-2">
                              {rule.mitreAttack.techniques.map((tech) => (
                                <Badge key={tech} variant="outline">
                                  {tech}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )}

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Statistics</CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Downloads</p>
                        <p className="text-2xl font-bold mt-1">
                          {rule.statistics?.downloads || rule.downloads || 0}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Rating</p>
                        <p className="text-2xl font-bold mt-1">
                          {rule.statistics?.rating || rule.rating || 0}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Likes</p>
                        <p className="text-2xl font-bold mt-1">
                          {rule.statistics?.likes || rule.likes || 0}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Reviews</p>
                        <p className="text-2xl font-bold mt-1">
                          {rule.reviewCount || 0}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </div>
          </ScrollArea>
        </Tabs>

        {/* Action Buttons */}
        <div className="border-t p-6 space-y-4">
          {!showRejectionForm ? (
            <Alert className="border-yellow-500/50 bg-yellow-500/10">
              <AlertCircle className="w-4 h-4 text-yellow-600" />
              <AlertDescription className="text-yellow-800">
                Review all details carefully before approving or rejecting this rule.
              </AlertDescription>
            </Alert>
          ) : null}

          {showRejectionForm ? (
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium">Rejection Reason *</label>
                <Textarea
                  placeholder="Explain why this rule is being rejected..."
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  rows={3}
                  className="mt-2"
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowRejectionForm(false);
                    setRejectionReason('');
                  }}
                  disabled={isRejecting}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleReject}
                  disabled={isRejecting || !rejectionReason.trim()}
                >
                  {isRejecting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Rejecting...
                    </>
                  ) : (
                    'Confirm Rejection'
                  )}
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isApproving || isRejecting}
              >
                Close
              </Button>
              <Button
                variant="destructive"
                onClick={() => setShowRejectionForm(true)}
                disabled={isApproving || isRejecting}
              >
                Reject Rule
              </Button>
              <Button
                onClick={handleApprove}
                disabled={isApproving || isRejecting}
                className="gap-2"
              >
                {isApproving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Approving...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    Approve Rule
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
