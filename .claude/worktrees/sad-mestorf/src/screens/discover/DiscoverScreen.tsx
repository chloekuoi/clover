import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NavigationProp, useNavigation } from '@react-navigation/native';
import { theme, spacing } from '../../constants';
import { useAuth } from '../../context/AuthContext';
import { useLocation } from '../../hooks/useLocation';
import {
  getTodayIntent,
  fetchDiscoveryCards,
  recordSwipe,
} from '../../services/discoveryService';
import { DiscoveryCard, WorkIntent, Profile } from '../../types';
import IntentScreen from './IntentScreen';
import CardStack from '../../components/discover/CardStack';
import MatchModal from '../../components/matches/MatchModal';
import { MainTabsParamList } from '../../navigation/MainTabs';
type DiscoverState = 'loading' | 'needs_intent' | 'discovering' | 'empty';

export default function DiscoverScreen() {
  const { user, profile } = useAuth();
  const { latitude, longitude, loading: locationLoading, error: locationError, refresh: refreshLocation } = useLocation();
  const navigation = useNavigation<NavigationProp<MainTabsParamList>>();

  const [state, setState] = useState<DiscoverState>('loading');
  const [intent, setIntent] = useState<WorkIntent | null>(null);
  const [cards, setCards] = useState<DiscoveryCard[]>([]);
  const [matchModal, setMatchModal] = useState<{
    visible: boolean;
    matchId: string | null;
    matchedUser: Profile | null;
  }>({
    visible: false,
    matchId: null,
    matchedUser: null,
  });

  // Check intent and load cards
  const loadDiscoveryData = useCallback(async () => {
    if (!user || latitude === null || longitude === null) return;

    setState('loading');

    // Check if user has set today's intent
    const todayIntent = await getTodayIntent(user.id);

    if (!todayIntent) {
      setState('needs_intent');
      return;
    }

    setIntent(todayIntent);

    // Fetch discovery cards
    const discoveryCards = await fetchDiscoveryCards(user.id, latitude, longitude);

    setCards(discoveryCards);
    setState(discoveryCards.length > 0 ? 'discovering' : 'empty');
  }, [user, latitude, longitude]);

  // Initial load and when location becomes available
  useEffect(() => {
    if (locationLoading) {
      setState('loading');
      return;
    }

    if (locationError) {
      setState('needs_intent');
      return;
    }

    if (user) {
      loadDiscoveryData();
    }
  }, [user, latitude, longitude, locationLoading, locationError, loadDiscoveryData]);

  // Handle swipe
  const handleSwipe = async (card: DiscoveryCard, direction: 'left' | 'right') => {
    if (!user) return;

    const { isMatch, error, matchId, matchedUser } = await recordSwipe(
      user.id,
      card.profile.id,
      direction
    );

    if (error) {
      console.error('Failed to record swipe:', error);
      return;
    }

    const resolvedMatchedUser = matchedUser || card.profile;
    if (isMatch && matchId && resolvedMatchedUser && profile) {
      setMatchModal({
        visible: true,
        matchId,
        matchedUser: resolvedMatchedUser,
      });
    }
  };

  // Handle when all cards are swiped
  const handleEmpty = () => {
    setState('empty');
  };

  // Handle intent set
  const handleIntentSet = () => {
    loadDiscoveryData();
  };

  const renderMatchModal = () => {
    if (!profile || !matchModal.matchedUser || !matchModal.matchId) return null;
    return (
      <MatchModal
        visible={matchModal.visible}
        currentUser={profile}
        matchedUser={matchModal.matchedUser}
        matchId={matchModal.matchId}
        onDismiss={() => setMatchModal({ visible: false, matchId: null, matchedUser: null })}
        onSendMessage={(matchId, matchedUser) => {
          setMatchModal({ visible: false, matchId: null, matchedUser: null });
          navigation.navigate('Matches', {
            screen: 'Chat',
            params: { matchId, otherUser: matchedUser },
          });
        }}
      />
    );
  };

  // Render based on state
  if (state === 'loading') {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={styles.loadingText}>Finding co-workers nearby...</Text>
        </View>
        {renderMatchModal()}
      </SafeAreaView>
    );
  }

  if (state === 'needs_intent') {
    return (
      <>
        <IntentScreen
          latitude={latitude ?? 0}
          longitude={longitude ?? 0}
          onIntentSet={handleIntentSet}
          locationLoading={locationLoading}
          locationError={locationError}
          onRequestLocation={refreshLocation}
        />
        {renderMatchModal()}
      </>
    );
  }

  if (state === 'empty') {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        {!matchModal.visible && (
          <>
            <View style={styles.header}>
              <Text style={styles.headerTitle}>Discover</Text>
            </View>
            <View style={styles.centerContent}>
              <Text style={styles.emptyTitle}>No one nearby right now</Text>
              <Text style={styles.emptyText}>
                Check back later or expand your search radius
              </Text>
            </View>
          </>
        )}
        {renderMatchModal()}
      </SafeAreaView>
    );
  }

  // State: discovering
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Discover</Text>
      </View>

      <CardStack
        cards={cards}
        onSwipe={handleSwipe}
        onEmpty={handleEmpty}
      />
      {renderMatchModal()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  centerContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing[6],
  },
  loadingText: {
    marginTop: spacing[2],
    fontSize: 14,
    color: theme.textSecondary,
  },
  header: {
    paddingHorizontal: spacing[5],
    paddingTop: spacing[2],
    paddingBottom: spacing[4],
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: theme.text,
  },
  headerSubtitle: {
    fontSize: 14,
    color: theme.textSecondary,
    marginTop: spacing[1],
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: theme.text,
    marginBottom: spacing[2],
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: theme.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: spacing[6],
  },
  button: {
    minWidth: 200,
  },
});
