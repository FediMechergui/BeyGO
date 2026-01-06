import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

import { colors } from '../theme';

// Screens
import HomeScreen from '../screens/main/HomeScreen';
import ExploreScreen from '../screens/main/ExploreScreen';
import MapScreen from '../screens/main/MapScreen';
import ProfileScreen from '../screens/main/ProfileScreen';
import MuseumDetailScreen from '../screens/museum/MuseumDetailScreen';
import BeyListScreen from '../screens/bey/BeyListScreen';
import BeyDetailScreen from '../screens/bey/BeyDetailScreen';
import PuzzleScreen from '../screens/puzzle/PuzzleScreen';
import ARCameraScreen from '../screens/puzzle/ARCameraScreen';
import RewardsScreen from '../screens/rewards/RewardsScreen';
import LeaderboardScreen from '../screens/social/LeaderboardScreen';
import TimelineScreen from '../screens/history/TimelineScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

// Home Stack
function HomeStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.primary },
        headerTintColor: colors.textInverse,
        headerTitleStyle: { fontWeight: 'bold' },
      }}
    >
      <Stack.Screen 
        name="HomeMain" 
        component={HomeScreen} 
        options={{ title: 'BeyGo' }}
      />
      <Stack.Screen 
        name="MuseumDetail" 
        component={MuseumDetailScreen}
        options={{ title: 'Museum' }}
      />
      <Stack.Screen 
        name="BeyList" 
        component={BeyListScreen}
        options={{ title: 'Beys' }}
      />
      <Stack.Screen 
        name="BeyDetail" 
        component={BeyDetailScreen}
        options={{ title: 'Bey Details' }}
      />
      <Stack.Screen 
        name="Puzzle" 
        component={PuzzleScreen}
        options={{ title: 'Puzzle Challenge', headerShown: false }}
      />
      <Stack.Screen 
        name="ARCamera" 
        component={ARCameraScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="Timeline" 
        component={TimelineScreen}
        options={{ title: 'Dynasty Timeline' }}
      />
    </Stack.Navigator>
  );
}

// Explore Stack
function ExploreStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.primary },
        headerTintColor: colors.textInverse,
        headerTitleStyle: { fontWeight: 'bold' },
      }}
    >
      <Stack.Screen 
        name="ExploreMain" 
        component={ExploreScreen}
        options={{ title: 'Explore' }}
      />
      <Stack.Screen 
        name="Timeline" 
        component={TimelineScreen}
        options={{ title: 'Dynasty Timeline' }}
      />
      <Stack.Screen 
        name="BeyDetail" 
        component={BeyDetailScreen}
        options={{ title: 'Bey Details' }}
      />
    </Stack.Navigator>
  );
}

// Map Stack
function MapStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.primary },
        headerTintColor: colors.textInverse,
        headerTitleStyle: { fontWeight: 'bold' },
      }}
    >
      <Stack.Screen 
        name="MapMain" 
        component={MapScreen}
        options={{ title: 'Museum Map' }}
      />
      <Stack.Screen 
        name="MuseumDetail" 
        component={MuseumDetailScreen}
        options={{ title: 'Museum' }}
      />
    </Stack.Navigator>
  );
}

// Profile Stack
function ProfileStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.primary },
        headerTintColor: colors.textInverse,
        headerTitleStyle: { fontWeight: 'bold' },
      }}
    >
      <Stack.Screen 
        name="ProfileMain" 
        component={ProfileScreen}
        options={{ title: 'Profile' }}
      />
      <Stack.Screen 
        name="Rewards" 
        component={RewardsScreen}
        options={{ title: 'My Rewards' }}
      />
      <Stack.Screen 
        name="Leaderboard" 
        component={LeaderboardScreen}
        options={{ title: 'Leaderboard' }}
      />
    </Stack.Navigator>
  );
}

export default function MainNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Explore') {
            iconName = focused ? 'compass' : 'compass-outline';
          } else if (route.name === 'Map') {
            iconName = focused ? 'map' : 'map-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopColor: colors.border,
          paddingBottom: 5,
          paddingTop: 5,
          height: 60,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeStack} />
      <Tab.Screen name="Explore" component={ExploreStack} />
      <Tab.Screen name="Map" component={MapStack} />
      <Tab.Screen name="Profile" component={ProfileStack} />
    </Tab.Navigator>
  );
}
