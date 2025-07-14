import React, { useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import useDeviceStore from "../../store/useDeviceStore";

const SUMMARY_TYPE_MAP = {
  total: {
    title: "All Devices",
    filter: () => true,
  },
  active: {
    title: "Active Devices",
    filter: (device) => device.is_active,
  },
  offline: {
    title: "Offline Devices",
    filter: (device) => !device.is_active,
  },
  "no-power": {
    title: "No Power Devices",
    filter: (device) =>
      device.power_status === false ||
      device.power_status === "off" ||
      device.power_status === 0,
  },
};

const DeviceCard = ({ device }) => (
  <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 flex flex-col gap-2 hover:shadow-lg transition-shadow">
    <div className="flex items-center justify-between mb-1">
      <h4 className="font-semibold text-gray-900 dark:text-white truncate">
        {device.device_name || device.name || `Device ${device.id}`}
      </h4>
      <span
        className={`text-xs px-2 py-1 rounded-full ${
          device.is_active
            ? "bg-green-100 text-green-700"
            : "bg-red-100 text-red-700"
        }`}
      >
        {device.is_active ? "Active" : "Offline"}
      </span>
    </div>
    <div className="grid grid-cols-2 gap-2 text-sm">
      <div>
        <span className="text-gray-500">Room:</span> {device.room}
      </div>
      <div>
        <span className="text-gray-500">Floor:</span> {device.floor}
      </div>
      <div>
        <span className="text-gray-500">Status:</span> {device.current_status}
      </div>
      <div>
        <span className="text-gray-500">Power:</span>{" "}
        {String(device.power_status)}
      </div>
    </div>
  </div>
);

const DeviceSummaryPage = () => {
  const { type } = useParams();
  const navigate = useNavigate();
  const deviceStore = useDeviceStore();
  const devices = Array.isArray(deviceStore.devices) ? deviceStore.devices : [];
  const analytics = Array.isArray(deviceStore.analytics)
    ? deviceStore.analytics
    : [];
  const realtimeStatus = Array.isArray(deviceStore.realtimeStatus)
    ? deviceStore.realtimeStatus
    : [];

  // Merge logic (simple version)
  const mergedDevices = useMemo(() => {
    const analyticsMap = new Map(
      analytics.map((a) => [a.device_id || a.id, a])
    );
    const statusMap = new Map(realtimeStatus.map((s) => [s.device_id, s]));
    return devices.map((device) => {
      const analyticsData = analyticsMap.get(device.id) || {};
      const status = statusMap.get(device.id) || {};
      return {
        ...device,
        ...analyticsData,
        ...status,
        device_name:
          device.name || analyticsData.device_name || `Device ${device.id}`,
      };
    });
  }, [devices, analytics, realtimeStatus]);

  const summary = SUMMARY_TYPE_MAP[type] || SUMMARY_TYPE_MAP.total;
  const filteredDevices = mergedDevices.filter(summary.filter);

  return (
    <div className="p-6 min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="flex items-center mb-6">
        <button
          className="mr-4 px-3 py-1 rounded bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-300"
          onClick={() => navigate(-1)}
        >
          Back
        </button>
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
          {summary.title}
        </h2>
      </div>
      {filteredDevices.length === 0 ? (
        <div className="text-center text-gray-500 mt-12">No devices found.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDevices.map((device) => (
            <DeviceCard key={device.device_id || device.id} device={device} />
          ))}
        </div>
      )}
    </div>
  );
};

export default DeviceSummaryPage;
