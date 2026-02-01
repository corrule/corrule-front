import { useEffect, useRef, useState, useCallback } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface DiffLine {
  type: 'add' | 'remove' | 'context';
  content: string;
  lineNumber: number;
  originalLineNumber?: number;
}

interface DiffChunk {
  id: string;
  startLine: number;
  endLine: number;
  lines: DiffLine[];
  hasChanges: boolean;
}

interface SplitDiffViewProps {
  originalContent: string;
  forkedContent: string;
  title?: string;
}

export function SplitDiffView({
  originalContent,
  forkedContent,
  title = 'Content Comparison',
}: SplitDiffViewProps) {
  const leftScrollRef = useRef<HTMLDivElement>(null);
  const rightScrollRef = useRef<HTMLDivElement>(null);
  const [expandedChunks, setExpandedChunks] = useState<Set<string>>(new Set());
  const [isScrollingSynced, setIsScrollingSynced] = useState(true);

  // Parse lines
  const parseLines = (content: string): string[] => {
    return content.split('\n').map(line => line.trimEnd());
  };

  const originalLines = parseLines(originalContent);
  const forkedLines = parseLines(forkedContent);

  // Generate diff with line tracking
  const generateDiff = (): DiffLine[] => {
    const diff: DiffLine[] = [];
    const maxLines = Math.max(originalLines.length, forkedLines.length);
    let origLineNum = 1;
    let forkedLineNum = 1;

    for (let i = 0; i < maxLines; i++) {
      const origLine = originalLines[i];
      const forkedLine = forkedLines[i];

      if (origLine === forkedLine) {
        diff.push({
          type: 'context',
          content: origLine || '',
          lineNumber: forkedLineNum,
          originalLineNumber: origLineNum,
        });
        origLineNum++;
        forkedLineNum++;
      } else {
        // Handle removed lines
        if (origLine !== undefined) {
          diff.push({
            type: 'remove',
            content: origLine,
            lineNumber: -1, // No line number for removals in right panel
            originalLineNumber: origLineNum,
          });
          origLineNum++;
        }

        // Handle added lines
        if (forkedLine !== undefined) {
          diff.push({
            type: 'add',
            content: forkedLine,
            lineNumber: forkedLineNum,
            originalLineNumber: -1, // No line number for additions in left panel
          });
          forkedLineNum++;
        }
      }
    }

    return diff;
  };

  // Group diff into chunks (changed + context around it)
  const generateChunks = (): DiffChunk[] => {
    const diff = generateDiff();
    const chunks: DiffChunk[] = [];
    let currentChunk: DiffLine[] = [];
    let chunkStartLine = 1;
    let hasChangesInChunk = false;

    const CONTEXT_LINES = 3; // Show 3 lines of context around changes
    let contextAfter = 0;

    for (let i = 0; i < diff.length; i++) {
      const line = diff[i];

      if (line.type !== 'context') {
        hasChangesInChunk = true;
        contextAfter = CONTEXT_LINES;
        currentChunk.push(line);
      } else if (contextAfter > 0 || currentChunk.length === 0) {
        currentChunk.push(line);
        contextAfter--;
      } else if (currentChunk.length > 0) {
        // End current chunk
        chunks.push({
          id: `chunk-${chunks.length}`,
          startLine: chunkStartLine,
          endLine: chunkStartLine + currentChunk.length,
          lines: currentChunk,
          hasChanges: hasChangesInChunk,
        });
        currentChunk = [];
        hasChangesInChunk = false;
        chunkStartLine += currentChunk.length;
      } else {
        currentChunk.push(line);
      }
    }

    // Add remaining chunk
    if (currentChunk.length > 0) {
      chunks.push({
        id: `chunk-${chunks.length}`,
        startLine: chunkStartLine,
        endLine: chunkStartLine + currentChunk.length,
        lines: currentChunk,
        hasChanges: hasChangesInChunk,
      });
    }

    return chunks;
  };

  const chunks = generateChunks();
  const allDiffLines = generateDiff();

  // Calculate statistics
  const stats = {
    additions: allDiffLines.filter(l => l.type === 'add').length,
    deletions: allDiffLines.filter(l => l.type === 'remove').length,
    changed: chunks.filter(c => c.hasChanges).length,
  };

  // Sync scrolling
  useEffect(() => {
    if (!isScrollingSynced) return;

    let syncTimeout: NodeJS.Timeout;

    const handleLeftScroll = () => {
      if (rightScrollRef.current) {
        syncTimeout = setTimeout(() => {
          if (leftScrollRef.current && rightScrollRef.current) {
            const scrollPercentage =
              leftScrollRef.current.scrollTop /
              (leftScrollRef.current.scrollHeight - leftScrollRef.current.clientHeight);
            rightScrollRef.current.scrollTop =
              scrollPercentage * (rightScrollRef.current.scrollHeight - rightScrollRef.current.clientHeight);
          }
        }, 0);
      }
    };

    const handleRightScroll = () => {
      if (leftScrollRef.current) {
        syncTimeout = setTimeout(() => {
          if (rightScrollRef.current && leftScrollRef.current) {
            const scrollPercentage =
              rightScrollRef.current.scrollTop /
              (rightScrollRef.current.scrollHeight - rightScrollRef.current.clientHeight);
            leftScrollRef.current.scrollTop =
              scrollPercentage * (leftScrollRef.current.scrollHeight - leftScrollRef.current.clientHeight);
          }
        }, 0);
      }
    };

    const leftPanel = leftScrollRef.current;
    const rightPanel = rightScrollRef.current;

    if (leftPanel) leftPanel.addEventListener('scroll', handleLeftScroll);
    if (rightPanel) rightPanel.addEventListener('scroll', handleRightScroll);

    return () => {
      if (leftPanel) leftPanel.removeEventListener('scroll', handleLeftScroll);
      if (rightPanel) rightPanel.removeEventListener('scroll', handleRightScroll);
      clearTimeout(syncTimeout);
    };
  }, [isScrollingSynced]);

  const toggleChunk = (chunkId: string) => {
    const newSet = new Set(expandedChunks);
    if (newSet.has(chunkId)) {
      newSet.delete(chunkId);
    } else {
      newSet.add(chunkId);
    }
    setExpandedChunks(newSet);
  };

  // Render a single diff line
  const renderDiffLine = (line: DiffLine, panelType: 'left' | 'right') => {
    const isRelevantToPanel =
      panelType === 'left'
        ? line.type !== 'add'
        : line.type !== 'remove';

    if (!isRelevantToPanel) {
      return (
        <div key={`${line.type}-${line.originalLineNumber}-${line.lineNumber}`} className="h-6"></div>
      );
    }

    const lineNum = panelType === 'left' ? line.originalLineNumber : line.lineNumber;
    const isHighlighted = line.type !== 'context';

    return (
      <div
        key={`${line.type}-${line.originalLineNumber}-${line.lineNumber}`}
        className={`
          flex font-mono text-xs leading-6 group
          ${isHighlighted ? (
            line.type === 'remove'
              ? 'bg-red-600/20 hover:bg-red-600/30'
              : 'bg-green-600/20 hover:bg-green-600/30'
          ) : 'hover:bg-secondary/50'}
          transition-colors
        `}
      >
        {/* Line number column */}
        <div className="w-12 flex-shrink-0 px-2 py-0 text-right text-muted-foreground select-none bg-secondary/20 border-r border-border/50 group-hover:bg-secondary/40">
          {lineNum > 0 ? lineNum : ''}
        </div>

        {/* Operator column */}
        <div className="w-6 flex-shrink-0 px-1 py-0 text-center font-bold select-none border-r border-border/50">
          {line.type === 'remove' ? (
            <span className="text-red-500">−</span>
          ) : line.type === 'add' ? (
            <span className="text-green-500">+</span>
          ) : (
            <span className="text-muted-foreground/30"> </span>
          )}
        </div>

        {/* Content column */}
        <div className="flex-1 px-3 py-0 overflow-hidden break-words whitespace-pre-wrap">
          <span className={isHighlighted ? 'font-semibold' : ''}>
            {line.content || <span className="text-muted-foreground italic">empty line</span>}
          </span>
        </div>
      </div>
    );
  };

  // Render chunk section
  const renderChunk = (chunk: DiffChunk) => {
    const isExpanded = expandedChunks.has(chunk.id) || chunk.hasChanges;

    return (
      <div key={chunk.id} className="border-b border-border/30">
        {!isExpanded && (
          <button
            onClick={() => toggleChunk(chunk.id)}
            className="w-full flex items-center gap-2 px-3 py-2 text-xs text-muted-foreground hover:bg-secondary/30 transition-colors"
          >
            <ChevronDown className="w-4 h-4" />
            <span>{chunk.lines.filter(l => l.type === 'context').length} lines unchanged</span>
          </button>
        )}

        {isExpanded && (
          <div>
            {chunk.hasChanges && (
              <button
                onClick={() => toggleChunk(chunk.id)}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-muted-foreground hover:bg-secondary/30 transition-colors bg-secondary/10 border-b border-border/30"
              >
                <ChevronUp className="w-4 h-4" />
                <span>Hide unchanged</span>
              </button>
            )}

            <div className="flex">
              {/* Left panel */}
              <div className="flex-1 border-r border-border/30 overflow-hidden">
                {chunk.lines.map((line) => renderDiffLine(line, 'left'))}
              </div>

              {/* Right panel */}
              <div className="flex-1 overflow-hidden">
                {chunk.lines.map((line) => renderDiffLine(line, 'right'))}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full gap-3">
      {/* Header with statistics */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold">{title}</h3>
          <button
            onClick={() => setIsScrollingSynced(!isScrollingSynced)}
            className={`text-xs px-2 py-1 rounded transition-colors ${
              isScrollingSynced
                ? 'bg-blue-600/20 text-blue-700 dark:text-blue-300'
                : 'bg-secondary/30 text-muted-foreground'
            }`}
          >
            {isScrollingSynced ? '🔗 Sync' : '🔓 Free'}
          </button>
        </div>

        {/* Statistics bar */}
        <div className="flex items-center gap-4 text-xs font-medium">
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-sm bg-green-500"></span>
            <span className="text-green-700 dark:text-green-400">{stats.additions} additions</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-sm bg-red-500"></span>
            <span className="text-red-700 dark:text-red-400">{stats.deletions} deletions</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-sm bg-blue-500"></span>
            <span className="text-muted-foreground">{stats.changed} changed</span>
          </div>
        </div>
      </div>

      {/* Split panel container */}
      <div className="flex-1 border border-border rounded-lg overflow-hidden bg-background">
        {/* Panel headers */}
        <div className="flex border-b border-border bg-secondary/30">
          <div className="flex-1 px-3 py-2 text-xs font-semibold text-muted-foreground border-r border-border">
            Original Rule
          </div>
          <div className="flex-1 px-3 py-2 text-xs font-semibold text-muted-foreground">
            Forked Rule
          </div>
        </div>

        {/* Content area with split panels */}
        <div className="flex h-full overflow-hidden">
          {/* Left panel (original) */}
          <div
            ref={leftScrollRef}
            className="flex-1 overflow-y-auto overflow-x-hidden"
          >
            <div className="flex flex-col">
              {chunks.map((chunk) => {
                const isExpanded = expandedChunks.has(chunk.id) || chunk.hasChanges;
                return (
                  <div key={chunk.id}>
                    {!isExpanded && (
                      <button
                        onClick={() => toggleChunk(chunk.id)}
                        className="w-full flex items-center gap-2 px-3 py-2 text-xs text-muted-foreground hover:bg-secondary/30 transition-colors"
                      >
                        <ChevronDown className="w-4 h-4" />
                        <span>{chunk.lines.filter(l => l.type === 'context').length} lines</span>
                      </button>
                    )}

                    {isExpanded && (
                      <div>
                        {chunk.hasChanges && (
                          <button
                            onClick={() => toggleChunk(chunk.id)}
                            className="w-full flex items-center gap-2 px-3 py-2 text-xs text-muted-foreground hover:bg-secondary/30 transition-colors bg-secondary/10 border-b border-border/30"
                          >
                            <ChevronUp className="w-4 h-4" />
                            <span>Hide unchanged</span>
                          </button>
                        )}

                        <div>
                          {chunk.lines.map((line) => renderDiffLine(line, 'left'))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right panel (forked) */}
          <div
            ref={rightScrollRef}
            className="flex-1 overflow-y-auto overflow-x-hidden border-l border-border"
          >
            <div className="flex flex-col">
              {chunks.map((chunk) => {
                const isExpanded = expandedChunks.has(chunk.id) || chunk.hasChanges;
                return (
                  <div key={chunk.id}>
                    {!isExpanded && (
                      <button
                        onClick={() => toggleChunk(chunk.id)}
                        className="w-full flex items-center gap-2 px-3 py-2 text-xs text-muted-foreground hover:bg-secondary/30 transition-colors"
                      >
                        <ChevronDown className="w-4 h-4" />
                        <span>{chunk.lines.filter(l => l.type === 'context').length} lines</span>
                      </button>
                    )}

                    {isExpanded && (
                      <div>
                        {chunk.hasChanges && (
                          <button
                            onClick={() => toggleChunk(chunk.id)}
                            className="w-full flex items-center gap-2 px-3 py-2 text-xs text-muted-foreground hover:bg-secondary/30 transition-colors bg-secondary/10 border-b border-border/30"
                          >
                            <ChevronUp className="w-4 h-4" />
                            <span>Hide unchanged</span>
                          </button>
                        )}

                        <div>
                          {chunk.lines.map((line) => renderDiffLine(line, 'right'))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
