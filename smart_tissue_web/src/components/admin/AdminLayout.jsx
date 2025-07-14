import { useEffect, useState } from "react";
import { useWebSocketContext } from "../../context/WebSocketContext";
import NotificationsScreen from "../Notifications/Notifications";
import NotificationIcon from "../Notifications/NotificationIcon";

import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { useTheme } from "../../context/ThemeContext";
// import ThemeToggle from "../ThemeToggle";
import {
  Home,
  Smartphone,
  BarChart3,
  FileText,
  Settings,
  Menu,
  X,
  LogOut,
  User,
  Shield,
  Users,
  ChevronRight,
  Contact,
  Bell,
  CheckCircle,
  XCircle,
} from "lucide-react";

const AdminLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  // const [showNotifications, setShowNotifications] = useState(false);
  const location = useLocation();
  const { user, logout } = useAuth();
  const { theme } = useTheme();
  const { isConnected } = useWebSocketContext();
  const navigate = useNavigate();

  const navigation = [
    {
      name: "Dashboard",
      href: "/admin",
      icon: Home,
      description: "Overview & stats",
    },
    {
      name: "Devices",
      href: "/admin/devices",
      icon: Smartphone,
      description: "Device management",
    },
    {
      name: "Analytics",
      href: "/admin/analytics",
      icon: BarChart3,
      description: "Data insights",
    },
    {
      name: "Logs",
      href: "/admin/logs",
      icon: FileText,
      description: "Reports & logs",
    },

    {
      name: "Help & Support",
      href: "/admin/contact",
      icon: Contact,
      description: "Contact form here ",
    },
    {
      name: "Users",
      href: "/admin/users",
      icon: Users,
      description: "Manage users",
    },
    {
      name: "Profile",
      href: "/admin/profile",
      icon: User,
      description: "Profile settings",
    },
  ];

  const handleLogout = async () => {
    await logout();
  };

  const isActive = (href) => location.pathname === href;
  const currentPage =
    navigation.find((item) => item.href === location.pathname) || navigation[0];

  return (
    <div
      className="flex h-screen overflow-hidden"
      style={{ backgroundColor: "var(--color-background)" }}
    >
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 block lg:hidden">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm animate-fadeIn"
            onClick={() => setSidebarOpen(false)}
          />
          <div className="fixed top-0 left-0 bottom-0 w-[280px] max-w-[85vw] bg-[var(--color-surface)] border-r border-[var(--color-border)] shadow-2xl animate-slideIn z-[51] overflow-y-auto flex flex-col">
            <SidebarContent
              navigation={navigation}
              isActive={isActive}
              user={user}
              handleLogout={handleLogout}
              onNavigate={() => setSidebarOpen(false)}
              showCloseButton
              onClose={() => setSidebarOpen(false)}
            />
          </div>
        </div>
      )}

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:flex-col w-[280px] bg-[var(--color-surface)] border-r border-[var(--color-border)] flex-shrink-0">
        <SidebarContent
          navigation={navigation}
          isActive={isActive}
          user={user}
          handleLogout={handleLogout}
        />
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Top Header */}
        <header className="flex items-center justify-between px-6 h-16 bg-[var(--color-surface)] border-b border-[var(--color-border)] flex-shrink-0">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden flex items-center justify-center w-10 h-10 bg-[var(--color-background)] border border-[var(--color-border)] rounded-lg cursor-pointer transition-all duration-300 hover:bg-[var(--color-primary)] hover:text-white hover:border-[var(--color-primary)]"
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </button>

            <div>
              <h1 className="text-xl font-bold text-[var(--color-heading)]">
                {currentPage.name}
              </h1>
              <p className="text-sm text-[var(--color-muted)]">
                {currentPage.description}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-6 pr-8">
            {/* WebSocket Connection Status Icon */}
            <div
              className="flex items-center"
              title={isConnected ? "WebSocket Live" : "WebSocket Offline"}
            >
              <span
                className={`px-3 py-1 rounded-full text-xs font-semibold select-none shadow-sm border transition-colors duration-200 ${
                  isConnected
                    ? "bg-green-100 text-green-700 border-green-400"
                    : "bg-red-100 text-red-700 border-red-400"
                }`}
              >
                {isConnected ? "Live" : "Offline"}
              </span>
            </div>
            {/* Notification Icon with unread count */}
            <div className="hidden sm:flex items-center justify-center w-11 h-11 relative">
              <NotificationIcon
                color={theme === "dark" ? "#fff" : "#333"}
                hoverColor={
                  getComputedStyle(document.documentElement).getPropertyValue(
                    "--color-primary"
                  ) || "#007bff"
                }
                onClick={() => navigate("/admin/notifications")}
                disableNavigate={true}
              />
            </div>

            <div className="hidden sm:block text-right">
              <button
                type="button"
                className="flex items-center gap-2 justify-end px-5 py-2 rounded-lg bg-[var(--color-primary)] text-white text-lg font-extrabold shadow hover:opacity-90 active:scale-95 active:bg-[var(--color-primary)]/80 transition-all duration-200 cursor-pointer select-none"
                style={{ outline: "none", border: "none" }}
                tabIndex={0}
                onClick={() => {}}
              >
                <span
                  role="img"
                  aria-label="Hi"
                  className="text-xl animate-wave"
                >
                  👋
                </span>
                {user?.first_name || user?.last_name
                  ? `Hi, ${user?.first_name || ""}${
                      user?.last_name ? " " + user.last_name : ""
                    }`
                  : user?.username
                  ? `Hi, ${user.username}`
                  : "Hi, Admin"}
              </button>
            </div>

            {/* Profile Image with Primary Background */}
            <div className="relative">
              {user?.profile_picture ? (
                <img
                  src={user.profile_picture}
                  alt="Profile"
                  className="w-14 h-14 rounded-full object-cover border-2 border-[var(--color-primary)] bg-[var(--color-primary)]"
                />
              ) : (
                <div className="w-14 h-14 rounded-full flex items-center justify-center bg-[var(--color-primary)]">
                  <User className="h-7 w-7 text-white" />
                </div>
              )}
            </div>
          </div>

          {/* Notifications Drawer/Modal removed: now handled by route */}
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="p-6">{children}</div>
        </main>
      </div>
    </div>
  );
};

