// components/DeviceHeader.js
import React from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeContext } from '../../context/ThemeContext';

const DeviceHeader = ({
  searchTerm,
  onSearchChange,
  onAddDevice,
  onWifiScan,
  scanning
}) => {
  const { themeColors, isDarkMode } = useThemeContext();
  const styles = createStyles(themeColors, isDarkMode);

  return (
    <View style={styles.header}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons 
          name="search" 
          size={20} 
          color={themeColors.textSecondary || '#666666'} 
          style={styles.searchIcon} 
        />
        <TextInput
          style={styles.searchInput}
          placeholder="Search devices"
          value={searchTerm}
          onChangeText={onSearchChange}
          placeholderTextColor={themeColors.textSecondary || '#999999'}
        />
      </View>

      {/* Add Device Section */}
      <View style={styles.addDeviceSection}>
        <Text style={styles.sectionTitle}>Select method to add devices</Text>
        <View style={styles.addButtonsContainer}>
          <TouchableOpacity
            style={[
              styles.wifiButton,
              scanning && styles.wifiButtonScanning
            ]}
            onPress={onWifiScan}
            disabled={scanning}
            activeOpacity={0.7}
          >
            {scanning ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Ionicons name="wifi" size={24} color="#FFFFFF" />
                <Text style={styles.wifiButtonText}>WiFi</Text>
              </>
            )}
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.addButton}
            onPress={onAddDevice}
            activeOpacity={0.7}
          >
            <Ionicons name="add-circle" size={20} color="#FFFFFF" />
            <Text style={styles.addButtonText}>Add Device Manually</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const createStyles = (themeColors, isDarkMode) => StyleSheet.create({
  header: {
    padding: 16,
    backgroundColor: themeColors.background,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: isDarkMode 
      ? themeColors.card || '#2D3748' 
      : themeColors.inputbg || '#F7FAFC',
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 20,
    height: 48,
    borderWidth: 1,
    borderColor: isDarkMode 
      ? themeColors.border || '#4A5568' 
      : themeColors.border || '#E2E8F0',
    // Enhanced shadow for better visibility
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: isDarkMode ? 0.3 : 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: themeColors.text || '#2D3748',
    fontWeight: '400',
    paddingVertical: 0, // Ensure text is vertically centered
  },
  addDeviceSection: {
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: themeColors.text || '#2D3748',
    marginBottom: 16,
  },
  addButtonsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: -12, // Compensate for gap if not supported
  },
  wifiButton: {
    width: 60,
    height: 60,
    backgroundColor: themeColors.primary || '#667EEA',
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: themeColors.primary || '#667EEA',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
    marginRight: 12,
  },
  wifiButtonScanning: {
    backgroundColor: (themeColors.primary || '#667EEA') + 'CC',
  },
  wifiButtonText: {
    fontSize: 10,
    color: '#FFFFFF',
    marginTop: 2,
    fontWeight: '600',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: themeColors.primary || '#667EEA',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    flex: 1,
    shadowColor: themeColors.primary || '#667EEA',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  addButtonText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default DeviceHeader;