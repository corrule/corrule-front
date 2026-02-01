import { useState, useEffect } from 'react';
import { ArrowLeft, Loader2, AlertCircle, Heart } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { RuleCard } from '@/components/RuleCard';
import { api } from '@/services/api';
import { useToast } from '@/hooks/use-toast';
import type { Rule } from '@/types';

export default function Favorites() {
  const { toast } = useToast();
  const [rules, setRules] = useState<Rule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchFavorites();
  }, []);

  const fetchFavorites = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Get user profile to access liked rules
      const userResponse = await api.getProfile();
      const user = userResponse.data.user;
      
      if (!user.likedRules || user.likedRules.length === 0) {
        setRules([]);
        setIsLoading(false);
        return;
      }

      // Fetch each liked rule
      const favoriteRules = await Promise.all(
        user.likedRules.map(async (ruleId: string) => {
          try {
            const ruleResponse = await api.getRule(ruleId);
            return ruleResponse.rule;
          } catch (err) {
            console.error(`Failed to fetch rule ${ruleId}:`, err);
            return null;
          }
        })
      );

      // Filter out failed fetches
      setRules(favoriteRules.filter((rule): rule is Rule => rule !== null));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load favorites';
      setError(message);
      toast({ title: 'Error', description: message, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex items-center gap-4">
        <Link to="/rules">
          <Button variant="outline" size="icon">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div>
          <div className="flex items-center gap-2">
            <Heart className="w-6 h-6 fill-destructive text-destructive" />
            <h1 className="text-2xl font-bold">Favorite Rules</h1>
          </div>
          <p className="text-muted-foreground">
            Your collection of liked detection rules. ({rules.length} total)
          </p>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-muted-foreground">Loading your favorites...</p>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="w-4 h-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Empty State */}
      {!isLoading && !error && rules.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Heart className="w-16 h-16 text-muted-foreground/30 mb-4" />
          <h3 className="text-lg font-semibold text-muted-foreground mb-2">No favorite rules yet</h3>
          <p className="text-muted-foreground mb-6">
            Start liking rules to build your collection of favorite detection rules.
          </p>
          <Link to="/rules">
            <Button>Browse Rules</Button>
          </Link>
        </div>
      )}

      {/* Rules Grid */}
      {!isLoading && !error && rules.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {rules.map((rule) => (
            <RuleCard key={rule.id || rule._id} rule={rule} />
          ))}
        </div>
      )}
    </div>
  );
}
