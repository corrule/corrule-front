import { cn } from '@/lib/utils';
import type { MitreMapping, MitreTactic } from '@/types';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

const tacticColors: Record<MitreTactic, string> = {
  'reconnaissance': 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  'resource-development': 'bg-pink-500/20 text-pink-400 border-pink-500/30',
  'initial-access': 'bg-red-500/20 text-red-400 border-red-500/30',
  'execution': 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  'persistence': 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  'privilege-escalation': 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  'defense-evasion': 'bg-lime-500/20 text-lime-400 border-lime-500/30',
  'credential-access': 'bg-green-500/20 text-green-400 border-green-500/30',
  'discovery': 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  'lateral-movement': 'bg-teal-500/20 text-teal-400 border-teal-500/30',
  'collection': 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
  'command-and-control': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  'exfiltration': 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30',
  'impact': 'bg-violet-500/20 text-violet-400 border-violet-500/30',
};

const tacticLabels: Record<MitreTactic, string> = {
  'reconnaissance': 'Reconnaissance',
  'resource-development': 'Resource Development',
  'initial-access': 'Initial Access',
  'execution': 'Execution',
  'persistence': 'Persistence',
  'privilege-escalation': 'Privilege Escalation',
  'defense-evasion': 'Defense Evasion',
  'credential-access': 'Credential Access',
  'discovery': 'Discovery',
  'lateral-movement': 'Lateral Movement',
  'collection': 'Collection',
  'command-and-control': 'Command & Control',
  'exfiltration': 'Exfiltration',
  'impact': 'Impact',
};

interface MitreBadgeProps {
  mapping: MitreMapping;
  compact?: boolean;
  className?: string;
}

export function MitreBadge({ mapping, compact = false, className }: MitreBadgeProps) {
  const colorClass = tacticColors[mapping.tactic] || 'bg-secondary text-secondary-foreground';
  
  if (compact) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge variant="outline" className={cn('text-xs border', colorClass, className)}>
            {mapping.techniqueId || tacticLabels[mapping.tactic]}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <div className="text-sm">
            {mapping.techniqueName && <p className="font-medium">{mapping.techniqueName}</p>}
            {mapping.subtechniqueName && (
              <p className="text-muted-foreground">{mapping.subtechniqueId}: {mapping.subtechniqueName}</p>
            )}
            <p className="text-xs text-muted-foreground mt-1">{tacticLabels[mapping.tactic]}</p>
          </div>
        </TooltipContent>
      </Tooltip>
    );
  }

  return (
    <div className={cn('inline-flex flex-col gap-1', className)}>
      <Badge variant="outline" className={cn('text-xs border', colorClass)}>
        {tacticLabels[mapping.tactic]}
      </Badge>
      {mapping.techniqueId && (
        <div className="text-xs text-muted-foreground">
          <span className="font-mono">{mapping.techniqueId}</span>
          {mapping.subtechniqueId && (
            <span className="font-mono text-muted-foreground/70"> / {mapping.subtechniqueId}</span>
          )}
        </div>
      )}
    </div>
  );
}

interface MitreMappingListProps {
  mappings: MitreMapping[];
  compact?: boolean;
  maxVisible?: number;
  className?: string;
}

export function MitreMappingList({ mappings, compact = true, maxVisible = 3, className }: MitreMappingListProps) {
  const visible = mappings.slice(0, maxVisible);
  const remaining = mappings.length - maxVisible;

  return (
    <div className={cn('flex flex-wrap gap-1.5', className)}>
      {visible.map((mapping, index) => (
        <MitreBadge key={index} mapping={mapping} compact={compact} />
      ))}
      {remaining > 0 && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge variant="outline" className="text-xs bg-secondary/50">
              +{remaining} more
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <div className="space-y-1">
              {mappings.slice(maxVisible).map((mapping, index) => (
                <div key={index} className="text-xs">
                  <span className="font-mono">{mapping.techniqueId}</span>: {mapping.techniqueName}
                </div>
              ))}
            </div>
          </TooltipContent>
        </Tooltip>
      )}
    </div>
  );
}
