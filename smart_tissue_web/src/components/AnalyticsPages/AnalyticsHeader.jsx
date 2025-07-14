import React, { useState } from "react";
import { HiCalendar, HiX } from "react-icons/hi";
import { useTheme } from "../../hooks/useThemeContext";
import { format, subDays, startOfDay, endOfDay } from "date-fns";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";

const AnalyticsHeader = ({ onDateRangeChange, selectedDateRange }) => {
  const { themeColors, isDark } = useTheme();
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [calendarVisible, setCalendarVisible] = useState(false);
  const [calendarType, setCalendarType] = useState(null);
  const [startDate, setStartDate] = useState(
    selectedDateRange?.startDate || subDays(new Date(), 7)
  );
  const [endDate, setEndDate] = useState(
    selectedDateRange?.endDate || new Date()
  );

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

  const handleCalendarDaySelect = (date) => {
    if (!date) return;
    if (calendarType === "start") {
      setStartDate(date);
      // If start date is after end date, reset end date to start date
      if (date > endDate) {
        setEndDate(date);
      }
      // After picking start, immediately open end calendar for smoother UX
      setCalendarType("end");
    } else if (calendarType === "end") {
      setEndDate(date);
      // If end date is before start date, reset start date to end date
      if (date < startDate) {
        setStartDate(date);
      }
      closeCalendar();
    }
  };

  const handleDateRangeSelect = () => {
    if (startDate > endDate) {
      alert("Invalid Date Range: Start date cannot be after end date");
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

  // Custom calendar styles for theme
  const calendarStyles = `
    .rdp {
      --rdp-cell-size: 40px;
      --rdp-accent-color: ${themeColors.primary} !important;
      --rdp-background-color: ${themeColors.surface};
      margin: 0;
    }
    .rdp-day_selected:not([disabled]) {
      background-color: ${themeColors.primary} !important;
      color: white !important;
      border: 2px solid ${themeColors.primary} !important;
    }
    .rdp-day_selected:hover:not([disabled]) {
      background-color: ${themeColors.primary} !important;
      opacity: 0.9;
      border: 2px solid ${themeColors.primary} !important;
    }
    .rdp-day:hover:not([disabled]):not(.rdp-day_selected) {
      background-color: ${
        isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)"
      };
    }
    .rdp-caption {
      color: ${themeColors.heading};
    }
    .rdp-head_cell {
      color: ${themeColors.text};
      font-weight: 600;
    }
    .rdp-day {
      color: ${themeColors.text};
    }
    .rdp-day_disabled {
      color: ${isDark ? "#4B5563" : "#D1D5DB"};
    }
    .rdp-button, .rdp-nav_button {
      color: ${themeColors.primary} !important;
      fill: ${themeColors.primary} !important;
      stroke: ${themeColors.primary} !important;
    }
    .rdp-button:hover:not([disabled]), .rdp-nav_button:hover:not([disabled]) {
      background-color: ${
        isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)"
      };
      color: ${themeColors.primary} !important;
      fill: ${themeColors.primary} !important;
      stroke: ${themeColors.primary} !important;
    }
    .rdp-nav_button:focus {
      outline: 2px solid ${themeColors.primary} !important;
    }
    .rdp-day_today:not(.rdp-day_selected) {
      border: 1.5px dashed ${themeColors.primary} !important;
      color: ${themeColors.primary} !important;
    }
  `;

  const DatePickerModal = () => (
    <>
      {showDatePicker && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div
            className="w-full max-w-md rounded-3xl p-6 shadow-2xl"
            style={{ backgroundColor: themeColors.surface }}
          >
            <div className="flex justify-between items-center mb-5">
              <h2
                className="text-xl font-bold"
                style={{ color: themeColors.heading }}
              >
                Select Date Range
              </h2>
              <button
                onClick={() => setShowDatePicker(false)}
                className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <HiX size={24} color={themeColors.text} />
              </button>
            </div>

            <div className="space-y-4 mb-4">
              <div>
                <label
                  className="text-sm font-semibold mb-2 block"
                  style={{ color: themeColors.text }}
                >
                  From Date
                </label>
                <button
                  className="w-full flex justify-between items-center px-4 py-3 rounded-xl border transition-all hover:shadow-sm"
                  style={{
                    backgroundColor: themeColors.inputbg,
                    borderColor: themeColors.border,
                  }}
                  onClick={() => openCalendar("start")}
                >
                  <span
                    className="text-base font-medium"
                    style={{ color: themeColors.text }}
                  >
                    {format(startDate, "MMM dd, yyyy")}
                  </span>
                  <HiCalendar size={20} color={themeColors.primary} />
                </button>
              </div>

              <div>
                <label
                  className="text-sm font-semibold mb-2 block"
                  style={{ color: themeColors.text }}
                >
                  To Date
                </label>
                <button
                  className="w-full flex justify-between items-center px-4 py-3 rounded-xl border transition-all hover:shadow-sm"
                  style={{
                    backgroundColor: themeColors.inputbg,
                    borderColor: themeColors.border,
                  }}
                  onClick={() => openCalendar("end")}
                >
                  <span
                    className="text-base font-medium"
                    style={{ color: themeColors.text }}
                  >
                    {format(endDate, "MMM dd, yyyy")}
                  </span>
                  <HiCalendar size={20} color={themeColors.primary} />
                </button>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                className="flex-1 py-3 rounded-xl border font-semibold transition-all hover:bg-gray-50 dark:hover:bg-gray-700"
                style={{
                  borderColor: themeColors.border,
                  color: themeColors.text,
                }}
                onClick={resetToDefault}
              >
                Reset
              </button>
              <button
                className="flex-1 py-3 rounded-xl font-semibold text-white shadow-md hover:shadow-lg transition-all"
                style={{ backgroundColor: themeColors.primary }}
                onClick={handleDateRangeSelect}
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );

  const CalendarModal = () => (
    <>
      {calendarVisible && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <style>{calendarStyles}</style>
          <div
            className="rounded-3xl shadow-2xl"
            style={{ backgroundColor: themeColors.surface }}
          >
            <div
              className="p-4 flex justify-between items-center border-b"
              style={{ borderColor: themeColors.border }}
            >
              <h3
                className="text-lg font-bold"
                style={{ color: themeColors.heading }}
              >
                {calendarType === "start"
                  ? "Select Start Date"
                  : "Select End Date"}
              </h3>
              <button
                onClick={closeCalendar}
                className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <HiX size={24} color={themeColors.text} />
              </button>
            </div>
            <div className="p-4">
              <DayPicker
                mode="single"
                selected={calendarType === "start" ? startDate : endDate}
                onSelect={handleCalendarDaySelect}
                defaultMonth={calendarType === "start" ? startDate : endDate}
                className="rounded-xl"
                showOutsideDays={false}
                fixedWeeks
                toDate={new Date()}
                fromDate={calendarType === "end" ? startDate : undefined}
                disabled={
                  calendarType === "start"
                    ? (day) => day > new Date()
                    : (day) => day < startDate || day > new Date()
                }
              />
            </div>
          </div>
        </div>
      )}
    </>
  );

  return (
    <>
      <div
        className="flex justify-between items-center px-6 pt-8 pb-6"
        style={{ backgroundColor: themeColors.background }}
      >
        <h1
          className="text-4xl font-bold"
          style={{ color: themeColors.heading }}
        >
          Analytics
        </h1>
        <button
          className="w-11 h-11 rounded-full flex items-center justify-center shadow-md hover:shadow-lg transition-all"
          style={{ backgroundColor: themeColors.surface || "#fff" }}
          onClick={() => setShowDatePicker(true)}
        >
          <HiCalendar size={24} color={themeColors.primary} />
        </button>
      </div>
      <DatePickerModal />
      <CalendarModal />
    </>
  );
};

export default AnalyticsHeader;
