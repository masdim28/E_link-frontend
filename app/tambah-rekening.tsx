import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

// Import fungsi yang diperlukan
import { insertPemasukan, insertRekening, openDatabase } from "../database/database";

export default function TambahRekeningScreen() {
  const router = useRouter();
  const [bank, setBank] = useState('');
  const [saldoAwal, setSaldoAwal] = useState('');

  const handleSave = async () => {
    const jumlah = parseFloat(saldoAwal.replace(/[^0-9]/g, '')); // Bersihkan input dari non-angka
    const cleanBank = bank.trim();

    if (!cleanBank || isNaN(jumlah) || jumlah < 0) {
      Alert.alert("Input Tidak Valid", "Mohon isi nama bank dan saldo awal yang benar.");
      return;
    }

    try {
      const db = openDatabase();
      
      // 1. Simpan Rekening Baru dengan saldo awal
      await insertRekening(db, { bank: cleanBank, saldo: jumlah });

      // 2. Catat sebagai Transaksi Pemasukan (Saldo Awal)
      const date = new Date();
      const tanggal = date.toISOString().split('T')[0];
      const jam = date.toTimeString().split(' ')[0].substring(0, 5);
      
      await insertPemasukan(db, {
          tanggal,
          jam,
          rekening: cleanBank, 
          kategori: 'Saldo Awal', // Gunakan kategori khusus
          jumlah,
      });

      Alert.alert("Berhasil", "Rekening baru berhasil ditambahkan!");
      router.back();

    } catch (error: any) {
      console.error("Gagal menyimpan rekening:", error);
      if (error.message.includes('UNIQUE constraint failed')) {
         Alert.alert("Gagal", "Nama rekening ini sudah ada.");
      } else {
         Alert.alert("Error", "Gagal menyimpan rekening. Silakan coba lagi.");
      }
    }
  };

  return (
    <View style={styles.container}>
      
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={26} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Tambah Rekening</Text>
      </View>

      <KeyboardAvoidingView 
        style={{flex: 1}} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.content}>
      
          <TextInput
            style={styles.input}
            value={bank}
            onChangeText={setBank}
            placeholder="Nama Rekening"
          />


          <TextInput
            style={styles.input}
            value={saldoAwal}
            onChangeText={setSaldoAwal}
            placeholder="Saldo" 
            keyboardType="numeric"
          />

          <TouchableOpacity 
              style={styles.saveButton} 
              onPress={handleSave}
              activeOpacity={0.8}
          >
            <Text style={styles.saveButtonText}>Simpan</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

    </View>
  );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f9f9f9' },
    header: {
        backgroundColor: '#00A86B',
        paddingTop: 50,
        paddingBottom: 20,
        paddingHorizontal: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        borderBottomLeftRadius: 20, 
        borderBottomRightRadius: 20,
    },
   backButton: {
    position: 'absolute',
    left: 20,
    top: 34,
    paddingTop: 20,
    paddingBottom: 20,
},
    headerTitle: {
        color: '#fff',
        fontSize: 20,
        fontWeight: '600',
    },
    content: {
        padding: 20,
    },
    label: {
        fontSize: 16,
        fontWeight: '500',
        marginTop: 15,
        marginBottom: 5,
        color: '#333',
    },
  input: {
    backgroundColor: '#E6E6E6',
    borderWidth: 0,
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 15,
    fontSize: 16,
    marginTop: 5,
    marginBottom: 12,
},


   saveButton: {
    backgroundColor: '#00A86B',
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 10,
    alignSelf: 'flex-end',   // ➜ tombol ke kanan
    marginTop: 20,
},
saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
},
});