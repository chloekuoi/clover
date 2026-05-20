import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { theme, spacing, borderRadius, touchTarget } from '../../constants';
import { AuthStackParamList } from '../../navigation/AuthStack';

type Props = {
  navigation: NativeStackNavigationProp<AuthStackParamList, 'Welcome'>;
};

export default function WelcomeScreen({ navigation }: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>CoWork Connect</Text>
        <Text style={styles.tagline}>Find your people.{'\n'}Do the work.</Text>
      </View>

      <View style={styles.buttons}>
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => navigation.navigate('Signup')}
        >
          <Text style={styles.primaryButtonText}>Get Started</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => navigation.navigate('Login')}
        >
          <Text style={styles.secondaryButtonText}>I already have an account</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
    padding: spacing[6],
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: theme.text,
    marginBottom: spacing[3],
  },
  tagline: {
    fontSize: 20,
    color: theme.textSecondary,
    textAlign: 'center',
    lineHeight: 28,
  },
  buttons: {
    gap: spacing[3],
    paddingBottom: spacing[8],
  },
  primaryButton: {
    backgroundColor: theme.primary,
    paddingVertical: spacing[4],
    borderRadius: borderRadius.md,
    alignItems: 'center',
    minHeight: touchTarget.min,
    justifyContent: 'center',
  },
  primaryButtonText: {
    color: theme.surface,
    fontSize: 18,
    fontWeight: '600',
  },
  secondaryButton: {
    paddingVertical: spacing[4],
    alignItems: 'center',
    minHeight: touchTarget.min,
    justifyContent: 'center',
  },
  secondaryButtonText: {
    color: theme.accent,
    fontSize: 16,
    fontWeight: '500',
  },
});
