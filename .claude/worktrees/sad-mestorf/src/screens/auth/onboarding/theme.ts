/**
 * Cinematic Onboarding — Dark-Mode Theme
 * All colours sourced from the existing design system (UI_SPEC.md)
 * No new hex values introduced.
 */

export const onboardingTheme = {
  // Backgrounds
  bg: '#2D3A2D',         // sage-950
  surface: '#3B4638',    // sage-900

  // Text
  text: '#F7F5F2',       // neutral-50
  textSec: '#E8DCD0',    // sand-100
  muted: '#B8C7B3',      // sage-300

  // Interactive
  placeholder: '#6F8268', // sage-600
  accent: '#A8B5A2',      // sage-400
  accentDark: '#5C6B57',  // sage-700

  // Structure
  divider: '#4A5745',     // sage-800

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
