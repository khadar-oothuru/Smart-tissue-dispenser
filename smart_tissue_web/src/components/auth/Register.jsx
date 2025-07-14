import React, { useState, useCallback, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Eye, EyeOff, Lock, Mail, User, Loader2 } from "lucide-react";
import { FcGoogle } from "react-icons/fc";
import { useAuth } from "../../hooks/useAuth";
import logoImg from "../../assets/images/Sign up-amico.png";
import { useTheme } from "../../context/ThemeContext";
import { CustomAlert } from "../common/CustomAlert";

// Google Sign-In
const GOOGLE_CLIENT_ID =
  "70657860851-4gh622q01j5uirrc2erd9mha36vnaija.apps.googleusercontent.com";

// Google Sign-In Button Component
const GoogleSignInButton = ({ onPress, loading, themeColors }) => (
  <button
    type="button"
    onClick={onPress}
    disabled={loading}
    className="w-full flex items-center justify-center px-4 py-2 rounded-md shadow border text-white font-medium text-base focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed mb-2"
    style={{
      minHeight: 40,
      background: themeColors?.surface || "#232b3b",
      borderColor: themeColors?.cardBorder || "#3a4256",
      color: themeColors?.text || "#fff",
    }}
  >
    {loading ? (
      <Loader2 className="animate-spin h-5 w-5 mr-2" />
    ) : (
      <FcGoogle className="h-6 w-6 mr-2" />
    )}
    {loading ? "Signing up..." : "Continue with Google"}
  </button>
);

