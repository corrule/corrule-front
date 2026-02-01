import { Link } from 'react-router-dom';
import { Download, Heart, GitFork, Star, Eye, Lock, DollarSign, MessageCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { titleToSlug } from '@/lib/slugUtils';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { StatusBadge } from '@/components/StatusBadge';
import { MitreMappingList } from '@/components/MitreBadge';
import { useAuth } from '@/hooks/useAuth';
import type { Rule } from '@/types';

interface RuleCardProps {
  rule: Rule;
  className?: string;
}

  const severityColors = {
  low: 'bg-success/20 text-success border-success/30',
  medium: 'bg-warning/20 text-warning border-warning/30',
  high: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  critical: 'bg-destructive/20 text-destructive border-destructive/30',
};

export function RuleCard({ rule, className }: RuleCardProps) {
  const { user } = useAuth();
  
  // Convert tactics strings to MitreMapping objects if needed
  const mitreMappings = rule.mitre && rule.mitre.length > 0 
    ? rule.mitre 
    : (rule.mitreAttack?.tactics?.map((tactic: string) => ({
        tactic: tactic as any,
        techniqueId: '',
        techniqueName: '',
      })) || []) as any[];
  const platforms = rule.platform || [rule.vendor].filter(Boolean) || [];
  const severity = rule.severity?.toLowerCase() || 'medium';
  const downloads = rule.downloads || rule.statistics?.downloads || 0;
  const likes = rule.likes || (rule.statistics?.likes || 0);
  const rating = rule.rating || rule.statistics?.rating || 0;
  const reviewCount = rule.reviewCount || 0;
  const isPaid = rule.pricing?.isPaid || rule.visibility === 'PAID' || rule.visibility?.toUpperCase() === 'PAID';
  const price = rule.price || rule.pricing?.price || 0;
  // Use calculated fork count if available, otherwise fall back to stored value
  const forkCount = (rule as any)._calculatedForkCount !== undefined ? (rule as any)._calculatedForkCount : (rule.forks || rule.forkCount || 0);
  
  // Check if current user has liked this rule
  const isLiked = user?.likedRules?.includes(rule._id || rule.id || '');

  return (
    <Link to={`/rules/${titleToSlug(rule.title)}`}>
      <Card className={cn('h-full hover-lift transition-all cursor-pointer border-border/50 hover:border-primary/30', className)}>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1 min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <StatusBadge status={rule.status} />
                <Badge variant="outline" className={cn('text-xs', severityColors[severity])}>
                  {severity.toUpperCase()}
                </Badge>
                {/* Fork Type Indicator */}
                {rule.parentRuleId || rule.forkedFrom ? (
                  <Badge variant="outline" className="text-xs bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30">
                    <GitFork className="w-3 h-3 mr-1" />
                    Fork
                  </Badge>
                ) : forkCount > 0 ? (
                  <Badge variant="outline" className="text-xs bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/30">
                    Original
                  </Badge>
                ) : null}
                {rule.category && (
                  <Badge variant="secondary" className="text-xs">
                    {rule.category}
                  </Badge>
                )}
                {rule.visibility && (rule.visibility === 'PRIVATE' || rule.visibility?.toUpperCase() === 'PRIVATE') && (
                  <Badge variant="outline" className="text-xs bg-secondary/50">
                    <Lock className="w-3 h-3 mr-1" />
                    Private
                  </Badge>
                )}
                {isPaid && (
                  <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/30">
                    <DollarSign className="w-3 h-3 mr-1" />
                    {price}
                  </Badge>
                )}
              </div>
          <h3 className="font-semibold text-base line-clamp-1 text-foreground group-hover:text-primary transition-colors">
            {rule.title}
          </h3>
            </div>
          </div>
          <p className="text-sm text-slate-400 line-clamp-2 mt-2">
            {rule.description}
          </p>
        </CardHeader>

        <CardContent className="pb-3">
          {/* MITRE Mappings */}
          {mitreMappings.length > 0 && <MitreMappingList mappings={mitreMappings} maxVisible={3} />}
          
          {/* Platforms */}
          {platforms.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {platforms.map((p) => (
                <Badge key={p} variant="secondary" className="text-xs bg-secondary/50">
                  {p}
                </Badge>
              ))}
            </div>
          )}

          {/* Tags */}
          {rule.tags && rule.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {rule.tags.slice(0, 3).map((tag) => (
                <Badge key={tag} variant="outline" className="text-xs">
                  #{tag}
                </Badge>
              ))}
              {rule.tags.length > 3 && (
                <Badge variant="outline" className="text-xs text-slate-400">
                  +{rule.tags.length - 3}
                </Badge>
              )}
            </div>
          )}
        </CardContent>

        <CardFooter className="flex items-center justify-between pt-3 border-t border-border/50">
          <div className="flex items-center gap-2">
            <Avatar className="w-6 h-6">
              <AvatarImage src={rule.author?.profile?.avatar} />
              <AvatarFallback className="text-xs bg-primary/20 text-primary">
                {rule.author?.username?.[0]?.toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            <span className="text-xs text-slate-400">@{rule.author?.username || 'Unknown'}</span>
          </div>
          
          <div className="flex items-center gap-3 text-xs text-slate-400">
            <span className="flex items-center gap-1">
              <Download className="w-3.5 h-3.5" />
              {downloads.toLocaleString()}
            </span>
            <span className="flex items-center gap-1">
              <Heart className={cn('w-3.5 h-3.5', isLiked && 'fill-destructive text-destructive')} />
              {likes}
            </span>
            <span className="flex items-center gap-1">
              <GitFork className="w-3.5 h-3.5" />
              {forkCount}
            </span>
            {rating > 0 && (
              <span className="flex items-center gap-1">
                <Star className="w-3.5 h-3.5 fill-warning text-warning" />
                {rating.toFixed(1)}
              </span>
            )}
            {reviewCount > 0 && (
              <span className="flex items-center gap-1">
                <MessageCircle className="w-3.5 h-3.5" />
                {reviewCount}
              </span>
            )}
          </div>
        </CardFooter>
      </Card>
    </Link>
  );
}
