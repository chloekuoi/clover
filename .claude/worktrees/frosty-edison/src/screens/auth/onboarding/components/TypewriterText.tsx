import React, { useEffect, useRef, useState } from 'react';
import { Text, TextStyle } from 'react-native';
import * as Haptics from 'expo-haptics';
import { playClick } from '../audioService';
import { onboardingTheme as t } from '../theme';

interface TypewriterTextProps {
  text: string;
  style?: TextStyle;
  charDelay?: number;       // ms between chars, default 55
  onFinished?: () => void;  // called when all chars revealed
  startDelay?: number;      // ms before first char, default 300
}

export function TypewriterText({
  text,
  style,
  charDelay = 30,
  onFinished,
  startDelay = 300,
}: TypewriterTextProps) {
  const [displayed, setDisplayed] = useState('');
  const indexRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onFinishedRef = useRef(onFinished);

  useEffect(() => {
    onFinishedRef.current = onFinished;
  });

  useEffect(() => {
    // Reset when text changes
    setDisplayed('');
    indexRef.current = 0;

    const reveal = () => {
      if (indexRef.current >= text.length) {
        onFinishedRef.current?.();
        return;
      }

      const nextIndex = indexRef.current + 1;
      setDisplayed(text.slice(0, nextIndex));
      indexRef.current = nextIndex;

      // Haptic + audio on each character
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      playClick().catch(() => {});

      timerRef.current = setTimeout(reveal, charDelay);
    };

    timerRef.current = setTimeout(reveal, startDelay);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [text, charDelay, startDelay]); // intentionally excluding onFinished — using ref instead

  return (
    <Text
      style={[
        {
          fontFamily: t.fontSerif.light,
          fontSize: 22,
          color: t.text,
          lineHeight: 30,
          letterSpacing: -0.3,
        },
        style,
      ]}
    >
      {displayed}
    </Text>
  );
}
