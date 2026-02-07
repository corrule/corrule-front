import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Mail, Shield, Download, TrendingUp, Clock, Eye, EyeOff, Plus, Briefcase, Share2 } from 'lucide-react';
import { api } from '@/services/api';
import WorkExperienceForm from '@/components/WorkExperienceForm';
import WorkExperienceList from '@/components/WorkExperienceList';
import { SocialMediaForm } from '@/components/SocialMediaForm';
import { SocialMediaList } from '@/components/SocialMediaList';
import { TwoFactorAuthSetup } from '@/components/TwoFactorAuth';
import type { User, UserStatistics, LoginRecord, WorkExperienceEntry, SocialMediaAccount } from '@/types';

export default function Profile() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [fullProfile, setFullProfile] = useState<User | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    bio: '',
    location: '',
    website: '',
  });

  // Password change states
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showPasswords, setShowPasswords] = useState({ current: false, new: false, confirm: false });

  // Work Experience states
  const [workExperiences, setWorkExperiences] = useState<WorkExperienceEntry[]>([]);
  const [showWorkExperienceForm, setShowWorkExperienceForm] = useState(false);
  const [editingExperience, setEditingExperience] = useState<WorkExperienceEntry | null>(null);
  const [isSubmittingWorkExperience, setIsSubmittingWorkExperience] = useState(false);

  // Social Media states
  const [socialMediaAccounts, setSocialMediaAccounts] = useState<SocialMediaAccount[]>([]);
  const [showSocialMediaForm, setShowSocialMediaForm] = useState(false);
  const [editingSocialMedia, setEditingSocialMedia] = useState<SocialMediaAccount | null>(null);
  const [isSubmittingSocialMedia, setIsSubmittingSocialMedia] = useState(false);

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.getProfile();
      const profileData = response.data.user;
      setFullProfile(profileData);

      // Initialize form with profile data
      if (profileData.profile) {
        setFormData({
          firstName: profileData.profile.firstName || '',
          lastName: profileData.profile.lastName || '',
          bio: profileData.profile.bio || '',
          location: profileData.profile.location || '',
          website: profileData.profile.website || '',
        });
      }

      // Load work experiences
      if (profileData.workExperience) {
        setWorkExperiences(profileData.workExperience);
      }

      // Load social media accounts
      if (profileData.socialMediaAccounts) {
        setSocialMediaAccounts(profileData.socialMediaAccounts);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load profile';
      setError(message);
      toast({ title: 'Error', description: message, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);
    try {
      const response = await api.updateProfile(formData);
      const updatedUser = response.data.user;
      setFullProfile(updatedUser);
      toast({
        title: 'Success',
        description: 'Profile updated successfully',
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update profile';
      setError(message);
      toast({ title: 'Error', description: message, variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
      toast({ title: 'Logged out', description: 'You have been logged out successfully' });
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to logout',
        variant: 'destructive',
      });
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      toast({ title: 'Error', description: 'Please fill in all password fields', variant: 'destructive' });
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({ title: 'Error', description: 'New passwords do not match', variant: 'destructive' });
      return;
    }

    if (passwordData.newPassword.length < 8) {
      toast({ title: 'Error', description: 'Password must be at least 8 characters', variant: 'destructive' });
      return;
    }

    setIsSaving(true);
    try {
      await api.changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });
      toast({
        title: 'Success',
        description: 'Password changed successfully',
      });
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to change password';
      setError(message);
      toast({ title: 'Error', description: message, variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddWorkExperience = async (experience: WorkExperienceEntry) => {
    setIsSubmittingWorkExperience(true);
    try {
      const response = await api.addWorkExperience(experience);
      setWorkExperiences(response.data.workExperience);
      setShowWorkExperienceForm(false);
      toast({
        title: 'Success',
        description: 'Work experience added successfully',
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to add work experience';
      toast({ title: 'Error', description: message, variant: 'destructive' });
    } finally {
      setIsSubmittingWorkExperience(false);
    }
  };

  const handleUpdateWorkExperience = async (experience: WorkExperienceEntry) => {
    if (!experience._id) {
      toast({ title: 'Error', description: 'Work experience ID is missing', variant: 'destructive' });
      return;
    }

    setIsSubmittingWorkExperience(true);
    try {
      const response = await api.updateWorkExperience(experience._id, experience);
      setWorkExperiences(response.data.workExperience);
      setEditingExperience(null);
      setShowWorkExperienceForm(false);
      toast({
        title: 'Success',
        description: 'Work experience updated successfully',
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update work experience';
      toast({ title: 'Error', description: message, variant: 'destructive' });
    } finally {
      setIsSubmittingWorkExperience(false);
    }
  };

  const handleDeleteWorkExperience = async (id: string) => {
    try {
      const response = await api.deleteWorkExperience(id);
      setWorkExperiences(response.data.workExperience);
      toast({
        title: 'Success',
        description: 'Work experience deleted successfully',
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete work experience';
      toast({ title: 'Error', description: message, variant: 'destructive' });
    }
  };

  const handleEditWorkExperience = (experience: WorkExperienceEntry) => {
    setEditingExperience(experience);
    setShowWorkExperienceForm(true);
  };

  const handleCancelWorkExperienceForm = () => {
    setShowWorkExperienceForm(false);
    setEditingExperience(null);
  };

  // Social Media handlers
  const handleAddSocialMedia = async (account: SocialMediaAccount) => {
    setIsSubmittingSocialMedia(true);
    try {
      const response = await api.addSocialMedia(account);
      setSocialMediaAccounts(response.data.socialMediaAccounts);
      setShowSocialMediaForm(false);
      toast({
        title: 'Success',
        description: 'Social media account added successfully',
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to add social media account';
      toast({ title: 'Error', description: message, variant: 'destructive' });
    } finally {
      setIsSubmittingSocialMedia(false);
    }
  };

  const handleUpdateSocialMedia = async (id: string, account: SocialMediaAccount) => {
    setIsSubmittingSocialMedia(true);
    try {
      const response = await api.updateSocialMedia(id, account);
      setSocialMediaAccounts(response.data.socialMediaAccounts);
      setEditingSocialMedia(null);
      setShowSocialMediaForm(false);
      toast({
        title: 'Success',
        description: 'Social media account updated successfully',
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update social media account';
      toast({ title: 'Error', description: message, variant: 'destructive' });
    } finally {
      setIsSubmittingSocialMedia(false);
    }
  };

  const handleDeleteSocialMedia = async (id: string) => {
    try {
      const response = await api.deleteSocialMedia(id);
      setSocialMediaAccounts(response.data.socialMediaAccounts);
      toast({
        title: 'Success',
        description: 'Social media account removed successfully',
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to remove social media account';
      toast({ title: 'Error', description: message, variant: 'destructive' });
    }
  };

  const handleEditSocialMedia = (account: SocialMediaAccount) => {
    setEditingSocialMedia(account);
    setShowSocialMediaForm(true);
  };

  const handleCancelSocialMediaForm = () => {
    setShowSocialMediaForm(false);
    setEditingSocialMedia(null);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="mt-4 text-muted-foreground">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">Please log in to view your profile</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container max-w-4xl py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Profile Settings</h1>
        <p className="text-muted-foreground">Manage your account settings and profile information</p>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="work">Experience</TabsTrigger>
          <TabsTrigger value="social">Social</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="statistics">Statistics</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>Update your profile information</CardDescription>
            </CardHeader>
            <form onSubmit={handleSaveProfile}>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      name="firstName"
                      placeholder="John"
                      value={formData.firstName}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      name="lastName"
                      placeholder="Doe"
                      value={formData.lastName}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input id="email" type="email" value={user.email} disabled />
                  <p className="text-sm text-muted-foreground">
                    {fullProfile?.emailVerified && '✓ Email verified'}
                    {!fullProfile?.emailVerified && 'Email not verified'}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea
                    id="bio"
                    name="bio"
                    placeholder="Tell us about yourself..."
                    value={formData.bio}
                    onChange={handleInputChange}
                    rows={4}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    name="location"
                    placeholder="City, Country"
                    value={formData.location}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="website">Website</Label>
                  <Input
                    id="website"
                    name="website"
                    type="url"
                    placeholder="https://example.com"
                    value={formData.website}
                    onChange={handleInputChange}
                  />
                </div>
              </CardContent>
              <CardFooter>
                <Button type="submit" disabled={isSaving}>
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </TabsContent>

        {/* Work Experience Tab */}
        <TabsContent value="work" className="space-y-6">
          {showWorkExperienceForm ? (
            <WorkExperienceForm
              onSubmit={editingExperience ? handleUpdateWorkExperience : handleAddWorkExperience}
              onCancel={handleCancelWorkExperienceForm}
              isLoading={isSubmittingWorkExperience}
              initialData={editingExperience}
            />
          ) : (
            <>
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold">Work Experience</h2>
                  <p className="text-muted-foreground">Manage your professional background</p>
                </div>
                <Button onClick={() => setShowWorkExperienceForm(true)} className="gap-2">
                  <Plus className="w-4 h-4" />
                  Add Experience
                </Button>
              </div>
              <WorkExperienceList
                experiences={workExperiences}
                onEdit={handleEditWorkExperience}
                onDelete={handleDeleteWorkExperience}
                isLoading={isSubmittingWorkExperience}
              />
            </>
          )}
        </TabsContent>

        {/* Social Media Tab */}
        <TabsContent value="social" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Share2 className="w-5 h-5" />
                Social Media Accounts
              </CardTitle>
              <CardDescription>Link your social media profiles</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {!showSocialMediaForm ? (
                <Button
                  type="button"
                  onClick={() => setShowSocialMediaForm(true)}
                  className="w-full"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Social Media Account
                </Button>
              ) : (
                <>
                  <div className="border rounded-lg p-4 bg-muted/50">
                    <h3 className="font-semibold mb-4">
                      {editingSocialMedia ? 'Edit Account' : 'Add New Account'}
                    </h3>
                    <SocialMediaForm
                      onAdd={handleAddSocialMedia}
                      onUpdate={handleUpdateSocialMedia}
                      initialData={editingSocialMedia || undefined}
                      isLoading={isSubmittingSocialMedia}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleCancelSocialMediaForm}
                      className="w-full mt-4"
                      disabled={isSubmittingSocialMedia}
                    >
                      Cancel
                    </Button>
                  </div>
                </>
              )}

              {socialMediaAccounts.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <h3 className="font-semibold mb-4">Your Accounts</h3>
                    <SocialMediaList
                      accounts={socialMediaAccounts}
                      onEdit={handleEditSocialMedia}
                      onDelete={handleDeleteSocialMedia}
                      isLoading={isSubmittingSocialMedia}
                    />
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security" className="space-y-6">
          {/* Change Password Card */}
          <Card>
            <CardHeader>
              <CardTitle>Change Password</CardTitle>
              <CardDescription>Update your account password</CardDescription>
            </CardHeader>
            <form onSubmit={handleChangePassword}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">Current Password</Label>
                  <div className="relative">
                    <Input
                      id="currentPassword"
                      type={showPasswords.current ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={passwordData.currentPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                      required
                      disabled={isSaving}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })}
                      className="absolute right-3 top-1/2 -translate-y-1/2"
                    >
                      {showPasswords.current ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <div className="relative">
                    <Input
                      id="newPassword"
                      type={showPasswords.new ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={passwordData.newPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                      required
                      disabled={isSaving}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                      className="absolute right-3 top-1/2 -translate-y-1/2"
                    >
                      {showPasswords.new ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showPasswords.confirm ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={passwordData.confirmPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                      required
                      disabled={isSaving}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
                      className="absolute right-3 top-1/2 -translate-y-1/2"
                    >
                      {showPasswords.confirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button type="submit" disabled={isSaving}>
                  {isSaving ? 'Updating...' : 'Update Password'}
                </Button>
              </CardFooter>
            </form>
          </Card>

          {/* Two-Factor Authentication Card */}
          <TwoFactorAuthSetup onSuccess={() => fetchProfile()} />

          {/* Account Security Card */}
          <Card>
            <CardHeader>
              <CardTitle>Account Security</CardTitle>
              <CardDescription>Manage your security settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-medium mb-4">Active Sessions</h3>
                <div className="space-y-2">
                  {fullProfile?.refreshTokens && fullProfile.refreshTokens.length > 0 ? (
                    fullProfile.refreshTokens.map(token => (
                      <div key={token.id} className="p-3 border rounded-lg text-sm">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium">{token.deviceInfo}</p>
                            <p className="text-xs text-muted-foreground">
                              IP: {token.ipAddress}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Created: {new Date(token.createdAt).toLocaleString()}
                            </p>
                          </div>
                          <Button variant="ghost" size="sm" disabled>
                            Revoke
                          </Button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">No active sessions</p>
                  )}
                </div>
              </div>

              <Separator />

              <div>
                <Button variant="destructive" onClick={handleLogout}>
                  Logout
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Statistics Tab */}
        <TabsContent value="statistics" className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <StatCard
              icon={<Shield className="w-5 h-5" />}
              title="Total Rules"
              value={fullProfile?.statistics?.totalRules || 0}
            />
            <StatCard
              icon={<Download className="w-5 h-5" />}
              title="Total Downloads"
              value={fullProfile?.statistics?.totalDownloads || 0}
            />
            <StatCard
              icon={<TrendingUp className="w-5 h-5" />}
              title="Rating"
              value={(fullProfile?.statistics?.rating || 0).toFixed(1)}
            />
            <StatCard
              icon={<Mail className="w-5 h-5" />}
              title="Total Earnings"
              value={`$${fullProfile?.billing?.balance || 0}`}
            />
          </div>
        </TabsContent>

        {/* Activity Tab */}
        <TabsContent value="activity" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Login History</CardTitle>
              <CardDescription>Recent login activity on your account</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {fullProfile?.loginHistory && fullProfile.loginHistory.length > 0 ? (
                  fullProfile.loginHistory.map((record: LoginRecord) => (
                    <div key={record.id} className="flex items-start justify-between p-3 border rounded-lg">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-muted-foreground" />
                          <p className="text-sm font-medium">
                            {new Date(record.timestamp).toLocaleString()}
                          </p>
                          {record.success && (
                            <span className="inline-block w-2 h-2 bg-green-500 rounded-full"></span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          IP: {record.ipAddress} • {record.userAgent}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">No login history available</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

interface StatCardProps {
  icon: React.ReactNode;
  title: string;
  value: string | number;
}

function StatCard({ icon, title, value }: StatCardProps) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
          </div>
          <div className="text-primary">{icon}</div>
        </div>
      </CardContent>
    </Card>
  );
}
