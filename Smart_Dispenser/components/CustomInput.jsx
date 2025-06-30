import React from "react";
import { TextInput, StyleSheet, View } from "react-native";
import { useThemeContext } from "../context/ThemeContext";

export default function CustomInput({
  value,
  onChangeText,
  placeholder,
  secureTextEntry = false,
  onFocus,
  onBlur,
  isFocused,
  keyboardType = "default",
}) {
  const { themeColors } = useThemeContext();
  const { inputbg, text, border, primary } = themeColors;

  return (
    <TextInput
      style={[
        styles.input,
        {
          backgroundColor: inputbg,
          color: text,
          borderColor: isFocused ? primary : border || text,
        },
      ]}
      placeholder={placeholder}
      placeholderTextColor={text}
      value={value}
      onChangeText={onChangeText}
      secureTextEntry={secureTextEntry}
      keyboardType={keyboardType}
      onFocus={onFocus}
      onBlur={onBlur}
    />
  );
}

const styles = StyleSheet.create({
  input: {
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    borderWidth: 1,
    height: 60,
    fontSize: 16,
  },
});
