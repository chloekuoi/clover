import React from 'react';
import {
  Image,
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
import * as ImagePicker from 'expo-image-picker';
import { onboardingTheme as t } from '../theme';
import { ProgressBar } from '../components/ProgressBar';
import { TypewriterText } from '../components/TypewriterText';
import type { ScreenProps } from '../CinematicOnboardingFlow';

const KEYBOARD_ACCESSORY_ID = 'onboarding-identity-keyboard-accessory';

export function IdentityScreen({ state, setState, onNext, onBack, currentStep, totalSteps }: ScreenProps) {
  const pickPhoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setState(s => {
        const next = [...s.photoUris];
        next[0] = result.assets[0].uri;
        return { ...s, photoUris: next };
      });
    }
  };

  const canAdvance = state.name.trim().length > 0;

  return (
    <Pressable style={styles.screen} onPress={Keyboard.dismiss}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.kav}
      >
        <Text style={styles.wordmark}>cowork</Text>
        <View style={styles.spacer} />

        <TypewriterText
          text="who are you?"
          style={styles.question}
          startDelay={300}
        />

        <TouchableOpacity onPress={pickPhoto} style={styles.photoCircle} activeOpacity={0.7}>
          {state.photoUris[0] ? (
            <Image source={{ uri: state.photoUris[0] }} style={styles.photoImage} />
          ) : (
            <Text style={styles.photoPlus}>+</Text>
          )}
        </TouchableOpacity>

        <TextInput
          style={styles.nameInput}
          value={state.name}
          onChangeText={name => setState(s => ({ ...s, name }))}
          placeholder="your name..."
          placeholderTextColor={t.placeholder}
          autoCapitalize="words"
          returnKeyType="done"
          blurOnSubmit
          onSubmitEditing={canAdvance ? onNext : Keyboard.dismiss}
          {...(Platform.OS === 'ios' ? { inputAccessoryViewID: KEYBOARD_ACCESSORY_ID } : null)}
        />

        <ProgressBar
          currentStep={currentStep}
          totalSteps={totalSteps}
          onBack={onBack}
          onNext={canAdvance ? onNext : undefined}
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
  photoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: t.accentDark,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    overflow: 'hidden',
  },
  photoImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  photoPlus: {
    fontFamily: t.fontSans.light,
    fontSize: 24,
    color: t.placeholder,
  },
  nameInput: {
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
