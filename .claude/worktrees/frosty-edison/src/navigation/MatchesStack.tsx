import React, { createContext, useCallback, useContext, useEffect } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';
import { getUnreadCount } from '../services/messagingService';
import { fetchGroupChats } from '../services/groupChatsService';
import MatchesListScreen from '../screens/matches/MatchesListScreen';
import ChatScreen from '../screens/matches/ChatScreen';
import CreateGroupScreen from '../screens/matches/CreateGroupScreen';
import GroupChatScreen from '../screens/matches/GroupChatScreen';
import GroupInfoScreen from '../screens/matches/GroupInfoScreen';
import { MatchPreviewOtherUser } from '../types';

export type MatchesStackParamList = {
  MatchesList: undefined;
  Chat: { matchId: string; otherUser: MatchPreviewOtherUser };
  CreateGroup: undefined;
  GroupChat: { groupChatId: string; groupName: string };
  GroupInfo: { groupChatId: string };
};

type MatchesStackContextValue = {
  refreshUnreadCount: () => Promise<void>;
};

const MatchesStackContext = createContext<MatchesStackContextValue | undefined>(undefined);

export function useMatchesStack() {
  const context = useContext(MatchesStackContext);
  if (!context) {
    throw new Error('useMatchesStack must be used within MatchesStack');
  }
  return context;
}

type MatchesStackProps = {
  onUnreadCountChange: (count: number) => void;
};

const Stack = createNativeStackNavigator<MatchesStackParamList>();

export default function MatchesStack({ onUnreadCountChange }: MatchesStackProps) {
  const { user } = useAuth();

  const refreshUnreadCount = useCallback(async () => {
    if (!user) {
      onUnreadCountChange(0);
      return;
    }
    const [dmCount, groupChats] = await Promise.all([
      getUnreadCount(user.id),
      fetchGroupChats(user.id),
    ]);
    const groupCount = groupChats.reduce((sum, chat) => sum + chat.unreadCount, 0);
    onUnreadCountChange(dmCount + groupCount);
  }, [user, onUnreadCountChange]);

  useEffect(() => {
    refreshUnreadCount();
  }, [refreshUnreadCount]);

  return (
    <MatchesStackContext.Provider value={{ refreshUnreadCount }}>
      <Stack.Navigator id="MatchesStack" screenOptions={{ headerShown: false }}>
        <Stack.Screen name="MatchesList" component={MatchesListScreen} />
        <Stack.Screen name="Chat" component={ChatScreen} />
        <Stack.Screen name="CreateGroup" component={CreateGroupScreen} />
        <Stack.Screen name="GroupChat" component={GroupChatScreen} />
        <Stack.Screen name="GroupInfo" component={GroupInfoScreen} />
      </Stack.Navigator>
    </MatchesStackContext.Provider>
  );
}
