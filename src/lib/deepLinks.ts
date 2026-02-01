/**
 * Deep Linking Utilities (GIG-008)
 * Handles deep linking to source apps and fallback to browser
 */

import { Linking } from 'react-native';
import type { GigOrigin } from '../types';

// ============================================================================
// DEEP LINK GENERATORS
// ============================================================================

/**
 * Extract Indeed job ID from URL
 * Example: https://www.indeed.com/viewjob?jk=abc123 -> abc123
 */
function extractIndeedJobId(url: string): string | null {
  try {
    const urlObj = new URL(url);
    return urlObj.searchParams.get('jk') || null;
  } catch {
    return null;
  }
}

/**
 * Extract Instagram username from URL
 * Example: https://www.instagram.com/username -> username
 */
function extractInstagramUsername(url: string): string | null {
  try {
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split('/').filter(Boolean);
    return pathParts[0] || null;
  } catch {
    return null;
  }
}

/**
 * Generate deep link URL for a given source
 */
function generateDeepLink(source: GigOrigin, url: string): string | null {
  switch (source) {
    case 'indeed': {
      const jobId = extractIndeedJobId(url);
      if (jobId) {
        return `indeed://job/${jobId}`;
      }
      return null;
    }

    case 'facebook': {
      return `fb://facewebmodal/f?href=${encodeURIComponent(url)}`;
    }

    case 'instagram': {
      const username = extractInstagramUsername(url);
      if (username) {
        return `instagram://user?username=${username}`;
      }
      return null;
    }

    default:
      return null;
  }
}

// ============================================================================
// PUBLIC API
// ============================================================================

/**
 * Attempt to open URL via deep link, fall back to browser if unavailable
 * Returns true if deep link was used, false if browser was used
 */
export async function tryDeepLink(
  source: GigOrigin,
  url: string
): Promise<boolean> {
  const deepLink = generateDeepLink(source, url);

  if (!deepLink) {
    return false;
  }

  try {
    const canOpen = await Linking.canOpenURL(deepLink);

    if (canOpen) {
      await Linking.openURL(deepLink);
      return true;
    }
  } catch (error) {
    console.log('Deep link failed, falling back to browser:', error);
  }

  return false;
}

/**
 * Open URL in browser
 */
export async function openInBrowser(url: string): Promise<void> {
  try {
    const canOpen = await Linking.canOpenURL(url);
    if (canOpen) {
      await Linking.openURL(url);
    } else {
      console.error('Cannot open URL:', url);
    }
  } catch (error) {
    console.error('Failed to open URL:', error);
    throw error;
  }
}

/**
 * Open external URL, trying deep link first then falling back to browser
 */
export async function openExternalUrl(
  source: GigOrigin,
  url: string
): Promise<{ deepLinkUsed: boolean }> {
  const deepLinkUsed = await tryDeepLink(source, url);

  if (!deepLinkUsed) {
    await openInBrowser(url);
  }

  return { deepLinkUsed };
}

/**
 * Get domain from URL for display purposes
 */
export function getDomain(url: string): string {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname.replace('www.', '');
  } catch {
    return url;
  }
}

/**
 * Get display name for a gig source
 */
export function getSourceDisplayName(source: GigOrigin): string {
  const displayNames: Record<GigOrigin, string> = {
    'user-generated': 'Jovi',
    craigslist: 'Craigslist',
    indeed: 'Indeed',
    'school-board': 'School Board',
    facebook: 'Facebook',
    instagram: 'Instagram',
    manual: 'Jovi Curated',
  };

  return displayNames[source] || source;
}

/**
 * Check if a source supports deep linking
 */
export function supportsDeepLink(source: GigOrigin): boolean {
  return ['indeed', 'facebook', 'instagram'].includes(source);
}
