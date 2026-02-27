import React from "react";
import { Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { HomeScreen } from "../screens/HomeScreen";
import { PlaylistsScreen } from "../screens/PlaylistsScreen";
import { SettingsScreen } from "../screens/SettingsScreen";
import { PlayerScreen } from "../screens/PlayerScreen";
import { FavoritesScreen } from "../screens/FavoritesScreen";
import { SearchScreen } from "../screens/SearchScreen";
import { useAudioPlayer } from "../hooks/useAudioPlayer";
import { COLORS, FONTS } from "../themes";

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const TAB_ICONS: Record<string, string> = {
  Home:      '⌂',
  Favorites: '♡',
  Playlists: '▤',
  Settings:  '⚙',
};

function AudioInit() {
  useAudioPlayer();
  return null;
}

function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: COLORS.tabBar,
          borderTopColor: COLORS.tabBarBorder,
          borderTopWidth: 1
        },
        tabBarActiveTintColor: COLORS.tabActive,
        tabBarInactiveTintColor: COLORS.tabInactive,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: FONTS.medium,
        },
        tabBarIcon: ({ focused }) => (
          <Text style={{
            fontSize: 22,
            color: focused ? COLORS.tabActive : COLORS.tabInactive,
          }}>
            {TAB_ICONS[route.name]}
          </Text>
        ),
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Favorites" component={FavoritesScreen} />
      <Tab.Screen name="Playlists" component={PlaylistsScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
}

export function AppNavigator() {
  return (
    <NavigationContainer>
      <AudioInit/>
      <Stack.Navigator screenOptions={{ headerShown: false }}>

        {/* MainTabs is the root — shows the bottom tab bar */}
        <Stack.Screen name="MainTabs" component={TabNavigator} />

        {/* Player slides up from bottom as a modal */}
        <Stack.Screen
          name="Player"
          component={PlayerScreen}
          options={{
            animation: 'slide_from_bottom',
            presentation: 'modal',
          }}
        />

        {/* Search slides in from the right */}
        <Stack.Screen
          name="SearchScreen"
          component={SearchScreen}
          options={{
            animation: 'slide_from_right',
          }}
        />

      </Stack.Navigator>
    </NavigationContainer>
  );
}