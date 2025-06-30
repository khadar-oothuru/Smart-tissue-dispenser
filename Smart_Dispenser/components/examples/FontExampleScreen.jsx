import React from "react";
import { View, ScrollView, StyleSheet } from "react-native";
import {
  Text,
  Title,
  Subtitle,
  Body,
  Caption,
  ButtonText,
} from "../common/Text";
import { typography, createTextStyle } from "../../utils/typography";
import { getUbuntuFont } from "../../utils/fonts";
import { useThemeContext } from "../../context/ThemeContext";

// Example component showing different ways to use Ubuntu fonts
export const FontExampleScreen = () => {
  const { themeColors } = useThemeContext();

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: themeColors.background }]}
    >
      {/* Using pre-styled components */}
      <Title style={{ color: themeColors.heading, marginBottom: 16 }}>
        Ubuntu Font Examples
      </Title>

      <Subtitle style={{ color: themeColors.heading, marginBottom: 12 }}>
        Pre-styled Components
      </Subtitle>

      <Body style={{ color: themeColors.text, marginBottom: 8 }}>
        This is body text using the Body component with Ubuntu Regular.
      </Body>

      <Caption style={{ color: themeColors.text, marginBottom: 16 }}>
        This is caption text using Ubuntu Regular font.
      </Caption>

      <ButtonText style={{ color: themeColors.primary, marginBottom: 20 }}>
        BUTTON TEXT WITH UBUNTU MEDIUM
      </ButtonText>

      {/* Using direct weight prop */}
      <Subtitle style={{ color: themeColors.heading, marginBottom: 12 }}>
        Using Weight Props
      </Subtitle>

      <Text style={{ color: themeColors.text, marginBottom: 8 }} weight="light">
        This text uses Ubuntu Light font weight.
      </Text>

      <Text
        style={{ color: themeColors.text, marginBottom: 8 }}
        weight="regular"
      >
        This text uses Ubuntu Regular font weight.
      </Text>

      <Text
        style={{ color: themeColors.text, marginBottom: 8 }}
        weight="medium"
      >
        This text uses Ubuntu Medium font weight.
      </Text>

      <Text style={{ color: themeColors.text, marginBottom: 16 }} weight="bold">
        This text uses Ubuntu Bold font weight.
      </Text>

      {/* Using typography styles */}
      <Subtitle style={{ color: themeColors.heading, marginBottom: 12 }}>
        Typography Styles
      </Subtitle>

      <Text
        style={[typography.h1, { color: themeColors.heading, marginBottom: 8 }]}
      >
        Heading 1
      </Text>

      <Text
        style={[typography.h2, { color: themeColors.heading, marginBottom: 8 }]}
      >
        Heading 2
      </Text>

      <Text
        style={[typography.h3, { color: themeColors.heading, marginBottom: 8 }]}
      >
        Heading 3
      </Text>

      <Text
        style={[typography.body1, { color: themeColors.text, marginBottom: 8 }]}
      >
        Body 1 text with proper line height and spacing.
      </Text>

      <Text
        style={[typography.body2, { color: themeColors.text, marginBottom: 8 }]}
      >
        Body 2 text is smaller with proportional spacing.
      </Text>

      <Text
        style={[
          typography.subtitle1,
          { color: themeColors.text, marginBottom: 16 },
        ]}
      >
        Subtitle 1 with Ubuntu Medium
      </Text>

      {/* Using createTextStyle helper */}
      <Subtitle style={{ color: themeColors.heading, marginBottom: 12 }}>
        Custom Text Styles
      </Subtitle>

      <Text
        style={[
          createTextStyle(20, "bold", 28, 0.5),
          { color: themeColors.primary, marginBottom: 8 },
        ]}
      >
        Custom sized bold text
      </Text>

      <Text
        style={[
          createTextStyle(16, "light", 24),
          { color: themeColors.text, marginBottom: 16 },
        ]}
      >
        Custom light text with specific line height
      </Text>

      {/* Direct fontFamily usage */}
      <Subtitle style={{ color: themeColors.heading, marginBottom: 12 }}>
        Direct Font Family Usage
      </Subtitle>

      <Text
        style={[
          styles.directFont,
          { fontFamily: getUbuntuFont("bold"), color: themeColors.heading },
        ]}
      >
        Using getUbuntuFont() directly in styles
      </Text>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  directFont: {
    fontSize: 18,
    marginBottom: 20,
  },
});

export default FontExampleScreen;
