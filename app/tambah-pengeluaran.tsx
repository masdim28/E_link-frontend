import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useNavigation } from '@react-navigation/native';
import React, { useState } from 'react';
import {
  Alert,
  FlatList,
  Keyboard,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { insertTransaction, openDatabase } from '../database/database';

export default function TambahPengeluaran() {
  const navigation = useNavigation();
  const db = openDatabase();
const [rekeningBaru, setRekeningBaru] = useState('');
const [modalRekeningBaru, setModalRekeningBaru] = useState(false);

  const [rekeningDipilih, setRekeningDipilih] = useState<string | null>(null);
  const [tanggal, setTanggal] = useState(new Date());
  const [jam, setJam] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [jumlah, setJumlah] = useState('');
  const [kategoriDipilih, setKategoriDipilih] = useState('');
  const [modalVisible, setModalVisible] = useState(true);
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const [kategoriBaru, setKategoriBaru] = useState('');
  const [kategoriList, setKategoriList] = useState([
    'Makanan',
    'Kos',
    'Kesehatan',
    'Transportasi',
    'Jajan',
    'Buah',
  ]);

  const daftarRekening = [
    'Gopay',
    'Dana',
    'Mandiri',
    'BCA',
    'Jago',
    'OVO',
    'BRI',
    'Lainnya',
    'Uang Tunai',
  ];

  const handleDateChange = (_: any, selectedDate?: Date) => {
    const currentDate = selectedDate || tanggal;
    setShowDatePicker(false);
    setTanggal(currentDate);
  };

  const handleTimeChange = (_: any, selectedTime?: Date) => {
    const currentTime = selectedTime || jam;
    setShowTimePicker(false);
    setJam(currentTime);
  };

  const pilihRekening = (item: string) => {
  if (item === "Lainnya") {
    setModalVisible(false);
    setModalRekeningBaru(true);
  } else {
    setRekeningDipilih(item);
    setModalVisible(false);
  }
};

  const pilihDariDropdown = (item: string) => {
  if (item === "Lainnya") {
    setDropdownVisible(false);
    setModalRekeningBaru(true);
  } else {
    setRekeningDipilih(item);
    setDropdownVisible(false);
  }
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

  const handleSubmitEditing = () => {
    handleTambahKategori();
  };

  const formatTanggalIndonesia = (date: Date) => {
    const hariList = [
      'Minggu',
      'Senin',
      'Selasa',
      'Rabu',
      'Kamis',
      'Jumat',
      'Sabtu',
    ];
    const bulanList = [
      'Januari',
      'Februari',
      'Maret',
      'April',
      'Mei',
      'Juni',
      'Juli',
      'Agustus',
      'September',
      'Oktober',
      'November',
      'Desember',
    ];
    const hari = hariList[date.getDay()];
    const tanggal = date.getDate();
    const bulan = bulanList[date.getMonth()];
    const tahun = date.getFullYear();
    return `${hari}, ${tanggal} ${bulan} ${tahun}`;
  };

  const formatRupiah = (value: string) => {
    const numberString = value.replace(/\D/g, '');
    return numberString.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  };

  const handleSimpan = async () => {
    const angkaBersih = jumlah.replace(/\./g, '').trim();

    if (!angkaBersih || isNaN(Number(angkaBersih)) || Number(angkaBersih) <= 0) {
      Alert.alert('Jumlah Tidak Valid', 'Masukkan nominal yang benar.');
      return;
    }

    if (!rekeningDipilih || !kategoriDipilih) {
      Alert.alert('Peringatan', 'Harap lengkapi semua data sebelum menyimpan.');
      return;
    }

    try {
      await insertTransaction(db, {
        tanggal: tanggal.toISOString().split('T')[0],
        jam: jam.toTimeString().split(' ')[0],
        rekening: rekeningDipilih,
        jenis: 'expense',
        kategori: kategoriDipilih,
        jumlah: Number(angkaBersih),
      });

      Alert.alert('Berhasil', 'Transaksi pengeluaran berhasil disimpan.');
      navigation.goBack();
    } catch (error) {
      console.error('❌ Gagal simpan:', error);
      Alert.alert('Error', 'Terjadi kesalahan saat menyimpan data.');
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      {/* Modal Pilih Rekening */}
<Modal visible={modalRekeningBaru} transparent animationType="fade">
  <View style={styles.overlay}>
    <View style={styles.modalContainer}>
      <Text style={styles.header}>Rekening Baru</Text>

      <TextInput
        style={styles.input}
        placeholder="Masukkan nama rekening"
        value={rekeningBaru}
        onChangeText={setRekeningBaru}
      />

      <TouchableOpacity
        style={styles.simpanButton}
        onPress={() => {
          if (rekeningBaru.trim() === '') {
            Alert.alert("Peringatan", "Nama rekening tidak boleh kosong.");
            return;
          }

          setRekeningDipilih(rekeningBaru.trim());
          setRekeningBaru('');
          setModalRekeningBaru(false);
        }}
      >
        <Text style={styles.simpanText}>Simpan</Text>
      </TouchableOpacity>
    </View>
  </View>
</Modal>


      <Modal visible={modalVisible} transparent animationType="fade">
        <View style={styles.overlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.header}>Pilih Rekening</Text>
            <View style={styles.grid}>
              {daftarRekening.map((item) => (
                <TouchableOpacity
                  key={item}
                  style={styles.rekeningButton}
                  onPress={() => pilihRekening(item)}
                >
                  <Text style={styles.rekeningText}>{item}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </Modal>

      {/* Header Hijau */}
      <View style={styles.topHeader}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => {
            Alert.alert(
              'Konfirmasi',
              'Apakah kamu ingin meninggalkan halaman ini?',
              [
                { text: 'Tidak', style: 'cancel' },
                {
                  text: 'Iya',
                  onPress: () => navigation.goBack(),
                },
              ]
            );
          }}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Tambah Pengeluaran</Text>
      </View>

      {/* Form */}
      <ScrollView contentContainerStyle={styles.formContainer}>
        <View style={styles.row}>
          <TouchableOpacity
            style={styles.dateButton}
            onPress={() => setShowDatePicker(true)}
          >
            <Text>{formatTanggalIndonesia(tanggal)}</Text>
            <Ionicons name="calendar-outline" size={20} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.timeButton}
            onPress={() => setShowTimePicker(true)}
          >
            <Text>
              {jam.getHours().toString().padStart(2, '0')}:
              {jam.getMinutes().toString().padStart(2, '0')}
            </Text>
          </TouchableOpacity>
        </View>

        {showDatePicker && (
          <DateTimePicker
            value={tanggal}
            mode="date"
            display="default"
            onChange={handleDateChange}
          />
        )}

        {showTimePicker && (
          <DateTimePicker
            value={jam}
            mode="time"
            display="default"
            onChange={handleTimeChange}
          />
        )}

        {/* Rekening Dropdown */}
        <View style={styles.dropdownContainer}>
          <TouchableOpacity
            style={styles.dropdownButton}
            onPress={() => setDropdownVisible(!dropdownVisible)}
          >
            <Text style={{ color: rekeningDipilih ? '#000' : '#999' }}>
              {rekeningDipilih || 'Pilih Rekening'}
            </Text>
            <Ionicons
              name={dropdownVisible ? 'chevron-up' : 'chevron-down'}
              size={20}
              color="#000"
            />
          </TouchableOpacity>

          {dropdownVisible && (
            <View style={styles.dropdownList}>
              <FlatList
                data={daftarRekening}
                keyExtractor={(item) => item}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.dropdownItem}
                    onPress={() => pilihDariDropdown(item)}
                  >
                    <Text style={styles.dropdownText}>{item}</Text>
                  </TouchableOpacity>
                )}
              />
            </View>
          )}
        </View>

        {/* Input Jumlah */}
        <TextInput
          style={styles.input}
          placeholder="Jumlah"
          keyboardType="numeric"
          value={jumlah}
          onChangeText={(text) => setJumlah(formatRupiah(text))}
        />

        <TextInput
          style={styles.input}
          placeholder="Kategori yang Dipilih"
          value={kategoriDipilih}
          onChangeText={setKategoriDipilih}
        />

        <View style={styles.kategoriContainer}>
          {kategoriList.map((item) => (
            <TouchableOpacity
              key={item}
              style={styles.kategoriButton}
              onPress={() => pilihKategori(item)}
            >
              <Text style={styles.kategoriText}>{item}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TextInput
          style={styles.input}
          placeholder="Tambah Kategori Baru"
          value={kategoriBaru}
          onChangeText={setKategoriBaru}
          onSubmitEditing={handleSubmitEditing}
        />

        <TouchableOpacity style={styles.simpanButton} onPress={handleSimpan}>
          <Text style={styles.simpanText}>Simpan</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#fff',
    padding: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  topHeader: {
    backgroundColor: '#00A86B',
    paddingTop: 50,
    paddingBottom: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    position: 'absolute',
    left: 20,
    top: 50,
    zIndex: 10,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    color: '#fff',
    fontSize: 20,
    fontWeight: '600',
  },
  formContainer: {
    paddingHorizontal: 20,
    paddingVertical: 25,
  },
  header: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#007E33',
    marginBottom: 20,
    textAlign: 'center',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
  },
  rekeningButton: {
    backgroundColor: '#E9E9E9',
    paddingVertical: 15,
    paddingHorizontal: 25,
    borderRadius: 10,
    margin: 5,
  },
  rekeningText: {
    fontSize: 16,
    fontWeight: '600',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFEFEF',
    padding: 10,
    borderRadius: 8,
    flex: 0.65,
    justifyContent: 'space-between',
  },
  timeButton: {
    backgroundColor: '#EFEFEF',
    padding: 10,
    borderRadius: 8,
    flex: 0.3,
    alignItems: 'center',
  },
  input: {
    width: '100%',
    backgroundColor: '#EFEFEF',
    padding: 12,
    borderRadius: 8,
    marginBottom: 15,
  },
  dropdownContainer: {
    position: 'relative',
    width: '100%',
    marginBottom: 15,
  },
  dropdownButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#EFEFEF',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  dropdownList: {
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ccc',
    marginTop: 5,
    elevation: 4,
    maxHeight: 200,
  },
  dropdownItem: {
    paddingVertical: 12,
    paddingHorizontal: 15,
  },
  dropdownText: {
    fontSize: 16,
  },
  kategoriContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
    marginVertical: 10,
  },
  kategoriButton: {
    backgroundColor: '#00A86B',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  kategoriText: {
    color: '#fff',
  },
  simpanButton: {
    backgroundColor: '#00A86B',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 8,
    alignSelf: 'flex-end',
  },
  simpanText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
