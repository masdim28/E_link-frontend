import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, TouchableOpacity, View } from "react-native";

// Import fungsi dari database.ts
import { getAllTransactions, openDatabase } from "../database/database";

// Definisikan tipe data untuk transaksi agar lebih rapi (optional tapi disarankan)
interface Transaksi {
  id: number;
  tanggal: string;
  jam: string;
  rekening: string;
  jenis: 'income' | 'expense';
  [kategori: string]: any; // Untuk kolom kategori dinamis
}

// Komponen untuk menampilkan satu item transaksi
const TransaksiItem = ({ item }: { item: Transaksi }) => {
  // Mencari nama kategori dan nilai (asumsi hanya ada satu kolom kategori per transaksi)
  const kategoriCols = Object.keys(item).filter(
    (key) => !['id', 'tanggal', 'jam', 'rekening', 'jenis'].includes(key) && item[key] !== null && item[key] !== 0
  );

  const kategori = kategoriCols.length > 0 ? kategoriCols[0].replace(/_/g, ' ') : 'Tidak Ada Kategori';
  const jumlah = kategoriCols.length > 0 ? item[kategoriCols[0]] : 0;
  const isPemasukan = item.jenis === 'income';

  return (
    <View style={styles.itemContainer}>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        {/* Ikon berdasarkan jenis */}
        <Ionicons 
          name={isPemasukan ? "arrow-up-circle" : "arrow-down-circle"} 
          size={24} 
          color={isPemasukan ? "#00A86B" : "#D9534F"} 
        />
        <View style={{ marginLeft: 10 }}>
          <Text style={styles.itemKategori}>{kategori}</Text>
          <Text style={styles.itemTanggal}>{`${item.tanggal} ${item.jam} (${item.rekening})`}</Text>
        </View>
      </View>
      <Text style={[styles.itemJumlah, { color: isPemasukan ? '#00A86B' : '#D9534F' }]}>
        {`${isPemasukan ? '+' : '-'} Rp${jumlah.toLocaleString('id-ID')}`}
      </Text>
    </View>
  );
};


export default function Riwayat() {
  const router = useRouter();
  const [transaksiData, setTransaksiData] = useState<Transaksi[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fungsi untuk mengambil data transaksi dari database
  const loadTransactions = useCallback(async () => {
    setIsLoading(true);
    try {
      // 1. Buka koneksi database
      const db = openDatabase(); 
      // 2. Ambil semua data
      const data = await getAllTransactions(db); 

      // Data yang baru diambil akan terbalik (yang terbaru di bawah), kita balik agar terbaru di atas
      setTransaksiData(data.reverse() as Transaksi[]); 
      
    } catch (error) {
      console.error("Gagal mengambil riwayat transaksi:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // useFocusEffect digunakan agar data dimuat ulang setiap kali halaman ini dibuka
  useFocusEffect(
    useCallback(() => {
      loadTransactions();
      // Cleanup function (tidak ada yang perlu di-cleanup untuk case ini)
      return () => {}; 
    }, [loadTransactions])
  );
  
  // Fungsi untuk merender list kosong
  const renderEmptyList = () => (
    <View style={styles.emptyContainer}>
        {isLoading ? (
            <ActivityIndicator size="large" color="#00A86B" />
        ) : (
            <Text style={styles.emptyText}>Belum ada transaksi yang tercatat.</Text>
        )}
    </View>
  );


  return (
    <View style={styles.container}>
      
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={26} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Riwayat</Text>
      </View>

      {/* CONTENT */}
      <FlatList
        data={transaksiData}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => <TransaksiItem item={item} />}
        ListEmptyComponent={renderEmptyList}
        contentContainerStyle={styles.listContent}
        refreshing={isLoading}
        onRefresh={loadTransactions}
      />
      
    </View>
  );
}


// Styling Sederhana
const styles = StyleSheet.create({
    container: {
        flex: 1, 
        backgroundColor: '#f9f9f9' // Ubah background agar ada kontras
    },
    header: {
        paddingTop: 50,
        paddingBottom: 20,
        paddingHorizontal: 16,
        backgroundColor: '#00A86B',
        flexDirection: 'row',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 20,
        color: '#fff',
        fontWeight: '600',
        marginLeft: 125,
    },
    itemContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
        backgroundColor: '#fff',
    },
    itemKategori: {
        fontSize: 16,
        fontWeight: '500',
    },
    itemTanggal: {
        fontSize: 12,
        color: '#888',
        marginTop: 2,
    },
    itemJumlah: {
        fontSize: 16,
        fontWeight: '600',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        paddingTop: 50
    },
    emptyText: {
        fontSize: 18, 
        color: '#666', 
        fontWeight: "600"
    },
    listContent: {
        flexGrow: 1
    }
});