// Sidebar Component
const SidebarContent = ({
  navigation,
  isActive,
  user,
  handleLogout,
  onNavigate,
  showCloseButton,
  onClose,
}) => {
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-6 h-16 border-b border-[var(--color-border)] flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[var(--color-primary)] rounded-xl flex items-center justify-center">
            <Shield className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-[var(--color-heading)]">
              Smart Tissue
            </h1>
            <p className="text-xs text-[var(--color-muted)]">Admin Panel</p>
          </div>
        </div>
        {showCloseButton && (
          <button
            onClick={onClose}
            className="flex items-center justify-center w-8 h-8 rounded-lg hover:bg-[var(--color-background)] transition-colors"
            aria-label="Close menu"
          >
            <X className="h-5 w-5 text-[var(--color-text)]" />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-5 overflow-y-auto">
        <div className="flex flex-col gap-4">
          {navigation.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link
                key={item.name}
                to={item.href}
                onClick={onNavigate}
                className={`
                  flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200
                  ${
                    active
                      ? "backdrop-blur-md border border-[var(--color-primary)] shadow-lg text-[var(--color-heading)]"
                      : "hover:bg-[rgba(0,0,0,0.04)] hover:backdrop-blur-sm text-[var(--color-heading)]"
                  }
                `}
              >
                <Icon
                  className={`h-5 w-5 flex-shrink-0 ${
                    active
                      ? "text-[var(--color-primary)]"
                      : "text-[var(--color-muted)]"
                  }`}
                />
                <div className="flex-1 min-w-0">
                  <p
                    className={`text-sm font-medium ${
                      active
                        ? "text-[var(--color-heading)]"
                        : "text-[var(--color-heading)]"
                    }`}
                  >
                    {item.name}
                  </p>
                  <p
                    className={`text-xs ${
                      active
                        ? "text-[var(--color-primary)]/80"
                        : "text-[var(--color-muted)]"
                    }`}
                  >
                    {item.description}
                  </p>
                </div>
                {active && (
                  <ChevronRight className="h-4 w-4 text-[var(--color-primary)] flex-shrink-0" />
                )}
              </Link>
            );
          })}
        </div>

        {/* Theme Toggle */}
        {/* <div className="mt-8 flex justify-center">
          <ThemeToggle />
        </div> */}
      </nav>

      {/* Footer - Only Sign Out Button */}
      <div className="px-4 py-4 border-t border-[var(--color-border)]">
        <div className="flex items-center justify-center gap-2 my-4 text-[var(--color-muted)] text-xs font-semibold">
          <Shield className="h-4 w-4 text-[var(--color-primary)]" />
          <span>Brought by Jivaass Technologies</span>
        </div>

        <button
          onClick={handleLogout}
          className="flex items-center justify-center gap-2 w-full py-2.5 px-4 bg-red-500 hover:bg-red-600 rounded-lg text-white text-sm font-medium cursor-pointer transition-all duration-200"
        >
          <LogOut className="h-4 w-4" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );
};

export default AdminLayout;
