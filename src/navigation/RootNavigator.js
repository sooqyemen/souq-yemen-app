// src/navigation/RootNavigator.js

import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import { useAuth } from '../context/AuthContext';

import HomeScreen from '../screens/HomeScreen';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import ListingDetailsScreen from '../screens/ListingDetailsScreen';
import MapScreen from '../screens/MapScreen';
import ChatListScreen from '../screens/ChatListScreen';
import ChatScreen from '../screens/ChatScreen';
import ProfileScreen from '../screens/ProfileScreen';
import AdminDashboardScreen from '../screens/AdminDashboardScreen';
import CreateListingScreen from '../screens/CreateListingScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// هنا بريد المدير جاهز كما طلبت
const ADMIN_EMAIL = 'mansouralbarout@gmail.com';

function AppTabs() {
  return (
    <Tab.Navigator>
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{ title: 'الرئيسية' }}
      />
      {/* زر إضافة إعلان يفتح شاشة CreateListingScreen الجديدة */}
      <Tab.Screen
        name="NewListing"
        component={CreateListingScreen}
        options={{ title: 'إعلان جديد' }}
      />
      <Tab.Screen
        name="Map"
        component={MapScreen}
        options={{ title: 'الخريطة' }}
      />
      <Tab.Screen
        name="Chats"
        component={ChatListScreen}
        options={{ title: 'الرسائل' }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ title: 'حسابي' }}
      />
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
          {/* تبويبات التطبيق الأساسية */}
          <Stack.Screen
            name="AppTabs"
            component={AppTabs}
            options={{ headerShown: false }}
          />

          {/* تفاصيل إعلان */}
          <Stack.Screen
            name="ListingDetails"
            component={ListingDetailsScreen}
            options={{ title: 'تفاصيل الإعلان' }}
          />

          {/* شاشة محادثة واحدة */}
          <Stack.Screen
            name="Chat"
            component={ChatScreen}
            options={{ title: 'المحادثة' }}
          />

          {/* لوحة الإدارة تظهر فقط للمدير */}
          {isAdmin && (
            <Stack.Screen
              name="AdminDashboard"
              component={AdminDashboardScreen}
              options={{ title: 'لوحة الإدارة' }}
            />
          )}
        </>
      ) : (
        <>
          {/* قبل تسجيل الدخول */}
          <Stack.Screen
            name="Login"
            component={LoginScreen}
            options={{ title: 'تسجيل الدخول' }}
          />
          <Stack.Screen
            name="Register"
            component={RegisterScreen}
            options={{ title: 'إنشاء حساب' }}
          />
        </>
      )}
    </Stack.Navigator>
  );
}
