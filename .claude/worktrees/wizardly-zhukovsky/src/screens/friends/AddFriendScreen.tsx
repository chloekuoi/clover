import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as Haptics from 'expo-haptics';
import { colors, spacing, theme, borderRadius } from '../../constants';
import { FriendsStackParamList } from '../../navigation/FriendsStack';
import UserSearchResultCard from '../../components/friends/UserSearchResultCard';
import { useAuth } from '../../context/AuthContext';
import {
  getRelationshipStatuses,
  respondToFriendRequest,
  searchUsers,
  sendFriendRequest,
} from '../../services/friendsService';
import { UserSearchResult } from '../../types';

type Props = NativeStackScreenProps<FriendsStackParamList, 'AddFriend'>;

const DEBOUNCE_MS = 300;

export default function AddFriendScreen({ navigation }: Props) {
  const { user } = useAuth();
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [results, setResults] = useState<UserSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [actionUserId, setActionUserId] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query.trim());
    }, DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [query]);

  const loadResults = useCallback(
    async (searchQuery: string) => {
      if (!user) return;
      if (searchQuery.length < 3) {
        setResults([]);
        setSearching(false);
        return;
      }

      setSearching(true);
      const { data, error } = await searchUsers(searchQuery, user.id);
      setSearching(false);

      if (error) {
        Alert.alert('Search failed', error);
      }

      setResults(data);
    },
    [user]
  );

  useEffect(() => {
    void loadResults(debouncedQuery);
  }, [debouncedQuery, loadResults]);

  const refreshStatuses = useCallback(
    async (targetUserIds: string[]) => {
      if (!user || targetUserIds.length === 0) return;

      const { data: statusMap, error } = await getRelationshipStatuses(user.id, targetUserIds);
      if (error) {
        console.error('Relationship status refresh issue:', error);
      }

      setResults((previous) =>
        previous.map((item) => {
          const nextStatus = statusMap[item.id];
          return nextStatus ? { ...item, relationship_status: nextStatus } : item;
        })
      );
    },
    [user]
  );

  const handleAdd = useCallback(
    async (recipientId: string) => {
      if (!user) {
        Alert.alert('Error', 'You must be logged in to add friends.');
        return;
      }

      setActionUserId(recipientId);
      setResults((previous) =>
        previous.map((item) =>
          item.id === recipientId ? { ...item, relationship_status: 'pending_sent' } : item
        )
      );

      const { error } = await sendFriendRequest(user.id, recipientId);
      setActionUserId(null);

      if (error) {
        Alert.alert('Request failed', error);
        await refreshStatuses([recipientId]);
        return;
      }

      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    },
    [refreshStatuses, user]
  );

  const handleAccept = useCallback(
    async (result: UserSearchResult) => {
      if (!user) {
        Alert.alert('Error', 'You must be logged in to respond.');
        return;
      }

      if (!result.friendship_id) {
        Alert.alert('Error', 'Missing friend request reference. Refresh and try again.');
        return;
      }

      setActionUserId(result.id);
      const { ok, error } = await respondToFriendRequest(result.friendship_id, user.id, 'accept');
      setActionUserId(null);

      if (!ok) {
        Alert.alert('Accept failed', error || 'Unable to accept this request.');
        await refreshStatuses([result.id]);
        return;
      }

      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      setResults((previous) =>
        previous.map((item) =>
          item.id === result.id
            ? { ...item, relationship_status: 'friends', friendship_id: result.friendship_id }
            : item
        )
      );
    },
    [refreshStatuses, user]
  );

  const listHeader = useMemo(
    () => (
      <View style={styles.headerArea}>
        <Text style={styles.title}>Add Friend</Text>
        <Text style={styles.subtitle}>Search by username, email, or phone</Text>
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search by username, email, or phone"
          placeholderTextColor={theme.textMuted}
          style={styles.searchInput}
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>
    ),
    [query]
  );

  const showInitialState = debouncedQuery.length === 0;
  const showNoResults = debouncedQuery.length >= 3 && !searching && results.length === 0;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.topRow}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton} activeOpacity={0.8}>
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={results}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <UserSearchResultCard
            result={item}
            onAdd={handleAdd}
            onAccept={handleAccept}
            loadingAction={actionUserId === item.id}
          />
        )}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={listHeader}
        ListEmptyComponent={
          <View style={styles.stateContainer}>
            {searching ? (
              <>
                <ActivityIndicator size="small" color={theme.primary} />
                <Text style={styles.stateText}>Searching...</Text>
              </>
            ) : showInitialState ? (
              <Text style={styles.stateText}>Search by username, email, or phone</Text>
            ) : showNoResults ? (
              <Text style={styles.stateText}>No users found</Text>
            ) : (
              <Text style={styles.stateText}>Type at least 3 characters to search</Text>
            )}
          </View>
        }
        keyboardShouldPersistTaps="handled"
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  topRow: {
    paddingHorizontal: spacing[4],
    paddingTop: spacing[2],
  },
  backButton: {
    alignSelf: 'flex-start',
    paddingVertical: spacing[2],
    paddingHorizontal: spacing[2],
  },
  backText: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.primary,
  },
  listContent: {
    paddingHorizontal: spacing[4],
    paddingBottom: spacing[8],
  },
  headerArea: {
    paddingBottom: spacing[4],
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: theme.text,
    marginTop: spacing[1],
  },
  subtitle: {
    marginTop: spacing[1],
    marginBottom: spacing[3],
    fontSize: 14,
    color: theme.textSecondary,
  },
  searchInput: {
    backgroundColor: colors.bgInput,
    borderWidth: 1,
    borderColor: colors.borderDefault,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    fontSize: 15,
    color: theme.text,
  },
  separator: {
    height: spacing[2],
  },
  stateContainer: {
    marginTop: spacing[8],
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
  },
  stateText: {
    fontSize: 14,
    color: theme.textSecondary,
  },
});
