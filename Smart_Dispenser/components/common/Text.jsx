import React from "react";
import { Text as RNText, StyleSheet } from "react-native";
import { getUbuntuFont } from "../utils/fonts";

// Custom Text component that uses Ubuntu font by default
export const Text = ({ style, weight = "regular", children, ...props }) => {
  const fontStyle = {
    fontFamily: getUbuntuFont(weight),
  };

  return (
    <RNText style={[fontStyle, style]} {...props}>
      {children}
    </RNText>
  );
};

// Pre-styled text components
export const Title = ({ style, children, ...props }) => (
  <Text style={[styles.title, style]} weight="bold" {...props}>
    {children}
  </Text>
);

export const Subtitle = ({ style, children, ...props }) => (
  <Text style={[styles.subtitle, style]} weight="medium" {...props}>
    {children}
  </Text>
);

export const Body = ({ style, children, ...props }) => (
  <Text style={[styles.body, style]} weight="regular" {...props}>
    {children}
  </Text>
);

export const Caption = ({ style, children, ...props }) => (
  <Text style={[styles.caption, style]} weight="regular" {...props}>
    {children}
  </Text>
);

export const ButtonText = ({ style, children, ...props }) => (
  <Text style={[styles.button, style]} weight="medium" {...props}>
    {children}
  </Text>
);

const styles = StyleSheet.create({
  title: {
    fontSize: 24,
    lineHeight: 32,
  },
  subtitle: {
    fontSize: 18,
    lineHeight: 24,
  },
  body: {
    fontSize: 16,
    lineHeight: 24,
  },
  caption: {
    fontSize: 12,
    lineHeight: 16,
  },
  button: {
    fontSize: 14,
    lineHeight: 16,
    letterSpacing: 0.5,
  },
});

export default Text;
