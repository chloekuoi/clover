import React, { useRef, useState } from 'react';
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

const KEYBOARD_ACCESSORY_ID = 'onboarding-birthday-keyboard-accessory';

function isAtLeast18(dd: string, mm: string, yyyy: string): boolean {
  const day = parseInt(dd, 10);
  const month = parseInt(mm, 10) - 1;
  const year = parseInt(yyyy, 10);
  if (isNaN(day) || isNaN(month) || isNaN(year)) return false;

  const dob = new Date(year, month, day);

  // Guard against JS date overflow (e.g. Feb 31 → Mar 3)
  if (dob.getFullYear() !== year || dob.getMonth() !== month || dob.getDate() !== day) {
    return false;
  }

  const now = new Date();
  const age = now.getFullYear() - dob.getFullYear();
  const monthDiff = now.getMonth() - dob.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < dob.getDate())) {
    return age - 1 >= 18;
  }
  return age >= 18;
}

export function BirthdayScreen({ state, setState, onNext, onBack, currentStep, totalSteps }: ScreenProps) {
  const [dd, setDd] = useState('');
  const [mm, setMm] = useState('');
  const [yyyy, setYyyy] = useState('');
  const [showError, setShowError] = useState(false);

  const mmRef = useRef<TextInput>(null);
  const yyyyRef = useRef<TextInput>(null);

  const allFilled = dd.length >= 1 && mm.length >= 1 && yyyy.length === 4;
  const isValid = allFilled && isAtLeast18(dd, mm, yyyy);

  const handleDdChange = (val: string) => {
    const clean = val.replace(/\D/g, '').slice(0, 2);
    setDd(clean);
    setShowError(false);
    if (clean.length === 2) mmRef.current?.focus();
  };

  const handleMmChange = (val: string) => {
    const clean = val.replace(/\D/g, '').slice(0, 2);
    setMm(clean);
    setShowError(false);
    if (clean.length === 2) yyyyRef.current?.focus();
  };

  const handleYyyyChange = (val: string) => {
    const clean = val.replace(/\D/g, '').slice(0, 4);
    setYyyy(clean);
    setShowError(false);
  };

  const handleNext = () => {
    if (!allFilled) return;
    if (!isValid) {
      setShowError(true);
      return;
    }
    // Store ISO date
    const isoDate = `${yyyy}-${mm.padStart(2, '0')}-${dd.padStart(2, '0')}`;
    setState(s => ({ ...s, birthday: isoDate }));
    onNext();
  };

  return (
    <Pressable style={styles.screen} onPress={Keyboard.dismiss}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.kav}
      >
        <Text style={styles.wordmark}>cowork</Text>
        <View style={styles.spacer} />

        <TypewriterText
          text="when's your birthday?"
          style={styles.question}
          startDelay={300}
        />

        <View style={styles.dateRow}>
          <TextInput
            style={styles.dateInput}
            value={dd}
            onChangeText={handleDdChange}
            placeholder="DD"
            placeholderTextColor={t.placeholder}
            keyboardType="number-pad"
            maxLength={2}
            returnKeyType="next"
            {...(Platform.OS === 'ios' ? { inputAccessoryViewID: KEYBOARD_ACCESSORY_ID } : null)}
          />
          <Text style={styles.separator}>/</Text>
          <TextInput
            ref={mmRef}
            style={styles.dateInput}
            value={mm}
            onChangeText={handleMmChange}
            placeholder="MM"
            placeholderTextColor={t.placeholder}
            keyboardType="number-pad"
            maxLength={2}
            returnKeyType="next"
            {...(Platform.OS === 'ios' ? { inputAccessoryViewID: KEYBOARD_ACCESSORY_ID } : null)}
          />
          <Text style={styles.separator}>/</Text>
          <TextInput
            ref={yyyyRef}
            style={[styles.dateInput, styles.yearInput]}
            value={yyyy}
            onChangeText={handleYyyyChange}
            placeholder="YYYY"
            placeholderTextColor={t.placeholder}
            keyboardType="number-pad"
            maxLength={4}
            returnKeyType="done"
            onSubmitEditing={handleNext}
            {...(Platform.OS === 'ios' ? { inputAccessoryViewID: KEYBOARD_ACCESSORY_ID } : null)}
          />
        </View>

        {showError && (
          <Text style={styles.error}>this space is for the grown-ups.</Text>
        )}

        <ProgressBar
          currentStep={currentStep}
          totalSteps={totalSteps}
          onBack={onBack}
          onNext={allFilled ? handleNext : undefined}
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
  kav: { flex: 1 },
  spacer: { flex: 1 },
  question: {
    fontSize: 24,
    lineHeight: 32,
    marginBottom: 10,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    marginBottom: 8,
  },
  dateInput: {
    fontFamily: t.fontSerif.light,
    fontSize: 22,
    color: t.text,
    borderBottomWidth: 1,
    borderBottomColor: t.divider,
    paddingVertical: 6,
    textAlign: 'center',
    width: 52,
  },
  yearInput: {
    width: 72,
  },
  separator: {
    fontFamily: t.fontSans.light,
    fontSize: 18,
    color: t.muted,
    paddingBottom: 6,
  },
  error: {
    fontFamily: t.fontSerif.lightItalic,
    fontSize: 13,
    color: t.accent,
    marginBottom: 12,
    fontStyle: 'italic',
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
