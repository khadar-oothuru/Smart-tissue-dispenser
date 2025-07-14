import React from "react";
import { useAuth } from "../../hooks/useAuth";
import { useNavigate } from "react-router-dom";

const AccessDenied = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "100vh",
        background: "linear-gradient(135deg, #f8fafc 0%, #e0e7ef 100%)",
        color: "var(--color-heading, #222)",
        fontFamily: "inherit",
        padding: 24,
      }}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: 18,
          boxShadow: "0 8px 32px rgba(60,60,90,0.10)",
          padding: "48px 36px 36px 36px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          minWidth: 340,
          maxWidth: 400,
        }}
      >
        <svg
          width="64"
          height="64"
          viewBox="0 0 24 24"
          fill="none"
          style={{ marginBottom: 18 }}
        >
          <circle cx="12" cy="12" r="12" fill="#f87171" fillOpacity="0.15" />
          <path
            d="M9.17 9.17a3 3 0 0 1 5.66 0m-7.07 7.07a8 8 0 1 1 11.32 0m-11.32 0A8 8 0 0 1 12 4a8 8 0 0 1 5.66 12.24m-11.32 0L12 20l5.66-3.76"
            stroke="#ef4444"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <h1
          style={{
            fontSize: 32,
            fontWeight: 700,
            marginBottom: 10,
            color: "#ef4444",
            letterSpacing: 0.5,
          }}
        >
          Access Denied
        </h1>
        <p
          style={{
            fontSize: 18,
            color: "#555",
            marginBottom: 28,
            textAlign: "center",
          }}
        >
          You do not have permission to access this web app.
          <br />
          Please contact your administrator if you believe this is a mistake.
        </p>
        <button
          onClick={handleLogout}
          style={{
            background: "#ef4444",
            color: "#fff",
            border: "none",
            borderRadius: 8,
            padding: "12px 32px",
            fontSize: 16,
            fontWeight: 600,
            cursor: "pointer",
            boxShadow: "0 2px 8px rgba(239,68,68,0.10)",
            transition: "background 0.2s, transform 0.1s",
          }}
          onMouseOver={(e) => (e.currentTarget.style.background = "#dc2626")}
          onMouseOut={(e) => (e.currentTarget.style.background = "#ef4444")}
        >
          Logout
        </button>
      </div>
    </div>
  );
};

export default AccessDenied;
