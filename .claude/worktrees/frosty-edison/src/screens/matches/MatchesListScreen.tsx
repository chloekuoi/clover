import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import Svg, { Rect } from 'react-native-svg';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { theme, spacing } from '../../constants';
import { CLOVER_FOREST, CLOVER_BG, FONT_DM_SANS_MEDIUM } from '../../constants/clover';
import { useAuth } from '../../context/AuthContext';
import { fetchMatches, unmatchMatch } from '../../services/messagingService';
import { fetchGroupChats } from '../../services/groupChatsService';
import { getTodayIntent } from '../../services/discoveryService';
import { getFullProfile } from '../../services/profileService';
import { GroupChatPreview, MatchPreview, Profile, ProfilePhoto, WorkIntent } from '../../types';
import MatchCard from '../../components/matches/MatchCard';
import GroupChatCard from '../../components/matches/GroupChatCard';
import FadeInRow from '../../components/common/FadeInRow';
import SkeletonListItem from '../../components/common/SkeletonListItem';
import SwipeActionRow from '../../components/common/SwipeActionRow';
import FriendProfileModal from '../../components/friends/FriendProfileModal';
import { MatchesStackParamList, useMatchesStack } from '../../navigation/MatchesStack';

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
    }, [loadMatches])
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

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Chats</Text>
        </View>
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <View key={i}>
            <SkeletonListItem />
            {i < 5 && <View style={styles.separator} />}
          </View>
        ))}
      </SafeAreaView>
    );
  }

  if (chatItems.length === 0) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.centerContent}>
          <Text style={styles.emptyTitle}>No matches yet</Text>
          <Text style={styles.emptyText}>Keep swiping to find co-workers!</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Chats</Text>
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
      </View>

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
