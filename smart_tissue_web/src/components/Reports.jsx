import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useAuth } from "../hooks/useAuth";
import { useTheme } from "../context/ThemeContext";
import useDeviceStore from "../store/useDeviceStore";
import {
  FileText,
  Download,
  Filter,
  Calendar,
  TrendingUp,
  TrendingDown,
  Activity,
  Clock,
  RefreshCw,
  FileSpreadsheet,
  FilePieChart,
  Printer,
  Share2,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronUp,
  Search,
  Settings,
  DownloadCloud,
  BarChart3,
  PieChart,
  LineChart,
  Smartphone,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Battery,
  Wifi,
  Droplets,
  Shield,
  Database,
  Globe,
  AlertOctagon,
  Users,
  Building,
  MapPin,
  CalendarDays,
  Clock3,
  Zap,
  Power,
  WifiOff,
} from "lucide-react";

const Reports = () => {
  const { accessToken } = useAuth();
  const { theme } = useTheme();
  const [selectedReportType, setSelectedReportType] = useState("device_status");
  const [selectedPeriod, setSelectedPeriod] = useState("weekly");
  const [selectedDevice, setSelectedDevice] = useState("all");
  const [selectedDateRange, setSelectedDateRange] = useState({
    startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    endDate: new Date(),
    label: "Last 7 Days",
  });
  const [generating, setGenerating] = useState(false);
  const [generatedReports, setGeneratedReports] = useState([]);
  const [showReportModal, setShowReportModal] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [activeTab, setActiveTab] = useState("generate");

  // Use the device store
  const deviceStore = useDeviceStore();
  const {
    devices = [],
    analytics = [],
    realtimeStatus = [],
    summaryData,
    loading,
    fetchDevices,
    fetchAllAnalyticsData,
    refreshAllData,
    loadCachedData,
  } = deviceStore;

  // Load cached data on mount for instant UI
  useEffect(() => {
    loadCachedData();
  }, [loadCachedData]);

  // Merge devices with analytics and real-time data
  const mergedDevices = useMemo(() => {
    const devicesArray = Array.isArray(devices) ? devices : [];
    const analyticsArray = Array.isArray(analytics) ? analytics : [];
    const realtimeArray = Array.isArray(realtimeStatus) ? realtimeStatus : [];

    // Create lookup maps
    const analyticsMap = new Map(
      analyticsArray.map((a) => [a.device_id || a.id, a])
    );
    const realtimeMap = new Map(
      realtimeArray.map((r) => [r.device_id || r.id, r])
    );

    // Merge device data
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

  // Fetch data function
  const fetchData = useCallback(async () => {
    if (!accessToken) return;

    try {
      // Fetch devices and analytics data
      await Promise.all([
        fetchDevices(accessToken),
        fetchAllAnalyticsData(accessToken),
      ]);

      console.log("Reports: Data fetched successfully");
    } catch (err) {
      console.error("Reports: Error fetching data:", err);
    }
  }, [accessToken, fetchDevices, fetchAllAnalyticsData]);

  // Load data on mount and when accessToken changes
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Report types configuration
  const reportTypes = [
    {
      key: "device_status",
      title: "Device Status Report",
      description:
        "Comprehensive overview of all device statuses and health metrics",
      icon: Smartphone,
      color: "bg-blue-100 text-blue-600",
    },
    {
      key: "usage_analytics",
      title: "Usage Analytics Report",
      description: "Detailed usage patterns and consumption statistics",
      icon: Activity,
      color: "bg-green-100 text-green-600",
    },
    {
      key: "alert_summary",
      title: "Alert Summary Report",
      description: "Summary of all alerts and issues across devices",
      icon: AlertTriangle,
      color: "bg-orange-100 text-orange-600",
    },
    {
      key: "battery_health",
      title: "Battery Health Report",
      description: "Battery performance and maintenance recommendations",
      icon: Battery,
      color: "bg-purple-100 text-purple-600",
    },
    {
      key: "maintenance_schedule",
      title: "Maintenance Schedule",
      description: "Scheduled maintenance and service recommendations",
      icon: Settings,
      color: "bg-yellow-100 text-yellow-600",
    },
    {
      key: "comprehensive",
      title: "Comprehensive Report",
      description: "Complete system overview with all metrics and insights",
      icon: FileText,
      color: "bg-gray-100 text-gray-600",
    },
  ];

  // Calculate report data based on type
  const calculateReportData = useCallback(
    (reportType) => {
      const filteredDevices =
        selectedDevice === "all"
          ? mergedDevices
          : mergedDevices.filter((d) => d.id === selectedDevice);

      switch (reportType) {
        case "device_status":
          return {
            totalDevices: filteredDevices.length,
            activeDevices: filteredDevices.filter(
              (d) => d.is_active && d.power_status !== "off"
            ).length,
            offlineDevices: filteredDevices.filter(
              (d) => !d.is_active || d.power_status === "off"
            ).length,
            lowBatteryDevices: filteredDevices.filter(
              (d) => d.battery_low === 1
            ).length,
            criticalBatteryDevices: filteredDevices.filter(
              (d) => d.battery_critical === 1
            ).length,
            emptyDevices: filteredDevices.filter(
              (d) => d.current_status === "empty"
            ).length,
            lowDevices: filteredDevices.filter(
              (d) => d.current_status === "low"
            ).length,
            tamperDevices: filteredDevices.filter(
              (d) => d.current_status === "tamper"
            ).length,
            devices: filteredDevices.map((d) => ({
              id: d.id,
              name: d.device_name,
              status: d.is_active ? "Active" : "Inactive",
              battery: d.battery_percentage || 0,
              signal: d.signal_strength || 0,
              lastSeen: d.last_updated,
              room: d.room,
              floor: d.floor,
            })),
          };

        case "usage_analytics":
          const totalUsage = filteredDevices.reduce(
            (sum, d) => sum + (d.total_usage || 0),
            0
          );
          const averageUsage =
            filteredDevices.length > 0
              ? totalUsage / filteredDevices.length
              : 0;
          return {
            totalUsage,
            averageUsage: Math.round(averageUsage),
            todayUsage: filteredDevices.reduce(
              (sum, d) => sum + (d.usage_percentage_today || 0),
              0
            ),
            devices: filteredDevices.map((d) => ({
              id: d.id,
              name: d.device_name,
              totalUsage: d.total_usage || 0,
              todayUsage: d.usage_percentage_today || 0,
              averageDaily: Math.round((d.total_usage || 0) / 30), // Assuming 30 days
              room: d.room,
              floor: d.floor,
            })),
          };

        case "alert_summary":
          const alerts = {
            empty: filteredDevices.filter((d) => d.current_status === "empty")
              .length,
            low: filteredDevices.filter((d) => d.current_status === "low")
              .length,
            tamper: filteredDevices.filter((d) => d.current_status === "tamper")
              .length,
            lowBattery: filteredDevices.filter((d) => d.battery_low === 1)
              .length,
            criticalBattery: filteredDevices.filter(
              (d) => d.battery_critical === 1
            ).length,
            offline: filteredDevices.filter(
              (d) => !d.is_active || d.power_status === "off"
            ).length,
          };
          return {
            totalAlerts: Object.values(alerts).reduce(
              (sum, count) => sum + count,
              0
            ),
            alerts,
            devices: filteredDevices
              .filter(
                (d) =>
                  d.current_status === "empty" ||
                  d.current_status === "low" ||
                  d.current_status === "tamper" ||
                  d.battery_low === 1 ||
                  d.battery_critical === 1 ||
                  !d.is_active
              )
              .map((d) => ({
                id: d.id,
                name: d.device_name,
                alertType:
                  d.current_status === "empty"
                    ? "Empty"
                    : d.current_status === "low"
                    ? "Low"
                    : d.current_status === "tamper"
                    ? "Tamper"
                    : d.battery_critical === 1
                    ? "Critical Battery"
                    : d.battery_low === 1
                    ? "Low Battery"
                    : "Offline",
                severity:
                  d.battery_critical === 1 || d.current_status === "empty"
                    ? "High"
                    : d.battery_low === 1 || d.current_status === "low"
                    ? "Medium"
                    : "Low",
                room: d.room,
                floor: d.floor,
              })),
          };

        case "battery_health":
          const batteryStats = {
            average:
              filteredDevices.reduce(
                (sum, d) => sum + (d.battery_percentage || 0),
                0
              ) / Math.max(filteredDevices.length, 1),
            good: filteredDevices.filter(
              (d) => (d.battery_percentage || 0) > 50
            ).length,
            low: filteredDevices.filter((d) => d.battery_low === 1).length,
            critical: filteredDevices.filter((d) => d.battery_critical === 1)
              .length,
          };
          return {
            ...batteryStats,
            devices: filteredDevices.map((d) => ({
              id: d.id,
              name: d.device_name,
              battery: d.battery_percentage || 0,
              status:
                d.battery_critical === 1
                  ? "Critical"
                  : d.battery_low === 1
                  ? "Low"
                  : (d.battery_percentage || 0) > 50
                  ? "Good"
                  : "Fair",
              lastUpdated: d.last_updated,
              room: d.room,
              floor: d.floor,
            })),
          };

        default:
          return {
            devices: filteredDevices,
            summary: {
              total: filteredDevices.length,
              active: filteredDevices.filter((d) => d.is_active).length,
              alerts: filteredDevices.filter(
                (d) =>
                  d.current_status === "empty" ||
                  d.current_status === "low" ||
                  d.current_status === "tamper" ||
                  d.battery_low === 1 ||
                  d.battery_critical === 1
              ).length,
            },
          };
      }
    },
    [mergedDevices, selectedDevice]
  );

  // Generate report
  const generateReport = async (format = "pdf") => {
    try {
      setGenerating(true);

      const reportData = calculateReportData(selectedReportType);
      const report = {
        id: Date.now(),
        type: selectedReportType,
        period: selectedPeriod,
        device: selectedDevice,
        dateRange: selectedDateRange,
        generatedAt: new Date().toISOString(),
        data: reportData,
        format,
      };

      // Simulate report generation
      await new Promise((resolve) => setTimeout(resolve, 2000));

      setGeneratedReports((prev) => [report, ...prev]);
      setSelectedReport(report);
      setShowReportModal(true);
    } catch (error) {
      console.error("Failed to generate report:", error);
    } finally {
      setGenerating(false);
    }
  };

  // Download report
  const downloadReport = (report, format) => {
    const data = {
      report: report,
      generatedAt: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${report.type}_report_${
      new Date().toISOString().split("T")[0]
    }.${format}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Report type card
  const ReportTypeCard = ({ reportType, isSelected, onClick }) => {
    const Icon = reportType.icon;
    return (
      <div
        onClick={onClick}
        className={`p-6 rounded-lg border-2 cursor-pointer transition-all ${
          isSelected
            ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
            : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
        }`}
      >
        <div className="flex items-center space-x-4">
          <div className={`p-3 rounded-full ${reportType.color}`}>
            <Icon className="h-6 w-6" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              {reportType.title}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {reportType.description}
            </p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="md:flex md:items-center md:justify-between">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 dark:text-white sm:text-3xl">
            Reports
          </h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Generate and manage comprehensive system reports
          </p>
        </div>
        <div className="mt-4 flex space-x-3 md:mt-0 md:ml-4">
          <button
            onClick={() => generateReport()}
            disabled={generating}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
          >
            <FileText className="h-4 w-4 mr-2" />
            {generating ? "Generating..." : "Generate Report"}
          </button>
          <button
            onClick={fetchData}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="-mb-px flex space-x-8 px-6">
            {[
              { key: "generate", label: "Generate Report", icon: FileText },
              { key: "history", label: "Report History", icon: Clock },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                    activeTab === tab.key
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-6">
          {/* Generate Report Tab */}
          {activeTab === "generate" && (
            <div className="space-y-6">
              {/* Filters */}
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                  Report Parameters
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Period Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Time Period
                    </label>
                    <select
                      value={selectedPeriod}
                      onChange={(e) => setSelectedPeriod(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    >
                      <option value="daily">Last 24 Hours</option>
                      <option value="weekly">Last 7 Days</option>
                      <option value="monthly">Last 30 Days</option>
                      <option value="quarterly">Last 3 Months</option>
                      <option value="yearly">Last Year</option>
                    </select>
                  </div>

                  {/* Device Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Device
                    </label>
                    <select
                      value={selectedDevice}
                      onChange={(e) => setSelectedDevice(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    >
                      <option value="all">All Devices</option>
                      {mergedDevices.map((device) => (
                        <option key={device.id} value={device.id}>
                          {device.device_name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Date Range */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Date Range
                    </label>
                    <div className="flex space-x-2">
                      <input
                        type="date"
                        value={
                          selectedDateRange.startDate
                            .toISOString()
                            .split("T")[0]
                        }
                        onChange={(e) =>
                          setSelectedDateRange((prev) => ({
                            ...prev,
                            startDate: new Date(e.target.value),
                          }))
                        }
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      />
                      <input
                        type="date"
                        value={
                          selectedDateRange.endDate.toISOString().split("T")[0]
                        }
                        onChange={(e) =>
                          setSelectedDateRange((prev) => ({
                            ...prev,
                            endDate: new Date(e.target.value),
                          }))
                        }
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Report Types */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                  Select Report Type
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {reportTypes.map((reportType) => (
                    <ReportTypeCard
                      key={reportType.key}
                      reportType={reportType}
                      isSelected={selectedReportType === reportType.key}
                      onClick={() => setSelectedReportType(reportType.key)}
                    />
                  ))}
                </div>
              </div>

              {/* Generate Button */}
              <div className="flex justify-center">
                <button
                  onClick={() => generateReport()}
                  disabled={generating}
                  className="inline-flex items-center px-8 py-3 border border-transparent rounded-md shadow-sm text-lg font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                >
                  <FileText className="h-5 w-5 mr-2" />
                  {generating ? "Generating Report..." : "Generate Report"}
                </button>
              </div>
            </div>
          )}

          {/* Report History Tab */}
          {activeTab === "history" && (
            <div className="space-y-6">
              <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                    Generated Reports
                  </h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Report Type
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Period
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Generated
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                      {generatedReports.map((report) => (
                        <tr
                          key={report.id}
                          className="hover:bg-gray-50 dark:hover:bg-gray-700"
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {reportTypes.find((rt) => rt.key === report.type)
                                ?.title || report.type}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            {report.period}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            {new Date(report.generatedAt).toLocaleString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex space-x-2">
                              <button
                                onClick={() => {
                                  setSelectedReport(report);
                                  setShowReportModal(true);
                                }}
                                className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                              >
                                <Eye className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => downloadReport(report, "json")}
                                className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300"
                              >
                                <Download className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {generatedReports.length === 0 && (
                  <div className="text-center py-12">
                    <FileText className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
                      No reports generated
                    </h3>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      Generate your first report to see it here.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Report Preview Modal */}
      {showReportModal && selectedReport && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white dark:bg-gray-800">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  {reportTypes.find((rt) => rt.key === selectedReport.type)
                    ?.title || selectedReport.type}
                </h3>
                <button
                  onClick={() => setShowReportModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="h-6 w-6" />
                </button>
              </div>

              <div className="max-h-96 overflow-y-auto">
                <pre className="text-sm text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700 p-4 rounded">
                  {JSON.stringify(selectedReport.data, null, 2)}
                </pre>
              </div>

              <div className="mt-6 flex space-x-3">
                <button
                  onClick={() => downloadReport(selectedReport, "json")}
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                >
                  <Download className="h-4 w-4 mr-2 inline" />
                  Download JSON
                </button>
                <button
                  onClick={() => downloadReport(selectedReport, "pdf")}
                  className="flex-1 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
                >
                  <FilePieChart className="h-4 w-4 mr-2 inline" />
                  Download PDF
                </button>
                <button
                  onClick={() => setShowReportModal(false)}
                  className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reports;
