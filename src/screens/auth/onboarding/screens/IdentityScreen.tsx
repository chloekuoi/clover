import React from 'react';
import {
  Image,
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
      setState(s => ({ ...s, photoUri: result.assets[0].uri }));
    }
  };

  const canAdvance = state.name.trim().length > 0;

  return (
    <View style={styles.screen}>
      <Text style={styles.wordmark}>cowork</Text>
      <View style={styles.spacer} />

      <TypewriterText
        text="who are you?"
        style={styles.question}
        startDelay={300}
      />

      {/* Photo circle */}
      <TouchableOpacity onPress={pickPhoto} style={styles.photoCircle} activeOpacity={0.7}>
        {state.photoUri ? (
          <Image source={{ uri: state.photoUri }} style={styles.photoImage} />
        ) : (
          <Text style={styles.photoPlus}>+</Text>
        )}
      </TouchableOpacity>

      {/* Name input */}
      <TextInput
        style={styles.nameInput}
        value={state.name}
        onChangeText={name => setState(s => ({ ...s, name }))}
        placeholder="your name..."
        placeholderTextColor={t.placeholder}
        autoCapitalize="words"
        returnKeyType="done"
        onSubmitEditing={canAdvance ? onNext : undefined}
      />

      <ProgressBar
        currentStep={currentStep}
        totalSteps={totalSteps}
        onBack={onBack}
        onNext={canAdvance ? onNext : undefined}
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
    fontSize: 24,
    lineHeight: 32,
    marginBottom: 20,
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
    marginBottom: 20,
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
    marginBottom: 16,
  },
});
