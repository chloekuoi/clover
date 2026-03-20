import React from 'react';
import {
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

const WORK_OPTIONS = [
  'Founder',
  'Freelancer',
  'Remote employee',
  'Student',
  'Creator',
  'Digital nomad',
];

export function MissionScreen({ state, setState, onNext, onBack, currentStep, totalSteps }: ScreenProps) {
  const selected = state.workType;

  const handleSelect = (option: string) => {
    setState(s => ({ ...s, workType: option }));
  };

  return (
    <View style={styles.screen}>
      <Text style={styles.wordmark}>cowork</Text>
      <View style={styles.spacer} />

      <TypewriterText
        text="how do you spend your 9-to-5?"
        style={styles.question}
        startDelay={300}
      />

      {/* Top divider */}
      <View style={styles.divider} />

      {/* Options list */}
      {WORK_OPTIONS.map((option) => (
        <TouchableOpacity
          key={option}
          style={styles.optionRow}
          onPress={() => handleSelect(option)}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.optionLabel,
              selected === option && styles.optionLabelSelected,
            ]}
          >
            {option}
          </Text>
        </TouchableOpacity>
      ))}

      <ProgressBar
        currentStep={currentStep}
        totalSteps={totalSteps}
        onBack={onBack}
        onNext={selected ? onNext : undefined}
      />
    </View>
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
  spacer: { flex: 1 },
  question: {
    fontSize: 22,
    lineHeight: 30,
    marginBottom: 16,
  },
  divider: {
    height: 1,
    backgroundColor: t.divider,
    marginBottom: 0,
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
