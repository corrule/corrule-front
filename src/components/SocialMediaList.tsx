import { SocialMediaAccount, SOCIAL_MEDIA_PLATFORMS, getColorForPlatform } from '@/constants/socialMedia';
import { Button } from '@/components/ui/button';
import { Trash2, ExternalLink, Edit2 } from 'lucide-react';
import {
  Linkedin,
  Github,
  Instagram,
  Facebook,
  GitBranch,
  Link as LinkIcon,
} from 'lucide-react';
import { Loader2 } from 'lucide-react';

interface SocialMediaListProps {
  accounts: SocialMediaAccount[];
  onEdit: (account: SocialMediaAccount) => void;
  onDelete: (id: string) => Promise<void>;
  isLoading?: boolean;
}

// Icon mapping for displaying
const ICON_MAP: Record<string, React.ReactNode> = {
  linkedin: <Linkedin className="w-5 h-5" />,
  github: <Github className="w-5 h-5" />,
  instagram: <Instagram className="w-5 h-5" />,
  gitlab: <GitBranch className="w-5 h-5" />,
  facebook: <Facebook className="w-5 h-5" />,
  custom: <LinkIcon className="w-5 h-5" />,
};

export function SocialMediaList({
  accounts,
  onEdit,
  onDelete,
  isLoading = false,
}: SocialMediaListProps) {
  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to remove this social media account?')) {
      try {
        await onDelete(id);
      } catch (error) {
        console.error('Failed to delete account:', error);
      }
    }
  };

  if (accounts.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>No social media accounts added yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {accounts.map((account) => {
        const platformData = SOCIAL_MEDIA_PLATFORMS[account.platform];
        const icon = ICON_MAP[account.platform] || ICON_MAP['custom'];
        const color = getColorForPlatform(account.platform);

        return (
          <div
            key={account._id}
            className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent transition-colors"
          >
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className={`${color}`}>{icon}</div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm">{platformData?.name || 'Account'}</p>
                <a
                  href={account.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-muted-foreground hover:text-primary truncate flex items-center gap-1"
                >
                  {account.url}
                  <ExternalLink className="w-3 h-3 flex-shrink-0" />
                </a>
              </div>
            </div>

            <div className="flex items-center gap-2 ml-4 flex-shrink-0">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onEdit(account)}
                disabled={isLoading}
                className="h-8 w-8 p-0"
              >
                <Edit2 className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDelete(account._id!)}
                disabled={isLoading}
                className="h-8 w-8 p-0 text-destructive hover:text-destructive"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
