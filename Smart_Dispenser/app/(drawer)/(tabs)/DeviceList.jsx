

import React, { useState, useEffect,useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  StatusBar,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useThemeContext } from '../../../context/ThemeContext'; 
import { ScreenWrapper } from "../../../components/common/ScreenWrapper";
import { useNavigation } from '@react-navigation/native';

// Inside the Home component:

 
const { width, height } = Dimensions.get('window');

const Home = () => {
  const { themeColors, isDark } = useThemeContext();
  const [currentFeature, setCurrentFeature] = useState(0);
 const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const navigation = useNavigation();

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const techStack = [
    { 
      name: 'React Native', 
      icon: 'phone-portrait-outline', 
      colors: isDark ? ['#3B82F6', '#06B6D4'] : ['#93C5FD', '#67E8F9'] 
    },
    { 
      name: 'Django REST', 
      icon: 'server-outline', 
      colors: isDark ? ['#10B981', '#059669'] : ['#6EE7B7', '#34D399'] 
    },
    { 
      name: 'PostgreSQL', 
      icon: 'albums-outline', 
      colors: isDark ? ['#8B5CF6', '#7C3AED'] : ['#C4B5FD', '#A78BFA'] 
    },
    { 
      name: 'WebSocket', 
      icon: 'wifi-outline', 
      colors: isDark ? ['#F97316', '#EF4444'] : ['#FCD34D', '#F59E0B'] 
    }
  ];

  const features = [
    {
      title: 'Device Management',
      description: 'Complete CRUD operations for IoT devices with real-time status monitoring',
      icon: 'settings-outline',
      colors: isDark ? ['#3B82F6', '#8B5CF6'] : ['#93C5FD', '#C4B5FD']
    },
    {
      title: 'Usage Analytics',
      description: 'Comprehensive analytics with charts, metrics, and usage patterns',
      icon: 'bar-chart-outline',
      colors: isDark ? ['#10B981', '#14B8A6'] : ['#6EE7B7', '#5EEAD4']
    },
    {
      title: 'Real-time Alerts',
      description: 'WebSocket-powered notifications with Expo push notifications',
      icon: 'notifications-outline',
      colors: isDark ? ['#F97316', '#EF4444'] : ['#FCD34D', '#FCA5A5']
    },
    {
      title: 'IoT Integration',
      description: 'Seamless HTTP POST data ingestion from IoT devices',
      icon: 'wifi-outline',
      colors: isDark ? ['#8B5CF6', '#EC4899'] : ['#C4B5FD', '#FBCFE8']
    }
  ];

  const completedFeatures = [
    'Authentication System (JWT/Token)',
    'Admin Dashboard',
    'Device Management (CRUD)',
    'Usage Analytics Dashboard',
    'Real-time WebSocket Integration',
    'Push Notifications (Expo)',
    'IoT Data Ingestion API',
    'PostgreSQL Database',
    'Monthly Usage Graphs',
    'Device Health Monitoring'
  ];

  const TechStackCard = ({ tech, index }) => (
    <Animated.View
      style={[
        styles.techCard,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <LinearGradient
        colors={tech.colors}
        style={styles.techCardGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Ionicons name={tech.icon} size={32} color="white" />
        <Text style={styles.techCardText}>{tech.name}</Text>
      </LinearGradient>
    </Animated.View>
  );

  const FeatureCard = ({ feature, index, isActive }) => (
    <TouchableOpacity 
      onPress={() => setCurrentFeature(index)}
      activeOpacity={0.8}
    >
      <View style={[
        styles.featureCard, 
        { 
          backgroundColor: themeColors.surface,
          borderColor: isActive ? themeColors.primary : themeColors.border
        },
        isActive && styles.featureCardActive
      ]}>
        <LinearGradient
          colors={feature.colors}
          style={styles.featureIcon}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Ionicons name={feature.icon} size={32} color="white" />
        </LinearGradient>
        <Text style={[styles.featureTitle, { color: themeColors.heading }]}>
          {feature.title}
        </Text>
        <Text style={[styles.featureDescription, { color: themeColors.text }]}>
          {feature.description}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const CompletedFeatureItem = ({ feature, index }) => (
    <Animated.View
      style={[
        styles.completedFeatureItem,
        {
          opacity: fadeAnim,
          transform: [{ translateX: slideAnim }],
          backgroundColor: themeColors.surface,
        },
      ]}
    >
      <Ionicons name="checkmark-circle" size={20} color={themeColors.success} />
      <Text style={[styles.completedFeatureText, { color: themeColors.heading }]}>
        {feature}
      </Text>
    </Animated.View>
  );

  return (
    <ScreenWrapper>
      <View style={[styles.container, { backgroundColor: themeColors.background }]}>
        <StatusBar 
          barStyle={isDark ? "light-content" : "dark-content"} 
          backgroundColor={themeColors.background} 
        />
        
        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Hero Section */}
          <Animated.View
            style={[
              styles.heroSection,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            {/* <View style={styles.completeBadge}>
              <LinearGradient
                colors={[
                  isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)', 
                  isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)'
                ]}
                style={styles.completeBadgeGradient}
              >
                <Ionicons name="checkmark-circle" size={20} color={themeColors.success} />
                <Text style={[styles.completeBadgeText, { color: themeColors.heading }]}>
                  Project Complete
                </Text>
              </LinearGradient>
            </View> */}

            <Text style={[styles.heroTitle, { color: themeColors.heading }]}>
              Smart Tissue{'\n'}
              <Text style={{ color: themeColors.primary }}>Dispenser</Text>
            </Text>

            <Text style={[styles.heroDescription, { color: themeColors.text }]}>
              Complete IoT solution with React Native mobile app, Django REST API,
              real-time WebSocket notifications, and comprehensive analytics dashboard.
            </Text>

            <View style={styles.heroButtons}>
              <TouchableOpacity style={styles.primaryButton}>
                <LinearGradient
                  colors={isDark ? ['#06B6D4', '#8B5CF6'] :  ['#06B6D4', '#8B5CF6']}
                  style={styles.primaryButtonGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Ionicons name="play-circle-outline" size={20} color="white" />
                  <Text style={styles.primaryButtonText}>View Live Demo</Text>
                  <Ionicons name="arrow-forward" size={20} color="white" />
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity style={[
                styles.secondaryButton, 
                { borderColor: themeColors.border }
              ]}>
                <LinearGradient
                  colors={[
                    isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)', 
                    isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)'
                  ]}
                  style={styles.secondaryButtonGradient}
                >
                  <Text style={[styles.secondaryButtonText, { color: themeColors.heading }]}>
                    Documentation
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </Animated.View>

          {/* Tech Stack */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: themeColors.heading }]}>
              Technology Stack
            </Text>
            <View style={styles.techStackGrid}>
              {techStack.map((tech, index) => (
                <TechStackCard key={tech.name} tech={tech} index={index} />
              ))}
            </View>
          </View>

          {/* Features */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: themeColors.heading }]}>
              Key Features
            </Text>
            <View style={styles.featuresGrid}>
              {features.map((feature, index) => (
                <FeatureCard
                  key={feature.title}
                  feature={feature}
                  index={index}
                  isActive={currentFeature === index}
                />
              ))}
            </View>
          </View>

          {/* Completed Features */}
          <View style={styles.section}>
            <LinearGradient
              colors={[
                isDark ? 'rgba(16, 185, 129, 0.1)' : 'rgba(16, 185, 129, 0.05)', 
                isDark ? 'rgba(5, 150, 105, 0.1)' : 'rgba(5, 150, 105, 0.05)'
              ]}
              style={[
                styles.completedSection, 
                { borderColor: isDark ? 'rgba(16, 185, 129, 0.2)' : 'rgba(5, 150, 105, 0.1)' }
              ]}
            >
              <View style={styles.completedHeader}>
                <View style={styles.completedBadge}>
                  <LinearGradient
                    colors={[
                      isDark ? 'rgba(16, 185, 129, 0.2)' : 'rgba(16, 185, 129, 0.1)', 
                      isDark ? 'rgba(5, 150, 105, 0.2)' : 'rgba(5, 150, 105, 0.1)'
                    ]}
                    style={styles.completedBadgeGradient}
                  >
                    <Ionicons name="checkmark-circle" size={20} color={themeColors.success} />
                    <Text style={[styles.completedBadgeText, { color: themeColors.success }]}>
                      100% Complete
                    </Text>
                  </LinearGradient>
                </View>
                <Text style={[styles.completedTitle, { color: themeColors.heading }]}>
                  Delivered Features
                </Text>
                <Text style={[styles.completedDescription, { color: themeColors.text }]}>
                  All planned features have been successfully implemented and tested
                </Text>
              </View>

              <View style={styles.completedFeaturesList}>
                {completedFeatures.map((feature, index) => (
                  <CompletedFeatureItem
                    key={feature}
                    feature={feature}
                    index={index}
                  />
                ))}
              </View>
            </LinearGradient>
          </View>

          {/* Stats Section */}
          <View style={styles.section}>
            <View style={styles.statsGrid}>
              <View style={[styles.statCard, { borderColor: themeColors.border }]}>
                <LinearGradient
                  colors={[
                    isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)', 
                    isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)'
                  ]}
                  style={styles.statCardGradient}
                >
                  <LinearGradient
                    colors={isDark ? ['#3B82F6', '#8B5CF6'] : ['#93C5FD', '#C4B5FD']}
                    style={styles.statIcon}
                  >
                    <Ionicons name="cloud-outline" size={24} color="white" />
                  </LinearGradient>
                  <Text style={[styles.statTitle, { color: themeColors.heading }]}>Real-time</Text>
                  <Text style={[styles.statDescription, { color: themeColors.text }]}>WebSocket Integration</Text>
                </LinearGradient>
              </View>

              <View style={[styles.statCard, { borderColor: themeColors.border }]}>
                <LinearGradient
                  colors={[
                    isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)', 
                    isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)'
                  ]}
                  style={styles.statCardGradient}
                >
                  <LinearGradient
                    colors={isDark ? ['#10B981', '#059669'] : ['#6EE7B7', '#34D399']}
                    style={styles.statIcon}
                  >
                    <Ionicons name="analytics-outline" size={24} color="white" />
                  </LinearGradient>
                  <Text style={[styles.statTitle, { color: themeColors.heading }]}>Comprehensive</Text>
                  <Text style={[styles.statDescription, { color: themeColors.text }]}>Usage Analytics</Text>
                </LinearGradient>
              </View>
            </View>
          </View>

