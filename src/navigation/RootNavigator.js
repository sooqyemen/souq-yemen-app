import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { ActivityIndicator, View } from 'react-native';
import { useAuth } from '../context/AuthContext';

import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import HomeScreen from '../screens/HomeScreen';
import ListingDetailsScreen from '../screens/ListingDetailsScreen';
import NewListingScreen from '../screens/NewListingScreen';
import MapScreen from '../screens/MapScreen';
import ChatListScreen from '../screens/ChatListScreen';
import ChatScreen from '../screens/ChatScreen';
import ProfileScreen from '../screens/ProfileScreen';
import AdminDashboardScreen from '../screens/AdminDashboardScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const ADMIN_EMAIL = 'mansouralbarour@gmail.com'; // عدل هذا إلى بريدك كمدير

function AppTabs() {
  return (
    <Tab.Navigator>
      <Tab.Screen name="Home" component={HomeScreen} options={{ title: 'الرئيسية' }} />
      <Tab.Screen name="NewListing" component={NewListingScreen} options={{ title: 'إعلان جديد' }} />
      <Tab.Screen name="Map" component={MapScreen} options={{ title: 'الخريطة' }} />
      <Tab.Screen name="Chats" component={ChatListScreen} options={{ title: 'الرسائل' }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ title: 'حسابي' }} />
    </Tab.Navigator>
  );
}

export default function RootNavigator() {
  const { user, initializing } = useAuth();

  if (initializing) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator />
      </View>
    );
  }

  const isAdmin = user?.email === ADMIN_EMAIL;

  return (
    <Stack.Navigator>
      {user ? (
        <>
          <Stack.Screen name="AppTabs" component={AppTabs} options={{ headerShown: false }} />
          <Stack.Screen name="ListingDetails" component={ListingDetailsScreen} options={{ title: 'تفاصيل الإعلان' }} />
          <Stack.Screen name="Chat" component={ChatScreen} options={{ title: 'المحادثة' }} />
          {isAdmin && (
            <Stack.Screen name="AdminDashboard" component={AdminDashboardScreen} options={{ title: 'لوحة الإدارة' }} />
          )}
        </>
      ) : (
        <>
          <Stack.Screen name="Login" component={LoginScreen} options={{ title: 'تسجيل الدخول' }} />
          <Stack.Screen name="Register" component={RegisterScreen} options={{ title: 'إنشاء حساب' }} />
        </>
      )}
    </Stack.Navigator>
  );
}
