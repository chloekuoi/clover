import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  FlatList,
  Image,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme, spacing } from '../../constants';
import {
  CLOVER_FOREST,
  CLOVER_VIOLET,
  CLOVER_LAVENDER,
  FONT_CORMORANT_LIGHT,
  FONT_DM_SANS_LIGHT,
  FONT_DM_SANS_MEDIUM,
} from '../../constants/clover';
import { useAuth } from '../../context/AuthContext';
import { useLocation } from '../../hooks/useLocation';
import { fetchDiscoveryCards, getTodayIntent } from '../../services/discoveryService';
import { sendInvite, getSentInvitesToday } from '../../services/inviteService';
import { sendFriendRequest, getRelationshipStatuses } from '../../services/friendsService';
import { DiscoveryCard, WorkIntent } from '../../types';
import IntentScreen from './IntentScreen';
import DiscoverProfileView from '../../components/discover/UserProfileModal';
import CloverMark from '../../components/common/CloverMark';
import LocationSearchModal, { SearchedPlace } from '../../components/discover/LocationSearchModal';

type DiscoverState = 'loading' | 'error' | 'ready';

type BrowseLocation = SearchedPlace | null;

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatTime(timeStr: string): string {
  const [h, m] = timeStr.split(':');
  const hour = parseInt(h, 10);
  const period = hour >= 12 ? 'PM' : 'AM';
  const display = hour % 12 === 0 ? 12 : hour % 12;
  return `${display}:${m} ${period}`;
}

function formatDistance(km: number): string {
  if (km <= 0) return '';
  if (km < 1) return '< 1 km';
  return `${Math.round(km)} km`;
}

// ── Card ─────────────────────────────────────────────────────────────────────

function PersonCard({ card, onPress }: { card: DiscoveryCard; onPress: () => void }) {
  const { profile, intent, distance, photos } = card;
  const photoUrl = photos[0]?.photo_url || profile.photo_url || undefined;
  const distanceLabel = formatDistance(distance);

  let venueLine: string | null = null;
  if (intent) {
    const venue = intent.location_name || intent.location_type;
    const time =
      intent.available_from && intent.available_until
        ? `${formatTime(intent.available_from)} – ${formatTime(intent.available_until)}`
        : null;
    venueLine = [venue, time].filter(Boolean).join(' · ');
  }

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.85}>
      {photoUrl ? (
        <Image source={{ uri: photoUrl }} style={styles.cardPhoto} />
      ) : (
        <View style={[styles.cardPhoto, styles.cardPhotoEmpty]} />
      )}
      <View style={styles.cardBody}>
        <View style={styles.cardTopRow}>
          <Text style={styles.cardName} numberOfLines={1}>
            {profile.name || profile.username}
          </Text>
          {distanceLabel ? <Text style={styles.cardDistance}>{distanceLabel}</Text> : null}
        </View>
        {venueLine ? (
          <Text style={styles.cardVenue} numberOfLines={1}>
            {venueLine}
          </Text>
        ) : null}
        {intent?.task_description ? (
          <Text style={styles.cardIntent} numberOfLines={2}>
            {intent.task_description}
          </Text>
        ) : null}
      </View>
    </TouchableOpacity>
  );
}

// ── Main screen ──────────────────────────────────────────────────────────────

