import React from 'react';
import {
  Keyboard,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { onboardingTheme as t } from '../theme';
import { ProgressBar } from '../components/ProgressBar';
import { TypewriterText } from '../components/TypewriterText';
import type { ScreenProps } from '../CinematicOnboardingFlow';

const LOOKING_FOR_OPTIONS = [
  'Open to anyone',
  'Solo founder',
  'Technical / Engineer',
  'Designer',
  'Marketer / Growth',
  'Product',
  'Operator',
  'Investor',
];

export function LookingForScreen({ state, setState, onNext, onBack, currentStep, totalSteps }: ScreenProps) {
  const selected = state.desiredRoles as string[];

  const toggle = (option: string) => {
    setState(s => {
      const current = s.desiredRoles as string[];
      if (option === 'Open to anyone') {
        // Selecting "Open to anyone" clears all specific picks (and deselects if already selected)
        return { ...s, desiredRoles: current.includes(option) ? [] : ['Open to anyone'] };
      }
      // Selecting a specific role automatically removes "Open to anyone"
      const withoutOpen = current.filter(r => r !== 'Open to anyone');
      const next = withoutOpen.includes(option)
        ? withoutOpen.filter(r => r !== option)
        : [...withoutOpen, option];
      return { ...s, desiredRoles: next };
    });
  };

  return (
    <Pressable style={styles.screen} onPress={Keyboard.dismiss}>
      <Text style={styles.wordmark}>cowork</Text>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.spacer} />

        <TypewriterText
          text="who are you looking to meet?"
          style={styles.question}
          startDelay={300}
        />

        <View style={styles.divider} />
        {LOOKING_FOR_OPTIONS.map((option) => (
          <TouchableOpacity
            key={option}
            style={styles.optionRow}
            onPress={() => toggle(option)}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.optionLabel,
                selected.includes(option) && styles.optionLabelSelected,
              ]}
            >
              {option}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ProgressBar
        currentStep={currentStep}
        totalSteps={totalSteps}
        onBack={onBack}
        onNext={onNext}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    paddingHorizontal: t.screenPaddingH,
    paddingTop: t.screenPaddingTop,
    paddingBottom: t.screenPaddingBottom,
  },
  wordmark: {
    fontFamily: t.fontSerif.lightItalic,
    fontSize: 11,
    color: t.placeholder,
    textAlign: 'center',
    letterSpacing: 1.5,
    flexShrink: 0,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 8,
  },
  spacer: {
    flex: 1,
    minHeight: 40,
  },
  question: {
    fontSize: 24,
    lineHeight: 32,
    marginBottom: 14,
  },
  divider: {
    height: 1,
    backgroundColor: t.divider,
  },
  optionRow: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: t.divider,
  },
  optionLabel: {
    fontFamily: t.fontSerif.light,
    fontSize: 17,
    color: t.placeholder,
    letterSpacing: 0.2,
    lineHeight: 22,
  },
  optionLabelSelected: {
    fontFamily: t.fontSerif.regular,
    color: t.text,
  },
});
