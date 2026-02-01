import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  SocialMediaAccount,
  SOCIAL_MEDIA_PLATFORMS,
  PLATFORM_ORDER,
  validateSocialMediaUrl,
  normalizeSocialMediaUrl,
  getColorForPlatform,
} from '@/constants/socialMedia';
import { Loader2 } from 'lucide-react';

interface SocialMediaFormProps {
  onAdd: (account: SocialMediaAccount) => Promise<void>;
  onUpdate?: (id: string, account: SocialMediaAccount) => Promise<void>;
  initialData?: SocialMediaAccount;
  isLoading?: boolean;
}

export function SocialMediaForm({
  onAdd,
  onUpdate,
  initialData,
  isLoading = false,
}: SocialMediaFormProps) {
  const [platform, setPlatform] = useState<string>(initialData?.platform || '');
  const [url, setUrl] = useState<string>(initialData?.url || '');
  const [error, setError] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (initialData) {
      setPlatform(initialData.platform);
      setUrl(initialData.url);
    }
  }, [initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!platform) {
      setError('Please select a platform');
      return;
    }

    if (!url.trim()) {
      setError('Please enter a URL');
      return;
    }

    if (!validateSocialMediaUrl(platform, url)) {
      const platformName = SOCIAL_MEDIA_PLATFORMS[platform]?.name || platform;
      setError(`Invalid ${platformName} URL format`);
      return;
    }

    try {
      setIsSubmitting(true);
      const normalizedUrl = normalizeSocialMediaUrl(url);
      const account: SocialMediaAccount = {
        platform,
        url: normalizedUrl,
      };

      if (initialData?._id && onUpdate) {
        await onUpdate(initialData._id, account);
      } else {
        await onAdd(account);
      }

      // Reset form if adding new account
      if (!initialData?._id) {
        setPlatform('');
        setUrl('');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save account');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        <Label htmlFor="platform">Platform</Label>
        <Select value={platform} onValueChange={setPlatform}>
          <SelectTrigger id="platform">
            <SelectValue placeholder="Select a platform" />
          </SelectTrigger>
          <SelectContent>
            {PLATFORM_ORDER.map((key) => {
              const platformData = SOCIAL_MEDIA_PLATFORMS[key];
              return (
                <SelectItem key={key} value={key}>
                  {platformData.name}
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="url">URL</Label>
        <Input
          id="url"
          type="url"
          placeholder={
            platform && SOCIAL_MEDIA_PLATFORMS[platform]
              ? SOCIAL_MEDIA_PLATFORMS[platform].placeholder
              : 'https://example.com/yourprofile'
          }
          value={url}
          onChange={(e) => {
            setUrl(e.target.value);
            setError(''); // Clear error when user starts typing
          }}
          disabled={!platform || isLoading || isSubmitting}
        />
      </div>

      <Button
        type="submit"
        disabled={!platform || !url.trim() || isLoading || isSubmitting}
        className="w-full"
      >
        {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
        {initialData?._id ? 'Update Account' : 'Add Account'}
      </Button>
    </form>
  );
}
