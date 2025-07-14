import ChangePassword from "./components/auth/ChangePassword";
import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import { ToastProvider } from "./components/common/Toast";
import AdminLayout from "./components/admin/AdminLayout";
import NotificationsScreen from "./components/Notifications/Notifications";
import "./styles/theme.css";

// Auth Components
import Login from "./components/auth/Login";
import Register from "./components/auth/Register";
import ForgotPassword from "./components/auth/ForgotPassword";
import ProtectedRoute from "./components/common/ProtectedRoute";
import RootRedirect from "./components/common/RootRedirect";
import AccessDenied from "./components/common/AccessDenied";

// Admin Components
import AdminDashboard from "./components/admin/AdminDashboard";
import AlertDevicesScreen from "./components/Landingpage/AlertDevicesScreen";
import { BatteryAlertsScreen } from "./components/Landingpage";
import AdminProfile from "./components/Profile/AdminProfile";
import DeviceDetails from "./components/Landingpage/device-details";

import UserManagement from "./components/admin/UserManagement";
import AppLogs from "./components/Report/AppLogs";
import PowerOffDevicesScreen from "./components/Landingpage/PowerOffDevicesScreen";

// Page Components
import Devices from "./components/Devices";
import Analytics from "./components/AnalyticsPages/Analytics";
// import Reports from "./components/Reports";
import Settings from "./components/Settings";
import DeviceSummaryPage from "./components/Devices/DeviceSummaryPage";
import Contact from "./components/admin/Contact";
import { WebSocketProvider } from "./context/WebSocketContext";

import { useAuth } from "./hooks/useAuth";

const AdminOnlyRoute = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (user?.role !== "admin") return <AccessDenied />;
  return children;
};

const App = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ToastProvider>
          <WebSocketProvider>
            <Router>
              <Routes>
                {/* Public Routes */}
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                {/* Protected Admin Routes - All routes use AdminLayout, only admin can access */}
                <Route path="/" element={<RootRedirect />} />
                <Route
                  path="/admin"
                  element={
                    <AdminOnlyRoute>
                      <AdminLayout>
                        <AdminDashboard />
                      </AdminLayout>
                    </AdminOnlyRoute>
                  }
                />
                <Route
                  path="/admin/alert-devices/:alertType?"
                  element={
                    <AdminOnlyRoute>
                      <AdminLayout>
                        <AlertDevicesScreen />
                      </AdminLayout>
                    </AdminOnlyRoute>
                  }
                />
                <Route
                  path="/admin/device-details"
                  element={
                    <AdminOnlyRoute>
                      <AdminLayout>
                        <DeviceDetails />
                      </AdminLayout>
                    </AdminOnlyRoute>
                  }
                />
                <Route
                  path="/admin/users"
                  element={
                    <AdminOnlyRoute>
                      <AdminLayout>
                        <UserManagement />
                      </AdminLayout>
                    </AdminOnlyRoute>
                  }
                />
                <Route
                  path="/admin/devices"
                  element={
                    <AdminOnlyRoute>
                      <AdminLayout>
                        <Devices />
                      </AdminLayout>
                    </AdminOnlyRoute>
                  }
                />
                <Route
                  path="/admin/devices/summary/:type"
                  element={
                    <AdminOnlyRoute>
                      <AdminLayout>
                        <DeviceSummaryPage />
                      </AdminLayout>
                    </AdminOnlyRoute>
                  }
                />
                <Route
                  path="/admin/analytics"
                  element={
                    <AdminOnlyRoute>
                      <AdminLayout>
                        <Analytics />
                      </AdminLayout>
                    </AdminOnlyRoute>
                  }
                />
                <Route
                  path="/admin/logs"
                  element={
                    <AdminOnlyRoute>
                      <AdminLayout>
                        <AppLogs />
                      </AdminLayout>
                    </AdminOnlyRoute>
                  }
                />
                <Route
                  path="/admin/power-off-devices"
                  element={
                    <AdminOnlyRoute>
                      <AdminLayout>
                        <PowerOffDevicesScreen />
                      </AdminLayout>
                    </AdminOnlyRoute>
                  }
                />
                <Route
                  path="/admin/battery-alerts/:alertType?"
                  element={
                    <AdminOnlyRoute>
                      <AdminLayout>
                        <BatteryAlertsScreen />
                      </AdminLayout>
                    </AdminOnlyRoute>
                  }
                />
                <Route
                  path="/admin/settings"
                  element={
                    <AdminOnlyRoute>
                      <AdminLayout>
                        <Settings />
                      </AdminLayout>
                    </AdminOnlyRoute>
                  }
                />
                <Route
                  path="/admin/profile"
                  element={
                    <AdminOnlyRoute>
                      <AdminLayout>
                        <AdminProfile />
                      </AdminLayout>
                    </AdminOnlyRoute>
                  }
                />
                <Route
                  path="/admin/notifications"
                  element={
                    <AdminOnlyRoute>
                      <AdminLayout>
                        <NotificationsScreen />
                      </AdminLayout>
                    </AdminOnlyRoute>
                  }
                />
                {/* Change Password (all authenticated users) */}
                <Route
                  path="/change-password"
                  element={
                    <ProtectedRoute>
                      <ChangePassword />
                    </ProtectedRoute>
                  }
                />
                {/* Admin Contact (Help & Support) */}
                <Route
                  path="/admin/contact"
                  element={
                    <AdminOnlyRoute>
                      <AdminLayout>
                        <Contact />
                      </AdminLayout>
                    </AdminOnlyRoute>
                  }
                />
                {/* (Optional) Keep /contact route for non-admin use, or remove if not needed */}
                <Route
                  path="/contact"
                  element={
                    <ProtectedRoute>
                      <Contact />
                    </ProtectedRoute>
                  }
                />
                {/* Catch all route - redirect to admin dashboard */}
                <Route path="*" element={<Navigate to="/admin" replace />} />
              </Routes>
            </Router>
          </WebSocketProvider>
        </ToastProvider>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;
