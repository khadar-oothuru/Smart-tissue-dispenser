import React, { useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useAuth } from "../../hooks/useAuth";
import { Mail, ArrowLeft } from "lucide-react";
import logoImg from "../../assets/images/Forgot password-amico.png";
import { CustomAlert } from "../common/CustomAlert";
import { useTheme } from "../../context/ThemeContext";
import config from "../../config/config";

const schema = yup.object().shape({
  email: yup
    .string()
    .required("Email is required")
    .email("Invalid email format"),
});

const ForgotPassword = () => {
  const { loading } = useAuth();
  const { themeColors } = useTheme();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
  });

  // Custom Alert states
  const [alertConfig, setAlertConfig] = useState({
    visible: false,
    type: "error",
    title: "",
    message: "",
    primaryAction: null,
    secondaryAction: null,
  });

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

  // Use the same endpoint as the mobile app for real API
  const onSubmit = async (data) => {
    try {
      const response = await fetch(`${config.API_URL}/auth/forgot/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: data.email }),
      });
      if (response.ok) {
        const resData = await response.json();
        showAlert({
          type: "success",
          title: "Email Sent",
          message:
            resData.message ||
            "Password reset instructions have been sent to your email.",
        });
      } else {
        let errorTitle = "Error";
        let errorMessage = "Something went wrong. Please try again.";
        if (response.status === 404) {
          errorTitle = "Email Not Found";
          errorMessage =
            "No account found with this email address. Please check your email or sign up.";
        } else {
          const errorData = await response.json().catch(() => ({}));
          if (errorData.error) errorMessage = errorData.error;
        }
        showAlert({
          type: "error",
          title: errorTitle,
          message: errorMessage,
        });
      }
    } catch (err) {
      showAlert({
        type: "error",
        title: "Connection Error",
        message:
          "Unable to connect to server. Please check your internet connection and try again.",
      });
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center bg-no-repeat bg-cover bg-center w-full"
      style={{
        background:
          themeColors.bg ||
          "linear-gradient(135deg, #2d3136 60%, #23272b 100%)", // lighter gradient
      }}
    >
      <div
        className="flex flex-row w-full max-w-6xl min-w-[700px] rounded-3xl overflow-hidden shadow-xl mx-auto"
        style={{
          background:
            themeColors.cardGlassBg ||
            "linear-gradient(135deg, rgba(36,40,44,0.85) 60%, rgba(50,54,58,0.75) 100%)", // less dark, more transparent
          border: `1.5px solid ${
            themeColors.cardBorder || "rgba(255,255,255,0.12)"
          }`,
          boxShadow: "0 4px 16px 0 rgba(31, 38, 135, 0.10)",
          WebkitBackdropFilter: "blur(10px)",
          backdropFilter: "blur(10px)",
        }}
      >
        {/* Left: Visual */}
        <div className="hidden md:flex flex-1 items-center justify-center relative bg-transparent max-w-xl">
          <style>{`
            @keyframes floatY {
              0% { transform: translateY(0); }
              50% { transform: translateY(-18px); }
              100% { transform: translateY(0); }
            }
          `}</style>
          <img
            src={logoImg}
            alt="Forgot Password Visual"
            className="object-contain relative z-10 max-h-[60vh] max-w-[420px] drop-shadow-2xl rounded-2xl"
            style={{
              filter: "none",
              animation: "floatY 3.2s ease-in-out infinite",
            }}
          />
        </div>
        {/* Vertical Divider */}
        <div className="hidden md:flex items-center justify-center">
          <div className="h-[70%] w-px bg-gray-500 opacity-30 mx-2" />
        </div>
        {/* Right: Form */}
        <div className="flex-1 flex flex-col items-center justify-center px-6 py-8 md:px-8 md:py-10">
          <div
            className="w-full max-w-md mx-auto pb-2 flex flex-col items-center px-4 py-6 md:px-6 md:py-8 rounded-2xl"
            style={{
              background: themeColors.inputBg,
              boxShadow: "0 2px 16px 0 rgba(31,38,135,0.08)",
            }}
          >
            <h2
              className="text-4xl font-extrabold text-center mb-2 tracking-tight"
              style={{ color: themeColors.primary, letterSpacing: 1 }}
            >
              Forgot your password?
            </h2>
            <p
              className="text-center mb-8 text-base"
              style={{ color: themeColors.text, opacity: 0.7 }}
            >
              Enter your email address and we'll send you a link to reset your
              password.
            </p>
            <form
              className="flex flex-col gap-0 mt-2 items-center w-full"
              style={{ alignItems: "center", justifyContent: "center" }}
              onSubmit={handleSubmit(onSubmit)}
            >
              {/* Email Input */}
              <div className="w-full mb-6">
                <label
                  htmlFor="email"
                  className="block text-sm font-semibold mb-2"
                  style={{ color: themeColors.text }}
                >
                  Email
                </label>
                <div
                  className="flex items-center px-4 py-3 rounded-xl border-2 transition-all duration-200 bg-opacity-80"
                  style={{
                    borderColor: themeColors.cardBorder,
                    background: themeColors.inputBg,
                  }}
                >
                  <Mail
                    className="w-5 h-5 mr-3"
                    style={{ color: themeColors.primary }}
                  />
                  <input
                    id="email"
                    type="email"
                    {...register("email")}
                    placeholder="Enter your email"
                    className="flex-1 bg-transparent outline-none text-base font-medium"
                    style={{ color: themeColors.text }}
                  />
                </div>
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.email.message}
                  </p>
                )}
              </div>
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
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    <span>Sending...</span>
                  </div>
                ) : (
                  <span>Send Reset Link</span>
                )}
              </button>
            </form>
            <div className="text-center mt-6">
              <Link
                to="/login"
                className="inline-flex items-center text-sm font-medium"
                style={{ color: themeColors.primary }}
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back to Sign In
              </Link>
            </div>
          </div>
        </div>
      </div>
      {/* CustomAlert moved here to overlay the whole page */}
      <CustomAlert
        visible={alertConfig.visible}
        type={alertConfig.type}
        title={alertConfig.title}
        message={alertConfig.message}
        onClose={hideAlert}
        themeColors={themeColors}
      />
    </div>
  );
};

export default ForgotPassword;
