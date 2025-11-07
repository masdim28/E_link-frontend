import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Animated,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

type Rekening = {
  id: string;
  bank: string;
  saldo: number;
};

export default function RekeningScreen() {
  const [showOptions, setShowOptions] = useState(false);
  const fadeAnim = useState(new Animated.Value(0))[0];
  const router = useRouter();

  const toggleOptions = () => {
    if (showOptions) {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start(() => setShowOptions(false));
    } else {
      setShowOptions(true);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  };

  const data: Rekening[] = [
    { id: '1', bank: 'BCA', saldo: 8000000 },
    { id: '2', bank: 'BRI', saldo: 2500000 },
  ];

  const totalSaldo = data.reduce((a, b) => a + b.saldo, 0);

  const renderItem = ({ item }: { item: Rekening }) => (
    <View style={styles.item}>
      <Text style={styles.itemBank}>{item.bank}</Text>
      <Text style={styles.itemSaldo}>
        Rp {item.saldo.toLocaleString('id-ID')}
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Rekening</Text>

        <View style={styles.summaryContainer}>
          <Text style={styles.summaryTitle}>Total Saldo</Text>
          <Text style={styles.summaryAmount}>
            Rp {totalSaldo.toLocaleString('id-ID')}
          </Text>
        </View>
      </View>

      {/* Daftar rekening */}
      <FlatList
        data={data}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
      />

      {/* Overlay untuk menutup opsi */}
      {showOptions && (
        <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
          <TouchableOpacity
            style={{ flex: 1 }}
            activeOpacity={1}
            onPress={toggleOptions}
          />
        </Animated.View>
      )}

      {/* Tombol tambah + opsi */}
      <View style={styles.fabContainer}>
        {showOptions && (
          <Animated.View
            style={[styles.optionContainer, { opacity: fadeAnim }]}
          >
            {/* Pemasukan */}
            <View style={styles.optionRow}>
              <View style={styles.optionLabel}>
                <Text style={styles.optionLabelText}>Pemasukan</Text>
              </View>
              <TouchableOpacity
                style={[styles.optionIcon, { backgroundColor: '#00A86B' }]}
                onPress={() => router.push('/tambah-pemasukan')}
              >
                <Ionicons name="card-outline" size={20} color="#fff" />
              </TouchableOpacity>
            </View>

            {/* Pengeluaran */}
            <View style={styles.optionRow}>
              <View style={styles.optionLabel}>
                <Text style={styles.optionLabelText}>Pengeluaran</Text>
              </View>
              <TouchableOpacity
                style={[styles.optionIcon, { backgroundColor: '#D83A56' }]}
                onPress={() => router.push('/tambah-pengeluaran')}
              >
                <Ionicons name="bag-handle-outline" size={20} color="#fff" />
              </TouchableOpacity>
            </View>
          </Animated.View>
        )}

        <TouchableOpacity style={styles.addButton} onPress={toggleOptions}>
          <Ionicons name={showOptions ? 'close' : 'add'} size={28} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: {
    backgroundColor: '#00A86B',
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 16,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 20,
    textAlign: 'center',
    fontWeight: '600',
    marginBottom: 16,
  },
  summaryContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingVertical: 10,
    alignItems: 'center',
  },
  summaryTitle: { fontWeight: '600', color: '#000' },
  summaryAmount: { fontWeight: 'bold', fontSize: 16, color: '#00A86B' },
  listContent: { paddingHorizontal: 16, paddingTop: 20 },
  item: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 0.6,
    borderColor: '#E5E5E5',
  },
  itemBank: { fontSize: 16, fontWeight: 'bold' },
  itemSaldo: { fontSize: 16, fontWeight: '600', color: '#00A86B' },

  fabContainer: {
    position: 'absolute',
    bottom: 25,
    right: 25,
    alignItems: 'center',
  },
  addButton: {
    backgroundColor: '#00A86B',
    width: 55,
    height: 55,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
  },
  optionContainer: {
    alignItems: 'flex-end',
    marginBottom: 10,
    gap: 12,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  optionLabel: {
    backgroundColor: '#f2f2f2',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginRight: 8,
  },
  optionLabelText: {
    color: '#000',
    fontSize: 14,
    fontWeight: '500',
  },
  optionIcon: {
    width: 45,
    height: 45,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
});
