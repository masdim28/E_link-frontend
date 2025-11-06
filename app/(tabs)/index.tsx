import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type Transaction = {
  id: string;
  title: string;
  category: string;
  amount: number;
  type: 'income' | 'expense';
};

export default function TransaksiScreen() {
  const data: Transaction[] = [
    { id: '1', title: 'Gaji Bulanan', category: 'Gaji Bulanan', amount: 10000000, type: 'income' },
    { id: '2', title: 'Makanan dan Minuman', category: 'Makanan', amount: 2600000, type: 'expense' },
  ];

  const totalIncome = data.filter(d => d.type === 'income').reduce((a, b) => a + b.amount, 0);
  const totalExpense = data.filter(d => d.type === 'expense').reduce((a, b) => a + b.amount, 0);
  const difference = totalIncome - totalExpense;

  const renderItem = ({ item }: { item: Transaction }) => (
    <View style={styles.item}>
      <View>
        <Text style={styles.itemTitle}>{item.title}</Text>
        <Text style={styles.itemCategory}>{item.category}</Text>
      </View>
      <Text
        style={[
          styles.itemAmount,
          { color: item.type === 'income' ? '#FFB84C' : '#D83A56' },
        ]}
      >
        {item.type === 'income'
          ? `+ ${item.amount.toLocaleString('id-ID')}`
          : `- ${item.amount.toLocaleString('id-ID')}`}
      </Text>
    </View>
  );

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
        data={data}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
      />

      {/* Tombol tambah */}
      <TouchableOpacity style={styles.addButton}>
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>
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
  addButton: {
    backgroundColor: '#00A86B',
    width: 50,
    height: 50,
    borderRadius: 25,
    position: 'absolute',
    bottom: 25,
    right: 25,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
  },
});
