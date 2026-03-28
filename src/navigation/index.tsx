import React, { useRef, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { Animated, Easing, View, StyleSheet } from 'react-native';
import AuthStack from './AuthStack';
import MainTabs from './MainTabs';
import { useAuth } from '../context/AuthContext';
import CloverMark from '../components/common/CloverMark';
import { CLOVER_BG } from '../constants/clover';

function SpinningClover() {
  const spin = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.timing(spin, {
        toValue: 1,
        duration: 3000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();
  }, [spin]);
  const rotate = spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  return (
    <Animated.View style={{ transform: [{ rotate }] }}>
      <CloverMark size={72} />
    </Animated.View>
  );
}

export default function RootNavigator() {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return (
      <View style={styles.loading}>
        <SpinningClover />
      </View>
    );
  }

  // User is logged in but hasn't completed onboarding
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
    backgroundColor: CLOVER_BG,
  },
});
