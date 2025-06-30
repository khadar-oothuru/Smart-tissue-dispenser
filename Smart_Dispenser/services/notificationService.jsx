import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";
import { Platform } from "react-native";
import { registerPushToken } from "../utils/api";

// Configure notification handler to ensure sound plays
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true, // IMPORTANT: Ensure sound plays
    shouldSetBadge: true,
  }),
});

// Simplified notification categories - Open App only
if (Platform.OS !== "web") {
  // Empty Alert Category - with Open App action only
  Notifications.setNotificationCategoryAsync("empty-alert", [
    {
      identifier: "open",
      buttonTitle: "Open App",
      options: {
        isDestructive: false,
        isAuthenticationRequired: false,
        opensAppToForeground: true,
      },
    },
  ]).catch((error) =>
    console.log("Error setting empty-alert category:", error)
  );

  // Low Alert Category - with Open App action only
  Notifications.setNotificationCategoryAsync("low-alert", [
    {
      identifier: "open",
      buttonTitle: "Open App",
      options: {
        isDestructive: false,
        isAuthenticationRequired: false,
        opensAppToForeground: true,
      },
    },
  ]).catch((error) => console.log("Error setting low-alert category:", error));

  // Tamper Alert Category - with Open App action only
  Notifications.setNotificationCategoryAsync("tamper-alert", [
    {
      identifier: "open",
      buttonTitle: "Open App",
      options: {
        isDestructive: false,
        isAuthenticationRequired: false,
        opensAppToForeground: true,
      },
    },
  ]).catch((error) =>
    console.log("Error setting tamper-alert category:", error)
  );

  // Critical Alert Category - with Open App action only
  Notifications.setNotificationCategoryAsync("critical-alert", [
    {
      identifier: "open",
      buttonTitle: "Open App",
      options: {
        isDestructive: false,
        isAuthenticationRequired: false,
        opensAppToForeground: true,
      },
    },
  ]).catch((error) =>
    console.log("Error setting critical-alert category:", error)
  );
  // Full Alert Category - with Dismiss action only (COMMENTED OUT)
  /*
  Notifications.setNotificationCategoryAsync("full-alert", [
    {
      identifier: "dismiss",
      buttonTitle: "Dismiss",
      options: {
        isDestructive: false,
        isAuthenticationRequired: false,
        opensAppToForeground: false,
      },
    },
    {
      identifier: "open",
      buttonTitle: "Open App",
      options: {
        isDestructive: false,
        isAuthenticationRequired: false,
        opensAppToForeground: true,
      },
    },
  ]).catch((error) =>
    console.log("Error setting full-alert category:", error)
  );
  */
}

