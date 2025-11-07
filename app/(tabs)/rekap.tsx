import React, { useState } from 'react';
import { Dimensions, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { PieChart } from 'react-native-chart-kit';

export default function RekapScreen() {
  const screenWidth = Dimensions.get('window').width;
  const [isBulanan, setIsBulanan] = useState(true);

  // Data Bulanan
  const dataBulanan = [
    { name: 'Makan', amount: 2600000, color: '#1976D2' },
    { name: 'Kos', amount: 1900000, color: '#90CAF9' },
    { name: 'Kesehatan', amount: 500000, color: '#FB8C00' },
    { name: 'Transportasi', amount: 1000000, color: '#FFCC80' },
    { name: 'Jajan', amount: 1500000, color: '#388E3C' },
    { name: 'Buah', amount: 700000, color: '#81C784' },
    { name: 'Lain-lain', amount: 1800000, color: '#BDBDBD' },
  ];

  // Data Tahunan
  const dataTahunan = [
    { name: 'Makan', amount: 31000000, color: '#1976D2' },
    { name: 'Kos', amount: 22800000, color: '#90CAF9' },
    { name: 'Kesehatan', amount: 6000000, color: '#FB8C00' },
    { name: 'Transportasi', amount: 12000000, color: '#FFCC80' },
    { name: 'Jajan', amount: 17000000, color: '#388E3C' },
    { name: 'Buah', amount: 8000000, color: '#81C784' },
    { name: 'Lain-lain', amount: 15000000, color: '#BDBDBD' },
  ];

  const data = isBulanan ? dataBulanan : dataTahunan;
  const total = data.reduce((sum, item) => sum + item.amount, 0);

  const chartData = data.map((item) => ({
    name: item.name,
    population: item.amount,
    color: item.color,
    legendFontColor: '#000',
    legendFontSize: 12,
  }));

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerText}>Rekap</Text>
      </View>

      {/* Tombol Bulanan / Tahunan */}
      <View style={styles.switchContainer}>
        <TouchableOpacity
          style={[styles.switchButton, isBulanan && styles.switchActive]}
          onPress={() => setIsBulanan(true)}>
          <Text style={[styles.switchText, isBulanan && styles.switchTextActive]}>Bulanan</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.switchButton, !isBulanan && styles.switchActive]}
          onPress={() => setIsBulanan(false)}>
          <Text style={[styles.switchText, !isBulanan && styles.switchTextActive]}>Tahunan</Text>
        </TouchableOpacity>
      </View>

      {/* Judul Bulan / Tahun */}
      <Text style={styles.monthText}>{isBulanan ? 'Maret 2025' : 'Tahun 2025'}</Text>

      {/* Pie Chart */}
      <PieChart
        data={chartData}
        width={screenWidth}
        height={200}
        chartConfig={{
          color: () => '#000',
        }}
        accessor="population"
        backgroundColor="transparent"
        paddingLeft="10"
        hasLegend={false}
      />

      {/* Daftar Kategori */}
      <ScrollView style={styles.listContainer}>
        {data.map((item, index) => (
          <View key={index} style={styles.listItem}>
            <View style={[styles.colorBox, { backgroundColor: item.color }]} />
            <Text style={styles.category}>{item.name}</Text>
            <Text style={styles.amount}>
              {item.amount.toLocaleString('id-ID', { style: 'currency', currency: 'IDR' })}
            </Text>
          </View>
        ))}
      </ScrollView>
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
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 10,
    gap: 10,
  },
  switchButton: {
    paddingVertical: 6,
    paddingHorizontal: 25,
    borderRadius: 20,
    backgroundColor: '#BDBDBD',
  },
  switchActive: { backgroundColor: '#00A86B' },
  switchText: { color: '#fff', fontSize: 14 },
  switchTextActive: { color: '#fff', fontWeight: '600' },
  monthText: {
    textAlign: 'center',
    marginVertical: 10,
    fontSize: 16,
    fontWeight: '500',
  },
  listContainer: { marginTop: 10, paddingHorizontal: 20 },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 5,
  },
  colorBox: {
    width: 18,
    height: 18,
    marginRight: 10,
    borderRadius: 3,
  },
  category: { flex: 1, fontSize: 15 },
  amount: { fontSize: 15, color: '#000' },
});
