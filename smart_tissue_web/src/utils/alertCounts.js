// Import utility functions from LandingPageTop
import { getBatteryAndPowerAlertCounts, getTissueAlertCounts } from "../components/AdminDashboard/LandingPageTop";

// Re-export for backward compatibility
export { getBatteryAndPowerAlertCounts, getTissueAlertCounts };

// This function is kept for reference but should be removed in future updates
function _getBatteryAndPowerAlertCounts(devices) {
  let lowBatteryCount = 0;
  let criticalBatteryCount = 0;
  let batteryOffCount = 0;
  let noPowerCount = 0; // New: devices with pwr_sts = "no"
  let powerOffCount = 0;

  if (!Array.isArray(devices))
    return {
      lowBatteryCount: 0,
      criticalBatteryCount: 0,
      batteryOffCount: 0,
      noPowerCount: 0,
      powerOffCount: 0,
      powerTotalAlertsCount: 0,
    };

  devices.forEach((device) => {
    // Enhanced power status detection logic
    const isNoPower = (powerStatus) => {
      if (powerStatus === null || powerStatus === undefined) return false;
      const status = String(powerStatus).trim().toLowerCase();
      return status === "no"; // Specifically check for "no"
    };

    const isPowerOff = (powerStatus) => {
      if (powerStatus === null || powerStatus === undefined) return false;
      const status = String(powerStatus).trim().toLowerCase();
      return ["off", "none", "0", "false"].includes(status);
    };

    // Power status logic
    const powerStatus = device.power_status;
    const deviceIsNoPower = isNoPower(powerStatus);
    const deviceIsPowerOff = isPowerOff(powerStatus);

    // Battery logic
    const batteryCritical = device.battery_critical === 1;
    const batteryLow = device.battery_low === 1;
    const batteryOff = device.battery_off === 1;
    const batteryPercentage =
      typeof device.battery_percentage === "number"
        ? device.battery_percentage
        : null;

    // Battery off: percentage is exactly 0 (not null)
    const isBatteryOff = batteryOff || batteryPercentage === 0;

    // Battery critical: <= 10% (but not 0)
    const isBatteryCritical =
      !isBatteryOff &&
      (batteryCritical ||
        (batteryPercentage !== null &&
          batteryPercentage <= 10 &&
          batteryPercentage > 0));

    // Battery low: > 10% and <= 20%
    const isBatteryLow =
      !isBatteryOff &&
      !isBatteryCritical &&
      (batteryLow ||
        (batteryPercentage !== null &&
          batteryPercentage > 10 &&
          batteryPercentage <= 20));

    // Count different statuses
    if (deviceIsNoPower) noPowerCount++;
    if (deviceIsPowerOff) powerOffCount++;
    if (isBatteryOff) batteryOffCount++;
    if (isBatteryCritical) criticalBatteryCount++;
    if (isBatteryLow) lowBatteryCount++;
  });

  return {
    lowBatteryCount,
    criticalBatteryCount,
    batteryOffCount,
    noPowerCount, // New field
    powerOffCount,
    // Only include actual battery-related alerts, exclude "no power" and "power off" as they are power supply issues
    powerTotalAlertsCount:
      lowBatteryCount + criticalBatteryCount + batteryOffCount,
  };
}

// This function is kept for reference but should be removed in future updates
function _getTissueAlertCounts(devices) {
  let emptyCount = 0;
  let lowCount = 0;
  let fullCount = 0;
  let tamperCount = 0;

  if (!Array.isArray(devices))
    return {
      emptyCount: 0,
      lowCount: 0,
      fullCount: 0,
      tamperCount: 0,
      totalTissueAlerts: 0,
    };

  devices.forEach((device) => {
    // Tissue alerts based on current_status and current_alert
    const status = (device.current_status || "").toLowerCase();
    const alert = (device.current_alert || "").toUpperCase();

    // Check for tamper alerts
    const isTamper =
      device.current_tamper === true ||
      (device.tamper_count && device.tamper_count > 0);

    // Check for tissue status alerts
    const isEmpty = status === "empty" || alert === "EMPTY";
    const isLow = status === "low" || alert === "LOW";
    const isFull = status === "full" || alert === "FULL";

    // Check for battery alert state (should match battery util logic)
    const batteryCritical = device.battery_critical === 1;
    const batteryLow = device.battery_low === 1;
    const batteryOff = device.battery_off === 1;
    const batteryPercentage =
      typeof device.battery_percentage === "number"
        ? device.battery_percentage
        : null;
    const isBatteryOff = batteryOff || batteryPercentage === 0;
    const isBatteryCritical =
      !isBatteryOff &&
      (batteryCritical ||
        (batteryPercentage !== null &&
          batteryPercentage <= 10 &&
          batteryPercentage > 0));
    const isBatteryLow =
      !isBatteryOff &&
      !isBatteryCritical &&
      (batteryLow ||
        (batteryPercentage !== null &&
          batteryPercentage > 10 &&
          batteryPercentage <= 20));

    // Tamper always counted
    if (isTamper) tamperCount++;
    // Empty should be counted regardless of battery state
    if (isEmpty) emptyCount++;
    // Low should only be counted if not in a battery alert state
    if (isLow && !isBatteryOff && !isBatteryCritical && !isBatteryLow)
      lowCount++;
    if (isFull) fullCount++;
  });

  return {
    emptyCount,
    lowCount,
    fullCount,
    tamperCount,
    totalTissueAlerts: emptyCount + lowCount + tamperCount, // Don't include full as an alert
  };
}

// Combined utility to get all alert counts
export function getAllAlertCounts(devices) {
  const batteryCounts = getBatteryAndPowerAlertCounts(devices);
  const tissueCounts = getTissueAlertCounts(devices);

  return {
    ...batteryCounts,
    ...tissueCounts,
    totalAlerts:
      batteryCounts.powerTotalAlertsCount + tissueCounts.totalTissueAlerts,
  };
}
