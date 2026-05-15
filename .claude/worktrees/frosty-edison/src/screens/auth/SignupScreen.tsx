import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  StatusBar,
  Animated,
  Easing,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AuthStackParamList } from '../../navigation/AuthStack';
import { useAuth } from '../../context/AuthContext';
import CloverMark from '../../components/common/CloverMark';
import {
  CLOVER_BG,
  CLOVER_FOREST,
  FONT_CORMORANT_LIGHT,
  FONT_CORMORANT_LIGHT_ITALIC,
  FONT_DM_SANS_LIGHT,
  FONT_DM_SANS_MEDIUM,
} from '../../constants/clover';

type Props = {
  navigation: NativeStackNavigationProp<AuthStackParamList, 'Signup'>;
};

function SpinningMiniClover() {
  const spin = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.timing(spin, { toValue: 1, duration: 8000, easing: Easing.linear, useNativeDriver: true })
    ).start();
  }, [spin]);
  const rotate = spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  return (
    <Animated.View style={{ transform: [{ rotate }] }}>
      <CloverMark size={20} color={CLOVER_FOREST} bg={CLOVER_BG} />
    </Animated.View>
  );
}

export default function SignupScreen({ navigation }: Props) {
  const { signUp } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const insets = useSafeAreaInsets();

  const handleSignup = async () => {
    if (!email.trim() || !password || !confirmPassword) {
      Alert.alert('Missing fields', 'Please fill in all fields.');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Password mismatch', 'Passwords do not match.');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Weak password', 'Password must be at least 6 characters.');
      return;
    }
    setLoading(true);
    const { error, needsConfirmation } = await signUp(email.trim(), password);
    setLoading(false);
    if (error) {
      Alert.alert('Signup failed', error.message);
    } else if (needsConfirmation) {
      Alert.alert(
        'Check your email',
        'We sent you a confirmation link. Please check your email to complete signup.',
        [{ text: 'OK', onPress: () => navigation.navigate('Login') }]
      );
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar barStyle="dark-content" />

      {/* Ghost clover — bottom-right corner decoration */}
      <View style={styles.ghostCorner} pointerEvents="none">
        <CloverMark size={260} color={CLOVER_FOREST} bg={CLOVER_BG} />
      </View>

      {/* Back button */}
      <View style={[styles.backRow, { paddingTop: insets.top + 16 }]}>
        <TouchableOpacity
          onPress={() => navigation.canGoBack() ? navigation.goBack() : navigation.navigate('Welcome')}
          style={styles.backBtn}
          activeOpacity={0.6}
        >
          <Text style={styles.backChevron}>‹</Text>
          <Text style={styles.backLabel}>Back</Text>
        </TouchableOpacity>
      </View>

      {/* Mini logo lockup */}
      <View style={styles.miniLockup}>
        <SpinningMiniClover />
        <Text style={styles.miniWordmark}>clover</Text>
      </View>

      {/* Main content */}
      <View style={styles.content}>
        <Text style={styles.heading}>{'Create\naccount'}</Text>
        <Text style={styles.subheading}>Join the co-working community</Text>

        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor="rgba(12,31,14,0.28)"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          autoComplete="email"
        />

        <View style={styles.inputGap} />

        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor="rgba(12,31,14,0.28)"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoComplete="new-password"
        />

        <View style={styles.inputGap} />

        <TextInput
          style={styles.input}
          placeholder="Confirm password"
          placeholderTextColor="rgba(12,31,14,0.28)"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
          autoComplete="new-password"
        />

        <TouchableOpacity
          style={[styles.primaryButton, loading && styles.buttonDisabled]}
          onPress={handleSignup}
          disabled={loading}
          activeOpacity={0.85}
        >
          {loading ? (
            <ActivityIndicator color={CLOVER_BG} />
          ) : (
            <Text style={styles.primaryButtonText}>Create Account</Text>
          )}
        </TouchableOpacity>

        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerLabel}>or</Text>
          <View style={styles.dividerLine} />
        </View>

        <View style={styles.signInRow}>
          <Text style={styles.signInPrompt}>Already have an account?</Text>
          <TouchableOpacity
            onPress={() => navigation.navigate('Login')}
            activeOpacity={0.7}
          >
            <Text style={styles.signInLink}>Sign in</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: CLOVER_BG,
  },

  ghostCorner: {
    position: 'absolute',
    bottom: -72,
    right: -72,
    opacity: 0.05,
  },

  backRow: {
    paddingHorizontal: 22,
  },

  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
  },

  backChevron: {
    fontSize: 20,
    color: CLOVER_FOREST,
    opacity: 0.40,
    lineHeight: 20,
  },

  backLabel: {
    fontFamily: FONT_DM_SANS_LIGHT,
    fontSize: 13,
    color: CLOVER_FOREST,
    opacity: 0.45,
  },

  miniLockup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 26,
    paddingTop: 18,
  },

  miniWordmark: {
    fontFamily: FONT_CORMORANT_LIGHT,
    fontSize: 20,
    letterSpacing: 20 * 0.06,
    color: CLOVER_FOREST,
    opacity: 0.65,
  },

  content: {
    flex: 1,
    paddingHorizontal: 26,
    paddingTop: 24,
  },

  heading: {
    fontFamily: FONT_CORMORANT_LIGHT,
    fontSize: 36,
    lineHeight: 36 * 1.08,
    color: CLOVER_FOREST,
  },

  subheading: {
    fontFamily: FONT_DM_SANS_LIGHT,
    fontSize: 13,
    color: 'rgba(12,31,14,0.38)',
    marginBottom: 28,
    marginTop: 4,
  },

  input: {
    height: 52,
    backgroundColor: 'rgba(255,255,255,0.72)',
    borderWidth: 1.5,
    borderColor: 'rgba(12,31,14,0.08)',
    borderRadius: 14,
    paddingHorizontal: 18,
    fontFamily: FONT_DM_SANS_LIGHT,
    fontSize: 13,
    color: CLOVER_FOREST,
    shadowColor: CLOVER_FOREST,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
  },

  inputGap: {
    height: 10,
  },

  primaryButton: {
    height: 58,
    borderRadius: 9999,
    backgroundColor: CLOVER_FOREST,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    shadowColor: CLOVER_FOREST,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.30,
    shadowRadius: 24,
    elevation: 8,
  },

  buttonDisabled: {
    opacity: 0.6,
  },

  primaryButtonText: {
    fontFamily: FONT_DM_SANS_MEDIUM,
    fontSize: 15,
    letterSpacing: 15 * 0.05,
    color: CLOVER_BG,
  },

  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 18,
    gap: 10,
  },

  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(12,31,14,0.09)',
  },

  dividerLabel: {
    fontFamily: FONT_DM_SANS_LIGHT,
    fontSize: 11,
    letterSpacing: 11 * 0.06,
    color: 'rgba(12,31,14,0.28)',
  },

  signInRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
    marginTop: 14,
  },

  signInPrompt: {
    fontFamily: FONT_DM_SANS_LIGHT,
    fontSize: 12,
    color: 'rgba(12,31,14,0.35)',
  },

  signInLink: {
    fontFamily: FONT_CORMORANT_LIGHT_ITALIC,
    fontSize: 15,
    color: CLOVER_FOREST,
    opacity: 0.65,
  },
});
