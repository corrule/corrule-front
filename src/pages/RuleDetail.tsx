import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { API_BASE_URL, api } from '@/services/api';
import { titleToSlug } from '@/lib/slugUtils';
import {
  ArrowLeft,
  Download,
  Heart,
  GitFork,
  Share2,
  Edit,
  Trash2,
  Clock,
  User,
  Star,
  ExternalLink,
  Copy,
  Check,
  History,
  AlertTriangle,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { StatusBadge } from '@/components/StatusBadge';
import { MitreBadge } from '@/components/MitreBadge';
import { RuleForks } from '@/components/RuleForks';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import type { Rule, Review } from '@/types';

const severityColors = {
  low: 'bg-success/20 text-success border-success/30',
  medium: 'bg-warning/20 text-warning border-warning/30',
  high: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  critical: 'bg-destructive/20 text-destructive border-destructive/30',
};

export default function RuleDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, updateUser, refreshUserData } = useAuth();

  const [rule, setRule] = useState<Rule | null>(null);
  const [originalRule, setOriginalRule] = useState<Rule | null>(null);
  const [ruleId, setRuleId] = useState<string | null>(null); // Store the actual rule ID for API calls
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasPurchased, setHasPurchased] = useState(false);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [versions, setVersions] = useState<any[]>([]);
  const [versionsLoading, setVersionsLoading] = useState(false);
  const [selectedVersion, setSelectedVersion] = useState<any | null>(null);
  const [copied, setCopied] = useState(false);
  const [liked, setLiked] = useState(false);
  const [isLiking, setIsLiking] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isCreatingFork, setIsCreatingFork] = useState(false);
  const [actualForkCount, setActualForkCount] = useState(0);
  
  // Review form state
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '' });
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  // Computed: Check if rule is paid and user doesn't have access
  const isPaidRule = rule && (rule.visibility === 'PAID' || rule.visibility?.toUpperCase() === 'PAID');
  const isOwnedByCurrentUser = rule && user && (rule.author?._id === user._id || rule.author?.id === user.id);
  const canForkRule = rule && !isOwnedByCurrentUser; // Cannot fork your own rules
  const hasContentAccess = hasPurchased || !isPaidRule;

  // On component mount, refresh user data to ensure we have the latest likedRules
  useEffect(() => {
    if (user) {
      refreshUserData();
    }
  }, []);

  useEffect(() => {
    if (!id) return;
    fetchRule();
  }, [id]);

  // Fetch reviews and versions after rule is loaded and ruleId is set
  useEffect(() => {
    if (!ruleId) return;
    fetchReviews();
    fetchVersions();
  }, [ruleId]);

  // Separate effect to check if user has liked this rule
  // This ensures we always have the correct like state based on user.likedRules
  useEffect(() => {
    if (!ruleId || !user?.likedRules) return;
    const isLiked = user.likedRules.includes(ruleId);
    setLiked(isLiked);
  }, [ruleId, user?.likedRules?.join(',')]); // Serialize array to detect changes

  const fetchRule = async () => {
    setIsLoading(true);
    setError(null);
    try {
      if (!id) {
        throw new Error('No rule ID provided');
      }
      console.log('Fetching rule with id:', id);
      const response = await api.getRule(id);
      console.log('Rule response:', response);
      console.log('Rule mitreAttack:', response.rule?.mitreAttack);
      // API returns { rule, hasPurchased }
      setRule(response.rule);
      setHasPurchased(response.hasPurchased);
      // Extract and store the actual rule ID from the fetched rule for API operations
      const actualRuleId = response.rule?._id || response.rule?.id;
      setRuleId(actualRuleId || null);
      console.log('Rule set successfully:', response.rule);
      console.log('Actual rule ID set:', actualRuleId);
      
      // If this rule is a fork, fetch the original rule
      if (response.rule.parentRuleId || response.rule.forkedFrom) {
        const originalRuleId = response.rule.parentRuleId || response.rule.forkedFrom;
        try {
          const originalResponse = await api.getRule(originalRuleId);
          setOriginalRule(originalResponse.rule);
        } catch (err) {
          console.error('Failed to fetch original rule:', err);
          // Don't fail the entire page load if we can't fetch the original
        }
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load rule';
      console.error('Error fetching rule:', message, err);
      setError(message);
      toast({ title: 'Error', description: message, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchReviews = async (reviewRuleId?: string) => {
    setReviewsLoading(true);
    try {
      const idToUse = reviewRuleId || ruleId || id;
      if (!idToUse) return;
      const response = await api.getRuleReviews(idToUse, 1, 10);
      console.log('Reviews response:', response);
      // Handle response structure: { success: true, data: { reviews: [...] } }
      if (response.data?.reviews) {
        console.log('Setting reviews from response.data.reviews:', response.data.reviews);
        setReviews(response.data.reviews);
      } else if (Array.isArray(response.data)) {
        console.log('Setting reviews from response.data (array):', response.data);
        setReviews(response.data);
      } else if (Array.isArray(response)) {
        console.log('Setting reviews from response (array):', response);
        setReviews(response);
      } else {
        console.warn('Unexpected response structure:', response);
        setReviews([]);
      }
    } catch (err) {
      console.error('Failed to load reviews:', err);
      setReviews([]);
    } finally {
      setReviewsLoading(false);
    }
  };

  const fetchVersions = async (versionRuleId?: string) => {
    setVersionsLoading(true);
    try {
      const idToUse = versionRuleId || ruleId || id;
      if (!idToUse) return;
      const versionsList = await api.getRuleVersions(idToUse);
      console.log('Versions response:', versionsList);
      // API now returns array directly
      setVersions(Array.isArray(versionsList) ? versionsList : []);
    } catch (err) {
      console.error('Failed to load versions:', err);
      setVersions([]);
    } finally {
      setVersionsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading rule...</p>
        </div>
      </div>
    );
  }

  if (error || !rule) {
    return (
      <div className="flex flex-col items-center justify-center p-16">
        <Alert variant="destructive" className="max-w-md mb-4">
          <AlertCircle className="w-4 h-4" />
          <AlertDescription>{error || 'Rule not found'}</AlertDescription>
        </Alert>
        <Link to="/rules">
          <Button>Back to Rules</Button>
        </Link>
      </div>
    );
  }

  const handleCopyContent = () => {
    const content = rule.ruleContent?.query || rule.content || '';
    navigator.clipboard.writeText(content);
    setCopied(true);
    toast({ title: 'Copied!', description: 'Rule content copied to clipboard.' });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleFork = async () => {
    if (!user) {
      toast({ 
        title: 'Error', 
        description: 'You must be logged in to fork rules', 
        variant: 'destructive' 
      });
      return;
    }

    if (!rule) {
      toast({ 
        title: 'Error', 
        description: 'Rule information not available', 
        variant: 'destructive' 
      });
      return;
    }

    // Check if user owns the rule
    const isOwnedByCurrentUser = rule.author?._id === user._id || rule.author?.id === user.id;
    if (isOwnedByCurrentUser) {
      toast({
        title: 'Cannot Fork',
        description: 'You cannot fork your own rules. Edit the original rule directly instead.',
        variant: 'destructive',
      });
      return;
    }

    setIsCreatingFork(true);
    try {
      // Store the original rule data in sessionStorage for the editor to use
      const forkData = {
        originalRuleId: rule._id || rule.id,
        originalRule: rule,
        isFork: true,
      };
      sessionStorage.setItem('forkData', JSON.stringify(forkData));

      toast({
        title: 'Fork Initialized',
        description: `Edit your fork and click "Save as Draft" to save it.`,
      });

      // Redirect to the new rule editor (without an ID) to create the fork
      navigate('/rules/new', { replace: true });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fork rule';
      console.error('Fork error:', message, error);
      
      // Handle specific error messages from API
      if (message.toLowerCase().includes('private') || message.toLowerCase().includes('own')) {
        toast({
          title: 'Cannot Fork',
          description: 'You cannot fork this rule. It may be private or you may not have permission.',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Fork Failed',
          description: message,
          variant: 'destructive',
        });
      }
    } finally {
      setIsCreatingFork(false);
    }
  };

  const handleLike = async () => {
    if (!user) {
      toast({ title: 'Error', description: 'You must be logged in to like rules', variant: 'destructive' });
      return;
    }

    if (!ruleId) {
      toast({ title: 'Error', description: 'Rule ID not available', variant: 'destructive' });
      return;
    }

    setIsLiking(true);
    try {
      const response = await api.likeRule(ruleId) as any;
      
      // Update the liked state based on response
      const isNowLiked = response?.data?.liked ?? !liked;
      setLiked(isNowLiked);
      
      // Update user's likedRules in context
      if (isNowLiked) {
        // Add rule to likedRules if not already there
        const updatedLikedRules = user.likedRules?.includes(ruleId)
          ? user.likedRules
          : [...(user.likedRules || []), ruleId];
        updateUser({ likedRules: updatedLikedRules });
      } else {
        // Remove rule from likedRules
        const updatedLikedRules = (user.likedRules || []).filter(rid => rid !== ruleId);
        updateUser({ likedRules: updatedLikedRules });
      }
      
      // IMPORTANT: Refetch the rule to get the updated like count from backend
      // This ensures the like count is always consistent and reflects reality
      if (response?.data?.rule) {
        // Use the updated rule from the likeRule response
        setRule(response.data.rule);
      } else {
        // Fallback: refetch the rule if not in response
        await fetchRule();
      }
      
      toast({
        title: isNowLiked ? 'Added to favorites' : 'Removed from favorites',
        description: isNowLiked ? 'Rule added to your favorites.' : 'Rule removed from your favorites.',
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update favorite status';
      toast({ title: 'Error', description: message, variant: 'destructive' });
      setLiked(!liked); // Revert the optimistic update
    } finally {
      setIsLiking(false);
    }
  };

  const handleDownload = async () => {
    if (!user) {
      toast({ title: 'Error', description: 'You must be logged in to download rules', variant: 'destructive' });
      return;
    }

    setIsDownloading(true);
    try {
      // Use the actual rule ID if available, fallback to slug
      const downloadId = ruleId || id;
      // Call API to record the download and get rule content
      const response = await fetch(`${API_BASE_URL}/rules/${downloadId}/download`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to download rule');
      }

      const data = await response.json();
      const ruleData = data.data?.rule;

      if (!ruleData) {
        throw new Error('Invalid response data');
      }

      // Create the content to download
      const content = ruleData.ruleContent?.query || ruleData.ruleContent || '';
      const filename = `${ruleData.title || 'rule'}.txt`;
      
      // Create blob and download
      const blob = new Blob([content], { type: 'text/plain' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      // Update download count in UI
      if (rule) {
        setRule({
          ...rule,
          downloads: (rule.downloads || 0) + 1,
          statistics: {
            ...rule.statistics,
            downloads: (rule.statistics?.downloads || 0) + 1,
          },
        });
      }

      toast({
        title: 'Downloaded!',
        description: `${rule?.title || 'Rule'} has been downloaded successfully.`,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to download rule';
      toast({ title: 'Error', description: message, variant: 'destructive' });
    } finally {
      setIsDownloading(false);
    }
  };

  const handleSubmitReview = async () => {
    if (!reviewForm.comment.trim()) {
      toast({ title: 'Error', description: 'Please enter a comment', variant: 'destructive' });
      return;
    }

    if (reviewForm.comment.length < 10) {
      toast({ title: 'Error', description: 'Comment must be at least 10 characters', variant: 'destructive' });
      return;
    }

    if (!ruleId) {
      toast({ title: 'Error', description: 'Rule ID not available', variant: 'destructive' });
      return;
    }

    setIsSubmittingReview(true);
    try {
      await api.createReview({
        ruleId: ruleId,
        rating: reviewForm.rating,
        comment: reviewForm.comment,
      });
      toast({ title: 'Success', description: 'Review submitted successfully!' });
      setReviewForm({ rating: 5, comment: '' });
      // Refetch rule to update rating
      await fetchRule();
      // Refetch reviews to show the new one
      fetchReviews();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to submit review';
      toast({ title: 'Error', description: message, variant: 'destructive' });
    } finally {
      setIsSubmittingReview(false);
    }
  };

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link to="/rules" className="hover:text-foreground transition-colors">
          <ArrowLeft className="w-4 h-4 inline mr-1" />
          Rules
        </Link>
        <span>/</span>
        <span className="text-foreground">{rule?.title || 'Loading...'}</span>
      </div>

      {/* Header */}
      {rule && (
        <>
      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
        <div className="space-y-4 flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <StatusBadge status={rule.status} />
            <Badge variant="outline" className={cn('text-xs', severityColors[(rule.severity?.toLowerCase() || 'medium')])}>
              {(rule.severity || 'MEDIUM').toUpperCase()}
            </Badge>
            <Badge variant="outline" className="text-xs">
              v{typeof rule.version === 'string' ? rule.version : (rule.version as any)?.current || '1.0.0'}
            </Badge>
            {rule.visibility && (rule.visibility === 'PAID' || rule.visibility?.toUpperCase() === 'PAID') && (
              <Badge className="bg-primary text-primary-foreground">
                ${rule.price || rule.pricing?.price || 0}
              </Badge>
            )}
          </div>
          <h1 className="text-3xl font-bold">{rule.title}</h1>
          <p className="text-muted-foreground text-lg">{rule.description}</p>

          {/* Author & Stats */}
          <div className="flex flex-wrap items-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <Avatar className="w-8 h-8">
                <AvatarImage src={rule.author?.profile?.avatar} />
                <AvatarFallback className="bg-primary/20 text-primary text-xs">
                  {rule.author?.username?.[0]?.toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              <div>
                <Link 
                  to={`/users/${rule.author?.username || ''}`} 
                  className="font-medium hover:text-primary transition-colors"
                >
                  @{rule.author?.username || 'Unknown'}
                </Link>
              </div>
            </div>
            <div className="flex items-center gap-4 text-muted-foreground">
              <span className="flex items-center gap-1">
                <Download className="w-4 h-4" />
                {(rule.downloads || rule.statistics?.downloads || 0).toLocaleString()} downloads
              </span>
              <span className="flex items-center gap-1">
                <Heart className={cn('w-4 h-4', liked && 'fill-destructive text-destructive')} />
                {(rule.statistics?.likes || rule.likes || 0)} likes
              </span>
              <span className="flex items-center gap-1">
                <GitFork className="w-4 h-4" />
                {actualForkCount || rule.forks || 0} forks
              </span>
              {(rule.rating || 0) > 0 && (
                <span className="flex items-center gap-1">
                  <Star className="w-4 h-4 fill-warning text-warning" />
                  {rule.rating} ({rule.reviewCount || 0} reviews)
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-2">
          {!hasContentAccess && isPaidRule ? (
            <Button 
              className="gap-2 bg-primary hover:bg-primary/90"
              onClick={() => navigate(`/purchase/${ruleId || id}`)}
            >
              <Download className="w-4 h-4" />
              Purchase Rule - ${rule?.price || rule?.pricing?.price || 'Contact'}
            </Button>
          ) : (
            <>
              <Button variant="outline" className="gap-2" onClick={handleLike} disabled={isLiking}>
                {isLiking ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Heart className={cn('w-4 h-4', liked && 'fill-destructive text-destructive')} />
                )}
                {isLiking ? 'Loading...' : (liked ? 'Liked' : 'Like')}
              </Button>
              <Button 
                variant="outline" 
                className="gap-2" 
                onClick={handleFork}
                disabled={!canForkRule || isCreatingFork}
                title={!canForkRule ? 'You cannot fork your own rules' : 'Fork this rule'}
              >
                {isCreatingFork ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <GitFork className="w-4 h-4" />
                )}
                {isCreatingFork ? 'Forking...' : 'Fork'}
              </Button>
              <Button className="gap-2" onClick={handleDownload} disabled={isDownloading}>
                {isDownloading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Download className="w-4 h-4" />
                )}
                {isDownloading ? 'Downloading...' : 'Download'}
              </Button>
            </>
          )}
        </div>

        {/* Fork Modal - Removed: Forks now happen immediately with direct redirect */}
        {/* Previously used ForkRuleModal for customizing fork metadata */}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Forked From Section */}
          {rule && (rule.parentRuleId || rule.forkedFrom) && (
            <Alert className="border-blue-200 bg-blue-50 dark:border-blue-900/30 dark:bg-blue-950/20">
              <GitFork className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <AlertDescription className="text-sm text-blue-800 dark:text-blue-300 ml-2">
                <strong>This rule is a fork</strong> of{' '}
                <Link
                  to={`/rules/${originalRule ? titleToSlug(originalRule.title) : (rule.parentRuleId || rule.forkedFrom)}`}
                  className="font-semibold underline hover:text-blue-900 dark:hover:text-blue-200"
                >
                  the original rule
                </Link>
                {rule.forkedFromVersion && (
                  <span> (from version {rule.forkedFromVersion})</span>
                )}
                . It evolves independently while preserving its lineage.
              </AlertDescription>
            </Alert>
          )}

          <Tabs defaultValue="content" className="space-y-4">
            <TabsList className="bg-secondary/50">
              <TabsTrigger value="content">Rule Content</TabsTrigger>
              {hasContentAccess && (
                <>
                  <TabsTrigger value="versions">Version History</TabsTrigger>
                  <TabsTrigger value="reviews">Reviews ({reviews.length})</TabsTrigger>
                </>
              )}
            </TabsList>

            <TabsContent value="content" className="space-y-4">
              {!hasContentAccess && isPaidRule ? (
                <Card className="border-destructive/30 bg-destructive/5">
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2 text-destructive">
                      <AlertTriangle className="w-5 h-5" />
                      Paid Content - Access Restricted
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      This is a premium rule. To access the full rule content, version history, and reviews, you need to purchase this rule.
                    </p>
                    <Button 
                      className="gap-2"
                      onClick={() => navigate(`/purchase/${ruleId || id}`)}
                    >
                      <Download className="w-4 h-4" />
                      Purchase Rule - ${rule?.price || rule?.pricing?.price || 'Contact'}
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Detection Rule ({rule?.queryLanguage || 'SIGMA'})</CardTitle>
                    <Button variant="ghost" size="sm" className="gap-2" onClick={handleCopyContent}>
                      {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      {copied ? 'Copied!' : 'Copy'}
                    </Button>
                  </CardHeader>
                  <CardContent>
                    <pre className="code-block text-sm overflow-x-auto whitespace-pre-wrap">
                      {rule?.ruleContent?.query || rule?.content || 'No content available'}
                    </pre>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="versions" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <History className="w-5 h-5" />
                    Version History
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {!hasContentAccess && isPaidRule ? (
                    <div className="flex items-start gap-4 p-4 rounded-lg border border-destructive/30 bg-destructive/5">
                      <AlertTriangle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                      <div className="space-y-2 flex-1">
                        <p className="font-medium text-sm text-destructive">Version History Not Available</p>
                        <p className="text-sm text-muted-foreground">
                          You must purchase this rule to view version history.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <>
                      {versionsLoading ? (
                        <div className="text-center py-8 text-muted-foreground">
                          <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" />
                          Loading versions...
                        </div>
                      ) : versions && versions.length > 0 ? (
                        <>
                          {selectedVersion && (
                            <Card className="border-primary/30 bg-primary/5 mb-4">
                              <CardHeader>
                                <CardTitle className="text-sm">Viewing v{selectedVersion.version}</CardTitle>
                              </CardHeader>
                              <CardContent>
                                <pre className="code-block text-xs overflow-x-auto whitespace-pre-wrap max-h-96">
                                  {selectedVersion.ruleContent?.query || selectedVersion.content || 'No content available'}
                                </pre>
                                <Button onClick={() => setSelectedVersion(null)} variant="outline" size="sm" className="mt-4">
                                  Close Preview
                                </Button>
                              </CardContent>
                            </Card>
                          )}
                          {versions.map((version, index) => (
                        <div
                          key={version._id || version.version}
                          className={cn(
                            'flex items-start gap-4 p-4 rounded-lg border border-border',
                            index === 0 && 'border-primary/30 bg-primary/5'
                          )}
                        >
                          <div className="w-2 h-2 mt-2 rounded-full bg-primary" />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-medium">v{version.version}</span>
                              {index === 0 && (
                                <Badge variant="outline" className="text-xs">Current</Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">{version.changelog || 'No changelog'}</p>
                            <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <User className="w-3 h-3" />
                                {typeof version.createdBy === 'object' && version.createdBy?.username 
                                  ? version.createdBy.username 
                                  : (version.author || 'Unknown')}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {new Date(version.createdAt || new Date()).toLocaleDateString()}
                              </span>
                            </div>
                            <div className="flex gap-2 mt-3">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setSelectedVersion(version)}
                                className="text-xs"
                              >
                                View
                              </Button>
                              {index !== 0 && user?.id === rule?.author?.id && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="text-xs"
                                  onClick={() => {
                                    toast({ title: 'Rollback', description: 'Rollback to this version' });
                                  }}
                                >
                                  Rollback
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                        </>
                      ) : (
                        <div className="text-center py-8 text-muted-foreground">
                          No version history available
                        </div>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="reviews" className="space-y-4">
              {!hasContentAccess && isPaidRule ? (
                <Card className="border-destructive/30 bg-destructive/5">
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2 text-destructive">
                      <AlertTriangle className="w-5 h-5" />
                      Reviews Not Available - Paid Content
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      Reviews are only available for premium rule holders. Purchase this rule to read and write reviews.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <>
                  {/* Review Form */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Leave a Review</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {user ? (
                        <>
                          <div className="space-y-2">
                            <label className="text-sm font-medium">Rating</label>
                            <div className="flex gap-2">
                              {Array.from({ length: 5 }).map((_, i) => (
                                <button
                                  key={i}
                                  onClick={() => setReviewForm(prev => ({ ...prev, rating: i + 1 }))}
                                  className="p-1 hover:scale-110 transition-transform"
                                >
                                  <Star
                                    className={cn(
                                      'w-6 h-6 transition-colors',
                                      i < reviewForm.rating
                                        ? 'fill-warning text-warning'
                                        : 'text-muted-foreground/30'
                                    )}
                                  />
                                </button>
                              ))}
                            </div>
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-medium">Comment</label>
                            <Textarea
                              placeholder="Share your thoughts about this rule..."
                              value={reviewForm.comment}
                              onChange={(e) => setReviewForm(prev => ({ ...prev, comment: e.target.value }))}
                              rows={4}
                              maxLength={500}
                            />
                            <p className="text-xs text-muted-foreground">
                              {reviewForm.comment.length}/500 characters
                            </p>
                          </div>
                          <Button
                            onClick={handleSubmitReview}
                            disabled={isSubmittingReview || !reviewForm.comment.trim()}
                            className="w-full"
                          >
                            {isSubmittingReview ? (
                              <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Submitting...
                              </>
                            ) : (
                              'Submit Review'
                            )}
                          </Button>
                        </>
                      ) : (
                        <Alert>
                          <AlertCircle className="w-4 h-4" />
                          <AlertDescription>
                            <Link to="/login" className="underline text-primary hover:text-primary/80">
                              Sign in
                            </Link>
                            {' '}to leave a review
                          </AlertDescription>
                        </Alert>
                      )}
                    </CardContent>
                  </Card>

                  {/* Reviews Loading State */}
                  {reviewsLoading ? (
                    <div className="text-center py-8">
                      <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2 text-muted-foreground" />
                      <p className="text-muted-foreground">Loading reviews...</p>
                    </div>
                  ) : null}

                  {/* Reviews List */}
                  {!reviewsLoading && reviews.length > 0 ? (
                    reviews.map((review) => {
                      const author = (review as any).user || (review as any).author;
                      return (
                        <Card key={review.id || review._id}>
                          <CardContent className="pt-6">
                            <div className="flex items-start gap-4">
                              <Avatar className="w-10 h-10">
                                <AvatarImage src={author?.profile?.avatar} />
                                <AvatarFallback className="bg-primary/20 text-primary">
                                  {author?.username?.[0]?.toUpperCase() || 'U'}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium">@{author?.username || 'Unknown'}</span>
                                  <div className="flex items-center">
                                    {Array.from({ length: 5 }).map((_, i) => (
                                      <Star
                                        key={i}
                                        className={cn(
                                          'w-4 h-4',
                                          i < (review.rating || 0)
                                            ? 'fill-warning text-warning'
                                            : 'text-muted-foreground/30'
                                        )}
                                      />
                                    ))}
                                  </div>
                                </div>
                                <p className="text-sm text-muted-foreground mt-2">{review.comment}</p>
                                <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                                  <span>{new Date(review.createdAt).toLocaleDateString()}</span>
                                  {(review as any).helpful !== undefined && (review as any).helpful !== null && (
                                    <span>
                                      {typeof (review as any).helpful === 'object' 
                                        ? ((review as any).helpful?.count || 0)
                                        : ((review as any).helpful || 0)} found this helpful
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })
                  ) : !reviewsLoading && reviews.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      No reviews yet. Be the first to review this rule!
                    </div>
                  ) : null}
                </>
              )}
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* MITRE Mappings */}
          {(rule.mitre && rule.mitre.length > 0) || (rule.mitreAttack?.tactics?.length ?? 0) > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">MITRE ATT&CK Mappings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {rule.mitre && rule.mitre.length > 0 ? (
                  rule.mitre.map((mapping, index) => (
                    <MitreBadge key={index} mapping={mapping} />
                  ))
                ) : rule.mitreAttack?.tactics && rule.mitreAttack.tactics.length > 0 ? (
                  rule.mitreAttack.tactics.map((tactic: string, index: number) => (
                    <MitreBadge 
                      key={index} 
                      mapping={{
                        tactic: tactic as any,
                        techniqueId: '',
                        techniqueName: '',
                      }}
                    />
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">No MITRE mappings available</p>
                )}
              </CardContent>
            </Card>
          ) : null}

          {/* Metadata */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              {rule.category && (
                <>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Category</span>
                    <Badge variant="secondary" className="text-xs capitalize">
                      {rule.category}
                    </Badge>
                  </div>
                  <Separator />
                </>
              )}
              {rule.queryLanguage && (
                <>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Query Language</span>
                    <span className="font-mono text-xs">{rule.queryLanguage}</span>
                  </div>
                  <Separator />
                </>
              )}
              {rule.vendor && (
                <>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Vendor</span>
                    <span className="text-xs">{rule.vendor}</span>
                  </div>
                  <Separator />
                </>
              )}
              {rule.platform && rule.platform.length > 0 && (
                <>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Platforms</span>
                    <div className="flex gap-1">
                      {rule.platform.map((p) => (
                        <Badge key={p} variant="secondary" className="text-xs">
                          {p}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <Separator />
                </>
              )}
              {rule.falsePositiveRate && (
                <>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">False Positive Rate</span>
                    <span className="capitalize">{rule.falsePositiveRate}</span>
                  </div>
                  <Separator />
                </>
              )}
              {rule.dataSource && rule.dataSource.length > 0 && (
                <>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Data Sources</span>
                    <span className="text-right text-xs">{rule.dataSource.join(', ')}</span>
                  </div>
                  <Separator />
                </>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">Created</span>
                <span>{new Date(rule.createdAt).toLocaleDateString()}</span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-muted-foreground">Last Updated</span>
                <span>{new Date(rule.updatedAt).toLocaleDateString()}</span>
              </div>
            </CardContent>
          </Card>

          {/* Tags */}
          {rule.tags && rule.tags.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Tags</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {rule.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* References */}
          {rule.references && rule.references.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">References</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {rule.references.map((ref, index) => (
                  <a
                    key={index}
                    href={ref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-primary hover:underline"
                  >
                    <ExternalLink className="w-3 h-3" />
                    {new URL(ref).hostname}
                  </a>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Rule Forks */}
          {ruleId && (
            <RuleForks 
              ruleId={ruleId} 
              ruleAuthorId={rule?.author?._id || rule?.author?.id}
              initialForkCount={rule?.forkCount || rule?.forks || 0}
              originalRule={rule}
              onForkCountChange={setActualForkCount}
            />
          )}
        </div>
      </div>
        </>
      )}
    </div>
  );
}
