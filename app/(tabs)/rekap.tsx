// app/(tabs)/rekap.tsx
import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Dimensions,
  ActivityIndicator,
} from "react-native";
import { PieChart } from "react-native-chart-kit";
import { openDatabase, getExistingColumns } from "../../database/database";

// helper buat warna konsisten dari nama
const colorFromString = (s: string) => {
  let hash = 0;
  for (let i = 0; i < s.length; i++) hash = s.charCodeAt(i) + ((hash << 5) - hash);
  const color = ((hash >>> 0) & 0xffffff).toString(16).padStart(6, "0");
  return `#${color}`;
};

const monthNames = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

function getLastDayOfMonth(year: number, month: number) {
  // month = 1..12
  return new Date(year, month, 0).getDate();
}

type RekapRow = {
  name: string;
  amount: number;
  color: string;
};

export default function RekapScreen() {
  const db = openDatabase();
  const screenWidth = Dimensions.get("window").width;

  const today = new Date();
  const [isBulanan, setIsBulanan] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState<number>(today.getMonth() + 1); // 1..12
  const [selectedYear, setSelectedYear] = useState<number>(today.getFullYear());

  const [loading, setLoading] = useState<boolean>(true);
  const [categories, setCategories] = useState<string[]>([]);
  const [rekapData, setRekapData] = useState<RekapRow[]>([]);

  const [modalVisible, setModalVisible] = useState(false);
  const [mode, setMode] = useState<"bulan" | "tahun">("bulan");

  // ambil daftar kolom kategori (dinamis)
  const loadColumns = async () => {
    try {
      const cols = await getExistingColumns(db);
      const filtered = cols.filter(
        (c) => !["id", "tanggal", "jam", "rekening", "jenis"].includes(c)
      );
      setCategories(filtered);
    } catch (e) {
      console.warn("Gagal load columns:", e);
      setCategories([]);
    }
  };

  // load columns satu kali
  useEffect(() => {
    loadColumns();
  }, []);

  // ambil rekap (fungsi umum untuk rentang tanggal)
  const loadRekapForRange = async (startDate: string, endDate: string) => {
    setLoading(true);
    try {
      // pastikan categories terisi, jika kosong -> tetap set kosong
      if (!categories || categories.length === 0) {
        setRekapData([]);
        setLoading(false);
        return;
      }

      // untuk tiap kategori, hitung SUM kolomnya dalam range
      const rows: RekapRow[] = [];
      for (const cat of categories) {
        // gunakan COALESCE supaya null treated as 0
        const sql = `SELECT SUM(COALESCE(${cat}, 0)) AS total FROM transaksi WHERE tanggal BETWEEN ? AND ?`;
        const res: any[] = await db.getAllAsync(sql, [startDate, endDate]);
        const total = (res[0]?.total ?? 0) as number;
        rows.push({
          name: cat.replace(/_/g, " "),
          amount: Number(total),
          color: colorFromString(cat),
        });
      }

      setRekapData(rows);
    } catch (err) {
      console.error("Error load rekap for range:", err);
      setRekapData([]);
    } finally {
      setLoading(false);
    }
  };

  // helper load based on mode (bulanan/tahunan)
  const loadCurrentRekap = async () => {
    if (isBulanan) {
      const m = String(selectedMonth).padStart(2, "0");
      const start = `${selectedYear}-${m}-01`;
      const last = getLastDayOfMonth(selectedYear, selectedMonth);
      const end = `${selectedYear}-${m}-${String(last).padStart(2, "0")}`;
      await loadRekapForRange(start, end);
    } else {
      const start = `${selectedYear}-01-01`;
      const end = `${selectedYear}-12-31`;
      await loadRekapForRange(start, end);
    }
  };

  // reload ketika opsi berubah (bulan/tahun/mode/categories)
  useEffect(() => {
    loadCurrentRekap();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isBulanan, selectedMonth, selectedYear, categories]);

  // prepare data untuk pie chart
  const totalAmount = useMemo(() => rekapData.reduce((s, r) => s + r.amount, 0), [rekapData]);

  const chartData = rekapData.map((r) => ({
    name: r.name,
    population: r.amount,
    color: r.color,
    legendFontColor: "#000",
    legendFontSize: 12,
  }));

  // years list (customize range jika perlu)
  const tahunList = Array.from({ length: 10 }, (_, i) => today.getFullYear() - 5 + i);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerText}>Rekap</Text>
      </View>

      {/* Switch Bulanan / Tahunan */}
      <View style={styles.switchContainer}>
        <TouchableOpacity
          style={[styles.switchButton, isBulanan && styles.switchActive]}
          onPress={() => setIsBulanan(true)}
        >
          <Text style={[styles.switchText, isBulanan && styles.switchTextActive]}>Bulanan</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.switchButton, !isBulanan && styles.switchActive]}
          onPress={() => setIsBulanan(false)}
        >
          <Text style={[styles.switchText, !isBulanan && styles.switchTextActive]}>Tahunan</Text>
        </TouchableOpacity>
      </View>

      {/* Month/Year selector */}
      <View style={styles.selectorRow}>
        <TouchableOpacity
          style={styles.selectorButton}
          onPress={() => {
            setMode("bulan");
            setModalVisible(true);
          }}
        >
          <Text style={styles.selectorText}>
            {monthNames[selectedMonth - 1]} {selectedYear}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.selectorButton}
          onPress={() => {
            setMode("tahun");
            setModalVisible(true);
          }}
        >
          <Text style={styles.selectorText}>Ganti Tahun</Text>
        </TouchableOpacity>
      </View>

      {/* Chart */}
      <View style={styles.chartWrapper}>
        {loading ? (
          <ActivityIndicator size="large" color="#00A86B" />
        ) : rekapData.length === 0 ? (
          <View style={{ padding: 20 }}>
            <Text style={{ textAlign: "center", color: "#666" }}>
              Belum ada kategori / transaksi untuk periode ini.
            </Text>
          </View>
        ) : (
          <PieChart
            data={chartData}
            width={screenWidth * 0.85}
            height={260}
            chartConfig={{ color: () => "#000" }}
            accessor="population"
            backgroundColor="transparent"
            paddingLeft="85"
            hasLegend={false}
          />
        )}
      </View>

      {/* List kategori + persen */}
      <ScrollView style={styles.listContainer}>
        {rekapData.map((item, idx) => {
          const persen = totalAmount > 0 ? ((item.amount / totalAmount) * 100).toFixed(1) : "0.0";
          return (
            <View key={idx} style={styles.listItem}>
              <View style={[styles.colorBox, { backgroundColor: item.color }]} />
              <Text style={styles.category}>{item.name}</Text>
              <Text style={styles.percent}>{persen}%</Text>
              <Text style={styles.amount}>
                {Number(item.amount).toLocaleString("id-ID", { style: "currency", currency: "IDR" })}
              </Text>
            </View>
          );
        })}
      </ScrollView>

      {/* Modal picker bulan/tahun */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalBg}>
          <View style={styles.modalBox}>
            <Text style={{ fontSize: 16, fontWeight: "700", marginBottom: 12 }}>
              Pilih {mode === "bulan" ? "Bulan" : "Tahun"}
            </Text>

            <ScrollView style={{ maxHeight: 300 }}>
              {mode === "bulan" ? (
                monthNames.map((m, i) => (
                  <TouchableOpacity
                    key={m}
                    style={styles.option}
                    onPress={() => {
                      setSelectedMonth(i + 1);
                      setModalVisible(false);
                    }}
                  >
                    <Text style={styles.optionText}>{m}</Text>
                  </TouchableOpacity>
                ))
              ) : (
                tahunList.map((t) => (
                  <TouchableOpacity
                    key={t}
                    style={styles.option}
                    onPress={() => {
                      setSelectedYear(t);
                      setModalVisible(false);
                    }}
                  >
                    <Text style={styles.optionText}>{t}</Text>
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>

            <TouchableOpacity style={styles.btnClose} onPress={() => setModalVisible(false)}>
              <Text style={{ color: "#fff" }}>Tutup</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },

  header: {
    backgroundColor: "#00A86B",
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 16,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    alignItems: "center",
  },
  headerText: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "600",
  },

  switchContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 10,
    gap: 10,
  },
  switchButton: {
    paddingVertical: 6,
    paddingHorizontal: 25,
    borderRadius: 20,
    backgroundColor: "#BDBDBD",
  },
  switchActive: { backgroundColor: "#00A86B" },
  switchText: { color: "#fff", fontSize: 14 },
  switchTextActive: { color: "#fff", fontWeight: "600" },

  selectorRow: { flexDirection: "row", justifyContent: "center", gap: 12, marginTop: 12 },
  selectorButton: { backgroundColor: "#EFEFEF", padding: 10, borderRadius: 8 },
  selectorText: { fontWeight: "600" },

  chartWrapper: { alignItems: "center", marginTop: 10 },

  listContainer: { marginTop: 10, paddingHorizontal: 20 },
  listItem: { flexDirection: "row", alignItems: "center", marginVertical: 6 },
  colorBox: { width: 18, height: 18, marginRight: 10, borderRadius: 3 },
  category: { flex: 1, fontSize: 15 },
  percent: { width: 60, textAlign: "right", marginRight: 10 },
  amount: { fontSize: 15, color: "#000" },

  modalBg: { flex: 1, backgroundColor: "#0007", justifyContent: "center", padding: 20 },
  modalBox: { backgroundColor: "#fff", padding: 16, borderRadius: 12, maxHeight: "80%" },
  option: { paddingVertical: 10 },
  optionText: { fontSize: 16 },
  btnClose: { marginTop: 12, backgroundColor: "#00A86B", paddingVertical: 10, borderRadius: 8, alignItems: "center" },
});
