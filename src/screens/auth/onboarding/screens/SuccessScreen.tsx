import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useAuth } from '../../../../context/AuthContext';
import { onboardingTheme as t } from '../theme';
import { TypewriterText } from '../components/TypewriterText';
import { completeOnboarding } from '../onboardingService';
import type { ScreenProps } from '../CinematicOnboardingFlow';

const ARCHETYPES = [
  'The Deep Worker',
  'The Connector',
  'The Wanderer',
  'The Builder',
  'The Focused One',
  'The Collaborator',
  'The Creator',
  'The Explorer',
];

export function SuccessScreen({ state, onComplete }: ScreenProps) {
  const { user } = useAuth();
  const [saving, setSaving] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [archetype] = useState(
    () => ARCHETYPES[Math.floor(Math.random() * ARCHETYPES.length)]
  );
  const badgeOpacity = useRef(new Animated.Value(0)).current;
  const isMounted = useRef(true);

  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  const save = async () => {
    if (!user) return;
    if (!isMounted.current) return;
    setSaving(true);
    setError(null);
    try {
      await completeOnboarding(user.id, state);
      if (!isMounted.current) return;
      setSaving(false);
      // Fade in the badge
      Animated.timing(badgeOpacity, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }).start();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'something went wrong';
      if (isMounted.current) setError(msg);
      if (isMounted.current) setSaving(false);
    }
  };

  useEffect(() => {
    save();
  }, []);

  if (saving) {
    return (
      <View style={styles.screen}>
        <View style={styles.spacer} />
        <Text style={styles.saving}>saving your profile...</Text>
        <View style={styles.spacer} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.screen}>
        <View style={styles.spacer} />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity onPress={save} style={styles.cta}>
          <Text style={styles.ctaText}>try again →</Text>
        </TouchableOpacity>
        <View style={styles.spacer} />
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <Text style={styles.wordmark}>cowork</Text>
      <View style={styles.spacer} />

      <TypewriterText
        text="welcome to cowork."
        style={styles.question}
        startDelay={300}
      />

      <Animated.View style={[styles.badge, { opacity: badgeOpacity }]}>
        <Text style={styles.badgeLabel}>your archetype</Text>
        <Text style={styles.badgeValue}>{archetype}</Text>
      </Animated.View>

      <TouchableOpacity onPress={onComplete} style={styles.cta} activeOpacity={0.7}>
        <Text style={styles.ctaText}>let's find your people →</Text>
      </TouchableOpacity>
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
  saving: {
    fontFamily: t.fontSerif.lightItalic,
    fontSize: 14,
    color: t.placeholder,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  errorText: {
    fontFamily: t.fontSans.light,
    fontSize: 13,
    color: t.muted,
    marginBottom: 16,
  },
  question: {
    fontSize: 24,
    lineHeight: 32,
    marginBottom: 24,
  },
  badge: {
    borderWidth: 1,
    borderColor: t.divider,
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 28,
    alignSelf: 'flex-start',
  },
  badgeLabel: {
    fontFamily: t.fontSans.light,
    fontSize: 9,
    color: t.placeholder,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  badgeValue: {
    fontFamily: t.fontSerif.regular,
    fontSize: 18,
    color: t.text,
    letterSpacing: 0.3,
  },
  cta: {
    paddingVertical: 6,
  },
  ctaText: {
    fontFamily: t.fontSans.regular,
    fontSize: 14,
    color: t.accent,
    letterSpacing: 0.3,
  },
});
