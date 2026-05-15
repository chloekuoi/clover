import React, { useCallback, useState } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text, View, StyleSheet } from 'react-native';
import { NavigatorScreenParams, useFocusEffect } from '@react-navigation/native';
import Svg, { Path, Polygon } from 'react-native-svg';
import DiscoverScreen from '../screens/discover/DiscoverScreen';
import { theme, spacing } from '../constants';
import MatchesStack, { MatchesStackParamList } from './MatchesStack';
import FriendsStack, { FriendsStackParamList } from './FriendsStack';
import ProfileStack, { ProfileStackParamList } from './ProfileStack';
import { getPendingRequestsCount } from '../services/friendsService';
import { useAuth } from '../context/AuthContext';

export type MainTabsParamList = {
  Discover: undefined;
  Friends: NavigatorScreenParams<FriendsStackParamList> | undefined;
  Matches: NavigatorScreenParams<MatchesStackParamList> | undefined;
  Profile: NavigatorScreenParams<ProfileStackParamList> | undefined;
};

const Tab = createBottomTabNavigator<MainTabsParamList>();

const ACTIVE_COLOR = '#3F5443';
const INACTIVE_COLOR = '#999999';
const ICON_STROKE_WIDTH = 1.8;

function SparkleGlyph({ color }: { color: string }) {
  return (
    <Svg width={10} height={10} viewBox="0 0 10 10">
      <Polygon
        points="5,0 6.8,3.2 10,5 6.8,6.8 5,10 3.2,6.8 0,5 3.2,3.2"
        fill={color}
      />
    </Svg>
  );
}

function HeartGlyph({ color }: { color: string }) {
  return (
    <Svg width={10} height={10} viewBox="0 0 10 10">
      <Path
        d="M5 8.9C2.8 7.4 1 5.8 1 3.9C1 2.7 1.9 1.8 3.1 1.8C3.9 1.8 4.6 2.2 5 2.9C5.4 2.2 6.1 1.8 6.9 1.8C8.1 1.8 9 2.7 9 3.9C9 5.8 7.2 7.4 5 8.9Z"
        fill={color}
      />
    </Svg>
  );
}

function RoundedSquareIcon({
  focused,
  glyph,
}: {
  focused: boolean;
  glyph: 'discover' | 'friends';
}) {
  const strokeColor = focused ? ACTIVE_COLOR : INACTIVE_COLOR;
  const glyphColor = focused ? '#FFFFFF' : INACTIVE_COLOR;

  return (
    <View style={[styles.roundIcon, focused && styles.roundIconActive, { borderColor: strokeColor }]}>
      {glyph === 'discover' ? <SparkleGlyph color={glyphColor} /> : <HeartGlyph color={glyphColor} />}
    </View>
  );
}

function ChatIcon({ focused }: { focused: boolean }) {
  return (
    <View style={[styles.chatIcon, focused && styles.chatIconActive]}>
      <View style={styles.chatDotsRow}>
        <View style={[styles.chatDot, { backgroundColor: focused ? '#FFFFFF' : INACTIVE_COLOR }]} />
        <View style={[styles.chatDot, { backgroundColor: focused ? '#FFFFFF' : INACTIVE_COLOR }]} />
        <View style={[styles.chatDot, { backgroundColor: focused ? '#FFFFFF' : INACTIVE_COLOR }]} />
      </View>
    </View>
  );
}

function ProfileIcon({ focused }: { focused: boolean }) {
  return (
    <View style={[styles.profileIcon, focused && styles.profileIconActive]}>
      <View style={[styles.profileInnerDot, { backgroundColor: focused ? '#FFFFFF' : INACTIVE_COLOR }]} />
    </View>
  );
}

function TabLabel({ label, focused, underline = false }: { label: string; focused: boolean; underline?: boolean }) {
  return (
    <View style={styles.labelWrap}>
      <Text style={[styles.tabLabel, focused ? styles.tabLabelActive : styles.tabLabelInactive]}>{label}</Text>
      {underline && focused ? <View style={styles.chatUnderline} /> : null}
    </View>
  );
}

type FriendsTabRootProps = {
  onPendingCountChange: (count: number) => void;
};

