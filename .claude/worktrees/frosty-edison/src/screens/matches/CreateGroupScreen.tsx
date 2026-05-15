import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { borderRadius, colors, spacing, theme } from '../../constants';
import MemberChip from '../../components/friends/MemberChip';
import CollapsibleSection from '../../components/friends/CollapsibleSection';
import FriendCard from '../../components/friends/FriendCard';
import { useAuth } from '../../context/AuthContext';
import { MatchesStackParamList } from '../../navigation/MatchesStack';
import { createGroupChat } from '../../services/groupChatsService';
import { fetchFriends } from '../../services/friendsService';
import { FriendListItem } from '../../types';

type Props = NativeStackScreenProps<MatchesStackParamList, 'CreateGroup'>;

const DEBOUNCE_MS = 300;

function sortFriends(items: FriendListItem[]): FriendListItem[] {
  return [...items].sort((a, b) => {
    if (a.has_intent_today !== b.has_intent_today) {
      return a.has_intent_today ? -1 : 1;
    }
    return (a.name || '').localeCompare(b.name || '');
  });
}

export default function CreateGroupScreen({ navigation }: Props) {
  const { user } = useAuth();
  const [groupName, setGroupName] = useState('');
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [friends, setFriends] = useState<FriendListItem[]>([]);
  const [selectedFriends, setSelectedFriends] = useState<FriendListItem[]>([]);
  const [availableExpanded, setAvailableExpanded] = useState(true);
  const [othersExpanded, setOthersExpanded] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query.trim().toLowerCase());
    }, DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [query]);

  const loadFriends = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const { data, error: fetchError } = await fetchFriends(user.id);
    setFriends(sortFriends(data));
    setLoading(false);
    if (fetchError) {
      setError(fetchError);
    }
  }, [user]);

  useEffect(() => {
    void loadFriends();
  }, [loadFriends]);

  const filteredFriends = useMemo(() => {
    if (!debouncedQuery) return friends;
    return friends.filter((friend) => {
      const name = (friend.name || '').toLowerCase();
      return name.includes(debouncedQuery);
    });
  }, [debouncedQuery, friends]);

  const availableFriends = useMemo(
    () => filteredFriends.filter((friend) => friend.has_intent_today),
    [filteredFriends]
  );
  const otherFriends = useMemo(
    () => filteredFriends.filter((friend) => !friend.has_intent_today),
    [filteredFriends]
  );

  const selectedIds = useMemo(
    () => new Set(selectedFriends.map((friend) => friend.user_id)),
    [selectedFriends]
  );

  const createDisabled = groupName.trim().length === 0 || selectedFriends.length === 0 || creating;

  const toggleFriend = useCallback((friend: FriendListItem) => {
    setSelectedFriends((prev) => {
      const exists = prev.some((item) => item.user_id === friend.user_id);
      if (exists) {
        return prev.filter((item) => item.user_id !== friend.user_id);
      }
      return [...prev, friend];
    });
  }, []);

  const handleRemoveSelected = useCallback((userId: string) => {
    setSelectedFriends((prev) => prev.filter((friend) => friend.user_id !== userId));
  }, []);

  const handleCreate = useCallback(async () => {
    if (!user || createDisabled) return;

    setCreating(true);
    setError(null);
    const groupChatId = await createGroupChat(
      groupName.trim(),
      user.id,
      selectedFriends.map((friend) => friend.user_id)
    );
    setCreating(false);

    if (!groupChatId) {
      setError('Failed to create group. Please try again.');
      return;
    }

    navigation.replace('GroupChat', {
      groupChatId,
      groupName: groupName.trim(),
    });
  }, [createDisabled, groupName, navigation, selectedFriends, user]);

  const renderFriend = ({ item }: { item: FriendListItem }) => {
    const selected = selectedIds.has(item.user_id);
    return (
      <View style={styles.friendRowWrap}>
        <FriendCard
          friend={item}
          variant={item.has_intent_today ? 'available' : 'simple'}
          onPress={() => toggleFriend(item)}
        />
        {selected ? (
          <View style={styles.selectedBadge}>
            <Text style={styles.selectedBadgeText}>✓</Text>
          </View>
        ) : null}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.topRow}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton} activeOpacity={0.8}>
          <Text style={styles.backText}>← Create Group</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => void handleCreate()}
          disabled={createDisabled}
          style={styles.createButton}
          activeOpacity={0.8}
        >
          {creating ? <ActivityIndicator size="small" color={theme.surface} /> : <Text style={[styles.createText, createDisabled && styles.createTextDisabled]}>Create</Text>}
        </TouchableOpacity>
      </View>

      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.listContent}>
            <Text style={styles.title}>Name your group</Text>
            <TextInput
              value={groupName}
              onChangeText={setGroupName}
              placeholder="Friday Squad"
              placeholderTextColor={theme.textMuted}
              style={styles.input}
            />

            <Text style={styles.sectionLabel}>Find friends</Text>
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Search friends"
              placeholderTextColor={theme.textMuted}
              style={styles.input}
            />

            {selectedFriends.length > 0 ? (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.selectedRow}
              >
                {selectedFriends.map((friend) => (
                  <MemberChip
                    key={friend.user_id}
                    userId={friend.user_id}
                    name={friend.name || 'Anonymous'}
                    photoUrl={friend.photo_url}
                    onRemove={handleRemoveSelected}
                  />
                ))}
              </ScrollView>
            ) : null}

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            {loading ? (
              <View style={styles.stateWrap}>
                <ActivityIndicator size="small" color={theme.primary} />
                <Text style={styles.stateText}>Loading friends...</Text>
              </View>
            ) : (
              <>
                <CollapsibleSection
                  title="Available Today"
                  count={availableFriends.length}
                  expanded={availableExpanded}
                  onToggle={() => setAvailableExpanded((value) => !value)}
                >
                  {availableFriends.length === 0 ? (
                    <Text style={styles.sectionEmpty}>No matching available friends</Text>
                  ) : (
                    availableFriends.map((friend) => (
                      <View key={friend.user_id} style={styles.sectionItem}>
                        {renderFriend({ item: friend })}
                      </View>
                    ))
                  )}
                </CollapsibleSection>

                <CollapsibleSection
                  title="Others"
                  count={otherFriends.length}
                  expanded={othersExpanded}
                  onToggle={() => setOthersExpanded((value) => !value)}
                >
                  {otherFriends.length === 0 ? (
                    <Text style={styles.sectionEmpty}>No other friends match this search</Text>
                  ) : (
                    otherFriends.map((friend) => (
                      <View key={friend.user_id} style={styles.sectionItem}>
                        {renderFriend({ item: friend })}
                      </View>
                    ))
                  )}
                </CollapsibleSection>
              </>
            )}
      </ScrollView>
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
    paddingBottom: spacing[2],
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  backButton: {
    paddingVertical: spacing[2],
    paddingRight: spacing[2],
  },
  backText: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.primary,
  },
  createButton: {
    minWidth: 70,
    minHeight: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  createText: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.primary,
  },
  createTextDisabled: {
    color: theme.textMuted,
  },
  listContent: {
    paddingHorizontal: spacing[4],
    paddingBottom: spacing[8],
  },
  title: {
    marginTop: spacing[1],
    fontSize: 26,
    fontWeight: '700',
    color: theme.text,
  },
  sectionLabel: {
    marginTop: spacing[4],
    marginBottom: spacing[2],
    fontSize: 14,
    fontWeight: '600',
    color: theme.textSecondary,
  },
  input: {
    backgroundColor: colors.bgInput,
    borderWidth: 1,
    borderColor: colors.borderDefault,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    fontSize: 15,
    color: theme.text,
    marginTop: spacing[2],
  },
  selectedRow: {
    paddingTop: spacing[3],
    paddingBottom: spacing[1],
  },
  errorText: {
    marginTop: spacing[3],
    fontSize: 14,
    color: theme.error,
  },
  stateWrap: {
    marginTop: spacing[6],
    alignItems: 'center',
    gap: spacing[2],
  },
  stateText: {
    fontSize: 14,
    color: theme.textSecondary,
  },
  sectionEmpty: {
    fontSize: 14,
    color: theme.textSecondary,
  },
  sectionItem: {
    marginBottom: spacing[2],
  },
  friendRowWrap: {
    position: 'relative',
  },
  selectedBadge: {
    position: 'absolute',
    right: spacing[3],
    top: '50%',
    marginTop: -12,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: theme.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedBadgeText: {
    color: theme.surface,
    fontSize: 13,
    fontWeight: '700',
  },
});
