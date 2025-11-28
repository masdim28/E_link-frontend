import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  TextInput,
  Alert,
  BackHandler,
} from "react-native";

export default function EditRekening() {
  const router = useRouter();

  // STATE FORM
  const [nama, setNama] = useState("");
  const [saldo, setSaldo] = useState("");

  // === POP UP KONFIRMASI BACK ===
  const konfirmasiKeluar = () => {
    Alert.alert(
      "Konfirmasi",
      "Apakah kamu ingin meninggalkan halaman ini?",
      [
        { text: "Tidak", style: "cancel" },
        {
          text: "Iya",
          onPress: () => router.back(),
        },
      ]
    );
  };

  // === HANDLE BACK HP (ANDROID BACK BUTTON) ===
  useEffect(() => {
    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      () => {
        konfirmasiKeluar();
        return true; // Mencegah aksi default
      }
    );

    return () => backHandler.remove();
  }, []);

  // DUMMY SAVE HANDLER
  const handleSave = () => {
    Alert.alert(
      "Data Disimpan (Dummy)",
      `Nama Rekening: ${nama}\nSaldo: ${saldo}`
    );
  };

  // DUMMY DELETE HANDLER
  const handleDelete = () => {
    Alert.alert("Hapus (Dummy)", "Data rekening dihapus (dummy).");
  };

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={konfirmasiKeluar}
          style={styles.backButton}
        >
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
          
          {/* INPUT: Nama Rekening */}
          <TextInput
            style={styles.input}
            placeholder="Nama Rekening"
            value={nama}
            onChangeText={setNama}
          />

          {/* INPUT: Saldo */}
          <TextInput
            style={styles.input}
            placeholder="Saldo Awal"
            value={saldo}
            onChangeText={setSaldo}
            keyboardType="numeric"
          />

          {/* BUTTON WRAPPER RIGHT */}
          <View style={styles.buttonRow}>

            {/* Tombol Hapus */}
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={handleDelete}
            >
              <Text style={styles.deleteText}>Hapus</Text>
            </TouchableOpacity>

            {/* Tombol Simpan */}
            <TouchableOpacity
              style={styles.saveButton}
              onPress={handleSave}
            >
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

  content: {
    padding: 20,
    flex: 1,
  },

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