{/*          
          <View style={styles.section}>
            <LinearGradient
              colors={isDark ? ['#1E293B', '#0F172A'] : ['#F1F5F9', '#E2E8F0']}
              style={[
                styles.contactSection,
                { borderColor: themeColors.border }
              ]}
            >
              <Text style={[styles.contactTitle, { color: themeColors.heading }]}>
                Have Questions?
              </Text>
              <Text style={[styles.contactDescription, { color: themeColors.text }]}>
                Get in touch with our team for more information about the project
              </Text>
              <TouchableOpacity 
                style={styles.contactButton}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={isDark ? ['#8B5CF6', '#EC4899'] : ['#8B5CF6', '#EC4899']}
                  style={styles.contactButtonGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Ionicons name="mail-outline" size={20} color="white" />
                  <Text style={styles.contactButtonText}>Contact Us</Text>
                </LinearGradient>
              </TouchableOpacity>
            </LinearGradient>
          </View> */}


<View style={styles.section}>
            <LinearGradient
              colors={isDark ? ['#1E293B', '#0F172A'] : ['#F1F5F9', '#E2E8F0']}
              style={[
                styles.contactSection,
                { borderColor: themeColors.border }
              ]}
            >
              <Text style={[styles.contactTitle, { color: themeColors.heading }]}>
                Have Questions?
              </Text>
              <Text style={[styles.contactDescription, { color: themeColors.text }]}>
                Get in touch with our team for more information about the project
              </Text>
              <TouchableOpacity 
                style={styles.contactButton}
                activeOpacity={0.8}
                onPress={() => navigation.navigate('contact')}
              >
                <LinearGradient
                  colors={isDark ? ['#8B5CF6', '#EC4899'] : ['#8B5CF6', '#EC4899']}
                  style={styles.contactButtonGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Ionicons name="mail-outline" size={20} color="white" />
                  <Text style={styles.contactButtonText}>Contact Us</Text>
                </LinearGradient>
              </TouchableOpacity>
            </LinearGradient>
          </View>



{/* 
        
          <View style={[
            styles.footer, 
            { borderTopColor: themeColors.border }
          ]}>
            <View style={styles.footerContent}>
              <View style={styles.footerLeft}>
                <Ionicons name="cube-outline" size={24} color={themeColors.primary} />
                <Text style={[styles.footerTitle, { color: themeColors.heading }]}>
                  Smart Tissue Dispenser
                </Text>
              </View>
              <View style={styles.footerRight}>
                <View style={[
                  styles.statusIndicator,
                  { backgroundColor: themeColors.success }
                ]} />
                <Text style={[styles.footerStatus, { color: themeColors.text }]}>
                  Operational
                </Text>
              </View>
            </View>
          </View> */}
        </ScrollView>
      </View>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  heroSection: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 40,
    paddingBottom: 30,
  },
  completeBadge: {
    marginBottom: 24,
  },
  completeBadgeGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  completeBadgeText: {
    fontWeight: '600',
    marginLeft: 8,
    fontSize: 14,
  },
  heroTitle: {
    fontSize: 36,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 44,
  },
  heroDescription: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
    paddingHorizontal: 10,
  },
  heroButtons: {
    flexDirection: 'column',
    gap: 12,
    width: '100%',
  },
  primaryButton: {
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 2,
  },
  primaryButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    gap: 8,
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
  },
  secondaryButtonGradient: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  section: {
    paddingHorizontal: 16,
    paddingVertical: 24,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 24,
  },
  techStackGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  techCard: {
    width: (width - 44) / 2,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 12,
  },
  techCardGradient: {
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 100,
  },
  techCardText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 8,
    textAlign: 'center',
  },
  featuresGrid: {
    gap: 12,
  },
  featureCard: {
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    marginBottom: 12,
  },
  featureCardActive: {
    borderWidth: 2,
  },
  featureIcon: {
    width: 56,
    height: 56,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  featureTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  featureDescription: {
    fontSize: 14,
    lineHeight: 22,
  },
  completedSection: {
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
  },
  completedHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  completedBadge: {
    marginBottom: 16,
  },
  completedBadgeGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  completedTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  completedDescription: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  completedFeaturesList: {
    gap: 10,
  },
  completedFeatureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    padding: 14,
    gap: 10,
  },
  completedFeatureText: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  statsGrid: {
    gap: 12,
  },
  statCard: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    marginBottom: 12,
  },
  statCardGradient: {
    padding: 20,
    alignItems: 'center',
  },
  statIcon: {
    width: 56,
    height: 56,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  statTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
    textAlign: 'center',
  },
  statDescription: {
    fontSize: 14,
    textAlign: 'center',
  },
  contactSection: {
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    alignItems: 'center',
  },
  contactTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  contactDescription: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  contactButton: {
    borderRadius: 12,
    overflow: 'hidden',
    width: '100%',
    elevation: 2,
  },
  contactButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    gap: 8,
  },
  contactButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    paddingHorizontal: 16,
    paddingVertical: 20,
    borderTopWidth: 1,
  },
  footerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  footerTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  footerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  footerStatus: {
    fontSize: 12,
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});

export default Home;
  