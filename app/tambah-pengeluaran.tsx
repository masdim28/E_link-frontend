import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity } from 'react-native';
import { insertTransaction, openDatabase } from '../database/database';

export default function TambahPengeluaran() {
  const [tanggal, setTanggal] = useState('');
  const [jam, setJam] = useState('');
  const [rekening, setRekening] = useState('');
  const [kategori, setKategori] = useState('');
  const [jumlah, setJumlah] = useState('');

  const handleSimpan = async () => {
    if (!tanggal || !jam || !rekening || !kategori || !jumlah) {
      Alert.alert('⚠️ Lengkapi semua data terlebih dahulu!');
      return;
    }

    try {
      const db = openDatabase();
      await insertTransaction(db, {
        tanggal,
        jam,
        rekening,
        jenis: 'pengeluaran',
        kategori,
        jumlah: parseFloat(jumlah),
      });
      Alert.alert('✅ Pengeluaran berhasil disimpan!');
      setTanggal('');
      setJam('');
      setRekening('');
      setKategori('');
      setJumlah('');
    } catch (error) {
      console.error(error);
      Alert.alert('❌ Gagal menyimpan pengeluaran!');
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Tambah Pengeluaran</Text>
      <TextInput style={styles.input} placeholder="Tanggal (YYYY-MM-DD)" value={tanggal} onChangeText={setTanggal} />
      <TextInput style={styles.input} placeholder="Jam (HH:MM)" value={jam} onChangeText={setJam} />
      <TextInput style={styles.input} placeholder="Rekening" value={rekening} onChangeText={setRekening} />
      <TextInput style={styles.input} placeholder="Kategori" value={kategori} onChangeText={setKategori} />
      <TextInput style={styles.input} placeholder="Jumlah" keyboardType="numeric" value={jumlah} onChangeText={setJumlah} />
      <TouchableOpacity style={styles.button} onPress={handleSimpan}>
        <Text style={styles.buttonText}>Simpan</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 16, textAlign: 'center' },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 10, marginBottom: 12 },
  button: { backgroundColor: '#F44336', borderRadius: 8, padding: 14 },
  buttonText: { color: '#fff', fontWeight: 'bold', textAlign: 'center' },
});
