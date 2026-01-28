/**
 * Jovi Type Definitions
 * Complete type system for the beauty marketplace
 */

// ============================================================================
// USER TYPES
// ============================================================================

export type UserType = 'FuturePro' | 'LicensedPro' | 'Founder';

export interface BaseUser {
  id: string;
  email: string;
  phoneNumber?: string;
  displayName: string;
  photoURL?: string;
  userType: UserType;
  createdAt: Date;
  updatedAt: Date;
}

// Future Pro - Beauty students
export interface FutureProProfile extends BaseUser {
  userType: 'FuturePro';
  school: string;
  programType: string; // "Cosmetology", "Esthetics", "Nail Tech", etc.
  expectedGraduation: Date;
  interests: string[];
  portfolioImages: string[];
  bio: string;
  location: {
    city: string;
    state: string;
  };
}

// Licensed Pro - Working professionals
export interface LicensedProProfile extends BaseUser {
  userType: 'LicensedPro';
  licenseNumber: string;
  licenseState: string;
  specialties: string[];
  yearsExperience: number;
  portfolioImages: string[];
  bio: string;
  location: {
    city: string;
    state: string;
  };
  availability: 'Full-time' | 'Part-time' | 'Freelance' | 'Contract';
  hourlyRate?: number;
}

// Founder - Salon/Spa owners
export interface FounderProfile extends BaseUser {
  userType: 'Founder';
  businessName: string;
  businessType: 'Salon' | 'Spa' | 'Barbershop' | 'MedSpa' | 'Other';
  businessAddress: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
  };
  licenseNumber?: string;
  bio: string;
  businessImages: string[];
  services: string[];
}

export type UserProfile = FutureProProfile | LicensedProProfile | FounderProfile;

// ============================================================================
// GIG TYPES
// ============================================================================

// Extended gig types to support aggregated gigs from various sources
export type GigType =
  | 'booth-rental'
  | 'freelance'
  | 'full-time'
  | 'part-time'
  | 'internship'
  | 'apprenticeship'
  | 'commission';

// Legacy gig type for backward compatibility
export type LegacyGigType = 'Full-time' | 'Part-time' | 'Freelance' | 'Internship' | 'Apprenticeship';

export type GigStatus = 'Open' | 'Closed' | 'Filled';

// Origin of the gig posting (where the gig came from)
export type GigOrigin =
  | 'user-generated'
  | 'craigslist'
  | 'indeed'
  | 'school-board'
  | 'facebook'
  | 'instagram'
  | 'manual';

// Profession types supported
export type GigProfession =
  | 'hairstylist'
  | 'nail-tech'
  | 'esthetician'
  | 'makeup-artist'
  | 'barber'
  | 'lash-tech';

// Pay rate types
export type PayType =
  | 'hourly'
  | 'per-service'
  | 'salary'
  | 'commission'
  | 'booth-rental';

// Location with geocoding support
export interface GigLocation {
  city: string;
  state: string;
  lat?: number;
  lng?: number;
}

// Pay range structure
export interface PayRange {
  min: number;
  max: number;
  type: PayType;
}

// Main Gig interface - supports both user-generated and aggregated gigs
export interface Gig {
  // Core identifiers
  id: string;
  gigId: string; // Alias for id, used in some contexts

  // Basic gig information
  title: string;
  description: string;
  location: GigLocation;

  // Poster information (null for aggregated gigs)
  postedBy: string | null; // userId - null if aggregated
  founderId?: string | null; // Alias for postedBy (backward compat)
  founderProfile?: FounderProfile | null; // Denormalized founder data

  // Timestamps
  createdAt: Date;
  lastUpdatedAt: Date;
  updatedAt?: Date; // Alias for lastUpdatedAt (backward compat)
  expiresAt: Date; // Auto-expiration date (30 days from creation)

  // Gig classification
  gigType: GigType;
  type?: GigType | LegacyGigType; // Alias for gigType (backward compat)
  profession: GigProfession[];
  specialties?: string[]; // Alias for profession (backward compat)

  // Compensation
  payRange: PayRange;
  compensation?: { // Backward compatibility
    type: 'Hourly' | 'Salary' | 'Commission' | 'Unpaid';
    amount?: number;
    range?: {
      min: number;
      max: number;
    };
  };

  // Requirements
  requirements?: string[];
  benefits?: string[];
  startDate?: Date;

  // Status
  status?: GigStatus;
  isActive: boolean; // Whether gig is visible in feed

  // Aggregation fields
  source: GigOrigin;
  sourceUrl: string | null; // Original posting URL for aggregated gigs
  externalId: string | null; // Unique ID from source platform for de-duplication

  // Metrics
  qualityScore: number; // 1-10, AI-generated rating for ranking
  viewCount: number; // Tracking metric for gig visibility
  applicationCount: number; // Tracking metric for conversion
  applicantCount?: number; // Alias for applicationCount (backward compat)
}

