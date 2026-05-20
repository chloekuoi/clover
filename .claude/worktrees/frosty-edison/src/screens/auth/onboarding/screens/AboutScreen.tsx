import React from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
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

export function AboutScreen({ state, setState, onNext, onBack, currentStep, totalSteps }: ScreenProps) {
  const selectedTypes = state.workType as string[];

  const toggleWorkType = (option: string) => {
    setState(s => {
      const current = s.workType as string[];
      const next = current.includes(option)
        ? current.filter(w => w !== option)
        : [...current, option];
      return { ...s, workType: next };
    });
  };

  return (
    <View style={styles.screen}>
      <Text style={styles.wordmark}>cowork</Text>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.spacer} />

        <TypewriterText
          text="tell us a bit more."
          style={styles.question}
          startDelay={300}
        />

        {/* School field */}
        <Text style={styles.fieldLabel}>where'd you go to school?</Text>
        <TextInput
          style={styles.input}
          value={state.school}
          onChangeText={v => setState(s => ({ ...s, school: v }))}
          placeholderTextColor={t.placeholder}
          autoCapitalize="words"
          returnKeyType="next"
          multiline={false}
        />

        {/* Building field */}
        <Text style={[styles.fieldLabel, styles.fieldLabelSpaced]}>what are you building?</Text>
        <TextInput
          style={styles.input}
          value={state.currentlyWorkingOn}
          onChangeText={v => setState(s => ({ ...s, currentlyWorkingOn: v }))}
          placeholder="a coworking app, fueled by excess matcha"
          placeholderTextColor={t.placeholder}
          autoCapitalize="none"
          returnKeyType="done"
          multiline={false}
        />

        {/* Work type section heading */}
        <Text style={styles.sectionHeading}>how do you spend your 9-to-5?</Text>
        <View style={styles.divider} />
        {WORK_OPTIONS.map((option) => (
          <TouchableOpacity
            key={option}
            style={styles.optionRow}
            onPress={() => toggleWorkType(option)}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.optionLabel,
                selectedTypes.includes(option) && styles.optionLabelSelected,
              ]}
            >
              {option}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* ProgressBar always outside scroll, always enabled */}
      <ProgressBar
        currentStep={currentStep}
        totalSteps={totalSteps}
        onBack={onBack}
        onNext={onNext}
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
    fontSize: 22,
    lineHeight: 30,
    marginBottom: 20,
  },
  fieldLabel: {
    fontFamily: t.fontSerif.lightItalic,
    fontSize: 15,
    color: t.accent,
    marginBottom: 6,
    fontStyle: 'italic',
  },
  fieldLabelSpaced: {
    marginTop: 20,
  },
  sectionHeading: {
    fontFamily: t.fontSerif.light,
    fontSize: 17,
    color: t.text,
    marginTop: 28,
    marginBottom: 14,
    letterSpacing: -0.2,
    lineHeight: 24,
  },
  input: {
    fontFamily: t.fontSerif.light,
    fontSize: 17,
    color: t.text,
    borderBottomWidth: 1,
    borderBottomColor: t.divider,
    paddingVertical: 8,
    marginBottom: 4,
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
