// Gig types matching the main app schema
export type GigType =
  | "booth-rental"
  | "freelance"
  | "full-time"
  | "part-time"
  | "internship"
  | "apprenticeship"
  | "commission";

export type GigProfession =
  | "hairstylist"
  | "nail-tech"
  | "esthetician"
  | "makeup-artist"
  | "barber"
  | "lash-tech";

export type GigSource =
  | "user-generated"
  | "craigslist"
  | "indeed"
  | "school-board"
  | "instagram"
  | "facebook"
  | "manual";

export type PayType =
  | "hourly"
  | "per-service"
  | "salary"
  | "commission"
  | "booth-rental";

export interface GigLocation {
  city: string;
  state: string;
  lat?: number;
  lng?: number;
  address?: string;
}

export interface PayRange {
  min: number;
  max: number;
  type: PayType;
}

export interface Gig {
  id: string;
  gigId: string;

  // Basic information
  title: string;
  description: string;
  location: GigLocation;

  // Poster info (null for aggregated gigs)
  postedBy: string | null;

  // Timestamps
  createdAt: Date;
  lastUpdatedAt: Date;
  expiresAt: Date;

  // Classification
  gigType: GigType;
  profession: GigProfession[];

  // Compensation
  payRange: PayRange;

  // Status
  status: "Open" | "Closed" | "Filled";
  isActive: boolean;

  // Aggregation fields
  source: GigSource;
  sourceUrl: string | null;
  externalId: string | null;

  // Metrics
  qualityScore: number;
  viewCount: number;
  applicationCount: number;

  // Optional fields
  requirements?: string[];
  benefits?: string[];
  startDate?: Date;
  imageUrl?: string;
}

export interface CreateGigInput {
  title: string;
  description: string;
  location: GigLocation;
  gigType: GigType;
  profession: GigProfession[];
  payRange: PayRange;
  source: GigSource;
  sourceUrl?: string;
  qualityScore?: number;
  expiresAt?: Date;
  requirements?: string[];
  benefits?: string[];
  startDate?: Date;
  imageUrl?: string;
}

export interface GigFormData extends CreateGigInput {
  isDraft?: boolean;
}

// GigSource tracking (for source management)
export type SourcePlatform =
  | "craigslist"
  | "indeed"
  | "school-board"
  | "facebook"
  | "instagram";

export type ScrapingFrequency =
  | "hourly"
  | "every-6-hours"
  | "daily"
  | "weekly"
  | "manual";

export interface GigSourceConfig {
  sourceId: string;
  name: string;
  url: string;
  type: "rss" | "scraper" | "api" | "manual";
  platform: SourcePlatform;
  location: {
    city: string;
    state: string;
    region: string;
  };
  isActive: boolean;
  lastScraped: Date | null;
  lastSuccess: Date | null;
  scrapingFrequency: ScrapingFrequency;
  gigCount: number;
  totalGigsScraped: number;
  errorCount: number;
  lastError: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// Filter types for gig list
export interface GigFilters {
  source?: GigSource;
  status?: "active" | "expired" | "all";
  profession?: GigProfession;
  search?: string;
}

// Analytics types
export interface CurationStats {
  totalGigs: number;
  activeGigs: number;
  thisWeekGigs: number;
  avgQualityScore: number;
  bySource: Record<GigSource, number>;
  byProfession: Record<GigProfession, number>;
}

// Form validation
export interface ValidationError {
  field: string;
  message: string;
}

// Default values
export const GIG_TYPE_OPTIONS: { value: GigType; label: string }[] = [
  { value: "booth-rental", label: "Booth Rental" },
  { value: "freelance", label: "Freelance" },
  { value: "full-time", label: "Full-Time" },
  { value: "part-time", label: "Part-Time" },
  { value: "internship", label: "Internship" },
  { value: "apprenticeship", label: "Apprenticeship" },
  { value: "commission", label: "Commission" },
];

export const PROFESSION_OPTIONS: { value: GigProfession; label: string }[] = [
  { value: "hairstylist", label: "Hairstylist" },
  { value: "nail-tech", label: "Nail Technician" },
  { value: "esthetician", label: "Esthetician" },
  { value: "makeup-artist", label: "Makeup Artist" },
  { value: "barber", label: "Barber" },
  { value: "lash-tech", label: "Lash Technician" },
];

export const SOURCE_OPTIONS: { value: GigSource; label: string }[] = [
  { value: "craigslist", label: "Craigslist" },
  { value: "school-board", label: "School Board" },
  { value: "instagram", label: "Instagram" },
  { value: "indeed", label: "Indeed" },
  { value: "manual", label: "Manual Entry" },
];

export const PAY_TYPE_OPTIONS: { value: PayType; label: string }[] = [
  { value: "hourly", label: "Hourly" },
  { value: "salary", label: "Salary" },
  { value: "per-service", label: "Per Service" },
  { value: "commission", label: "Commission" },
  { value: "booth-rental", label: "Booth Rental" },
];

export const DEFAULT_GIG_DATA: GigFormData = {
  title: "",
  description: "",
  location: {
    city: "",
    state: "",
  },
  gigType: "freelance",
  profession: [],
  payRange: {
    min: 0,
    max: 0,
    type: "hourly",
  },
  source: "manual",
  qualityScore: 5,
  requirements: [],
  benefits: [],
};
