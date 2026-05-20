import React, { useState } from 'react';
import {
  InputAccessoryView,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
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

const KEYBOARD_ACCESSORY_ID = 'onboarding-about-keyboard-accessory';

const WORK_OPTIONS = [
  'Solo founder',
  'Technical / Engineer',
  'Designer',
  'Marketer / Growth',
  'Product',
  'Operator',
  'Investor',
  'Other',
];

export function AboutScreen({ state, setState, onNext, onBack, currentStep, totalSteps }: ScreenProps) {
  const selectedTypes = state.workType as string[];

  const [otherText, setOtherText] = useState('');

  const toggleWorkType = (option: string) => {
    setState(s => {
      const current = s.workType as string[];
      const next = current.includes(option)
        ? current.filter(w => w !== option)
        : [...current, option];
      return { ...s, workType: next };
    });
  };

  const handleNext = () => {
    if (selectedTypes.includes('Other') && otherText.trim()) {
      setState(s => ({
        ...s,
        workType: (s.workType as string[]).map(w =>
          w === 'Other' ? otherText.trim() : w
        ),
      }));
    }
    onNext();
  };

  return (
    <Pressable style={styles.screen} onPress={Keyboard.dismiss}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.kav}
      >
        <Text style={styles.wordmark}>cowork</Text>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.spacer} />

          <TypewriterText
            text="how do you spend your 9-to-5?"
            style={styles.question}
            startDelay={300}
          />
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
          {selectedTypes.includes('Other') ? (
            <TextInput
              style={[styles.input, styles.otherInput]}
              value={otherText}
              onChangeText={setOtherText}
              placeholder="your role…"
              placeholderTextColor={t.placeholder}
              autoCapitalize="none"
              autoFocus
              returnKeyType="done"
              blurOnSubmit
              onSubmitEditing={Keyboard.dismiss}
              multiline={false}
              {...(Platform.OS === 'ios' ? { inputAccessoryViewID: KEYBOARD_ACCESSORY_ID } : null)}
            />
          ) : null}
        </ScrollView>

        <ProgressBar
          currentStep={currentStep}
          totalSteps={totalSteps}
          onBack={onBack}
          onNext={handleNext}
        />
      </KeyboardAvoidingView>

      {Platform.OS === 'ios' ? (
        <InputAccessoryView nativeID={KEYBOARD_ACCESSORY_ID}>
          <View style={styles.keyboardAccessory}>
            <TouchableOpacity onPress={Keyboard.dismiss} style={styles.keyboardDoneButton}>
              <Text style={styles.keyboardDoneText}>Done</Text>
            </TouchableOpacity>
          </View>
        </InputAccessoryView>
      ) : null}
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
  kav: { flex: 1 },
  spacer: {
    flex: 1,
    minHeight: 40,
  },
  question: {
    fontSize: 24,
    lineHeight: 32,
    marginBottom: 10,
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
  otherInput: {
    marginTop: 8,
    marginBottom: 4,
  },
  keyboardAccessory: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: t.divider,
    paddingHorizontal: 16,
    paddingVertical: 8,
    alignItems: 'flex-end',
  },
  keyboardDoneButton: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  keyboardDoneText: {
    fontFamily: t.fontSans.medium,
    fontSize: 16,
    color: t.accentDark,
  },
});