export const registerForPushNotificationsAsync = async () => {
  let token = null;

  if (Platform.OS === "web") {
    console.log("Push notifications are not supported on web");
    return null;
  }

  if (!Device.isDevice) {
    console.log("Must use physical device for Push Notifications");
    return null;
  }

  try {
    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== "granted") {
      console.warn("Push notification permission denied");
      return null;
    }

    const projectId =
      Constants.expoConfig?.extra?.eas?.projectId ||
      Constants.manifest?.extra?.eas?.projectId;

    if (!projectId) {
      console.error("Project ID not found in app.json");
      return null;
    }

    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId: projectId,
    });
    token = tokenData.data;
    console.log("Push token generated successfully:", token);

    // Configure Android notification channels for proper sound
    if (Platform.OS === "android") {
      // Delete existing channels first (to update sound settings)
      try {
        await Notifications.deleteNotificationChannelAsync("default");
        await Notifications.deleteNotificationChannelAsync("tamper");
        await Notifications.deleteNotificationChannelAsync("empty");
        await Notifications.deleteNotificationChannelAsync("low");
      } catch (_error) {
        console.log("Channels didn't exist yet, creating new ones...");
      } // Default channel with enhanced styling
      await Notifications.setNotificationChannelAsync("default", {
        name: "Smart Dispenser",
        description: "General notifications with enhanced styling",
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#3AB0FF",
        sound: "notif.mp3", // Custom sound from assets
        showBadge: true,
        enableLights: true,
        enableVibrate: true,
        lockscreenVisibility:
          Notifications.AndroidNotificationVisibility.PUBLIC,
        bypassDnd: false,
      }); // Tamper alerts channel with enhanced styling
      await Notifications.setNotificationChannelAsync("tamper", {
        name: "Tamper Alerts",
        description: "Security tamper alerts with enhanced visual styling",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 400, 200, 400, 200, 400],
        lightColor: "#FF3030",
        sound: "notif.mp3", // Custom sound from assets
        showBadge: true,
        enableLights: true,
        enableVibrate: true,
        lockscreenVisibility:
          Notifications.AndroidNotificationVisibility.PUBLIC,
        bypassDnd: true,
      }); // Low alerts channel with enhanced styling
      await Notifications.setNotificationChannelAsync("low", {
        name: "Low Level Alerts",
        description: "Low tissue level alerts with enhanced styling",
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 300, 150, 300],
        lightColor: "#FF9800",
        sound: "notif.mp3", // Custom sound from assets
        showBadge: true,
        enableLights: true,
        enableVibrate: true,
        lockscreenVisibility:
          Notifications.AndroidNotificationVisibility.PUBLIC,
        bypassDnd: false,
      });

      // Empty alerts channel with enhanced styling
      await Notifications.setNotificationChannelAsync("empty", {
        name: "Empty Alerts",
        description: "Empty tissue dispenser alerts with enhanced styling",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 400, 200, 400, 200, 400],
        lightColor: "#DC2626",
        sound: "notif.mp3", // Custom sound from assets
        showBadge: true,
        enableLights: true,
        enableVibrate: true,
        lockscreenVisibility:
          Notifications.AndroidNotificationVisibility.PUBLIC,
        bypassDnd: true,
      });

      // Tamper alerts channel with enhanced styling
      await Notifications.setNotificationChannelAsync("tamper", {
        name: "Tamper Alerts",
        description: "Device tampering detection with enhanced styling",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 200, 100, 200, 100, 200, 100, 200],
        lightColor: "#FF5722",
        sound: "notif.mp3", // Custom sound from assets
        showBadge: true,
        enableLights: true,
        enableVibrate: true,
        lockscreenVisibility:
          Notifications.AndroidNotificationVisibility.PUBLIC,
        bypassDnd: true,
      });
      console.log("✅ Android notification channels configured successfully");
    }

    // Configure iOS sound
    if (Platform.OS === "ios") {
      console.log("✅ iOS notification configuration ready");
    }
  } catch (error) {
    console.error("Error getting push token:", error);
    return null;
  }

  return token;
};

export const sendTokenToServer = async (expoPushToken) => {
  if (!expoPushToken) {
    console.log("No push token provided");
    return;
  }

  try {
    // Try both possible token storage keys for backward compatibility
    let authToken = await AsyncStorage.getItem("accessToken");

    if (!authToken) {
      authToken = await AsyncStorage.getItem("authToken");
    }

    if (!authToken) {
      console.log("No auth token found, cannot register push token");
      return;
    }

    console.log("Attempting to register push token with server...");

    await registerPushToken(authToken, { token: expoPushToken });
    console.log("✅ Push token registered with server successfully");
  } catch (error) {
    console.error("❌ Error sending token to server:", error);

    // If it's an auth error, log more details
    if (
      error.message?.includes("401") ||
      error.message?.includes("unauthorized")
    ) {
      console.log("🔑 Authentication error - token may be expired or invalid");
    }
  }
};

export const schedulePushNotification = async (
  title,
  body,
  data = {},
  options = {}
) => {
  if (Platform.OS === "web") {
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification(title, {
        body,
        data,
        icon: "./assets/images/notification.png",
        badge: "./assets/images/notification.png",
        tag: data.tag || "smart-dispenser",
        requireInteraction: true,
        ...options,
      });
    }
    return;
  }
  try {
    // Ensure sound is properly configured
    const soundFile = "notif.mp3";

    const notificationContent = {
      title,
      body,
      data: {
        ...data,
        timestamp: new Date().toISOString(),
      },
      sound: soundFile, // Custom sound from assets
      categoryIdentifier: options.category || "critical-alert",
      badge: data.badgeCount || null,
      priority:
        options.priority || Notifications.AndroidNotificationPriority.HIGH,
      color: options.color || "#3AB0FF",
      ...options.content,
    }; // Add enhanced styling for Android with explicit sound and app icon
    if (Platform.OS === "android") {
      notificationContent.channelId = options.channelId || "default";
      notificationContent.sticky = options.sticky || false;
      notificationContent.autoDismiss = options.autoDismiss !== false;
      notificationContent.sound = soundFile; // Ensure sound is set for Android
      // Enhanced Android styling with app icon
      notificationContent.largeIcon =
        options.largeIcon || "./assets/images/notification.png"; // App icon as large icon
      notificationContent.icon = "./assets/images/notification.png"; // Small icon (app icon)
      notificationContent.bigText = body; // Show full text in expanded view
      notificationContent.style = {
        type: "bigtext",
        text: body,
      };
      notificationContent.showWhen = true;
      notificationContent.when = new Date().getTime();
      notificationContent.visibility =
        Notifications.AndroidNotificationVisibility.PUBLIC;
    } // Add enhanced styling for iOS with explicit sound and app icon
    if (Platform.OS === "ios") {
      notificationContent.sound = soundFile; // Ensure sound is set for iOS
      notificationContent.badge = data.badgeCount || null;
      notificationContent.threadIdentifier = data.threadId || "smart-dispenser";
      notificationContent.interruptionLevel =
        options.interruptionLevel || "active";
      notificationContent.relevanceScore = options.relevanceScore || 1.0;
      // Enhanced iOS styling with app icon attachment
      notificationContent.subtitle = options.subtitle || "";
      notificationContent.attachments = options.attachments || [
        {
          identifier: "app-icon",
          url: "./assets/images/notification.png",
          options: {
            typeHint: "public.png",
            thumbnailHidden: false,
          },
        },
      ];
    }
    console.log("🔊 Scheduling notification with sound:", soundFile);
    console.log("�️ App icon configured: notification.png");
    console.log("�📱 Notification content:", {
      title: notificationContent.title,
      sound: notificationContent.sound,
      channelId: notificationContent.channelId,
      priority: notificationContent.priority,
      largeIcon: notificationContent.largeIcon,
      attachments: notificationContent.attachments?.length || 0,
    });

    await Notifications.scheduleNotificationAsync({
      content: notificationContent,
      trigger: options.trigger || null,
    });

    console.log(
      "✅ Enhanced notification scheduled successfully with sound:",
      notificationContent.sound
    );
  } catch (error) {
    console.error("❌ Error scheduling enhanced notification:", error);
    console.error("Error details:", error.message);
  }
};

