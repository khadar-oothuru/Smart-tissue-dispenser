

import React from "react";
import { TouchableOpacity, View, Text, Image, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useThemeContext } from "../context/ThemeContext";

export default function GoogleSignInButton({ onPress }) {
  const { themeColors } = useThemeContext();
  const { text, border } = themeColors;

  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        styles.button,
        { borderColor: border }
      ]}
    >
      <View style={styles.innerContent}>
        <Image
          source={{ uri: "https://img.icons8.com/color/48/google-logo.png" }}
          style={styles.logo}
        />
        <Text style={[styles.buttonText, { color: text }]}>Continue with Google</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color={text} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 15,
    paddingHorizontal: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    flex: 1,
  },
  innerContent: { flexDirection: "row", alignItems: "center" },
  logo: { width: 25, height: 25 },
  buttonText: { marginLeft: 10, fontWeight: "500", fontSize: 14 },
});