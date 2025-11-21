import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

export default function SettingScreen() {
  return (
    <View style={styles.container}>

      {/* Header sama seperti di RekapScreen */}
      <View style={styles.header}>
        <Text style={styles.headerText}>Pengaturan</Text>
      </View>

      {/* Isi Halaman */}
      <View style={styles.content}>
        <Text style={styles.title}>Pengaturan</Text>
      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },

  // === HEADER DARI REKAP ===
  header: {
    backgroundColor: '#00A86B',
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 16,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    alignItems: 'center',
  },
  headerText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '600',
  },

  // === KONTEN HALAMAN SETTING ===
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 30,
    color: '#000',
  },
});
