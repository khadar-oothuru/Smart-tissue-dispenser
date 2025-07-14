import React, { useMemo } from "react";
import DeviceCard from "./DeviceCard";

export default function DevicesList({
  analytics,
  realtimeStatus,
  themeColors,
  summaryData,
  devices,
}) {
  // Merge analytics with real-time and device info
  const mergedDevices = analytics.map((device) => {
    const status = realtimeStatus?.find((s) => s.device_id === device.device_id) || {};
    const deviceInfo = devices?.find((d) => d.id === device.device_id) || {};

    return {
      ...device,
      device_name:
        device.device_name ||
        device.name ||
        deviceInfo.name ||
        status.device_name ||
        `Device ${device.device_id}`,
      name:
        device.name ||
        device.device_name ||
        deviceInfo.name ||
        status.device_name ||
        `Device ${device.device_id}`,
      room_number:
        device.room_number ?? deviceInfo.room_number ?? status.room_number ?? "",
      floor_number:
        device.floor_number ?? deviceInfo.floor_number ?? status.floor_number ?? 0,
      location: device.location || deviceInfo.location || status.location || "",
      description: device.description || deviceInfo.description || status.description || "",
      device_type: device.device_type || deviceInfo.device_type || status.device_type || "dispenser",
      tissue_type: device.tissue_type || deviceInfo.tissue_type || status.tissue_type || "hand_towel",
      meter_capacity:
        device.meter_capacity || deviceInfo.meter_capacity || status.meter_capacity || 500,
      is_active: status.is_active ?? device.is_active ?? false,
      current_status: status.current_status || device.current_status || "unknown",
      current_alert: status.current_alert || device.current_alert,
      current_tamper: status.current_tamper || device.current_tamper || false,
      current_count: status.current_count || device.current_count || 0,
      minutes_since_update: status.minutes_since_update ?? device.minutes_since_update,
      status_priority: status.status_priority ?? device.status_priority ?? -1,
      low_alert_count: device.low_alert_count || 0,
      tamper_count: device.tamper_count || 0,
      total_entries: device.total_entries || 0,
      last_alert_time: device.last_alert_time,
      created_at: device.created_at || deviceInfo.created_at,
      updated_at: device.updated_at || deviceInfo.updated_at,
    };
  });

  // Sort by status priority
  const sortedDevices = useMemo(() => {
    const getDevicePriority = (device) => {
      const status = device.current_status?.toLowerCase() || "unknown";
      switch (status) {
        case "tamper": return 100;
        case "empty": return 90;
        case "low": return 80;
        case "full": return 70;
        case "normal":
        case "active":
        case "online": return 30;
        case "inactive":
        case "offline":
        case "disconnected": return 10;
        default:
          if (device.is_active === true) return 25;
          if (device.is_active === false) return 5;
          return 1;
      }
    };

    return [...mergedDevices].sort((a, b) => {
      const aPriority = getDevicePriority(a);
      const bPriority = getDevicePriority(b);
      if (aPriority !== bPriority) return bPriority - aPriority;

      const aTime = a.minutes_since_update || 0;
      const bTime = b.minutes_since_update || 0;
      if (aTime !== bTime) return aTime - bTime;

      const totalAlertsA = (a.low_alert_count || 0) + (a.tamper_count || 0);
      const totalAlertsB = (b.low_alert_count || 0) + (b.tamper_count || 0);
      return totalAlertsB - totalAlertsA;
    });
  }, [mergedDevices]);

  return (
    <div className="w-full p-4">
      <div className="flex justify-between items-center px-4 mb-4">
        <h2 className="text-xl font-bold text-gray-800">Device Overview</h2>
        {summaryData?.summary?.total_devices && (
          <span className="text-sm text-gray-600">
            {summaryData.summary.total_devices} Total
          </span>
        )}
      </div>

      {sortedDevices.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {sortedDevices.map((device, index) => (
            <DeviceCard key={device.device_id} device={device} index={index} />
          ))}
        </div>
      ) : (
        <div className="p-10 text-center">
          <p className="text-gray-500 text-lg">No devices found</p>
        </div>
      )}
    </div>
  );
}
