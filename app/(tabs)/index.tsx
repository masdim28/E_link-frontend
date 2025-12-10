import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  FlatList,
  Platform,
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
  kategori?: string;
  jumlah?: number;
  [key: string]: any;
};

export default function TransaksiScreen() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [showOptions, setShowOptions] = useState(false);
  const fadeAnim = useState(new Animated.Value(0))[0];
  const router = useRouter();
  const db = openDatabase();

  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );

  // ==== NEW: DatePicker visibility ====
  const [showDatePicker, setShowDatePicker] = useState(false);

  const changeDate = (days: number) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + days);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

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
    const data = (await getAllTransactions(db)) as any as Transaction[];

    const normalize = (t: string) =>
      new Date(t).toISOString().split('T')[0];

    const filtered = data.filter(
      item => normalize(item.tanggal) === selectedDate
    );

    const mapped = filtered.map(item => {
      const kategoriKeys = Object.keys(item).filter(
        k => !['id', 'tanggal', 'jam', 'rekening', 'jenis'].includes(k)
      );

      let foundKategori = '';
      let jumlah = 0;

      for (const key of kategoriKeys) {
        if (item[key] != null && Number(item[key]) > 0) {
          foundKategori = key;
          jumlah = Number(item[key]);
          break;
        }
      }

      return { ...item, kategori: foundKategori.replace(/_/g, ' '), jumlah };
    });

    setTransactions(mapped);
    setLoading(false);
  };

  useFocusEffect(
    React.useCallback(() => {
      fetchTransactions();
    }, [selectedDate])
  );

  useEffect(() => {
    fetchTransactions();
  }, [selectedDate]);

  const totalIncome = transactions
    .filter(t => t.jenis === 'income')
    .reduce((sum, item) => sum + (item.jumlah || 0), 0);

  const totalExpense = transactions
    .filter(t => t.jenis === 'expense')
    .reduce((sum, item) => sum + (item.jumlah || 0), 0);

  const difference = totalIncome - totalExpense;

  const renderItem = ({ item }: { item: Transaction }) => {
    return (
      <TouchableOpacity
        onPress={() =>
          router.push({
            pathname: '/edit-transaksi',
            params: {
              id: item.id,
              jenis: item.jenis,
              tanggal: item.tanggal,
              jam: item.jam,
              rekening: item.rekening,
              jumlah: item.jumlah?.toString() || '0',
              kategori: item.kategori || '',
            },
          })
        }
      >
        <View style={styles.item}>
          <View style={{ flex: 1 }}>
            <Text style={styles.itemTitle}>{item.rekening}</Text>
            <Text style={styles.itemCategory}>
              {item.kategori} - {item.tanggal} {item.jam}
            </Text>
          </View>

          <Text
            style={[
              styles.itemAmount,
              { color: item.jenis === 'income' ? '#00A86B' : '#D83A56' },
            ]}
          >
            {item.jenis === 'income'
              ? `+ ${(item.jumlah || 0).toLocaleString('id-ID')}`
              : `- ${(item.jumlah || 0).toLocaleString('id-ID')}`}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View
        style={[
          styles.container,
          { justifyContent: 'center', alignItems: 'center' },
        ]}
      >
        <ActivityIndicator size="large" color="#00A86B" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>

        <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center' }}>

          <TouchableOpacity onPress={() => changeDate(-1)}>
            <Ionicons name="chevron-back" size={24} color="#fff" />
          </TouchableOpacity>

          {/* ==== NEW: TANGGAL BISA DITEKAN ==== */}
          <TouchableOpacity onPress={() => setShowDatePicker(true)}>
            <Text style={[styles.headerTitle, { marginHorizontal: 10 }]}>
              {new Date(selectedDate).toLocaleDateString('id-ID', {
                weekday: 'short',
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => changeDate(1)}>
            <Ionicons name="chevron-forward" size={24} color="#fff" />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.push('/riwayat')}
            style={{ marginLeft: 20 }}
          >
            <MaterialIcons name="history" size={30} color="#fff" />
          </TouchableOpacity>
        </View>

        <View style={styles.summaryContainer}>
          <View style={styles.summaryBox}>
            <Text style={styles.summaryTitle}>Pemasukan</Text>
            <Text style={[styles.summaryAmount, { color: '#00A86B' }]}>
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
            <Text style={[styles.summaryAmount, { color: '#F4CE14' }]}>
              {difference.toLocaleString('id-ID')}
            </Text>
          </View>
        </View>
      </View>

      {/* ==== DATE PICKER ==== */}
      {showDatePicker && (
        <DateTimePicker
          value={new Date(selectedDate)}
          mode="date"
          display={Platform.OS === 'ios' ? 'inline' : 'calendar'}
          onChange={(event, date) => {
            setShowDatePicker(false);
            if (date) {
              setSelectedDate(date.toISOString().split('T')[0]);
            }
          }}
        />
      )}

      <FlatList
        data={transactions}
        renderItem={renderItem}
        keyExtractor={item => item.id.toString()}
        contentContainerStyle={styles.listContent}
        refreshing={loading}
        onRefresh={fetchTransactions}
        ListEmptyComponent={() => (
          <Text style={{ textAlign: 'center', marginTop: 30, color: '#777' }}>
            Tidak ada transaksi pada tanggal ini.
          </Text>
        )}
      />

      {/* FAB & OPTIONS */}
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
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 0.6,
    borderColor: '#E5E5E5',
  },
  itemTitle: { fontSize: 16, fontWeight: 'bold' },
  itemCategory: { fontSize: 12, color: '#555' },
  itemAmount: { minWidth: 90, textAlign: 'right', fontSize: 16, fontWeight: '600' },
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
  optionLabel: {
    backgroundColor: '#f2f2f2',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginRight: 8,
  },
  optionLabelText: { color: '#000', fontSize: 14, fontWeight: '500' },
  optionIcon: { width: 45, height: 45, borderRadius: 25, justifyContent: 'center', alignItems: 'center' },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.3)' },
});
