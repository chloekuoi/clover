import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { onboardingTheme as t } from '../theme';

interface ProgressBarProps {
  currentStep: number;   // 0-indexed
  totalSteps: number;
  onBack?: () => void;
  onNext?: () => void;   // undefined = arrow hidden
  nextLabel?: string;    // defaults to '→'
  backDisabled?: boolean;
}

export function ProgressBar({
  currentStep,
  totalSteps,
  onBack,
  onNext,
  nextLabel = '→',
  backDisabled = false,
}: ProgressBarProps) {
  const progress = totalSteps > 0 ? (currentStep + 1) / totalSteps : 0;

  return (
    <View style={styles.container}>
      {/* Back arrow */}
      <TouchableOpacity
        onPress={onBack}
        disabled={backDisabled || !onBack}
        style={[styles.arrow, (!onBack || backDisabled) && styles.arrowHidden]}
        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
      >
        <Text style={styles.arrowText}>←</Text>
      </TouchableOpacity>

      {/* Progress track */}
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${progress * 100}%` }]} />
      </View>

      {/* Next arrow / label */}
      <TouchableOpacity
        onPress={onNext}
        disabled={!onNext}
        style={[styles.arrow, onNext && styles.arrowActiveView, !onNext && styles.arrowHidden]}
        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
      >
        <Text style={[styles.arrowText, onNext && styles.arrowActive]}>
          {nextLabel}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingTop: 12,
  },
  track: {
    flex: 1,
    height: 1.5,
    backgroundColor: 'rgba(12,31,14,0.12)',
    borderRadius: 1,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    backgroundColor: t.accent,
    borderRadius: 1,
  },
  arrow: {
    minWidth: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: t.divider,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  arrowActiveView: {
    borderColor: t.accentDark,
  },
  arrowHidden: {
    opacity: 0,
  },
  arrowText: {
    fontFamily: t.fontSans.regular,
    fontSize: 11,
    color: t.placeholder,
    textAlign: 'center',
  },
  arrowActive: {
    color: t.accent,
  },
});
