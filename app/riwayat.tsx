import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { getAllTransactions, openDatabase } from "../database/database";

interface Transaksi {
  id: number;
  tanggal: string;
  jam: string;
  rekening: string;
  jenis: "income" | "expense";
  [kategori: string]: any;
}

const formatTanggalHeader = (tgl: string) => {
  try {
    const date = new Date(tgl);
    const hari = date.toLocaleDateString("id-ID", { weekday: "long" });
    const bulan = date.toLocaleDateString("id-ID", { month: "short" });
    const tglHari = date.getDate();
    const tahun = date.getFullYear();

    return { tglHari, bulan, tahun, hari };
  } catch {
    return null;
  }
};

const TransaksiItem = ({ item }: { item: Transaksi }) => {
  const kategoriCols = Object.keys(item).filter(
    (key) =>
      !["id", "tanggal", "jam", "rekening", "jenis"].includes(key) &&
      item[key] !== null &&
      item[key] !== 0
  );

  const kategori =
    kategoriCols.length > 0
      ? kategoriCols[0].replace(/_/g, " ")
      : "Tidak Ada Kategori";

  const jumlah = kategoriCols.length > 0 ? item[kategoriCols[0]] : 0;
  const isPemasukan = item.jenis === "income";

  return (
    <View style={styles.itemTransaksi}>
      <View>
        <Text style={styles.kategoriText}>{kategori}</Text>
        <Text style={styles.rekeningText}>{item.rekening}</Text>
      </View>

      <Text
        style={[
          styles.jumlahText,
          { color: isPemasukan ? "#00A86B" : "#D9534F" },
        ]}
      >
        {`${isPemasukan ? "+" : "-"}${jumlah.toLocaleString("id-ID")}`}
      </Text>
    </View>
  );
};

const TanggalHeader = ({
  tgl,
  totalIncome,
  totalExpense,
}: {
  tgl: string;
  totalIncome: number;
  totalExpense: number;
}) => {
  const d = formatTanggalHeader(tgl);
  if (!d) return null;

  const selisih = totalIncome - totalExpense;

  return (
    <View style={styles.headerTanggalContainer}>
      <View style={styles.tanggalBox}>
        <Text style={styles.tanggalAngka}>{d.tglHari}</Text>

        <View style={{ marginLeft: 5 }}>
          <Text style={styles.tanggalBulan}>{`${d.bulan} ${d.tahun}`}</Text>
          <Text style={styles.tanggalHari}>{d.hari}</Text>
        </View>

        {/* === TOTAL INCOME / EXPENSE / SELISIH === */}
        <View style={styles.totalWrapper}>
          <Text style={[styles.totalAngka, { color: "#00A86B" }]}>
            +{totalIncome.toLocaleString("id-ID")}
          </Text>

          <Text style={[styles.totalAngka, { color: "#D9534F" }]}>
            -{totalExpense.toLocaleString("id-ID")}
          </Text>

          <Text
            style={[
              styles.totalAngka,
              { color: selisih >= 0 ? "#00A86B" : "#D9534F" },
            ]}
          >
            {`${selisih >= 0 ? "+" : "-"}${Math.abs(selisih).toLocaleString(
              "id-ID"
            )}`}
          </Text>
        </View>
      </View>
    </View>
  );
};

export default function Riwayat() {
  const router = useRouter();
  const [groupedData, setGroupedData] = useState<any>({});
  const [isLoading, setIsLoading] = useState(true);

  const loadTransactions = useCallback(async () => {
    setIsLoading(true);

    try {
      const db = openDatabase();
      const data = await getAllTransactions(db);

      const grouped: any = {};
      data.forEach((t: any) => {
        if (!grouped[t.tanggal]) grouped[t.tanggal] = [];
        grouped[t.tanggal].push(t);
      });

      setGroupedData(grouped);
    } catch (e) {
      console.error("Gagal load:", e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadTransactions();
    }, [loadTransactions])
  );

  const tanggalList = Object.keys(groupedData).sort().reverse();

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={26} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Riwayat</Text>
      </View>

      {isLoading ? (
        <View style={styles.emptyContainer}>
          <ActivityIndicator size="large" color="#00A86B" />
        </View>
      ) : tanggalList.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Belum ada transaksi.</Text>
        </View>
      ) : (
        <FlatList
          data={tanggalList}
          keyExtractor={(item) => item}
          renderItem={({ item }) => {
            // === PERHITUNGAN FIX ===
            const income = groupedData[item]
              .filter((x: Transaksi) => x.jenis === "income")
              .reduce((sum: number, t: any) => {
                const keys = Object.keys(t).filter(
                  (k) =>
                    !["id", "tanggal", "jam", "rekening", "jenis"].includes(k) &&
                    typeof t[k] === "number" &&
                    t[k] !== 0
                );

                const totalKategori = keys.reduce((s, k) => s + t[k], 0);
                return sum + totalKategori;
              }, 0);

            const expense = groupedData[item]
              .filter((x: Transaksi) => x.jenis === "expense")
              .reduce((sum: number, t: any) => {
                const keys = Object.keys(t).filter(
                  (k) =>
                    !["id", "tanggal", "jam", "rekening", "jenis"].includes(k) &&
                    typeof t[k] === "number" &&
                    t[k] !== 0
                );

                const totalKategori = keys.reduce((s, k) => s + t[k], 0);
                return sum + totalKategori;
              }, 0);

            return (
              <View style={styles.tanggalWrapper}>
                <View style={styles.sekatTanggalAtas} />

                <TanggalHeader
                  tgl={item}
                  totalIncome={income}
                  totalExpense={expense}
                />

                <View style={styles.garisTanggalKhusus} />

                {groupedData[item].map((t: Transaksi) => (
                  <TransaksiItem key={t.id} item={t} />
                ))}

                <View style={styles.sekatTanggalBawah} />
              </View>
            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },

  header: {
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 16,
    backgroundColor: "#00A86B",
    flexDirection: "row",
    alignItems: "center",
  },
  headerTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "600",
    marginLeft: 20,
  },

  tanggalWrapper: {
    backgroundColor: "#fafafa",
    marginBottom: 4,
  },

  sekatTanggalAtas: {
    height: 0.4,
    backgroundColor: "#D3D3D3",
    marginHorizontal: 16,
    marginBottom: 4,
  },

  garisTanggalKhusus: {
    borderBottomWidth: 0.6,
    borderBottomColor: "#CFCFCF",
    opacity: 0.9,
    marginHorizontal: 16,
    marginTop: 6,
    marginBottom: 6,
  },

  sekatTanggalBawah: {
    height: 0.4,
    backgroundColor: "#D5D5D5",
    marginHorizontal: 16,
    marginTop: 6,
    opacity: 0.8,
  },

  headerTanggalContainer: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: "#fff",
  },

  tanggalBox: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  tanggalAngka: { fontSize: 32, fontWeight: "700" },
  tanggalBulan: { fontSize: 14, fontWeight: "500" },

  tanggalHari: {
    marginTop: 2,
    backgroundColor: "#ddd",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    fontSize: 12,
  },

  totalWrapper: {
    flexDirection: "row",
    gap: 20,
    marginLeft: "auto",
  },

  totalAngka: {
    fontSize: 13,
    fontWeight: "700",
  },

  itemTransaksi: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: "#fff",
  },

  kategoriText: { fontSize: 16, fontWeight: "600" },
  rekeningText: { fontSize: 13, color: "#888" },
  jumlahText: { fontSize: 16, fontWeight: "600" },

  emptyContainer: { marginTop: 50, alignItems: "center" },
  emptyText: { fontSize: 16, color: "#777" },
});
