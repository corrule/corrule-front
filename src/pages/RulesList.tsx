import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Filter, Grid, List, SlidersHorizontal, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { RuleCard } from '@/components/RuleCard';
import { api } from '@/services/api';
import { mitreTactics } from '@/services/mockData';
import { calculateUnmergedForkCount } from '@/lib/forkUtils';
import type { RuleStatus, RuleFilters, Rule } from '@/types';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

const statusOptions: { value: RuleStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'All Statuses' },
  { value: 'DRAFT' as RuleStatus, label: 'Draft' },
  { value: 'UNDER_REVIEW' as RuleStatus, label: 'In Review' },
  { value: 'APPROVED' as RuleStatus, label: 'Approved' },
  { value: 'REJECTED' as RuleStatus, label: 'Rejected' },
];

const severityOptions = [
  { value: 'all', label: 'All Severities' },
  { value: 'LOW', label: 'Low' },
  { value: 'MEDIUM', label: 'Medium' },
  { value: 'HIGH', label: 'High' },
  { value: 'CRITICAL', label: 'Critical' },
];

const queryLanguageOptions = [
  { value: 'all', label: 'All Languages' },
  { value: 'SIGMA', label: 'SIGMA' },
  { value: 'KQL', label: 'KQL' },
  { value: 'SPL', label: 'SPL' },
  { value: 'YARA', label: 'YARA' },
  { value: 'SURICATA', label: 'SURICATA' },
  { value: 'SNORT', label: 'SNORT' },
  { value: 'LUCENE', label: 'LUCENE' },
  { value: 'ESQL', label: 'ESQL' },
  { value: 'SQL', label: 'SQL' },
  { value: 'XQL', label: 'XQL' },
];

const vendorOptions = [
  { value: 'all', label: 'All Vendors' },
  { value: 'ELASTIC', label: 'Elastic' },
  { value: 'SPLUNK', label: 'Splunk' },
  { value: 'MICROSOFT_SENTINEL', label: 'Microsoft Sentinel' },
  { value: 'CHRONICLE', label: 'Chronicle' },
  { value: 'QRADAR', label: 'QRadar' },
  { value: 'ARCSIGHT', label: 'ArcSight' },
  { value: 'SUMO_LOGIC', label: 'Sumo Logic' },
  { value: 'PALO_ALTO_XDR', label: 'Palo Alto XDR' },
  { value: 'PALO_ALTO_XSIAM', label: 'Palo Alto XSIAM' },
];

const categoryOptions = [
  { value: 'all', label: 'All Categories' },
  { value: 'DETECTION', label: 'Detection' },
  { value: 'HUNTING', label: 'Hunting' },
  { value: 'CORRELATION', label: 'Correlation' },
  { value: 'ENRICHMENT', label: 'Enrichment' },
  { value: 'RESPONSE', label: 'Response' },
  { value: 'MONITORING', label: 'Monitoring' },
  { value: 'FORENSICS', label: 'Forensics' },
];

const visibilityOptions = [
  { value: 'all', label: 'All Visibility' },
  { value: 'PUBLIC', label: 'Public' },
  { value: 'PRIVATE', label: 'Private' },
  { value: 'PAID', label: 'Paid' },
];

const forkTypeOptions = [
  { value: 'all', label: 'All Rules' },
  { value: 'original', label: 'Original Rules Only' },
  { value: 'forked', label: 'Forked Rules Only' },
  { value: 'hasForked', label: 'Has Forks' },
];

const sortOptions = [
  { value: 'newest', label: 'Newest First' },
  { value: 'popular', label: 'Most Popular' },
  { value: 'rating', label: 'Highest Rated' },
  { value: 'downloads', label: 'Most Downloaded' },
];

