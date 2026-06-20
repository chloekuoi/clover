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
import * as AppleAuthentication from 'expo-apple-authentication';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AuthStackParamList } from '../../navigation/AuthStack';
import { useAuth } from '../../context/AuthContext';
import { isExpoGo } from '../../utils/runtime';
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
  navigation: NativeStackNavigationProp<AuthStackParamList, 'Login'>;
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

export default function LoginScreen({ navigation }: Props) {
  const { signIn, signInWithApple } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const insets = useSafeAreaInsets();

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      Alert.alert('Missing fields', 'Please enter both email and password.');
      return;
    }
    setLoading(true);
    const { error } = await signIn(email.trim(), password);
    setLoading(false);
    if (error) {
      Alert.alert('Login failed', error.message);
    }
  };

  const handleAppleSignIn = async () => {
    setLoading(true);
    const { error } = await signInWithApple();
    setLoading(false);
    if (error) {
      Alert.alert('Apple Sign-In failed', error.message);
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
          onPress={() => navigation.goBack()}
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
        <Text style={styles.heading}>{'Welcome\nback'}</Text>
        <Text style={styles.subheading}>Sign in to continue</Text>

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
          autoComplete="password"
        />

        <TouchableOpacity
          style={[styles.primaryButton, loading && styles.buttonDisabled]}
          onPress={handleLogin}
          disabled={loading}
          activeOpacity={0.85}
        >
          {loading ? (
            <ActivityIndicator color={CLOVER_BG} />
          ) : (
            <Text style={styles.primaryButtonText}>Sign In</Text>
          )}
        </TouchableOpacity>

        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerLabel}>or</Text>
          <View style={styles.dividerLine} />
        </View>

        {Platform.OS === 'ios' && !isExpoGo && (
          <View pointerEvents={loading ? 'none' : 'auto'} style={loading ? styles.appleButtonDisabled : undefined}>
            <AppleAuthentication.AppleAuthenticationButton
              buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
              buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
              cornerRadius={9999}
              style={styles.appleButton}
              onPress={handleAppleSignIn}
            />
          </View>
        )}

        <View style={styles.signUpRow}>
          <Text style={styles.signUpPrompt}>Don't have an account?</Text>
          <TouchableOpacity
            onPress={() => navigation.navigate('Signup')}
            activeOpacity={0.7}
          >
            <Text style={styles.signUpLink}>Sign up</Text>
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

  appleButton: {
    height: 52,
    width: '100%',
  },

  appleButtonDisabled: {
    opacity: 0.6,
  },

  signUpRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
    marginTop: 14,
  },

  signUpPrompt: {
    fontFamily: FONT_DM_SANS_LIGHT,
    fontSize: 12,
    color: 'rgba(12,31,14,0.35)',
  },

  signUpLink: {
    fontFamily: FONT_CORMORANT_LIGHT_ITALIC,
    fontSize: 15,
    color: CLOVER_FOREST,
    opacity: 0.65,
  },
});
