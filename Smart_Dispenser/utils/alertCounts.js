// Utility to get battery and power alert counts from a device list

export function getBatteryAndPowerAlertCounts(devices) {
  let lowBatteryCount = 0;
  let criticalBatteryCount = 0;
  let powerOffCount = 0;

  if (!Array.isArray(devices))
    return {
      lowBatteryCount: 0,
      criticalBatteryCount: 0,
      powerOffCount: 0,
      powerTotalAlertsCount: 0,
    };

  devices.forEach((device) => {
    // Enhanced power off detection logic
    const isPowerOff = (powerStatus) => {
      if (powerStatus === null || powerStatus === undefined) return true;
      const status = String(powerStatus).trim().toLowerCase();
      return ["off", "no", "none", "", "0", "false"].includes(status);
    };

    // Power Off logic
    const powerStatus = device.power_status;
    const deviceIsPowerOff = isPowerOff(powerStatus);

    // Battery logic (not power off)
    const batteryCritical = device.battery_critical === 1;
    const batteryLow = device.battery_low === 1;
    const batteryPercentage =
      typeof device.battery_percentage === "number"
        ? device.battery_percentage
        : null;

    // Battery critical: <= 10%
    const isBatteryCritical =
      !deviceIsPowerOff &&
      (batteryCritical ||
        (batteryPercentage !== null && batteryPercentage <= 10));

    // Battery low: > 10% and <= 20%
    const isBatteryLow =
      !deviceIsPowerOff &&
      (batteryLow ||
        (batteryPercentage !== null &&
          batteryPercentage > 10 &&
          batteryPercentage <= 20));

    if (deviceIsPowerOff) powerOffCount++;
    if (isBatteryCritical) criticalBatteryCount++;
    if (isBatteryLow) lowBatteryCount++;
  });

  return {
    lowBatteryCount,
    criticalBatteryCount,
    powerOffCount,
    powerTotalAlertsCount:
      lowBatteryCount + criticalBatteryCount + powerOffCount,
  };
}

// Utility to get tissue alert counts from a device list
export function getTissueAlertCounts(devices) {
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

    if (isTamper) tamperCount++;
    if (isEmpty) emptyCount++;
    if (isLow) lowCount++;
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
