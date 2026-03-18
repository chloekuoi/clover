import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { theme, spacing } from '../../constants';
import { useAuth } from '../../context/AuthContext';
import { fetchMessages, isActiveMatch, markChatRead, sendMessage, subscribeToMessages } from '../../services/messagingService';
import {
  cancelSession,
  createSession,
  fetchSessionEvents,
  fetchSessionsForMatch,
  lockInSession,
  respondToSession,
  subscribeToSession,
  subscribeToSessionEvents,
} from '../../services/sessionService';
import { getTodayIntent } from '../../services/discoveryService';
import { getFullProfile } from '../../services/profileService';
import { ChatTimelineItem, Message, Profile, ProfilePhoto, SessionEvent, SessionRecord, WorkIntent } from '../../types';
import MessageBubble from '../../components/matches/MessageBubble';
import ChatInputBar from '../../components/matches/ChatInputBar';
import StartSessionButton from '../../components/session/StartSessionButton';
import InviteComposerCard from '../../components/session/InviteComposerCard';
import SessionRequestCard from '../../components/session/SessionRequestCard';
import FriendProfileModal from '../../components/friends/FriendProfileModal';
import { MatchesStackParamList, useMatchesStack } from '../../navigation/MatchesStack';
import Animated, { FadeInUp, FadeOutDown } from 'react-native-reanimated';

type Props = NativeStackScreenProps<MatchesStackParamList, 'Chat'>;


