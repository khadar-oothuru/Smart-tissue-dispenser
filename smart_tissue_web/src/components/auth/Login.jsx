import React, { useState, useCallback, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Eye, EyeOff, Lock, Mail, Loader2 } from "lucide-react";
import { FcGoogle } from "react-icons/fc";
// import ThemeToggle from "../ThemeToggle";
import { useAuth } from "../../hooks/useAuth";
import fitnessImg from "../../assets/images/Tablet login-amico.png";
import { useTheme } from "../../context/ThemeContext";
import { CustomAlert } from "../common/CustomAlert";

// Google Sign-In
const GOOGLE_CLIENT_ID =
  "70657860851-4gh622q01j5uirrc2erd9mha36vnaija.apps.googleusercontent.com";

// CustomInputWithIcon is not used and removed

// Google Sign-In Button Component
const GoogleSignInButton = ({ onPress, loading, themeColors }) => {
  return (
    <button
      type="button"
      onClick={onPress}
      disabled={loading}
      className="w-full flex items-center justify-center px-4 py-2 rounded-md shadow border text-white font-medium text-base focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed mb-2"
      style={{
        minHeight: 40,
        background: themeColors.surface || "#232b3b",
        borderColor: themeColors.cardBorder || "#3a4256",
        color: themeColors.text || "#fff",
      }}
    >
      {loading ? (
        <Loader2 className="animate-spin h-5 w-5 mr-2" />
      ) : (
        <FcGoogle className="h-6 w-6 mr-2" />
      )}
      {loading ? "Signing in..." : "Continue with Google"}
    </button>
  );
};

const Login = () => {
  const navigate = useNavigate();

  // Use AuthContext
  const { user, login, loginWithGoogle } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  // Removed unused focus states
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

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

  const handleLogin = async () => {
    if (!email || !password) {
      showAlert({
        type: "warning",
        title: "Missing Fields",
        message: "Please enter both email and password.",
      });
      return;
    }

    setIsLoading(true);
    try {
      const result = await login({ email, password });

      if (result.success) {
        const { user } = result;
        console.log("Login Debug - User data received:", user);
        console.log("Login Debug - User role:", user.role);

        navigate(user.role === "admin" ? "/admin" : "/dashboard", {
          replace: true,
        });
      } else {
        showAlert({
          type: "error",
          title: "Login Failed",
          message: result.error || "Something went wrong. Please try again.",
        });
      }
    } catch (err) {
      console.error(err);

      let errorTitle = "Login Failed";
      let errorMessage = "Something went wrong. Please try again.";

      if (err.response?.status === 401) {
        errorTitle = "Invalid Credentials";
        errorMessage =
          "The email or password you entered is incorrect. Please try again.";
      } else if (err.response?.status === 404) {
        errorTitle = "Account Not Found";
        errorMessage =
          "No account found with this email address. Please check your email or sign up.";
      } else if (err.response?.status === 403) {
        errorTitle = "Account Disabled";
        errorMessage =
          "Your account has been disabled. Please contact support.";
      } else if (err.response?.data?.message || err.response?.data?.error) {
        errorMessage = err.response.data.message || err.response.data.error;
      } else if (err.code === "NETWORK_ERROR" || !err.response) {
        errorTitle = "Connection Error";
        errorMessage =
          "Unable to connect to server. Please check your internet connection and try again.";
      }

      showAlert({
        type: "error",
        title: errorTitle,
        message: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const { themeColors } = useTheme();
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
        {/* Left: Form */}
        <div className="flex-1 flex flex-col items-center justify-center px-10 py-10">
          <div className="w-full max-w-md mx-auto pb-2 flex flex-col items-center">
            <h2
              className="text-4xl font-extrabold text-center mb-2 tracking-tight"
              style={{ color: themeColors.primary, letterSpacing: 1 }}
            >
              Log In
            </h2>
            <p
              className="text-center mb-8 text-base"
              style={{ color: themeColors.text, opacity: 0.7 }}
            >
              Welcome back! Please enter your details
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
                handleLogin();
              }}
              className="flex flex-col gap-0 mt-2 items-center w-full"
              style={{ alignItems: "center", justifyContent: "center" }}
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
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    // onFocus and onBlur removed
                    autoCapitalize="none"
                    placeholder="Enter your email"
                    className="flex-1 bg-transparent outline-none text-base font-medium"
                    style={{ color: themeColors.text }}
                  />
                </div>
              </div>
              {/* Password Input */}
              <div className="w-full mb-2">
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
                    // onFocus and onBlur removed
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
              <div className="flex justify-end w-full text-sm mb-4 ">
                <Link
                  to="/forgot-password"
                  className="font-medium"
                  style={{ color: themeColors.primary, letterSpacing: 0.2 }}
                >
                  forgot password ?
                </Link>
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
                    <span>Logging in...</span>
                  </div>
                ) : (
                  <span>Log in</span>
                )}
              </button>
            </form>
            {/* Removed 'Or Continue With' and extra spacing below form */}
            <div className="text-center mt-6">
              <span className="text-sm" style={{ color: themeColors.text }}>
                Don't have an account?{" "}
                <Link
                  to="/register"
                  className="font-semibold hover:underline"
                  style={{ color: themeColors.primary }}
                >
                  Sign up
                </Link>
              </span>
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
            src={fitnessImg}
            alt="Login Visual"
            className="object-contain relative z-10 max-h-[60vh] max-w-[420px] drop-shadow-2xl rounded-2xl"
            style={{
              filter: "none",
              animation: "floatY 3.2s ease-in-out infinite",
            }}
          />
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

export default Login;
