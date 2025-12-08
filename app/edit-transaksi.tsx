import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    BackHandler,
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
    applyNewTransactionEffect,
    ensureCategoryColumn,
    getAllRekening,
    getAllTransactions,
    getOldTransactionDetails,
    openDatabase,
    reverseTransactionEffect,
} from '../database/database'; // pastikan path benar

type TransaksiRow = {
  id: number;
  tanggal: string;
  jam: string;
  rekening: string;
  jenis: 'income' | 'expense';
  [key: string]: any;
};

type RekeningRow = {
  id: number;
  bank: string;
  saldo: number;
};

const kategoriPengeluaran = [
  "Makanan",
  "Transportasi",
  "Belanja",
  "Tagihan",
  "Hiburan",
  "Kesehatan",
  "Lainnya",
];

const kategoriPemasukan = [
  "Gaji",
  "Bonus",
  "Saldo Awal",
  "Penjualan",
  "Investasi",
  "Lainnya",
];

export default function EditTransaksi() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const idRaw = params.id;
  const idValue = Array.isArray(idRaw) ? idRaw[0] : idRaw;

  const db = openDatabase();

  const [loading, setLoading] = useState(true);
  const [rekeningDipilih, setRekeningDipilih] = useState<string | null>(null);
  const [rekeningList, setRekeningList] = useState<RekeningRow[]>([]);
  const [tanggalObj, setTanggalObj] = useState<Date>(new Date());
  const [jamObj, setJamObj] = useState<Date>(new Date());
  const [showPicker, setShowPicker] = useState(false);
  const [pickerMode, setPickerMode] = useState<'date' | 'time' | null>(null);

  const [jumlah, setJumlah] = useState<number | null>(null);
  const [kategoriDipilih, setKategoriDipilih] = useState('');
  const [kategoriBaru, setKategoriBaru] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const [jenis, setJenis] = useState<'income' | 'expense'>('income');

  const [originalKategori, setOriginalKategori] = useState('');
  const [isReadOnly, setIsReadOnly] = useState(false);

  // kategori aktif
  const kategoriList = jenis === 'income' ? kategoriPemasukan : kategoriPengeluaran;

  // reset kategori ketika jenis berubah (agar tidak meninggalkan kategori invalid)
  useEffect(() => {
    setKategoriDipilih('');
  }, [jenis]);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    const handler = BackHandler.addEventListener("hardwareBackPress", () => {
      Alert.alert(
        "Konfirmasi",
        "Apakah kamu ingin meninggalkan halaman ini?",
        [
          { text: "Tidak", style: "cancel" },
          { text: "Iya", onPress: () => router.back() }
        ]
      );
      return true;
    });

    return () => handler.remove();
  }, []);

  // ===========================
  // LOAD DATA (defensive typing + mapping)
  // ===========================
  const loadData = async () => {
    setLoading(true);
    try {
      if (!db) {
        console.error('Database object is null during loadData. Cannot fetch data.');
        setLoading(false);
        return;
      }

      // --- rekening ---
      const rawRekening: unknown = await getAllRekening(db);
      // pastikan array dan normalize field
      let rekeningNormalized: RekeningRow[] = [];
      if (Array.isArray(rawRekening)) {
        rekeningNormalized = (rawRekening as any[]).map((r) => {
          return {
            id: typeof r?.id === 'number' ? r.id : Number(r?.id ?? 0),
            bank: String(r?.bank ?? ''),
            saldo: typeof r?.saldo === 'number' ? r.saldo : Number(r?.saldo ?? 0),
          } as RekeningRow;
        });
      }
      setRekeningList(rekeningNormalized);

      // --- transaksi ---
      const rawTransaksi: unknown = await getAllTransactions(db);
      let transaksiList: TransaksiRow[] = [];
      if (Array.isArray(rawTransaksi)) {
        transaksiList = (rawTransaksi as any[]).map((t) => {
          // keep all other dynamic properties
          const base: TransaksiRow = {
            id: typeof t?.id === 'number' ? t.id : Number(t?.id ?? 0),
            tanggal: String(t?.tanggal ?? ''),
            jam: String(t?.jam ?? ''),
            rekening: String(t?.rekening ?? ''),
            jenis: (t?.jenis === 'income' || t?.jenis === 'expense') ? t.jenis : 'income',
          };
          // copy other props
          for (const k of Object.keys(t ?? {})) {
            if (!['id','tanggal','jam','rekening','jenis'].includes(k)) {
              (base as any)[k] = (t as any)[k];
            }
          }
          return base;
        });
      }

      // cari transaksi yg mau diedit
      const trx = transaksiList.find((t) => String(t.id) === String(idValue));

      if (trx) {
        setRekeningDipilih(trx.rekening || null);
        setJenis(trx.jenis || 'income');

        if (trx.tanggal) {
          const parts = trx.tanggal.split('-').map(Number);
          if (parts.length >= 3) {
            const [y, m, d] = parts;
            setTanggalObj(new Date(y, (m || 1) - 1, d || 1));
          }
        }

        if (trx.jam) {
          const [hhStr, mmStr] = String(trx.jam).split(':');
          const hh = Number(hhStr || 0);
          const mm = Number(mmStr || 0);
          const d = new Date();
          d.setHours(hh);
          d.setMinutes(mm);
          setJamObj(d);
        }

        const kategoriKeys = Object.keys(trx).filter(
          (k) => !['id', 'tanggal', 'jam', 'rekening', 'jenis'].includes(k)
        );
        const foundKategori = kategoriKeys.find((k) => Number((trx as any)[k]) > 0);

        if (foundKategori) {
          const kategoriFormatted = foundKategori.replace(/_/g, ' ');
          setKategoriDipilih(kategoriFormatted);
          setOriginalKategori(kategoriFormatted);
          setJumlah(Number((trx as any)[foundKategori] ?? 0));

          if (kategoriFormatted === 'Saldo Awal') {
            setIsReadOnly(true);
            Alert.alert("Perhatian", "Transaksi dengan kategori 'Saldo Awal' tidak dapat diedit. Anda hanya dapat melihat datanya.");
          }
        }
      }

    } catch (e) {
      console.error('Gagal load edit data:', e);
    } finally {
      setLoading(false);
    }
  };

  // rest of the functions (formatters, picker handlers, pilihRekening, pilihKategori...) remain same
  const formatTanggalIndonesia = (date: Date) => {
    const hariList = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const bulanList = [
      'Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'
    ];
    return `${hariList[date.getDay()]}, ${date.getDate()} ${bulanList[date.getMonth()]} ${date.getFullYear()}`;
  };

  const formatRupiahEdit = (value: string) => {
    const numberString = value.replace(/\D/g, '');
    if (!numberString) return '';
    return numberString.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  };

  const showPickerHandler = (mode: 'date' | 'time') => {
    if (isReadOnly) return;
    setPickerMode(mode);
    setShowPicker(true);
  };

  const pilihRekening = (item: string) => {
    if (isReadOnly) return;
    setRekeningDipilih(item);
    setModalVisible(false);
  };

  const pilihDariDropdown = (item: string) => {
    if (isReadOnly) return;
    setRekeningDipilih(item);
    setDropdownVisible(false);
  };

  const pilihKategori = (item: string) => {
    if (isReadOnly) return;
    setKategoriDipilih(item);
  };

  const handleTambahKategori = () => {
    if (isReadOnly) return;
    const nama = kategoriBaru.trim();
    if (nama !== '' && !kategoriList.includes(nama)) {
      // push ke array yang sesuai jenis (mutasi array dalam module scope)
      if (jenis === 'income') {
        kategoriPemasukan.push(nama);
      } else {
        kategoriPengeluaran.push(nama);
      }
      setKategoriDipilih(nama);
      setKategoriBaru('');
      Keyboard.dismiss();
    }
  };

  const saveEdit = async () => {
    if (isReadOnly) return;

    if (!db) {
      Alert.alert('Error Database', 'Koneksi database belum siap. Coba buka halaman ini lagi.');
      console.error('Database object is null or undefined.');
      return;
    }

    if (!kategoriDipilih || jumlah === null) {
      Alert.alert('Peringatan', 'Lengkapi kategori dan jumlah terlebih dahulu.');
      return;
    }

    if (jumlah === 0) {
      Alert.alert('Peringatan', 'Nominal transaksi tidak boleh nol.');
      return;
    }

    try {
      const oldTrx = await getOldTransactionDetails(db, Number(idValue));

      if (oldTrx && oldTrx.rekening) {
        await reverseTransactionEffect(
          db,
          oldTrx.rekening,
          oldTrx.jenis,
          oldTrx.jumlah,
          oldTrx.kategori
        );
      }

      const cleanKategori = kategoriDipilih.replace(/\s+/g, '_');
      await ensureCategoryColumn(db, cleanKategori);

      const tgl = `${tanggalObj.getFullYear()}-${(tanggalObj.getMonth()+1)
        .toString().padStart(2,'0')}-${tanggalObj.getDate()
        .toString().padStart(2,'0')}`;

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

      await applyNewTransactionEffect(
        db,
        rekeningDipilih!,
        jenis,
        jumlah,
        kategoriDipilih
      );

      Alert.alert('Sukses', 'Transaksi berhasil diperbarui dan saldo rekening telah disesuaikan.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (err) {
      console.error('Gagal menyimpan edit dan memperbarui saldo:', err);
      Alert.alert('Error', 'Gagal menyimpan perubahan. Cek log konsol.');
    }
  };

  const hapusTransaksi = () => {
    if (isReadOnly) return;

    if (!db) {
      Alert.alert('Error Database', 'Koneksi database belum siap. Coba buka halaman ini lagi.');
      console.error('Database object is null or undefined.');
      return;
    }

    Alert.alert(
      'Konfirmasi Hapus',
      'Apakah Anda yakin ingin menghapus transaksi ini?',
      [
        { text: 'Tidak', style: 'cancel' },
        {
          text: 'Ya', style: 'destructive', onPress: async () => {
            try {
              const oldTrx = await getOldTransactionDetails(db, Number(idValue));

              if (oldTrx && oldTrx.rekening) {
                await reverseTransactionEffect(
                  db,
                  oldTrx.rekening,
                  oldTrx.jenis,
                  oldTrx.jumlah,
                  oldTrx.kategori
                );
              }

              await db.runAsync(`DELETE FROM transaksi WHERE id = ?`, [Number(idValue)]);

              Alert.alert('Sukses', 'Transaksi berhasil dihapus dan saldo rekening telah dikoreksi.', [
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
              {rekeningList.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={[styles.rekeningButton, { opacity: isReadOnly ? 0.5 : 1 }]}
                  onPress={isReadOnly ? () => {} : () => pilihRekening(item.bank)}
                  disabled={isReadOnly}
                >
                  <Text style={styles.rekeningText}>{item.bank}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </Modal>

      <View style={styles.topHeader}>
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
        {/* SWITCH JENIS TRANSAKSI */}
        <View style={styles.switchContainer}>
          <TouchableOpacity
            style={[
              styles.switchBtn,
              jenis === 'expense' && styles.switchActive,
              { opacity: isReadOnly ? 0.5 : 1 }
            ]}
            onPress={isReadOnly ? () => {} : () => setJenis('expense')}
            disabled={isReadOnly}
          >
            <Text style={[styles.switchText, jenis === 'expense' && styles.switchTextActive]}>Pengeluaran</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.switchBtn,
              jenis === 'income' && styles.switchActive,
              { opacity: isReadOnly ? 0.5 : 1 }
            ]}
            onPress={isReadOnly ? () => {} : () => setJenis('income')}
            disabled={isReadOnly}
          >
            <Text style={[styles.switchText, jenis === 'income' && styles.switchTextActive]}>Pemasukan</Text>
          </TouchableOpacity>
        </View>

        {/* DATE AND TIME PICKERS */}
        <View style={styles.row}>
          <TouchableOpacity 
            style={[styles.dateButton, { opacity: isReadOnly ? 0.5 : 1 }]}
            onPress={isReadOnly ? () => {} : () => showPickerHandler('date')}
            disabled={isReadOnly}
          >
            <Text>{formatTanggalIndonesia(tanggalObj)}</Text>
            <Ionicons name="calendar-outline" size={20} />
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.timeButton, { opacity: isReadOnly ? 0.5 : 1 }]}
            onPress={isReadOnly ? () => {} : () => showPickerHandler('time')}
            disabled={isReadOnly}
          >
            <Text>{jamObj.getHours().toString().padStart(2,'0')}:{jamObj.getMinutes().toString().padStart(2,'0')}</Text>
          </TouchableOpacity>
        </View>

        <DateTimePickerModal
          isVisible={showPicker}
          mode={pickerMode || 'date'}
          date={pickerMode === 'date' ? tanggalObj : jamObj}
          is24Hour
          display={pickerMode === 'date'
            ? (Platform.OS === 'ios' ? 'inline' : 'calendar')
            : (Platform.OS === 'ios' ? 'spinner' : 'clock')
          }
          onConfirm={(selectedDate) => {
            if (pickerMode === 'date') setTanggalObj(selectedDate);
            else setJamObj(selectedDate);
            setShowPicker(false);
            setPickerMode(null);
          }}
          onCancel={() => { setShowPicker(false); setPickerMode(null); }}
        />

        {/* DROPDOWN REKENING */}
        <View style={styles.dropdownContainer}>
          <TouchableOpacity 
            style={[styles.dropdownButton, { opacity: isReadOnly ? 0.5 : 1 }]}
            onPress={isReadOnly ? () => {} : () => setDropdownVisible(!dropdownVisible)}
            disabled={isReadOnly}
          >
            <Text style={{ color: rekeningDipilih ? '#000' : '#999' }}>
              {rekeningDipilih || 'Pilih Rekening'}
            </Text>
            <Ionicons name={dropdownVisible ? 'chevron-up' : 'chevron-down'} size={20} />
          </TouchableOpacity>

          {dropdownVisible && (
            <View style={styles.dropdownList}>
              {rekeningList.map((item) => (
                <TouchableOpacity 
                  key={item.id} 
                  style={styles.dropdownItem} 
                  onPress={isReadOnly ? () => {} : () => pilihDariDropdown(item.bank)}
                >
                  <Text style={styles.dropdownText}>{item.bank}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* INPUT JUMLAH */}
        <TextInput
          style={[styles.input, { backgroundColor: isReadOnly ? '#e0e0e0' : '#EFEFEF' }]}
          placeholder="Jumlah"
          keyboardType="numeric"
          value={jumlah !== null ? formatRupiahEdit(jumlah.toString()) : ''}
          onChangeText={isReadOnly ? () => {} : (text) => {
            const clean = text.replace(/\D/g, '');
            if (clean === '') setJumlah(null);
            else setJumlah(Number(clean));
          }}
          editable={!isReadOnly}
        />

        {/* INPUT KATEGORI DIPILIH */}
        <TextInput
          style={[styles.input, { backgroundColor: isReadOnly ? '#e0e0e0' : '#EFEFEF' }]}
          placeholder="Kategori yang Dipilih"
          value={kategoriDipilih}
          onChangeText={isReadOnly ? () => {} : setKategoriDipilih}
          editable={!isReadOnly}
        />

        {/* BUTTON KATEGORI LIST */}
        <View style={styles.kategoriContainer}>
          {kategoriList.map((item) => (
            <TouchableOpacity 
              key={item} 
              style={[styles.kategoriButton, { opacity: isReadOnly ? 0.5 : 1 }]}
              onPress={isReadOnly ? () => {} : () => pilihKategori(item)}
              disabled={isReadOnly}
            >
              <Text style={styles.kategoriText}>{item}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* INPUT TAMBAH KATEGORI BARU */}
        <TextInput
          style={[styles.input, { backgroundColor: isReadOnly ? '#e0e0e0' : '#EFEFEF' }]}
          placeholder="Tambah Kategori Baru"
          value={kategoriBaru}
          onChangeText={isReadOnly ? () => {} : setKategoriBaru}
          onSubmitEditing={isReadOnly ? () => {} : handleTambahKategori}
          editable={!isReadOnly}
        />

        {/* TOMBOL SIMPAN DAN HAPUS */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 }}>
          <TouchableOpacity
            style={[
              styles.simpanButton,
              { backgroundColor: isReadOnly ? '#ccc' : '#E53935' }
            ]}
            onPress={isReadOnly ? () => {} : hapusTransaksi}
            disabled={isReadOnly}
          >
            <Text style={styles.simpanText}>Hapus</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.simpanButton,
              { backgroundColor: isReadOnly ? '#ccc' : '#00A86B' }
            ]}
            onPress={isReadOnly ? () => {} : saveEdit}
            disabled={isReadOnly}
          >
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

  topHeader: {
    backgroundColor: '#00A86B',
    paddingTop: 50,
    paddingBottom: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    flexDirection: 'row',
    alignItems: 'center'
  },
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
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFEFEF',
    padding: 10,
    borderRadius: 8,
    flex: 0.65,
    justifyContent: 'space-between'
  },
  timeButton: { backgroundColor: '#EFEFEF', padding: 10, borderRadius: 8, flex: 0.3, alignItems: 'center' },

  input: { width: '100%', backgroundColor: '#EFEFEF', padding: 12, borderRadius: 8, marginBottom: 15 },

  dropdownContainer: { position: 'relative', width: '100%', marginBottom: 15 },
  dropdownButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#EFEFEF',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center'
  },
  dropdownList: { backgroundColor: '#fff', borderRadius: 8, borderWidth: 1, borderColor: '#ccc', marginTop: 5, elevation: 4, maxHeight: 200 },
  dropdownItem: { paddingVertical: 12, paddingHorizontal: 15 },
  dropdownText: { fontSize: 16 },

  kategoriContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 10, marginVertical: 10 },
  kategoriButton: { backgroundColor: '#00A86B', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 6 },
  kategoriText: { color: '#fff' },

  simpanButton: { paddingVertical: 12, paddingHorizontal: 30, borderRadius: 8 },
  simpanText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
