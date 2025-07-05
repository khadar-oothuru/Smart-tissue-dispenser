// components/Analytics/AnalyticsHeader.js
import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Modal,
  Alert,
} from "react-native";
import { MaterialCommunityIcons, Ionicons } from "@expo/vector-icons";
import { useThemeContext } from "../../context/ThemeContext";
import { format, subDays, startOfDay, endOfDay } from "date-fns";
import { Calendar } from "react-native-calendars";

const AnalyticsHeader = ({ onDateRangeChange, selectedDateRange }) => {
  const { themeColors, isDark } = useThemeContext();
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [calendarVisible, setCalendarVisible] = useState(false);
  const [calendarType, setCalendarType] = useState(null);
  const [startDate, setStartDate] = useState(
    selectedDateRange?.startDate || subDays(new Date(), 7)
  );
  const [endDate, setEndDate] = useState(
    selectedDateRange?.endDate || new Date()
  );
  const [calendarDate, setCalendarDate] = useState(new Date());

  const openCalendar = (type) => {
    if (!calendarVisible) {
      setCalendarType(type);
      setCalendarVisible(true);
    }
  };

  const closeCalendar = () => {
    setCalendarVisible(false);
    setCalendarType(null);
  };

  const handleCalendarDayPress = (day) => {
    const selected = new Date(day.dateString);
    if (calendarType === "start") {
      setStartDate(selected);
    } else if (calendarType === "end") {
      setEndDate(selected);
    }
    closeCalendar();
  };

  const handleDateRangeSelect = () => {
    if (startDate > endDate) {
      Alert.alert("Invalid Date Range", "Start date cannot be after end date");
      return;
    }

    const dateRange = {
      startDate: startOfDay(startDate),
      endDate: endOfDay(endDate),
      label: `${format(startDate, "MMM dd")} - ${format(
        endDate,
        "MMM dd, yyyy"
      )}`,
    };

    onDateRangeChange(dateRange);
    setShowDatePicker(false);
  };

  const resetToDefault = () => {
    const defaultStart = subDays(new Date(), 7);
    const defaultEnd = new Date();
    setStartDate(defaultStart);
    setEndDate(defaultEnd);

    const dateRange = {
      startDate: startOfDay(defaultStart),
      endDate: endOfDay(defaultEnd),
      label: "Last 7 Days",
    };

    onDateRangeChange(dateRange);
  };

  const DatePickerModal = () => (
    <Modal
      visible={showDatePicker}
      transparent={true}
      animationType="fade"
      onRequestClose={() => setShowDatePicker(false)}
    >
      <View style={styles.modalOverlay}>
        <View
          style={[
            styles.modalContent,
            { backgroundColor: themeColors.surface },
          ]}
        >
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: themeColors.heading }]}>
              Select Date Range
            </Text>
            <TouchableOpacity
              onPress={() => setShowDatePicker(false)}
              style={styles.closeButton}
            >
              <Ionicons name="close" size={24} color={themeColors.text} />
            </TouchableOpacity>
          </View>

          <View style={styles.dateInputsContainer}>
            <View style={styles.dateInputGroup}>
              <Text style={[styles.dateLabel, { color: themeColors.text }]}>
                From Date
              </Text>
              <TouchableOpacity
                style={[
                  styles.dateInput,
                  {
                    backgroundColor: themeColors.inputbg,
                    borderColor: themeColors.border,
                  },
                ]}
                onPress={() => openCalendar("start")}
              >
                <Text style={[styles.dateText, { color: themeColors.text }]}>
                  {format(startDate, "MMM dd, yyyy")}
                </Text>
                <Ionicons
                  name="calendar"
                  size={20}
                  color={themeColors.primary}
                />
              </TouchableOpacity>
            </View>

            <View style={styles.dateInputGroup}>
              <Text style={[styles.dateLabel, { color: themeColors.text }]}>
                To Date
              </Text>
              <TouchableOpacity
                style={[
                  styles.dateInput,
                  {
                    backgroundColor: themeColors.inputbg,
                    borderColor: themeColors.border,
                  },
                ]}
                onPress={() => openCalendar("end")}
              >
                <Text style={[styles.dateText, { color: themeColors.text }]}>
                  {format(endDate, "MMM dd, yyyy")}
                </Text>
                <Ionicons
                  name="calendar"
                  size={20}
                  color={themeColors.primary}
                />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.modalActions}>
            <TouchableOpacity
              style={[
                styles.actionButton,
                styles.resetButton,
                { borderColor: themeColors.border },
              ]}
              onPress={resetToDefault}
            >
              <Text
                style={[styles.resetButtonText, { color: themeColors.text }]}
              >
                Reset
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.actionButton,
                styles.applyButton,
                { backgroundColor: themeColors.primary },
              ]}
              onPress={handleDateRangeSelect}
            >
              <Text style={styles.applyButtonText}>Apply</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  return (
    <View style={[styles.header, { backgroundColor: themeColors.background }]}>
      <Text style={[styles.headerTitle, { color: themeColors.heading }]}>
        Analytics
      </Text>
      <TouchableOpacity
        style={[
          styles.headerButton,
          { backgroundColor: themeColors.surface || "#fff" },
        ]}
        onPress={() => setShowDatePicker(true)}
      >
        <MaterialCommunityIcons
          name="calendar"
          size={24}
          color={themeColors.primary}
        />
      </TouchableOpacity>
      <DatePickerModal />
      <Modal
        visible={calendarVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={closeCalendar}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.calendarModalContent,
              { backgroundColor: themeColors.surface },
            ]}
          >
            <View
              style={{
                padding: 16,
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Text style={[styles.modalTitle, { color: themeColors.heading }]}>
                {calendarType === "start"
                  ? "Select Start Date"
                  : "Select End Date"}
              </Text>
              <TouchableOpacity
                onPress={closeCalendar}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color={themeColors.text} />
              </TouchableOpacity>
            </View>
            <Calendar
              current={format(
                calendarType === "start" ? startDate : endDate,
                "yyyy-MM-dd"
              )}
              onDayPress={handleCalendarDayPress}
              markedDates={{
                [format(
                  calendarType === "start" ? startDate : endDate,
                  "yyyy-MM-dd"
                )]: {
                  selected: true,
                  selectedColor: themeColors.primary,
                },
              }}
              style={{ borderRadius: 12, width: 320, alignSelf: "center" }}
              theme={{
                backgroundColor: themeColors.surface,
                calendarBackground: themeColors.surface,
                textSectionTitleColor: themeColors.text,
                selectedDayBackgroundColor: themeColors.primary,
                selectedDayTextColor: "#fff",
                todayTextColor: themeColors.primary,
                dayTextColor: themeColors.text,
                textDisabledColor: "#d9e1e8",
                arrowColor: themeColors.primary,
                monthTextColor: themeColors.heading,
                indicatorColor: themeColors.primary,
              }}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: Platform.OS === "ios" ? 50 : 20,
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 34,
    fontWeight: "700",
  },
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "90%",
    maxWidth: 400,
    borderRadius: 20,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
  },
  closeButton: {
    padding: 4,
  },
  dateInputsContainer: {
    marginBottom: 16,
  },
  dateInputGroup: {
    marginBottom: 12,
  },
  dateLabel: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
  },
  dateInput: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  dateText: {
    fontSize: 16,
    fontWeight: "500",
  },
  modalActions: {
    flexDirection: "row",
    gap: 12,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  resetButton: {
    borderWidth: 1,
  },
  applyButton: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  resetButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  applyButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
  calendarModalContent: {
    width: 340,
    borderRadius: 20,
    paddingBottom: 24,
    alignSelf: "center",
    marginTop: 100,
    overflow: "visible",
  },
});

export default AnalyticsHeader;
