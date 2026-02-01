import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Search, Edit, Trash2, Eye, Download, Loader2, AlertCircle, Send, GitFork, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { titleToSlug } from '@/lib/slugUtils';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { api } from '@/services/api';
import { useToast } from '@/hooks/use-toast';
import { PublishRuleModal } from '@/components/modals/PublishRuleModal';
import type { Rule } from '@/types';
import { RuleStatus } from '@/constants/enums';

const statusColors: Record<string, string> = {
  DRAFT: 'bg-slate-100 text-slate-800',
  UNDER_REVIEW: 'bg-blue-100 text-blue-800',
  APPROVED: 'bg-green-100 text-green-800',
  REJECTED: 'bg-red-100 text-red-800',
};

const statusLabels: Record<string, string> = {
  DRAFT: 'Draft',
  UNDER_REVIEW: 'Under Review',
  APPROVED: 'Published',
  REJECTED: 'Rejected',
};

export default function MyRules() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [rules, setRules] = useState<Rule[]>([]);
  const [forkedRules, setForkedRules] = useState<Rule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [total, setTotal] = useState(0);
  const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; ruleId: string | null }>({
    open: false,
    ruleId: null,
  });
  const [isDeleting, setIsDeleting] = useState(false);
  const [publishModalOpen, setPublishModalOpen] = useState(false);
  const [selectedRuleId, setSelectedRuleId] = useState<string | null>(null);
  const [selectedRuleTitle, setSelectedRuleTitle] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'all' | 'forked'>('all');

  const limit = 10;

  useEffect(() => {
    fetchRules();
  }, [page, searchTerm, statusFilter]);

  const fetchRules = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.getMyRules(
        {
          search: searchTerm || undefined,
          status: statusFilter as any,
        },
        page,
        limit
      );

      if (response.data?.rules) {
        // Separate original rules from forked rules
        const allRules = response.data.rules;
        const originalRules = allRules.filter((rule: Rule) => !rule.parentRuleId && !rule.forkedFrom);
        const userForkedRules = allRules.filter((rule: Rule) => rule.parentRuleId || rule.forkedFrom);
        
        // Set original rules to main list
        setRules(originalRules);
        // Set forked rules to forked list
        setForkedRules(userForkedRules);
        
        if (response.data.pagination) {
          setTotal(response.data.pagination.totalItems || 0);
          setTotalPages(response.data.pagination.totalPages || 0);
        }
      } else {
        setRules([]);
        setForkedRules([]);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch your rules';
      setError(message);
      toast({ title: 'Error', description: message, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteRule = async (ruleId: string) => {
    setIsDeleting(true);
    try {
      await api.deleteRule(ruleId);
      toast({ title: 'Success', description: 'Rule deleted successfully' });
      setRules(rules.filter(r => (r._id || r.id) !== ruleId));
      setDeleteConfirm({ open: false, ruleId: null });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete rule';
      toast({ title: 'Error', description: message, variant: 'destructive' });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
  };

  const handleReset = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setPage(1);
  };

  const handleOpenPublishModal = (rule: Rule) => {
    setSelectedRuleId(rule._id || rule.id || '');
    setSelectedRuleTitle(rule.title);
    setPublishModalOpen(true);
  };

  const handlePublishSuccess = () => {
    setPublishModalOpen(false);
    setSelectedRuleId(null);
    setSelectedRuleTitle('');
    fetchRules();
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">My Rules</h1>
            <p className="text-muted-foreground">
              Manage and create your security detection rules
            </p>
          </div>
          <Link to="/rules/new">
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Create New Rule
            </Button>
          </Link>
        </div>

        {/* Search & Filter */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Search & Filter</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={handleSearch} className="flex gap-2">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search rules by title..."
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Button type="submit">Search</Button>
              <Button variant="outline" onClick={handleReset}>
                Reset
              </Button>
            </form>

            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <select
                className="w-full md:w-64 px-3 py-2 border rounded-md"
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
              >
                <option value="all">All Statuses</option>
                <option value="DRAFT">Draft</option>
                <option value="UNDER_REVIEW">Under Review</option>
                <option value="APPROVED">Published</option>
                <option value="REJECTED">Rejected</option>
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive" className="mb-8">
            <AlertCircle className="w-4 h-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="flex justify-center items-center py-16">
            <div className="text-center">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
              <p className="text-muted-foreground">Loading your rules...</p>
            </div>
          </div>
        )}

        {/* Rules Tabs */}
        {!isLoading && (
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'all' | 'forked')}>
            <TabsList className="mb-4">
              <TabsTrigger value="all">My Rules ({rules.length})</TabsTrigger>
              <TabsTrigger value="forked" className="flex items-center gap-2">
                <GitFork className="w-4 h-4" />
                Forked Rules ({forkedRules.length})
              </TabsTrigger>
            </TabsList>

            {/* My Rules Tab */}
            <TabsContent value="all">
              <Card className="mb-8">
                <CardHeader>
                  <CardTitle>
                    Your Rules ({total})
                  </CardTitle>
                  <CardDescription>
                    {rules.length} rule{rules.length !== 1 ? 's' : ''} shown
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {rules.length === 0 ? (
                    <div className="text-center py-12">
                      <p className="text-muted-foreground mb-4">No rules found</p>
                      <Link to="/rules/new">
                        <Button>Create Your First Rule</Button>
                      </Link>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Title</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Created</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {rules.map((rule) => (
                            <TableRow key={rule._id || rule.id}>
                              <TableCell>
                                <div className="font-medium">{rule.title}</div>
                                <div className="text-sm text-muted-foreground truncate max-w-xs">
                                  {rule.description}
                                </div>
                              </TableCell>
                            <TableCell>
                              <Badge className={statusColors[rule.status] || 'bg-gray-100 text-gray-800'}>
                                {statusLabels[rule.status] || rule.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {new Date(rule.createdAt).toLocaleDateString()}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                {rule.status === RuleStatus.DRAFT && (
                                  <Button 
                                    variant="default" 
                                    size="sm"
                                    onClick={() => handleOpenPublishModal(rule)}
                                    className="bg-blue-600 hover:bg-blue-700"
                                  >
                                    <Send className="w-4 h-4" />
                                  </Button>
                                )}
                                <Link to={`/rules/${titleToSlug(rule.title)}`}>
                                  <Button variant="ghost" size="sm">
                                    <Eye className="w-4 h-4" />
                                  </Button>
                                </Link>
                                <Link to={`/rules/${titleToSlug(rule.title)}/edit`}>
                                  <Button variant="ghost" size="sm">
                                    <Edit className="w-4 h-4" />
                                  </Button>
                                </Link>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() =>
                                    setDeleteConfirm({ open: true, ruleId: rule._id || rule.id })
                                  }
                                >
                                  <Trash2 className="w-4 h-4 text-destructive" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center gap-2">
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
                        onClick={() => setPage(pageNum)}
                        size="sm"
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
            </TabsContent>

            {/* Forked Rules Tab */}
            <TabsContent value="forked">
              <Card className="mb-8">
                <CardHeader>
                  <CardTitle>
                    Your Forked Rules ({forkedRules.length})
                  </CardTitle>
                  <CardDescription>
                    Rules you have forked from other authors
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {forkedRules.length === 0 ? (
                    <div className="text-center py-12">
                      <GitFork className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                      <p className="text-muted-foreground mb-4">No forked rules yet</p>
                      <Link to="/rules">
                        <Button>Browse Rules to Fork</Button>
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {forkedRules.map((rule) => (
                        <div key={rule._id || rule.id} className="p-4 border rounded-lg hover:bg-secondary/50 transition">
                          <div className="flex justify-between items-start gap-3 mb-2">
                            <div className="flex-1">
                              <Link to={`/rules/${titleToSlug(rule.title)}`}>
                                <h4 className="font-semibold hover:text-primary">{rule.title}</h4>
                              </Link>
                              <p className="text-sm text-muted-foreground line-clamp-2">{rule.description}</p>
                              {rule.parentRuleId && (
                                <div className="mt-2 text-xs text-blue-600 dark:text-blue-400">
                                  Forked from: <Link to={`/rules/${rule.parentRuleId}`} className="underline">original rule</Link>
                                </div>
                              )}
                            </div>
                            <Badge className={statusColors[rule.status] || 'bg-gray-100 text-gray-800'}>
                              {statusLabels[rule.status] || rule.status}
                            </Badge>
                          </div>
                          <div className="flex justify-end gap-2 pt-2 border-t">
                            <Link to={`/rules/${titleToSlug(rule.title)}`}>
                              <Button variant="ghost" size="sm">
                                <Eye className="w-4 h-4" />
                              </Button>
                            </Link>
                            <Link to={`/rules/${titleToSlug(rule.title)}/edit`}>
                              <Button variant="ghost" size="sm">
                                <Edit className="w-4 h-4" />
                              </Button>
                            </Link>
                            {rule.status === 'DRAFT' && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setSelectedRuleId(rule._id || rule.id);
                                  setSelectedRuleTitle(rule.title);
                                  setPublishModalOpen(true);
                                }}
                                className="text-green-600 hover:text-green-700 hover:bg-green-100 dark:hover:bg-green-950"
                              >
                                <CheckCircle className="w-4 h-4" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                setDeleteConfirm({ open: true, ruleId: rule._id || rule.id })
                              }
                            >
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteConfirm.open} onOpenChange={(open) => setDeleteConfirm({ ...deleteConfirm, open })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Rule?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The rule will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteConfirm.ruleId && handleDeleteRule(deleteConfirm.ruleId)}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Publish Rule Modal */}
      <PublishRuleModal
        open={publishModalOpen}
        onOpenChange={setPublishModalOpen}
        ruleId={selectedRuleId || ''}
        ruleName={selectedRuleTitle}
        onSuccess={handlePublishSuccess}
      />
    </div>
  );
}