export default function ChatScreen({ navigation, route }: Props) {
  const { user } = useAuth();
  const { refreshUnreadCount } = useMatchesStack();
  const { matchId, otherUser } = route.params;
  const [messages, setMessages] = useState<Message[]>([]);
  const [pendingMessageIds, setPendingMessageIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [sessionLoading, setSessionLoading] = useState(false);
  const [sessions, setSessions] = useState<SessionRecord[]>([]);
  const [sessionEvents, setSessionEvents] = useState<SessionEvent[]>([]);
  const [showInviteComposer, setShowInviteComposer] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [recentlyCompletedSessions, setRecentlyCompletedSessions] = useState<Record<string, number>>(
    {}
  );
  // null = AsyncStorage not yet loaded
  const [shownSessionToasts, setShownSessionToasts] = useState<Set<string> | null>(null);
  const shownSessionToastsRef = useRef<Set<string>>(new Set()); // ref for sync access in subscription closures
  const [profileModalVisible, setProfileModalVisible] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileData, setProfileData] = useState<{
    profile: Profile | null;
    photos: ProfilePhoto[];
    intent: WorkIntent | null;
  } | null>(null);
  const listRef = useRef<FlatList<ChatTimelineItem>>(null);
  const toastTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // null = AsyncStorage not yet loaded; Set = loaded (may be empty on first ever open)
  const [shownEventIds, setShownEventIds] = useState<Set<string> | null>(null);

  useEffect(() => {
    let cancelled = false;

    const checkMatchStatus = async () => {
      const active = await isActiveMatch(matchId);
      if (cancelled || active) return;

      Alert.alert('Chat unavailable', 'This match is no longer active.', [
        {
          text: 'OK',
          onPress: () => {
            navigation.goBack();
          },
        },
      ]);
    };

    void checkMatchStatus();

    return () => {
      cancelled = true;
    };
  }, [matchId, navigation]);

  const totalSessions = useMemo(
    () => sessions.filter((s) => s.status === 'completed').length,
    [sessions]
  );

  const loadMessages = useCallback(async () => {
    const data = await fetchMessages(matchId);
    setMessages(data);
    setLoading(false);
  }, [matchId]);

  const showToast = useCallback((message: string, duration = 3000) => {
    setToastMessage(message);
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }
    toastTimeoutRef.current = setTimeout(() => {
      setToastMessage(null);
    }, duration);
  }, []);

  const markSessionToastShown = useCallback((key: string) => {
    const next = new Set([...shownSessionToastsRef.current, key]);
    shownSessionToastsRef.current = next;
    setShownSessionToasts(next);
    AsyncStorage.setItem('session_toasts_shown', JSON.stringify([...next])).catch(() => {});
  }, []);

  const loadSessions = useCallback(async () => {
    if (!user) return;
    setSessionLoading(true);
    const matchSessions = await fetchSessionsForMatch(matchId);
    const events = await fetchSessionEvents(matchSessions.map((session) => session.id));
    setSessions(matchSessions);
    setSessionEvents(events);
    const now = Date.now();
    let didUpdate = false;
    const updatedRecentlyCompleted: Record<string, number> = { ...recentlyCompletedSessions };
    matchSessions.forEach((session) => {
      const completedKey = `completed:${session.id}`;
      if (session.status === 'completed' && session.completed_ack) {
        const completedAt = session.completed_at ? new Date(session.completed_at).getTime() : now;
        if (
          !updatedRecentlyCompleted[session.id] &&
          !shownSessionToastsRef.current.has(completedKey) &&
          now - completedAt <= 60000
        ) {
          updatedRecentlyCompleted[session.id] = now;
          markSessionToastShown(completedKey);
          didUpdate = true;
        }
      }
    });
    if (didUpdate) {
      setRecentlyCompletedSessions(updatedRecentlyCompleted);
      showToast('Session Completed 🔒❤️');
    }
    setSessionLoading(false);
  }, [matchId, user, recentlyCompletedSessions, showToast]);

  const markRead = useCallback(async () => {
    if (!user) return;
    await markChatRead(matchId, user.id);
    await refreshUnreadCount();
  }, [matchId, user, refreshUnreadCount]);

  useEffect(() => {
    loadMessages();
    markRead();
    loadSessions();
  }, [loadMessages, markRead, loadSessions]);

  useEffect(() => () => {
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }
  }, []);

  useEffect(() => {
    if (!user) return () => undefined;

    const unsubscribe = subscribeToMessages(matchId, async (message) => {
      setMessages((prev) => {
        if (prev.find((item) => item.id === message.id)) {
          return prev;
        }
        return [...prev, message];
      });

      if (message.sender_id !== user.id) {
        await markRead();
      }
    });

    return unsubscribe;
  }, [matchId, user, markRead]);

  useEffect(() => {
    if (!user) return () => undefined;
    if (sessions.length === 0) return () => undefined;

    const unsubscribers = sessions.map((session) =>
      subscribeToSession(session.id, (updated) => {
        setSessions((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
        const completedKey = `completed:${updated.id}`;
        if (
          updated.status === 'completed' &&
          updated.completed_ack &&
          !shownSessionToastsRef.current.has(completedKey)
        ) {
          const completedAt = Date.now();
          setRecentlyCompletedSessions((prev) => ({ ...prev, [updated.id]: completedAt }));
          markSessionToastShown(completedKey);
          showToast('Session Completed 🔒❤️');
        }
        const declinedKey = `declined:${updated.id}`;
        if (updated.status === 'declined' && !shownSessionToastsRef.current.has(declinedKey)) {
          markSessionToastShown(declinedKey);
          showToast('Next Time 🫶🏼');
        }
        const cancelledKey = `cancelled:${updated.id}`;
        if (
          updated.status === 'cancelled' &&
          !updated.accepted_at &&
          !shownSessionToastsRef.current.has(cancelledKey)
        ) {
          markSessionToastShown(cancelledKey);
          showToast('Invite cancelled');
        }
      })
    );

    return () => {
      unsubscribers.forEach((unsubscribe) => unsubscribe());
    };
  }, [sessions, user]);

  useEffect(() => {
    if (!user) return () => undefined;
    if (sessions.length === 0) return () => undefined;
    const unsubscribers = sessions.map((session) =>
      subscribeToSessionEvents(session.id, (event) => {
        setSessionEvents((prev) => {
          if (prev.find((item) => item.id === event.id)) {
            return prev;
          }
          return [...prev, event];
        });
      })
    );
    return () => {
      unsubscribers.forEach((unsubscribe) => unsubscribe());
    };
  }, [sessions, user]);

  const timelineItems = useMemo<ChatTimelineItem[]>(() => {
    const now = Date.now();
    const visibleSessions = sessions.filter((session) => {
      if (session.status === 'completed' && session.completed_ack) {
        return false;
      }
      if (session.status === 'declined') {
        return false;
      }
      if (session.status === 'cancelled') {
        return false;
      }
      return true;
    });

    const sessionItems: ChatTimelineItem[] = visibleSessions.map((session) => ({
      type: 'session',
      session,
    }));
    const messageItems: ChatTimelineItem[] = messages.map((message) => ({
      type: 'message',
      message,
    }));
    const eventItems: ChatTimelineItem[] = sessionEvents
      .filter((event) => {
        if (event.event_type !== 'accepted') return false;
        return !messages.some(
          (message) => new Date(message.created_at).getTime() > new Date(event.created_at).getTime()
        );
      })
      .map((event) => ({
        type: 'event',
        event,
      }));

    const combined = [...sessionItems, ...messageItems, ...eventItems].sort((a, b) => {
      const aDate =
        a.type === 'message'
          ? a.message.created_at
          : a.type === 'event'
            ? a.event.created_at
            : a.session.created_at;
      const bDate =
        b.type === 'message'
          ? b.message.created_at
          : b.type === 'event'
            ? b.event.created_at
            : b.session.created_at;
      return new Date(aDate).getTime() - new Date(bDate).getTime();
    });

    return combined.reverse();
  }, [messages, sessions, sessionEvents, recentlyCompletedSessions]);

  useEffect(() => {
    if (timelineItems.length > 0) {
      listRef.current?.scrollToOffset({ offset: 0, animated: true });
    }
  }, [timelineItems.length]);

  // Load the set of event IDs that have already shown the "matched" toast
  useEffect(() => {
    AsyncStorage.getItem('accepted_event_toasts_shown')
      .then((raw) => {
        const ids: string[] = raw ? (JSON.parse(raw) as string[]) : [];
        setShownEventIds(new Set(ids));
      })
      .catch(() => setShownEventIds(new Set()));
  }, []);

  // Show a one-time dismissing toast for each 'accepted' event (persisted across app restarts)
  useEffect(() => {
    if (shownEventIds === null) return; // AsyncStorage not loaded yet
    const events = timelineItems.filter(
      (item): item is Extract<ChatTimelineItem, { type: 'event' }> => item.type === 'event'
    );
    const newEvents = events.filter((item) => !shownEventIds.has(item.event.id));
    if (newEvents.length === 0) return;

    newEvents.forEach(() =>
      showToast(`You can now plan coworking details with ${otherUser?.name ?? 'your partner'} 😀`)
    );

    const updatedIds = new Set([...shownEventIds, ...newEvents.map((item) => item.event.id)]);
    setShownEventIds(updatedIds);
    AsyncStorage.setItem('accepted_event_toasts_shown', JSON.stringify([...updatedIds])).catch(
      () => {}
    );
  }, [timelineItems, shownEventIds, otherUser?.name, showToast]);

  // Load persisted session toast IDs from AsyncStorage on mount
  useEffect(() => {
    AsyncStorage.getItem('session_toasts_shown')
      .then((raw) => {
        const ids: string[] = raw ? (JSON.parse(raw) as string[]) : [];
        const s = new Set(ids);
        shownSessionToastsRef.current = s;
        setShownSessionToasts(s);
      })
      .catch(() => {
        shownSessionToastsRef.current = new Set();
        setShownSessionToasts(new Set());
      });
  }, []);

  // One-time toasts for declined / cancelled / missed sessions (persisted across restarts)
  useEffect(() => {
    if (shownSessionToasts === null) return;
    sessions.forEach((session) => {
      const declinedKey = `declined:${session.id}`;
      if (session.status === 'declined' && !shownSessionToastsRef.current.has(declinedKey)) {
        markSessionToastShown(declinedKey);
        showToast('Next Time 🫶🏼');
      }
      const cancelledKey = `cancelled:${session.id}`;
      if (
        session.status === 'cancelled' &&
        !session.accepted_at &&
        !shownSessionToastsRef.current.has(cancelledKey)
      ) {
        markSessionToastShown(cancelledKey);
        showToast('Invite cancelled');
      }
      const missedKey = `missed:${session.id}`;
      if (
        session.status === 'cancelled' &&
        !!session.accepted_at &&
        session.completed_ack === false &&
        !shownSessionToastsRef.current.has(missedKey)
      ) {
        markSessionToastShown(missedKey);
        showToast('Missed this one 💔');
      }
    });
  }, [sessions, shownSessionToasts, markSessionToastShown, showToast]);

  const handleSend = async (content: string) => {
    if (!user) return;

    // Immediately show a pending bubble while the server confirms
    const tempId = `temp-${Date.now()}`;
    const tempMessage: Message = {
      id: tempId,
      match_id: matchId,
      sender_id: user.id,
      content,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempMessage]);
    setPendingMessageIds((prev) => new Set([...prev, tempId]));

    const newMessage = await sendMessage(matchId, user.id, content);

    // Remove the temp bubble regardless of outcome
    setMessages((prev) => prev.filter((m) => m.id !== tempId));
    setPendingMessageIds((prev) => {
      const next = new Set(prev);
      next.delete(tempId);
      return next;
    });

    if (!newMessage) {
      Alert.alert('Failed to send', 'Please try again.');
      return;
    }

    // Add the confirmed message (subscription may already have delivered it)
    setMessages((prev) => {
      if (prev.find((item) => item.id === newMessage.id)) {
        return prev;
      }
      return [...prev, newMessage];
    });
  };

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

  const openInviteComposer = () => {
    if (dateOptions.length === 0) return;
    setSelectedDate(dateOptions[0].value);
    setShowInviteComposer(true);
  };

  const handleSendInvite = async () => {
    if (!user || !selectedDate) return;
    const { error } = await createSession(matchId, user.id, selectedDate);
    if (error) {
      Alert.alert('Unable to send invite', error);
      return;
    }
    setShowInviteComposer(false);
    await loadSessions();
  };

  const handleCancelInviteComposer = () => {
    setShowInviteComposer(false);
  };

  const hasMatchSession = sessions.some(
    (session) => session.status === 'pending' || session.status === 'active'
  );

  const handleAcceptSession = async (sessionId: string) => {
    if (!user) return;
    const { error } = await respondToSession(sessionId, user.id, 'accept');
    if (error) {
      Alert.alert('Unable to accept session', error);
      return;
    }
    await loadSessions();
  };

  const handleDeclineSession = async (sessionId: string) => {
    if (!user) return;
    const { error } = await respondToSession(sessionId, user.id, 'decline');
    if (error) {
      Alert.alert('Unable to decline session', error);
      return;
    }
    await loadSessions();
  };

  const handleProposeAlternative = async (sessionId: string, text: string) => {
    if (!user) return;

    const newMessage = await sendMessage(matchId, user.id, text);
    if (!newMessage) {
      Alert.alert('Failed to send', 'Please try again.');
      return;
    }

    setMessages((prev) => {
      if (prev.find((item) => item.id === newMessage.id)) {
        return prev;
      }
      return [...prev, newMessage];
    });

    markSessionToastShown(`declined:${sessionId}`);

    const { error } = await respondToSession(sessionId, user.id, 'decline');
    if (error) {
      Alert.alert('Unable to update invite', error);
      return;
    }

    await loadSessions();
  };

  const handleCancelSession = async (sessionId: string) => {
    if (!user) return;
    const { error } = await cancelSession(sessionId, user.id);
    if (error) {
      Alert.alert('Unable to cancel session', error);
      return;
    }
    await loadSessions();
  };
  const handleLockIn = async (sessionId: string) => {
    if (!user) return;
    const { error } = await lockInSession(sessionId, user.id);
    if (error) {
      Alert.alert('Unable to lock in', error);
      return;
    }
    await loadSessions();
  };

  const openOtherUserProfile = useCallback(async () => {
    setProfileModalVisible(true);
    setProfileLoading(true);
    setProfileData(null);

    const [{ data: fullProfile }, intent] = await Promise.all([
      getFullProfile(otherUser.id),
      getTodayIntent(otherUser.id),
    ]);

    setProfileData({
      profile: fullProfile.profile,
      photos: fullProfile.photos,
      intent,
    });
    setProfileLoading(false);
  }, [otherUser.id]);

  const closeOtherUserProfile = useCallback(() => {
    setProfileModalVisible(false);
    setProfileLoading(false);
    setProfileData(null);
  }, []);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.headerTitleButton}
          onPress={() => void openOtherUserProfile()}
          activeOpacity={0.8}
        >
          <Text style={styles.headerTitle} numberOfLines={1}>
            {otherUser.name || 'Chat'}
          </Text>
        </TouchableOpacity>
        <View style={styles.headerRight}>
          {!hasMatchSession && (
            <StartSessionButton
              onPress={openInviteComposer}
              disabled={!user || sessionLoading}
            />
          )}
        </View>
      </View>

      <KeyboardAvoidingView
        style={styles.content}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {showInviteComposer && (
          <InviteComposerCard
            options={dateOptions}
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
            onSend={handleSendInvite}
            onCancel={handleCancelInviteComposer}
          />
        )}
        {loading ? (
          <View style={styles.centerContent}>
            <ActivityIndicator size="large" color={theme.primary} />
            <Text style={styles.loadingText}>Loading messages...</Text>
          </View>
        ) : timelineItems.length === 0 ? (
          <View style={styles.centerContent}>
            <Text style={styles.emptyTitle}>Start the conversation!</Text>
          </View>
        ) : (
          <FlatList
            ref={listRef}
            data={timelineItems}
            keyExtractor={(item) =>
              item.type === 'message'
                ? item.message.id
                : item.type === 'event'
                  ? `event-${item.event.id}`
                  : `session-${item.session.id}`
            }
            renderItem={({ item }) =>
              item.type === 'message' ? (
                <MessageBubble
                  message={item.message}
                  isMine={item.message.sender_id === user?.id}
                  isPending={pendingMessageIds.has(item.message.id)}
                />
              ) : item.type === 'event' ? null : (
                <SessionRequestCard
                  session={item.session}
                  currentUserId={user?.id ?? ''}
                  otherUserName={otherUser.name}
                  totalSessions={totalSessions}
                  onAccept={() => handleAcceptSession(item.session.id)}
                  onDecline={() => handleDeclineSession(item.session.id)}
                  onCancel={() => handleCancelSession(item.session.id)}
                  onLockIn={() => handleLockIn(item.session.id)}
                  onSendMessage={(text) => handleSend(text)}
                  onProposeAlternative={(text) => handleProposeAlternative(item.session.id, text)}
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
        visible={profileModalVisible}
        profile={profileData?.profile ?? null}
        photos={profileData?.photos ?? []}
        intent={profileData?.intent ?? null}
        loading={profileLoading}
        onDismiss={closeOtherUserProfile}
        onMessage={closeOtherUserProfile}
      />

      {toastMessage && (
        <View style={styles.toastContainer}>
          <Animated.View
            style={styles.toastBubble}
            entering={FadeInUp.springify().damping(14).stiffness(180)}
            exiting={FadeOutDown.duration(150)}
          >
            <Text style={styles.toastText}>{toastMessage}</Text>
          </Animated.View>
        </View>
      )}
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
  headerTitleButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.text,
    textAlign: 'center',
    maxWidth: '85%',
  },
  headerRight: {
    minWidth: 60,
    alignItems: 'flex-end',
  },
  content: {
    flex: 1,
  },
  listContent: {
    paddingVertical: spacing[3],
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
  },
  toastContainer: {
    position: 'absolute',
    bottom: spacing[10],
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  toastBubble: {
    backgroundColor: theme.text,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    borderRadius: 999,
  },
  toastText: {
    color: theme.surface,
    fontSize: 14,
    fontWeight: '600',
  },
});
