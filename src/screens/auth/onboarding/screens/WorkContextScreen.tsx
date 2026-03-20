import React from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { onboardingTheme as t } from '../theme';
import { ProgressBar } from '../components/ProgressBar';
import { TypewriterText } from '../components/TypewriterText';
import type { ScreenProps } from '../CinematicOnboardingFlow';

export function WorkContextScreen({ state, setState, onNext, onBack, currentStep, totalSteps }: ScreenProps) {
  const bothEmpty =
    state.currentlyWorkingOn.trim().length === 0 &&
    state.school.trim().length === 0;

  const nextLabel = bothEmpty ? 'skip →' : 'next →';

  return (
    <View style={styles.screen}>
      <Text style={styles.wordmark}>cowork</Text>
      <View style={styles.spacer} />

      <TypewriterText
        text="tell us a bit more."
        style={styles.question}
        startDelay={300}
      />

      {/* "What are you building?" field */}
      <Text style={styles.fieldLabel}>what are you building?</Text>
      <TextInput
        style={styles.input}
        value={state.currentlyWorkingOn}
        onChangeText={v => setState(s => ({ ...s, currentlyWorkingOn: v }))}
        placeholder="a startup, a side project, an idea..."
        placeholderTextColor={t.placeholder}
        autoCapitalize="none"
        returnKeyType="next"
        multiline={false}
      />

      {/* "Where are you studying?" field */}
      <Text style={[styles.fieldLabel, styles.fieldLabelSpaced]}>where are you studying?</Text>
      <TextInput
        style={styles.input}
        value={state.school}
        onChangeText={v => setState(s => ({ ...s, school: v }))}
        placeholder="university, bootcamp, self-taught..."
        placeholderTextColor={t.placeholder}
        autoCapitalize="words"
        returnKeyType="done"
        onSubmitEditing={onNext}
        multiline={false}
      />

      <ProgressBar
        currentStep={currentStep}
        totalSteps={totalSteps}
        onBack={onBack}
        onNext={onNext}
        nextLabel={nextLabel}
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
    marginBottom: 20,
  },
  fieldLabel: {
    fontFamily: t.fontSerif.lightItalic,
    fontSize: 12,
    color: t.accent,
    marginBottom: 6,
    fontStyle: 'italic',
  },
  fieldLabelSpaced: {
    marginTop: 20,
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
});
