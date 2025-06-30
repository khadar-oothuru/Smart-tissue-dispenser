// components/Analytics/TabNavigation.js (Alternative with sliding indicator)
import React, { useRef, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Dimensions,
} from "react-native";
import { Ionicons, MaterialIcons, FontAwesome5 } from "@expo/vector-icons";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolate,
  withTiming,
  runOnJS,
} from "react-native-reanimated";
import { useThemeContext } from "../../context/ThemeContext";

const { width } = Dimensions.get("window");

const TabNavigation = ({ activeTab, onTabChange }) => {
  const { themeColors, isDark } = useThemeContext();
  const { background, text, primary, surface, inputbg } = themeColors;
  const slidePosition = useSharedValue(0);

  const tabs = [
    {
      id: "overview",
      title: "Overview",
      icon: "stats-chart",
      iconFamily: "Ionicons",
    },
    {
      id: "timebased",
      title: "Time",
      icon: "trending-up",
      iconFamily: "MaterialIcons",
    },
    {
      id: "devices",
      title: "Devices",
      icon: "mobile-alt",
      iconFamily: "FontAwesome5",
    },
  ];

  useEffect(() => {
    const index = tabs.findIndex((tab) => tab.id === activeTab);
    slidePosition.value = withSpring(index, {
      damping: 15,
      mass: 0.5,
      stiffness: 100,
    });
  }, [activeTab]);

  // Helper function to convert hex to rgb
  const hexToRgb = (hex) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(
          result[3],
          16
        )}`
      : "0, 0, 0";
  };
  // Dynamic shadow styles for container
  const containerShadow = {
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
      web: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 4,
        boxShadow: `0px 1px 8px rgba(0, 0, 0, 0.06)`,
      },
    }),
  };

  const getIcon = (iconFamily, iconName, isActive) => {
    const iconColor = isActive ? background : text;
    const iconSize = isActive ? 26 : 24;

    switch (iconFamily) {
      case "Ionicons":
        return <Ionicons name={iconName} size={iconSize} color={iconColor} />;
      case "MaterialIcons":
        return (
          <MaterialIcons name={iconName} size={iconSize} color={iconColor} />
        );
      case "FontAwesome5":
        return (
          <FontAwesome5 name={iconName} size={iconSize} color={iconColor} />
        );
      default:
        return null;
    }
  };

  // Calculate tab width more accurately
  const containerPadding = 16; // 8px padding on each side
  const containerWidth = width - 42; // 20px margin on each side
  const availableWidth = containerWidth - containerPadding;
  const tabWidth = availableWidth / tabs.length;

  // Animated slider style
  const sliderStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateX: interpolate(
          slidePosition.value,
          [0, 1, 2],
          [8, 8 + tabWidth, 8 + tabWidth * 2]
        ),
      },
    ],
  }));
  return (
    <View
      style={[
        styles.container,
        { backgroundColor: isDark ? surface : inputbg },
        containerShadow,
      ]}
    >
      <Animated.View
        style={[
          styles.slider,
          {
            backgroundColor: primary,
            width: tabWidth,
          },
          sliderStyle,
        ]}
      />

      {tabs.map((tab, index) => {
        const isActive = activeTab === tab.id;

        // Shared values for animations
        const scale = useSharedValue(isActive ? 1.2 : 1);
        const textOpacity = useSharedValue(isActive ? 0 : 1);

        React.useEffect(() => {
          scale.value = withSpring(isActive ? 1.2 : 1, {
            damping: 12,
            mass: 0.5,
            stiffness: 120,
          });
          textOpacity.value = withTiming(isActive ? 0 : 1, {
            duration: 200,
          });
        }, [isActive]);

        // Animated styles
        const animatedIconStyle = useAnimatedStyle(() => ({
          transform: [{ scale: scale.value }],
        }));

        const animatedTextStyle = useAnimatedStyle(() => ({
          opacity: textOpacity.value,
        }));

        return (
          <TouchableOpacity
            key={tab.id}
            style={styles.tab}
            onPress={() => onTabChange(tab.id)}
            activeOpacity={0.8}
          >
            <View style={styles.tabContent}>
              <Animated.View style={animatedIconStyle}>
                {getIcon(tab.iconFamily, tab.icon, isActive)}
              </Animated.View>
              {!isActive && (
                <Animated.Text
                  style={[
                    styles.title,
                    {
                      color: text,
                      fontWeight: "500",
                    },
                    animatedTextStyle,
                  ]}
                >
                  {tab.title}
                </Animated.Text>
              )}
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    borderRadius: 35,
    padding: 8,
    marginBottom: 24,
    marginHorizontal: 20,
    height: 70,
    position: "relative",
    ...(Platform.OS === "web" && {
      transition: "all 0.3s ease",
    }),
  },
  slider: {
    position: "absolute",
    top: 8,
    bottom: 8,
    borderRadius: 27,
    zIndex: -1,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
      web: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
      },
    }),
  },
  tab: {
    flex: 1,
    zIndex: 1,
    justifyContent: "center",
    alignItems: "center",
    ...(Platform.OS === "web" && {
      cursor: "pointer",
    }),
  },
  tabContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 10,
  },
  title: {
    fontSize: 14,
    marginLeft: 8,
    letterSpacing: 0.3,
  },
});

export default TabNavigation;

// // components/Analytics/TabNavigation.js (Pill Style Version)
// import React from 'react';
// import {
//   View,
//   Text,
//   TouchableOpacity,
//   StyleSheet,
//   Platform,
// } from 'react-native';
// import { Ionicons, MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
// import Animated, {
//   useSharedValue,
//   useAnimatedStyle,
//   withSpring,
//   interpolate,
// } from 'react-native-reanimated';
// import { useThemeContext } from "../../context/ThemeContext"

// const TabNavigation = ({ activeTab, onTabChange }) => {
//   const { themeColors, isDark } = useThemeContext();
//   const { background, text, primary, surface, inputbg } = themeColors;

//   const tabs = [
//     {
//       id: 'overview',
//       title: 'Overview',
//       icon: 'stats-chart',
//       iconFamily: 'Ionicons'
//     },
//     {
//       id: 'timebased',
//       title: 'Time',
//       icon: 'trending-up',
//       iconFamily: 'MaterialIcons'
//     },
//     {
//       id: 'devices',
//       title: 'Devices',
//       icon: 'mobile-alt',
//       iconFamily: 'FontAwesome5'
//     },
//   ];

//   const hexToRgb = (hex) => {
//     const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
//     return result
//       ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`
//       : '0, 0, 0';
//   };

