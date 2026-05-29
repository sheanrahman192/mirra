// Design tokens — Mirra "dawn" palette (soft aesthetic, cozy density).
// Ported 1:1 from the design's tokens.css. Values that were CSS custom
// properties (var(--x)) are exposed here as plain constants.

export const colors = {
  bg: '#ECE2D2',
  paper: '#F6EFE0',
  card: '#FBF6EA',
  card2: '#F3E9D5',
  ink: '#2A2520',
  ink2: '#4A4138',
  muted: '#8A7F70',
  hairline: 'rgba(42,37,32,0.10)',
  hairline2: 'rgba(42,37,32,0.06)',

  terracotta: '#D08866',
  terracottaSoft: '#E8B79E',
  sage: '#97A887',
  sageSoft: '#C2CDB4',
  lavender: '#B4A5C9',
  lavenderSoft: '#D7CDE2',
  coral: '#E29687',
  sand: '#E0CCAA',

  // Chart helpers (from charts.jsx MirraColors)
  inkSoft: 'rgba(42,37,32,0.45)',
  hair: 'rgba(42,37,32,0.10)',
} as const;

// Tone → dot color (used by conversation rows)
export const toneColor: Record<string, string> = {
  sage: colors.sage,
  terracotta: colors.terracotta,
  lavender: colors.lavender,
  coral: colors.coral,
  sand: colors.sand,
};

// Font families — loaded in app/_layout.tsx via @expo-google-fonts.
export const fonts = {
  // Display serif (Instrument Serif). Maps to the .serif / .serif-i classes.
  serif: 'InstrumentSerif_400Regular',
  serifItalic: 'InstrumentSerif_400Regular_Italic',
  // Body sans (Inter stands in for Geist, the named fallback in tokens.css).
  body: 'Inter_400Regular',
  bodyMedium: 'Inter_500Medium',
  bodySemibold: 'Inter_600SemiBold',
  bodyLight: 'Inter_300Light',
} as const;

export const radii = {
  sm: 12,
  md: 18,
  lg: 24,
  xl: 32,
} as const;

// Soft drop shadow used by Card and floating elements.
// (RN: iOS uses shadow*, Android uses elevation.)
export const cardShadow = {
  shadowColor: '#2A2520',
  shadowOffset: { width: 0, height: 1 },
  shadowOpacity: 0.04,
  shadowRadius: 2,
  elevation: 1,
} as const;

export const floatShadow = {
  shadowColor: '#2A2520',
  shadowOffset: { width: 0, height: 8 },
  shadowOpacity: 0.1,
  shadowRadius: 24,
  elevation: 8,
} as const;
