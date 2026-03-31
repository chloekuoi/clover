/**
 * Cinematic Onboarding — Dark-Mode Theme
 * All colours sourced from the existing design system (UI_SPEC.md)
 * No new hex values introduced.
 */

export const onboardingTheme = {
  // Backgrounds
  bg: '#ede8ff',          // lavender — matches auth screens
  surface: '#e4ddf7',     // slightly deeper lavender

  // Text
  text: '#1e3d28',        // forest — readable on lavender
  textSec: '#2c1f42',     // dark purple-brown
  muted: '#7c5cbf',       // violet

  // Interactive
  placeholder: '#9b8ab5', // muted violet
  accent: '#1e3d28',      // forest green — progress fill + forward button
  accentDark: '#1e3d28',  // forest green

  // Structure
  divider: '#d0c8f0',     // soft lavender divider

  // Typography
  fontSerif: {
    light: 'CormorantGaramond-Light',
    lightItalic: 'CormorantGaramond-LightItalic',
    regular: 'CormorantGaramond-Regular',
  },
  fontSans: {
    light: 'Inter-Light',
    regular: 'Inter-Regular',
    medium: 'Inter-Medium',
  },

  // Spacing
  screenPaddingH: 28,
  screenPaddingTop: 20,
  screenPaddingBottom: 40,
} as const;

export type OnboardingTheme = typeof onboardingTheme;
