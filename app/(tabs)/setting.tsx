import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function SettingScreen() {
  const [notifEnabled, setNotifEnabled] = useState(true);
  const router = useRouter();

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <Text style={styles.headerText}>Setting</Text>
      </View>

      {/* CONTENT */}
      <View style={styles.content}>

        {/* === PROFILE === */}
        <TouchableOpacity
          style={styles.item}
          onPress={() => router.push("/profile")}
        >
          <View style={styles.iconCircle}>
            <Ionicons name="person" size={26} color="#fff" />
          </View>
          <Text style={styles.itemText}>Profile</Text>
        </TouchableOpacity>

        {/* === NOTIFIKASI === */}
        <View style={styles.item}>
          <View style={styles.iconCircle}>
            <Ionicons name="notifications" size={24} color="#fff" />
          </View>
          <Text style={styles.itemText}>Nofikasi</Text>

          <Switch
            value={notifEnabled}
            onValueChange={() => setNotifEnabled(!notifEnabled)}
            thumbColor="#fff"
            trackColor={{ false: "#ccc", true: "#00A86B" }}
            style={{ marginLeft: "auto" }}
          />
        </View>

        {/* === HAPUS DATA === */}
        <TouchableOpacity style={styles.item}>
          <View style={styles.iconCircle}>
            <Ionicons name="trash" size={24} color="#fff" />
          </View>
          <Text style={styles.itemText}>Hapus data</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },

  header: {
    backgroundColor: "#00A86B",
    paddingTop: 50,
    paddingBottom: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    alignItems: "center",
  },

  headerText: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "600",
  },

  content: {
    paddingTop: 20,
    paddingHorizontal: 20,
  },

  item: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 18,
  },

  iconCircle: {
    width: 42,
    height: 42,
    backgroundColor: "#00A86B",
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },

  itemText: {
    fontSize: 16,
    color: "#000",
  },
});