function FriendsTabRoot({ onPendingCountChange }: FriendsTabRootProps) {
  const { user } = useAuth();

  const refreshPendingCount = useCallback(async () => {
    if (!user) {
      onPendingCountChange(0);
      return;
    }

    const { count } = await getPendingRequestsCount(user.id);
    onPendingCountChange(count);
  }, [onPendingCountChange, user]);

  useFocusEffect(
    useCallback(() => {
      void refreshPendingCount();
    }, [refreshPendingCount])
  );

  return <FriendsStack />;
}

export default function MainTabs() {
  const [unreadCount, setUnreadCount] = useState(0);
  const [friendsPendingCount, setFriendsPendingCount] = useState(0);

  return (
    <Tab.Navigator
      id="MainTabs"
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: ACTIVE_COLOR,
        tabBarInactiveTintColor: INACTIVE_COLOR,
        tabBarShowLabel: true,
      }}
    >
      <Tab.Screen
        name="Discover"
        component={DiscoverScreen}
        options={{
          tabBarIcon: ({ focused }) => <RoundedSquareIcon focused={focused} glyph="discover" />,
          tabBarLabel: ({ focused }) => <TabLabel label="Discover" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Friends"
        options={{
          tabBarIcon: ({ focused }) => <RoundedSquareIcon focused={focused} glyph="friends" />,
          tabBarLabel: ({ focused }) => <TabLabel label="Friends" focused={focused} />,
          tabBarBadge: friendsPendingCount > 0 ? friendsPendingCount : undefined,
        }}
      >
        {() => <FriendsTabRoot onPendingCountChange={setFriendsPendingCount} />}
      </Tab.Screen>
      <Tab.Screen
        name="Matches"
        options={{
          tabBarIcon: ({ focused }) => <ChatIcon focused={focused} />,
          tabBarLabel: ({ focused }) => <TabLabel label="Chat" focused={focused} underline />,
          tabBarBadge: unreadCount > 0 ? unreadCount : undefined,
        }}
      >
        {() => <MatchesStack onUnreadCountChange={setUnreadCount} />}
      </Tab.Screen>
      <Tab.Screen
        name="Profile"
        component={ProfileStack}
        options={{
          tabBarIcon: ({ focused }) => <ProfileIcon focused={focused} />,
          tabBarLabel: ({ focused }) => <TabLabel label="Profile" focused={focused} />,
        }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: theme.surface,
    borderTopColor: '#E2DDD6',
    borderTopWidth: 1,
    paddingTop: spacing[1],
    paddingBottom: spacing[6],
    height: 86,
  },
  roundIcon: {
    width: 25,
    height: 25,
    borderRadius: 7,
    borderWidth: ICON_STROKE_WIDTH,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  roundIconActive: {
    backgroundColor: ACTIVE_COLOR,
  },
  chatIcon: {
    width: 25,
    height: 25,
    borderRadius: 7,
    borderWidth: ICON_STROKE_WIDTH,
    borderColor: INACTIVE_COLOR,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  chatIconActive: {
    width: 25,
    height: 25,
    borderRadius: 7,
    borderWidth: 0,
    backgroundColor: ACTIVE_COLOR,
  },
  chatDotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2.5,
  },
  chatDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
  },
  profileIcon: {
    width: 25,
    height: 25,
    borderRadius: 7,
    borderWidth: ICON_STROKE_WIDTH,
    borderColor: INACTIVE_COLOR,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  profileIconActive: {
    backgroundColor: ACTIVE_COLOR,
    borderColor: ACTIVE_COLOR,
  },
  profileInnerDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  labelWrap: {
    alignItems: 'center',
    justifyContent: 'flex-start',
    minHeight: 18,
    marginTop: 2,
  },
  tabLabel: {
    fontSize: 10,
    lineHeight: 12,
  },
  tabLabelInactive: {
    color: INACTIVE_COLOR,
    fontWeight: '500',
  },
  tabLabelActive: {
    color: ACTIVE_COLOR,
    fontWeight: '600',
  },
  chatUnderline: {
    width: 20,
    height: 2.5,
    borderRadius: 2,
    backgroundColor: ACTIVE_COLOR,
    marginTop: 2,
  },
});
