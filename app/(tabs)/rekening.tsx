import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function RekeningScreen() {
  const data = [
    { nama: 'Total', saldo: 10000000 },
    { nama: 'CBA', saldo: 10000000 },
    { nama: 'RBI', saldo: 0 },
    { nama: 'Anad', saldo: 0 },
    { nama: 'Paygo', saldo: 0 },
    { nama: 'Goja', saldo: 0 },
  ];

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

      {/* Tombol + */}
      <TouchableOpacity style={styles.fab}>
        <Ionicons name="add" size={30} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    backgroundColor: '#00A86B',
    paddingVertical: 14,
    alignItems: 'center',
  },
  headerText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  listContainer: {
    paddingVertical: 10,
  },
  row: {
    flexDirection: 'row',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderBottomWidth: 0.5,
    borderBottomColor: '#ccc',
  },
  cell: {
    fontSize: 16,
  },
  left: {
    flex: 1,
    color: '#000',
  },
  right: {
    color: '#000',
    textAlign: 'right',
    width: 100,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 30,
    backgroundColor: '#00A86B',
    width: 55,
    height: 55,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
  },
});
