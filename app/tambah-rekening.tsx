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
          <Text style={styles.label}>Nama Bank / E-Wallet</Text>
          <TextInput
            style={styles.input}
            value={bank}
            onChangeText={setBank}
            placeholder="Contoh: BCA, Dana, Cash"
          />

          <Text style={styles.label}>Saldo Awal (Pemasukan)</Text>
          <TextInput
            style={styles.input}
            value={saldoAwal}
            onChangeText={setSaldoAwal}
            placeholder="Contoh: 1000000"
            keyboardType="numeric"
          />

          <TouchableOpacity 
              style={styles.saveButton} 
              onPress={handleSave}
              activeOpacity={0.8}
          >
            <Text style={styles.saveButtonText}>Simpan Rekening</Text>
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
        left: 16,
        top: 50,
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
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
    },
    saveButton: {
        backgroundColor: '#00A86B',
        padding: 15,
        borderRadius: 10,
        marginTop: 30,
        alignItems: 'center',
    },
    saveButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '700',
    },
});