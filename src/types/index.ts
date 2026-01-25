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

export type GigType = 'Full-time' | 'Part-time' | 'Freelance' | 'Internship' | 'Apprenticeship';
export type GigStatus = 'Open' | 'Closed' | 'Filled';

export interface Gig {
  id: string;
  founderId: string;
  founderProfile: FounderProfile;
  title: string;
  description: string;
  type: GigType;
  specialties: string[];
  location: {
    city: string;
    state: string;
  };
  compensation: {
    type: 'Hourly' | 'Salary' | 'Commission' | 'Unpaid';
    amount?: number;
    range?: {
      min: number;
      max: number;
    };
  };
  requirements: string[];
  benefits?: string[];
  startDate?: Date;
  status: GigStatus;
  applicantCount: number;
  createdAt: Date;
  updatedAt: Date;
}

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
  type: GigType;
  specialties: string[];
  location: {
    city: string;
    state: string;
  };
  compensation: {
    type: 'Hourly' | 'Salary' | 'Commission' | 'Unpaid';
    amount?: number;
    range?: {
      min: number;
      max: number;
    };
  };
  requirements: string[];
  benefits?: string[];
  startDate?: Date;
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
