import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { borderRadius, colors, spacing, theme } from '../../constants';
import { useAuth } from '../../context/AuthContext';
import { MatchesStackParamList } from '../../navigation/MatchesStack';
import {
  addGroupMembers,
  fetchGroupChat,
  fetchGroupMembers,
  leaveGroup,
  renameGroup,
} from '../../services/groupChatsService';
import { fetchFriends } from '../../services/friendsService';
import { FriendListItem, GroupChat, GroupMember } from '../../types';

type Props = NativeStackScreenProps<MatchesStackParamList, 'GroupInfo'>;

function getInitials(name: string | null): string {
  if (!name) return '?';
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export default function GroupInfoScreen({ navigation, route }: Props) {
  const { user } = useAuth();
  const { groupChatId } = route.params;
  const [groupChat, setGroupChat] = useState<GroupChat | null>(null);
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [friends, setFriends] = useState<FriendListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingName, setEditingName] = useState(false);
  const [draftName, setDraftName] = useState('');
  const [savingName, setSavingName] = useState(false);
  const [addingOpen, setAddingOpen] = useState(false);
  const [addQuery, setAddQuery] = useState('');
  const [selectedToAdd, setSelectedToAdd] = useState<string[]>([]);
  const [addingMembers, setAddingMembers] = useState(false);

  const loadData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const [chat, membersData, friendsResult] = await Promise.all([
      fetchGroupChat(groupChatId),
      fetchGroupMembers(groupChatId),
      fetchFriends(user.id),
    ]);
    setGroupChat(chat);
    setDraftName(chat?.name || '');
    setMembers(membersData);
    setFriends(friendsResult.data);
    setLoading(false);
  }, [groupChatId, user]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const memberIds = useMemo(() => new Set(members.map((member) => member.user_id)), [members]);

  const availableFriends = useMemo(() => {
    const normalized = addQuery.trim().toLowerCase();
    return friends.filter((friend) => {
      if (memberIds.has(friend.user_id)) return false;
      if (!normalized) return true;
      return (friend.name || '').toLowerCase().includes(normalized);
    });
  }, [addQuery, friends, memberIds]);

  const createdByName = useMemo(
    () => members.find((member) => member.user_id === groupChat?.created_by)?.name || 'Unknown',
    [groupChat?.created_by, members]
  );

  const handleSaveName = useCallback(async () => {
    if (!groupChat || !draftName.trim()) return;
    setSavingName(true);
    const ok = await renameGroup(groupChat.id, draftName.trim());
    setSavingName(false);
    if (!ok) {
      Alert.alert('Unable to rename group', 'Please try again.');
      return;
    }
    setGroupChat((prev) => (prev ? { ...prev, name: draftName.trim() } : prev));
    setEditingName(false);
  }, [draftName, groupChat]);

  const handleToggleAdd = (userId: string) => {
    setSelectedToAdd((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const handleConfirmAdd = useCallback(async () => {
    if (selectedToAdd.length === 0) return;
    setAddingMembers(true);
    const ok = await addGroupMembers(groupChatId, selectedToAdd);
    setAddingMembers(false);
    if (!ok) {
      Alert.alert('Unable to add members', 'Please try again.');
      return;
    }
    setSelectedToAdd([]);
    setAddQuery('');
    setAddingOpen(false);
    await loadData();
  }, [groupChatId, loadData, selectedToAdd]);

  const handleLeaveGroup = useCallback(() => {
    if (!user || !groupChat) return;
    Alert.alert(`Leave ${groupChat.name}?`, 'You will stop seeing this group in your chats.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Leave Group',
        style: 'destructive',
        onPress: async () => {
          const ok = await leaveGroup(groupChatId, user.id);
          if (!ok) {
            Alert.alert('Unable to leave group', 'Please try again.');
            return;
          }
          navigation.popToTop();
        },
      },
    ]);
  }, [groupChat, groupChatId, navigation, user]);

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={styles.stateText}>Loading group info...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton} activeOpacity={0.8}>
          <Text style={styles.backText}>← Group Info</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={members}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <View style={styles.headerCard}>
            {editingName ? (
              <View style={styles.renameRow}>
                <TextInput
                  value={draftName}
                  onChangeText={setDraftName}
                  style={styles.nameInput}
                  placeholder="Group name"
                  placeholderTextColor={theme.textMuted}
                />
                <TouchableOpacity onPress={() => void handleSaveName()} style={styles.inlineButton} activeOpacity={0.8}>
                  <Text style={styles.inlineButtonText}>✓</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => {
                    setDraftName(groupChat?.name || '');
                    setEditingName(false);
                  }}
                  style={styles.inlineButton}
                  activeOpacity={0.8}
                >
                  <Text style={styles.inlineButtonText}>✕</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity onPress={() => setEditingName(true)} activeOpacity={0.8}>
                <Text style={styles.groupName}>{groupChat?.name || 'Group'}</Text>
              </TouchableOpacity>
            )}
            {savingName ? <ActivityIndicator size="small" color={theme.primary} /> : null}
            <Text style={styles.createdBy}>Created by {createdByName}</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.memberRow}>
            <View style={styles.memberAvatar}>
              {item.photo_url ? (
                <Image source={{ uri: item.photo_url }} style={styles.memberAvatarImage} contentFit="cover" />
              ) : (
                <View style={styles.memberAvatarFallback}>
                  <Text style={styles.memberAvatarText}>{getInitials(item.name)}</Text>
                </View>
              )}
            </View>

            <View style={styles.memberTextWrap}>
              <Text style={styles.memberName}>{item.name || 'Anonymous'}</Text>
            </View>

            {item.user_id === user?.id ? (
              <View style={styles.youBadge}>
                <Text style={styles.youBadgeText}>You</Text>
              </View>
            ) : null}
          </View>
        )}
        ListFooterComponent={
          <View style={styles.footer}>
            <TouchableOpacity onPress={() => setAddingOpen(true)} style={styles.addMembersButton} activeOpacity={0.8}>
              <Text style={styles.addMembersText}>+ Add Members</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={handleLeaveGroup} style={styles.leaveButton} activeOpacity={0.8}>
              <Text style={styles.leaveText}>Leave Group</Text>
            </TouchableOpacity>
          </View>
        }
      />

      <Modal visible={addingOpen} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setAddingOpen(false)}>
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setAddingOpen(false)} activeOpacity={0.8}>
              <Text style={styles.backText}>← Add Members</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => void handleConfirmAdd()}
              disabled={selectedToAdd.length === 0 || addingMembers}
              activeOpacity={0.8}
            >
              {addingMembers ? (
                <ActivityIndicator size="small" color={theme.primary} />
              ) : (
                <Text style={[styles.confirmText, selectedToAdd.length === 0 && styles.confirmTextDisabled]}>Add</Text>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.modalContent}>
            <TextInput
              value={addQuery}
              onChangeText={setAddQuery}
              style={styles.nameInput}
              placeholder="Search friends"
              placeholderTextColor={theme.textMuted}
            />

            <FlatList
              data={availableFriends}
              keyExtractor={(item) => item.user_id}
              contentContainerStyle={styles.modalList}
              renderItem={({ item }) => {
                const selected = selectedToAdd.includes(item.user_id);
                return (
                  <TouchableOpacity onPress={() => handleToggleAdd(item.user_id)} style={styles.addRow} activeOpacity={0.8}>
                    <Text style={styles.addRowName}>{item.name || 'Anonymous'}</Text>
                    {selected ? <Text style={styles.addRowCheck}>✓</Text> : null}
                  </TouchableOpacity>
                );
              }}
              ListEmptyComponent={<Text style={styles.stateText}>No friends available to add</Text>}
            />
          </View>
        </SafeAreaView>
      </Modal>
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
  },
  stateText: {
    marginTop: spacing[2],
    fontSize: 14,
    color: theme.textSecondary,
  },
  header: {
    paddingHorizontal: spacing[4],
    paddingTop: spacing[2],
    paddingBottom: spacing[2],
  },
  backButton: {
    alignSelf: 'flex-start',
    paddingVertical: spacing[2],
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
  headerCard: {
    paddingVertical: spacing[3],
  },
  renameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  nameInput: {
    flex: 1,
    backgroundColor: colors.bgInput,
    borderWidth: 1,
    borderColor: colors.borderDefault,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    fontSize: 15,
    color: theme.text,
  },
  inlineButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing[2],
  },
  inlineButtonText: {
    fontSize: 18,
    color: theme.primary,
    fontWeight: '700',
  },
  groupName: {
    fontSize: 26,
    fontWeight: '700',
    color: theme.text,
  },
  createdBy: {
    marginTop: spacing[1],
    fontSize: 14,
    color: theme.textSecondary,
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  memberAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: colors.accentSubtle,
  },
  memberAvatarImage: {
    width: '100%',
    height: '100%',
  },
  memberAvatarFallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  memberAvatarText: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.textSecondary,
  },
  memberTextWrap: {
    flex: 1,
    marginLeft: spacing[3],
  },
  memberName: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.text,
  },
  youBadge: {
    paddingHorizontal: spacing[2],
    paddingVertical: 4,
    borderRadius: borderRadius.full,
    backgroundColor: colors.accentPrimaryLight,
  },
  youBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.primary,
  },
  footer: {
    paddingTop: spacing[5],
  },
  addMembersButton: {
    minHeight: 44,
    borderRadius: borderRadius.md,
    backgroundColor: colors.accentPrimaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addMembersText: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.primary,
  },
  leaveButton: {
    marginTop: spacing[5],
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  leaveText: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.error,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: theme.background,
  },
  modalHeader: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  confirmText: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.primary,
  },
  confirmTextDisabled: {
    color: theme.textMuted,
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: spacing[4],
  },
  modalList: {
    paddingTop: spacing[4],
    paddingBottom: spacing[8],
  },
  addRow: {
    minHeight: 52,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  addRowName: {
    fontSize: 15,
    color: theme.text,
  },
  addRowCheck: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.primary,
  },
});
