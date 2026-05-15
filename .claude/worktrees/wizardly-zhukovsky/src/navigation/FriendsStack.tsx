import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AddFriendScreen from '../screens/friends/AddFriendScreen';
import FriendsScreen from '../screens/friends/FriendsScreen';

export type FriendsStackParamList = {
  Friends: undefined;
  AddFriend: undefined;
};

const Stack = createNativeStackNavigator<FriendsStackParamList>();

export default function FriendsStack() {
  return (
    <Stack.Navigator id="FriendsStack" screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Friends" component={FriendsScreen} />
      <Stack.Screen name="AddFriend" component={AddFriendScreen} />
    </Stack.Navigator>
  );
}
