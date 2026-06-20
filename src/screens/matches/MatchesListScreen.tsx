import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, Image } from 'react-native';
import Svg, { Rect } from 'react-native-svg';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { theme, spacing } from '../../constants';
import {
  CLOVER_FOREST,
  CLOVER_BG,
  CLOVER_LAVENDER,
  CLOVER_VIOLET,
  FONT_DM_SANS_MEDIUM,
  FONT_DM_SANS_LIGHT,
} from '../../constants/clover';
import { useAuth } from '../../context/AuthContext';
import { fetchMatches, unmatchMatch } from '../../services/messagingService';
import { fetchGroupChats } from '../../services/groupChatsService';
import { getTodayIntent } from '../../services/discoveryService';
import { getFullProfile } from '../../services/profileService';
import {
  getIncomingInvites,
  respondToInvite,
  IncomingInvite,
} from '../../services/inviteService';
import { supabase } from '../../../lib/supabase';
import { GroupChatPreview, MatchPreview, Profile, ProfilePhoto, WorkIntent } from '../../types';
import MatchCard from '../../components/matches/MatchCard';
import GroupChatCard from '../../components/matches/GroupChatCard';
import FadeInRow from '../../components/common/FadeInRow';
import SkeletonListItem from '../../components/common/SkeletonListItem';
import SwipeActionRow from '../../components/common/SwipeActionRow';
import FriendProfileModal from '../../components/friends/FriendProfileModal';
import { MatchesStackParamList, useMatchesStack } from '../../navigation/MatchesStack';

type MatchesTab = 'chats' | 'requests';

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hr ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function RequestCard({
  invite,
  onAccept,
  onDecline,
}: {
  invite: IncomingInvite;
  onAccept: () => void;
  onDecline: () => void;
}) {
  const { sender, intent } = invite;
  const venue = intent ? intent.location_name || intent.location_type : null;
  return (
    <View style={styles.requestCard}>
      <View style={styles.requestTop}>
        {sender.photo_url ? (
          <Image source={{ uri: sender.photo_url }} style={styles.requestAvatar} />
        ) : (
          <View style={[styles.requestAvatar, styles.requestAvatarEmpty]} />
        )}
        <View style={styles.requestInfo}>
          <Text style={styles.requestName} numberOfLines={1}>
            {sender.name || sender.username}
          </Text>
          <Text style={styles.requestSub} numberOfLines={1}>
            {venue ? `${venue} today` : 'wants to co-work today'} · {timeAgo(invite.created_at)}
          </Text>
        </View>
      </View>
      <View style={styles.requestActions}>
        <TouchableOpacity style={[styles.requestBtn, styles.declineBtn]} onPress={onDecline} activeOpacity={0.8}>
          <Text style={styles.declineBtnText}>Decline</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.requestBtn, styles.acceptBtn]} onPress={onAccept} activeOpacity={0.8}>
          <Text style={styles.acceptBtnText}>Accept</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

type Props = NativeStackScreenProps<MatchesStackParamList, 'MatchesList'>;
type ChatListItem =
  | { type: 'dm'; data: MatchPreview }
  | { type: 'group'; data: GroupChatPreview };

function toEpoch(value: string | null): number {
  if (!value) return 0;
  const time = new Date(value).getTime();
  return Number.isNaN(time) ? 0 : time;
}

