import React, { useState } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { onboardingTheme as t } from '../theme';
import { ProgressBar } from '../components/ProgressBar';
import { TypewriterText } from '../components/TypewriterText';
import { syncContacts } from '../onboardingService';
import type { ScreenProps } from '../CinematicOnboardingFlow';

export function ContactSyncScreen({ state, setState, onNext, onBack, currentStep, totalSteps }: ScreenProps) {
  const [syncing, setSyncing] = useState(false);
  const [matchCount, setMatchCount] = useState<number | null>(null);

  const handleSync = async () => {
    if (syncing) return;
    setSyncing(true);
    try {
      const { matched } = await syncContacts();
      setMatchCount(matched);
      setState(s => ({ ...s, contactsGranted: true }));
    } catch {
      // Sync failed — still advance
    }
    // setSyncing before onNext so state setter runs while component is still mounted
    setSyncing(false);
    onNext();
  };

  return (
    <View style={styles.screen}>
      <Text style={styles.wordmark}>cowork</Text>
      <View style={styles.spacer} />

      <TypewriterText
        text="find your crew."
        style={styles.question}
        startDelay={300}
      />

      <Text style={styles.body}>
        see which of your contacts are already here. we never store your contact list — just a fingerprint.
      </Text>

      {syncing ? (
        <ActivityIndicator
          style={styles.spinner}
          color={t.accent}
          size="small"
        />
      ) : (
        <TouchableOpacity onPress={handleSync} style={styles.cta} activeOpacity={0.7}>
          <Text style={styles.ctaText}>find my crew →</Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity onPress={onNext} style={styles.skip} activeOpacity={0.7}>
        <Text style={styles.skipText}>skip for now</Text>
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
    marginBottom: 14,
  },
  body: {
    fontFamily: t.fontSans.light,
    fontSize: 13,
    color: t.muted,
    lineHeight: 20,
    marginBottom: 28,
  },
  spinner: {
    marginBottom: 24,
    alignSelf: 'flex-start',
  },
  cta: {
    paddingVertical: 6,
    marginBottom: 12,
  },
  ctaText: {
    fontFamily: t.fontSans.regular,
    fontSize: 14,
    color: t.accent,
    letterSpacing: 0.3,
  },
  skip: {
    paddingVertical: 4,
    marginBottom: 8,
  },
  skipText: {
    fontFamily: t.fontSans.light,
    fontSize: 12,
    color: t.placeholder,
  },
});