export const cancelAllNotifications = async () => {
  if (Platform.OS !== "web") {
    await Notifications.cancelAllScheduledNotificationsAsync();
  }
};

export const getNotificationPermissionsStatus = async () => {
  if (Platform.OS === "web") {
    if ("Notification" in window) {
      return Notification.permission;
    }
    return "unsupported";
  }

  const { status } = await Notifications.getPermissionsAsync();
  return status;
};

export const requestWebNotificationPermission = async () => {
  if (Platform.OS === "web" && "Notification" in window) {
    try {
      const permission = await Notification.requestPermission();
      return permission;
    } catch (error) {
      console.error("Error requesting web notification permission:", error);
      return "denied";
    }
  }
  return "unsupported";
};

export const handleNotificationResponse = (
  response,
  userRole,
  router = null
) => {
  const { notification, actionIdentifier } = response;
  const data = notification.request.content.data;

  console.log("🔔 Notification response:", { actionIdentifier, data });

  switch (actionIdentifier) {
    case "open":
      console.log("📱 Open app action triggered for:", data);
      if (router) {
        // Navigate based on user role and notification type
        if (data.forUser && userRole !== "admin") {
          router.push("/user-notifications");
        } else if (userRole === "admin") {
          router.push("/notifications");
        } else {
          // Navigate to relevant screen based on notification type
          if (data.deviceId) {
            router.push(`/device-details?id=${data.deviceId}`);
          } else {
            router.push("/notifications");
          }
        }
      }
      // Update badge count
      if (data.badgeCount !== undefined) {
        setBadgeCount(Math.max(0, data.badgeCount - 1));
      }
      break;

    default:
      // Default tap action - open the app and navigate appropriately
      console.log("📱 Notification tapped (default action):", data);
      if (router) {
        if (data.forUser && userRole !== "admin") {
          router.push("/user-notifications");
        } else if (userRole === "admin") {
          router.push("/notifications");
        } else {
          // Navigate to relevant screen based on notification type
          if (data.deviceId) {
            router.push(`/device-details?id=${data.deviceId}`);
          } else {
            router.push("/notifications");
          }
        }
      }
      // Update badge count for default tap
      if (data.badgeCount !== undefined) {
        setBadgeCount(Math.max(0, data.badgeCount - 1));
      }
      break;
  }
};

export const setupNotificationListeners = () => {
  const subscription = Notifications.addNotificationResponseReceivedListener(
    handleNotificationResponse
  );

  return () => {
    subscription.remove();
  };
};

export const getScheduledNotifications = async () => {
  if (Platform.OS === "web") {
    return [];
  }

  try {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    return scheduled;
  } catch (error) {
    console.error("Error getting scheduled notifications:", error);
    return [];
  }
};

export const cancelNotification = async (notificationId) => {
  if (Platform.OS === "web") {
    return;
  }

  try {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
  } catch (error) {
    console.error("Error canceling notification:", error);
  }
};

