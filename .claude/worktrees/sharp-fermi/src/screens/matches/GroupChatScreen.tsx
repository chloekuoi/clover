import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { borderRadius, colors, spacing, theme } from '../../constants';
import FriendProfileModal from '../../components/friends/FriendProfileModal';
import ChatInputBar from '../../components/matches/ChatInputBar';
import GroupMessageBubble from '../../components/matches/GroupMessageBubble';
import GroupSessionRSVPCard from '../../components/session/GroupSessionRSVPCard';
import InviteComposerCard from '../../components/session/InviteComposerCard';
import { useAuth } from '../../context/AuthContext';
import { getTodayIntent } from '../../services/discoveryService';
import {
  fetchGroupChat,
  fetchGroupMembers,
  fetchGroupMessages,
  fetchGroupSessionRsvps,
  fetchGroupSessions,
  markGroupRead,
  proposeGroupSession,
  rsvpGroupSession,
  sendGroupMessage,
  subscribeToGroupMessages,
  subscribeToGroupSessions,
  cancelGroupSession,
} from '../../services/groupChatsService';
import { getFullProfile } from '../../services/profileService';
import {
  GroupMember,
  GroupMessage,
  GroupSession,
  GroupSessionRsvp,
  GroupTimelineItem,
  Profile,
  ProfilePhoto,
  WorkIntent,
} from '../../types';
import { MatchesStackParamList, useMatchesStack } from '../../navigation/MatchesStack';

type Props = NativeStackScreenProps<MatchesStackParamList, 'GroupChat'>;

