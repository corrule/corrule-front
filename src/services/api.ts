// API Configuration
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

// Token management
let accessToken: string | null = localStorage.getItem('access_token');
let refreshToken: string | null = localStorage.getItem('refresh_token');

export const setAccessToken = (token: string | null) => {
  accessToken = token;
  if (token) {
    localStorage.setItem('access_token', token);
  } else {
    localStorage.removeItem('access_token');
  }
};

export const setRefreshToken = (token: string | null) => {
  refreshToken = token;
  if (token) {
    localStorage.setItem('refresh_token', token);
  } else {
    localStorage.removeItem('refresh_token');
  }
};

export const getAccessToken = () => accessToken;
export const getRefreshToken = () => refreshToken;

export const clearTokens = () => {
  setAccessToken(null);
  setRefreshToken(null);
};

// API client
class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (accessToken) {
      (headers as Record<string, string>)['Authorization'] = `Bearer ${accessToken}`;
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'An error occurred' }));
      const err = new Error(error.message || `HTTP ${response.status}`);
      (err as any).response = { data: error, status: response.status };
      throw err;
    }

    return response.json();
  }

  // Auth endpoints
  async register(data: { username: string; email: string; password: string }) {
    return this.request<{ success: boolean; message: string; data: { userId: string; email: string; username: string } }>('/auth/register', { method: 'POST', body: JSON.stringify(data) });
  }

  async login(data: { email: string; password: string }) {
    return this.request<{ success: boolean; data: { user: import('../types').User; tokens: { accessToken: string; refreshToken: string; expiresIn: number } } }>(
      '/auth/login',
      { method: 'POST', body: JSON.stringify(data) }
    );
  }

  async logout() {
    return this.request('/auth/logout', { method: 'POST' });
  }

  async refreshTokenRequest() {
    const currentRefreshToken = refreshToken;
    if (!currentRefreshToken) {
      throw new Error('No refresh token available');
    }
    return this.request<{ success: boolean; data: { tokens: { accessToken: string; refreshToken: string; expiresIn: number } } }>(
      '/auth/refresh',
      {
        method: 'POST',
        body: JSON.stringify({ refreshToken: currentRefreshToken }),
      }
    );
  }

  async googleLogin(token: string) {
    return this.request<{ success: boolean; data: { user: import('../types').User; token: string; refreshToken: string } }>('/auth/google', {
      method: 'POST',
      body: JSON.stringify({ token }),
    });
  }

  async googleRegister(token: string) {
    return this.request<{ success: boolean; data: { user: import('../types').User; token: string; refreshToken: string } }>('/auth/google/register', {
      method: 'POST',
      body: JSON.stringify({ token }),
    });
  }

  // User endpoints
  async getProfile() {
    return this.request<{ success: boolean; message: string; data: { user: import('../types').User } }>('/users/profile');
  }

  async updateProfile(data: Partial<import('../types').UserProfile>) {
    return this.request<{ success: boolean; message: string; data: { user: import('../types').User } }>('/users/profile', {
      method: 'PUT',
      body: JSON.stringify({ profile: data }),
    });
  }

  async getPublicProfile(username: string) {
    return this.request<import('../types').User>(`/users/${username}`);
  }

  async getUserRules(username: string, page = 1, limit = 10) {
    return this.request<import('../types').PaginatedResponse<import('../types').Rule>>(
      `/users/${username}/rules?page=${page}&limit=${limit}`
    );
  }

  async getNotifications(page = 1, limit = 20, filter = 'all') {
    return this.request<{ success: boolean; data: { notifications: import('../types').Notification[]; pagination: any } }>(
      `/notifications?page=${page}&limit=${limit}&filter=${filter}`
    );
  }

  async getUnreadNotificationCount() {
    return this.request<{ success: boolean; data: { unreadCount: number } }>('/notifications/unread/count');
  }

  async getNotification(id: string) {
    return this.request<{ success: boolean; data: { notification: import('../types').Notification } }>(`/notifications/${id}`);
  }

  async markNotificationAsRead(id: string) {
    return this.request<{ success: boolean; data: { notification: import('../types').Notification } }>(`/notifications/${id}/read`, {
      method: 'PUT',
    });
  }

  async markMultipleNotificationsAsRead(notificationIds: string[]) {
    return this.request<{ success: boolean; data: { modifiedCount: number }; message: string }>(
      '/notifications/read/batch',
      {
        method: 'PUT',
        body: JSON.stringify({ notificationIds }),
      }
    );
  }

  async deleteNotification(id: string) {
    return this.request<{ success: boolean; data: { notification: import('../types').Notification } }>(`/notifications/${id}`, {
      method: 'DELETE',
    });
  }

  async deleteMultipleNotifications(notificationIds: string[]) {
    return this.request<{ success: boolean; data: { deletedCount: number }; message: string }>(
      '/notifications/delete/batch',
      {
        method: 'DELETE',
        body: JSON.stringify({ notificationIds }),
      }
    );
  }

  async clearAllNotifications() {
    return this.request<{ success: boolean; data: { deletedCount: number }; message: string }>('/notifications/clear/all', {
      method: 'DELETE',
    });
  }

  async markNotificationRead(notificationId: string) {
    return this.request(`/notifications/${notificationId}/read`, { method: 'PUT' });
  }

  async getMyPurchases() {
    return this.request<import('../types').Rule[]>('/users/me/purchases');
  }

  async getMyEarnings(period = 'month') {
    return this.request<{ success: boolean; data: { total: number; breakdown: { date: string; amount: number }[] } }>(
      `/users/earnings?period=${period}`
    );
  }

  async changePassword(data: { currentPassword: string; newPassword: string }) {
    return this.request<{ success: boolean; message: string }>('/users/password', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Work Experience endpoints
  async addWorkExperience(data: import('../types').WorkExperienceEntry) {
    return this.request<{ success: boolean; data: { workExperience: import('../types').WorkExperienceEntry[] } }>(
      '/users/work-experience',
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    );
  }

  async updateWorkExperience(id: string, data: Partial<import('../types').WorkExperienceEntry>) {
    return this.request<{ success: boolean; data: { workExperience: import('../types').WorkExperienceEntry[] } }>(
      `/users/work-experience/${id}`,
      {
        method: 'PUT',
        body: JSON.stringify(data),
      }
    );
  }

  async deleteWorkExperience(id: string) {
    return this.request<{ success: boolean; data: { workExperience: import('../types').WorkExperienceEntry[] } }>(
      `/users/work-experience/${id}`,
      {
        method: 'DELETE',
      }
    );
  }

  // Social Media endpoints
  async addSocialMedia(data: import('../types').SocialMediaAccount) {
    return this.request<{ success: boolean; data: { socialMediaAccounts: import('../types').SocialMediaAccount[] } }>(
      '/users/social-media',
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    );
  }

  async updateSocialMedia(id: string, data: Partial<import('../types').SocialMediaAccount>) {
    return this.request<{ success: boolean; data: { socialMediaAccounts: import('../types').SocialMediaAccount[] } }>(
      `/users/social-media/${id}`,
      {
        method: 'PUT',
        body: JSON.stringify(data),
      }
    );
  }

  async deleteSocialMedia(id: string) {
    return this.request<{ success: boolean; data: { socialMediaAccounts: import('../types').SocialMediaAccount[] } }>(
      `/users/social-media/${id}`,
      {
        method: 'DELETE',
      }
    );
  }

  async getUserStats() {
    return this.request<{ success: boolean; data: import('../types').UserStatistics }>('/users/stats');
  }

  async getActivity(page = 1, limit = 20) {
    return this.request<{ success: boolean; data: { activities: any[]; pagination: any } }>(
      `/users/activity?page=${page}&limit=${limit}`
    );
  }

  async requestPasswordReset(email: string) {
    return this.request<{ success: boolean; message: string }>('/users/password/reset-request', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  async resetPassword(token: string, newPassword: string) {
    return this.request<{ success: boolean; message: string }>('/users/password/reset', {
      method: 'POST',
      body: JSON.stringify({ token, newPassword }),
    });
  }

  async setup2FA() {
    return this.request<{ success: boolean; data: { secret: string; qrCode: string; message: string } }>(
      '/users/2fa/setup',
      { method: 'POST' }
    );
  }

  async verify2FA(token: string, secret: string) {
    return this.request<{ success: boolean; message: string; data: import('../types').User }>(
      '/users/2fa/verify',
      {
        method: 'POST',
        body: JSON.stringify({ token, secret }),
      }
    );
  }

  async disable2FA(token: string) {
    return this.request<{ success: boolean; message: string; data: import('../types').User }>(
      '/users/2fa/disable',
      {
        method: 'POST',
        body: JSON.stringify({ token }),
      }
    );
  }

  // Email-based 2FA methods
  async enable2FAEmail() {
    return this.request<{ success: boolean; message: string; data: { email: string; expiresIn: number } }>(
      '/users/2fa/enable',
      { method: 'POST' }
    );
  }

  async verify2FASetup(code: string) {
    return this.request<{ success: boolean; message: string; data: { twoFactorEnabled: boolean } }>(
      '/users/2fa/verify-setup',
      {
        method: 'POST',
        body: JSON.stringify({ code }),
      }
    );
  }

  async disable2FAEmail(password: string) {
    return this.request<{ success: boolean; message: string; data: { twoFactorEnabled: boolean } }>(
      '/users/2fa/disable',
      {
        method: 'POST',
        body: JSON.stringify({ password }),
      }
    );
  }

  async verify2FACode(code: string, userId?: string) {
    return this.request<{ success: boolean; message: string; data: { user: import('../types').User; tokens: { accessToken: string; refreshToken: string; expiresIn: number } } }>(
      '/auth/verify-2fa',
      {
        method: 'POST',
        body: JSON.stringify({ userId, code, type: 'email' }),
      }
    );
  }

  async resend2FACode() {
    return this.request<{ success: boolean; message: string; data: { email: string; expiresIn: number } }>(
      '/users/2fa/resend-code',
      { method: 'POST' }
    );
  }

  async get2FAStatus() {
    return this.request<{ success: boolean; data: { emailBased2FA: { enabled: boolean }; totpBased2FA: { enabled: boolean } } }>(
      '/users/2fa/status'
    );
  }

  // Rules endpoints
  async getRules(filters: import('../types').RuleFilters = {}, page = 1, limit = 20) {
    const params = new URLSearchParams({
      page: String(page),
      limit: String(limit),
    });
    
    if (filters.search) params.append('search', filters.search);
    if (filters.status && filters.status !== 'all') params.append('status', String(filters.status).toUpperCase());
    if (filters.visibility && filters.visibility !== 'all') params.append('visibility', String(filters.visibility).toUpperCase());
    if (filters.queryLanguage && filters.queryLanguage !== 'all') params.append('queryLanguage', String(filters.queryLanguage).toUpperCase());
    if (filters.vendor && filters.vendor !== 'all') params.append('vendor', String(filters.vendor).toUpperCase());
    if (filters.category && filters.category !== 'all') params.append('category', String(filters.category).toUpperCase());
    if (filters.tactic && filters.tactic !== 'all') params.append('mitreTactics', filters.tactic);
    if (filters.severity && filters.severity !== 'all') params.append('severity', String(filters.severity).toUpperCase());
    if (filters.author) params.append('author', filters.author);
    if (filters.sortBy) params.append('sort', filters.sortBy);

    return this.request<import('../types').PaginatedResponse<import('../types').Rule>>(
      `/rules?${params.toString()}`
    );
  }

  async getRule(idOrSlug: string) {
    const response = await this.request<{ success: boolean; data: { rule: import('../types').Rule; hasPurchased: boolean } }>(`/rules/${idOrSlug}`);
    return { rule: response.data.rule, hasPurchased: response.data.hasPurchased };
  }

  async getMyRules(filters: import('../types').RuleFilters = {}, page = 1, limit = 20) {
    const params = new URLSearchParams({
      page: String(page),
      limit: String(limit),
    });
    
    if (filters.search) params.append('search', filters.search);
    if (filters.status && filters.status !== 'all') params.append('status', String(filters.status).toUpperCase());
    if (filters.visibility && filters.visibility !== 'all') params.append('visibility', String(filters.visibility).toUpperCase());

    return this.request<import('../types').PaginatedResponse<import('../types').Rule>>(
      `/rules/my/rules?${params.toString()}`
    );
  }

  async createRule(data: Partial<import('../types').Rule>) {
    return this.request<import('../types').Rule>('/rules', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async publishRule(ruleId: string, visibility: string, pricing?: any) {
    return this.request(`/rules/${ruleId}/publish`, {
      method: 'POST',
      body: JSON.stringify({ visibility, pricing }),
    });
  }

  async updateRule(id: string, data: Partial<import('../types').Rule>) {
    return this.request<import('../types').Rule>(`/rules/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteRule(id: string) {
    return this.request(`/rules/${id}`, { method: 'DELETE' });
  }

  async forkRule(id: string) {
    const response = await this.request<{ success: boolean; message: string; data: { rule: import('../types').Rule } }>(`/rules/${id}/fork`, { method: 'POST' });
    return response.data.rule;
  }

  async mergeRule(originalRuleId: string, forkedRuleId: string) {
    return this.request<import('../types').Rule>(`/rules/${originalRuleId}/merge`, {
      method: 'POST',
      body: JSON.stringify({ forkedRuleId }),
    });
  }

  async getRuleVersions(id: string) {
    const response = await this.request<{ success: boolean; data: { versions: import('../types').RuleVersion[] } }>(`/rules/${id}/versions`);
    return response.data.versions;
  }

  async rollbackRule(id: string, version: string) {
    return this.request<import('../types').Rule>(`/rules/${id}/rollback`, {
      method: 'POST',
      body: JSON.stringify({ version }),
    });
  }

  async submitRuleForReview(id: string) {
    return this.request<import('../types').Rule>(`/rules/${id}/submit`, { method: 'POST' });
  }

  async likeRule(id: string) {
    return this.request(`/rules/${id}/like`, { method: 'POST' });
  }

  // Reviews endpoints
  async getRuleReviews(ruleId: string, page = 1, limit = 10) {
    return this.request<import('../types').PaginatedResponse<import('../types').Review>>(
      `/reviews/rule/${ruleId}?page=${page}&limit=${limit}`
    );
  }

  async createReview(data: { ruleId: string; rating: number; comment: string }) {
    return this.request<import('../types').Review>('/reviews', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateReview(id: string, data: { rating?: number; comment?: string }) {
    return this.request<import('../types').Review>(`/reviews/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteReview(id: string) {
    return this.request(`/reviews/${id}`, { method: 'DELETE' });
  }

  async markReviewHelpful(id: string, helpful: boolean) {
    return this.request(`/reviews/${id}/helpful`, {
      method: 'POST',
      body: JSON.stringify({ helpful }),
    });
  }

  // Transactions endpoints
  async getMyTransactions(page = 1, limit = 20, type = 'all') {
    return this.request<import('../types').PaginatedResponse<import('../types').Transaction>>(
      `/transactions/my?page=${page}&limit=${limit}&type=${type}`
    );
  }

  async purchaseRule(ruleId: string, paymentMethodId?: string) {
    return this.request<import('../types').Transaction>('/transactions/purchase', {
      method: 'POST',
      body: JSON.stringify({ ruleId, paymentMethodId: paymentMethodId || 'mock-payment' }),
    });
  }

  async mockPurchaseRule(ruleId: string) {
    // Mock purchase endpoint - will be replaced with real payment API
    return this.request<{ success: boolean; data: { ruleId: string; purchased: boolean; message: string } }>(
      `/rules/${ruleId}/purchase`,
      { method: 'POST' }
    );
  }

  async requestRefund(transactionId: string, reason: string) {
    return this.request(`/transactions/${transactionId}/refund`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  }

  // Dashboard / Analytics endpoints
  async getDashboard() {
    return this.request<import('../types').DashboardStats>('/admin/dashboard');
  }

  async getPlatformAnalytics(startDate: string, endDate: string) {
    return this.request(`/admin/analytics/platform?startDate=${startDate}&endDate=${endDate}`);
  }

  async getRuleAnalytics(startDate: string, endDate: string) {
    return this.request(`/admin/analytics/rules?startDate=${startDate}&endDate=${endDate}`);
  }

  // Admin endpoints
  async getAdminUsers(page = 1, limit = 20, role?: string, status?: string) {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (role) params.append('role', role);
    if (status) params.append('status', status);
    return this.request<import('../types').PaginatedResponse<import('../types').User>>(
      `/admin/users?${params.toString()}`
    );
  }

  async updateUserRole(userId: string, role: string) {
    return this.request(`/admin/users/${userId}/role`, {
      method: 'PUT',
      body: JSON.stringify({ role }),
    });
  }

  async suspendUser(userId: string, reason: string, duration: number) {
    return this.request(`/admin/users/${userId}/suspend`, {
      method: 'POST',
      body: JSON.stringify({ reason, duration }),
    });
  }

  async getRulesForModeration(page = 1, limit = 20, status = 'UNDER_REVIEW') {
    return this.request<import('../types').PaginatedResponse<import('../types').Rule>>(
      `/admin/rules?page=${page}&limit=${limit}&status=${status}`
    );
  }

  async moderateRule(ruleId: string, approved: boolean, reason: string) {
    return this.request(`/admin/rules/${ruleId}/moderate`, {
      method: 'POST',
      body: JSON.stringify({ approved, reason }),
    });
  }

  // Rule endpoints (new)
  async getMyRuleAnalytics(ruleId: string) {
    return this.request<{ success: boolean; data: { analytics: any } }>(`/rules/${ruleId}/analytics`);
  }

  async requestWithdrawal(amount: number, paymentMethod: string) {
    return this.request(`/transactions/withdraw`, {
      method: 'POST',
      body: JSON.stringify({ amount, paymentMethod }),
    });
  }

  // Moderation endpoints (new)
  async getModerationQueue(page = 1, limit = 20, status = 'UNDER_REVIEW') {
    return this.request<import('../types').PaginatedResponse<import('../types').Rule>>(
      `/moderation/queue?page=${page}&limit=${limit}&status=${status}`
    );
  }

  async getModerationHistory(page = 1, limit = 50) {
    return this.request<import('../types').PaginatedResponse<any>>(`/moderation/history?page=${page}&limit=${limit}`);
  }

  async getModerationStats(period = 'month') {
    return this.request<{ success: boolean; data: any }>(`/moderation/stats?period=${period}`);
  }

  async warnUser(userId: string, reason: string, severity = 'low') {
    return this.request(`/moderation/users/${userId}/warn`, {
      method: 'POST',
      body: JSON.stringify({ reason, severity }),
    });
  }

  async approveRule(ruleId: string, feedback?: string) {
    return this.request(`/moderation/rules/${ruleId}/approve`, {
      method: 'POST',
      body: JSON.stringify({ feedback }),
    });
  }

  async rejectRule(ruleId: string, reason: string) {
    return this.request(`/moderation/rules/${ruleId}/reject`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  }

  // Payment Methods endpoints
  async getPaymentMethods() {
    const response = await this.request<{ success: boolean; data: any[] }>(`/billing/payment-methods`);
    return response.data || [];
  }

  async addPaymentMethod(paymentData: {
    provider: string; // 'stripe', 'paypal', etc.
    paymentMethodId?: string; // Stripe payment method ID (token)
    setupTokenId?: string; // PayPal setup token
  }) {
    const response = await this.request<{ success: boolean; data: any }>(`/billing/payment-methods`, {
      method: 'POST',
      body: JSON.stringify(paymentData),
    });
    return (response as any).data;
  }

  async deletePaymentMethod(paymentMethodId: string) {
    const response = await this.request<{ success: boolean }>(`/billing/payment-methods/${paymentMethodId}`, {
      method: 'DELETE',
    });
    return response;
  }

  async setDefaultPaymentMethod(paymentMethodId: string) {
    const response = await this.request<{ success: boolean; data: any }>(`/billing/payment-methods/${paymentMethodId}/set-default`, {
      method: 'POST',
    });
    return (response as any).data;
  }

  // Payment History endpoints
  async getPaymentHistory(page = 1, limit = 20, type?: string, status?: string) {
    let url = `/billing/payment-history?page=${page}&limit=${limit}`;
    if (type) url += `&type=${type}`;
    if (status) url += `&status=${status}`;
    const response = await this.request<{ success: boolean; data: any[] }>(url);
    return response.data || [];
  }

  // Health check
  async healthCheck() {
    return this.request<{ status: string }>('/health');
  }
}

export const api = new ApiClient(API_BASE_URL);