export default function RulesList() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [rules, setRules] = useState<Rule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
  // Filters
  const [filters, setFilters] = useState<RuleFilters>({
    status: 'all',
    severity: 'all',
    queryLanguage: 'all',
    vendor: 'all',
    category: 'all',
    visibility: 'all',
    forkType: 'all',
    sortBy: 'newest',
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTactics, setSelectedTactics] = useState<string[]>([]);
  
  // Pagination
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // Fetch rules from API
  const fetchRules = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const apiFilters: RuleFilters = {
        ...filters,
        search: searchQuery || undefined,
      };
      if (selectedTactics.length > 0) {
        apiFilters.tactic = selectedTactics[0] as any;
      }

      const response = await api.getRules(apiFilters, page, limit);
      
      // Handle the response structure: { success: true, data: { rules: [...], pagination: {...} } }
      if (response.data?.rules) {
        // Enhance rules with accurate fork counts
        const rulesWithAccurateForkCounts = response.data.rules.map((rule: Rule) => ({
          ...rule,
          // Store the calculated fork count in a temporary property
          _calculatedForkCount: calculateUnmergedForkCount(response.data.rules, rule._id || rule.id || ''),
        }));
        
        setRules(rulesWithAccurateForkCounts);
        if (response.data.pagination) {
          setTotal(response.data.pagination.totalItems || 0);
          setTotalPages(response.data.pagination.totalPages || 0);
        }
      } else {
        setRules([]);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch rules';
      setError(message);
      toast({ title: 'Error', description: message, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRules();
  }, [page, filters, searchQuery, selectedTactics]);

  const handleSearch = (value: string) => {
    setSearchQuery(value);
    setPage(1);
  };

  const handleFilterChange = (key: keyof RuleFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPage(1);
  };

  const toggleTactic = (tactic: string) => {
    setSelectedTactics(prev =>
      prev.includes(tactic)
        ? prev.filter(t => t !== tactic)
        : [tactic]
    );
    setPage(1);
  };

  // Apply fork type filter to rules
  const filteredRules = rules.filter((rule) => {
    if (filters.forkType === 'all') return true;
    if (filters.forkType === 'original') {
      // Original rules have forks or no parentRuleId
      return !rule.parentRuleId && !rule.forkedFrom;
    }
    if (filters.forkType === 'forked') {
      // Forked rules have a parentRuleId
      return (rule.parentRuleId || rule.forkedFrom) ? true : false;
    }
    if (filters.forkType === 'hasForked') {
      // Rules that have been forked
      return rule.forkCount && rule.forkCount > 0;
    }
    return true;
  });

  const resetFilters = () => {
    setFilters({ status: 'all', severity: 'all', queryLanguage: 'all', vendor: 'all', category: 'all', visibility: 'all', forkType: 'all', sortBy: 'newest' });
    setSearchQuery('');
    setSelectedTactics([]);
    setPage(1);
  };

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Detection Rules</h1>
          <p className="text-muted-foreground">
            Browse and manage your security detection rules library. ({total} total)
          </p>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="space-y-4">
        {/* Search and Notification */}
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            <Input
            type="search"
            placeholder="Search rules..."
            className="pl-10 w-full bg-secondary/50"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          </div>
          <Button variant="outline" size="icon" className="flex-shrink-0 bg-secondary/50">
            <SlidersHorizontal className="w-4 h-4" />
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2 md:gap-3">
          <Select
            value={filters.status}
            onValueChange={(value) => setFilters({ ...filters, status: value as RuleStatus | 'all' })}
          >
            <SelectTrigger className="w-full sm:w-[140px] bg-secondary/50">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              {statusOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={filters.severity}
            onValueChange={(value) => setFilters({ ...filters, severity: value as any })}
          >
            <SelectTrigger className="w-full sm:w-[140px] bg-secondary/50">
              <SelectValue placeholder="Severity" />
            </SelectTrigger>
            <SelectContent>
              {severityOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={filters.queryLanguage}
            onValueChange={(value) => setFilters({ ...filters, queryLanguage: value as any })}
          >
            <SelectTrigger className="w-full sm:w-[150px] bg-secondary/50">
              <SelectValue placeholder="Language" />
            </SelectTrigger>
            <SelectContent>
              {queryLanguageOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={filters.vendor}
            onValueChange={(value) => setFilters({ ...filters, vendor: value as any })}
          >
            <SelectTrigger className="w-full sm:w-[140px] bg-secondary/50">
              <SelectValue placeholder="Vendor" />
            </SelectTrigger>
            <SelectContent>
              {vendorOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={filters.category}
            onValueChange={(value) => setFilters({ ...filters, category: value as any })}
          >
            <SelectTrigger className="w-full sm:w-[140px] bg-secondary/50">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              {categoryOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={filters.visibility}
            onValueChange={(value) => setFilters({ ...filters, visibility: value as any })}
          >
            <SelectTrigger className="w-full sm:w-[140px] bg-secondary/50">
              <SelectValue placeholder="Visibility" />
            </SelectTrigger>
            <SelectContent>
              {visibilityOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={filters.forkType || 'all'}
            onValueChange={(value) => setFilters({ ...filters, forkType: value as any })}
          >
            <SelectTrigger className="w-full sm:w-[160px] bg-secondary/50">
              <SelectValue placeholder="Fork Type" />
            </SelectTrigger>
            <SelectContent>
              {forkTypeOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Tactics Filter */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2 w-full sm:w-auto bg-secondary/50">
                <Filter className="w-4 h-4" />
                Tactics
                {selectedTactics.length > 0 && (
                  <Badge variant="secondary" className="ml-1 text-xs">
                    {selectedTactics.length}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 max-h-80 overflow-auto">
              <DropdownMenuLabel>MITRE ATT&CK Tactics</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {mitreTactics.map((tactic) => (
                <DropdownMenuCheckboxItem
                  key={tactic.id}
                  checked={selectedTactics.includes(tactic.id)}
                  onCheckedChange={(checked) => {
                    setSelectedTactics(
                      checked
                        ? [...selectedTactics, tactic.id]
                        : selectedTactics.filter((t) => t !== tactic.id)
                    );
                  }}
                >
                  {tactic.name}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <Select
            value={filters.sortBy}
            onValueChange={(value) => setFilters({ ...filters, sortBy: value as any })}
          >
            <SelectTrigger className="w-full sm:w-[150px] bg-secondary/50">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              {sortOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* View Toggle */}
          <div className="flex items-center border rounded-lg overflow-hidden bg-secondary/50 w-full sm:w-auto">
            <Button
              variant="ghost"
              size="icon"
              className={cn('rounded-none flex-1 sm:flex-none', viewMode === 'grid' && 'bg-primary/10 text-primary')}
              onClick={() => setViewMode('grid')}
            >
              <Grid className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className={cn('rounded-none flex-1 sm:flex-none', viewMode === 'list' && 'bg-primary/10 text-primary')}
              onClick={() => setViewMode('list')}
            >
              <List className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Active Filters */}
      {(selectedTactics.length > 0 || filters.status !== 'all' || filters.severity !== 'all' || filters.queryLanguage !== 'all' || filters.vendor !== 'all' || filters.category !== 'all' || filters.visibility !== 'all' || filters.forkType !== 'all') && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-muted-foreground">Active filters:</span>
          {filters.status !== 'all' && (
            <Badge
              variant="outline"
              className="cursor-pointer hover:bg-secondary"
              onClick={() => setFilters({ ...filters, status: 'all' })}
            >
              Status: {filters.status} ×
            </Badge>
          )}
          {filters.severity !== 'all' && (
            <Badge
              variant="outline"
              className="cursor-pointer hover:bg-secondary"
              onClick={() => setFilters({ ...filters, severity: 'all' })}
            >
              Severity: {filters.severity} ×
            </Badge>
          )}
          {filters.queryLanguage !== 'all' && (
            <Badge
              variant="outline"
              className="cursor-pointer hover:bg-secondary"
              onClick={() => setFilters({ ...filters, queryLanguage: 'all' })}
            >
              Language: {filters.queryLanguage} ×
            </Badge>
          )}
          {filters.vendor !== 'all' && (
            <Badge
              variant="outline"
              className="cursor-pointer hover:bg-secondary"
              onClick={() => setFilters({ ...filters, vendor: 'all' })}
            >
              Vendor: {filters.vendor} ×
            </Badge>
          )}
          {filters.category !== 'all' && (
            <Badge
              variant="outline"
              className="cursor-pointer hover:bg-secondary"
              onClick={() => setFilters({ ...filters, category: 'all' })}
            >
              Category: {filters.category} ×
            </Badge>
          )}
          {filters.visibility !== 'all' && (
            <Badge
              variant="outline"
              className="cursor-pointer hover:bg-secondary"
              onClick={() => setFilters({ ...filters, visibility: 'all' })}
            >
              Visibility: {filters.visibility} ×
            </Badge>
          )}
          {filters.forkType !== 'all' && (
            <Badge
              variant="outline"
              className="cursor-pointer hover:bg-secondary"
              onClick={() => setFilters({ ...filters, forkType: 'all' })}
            >
              Fork: {filters.forkType} ×
            </Badge>
          )}
          {selectedTactics.map((tactic) => (
            <Badge
              key={tactic}
              variant="outline"
              className="cursor-pointer hover:bg-secondary"
              onClick={() => setSelectedTactics(selectedTactics.filter((t) => t !== tactic))}
            >
              {mitreTactics.find((t) => t.id === tactic)?.name} ×
            </Badge>
          ))}
          <Button
            variant="ghost"
            size="sm"
            className="h-6 text-xs text-muted-foreground"
            onClick={() => {
              setFilters({ status: 'all', severity: 'all', queryLanguage: 'all', vendor: 'all', category: 'all', visibility: 'all', forkType: 'all', sortBy: 'newest' });
              setSelectedTactics([]);
            }}
          >
            Clear all
          </Button>
        </div>
      )}

      {/* Results Count */}
      <div className="text-sm text-muted-foreground">
        {isLoading ? 'Loading rules...' : `Showing ${filteredRules.length} of ${total} rules`}
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="flex justify-center items-center py-16">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-muted-foreground">Loading rules...</p>
          </div>
        </div>
      )}

      {/* Rules Grid/List */}
      {!isLoading && (
        <>
          <div
            className={cn(
              'grid gap-4',
              viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3' : 'grid-cols-1'
            )}
          >
            {filteredRules.map((rule) => (
              <RuleCard key={rule._id || rule.id} rule={rule} />
            ))}
          </div>

          {/* Empty State */}
          {filteredRules.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-16 h-16 rounded-full bg-secondary/50 flex items-center justify-center mb-4">
                <Search className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium">No rules found</h3>
              <p className="text-muted-foreground mt-1 max-w-sm">
                Try adjusting your filters or search query to find what you're looking for.
              </p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={resetFilters}
              >
                Clear all filters
              </Button>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && rules.length > 0 && (
            <div className="flex justify-center items-center gap-2 pt-6">
              <Button
                variant="outline"
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
              >
                Previous
              </Button>
              
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const pageNum = Math.max(1, page - 2) + i;
                  if (pageNum > totalPages) return null;
                  return (
                    <Button
                      key={pageNum}
                      variant={pageNum === page ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setPage(pageNum)}
                    >
                      {pageNum}
                    </Button>
                  );
                })}
              </div>

              <Button
                variant="outline"
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page === totalPages}
              >
                Next
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
