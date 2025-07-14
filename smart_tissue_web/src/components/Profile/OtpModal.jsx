import React, { useRef, useEffect, useState } from "react";
import { Mail, Clock, RefreshCw, X } from "lucide-react";
import { useTheme } from "../../hooks/useThemeContext";

export default function OTPModal({
  visible,
  onClose,
  onVerify,
  onResend,
  loading,
  timer,
  title = "Enter OTP",
  subtitle = "We've sent a 6-digit code to your email",
}) {
  const { themeColors, isDark } = useTheme();
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [isAnimating, setIsAnimating] = useState(false);
  const inputRefs = useRef([]);

  useEffect(() => {
    if (visible) {
      setOtp(["", "", "", "", "", ""]);
      setIsAnimating(true);
      // Focus first input after animation
      setTimeout(() => {
        inputRefs.current[0]?.focus();
      }, 100);
    } else {
      setIsAnimating(false);
    }
  }, [visible]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (visible) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [visible]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleOtpChange = (text, index) => {
    // Only allow digits
    if (/^\d$/.test(text)) {
      const newOtp = [...otp];
      newOtp[index] = text;
      setOtp(newOtp);

      // Auto-focus next input
      if (index < 5 && inputRefs.current[index + 1]) {
        inputRefs.current[index + 1].focus();
      }
    } else if (text === "") {
      const newOtp = [...otp];
      newOtp[index] = "";
      setOtp(newOtp);
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === "Backspace") {
      if (otp[index] === "" && index > 0) {
        // Move to previous input if current is empty
        inputRefs.current[index - 1]?.focus();
        // Clear the previous input
        const newOtp = [...otp];
        newOtp[index - 1] = "";
        setOtp(newOtp);
      } else {
        // Clear current input
        const newOtp = [...otp];
        newOtp[index] = "";
        setOtp(newOtp);
      }
    } else if (e.key === "ArrowLeft" && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === "ArrowRight" && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").slice(0, 6);
    if (/^\d+$/.test(pastedData)) {
      const newOtp = [...otp];
      pastedData.split("").forEach((digit, index) => {
        if (index < 6) {
          newOtp[index] = digit;
        }
      });
      setOtp(newOtp);
      // Focus last filled input or last input
      const lastFilledIndex = Math.min(pastedData.length - 1, 5);
      inputRefs.current[lastFilledIndex]?.focus();
    }
  };

  const handleVerify = () => {
    const otpString = otp.join("");
    if (otpString.length === 6) {
      onVerify(otpString);
    }
  };

  if (!visible) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center px-4 transition-all duration-300 ${
        isDark ? "bg-black bg-opacity-70" : "bg-black bg-opacity-50"
      }`}
      style={{
        background:
          themeColors.modalOverlay ||
          (isDark ? "rgba(0,0,0,0.7)" : "rgba(0,0,0,0.5)"),
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className={`
          relative w-full max-w-lg mx-auto p-8 rounded-3xl shadow-2xl transform transition-all duration-300
          ${isAnimating ? "scale-100 opacity-100" : "scale-95 opacity-0"}
          ${isDark ? "border border-gray-700" : "border-transparent"}
        `}
        style={{
          backgroundColor: themeColors.surface || (isDark ? "#181c1f" : "#fff"),
        }}
      >
        {/* Header indicator */}
        <div className="flex justify-center mb-4">
          <div
            className={`w-10 h-1 rounded-full ${
              isDark ? "bg-gray-700" : "bg-gray-300"
            }`}
          />
        </div>

        {/* Close button */}
        <button
          onClick={onClose}
          className={`absolute top-4 right-4 p-2 rounded-lg transition-colors hover:scale-110 active:scale-95`}
          style={{
            background: isDark
              ? "rgba(255,59,48,0.10)"
              : "rgba(255,59,48,0.08)",
          }}
        >
          <X className="w-5 h-5" color={themeColors.primary || "#007AFF"} />
        </button>

        {/* Icon */}
        <div className="flex justify-center mb-6">
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-2"
            style={{
              backgroundColor:
                (isDark
                  ? themeColors.primary + "20"
                  : themeColors.primary + "15") || "#E8F4FD",
            }}
          >
            <Mail
              className="w-8 h-8"
              color={themeColors.primary || "#007AFF"}
            />
          </div>
        </div>

        {/* Title and subtitle */}
        <h2
          className={`text-2xl font-bold text-center mb-2 ${
            isDark ? "text-white" : "text-gray-900"
          }`}
        >
          {title}
        </h2>
        <p
          className={`text-center mb-8 ${
            isDark ? "text-gray-400" : "text-gray-600"
          }`}
        >
          {subtitle}
        </p>

        {/* OTP Input Fields */}
        <div className="flex justify-center gap-3 mb-6">
          {otp.map((digit, index) => (
            <input
              key={index}
              ref={(ref) => (inputRefs.current[index] = ref)}
              type="text"
              inputMode="numeric"
              pattern="\d{1}"
              maxLength={1}
              value={digit}
              onChange={(e) => handleOtpChange(e.target.value, index)}
              onKeyDown={(e) => handleKeyDown(e, index)}
              onPaste={handlePaste}
              disabled={loading}
              className={`
                w-16 h-20 text-center text-2xl font-bold rounded-xl
                border-2 transition-all duration-200 outline-none
                ${
                  digit
                    ? "border-[" +
                      (themeColors.primary || "#007AFF") +
                      "] shadow-md"
                    : isDark
                    ? "border-[" + (themeColors.border || "#333") + "]"
                    : "border-[" + (themeColors.border || "#e0e0e0") + "]"
                }
                ${isDark ? "bg-gray-700 text-white" : "bg-white text-gray-900"}
                focus:ring-4 focus:ring-primary focus:border-none
                disabled:opacity-50 disabled:cursor-not-allowed
              `}
              style={{
                borderColor: digit
                  ? themeColors.primary || "#007AFF"
                  : themeColors.border || (isDark ? "#333" : "#e0e0e0"),
                color: isDark
                  ? themeColors.text || "#fff"
                  : themeColors.text || "#333",
                background: isDark
                  ? themeColors.inputBg || "#23272b"
                  : themeColors.inputBg || "#fff",
              }}
            />
          ))}
        </div>

        {/* Timer or Resend */}
        {timer > 0 ? (
          <div
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl mb-6"
            style={{
              background: isDark
                ? themeColors.surface + "30"
                : themeColors.primary + "10",
            }}
          >
            <Clock
              className="w-4 h-4"
              color={themeColors.primary || "#007AFF"}
            />
            <span
              className="text-sm font-medium"
              style={{
                color: themeColors.text || (isDark ? "#e0e0e0" : "#333"),
              }}
            >
              OTP expires in {formatTime(timer)}
            </span>
          </div>
        ) : (
          <button
            onClick={onResend}
            disabled={loading}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl mb-6 transition-all duration-200 w-full"
            style={{
              background: themeColors.primary + "20",
              color: themeColors.primary || "#007AFF",
              opacity: loading ? 0.5 : 1,
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            <RefreshCw
              className="w-4 h-4"
              color={themeColors.primary || "#007AFF"}
            />
            <span className="text-sm font-semibold">Resend OTP</span>
          </button>
        )}

        {/* Action Buttons */}
        <div className="flex gap-4 w-full mt-2">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 flex items-center justify-center gap-2 py-3 px-3 rounded-xl border font-extrabold text-base transition-all duration-200 hover:scale-105 active:scale-95 min-h-13"
            style={{
              borderColor: themeColors.border || (isDark ? "#333" : "#e0e0e0"),
              color: themeColors.text || (isDark ? "#e0e0e0" : "#333"),
              background: isDark ? themeColors.surface : "#fff",
              opacity: loading ? 0.5 : 1,
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            <X className="w-5 h-5" color={themeColors.primary || "#007AFF"} />
            <span>Cancel</span>
          </button>
          <button
            onClick={handleVerify}
            disabled={loading || otp.join("").length !== 6}
            className="flex-1 flex items-center justify-center gap-2 py-3 px-3 rounded-xl font-extrabold text-base text-white shadow-lg transition-all duration-200 hover:scale-105 active:scale-95 min-h-13"
            style={{
              background:
                otp.join("").length === 6
                  ? themeColors.primary || "#007AFF"
                  : "#b3d4fc",
              opacity: loading ? 0.6 : 1,
              cursor:
                loading || otp.join("").length !== 6
                  ? "not-allowed"
                  : "pointer",
            }}
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <div
                  className="animate-spin rounded-full h-5 w-5 border-b-2"
                  style={{ borderColor: "#fff" }}
                />
              </div>
            ) : (
              <>
                <Mail className="w-5 h-5" color="#fff" />
                <span>Verify</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
