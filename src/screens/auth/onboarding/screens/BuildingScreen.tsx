import React from 'react';
import {
  InputAccessoryView,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
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

const KEYBOARD_ACCESSORY_ID = 'onboarding-building-keyboard-accessory';

export function BuildingScreen({ state, setState, onNext, onBack, currentStep, totalSteps }: ScreenProps) {
  return (
    <Pressable style={styles.screen} onPress={Keyboard.dismiss}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.kav}
      >
        <Text style={styles.wordmark}>cowork</Text>
        <View style={styles.spacer} />

        <TypewriterText
          text="what are you building?"
          style={styles.question}
          startDelay={300}
        />

        <TextInput
          style={styles.input}
          value={state.currentlyWorkingOn}
          onChangeText={v => setState(s => ({ ...s, currentlyWorkingOn: v }))}
          placeholder="a coworking app, fueled by excess matcha"
          placeholderTextColor={t.placeholder}
          autoCapitalize="none"
          returnKeyType="done"
          blurOnSubmit
          onSubmitEditing={onNext}
          {...(Platform.OS === 'ios' ? { inputAccessoryViewID: KEYBOARD_ACCESSORY_ID } : null)}
        />

        <ProgressBar
          currentStep={currentStep}
          totalSteps={totalSteps}
          onBack={onBack}
          onNext={onNext}
        />
      </KeyboardAvoidingView>

      {Platform.OS === 'ios' ? (
        <InputAccessoryView nativeID={KEYBOARD_ACCESSORY_ID}>
          <View style={styles.keyboardAccessory}>
            <TouchableOpacity onPress={onNext} style={styles.keyboardDoneButton}>
              <Text style={styles.keyboardDoneText}>Next</Text>
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
  kav: { flex: 1 },
  spacer: { flex: 1 },
  question: {
    fontSize: 24,
    lineHeight: 32,
    marginBottom: 10,
  },
  input: {
    fontFamily: t.fontSerif.light,
    fontSize: 20,
    color: t.text,
    borderBottomWidth: 1,
    borderBottomColor: t.divider,
    paddingVertical: 8,
    marginBottom: 8,
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
