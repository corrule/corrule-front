import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '@/services/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { titleToSlug } from '@/lib/slugUtils';
import { 
  Loader2, Star, Mail, MapPin, Link as LinkIcon, FileCode, Download, 
  CheckCircle, Shield, Crown, Briefcase, ExternalLink, Calendar, Code,
  Linkedin, Github, Instagram, Facebook, GitBranch, Users, LogOut, Settings,
  Search, Command, X, Heart, GitFork, MessageCircle
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/useAuth';

interface Rule {
  _id: string;
  title: string;
  description: string;
  category?: string;
  tags?: string[];
  reviewCount?: number;
  statistics?: {
    downloads?: number;
    rating?: number;
    likes?: number;
    forks?: number;
    totalRatings?: number;
  };
  pricing?: {
    isPaid?: boolean;
    price?: number;
  };
  visibility?: 'PUBLIC' | 'PRIVATE' | 'PAID';
  status?: string;
}

interface WorkExperience {
  _id?: string;
  company: {
    name: string;
    isCustom: boolean;
  };
  job: {
    title: string;
    isCustom: boolean;
  };
  startDate: string | Date;
  endDate: string | Date | null;
  isCurrent: boolean;
}

interface SocialMediaAccount {
  _id?: string;
  platform: string;
  url: string;
}

interface UserProfile {
  _id: string;
  id?: string;
  username: string;
  email: string;
  role?: 'USER' | 'VERIFIED_CONTRIBUTOR' | 'MODERATOR' | 'ADMIN';
  profile?: {
    firstName?: string;
    lastName?: string;
    bio?: string;
    avatar?: string;
    location?: string;
    website?: string;
  };
  workExperience?: WorkExperience[];
  socialMediaAccounts?: SocialMediaAccount[];
  statistics?: {
    totalRules?: number;
    totalDownloads?: number;
    totalEarnings?: number;
    rating?: number;
  };
  createdAt?: string;
  rulesCreated?: number;
}

// Social media icon map
const SOCIAL_MEDIA_ICONS: Record<string, React.ComponentType<any>> = {
  linkedin: Linkedin,
  github: Github,
  instagram: Instagram,
  facebook: Facebook,
  gitlab: GitBranch,
};

const SOCIAL_MEDIA_COLORS: Record<string, { text: string; bg: string; hover: string }> = {
  linkedin: { text: 'text-[#0A66C2]', bg: 'bg-[#0A66C2]/10', hover: 'hover:bg-[#0A66C2]/20' },
  github: { text: 'text-[#333333]', bg: 'bg-[#333333]/10', hover: 'hover:bg-[#333333]/20' },
  instagram: { text: 'text-[#E4405F]', bg: 'bg-[#E4405F]/10', hover: 'hover:bg-[#E4405F]/20' },
  facebook: { text: 'text-[#1877F2]', bg: 'bg-[#1877F2]/10', hover: 'hover:bg-[#1877F2]/20' },
  gitlab: { text: 'text-[#FC6D26]', bg: 'bg-[#FC6D26]/10', hover: 'hover:bg-[#FC6D26]/20' },
};

function getSocialIcon(platform: string) {
  const IconComponent = SOCIAL_MEDIA_ICONS[platform.toLowerCase()] || LinkIcon;
  return <IconComponent className="w-5 h-5" />;
}

function getSocialColor(platform: string) {
  return SOCIAL_MEDIA_COLORS[platform.toLowerCase()] || { text: 'text-muted-foreground', bg: 'bg-muted', hover: 'hover:bg-muted' };
}

const RoleBadge = ({ role }: { role?: string }) => {
  if (!role || role === 'USER') return null;
  
  switch (role) {
    case 'VERIFIED_CONTRIBUTOR':
      return (
        <Badge className="bg-blue-500 hover:bg-blue-600 flex items-center gap-1">
          <CheckCircle className="w-3 h-3" />
          Verified Contributor
        </Badge>
      );
    case 'MODERATOR':
      return (
        <Badge className="bg-purple-500 hover:bg-purple-600 flex items-center gap-1">
          <Shield className="w-3 h-3" />
          Moderator
        </Badge>
      );
    case 'ADMIN':
      return (
        <Badge className="bg-amber-500 hover:bg-amber-600 flex items-center gap-1">
          <Crown className="w-3 h-3" />
          Admin
        </Badge>
      );
    default:
      return null;
  }
};

export default function PublicProfile() {
  const { userId, username } = useParams<{ userId?: string; username?: string }>();
  const navigate = useNavigate();
  const { user: currentUser, logout } = useAuth();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [rules, setRules] = useState<Rule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (currentUser && user && currentUser._id === user._id) {
      navigate('/profile');
    }
  }, [currentUser, user, navigate]);

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        setLoading(true);
        setError('');

        // Block ID-based access - only allow username
        if (userId && !username) {
          setError('User not found');
          setLoading(false);
          return;
        }

        // Require username
        if (!username) {
          setError('User not found');
          setLoading(false);
          return;
        }

        const token = localStorage.getItem('access_token');
        const endpoint = `${API_BASE_URL}/users/${username}`;

        const response = await fetch(endpoint, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) {
          throw new Error('User not found');
        }

        const data = await response.json();
        const userData = data.data?.user || data.data;
        setUser(userData);

        // Fetch user's published rules from user-specific endpoint
        const rulesResponse = await fetch(
          `${API_BASE_URL}/users/${username}/rules?limit=100`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        if (rulesResponse.ok) {
          const rulesData = await rulesResponse.json();
          const userRules = (rulesData.data?.rules || []).filter((rule: any) => {
            // Only show PUBLIC rules on public profile (filter out PAID)
            return rule.visibility !== 'PRIVATE';
          });
          setRules(userRules);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error loading profile');
        console.error('Profile error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [userId, username]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md border-destructive/50">
          <CardContent className="py-8 text-center">
            <h2 className="text-xl font-semibold text-destructive mb-2">Error</h2>
            <p className="text-muted-foreground">{error || 'User not found'}</p>
            <Link to="/">
              <Button className="mt-4">Go back home</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Navbar */}
      <header className="sticky top-0 z-40 flex items-center h-16 px-6 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        {/* Logo */}
        <Link to="/" className="mr-8 flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <Shield className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="font-bold text-lg hidden sm:inline">Corrule</span>
        </Link>

        {/* Navigation Links */}
        <nav className="hidden md:flex items-center gap-1 flex-1">
          <Link to="/">
            <Button variant="ghost" className="text-muted-foreground hover:text-foreground">
              Home
            </Button>
          </Link>
          <Link to="/rules">
            <Button variant="ghost" className="text-muted-foreground hover:text-foreground">
              Explore Rules
            </Button>
          </Link>
        </nav>

        {/* Search & Right Side */}
        <div className="flex items-center gap-2 ml-auto">
          {currentUser ? (
            <>
              {/* User Profile Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={currentUser.profile?.avatar} />
                      <AvatarFallback className="text-xs">
                        {currentUser.profile?.firstName?.[0]?.toUpperCase() || currentUser.username?.[0]?.toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <div className="flex flex-col gap-1">
                      <p className="text-sm font-semibold">
                        {currentUser.profile?.firstName || currentUser.username}
                      </p>
                      <p className="text-xs text-muted-foreground">@{currentUser.username}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <Link to="/profile">
                    <DropdownMenuItem>
                      <Settings className="w-4 h-4 mr-2" />
                      Profile Settings
                    </DropdownMenuItem>
                  </Link>
                  <Link to="/my-rules">
                    <DropdownMenuItem>
                      <FileCode className="w-4 h-4 mr-2" />
                      My Rules
                    </DropdownMenuItem>
                  </Link>
                  <Link to="/dashboard">
                    <DropdownMenuItem>
                      <Code className="w-4 h-4 mr-2" />
                      Dashboard
                    </DropdownMenuItem>
                  </Link>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => {
                    logout();
                    navigate('/');
                  }}>
                    <LogOut className="w-4 h-4 mr-2" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <>
              <Link to="/login">
                <Button variant="outline" size="sm">Login</Button>
              </Link>
              <Link to="/register">
                <Button size="sm">Sign Up</Button>
              </Link>
            </>
          )}
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Left Sidebar - Compact */}
          <div className="lg:w-80 flex-shrink-0 space-y-4">
            {/* Profile Card */}
            <Card className="border-border/50 shadow-sm sticky top-24">
              <CardContent className="p-5">
                {/* Avatar - Smaller */}
                <div className="mb-4">
                  <Avatar className="w-24 h-24 border-2 border-background shadow-md mx-auto">
                    <AvatarImage src={user.profile?.avatar} alt={user.profile?.firstName || user.username} />
                    <AvatarFallback className="bg-gradient-to-br from-primary/30 to-primary/10 text-primary text-3xl font-bold">
                      {user.profile?.firstName?.[0]?.toUpperCase() || user.username?.[0]?.toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                </div>

                {/* Name & Badge */}
                <div className="text-center mb-3">
                  <h1 className="text-xl font-bold">
                    {user.profile?.firstName || user.username}
                    {user.profile?.lastName && ` ${user.profile.lastName}`}
                  </h1>
                  <p className="text-xs text-muted-foreground mb-2">@{user.username}</p>
                  <div className="flex justify-center">
                    <RoleBadge role={user.role} />
                  </div>
                </div>

                {/* Bio - Shorter */}
                {user.profile?.bio && (
                  <p className="text-xs text-muted-foreground mb-4 leading-relaxed text-center line-clamp-3">
                    {user.profile.bio}
                  </p>
                )}

                {/* Quick Info */}
                <div className="space-y-2 text-xs mb-4 pb-4 border-b border-border/30">
                  {user.profile?.location && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MapPin className="w-3 h-3 flex-shrink-0" />
                      <span className="truncate">{user.profile.location}</span>
                    </div>
                  )}
                  {user.email && (
                    <a
                      href={`mailto:${user.email}`}
                      className="flex items-center gap-2 text-primary hover:text-primary/80 transition-colors"
                      title={`Email: ${user.email}`}
                    >
                      <Mail className="w-3 h-3 flex-shrink-0" />
                      <span className="truncate text-xs">{user.email}</span>
                    </a>
                  )}
                  {user.profile?.website && (
                    <a
                      href={user.profile.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-primary hover:text-primary/80 transition-colors"
                    >
                      <LinkIcon className="w-3 h-3 flex-shrink-0" />
                      <span className="truncate text-xs">Website</span>
                    </a>
                  )}
                </div>

                {/* Social Links - Compact */}
                {user.socialMediaAccounts && user.socialMediaAccounts.length > 0 && (
                  <div className="mb-3">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Social</p>
                    <div className="flex gap-1.5">
                      {user.socialMediaAccounts.map((account) => {
                        const colors = getSocialColor(account.platform);
                        return (
                          <a
                            key={account._id}
                            href={account.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`inline-flex items-center justify-center w-8 h-8 rounded border border-border/30 ${colors.bg} ${colors.text} ${colors.hover} transition-all duration-200`}
                            title={`Visit ${account.platform}`}
                          >
                            {getSocialIcon(account.platform)}
                          </a>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Joined Date */}
                <div className="text-xs text-muted-foreground">
                  <strong>Joined</strong> {user.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short' }) : 'unknown'}
                </div>
              </CardContent>
            </Card>

            {/* Work Experience - Compact Sidebar */}
            {user.workExperience && user.workExperience.length > 0 && (
              <Card className="border-border/30 shadow-sm bg-muted/30">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Briefcase className="w-4 h-4 text-muted-foreground" />
                    Experience
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 max-h-96 overflow-y-auto">
                  {user.workExperience.map((exp, idx) => (
                    <div key={exp._id || idx} className="pb-3 last:pb-0">
                      <h4 className="font-medium text-xs">{exp.job.title}</h4>
                      <p className="text-xs text-muted-foreground">{exp.company.name}</p>
                      <p className="text-xs text-muted-foreground/70 mt-1">
                        {new Date(exp.startDate).toLocaleDateString('en-US', { month: 'short', year: '2-digit' })}
                        {' - '}
                        {exp.isCurrent 
                          ? 'Now' 
                          : new Date(exp.endDate!).toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
                        }
                      </p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Main Content - Rules Focused */}
          <div className="flex-1 min-w-0">
            {/* Stats Row */}
            <div className="grid grid-cols-3 gap-3 mb-6">
              <div className="bg-muted/50 rounded-lg p-3 text-center">
                <p className="text-xs text-muted-foreground font-medium mb-1">Published</p>
                <p className="text-2xl font-bold text-primary">{user.rulesCreated || 0}</p>
              </div>
              <div className="bg-muted/50 rounded-lg p-3 text-center">
                <p className="text-xs text-muted-foreground font-medium mb-1">Downloads</p>
                <p className="text-2xl font-bold text-primary">
                  {user.statistics?.totalDownloads || 0}
                </p>
              </div>
              <div className="bg-muted/50 rounded-lg p-3 text-center">
                <p className="text-xs text-muted-foreground font-medium mb-1">Avg Rating</p>
                <div className="flex items-center justify-center gap-1">
                  <p className="text-2xl font-bold text-primary">
                    {(user.statistics?.rating || 0).toFixed(1)}
                  </p>
                  <Star className="w-4 h-4 fill-primary text-primary" />
                </div>
              </div>
            </div>

            {/* Rules Section - Main Focus */}
            {rules.length > 0 ? (
              <div>
                <h2 className="text-xl font-bold mb-4">Published Rules</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {rules.map((rule) => (
                    <Link key={rule._id} to={`/rules/${titleToSlug(rule.title)}`}>
                      <Card className="border-border/50 hover:border-primary/50 hover:shadow-md transition-all cursor-pointer h-full">
                        <CardContent className="p-4">
                          <div className="mb-3">
                            <h3 className="font-semibold text-base mb-1 line-clamp-2">{rule.title}</h3>
                            <p className="text-sm text-muted-foreground line-clamp-2">{rule.description}</p>
                          </div>
                          
                          {rule.category && (
                            <div className="mb-3">
                              <Badge variant="outline" className="text-xs">
                                {rule.category}
                              </Badge>
                            </div>
                          )}
                          
                          <div className="flex items-center justify-between text-xs text-muted-foreground pt-3 border-t border-border/30">
                            <div className="flex items-center gap-3">
                              <div className="flex items-center gap-1">
                                <Download className="w-4 h-4" />
                                {rule.statistics?.downloads || 0}
                              </div>
                              <div className="flex items-center gap-1">
                                <Star className="w-4 h-4 fill-primary text-primary" />
                                {(rule.statistics?.rating || 0).toFixed(1)}
                              </div>
                              <div className="flex items-center gap-1">
                                <Heart className="w-4 h-4" />
                                {rule.statistics?.likes || 0}
                              </div>
                              <div className="flex items-center gap-1">
                                <GitFork className="w-4 h-4" />
                                {rule.statistics?.forks || 0}
                              </div>
                              {(rule.reviewCount || rule.statistics?.totalRatings || 0) > 0 && (
                                <div className="flex items-center gap-1">
                                  <MessageCircle className="w-4 h-4" />
                                  {rule.reviewCount || rule.statistics?.totalRatings || 0}
                                </div>
                              )}
                            </div>
                            {rule.pricing?.isPaid && (
                              <Badge variant="secondary" className="text-xs">
                                {rule.pricing.price ? `$${rule.pricing.price}` : 'Paid'}
                              </Badge>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <FileCode className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-semibold mb-2">No Rules Published Yet</h3>
                <p className="text-muted-foreground">Check back soon for new security rules.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
