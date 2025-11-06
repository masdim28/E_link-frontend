import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Email dan password wajib diisi');
      return;
    }
    await AsyncStorage.setItem('user', JSON.stringify({ email }));
    router.replace('/(tabs)');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        <Text style={styles.green}>Sign Up</Text> / Log In
      </Text>
      <Text style={styles.subtitle}>To access all the features</Text>

      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
      />

      <TextInput
        style={styles.input}
        placeholder="Password"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      <TouchableOpacity style={styles.button} onPress={handleLogin}>
        <Text style={styles.buttonText}>Sign In</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, justifyContent: 'center', backgroundColor: '#fff' },
  title: { fontSize: 26, fontWeight: 'bold', marginBottom: 8, textAlign: 'left' },
  green: { color: '#00A86B' },
  subtitle: { color: '#777', marginBottom: 40, textAlign: 'left' },
  input: {
    borderBottomWidth: 1,
    borderBottomColor: '#aaa',
    marginBottom: 20,
    fontSize: 16,
    paddingVertical: 8,
  },
  button: {
    backgroundColor: '#00A86B',
    borderRadius: 10,
    paddingVertical: 14,
    marginTop: 10,
  },
  buttonText: { color: '#fff', textAlign: 'center', fontSize: 18, fontWeight: '600' },
});
