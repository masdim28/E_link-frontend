import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

// Import fungsi dari database
import { getAllRekening, openDatabase } from '../../database/database';

type Rekening = {
  id: number; 
  bank: string;
  saldo: number;
};

export default function RekeningScreen() {
  const router = useRouter();
  const [data, setData] = useState<Rekening[]>([]);
  const [totalSaldo, setTotalSaldo] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Fungsi untuk mengambil data rekening
  const loadRekening = useCallback(async () => {
    setIsLoading(true);
    try {
      const db = openDatabase(); 
      const rekeningList = await getAllRekening(db);
      setData(rekeningList);

      // Hitung total saldo
      const total = rekeningList.reduce((sum, item) => sum + item.saldo, 0);
      setTotalSaldo(total);

    } catch (error) {
      console.error("Gagal memuat rekening:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Memuat data saat komponen fokus (setiap kali tab dibuka)
  useFocusEffect(
    useCallback(() => {
      loadRekening();
      return () => {}; 
    }, [loadRekening])
  );
  
  const renderItem = ({ item }: { item: Rekening }) => (
    <View style={styles.item}>
      <Text style={styles.itemBank}>{item.bank}</Text>
      <Text style={styles.itemSaldo}>
        Rp {item.saldo.toLocaleString('id-ID')}
      </Text>
    </View>
  );

  if (isLoading && data.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#00A86B" />
        <Text style={{marginTop: 10, color: '#00A86B'}}>Memuat data rekening...</Text>
      </View>
    );
  }

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
        keyExtractor={item => item.id.toString()}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={() => (
          <Text style={styles.emptyText}>Belum ada rekening yang tercatat.</Text>
        )}
        refreshing={isLoading}
        onRefresh={loadRekening}
      />

      {/* Tombol tambah */}
      <View style={styles.fabContainer}>
        <TouchableOpacity 
          style={styles.addButton} 
          activeOpacity={0.7}
          onPress={() => router.push('/tambah-rekening' as any)} 
        >
          <Ionicons name="add" size={28} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

// Style
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
  listContent: { paddingHorizontal: 16, paddingTop: 20, flexGrow: 1 },
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
  loadingContainer: { 
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff'
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
    color: '#888'
  }
});