export const setBadgeCount = async (count) => {
  if (Platform.OS === "ios") {
    try {
      await Notifications.setBadgeCountAsync(count);
    } catch (error) {
      console.error("Error setting badge count:", error);
    }
  }
};

export const getBadgeCount = async () => {
  if (Platform.OS === "ios") {
    try {
      const count = await Notifications.getBadgeCountAsync();
      return count;
    } catch (error) {
      console.error("Error getting badge count:", error);
      return 0;
    }
  }
  return 0;
};

export const updateBadgeFromUnreadCount = async (unreadCount) => {
  if (Platform.OS === "ios") {
    await setBadgeCount(unreadCount);
  }
};

// Enhanced notification helper functions with real icon configurations

// Icon mapping for different notification types (using real icon names)
const getNotificationIcon = (type) => {
  switch (type) {
    case "tamper":
      return {
        name: "shield-alert-outline",
        family: "MaterialCommunityIcons",
        color: "#8B5CF6",
      };
    case "empty":
      return {
        name: "archive-cancel-outline",
        family: "MaterialCommunityIcons",
        color: "#DC2626",
      };
    case "low":
      return {
        name: "archive-outline",
        family: "MaterialCommunityIcons",
        color: "#FF9800",
      };
    // case "full":  // COMMENTED OUT - Full notifications disabled
    //   return {
    //     name: "archive",
    //     family: "MaterialCommunityIcons",
    //     color: "#4CAF50",
    //   };
    case "maintenance":
      return {
        name: "wrench",
        family: "Feather",
        color: "#2196F3",
      };
    default:
      return {
        name: "bell",
        family: "Feather",
        color: "#3AB0FF",
      };
  }
};

export const sendBackendNotification = (() => {
  // Prevent duplicate notifications within a short window (debounce)
  let lastNotificationKey = null;
  let lastNotificationTime = 0;
  const DEBOUNCE_MS = 2000; // 2 seconds

  // Prevent multiple notifications by using a lock
  let notificationLock = false;

  return async (notificationData) => {
    if (notificationLock) {
      // Prevent concurrent notifications
      console.log("🔒 Notification lock active, skipping notification");
      return;
    }
    notificationLock = true;
    setTimeout(() => {
      notificationLock = false;
    }, 1000); // Release lock after 1 second

    const {
      message,
      type,
      device_id,
      device_name,
      room,
      floor,
      priority = 80,
    } = notificationData;

    // Only allow one notification per type/device/message within debounce window
    const notificationKey = `${type}-${device_id}-${message}`;
    const now = Date.now();
    if (
      lastNotificationKey === notificationKey &&
      now - lastNotificationTime < DEBOUNCE_MS
    ) {
      // Skip duplicate notification
      console.log("⏩ Skipping duplicate notification:", notificationKey);
      return;
    }
    lastNotificationKey = notificationKey;
    lastNotificationTime = now;

    // Notification type mapping (only Open App action)
    const typeMapping = {
      tamper: {
        icon: getNotificationIcon("tamper"),
        color: "#8B5CF6",
        channelId: "tamper",
        category: "tamper-alert",
        androidPriority: Notifications.AndroidNotificationPriority.MAX,
        sticky: true,
        subtitle: "Security Alert",
        interruptionLevel: "critical",
        relevanceScore: 1.0,
      },
      empty: {
        icon: getNotificationIcon("empty"),
        color: "#DC2626",
        channelId: "empty",
        category: "empty-alert",
        androidPriority: Notifications.AndroidNotificationPriority.MAX,
        sticky: true,
        subtitle: "Empty Alert",
        interruptionLevel: "critical",
        relevanceScore: 0.9,
      },
      low: {
        icon: getNotificationIcon("low"),
        color: "#FF9800",
        channelId: "low",
        category: "low-alert",
        androidPriority: Notifications.AndroidNotificationPriority.HIGH,
        subtitle: "Low Level Alert",
        interruptionLevel: "active",
        relevanceScore: 0.8,
      },
      maintenance: {
        icon: getNotificationIcon("maintenance"),
        color: "#2196F3",
        channelId: "default",
        category: "low-alert",
        androidPriority: Notifications.AndroidNotificationPriority.NORMAL,
        subtitle: "Maintenance Notice",
        interruptionLevel: "passive",
        relevanceScore: 0.4,
      },
    };

    const config = typeMapping[type];
    if (!config) {
      console.error(`Unknown notification type: ${type}`);
      return;
    }

    // Enhanced device details for notification content
    const deviceInfo = device_name ? `${device_name}` : `Device ${device_id}`;
    const locationInfo =
      room && floor
        ? `Room ${room}, Floor ${floor}`
        : room
        ? `Room ${room}`
        : floor
        ? `Floor ${floor}`
        : "";

    // Create detailed notification message with device name, location, and alert type
    const alertTypeText = type.charAt(0).toUpperCase() + type.slice(1);
    const fullDeviceInfo = locationInfo
      ? `${deviceInfo} - ${locationInfo}`
      : deviceInfo;

    const enhancedTitle = `${alertTypeText} Alert`;
    const enhancedMessage = `${fullDeviceInfo}\n${message}`;

    // Always use only the Open App action (category) for all notifications
    return schedulePushNotification(
      enhancedTitle,
      enhancedMessage,
      {
        type,
        deviceId: device_id,
        device_id,
        device_name,
        room,
        floor,
        priority,
        alertType: alertTypeText,
        location: locationInfo,
        tag: `${type}-${device_id}`,
        timestamp: new Date().toISOString(),
        // Pass icon data for frontend to use
        iconName: config.icon.name,
        iconFamily: config.icon.family,
        iconColor: config.icon.color,
      },
      {
        color: config.color,
        channelId: config.channelId,
        category: "critical-alert", // Force only Open App action for all
        priority: config.androidPriority,
        sticky: config.sticky || false,
        subtitle: `${fullDeviceInfo}`,
        interruptionLevel: config.interruptionLevel,
        relevanceScore: config.relevanceScore,
        // Enhanced styling options
        bigText: `${alertTypeText} Alert\n\nDevice: ${deviceInfo}\nLocation: ${
          locationInfo || "Not specified"
        }\nAlert Type: ${alertTypeText}\n\n${message}`,
        showWhen: true,
        autoDismiss: !config.sticky,
      }
    );
  };
})();

