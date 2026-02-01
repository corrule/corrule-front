import { useState } from 'react';
import { GitMerge, AlertCircle, Loader2, ChevronDown, ChevronUp, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { SplitDiffView } from '@/components/SplitDiffView';
import { api } from '@/services/api';
import { useToast } from '@/hooks/use-toast';
import type { Rule } from '@/types';

interface MergeRuleModalProps {
  isOpen: boolean;
  onClose: () => void;
  originalRule: Rule | null;
  forkedRule: Rule | null;
  onMergeSuccess: () => void;
}

export function MergeRuleModal({
  isOpen,
  onClose,
  originalRule,
  forkedRule,
  onMergeSuccess,
}: MergeRuleModalProps) {
  const { toast } = useToast();
  const [isMerging, setIsMerging] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['summary']));
  const [confirmMerge, setConfirmMerge] = useState(false);

  const toggleSection = (section: string) => {
    const newSet = new Set(expandedSections);
    if (newSet.has(section)) {
      newSet.delete(section);
    } else {
      newSet.add(section);
    }
    setExpandedSections(newSet);
  };

  const handleMerge = async () => {
    if (!originalRule || !forkedRule) return;

    setIsMerging(true);
    try {
      await api.mergeRule(originalRule._id || originalRule.id || '', forkedRule._id || forkedRule.id || '');

      toast({
        title: 'Merge Successful! ✅',
        description: `Changes from "${forkedRule.title}" have been merged into your original rule.`,
      });

      onMergeSuccess();
      setConfirmMerge(false);
      onClose();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to merge rule';
      toast({
        title: 'Merge Failed',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setIsMerging(false);
    }
  };

  if (!originalRule || !forkedRule) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[98vw] h-[95vh] max-w-full overflow-hidden flex flex-col p-0">
        {/* Header - Professional with fork info */}
        <div className="flex-shrink-0 border-b border-border/50 bg-gradient-to-r from-primary/5 to-transparent px-6 py-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3 flex-1 min-w-0">
              <GitMerge className="w-6 h-6 text-primary flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <DialogTitle className="text-xl">Merge Forked Rule</DialogTitle>
                <DialogDescription className="mt-1">
                  Review the comparison below. Both panels scroll together for easy line-by-line review.
                </DialogDescription>
              </div>
            </div>
            <button
              onClick={onClose}
              className="flex-shrink-0 text-muted-foreground hover:text-foreground transition-colors p-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Fork info banner */}
          <div className="mt-4 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
            <div className="flex items-center gap-3">
              <Avatar className="w-9 h-9 flex-shrink-0">
                <AvatarImage src={forkedRule.author?.profile?.avatar} />
                <AvatarFallback className="text-xs">
                  {forkedRule.author?.profile?.firstName?.charAt(0) ||
                    forkedRule.author?.username?.charAt(0) ||
                    'U'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-blue-900 dark:text-blue-100">
                  {forkedRule.author?.profile?.firstName || forkedRule.author?.username || 'Unknown'}
                </p>
                <p className="text-xs text-blue-800 dark:text-blue-200">
                  Forked "{forkedRule.title}" on {new Date(forkedRule.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Content - Main diff view area */}
        <div className="flex-1 overflow-hidden flex flex-col px-6 py-4 gap-4">
          {/* Query comparison - main focus */}
          <div className="flex-1 min-h-0 flex flex-col gap-2">
            <h3 className="text-sm font-semibold">Detection Query Comparison</h3>
            <div className="flex-1 min-h-0">
              <SplitDiffView
                originalContent={originalRule.ruleContent?.query || originalRule.content || ''}
                forkedContent={forkedRule.ruleContent?.query || forkedRule.content || ''}
                title=""
              />
            </div>
          </div>

          {/* Expandable Metadata & Description */}
          <div className="flex-shrink-0 border-t border-border pt-4">
            <button
              onClick={() => toggleSection('metadata')}
              className="w-full flex items-center justify-between px-3 py-2 rounded-lg border border-border hover:bg-secondary/50 transition-colors"
            >
              <span className="text-sm font-semibold">Metadata & Description</span>
              {expandedSections.has('metadata') ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>

            {expandedSections.has('metadata') && (
              <div className="mt-3 space-y-3 pl-3 border-l-2 border-primary/30">
                {originalRule.description !== forkedRule.description && (
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-muted-foreground">Description</p>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 rounded bg-secondary/30 border border-border text-sm">
                        <p className="text-xs font-semibold text-muted-foreground mb-1">Original</p>
                        <p className="text-sm">{originalRule.description}</p>
                      </div>
                      <div className="p-3 rounded bg-green-500/10 border border-green-500/30 text-sm">
                        <p className="text-xs font-semibold text-green-700 dark:text-green-300 mb-1">Updated</p>
                        <p className="text-sm">{forkedRule.description}</p>
                      </div>
                    </div>
                  </div>
                )}

                {forkedRule.severity && originalRule.severity !== forkedRule.severity && (
                  <div className="p-3 rounded bg-orange-500/10 border border-orange-500/30">
                    <p className="text-xs text-muted-foreground mb-2 font-semibold">Severity Change</p>
                    <div className="flex items-center gap-2 text-sm">
                      <Badge variant="outline">{originalRule.severity}</Badge>
                      <span className="text-xs text-muted-foreground">→</span>
                      <Badge variant="outline" className="bg-orange-500/20 text-orange-700 dark:text-orange-300 border-orange-500/30">
                        {forkedRule.severity}
                      </Badge>
                    </div>
                  </div>
                )}

                {forkedRule.tags && forkedRule.tags.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground mb-2">Tags from Fork</p>
                    <div className="flex flex-wrap gap-1">
                      {forkedRule.tags.map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Confirmation warning */}
          {confirmMerge && (
            <Alert className="border-red-500/50 bg-red-500/10 mt-2">
              <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <AlertDescription className="text-xs text-red-700 dark:text-red-300">
                <strong>Confirm action:</strong> This will apply all changes shown above to your original rule and create a new version in the history.
              </AlertDescription>
            </Alert>
          )}
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 border-t border-border/50 bg-gradient-to-r from-secondary/50 to-transparent px-6 py-4 flex items-center justify-between gap-3">
          <div className="text-xs text-muted-foreground">
            {!confirmMerge ? (
              <span>Review the changes above. Changes will create a new version.</span>
            ) : (
              <span className="text-red-600 dark:text-red-400 font-semibold">Ready to merge. This action cannot be undone easily.</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={onClose} disabled={isMerging} className="text-sm h-9">
              Cancel
            </Button>
            {!confirmMerge ? (
              <Button
                onClick={() => setConfirmMerge(true)}
                className="gap-2 text-sm h-9 bg-primary hover:bg-primary/90"
                variant="default"
              >
                <GitMerge className="w-4 h-4" />
                Review & Merge
              </Button>
            ) : (
              <>
                <Button
                  variant="outline"
                  onClick={() => setConfirmMerge(false)}
                  disabled={isMerging}
                  className="text-sm h-9"
                >
                  Back
                </Button>
                <Button
                  onClick={handleMerge}
                  disabled={isMerging}
                  className="gap-2 text-sm h-9 bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-800"
                >
                  {isMerging ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Merging...
                    </>
                  ) : (
                    <>
                      <GitMerge className="w-4 h-4" />
                      Confirm Merge
                    </>
                  )}
                </Button>
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