export default function GroupChatScreen({ navigation, route }: Props) {
  const { user } = useAuth();
  const { refreshUnreadCount } = useMatchesStack();
  const { groupChatId, groupName } = route.params;
  const [currentGroupName, setCurrentGroupName] = useState(groupName);
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [messages, setMessages] = useState<GroupMessage[]>([]);
  const [sessions, setSessions] = useState<GroupSession[]>([]);
  const [rsvps, setRsvps] = useState<GroupSessionRsvp[]>([]);
  const [loading, setLoading] = useState(true);
  const [showComposer, setShowComposer] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedMember, setSelectedMember] = useState<GroupMember | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileData, setProfileData] = useState<{
    profile: Profile | null;
    photos: ProfilePhoto[];
    intent: WorkIntent | null;
  } | null>(null);
  const listRef = useRef<FlatList<GroupTimelineItem>>(null);

  const loadGroupData = useCallback(async () => {
    const [groupChat, membersData, messagesData, sessionsData] = await Promise.all([
      fetchGroupChat(groupChatId),
      fetchGroupMembers(groupChatId),
      fetchGroupMessages(groupChatId),
      fetchGroupSessions(groupChatId),
    ]);
    const rsvpData = await fetchGroupSessionRsvps(sessionsData.map((session) => session.id));

    setCurrentGroupName(groupChat?.name || groupName);
    setMembers(membersData);
    setMessages(messagesData);
    setSessions(sessionsData);
    setRsvps(rsvpData);
    setLoading(false);
  }, [groupChatId, groupName]);

  const markRead = useCallback(async () => {
    if (!user) return;
    await markGroupRead(groupChatId, user.id);
    await refreshUnreadCount();
  }, [groupChatId, refreshUnreadCount, user]);

  useEffect(() => {
    void loadGroupData();
    void markRead();
  }, [loadGroupData, markRead]);

  useEffect(() => {
    if (!user) return () => undefined;

    const unsubscribeMessages = subscribeToGroupMessages(groupChatId, async (message) => {
      setMessages((prev) => {
        if (prev.some((item) => item.id === message.id)) {
          return prev;
        }
        return [...prev, message];
      });

      if (message.sender_id !== user.id) {
        await markRead();
      }
    });

    const unsubscribeSessions = subscribeToGroupSessions(groupChatId, async (session) => {
      setSessions((prev) => {
        const exists = prev.some((item) => item.id === session.id);
        if (exists) {
          return prev.map((item) => (item.id === session.id ? session : item));
        }
        return [...prev, session];
      });

      const latestRsvps = await fetchGroupSessionRsvps([session.id]);
      setRsvps((prev) => {
        const remaining = prev.filter((item) => item.group_session_id !== session.id);
        return [...remaining, ...latestRsvps];
      });
    });

    return () => {
      unsubscribeMessages();
      unsubscribeSessions();
    };
  }, [groupChatId, markRead, user]);

  const timelineItems = useMemo<GroupTimelineItem[]>(() => {
    const messageItems: GroupTimelineItem[] = messages.map((message) => ({
      type: 'message',
      message,
    }));
    const sessionItems: GroupTimelineItem[] = sessions.map((session) => ({
      type: 'session',
      session,
    }));

    return [...messageItems, ...sessionItems]
      .sort((a, b) => {
        const aDate = a.type === 'message' ? a.message.created_at : a.session.created_at;
        const bDate = b.type === 'message' ? b.message.created_at : b.session.created_at;
        return new Date(aDate).getTime() - new Date(bDate).getTime();
      })
      .reverse();
  }, [messages, sessions]);

  useEffect(() => {
    if (timelineItems.length > 0) {
      listRef.current?.scrollToOffset({ offset: 0, animated: true });
    }
  }, [timelineItems.length]);

  const dateOptions = useMemo(() => {
    const options: { label: string; value: string }[] = [];
    for (let i = 0; i < 7; i += 1) {
      const date = new Date();
      date.setDate(date.getDate() + i);
      const value = date.toISOString().split('T')[0];
      const label =
        i === 0
          ? 'Today'
          : i === 1
            ? 'Tomorrow'
            : date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
      options.push({ label, value });
    }
    return options;
  }, []);

  const handleSend = async (content: string) => {
    if (!user) return;
    const message = await sendGroupMessage(groupChatId, user.id, content);
    if (!message) {
      Alert.alert('Failed to send', 'Please try again.');
      return;
    }
    setMessages((prev) => {
      if (prev.some((item) => item.id === message.id)) {
        return prev;
      }
      return [...prev, message];
    });
  };

  const openComposer = () => {
    if (dateOptions.length === 0) return;
    setSelectedDate(dateOptions[0].value);
    setShowComposer(true);
  };

  const handleProposeSession = async () => {
    if (!user || !selectedDate) return;
    const session = await proposeGroupSession(groupChatId, user.id, selectedDate);
    if (!session) {
      Alert.alert('Unable to propose date', 'Please try again.');
      return;
    }
    setShowComposer(false);
    setSessions((prev) => [...prev, session]);
  };

  const handleRsvp = async (sessionId: string, response: 'yes' | 'no') => {
    if (!user) return;
    const ok = await rsvpGroupSession(sessionId, user.id, response);
    if (!ok) {
      Alert.alert('Unable to RSVP', 'Please try again.');
      return;
    }
    const latestRsvps = await fetchGroupSessionRsvps([sessionId]);
    setRsvps((prev) => {
      const remaining = prev.filter((item) => item.group_session_id !== sessionId);
      return [...remaining, ...latestRsvps];
    });
  };

  const handleCancelSession = async (sessionId: string) => {
    if (!user) return;
    const ok = await cancelGroupSession(sessionId, user.id);
    if (!ok) {
      Alert.alert('Unable to cancel', 'Please try again.');
      return;
    }
    setSessions((prev) =>
      prev.map((session) =>
        session.id === sessionId ? { ...session, status: 'cancelled', updated_at: new Date().toISOString() } : session
      )
    );
  };

  const openMemberProfile = useCallback(
    async (memberId: string) => {
      const member = members.find((item) => item.user_id === memberId) || null;
      if (!member) return;
      setSelectedMember(member);
      setProfileLoading(true);
      setProfileData(null);

      const [{ data: fullProfile }, intent] = await Promise.all([
        getFullProfile(member.user_id),
        getTodayIntent(member.user_id),
      ]);

      setProfileData({
        profile: fullProfile.profile,
        photos: fullProfile.photos,
        intent,
      });
      setProfileLoading(false);
    },
    [members]
  );

  const closeProfileModal = useCallback(() => {
    setSelectedMember(null);
    setProfileLoading(false);
    setProfileData(null);
  }, []);

  const handleMessageFromProfile = useCallback(() => {
    closeProfileModal();
  }, [closeProfileModal]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>

        <Text style={styles.headerTitle} numberOfLines={1}>
          {currentGroupName} ({members.length} members)
        </Text>

        <View style={styles.headerActions}>
          <TouchableOpacity onPress={openComposer} style={styles.headerIconButton} activeOpacity={0.8}>
            <Text style={styles.headerIcon}>📅</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => navigation.navigate('GroupInfo', { groupChatId })}
            style={styles.headerIconButton}
            activeOpacity={0.8}
          >
            <Text style={styles.headerIcon}>ⓘ</Text>
          </TouchableOpacity>
        </View>
      </View>

      <KeyboardAvoidingView
        style={styles.content}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {showComposer ? (
          <InviteComposerCard
            options={dateOptions}
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
            onSend={handleProposeSession}
            onCancel={() => setShowComposer(false)}
          />
        ) : null}

        {loading ? (
          <View style={styles.centerContent}>
            <ActivityIndicator size="large" color={theme.primary} />
            <Text style={styles.loadingText}>Loading group chat...</Text>
          </View>
        ) : timelineItems.length === 0 ? (
          <View style={styles.centerContent}>
            <Text style={styles.emptyTitle}>No messages yet. Say hi! 👋</Text>
          </View>
        ) : (
          <FlatList
            ref={listRef}
            data={timelineItems}
            keyExtractor={(item) => (item.type === 'message' ? item.message.id : `session-${item.session.id}`)}
            renderItem={({ item }) =>
              item.type === 'message' ? (
                <GroupMessageBubble
                  message={item.message}
                  isMine={item.message.sender_id === user?.id}
                  onAvatarPress={
                    item.message.sender_id === user?.id
                      ? undefined
                      : () => void openMemberProfile(item.message.sender_id)
                  }
                />
              ) : (
                <GroupSessionRSVPCard
                  session={item.session}
                  rsvps={rsvps.filter((rsvp) => rsvp.group_session_id === item.session.id)}
                  memberCount={members.length}
                  currentUserId={user?.id ?? ''}
                  proposedByName={members.find((member) => member.user_id === item.session.proposed_by)?.name || 'Someone'}
                  onRsvp={(response) => void handleRsvp(item.session.id, response)}
                  onCancel={() => void handleCancelSession(item.session.id)}
                />
              )
            }
            inverted
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.listContent}
          />
        )}

        <ChatInputBar onSend={handleSend} disabled={!user} />
      </KeyboardAvoidingView>

      <FriendProfileModal
        visible={selectedMember !== null}
        profile={profileData?.profile ?? null}
        photos={profileData?.photos ?? []}
        intent={profileData?.intent ?? null}
        loading={profileLoading}
        onDismiss={closeProfileModal}
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
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: theme.highlight,
    backgroundColor: theme.surface,
  },
  backButton: {
    paddingRight: spacing[3],
  },
  backText: {
    fontSize: 16,
    color: theme.accent,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: theme.text,
    textAlign: 'center',
    marginRight: spacing[2],
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
  },
  headerIconButton: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerIcon: {
    fontSize: 18,
  },
  content: {
    flex: 1,
  },
  centerContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing[6],
  },
  loadingText: {
    fontSize: 14,
    color: theme.textSecondary,
    marginTop: spacing[2],
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '500',
    color: theme.textSecondary,
    textAlign: 'center',
  },
  listContent: {
    paddingVertical: spacing[3],
  },
});
