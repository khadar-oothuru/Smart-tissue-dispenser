import React, { useState, useEffect } from "react";
import { HiOutlineDownload, HiChevronDown, HiChevronUp } from "react-icons/hi";
import { IoWater, IoBatteryChargingOutline } from "react-icons/io5";
import EmptyState from "../common/EmptyState";
import AnalyticsFilters from "./AnalyticsFilters";
import DeviceTimeChart from "./DeviceTimeChart";
import DownloadButtons from "./DownloadButtons";
import { useDeviceStore } from "../../store/useDeviceStore";
import { useTheme } from "../../hooks/useThemeContext";

const TimeBasedTab = ({
  timeBasedData,
  devices,
  selectedPeriod,
  selectedDevice,
  onPeriodChange,
  onDeviceChange,
  onDownload,
  downloading,
  cancelled,
}) => {
  const { analyticsLoading } = useDeviceStore();
  const { themeColors, isDark } = useTheme();
  const [showExportOptions, setShowExportOptions] = useState(false);
  const [alertType, setAlertType] = useState("tissue");

  useEffect(() => {
    // Data updated: tracking timeBasedData changes
  }, [
    timeBasedData,
    analyticsLoading,
    selectedPeriod,
    selectedDevice,
    alertType,
  ]);

  const handleToggleExport = () => {
    setShowExportOptions(!showExportOptions);
  };

  // Custom glassmorphic toggle switch component (smaller)
  const ToggleSwitch = ({ checked, onChange }) => {
    return (
      <button
        onClick={() => onChange(!checked)}
        className={`
          relative inline-flex h-6 w-12 items-center rounded-full shadow-lg border border-white/30
          transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2
          backdrop-blur-md
        `}
      >
        <span
          className={`
            inline-block h-4 w-4 transform rounded-full shadow-md bg-white/90 border border-white/60
            transition-transform duration-300
            ${checked ? "translate-x-6" : "translate-x-1"}
          `}
        />
      </button>
    );
  };

  return (
    <div>
      <AnalyticsFilters
        selectedPeriod={selectedPeriod}
        selectedDevice={selectedDevice}
        devices={devices}
        onPeriodChange={onPeriodChange}
        onDeviceChange={onDeviceChange}
      />

      {/* Modern Glass-Style Toggle & Export Button Side by Side */}
      <div className="px-4 mb-4">
        <div className="flex flex-row gap-3 items-center">
          {/* Toggle Card (same size as export) */}
          <div
            className={`flex-1 min-w-0 h-16 rounded-2xl overflow-hidden shadow-xl border border-white/20 backdrop-blur-md bg-surface flex items-center justify-center px-2`}
          >
            {/* Tissue Alerts Option */}
            <div className="flex flex-row items-center justify-center flex-1 min-w-0 gap-2">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center transition-all duration-200 shadow-md border border-white/30 backdrop-blur-sm text-primary`}
              >
                <IoWater size={18} />
              </div>
              <span
                className={`text-xs tracking-tight text-primary ${
                  alertType === "tissue" ? "font-extrabold" : "font-semibold"
                }`}
              >
                Tissue
              </span>
            </div>
            {/* Toggle Switch */}
            <div className="px-2 flex items-center justify-center">
              <ToggleSwitch
                checked={alertType === "battery"}
                onChange={(val) => setAlertType(val ? "battery" : "tissue")}
              />
            </div>
            {/* Battery Alerts Option */}
            <div className="flex flex-row items-center justify-center flex-1 min-w-0 gap-2">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center transition-all duration-200 shadow-md border border-white/30 backdrop-blur-sm text-primary`}
              >
                <IoBatteryChargingOutline size={18} />
              </div>
              <span
                className={`text-xs tracking-tight text-primary ${
                  alertType === "battery" ? "font-extrabold" : "font-semibold"
                }`}
              >
                Battery
              </span>
            </div>
          </div>
          {/* Export Button Card (same size as toggle) */}
          <button
            className={`flex-1 min-w-0 h-16 rounded-2xl overflow-hidden shadow-xl border border-white/20 backdrop-blur-md bg-surface transition-all duration-300 hover:shadow-2xl flex items-center px-2`}
            onClick={handleToggleExport}
          >
            <div className="w-7 h-7 rounded-full flex items-center justify-center mr-4 shadow-md border border-white/30 backdrop-blur-sm text-primary">
              <HiOutlineDownload size={20} />
            </div>
            <div className="flex-1 flex flex-col justify-center text-left gap-0.5">
              <span className="text-xs font-extrabold tracking-tight text-primary">
                {showExportOptions ? "Hide Export" : "Export Data"}
              </span>
              <span className="block text-[10px] font-medium opacity-80 text-primary">
                Download analytics
              </span>
            </div>
            {showExportOptions ? (
              <HiChevronUp size={22} className="text-primary ml-2" />
            ) : (
              <HiChevronDown size={22} className="text-primary ml-2" />
            )}
          </button>
        </div>
      </div>

      {/* Show Download Buttons only when export is toggled */}
      {showExportOptions && (
        <DownloadButtons
          onDownload={onDownload}
          isLoading={analyticsLoading}
          downloading={downloading}
          cancelled={cancelled}
        />
      )}

      {/* Chart Data Section */}
      {analyticsLoading ? (
        <div className="flex items-center justify-center py-10 px-5 min-h-[200px]">
          <p
            className="text-base font-medium opacity-70"
            style={{ color: themeColors.text }}
          >
            Loading analytics data...
          </p>
        </div>
      ) : timeBasedData && timeBasedData.data?.length > 0 ? (
        <div className="mb-4">
          {timeBasedData.data.map((deviceData, index) => (
            <DeviceTimeChart
              key={`${deviceData.device_id}_${index}_${selectedPeriod}_${alertType}`}
              deviceData={deviceData}
              alertType={alertType}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          icon="chart-line"
          message="No data available for the selected period"
          description={`Try selecting a different time period${
            selectedDevice !== "all" ? " or device" : ""
          }`}
        />
      )}
    </div>
  );
};

export default TimeBasedTab;
