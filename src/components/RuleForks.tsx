import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { GitFork, ChevronRight, Loader2, GitMerge } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/StatusBadge';
import { titleToSlug } from '@/lib/slugUtils';
import { MergeRuleModal } from '@/components/modals/MergeRuleModal';
import { api } from '@/services/api';
import { useAuth } from '@/hooks/useAuth';
import type { Rule } from '@/types';

interface RuleForksProps {
  ruleId: string;
  ruleAuthorId?: string;
  initialForkCount?: number;
  originalRule?: Rule;
  onForkCountChange?: (count: number) => void;
}

export function RuleForks({ ruleId, ruleAuthorId, initialForkCount = 0, originalRule, onForkCountChange }: RuleForksProps) {
  const { user } = useAuth();
  const [forks, setForks] = useState<Rule[]>([]);
  const [isMergeModalOpen, setIsMergeModalOpen] = useState(false);
  const [selectedForkForMerge, setSelectedForkForMerge] = useState<Rule | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Only show this component if current user is the original rule owner
  const isRuleOwner = user && ruleAuthorId && (user._id === ruleAuthorId || user.id === ruleAuthorId);

  useEffect(() => {
    console.log('RuleForks mounted - isRuleOwner:', isRuleOwner, 'initialForkCount:', initialForkCount);
    if (isRuleOwner) {
      fetchForks();
    }
  }, [ruleId, isRuleOwner]);

  const fetchForks = async () => {
    if (!ruleId) return;
    setIsLoading(true);
    setError(null);
    try {
      // Fetch all rules and filter for forks of this rule
      const response = await api.getRules({}, 1, 100);
      
      // Extract rules array from response data
      const rulesArray = response.data?.rules || Object.values(response.data || {}).flat().filter(item => item._id || item.id);
      
      console.log('Fetching forks for rule:', ruleId);
      console.log('Is rule owner:', isRuleOwner);
      console.log('Total rules fetched:', rulesArray.length);
      
      // Filter for forks of this rule that are:
      // 1. Forks of this rule (parentRuleId or forkedFrom matches)
      // 2. PUBLIC visibility (only show public forks to the owner)
      // 3. APPROVED status (only show published forks)
      // 4. NOT merged (only show unmerged forks, not merged ones)
      const forksOfThisRule = rulesArray.filter(
        (rule: Rule) => {
          const isFork = rule.parentRuleId === ruleId || rule.forkedFrom === ruleId;
          const isPublic = rule.visibility === 'PUBLIC';
          const isApproved = rule.status === 'APPROVED';
          const isNotMerged = !rule.mergedAt;
          
          if (isFork) {
            console.log(`Found fork: ${rule.title} - Public: ${isPublic}, Approved: ${isApproved}, Merged: ${rule.mergedAt ? 'yes' : 'no'}`);
          }
          
          return isFork && isPublic && isApproved && isNotMerged;
        }
      );
      
      console.log('Filtered forks:', forksOfThisRule.length);
      setForks(forksOfThisRule);
      // Notify parent component of fork count
      onForkCountChange?.(forksOfThisRule.length);
    } catch (err) {
      console.error('Error fetching forks:', err);
      setError('Failed to load forks');
    } finally {
      setIsLoading(false);
    }
  };

  // Don't render if user is not the rule owner
  if (!isRuleOwner) {
    console.log('Not rendering RuleForks - user is not rule owner');
    return null;
  }

  console.log('Rendering RuleForks - isLoading:', isLoading, 'forksCount:', forks.length);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <GitFork className="w-4 h-4" />
          Forks ({forks.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {isLoading ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <p className="text-sm text-destructive">{error}</p>
        ) : forks.length === 0 ? (
          <p className="text-sm text-muted-foreground">No forks yet</p>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {forks.map((fork) => (
              <div
                key={fork._id || fork.id}
                className="p-3 rounded-lg border border-border hover:bg-secondary/50 transition-colors"
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <Link
                    to={`/rules/${titleToSlug(fork.title)}`}
                    className="flex-1 min-w-0 block"
                  >
                    <h4 className="font-medium text-sm truncate hover:text-primary">
                      {fork.title}
                    </h4>
                  </Link>
                  <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-1" />
                </div>

                <div className="flex items-center gap-2 mt-1 mb-2">
                  {fork.author && (
                    <div className="flex items-center gap-1">
                      <Avatar className="w-5 h-5">
                        <AvatarImage src={fork.author?.profile?.avatar} />
                        <AvatarFallback className="text-xs">
                          {fork.author?.profile?.firstName?.charAt(0) || fork.author?.username?.charAt(0) || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-xs text-muted-foreground truncate">
                        {fork.author?.profile?.firstName || fork.author?.username || 'Unknown'}
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 flex-wrap mb-2">
                  <StatusBadge status={fork.status || 'DRAFT'} />
                  {fork.severity && (
                    <Badge variant="outline" className="text-xs">
                      {fork.severity}
                    </Badge>
                  )}
                </div>

                {/* Merge Button */}
                <div className="flex gap-1 pt-2 border-t">
                  <Link to={`/rules/${titleToSlug(fork.title)}`} className="flex-1">
                    <Button variant="ghost" size="sm" className="w-full text-xs h-8">
                      View Details
                    </Button>
                  </Link>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-green-600 hover:text-green-700 hover:bg-green-100 dark:hover:bg-green-950 h-8"
                    onClick={() => {
                      setSelectedForkForMerge(fork);
                      setIsMergeModalOpen(true);
                    }}
                  >
                    <GitMerge className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
        
        {forks.length > 0 && (
          <Link
            to={`/rules?forkedFrom=${ruleId}`}
            className="text-sm text-primary hover:underline inline-flex items-center gap-1 pt-2"
          >
            View all forks
            <ChevronRight className="w-3 h-3" />
          </Link>
        )}
      </CardContent>

      {/* Merge Rule Modal */}
      {originalRule && selectedForkForMerge && (
        <MergeRuleModal
          isOpen={isMergeModalOpen}
          onClose={() => {
            setIsMergeModalOpen(false);
            setSelectedForkForMerge(null);
          }}
          originalRule={originalRule}
          forkedRule={selectedForkForMerge}
          onMergeSuccess={() => {
            fetchForks(); // Refresh the forks list
          }}
        />
      )}
    </Card>
  );
}
