import React, { useEffect, useState } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '@/services/api';
import { titleToSlug } from '@/lib/slugUtils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Loader2,
  Search,
  Star,
  Shield,
  FileCode,
  ArrowRight,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Filter,
  Download,
  Heart,
  MessageCircle,
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface User {
  _id: string;
  username: string;
  email: string;
  profile?: {
    firstName?: string;
    lastName?: string;
    bio?: string;
    avatar?: string;
    location?: string;
    website?: string;
  };
  statistics?: {
    totalRules?: number;
    totalDownloads?: number;
    rating?: number;
  };
  stats?: {
    rulesPublished?: number;
    rulesDownloaded?: number;
    averageRating?: number;
  };
}

interface Rule {
  _id: string;
  id?: string;
  title: string;
  description: string;
  content?: string;
  author?: {
    _id: string;
    username: string;
  };
  creator?: {
    _id: string;
    username: string;
  };
  category?: string;
  tags?: string[];
  severity?: string;
  downloads?: number;
  likes?: number;
  rating?: number;
  reviewCount?: number;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
  statistics?: {
    downloads?: number;
    likes?: number;
    rating?: number;
  };
  pricing?: {
    type?: 'FREE' | 'PAID';
    amount?: number;
    isPaid?: boolean;
    price?: number;
  };
  stats?: {
    downloads?: number;
    rating?: number;
    reviews?: number;
  };
  visibility?: string;
  vendor?: string;
}

