import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, Clock, Eye, GitFork, Link as LinkIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import { titleToSlug } from '@/lib/slugUtils';
import type { Rule } from '@/types';

interface ModerationQueueCardProps {
  rule: Rule;
  onReview: (rule: Rule) => void;
  isLoading?: boolean;
}

export function ModerationQueueCard({
  rule,
  onReview,
  isLoading = false,
}: ModerationQueueCardProps) {
  const authorName =
    typeof rule.author === 'object' ? rule.author.username : rule.author;
  const submittedDate = new Date(rule.createdAt || new Date());
  const daysAgo = Math.floor(
    (Date.now() - submittedDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  return (
    <Card className="hover:shadow-md transition overflow-hidden">
      <CardContent className="p-4 space-y-3">
        {/* Header */}
        <div className="flex justify-between items-start gap-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-lg truncate">{rule.title}</h3>
            <p className="text-sm text-slate-400 truncate">
              By {authorName} • {rule.visibility}
            </p>
          </div>
          <Badge className="bg-amber-100 text-amber-800 whitespace-nowrap">
            <Clock className="w-3 h-3 mr-1" />
            {daysAgo === 0 ? 'Today' : `${daysAgo}d ago`}
          </Badge>
        </div>

        {/* Description */}
        <div className="p-3 bg-slate-50 rounded text-sm space-y-2">
          <p className="line-clamp-2 text-black">{rule.description}</p>

          {/* Fork Information */}
          {(rule.parentRuleId || rule.forkedFrom) && (
            <div className="p-2 bg-blue-50 border border-blue-200 rounded text-xs text-blue-800 flex items-center gap-2 mt-2">
              <GitFork className="w-3 h-3" />
              <span>Forked from</span>
              <Link
                to={`/rules/${rule.parentRuleId || rule.forkedFrom}`}
                className="underline font-semibold hover:text-blue-900"
                target="_blank"
                rel="noopener noreferrer"
              >
                original rule
              </Link>
            </div>
          )}

          {/* Rule Metadata */}
          <div className="grid grid-cols-2 gap-2 text-xs text-slate-700 pt-2 border-t">
            <div>
              <span className="font-medium">Category:</span> {rule.category || 'N/A'}
            </div>
            {rule.severity && (
              <div>
                <span className="font-medium">Severity:</span> {rule.severity}
              </div>
            )}
            {rule.pricing?.isPaid && (
              <div>
                <span className="font-medium">Price:</span> ${rule.pricing.price?.toFixed(2)}
              </div>
            )}
            {rule.mitre && rule.mitre.length > 0 && (
              <div>
                <span className="font-medium">MITRE ATT&CK:</span> {rule.mitre.length} mapped
              </div>
            )}
          </div>
        </div>

        {/* Quality Indicators */}
        <div className="grid grid-cols-3 gap-2 text-xs">
          <div className="p-2 bg-blue-50 rounded text-center">
            <div className="font-semibold text-blue-900">{rule.downloads || 0}</div>
            <div className="text-slate-600">Downloads</div>
          </div>
          <div className="p-2 bg-green-50 rounded text-center">
            <div className="font-semibold text-green-900">
              {rule.rating ? rule.rating.toFixed(1) : 'N/A'}
            </div>
            <div className="text-slate-600">Rating</div>
          </div>
          <div className="p-2 bg-purple-50 rounded text-center">
            <div className="font-semibold text-purple-900">{rule.likes || 0}</div>
            <div className="text-slate-600">Likes</div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          <Button
            size="sm"
            className="flex-1 gap-2"
            onClick={() => onReview(rule)}
            disabled={isLoading}
          >
            <Eye className="w-4 h-4" />
            Review & Decide
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