//   const shadowStyles = {
//     ...Platform.select({
//       ios: {
//         shadowColor: primary,
//         shadowOffset: { width: 0, height: 4 },
//         shadowOpacity: 0.1,
//         shadowRadius: 10,
//       },
//       android: {
//         elevation: 8,
//         shadowColor: primary,
//       },
//       web: {
//         shadowColor: primary,
//         shadowOffset: { width: 0, height: 4 },
//         shadowOpacity: 0.1,
//         shadowRadius: 10,
//         boxShadow: `0px 4px 20px rgba(${hexToRgb(primary)}, 0.1)`,
//       },
//     }),
//   };

//   const getIcon = (iconFamily, iconName, isActive) => {
//     const iconColor = isActive ? background : text;
//     const iconSize = 20;

//     switch (iconFamily) {
//       case 'Ionicons':
//         return <Ionicons name={iconName} size={iconSize} color={iconColor} />;
//       case 'MaterialIcons':
//         return <MaterialIcons name={iconName} size={iconSize} color={iconColor} />;
//       case 'FontAwesome5':
//         return <FontAwesome5 name={iconName} size={iconSize} color={iconColor} />;
//       default:
//         return null;
//     }
//   };

//   return (
//     <View style={styles.wrapper}>
//       {tabs.map((tab) => {
//         const isActive = activeTab === tab.id;

//         const scale = useSharedValue(isActive ? 1 : 0.95);
//         const pillScale = useSharedValue(isActive ? 1 : 0);

//         React.useEffect(() => {
//           scale.value = withSpring(isActive ? 1 : 0.95, {
//             damping: 15,
//             mass: 0.5,
//             stiffness: 150,
//           });
//           pillScale.value = withSpring(isActive ? 1 : 0, {
//             damping: 15,
//             mass: 0.5,
//             stiffness: 100,
//           });
//         }, [isActive]);

//         const animatedStyle = useAnimatedStyle(() => ({
//           transform: [{ scale: scale.value }],
//         }));

//         const pillStyle = useAnimatedStyle(() => ({
//           opacity: pillScale.value,
//           transform: [{ scale: pillScale.value }],
//         }));

//         return (
//           <TouchableOpacity
//             key={tab.id}
//             onPress={() => onTabChange(tab.id)}
//             activeOpacity={0.8}
//             style={styles.touchable}
//           >
//             <Animated.View style={[
//               styles.tab,
//               animatedStyle,
//               !isActive && { backgroundColor: 'transparent' }
//             ]}>
//               <Animated.View
//                 style={[
//                   styles.pill,
//                   { backgroundColor: primary },
//                   pillStyle,
//                   shadowStyles
//                 ]}
//               />
//               <View style={styles.content}>
//                 {getIcon(tab.iconFamily, tab.icon, isActive)}
//                 <Text style={[
//                   styles.title,
//                   {
//                     color: isActive ? background : text,
//                     fontWeight: isActive ? '700' : '500',
//                     marginLeft: isActive ? 8 : 0,
//                   }
//                 ]}>
//                   {isActive ? tab.title : ''}
//                 </Text>
//               </View>
//             </Animated.View>
//           </TouchableOpacity>
//         );
//       })}
//     </View>
//   );
// };

// const styles = StyleSheet.create({
//   wrapper: {
//     flexDirection: 'row',
//     paddingHorizontal: 20,
//     marginBottom: 24,
//     gap: 12,
//   },
//   touchable: {
//     flex: 1,
//     ...(Platform.OS === 'web' && {
//       cursor: 'pointer',
//     }),
//   },
//   tab: {
//     position: 'relative',
//     height: 50,
//     borderRadius: 25,
//     overflow: 'hidden',
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   pill: {
//     position: 'absolute',
//     top: 0,
//     left: 0,
//     right: 0,
//     bottom: 0,
//     borderRadius: 25,
//     ...(Platform.OS === 'web' && {
//       transition: 'all 0.3s ease',
//     }),
//   },
//   content: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'center',
//     zIndex: 1,
//     paddingHorizontal: 20,
//   },
//   title: {
//     fontSize: 14,
//     letterSpacing: 0.3,
//   },
// });

// export default TabNavigation;