// Type for creating a new user-generated gig
export interface CreateUserGigInput {
  title: string;
  description: string;
  location: GigLocation;
  postedBy: string; // Required for user-generated
  gigType: GigType;
  profession: GigProfession[];
  payRange: PayRange;
  requirements?: string[];
  benefits?: string[];
  startDate?: Date;
}

// Type for creating a new aggregated gig
export interface CreateAggregatedGigInput {
  title: string;
  description: string;
  location: GigLocation;
  gigType: GigType;
  profession: GigProfession[];
  payRange: PayRange;
  source: Exclude<GigOrigin, 'user-generated'>;
  sourceUrl: string; // Required for aggregated
  externalId: string; // Required for aggregated
  qualityScore?: number; // Defaults to 5
  requirements?: string[];
  benefits?: string[];
}

// Default values for new gigs
export const GIG_DEFAULTS = {
  qualityScore: 5,
  isActive: true,
  viewCount: 0,
  applicationCount: 0,
  expirationDays: 30,
} as const;

// Helper to calculate expiration date
export const calculateExpiresAt = (createdAt: Date, days: number = GIG_DEFAULTS.expirationDays): Date => {
  const expiresAt = new Date(createdAt);
  expiresAt.setDate(expiresAt.getDate() + days);
  return expiresAt;
};

// ============================================================================
// GIG SOURCE TYPES (for aggregation tracking)
// ============================================================================

// Type of scraping mechanism
export type GigSourceType = 'rss' | 'scraper' | 'api' | 'manual';

// Platform the source belongs to
export type GigSourcePlatform =
  | 'craigslist'
  | 'indeed'
  | 'school-board'
  | 'facebook'
  | 'instagram';

// Scraping frequency options
export type ScrapingFrequency =
  | 'hourly'
  | 'every-6-hours'
  | 'daily'
  | 'weekly'
  | 'manual';

// Location for gig source
export interface GigSourceLocation {
  city: string;
  state: string;
  region: string; // e.g., "socal", "norcal", "midwest"
}

// Main GigSource interface for tracking external gig sources
export interface GigSource {
  // Identifiers
  sourceId: string; // e.g., "craigslist-la-beauty"
  name: string; // Human-readable name, e.g., "Craigslist LA - Beauty Services"

  // Source configuration
  url: string; // RSS feed or scraping endpoint URL
  type: GigSourceType;
  platform: GigSourcePlatform;
  location: GigSourceLocation;

  // Status
  isActive: boolean; // Whether source is currently being scraped

  // Scraping timestamps
  lastScraped: Date | null; // Last scrape attempt
  lastSuccess: Date | null; // Last successful scrape that found gigs
  scrapingFrequency: ScrapingFrequency;

  // Metrics
  gigCount: number; // Current active gigs from this source
  totalGigsScraped: number; // Lifetime total (includes expired/deleted)

  // Error tracking
  errorCount: number; // Consecutive failures (resets on success)
  lastError: string | null; // Most recent error message

  // Timestamps
  createdAt: Date;
  updatedAt: Date;

  // Advanced metrics (optional)
  averageGigQuality?: number; // Average qualityScore of gigs from this source
  conversionRate?: number; // % of gigs that receive applications
  deduplicationRate?: number; // % of scraped gigs that are duplicates
}

// Input for creating a new gig source
export interface CreateGigSourceInput {
  sourceId: string;
  name: string;
  url: string;
  type: GigSourceType;
  platform: GigSourcePlatform;
  location: GigSourceLocation;
  isActive?: boolean;
  scrapingFrequency: ScrapingFrequency;
}

// Input for updating a gig source
export interface UpdateGigSourceInput {
  name?: string;
  url?: string;
  type?: GigSourceType;
  isActive?: boolean;
  scrapingFrequency?: ScrapingFrequency;
  lastError?: string | null;
}

// Source health status for monitoring
export type SourceHealthStatus = 'healthy' | 'warning' | 'critical' | 'inactive';

// Source health summary
export interface GigSourceHealth {
  sourceId: string;
  status: SourceHealthStatus;
  lastScraped: Date | null;
  errorCount: number;
  gigCount: number;
  isWithinExpectedFrequency: boolean;
}

// Constants for source health monitoring
export const GIG_SOURCE_DEFAULTS = {
  maxConsecutiveErrors: 3, // Auto-disable after this many failures
  healthyErrorThreshold: 0,
  warningErrorThreshold: 2,
  criticalErrorThreshold: 3,
} as const;

// Helper to determine source health status
export const getSourceHealthStatus = (source: GigSource): SourceHealthStatus => {
  if (!source.isActive) return 'inactive';
  if (source.errorCount >= GIG_SOURCE_DEFAULTS.criticalErrorThreshold) return 'critical';
  if (source.errorCount >= GIG_SOURCE_DEFAULTS.warningErrorThreshold) return 'warning';
  return 'healthy';
};

