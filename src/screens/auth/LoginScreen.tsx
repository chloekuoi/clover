import React, { useState } from 'react';
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
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as AppleAuthentication from 'expo-apple-authentication';
import { theme, spacing, borderRadius, touchTarget } from '../../constants';
import { AuthStackParamList } from '../../navigation/AuthStack';
import { useAuth } from '../../context/AuthContext';

type Props = {
  navigation: NativeStackNavigationProp<AuthStackParamList, 'Login'>;
};

export default function LoginScreen({ navigation }: Props) {
  const { signIn, signInWithApple } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

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
      <View style={styles.content}>
        <Text style={styles.title}>Welcome back</Text>
        <Text style={styles.subtitle}>Sign in to continue</Text>

        <View style={styles.form}>
          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor={theme.textMuted}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
          />

          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor={theme.textMuted}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoComplete="password"
          />

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={theme.surface} />
            ) : (
              <Text style={styles.buttonText}>Sign In</Text>
            )}
          </TouchableOpacity>
        </View>

        {Platform.OS === 'ios' && (
          <>
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or</Text>
              <View style={styles.dividerLine} />
            </View>
            <View pointerEvents={loading ? 'none' : 'auto'} style={loading ? styles.appleButtonDisabled : undefined}>
              <AppleAuthentication.AppleAuthenticationButton
                buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
                buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
                cornerRadius={9999}
                style={styles.appleButton}
                onPress={handleAppleSignIn}
              />
            </View>
          </>
        )}

        <TouchableOpacity
          style={styles.linkButton}
          onPress={() => navigation.navigate('Signup')}
        >
          <Text style={styles.linkText}>
            Don't have an account? <Text style={styles.linkBold}>Sign up</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  content: {
    flex: 1,
    padding: spacing[6],
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: theme.text,
    marginBottom: spacing[1],
  },
  subtitle: {
    fontSize: 16,
    color: theme.textSecondary,
    marginBottom: spacing[8],
  },
  form: {
    gap: spacing[4],
  },
  input: {
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: '#E2DDD6',
    borderRadius: borderRadius.md,
    padding: spacing[4],
    fontSize: 16,
    color: theme.text,
    minHeight: touchTarget.min,
  },
  button: {
    backgroundColor: theme.primary,
    paddingVertical: spacing[4],
    borderRadius: borderRadius.md,
    alignItems: 'center',
    marginTop: spacing[2],
    minHeight: touchTarget.min,
    justifyContent: 'center',
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: theme.surface,
    fontSize: 18,
    fontWeight: '600',
  },
  linkButton: {
    marginTop: spacing[6],
    alignItems: 'center',
    minHeight: touchTarget.min,
    justifyContent: 'center',
  },
  linkText: {
    fontSize: 16,
    color: theme.textSecondary,
  },
  linkBold: {
    color: theme.accent,
    fontWeight: '600',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing[6],
    marginBottom: spacing[4],
    gap: spacing[3],
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E2DDD6',
  },
  dividerText: {
    fontSize: 13,
    color: theme.textMuted,
  },
  appleButton: {
    height: 52,
    width: '100%',
  },
  appleButtonDisabled: {
    opacity: 0.6,
  },
});
