import React, { useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Dimensions, 
  Animated,
  Image
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useThemeContext } from '../../context/ThemeContext';
import img from '../../assets/images/underlight.png'; 

const { width, height } = Dimensions.get('window');

const UnderConstruction = () => {
  const { themeColors, isDark } = useThemeContext();
  
  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Entry animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();

    // Continuous rotation animation
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 10000,
        useNativeDriver: true,
      })
    ).start();

    // Pulse animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const getGradientColors = () => {
    if (isDark) {
      return [themeColors.background, themeColors.surface];
    }
    return ['#f8f9fa', '#ffffff'];
  };

  const getAccentGradient = () => {
    if (isDark) {
      return [themeColors.primary, themeColors.primary + '80'];
    }
    return [themeColors.primary, '#667eea'];
  };

  return (
    <LinearGradient
      colors={getGradientColors()}
      style={styles.container}
    >
      {/* Background decoration */}
      <Animated.View 
        style={[
          styles.backgroundCircle,
          {
            transform: [{ rotate: spin }],
            opacity: isDark ? 0.1 : 0.05,
          }
        ]}
      >
        <LinearGradient
          colors={getAccentGradient()}
          style={styles.circle}
        />
      </Animated.View>

      <Animated.View 
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          }
        ]}
      >
        {/* Icon Container with gradient background */}
        <Animated.View 
          style={[
            styles.iconContainer,
            {
              transform: [{ scale: pulseAnim }],
            }
          ]}
        >
          <LinearGradient
            colors={getAccentGradient()}
            style={styles.iconGradient}
          >
            <View style={styles.iconWrapper}>
              <MaterialCommunityIcons 
                name="hammer-wrench" 
                size={60} 
                color="#ffffff" 
              />
            </View>
          </LinearGradient>
        </Animated.View>

        <Text style={[styles.title, { color: themeColors.heading }]}>
          Under Construction
        </Text>
        
        <Text style={[styles.subtitle, { color: themeColors.primary }]}>
          Something amazing is coming!
        </Text>

        <Text style={[styles.message, { color: themeColors.text }]}>
          We're working hard to bring you this feature. 
          Our team is putting the finishing touches to create 
          an exceptional experience for you.
        </Text>

        {/* Progress indicator */}
        <View style={styles.progressContainer}>
          <View style={[styles.progressBar, { backgroundColor: themeColors.inputbg }]}>
            <Animated.View 
              style={[
                styles.progressFill,
                {
                  backgroundColor: themeColors.primary,
                  transform: [{
                    scaleX: fadeAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, 0.7],
                    })
                  }]
                }
              ]}
            />
          </View>
          <Text style={[styles.progressText, { color: themeColors.text }]}>
            70% Complete
          </Text>
        </View>

        {/* 
        <View style={styles.imageContainer}>
          <Image
            source={img}
            style={styles.constructionImage}
            resizeMode="contain"
          />
        </View> */}

        {/* Footer note */}
        <View style={styles.footer}>
          <MaterialCommunityIcons 
            name="clock-outline" 
            size={16} 
            color={themeColors.text} 
          />
          <Text style={[styles.footerText, { color: themeColors.text }]}>
            Expected completion: Soon
          </Text>
        </View>
      </Animated.View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  backgroundCircle: {
    position: 'absolute',
    width: width * 1.5,
    height: width * 1.5,
    top: -width * 0.5,
    right: -width * 0.5,
  },
  circle: {
    width: '100%',
    height: '100%',
    borderRadius: width * 0.75,
  },
  content: {
    alignItems: 'center',
    padding: 30,
    maxWidth: 400,
  },
  iconContainer: {
    marginBottom: 30,
  },
  iconGradient: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  iconWrapper: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 20,
  },
  message: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 30,
    paddingHorizontal: 20,
  },
  progressContainer: {
    width: '100%',
    marginBottom: 30,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
    width: '100%',
  },
  progressText: {
    fontSize: 12,
    textAlign: 'center',
    fontWeight: '600',
  },
  imageContainer: {
    width: 200,
    height: 150,
    marginBottom: 20,
  },
  constructionImage: {
    width: '100%',
    height: '100%',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  footerText: {
    fontSize: 14,
  },
});

export default UnderConstruction;