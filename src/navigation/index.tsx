import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import AuthStack from './AuthStack';
import MainTabs from './MainTabs';
import { useAuth } from '../context/AuthContext';
import { theme } from '../constants';

export default function RootNavigator() {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  // User is logged in but hasn't completed onboarding.
  // This path also covers Apple Sign-In new users: signInWithIdToken creates the
  // auth.users row and fires onAuthStateChange, but no profile row exists yet
  // (PGRST116 → profile = null), so needsOnboarding is true → Onboarding renders.
  // Returning Apple users with profile.onboarding_complete = true go straight to MainTabs.
  const needsOnboarding = user && !profile?.onboarding_complete;

  return (
    <NavigationContainer>
      {user && profile?.onboarding_complete ? (
        <MainTabs />
      ) : (
        <AuthStack needsOnboarding={!!needsOnboarding} />
      )}
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.background,
  },
});
