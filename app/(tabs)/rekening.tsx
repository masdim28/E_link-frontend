import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
} from 'react-native';

type Rekening = {
  id: string;
  bank: string;
  saldo: number;
};

export default function RekeningScreen() {
  // router tetap ada jika nanti diperlukan
  const router = useRouter();

  const data: Rekening[] = [
    { id: '1', bank: 'BCA', saldo: 8000000 },
    { id: '2', bank: 'BRI', saldo: 2500000 },
  ];

  const totalSaldo = data.reduce((a, b) => a + b.saldo, 0);

  const renderItem = ({ item }: { item: Rekening }) => (
    <View style={styles.item}>
      <Text style={styles.itemBank}>{item.bank}</Text>
      <Text style={styles.itemSaldo}>
        Rp {item.saldo.toLocaleString('id-ID')}
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Rekening</Text>

        <View style={styles.summaryContainer}>
          <Text style={styles.summaryTitle}>Total Saldo</Text>
          <Text style={styles.summaryAmount}>
            Rp {totalSaldo.toLocaleString('id-ID')}
          </Text>
        </View>
      </View>

      {/* Daftar rekening */}
      <FlatList
        data={data}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
      />

      {/* Tombol tambah (tidak berfungsi) */}
      <View style={styles.fabContainer}>
        <TouchableOpacity style={styles.addButton} activeOpacity={0.7}>
          <Ionicons name="add" size={28} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: {
    backgroundColor: '#00A86B',
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 16,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 20,
    textAlign: 'center',
    fontWeight: '600',
    marginBottom: 16,
  },
  summaryContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingVertical: 10,
    alignItems: 'center',
  },
  summaryTitle: { fontWeight: '600', color: '#000' },
  summaryAmount: { fontWeight: 'bold', fontSize: 16, color: '#00A86B' },
  listContent: { paddingHorizontal: 16, paddingTop: 20 },
  item: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 0.6,
    borderColor: '#E5E5E5',
  },
  itemBank: { fontSize: 16, fontWeight: 'bold' },
  itemSaldo: { fontSize: 16, fontWeight: '600', color: '#00A86B' },

  fabContainer: {
    position: 'absolute',
    bottom: 25,
    right: 25,
    alignItems: 'center',
  },
  addButton: {
    backgroundColor: '#00A86B',
    width: 55,
    height: 55,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
  },
});
