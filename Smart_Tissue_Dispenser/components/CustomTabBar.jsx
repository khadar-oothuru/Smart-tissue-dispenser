// components/CustomTabBar.js
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";
import { useRouter, usePathname } from "expo-router";
import { useThemeContext } from "../context/ThemeContext";  

export default function CustomTabBar({ tabs, state, descriptors, navigation }) {
  const { themeColors } = useThemeContext();  
  const { background, text, primary } = themeColors;
  const router = useRouter();  
  const pathname = usePathname();
  
  // State to track if this is the initial render
  const [hasNavigated, setHasNavigated] = useState(false);
  const [currentTab, setCurrentTab] = useState(null);

  // If navigation props are provided (from Tabs.Navigator), use them
  const isNavigationMode = !!(state && navigation);
  const activeIndex = state?.index;

  // Set the initial tab on first render
  useEffect(() => {
    if (!hasNavigated && tabs.length > 0) {
      if (isNavigationMode && state) {
        // Use the navigation state
        const activeRouteName = state.routes[activeIndex].name;
        const activeTab = tabs.find(tab => tab.name === activeRouteName);
        setCurrentTab(activeTab ? activeTab.name : tabs[0].name);
      } else {
        // Find the current tab based on pathname, or default to first tab
        const activeTab = tabs.find(tab => pathname.includes(tab.name));
        setCurrentTab(activeTab ? activeTab.name : tabs[0].name);
      }
    }
  }, [pathname, tabs, hasNavigated, isNavigationMode, state, activeIndex]);

  // Update current tab when pathname changes
  useEffect(() => {
    if (isNavigationMode && state) {
      const activeRouteName = state.routes[activeIndex].name;
      const activeTab = tabs.find(tab => tab.name === activeRouteName);
      if (activeTab) {
        setCurrentTab(activeTab.name);
        setHasNavigated(true);
      }
    } else {
      const activeTab = tabs.find(tab => pathname.includes(tab.name));
      if (activeTab) {
        setCurrentTab(activeTab.name);
        setHasNavigated(true);
      }
    }
  }, [pathname, tabs, isNavigationMode, state, activeIndex]);

  // Dynamic shadow styles for all platforms
  const shadowStyles = {
    ...Platform.select({
      ios: {
        shadowColor: primary,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
      },
      android: {
        elevation: 15,
        shadowColor: primary,
      },
      web: {
        shadowColor: primary,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        boxShadow: `0px 6px 24px rgba(${hexToRgb(primary)}, 0.15)`,
      },
    }),
  };

  const handleTabPress = (tabName) => {
    setCurrentTab(tabName);
    setHasNavigated(true);
    
    if (isNavigationMode && navigation) {
      // Use the navigation prop from Tabs.Navigator
      navigation.navigate(tabName);
    } else {
      // Use expo-router
      router.push(`./${tabName}`);
    }
  };
  return (
    <Animated.View style={[
      styles.tabContainer, 
      { backgroundColor: background },
      shadowStyles
    ]}>
      {tabs.map((tab, index) => (
        <TabButton
          key={tab.name}
          tab={tab}
          index={index}
          isFocused={currentTab === tab.name || (!hasNavigated && index === 0 && !currentTab)}
          onPress={() => handleTabPress(tab.name)}
          background={background}
          text={text}
          primary={primary}
        />
      ))}
    </Animated.View>
  );
}

// Separate component for individual tab to use hooks properly
const TabButton = ({ tab, index, isFocused, onPress, background, text, primary }) => {
  const scale = useSharedValue(isFocused ? 1.2 : 1); 
  const circleScale = useSharedValue(isFocused ? 1 : 0);  

  React.useEffect(() => {
    scale.value = withSpring(isFocused ? 1.2 : 1, {
      damping: 12,
      mass: 0.5,
      stiffness: 120,
    });
    circleScale.value = withSpring(isFocused ? 1 : 0, {
      damping: 15,
      mass: 0.5,
      stiffness: 100,
    });
  }, [isFocused, scale, circleScale]);

  // Animated styles for smooth transformations
  const animatedIconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const animatedCircleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: circleScale.value }],
    opacity: circleScale.value,
  }));

  return (
    <TouchableOpacity
      onPress={onPress}
      style={styles.tabButton}
      activeOpacity={0.8}
    >
      <View style={styles.iconContainer}>
        <Animated.View 
          style={[
            styles.circle, 
            { backgroundColor: primary }, 
            animatedCircleStyle
          ]} 
        />
        <Animated.View style={animatedIconStyle}>
          <Ionicons
            name={tab.icon}
            size={26}
            color={isFocused ? background : text}  
          />
        </Animated.View>
      </View>
      
      {!isFocused && (
        <Text style={[styles.tabLabel, { color: text }]}>{tab.label}</Text>
      )}
    </TouchableOpacity>
  );
}

// Helper function to convert hex to rgb
function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`
    : '0, 0, 0';
}

const styles = StyleSheet.create({
  tabContainer: {
    position: "absolute",
    bottom: Platform.select({
      android: 10,
      ios: 20,
      web: 20,
    }),
    left: 20,
    right: 20,
    height: 75,
    borderRadius: 40,
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingBottom: 6,
    ...(Platform.OS === 'web' && {
      transition: 'all 0.3s ease',
    }),
  },
  tabButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    ...(Platform.OS === 'web' && {
      cursor: 'pointer',
    }),
  },
  iconContainer: {
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  circle: {
    position: "absolute",
    width: 50,
    height: 50,
    borderRadius: 25,
    zIndex: -1,
    ...(Platform.OS === 'web' && {
      transition: 'all 0.3s ease',
    }),
  },
  tabLabel: {
    fontSize: 10,
    marginTop: 4,
    fontWeight: "700",
  },
});