import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, NavigationProp } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as Haptics from 'expo-haptics';
import { colors, spacing, theme } from '../../constants';
import { FriendsStackParamList } from '../../navigation/FriendsStack';
import { MainTabsParamList } from '../../navigation/MainTabs';
import FriendRequestCard from '../../components/friends/FriendRequestCard';
import FriendCard from '../../components/friends/FriendCard';
import FadeInRow from '../../components/common/FadeInRow';
import { SkeletonSectionCard } from '../../components/common/SkeletonListItem';
import SwipeActionRow from '../../components/common/SwipeActionRow';
import CollapsibleSection from '../../components/friends/CollapsibleSection';
import FriendProfileModal from '../../components/friends/FriendProfileModal';
import { useAuth } from '../../context/AuthContext';
import { fetchFriends, fetchPendingRequests, PendingRequestItem, respondToFriendRequest } from '../../services/friendsService';
import { unmatchMatch } from '../../services/messagingService';
import { getFullProfile } from '../../services/profileService';
import { getTodayIntent } from '../../services/discoveryService';
import { FriendListItem, MatchPreviewOtherUser, Profile, ProfilePhoto, WorkIntent } from '../../types';

type Props = NativeStackScreenProps<FriendsStackParamList, 'Friends'>;

export default function FriendsScreen({ navigation }: Props) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [pendingRequests, setPendingRequests] = useState<PendingRequestItem[]>([]);
  const [friends, setFriends] = useState<FriendListItem[]>([]);
  const [actingFriendshipId, setActingFriendshipId] = useState<string | null>(null);
  const [profileModalFriend, setProfileModalFriend] = useState<FriendListItem | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileData, setProfileData] = useState<{
    profile: Profile | null;
    photos: ProfilePhoto[];
    intent: WorkIntent | null;
  } | null>(null);

  const [pendingExpanded, setPendingExpanded] = useState(false);
  const [availableExpanded, setAvailableExpanded] = useState(true);
  const [notAvailableExpanded, setNotAvailableExpanded] = useState(false);

  const loadData = useCallback(
    async (isPullToRefresh: boolean) => {
      if (!user) {
        setLoading(false);
        setRefreshing(false);
        return;
      }

      if (isPullToRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const [{ data: pendingData, error: pendingError }, { data: friendsData, error: friendsError }] =
        await Promise.all([fetchPendingRequests(user.id), fetchFriends(user.id)]);

      setPendingRequests(pendingData);
      setFriends(friendsData);

      if (pendingError || friendsError) {
        Alert.alert('Could not refresh friends', pendingError || friendsError || 'Please try again.');
      }

      setLoading(false);
      setRefreshing(false);
    },
    [user]
  );

  useFocusEffect(
    useCallback(() => {
      void loadData(false);
    }, [loadData])
  );

  const onRefresh = useCallback(() => {
    void loadData(true);
  }, [loadData]);

  const handleRespond = useCallback(
    async (friendshipId: string, response: 'accept' | 'decline') => {
      if (!user) return;

      setActingFriendshipId(friendshipId);
      const { ok, error } = await respondToFriendRequest(friendshipId, user.id, response);
      setActingFriendshipId(null);

      if (!ok) {
        Alert.alert('Unable to update request', error || 'Please try again.');
        return;
      }

      if (response === 'accept') {
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }

      void loadData(false);
    },
    [loadData, user]
  );

  const openChat = useCallback(
    (friend: FriendListItem) => {
      if (!friend.match_id) {
        Alert.alert('Chat unavailable', 'A chat match does not exist for this friend yet.');
        return;
      }

      const parent = navigation.getParent<NavigationProp<MainTabsParamList>>();
      const otherUser: MatchPreviewOtherUser = {
        id: friend.user_id,
        name: friend.name,
        photo_url: friend.photo_url,
      };

      parent?.navigate('Matches', {
        screen: 'Chat',
        params: {
          matchId: friend.match_id,
          otherUser,
        },
      });
    },
    [navigation]
  );

  const handleOpenProfile = useCallback(async (friend: FriendListItem) => {
    setProfileModalFriend(friend);
    setProfileLoading(true);
    setProfileData(null);

    const [{ data: fullProfile }, intent] = await Promise.all([
      getFullProfile(friend.user_id),
      getTodayIntent(friend.user_id),
    ]);

    setProfileData({
      profile: fullProfile.profile,
      photos: fullProfile.photos,
      intent,
    });
    setProfileLoading(false);
  }, []);

  const handleDismissProfileModal = useCallback(() => {
    setProfileModalFriend(null);
    setProfileLoading(false);
    setProfileData(null);
  }, []);

  const handleMessageFromProfile = useCallback(() => {
    if (!profileModalFriend) return;
    const targetFriend = profileModalFriend;
    handleDismissProfileModal();
    openChat(targetFriend);
  }, [handleDismissProfileModal, openChat, profileModalFriend]);

  const handleUnmatch = useCallback(
    (friend: FriendListItem) => {
      if (!user || !friend.match_id) return;

      Alert.alert(
        `Unmatch ${friend.name || 'this person'}?`,
        'This removes them from Chats and Friends. Past messages and sessions will be hidden.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Unmatch',
            style: 'destructive',
            onPress: async () => {
              const ok = await unmatchMatch(friend.match_id, user.id);
              if (!ok) {
                Alert.alert('Unable to unmatch', 'Please try again.');
                return;
              }
              void loadData(false);
            },
          },
        ]
      );
    },
    [loadData, user]
  );

  const availableFriends = useMemo(() => friends.filter((friend) => friend.has_intent_today), [friends]);
  const notAvailableFriends = useMemo(() => friends.filter((friend) => !friend.has_intent_today), [friends]);

  const hasNoData = pendingRequests.length === 0 && friends.length === 0;

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <Text style={styles.title}>Friends</Text>
        </View>
        <View style={styles.content}>
          <SkeletonSectionCard rows={2} />
          <SkeletonSectionCard rows={3} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Friends</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => navigation.navigate('AddFriend')}
          activeOpacity={0.8}
        >
          <Text style={styles.addButtonText}>+</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />}
      >
        {hasNoData ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>No friends yet</Text>
            <Text style={styles.emptyText}>Match with people on Discover or add them here.</Text>
            <TouchableOpacity
              style={styles.emptyCta}
              onPress={() => navigation.navigate('AddFriend')}
              activeOpacity={0.8}
            >
              <Text style={styles.emptyCtaText}>Find Friends</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <CollapsibleSection
              title="Pending Requests"
              count={pendingRequests.length}
              expanded={pendingExpanded}
              onToggle={() => setPendingExpanded((value) => !value)}
              showDot={pendingRequests.length > 0}
            >
              {pendingRequests.length === 0 ? (
                <Text style={styles.sectionEmpty}>No pending requests</Text>
              ) : (
                pendingRequests.map((request, index) => (
                  <FadeInRow key={request.friendship_id} index={index}>
                    <FriendRequestCard
                      request={request}
                      onAccept={() => void handleRespond(request.friendship_id, 'accept')}
                      onDecline={() => void handleRespond(request.friendship_id, 'decline')}
                      loading={actingFriendshipId === request.friendship_id}
                    />
                  </FadeInRow>
                ))
              )}
            </CollapsibleSection>

            <CollapsibleSection
              title="Available Today"
              count={availableFriends.length}
              expanded={availableExpanded}
              onToggle={() => setAvailableExpanded((value) => !value)}
            >
              {availableFriends.length === 0 ? (
                <Text style={styles.sectionEmpty}>No friends available right now</Text>
              ) : (
                availableFriends.map((friend, index) => (
                  <FadeInRow key={friend.user_id} index={index}>
                    <SwipeActionRow
                      enabled={Boolean(friend.match_id)}
                      actionLabel="Unmatch"
                      onActionPress={() => handleUnmatch(friend)}
                    >
                      <FriendCard
                        friend={friend}
                        variant="available"
                        onPress={() => openChat(friend)}
                        onProfilePress={() => void handleOpenProfile(friend)}
                      />
                    </SwipeActionRow>
                  </FadeInRow>
                ))
              )}
            </CollapsibleSection>

            <CollapsibleSection
              title="Not Available"
              count={notAvailableFriends.length}
              expanded={notAvailableExpanded}
              onToggle={() => setNotAvailableExpanded((value) => !value)}
            >
              {notAvailableFriends.length === 0 ? (
                <Text style={styles.sectionEmpty}>Everyone is available today</Text>
              ) : (
                notAvailableFriends.map((friend, index) => (
                  <FadeInRow key={friend.user_id} index={index}>
                    <SwipeActionRow
                      enabled={Boolean(friend.match_id)}
                      actionLabel="Unmatch"
                      onActionPress={() => handleUnmatch(friend)}
                    >
                      <FriendCard
                        friend={friend}
                        variant="simple"
                        onPress={() => openChat(friend)}
                        onProfilePress={() => void handleOpenProfile(friend)}
                      />
                    </SwipeActionRow>
                  </FadeInRow>
                ))
              )}
            </CollapsibleSection>
          </>
        )}
      </ScrollView>

      <FriendProfileModal
        visible={profileModalFriend !== null}
        profile={profileData?.profile ?? null}
        photos={profileData?.photos ?? []}
        intent={profileData?.intent ?? null}
        loading={profileLoading}
        onDismiss={handleDismissProfileModal}
        onMessage={handleMessageFromProfile}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  header: {
    paddingHorizontal: spacing[4],
    paddingTop: spacing[2],
    paddingBottom: spacing[3],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: theme.text,
  },
  addButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: theme.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonText: {
    color: theme.surface,
    fontSize: 22,
    lineHeight: 22,
    marginTop: -1,
  },
  content: {
    paddingHorizontal: spacing[4],
    paddingBottom: spacing[8],
  },
  emptyState: {
    marginTop: spacing[8],
    borderWidth: 1,
    borderColor: colors.borderDefault,
    borderRadius: 16,
    backgroundColor: theme.surface,
    padding: spacing[5],
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.text,
  },
  emptyText: {
    marginTop: spacing[2],
    fontSize: 14,
    textAlign: 'center',
    color: theme.textSecondary,
  },
  emptyCta: {
    marginTop: spacing[4],
    backgroundColor: theme.primary,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    borderRadius: 999,
  },
  emptyCtaText: {
    color: theme.surface,
    fontWeight: '700',
    fontSize: 14,
  },
  sectionEmpty: {
    fontSize: 13,
    color: theme.textSecondary,
    fontStyle: 'italic',
  },
});
