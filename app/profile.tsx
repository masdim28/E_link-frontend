import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function ProfileScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={26} color="#fff" />
        </TouchableOpacity>

        <Text style={styles.headerText}>Profile</Text>

        {/* Dummy untuk menyeimbangkan space biar teks tetap center */}
        <View style={{ width: 26 }} />
      </View>

      {/* CONTENT */}
      <View style={styles.content}>
        <View style={styles.photoContainer}>
          <Ionicons name="person" size={80} color="#fff" />
        </View>

  <TouchableOpacity 
  style={styles.editButton}
  onPress={() => router.push("/edit-profile")}
>
  <Ionicons name="pencil" size={16} color="#00A86B" />
  <Text style={styles.editText}>Edit</Text>
</TouchableOpacity>


        <Text style={styles.name}>Eliza Yuniar</Text>
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
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  backButton: {
    padding: 4,
  },

  headerText: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "600",
  },

  content: {
    alignItems: "center",
    marginTop: 30,
  },

  photoContainer: {
    width: 110,
    height: 110,
    borderRadius: 100,
    backgroundColor: "#00A86B",
    justifyContent: "center",
    alignItems: "center",
  },

  editButton: {
    flexDirection: "row",
    alignItems: "center",
    position: "absolute",
    right: 30,
    top: 10,
    backgroundColor: "#fff",
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 6,
    elevation: 3,
  },

  editText: {
    marginLeft: 4,
    color: "#00A86B",
    fontWeight: "500",
  },

  name: {
    marginTop: 18,
    fontSize: 18,
    fontWeight: "700",
    textDecorationLine: "underline",
  },
});
