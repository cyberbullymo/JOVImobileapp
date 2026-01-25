/**
 * Jovi Design System - Jupiter-Inspired Theme
 * Brand Colors: Deep Amethyst Purple, Coral Pink, Soft Gold
 */

export const colors = {
  // Primary Brand Colors
  primary: {
    main: '#4D3DFF',        // Deep Amethyst Purple
    light: '#7B6FFF',
    dark: '#2E1FCC',
    contrast: '#FFFFFF',
  },
  
  // Secondary Brand Colors
  secondary: {
    main: '#FF6B6B',        // Coral Pink
    light: '#FF9999',
    dark: '#CC4444',
    contrast: '#FFFFFF',
  },
  
  // Accent
  accent: {
    gold: '#FFD700',        // Soft Gold
    goldLight: '#FFE55C',
    goldDark: '#CCB300',
  },
  
  // Neutrals
  neutral: {
    white: '#FFFFFF',
    cream: '#FAF8F3',
    lightGray: '#E8E8E8',
    gray: '#9E9E9E',
    darkGray: '#424242',
    black: '#1A1A1A',
  },
  
  // Semantic Colors
  success: '#4CAF50',
  warning: '#FFC107',
  error: '#F44336',
  info: '#2196F3',
  
  // Background
  background: {
    default: '#FAF8F3',    // Cream
    paper: '#FFFFFF',
    elevated: '#FFFFFF',
  },
  
  // Text
  text: {
    primary: '#1A1A1A',
    secondary: '#424242',
    disabled: '#9E9E9E',
    inverse: '#FFFFFF',
  },
  
  // Borders
  border: {
    light: '#E8E8E8',
    main: '#9E9E9E',
    dark: '#424242',
  },
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const typography = {
  h1: {
    fontSize: 32,
    fontWeight: '700' as const,
    lineHeight: 40,
    letterSpacing: -0.5,
  },
  h2: {
    fontSize: 28,
    fontWeight: '700' as const,
    lineHeight: 36,
    letterSpacing: -0.5,
  },
  h3: {
    fontSize: 24,
    fontWeight: '600' as const,
    lineHeight: 32,
    letterSpacing: 0,
  },
  h4: {
    fontSize: 20,
    fontWeight: '600' as const,
    lineHeight: 28,
    letterSpacing: 0,
  },
  body1: {
    fontSize: 16,
    fontWeight: '400' as const,
    lineHeight: 24,
    letterSpacing: 0.15,
  },
  body2: {
    fontSize: 14,
    fontWeight: '400' as const,
    lineHeight: 20,
    letterSpacing: 0.25,
  },
  button: {
    fontSize: 16,
    fontWeight: '600' as const,
    lineHeight: 24,
    letterSpacing: 0.5,
    textTransform: 'uppercase' as const,
  },
  caption: {
    fontSize: 12,
    fontWeight: '400' as const,
    lineHeight: 16,
    letterSpacing: 0.4,
  },
  overline: {
    fontSize: 10,
    fontWeight: '600' as const,
    lineHeight: 16,
    letterSpacing: 1.5,
    textTransform: 'uppercase' as const,
  },
};

export const borderRadius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
};

export const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  xl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
};

export const iconSizes = {
  xs: 16,
  sm: 20,
  md: 24,
  lg: 32,
  xl: 48,
};

// Complete theme object
export const theme = {
  colors,
  spacing,
  typography,
  borderRadius,
  shadows,
  iconSizes,
};

export type Theme = typeof theme;
