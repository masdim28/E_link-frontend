import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';

import {
  getAllTransactions,
  openDatabase,
  ensureCategoryColumn,
} from '../database/database';

// 🔥 Tambahkan tipe transaksi agar TS tidak error
type TransaksiRow = {
  id: number;
  tanggal: string;
  jam: string;
  rekening: string;
  jenis: 'income' | 'expense';
  [key: string]: any; // kategori dinamis
};

export default function EditTransaksi() {
  const router = useRouter();
  const params = useLocalSearchParams();

  // ==== FIX PARAMS NEED STRING ====
  const idRaw = params.id;
  const idValue = Array.isArray(idRaw) ? idRaw[0] : idRaw;

  const db = openDatabase();

  const [loading, setLoading] = useState(true);
  const [rekening, setRekening] = useState('');
  const [jenis, setJenis] = useState<'income' | 'expense'>('income');
  const [kategori, setKategori] = useState('');
  const [jumlah, setJumlah] = useState('');
  const [tanggal, setTanggal] = useState('');
  const [jam, setJam] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const data: TransaksiRow[] = await getAllTransactions(db);
    const trx = data.find(t => String(t.id) === String(idValue));

    if (trx) {
      setRekening(trx.rekening);
      setJenis(trx.jenis);
      setTanggal(trx.tanggal);
      setJam(trx.jam);

      // cari kategori
      const kategoriKeys = Object.keys(trx).filter(
        k => !['id', 'tanggal', 'jam', 'rekening', 'jenis'].includes(k)
      );

      const foundKategori = kategoriKeys.find(k => Number(trx[k]) > 0);

      if (foundKategori) {
        setKategori(foundKategori.replace(/_/g, ' '));
        setJumlah(String(trx[foundKategori]));
      }
    }

    setLoading(false);
  };

  const saveEdit = async () => {
    if (!kategori || !jumlah) return;

    // pastikan kategori bersih
    const kategoriFix = Array.isArray(kategori) ? kategori[0] : kategori;
    const cleanKategori = kategoriFix.replace(/\s+/g, '_');

    // buat kolom jika belum ada
    await ensureCategoryColumn(db, cleanKategori);

    // UPDATE (format diperbaiki total)
    await db.runAsync(
      `
      UPDATE transaksi
      SET tanggal = ?, 
          jam = ?, 
          rekening = ?, 
          jenis = ?, 
          ${cleanKategori} = ?
      WHERE id = ?
    `,
      [
        tanggal,
        jam,
        rekening,
        jenis,
        Number(jumlah),
        Number(idValue),
      ]
    );

    router.back();
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Memuat...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Edit Transaksi</Text>

      <Text style={styles.label}>Rekening</Text>
      <TextInput style={styles.input} value={rekening} onChangeText={setRekening} />

      <Text style={styles.label}>Jenis</Text>
      <View style={styles.row}>
        <TouchableOpacity
          style={[
            styles.typeButton,
            jenis === 'income' && styles.typeActiveIncome,
          ]}
          onPress={() => setJenis('income')}
        >
          <Text style={styles.typeText}>Pemasukan</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.typeButton,
            jenis === 'expense' && styles.typeActiveExpense,
          ]}
          onPress={() => setJenis('expense')}
        >
          <Text style={styles.typeText}>Pengeluaran</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.label}>Kategori</Text>
      <TextInput style={styles.input} value={kategori} onChangeText={setKategori} />

      <Text style={styles.label}>Jumlah</Text>
      <TextInput
        style={styles.input}
        value={jumlah}
        keyboardType="numeric"
        onChangeText={setJumlah}
      />

      <Text style={styles.label}>Tanggal</Text>
      <TextInput style={styles.input} value={tanggal} onChangeText={setTanggal} />

      <Text style={styles.label}>Jam</Text>
      <TextInput style={styles.input} value={jam} onChangeText={setJam} />

      <TouchableOpacity style={styles.saveButton} onPress={saveEdit}>
        <Text style={styles.saveText}>Simpan Perubahan</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

// =========================
// STYLES
// =========================
const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#fff' },
  title: { fontSize: 22, fontWeight: '700', marginBottom: 20, color: '#00A86B' },

  label: { marginTop: 15, color: '#333' },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 12,
    marginTop: 5,
  },

  row: { flexDirection: 'row', marginTop: 10, gap: 10 },
  typeButton: {
    flex: 1,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    alignItems: 'center',
  },
  typeText: { color: '#000' },

  typeActiveIncome: {
    backgroundColor: '#00A86B',
    borderColor: '#00A86B',
  },
  typeActiveExpense: {
    backgroundColor: '#D83A56',
    borderColor: '#D83A56',
  },

  saveButton: {
    backgroundColor: '#00A86B',
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 30,
  },
  saveText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
