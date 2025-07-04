


import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeContext } from '../../context/ThemeContext';

const ActiveDevicesList = ({ devices }) => {
  const { themeColors, isDarkMode } = useThemeContext();

  const getActivityColor = (index) => {
    if (index === 0) return '#10B981';
    if (index === 1) return '#3B82F6';
    if (index === 2) return '#F59E0B';
    return themeColors.primary;
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: themeColors.heading }]}>
          Most Active This Week
        </Text>
        <View style={[styles.badge, { backgroundColor: themeColors.primary + '15' }]}>
          <Ionicons name="flame" size={14} color={themeColors.primary} />
          <Text style={[styles.badgeText, { color: themeColors.primary }]}>
            Live
          </Text>
        </View>
      </View>

      {/* Simple List */}
      <View style={[
        styles.listContainer,
        { 
          backgroundColor: themeColors.surface || themeColors.inputbg,
          borderColor: isDarkMode ? themeColors.border : 'transparent',
        }
      ]}>
        {devices.slice(0, 5).map((device, index) => (
          <View 
            key={index}
            style={[
              styles.listItem,
              { borderBottomColor: themeColors.border || themeColors.text + '10' },
              index === devices.length - 1 && styles.lastItem
            ]}
          >
            {/* Rank */}
            <Text style={[
              styles.rank,
              { color: getActivityColor(index) }
            ]}>
              {index + 1}
            </Text>

            {/* Device Info */}
            <View style={styles.deviceInfo}>
              <Text style={[styles.deviceName, { color: themeColors.heading }]}>
                {device.device__name || `Device ${device.device__id}`}
              </Text>
              <Text style={[styles.deviceLocation, { color: themeColors.text + '60' }]}>
                Room {device.device__room_number}, Floor {device.device__floor_number}
              </Text>
            </View>

            {/* Activity Bar & Count */}
            <View style={styles.activitySection}>
              <Text style={[styles.entryCount, { color: getActivityColor(index) }]}>
                {device.entry_count}
              </Text>
              <View style={styles.activityBarContainer}>
                <View 
                  style={[
                    styles.activityBar,
                    {
                      backgroundColor: getActivityColor(index),
                      width: `${(device.entry_count / devices[0].entry_count) * 100}%`,
                    }
                  ]}
                />
              </View>
            </View>
          </View>
        ))}
      </View>

      {/* View All Link */}
      {devices.length > 5 && (
        <TouchableOpacity 
          style={styles.viewAllButton}
          onPress={() => {/* Handle view all */}}
        >
          <Text style={[styles.viewAllText, { color: themeColors.primary }]}>
            View all {devices.length} devices
          </Text>
          <Ionicons 
            name="arrow-forward" 
            size={16} 
            color={themeColors.primary} 
          />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  listContainer: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  lastItem: {
    borderBottomWidth: 0,
  },
  rank: {
    fontSize: 20,
    fontWeight: '700',
    width: 30,
  },
  deviceInfo: {
    flex: 1,
    marginLeft: 12,
  },
  deviceName: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 2,
  },
  deviceLocation: {
    fontSize: 12,
  },
  activitySection: {
    alignItems: 'flex-end',
    minWidth: 80,
  },
  entryCount: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  activityBarContainer: {
    height: 4,
    width: 60,
    backgroundColor: '#00000010',
    borderRadius: 2,
    overflow: 'hidden',
  },
  activityBar: {
    height: '100%',
    borderRadius: 2,
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 6,
    marginTop: 12,
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '500',
  },
});

export default ActiveDevicesList;