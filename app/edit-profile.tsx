import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
    Alert,
    Image,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

export default function EditProfileScreen() {
  const router = useRouter();

  const [name, setName] = useState("Eliza Yuniar");
  const [photo, setPhoto] = useState<string | null>(null); // ✅ Fixed

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setPhoto(result.assets[0].uri); // aman
    }
  };

  const saveProfile = () => {
    Alert.alert("Berhasil", "Profil berhasil diperbarui!");
    router.back();
  };

  return (
    <View style={styles.container}>
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={26} color="#fff" />
        </TouchableOpacity>

        <Text style={styles.headerText}>Edit Profile</Text>
        <View style={{ width: 26 }} />
      </View>

      {/* Content */}
      <View style={styles.content}>
        
        {/* Profile Photo */}
        <TouchableOpacity onPress={pickImage}>
          {photo ? (
            <Image source={{ uri: photo }} style={styles.photo} />
          ) : (
            <View style={styles.photoPlaceholder}>
              <Ionicons name="camera" size={40} color="#fff" />
            </View>
          )}
        </TouchableOpacity>

    
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
        />

        <TouchableOpacity style={styles.saveButton} onPress={saveProfile}>
          <Text style={styles.saveText}>Simpan</Text>
        </TouchableOpacity>
      </View>
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
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  headerText: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "600",
  },

  content: {
    alignItems: "center",
    marginTop: 30,
    paddingHorizontal: 20,
  },

  photoPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 100,
    backgroundColor: "#00A86B",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },

  photo: {
    width: 120,
    height: 120,
    borderRadius: 100,
    marginBottom: 20,
  },

  label: {
    fontSize: 16,
    alignSelf: "flex-start",
    marginLeft: 10,
    marginBottom: 6,
  },

  input: {
    width: "100%",
    backgroundColor: "#f2f2f2",
    padding: 12,
    borderRadius: 8,
    fontSize: 16,
    marginBottom: 20,
  },

  saveButton: {
    backgroundColor: "#00A86B",
    paddingVertical: 12,
    paddingHorizontal: 40,
    borderRadius: 10,
    marginTop: 10,
  },

  saveText: {
    fontSize: 16,
    color: "#fff",
    fontWeight: "600",
  },
});