// Test notification function with enhanced styling
export const sendTestNotification = async () => {
  console.log("🧪 Sending enhanced test notification...");

  return schedulePushNotification(
    "🔊 Enhanced Sound Test Alert",
    "Testing enhanced notification with improved styling and Open App functionality!",
    {
      type: "test",
      tag: "test-notification",
      badgeCount: 1,
    },
    {
      color: "#9C27B0",
      channelId: "default",
      category: "critical-alert",
      priority: Notifications.AndroidNotificationPriority.HIGH,
      subtitle: "Enhanced Test",
      interruptionLevel: "active",
      relevanceScore: 0.9,
      bigText:
        "This is a test notification with enhanced styling, improved colors, and Open App functionality. The notification should display beautifully!",
      trigger: { seconds: 1 }, // Send after 1 second
    }
  );
};

// Test backend notification types
export const testBackendNotificationTypes = async () => {
  console.log("🧪 Testing backend notification types...");
  const testNotifications = [
    {
      message: "Tampering detected!",
      type: "tamper",
      device_id: 1,
      device_name: "Dispenser Alpha",
      room: 101,
      floor: 1,
    },
    {
      message: "Low tissue detected",
      type: "low",
      device_id: 2,
      device_name: "Dispenser Beta",
      room: 102,
      floor: 1,
    },
    {
      message: "Device tampering detected",
      type: "tamper",
      device_id: 3,
      device_name: "Dispenser Gamma",
      room: 103,
      floor: 2,
    },
    {
      message: "Tissue dispenser is empty",
      type: "empty",
      device_id: 4,
      device_name: "Dispenser Delta",
      room: 104,
      floor: 2,
    },
    {
      message: "Scheduled maintenance needed",
      type: "maintenance",
      device_id: 5,
      device_name: "Dispenser Epsilon",
      room: 105,
      floor: 3,
    },
  ];

  for (const [index, notif] of testNotifications.entries()) {
    setTimeout(() => {
      sendBackendNotification(notif);
    }, index * 2000); // Send each notification 2 seconds apart
  }
};

// Test notification actions functionality
export const testNotificationActions = async () => {
  console.log("🧪 Testing notification actions with Open App functionality...");

  // Test Empty Alert with Open App action
  setTimeout(async () => {
    console.log("📱 Test 1: Empty Alert with Open App action");
    await sendBackendNotification({
      message: "Tissue dispenser is empty - needs refill",
      type: "empty",
      device_id: 1,
      device_name: "Test Dispenser Alpha",
      room: 101,
      floor: 1,
    });
  }, 1000);

  // Test Low Alert with Open App action
  setTimeout(async () => {
    console.log("📱 Test 2: Low Alert with Open App action");
    await sendBackendNotification({
      message: "Tissue level is running low",
      type: "low",
      device_id: 2,
      device_name: "Test Dispenser Beta",
      room: 102,
      floor: 1,
    });
  }, 3000);

  // Test Tamper Alert with Open App action
  setTimeout(async () => {
    console.log("📱 Test 3: Tamper Alert with Open App action");
    await sendBackendNotification({
      message: "Unauthorized access detected",
      type: "tamper",
      device_id: 3,
      device_name: "Test Dispenser Gamma",
      room: 103,
      floor: 2,
    });
  }, 5000);

  console.log("✅ Notification action tests scheduled!");
  console.log(
    "📱 Check your notifications - you should see only Open App button!"
  );
};

