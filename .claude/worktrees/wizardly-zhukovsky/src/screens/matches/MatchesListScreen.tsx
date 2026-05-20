import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { theme, spacing } from '../../constants';
import { useAuth } from '../../context/AuthContext';
import { fetchMatches } from '../../services/messagingService';
import { getTodayIntent } from '../../services/discoveryService';
import { getFullProfile } from '../../services/profileService';
import { MatchPreview, Profile, ProfilePhoto, WorkIntent } from '../../types';
import MatchCard from '../../components/matches/MatchCard';
import FriendProfileModal from '../../components/friends/FriendProfileModal';
import { MatchesStackParamList, useMatchesStack } from '../../navigation/MatchesStack';

type Props = NativeStackScreenProps<MatchesStackParamList, 'MatchesList'>;

export default function MatchesListScreen({ navigation }: Props) {
  const { user } = useAuth();
  const { refreshUnreadCount } = useMatchesStack();
  const [matches, setMatches] = useState<MatchPreview[]>([]);
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
      const data = await fetchMatches(user.id);
      setMatches(data);
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

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={styles.loadingText}>Loading messages...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (matches.length === 0) {
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
      </View>

      <FlatList
        data={matches}
        keyExtractor={(item) => item.match_id}
        renderItem={({ item }) => (
          <MatchCard
            matchPreview={item}
            onPress={() => openChat(item)}
            onAvatarPress={() => void handleOpenProfile(item)}
          />
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
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: theme.text,
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