// Helper to check if source is within expected scraping frequency
export const isWithinExpectedFrequency = (source: GigSource): boolean => {
  if (!source.lastScraped) return false;

  const now = new Date();
  const lastScraped = source.lastScraped instanceof Date
    ? source.lastScraped
    : new Date(source.lastScraped);
  const hoursSinceLastScrape = (now.getTime() - lastScraped.getTime()) / (1000 * 60 * 60);

  const expectedHours: Record<ScrapingFrequency, number> = {
    'hourly': 2, // Allow 1 hour buffer
    'every-6-hours': 8,
    'daily': 26, // Allow 2 hour buffer
    'weekly': 170, // Allow 2 hour buffer
    'manual': Infinity,
  };

  return hoursSinceLastScrape <= expectedHours[source.scrapingFrequency];
};

// ============================================================================
// APPLICATION TYPES
// ============================================================================

export type ApplicationStatus = 'Pending' | 'Reviewed' | 'Accepted' | 'Rejected' | 'Withdrawn';

export interface Application {
  id: string;
  gigId: string;
  gig: Gig;
  applicantId: string;
  applicantProfile: FutureProProfile | LicensedProProfile;
  coverLetter: string;
  portfolioLinks: string[];
  status: ApplicationStatus;
  appliedAt: Date;
  updatedAt: Date;
  reviewedAt?: Date;
  reviewNotes?: string;
}

// ============================================================================
// MESSAGING TYPES
// ============================================================================

export interface Conversation {
  id: string;
  participants: string[]; // User IDs
  participantProfiles: UserProfile[];
  lastMessage: Message;
  unreadCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  senderProfile: UserProfile;
  content: string;
  attachments?: string[];
  readBy: string[];
  createdAt: Date;
}

// ============================================================================
// NOTIFICATION TYPES
// ============================================================================

export type NotificationType = 
  | 'NewGig'
  | 'ApplicationReceived'
  | 'ApplicationStatusUpdate'
  | 'NewMessage'
  | 'GigReminder'
  | 'SystemAnnouncement';

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, any>;
  read: boolean;
  createdAt: Date;
}

// ============================================================================
// PORTFOLIO TYPES
// ============================================================================

export interface PortfolioItem {
  id: string;
  userId: string;
  imageUrl: string;
  caption?: string;
  tags: string[];
  likes: number;
  createdAt: Date;
}

// ============================================================================
// SUBSCRIPTION TYPES
// ============================================================================

export type SubscriptionTier = 'Free' | 'Pro' | 'Business';

export interface Subscription {
  userId: string;
  tier: SubscriptionTier;
  startDate: Date;
  endDate?: Date;
  autoRenew: boolean;
  features: {
    gigPosts: number; // -1 for unlimited
    applications: number; // -1 for unlimited
    portfolioImages: number;
    prioritySupport: boolean;
    analytics: boolean;
  };
}

// ============================================================================
// FORM VALIDATION TYPES
// ============================================================================

export interface SignUpFormData {
  email: string;
  password: string;
  confirmPassword: string;
  phoneNumber: string;
  displayName: string;
  userType: UserType;
}

export interface LoginFormData {
  email: string;
  password: string;
}

export interface ProfileFormData {
  displayName: string;
  bio: string;
  location: {
    city: string;
    state: string;
  };
  // Type-specific fields added dynamically
  [key: string]: any;
}

export interface GigFormData {
  title: string;
  description: string;
  gigType: GigType;
  profession: GigProfession[];
  location: GigLocation;
  payRange: PayRange;
  requirements: string[];
  benefits?: string[];
  startDate?: Date;
  // Legacy fields for backward compatibility
  type?: GigType | LegacyGigType;
  specialties?: string[];
  compensation?: {
    type: 'Hourly' | 'Salary' | 'Commission' | 'Unpaid';
    amount?: number;
    range?: {
      min: number;
      max: number;
    };
  };
}

// ============================================================================
// NAVIGATION TYPES
// ============================================================================

export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
};

export type AuthStackParamList = {
  Welcome: undefined;
  Login: undefined;
  SignUp: undefined;
  ForgotPassword: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  Gigs: undefined;
  Messages: undefined;
  Profile: undefined;
};

export type HomeStackParamList = {
  HomeFeed: undefined;
  GigDetail: { gigId: string };
  UserProfile: { userId: string };
};

export type GigsStackParamList = {
  GigsList: undefined;
  MyGigs: undefined;
  CreateGig: undefined;
  EditGig: { gigId: string };
  Applications: { gigId: string };
  MyApplications: undefined;
};

export type MessagesStackParamList = {
  ConversationsList: undefined;
  Chat: { conversationId: string };
};

export type ProfileStackParamList = {
  MyProfile: undefined;
  EditProfile: undefined;
  Settings: undefined;
  Portfolio: undefined;
  Subscription: undefined;
};

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}
