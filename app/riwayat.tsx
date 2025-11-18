import { View, Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

export default function FiturBaru() {
  const router = useRouter();

  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      
      {/* HEADER */}
      <View
        style={{
          paddingTop: 50,
          paddingBottom: 20,
          paddingHorizontal: 16,
          backgroundColor: '#00A86B',
          flexDirection: 'row',
          alignItems: 'center',
        }}
      >
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={26} color="#fff" />
        </TouchableOpacity>

        <Text
          style={{
            fontSize: 20,
            color: '#fff',
            fontWeight: '600',
            marginLeft: 125,
          }}
        >
          Riwayat
        </Text>
      </View>

      {/* CONTENT */}
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Text style={{ fontSize: 20, fontWeight: "600" }}>
          Halaman Baru (Masih Kosong)
        </Text>
      </View>

    </View>
  );
}