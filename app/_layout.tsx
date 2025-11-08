import { Stack } from 'expo-router';
import React from 'react';

export default function RootLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
    {/* Tabs utama */}
      <Stack.Screen name="(tabs)" />
    </Stack>
  );
}