// Function to clear notification badge
export const clearNotificationBadge = async () => {
  if (Platform.OS === "ios") {
    await setBadgeCount(0);
  }
};

// Function to get notification settings
export const getNotificationSettings = async () => {
  if (Platform.OS === "web") {
    return {
      status: "web-unsupported",
      settings: {},
    };
  }

  try {
    const permissions = await Notifications.getPermissionsAsync();
    const channels =
      Platform.OS === "android"
        ? await Notifications.getNotificationChannelsAsync()
        : null;

    return {
      status: permissions.status,
      settings: permissions,
      channels: channels,
    };
  } catch (error) {
    console.error("Error getting notification settings:", error);
    return {
      status: "error",
      error: error.message,
    };
  }
};

// Debug function to check notification channel settings
export const debugNotificationChannels = async () => {
  if (Platform.OS === "android") {
    try {
      const channels = await Notifications.getNotificationChannelsAsync();
      console.log("📱 Current notification channels:", channels);

      for (const channel of channels) {
        console.log(`Channel: ${channel.name} (${channel.id})`);
        console.log(`  Sound: ${channel.sound}`);
        console.log(`  Importance: ${channel.importance}`);
        console.log(`  Vibration: ${channel.enableVibrate}`);
        console.log("---");
      }
    } catch (error) {
      console.error("Error getting channels:", error);
    }
  }
};

// Test notification with enhanced sound and styling verification
export const testNotificationWithSound = async () => {
  console.log("🔊 Testing enhanced notification with sound...");

  return schedulePushNotification(
    "🎵 Enhanced Sound Test",
    "Testing notification with enhanced styling and Open App functionality!",
    {
      type: "sound_test",
      tag: "sound-test",
      badgeCount: 1,
    },
    {
      color: "#FF6B35",
      channelId: "default",
      category: "critical-alert",
      priority: Notifications.AndroidNotificationPriority.MAX,
      subtitle: "Sound & Style Test",
      interruptionLevel: "critical",
      relevanceScore: 1.0,
      bigText:
        "This enhanced notification tests both sound and improved visual styling with Open App functionality.",
      trigger: { seconds: 1 },
    }
  );
};

// Comprehensive sound testing function
export const testNotificationSound = async () => {
  console.log("🔊 Testing notification sound functionality...");

  // First test: Basic sound test
  console.log("📱 Test 1: Basic notification with sound");
  await schedulePushNotification(
    "🔊 Sound Test #1",
    "Basic notification sound test - should play notif.mp3",
    {
      type: "sound_test_1",
      tag: "sound-test-1",
      badgeCount: 1,
    },
    {
      color: "#FF6B35",
      channelId: "default",
      category: "critical-alert",
      priority: Notifications.AndroidNotificationPriority.HIGH,
      trigger: { seconds: 2 },
    }
  );

  // Second test: Critical channel sound test
  setTimeout(async () => {
    console.log("📱 Test 2: Critical channel sound test");
    await schedulePushNotification(
      "🚨 Sound Test #2",
      "Critical channel sound test - should play notif.mp3 with max priority",
      {
        type: "sound_test_2",
        tag: "sound-test-2",
        badgeCount: 2,
      },
      {
        color: "#FF4444",
        channelId: "tamper",
        category: "tamper-alert",
        priority: Notifications.AndroidNotificationPriority.MAX,
        trigger: { seconds: 1 },
      }
    );
  }, 4000);

  // Third test: iOS specific sound test
  if (Platform.OS === "ios") {
    setTimeout(async () => {
      console.log("🍎 Test 3: iOS specific sound test");
      await schedulePushNotification(
        "🔔 iOS Sound Test",
        "iOS specific notification sound test",
        {
          type: "ios_sound_test",
          tag: "ios-sound-test",
          badgeCount: 3,
        },
        {
          color: "#007AFF",
          category: "critical-alert",
          interruptionLevel: "active",
          relevanceScore: 1.0,
          trigger: { seconds: 1 },
        }
      );
    }, 8000);
  }

  console.log(
    "✅ Sound tests scheduled - check your device for notifications with sound!"
  );
};

