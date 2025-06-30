
import React, { useEffect } from 'react';
import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import useNotificationStore from '../store/useNotificationStore';

export default function NotificationIcon({ color = '#333' }) {
  const router = useRouter();
  const { accessToken } = useAuth();
  const { unreadCount, fetchUnreadCount } = useNotificationStore();

  useEffect(() => {
    if (accessToken) {
      fetchUnreadCount(accessToken);
      // Refresh count every 30 seconds
      const interval = setInterval(() => {
        fetchUnreadCount(accessToken);
      }, 30000);
      return () => clearInterval(interval);
    }
  }, [accessToken, fetchUnreadCount]);

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={() => router.push('/notifications')}
    >
      <Ionicons name="notifications-outline" size={24} color={color} />
      {unreadCount > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>
            {unreadCount > 99 ? '99+' : unreadCount}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 8,
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#FF3838',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: 'bold',
  },
});