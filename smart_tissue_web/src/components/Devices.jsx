import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "../hooks/useAuth";
import useDeviceStore from "../store/useDeviceStore";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  RefreshCw,
  Smartphone,
  Wifi,
  // Loader,
  QrCode as QrCodeIcon,
  Wifi as WifiIcon,
  Calendar,
  Home,
  Building2,
  X,
  // ...existing code...
  // Remove Male, Female from here
} from "lucide-react";

import { CustomAlert } from "./common/CustomAlert";
import Spinner from "./common/Spinner";
import { useTheme } from "../context/ThemeContext";

// WiFi Options Modal - matches mobile app's WiFi options
const WiFiOptionsModal = ({
  visible,
  onClose,
  onWifiNetworkScan,
  onWifiQRScan,
}) => {
  const { themeColors } = useTheme();

  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 backdrop-blur-md flex items-center justify-center z-50 transition-all duration-500"
      style={{
        background: `linear-gradient(135deg, ${themeColors.background} 0%, ${themeColors.surface} 100%)`,
      }}
    >
      <div
        className="rounded-3xl shadow-2xl max-w-md w-full mx-4 transition-all duration-500 transform scale-100"
        style={{
          background: `linear-gradient(135deg, ${themeColors.surface} 0%, ${themeColors.card} 100%)`,
          border: `2px solid ${themeColors.border}`,
          boxShadow: `0 20px 40px ${themeColors.border}30`,
          backdropFilter: "blur(20px)",
        }}
      >
        <div className="p-8">
          <div className="flex items-center justify-between mb-6">
            <h3
              className="text-2xl font-bold"
              style={{ color: themeColors.heading }}
            >
              Add WiFi Device
            </h3>
            <button
              onClick={onClose}
              className="rounded-full p-2 transition-all duration-300 hover:scale-110"
              style={{
                color: themeColors.muted,
                backgroundColor: `${themeColors.border}20`,
              }}
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="space-y-4">
            <button
              onClick={onWifiNetworkScan}
              className="w-full flex items-center p-6 border rounded-2xl transition-all duration-300 hover:scale-105 shadow-lg"
              style={{
                color: themeColors.text,
                backgroundColor: themeColors.surface,
                border: `2px solid ${themeColors.border}`,
                boxShadow: `0 4px 15px ${themeColors.border}20`,
              }}
            >
              <WifiIcon
                className="h-7 w-7 mr-4"
                style={{ color: themeColors.primary }}
              />
              <div className="text-left">
                <div
                  className="font-semibold text-lg mb-1"
                  style={{ color: themeColors.heading }}
                >
                  Scan WiFi Networks
                </div>
                <div className="text-sm" style={{ color: themeColors.muted }}>
                  Discover devices on your network
                </div>
              </div>
            </button>

            <button
              onClick={onWifiQRScan}
              className="w-full flex items-center p-6 border rounded-2xl transition-all duration-300 hover:scale-105 shadow-lg"
              style={{
                color: themeColors.text,
                backgroundColor: themeColors.surface,
                border: `2px solid ${themeColors.border}`,
                boxShadow: `0 4px 15px ${themeColors.border}20`,
              }}
            >
              <QrCodeIcon
                className="h-7 w-7 mr-4"
                style={{ color: themeColors.success }}
              />
              <div className="text-left">
                <div
                  className="font-semibold text-lg mb-1"
                  style={{ color: themeColors.heading }}
                >
                  Scan QR Code
                </div>
                <div className="text-sm" style={{ color: themeColors.muted }}>
                  Scan device or WiFi QR code
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Add Device Modal - matches mobile app's AddDeviceModal exactly
const AddDeviceModal = ({
  visible,
  onClose,
  onSubmit,
  editingDevice,
  loading,
}) => {
  const { themeColors } = useTheme();
  const [formData, setFormData] = useState({
    name: "",
    room_number: "",
    floor_number: "",
    tissue_type: "hand_towel",
    gender: "male",
    meter_capacity: 500,
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (editingDevice) {
      setFormData({
        name: editingDevice.name || "",
        room_number: editingDevice.room_number || "",
        floor_number: editingDevice.floor_number?.toString() || "",
        tissue_type: editingDevice.tissue_type || "hand_towel",
        gender: editingDevice.gender || "male",
        meter_capacity: editingDevice.meter_capacity || 500,
      });
    } else {
      setFormData({
        name: "",
        room_number: "",
        floor_number: "",
        tissue_type: "hand_towel",
        gender: "male",
        meter_capacity: 500,
      });
    }
    setErrors({});
  }, [editingDevice, visible]);

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = "Device name is required";
    if (!formData.room_number.trim())
      newErrors.room_number = "Room number is required";
    const floorNumberStr = formData.floor_number?.toString() || "";
    if (!floorNumberStr.trim())
      newErrors.floor_number = "Floor number is required";
    else if (isNaN(parseInt(floorNumberStr, 10)))
      newErrors.floor_number = "Floor number must be a valid number";
    const meterCapacityNum = parseInt(formData.meter_capacity, 10);
    if (!formData.meter_capacity.toString().trim())
      newErrors.meter_capacity = "Meter capacity is required";
    else if (isNaN(meterCapacityNum))
      newErrors.meter_capacity = "Meter capacity must be a valid number";
    else if (meterCapacityNum <= 0)
      newErrors.meter_capacity = "Meter capacity must be greater than 0";
    else if (meterCapacityNum > 99999)
      newErrors.meter_capacity = "Meter capacity cannot exceed 99999";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (field, value) => {
    let processedValue = value;
    if (field === "meter_capacity" || field === "floor_number") {
      // For numeric fields, remove non-numeric characters and convert to integer if not empty
      processedValue = value.replace(/[^0-9]/g, "");
      processedValue =
        processedValue === "" ? "" : parseInt(processedValue, 10);
    }
    if (field === "tissue_type") {
      setFormData((prev) => ({
        ...prev,
        [field]: processedValue,
        gender: processedValue === "toilet_paper" ? "male" : prev.gender,
      }));
    } else {
      setFormData((prev) => ({ ...prev, [field]: processedValue }));
    }
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    const deviceData = {
      name: formData.name.trim(),
      room_number: formData.room_number.trim(),
      floor_number: parseInt(formData.floor_number, 10),
      tissue_type: formData.tissue_type,
      gender: formData.tissue_type === "toilet_paper" ? formData.gender : null,
      meter_capacity: parseInt(formData.meter_capacity, 10),
    };
    onSubmit(deviceData, editingDevice?.id);
  };

  if (!visible) return null;
  return (
    <div
      className="fixed inset-0 backdrop-blur-md flex items-center justify-center z-50 transition-all duration-500"
      style={{
        background: `linear-gradient(135deg, ${themeColors.background} 0%, ${themeColors.surface} 100%)`,
      }}
    >
      <div
        className="rounded-3xl shadow-2xl w-full max-w-lg mx-4 transition-all duration-500 transform scale-100"
        style={{
          background: `linear-gradient(135deg, ${themeColors.surface} 0%, ${themeColors.card} 100%)`,
          border: `2px solid ${themeColors.border}`,
          boxShadow: `0 20px 40px ${themeColors.border}30`,
          backdropFilter: "blur(20px)",
        }}
      >
        <div className="p-8">
          <div className="flex items-center mb-8">
            <Smartphone
              className="h-8 w-8 mr-3"
              style={{ color: themeColors.primary }}
            />
            <h3
              className="text-3xl font-extrabold tracking-tight"
              style={{ color: themeColors.primary }}
            >
              {editingDevice ? "Edit Device" : "Add New Device"}
            </h3>
            <button
              onClick={onClose}
              className="ml-auto rounded-full p-2 transition-all duration-300 hover:scale-110"
              style={{
                color: themeColors.muted,
                backgroundColor: `${themeColors.border}20`,
              }}
              title="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          {/* Device Metadata Info (edit mode) */}
          {editingDevice && (
            <div
              className="mb-3 px-3 py-2 rounded"
              style={{
                background: themeColors.inputbg,
                border: `1px solid ${themeColors.border}`,
                fontSize: "15px",
                lineHeight: 1.4,
                minHeight: "unset",
                marginBottom: 8,
              }}
            >
              <div
                className="text-sm mb-2 font-bold"
                style={{ color: themeColors.muted, letterSpacing: 0.5 }}
              >
                Device Info
              </div>
              <div className="flex flex-wrap gap-x-8 gap-y-2 items-center">
                {editingDevice.metadata && (
                  <>
                    <div className="flex items-center min-w-[120px] mr-3">
                      <span className="font-semibold">Model:</span>
                      <span className="ml-2">
                        {editingDevice.metadata.model || "N/A"}
                      </span>
                    </div>
                    <div className="flex items-center min-w-[130px] mr-3">
                      <span className="font-semibold">Firmware:</span>
                      <span className="ml-2">
                        v{editingDevice.metadata.firmware_version || "N/A"}
                      </span>
                    </div>
                    {editingDevice.metadata.mac_address && (
                      <div className="flex items-center min-w-[140px] mr-3">
                        <span className="font-semibold">MAC:</span>
                        <span className="ml-2">
                          {editingDevice.metadata.mac_address}
                        </span>
                      </div>
                    )}
                  </>
                )}
                <div className="flex items-center min-w-[120px] mr-3">
                  <span className="font-semibold">Tissue:</span>
                  <span className="ml-2">
                    {editingDevice.tissue_type === "hand_towel"
                      ? "Hand Towel"
                      : editingDevice.tissue_type === "toilet_paper"
                      ? "Rest Room Paper"
                      : "N/A"}
                  </span>
                </div>
                <div className="flex items-center min-w-[120px]">
                  <span className="font-semibold">Capacity:</span>
                  <span className="ml-2">
                    {editingDevice.meter_capacity || "N/A"}
                  </span>
                </div>
              </div>
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Device Name */}
            <div>
              <label
                className="block text-sm font-medium mb-1 flex items-center gap-2"
                style={{ color: themeColors.heading }}
              >
                <Smartphone
                  className="h-5 w-5"
                  style={{ color: themeColors.primary }}
                />
                Device Name *
              </label>
              <div>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => handleChange("name", e.target.value)}
                  className="mt-2 block w-full rounded-lg pl-3 pr-3 py-2 text-base transition-all duration-200 focus:ring-2 focus:ring-offset-2"
                  style={{
                    color: themeColors.text,
                    backgroundColor: themeColors.inputbg,
                    border: `2px solid ${
                      errors.name ? themeColors.danger : themeColors.border
                    }`,
                    boxShadow: `0 2px 8px ${themeColors.border}20`,
                  }}
                />
              </div>
              {errors.name && (
                <div className="text-xs text-red-500 mt-1">{errors.name}</div>
              )}
            </div>
            {/* Room Number & Floor Number side by side */}
            <div className="flex gap-2">
              <div className="w-1/2">
                <label
                  className="block text-sm font-medium mb-1 flex items-center gap-2"
                  style={{ color: themeColors.heading }}
                >
                  <Home
                    className="h-5 w-5"
                    style={{ color: themeColors.primary }}
                  />
                  Room Number *
                </label>
                <input
                  type="text"
                  required
                  value={formData.room_number}
                  onChange={(e) => handleChange("room_number", e.target.value)}
                  className="mt-2 block w-full rounded-lg pl-3 pr-3 py-2 text-base transition-all duration-200 focus:ring-2 focus:ring-offset-2"
                  style={{
                    color: themeColors.text,
                    backgroundColor: themeColors.inputbg,
                    border: `2px solid ${
                      errors.room_number
                        ? themeColors.danger
                        : themeColors.border
                    }`,
                    boxShadow: `0 2px 8px ${themeColors.border}20`,
                  }}
                />
                {errors.room_number && (
                  <div className="text-xs text-red-500 mt-1">
                    {errors.room_number}
                  </div>
                )}
              </div>
              <div className="w-1/2">
                <label
                  className="block text-sm font-medium mb-1 flex items-center gap-2"
                  style={{ color: themeColors.heading }}
                >
                  <Building2
                    className="h-5 w-5"
                    style={{ color: themeColors.primary }}
                  />
                  Floor Number *
                </label>
                <input
                  type="number"
                  required
                  value={formData.floor_number}
                  onChange={(e) => handleChange("floor_number", e.target.value)}
                  className="mt-2 block w-full rounded-lg pl-3 pr-3 py-2 text-base transition-all duration-200 focus:ring-2 focus:ring-offset-2"
                  style={{
                    color: themeColors.text,
                    backgroundColor: themeColors.inputbg,
                    border: `2px solid ${
                      errors.floor_number
                        ? themeColors.danger
                        : themeColors.border
                    }`,
                    boxShadow: `0 2px 8px ${themeColors.border}20`,
                  }}
                />
                {errors.floor_number && (
                  <div className="text-xs text-red-500 mt-1">
                    {errors.floor_number}
                  </div>
                )}
              </div>
            </div>
            <div>
              <label
                className="block text-sm font-medium"
                style={{ color: themeColors.heading }}
              >
                Tissue Type *
              </label>
              <div className="flex gap-2 mt-2">
                <button
                  type="button"
                  className="flex-1 px-3 py-2 rounded-lg border transition-all duration-150 hover:bg-gray-200 dark:hover:bg-gray-700 text-base"
                  style={{
                    color:
                      formData.tissue_type === "hand_towel"
                        ? "white"
                        : themeColors.text,
                    backgroundColor:
                      formData.tissue_type === "hand_towel"
                        ? `linear-gradient(135deg, ${themeColors.primary} 0%, ${themeColors.accent} 100%)`
                        : themeColors.surface,
                    borderColor:
                      formData.tissue_type === "hand_towel"
                        ? themeColors.primary
                        : themeColors.border,
                    boxShadow:
                      formData.tissue_type === "hand_towel"
                        ? `0 4px 15px ${themeColors.primary}40`
                        : `0 2px 8px ${themeColors.border}20`,
                  }}
                  onClick={() => handleChange("tissue_type", "hand_towel")}
                >
                  Hand Towel
                </button>
                <button
                  type="button"
                  className="flex-1 px-3 py-2 rounded-lg border transition-all duration-150 hover:bg-gray-200 dark:hover:bg-gray-700 text-base"
                  style={{
                    color:
                      formData.tissue_type === "toilet_paper"
                        ? "white"
                        : themeColors.text,
                    backgroundColor:
                      formData.tissue_type === "toilet_paper"
                        ? `linear-gradient(135deg, ${themeColors.primary} 0%, ${themeColors.accent} 100%)`
                        : themeColors.surface,
                    borderColor:
                      formData.tissue_type === "toilet_paper"
                        ? themeColors.primary
                        : themeColors.border,
                    boxShadow:
                      formData.tissue_type === "toilet_paper"
                        ? `0 4px 15px ${themeColors.primary}40`
                        : `0 2px 8px ${themeColors.border}20`,
                  }}
                  onClick={() => handleChange("tissue_type", "toilet_paper")}
                >
                  Rest Room Paper
                </button>
              </div>
            </div>
            {formData.tissue_type === "toilet_paper" && (
              <div>
                <label
                  className="block text-sm font-medium"
                  style={{ color: themeColors.heading }}
                >
                  Rest Room Type *
                </label>
                <div className="flex gap-2 mt-2">
                  <button
                    type="button"
                    className="flex-1 px-3 py-2 rounded-lg border transition-all duration-150 hover:bg-gray-200 dark:hover:bg-gray-700 text-base"
                    style={{
                      color:
                        formData.gender === "male" ? "white" : themeColors.text,
                      backgroundColor:
                        formData.gender === "male"
                          ? `linear-gradient(135deg, ${themeColors.primary} 0%, ${themeColors.accent} 100%)`
                          : themeColors.surface,
                      borderColor:
                        formData.gender === "male"
                          ? themeColors.primary
                          : themeColors.border,
                      boxShadow:
                        formData.gender === "male"
                          ? `0 4px 15px ${themeColors.primary}40`
                          : `0 2px 8px ${themeColors.border}20`,
                    }}
                    onClick={() => handleChange("gender", "male")}
                  >
                    Men Rest Room
                  </button>
                  <button
                    type="button"
                    className="flex-1 px-3 py-2 rounded-lg border transition-all duration-150 hover:bg-gray-200 dark:hover:bg-gray-700 text-base"
                    style={{
                      color:
                        formData.gender === "female"
                          ? "white"
                          : themeColors.text,
                      backgroundColor:
                        formData.gender === "female"
                          ? `linear-gradient(135deg, ${themeColors.primary} 0%, ${themeColors.accent} 100%)`
                          : themeColors.surface,
                      borderColor:
                        formData.gender === "female"
                          ? themeColors.primary
                          : themeColors.border,
                      boxShadow:
                        formData.gender === "female"
                          ? `0 4px 15px ${themeColors.primary}40`
                          : `0 2px 8px ${themeColors.border}20`,
                    }}
                    onClick={() => handleChange("gender", "female")}
                  >
                    Women Rest Room
                  </button>
                </div>
              </div>
            )}
            <div>
              <label
                className="block text-sm font-medium"
                style={{ color: themeColors.heading }}
              >
                Meter Capacity *
              </label>
              <div className="flex gap-1 mt-2">
                {[500, 1000, 1500, 2000].map((preset) => (
                  <button
                    type="button"
                    key={preset}
                    className="flex-1 px-2 py-1 rounded-lg border transition-all duration-150 hover:bg-gray-200 dark:hover:bg-gray-700 text-base"
                    style={{
                      color:
                        formData.meter_capacity === preset
                          ? "white"
                          : themeColors.text,
                      backgroundColor:
                        formData.meter_capacity === preset
                          ? `linear-gradient(135deg, ${themeColors.primary} 0%, ${themeColors.accent} 100%)`
                          : themeColors.surface,
                      borderColor:
                        formData.meter_capacity === preset
                          ? themeColors.primary
                          : themeColors.border,
                      boxShadow:
                        formData.meter_capacity === preset
                          ? `0 4px 15px ${themeColors.primary}40`
                          : `0 2px 8px ${themeColors.border}20`,
                    }}
                    onClick={() =>
                      handleChange("meter_capacity", preset.toString())
                    }
                  >
                    {preset}
                  </button>
                ))}
                <input
                  type="number"
                  min="1"
                  max="99999"
                  value={formData.meter_capacity}
                  onChange={(e) =>
                    handleChange("meter_capacity", e.target.value)
                  }
                  className="w-20 px-2 py-1 rounded-lg border transition-all duration-150 focus:ring-2 focus:ring-offset-2 text-base"
                  style={{
                    color: themeColors.text,
                    backgroundColor: themeColors.inputbg,
                    border: `2px solid ${
                      errors.meter_capacity
                        ? themeColors.danger
                        : themeColors.border
                    }`,
                    boxShadow: `0 2px 8px ${themeColors.border}20`,
                  }}
                />
              </div>
              {errors.meter_capacity && (
                <div className="text-xs text-red-500 mt-1">
                  {errors.meter_capacity}
                </div>
              )}
              <div
                className="text-xs mt-1"
                style={{ color: themeColors.muted }}
              >
                Reference value will be set to {formData.meter_capacity || 0}
              </div>
            </div>
            <div className="flex gap-2 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 rounded-lg transition-all duration-150 hover:bg-gray-200 dark:hover:bg-gray-700 flex items-center justify-center text-base"
                style={{
                  color: themeColors.text,
                  backgroundColor: themeColors.surface,
                  border: `2px solid ${themeColors.border}`,
                  boxShadow: `0 4px 15px ${themeColors.border}30`,
                }}
              >
                <X className="h-5 w-5 mr-2" /> Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-4 py-2 rounded-lg transition-all duration-150 hover:bg-orange-600/80 flex items-center justify-center disabled:opacity-50 font-semibold text-base"
                style={{
                  background: themeColors.primary,
                  color: "#fff",
                  boxShadow: `0 4px 15px ${themeColors.primary}40`,
                }}
              >
                {loading ? (
                  <Spinner size={20} color="#fff" className="mr-2" />
                ) : (
                  <Plus className="h-5 w-5 mr-2" />
                )}
                {editingDevice ? "Update Device" : "Add Device"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

// Device Card Component - matches mobile app's DeviceCard
const DeviceCard = ({ device, onEdit, onDelete }) => {
  const { themeColors, isDark } = useTheme();
  // Only render if device has a valid id
  if (!device || !device.id) return null;

  // Format added date (assume device.created_at or device.added_date)
  let addedDate = null;
  if (device.created_at) {
    try {
      const dateObj = new Date(device.created_at);
      addedDate = dateObj.toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      // ignore date parse error
    }
  } else if (device.added_date) {
    try {
      const dateObj = new Date(device.added_date);
      addedDate = dateObj.toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      // ignore date parse error
    }
  }

  // Rest room type label and icon
  let restRoomType = null;
  let restRoomIcon = null;
  if (device.tissue_type === "toilet_paper") {
    if (device.gender === "female") {
      restRoomType = "Women Rest Room";
      // Female icon (Venus symbol)
      restRoomIcon = (
        <svg
          className="h-4 w-4 mr-1 text-pink-500"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="8" r="5" />
          <line x1="12" y1="13" x2="12" y2="21" />
          <line x1="9" y1="18" x2="15" y2="18" />
        </svg>
      );
    } else {
      restRoomType = "Men Rest Room";
      // Male icon (Mars symbol)
      restRoomIcon = (
        <svg
          className="h-4 w-4 mr-1 text-blue-500"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="10" cy="14" r="5" />
          <line x1="19" y1="5" x2="14.65" y2="9.35" />
          <line x1="19" y1="5" x2="19" y2="10" />
          <line x1="19" y1="5" x2="14" y2="5" />
        </svg>
      );
    }
  }

  return (
    <div
      className="rounded-lg shadow-lg w-full max-w-5xl mx-auto border transition-all duration-300 mb-4 flex flex-col md:flex-row items-stretch md:items-stretch group overflow-hidden"
      style={{
        minHeight: "110px",
        maxHeight: "170px",
        width: "100%",
        maxWidth: "1100px",
        background: `linear-gradient(120deg, ${themeColors.surface} 80%, ${themeColors.card} 100%)`,
        border: `1px solid ${themeColors.border}55`,
        boxShadow: `0 8px 18px ${themeColors.border}18`,
        color: themeColors.text,
        borderRadius: 12,
        padding: 0,
      }}
    >
      <div className="flex flex-col md:flex-row items-center md:items-stretch space-y-2 md:space-y-0 md:space-x-4 z-10 w-full p-4 md:p-6">
        <div
          className="h-10 w-10 rounded-lg flex items-center justify-center shadow bg-white/60 dark:bg-gray-900/60 transition-transform duration-200 border mr-0 md:mr-4"
          style={{
            background: isDark
              ? themeColors.primary + "13"
              : themeColors.primary + "08",
            borderColor: themeColors.primary + "55",
          }}
        >
          <Smartphone
            className="h-5 w-5 drop-shadow"
            style={{ color: themeColors.primary + "bb" }}
          />
        </div>
        <div className="flex-1 min-w-0 flex flex-col justify-center md:justify-between">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <h3
              className="text-lg font-bold truncate"
              style={{ color: themeColors.primary + "cc" }}
            >
              {device.name || device.device_name || `Device ${device.id}`}
            </h3>
            <span
              className="text-[10px] font-semibold px-2 py-0.5 rounded bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400"
              title="Device ID"
            >
              ID: {device.id}
            </span>
          </div>
          <div className="flex flex-wrap gap-2 items-center text-sm mt-0.5">
            <span className="inline-flex items-center font-medium text-gray-600 dark:text-gray-300 px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-900/30 border border-blue-100 dark:border-blue-800">
              <Home className="h-3.5 w-3.5 mr-1 text-blue-300" />
              Room {device.room_number}
            </span>
            <span className="inline-flex items-center font-medium text-gray-600 dark:text-gray-300 px-2 py-0.5 rounded bg-purple-50 dark:bg-purple-900/30 border border-purple-100 dark:border-purple-800">
              <Building2 className="h-3.5 w-3.5 mr-1 text-purple-300" />
              Floor {device.floor_number}
            </span>
            {restRoomType && (
              <span
                className="inline-flex items-center font-medium px-2 py-0.5 rounded bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-200 border border-yellow-100 dark:border-yellow-800"
                style={{
                  fontWeight: 500,
                  letterSpacing: 0.2,
                }}
              >
                {restRoomIcon}
                {restRoomType}
              </span>
            )}
            {addedDate && (
              <span
                className="inline-flex items-center font-medium px-2 py-0.5 rounded bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-300 border border-slate-100 dark:border-slate-700"
                style={{
                  fontWeight: 500,
                  letterSpacing: 0.2,
                }}
              >
                <Calendar className="h-3.5 w-3.5 mr-1 text-slate-400" />
                {addedDate}
              </span>
            )}
          </div>
        </div>
        <div className="flex flex-col items-end justify-between ml-0 md:ml-4 gap-2 md:gap-3">
          <button
            onClick={() => onEdit(device)}
            className="hover:scale-105 p-2 rounded-full transition-all duration-200 border shadow"
            style={{
              color: themeColors.primary + "cc",
              borderColor: themeColors.primary + "55",
              backgroundColor: "transparent",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor =
                themeColors.primary + "10";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "transparent";
            }}
            title="Edit Device"
          >
            <Edit className="h-4 w-4" />
          </button>
          {device.id && (
            <button
              onClick={() => onDelete(device)}
              className="hover:scale-105 hover:bg-red-50 dark:hover:bg-red-900 p-2 rounded-full transition-all duration-200 border border-red-100 dark:border-red-700 shadow"
              style={{ color: themeColors.danger + "cc" }}
              title="Delete Device"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// Main Devices Component - matches mobile app's AdminDeviceList exactly
const Devices = () => {
  const { accessToken } = useAuth();
  const { themeColors } = useTheme();

  // Device store - same as mobile app
  const deviceStore = useDeviceStore();
  const {
    devices = [],
    analytics = [],
    realtimeStatus = [],
    loading: storeLoading,
    fetchDevices,
    addDevice,
    updateDevice,
    deleteDevice,
  } = deviceStore;

  // Local state - matches mobile app patterns
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showWifiOptionsModal, setShowWifiOptionsModal] = useState(false);
  const [editingDevice, setEditingDevice] = useState(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Modal states - matches mobile app's alert system
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [modalContent, setModalContent] = useState({
    title: "",
    message: "",
    type: "info",
    primaryAction: null,
    secondaryAction: null,
    deviceToDelete: null,
  });

  // Merge devices with analytics and real-time data - same logic as mobile app
  const mergedDevices = React.useMemo(() => {
    const devicesArray = Array.isArray(devices) ? devices : [];
    const analyticsArray = Array.isArray(analytics) ? analytics : [];
    const realtimeArray = Array.isArray(realtimeStatus) ? realtimeStatus : [];

    const analyticsMap = new Map(
      analyticsArray.map((a) => [a.device_id || a.id, a])
    );
    const realtimeMap = new Map(
      realtimeArray.map((r) => [r.device_id || r.id, r])
    );

    return devicesArray.map((device) => {
      const deviceId = device.id || device.device_id;
      const analyticsData = analyticsMap.get(deviceId) || {};
      const realtimeData = realtimeMap.get(deviceId) || {};

      return {
        ...device,
        ...analyticsData,
        ...realtimeData,
        device_id: deviceId,
        device_name: device.name || device.device_name || `Device ${deviceId}`,
      };
    });
  }, [devices, analytics, realtimeStatus]);

  // Filter devices based on search term - exact same logic as mobile app
  const filteredDevices = React.useMemo(() => {
    const deviceList = Array.isArray(mergedDevices) ? mergedDevices : [];

    // Only keep devices with a valid id
    let filteredList = deviceList.filter((device) => device && device.id);

    if (searchTerm && searchTerm.trim() !== "") {
      const term = searchTerm.toLowerCase().trim();
      filteredList = filteredList.filter((device) => {
        const nameMatch = device.name?.toLowerCase()?.includes(term) || false;
        const roomMatch =
          device.room_number?.toString()?.toLowerCase()?.includes(term) ||
          false;
        const floorMatch =
          device.floor_number?.toString()?.includes(searchTerm) || false;
        return nameMatch || roomMatch || floorMatch;
      });
    }

    // Sort devices by priority and activity - exact same logic as mobile app
    return filteredList.sort((a, b) => {
      const getDevicePriorityScore = (device) => {
        const status = device.current_status?.toLowerCase() || "unknown";
        const priority = device.status_priority || 0;

        if (
          status === "tamper" ||
          priority >= 4 ||
          (device.current_tamper && device.tamper_count > 0)
        ) {
          return (
            100 + (device.tamper_count || 0) + (device.low_alert_count || 0)
          );
        }

        if (
          status === "empty" ||
          priority === 3 ||
          device.current_alert === "EMPTY"
        ) {
          return 90 + (device.low_alert_count || 0);
        }

        if (
          status === "low" ||
          priority === 2 ||
          device.low_alert_count > 0 ||
          device.current_alert === "LOW"
        ) {
          return 80 + (device.low_alert_count || 0);
        }

        if (status === "full" || device.current_alert === "FULL") {
          return 70;
        }

        if (
          status === "normal" ||
          status === "active" ||
          status === "online" ||
          priority === 1 ||
          device.is_active === true ||
          device.total_entries > 0
        ) {
          if (
            device.minutes_since_update !== null &&
            device.minutes_since_update <= 5
          ) {
            return 50;
          } else if (
            device.minutes_since_update !== null &&
            device.minutes_since_update <= 30
          ) {
            return 45;
          }
          return 30;
        }

        if (
          status === "inactive" ||
          status === "offline" ||
          device.is_active === false
        ) {
          return status === "inactive" ? 5 : 10;
        }

        return 1;
      };

      const scoreA = getDevicePriorityScore(a);
      const scoreB = getDevicePriorityScore(b);

      if (scoreA !== scoreB) {
        return scoreB - scoreA;
      }

      const timeA = a.minutes_since_update || 999;
      const timeB = b.minutes_since_update || 999;

      return timeA - timeB;
    });
  }, [mergedDevices, searchTerm]);

  // Load devices - matches mobile app's loadDevices function
  const loadDevices = useCallback(async () => {
    if (!accessToken) {
      setModalContent({
        title: "Error",
        message: "No authentication token available",
        type: "error",
        primaryAction: { text: "OK", onPress: () => setShowErrorModal(false) },
      });
      setShowErrorModal(true);
      return;
    }

    try {
      await fetchDevices(accessToken);
    } catch (err) {
      const errorMessage =
        err.response?.data?.message || err.message || "Failed to load devices";
      setModalContent({
        title: "Error",
        message: errorMessage,
        type: "error",
        primaryAction: { text: "Retry", onPress: () => loadDevices() },
        secondaryAction: {
          text: "Cancel",
          onPress: () => setShowErrorModal(false),
        },
      });
      setShowErrorModal(true);
    }
  }, [accessToken, fetchDevices]);

  // Refresh devices - matches mobile app's onRefresh function
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await loadDevices();
    } catch {
      // Handle refresh error silently - same as mobile app
    } finally {
      setRefreshing(false);
    }
  }, [loadDevices]);

  // Load devices on mount
  useEffect(() => {
    loadDevices();
  }, [loadDevices]);

  // Handle device submit (add or update) - matches mobile app's handleDeviceSubmit exactly
  const handleDeviceSubmit = useCallback(
    async (deviceData, id) => {
      if (!accessToken) {
        setModalContent({
          title: "Error",
          message: "No authentication token available",
          type: "error",
          primaryAction: {
            text: "OK",
            onPress: () => setShowErrorModal(false),
          },
        });
        setShowErrorModal(true);
        return false;
      }

      // Validate device data - same validation as mobile app
      if (!deviceData.name || deviceData.name.trim() === "") {
        setModalContent({
          title: "Error",
          message: "Device name is required",
          type: "error",
          primaryAction: {
            text: "OK",
            onPress: () => setShowErrorModal(false),
          },
        });
        setShowErrorModal(true);
        return false;
      }

      // Ensure floor_number is a valid number - same validation as mobile app
      const validatedData = {
        ...deviceData,
        name: deviceData.name.trim(),
        room_number: deviceData.room_number?.trim() || "",
        floor_number: parseInt(deviceData.floor_number, 10) || 0,
      };

      if (isNaN(validatedData.floor_number)) {
        setModalContent({
          title: "Error",
          message: "Invalid floor number",
          type: "error",
          primaryAction: {
            text: "OK",
            onPress: () => setShowErrorModal(false),
          },
        });
        setShowErrorModal(true);
        return false;
      }

      setLoading(true);
      try {
        let success = false;
        if (id) {
          // Edit mode: use device ID - same as mobile app
          await updateDevice(accessToken, id, validatedData);
        } else {
          // Add mode - same as mobile app
          await addDevice(accessToken, validatedData);
        }

        // Close modal and reset state - same as mobile app
        setShowAddModal(false);
        setEditingDevice(null);

        // Show success message - matches mobile app's success messages
        setModalContent({
          title: "Success!",
          message: id
            ? "Device updated successfully and synced across all views"
            : "Device added successfully and synced across all views",
          type: "success",
          primaryAction: {
            text: "Got it",
            onPress: () => setShowSuccessModal(false),
          },
        });
        setShowSuccessModal(true);
        success = true;
        return success;
      } catch (error) {
        const errorMessage =
          error.response?.data?.message ||
          error.message ||
          "Failed to save device";
        setModalContent({
          title: "Error",
          message: errorMessage,
          type: "error",
          primaryAction: {
            text: "OK",
            onPress: () => setShowErrorModal(false),
          },
        });
        setShowErrorModal(true);
        return false;
      } finally {
        setLoading(false);
      }
    },
    [accessToken, addDevice, updateDevice]
  );

  // Handle device delete - matches mobile app's handleDeviceDelete exactly
  const handleDeviceDelete = useCallback(
    async (device) => {
      if (!accessToken) {
        setModalContent({
          title: "Error",
          message: "No authentication token available.",
          type: "error",
          primaryAction: {
            text: "OK",
            onPress: () => setShowErrorModal(false),
          },
        });
        setShowErrorModal(true);
        return false;
      }
      if (!device || !device.id) {
        setModalContent({
          title: "Error",
          message:
            "Device information is missing or invalid. Please try again.",
          type: "error",
          primaryAction: {
            text: "OK",
            onPress: () => setShowErrorModal(false),
          },
        });
        setShowErrorModal(true);
        return false;
      }
      setLoading(true);
      try {
        await deleteDevice(accessToken, device.id);
        await fetchDevices(accessToken);
        return true;
      } catch (error) {
        setModalContent({
          title: "Error",
          message: error.message || "Failed to delete device.",
          type: "error",
          primaryAction: {
            text: "OK",
            onPress: () => setShowErrorModal(false),
          },
        });
        setShowErrorModal(true);
        return false;
      } finally {
        setLoading(false);
      }
    },
    [accessToken, deleteDevice, fetchDevices]
  );

  // Move confirmDeleteDevice above handleDeleteDeviceConfirm to fix ReferenceError
  const confirmDeleteDevice = useCallback(
    async (device) => {
      setShowDeleteConfirmModal(false);
      try {
        const success = await handleDeviceDelete(device);
        if (success) {
          setModalContent({
            title: "Success!",
            message: "Device deleted successfully and synced across all views",
            type: "success",
            primaryAction: {
              text: "Got it",
              onPress: () => setShowSuccessModal(false),
            },
          });
          setShowSuccessModal(true);
        }
      } catch (error) {
        setModalContent({
          title: "Error",
          message: error.message || "Failed to delete device",
          type: "error",
          primaryAction: {
            text: "OK",
            onPress: () => setShowErrorModal(false),
          },
        });
        setShowErrorModal(true);
      }
    },
    [handleDeviceDelete]
  );

  // Handle delete confirmation - matches mobile app's delete confirmation
  const handleDeleteDeviceConfirm = useCallback(
    (device) => {
      setModalContent({
        title: "Delete Device",
        message: `Are you sure you want to delete "${device.name}"?`,
        type: "error",
        primaryAction: {
          text: "Delete",
          onPress: () => confirmDeleteDevice(device),
        },
        secondaryAction: {
          text: "Cancel",
          onPress: () => setShowDeleteConfirmModal(false),
        },
      });
      setShowDeleteConfirmModal(true);
    },
    [confirmDeleteDevice]
  );

  // Handle edit device - matches mobile app's edit handler
  const handleEditDevice = useCallback((device) => {
    setEditingDevice(device);
    setShowAddModal(true);
  }, []);

  // Handle add device - matches mobile app's add handler
  const handleAddDevice = useCallback(() => {
    setEditingDevice(null);
    setShowAddModal(true);
  }, []);

  // Handle WiFi scan - matches mobile app's WiFi options
  const handleWifiScan = useCallback(() => {
    setShowWifiOptionsModal(true);
  }, []);

  // Handle WiFi network scan - matches mobile app's WiFi network scan
  const handleWifiNetworkScan = useCallback(() => {
    setShowWifiOptionsModal(false);
    setModalContent({
      title: "WiFi Scanning",
      message:
        "WiFi network scanning is not available in the web version. Please use the mobile app for WiFi device discovery.",
      type: "info",
      primaryAction: { text: "OK", onPress: () => setShowErrorModal(false) },
    });
    setShowErrorModal(true);
  }, []);

  // Handle WiFi QR scan - matches mobile app's QR scan
  const handleWifiQRScan = useCallback(() => {
    setShowWifiOptionsModal(false);
    setModalContent({
      title: "QR Scanning",
      message:
        "QR code scanning is not available in the web version. Please use the mobile app for QR code scanning.",
      type: "info",
      primaryAction: { text: "OK", onPress: () => setShowErrorModal(false) },
    });
    setShowErrorModal(true);
  }, []);

  return (
    <div className="space-y-6">
      {/* Header - matches mobile app's header */}
      <div className="md:flex md:items-center md:justify-between">
        <div className="flex-1 min-w-0">
          <h2
            className="text-3xl font-extrabold leading-7 sm:text-4xl"
            style={{ color: "#fff" }}
          >
            Device Management
          </h2>
          <p className="mt-2 text-base text-gray-500 dark:text-gray-300">
            Monitor and manage all your Smart Tissue Dispensers
          </p>
        </div>
        <div className="mt-4 flex flex-wrap gap-4 md:mt-0 md:ml-6">
          <button
            onClick={handleAddDevice}
            className="inline-flex items-center px-6 py-3 border-none rounded-xl shadow-lg text-sm font-semibold text-white transition-all duration-300 focus:ring-2 focus:ring-offset-2 hover:scale-105"
            style={{
              background: themeColors.primary,
              boxShadow: `0 4px 15px ${themeColors.primary}40`,
            }}
          >
            <Plus className="h-5 w-5 mr-2" />
            Add Device
          </button>
          <button
            onClick={handleWifiScan}
            className="inline-flex items-center px-6 py-3 border rounded-xl shadow-lg text-sm font-semibold transition-all duration-300 focus:ring-2 focus:ring-offset-2 hover:scale-105"
            style={{
              color: themeColors.text,
              backgroundColor: themeColors.surface,
              borderColor: themeColors.border,
              boxShadow: `0 4px 15px ${themeColors.border}20`,
            }}
          >
            <Wifi className="h-5 w-5 mr-2" />
            WiFi Device
          </button>
          <button
            onClick={onRefresh}
            disabled={refreshing}
            className="inline-flex items-center px-6 py-3 border rounded-xl shadow-lg text-sm font-semibold transition-all duration-300 focus:ring-2 focus:ring-offset-2 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              color: themeColors.text,
              backgroundColor: themeColors.surface,
              borderColor: themeColors.border,
              boxShadow: `0 4px 15px ${themeColors.border}20`,
            }}
          >
            <RefreshCw
              className={`h-5 w-5 mr-2 ${refreshing ? "animate-spin" : ""}`}
            />
            Refresh
          </button>
        </div>
      </div>

      {/* Search - matches mobile app's search */}
      <div className="w-full flex justify-center">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 z-10 text-gray-400 dark:text-gray-500" />
          <input
            type="text"
            placeholder="Search devices..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-11 pr-3 py-2 w-full rounded-lg border focus:outline-none transition-all duration-200 text-base shadow-md"
            style={{
              background: `${themeColors.surface}cc`,
              borderColor: themeColors.border,
              boxShadow: `0 1px 4px ${themeColors.border}18`,
              color: themeColors.text,
              borderRadius: 12,
              minHeight: 40,
              width: "100%",
              maxWidth: "100%",
            }}
            onFocus={(e) =>
              (e.target.style.boxShadow = `0 0 0 2px ${themeColors.primary}55`)
            }
            onBlur={(e) =>
              (e.target.style.boxShadow = `0 1px 4px ${themeColors.border}18`)
            }
          />
        </div>
      </div>

      {/* Devices List - matches mobile app's device list */}
      <div className="space-y-4">
        {storeLoading && !refreshing ? (
          <div className="text-center py-12">
            <Spinner
              size={32}
              color={themeColors.primary}
              className="mx-auto"
            />
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              Loading devices...
            </p>
          </div>
        ) : filteredDevices.length > 0 ? (
          filteredDevices.map((device) => (
            <DeviceCard
              key={device.id}
              device={device}
              onEdit={handleEditDevice}
              onDelete={handleDeleteDeviceConfirm}
            />
          ))
        ) : (
          <div className="text-center py-16">
            <div className="flex justify-center mb-4">
              <Smartphone className="h-16 w-16 text-blue-300 animate-bounce" />
            </div>
            <h3 className="mt-2 text-lg font-bold text-gray-900 dark:text-white">
              No devices found
            </h3>
            <p className="mt-1 text-base text-gray-500 dark:text-gray-400">
              {searchTerm
                ? "Try adjusting your search terms."
                : "Get started by adding a new device."}
            </p>
          </div>
        )}
      </div>

      {/* Modals - matches mobile app's modal system */}
      <AddDeviceModal
        visible={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          setEditingDevice(null);
        }}
        onSubmit={handleDeviceSubmit}
        editingDevice={editingDevice}
        loading={loading}
      />

      <WiFiOptionsModal
        visible={showWifiOptionsModal}
        onClose={() => setShowWifiOptionsModal(false)}
        onWifiNetworkScan={handleWifiNetworkScan}
        onWifiQRScan={handleWifiQRScan}
      />

      <CustomAlert
        visible={showErrorModal}
        onClose={() => setShowErrorModal(false)}
        title={modalContent.title}
        message={modalContent.message}
        type={modalContent.type}
        primaryAction={modalContent.primaryAction}
        secondaryAction={modalContent.secondaryAction}
        themeColors={themeColors}
        isDark={themeColors?.surface && themeColors.surface !== "#ffffff"}
      />

      <CustomAlert
        visible={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        title={modalContent.title}
        message={modalContent.message}
        type={modalContent.type}
        primaryAction={modalContent.primaryAction}
        secondaryAction={modalContent.secondaryAction}
        themeColors={themeColors}
        isDark={themeColors?.surface && themeColors.surface !== "#ffffff"}
      />

      <CustomAlert
        visible={showDeleteConfirmModal}
        onClose={() => setShowDeleteConfirmModal(false)}
        title={modalContent.title}
        message={modalContent.message}
        type={modalContent.type}
        primaryAction={modalContent.primaryAction}
        secondaryAction={modalContent.secondaryAction}
        themeColors={themeColors}
        isDark={themeColors?.surface && themeColors.surface !== "#ffffff"}
      />
    </div>
  );
};

export default Devices;
