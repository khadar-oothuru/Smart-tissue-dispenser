// app/_layout.tsx
import React, { JSX, useEffect, useRef } from "react";
import { Stack, useRouter } from "expo-router";
import { View, ActivityIndicator, ViewStyle, StatusBar as RNStatusBar, Platform, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import * as Notifications from 'expo-notifications';

import { AuthProvider, useAuth } from "../context/AuthContext";
import { ThemeProvider, useThemeContext } from "../context/ThemeContext";
import { WebSocketProvider } from "../context/WebSocketContext";


// Define types
interface User {
  role: string;
  // Add other user properties as needed
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
}

interface ThemeColors {
  background: string;
  text: string;
  [key: string]: string;
}

interface ThemeContextType {
  themeColors: ThemeColors;
  isDark: boolean;
}

function Layout(): JSX.Element {
  const { user, loading } = useAuth() as AuthContextType;
  const { themeColors, isDark } = useThemeContext() as ThemeContextType;
  const { background, text } = themeColors;
  const router = useRouter();

  
  const notificationListener = useRef<Notifications.Subscription | null>(null);
  const responseListener = useRef<Notifications.Subscription | null>(null);

  // Update status bar when theme changes
  useEffect(() => {
    // Only update status bar on native platforms
    if (Platform.OS !== 'web') {
      // Force status bar update when theme changes
      // This ensures the status bar color updates immediately when theme is switched
      RNStatusBar.setBarStyle(isDark ? 'light-content' : 'dark-content', true);
      
      // Additional timeout for Android devices that might need a delay
      const timeoutId = setTimeout(() => {
        RNStatusBar.setBarStyle(isDark ? 'light-content' : 'dark-content', true);
      }, 100);

      return () => clearTimeout(timeoutId);
    }
  }, [isDark]);

  useEffect(() => {
    // Register for push notifications when user is logged in (mobile only)
    if (user && Platform.OS !== 'web') {
      import('../services/notificationService')
        .then(({ registerForPushNotificationsAsync, sendTokenToServer }) => {
          registerForPushNotificationsAsync()
            .then((token: string | null | undefined) => {
              if (token) {
                sendTokenToServer(token);
              }
            })
            .catch((error) => {
              console.error('Failed to register for push notifications:', error);
            });
        })
        .catch((error) => {
          console.error('Failed to import notification service:', error);
        });
    }

    // Handle notifications when app is in foreground (mobile only)
    if (Platform.OS !== 'web') {
      notificationListener.current = Notifications.addNotificationReceivedListener((notification: Notifications.Notification) => {
        console.log('📱 Notification received:', notification);
        const { title, body } = notification.request.content;
        console.log(`New notification: ${title} - ${body}`);
      });

      // Handle notification responses (when user taps on notification)
      responseListener.current = Notifications.addNotificationResponseReceivedListener((response: Notifications.NotificationResponse) => {
        console.log('📱 Notification tapped:', response);
        // Ensure user is authenticated before navigating
        if (user && user.role) {
          try {
            // Import and use the enhanced notification response handler
            import('../services/notificationService').then(({ handleNotificationResponse }) => {
              handleNotificationResponse(response, user.role, router as any);
            }).catch((error) => {
              console.error('Failed to handle notification response:', error);
              // Fallback navigation
              const notificationRoute = user.role === 'admin' ? '/notifications' : '/user-notifications';
              router.push(notificationRoute);
            });
          } catch (error) {
            console.error('Navigation error:', error);
          }
        }
      });
    }

    return () => {
      if (notificationListener.current) {
        notificationListener.current.remove();
      }
      if (responseListener.current) {
        responseListener.current.remove();
      }
    };
  }, [user, router]);

  if (loading || (user && !user.role)) {
    const loadingStyle: ViewStyle = {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: background,
    };
    return (
      <View style={loadingStyle}>
        <ActivityIndicator size="large" color={text} />
      </View>
    );
  }

  const containerStyle: ViewStyle = { 
    flex: 1, 
    backgroundColor: background 
  };

  return (
    <>
      <StatusBar 
        key={isDark ? 'dark-theme' : 'light-theme'} 
        style={isDark ? "light" : "dark"} 
      />
      <View style={containerStyle}>
        <SafeAreaView style={{ flex: 1, backgroundColor: background }}>
          <Stack
            screenOptions={{ headerShown: false }}
          >
            <Stack.Screen name="index" />
            <Stack.Screen name="(Admintab)" />
           
            
            <Stack.Screen name="AlertDevicesScreen" />



            <Stack.Screen
              name="device-details"
              options={{
                headerShown: false,
                presentation: 'card'
              }}
            />
            <Stack.Screen
              name="notifications"
              options={{
                headerShown: false,
                presentation: 'card'
              }}
            />
            <Stack.Screen name="(drawer)" />
            <Stack.Screen
              name="user-notifications"
              options={{
                headerShown: false,
                presentation: 'card'
              }}
            />
           
            <Stack.Screen name="(Auth)/Login" />
            <Stack.Screen name="(Auth)/SignUp" />
          </Stack>
        </SafeAreaView>
      </View>
    </>
  );
}

export default function RootLayout(): JSX.Element {
  console.log('🚀 RootLayout is being called');
  
  useEffect(() => {
    console.log('🔧 RootLayout useEffect triggered');
    // Configure notification handler with proper settings for sound (mobile only)
    if (Platform.OS !== 'web') {
      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowBanner: true,  
          shouldShowList: true,    
          shouldPlaySound: true,   // Ensure sound is enabled
          shouldSetBadge: true,
        }),
      });
    }
  }, []);

  // Simplified version for debugging - bypass all providers
  if (Platform.OS === 'web') {
    console.log('🌐 Running on web platform');
    return (
      <View style={{ 
        flex: 1, 
        justifyContent: 'center', 
        alignItems: 'center',
        backgroundColor: '#ffffff',
        padding: 20
      }}>
        <Text style={{ 
          fontSize: 24, 
          color: '#000000', 
          textAlign: 'center',
          marginBottom: 10
        }}>
          🎉 Smart Tissue Dispenser
        </Text>
        <Text style={{ 
          fontSize: 16, 
          color: '#666666', 
          textAlign: 'center' 
        }}>
          Web version is now working!
        </Text>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
        </Stack>
      </View>
    );
  }

  // Regular mobile version with all providers
  try {
    return (
      <ThemeProvider>
        <AuthProvider>
          <WebSocketProvider>
            <Layout />
          </WebSocketProvider>
        </AuthProvider>
      </ThemeProvider>
    );
  } catch (error) {
    console.error('RootLayout error:', error);
    // Fallback UI
    return (
      <View style={{ 
        flex: 1, 
        justifyContent: 'center', 
        alignItems: 'center',
        backgroundColor: '#ffffff',
        padding: 20
      }}>
        <Text style={{ 
          fontSize: 18, 
          color: '#ff0000', 
          textAlign: 'center' 
        }}>
          App Error: {error instanceof Error ? error.message : 'Unknown error'}
        </Text>
      </View>
    );
  }
}
