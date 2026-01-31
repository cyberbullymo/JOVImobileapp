/**
 * Feed Store
 * Zustand store for feed filter and sort state management
 */

import { create } from 'zustand';

// Types (MVP: gigs only)
export type ContentType = 'gigs';
export type UserTypeFilter = 'future_pro' | 'licensed_pro' | 'founder';
export type DatePosted = 'today' | 'week' | 'month' | 'all';
export type SortMethod = 'recent' | 'popular' | 'trending' | 'relevant';
export type Category = 'hair' | 'nails' | 'skin' | 'makeup' | 'barbering' | 'esthetics' | 'other';

export interface FeedFilters {
  contentTypes: ContentType[];
  userTypes: UserTypeFilter[];
  location: {
    enabled: boolean;
    radiusMiles: number;
  };
  categories: Category[];
  datePosted: DatePosted;
}

export interface FeedSort {
  method: SortMethod;
}

interface FeedState {
  filters: FeedFilters;
  sort: FeedSort;
  isFilterModalVisible: boolean;
  isSortDropdownVisible: boolean;
  isLoading: boolean;

  // Filter actions
  setContentTypes: (types: ContentType[]) => void;
  toggleContentType: (type: ContentType) => void;
  setUserTypes: (types: UserTypeFilter[]) => void;
  toggleUserType: (type: UserTypeFilter) => void;
  setLocationEnabled: (enabled: boolean) => void;
  setLocationRadius: (radius: number) => void;
  setCategories: (categories: Category[]) => void;
  toggleCategory: (category: Category) => void;
  setDatePosted: (date: DatePosted) => void;
  clearAllFilters: () => void;
  applyFilters: (filters: FeedFilters) => void;

  // Sort actions
  setSortMethod: (method: SortMethod) => void;

  // Modal actions
  openFilterModal: () => void;
  closeFilterModal: () => void;
  openSortDropdown: () => void;
  closeSortDropdown: () => void;

  // Loading
  setLoading: (loading: boolean) => void;

  // Computed
  getActiveFilterCount: () => number;
}

const defaultFilters: FeedFilters = {
  contentTypes: [],
  userTypes: [],
  location: {
    enabled: false,
    radiusMiles: 25,
  },
  categories: [],
  datePosted: 'all',
};

const defaultSort: FeedSort = {
  method: 'recent',
};

export const useFeedStore = create<FeedState>((set, get) => ({
  filters: defaultFilters,
  sort: defaultSort,
  isFilterModalVisible: false,
  isSortDropdownVisible: false,
  isLoading: false,

  // Filter actions
  setContentTypes: (types) =>
    set((state) => ({
      filters: { ...state.filters, contentTypes: types },
    })),

  toggleContentType: (type) =>
    set((state) => {
      const current = state.filters.contentTypes;
      const newTypes = current.includes(type)
        ? current.filter((t) => t !== type)
        : [...current, type];
      return {
        filters: { ...state.filters, contentTypes: newTypes },
      };
    }),

  setUserTypes: (types) =>
    set((state) => ({
      filters: { ...state.filters, userTypes: types },
    })),

  toggleUserType: (type) =>
    set((state) => {
      const current = state.filters.userTypes;
      const newTypes = current.includes(type)
        ? current.filter((t) => t !== type)
        : [...current, type];
      return {
        filters: { ...state.filters, userTypes: newTypes },
      };
    }),

  setLocationEnabled: (enabled) =>
    set((state) => ({
      filters: {
        ...state.filters,
        location: { ...state.filters.location, enabled },
      },
    })),

  setLocationRadius: (radius) =>
    set((state) => ({
      filters: {
        ...state.filters,
        location: { ...state.filters.location, radiusMiles: radius },
      },
    })),

  setCategories: (categories) =>
    set((state) => ({
      filters: { ...state.filters, categories },
    })),

  toggleCategory: (category) =>
    set((state) => {
      const current = state.filters.categories;
      const newCategories = current.includes(category)
        ? current.filter((c) => c !== category)
        : [...current, category];
      return {
        filters: { ...state.filters, categories: newCategories },
      };
    }),

  setDatePosted: (date) =>
    set((state) => ({
      filters: { ...state.filters, datePosted: date },
    })),

  clearAllFilters: () =>
    set({
      filters: defaultFilters,
    }),

  applyFilters: (filters) =>
    set({
      filters,
      isFilterModalVisible: false,
    }),

  // Sort actions
  setSortMethod: (method) =>
    set({
      sort: { method },
      isSortDropdownVisible: false,
    }),

  // Modal actions
  openFilterModal: () => set({ isFilterModalVisible: true }),
  closeFilterModal: () => set({ isFilterModalVisible: false }),
  openSortDropdown: () => set({ isSortDropdownVisible: true }),
  closeSortDropdown: () => set({ isSortDropdownVisible: false }),

  // Loading
  setLoading: (loading) => set({ isLoading: loading }),

  // Computed
  getActiveFilterCount: () => {
    const { filters } = get();
    let count = 0;

    if (filters.contentTypes.length > 0) count++;
    if (filters.userTypes.length > 0) count++;
    if (filters.location.enabled) count++;
    if (filters.categories.length > 0) count++;
    if (filters.datePosted !== 'all') count++;

    return count;
  },
}));

// Helper function to get date cutoff for filters
export const getDateCutoff = (datePosted: DatePosted): Date => {
  const now = new Date();

  switch (datePosted) {
    case 'today':
      return new Date(now.setHours(0, 0, 0, 0));
    case 'week':
      return new Date(now.setDate(now.getDate() - 7));
    case 'month':
      return new Date(now.setMonth(now.getMonth() - 1));
    case 'all':
    default:
      return new Date(0);
  }
};

// Sort method labels
export const SORT_LABELS: Record<SortMethod, string> = {
  recent: 'Recent',
  popular: 'Popular',
  trending: 'Trending',
  relevant: 'Relevant',
};

// Content type labels (MVP: gigs only)
export const CONTENT_TYPE_LABELS: Record<ContentType, string> = {
  gigs: 'Gigs',
};

// User type labels
export const USER_TYPE_LABELS: Record<UserTypeFilter, string> = {
  future_pro: 'Future Pros',
  licensed_pro: 'Licensed Pros',
  founder: 'Founders',
};

// Category labels
export const CATEGORY_LABELS: Record<Category, string> = {
  hair: 'Hair',
  nails: 'Nails',
  skin: 'Skin',
  makeup: 'Makeup',
  barbering: 'Barbering',
  esthetics: 'Esthetics',
  other: 'Other',
};

// Date posted labels
export const DATE_POSTED_LABELS: Record<DatePosted, string> = {
  today: 'Today',
  week: 'This Week',
  month: 'This Month',
  all: 'All Time',
};