// Debug notification sound configuration
export const debugSoundConfiguration = async () => {
  console.log("🔍 Debugging notification sound configuration...");

  try {
    // Check permissions
    const permissions = await Notifications.getPermissionsAsync();
    console.log("📋 Notification permissions:", permissions);

    // Check Android channels
    if (Platform.OS === "android") {
      const channels = await Notifications.getNotificationChannelsAsync();
      console.log("📱 Android notification channels:");

      channels.forEach((channel) => {
        console.log(`  Channel: ${channel.name} (${channel.id})`);
        console.log(`    Sound: ${channel.sound || "default"}`);
        console.log(`    Importance: ${channel.importance}`);
        console.log(`    Vibration: ${channel.enableVibrate}`);
        console.log(`    Description: ${channel.description}`);
        console.log("    ---");
      });
    }

    // Test device capabilities
    console.log("📱 Device info:");
    console.log(`  Platform: ${Platform.OS}`);
    console.log(`  Is Device: ${Device.isDevice}`);
    console.log(`  Device Name: ${Device.deviceName}`);

    return {
      permissions,
      channels:
        Platform.OS === "android"
          ? await Notifications.getNotificationChannelsAsync()
          : null,
      platform: Platform.OS,
      isDevice: Device.isDevice,
    };
  } catch (error) {
    console.error("❌ Error debugging sound configuration:", error);
    return { error: error.message };
  }
};

// Force recreate notification channels with sound
export const recreateNotificationChannels = async () => {
  if (Platform.OS !== "android") {
    console.log("ℹ️ Channel recreation only needed on Android");
    return;
  }

  console.log("🔄 Recreating notification channels with sound...");

  try {
    // Delete all existing channels
    const existingChannels = await Notifications.getNotificationChannelsAsync();
    for (const channel of existingChannels) {
      await Notifications.deleteNotificationChannelAsync(channel.id);
      console.log(`🗑️ Deleted channel: ${channel.id}`);
    }

    // Wait a bit before recreating
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Recreate channels with explicit sound configuration
    await Notifications.setNotificationChannelAsync("default", {
      name: "Smart Dispenser Default",
      description: "Default notifications with sound",
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#3AB0FF",
      sound: "notif.mp3",
      showBadge: true,
      enableLights: true,
      enableVibrate: true,
    });
    await Notifications.setNotificationChannelAsync("tamper", {
      name: "Tamper Alerts with Sound",
      description: "Security tamper alerts with custom sound",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 400, 200, 400, 200, 400],
      lightColor: "#FF3030",
      sound: "notif.mp3",
      showBadge: true,
      enableLights: true,
      enableVibrate: true,
      bypassDnd: true,
    });
    await Notifications.setNotificationChannelAsync("low", {
      name: "Low Level Alerts with Sound",
      description: "Low level alerts with custom sound",
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 300, 150, 300],
      lightColor: "#FF9800",
      sound: "notif.mp3",
      showBadge: true,
      enableLights: true,
      enableVibrate: true,
    });

    await Notifications.setNotificationChannelAsync("empty", {
      name: "Empty Alerts with Sound",
      description: "Empty dispenser alerts with custom sound",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 400, 200, 400, 200, 400],
      lightColor: "#DC2626",
      sound: "notif.mp3",
      showBadge: true,
      enableLights: true,
      enableVibrate: true,
      bypassDnd: true,
    });

    await Notifications.setNotificationChannelAsync("tamper", {
      name: "Tamper Alerts with Sound",
      description: "Tamper alerts with custom sound",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 200, 100, 200, 100, 200, 100, 200],
      lightColor: "#FF5722",
      sound: "notif.mp3",
      showBadge: true,
      enableLights: true,
      enableVibrate: true,
      bypassDnd: true,
    });

    console.log("✅ Notification channels recreated successfully with sound");

    // Test the new channels
    setTimeout(() => {
      testNotificationSound();
    }, 2000);
  } catch (error) {
    console.error("❌ Error recreating notification channels:", error);
  }
};

// Verify sound file exists
export const verifySoundFile = () => {
  console.log("📂 Verifying sound file configuration...");
  console.log("Expected sound file: assets/notif.mp3");
  console.log(
    "App.json sound configuration: Check expo-notifications plugin sounds array"
  );
  console.log("Make sure the sound file is properly bundled with the app");

  // Note: We can't directly check file existence in React Native
  // This function provides debugging info for manual verification
  return {
    expectedPath: "assets/notif.mp3",
    configuredInAppJson: true,
    recommendations: [
      "1. Ensure notif.mp3 exists in assets folder",
      "2. Check app.json expo-notifications plugin configuration",
      "3. Rebuild the app after adding sound files",
      "4. Test on physical device (simulator may not play custom sounds)",
      "5. Check device volume and notification settings",
    ],
  };
};

