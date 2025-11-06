import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';

export default function SettingScreen() {
  const router = useRouter();

  const handleLogout = async () => {
    await AsyncStorage.removeItem('user');
    router.replace('/login');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Pengaturan</Text>
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 30 },
  logoutButton: {
    backgroundColor: '#D83A56',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 8,
  },
  logoutText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
