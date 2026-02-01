// User types
export interface User {
  _id?: string;
  id?: string;
  username: string;
  email: string;
  profile?: UserProfile;
  role: 'USER' | 'VERIFIED_CONTRIBUTOR' | 'MODERATOR' | 'ADMIN';
  status?: 'active' | 'suspended';
  createdAt: string;
  updatedAt: string;
  emailVerified?: boolean;
  isActive?: boolean;
  isBanned?: boolean;
  banReason?: string;
  twoFactorAuth?: {
    enabled: boolean;
  };
  statistics?: UserStatistics;
  billing?: UserBilling;
  refreshTokens?: RefreshToken[];
  loginHistory?: LoginRecord[];
  lastLogin?: string;
  likedRules?: string[];
  workExperience?: WorkExperienceEntry[];
  socialMediaAccounts?: SocialMediaAccount[];
}

export interface UserProfile {
  firstName: string;
  lastName: string;
  bio: string;
  location: string;
  website: string;
  avatar?: string;
}

export interface WorkExperienceEntry {
  _id?: string;
  company: {
    name: string;
    isCustom: boolean;
  };
  job: {
    title: string;
    isCustom: boolean;
  };
  startDate: Date | string;
  endDate: Date | string | null;
  isCurrent: boolean;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

export interface SocialMediaAccount {
  _id?: string;
  platform: string;
  url: string;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

export interface UserStatistics {
  totalRules: number;
  totalDownloads: number;
  totalEarnings: number;
  rating: number;
}

export interface UserBilling {
  balance: number;
  currency: string;
}

export interface RefreshToken {
  id: string;
  token: string;
  deviceInfo: string;
  ipAddress: string;
  expiresAt: string;
  createdAt: string;
}

export interface LoginRecord {
  id: string;
  timestamp: string;
  ipAddress: string;
  userAgent: string;
  success: boolean;
}

// Rule types
export interface Rule {
  _id?: string;
  id?: string;
  title: string;
  description: string;
  content?: string;
  ruleContent?: {
    query: string;
    parameters?: Record<string, any>;
  };
  author: User;
  status: RuleStatus;
  visibility: 'PUBLIC' | 'PRIVATE' | 'PAID' | 'public' | 'private' | 'paid';
  price?: number;
  version?: string | { current: string; changelog: Array<{ version: string; changes: string; author?: string; createdAt?: string }> };
  versions?: RuleVersion[];
  mitre?: MitreMapping[];
  mitreAttack?: {
    tactics: string[];
    techniques: string[];
  };
  tags: string[];
  platform?: string[];
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' | 'low' | 'medium' | 'high' | 'critical';
  falsePositiveRate?: 'LOW' | 'MEDIUM' | 'HIGH' | 'low' | 'medium' | 'high';
  dataSource?: string[];
  references?: string[];
  queryLanguage?: string;
  vendor?: string;
  category?: string;
  downloads?: number;
  likes?: number;
  forks?: number;
  rating?: number;
  reviewCount?: number;
  forkedFrom?: string;
  // Fork tracking metadata
  parentRuleId?: string;
  parentRule?: Rule;
  forkedFromVersion?: string;
  forkCount?: number;
  mergedAt?: string | null;
  mergedIntoRule?: string;
  pricing?: {
    isPaid: boolean;
    price?: number;
  };
  statistics?: {
    views?: number;
    downloads?: number;
    forks?: number;
    purchases?: number;
    likes?: number;
    rating?: number;
    totalRatings?: number;
  };
  isActive?: boolean;
  createdAt: string;
  updatedAt: string;
}

export type RuleStatus = 'DRAFT' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED' | 'draft' | 'review' | 'published' | 'deprecated';

export interface RuleVersion {
  _id?: string;
  version: string;
  content?: string;
  ruleContent?: {
    query: string;
  };
  changelog?: string;
  author?: string;
  createdBy?: string;
  createdAt: string;
}

export interface MitreMapping {
  tactic: MitreTactic;
  techniqueId?: string;
  techniqueName?: string;
  subtechniqueId?: string;
  subtechniqueName?: string;
}

export type MitreTactic = 
  | 'reconnaissance'
  | 'resource-development'
  | 'initial-access'
  | 'execution'
  | 'persistence'
  | 'privilege-escalation'
  | 'defense-evasion'
  | 'credential-access'
  | 'discovery'
  | 'lateral-movement'
  | 'collection'
  | 'command-and-control'
  | 'exfiltration'
  | 'impact';

// Review types
export interface Review {
  _id?: string;
  id?: string;
  ruleId: string;
  author: User;
  rating: number;
  comment: string;
  helpful: number;
  createdAt: string;
  updatedAt: string;
}

// Transaction types
export interface Transaction {
  _id?: string;
  id?: string;
  type: 'purchase' | 'sale' | 'refund';
  amount: number;
  status: 'pending' | 'completed' | 'refunded';
  ruleId: string;
  ruleName: string;
  buyer?: User;
  seller?: User;
  createdAt: string;
}

// Notification types
export interface Notification {
  _id?: string;
  id?: string;
  type: 'rule_approved' | 'rule_rejected' | 'new_review' | 'purchase' | 'sale' | 'mention' | 'system' | 'RULE_APPROVED' | 'RULE_REJECTED' | 'RULE_PURCHASED' | 'NEW_REVIEW' | 'COMMENT_REPLY' | 'ACHIEVEMENT' | 'SYSTEM';
  title: string;
  message: string;
  read?: boolean;
  isRead?: boolean;
  data?: Record<string, unknown>;
  actionUrl?: string;
  createdAt: string;
  readAt?: string;
}

// Dashboard types
export interface DashboardStats {
  totalRules: number;
  rulesChange: number;
  draftRules: number;
  reviewRules: number;
  publishedRules: number;
  deprecatedRules: number;
  totalDownloads: number;
  downloadsChange: number;
  totalContributors: number;
  contributorsChange: number;
  totalRevenue: number;
  revenueChange: number;
}

export interface ChartData {
  name: string;
  value: number;
  [key: string]: string | number;
}

// API Response types
export interface PaginatedResponse<T> {
  success: boolean;
  data: {
    [key: string]: T[] | any; // rules, users, transactions, etc
    pagination?: {
      currentPage: number;
      totalPages: number;
      totalItems: number;
      itemsPerPage: number;
    };
  };
}

export interface ApiError {
  message: string;
  code: string;
  details?: Record<string, string[]>;
}

// Filter types
export interface RuleFilters {
  search?: string;
  status?: RuleStatus | 'all';
  visibility?: 'PUBLIC' | 'PRIVATE' | 'PAID' | 'all';
  queryLanguage?: string | 'all';
  vendor?: string | 'all';
  category?: string | 'all';
  tactic?: MitreTactic | 'all';
  severity?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' | 'all';
  author?: string;
  platform?: string;
  forkType?: 'all' | 'original' | 'forked' | 'hasForked';
  sortBy?: 'newest' | 'popular' | 'rating' | 'downloads';
}