export default function MatchesListScreen({ navigation }: Props) {
  const { user } = useAuth();
  const { refreshUnreadCount } = useMatchesStack();
  const [chatItems, setChatItems] = useState<ChatListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState<MatchPreview | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileData, setProfileData] = useState<{
    profile: Profile | null;
    photos: ProfilePhoto[];
    intent: WorkIntent | null;
  } | null>(null);
  const [activeTab, setActiveTab] = useState<MatchesTab>('chats');
  const [invites, setInvites] = useState<IncomingInvite[]>([]);

  const loadInvites = useCallback(async () => {
    if (!user) return;
    setInvites(await getIncomingInvites(user.id));
  }, [user]);

  useEffect(() => {
    if (!user) return;
    loadInvites();
    const channel = supabase
      .channel(`co_work_invites:${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'co_work_invites',
          filter: `receiver_id=eq.${user.id}`,
        },
        () => void loadInvites()
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, loadInvites]);

  const handleAcceptInvite = useCallback(
    async (invite: IncomingInvite) => {
      setInvites((prev) => prev.filter((i) => i.id !== invite.id));
      const { matchId, error } = await respondToInvite(invite.id, 'accepted');
      if (error || !matchId) {
        Alert.alert('Unable to accept', 'Please try again.');
        void loadInvites();
        return;
      }
      navigation.navigate('Chat', {
        matchId,
        otherUser: {
          id: invite.sender.id,
          name: invite.sender.name,
          photo_url: invite.sender.photo_url,
        },
      });
    },
    [navigation, loadInvites]
  );

  const handleDeclineInvite = useCallback(
    async (invite: IncomingInvite) => {
      setInvites((prev) => prev.filter((i) => i.id !== invite.id));
      await respondToInvite(invite.id, 'declined');
    },
    []
  );

  const loadMatches = useCallback(
    async (showLoading: boolean) => {
      if (!user) return;
      if (showLoading) {
        setLoading(true);
      }
      const [matches, groupChats] = await Promise.all([
        fetchMatches(user.id),
        fetchGroupChats(user.id),
      ]);
      const items: ChatListItem[] = [
        ...matches.map((match) => ({ type: 'dm' as const, data: match })),
        ...groupChats.map((chat) => ({ type: 'group' as const, data: chat })),
      ].sort((a, b) => {
        const aDate = a.type === 'dm' ? a.data.last_message_at : a.data.lastMessageAt;
        const bDate = b.type === 'dm' ? b.data.last_message_at : b.data.lastMessageAt;
        if (!aDate && !bDate) return 0;
        if (!aDate) return 1;
        if (!bDate) return -1;
        return toEpoch(bDate) - toEpoch(aDate);
      });
      setChatItems(items);
      setLoading(false);
      setRefreshing(false);
      await refreshUnreadCount();
    },
    [user, refreshUnreadCount]
  );

  useEffect(() => {
    loadMatches(true);
  }, [loadMatches]);

  useFocusEffect(
    useCallback(() => {
      loadMatches(false);
      loadInvites();
    }, [loadMatches, loadInvites])
  );

  const handleRefresh = () => {
    setRefreshing(true);
    loadMatches(false);
  };

  const openChat = useCallback(
    (match: MatchPreview) => {
      navigation.navigate('Chat', {
        matchId: match.match_id,
        otherUser: match.other_user,
      });
    },
    [navigation]
  );

  const handleOpenProfile = useCallback(async (match: MatchPreview) => {
    setSelectedMatch(match);
    setProfileLoading(true);
    setProfileData(null);

    const [{ data: fullProfile }, intent] = await Promise.all([
      getFullProfile(match.other_user.id),
      getTodayIntent(match.other_user.id),
    ]);

    setProfileData({
      profile: fullProfile.profile,
      photos: fullProfile.photos,
      intent,
    });
    setProfileLoading(false);
  }, []);

  const closeProfileModal = useCallback(() => {
    setSelectedMatch(null);
    setProfileLoading(false);
    setProfileData(null);
  }, []);

  const handleMessageFromModal = useCallback(() => {
    if (!selectedMatch) return;
    const targetMatch = selectedMatch;
    closeProfileModal();
    openChat(targetMatch);
  }, [closeProfileModal, openChat, selectedMatch]);

  const handleUnmatch = useCallback(
    (match: MatchPreview) => {
      if (!user) return;

      Alert.alert(
        `Unmatch ${match.other_user.name || 'this person'}?`,
        'This removes them from Chats and Friends. Past messages and sessions will be hidden.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Unmatch',
            style: 'destructive',
            onPress: async () => {
              const ok = await unmatchMatch(match.match_id, user.id);
              if (!ok) {
                Alert.alert('Unable to unmatch', 'Please try again.');
                return;
              }
              await loadMatches(false);
            },
          },
        ]
      );
    },
    [loadMatches, user]
  );

  const renderTabBar = () => (
    <View style={styles.header}>
      <View style={styles.tabRow}>
        <TouchableOpacity onPress={() => setActiveTab('chats')} activeOpacity={0.7}>
          <Text style={[styles.tabTitle, activeTab === 'chats' && styles.tabTitleActive]}>Chats</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.requestsTab}
          onPress={() => setActiveTab('requests')}
          activeOpacity={0.7}
        >
          <Text style={[styles.tabTitle, activeTab === 'requests' && styles.tabTitleActive]}>Requests</Text>
          {invites.length > 0 ? (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{invites.length}</Text>
            </View>
          ) : null}
        </TouchableOpacity>
      </View>
      {activeTab === 'chats' ? (
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => navigation.navigate('CreateGroup')}
          activeOpacity={0.8}
        >
          <Svg width={12} height={12} viewBox="0 0 14 14">
            <Rect x={6} y={1} width={2} height={12} rx={1} fill={CLOVER_BG} />
            <Rect x={1} y={6} width={12} height={2} rx={1} fill={CLOVER_BG} />
          </Svg>
          <Text style={styles.addButtonText}> Group</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );

  if (activeTab === 'requests') {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        {renderTabBar()}
        <FlatList
          data={invites}
          keyExtractor={(item) => item.id}
          renderItem={({ item, index }) => (
            <FadeInRow index={index}>
              <RequestCard
                invite={item}
                onAccept={() => void handleAcceptInvite(item)}
                onDecline={() => void handleDeclineInvite(item)}
              />
            </FadeInRow>
          )}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.centerContent}>
              <Text style={styles.emptyTitle}>No requests</Text>
              <Text style={styles.emptyText}>
                Co-work invites from others will show up here.
              </Text>
            </View>
          }
        />
      </SafeAreaView>
    );
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        {renderTabBar()}
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <View key={i}>
            <SkeletonListItem />
            {i < 5 && <View style={styles.separator} />}
          </View>
        ))}
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {renderTabBar()}

      <FlatList
        data={chatItems}
        keyExtractor={(item) => (item.type === 'dm' ? item.data.match_id : item.data.groupChatId)}
        renderItem={({ item, index }) => (
          <FadeInRow index={index}>
            {item.type === 'dm' ? (
              <SwipeActionRow actionLabel="Unmatch" onActionPress={() => handleUnmatch(item.data)}>
                <MatchCard
                  matchPreview={item.data}
                  onPress={() => openChat(item.data)}
                  onAvatarPress={() => void handleOpenProfile(item.data)}
                />
              </SwipeActionRow>
            ) : (
              <GroupChatCard
                groupChat={item.data}
                onPress={() =>
                  navigation.navigate('GroupChat', {
                    groupChatId: item.data.groupChatId,
                    groupName: item.data.name,
                  })
                }
              />
            )}
          </FadeInRow>
        )}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        refreshing={refreshing}
        onRefresh={handleRefresh}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.centerContent}>
            <Text style={styles.emptyTitle}>No matches yet</Text>
            <Text style={styles.emptyText}>Connect with people to start chatting!</Text>
          </View>
        }
      />

      <FriendProfileModal
        visible={selectedMatch !== null}
        profile={profileData?.profile ?? null}
        photos={profileData?.photos ?? []}
        intent={profileData?.intent ?? null}
        loading={profileLoading}
        onDismiss={closeProfileModal}
        onMessage={handleMessageFromModal}
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
    paddingHorizontal: spacing[5],
    paddingTop: spacing[2],
    paddingBottom: spacing[3],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontFamily: 'CormorantGaramond-Light',
    fontSize: 32,
    fontWeight: '300',
    color: theme.text,
  },
  tabRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 18,
  },
  tabTitle: {
    fontFamily: 'CormorantGaramond-Light',
    fontSize: 32,
    fontWeight: '300',
    color: 'rgba(30,61,40,0.35)',
  },
  tabTitleActive: {
    color: theme.text,
  },
  requestsTab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  badge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    paddingHorizontal: 6,
    backgroundColor: CLOVER_VIOLET,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  badgeText: {
    fontFamily: FONT_DM_SANS_MEDIUM,
    fontSize: 11,
    color: '#ffffff',
  },
  requestCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    marginHorizontal: 16,
    marginTop: 12,
    padding: 14,
  },
  requestTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  requestAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  requestAvatarEmpty: {
    backgroundColor: CLOVER_LAVENDER,
  },
  requestInfo: {
    flex: 1,
  },
  requestName: {
    fontFamily: FONT_DM_SANS_MEDIUM,
    fontSize: 16,
    color: CLOVER_FOREST,
  },
  requestSub: {
    fontFamily: FONT_DM_SANS_LIGHT,
    fontSize: 13,
    color: CLOVER_VIOLET,
    marginTop: 2,
  },
  requestActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  requestBtn: {
    flex: 1,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  declineBtn: {
    backgroundColor: '#f0edf7',
  },
  declineBtnText: {
    fontFamily: FONT_DM_SANS_MEDIUM,
    fontSize: 14,
    color: CLOVER_FOREST,
  },
  acceptBtn: {
    backgroundColor: CLOVER_FOREST,
  },
  acceptBtnText: {
    fontFamily: FONT_DM_SANS_MEDIUM,
    fontSize: 14,
    color: CLOVER_BG,
  },
  addButton: {
    backgroundColor: CLOVER_FOREST,
    borderRadius: 100,
    paddingHorizontal: spacing[3],
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
  },
  addButtonText: {
    fontFamily: FONT_DM_SANS_MEDIUM,
    fontSize: 13,
    fontWeight: '600',
    color: CLOVER_BG,
  },
  centerContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing[6],
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: theme.text,
  },
  emptyText: {
    marginTop: spacing[2],
    fontSize: 16,
    color: theme.textSecondary,
    textAlign: 'center',
  },
  separator: {
    height: 1,
    backgroundColor: '#E2DDD6',
    marginLeft: 80,
  },
  listContent: {
    paddingBottom: spacing[6],
  },
});
