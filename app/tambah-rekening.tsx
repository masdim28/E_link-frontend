import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from "react-native";

import {
  openDatabase,
  insertRekening,
  insertPemasukan,
  isRekeningExists,
} from "../database/database";

export default function TambahRekening() {
  const router = useRouter();
  const [bank, setBank] = useState("");
  const [saldoAwal, setSaldoAwal] = useState("");

  // ========= FORMAT SALDO DENGAN TITIK =========
  const handleSaldoChange = (text: string) => {
    // Hanya boleh angka
    const numeric = text.replace(/[^0-9]/g, "");

    // Format titik ribuan
    const formatted = numeric.replace(/\B(?=(\d{3})+(?!\d))/g, ".");

    setSaldoAwal(formatted);
  };

  // ================ SAVE ====================
  const handleSave = async () => {
    const cleanBank = bank.trim();
    const jumlah = parseFloat(saldoAwal.replace(/[^0-9]/g, ""));

    if (!cleanBank || isNaN(jumlah)) {
      Alert.alert("Input salah", "Isi nama rekening dan saldo awal dengan benar.");
      return;
    }

    try {
      const db = openDatabase();

      // 🔥 CEK NAMA REKENING SUDAH ADA
      const exists = await isRekeningExists(db, cleanBank);

      if (exists) {
        Alert.alert("Peringatan", "Nama rekening tersebut sudah ada!");
        return;
      }

      // 1. Buat rekening baru
      await insertRekening(db, cleanBank, jumlah);

      // 2. Masukkan transaksi saldo awal
      const now = new Date();
      const tanggal = now.toISOString().split("T")[0];
      const jam = now.toTimeString().substring(0, 5);

      await insertPemasukan(db, {
        tanggal,
        jam,
        rekening: cleanBank,
        kategori: "Saldo Awal",
        jumlah,
      });

      Alert.alert("Berhasil", "Rekening berhasil dibuat!");
      router.back();
    } catch (e) {
      console.log(e);
      Alert.alert("Error", "Gagal menyimpan rekening.");
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={26} color="#fff" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Tambah Rekening</Text>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <View style={styles.content}>
          <TextInput
            style={styles.input}
            placeholder="Nama Rekening"
            value={bank}
            onChangeText={setBank}
          />

          <TextInput
            style={styles.input}
            placeholder="Saldo Awal"
            keyboardType="numeric"
            value={saldoAwal}
            onChangeText={handleSaldoChange}
          />

          <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
            <Text style={styles.saveButtonText}>Simpan</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f9f9f9" },
  header: {
    backgroundColor: "#00A86B",
    paddingTop: 50,
    paddingBottom: 16,
    alignItems: "center",
    justifyContent: "center",
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  backButton: { position: "absolute", left: 20, top: 46 },
  headerTitle: { fontSize: 20, fontWeight: "600", color: "#fff" },
  content: { padding: 20 },
  input: {
    backgroundColor: "#E6E6E6",
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 14,
    fontSize: 16,
    marginBottom: 14,
  },
  saveButton: {
    backgroundColor: "#00A86B",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 10,
    alignSelf: "flex-end",
  },
  saveButtonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
});
