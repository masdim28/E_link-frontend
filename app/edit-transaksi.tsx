import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  Keyboard,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import DateTimePickerModal from 'react-native-modal-datetime-picker';

import {
  ensureCategoryColumn,
  getAllTransactions,
  openDatabase,
} from '../database/database';

type TransaksiRow = {
  id: number;
  tanggal: string;
  jam: string;
  rekening: string;
  jenis: 'income' | 'expense';
  [key: string]: any;
};

const LIST_REKENING = [
  'BJB', 'Mandiri', 'BRI', 'BNI', 'BSI', 'BCA', 'Gopay', 'Dana', 'ShopeePay', 'OVO', 'Cash', 'Lainnya',
];

export default function EditTransaksi() {
  const router = useRouter();
  const params = useLocalSearchParams() as { id?: string | string[] | undefined };
  const idRaw = params.id;
  const idValue = Array.isArray(idRaw) ? idRaw[0] : idRaw;

  const db = openDatabase();

  const [loading, setLoading] = useState(true);
  const [rekeningDipilih, setRekeningDipilih] = useState<string | null>(null);
  const [tanggalObj, setTanggalObj] = useState<Date>(new Date());
  const [jamObj, setJamObj] = useState<Date>(new Date());
  const [showPicker, setShowPicker] = useState(false);
  const [pickerMode, setPickerMode] = useState<'date' | 'time' | null>(null);

  const [jumlah, setJumlah] = useState<number | null>(null);
  const [kategoriDipilih, setKategoriDipilih] = useState('');
  const [kategoriBaru, setKategoriBaru] = useState('');
  const [kategoriList, setKategoriList] = useState<string[]>([
    'Gaji', 'Bonus', 'Penjualan', 'Investasi',
  ]);

  const [modalVisible, setModalVisible] = useState(false);
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const [jenis, setJenis] = useState<'income' | 'expense'>('income');

  const [originalKategori, setOriginalKategori] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // getAllTransactions mungkin mengembalikan unknown[] — amankan dan cast jika berupa array
      const raw = await getAllTransactions(db);
      const data: TransaksiRow[] = Array.isArray(raw) ? (raw as TransaksiRow[]) : [];

      const trx = data.find((t) => String(t.id) === String(idValue));

      if (trx) {
        setRekeningDipilih(trx.rekening || null);
        setJenis((trx.jenis as 'income' | 'expense') || 'income');

        if (trx.tanggal) {
          const [y, m, d] = String(trx.tanggal).split('-').map(Number);
          if (!Number.isNaN(y) && !Number.isNaN(m) && !Number.isNaN(d)) {
            setTanggalObj(new Date(y, m - 1, d));
          }
        }

        if (trx.jam) {
          const [hh, mm] = String(trx.jam).split(':').map(Number);
          if (!Number.isNaN(hh) && !Number.isNaN(mm)) {
            const t = new Date();
            t.setHours(hh);
            t.setMinutes(mm);
            setJamObj(t);
          }
        }

        const kategoriKeys = Object.keys(trx).filter(
          (k) => !['id', 'tanggal', 'jam', 'rekening', 'jenis'].includes(k)
        );
        const foundKategori = kategoriKeys.find((k) => Number(trx[k]) > 0);

        if (foundKategori) {
          const kategoriFormatted = foundKategori.replace(/_/g, ' ');
          setKategoriDipilih(kategoriFormatted);
          setOriginalKategori(kategoriFormatted);
          setJumlah(Number(trx[foundKategori]));
        }
      }
    } catch (e) {
      console.error('Gagal load edit data:', e);
    } finally {
      setLoading(false);
    }
  };

  const formatTanggalIndonesia = (date: Date) => {
    const hariList = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const bulanList = [
      'Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'
    ];
    return `${hariList[date.getDay()]}, ${date.getDate()} ${bulanList[date.getMonth()]} ${date.getFullYear()}`;
  };

  // === FORMAT RIBUAN BARU ===
  const formatRupiahEdit = (value: string) => {
    const numberString = value.replace(/\D/g, '');
    if (!numberString) return '';
    return numberString.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  };

  const showPickerHandler = (mode: 'date' | 'time') => {
    setPickerMode(mode);
    setShowPicker(true);
  };

  const pilihRekening = (item: string) => {
    setRekeningDipilih(item);
    setModalVisible(false);
  };

  const pilihDariDropdown = (item: string) => {
    setRekeningDipilih(item);
    setDropdownVisible(false);
  };

  const pilihKategori = (item: string) => {
    setKategoriDipilih(item);
  };

  const handleTambahKategori = () => {
    const nama = kategoriBaru.trim();
    if (nama !== '' && !kategoriList.includes(nama)) {
      setKategoriList([...kategoriList, nama]);
      setKategoriDipilih(nama);
      setKategoriBaru('');
      Keyboard.dismiss();
    }
  };

  const saveEdit = async () => {
    if (!kategoriDipilih || jumlah === null) {
      Alert.alert('Peringatan', 'Lengkapi kategori dan jumlah terlebih dahulu.');
      return;
    }

    try {
      const cleanKategori = kategoriDipilih.replace(/\s+/g, '_');
      await ensureCategoryColumn(db, cleanKategori);

      const tgl = `${tanggalObj.getFullYear()}-${(tanggalObj.getMonth()+1).toString().padStart(2,'0')}-${tanggalObj.getDate().toString().padStart(2,'0')}`;
      const hh = jamObj.getHours().toString().padStart(2, '0');
      const mm = jamObj.getMinutes().toString().padStart(2, '0');
      const jamStr = `${hh}:${mm}`;

      let sqlUpdate = '';
      const params: any[] = [tgl, jamStr, rekeningDipilih, jenis];

      if (originalKategori && originalKategori !== kategoriDipilih) {
        const oldClean = originalKategori.replace(/\s+/g, '_');
        sqlUpdate = `${oldClean} = 0, ${cleanKategori} = ?`;
      } else {
        sqlUpdate = `${cleanKategori} = ?`;
      }

      params.push(jumlah, Number(idValue));

      await db.runAsync(
        `UPDATE transaksi
         SET tanggal = ?, jam = ?, rekening = ?, jenis = ?, ${sqlUpdate}
         WHERE id = ?`,
        params
      );

      Alert.alert('Sukses', 'Transaksi berhasil diperbarui.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (err) {
      console.error('Gagal menyimpan edit:', err);
      Alert.alert('Error', 'Gagal menyimpan perubahan.');
    }
  };

  const hapusTransaksi = () => {
    Alert.alert(
      'Konfirmasi Hapus',
      'Apakah Anda yakin ingin menghapus transaksi ini?',
      [
        { text: 'Tidak', style: 'cancel' },
        { text: 'Ya', style: 'destructive', onPress: async () => {
            try {
              await db.runAsync(`DELETE FROM transaksi WHERE id = ?`, [Number(idValue)]);
              Alert.alert('Sukses', 'Transaksi berhasil dihapus.', [
                { text: 'OK', onPress: () => router.back() },
              ]);
            } catch (err) {
              console.error('Gagal menghapus transaksi:', err);
              Alert.alert('Error', 'Gagal menghapus transaksi.');
            }
          } 
        }
      ]
    );
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Memuat...</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      <Modal visible={modalVisible} transparent animationType="fade">
        <View style={styles.overlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.header}>Pilih Rekening</Text>
            <View style={styles.grid}>
              {LIST_REKENING.map((item) => (
                <TouchableOpacity key={item} style={styles.rekeningButton} onPress={() => pilihRekening(item)}>
                  <Text style={styles.rekeningText}>{item}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </Modal>

      <View style={styles.topHeader}>
        
        {/* === TOMBOL BACK DENGAN POP UP PERINGATAN === */}
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => {
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
          }}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Edit Transaksi</Text>
      </View>

      <ScrollView contentContainerStyle={styles.formContainer}>
        <View style={styles.switchContainer}>
          <TouchableOpacity
            style={[styles.switchBtn, jenis === 'expense' && styles.switchActive]}
            onPress={() => setJenis('expense')}
          >
            <Text style={[styles.switchText, jenis === 'expense' && styles.switchTextActive]}>Pengeluaran</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.switchBtn, jenis === 'income' && styles.switchActive]}
            onPress={() => setJenis('income')}
          >
            <Text style={[styles.switchText, jenis === 'income' && styles.switchTextActive]}>Pemasukan</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.row}>
          <TouchableOpacity style={styles.dateButton} onPress={() => showPickerHandler('date')}>
            <Text>{formatTanggalIndonesia(tanggalObj)}</Text>
            <Ionicons name="calendar-outline" size={20} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.timeButton} onPress={() => showPickerHandler('time')}>
            <Text>{jamObj.getHours().toString().padStart(2,'0')}:{jamObj.getMinutes().toString().padStart(2,'0')}</Text>
          </TouchableOpacity>
        </View>

        <DateTimePickerModal
          isVisible={showPicker}
          mode={pickerMode || 'date'}
          date={pickerMode === 'date' ? tanggalObj : jamObj}
          is24Hour
          display={pickerMode === 'date' ? (Platform.OS === 'ios' ? 'inline' : 'calendar') : (Platform.OS === 'ios' ? 'spinner' : 'clock')}
          onConfirm={(selectedDate) => {
            if (pickerMode === 'date') setTanggalObj(selectedDate);
            else setJamObj(selectedDate);
            setShowPicker(false);
            setPickerMode(null);
          }}
          onCancel={() => { setShowPicker(false); setPickerMode(null); }}
        />

        <View style={styles.dropdownContainer}>
          <TouchableOpacity style={styles.dropdownButton} onPress={() => setDropdownVisible(!dropdownVisible)}>
            <Text style={{ color: rekeningDipilih ? '#000' : '#999' }}>
              {rekeningDipilih || 'Pilih Rekening'}
            </Text>
            <Ionicons name={dropdownVisible ? 'chevron-up' : 'chevron-down'} size={20} />
          </TouchableOpacity>

          {dropdownVisible && (
            <View style={styles.dropdownList}>
              <FlatList
                data={LIST_REKENING}
                keyExtractor={(item) => item}
                renderItem={({ item }) => (
                  <TouchableOpacity style={styles.dropdownItem} onPress={() => pilihDariDropdown(item)}>
                    <Text style={styles.dropdownText}>{item}</Text>
                  </TouchableOpacity>
                )}
              />
            </View>
          )}
        </View>

        {/* === INPUT JUMLAH BARU === */}
        <TextInput
          style={styles.input}
          placeholder="Jumlah"
          keyboardType="numeric"
          value={jumlah !== null ? formatRupiahEdit(jumlah.toString()) : ''}
          onChangeText={(text) => {
            const clean = text.replace(/\D/g, '');
            if (clean === '') setJumlah(null);
            else setJumlah(Number(clean));
          }}
        />

        <TextInput
          style={styles.input}
          placeholder="Kategori yang Dipilih"
          value={kategoriDipilih}
          onChangeText={setKategoriDipilih}
        />

        <View style={styles.kategoriContainer}>
          {kategoriList.map((item) => (
            <TouchableOpacity key={item} style={styles.kategoriButton} onPress={() => pilihKategori(item)}>
              <Text style={styles.kategoriText}>{item}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TextInput
          style={styles.input}
          placeholder="Tambah Kategori Baru"
          value={kategoriBaru}
          onChangeText={setKategoriBaru}
          onSubmitEditing={handleTambahKategori}
        />

        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 }}>
          <TouchableOpacity style={[styles.simpanButton, { backgroundColor: '#E53935' }]} onPress={hapusTransaksi}>
            <Text style={styles.simpanText}>Hapus</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.simpanButton} onPress={saveEdit}>
            <Text style={styles.simpanText}>Simpan</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalContainer: { backgroundColor: '#fff', padding: 20, borderTopLeftRadius: 20, borderTopRightRadius: 20 },

  topHeader: { backgroundColor: '#00A86B', paddingTop: 50, paddingBottom: 20, borderBottomLeftRadius: 20, borderBottomRightRadius: 20, flexDirection: 'row', alignItems: 'center' },
  backButton: { position: 'absolute', left: 20, top: 50, zIndex: 10 },
  headerTitle: { flex: 1, textAlign: 'center', color: '#fff', fontSize: 20, fontWeight: '600' },

  formContainer: { paddingHorizontal: 20, paddingVertical: 25 },
  header: { fontSize: 20, fontWeight: 'bold', color: '#007E33', marginBottom: 20, textAlign: 'center' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 10 },
  rekeningButton: { backgroundColor: '#E9E9E9', paddingVertical: 15, paddingHorizontal: 25, borderRadius: 10, margin: 5 },
  rekeningText: { fontSize: 16, fontWeight: '600' },

  switchContainer: { flexDirection: 'row', backgroundColor: '#d9d9d9', padding: 5, borderRadius: 50, marginBottom: 20 },
  switchBtn: { flex: 1, paddingVertical: 10, borderRadius: 50, alignItems: 'center' },
  switchActive: { backgroundColor: '#02a652' },
  switchText: { color: '#555', fontSize: 14 },
  switchTextActive: { color: '#fff', fontWeight: '700' },

  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
  dateButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#EFEFEF', padding: 10, borderRadius: 8, flex: 0.65, justifyContent: 'space-between' },
  timeButton: { backgroundColor: '#EFEFEF', padding: 10, borderRadius: 8, flex: 0.3, alignItems: 'center' },

  input: { width: '100%', backgroundColor: '#EFEFEF', padding: 12, borderRadius: 8, marginBottom: 15 },

  dropdownContainer: { position: 'relative', width: '100%', marginBottom: 15 },
  dropdownButton: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: '#EFEFEF', padding: 12, borderRadius: 8, alignItems: 'center' },
  dropdownList: { backgroundColor: '#fff', borderRadius: 8, borderWidth: 1, borderColor: '#ccc', marginTop: 5, elevation: 4, maxHeight: 200 },
  dropdownItem: { paddingVertical: 12, paddingHorizontal: 15 },
  dropdownText: { fontSize: 16 },

  kategoriContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 10, marginVertical: 10 },
  kategoriButton: { backgroundColor: '#00A86B', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 6 },
  kategoriText: { color: '#fff' },

  simpanButton: { backgroundColor: '#00A86B', paddingVertical: 12, paddingHorizontal: 30, borderRadius: 8 },
  simpanText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
