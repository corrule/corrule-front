import { useEffect, useRef, useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface DiffLine {
  type: 'add' | 'remove' | 'context';
  content: string;
  lineNumber?: number;
  oldLineNumber?: number;
}

interface DiffViewProps {
  originalContent: string;
  forkedContent: string;
  title?: string;
  language?: string;
}

export function DiffView({ originalContent, forkedContent, title = 'Content Comparison', language = 'sql' }: DiffViewProps) {
  const leftScrollRef = useRef<HTMLDivElement>(null);
  const rightScrollRef = useRef<HTMLDivElement>(null);
  const [expandedContexts, setExpandedContexts] = useState<Set<number>>(new Set([0]));

  // Sync scrolling between panels
  useEffect(() => {
    const handleLeftScroll = () => {
      if (rightScrollRef.current) {
        rightScrollRef.current.scrollTop = leftScrollRef.current?.scrollTop || 0;
      }
    };

    const handleRightScroll = () => {
      if (leftScrollRef.current) {
        leftScrollRef.current.scrollTop = rightScrollRef.current?.scrollTop || 0;
      }
    };

    const leftPanel = leftScrollRef.current;
    const rightPanel = rightScrollRef.current;

    if (leftPanel) leftPanel.addEventListener('scroll', handleLeftScroll);
    if (rightPanel) rightPanel.addEventListener('scroll', handleRightScroll);

    return () => {
      if (leftPanel) leftPanel.removeEventListener('scroll', handleLeftScroll);
      if (rightPanel) rightPanel.removeEventListener('scroll', handleRightScroll);
    };
  }, []);

  // Parse lines from content
  const parseLines = (content: string): string[] => {
    return content.split('\n').map(line => line.trimEnd());
  };

  const originalLines = parseLines(originalContent);
  const forkedLines = parseLines(forkedContent);

  // Calculate basic diff (line-by-line)
  const getDiffLines = (): DiffLine[] => {
    const diff: DiffLine[] = [];
    const maxLines = Math.max(originalLines.length, forkedLines.length);

    for (let i = 0; i < maxLines; i++) {
      const origLine = originalLines[i];
      const forkedLine = forkedLines[i];

      if (origLine === forkedLine) {
        diff.push({
          type: 'context',
          content: origLine || '',
          lineNumber: i + 1,
          oldLineNumber: i + 1,
        });
      } else {
        if (origLine !== undefined) {
          diff.push({
            type: 'remove',
            content: origLine,
            oldLineNumber: i + 1,
          });
        }
        if (forkedLine !== undefined) {
          diff.push({
            type: 'add',
            content: forkedLine,
            lineNumber: i + 1,
          });
        }
      }
    }

    return diff;
  };

  const diffLines = getDiffLines();

  // Count changes
  const addedLines = diffLines.filter(l => l.type === 'add').length;
  const removedLines = diffLines.filter(l => l.type === 'remove').length;
  const contextLines = diffLines.filter(l => l.type === 'context').length;

  // Group diff lines for display
  const renderDiffContent = () => {
    return (
      <div className="space-y-0">
        {diffLines.map((line, idx) => (
          <div
            key={idx}
            className={`
              font-mono text-xs leading-relaxed flex
              ${line.type === 'remove' ? 'bg-red-50/50 dark:bg-red-950/20 border-l-2 border-red-500' : ''}
              ${line.type === 'add' ? 'bg-green-50/50 dark:bg-green-950/20 border-l-2 border-green-500' : ''}
              ${line.type === 'context' ? 'border-l-2 border-border/30' : ''}
              hover:bg-secondary/50 transition-colors
            `}
          >
            {/* Line number column */}
            <div className="w-12 flex-shrink-0 px-2 py-1 text-muted-foreground text-right select-none bg-muted/30">
              {line.type === 'remove' ? line.oldLineNumber : ''}
            </div>

            {/* Operator column */}
            <div className="w-6 flex-shrink-0 px-1 py-1 text-center font-bold select-none">
              {line.type === 'remove' ? (
                <span className="text-red-600 dark:text-red-400">−</span>
              ) : line.type === 'add' ? (
                <span className="text-green-600 dark:text-green-400">+</span>
              ) : (
                <span className="text-muted-foreground"> </span>
              )}
            </div>

            {/* Content column */}
            <div className="flex-1 px-2 py-1 overflow-hidden break-words whitespace-pre-wrap">
              <span className={line.type === 'context' ? '' : 'font-semibold'}>
                {line.content || <span className="text-muted-foreground italic">empty line</span>}
              </span>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Summary Stats */}
      <div className="flex items-center gap-4 text-sm">
        <span className="text-muted-foreground">{title}</span>
        <div className="flex gap-4 ml-auto">
          <div className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-sm bg-green-500/30 border border-green-500"></span>
            <span className="text-green-600 dark:text-green-400">{addedLines} additions</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-sm bg-red-500/30 border border-red-500"></span>
            <span className="text-red-600 dark:text-red-400">{removedLines} deletions</span>
          </div>
        </div>
      </div>

      {/* Diff View */}
      <div className="border border-border rounded-lg overflow-hidden bg-background">
        <div className="max-h-96 overflow-y-auto">
          {renderDiffContent()}
        </div>
      </div>
    </div>
  );
}