export default function SearchResults() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [users, setUsers] = useState<User[]>([]);
  const [rules, setRules] = useState<Rule[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [sortBy, setSortBy] = useState('relevance');
  const [rulesPage, setRulesPage] = useState(1);
  const [usersPage, setUsersPage] = useState(1);
  const itemsPerPage = 12;

  const handleSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setUsers([]);
      setRules([]);
      return;
    }

    setLoading(true);
    setError('');
    setRulesPage(1);
    setUsersPage(1);

    try {
      const token = localStorage.getItem('access_token');

      // Search users
      const usersResponse = await fetch(`${API_BASE_URL}/users/search?query=${encodeURIComponent(searchQuery)}&t=${Date.now()}`, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Cache-Control': 'no-cache, no-store, must-revalidate'
        },
      });

      if (usersResponse.ok) {
        const usersData = await usersResponse.json();
        const fetchedUsers = usersData.data?.users || [];
        setUsers(fetchedUsers);
      }

      // Search rules with sorting
      let ruleUrl = `${API_BASE_URL}/rules?search=${encodeURIComponent(searchQuery)}&limit=100&t=${Date.now()}`;
      if (sortBy !== 'relevance') {
        ruleUrl += `&sort=${sortBy}`;
      }

      const rulesResponse = await fetch(ruleUrl, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Cache-Control': 'no-cache, no-store, must-revalidate'
        },
      });

      if (rulesResponse.ok) {
        const rulesData = await rulesResponse.json();
        setRules(rulesData.data?.rules || []);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error searching');
      console.error('Search error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const q = searchParams.get('q') || '';
    setQuery(q);
    if (q.trim()) {
      handleSearch(q);
    }
  }, [searchParams]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      setSearchParams({ q: query });
      handleSearch(query);
    }
  };

  // Pagination logic
  const paginatedRules = rules.slice((rulesPage - 1) * itemsPerPage, rulesPage * itemsPerPage);
  const totalRulesPages = Math.ceil(rules.length / itemsPerPage);

  const paginatedUsers = users.slice((usersPage - 1) * itemsPerPage, usersPage * itemsPerPage);
  const totalUsersPages = Math.ceil(users.length / itemsPerPage);

  const totalResults = users.length + rules.length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-background/80">
      {/* Navigation Breadcrumb */}
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <button
              onClick={() => navigate('/rules')}
              className="flex items-center gap-1 hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Rules
            </button>
            <span>/</span>
            <span className="text-foreground font-medium">Search Results</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search Header with Enhanced Styling */}
        <div className="mb-8">
          <div className="space-y-2 mb-6">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              Search Rules & Users
            </h1>
            <p className="text-muted-foreground">Find the perfect security rules and connect with creators</p>
          </div>

          <form onSubmit={handleSubmit} className="flex gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search for rules, users, categories..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pl-10 h-11 text-base"
              />
            </div>
            <Button type="submit" size="lg" className="gap-2">
              <Search className="w-4 h-4" />
              Search
            </Button>
          </form>

          {totalResults > 0 && (
            <div className="mt-4 text-sm text-muted-foreground">
              Found <span className="font-semibold text-foreground">{totalResults}</span> results
              {query && (
                <>
                  {' '}for <span className="font-semibold text-foreground">"{query}"</span></>
              )}
            </div>
          )}
        </div>

        {loading && (
          <div className="flex flex-col items-center justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">Searching...</p>
          </div>
        )}

        {error && (
          <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive mb-6">
            {error}
          </div>
        )}

        {!loading && query && !error && (
          <div className="space-y-6">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <div className="flex items-center justify-between mb-6">
                <TabsList className="bg-secondary/30">
                  <TabsTrigger value="all" className="gap-2">
                    <Search className="w-4 h-4" />
                    All ({users.length + rules.length})
                  </TabsTrigger>
                  <TabsTrigger value="users" className="gap-2">
                    <Shield className="w-4 h-4" />
                    Users ({users.length})
                  </TabsTrigger>
                  <TabsTrigger value="rules" className="gap-2">
                    <FileCode className="w-4 h-4" />
                    Rules ({rules.length})
                  </TabsTrigger>
                </TabsList>

                {activeTab === 'rules' && rules.length > 0 && (
                  <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-muted-foreground" />
                    <Select value={sortBy} onValueChange={setSortBy}>
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Sort by..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="relevance">Relevance</SelectItem>
                        <SelectItem value="-statistics.downloads">Most Downloaded</SelectItem>
                        <SelectItem value="-statistics.rating">Highest Rated</SelectItem>
                        <SelectItem value="-createdAt">Newest</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              {/* All Results Tab */}
              <TabsContent value="all" className="space-y-8">
                {/* Users Section */}
                {users.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-xl font-semibold flex items-center gap-2">
                        <Shield className="w-5 h-5 text-primary" />
                        Users ({users.length})
                      </h2>
                      {users.length > 4 && (
                        <Link to="/search?tab=users" className="text-sm text-primary hover:underline">
                          View All
                          <ArrowRight className="w-3 h-3 inline ml-1" />
                        </Link>
                      )}
                    </div>
                    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
                      {users.slice(0, 4).map((user) => (
                        <Link key={user._id} to={`/users/${user.username}`}>
                          <Card className="hover:shadow-lg hover:border-primary/50 transition-all duration-200 h-full cursor-pointer">
                            <CardContent className="pt-6">
                              <div className="text-center">
                                <Avatar className="w-16 h-16 mx-auto mb-3">
                                  <AvatarImage src={user.profile?.avatar} />
                                  <AvatarFallback className="bg-primary/20 text-primary text-lg">
                                    {user.profile?.firstName?.[0] || user.username?.[0]?.toUpperCase() || 'U'}
                                  </AvatarFallback>
                                </Avatar>
                                <h3 className="font-semibold text-sm">
                                  {user.profile?.firstName || user.username}
                                </h3>
                                <p className="text-xs text-muted-foreground">@{user.username}</p>
                                {user.profile?.bio && (
                                  <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                                    {user.profile.bio}
                                  </p>
                                )}
                                {user.profile?.location && (
                                  <p className="text-xs text-muted-foreground mt-1">
                                    📍 {user.profile.location}
                                  </p>
                                )}
                                <div className="flex items-center justify-center gap-4 mt-4 text-xs border-t border-border/30 pt-3">
                                  <div className="text-center">
                                    <p className="font-semibold text-foreground">
                                      {(user.statistics?.totalRules || user.stats?.rulesPublished || 0)}
                                    </p>
                                    <p className="text-muted-foreground text-xs">Rules</p>
                                  </div>
                                  <div className="text-center">
                                    <p className="font-semibold text-foreground flex items-center justify-center gap-1">
                                      <Star className="w-3 h-3 fill-primary text-primary" />
                                      {(user.stats?.averageRating ?? user.statistics?.rating ?? 0).toFixed(1)}
                                    </p>
                                    <p className="text-muted-foreground text-xs">Rating</p>
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {/* Rules Section */}
                {rules.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-xl font-semibold flex items-center gap-2">
                        <FileCode className="w-5 h-5 text-primary" />
                        Rules ({rules.length})
                      </h2>
                      {rules.length > 4 && (
                        <Link to="/search?tab=rules" className="text-sm text-primary hover:underline">
                          View All
                          <ArrowRight className="w-3 h-3 inline ml-1" />
                        </Link>
                      )}
                    </div>
                    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                      {rules.slice(0, 3).map((rule) => (
                        <Link key={rule._id} to={`/rules/${titleToSlug(rule.title)}`}>
                          <Card className="hover:shadow-lg hover:border-primary/50 transition-all duration-200 h-full cursor-pointer">
                            <CardHeader>
                              <div className="flex items-start justify-between gap-2">
                                <CardTitle className="text-base line-clamp-2">{rule.title}</CardTitle>
                              </div>
                              <CardDescription className="text-xs">
                                by <span className="font-medium">@{rule.author?.username || rule.creator?.username}</span>
                              </CardDescription>
                            </CardHeader>
                            <CardContent>
                              <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                                {rule.description}
                              </p>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
                                {rule.category && (
                                  <Badge variant="outline" className="text-xs">
                                    {rule.category}
                                  </Badge>
                                )}
                                {rule.severity && (
                                  <Badge variant="secondary" className="text-xs">
                                    {rule.severity}
                                  </Badge>
                                )}
                              </div>
                              <div className="flex items-center gap-4 mt-4 text-xs text-muted-foreground border-t border-border/30 pt-3">
                                {(rule.downloads || rule.statistics?.downloads) && (
                                  <span className="flex items-center gap-1">
                                    <Download className="w-3 h-3" />
                                    {rule.downloads || rule.statistics?.downloads || 0}
                                  </span>
                                )}
                                {(rule.rating || rule.statistics?.rating) && (
                                  <span className="flex items-center gap-1">
                                    <Star className="w-3 h-3 fill-primary text-primary" />
                                    {(rule.rating || rule.statistics?.rating || 0).toFixed(1)}
                                  </span>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {users.length === 0 && rules.length === 0 && (
                  <div className="text-center py-16">
                    <Search className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-30" />
                    <h3 className="text-xl font-semibold">No results found</h3>
                    <p className="text-muted-foreground mt-2">
                      Try searching with different keywords or browse all rules
                    </p>
                    <Button className="mt-4" variant="outline" onClick={() => navigate('/rules')}>
                      Browse All Rules
                    </Button>
                  </div>
                )}
              </TabsContent>

              {/* Users Tab */}
              <TabsContent value="users" className="space-y-6">
                {users.length > 0 ? (
                  <>
                    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
                      {paginatedUsers.map((user) => (
                        <Link key={user._id} to={`/users/${user.username}`}>
                          <Card className="hover:shadow-lg hover:border-primary/50 transition-all duration-200 h-full cursor-pointer">
                            <CardContent className="pt-6">
                              <div className="text-center">
                                <Avatar className="w-16 h-16 mx-auto mb-3">
                                  <AvatarImage src={user.profile?.avatar} />
                                  <AvatarFallback className="bg-primary/20 text-primary text-lg">
                                    {user.profile?.firstName?.[0] || user.username?.[0]?.toUpperCase() || 'U'}
                                  </AvatarFallback>
                                </Avatar>
                                <h3 className="font-semibold text-sm">
                                  {user.profile?.firstName || user.username}
                                </h3>
                                <p className="text-xs text-muted-foreground">@{user.username}</p>
                                {user.profile?.bio && (
                                  <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                                    {user.profile.bio}
                                  </p>
                                )}
                                {user.profile?.location && (
                                  <p className="text-xs text-muted-foreground mt-1">
                                    📍 {user.profile.location}
                                  </p>
                                )}
                                <div className="flex items-center justify-center gap-4 mt-4 text-xs border-t border-border/30 pt-3">
                                  <div className="text-center">
                                    <p className="font-semibold text-foreground">
                                      {(user.statistics?.totalRules || user.stats?.rulesPublished || 0)}
                                    </p>
                                    <p className="text-muted-foreground text-xs">Rules</p>
                                  </div>
                                  <div className="text-center">
                                    <p className="font-semibold text-foreground flex items-center justify-center gap-1">
                                      <Star className="w-3 h-3 fill-primary text-primary" />
                                      {(user.stats?.averageRating ?? user.statistics?.rating ?? 0).toFixed(1)}
                                    </p>
                                    <p className="text-muted-foreground text-xs">Rating</p>
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </Link>
                      ))}
                    </div>

                    {/* Pagination */}
                    {totalUsersPages > 1 && (
                      <div className="flex items-center justify-center gap-2 mt-8">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setUsersPage(p => Math.max(1, p - 1))}
                          disabled={usersPage === 1}
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </Button>
                        <div className="flex items-center gap-2">
                          {Array.from({ length: totalUsersPages }).map((_, i) => (
                            <Button
                              key={i + 1}
                              variant={usersPage === i + 1 ? 'default' : 'outline'}
                              size="sm"
                              onClick={() => setUsersPage(i + 1)}
                            >
                              {i + 1}
                            </Button>
                          ))}
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setUsersPage(p => Math.min(totalUsersPages, p + 1))}
                          disabled={usersPage === totalUsersPages}
                        >
                          <ChevronRight className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-12">
                    <Shield className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-30" />
                    <p className="text-muted-foreground">No users found</p>
                  </div>
                )}
              </TabsContent>

              {/* Rules Tab */}
              <TabsContent value="rules" className="space-y-6">
                {rules.length > 0 ? (
                  <>
                    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                      {paginatedRules.map((rule) => (
                        <Link key={rule._id} to={`/rules/${titleToSlug(rule.title)}`}>
                          <Card className="hover:shadow-lg hover:border-primary/50 transition-all duration-200 h-full cursor-pointer">
                            <CardHeader>
                              <div className="flex items-start justify-between gap-2">
                                <CardTitle className="text-base line-clamp-2">{rule.title}</CardTitle>
                              </div>
                              <CardDescription className="text-xs">
                                by <span className="font-medium">@{rule.author?.username || rule.creator?.username}</span>
                              </CardDescription>
                            </CardHeader>
                            <CardContent>
                              <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                                {rule.description}
                              </p>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
                                {rule.category && (
                                  <Badge variant="outline" className="text-xs">
                                    {rule.category}
                                  </Badge>
                                )}
                                {rule.severity && (
                                  <Badge variant="secondary" className="text-xs">
                                    {rule.severity}
                                  </Badge>
                                )}
                              </div>
                              <div className="flex items-center gap-4 mt-4 text-xs text-muted-foreground border-t border-border/30 pt-3">
                                {(rule.downloads || rule.statistics?.downloads) && (
                                  <span className="flex items-center gap-1">
                                    <Download className="w-3 h-3" />
                                    {rule.downloads || rule.statistics?.downloads || 0}
                                  </span>
                                )}
                                {(rule.rating || rule.statistics?.rating) && (
                                  <span className="flex items-center gap-1">
                                    <Star className="w-3 h-3 fill-primary text-primary" />
                                    {(rule.rating || rule.statistics?.rating || 0).toFixed(1)}
                                  </span>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        </Link>
                      ))}
                    </div>

                    {/* Pagination */}
                    {totalRulesPages > 1 && (
                      <div className="flex items-center justify-center gap-2 mt-8">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setRulesPage(p => Math.max(1, p - 1))}
                          disabled={rulesPage === 1}
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </Button>
                        <div className="flex items-center gap-2">
                          {Array.from({ length: Math.min(totalRulesPages, 5) }).map((_, i) => (
                            <Button
                              key={i + 1}
                              variant={rulesPage === i + 1 ? 'default' : 'outline'}
                              size="sm"
                              onClick={() => setRulesPage(i + 1)}
                            >
                              {i + 1}
                            </Button>
                          ))}
                          {totalRulesPages > 5 && <span className="text-muted-foreground">...</span>}
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setRulesPage(p => Math.min(totalRulesPages, p + 1))}
                          disabled={rulesPage === totalRulesPages}
                        >
                          <ChevronRight className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-12">
                    <FileCode className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-30" />
                    <p className="text-muted-foreground">No rules found</p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        )}

        {!query && !loading && (
          <div className="text-center py-16">
            <Search className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-30" />
            <h3 className="text-xl font-semibold">Start searching</h3>
            <p className="text-muted-foreground mt-2">
              Use the search bar above to find rules and users
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
