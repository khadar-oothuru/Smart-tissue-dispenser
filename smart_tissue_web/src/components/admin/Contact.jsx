import React, { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Info,
  User,
  Mail,
  Phone,
  Tag,
  MessageSquare,
  Send,
  Loader2,
  X,
  Check,
  ChevronDown,
  Headphones,
} from "lucide-react";
import { useTheme } from "../../hooks/useThemeContext";
import { CustomAlert } from "../../components/common/CustomAlert";
import { submitContactForm } from "../../services/api";

const ContactSupport = () => {
  const navigate = useNavigate();
  const { themeColors, isDark } = useTheme();

  // Add fallback for theme colors
  const safeThemeColors = themeColors || {
    background: "#ffffff",
    surface: "#f5f5f5",
    primary: "#3AB0FF",
    heading: "#161e32",
    text: "#7b8493",
    inputbg: "rgb(234, 244, 246)",
    danger: "#FF3B30",
    success: "#34C759",
    warning: "#FF9500",
    border: "#e0e0e0",
  };

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  });

  const [focusedField, setFocusedField] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [showSubjectPicker, setShowSubjectPicker] = useState(false);
  const [alertConfig, setAlertConfig] = useState({
    type: "success",
    title: "",
    message: "",
    onConfirm: null,
  });

  // Subject options
  const subjectOptions = [
    { value: "technical", label: "Technical Support" },
    { value: "billing", label: "Billing & Payments" },
    { value: "account", label: "Account Issues" },
    { value: "feature", label: "Feature Request" },
    { value: "other", label: "Other" },
  ];

  const updateFormData = useCallback((field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  }, []);

  const showAlertMessage = useCallback(
    (type, title, message, onConfirm = null) => {
      setAlertConfig({
        type,
        title,
        message,
        onConfirm,
      });
      setShowAlert(true);
    },
    []
  );

  const validateForm = useCallback(() => {
    const { name, email, subject, message } = formData;

    if (!name.trim()) {
      showAlertMessage("error", "Validation Error", "Please enter your name.");
      return false;
    }

    if (name.trim().length < 2) {
      showAlertMessage(
        "error",
        "Validation Error",
        "Name must be at least 2 characters long."
      );
      return false;
    }

    if (!email.trim()) {
      showAlertMessage(
        "error",
        "Validation Error",
        "Please enter your email address."
      );
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      showAlertMessage(
        "error",
        "Validation Error",
        "Please enter a valid email address."
      );
      return false;
    }

    if (!subject) {
      showAlertMessage("error", "Validation Error", "Please select a subject.");
      return false;
    }

    if (!message.trim()) {
      showAlertMessage(
        "error",
        "Validation Error",
        "Please enter your message."
      );
      return false;
    }

    if (message.trim().length < 10) {
      showAlertMessage(
        "error",
        "Validation Error",
        "Message must be at least 10 characters long."
      );
      return false;
    }

    return true;
  }, [formData, showAlertMessage]);

  const handleSubmit = useCallback(async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      await submitContactForm(formData);
      showAlertMessage(
        "success",
        "Message Sent!",
        "Your message has been sent successfully. We'll get back to you soon.",
        () => {
          setFormData({
            name: "",
            email: "",
            phone: "",
            subject: "",
            message: "",
          });
        }
      );
    } catch (error) {
      showAlertMessage(
        "error",
        "Failed to Send",
        error.message || "Something went wrong. Please try again later."
      );
    } finally {
      setIsLoading(false);
    }
  }, [formData, validateForm, showAlertMessage]);

  return (
    <div
      className="min-h-screen"
      style={{ background: safeThemeColors.background }}
    >
      {/* Main Content */}
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div
          className="rounded-2xl shadow-xl overflow-hidden"
          style={{
            background: safeThemeColors.surface,
            border: `1px solid ${safeThemeColors.border}`,
          }}
        >
          {/* Contact Form Card */}
          <div className="p-6 sm:p-8">
            <form onSubmit={(e) => e.preventDefault()} className="space-y-6">
              {/* Name Input */}
              <div>
                <label
                  className="block text-lg font-bold mb-2"
                  style={{ color: safeThemeColors.heading }}
                >
                  Full Name *
                </label>
                <div
                  className="flex items-center px-4 py-3 rounded-xl border-2 transition-all duration-200"
                  style={{
                    borderColor:
                      focusedField === "name"
                        ? safeThemeColors.primary
                        : safeThemeColors.cardBorder,
                    background:
                      safeThemeColors.inputGlassBg ||
                      "linear-gradient(135deg, rgba(24,28,31,0.35) 60%, rgba(35,39,43,0.25) 100%)",
                    boxShadow: "0 2px 8px 0 rgba(31,38,135,0.07)",
                    WebkitBackdropFilter: "blur(10px)",
                    backdropFilter: "blur(10px)",
                  }}
                >
                  <User
                    size={22}
                    className={`mr-3 ${
                      focusedField === "name" || formData.name
                        ? "text-blue-600"
                        : "text-gray-400"
                    }`}
                    style={{ color: safeThemeColors.primary }}
                  />
                  <input
                    type="text"
                    className="flex-1 bg-transparent outline-none text-base font-medium"
                    style={{ color: safeThemeColors.heading }}
                    placeholder="Enter your full name"
                    value={formData.name}
                    onChange={(e) => updateFormData("name", e.target.value)}
                    onFocus={() => setFocusedField("name")}
                    onBlur={() => setFocusedField(null)}
                  />
                </div>
              </div>

              {/* Email Input */}
              <div>
                <label
                  className="block text-lg font-bold mb-2"
                  style={{ color: safeThemeColors.heading }}
                >
                  Email Address *
                </label>
                <div
                  className="flex items-center px-4 py-3 rounded-xl border-2 transition-all duration-200"
                  style={{
                    borderColor:
                      focusedField === "email"
                        ? safeThemeColors.primary
                        : safeThemeColors.cardBorder,
                    background:
                      safeThemeColors.inputGlassBg ||
                      "linear-gradient(135deg, rgba(24,28,31,0.35) 60%, rgba(35,39,43,0.25) 100%)",
                    boxShadow: "0 2px 8px 0 rgba(31,38,135,0.07)",
                    WebkitBackdropFilter: "blur(10px)",
                    backdropFilter: "blur(10px)",
                  }}
                >
                  <Mail
                    size={22}
                    className={`mr-3 ${
                      focusedField === "email" || formData.email
                        ? "text-blue-600"
                        : "text-gray-400"
                    }`}
                    style={{ color: safeThemeColors.primary }}
                  />
                  <input
                    type="email"
                    className="flex-1 bg-transparent outline-none text-base font-medium"
                    style={{ color: safeThemeColors.heading }}
                    placeholder="Enter your email address"
                    value={formData.email}
                    onChange={(e) => updateFormData("email", e.target.value)}
                    onFocus={() => setFocusedField("email")}
                    onBlur={() => setFocusedField(null)}
                  />
                </div>
              </div>

              {/* Phone Input */}
              <div>
                <label
                  className="block text-lg font-bold mb-2"
                  style={{ color: safeThemeColors.heading }}
                >
                  Phone Number
                </label>
                <div
                  className="flex items-center px-4 py-3 rounded-xl border-2 transition-all duration-200"
                  style={{
                    borderColor:
                      focusedField === "phone"
                        ? safeThemeColors.primary
                        : safeThemeColors.cardBorder,
                    background:
                      safeThemeColors.inputGlassBg ||
                      "linear-gradient(135deg, rgba(24,28,31,0.35) 60%, rgba(35,39,43,0.25) 100%)",
                    boxShadow: "0 2px 8px 0 rgba(31,38,135,0.07)",
                    WebkitBackdropFilter: "blur(10px)",
                    backdropFilter: "blur(10px)",
                  }}
                >
                  <Phone
                    size={22}
                    className={`mr-3 ${
                      focusedField === "phone" || formData.phone
                        ? "text-blue-600"
                        : "text-gray-400"
                    }`}
                    style={{ color: safeThemeColors.primary }}
                  />
                  <input
                    type="tel"
                    className="flex-1 bg-transparent outline-none text-base font-medium"
                    style={{ color: safeThemeColors.heading }}
                    placeholder="Enter your phone number"
                    value={formData.phone}
                    onChange={(e) => updateFormData("phone", e.target.value)}
                    onFocus={() => setFocusedField("phone")}
                    onBlur={() => setFocusedField(null)}
                  />
                </div>
              </div>

              {/* Subject Selector */}
              <div>
                <label
                  className="block text-lg font-bold mb-2"
                  style={{ color: safeThemeColors.heading }}
                >
                  Subject *
                </label>
                <div
                  className="flex items-center px-4 py-3 rounded-xl border-2 transition-all duration-200 cursor-pointer"
                  style={{
                    borderColor: formData.subject
                      ? safeThemeColors.primary
                      : safeThemeColors.cardBorder,
                    background:
                      safeThemeColors.inputGlassBg ||
                      "linear-gradient(135deg, rgba(24,28,31,0.35) 60%, rgba(35,39,43,0.25) 100%)",
                    boxShadow: "0 2px 8px 0 rgba(31,38,135,0.07)",
                    WebkitBackdropFilter: "blur(10px)",
                    backdropFilter: "blur(10px)",
                  }}
                  onClick={() => setShowSubjectPicker(true)}
                >
                  <Tag
                    size={22}
                    className={`mr-3 ${
                      focusedField === "subject" || formData.subject
                        ? "text-blue-600"
                        : "text-gray-400"
                    }`}
                    style={{ color: safeThemeColors.primary }}
                  />
                  <div className="flex-1 flex items-center justify-between">
                    <span
                      className={`text-base font-medium ${
                        formData.subject ? "" : "opacity-50"
                      }`}
                      style={{
                        color: formData.subject
                          ? safeThemeColors.heading
                          : safeThemeColors.text,
                      }}
                    >
                      {subjectOptions.find(
                        (opt) => opt.value === formData.subject
                      )?.label || "Select a subject"}
                    </span>
                    <ChevronDown
                      size={20}
                      className={
                        formData.subject ? "text-blue-600" : "text-gray-400"
                      }
                    />
                  </div>
                </div>
              </div>

              {/* Message Input */}
              <div>
                <label
                  className="block text-lg font-bold mb-2"
                  style={{ color: safeThemeColors.heading }}
                >
                  Message *
                </label>
                <div
                  className="flex items-start px-4 py-3 rounded-xl border-2 transition-all duration-200"
                  style={{
                    borderColor:
                      focusedField === "message"
                        ? safeThemeColors.primary
                        : safeThemeColors.cardBorder,
                    background:
                      safeThemeColors.inputGlassBg ||
                      "linear-gradient(135deg, rgba(24,28,31,0.35) 60%, rgba(35,39,43,0.25) 100%)",
                    boxShadow: "0 2px 8px 0 rgba(31,38,135,0.07)",
                    WebkitBackdropFilter: "blur(10px)",
                    backdropFilter: "blur(10px)",
                  }}
                >
                  <MessageSquare
                    size={22}
                    className={`mr-3 mt-1 ${
                      focusedField === "message" || formData.message
                        ? "text-blue-600"
                        : "text-gray-400"
                    }`}
                    style={{ color: safeThemeColors.primary }}
                  />
                  <textarea
                    className="flex-1 bg-transparent outline-none text-base font-medium resize-none"
                    style={{ color: safeThemeColors.heading }}
                    placeholder="Describe your issue or question in detail..."
                    value={formData.message}
                    onChange={(e) => updateFormData("message", e.target.value)}
                    onFocus={() => setFocusedField("message")}
                    onBlur={() => setFocusedField(null)}
                    rows={4}
                  />
                </div>
                <p
                  className="text-sm text-right mt-2 opacity-60"
                  style={{ color: safeThemeColors.text }}
                >
                  {formData.message.length} characters
                </p>
              </div>

              {/* Submit Button */}
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isLoading}
                className="w-full py-3 px-6 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center gap-2"
                style={{
                  background: safeThemeColors.primary,
                  color: safeThemeColors.onPrimary || "#fff",
                  boxShadow: "0 2px 8px 0 rgba(0,0,0,0.10)",
                  opacity: isLoading ? 0.7 : 1,
                  cursor: isLoading ? "wait" : "pointer",
                }}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="animate-spin" size={20} />
                    <span>Sending...</span>
                  </>
                ) : (
                  <>
                    <Send size={20} />
                    <span>Send Message</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Quick Contact Card (moved below form, visually distinct) */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-1 py-8 mt-6">
          <div
            className="rounded-2xl shadow-xl overflow-hidden"
            style={{
              background: safeThemeColors.surface,
              border: `1px solid ${safeThemeColors.border}`,
            }}
          >
            <div className="p-6 sm:p-8">
              <h3
                className="text-xl font-bold mb-2 text-center"
                style={{ color: safeThemeColors.heading }}
              >
                Quick Contact
              </h3>
              <p
                className="text-base font-medium mb-6 text-center"
                style={{ color: safeThemeColors.text }}
              >
                Or reach us directly:
              </p>
              <div className="space-y-3 w-full max-w-md mx-auto">
                <div className="flex gap-3 justify-center w-full max-w-md mx-auto">
                  <button
                    type="button"
                    className="flex flex-row items-center justify-center gap-2 min-w-[260px] min-h-[52px] px-6 py-3 rounded-lg border-2 transition-all duration-200 font-medium text-base bg-white hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-400"
                    style={{
                      borderColor: safeThemeColors.cardBorder,
                      background:
                        safeThemeColors.inputGlassBg ||
                        "linear-gradient(135deg, rgba(24,28,31,0.10) 60%, rgba(35,39,43,0.10) 100%)",
                      boxShadow: "0 1px 4px 0 rgba(31,38,135,0.07)",
                      color: safeThemeColors.heading,
                    }}
                  >
                    <Mail
                      size={18}
                      style={{ color: safeThemeColors.primary }}
                    />
                    <span className="truncate">support@smartdispenser.com</span>
                  </button>
                  <button
                    type="button"
                    className="flex flex-row items-center justify-center gap-2 min-w-[260px] min-h-[52px] px-6 py-3 rounded-lg border-2 transition-all duration-200 font-medium text-base bg-white hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-400"
                    style={{
                      borderColor: safeThemeColors.cardBorder,
                      background:
                        safeThemeColors.inputGlassBg ||
                        "linear-gradient(135deg, rgba(24,28,31,0.10) 60%, rgba(35,39,43,0.10) 100%)",
                      boxShadow: "0 1px 4px 0 rgba(31,38,135,0.07)",
                      color: safeThemeColors.heading,
                    }}
                  >
                    <Phone
                      size={18}
                      style={{ color: safeThemeColors.primary }}
                    />
                    <span className="truncate">+1 (555) 123-4567</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Subject Picker Modal */}
      {showSubjectPicker && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm px-4"
          style={{
            background:
              safeThemeColors.modalOverlay &&
              safeThemeColors.modalOverlay !== "transparent"
                ? safeThemeColors.modalOverlay
                : "rgba(0,0,0,0.7)",
          }}
        >
          <div
            className="w-full max-w-md mx-4 rounded-2xl p-6 shadow-2xl"
            style={{
              background: "#181c1f",
              border: "1px solid #23272b",
            }}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between mb-6">
              <h3
                className="text-2xl font-bold"
                style={{ color: safeThemeColors.heading }}
              >
                Select Subject
              </h3>
              <button
                onClick={() => setShowSubjectPicker(false)}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X size={24} className="text-gray-500" />
              </button>
            </div>
            <div className="overflow-y-auto max-h-[60vh]">
              {subjectOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => {
                    updateFormData("subject", option.value);
                    setShowSubjectPicker(false);
                  }}
                  className={
                    "w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors border-b " +
                    (isDark ? "border-gray-700" : "border-gray-100") +
                    (formData.subject === option.value
                      ? " bg-blue-50 dark:bg-blue-900/20"
                      : "")
                  }
                >
                  <span
                    className={
                      "font-medium" +
                      (formData.subject === option.value
                        ? " text-blue-600"
                        : "")
                    }
                    style={{
                      color:
                        formData.subject === option.value
                          ? safeThemeColors.primary
                          : safeThemeColors.heading,
                    }}
                  >
                    {option.label}
                  </span>
                  {formData.subject === option.value && (
                    <Check size={20} className="text-blue-600" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Custom Alert */}
      <CustomAlert
        visible={showAlert}
        type={alertConfig.type}
        title={alertConfig.title}
        message={alertConfig.message}
        onClose={() => setShowAlert(false)}
        primaryAction={{
          text: "OK",
          onPress: () => {
            setShowAlert(false);
            if (alertConfig.onConfirm) {
              alertConfig.onConfirm();
            }
          },
        }}
        themeColors={safeThemeColors}
        isDark={isDark}
      />
    </div>
  );
};

export default ContactSupport;
