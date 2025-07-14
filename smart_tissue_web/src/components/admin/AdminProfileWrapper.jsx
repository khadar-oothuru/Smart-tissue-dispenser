import React from "react";
import { useAuth } from "../../hooks/useAuth";
import { useTheme } from "../../context/ThemeContext";

const AdminProfile = React.lazy(() => import("../Profile/AdminProfile"));

const AdminProfileWrapper = () => {
  // You can fetch admin profile data here if needed
  // For now, just render the component
  return (
    <React.Suspense fallback={<div>Loading...</div>}>
      <AdminProfile />
    </React.Suspense>
  );
};

export default AdminProfileWrapper;