// Quick sound test function - call this to immediately test notification sound
export const quickSoundTest = async () => {
  console.log("🚀 Quick sound test starting...");

  try {
    // Check permissions first
    const { status } = await Notifications.getPermissionsAsync();
    if (status !== "granted") {
      console.log("❌ Notification permissions not granted - requesting...");
      const { status: newStatus } =
        await Notifications.requestPermissionsAsync();
      if (newStatus !== "granted") {
        console.log("❌ Notification permissions denied");
        return false;
      }
    }

    // Send immediate test notification
    await schedulePushNotification(
      "🔊 Sound Test",
      "Testing notification sound - you should hear notif.mp3!",
      {
        type: "quick_sound_test",
        tag: "quick-sound-test",
        badgeCount: 1,
      },
      {
        color: "#FF6B35",
        channelId: "tamper",
        category: "tamper-alert",
        priority: Notifications.AndroidNotificationPriority.MAX,
        trigger: null, // Send immediately
        subtitle: "Sound Test",
        interruptionLevel: "active",
        relevanceScore: 1.0,
      }
    );

    console.log("✅ Quick sound test notification sent!");
    return true;
  } catch (error) {
    console.error("❌ Quick sound test failed:", error);
    return false;
  }
};

// Function to render notification with real icon (for use in components)
export const renderNotificationWithIcon = (notification) => {
  const { data = {} } = notification;
  const {
    iconName = "bell",
    iconFamily = "Feather",
    iconColor = "#3AB0FF",
    type = "default",
  } = data;

  return {
    ...notification,
    iconConfig: {
      name: iconName,
      family: iconFamily,
      color: iconColor,
      type: type,
    },
  };
};

// Function to get icon configuration for a notification type
export const getIconConfigForType = (type) => {
  return getNotificationIcon(type);
};

// Test app icon in notifications
export const testAppIconNotification = async () => {
  console.log("🖼️ Testing app icon in notifications...");

  try {
    // Check permissions first
    const { status } = await Notifications.getPermissionsAsync();
    if (status !== "granted") {
      console.log("❌ Notification permissions not granted - requesting...");
      const { status: newStatus } =
        await Notifications.requestPermissionsAsync();
      if (newStatus !== "granted") {
        console.log("❌ Notification permissions denied");
        return false;
      }
    }

    // Send test notification with app icon
    await schedulePushNotification(
      "App Icon Test",
      "This notification should display your app icon! Check the notification panel.",
      {
        type: "app_icon_test",
        tag: "app-icon-test",
        badgeCount: 1,
      },
      {
        color: "#3AB0FF",
        channelId: "default",
        category: "critical-alert",
        priority: Notifications.AndroidNotificationPriority.HIGH,
        trigger: null, // Send immediately
        subtitle: "Icon Test",
        interruptionLevel: "active",
        relevanceScore: 1.0,
        // Force app icon usage
        largeIcon: "./assets/images/notification.png",
        attachments: [
          {
            identifier: "app-icon-test",
            url: "./assets/images/notification.png",
            options: {
              typeHint: "public.png",
              thumbnailHidden: false,
            },
          },
        ],
      }
    );

    console.log("✅ App icon test notification sent!");
    console.log(
      "📱 Check your notification panel - you should see your app icon!"
    );
    return true;
  } catch (error) {
    console.error("❌ App icon test failed:", error);
    return false;
  }
};

// Configure app icon for all notifications
export const configureAppIconForNotifications = () => {
  console.log("🖼️ Configuring app icon for notifications...");

  const iconConfig = {
    android: {
      smallIcon: "./assets/images/notification.png", // Small icon in status bar
      largeIcon: "./assets/images/notification.png", // Large icon in notification panel
      defaultColor: "#3AB0FF", // Default accent color
    },
    ios: {
      attachment: {
        identifier: "app-icon",
        url: "./assets/images/notification.png",
        options: {
          typeHint: "public.png",
          thumbnailHidden: false,
        },
      },
    },
    web: {
      icon: "./assets/images/notification.png",
      badge: "./assets/images/notification.png",
    },
  };

  console.log("✅ App icon configuration ready:");
  console.log(`   Android Small Icon: ${iconConfig.android.smallIcon}`);
  console.log(`   Android Large Icon: ${iconConfig.android.largeIcon}`);
  console.log(`   iOS Attachment: ${iconConfig.ios.attachment.url}`);
  console.log(`   Web Icon: ${iconConfig.web.icon}`);

  return iconConfig;
};

// Get app icon configuration for specific platform
export const getAppIconConfig = (platform = Platform.OS) => {
  const config = configureAppIconForNotifications();
  return config[platform] || config.android;
};
