/**
 * Social Media Platforms and Constants
 */

import { LucideIcon } from 'lucide-react';
import type { SocialMediaAccount } from '@/types';

export interface SocialMediaPlatform {
  id: string;
  name: string;
  placeholder: string;
  urlPattern: RegExp;
  baseUrl: string;
  icon: LucideIcon;
  color: string;
}

export const SOCIAL_MEDIA_PLATFORMS: Record<string, SocialMediaPlatform> = {
  linkedin: {
    id: 'linkedin',
    name: 'LinkedIn',
    placeholder: 'linkedin.com/in/yourprofile',
    urlPattern: /^(https?:\/\/)?(www\.)?linkedin\.com\/(in|company)\/[\w-]+\/?$/i,
    baseUrl: 'https://linkedin.com/in/',
    icon: null as any, // Will be set dynamically
    color: 'text-[#0A66C2]',
  },
  github: {
    id: 'github',
    name: 'GitHub',
    placeholder: 'github.com/yourprofile',
    urlPattern: /^(https?:\/\/)?(www\.)?github\.com\/[\w-]+\/?$/i,
    baseUrl: 'https://github.com/',
    icon: null as any,
    color: 'text-[#333333]',
  },
  instagram: {
    id: 'instagram',
    name: 'Instagram',
    placeholder: 'instagram.com/yourprofile',
    urlPattern: /^(https?:\/\/)?(www\.)?instagram\.com\/[\w.]+\/?$/i,
    baseUrl: 'https://instagram.com/',
    icon: null as any,
    color: 'text-[#E4405F]',
  },
  gitlab: {
    id: 'gitlab',
    name: 'GitLab',
    placeholder: 'gitlab.com/yourprofile',
    urlPattern: /^(https?:\/\/)?(www\.)?gitlab\.com\/[\w-]+\/?$/i,
    baseUrl: 'https://gitlab.com/',
    icon: null as any,
    color: 'text-[#FC6D26]',
  },
  facebook: {
    id: 'facebook',
    name: 'Facebook',
    placeholder: 'facebook.com/yourprofile',
    urlPattern: /^(https?:\/\/)?(www\.)?facebook\.com\/[\w.]+\/?$/i,
    baseUrl: 'https://facebook.com/',
    icon: null as any,
    color: 'text-[#1877F2]',
  },
};

// Default platform order
export const PLATFORM_ORDER = ['linkedin', 'github', 'instagram', 'gitlab', 'facebook'];

// Platform icon map (imported dynamically to avoid JSX issues)
export const PLATFORM_ICONS: Record<string, LucideIcon> = {};

// Get color class for a platform
export const getColorForPlatform = (platform: string): string => {
  const key = platform.toLowerCase();
  return SOCIAL_MEDIA_PLATFORMS[key]?.color || 'text-muted-foreground';
};

// Validate social media URL
export const validateSocialMediaUrl = (platform: string, url: string): boolean => {
  if (!url.trim()) return true; // Empty is valid (optional field)
  
  const platformData = SOCIAL_MEDIA_PLATFORMS[platform.toLowerCase()];
  if (!platformData) return true; // Custom platform, accept any URL format
  
  return platformData.urlPattern.test(url);
};

// Normalize URL (add https:// if missing)
export const normalizeSocialMediaUrl = (url: string): string => {
  const trimmed = url.trim();
  if (!trimmed) return '';
  
  if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
    return `https://${trimmed}`;
  }
  
  return trimmed;
};

// Extract username from URL
export const extractUsernameFromUrl = (platform: string, url: string): string => {
  try {
    const normalized = normalizeSocialMediaUrl(url);
    const urlObj = new URL(normalized);
    const pathname = urlObj.pathname.split('/').filter(Boolean);
    return pathname[0] || url;
  } catch {
    return url;
  }
};

// Extract platform from custom URL
export const extractPlatformFromUrl = (url: string): string => {
  try {
    const urlObj = new URL(normalizeSocialMediaUrl(url));
    const hostname = urlObj.hostname.replace('www.', '');
    
    // Match against known platforms
    for (const key of Object.keys(SOCIAL_MEDIA_PLATFORMS)) {
      if (hostname.includes(key.toLowerCase())) {
        return key;
      }
    }
    
    return 'custom';
  } catch {
    return 'custom';
  }
};

// Re-export SocialMediaAccount from types for convenience
export type { SocialMediaAccount };
