import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Colors } from '../constants/theme';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <StatusBar style="dark" backgroundColor={Colors.paper} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: Colors.paper },
          animation: 'fade',
        }}
      >
        <Stack.Screen name="index" options={{ title: 'PAPERTRAIL' }} />
        <Stack.Screen name="editor" options={{ title: 'Editor' }} />
        <Stack.Screen name="library" options={{ title: 'Library' }} />
        <Stack.Screen name="archive" options={{ title: 'Archive' }} />
        <Stack.Screen name="trash" options={{ title: 'Trash' }} />
        <Stack.Screen name="settings" options={{ title: 'Settings' }} />
        <Stack.Screen name="timeline" options={{ title: 'Timeline' }} />
        <Stack.Screen name="analytics" options={{ title: 'Analytics' }} />
        <Stack.Screen name="auth" options={{ title: 'Account Access' }} />
        <Stack.Screen name="account" options={{ title: 'Personal Account' }} />
      </Stack>
    </SafeAreaProvider>
  );
}
