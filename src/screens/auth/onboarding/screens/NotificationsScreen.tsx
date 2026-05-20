import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import * as Notifications from 'expo-notifications';
import { onboardingTheme as t } from '../theme';
import { ProgressBar } from '../components/ProgressBar';
import { TypewriterText } from '../components/TypewriterText';
import type { ScreenProps } from '../CinematicOnboardingFlow';

export function NotificationsScreen({ state, setState, onNext, onBack, currentStep, totalSteps }: ScreenProps) {
  const [requesting, setRequesting] = useState(false);

  const handleRequest = async () => {
    if (requesting) return;
    setRequesting(true);
    try {
      const { status } = await Notifications.requestPermissionsAsync();
      setState(s => ({ ...s, notificationsGranted: status === 'granted' }));
    } catch {
      // permission failed — still advance
    }
    // setRequesting before onNext so state setter runs while component is still mounted
    setRequesting(false);
    onNext();
  };

  return (
    <View style={styles.screen}>
      <Text style={styles.wordmark}>cowork</Text>
      <View style={styles.spacer} />

      <TypewriterText
        text="stay in the loop."
        style={styles.question}
        startDelay={300}
      />

      <Text style={styles.body}>
        when someone nearby wants to co-work, we'll let you know. no spam, just signal.
      </Text>

      <TouchableOpacity onPress={handleRequest} style={styles.cta} activeOpacity={0.7}>
        <Text style={styles.ctaText}>keep me in the loop →</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={onNext} style={styles.skip} activeOpacity={0.7}>
        <Text style={styles.skipText}>maybe later</Text>
      </TouchableOpacity>

      <ProgressBar
        currentStep={currentStep}
        totalSteps={totalSteps}
        onBack={onBack}
        onNext={onNext}
        nextLabel="skip"
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
    marginBottom: 10,
  },
  body: {
    fontFamily: t.fontSerif.lightItalic,
    fontSize: 17,
    color: t.textSec,
    lineHeight: 26,
    marginBottom: 20,
  },
  cta: {
    paddingVertical: 6,
    marginBottom: 8,
  },
  ctaText: {
    fontFamily: t.fontSans.regular,
    fontSize: 15,
    color: t.accent,
    letterSpacing: 0.3,
  },
  skip: {
    paddingVertical: 4,
  },
  skipText: {
    fontFamily: t.fontSans.light,
    fontSize: 12,
    color: t.placeholder,
  },
});
