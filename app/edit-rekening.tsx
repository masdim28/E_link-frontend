import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert,
  BackHandler,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import {
  deleteRekening,
  getRekeningById,
  isRekeningExists,
  openDatabase,
  updateNamaRekeningDiTransaksi,
  updateRekening,
} from "../database/database";

// ==========================
// TYPE DATA REKENING
// ==========================
type RekeningRow = {
  id: number;
  bank: string;
  saldo: number;
};

export default function EditRekening() {
  const router = useRouter();
  const { id } = useLocalSearchParams();

  const [bank, setBank] = useState("");
  const [saldo, setSaldo] = useState("");
  const [isCash, setIsCash] = useState(false);

  // ==========================================
  // FORMAT ANGKA
  // ==========================================
  const formatNumber = (value: string) => {
    const clean = value.replace(/\D/g, "");
    if (!clean) return "";
    return clean.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  };

  const handleSaldoChange = (text: string) => {
    setSaldo(formatNumber(text));
  };

  // ==========================================
  // LOAD DATA
  // ==========================================
  useEffect(() => {
    const loadData = async () => {
      const db = openDatabase();

      const data = (await getRekeningById(
        db,
        Number(id)
      )) as RekeningRow | null;

      if (!data) {
        Alert.alert("Error", "Rekening tidak ditemukan.");
        router.back();
        return;
      }

      setBank(data.bank);
      setSaldo(formatNumber(String(data.saldo)));
      setIsCash(data.bank.toLowerCase() === "uang tunai");
    };

    loadData();
  }, [id]);

  // ==========================================
  // KONFIRMASI KELUAR
  // ==========================================
  const konfirmasiKeluar = () => {
    Alert.alert("Konfirmasi", "Apakah kamu ingin meninggalkan halaman ini?", [
      { text: "Tidak", style: "cancel" },
      { text: "Iya", onPress: () => router.back() },
    ]);
  };

  useEffect(() => {
    const backHandler = BackHandler.addEventListener("hardwareBackPress", () => {
      konfirmasiKeluar();
      return true;
    });
    return () => backHandler.remove();
  }, []);

  // ==========================================
  // SAVE REKENING
  // ==========================================
  const handleSave = async () => {
    if (!bank.trim()) {
      Alert.alert("Error", "Nama rekening tidak boleh kosong.");
      return;
    }

    const db = openDatabase();

    const nowData = (await getRekeningById(
      db,
      Number(id)
    )) as RekeningRow | null;

    if (!nowData) return;

    const oldName = nowData.bank; // <-- NAMA LAMA DISIMPAN

    if (isCash && bank.trim() !== oldName) {
      Alert.alert("Peringatan", "Rekening Uang Tunai tidak dapat diubah namanya.");
      setBank(oldName);
      return;
    }

    // Cek duplikat
    const exists = await isRekeningExists(db, bank.trim());

    if (exists && bank.trim() !== oldName) {
      Alert.alert("Nama Sudah Ada", `Rekening "${bank}" sudah digunakan.`);
      return;
    }

    const numericSaldo = Number(saldo.replace(/\./g, "")) || 0;

    // 1. Update tabel rekening
    await updateRekening(db, Number(id), bank.trim(), numericSaldo);

    // 2. Update nama rekening di transaksi (FIX UTAMA)
    await updateNamaRekeningDiTransaksi(db, oldName, bank.trim());

    Alert.alert("Berhasil", "Rekening berhasil diperbarui.", [
      { text: "OK", onPress: () => router.back() },
    ]);
  };

  // ==========================================
  // DELETE REKENING
  // ==========================================
  const handleDelete = () => {
    Alert.alert("Hapus Rekening", "Yakin ingin menghapus rekening ini?", [
      { text: "Batal", style: "cancel" },
      {
        text: "Hapus",
        style: "destructive",
        onPress: async () => {
          const db = openDatabase();
          await deleteRekening(db, Number(id));
          Alert.alert("Berhasil", "Rekening dihapus.", [
            { text: "OK", onPress: () => router.back() },
          ]);
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={konfirmasiKeluar} style={styles.backButton}>
          <Ionicons name="arrow-back" size={26} color="#fff" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Edit Rekening</Text>
      </View>

      {/* CONTENT */}
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <View style={styles.content}>
          {/* INPUT NAMA */}
          <TextInput
            style={[styles.input, isCash && { backgroundColor: "#dcdcdc" }]}
            placeholder="Nama Rekening"
            value={bank}
            editable={!isCash}
            onChangeText={(text) => {
              if (isCash) {
                Alert.alert("Peringatan", "Rekening Uang Tunai tidak dapat diubah namanya.");
                return;
              }
              setBank(text);
            }}
          />

          {/* INPUT SALDO */}
          <TextInput
            style={styles.input}
            placeholder="Saldo Awal"
            value={saldo}
            onChangeText={handleSaldoChange}
            keyboardType="numeric"
          />

          {/* BUTTONS */}
          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
              <Text style={styles.deleteText}>Hapus</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
              <Text style={styles.saveText}>Simpan</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#ffffff" },

  header: {
    backgroundColor: "#00A86B",
    paddingTop: 50,
    paddingBottom: 16,
    alignItems: "center",
    justifyContent: "center",
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },

  backButton: {
    position: "absolute",
    left: 20,
    top: 46,
  },

  headerTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#fff",
  },

  content: { padding: 20, flex: 1 },

  input: {
    backgroundColor: "#E6E6E6",
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 15,
    fontSize: 16,
    marginBottom: 14,
  },

  buttonRow: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 10,
    marginTop: 10,
  },

  deleteButton: {
    backgroundColor: "#D9534F",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },

  deleteText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
  },

  saveButton: {
    backgroundColor: "#00A86B",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },

  saveText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
  },
});
