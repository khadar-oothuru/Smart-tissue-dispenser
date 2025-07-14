import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, Check, X } from "lucide-react";
import { useTheme } from "../../hooks/useThemeContext"

const AnalyticsFilters = ({
  selectedPeriod,
  selectedDevice,
  devices,
  onPeriodChange,
  onDeviceChange,
}) => {
  const { themeColors, isDark } = useTheme();
  const [showPeriodPicker, setShowPeriodPicker] = useState(false);
  const [showDevicePicker, setShowDevicePicker] = useState(false);
  const periodRef = useRef(null);
  const deviceRef = useRef(null);

  const periods = [
    { label: "Daily", value: "daily" },
    { label: "Weekly", value: "weekly" },
    { label: "Monthly", value: "monthly" },
    { label: "Quarterly", value: "quarterly" },
    { label: "Yearly", value: "yearly" },
  ];

  const deviceOptions = [
    { label: "All Devices", value: "all" },
    ...devices.map((device) => ({
      label: device.name || `Device ${device.id}`,
      value: device.id.toString(),
    })),
  ];

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (periodRef.current && !periodRef.current.contains(event.target)) {
        setShowPeriodPicker(false);
      }
      if (deviceRef.current && !deviceRef.current.contains(event.target)) {
        setShowDevicePicker(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handlePeriodSelect = (value) => {
    onPeriodChange(value);
    setShowPeriodPicker(false);
  };

  const handleDeviceSelect = (value) => {
    onDeviceChange(value);
    setShowDevicePicker(false);
  };

  const getSelectedPeriodLabel = () => {
    const period = periods.find((p) => p.value === selectedPeriod);
    return period ? period.label : "Select Period";
  };

  const getSelectedDeviceLabel = () => {
    const device = deviceOptions.find((d) => d.value === selectedDevice);
    return device ? device.label : "Select Device";
  };

  const renderDropdown = (label, value, isOpen, setIsOpen, options, onSelect, ref) => (
    <div ref={ref} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full h-16 px-4 rounded-2xl border transition-all duration-200 flex items-center justify-between group hover:shadow-md"
        style={{
          backgroundColor: isDark ? themeColors.surface : themeColors.background,
          borderColor: isDark ? themeColors.border : "rgba(255, 255, 255, 0.2)",
        }}
      >
        <div
          className="absolute inset-0 rounded-2xl opacity-50"
          style={{
            background: isDark
              ? `linear-gradient(135deg, ${themeColors.surface}, ${themeColors.background})`
              : "linear-gradient(135deg, rgba(255, 255, 255, 0.9), rgba(255, 255, 255, 0.6))",
          }}
        />
        <div className="relative flex-1 text-left">
          <p
            className="text-xs font-semibold opacity-80 mb-1"
            style={{ color: themeColors.text }}
          >
            {label}
          </p>
          <p
            className="text-base font-bold tracking-tight"
            style={{ color: themeColors.heading }}
          >
            {value}
          </p>
        </div>
        <ChevronDown
          size={20}
          className={`transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
          style={{ color: themeColors.primary }}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          className="absolute z-50 w-full mt-2 rounded-xl border shadow-lg overflow-hidden"
          style={{
            backgroundColor: themeColors.background,
            borderColor: themeColors.border || `${themeColors.text}20`,
          }}
        >
          <div className="max-h-64 overflow-y-auto">
            {options.map((option) => (
              <button
                key={option.value}
                onClick={() => onSelect(option.value)}
                className="w-full px-4 py-3 flex items-center justify-between hover:bg-opacity-10 transition-colors duration-150 border-b last:border-b-0"
                style={{
                  backgroundColor:
                    selectedPeriod === option.value || selectedDevice === option.value
                      ? `${themeColors.primary}10`
                      : "transparent",
                  borderColor: themeColors.border || `${themeColors.text}10`,
                }}
              >
                <span
                  className={`text-base ${
                    selectedPeriod === option.value || selectedDevice === option.value
                      ? "font-semibold"
                      : "font-normal"
                  }`}
                  style={{
                    color:
                      selectedPeriod === option.value || selectedDevice === option.value
                        ? themeColors.primary
                        : themeColors.text,
                  }}
                >
                  {option.label}
                </span>
                {(selectedPeriod === option.value || selectedDevice === option.value) && (
                  <Check size={20} style={{ color: themeColors.primary }} />
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  // Modal component for mobile/tablet view
  const renderModal = (visible, onClose, data, selectedValue, onSelect, title) => {
    if (!visible) return null;

    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-5 md:hidden">
        <div
          className="absolute inset-0 bg-black bg-opacity-50"
          onClick={onClose}
        />
        <div
          className="relative w-full max-w-md max-h-[70vh] rounded-xl border shadow-xl overflow-hidden"
          style={{
            backgroundColor: themeColors.background,
            borderColor: themeColors.border || `${themeColors.text}20`,
          }}
        >
          <div
            className="flex items-center justify-between p-4 border-b"
            style={{
              borderColor: themeColors.border || `${themeColors.text}10`,
            }}
          >
            <h3
              className="text-lg font-semibold"
              style={{ color: themeColors.heading }}
            >
              {title}
            </h3>
            <button
              onClick={onClose}
              className="p-1 rounded-lg hover:bg-opacity-10 transition-colors"
              style={{ color: themeColors.text }}
            >
              <X size={24} />
            </button>
          </div>

          <div className="overflow-y-auto max-h-[calc(70vh-80px)]">
            {data.map((item) => (
              <button
                key={item.value}
                onClick={() => {
                  onSelect(item.value);
                  onClose();
                }}
                className="w-full px-4 py-4 flex items-center justify-between hover:bg-opacity-10 transition-colors duration-150 border-b last:border-b-0"
                style={{
                  backgroundColor:
                    selectedValue === item.value
                      ? `${themeColors.primary}10`
                      : "transparent",
                  borderColor: themeColors.border || `${themeColors.text}10`,
                }}
              >
                <span
                  className={`text-base ${
                    selectedValue === item.value ? "font-semibold" : "font-normal"
                  }`}
                  style={{
                    color:
                      selectedValue === item.value
                        ? themeColors.primary
                        : themeColors.text,
                  }}
                >
                  {item.label}
                </span>
                {selectedValue === item.value && (
                  <Check size={20} style={{ color: themeColors.primary }} />
                )}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="px-4 mb-4">
      <div className="flex gap-3">
        {/* Desktop view - inline dropdowns */}
        <div className="flex-1 hidden md:block">
          {renderDropdown(
            "Period",
            getSelectedPeriodLabel(),
            showPeriodPicker,
            setShowPeriodPicker,
            periods,
            handlePeriodSelect,
            periodRef
          )}
        </div>

        <div className="flex-1 hidden md:block">
          {renderDropdown(
            "Device",
            getSelectedDeviceLabel(),
            showDevicePicker,
            setShowDevicePicker,
            deviceOptions,
            handleDeviceSelect,
            deviceRef
          )}
        </div>

        {/* Mobile view - buttons that open modals */}
        <div className="flex-1 md:hidden">
          <button
            onClick={() => setShowPeriodPicker(true)}
            className="w-full h-16 px-4 rounded-2xl border transition-all duration-200 flex items-center justify-between"
            style={{
              backgroundColor: isDark ? themeColors.surface : themeColors.background,
              borderColor: isDark ? themeColors.border : "rgba(255, 255, 255, 0.2)",
            }}
          >
            <div className="flex-1 text-left">
              <p
                className="text-xs font-semibold opacity-80 mb-1"
                style={{ color: themeColors.text }}
              >
                Period
              </p>
              <p
                className="text-base font-bold tracking-tight"
                style={{ color: themeColors.heading }}
              >
                {getSelectedPeriodLabel()}
              </p>
            </div>
            <ChevronDown size={20} style={{ color: themeColors.primary }} />
          </button>
        </div>

        <div className="flex-1 md:hidden">
          <button
            onClick={() => setShowDevicePicker(true)}
            className="w-full h-16 px-4 rounded-2xl border transition-all duration-200 flex items-center justify-between"
            style={{
              backgroundColor: isDark ? themeColors.surface : themeColors.background,
              borderColor: isDark ? themeColors.border : "rgba(255, 255, 255, 0.2)",
            }}
          >
            <div className="flex-1 text-left">
              <p
                className="text-xs font-semibold opacity-80 mb-1"
                style={{ color: themeColors.text }}
              >
                Device
              </p>
              <p
                className="text-base font-bold tracking-tight"
                style={{ color: themeColors.heading }}
              >
                {getSelectedDeviceLabel()}
              </p>
            </div>
            <ChevronDown size={20} style={{ color: themeColors.primary }} />
          </button>
        </div>
      </div>

      {/* Mobile Modals */}
      {renderModal(
        showPeriodPicker,
        () => setShowPeriodPicker(false),
        periods,
        selectedPeriod,
        handlePeriodSelect,
        "Select Period"
      )}

      {renderModal(
        showDevicePicker,
        () => setShowDevicePicker(false),
        deviceOptions,
        selectedDevice,
        handleDeviceSelect,
        "Select Device"
      )}
    </div>
  );
};

export default AnalyticsFilters;