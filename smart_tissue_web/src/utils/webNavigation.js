/**
 * Web-compatible navigation configuration
 * Handles platform-specific navigation behaviors
 */

import { Platform } from "react-native";

/**
 * Get platform-specific navigation options
 */
export const getWebNavigationOptions = () => {
  if (Platform.OS === "web") {
    return {
      // Web-specific navigation options
      headerShown: false,
      gestureEnabled: false, // Disable gestures on web
      animationEnabled: true,
      cardStyle: { backgroundColor: "transparent" },
    };
  }

  return {
    // Mobile-specific navigation options
    headerShown: false,
    gestureEnabled: true,
    animationEnabled: true,
  };
};

/**
 * Handle web-specific routing
 */
export const handleWebNavigation = (router, route, params = {}) => {
  if (Platform.OS === "web") {
    // For web, we might want to handle routing differently
    // For example, using browser history or query parameters
    try {
      if (params && Object.keys(params).length > 0) {
        router.push({ pathname: route, params });
      } else {
        router.push(route);
      }
    } catch (_error) {
      // Web navigation error - fallback to replace
      router.replace(route);
    }
  } else {
    // Mobile navigation
    router.push(route);
  }
};

/**
 * Web-compatible back navigation
 */
export const handleBackNavigation = (router) => {
  if (Platform.OS === "web") {
    // On web, we can use browser back or router back
    if (typeof window !== "undefined" && window.history.length > 1) {
      window.history.back();
    } else {
      router.replace("/");
    }
  } else {
    // Mobile back navigation
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/");
    }
  }
};
