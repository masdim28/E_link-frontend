import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { getAllTransactions, openDatabase } from '../../database/database';

type Transaction = {
  id: string;
  jenis: 'income' | 'expense';
  tanggal: string;
  jam: string;
  rekening: string;
  [key: string]: any;
};

export default function TransaksiScreen() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [showOptions, setShowOptions] = useState(false);
  const fadeAnim = useState(new Animated.Value(0))[0];
  const router = useRouter();
  const db = openDatabase();

  const toggleOptions = () => {
    if (showOptions) {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start(() => setShowOptions(false));
    } else {
      setShowOptions(true);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  };

  const fetchTransactions = async () => {
    setLoading(true);
    const data = await getAllTransactions(db);
    setTransactions(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  
  // 🔧 Perhitungan total (tanpa ubah tampilan)
   // ✅ Perhitungan total fix (pastikan semua kolom dinamis terbaca)
  const totalIncome = transactions
    .filter(t => t.jenis === 'income')
    .reduce((sum, item) => {
      let totalKategori = 0;
      for (const [key, val] of Object.entries(item)) {
        if (!['id', 'tanggal', 'jam', 'rekening', 'jenis'].includes(key)) {
          const num = Number(val);
          if (!isNaN(num) && num > 0) totalKategori += num;
        }
      }
      return sum + totalKategori;
    }, 0);

  const totalExpense = transactions
    .filter(t => t.jenis === 'expense')
    .reduce((sum, item) => {
      let totalKategori = 0;
      for (const [key, val] of Object.entries(item)) {
        if (!['id', 'tanggal', 'jam', 'rekening', 'jenis'].includes(key)) {
          const num = Number(val);
          if (!isNaN(num) && num > 0) totalKategori += num;
        }
      }
      return sum + totalKategori;
    }, 0);

  const difference = totalIncome - totalExpense;

  const renderItem = ({ item }: { item: Transaction }) => {
    const kategoriKeys = Object.keys(item).filter(
      k => !['id', 'tanggal', 'jam', 'rekening', 'jenis'].includes(k)
    );
    const totalAmount = kategoriKeys.reduce((s, key) => s + (Number(item[key]) || 0), 0);

    return (
      <View style={styles.item}>
        <View>
          <Text style={styles.itemTitle}>{item.rekening}</Text>
          <Text style={styles.itemCategory}>
            {kategoriKeys.join(', ')} - {item.tanggal} {item.jam}
          </Text>
        </View>
        <Text
          style={[
            styles.itemAmount,
            { color: item.jenis === 'income' ? '#FFB84C' : '#D83A56' },
          ]}
        >
          {item.jenis === 'income'
            ? `+ ${totalAmount.toLocaleString('id-ID')}`
            : `- ${totalAmount.toLocaleString('id-ID')}`}
        </Text>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#00A86B" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header hijau */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Transaksi</Text>
        <View style={styles.summaryContainer}>
          <View style={styles.summaryBox}>
            <Text style={styles.summaryTitle}>Pemasukan</Text>
            <Text style={[styles.summaryAmount, { color: '#FFB84C' }]}>
              + {totalIncome.toLocaleString('id-ID')}
            </Text>
          </View>
          <View style={styles.summaryBox}>
            <Text style={styles.summaryTitle}>Pengeluaran</Text>
            <Text style={[styles.summaryAmount, { color: '#D83A56' }]}>
              - {totalExpense.toLocaleString('id-ID')}
            </Text>
          </View>
          <View style={styles.summaryBox}>
            <Text style={styles.summaryTitle}>Selisih</Text>
            <Text style={[styles.summaryAmount, { color: '#7A9D54' }]}>
              {difference.toLocaleString('id-ID')}
            </Text>
          </View>
        </View>
      </View>

      {/* Daftar transaksi */}
      <FlatList
        data={transactions}
        renderItem={renderItem}
        keyExtractor={item => item.id.toString()}
        contentContainerStyle={styles.listContent}
        refreshing={loading}
        onRefresh={fetchTransactions}
      />

      {/* Overlay + FAB */}
      {showOptions && (
        <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
          <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={toggleOptions} />
        </Animated.View>
      )}

      <View style={styles.fabContainer}>
        {showOptions && (
          <Animated.View style={[styles.optionContainer, { opacity: fadeAnim }]}>
            <View style={styles.optionRow}>
              <View style={styles.optionLabel}>
                <Text style={styles.optionLabelText}>Pemasukan</Text>
              </View>
              <TouchableOpacity
                style={[styles.optionIcon, { backgroundColor: '#00A86B' }]}
                onPress={() => router.push('/tambah-pemasukan')}
              >
                <Ionicons name="card-outline" size={20} color="#fff" />
              </TouchableOpacity>
            </View>
            <View style={styles.optionRow}>
              <View style={styles.optionLabel}>
                <Text style={styles.optionLabelText}>Pengeluaran</Text>
              </View>
              <TouchableOpacity
                style={[styles.optionIcon, { backgroundColor: '#D83A56' }]}
                onPress={() => router.push('/tambah-pengeluaran')}
              >
                <Ionicons name="bag-handle-outline" size={20} color="#fff" />
              </TouchableOpacity>
            </View>
          </Animated.View>
        )}
        <TouchableOpacity style={styles.addButton} onPress={toggleOptions}>
          <Ionicons name={showOptions ? 'close' : 'add'} size={28} color="#fff" />
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
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 10,
    justifyContent: 'space-between',
  },
  summaryBox: { alignItems: 'center', flex: 1 },
  summaryTitle: { fontWeight: '600', color: '#000' },
  summaryAmount: { fontWeight: 'bold', marginTop: 4 },
  listContent: { paddingHorizontal: 16, paddingTop: 20 },
  item: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 0.6,
    borderColor: '#E5E5E5',
  },
  itemTitle: { fontSize: 16, fontWeight: 'bold' },
  itemCategory: { fontSize: 12, color: '#555' },
  itemAmount: { fontSize: 16, fontWeight: '600' },
  fabContainer: { position: 'absolute', bottom: 25, right: 25, alignItems: 'center' },
  addButton: {
    backgroundColor: '#00A86B',
    width: 55,
    height: 55,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
  },
  optionContainer: { alignItems: 'flex-end', marginBottom: 10, gap: 12 },
  optionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end' },
  optionLabel: { backgroundColor: '#f2f2f2', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 8, marginRight: 8 },
  optionLabelText: { color: '#000', fontSize: 14, fontWeight: '500' },
  optionIcon: { width: 45, height: 45, borderRadius: 25, justifyContent: 'center', alignItems: 'center' },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.3)' },
});
