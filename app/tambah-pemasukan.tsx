import { Ionicons } from '@expo/vector-icons';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import { useNavigation } from '@react-navigation/native';
import React, { useState } from 'react';
import {
  FlatList,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Platform,
  Keyboard,
} from 'react-native';

export default function TambahPemasukan() {
  const navigation = useNavigation();
  const [rekeningDipilih, setRekeningDipilih] = useState<string | null>(null);
  const [tanggal, setTanggal] = useState(new Date());
  const [jam, setJam] = useState(new Date());
  const [showPicker, setShowPicker] = useState(false);
  const [pickerMode, setPickerMode] = useState<'date' | 'time' | null>(null);
  const [jumlah, setJumlah] = useState('');
  const [kategoriDipilih, setKategoriDipilih] = useState('');
  const [kategoriBaru, setKategoriBaru] = useState('');
  const [kategoriList, setKategoriList] = useState([
    'Gaji',
    'Bonus',
    'Penjualan',
    'Investasi',
  ]);
  const [modalVisible, setModalVisible] = useState(true);
  const [dropdownVisible, setDropdownVisible] = useState(false);

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

  const handleSubmitEditing = () => {
    handleTambahKategori();
  };

  // ✅ Format tanggal: Hari, tanggal bulan tahun
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
    const tgl = date.getDate();
    const bulan = bulanList[date.getMonth()];
    const tahun = date.getFullYear();
    return `${hari}, ${tgl} ${bulan} ${tahun}`;
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      {/* Modal Pilih Rekening Awal */}
      <Modal visible={modalVisible} transparent animationType="fade">
        <View style={styles.overlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.header}>Pilih Rekening</Text>
            <View style={styles.grid}>
              {daftarRekening.map((item) => (
                <TouchableOpacity
                  key={item}
                  style={styles.rekeningButton}
                  onPress={() => pilihRekening(item)}>
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
          onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Tambah Pemasukan</Text>
      </View>

      {/* Form */}
      <ScrollView contentContainerStyle={styles.formContainer}>
        {/* Baris tanggal & waktu */}
        <View style={styles.row}>
          <TouchableOpacity
            style={styles.dateButton}
            onPress={() => showPickerHandler('date')}>
            <Text>{formatTanggalIndonesia(tanggal)}</Text>
            <Ionicons name="calendar-outline" size={20} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.timeButton}
            onPress={() => showPickerHandler('time')}>
            <Text>
              {jam.getHours().toString().padStart(2, '0')}:
              {jam.getMinutes().toString().padStart(2, '0')}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Kalender & Time Picker modern */}
        <DateTimePickerModal
          isVisible={showPicker}
          mode={pickerMode || 'date'}
          date={pickerMode === 'date' ? tanggal : jam}
          is24Hour={true}
          display={
            pickerMode === 'date'
              ? Platform.OS === 'ios'
                ? 'inline'
                : 'calendar'
              : Platform.OS === 'ios'
              ? 'spinner'
              : 'clock'
          }
          onConfirm={(selectedDate) => {
            if (pickerMode === 'date') setTanggal(selectedDate);
            else setJam(selectedDate);
            setShowPicker(false);
            setPickerMode(null);
          }}
          onCancel={() => {
            setShowPicker(false);
            setPickerMode(null);
          }}
        />

        {/* Dropdown Rekening */}
        <View style={styles.dropdownContainer}>
          <TouchableOpacity
            style={styles.dropdownButton}
            onPress={() => setDropdownVisible(!dropdownVisible)}>
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
                    onPress={() => pilihDariDropdown(item)}>
                    <Text style={styles.dropdownText}>{item}</Text>
                  </TouchableOpacity>
                )}
              />
            </View>
          )}
        </View>

        {/* Jumlah */}
        <TextInput
          style={styles.input}
          placeholder="Jumlah"
          keyboardType="numeric"
          value={jumlah}
          onChangeText={setJumlah}
        />

        {/* Kategori Dipilih (bisa diketik manual) */}
        <TextInput
          style={styles.input}
          placeholder="Kategori yang Dipilih"
          value={kategoriDipilih}
          onChangeText={setKategoriDipilih}
          editable={true}
        />

        {/* Tombol Kategori */}
        <View style={styles.kategoriContainer}>
          {kategoriList.map((item) => (
            <TouchableOpacity
              key={item}
              style={styles.kategoriButton}
              onPress={() => pilihKategori(item)}>
              <Text style={styles.kategoriText}>{item}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Tambah Kategori Baru */}
        <TextInput
          style={styles.input}
          placeholder="Tambah Kategori Baru"
          value={kategoriBaru}
          onChangeText={setKategoriBaru}
          onSubmitEditing={handleSubmitEditing}
        />

        {/* Tombol Simpan */}
        <TouchableOpacity style={styles.simpanButton}>
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
