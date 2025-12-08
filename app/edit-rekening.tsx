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
    deleteInitialBalanceTransaction,
    deleteRekening,
    getRekeningById,
    isRekeningExists,
    openDatabase,
    updateInitialBalanceTransaction,
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
  const db = openDatabase();

  const [bank, setBank] = useState("");
  const [saldo, setSaldo] = useState("");
  const [isCash, setIsCash] = useState(false);
  const [originalBankName, setOriginalBankName] = useState("");

  const formatNumber = (value: string) => {
    const clean = value.replace(/\D/g, "");
    if (!clean) return "";
    return clean.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  };

  const handleSaldoChange = (text: string) => {
    setSaldo(formatNumber(text));
  };

  useEffect(() => {
    const loadData = async () => {
      if (!db) return;

      const data = (await getRekeningById(db, Number(id))) as RekeningRow | null;

      if (!data) {
        Alert.alert("Error", "Rekening tidak ditemukan.");
        router.back();
        return;
      }

      setBank(data.bank);
      setOriginalBankName(data.bank);
      setSaldo(formatNumber(String(data.saldo)));
      setIsCash(data.bank.toLowerCase() === "uang tunai");
    };

    loadData();
  }, [id]);

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

  const handleSave = async () => {
    if (!bank.trim()) {
      Alert.alert("Error", "Nama rekening tidak boleh kosong.");
      return;
    }
    if (!db) return;

    const newName = bank.trim();
    const numericSaldo = Number(saldo.replace(/\./g, "")) || 0;

    // ❗ CEK SALDO TIDAK BOLEH 0
    if (numericSaldo === 0) {
      Alert.alert("Peringatan", "Masukkan nominal dengan benar.");
      return;
    }

    if (isCash && newName !== originalBankName) {
      Alert.alert("Peringatan", "Rekening Uang Tunai tidak dapat diubah namanya.");
      setBank(originalBankName);
      return;
    }

    const exists = await isRekeningExists(db, newName);

    if (exists && newName !== originalBankName) {
      Alert.alert("Nama Sudah Ada", `Rekening "${newName}" sudah digunakan.`);
      return;
    }

    try {
      await updateRekening(db, Number(id), newName, numericSaldo);

      if (newName !== originalBankName) {
        await updateNamaRekeningDiTransaksi(db, originalBankName, newName);
      }

      await updateInitialBalanceTransaction(db, newName, numericSaldo);

      setOriginalBankName(newName);

      Alert.alert("Berhasil", "Rekening berhasil diperbarui.", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (error) {
      console.error("Gagal menyimpan edit rekening:", error);
      Alert.alert("Error", "Gagal menyimpan perubahan.");
    }
  };

  const handleDelete = () => {
    if (isCash) {
      Alert.alert("Peringatan", "Rekening Uang Tunai tidak dapat dihapus.");
      return;
    }
    if (!originalBankName) return;

    Alert.alert(
      "Hapus Rekening",
      `Yakin ingin menghapus rekening "${originalBankName}"? Semua transaksi yang terkait akan dipindahkan ke "Uang Tunai" dan transaksi Saldo Awal akan dihapus.`,
      [
        { text: "Batal", style: "cancel" },
        {
          text: "Hapus",
          style: "destructive",
          onPress: async () => {
            if (!db) return;

            try {
              await deleteInitialBalanceTransaction(db, originalBankName);

              await db.runAsync(
                `UPDATE transaksi SET rekening = 'Uang Tunai' WHERE rekening = ?`,
                [originalBankName]
              );

              await deleteRekening(db, Number(id));

              Alert.alert("Berhasil", "Rekening dihapus. Transaksi Saldo Awal dihapus.", [
                { text: "OK", onPress: () => router.back() },
              ]);
            } catch (error) {
              console.error("Gagal menghapus rekening:", error);
              Alert.alert("Error", "Gagal menghapus rekening dan mengalihkan transaksi.");
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={konfirmasiKeluar} style={styles.backButton}>
          <Ionicons name="arrow-back" size={26} color="#fff" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Edit Rekening</Text>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <View style={styles.content}>
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

          <TextInput
            style={styles.input}
            placeholder="Saldo Awal"
            value={saldo}
            onChangeText={handleSaldoChange}
            keyboardType="numeric"
          />

          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.deleteButton, isCash && { opacity: 0.5 }]}
              onPress={handleDelete}
              disabled={isCash}
            >
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
