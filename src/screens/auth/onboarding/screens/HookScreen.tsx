import React, { useState } from 'react';
import {
  Animated,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { onboardingTheme as t } from '../theme';
import { ProgressBar } from '../components/ProgressBar';
import { TypewriterText } from '../components/TypewriterText';
import type { ScreenProps } from '../CinematicOnboardingFlow';

export function HookScreen({ onNext, onBack, currentStep, totalSteps }: ScreenProps) {
  const [ctaVisible, setCtaVisible] = useState(false);
  const ctaOpacity = React.useRef(new Animated.Value(0)).current;

  const handleTypingDone = () => {
    setCtaVisible(true);
    Animated.timing(ctaOpacity, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  };

  return (
    <View style={styles.screen}>
      {/* Wordmark */}
      <Text style={styles.wordmark}>cowork</Text>

      {/* Spacer pushes content to lower third */}
      <View style={styles.spacer} />

      {/* Hook sentence */}
      <TypewriterText
        text="working alone is fine. building together is better."
        style={styles.question}
        startDelay={500}
        onFinished={handleTypingDone}
      />

      {/* CTA fades in after typing completes */}
      <Animated.View style={[styles.ctaWrap, { opacity: ctaOpacity }]}>
        <TouchableOpacity
          onPress={ctaVisible ? onNext : undefined}
          style={styles.cta}
          activeOpacity={0.7}
        >
          <Text style={styles.ctaText}>let's go →</Text>
        </TouchableOpacity>
      </Animated.View>

      {/* Progress bar — no back on first screen */}
      <ProgressBar
        currentStep={currentStep}
        totalSteps={totalSteps}
        onBack={onBack}
        onNext={ctaVisible ? onNext : undefined}
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
  ctaWrap: {
    marginBottom: 4,
  },
  cta: {
    paddingVertical: 6,
  },
  ctaText: {
    fontFamily: t.fontSans.light,
    fontSize: 13,
    color: t.accent,
    letterSpacing: 0.5,
  },
});
