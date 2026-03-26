import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Animated,
  Easing,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NavigationProp, useNavigation } from '@react-navigation/native';
import { theme, spacing } from '../../constants';
import { CLOVER_FOREST, CLOVER_BG } from '../../constants/clover';
import { useAuth } from '../../context/AuthContext';
import { useLocation } from '../../hooks/useLocation';
import {
  getTodayIntent,
  fetchDiscoveryCards,
  recordSwipe,
  upsertIntent,
  getDefaultIntentTimes,
} from '../../services/discoveryService';
import { DiscoveryCard, Profile } from '../../types';
import IntentScreen from './IntentScreen';
import CardStack from '../../components/discover/CardStack';
import MatchModal from '../../components/matches/MatchModal';
import { MainTabsParamList } from '../../navigation/MainTabs';

const SHEET_HEIGHT = Dimensions.get('window').height * 0.82;

type DiscoverState = 'loading' | 'error' | 'discovering' | 'empty';

export default function DiscoverScreen() {
  const { user, profile } = useAuth();
  const { latitude, longitude, loading: locationLoading, error: locationError, refresh: refreshLocation } = useLocation();
  const navigation = useNavigation<NavigationProp<MainTabsParamList>>();

  const [state, setState] = useState<DiscoverState>('loading');
  const [cards, setCards] = useState<DiscoveryCard[]>([]);
  const [isFocusModalVisible, setIsFocusModalVisible] = useState(false);
  const [matchModal, setMatchModal] = useState<{
    visible: boolean;
    matchId: string | null;
    matchedUser: Profile | null;
  }>({
    visible: false,
    matchId: null,
    matchedUser: null,
  });

  const sheetAnim = useRef(new Animated.Value(SHEET_HEIGHT)).current;

  const openSheet = () => {
    setIsFocusModalVisible(true);
    Animated.spring(sheetAnim, {
      toValue: 0,
      damping: 25,
      stiffness: 300,
      useNativeDriver: true,
    }).start();
  };

  const closeSheet = () => {
    Animated.timing(sheetAnim, {
      toValue: SHEET_HEIGHT,
      duration: 220,
      easing: Easing.in(Easing.ease),
      useNativeDriver: true,
    }).start(() => setIsFocusModalVisible(false));
  };

  // Check intent and load cards
  const loadDiscoveryData = useCallback(async () => {
    if (!user || latitude === null || longitude === null) return;
    setState('loading');

    const todayIntent = await getTodayIntent(user.id);
    if (!todayIntent) {
      const { defaultStart, defaultEnd } = getDefaultIntentTimes();
      await upsertIntent(user.id, {
        task_description: '',
        work_style: 'Flexible',
        location_type: 'Anywhere',
        location_name: null,
        available_from: defaultStart,
        available_until: defaultEnd,
        latitude: latitude,
        longitude: longitude,
      });
    }

    const discoveryCards = await fetchDiscoveryCards(user.id, latitude, longitude);
    setState(discoveryCards.length > 0 ? 'discovering' : 'empty');
    setCards(discoveryCards);
  }, [user, latitude, longitude]);

  // Initial load and when location becomes available
  useEffect(() => {
    if (locationLoading) {
      setState('loading');
      return;
    }

    if (locationError) {
      setState('error');
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

  const renderHeader = () => (
    <View style={styles.header}>
      <Text style={styles.headerTitle}>Discover</Text>
      <TouchableOpacity
        style={styles.focusPill}
        onPress={openSheet}
        activeOpacity={0.8}
      >
        <Text style={styles.focusPillText}>✎ Focus</Text>
      </TouchableOpacity>
    </View>
  );

  const renderFocusSheet = () => {
    if (!isFocusModalVisible) return null;
    return (
      <>
        <TouchableOpacity
          style={styles.sheetOverlay}
          activeOpacity={1}
          onPress={closeSheet}
        />
        <Animated.View
          style={[styles.sheetContainer, { transform: [{ translateY: sheetAnim }] }]}
        >
          <View style={styles.sheetHandle} />
          <Text style={styles.sheetSubtitle}>Set availability to connect</Text>
          <View style={{ flex: 1 }}>
            <IntentScreen
              latitude={latitude ?? 0}
              longitude={longitude ?? 0}
              onIntentSet={() => {
                closeSheet();
                loadDiscoveryData();
              }}
              isBottomSheet
            />
          </View>
        </Animated.View>
      </>
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

  if (state === 'error') {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.centeredMessage}>
          <Text style={styles.errorTitle}>Location Required</Text>
          <Text style={styles.errorText}>
            Clover needs your location to find co-workers nearby.
          </Text>
          <TouchableOpacity style={styles.errorButton} onPress={refreshLocation}>
            <Text style={styles.errorButtonText}>Enable Location</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (state === 'empty') {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        {!matchModal.visible && (
          <>
            {renderHeader()}
            <View style={styles.centerContent}>
              <Text style={styles.emptyTitle}>No one nearby right now</Text>
              <Text style={styles.emptyText}>
                Check back later or expand your search radius
              </Text>
            </View>
          </>
        )}
        {renderMatchModal()}
        {renderFocusSheet()}
      </SafeAreaView>
    );
  }

  // State: discovering
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {renderHeader()}
      <CardStack cards={cards} onSwipe={handleSwipe} onEmpty={handleEmpty} />
      {renderMatchModal()}
      {renderFocusSheet()}
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[5],
    paddingTop: spacing[2],
    paddingBottom: spacing[4],
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: theme.text,
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
  centeredMessage: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing[6],
  },
  errorTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: theme.text,
    marginBottom: spacing[2],
    textAlign: 'center',
  },
  errorText: {
    fontSize: 16,
    color: theme.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: spacing[6],
  },
  errorButton: {
    backgroundColor: theme.primary,
    paddingHorizontal: spacing[6],
    paddingVertical: spacing[3],
    borderRadius: 100,
  },
  errorButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  focusPill: {
    backgroundColor: CLOVER_FOREST,
    borderRadius: 100,
    paddingHorizontal: spacing[3],
    paddingVertical: 6,
  },
  focusPillText: {
    color: CLOVER_BG,
    fontSize: 13,
    fontWeight: '600',
  },
  sheetOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
    zIndex: 10,
    elevation: 10,
  },
  sheetContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: SHEET_HEIGHT,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    backgroundColor: theme.background,
    zIndex: 11,
    elevation: 11,
    overflow: 'hidden',
  },
  sheetHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(0,0,0,0.12)',
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 4,
  },
  sheetSubtitle: {
    fontSize: 12,
    color: theme.textMuted,
    textAlign: 'center',
    marginBottom: 4,
  },
});