export default function DiscoverScreen() {
  const { user } = useAuth();
  const {
    latitude,
    longitude,
    loading: locationLoading,
    error: locationError,
    refresh: refreshLocation,
  } = useLocation();

  const [state, setState] = useState<DiscoverState>('loading');
  const [cards, setCards] = useState<DiscoveryCard[]>([]);
  const [todayIntent, setTodayIntent] = useState<WorkIntent | null>(null);
  const [browseLocation, setBrowseLocation] = useState<BrowseLocation>(null);
  const [sentInviteIds, setSentInviteIds] = useState<Set<string>>(new Set());
  const [friendReqIds, setFriendReqIds] = useState<Set<string>>(new Set());
  const [friendIds, setFriendIds] = useState<Set<string>>(new Set());

  const [isFocusExpanded, setIsFocusExpanded] = useState(false);
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const [selectedCard, setSelectedCard] = useState<DiscoveryCard | null>(null);

  // Effective browse center
  const centerLat = browseLocation?.latitude ?? latitude;
  const centerLng = browseLocation?.longitude ?? longitude;

  const loadData = useCallback(async () => {
    if (!user || centerLat === null || centerLng === null) return;
    setState('loading');

    const [discoveryCards, intent, sentIds] = await Promise.all([
      fetchDiscoveryCards(user.id, centerLat, centerLng),
      getTodayIntent(user.id),
      getSentInvitesToday(user.id),
    ]);

    const sentSet = new Set(sentIds);
    setSentInviteIds(sentSet);
    setTodayIntent(intent);
    const visibleCards = discoveryCards.filter((c) => !sentSet.has(c.profile.id));
    setCards(visibleCards);

    // Determine existing friend relationships so the "Add friend" link reflects state.
    const cardIds = visibleCards.map((c) => c.profile.id);
    const { data: statuses } = await getRelationshipStatuses(user.id, cardIds);
    const friendsSet = new Set<string>();
    const pendingSet = new Set<string>();
    for (const id of cardIds) {
      if (statuses[id] === 'friends') friendsSet.add(id);
      else if (statuses[id] === 'pending_sent') pendingSet.add(id);
    }
    setFriendIds(friendsSet);
    setFriendReqIds(pendingSet);

    setState('ready');
  }, [user, centerLat, centerLng]);

  useEffect(() => {
    if (locationLoading) {
      setState('loading');
      return;
    }
    if (locationError && !browseLocation) {
      setState('error');
      return;
    }
    if (user) loadData();
  }, [user, centerLat, centerLng, locationLoading, locationError, browseLocation, loadData]);

  const handleInvite = async () => {
    if (!user || !selectedCard) return;
    const receiverId = selectedCard.profile.id;
    await sendInvite(user.id, receiverId);
    setSentInviteIds((prev) => new Set(prev).add(receiverId));
  };

  const handleAddFriend = async () => {
    if (!user || !selectedCard) return;
    const recipientId = selectedCard.profile.id;
    if (friendIds.has(recipientId) || friendReqIds.has(recipientId)) return;
    setFriendReqIds((prev) => new Set(prev).add(recipientId));
    const { error } = await sendFriendRequest(user.id, recipientId);
    if (error) {
      // Roll back the optimistic state if the request failed.
      setFriendReqIds((prev) => {
        const next = new Set(prev);
        next.delete(recipientId);
        return next;
      });
    }
  };

  const inviteSentForSelected = selectedCard ? sentInviteIds.has(selectedCard.profile.id) : false;
  const friendStatusForSelected: 'none' | 'pending_sent' | 'friends' = selectedCard
    ? friendIds.has(selectedCard.profile.id)
      ? 'friends'
      : friendReqIds.has(selectedCard.profile.id)
      ? 'pending_sent'
      : 'none'
    : 'none';

  // ── Header + pills ───────────────────────────────────────────────────────────

  const renderHeader = () => {
    const hasFocus = !!todayIntent?.task_description;
    const locName = browseLocation?.name ?? 'Here';
    const locSub = browseLocation?.address ?? 'your current location';

    return (
      <View style={styles.headerWrap}>
        <View style={styles.titleRow}>
          <Text style={styles.headerTitle}>Discover</Text>
          {state === 'ready' ? (
            <Text style={styles.headerCount}>{cards.length} working nearby</Text>
          ) : null}
        </View>

        {/* Focus pill */}
        <TouchableOpacity
          style={[styles.focusPill, hasFocus ? styles.focusPillSet : styles.focusPillUnset]}
          onPress={() => setIsFocusExpanded((prev) => !prev)}
          activeOpacity={0.85}
        >
          <CloverMark
            size={20}
            color={hasFocus ? CLOVER_LAVENDER : '#c4bce6'}
            bg={hasFocus ? CLOVER_FOREST : '#ffffff'}
          />
          <Text
            style={[styles.focusPillLabel, hasFocus ? styles.focusPillLabelSet : styles.focusPillLabelUnset]}
            numberOfLines={1}
          >
            {hasFocus ? todayIntent!.task_description : 'Today’s focus…'}
          </Text>
          <Text style={[styles.focusPillAction, hasFocus ? styles.focusPillActionSet : styles.focusPillActionUnset]}>
            {isFocusExpanded ? '▲' : hasFocus ? 'Edit' : 'Set →'}
          </Text>
        </TouchableOpacity>

        {/* Inline-expanded focus card */}
        {isFocusExpanded ? (
          <IntentScreen
            latitude={latitude ?? 0}
            longitude={longitude ?? 0}
            onIntentSet={() => {
              setIsFocusExpanded(false);
              loadData();
            }}
            onCancel={() => setIsFocusExpanded(false)}
          />
        ) : null}

        {/* Location pill */}
        <TouchableOpacity style={styles.locationPill} onPress={() => setIsSearchVisible(true)} activeOpacity={0.85}>
          <Text style={styles.locationIcon}>◎</Text>
          <View style={styles.locationTextWrap}>
            <Text style={styles.locationName} numberOfLines={1}>
              {locName}
            </Text>
            <Text style={styles.locationSub} numberOfLines={1}>
              {locSub}
            </Text>
          </View>
          {browseLocation ? (
            <TouchableOpacity onPress={() => setBrowseLocation(null)} hitSlop={10}>
              <Text style={styles.locationAction}>Clear ✕</Text>
            </TouchableOpacity>
          ) : (
            <Text style={styles.locationAction}>Change →</Text>
          )}
        </TouchableOpacity>
      </View>
    );
  };

  // ── States ───────────────────────────────────────────────────────────────────

  if (state === 'loading') {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        {renderHeader()}
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={styles.loadingText}>Finding people working nearby…</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (state === 'error') {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.centeredMessage}>
          <Text style={styles.errorTitle}>Location Required</Text>
          <Text style={styles.errorText}>
            Clover needs your location to find people working nearby.
          </Text>
          <TouchableOpacity style={styles.errorButton} onPress={refreshLocation}>
            <Text style={styles.errorButtonText}>Enable Location</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <FlatList
        data={cards}
        keyExtractor={(item) => item.profile.id}
        ListHeaderComponent={renderHeader()}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <PersonCard card={item} onPress={() => setSelectedCard(item)} />
        )}
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <Text style={styles.emptyTitle}>No one working nearby today</Text>
            <Text style={styles.emptyText}>
              Check back later or search a different location.
            </Text>
          </View>
        }
      />

      {/* Profile modal with invite */}
      <Modal
        visible={selectedCard !== null}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setSelectedCard(null)}
      >
        <View style={styles.profileModal}>
          {selectedCard ? (
            <DiscoverProfileView
              card={selectedCard}
              onInvite={handleInvite}
              inviteSent={inviteSentForSelected}
              onAddFriend={handleAddFriend}
              friendStatus={friendStatusForSelected}
            />
          ) : null}
        </View>
      </Modal>

      <LocationSearchModal
        visible={isSearchVisible}
        biasLatitude={latitude}
        biasLongitude={longitude}
        onClose={() => setIsSearchVisible(false)}
        onSelectHere={() => {
          setBrowseLocation(null);
          setIsSearchVisible(false);
        }}
        onSelectPlace={(loc) => {
          setBrowseLocation(loc);
          setIsSearchVisible(false);
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  listContent: {
    paddingBottom: 32,
  },
  centerContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing[6],
  },
  loadingText: {
    marginTop: spacing[2],
    fontFamily: FONT_DM_SANS_LIGHT,
    fontSize: 14,
    color: theme.textSecondary,
  },

  // Header
  headerWrap: {
    paddingHorizontal: 16,
    paddingTop: spacing[2],
    paddingBottom: spacing[3],
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  headerTitle: {
    fontFamily: FONT_CORMORANT_LIGHT,
    fontSize: 32,
    color: CLOVER_FOREST,
  },
  headerCount: {
    fontFamily: FONT_DM_SANS_LIGHT,
    fontSize: 13,
    color: CLOVER_VIOLET,
    marginBottom: 6,
  },

  // Focus pill
  focusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 50,
    borderRadius: 25,
    paddingHorizontal: 14,
    marginBottom: 10,
    gap: 10,
  },
  focusPillUnset: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: CLOVER_LAVENDER,
    borderStyle: 'dashed',
  },
  focusPillSet: {
    backgroundColor: CLOVER_FOREST,
  },
  focusPillLabel: {
    flex: 1,
    fontSize: 14,
  },
  focusPillLabelUnset: {
    fontFamily: FONT_DM_SANS_LIGHT,
    fontStyle: 'italic',
    color: 'rgba(30,61,40,0.5)',
  },
  focusPillLabelSet: {
    fontFamily: FONT_DM_SANS_MEDIUM,
    color: '#ffffff',
  },
  focusPillAction: {
    fontSize: 13,
  },
  focusPillActionUnset: {
    fontFamily: FONT_DM_SANS_MEDIUM,
    color: CLOVER_VIOLET,
  },
  focusPillActionSet: {
    fontFamily: FONT_DM_SANS_LIGHT,
    color: CLOVER_LAVENDER,
  },

  // Location pill
  locationPill: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 50,
    borderRadius: 25,
    paddingHorizontal: 14,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: CLOVER_LAVENDER,
    gap: 10,
  },
  locationIcon: {
    fontSize: 16,
    color: CLOVER_FOREST,
  },
  locationTextWrap: {
    flex: 1,
  },
  locationName: {
    fontFamily: FONT_DM_SANS_MEDIUM,
    fontSize: 14,
    color: CLOVER_FOREST,
  },
  locationSub: {
    fontFamily: FONT_DM_SANS_LIGHT,
    fontSize: 11,
    color: 'rgba(30,61,40,0.5)',
  },
  locationAction: {
    fontFamily: FONT_DM_SANS_MEDIUM,
    fontSize: 13,
    color: CLOVER_VIOLET,
  },

  // Card
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 14,
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 11,
    gap: 12,
  },
  cardPhoto: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  cardPhotoEmpty: {
    backgroundColor: CLOVER_LAVENDER,
  },
  cardBody: {
    flex: 1,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardName: {
    flex: 1,
    fontFamily: FONT_DM_SANS_MEDIUM,
    fontSize: 15,
    color: CLOVER_FOREST,
  },
  cardDistance: {
    fontFamily: FONT_DM_SANS_LIGHT,
    fontSize: 12,
    color: 'rgba(30,61,40,0.45)',
    marginLeft: 8,
  },
  cardVenue: {
    fontFamily: FONT_DM_SANS_LIGHT,
    fontSize: 12,
    color: CLOVER_VIOLET,
    marginTop: 2,
  },
  cardIntent: {
    fontFamily: FONT_DM_SANS_LIGHT,
    fontSize: 13,
    color: 'rgba(30,61,40,0.8)',
    marginTop: 4,
    lineHeight: 17,
  },

  // Empty
  emptyWrap: {
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontFamily: FONT_CORMORANT_LIGHT,
    fontSize: 22,
    color: CLOVER_FOREST,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyText: {
    fontFamily: FONT_DM_SANS_LIGHT,
    fontSize: 14,
    color: theme.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },

  // Error
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

  // Profile modal
  profileModal: {
    flex: 1,
    backgroundColor: theme.background,
  },
});
