import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Animated, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function RekeningScreen() {
  const [showOptions, setShowOptions] = useState(false);
  const fadeAnim = useState(new Animated.Value(0))[0];

  const data = [
    { nama: 'Total', saldo: 10000000 },
    { nama: 'CBA', saldo: 10000000 },
    { nama: 'RBI', saldo: 0 },
    { nama: 'Anad', saldo: 0 },
    { nama: 'Paygo', saldo: 0 },
    { nama: 'Goja', saldo: 0 },
  ];

  const toggleOptions = () => {
    if (showOptions) {
      Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }).start(() => {
        setShowOptions(false);
      });
    } else {
      setShowOptions(true);
      Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }).start();
    }
  };

  return (
    <View style={styles.container}>
      {/* Header Hijau */}
      <View style={styles.header}>
        <Text style={styles.headerText}>Rekening</Text>
      </View>

      {/* Daftar Rekening */}
      <ScrollView style={styles.listContainer}>
        {data.map((item, index) => (
          <View key={index} style={styles.row}>
            <Text style={[styles.cell, styles.left]}>{item.nama}</Text>
            <Text style={[styles.cell, styles.right]}>
              {item.saldo.toLocaleString('id-ID')}
            </Text>
          </View>
        ))}
      </ScrollView>

      {/* Overlay Gelap */}
      {showOptions && (
        <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
          <TouchableOpacity style={styles.overlayTouch} onPress={toggleOptions} />
        </Animated.View>
      )}

      {/* Tombol Tambah + Opsi */}
      <View style={styles.fabContainer}>
        {showOptions && (
          <Animated.View style={[styles.optionContainer, { opacity: fadeAnim }]}>
            {/* Tombol Pemasukan */}
            <View style={styles.optionRow}>
              <TouchableOpacity style={styles.optionLabel}>
                <Text style={styles.optionLabelText}>Pemasukan</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.optionIcon, { backgroundColor: '#00A86B' }]}>
                <Ionicons name="card-outline" size={20} color="#fff" />
              </TouchableOpacity>
            </View>

            {/* Tombol Pengeluaran */}
            <View style={styles.optionRow}>
              <TouchableOpacity style={styles.optionLabel}>
                <Text style={styles.optionLabelText}>Pengeluaran</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.optionIcon, { backgroundColor: '#D83A56' }]}>
                <Ionicons name="bag-handle-outline" size={20} color="#fff" />
              </TouchableOpacity>
            </View>
          </Animated.View>
        )}

        <TouchableOpacity style={styles.fab} onPress={toggleOptions}>
          <Ionicons name={showOptions ? 'close' : 'add'} size={30} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: {
    backgroundColor: '#00A86B',
    paddingVertical: 14,
    alignItems: 'center',
  },
  headerText: { color: '#fff', fontSize: 18, fontWeight: '600' },
  listContainer: { paddingVertical: 10 },
  row: {
    flexDirection: 'row',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderBottomWidth: 0.5,
    borderBottomColor: '#ccc',
  },
  cell: { fontSize: 16 },
  left: { flex: 1, color: '#000' },
  right: { color: '#000', textAlign: 'right', width: 100 },

  fabContainer: { position: 'absolute', right: 20, bottom: 30, alignItems: 'center' },
  fab: {
    backgroundColor: '#00A86B',
    width: 55,
    height: 55,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
  },

  // === Gaya baru untuk tombol Pemasukan & Pengeluaran ===
  optionContainer: {
    alignItems: 'flex-end',
    marginBottom: 10,
    gap: 12,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  optionLabel: {
    backgroundColor: '#f2f2f2',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginRight: 8,
  },
  optionLabelText: {
    color: '#000',
    fontSize: 14,
    fontWeight: '500',
  },
  optionIcon: {
    width: 45,
    height: 45,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },

  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  overlayTouch: { flex: 1 },
});
