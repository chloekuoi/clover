// Warm Neutral Design System - Colors

export const colors = {
  // Backgrounds
  bgPrimary: '#F5F4F1',
  bgSecondary: '#EEEDEA',
  bgCard: '#FFFFFF',
  bgInput: '#FFFFFF',

  // Text
  textPrimary: '#1A1A1A',
  textSecondary: '#6B6B6B',
  textTertiary: '#9B9B9B',
  textInverse: '#FFFFFF',

  // Borders & Dividers
  borderDefault: '#E4E3E0',
  borderFocus: '#3F5443',
  divider: '#EEEDEA',

  // Accent
  accentPrimary: '#3F5443',
  accentHover: '#334536',
  accentPrimaryLight: '#EDF3EF',
  accentSecondary: '#C9AEFB',
  accentSecondaryDark: '#8B6FC0',
  accentSecondaryText: '#2E2440',
  accentSecondaryLight: '#F5EEFF',
  accentSubtle: '#E8E7E4',

  // Status
  accentSuccess: '#3F5443',
  accentWarning: '#9B7FD4',
  accentDanger: '#B85C4D',
  statusPendingBg: '#F5EEFF',
  statusPendingText: '#9B7FD4',
  statusConfirmedBg: '#EDF3EF',
  statusConfirmedText: '#3F5443',
  statusCancelledBg: '#F5F4F2',
  statusCancelledText: '#9B9B9B',
} as const;

export const typography = {
  headingXL: { fontSize: 26, fontWeight: '700', letterSpacing: -0.3 },
  headingLG: { fontSize: 20, fontWeight: '700', letterSpacing: -0.2 },
  headingMD: { fontSize: 16, fontWeight: '600' },
  body: { fontSize: 15, fontWeight: '400' },
  bodyMedium: { fontSize: 15, fontWeight: '500' },
  bodySmall: { fontSize: 13, fontWeight: '400' },
  caption: { fontSize: 11, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.8 },
  chip: { fontSize: 13, fontWeight: '500' },
} as const;

export const shadows = {
  card: {
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  button: {
    shadowColor: '#3F5443',
    shadowOpacity: 0.2,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  dropdown: {
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
} as const;

// Quick access shortcuts (legacy-friendly)
export const theme = {
  primary: colors.accentPrimary,
  primaryHover: colors.accentHover,
  accent: colors.accentPrimary,
  primaryLight: colors.accentPrimaryLight,

  background: colors.bgPrimary,
  surface: colors.bgCard,
  highlight: colors.borderDefault,

  text: colors.textPrimary,
  textSecondary: colors.textSecondary,
  textMuted: colors.textTertiary,

  success: colors.accentSuccess,
  warning: colors.accentWarning,
  error: colors.accentDanger,

  swipeRight: colors.accentPrimary,
  swipeLeft: colors.accentDanger,
} as const;
