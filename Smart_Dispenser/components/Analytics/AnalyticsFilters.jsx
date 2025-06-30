
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeContext } from '../../context/ThemeContext';

const AnalyticsFilters = ({
  selectedPeriod,
  selectedDevice,
  devices,
  onPeriodChange,
  onDeviceChange,
}) => {
  const { themeColors } = useThemeContext();
  const [showPeriodPicker, setShowPeriodPicker] = useState(false);
  const [showDevicePicker, setShowDevicePicker] = useState(false);

  const periods = [
    { label: 'Weekly', value: 'weekly' },
    { label: 'Monthly', value: 'monthly' },
    { label: 'Quarterly', value: 'quarterly' },
    { label: 'Yearly', value: 'yearly' },
  ];

  const deviceOptions = [
    { label: 'All Devices', value: 'all' },
    ...devices.map(device => ({
      label: device.name || `Device ${device.id}`,
      value: device.id.toString(),
    })),
  ];

  const renderDropdown = (label, value, onPress, showIcon = true) => (
    <TouchableOpacity
      style={[
        styles.dropdownButton,
        {
          backgroundColor: themeColors.inputbg,
          borderColor: themeColors.border || themeColors.text + '20',
        }
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.dropdownContent}>
        <Text style={[styles.dropdownLabel, { color: themeColors.text + '80' }]}>
          {label}
        </Text>
        <Text style={[styles.dropdownValue, { color: themeColors.text }]}>
          {value}
        </Text>
      </View>
      {showIcon && (
        <Ionicons 
          name="chevron-down" 
          size={20} 
          color={themeColors.text + '60'} 
        />
      )}
    </TouchableOpacity>
  );

  const renderModal = (visible, onClose, data, selectedValue, onSelect, title) => (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity 
        style={styles.modalOverlay} 
        activeOpacity={1} 
        onPress={onClose}
      >
        <View style={[
          styles.modalContent,
          {
            backgroundColor: themeColors.background,
            borderColor: themeColors.border || themeColors.text + '20',
          }
        ]}>
          <View style={[
            styles.modalHeader,
            { borderBottomColor: themeColors.border || themeColors.text + '10' }
          ]}>
            <Text style={[styles.modalTitle, { color: themeColors.heading }]}>
              {title}
            </Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={themeColors.text} />
            </TouchableOpacity>
          </View>
          
          <FlatList
            data={data}
            keyExtractor={(item) => item.value}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.modalOption,
                  {
                    backgroundColor: selectedValue === item.value 
                      ? themeColors.primary + '10' 
                      : 'transparent',
                    borderBottomColor: themeColors.border || themeColors.text + '10',
                  }
                ]}
                onPress={() => {
                  onSelect(item.value);
                  onClose();
                }}
              >
                <Text style={[
                  styles.modalOptionText,
                  {
                    color: selectedValue === item.value 
                      ? themeColors.primary 
                      : themeColors.text,
                    fontWeight: selectedValue === item.value ? '600' : '400',
                  }
                ]}>
                  {item.label}
                </Text>
                {selectedValue === item.value && (
                  <Ionicons 
                    name="checkmark" 
                    size={20} 
                    color={themeColors.primary} 
                  />
                )}
              </TouchableOpacity>
            )}
          />
        </View>
      </TouchableOpacity>
    </Modal>
  );

  const getSelectedPeriodLabel = () => {
    const period = periods.find(p => p.value === selectedPeriod);
    return period ? period.label : 'Select Period';
  };

  const getSelectedDeviceLabel = () => {
    const device = deviceOptions.find(d => d.value === selectedDevice);
    return device ? device.label : 'Select Device';
  };

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <View style={styles.filterItem}>
          {renderDropdown(
            'Period',
            getSelectedPeriodLabel(),
            () => setShowPeriodPicker(true)
          )}
        </View>
        
        <View style={styles.filterItem}>
          {renderDropdown(
            'Device',
            getSelectedDeviceLabel(),
            () => setShowDevicePicker(true)
          )}
        </View>
      </View>

      {renderModal(
        showPeriodPicker,
        () => setShowPeriodPicker(false),
        periods,
        selectedPeriod,
        onPeriodChange,
        'Select Period'
      )}

      {renderModal(
        showDevicePicker,
        () => setShowDevicePicker(false),
        deviceOptions,
        selectedDevice,
        onDeviceChange,
        'Select Device'
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  filterItem: {
    flex: 1,
  },
  dropdownButton: {
    height: 60,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dropdownContent: {
    flex: 1,
    justifyContent: 'center',
  },
  dropdownLabel: {
    fontSize: 12,
    marginBottom: 2,
  },
  dropdownValue: {
    fontSize: 16,
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxHeight: '70%',
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  modalOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  modalOptionText: {
    fontSize: 16,
  },
});

export default AnalyticsFilters;