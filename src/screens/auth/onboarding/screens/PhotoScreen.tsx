import React from 'react';
import {
  Dimensions,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { onboardingTheme as t } from '../theme';
import { ProgressBar } from '../components/ProgressBar';
import { TypewriterText } from '../components/TypewriterText';
import { pickImage } from '../../../../services/photoService';
import type { ScreenProps } from '../CinematicOnboardingFlow';

const { width: WINDOW_WIDTH } = Dimensions.get('window');
const AVAILABLE_WIDTH = WINDOW_WIDTH - 2 * t.screenPaddingH;
const SLOT_GAP = 6;
const SLOT_SIZE = (AVAILABLE_WIDTH - 2 * SLOT_GAP) / 3;

export function PhotoScreen({ state, setState, onNext, onBack, currentStep, totalSteps }: ScreenProps) {
  const handlePickPhoto = async (position: number) => {
    const { uri, error } = await pickImage();
    if (error || !uri) return;
    setState(s => {
      const next = [...s.photoUris];
      next[position] = uri;
      return { ...s, photoUris: next };
    });
  };

  const renderSlot = (position: number) => {
    const uri = state.photoUris[position];
    const isPrimary = position === 0;

    return (
      <TouchableOpacity
        key={position}
        style={[styles.slot, isPrimary && styles.slotPrimary]}
        onPress={() => handlePickPhoto(position)}
        activeOpacity={0.7}
      >
        {uri ? (
          <Image source={{ uri }} style={StyleSheet.absoluteFillObject} resizeMode="cover" />
        ) : (
          <View style={styles.slotContent}>
            <Text style={styles.slotPlus}>+</Text>
            {isPrimary ? <Text style={styles.slotLabel}>primary photo</Text> : null}
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.screen}>
      <Text style={styles.wordmark}>clover</Text>
      <View style={styles.spacer} />

      <TypewriterText
        text="who's behind the work?"
        style={styles.question}
        startDelay={300}
      />

      <Text style={styles.subtitle}>add up to 5 photos</Text>

      <View style={styles.gridRow}>
        {renderSlot(0)}
        {renderSlot(1)}
        {renderSlot(2)}
      </View>
      <View style={styles.gridRow}>
        {renderSlot(3)}
        {renderSlot(4)}
        <View style={styles.slotSpacer} />
      </View>

      <ProgressBar
        currentStep={currentStep}
        totalSteps={totalSteps}
        onBack={onBack}
        onNext={state.photoUris.some(uri => !!uri) ? onNext : undefined}
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
    marginBottom: 6,
  },
  subtitle: {
    fontFamily: t.fontSans.light,
    fontSize: 13,
    color: t.placeholder,
    marginBottom: 14,
  },
  gridRow: {
    flexDirection: 'row',
    gap: SLOT_GAP,
    marginBottom: SLOT_GAP,
  },
  slot: {
    width: SLOT_SIZE,
    height: SLOT_SIZE,
    borderRadius: 8,
    backgroundColor: 'rgba(12,31,14,0.06)',
    overflow: 'hidden',
  },
  slotPrimary: {
    backgroundColor: 'rgba(30,61,40,0.10)',
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: t.accentDark,
  },
  slotContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 6,
  },
  slotPlus: {
    fontFamily: t.fontSans.light,
    fontSize: 22,
    color: t.placeholder,
    marginBottom: 4,
  },
  slotLabel: {
    fontFamily: t.fontSerif.light,
    fontSize: 11,
    color: t.muted,
    textAlign: 'center',
    lineHeight: 15,
  },
  slotSpacer: {
    width: SLOT_SIZE,
    height: SLOT_SIZE,
    backgroundColor: 'transparent',
  },
});
