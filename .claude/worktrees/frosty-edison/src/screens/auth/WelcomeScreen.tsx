import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AuthStackParamList } from '../../navigation/AuthStack';
import CloverMark from '../../components/common/CloverMark';
import {
  CLOVER_BG,
  CLOVER_FOREST,
  CLOVER_VIOLET,
  FONT_CORMORANT_LIGHT,
  FONT_CORMORANT_LIGHT_ITALIC,
  FONT_DM_SANS_MEDIUM,
} from '../../constants/clover';

type Props = {
  navigation: NativeStackNavigationProp<AuthStackParamList, 'Welcome'>;
};

export default function WelcomeScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* Ghost clover — decorative, behind all content, rotated 8° */}
      <View
        style={[styles.ghostWrap, { top: '52%', marginTop: -195 }]}
        pointerEvents="none"
      >
        <CloverMark size={390} color={CLOVER_FOREST} bg={CLOVER_BG} />
      </View>

      {/* Logo lockup — centred in the screen */}
      <View style={[styles.logoArea, { paddingTop: insets.top + 16 }]}>
        <CloverMark size={80} color={CLOVER_FOREST} bg={CLOVER_BG} />
        <Text style={styles.wordmark}>clover</Text>
        <Text style={styles.tagline}>find your clover</Text>
      </View>

      {/* CTA area — pinned to bottom */}
      <View style={[styles.cta, { paddingBottom: Math.max(insets.bottom, 46) }]}>
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => navigation.navigate('Signup')}
          activeOpacity={0.85}
        >
          <Text style={styles.primaryButtonText}>Get Started</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => navigation.navigate('Login')}
          activeOpacity={0.7}
        >
          <Text style={styles.secondaryLink}>I already have an account</Text>
        </TouchableOpacity>
      </View>

      {/* Home indicator */}
      <View
        style={[
          styles.homeIndicator,
          { marginBottom: Math.max(insets.bottom - 10, 6) },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: CLOVER_BG,
  },

  // Ghost clover: absolutely positioned, centred horizontally, ~52% from top
  ghostWrap: {
    position: 'absolute',
    left: '50%',
    marginLeft: -195,         // half of 390
    opacity: 0.065,
    transform: [{ rotate: '8deg' }],
  },

  logoArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },

  wordmark: {
    fontFamily: FONT_CORMORANT_LIGHT,
    fontSize: 42,
    letterSpacing: 42 * 0.06,   // 0.06em
    color: CLOVER_FOREST,
    marginTop: 18,
  },

  tagline: {
    fontFamily: FONT_CORMORANT_LIGHT_ITALIC,
    fontSize: 15,
    letterSpacing: 15 * 0.08,   // 0.08em
    color: CLOVER_VIOLET,
    marginTop: 10,
  },

  cta: {
    paddingHorizontal: 26,
    gap: 14,
    zIndex: 1,
  },

  primaryButton: {
    height: 58,
    borderRadius: 9999,
    backgroundColor: CLOVER_FOREST,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: CLOVER_FOREST,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.30,
    shadowRadius: 24,
    elevation: 8,
  },

  primaryButtonText: {
    fontFamily: FONT_DM_SANS_MEDIUM,
    fontSize: 15,
    letterSpacing: 15 * 0.05,   // 0.05em
    color: CLOVER_BG,
  },

  secondaryLink: {
    fontFamily: FONT_CORMORANT_LIGHT_ITALIC,
    fontSize: 15,
    letterSpacing: 15 * 0.04,   // 0.04em
    color: CLOVER_FOREST,
    opacity: 0.55,
    textAlign: 'center',
  },

  homeIndicator: {
    alignSelf: 'center',
    width: 90,
    height: 4,
    borderRadius: 2,
    backgroundColor: CLOVER_FOREST,
    opacity: 0.14,
    marginBottom: 8,
  },
});
