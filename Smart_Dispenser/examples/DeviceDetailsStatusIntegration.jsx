// Simple integration example for device-details.jsx

// 1. Add import at the top
import { useDeviceStore } from "../store/useDeviceStore";

// 2. Add to your component's state extraction
const {
  deviceData,
  analytics,
  timeBasedData,
  summaryData,
  analyticsLoading,
  statusDistribution, // Add this
  distributionLoading, // Add this
  distributionError, // Add this
  fetchDeviceDataById,
  fetchDeviceAnalytics,
  fetchTimeBasedAnalytics,
  fetchSummaryAnalytics,
  fetchDeviceStatusDistribution, // Add this
} = useDeviceStore();

// 3. Add to your loadDeviceData function
const loadDeviceData = useCallback(async () => {
  if (!accessToken || !deviceId) {
    setLoading(false);
    return;
  }

  try {
    setLoading(true);

    // Load all analytics data including status distribution
    await Promise.all([
      fetchDeviceDataById(accessToken, deviceId),
      fetchDeviceAnalytics(accessToken),
      fetchTimeBasedAnalytics(accessToken, "weekly"),
      fetchSummaryAnalytics(accessToken),
      fetchDeviceStatusDistribution(accessToken), // Add this line
    ]);
  } catch (error) {
    console.error("Error loading device data:", error);
  } finally {
    setLoading(false);
  }
}, [
  accessToken,
  deviceId,
  fetchDeviceDataById,
  fetchDeviceAnalytics,
  fetchTimeBasedAnalytics,
  fetchSummaryAnalytics,
  fetchDeviceStatusDistribution, // Add this dependency
]);

// 4. Get device-specific status data
const getDeviceStatusData = () => {
  if (!statusDistribution?.devices || !deviceId) return null;

  return statusDistribution.devices.find(
    (d) => d.device_id === parseInt(deviceId)
  );
};

const deviceStatusData = getDeviceStatusData();

// 5. Add status distribution section to your JSX
return (
  <View style={styles.container}>
    {/* Your existing header */}

    <ScrollView style={styles.scrollView}>
      {/* Your existing content */}

      {/* Status Distribution Section */}
      {deviceStatusData && (
        <View style={styles.detailsCard}>
          <View style={styles.cardHeaderContainer}>
            <MaterialIcons
              name="pie-chart"
              size={24}
              color={themeColors.primary}
            />
            <Text style={styles.cardTitle}>Status Distribution</Text>
          </View>

          {/* Current Status */}
          <View style={styles.statusSection}>
            <Text style={styles.sectionTitle}>Current Status</Text>
            <View
              style={[
                styles.statusBadge,
                {
                  backgroundColor: getStatusColor(
                    deviceStatusData.current_status
                  ),
                },
              ]}
            >
              <Text style={styles.statusText}>
                {deviceStatusData.current_status.toUpperCase()}
              </Text>
            </View>
          </View>

          {/* Status Breakdown */}
          <View style={styles.statusBreakdown}>
            <Text style={styles.sectionTitle}>Historical Distribution</Text>
            {Object.entries(deviceStatusData.status_counts).map(
              ([status, count]) =>
                count > 0 && (
                  <View key={status} style={styles.statusRow}>
                    <View style={styles.statusLeft}>
                      <View
                        style={[
                          styles.statusDot,
                          { backgroundColor: getStatusColor(status) },
                        ]}
                      />
                      <Text style={styles.statusLabel}>
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </Text>
                    </View>
                    <View style={styles.statusRight}>
                      <Text style={styles.statusCount}>{count}</Text>
                      <Text style={styles.statusPercentage}>
                        ({deviceStatusData.status_percentages[status]}%)
                      </Text>
                    </View>
                  </View>
                )
            )}
          </View>

          {/* Recent Activity */}
          <View style={styles.recentActivity}>
            <Text style={styles.sectionTitle}>Recent Activity (24h)</Text>
            <View style={styles.activityRow}>
              <Text style={styles.activityLabel}>Total Entries:</Text>
              <Text style={styles.activityValue}>
                {deviceStatusData.recent_activity.entries_24h}
              </Text>
            </View>
            <View style={styles.activityRow}>
              <Text style={styles.activityLabel}>Alerts:</Text>
              <Text style={styles.activityValue}>
                {deviceStatusData.recent_activity.alerts_24h}
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* Your existing content continues */}
    </ScrollView>
  </View>
);

// 6. Add these helper functions
const getStatusColor = (status) => {
  const colors = {
    critical: "#DC2626",
    tamper: "#EA580C",
    low: "#F59E0B",
    medium: "#3B82F6",
    high: "#10B981",
    normal: "#22C55E",
    inactive: "#6B7280",
  };
  return colors[status] || colors.normal;
};

// 7. Add these styles to your StyleSheet
const additionalStyles = {
  statusSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.heading,
    marginBottom: 12,
  },
  statusBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  statusText: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
  },
  statusBreakdown: {
    marginBottom: 20,
  },
  statusRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border + "20",
  },
  statusLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  statusLabel: {
    fontSize: 14,
    color: colors.text,
    fontWeight: "500",
  },
  statusRight: {
    flexDirection: "row",
    alignItems: "center",
  },
  statusCount: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.heading,
    marginRight: 8,
  },
  statusPercentage: {
    fontSize: 12,
    color: colors.text,
  },
  recentActivity: {
    marginBottom: 20,
  },
  activityRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
  },
  activityLabel: {
    fontSize: 14,
    color: colors.text,
  },
  activityValue: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.heading,
  },
};
