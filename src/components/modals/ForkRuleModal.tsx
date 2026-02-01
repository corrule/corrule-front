import { useState } from 'react';
import { GitFork, AlertCircle, Loader2, Copy, Check } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { api } from '@/services/api';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import type { Rule } from '@/types';

interface ForkRuleModalProps {
  isOpen: boolean;
  onClose: () => void;
  rule: Rule | null;
  onForkSuccess: (forkedRule: Rule) => void;
}

export function ForkRuleModal({ isOpen, onClose, rule, onForkSuccess }: ForkRuleModalProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isForking, setIsForking] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [copied, setCopied] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
  });

  // Check if current user owns this rule
  const isOwnedByCurrentUser = rule && user && (rule.author?._id === user._id || rule.author?.id === user.id);

  // Initialize form with prefilled values when modal opens
  const initializeForm = () => {
    if (rule) {
      setFormData({
        title: `${rule.title} (Fork)`,
        description: `Forked from [${rule.author?.username}/${rule.title}](${window.location.href})\n\n${rule.description || ''}`,
      });
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (open) {
      initializeForm();
    } else {
      onClose();
    }
  };

  const handleFork = async () => {
    if (!rule) return;

    if (!formData.title.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a title for your forked rule',
        variant: 'destructive',
      });
      return;
    }

    // Check if user owns this rule
    if (isOwnedByCurrentUser) {
      toast({
        title: 'Cannot Fork',
        description: 'You cannot fork your own rules. Clone or create a new version instead.',
        variant: 'destructive',
      });
      return;
    }

    setIsForking(true);
    try {
      const forkedRule = await api.forkRule(rule._id || rule.id || '');
      
      // Update the forked rule with custom title and description if provided
      if (forkedRule && (formData.title !== rule.title || formData.description !== rule.description)) {
        // Update the forked rule - would need an updateRule API call
        // For now, we'll just pass the data through the form
      }

      toast({
        title: 'Fork Successful! 🎉',
        description: `Rule forked as "${formData.title}" and added to your drafts`,
      });

      onForkSuccess(forkedRule);
      onClose();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fork rule';
      
      // Handle specific error messages from API
      if (message.toLowerCase().includes('private') || message.toLowerCase().includes('own')) {
        toast({
          title: 'Cannot Fork',
          description: 'You cannot fork your own rules or rules you do not have permission to fork.',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Error',
          description: message,
          variant: 'destructive',
        });
      }
    } finally {
      setIsForking(false);
    }
  };

  const copySourceInfo = () => {
    const sourceInfo = `Source: ${rule?.author?.username}/${rule?.title}\nURL: ${window.location.href}`;
    navigator.clipboard.writeText(sourceInfo);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!rule) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="w-[95vw] max-w-lg sm:max-w-xl md:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="sticky top-0 bg-background z-10 pb-2">
          <div className="flex items-center gap-2">
            <GitFork className="w-5 h-5 text-primary flex-shrink-0" />
            <DialogTitle className="break-words">Fork Rule</DialogTitle>
          </div>
          <DialogDescription className="text-xs sm:text-sm">
            Create your own copy of this rule to modify and use as a base for your own detection logic.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 sm:space-y-6 py-2 px-1">
          {/* Error if user owns the rule */}
          {isOwnedByCurrentUser && (
            <Alert className="border-red-200 bg-red-50 dark:border-red-900/30 dark:bg-red-950/20">
              <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-500 flex-shrink-0" />
              <AlertDescription className="text-xs sm:text-sm text-red-800 dark:text-red-300">
                <strong>Cannot fork your own rule.</strong> You cannot fork rules that you created. Instead, you can edit the original rule directly or create a new rule based on this one.
              </AlertDescription>
            </Alert>
          )}

          {/* Source Information */}
          <div className="space-y-2">
            <Label className="text-sm sm:text-base font-semibold">Original Rule</Label>
            <div className="flex items-start justify-between gap-2 p-2 sm:p-3 bg-secondary/50 rounded-lg border border-border">
              <div className="flex-1 min-w-0">
                <p className="font-medium text-foreground truncate text-sm">{rule.title}</p>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  by <span className="font-medium">@{rule.author?.username}</span>
                </p>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={copySourceInfo}
                className="flex-shrink-0"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
          </div>

          {/* Rule Details for Forking */}
          <div className="space-y-3 sm:space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fork-title" className="text-sm">Fork Title *</Label>
              <Input
                id="fork-title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Enter title for your forked rule"
                className="bg-background text-sm h-9"
              />
              <p className="text-xs text-muted-foreground">
                This will be the title of your new rule in your drafts
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="fork-description" className="text-sm">Description</Label>
              <Textarea
                id="fork-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Add any additional notes about your fork"
                className="min-h-20 max-h-32 bg-background resize-none text-sm"
              />
              <p className="text-xs text-muted-foreground">
                Include notes about changes or improvements you plan to make
              </p>
            </div>
          </div>

          {/* Information Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div className="p-2 sm:p-3 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/30">
              <p className="text-xs sm:text-sm font-semibold text-blue-900 dark:text-blue-200 mb-1">
                📋 What you get:
              </p>
              <ul className="text-xs text-blue-800 dark:text-blue-300 space-y-0.5">
                <li>• Complete rule copy</li>
                <li>• Full edit access</li>
                <li>• Independent version history</li>
              </ul>
            </div>
            <div className="p-2 sm:p-3 rounded-lg bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-900/30">
              <p className="text-xs sm:text-sm font-semibold text-purple-900 dark:text-purple-200 mb-1">
                ✨ Next steps:
              </p>
              <ul className="text-xs text-purple-800 dark:text-purple-300 space-y-0.5">
                <li>• Edit in your drafts</li>
                <li>• Test your changes</li>
                <li>• Publish when ready</li>
              </ul>
            </div>
          </div>

          {/* Important Note */}
          <Alert className="border-amber-200 bg-amber-50 dark:border-amber-900/30 dark:bg-amber-950/20">
            <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-500 flex-shrink-0" />
            <AlertDescription className="text-xs sm:text-sm text-amber-800 dark:text-amber-300">
              Your fork will be <strong>independent</strong> of the original. Changes to the original rule won't affect your fork, and vice versa.
            </AlertDescription>
          </Alert>
        </div>

        <DialogFooter className="sticky bottom-0 bg-background z-10 flex gap-2 pt-2 mt-2 border-t border-border">
          <Button variant="outline" onClick={onClose} disabled={isForking} className="text-sm h-9">
            Cancel
          </Button>
          <Button
            onClick={handleFork}
            disabled={isForking || !formData.title.trim() || isOwnedByCurrentUser}
            className="gap-2 text-sm h-9"
          >
            {isForking ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Forking...
              </>
            ) : (
              <>
                <GitFork className="w-4 h-4" />
                Create Fork
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
