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

// Source of the gig posting
export type GigSource =
  | 'user-generated'
  | 'craigslist'
  | 'indeed'
  | 'school-board'
  | 'facebook';

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
  source: GigSource;
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
  source: Exclude<GigSource, 'user-generated'>;
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
