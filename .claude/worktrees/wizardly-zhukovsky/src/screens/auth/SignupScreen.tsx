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
import { theme, spacing, borderRadius, touchTarget } from '../../constants';
import { AuthStackParamList } from '../../navigation/AuthStack';
import { useAuth } from '../../context/AuthContext';

type Props = {
  navigation: NativeStackNavigationProp<AuthStackParamList, 'Signup'>;
};

export default function SignupScreen({ navigation }: Props) {
  const { signUp } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

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
    // If no confirmation needed, AuthContext will handle navigation via session listener
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.content}>
        <Text style={styles.title}>Create account</Text>
        <Text style={styles.subtitle}>Join the co-working community</Text>

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
            autoComplete="new-password"
          />

          <TextInput
            style={styles.input}
            placeholder="Confirm password"
            placeholderTextColor={theme.textMuted}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            autoComplete="new-password"
          />

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleSignup}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={theme.surface} />
            ) : (
              <Text style={styles.buttonText}>Create Account</Text>
            )}
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.linkButton}
          onPress={() => navigation.navigate('Login')}
        >
          <Text style={styles.linkText}>
            Already have an account? <Text style={styles.linkBold}>Sign in</Text>
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
});
