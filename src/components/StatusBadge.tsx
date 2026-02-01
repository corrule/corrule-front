import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import type { RuleStatus } from '@/types';

const statusBadgeVariants = cva(
  'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border transition-colors',
  {
    variants: {
      status: {
        draft: 'bg-warning/10 text-warning border-warning/20',
        review: 'bg-info/10 text-info border-info/20',
        published: 'bg-success/10 text-success border-success/20',
        deprecated: 'bg-destructive/10 text-destructive border-destructive/20',
      },
    },
    defaultVariants: {
      status: 'draft',
    },
  }
);

interface StatusBadgeProps extends VariantProps<typeof statusBadgeVariants> {
  status: RuleStatus;
  showDot?: boolean;
  className?: string;
}

const statusLabels: Record<RuleStatus, string> = {
  draft: 'Draft',
  review: 'In Review',
  published: 'Published',
  deprecated: 'Deprecated',
};

export function StatusBadge({ status, showDot = true, className }: StatusBadgeProps) {
  return (
    <span className={cn(statusBadgeVariants({ status }), className)}>
      {showDot && (
        <span
          className={cn(
            'w-1.5 h-1.5 rounded-full',
            status === 'draft' && 'bg-warning',
            status === 'review' && 'bg-info',
            status === 'published' && 'bg-success',
            status === 'deprecated' && 'bg-destructive'
          )}
        />
      )}
      {statusLabels[status]}
    </span>
  );
}
