import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Eye,
  EyeOff,
  ArrowLeft,
  Check,
  X,
  Shield,
  Lock,
  Loader2,
} from "lucide-react";
import OTPModal from "../Profile/OtpModal";
import { CustomAlert } from "../../components/common/CustomAlert";
import { useTheme } from "../../hooks/useThemeContext";
import { useAuth } from "../../hooks/useAuth";
import {
  changePasswordWithOTP,
  sendPasswordChangeOTP,
  verifyPasswordChangeOTP,
} from "../../services/api";

import resetimg from "../../assets/images/Reset password-amico.png";

export default function ChangePassword() {
  const navigate = useNavigate();
  const { themeColors, isDark } = useTheme();
  const auth = useAuth();
  const { user } = auth;
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [timer, setTimer] = useState(0);

  // Custom Alert states
  const [alertConfig, setAlertConfig] = useState({
    visible: false,
    type: "error",
    title: "",
    message: "",
    primaryAction: null,
    secondaryAction: null,
  });

  useEffect(() => {
    let interval;
    if (timer > 0 && showOtpModal) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timer, showOtpModal]);

  // Custom alert functions
  const showAlert = useCallback((config) => {
    setAlertConfig({
      visible: true,
      ...config,
    });
  }, []);

  const hideAlert = useCallback(() => {
    setAlertConfig({
      visible: false,
      type: "error",
      title: "",
      message: "",
      primaryAction: null,
      secondaryAction: null,
    });
  }, []);

  const showCustomAlert = (title, message, type = "error", action = null) => {
    showAlert({
      type,
      title,
      message,
      primaryAction: action
        ? {
            text: "OK",
            onPress: () => {
              hideAlert();
              action();
            },
          }
        : {
            text: "OK",
            onPress: hideAlert,
          },
      secondaryAction: null,
    });
  };

  const validatePasswords = () => {
    if (!oldPassword || !newPassword || !confirmPassword) {
      showCustomAlert("Missing Fields", "Please fill all fields", "warning");
      return false;
    }
    if (newPassword.length < 8) {
      showCustomAlert(
        "Invalid Password",
        "New password must be at least 8 characters",
        "error"
      );
      return false;
    }
    if (newPassword !== confirmPassword) {
      showCustomAlert(
        "Password Mismatch",
        "New passwords do not match",
        "error"
      );
      return false;
    }
    if (oldPassword === newPassword) {
      showCustomAlert(
        "Invalid Password",
        "New password must be different from old password",
        "warning"
      );
      return false;
    }
    return true;
  };

  const handleSendOTP = async () => {
    if (!validatePasswords()) return;

    setLoading(true);
    try {
      const token = localStorage.getItem("accessToken");
      await sendPasswordChangeOTP(token);
      setShowOtpModal(true);
      setTimer(600); // 10 minutes
    } catch (error) {
      showCustomAlert(
        "OTP Failed",
        error.message || "Failed to send OTP",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setOtpLoading(true);
    try {
      const token = localStorage.getItem("accessToken");
      await sendPasswordChangeOTP(token);
      showCustomAlert("OTP Sent", "New OTP sent to your email", "success");
      setTimer(600);
    } catch (error) {
      showCustomAlert(
        "Resend Failed",
        error.message || "Failed to resend OTP",
        "error"
      );
    } finally {
      setOtpLoading(false);
    }
  };

  const handleVerifyOtp = async (enteredOtp) => {
    setOtpLoading(true);
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) throw new Error("User not authenticated");

      await verifyPasswordChangeOTP(token, enteredOtp);
      await changePasswordWithOTP(token, oldPassword, newPassword, enteredOtp);

      showCustomAlert(
        "Success",
        "Password changed successfully",
        "success",
        () => {
          setShowOtpModal(false);
          navigate(-1);
        }
      );
    } catch (error) {
      showCustomAlert(
        "Verification Failed",
        error.message || "Failed to verify OTP or change password",
        "error"
      );
    } finally {
      setOtpLoading(false);
    }
  };

  const requirementsMet = {
    length: newPassword.length >= 8,
    different: newPassword !== oldPassword && newPassword.length > 0,
    match: newPassword === confirmPassword && newPassword.length > 0,
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center bg-no-repeat bg-cover bg-center w-full"
      style={{
        background:
          themeColors.bg ||
          "linear-gradient(135deg, #23272b 60%, #181c1f 100%)",
      }}
    >
      {/* Back Button - Floating */}
      <button
        onClick={() => navigate(-1)}
        className="fixed top-6 left-6 p-3 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl z-50"
        style={{
          background: themeColors.cardGlassBg || "rgba(24,28,31,0.65)",
          border: `1.5px solid ${
            themeColors.cardBorder || "rgba(255,255,255,0.18)"
          }`,
          backdropFilter: "blur(18px)",
          WebkitBackdropFilter: "blur(18px)",
        }}
      >
        <ArrowLeft className="w-6 h-6" style={{ color: themeColors.primary }} />
      </button>

      <div
        className="flex flex-row w-full max-w-6xl min-w-[700px] rounded-3xl overflow-hidden shadow-2xl mx-auto"
        style={{
          background:
            themeColors.cardGlassBg ||
            "linear-gradient(135deg, rgba(24,28,31,0.65) 60%, rgba(35,39,43,0.55) 100%)",
          border: `1.5px solid ${
            themeColors.cardBorder || "rgba(255,255,255,0.18)"
          }`,
          boxShadow: "0 8px 32px 0 rgba(31, 38, 135, 0.15)",
          WebkitBackdropFilter: "blur(18px)",
          backdropFilter: "blur(18px)",
          maxHeight: "720px",
          minHeight: "400px",
        }}
      >
        {/* Left: Form */}
        <div className="flex-1 flex flex-col items-center justify-center px-10 py-10">
          <div
            className="w-full max-w-md mx-auto pb-2 flex flex-col items-center"
            style={{ paddingTop: 0, paddingBottom: 0 }}
          >
            <div className="flex items-center gap-3 mb-4 justify-center w-full">
              <div
                className="p-3 rounded-xl flex items-center justify-center"
                style={{
                  background: themeColors.primaryBg || "rgba(124,58,237,0.1)",
                }}
              >
                <Lock
                  className="w-8 h-8"
                  style={{ color: themeColors.primary }}
                />
              </div>
              <h2
                className="text-4xl font-extrabold text-center tracking-tight"
                style={{ color: themeColors.primary, letterSpacing: 1 }}
              >
                Change Password
              </h2>
            </div>
            <p
              className="text-center mb-8 text-base"
              style={{ color: themeColors.text, opacity: 0.7 }}
            >
              Keep your account secure with a strong password
            </p>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendOTP();
              }}
              className="flex flex-col gap-0 mt-2 items-center w-full"
            >
              {/* Current Password */}
              <div className="w-full mb-6">
                <label
                  htmlFor="oldPassword"
                  className="block text-sm font-semibold mb-2"
                  style={{ color: themeColors.text }}
                >
                  Current Password
                </label>
                <div
                  className="flex items-center px-4 py-3 rounded-xl border-2 transition-all duration-200 bg-opacity-80"
                  style={{
                    borderColor: themeColors.cardBorder,
                    background: themeColors.inputBg,
                  }}
                >
                  <Lock
                    className="w-5 h-5 mr-3"
                    style={{ color: themeColors.primary }}
                  />
                  <input
                    id="oldPassword"
                    type={showOldPassword ? "text" : "password"}
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    placeholder="Enter current password"
                    disabled={loading}
                    className="flex-1 bg-transparent outline-none text-base font-medium"
                    style={{ color: themeColors.text }}
                  />
                  <button
                    type="button"
                    className="ml-2"
                    onClick={() => setShowOldPassword(!showOldPassword)}
                    tabIndex={-1}
                  >
                    {showOldPassword ? (
                      <Eye className="w-5 h-5 text-gray-400" />
                    ) : (
                      <EyeOff className="w-5 h-5 text-gray-400" />
                    )}
                  </button>
                </div>
              </div>

              {/* New Password */}
              <div className="w-full mb-6">
                <label
                  htmlFor="newPassword"
                  className="block text-sm font-semibold mb-2"
                  style={{ color: themeColors.text }}
                >
                  New Password
                </label>
                <div
                  className="flex items-center px-4 py-3 rounded-xl border-2 transition-all duration-200 bg-opacity-80"
                  style={{
                    borderColor: themeColors.cardBorder,
                    background: themeColors.inputBg,
                  }}
                >
                  <Lock
                    className="w-5 h-5 mr-3"
                    style={{ color: themeColors.primary }}
                  />
                  <input
                    id="newPassword"
                    type={showNewPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                    disabled={loading}
                    className="flex-1 bg-transparent outline-none text-base font-medium"
                    style={{ color: themeColors.text }}
                  />
                  <button
                    type="button"
                    className="ml-2"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    tabIndex={-1}
                  >
                    {showNewPassword ? (
                      <Eye className="w-5 h-5 text-gray-400" />
                    ) : (
                      <EyeOff className="w-5 h-5 text-gray-400" />
                    )}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div className="w-full mb-6">
                <label
                  htmlFor="confirmPassword"
                  className="block text-sm font-semibold mb-2"
                  style={{ color: themeColors.text }}
                >
                  Confirm New Password
                </label>
                <div
                  className="flex items-center px-4 py-3 rounded-xl border-2 transition-all duration-200 bg-opacity-80"
                  style={{
                    borderColor: themeColors.cardBorder,
                    background: themeColors.inputBg,
                  }}
                >
                  <Lock
                    className="w-5 h-5 mr-3"
                    style={{ color: themeColors.primary }}
                  />
                  <input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                    disabled={loading}
                    className="flex-1 bg-transparent outline-none text-base font-medium"
                    style={{ color: themeColors.text }}
                  />
                  <button
                    type="button"
                    className="ml-2"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    tabIndex={-1}
                  >
                    {showConfirmPassword ? (
                      <Eye className="w-5 h-5 text-gray-400" />
                    ) : (
                      <EyeOff className="w-5 h-5 text-gray-400" />
                    )}
                  </button>
                </div>
              </div>

              {/* Requirements */}
              <div
                className="rounded-xl p-2 border mb-4 w-full"
                style={{
                  background: isDark
                    ? "rgba(124,58,237,0.05)"
                    : "rgba(124,58,237,0.03)",
                  borderColor: isDark
                    ? themeColors.cardBorder
                    : "rgba(124,58,237,0.2)",
                }}
              >
                <h3
                  className="font-semibold mb-1 text-sm"
                  style={{ color: themeColors.text }}
                >
                  Password requirements:
                </h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-5 h-5 rounded-full flex items-center justify-center transition-all"
                      style={{
                        background: requirementsMet.length
                          ? themeColors.success || "#10b981"
                          : isDark
                          ? themeColors.cardBorder
                          : "#e5e7eb",
                      }}
                    >
                      {requirementsMet.length ? (
                        <Check className="w-3 h-3 text-white" />
                      ) : (
                        <X className="w-3 h-3 text-white" />
                      )}
                    </div>
                    <span
                      className="text-sm font-medium"
                      style={{
                        color: requirementsMet.length
                          ? themeColors.success || "#10b981"
                          : themeColors.textSecondary,
                      }}
                    >
                      At least 8 characters
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div
                      className="w-5 h-5 rounded-full flex items-center justify-center transition-all"
                      style={{
                        background: requirementsMet.different
                          ? themeColors.success || "#10b981"
                          : isDark
                          ? themeColors.cardBorder
                          : "#e5e7eb",
                      }}
                    >
                      {requirementsMet.different ? (
                        <Check className="w-3 h-3 text-white" />
                      ) : (
                        <X className="w-3 h-3 text-white" />
                      )}
                    </div>
                    <span
                      className="text-sm font-medium"
                      style={{
                        color: requirementsMet.different
                          ? themeColors.success || "#10b981"
                          : themeColors.textSecondary,
                      }}
                    >
                      Different from current password
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div
                      className="w-5 h-5 rounded-full flex items-center justify-center transition-all"
                      style={{
                        background: requirementsMet.match
                          ? themeColors.success || "#10b981"
                          : isDark
                          ? themeColors.cardBorder
                          : "#e5e7eb",
                      }}
                    >
                      {requirementsMet.match ? (
                        <Check className="w-3 h-3 text-white" />
                      ) : (
                        <X className="w-3 h-3 text-white" />
                      )}
                    </div>
                    <span
                      className="text-sm font-medium"
                      style={{
                        color: requirementsMet.match
                          ? themeColors.success || "#10b981"
                          : themeColors.textSecondary,
                      }}
                    >
                      Passwords match
                    </span>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-6 rounded-xl font-semibold transition-all duration-200"
                style={{
                  background: themeColors.primary,
                  color: themeColors.onPrimary,
                  boxShadow: "0 2px 8px 0 rgba(124,58,237,0.10)",
                  opacity: loading ? 0.7 : 1,
                  cursor: loading ? "wait" : "pointer",
                  letterSpacing: 0.5,
                }}
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <Loader2 className="animate-spin h-5 w-5 mr-2" />
                    <span>Processing...</span>
                  </div>
                ) : (
                  <span>Send OTP</span>
                )}
              </button>
            </form>

            {/* Security Note */}
            <div className="text-center mt-6">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Shield
                  className="w-4 h-4"
                  style={{ color: themeColors.primary }}
                />
                <span
                  className="text-sm font-semibold"
                  style={{ color: themeColors.primary }}
                >
                  Security Tip
                </span>
              </div>
              <p
                className="text-xs"
                style={{ color: themeColors.textSecondary, opacity: 0.8 }}
              >
                Regular password updates help protect your account from
                unauthorized access
              </p>
            </div>
          </div>
        </div>

        {/* Vertical Divider */}
        <div className="hidden md:flex items-center justify-center">
          <div className="h-[70%] w-px bg-gray-500 opacity-30 mx-2" />
        </div>

        {/* Right: Visual */}
        <div className="hidden md:flex flex-1 items-center justify-center relative bg-transparent max-w-xl">
          <style>{`
            @keyframes floatY {
              0% { transform: translateY(0); }
              50% { transform: translateY(-18px); }
              100% { transform: translateY(0); }
            }
          `}</style>
          <img
            src={resetimg}
            alt="Reset Password Visual"
            className="object-contain relative z-10 max-h-[60vh] max-w-[420px] drop-shadow-2xl rounded-2xl"
            style={{
              filter: "none",
              animation: "floatY 3.2s ease-in-out infinite",
            }}
          />
        </div>
      </div>

      {/* OTP Modal */}
      <OTPModal
        visible={showOtpModal}
        onClose={() => setShowOtpModal(false)}
        onVerify={handleVerifyOtp}
        onResend={handleResendOTP}
        loading={otpLoading}
        timer={timer}
        title="Verify Password Change"
        subtitle="Enter the OTP sent to your email to change your password"
        themeColors={themeColors}
        isDark={isDark}
      />

      {/* CustomAlert */}
      <CustomAlert
        visible={alertConfig.visible}
        type={alertConfig.type}
        title={alertConfig.title}
        message={alertConfig.message}
        onClose={hideAlert}
        primaryAction={alertConfig.primaryAction}
        secondaryAction={alertConfig.secondaryAction}
        themeColors={themeColors}
        isDark={isDark}
      />
    </div>
  );
}