const Register = () => {
  const navigate = useNavigate();
  const { themeColors } = useTheme();

  // Use AuthContext (only for loginWithGoogle)
  const { user, loginWithGoogle } = useAuth();

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  // Removed unused state variables for confirm password and input focus
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  // Removed unused showConfirmPassword state

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

  // Load Google Sign-In script
  useEffect(() => {
    const loadGoogleScript = () => {
      if (!window.google) {
        const script = document.createElement("script");
        script.src = "https://accounts.google.com/gsi/client";
        script.async = true;
        script.defer = true;
        document.body.appendChild(script);
      }
    };
    loadGoogleScript();
  }, []);

  // Redirect if user is already logged in
  useEffect(() => {
    if (user) {
      navigate(user.role === "admin" ? "/admin" : "/dashboard", {
        replace: true,
      });
    }
  }, [user, navigate]);

  const handleGoogleToken = useCallback(
    async (idToken) => {
      setIsLoading(true);
      try {
        const result = await loginWithGoogle(idToken);

        if (result.success) {
          const { user } = result;
          navigate(user.role === "admin" ? "/admin" : "/dashboard", {
            replace: true,
          });
        } else {
          showAlert({
            type: "error",
            title: "Authentication Failed",
            message:
              result.error ||
              "Failed to authenticate with Google. Please try again.",
          });
        }
      } catch (err) {
        console.error("Google token validation error:", err);
        showAlert({
          type: "error",
          title: "Authentication Failed",
          message: "Failed to authenticate with Google. Please try again.",
        });
      } finally {
        setIsLoading(false);
      }
    },
    [loginWithGoogle, navigate, showAlert]
  );

  const handleGoogleSignIn = useCallback(() => {
    if (window.google) {
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: (response) => {
          handleGoogleToken(response.credential);
        },
      });

      window.google.accounts.id.prompt();
    } else {
      showAlert({
        type: "error",
        title: "Google Sign In Failed",
        message: "Google sign in failed. Please try again.",
      });
    }
  }, [handleGoogleToken, showAlert]);

  const handleRegister = async () => {
    if (!username || !email || !password) {
      showAlert({
        type: "warning",
        title: "Missing Fields",
        message: "Please fill all the fields.",
      });
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      showAlert({
        type: "warning",
        title: "Invalid Email",
        message: "Please enter a valid email address.",
      });
      return;
    }

    // Basic password validation
    if (password.length < 6) {
      showAlert({
        type: "warning",
        title: "Weak Password",
        message: "Password must be at least 6 characters long.",
      });
      return;
    }

    const userData = { username, email, password, role: "user" };
    setIsLoading(true);
    try {
      // Use direct fetch to match mobile app logic
      const response = await fetch(
        "https://trk.gyrfalconintelliedge.com:9003/api/auth/register/",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(userData),
        }
      );

      if (response.ok) {
        showAlert({
          type: "success",
          title: "Registration Successful",
          message: "Your account has been created successfully!",
        });
        setTimeout(() => {
          navigate("/login", { replace: true });
        }, 2000);
      } else {
        const errorData = await response.json();
        let errorMessage = "Something went wrong!";
        if (errorData.email) {
          errorMessage =
            errorData.email[0] || "This email is already registered.";
        } else if (errorData.username) {
          errorMessage =
            errorData.username[0] || "This username is already taken.";
        } else if (errorData.password) {
          errorMessage =
            errorData.password[0] || "Password doesn't meet requirements.";
        } else {
          const firstError = Object.values(errorData)[0];
          if (Array.isArray(firstError))
            errorMessage = firstError[0] || "Registration failed.";
        }
        showAlert({
          type: "error",
          title: "Registration Failed",
          message: errorMessage,
        });
      }
    } catch (error) {
      console.error("Registration error:", error);
      showAlert({
        type: "error",
        title: "Connection Error",
        message:
          "Unable to connect to server. Please check your internet connection and try again.",
      });
    } finally {
      setIsLoading(false);
    }
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
            alt="Register Visual"
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
        <div className="flex-1 flex flex-col items-center justify-center px-10 py-10">
          <div className="w-full max-w-md mx-auto pb-2 flex flex-col items-center">
            <h2
              className="text-4xl font-extrabold text-center mb-2 tracking-tight"
              style={{ color: themeColors.primary, letterSpacing: 1 }}
            >
              Sign Up
            </h2>
            <p
              className="text-center mb-8 text-base"
              style={{ color: themeColors.text, opacity: 0.7 }}
            >
              Create your account to get started
            </p>
            <div className="flex flex-col gap-3 w-full">
              <GoogleSignInButton
                onPress={handleGoogleSignIn}
                loading={isLoading}
                themeColors={themeColors}
              />
              <hr className="my-4 border-t border-gray-600 w-full opacity-60" />
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleRegister();
              }}
              className="flex flex-col gap-0 mt-2 items-center w-full"
              style={{ alignItems: "center", justifyContent: "center" }}
            >
              {/* Username Input */}
              <div className="w-full mb-6">
                <label
                  htmlFor="username"
                  className="block text-sm font-semibold mb-2"
                  style={{ color: themeColors.text }}
                >
                  Username
                </label>
                <div
                  className="flex items-center px-4 py-3 rounded-xl border-2 transition-all duration-200 bg-opacity-80"
                  style={{
                    borderColor: themeColors.cardBorder,
                    background: themeColors.inputBg,
                  }}
                >
                  <User
                    className="w-5 h-5 mr-3"
                    style={{ color: themeColors.primary }}
                  />
                  <input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    autoCapitalize="words"
                    placeholder="Enter your username"
                    className="flex-1 bg-transparent outline-none text-base font-medium"
                    style={{ color: themeColors.text }}
                  />
                </div>
              </div>
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
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoCapitalize="none"
                    placeholder="Enter your email"
                    className="flex-1 bg-transparent outline-none text-base font-medium"
                    style={{ color: themeColors.text }}
                  />
                </div>
              </div>
              {/* Password Input */}
              <div className="w-full mb-6">
                <label
                  htmlFor="password"
                  className="block text-sm font-semibold mb-2"
                  style={{ color: themeColors.text }}
                >
                  Password
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
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="flex-1 bg-transparent outline-none text-base font-medium"
                    style={{ color: themeColors.text }}
                  />
                  <button
                    type="button"
                    className="ml-2"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <Eye className="w-5 h-5 text-gray-400" />
                    ) : (
                      <EyeOff className="w-5 h-5 text-gray-400" />
                    )}
                  </button>
                </div>
              </div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-6 rounded-xl font-semibold transition-all duration-200"
                style={{
                  background: themeColors.primary,
                  color: themeColors.onPrimary,
                  boxShadow: "0 2px 8px 0 rgba(124,58,237,0.10)",
                  opacity: isLoading ? 0.7 : 1,
                  cursor: isLoading ? "wait" : "pointer",
                  letterSpacing: 0.5,
                }}
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <Loader2 className="animate-spin h-5 w-5 mr-2" />
                    <span>Signing up...</span>
                  </div>
                ) : (
                  <span>Sign up</span>
                )}
              </button>
            </form>
            <div className="text-center mt-6">
              <span className="text-sm" style={{ color: themeColors.text }}>
                Already have an account?{" "}
                <Link
                  to="/login"
                  className="font-semibold hover:underline"
                  style={{ color: themeColors.primary }}
                >
                  Log in
                </Link>
              </span>
            </div>
          </div>
        </div>
      </div>
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

export default Register;
