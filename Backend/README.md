

# Smart Tissue Dispenser App - Manual Installation Guide

This guide provides a clear, step-by-step manual installation process for the Smart Tissue Dispenser application.

---

## Prerequisites

Before you begin, ensure you have the following installed:
- **Node.js** 
- **npm** (comes with Node.js)
- **Git**
- **Expo CLI** (for React Native development)

---

## 1. Clone the Repository

Open your terminal or command prompt and run:

```sh
git clone <repository-url>
cd Smart_Dispenser
```

---

## 2. Install Project Dependencies

Install all required packages using your preferred package manager:

Using npm:
```sh
npm install
```
Or using yarn:
```sh
yarn install
```

---

## 3. Install Expo CLI (if not already installed)

Expo CLI is required to run and build the app. Install it globally:

```sh
npm install -g expo-cli
```

---

## 4. Configure Environment Variables (if needed)

If your project requires environment variables, update or create the necessary files in `Smart_Dispenser/config/config.js` as per your project requirements.

---

## 5. Start the Development Server

To launch the Expo development server, run:

```sh
npx expo start
```
Or:
```sh
expo start
```

This will open a new tab in your browser with the Expo Dev Tools.

---

## 6. Run the App on Your Device or Emulator

- **On a physical device:**
  - Download the **Expo Go** app from the [Google Play Store](https://play.google.com/store/apps/details?id=host.exp.exponent) or [Apple App Store](https://apps.apple.com/app/expo-go/id982107779).
  - Scan the QR code displayed in the Expo Dev Tools or terminal.
- **On an emulator:**
  - For Android: Use Android Studio to launch an emulator, then click "Run on Android device/emulator" in Expo Dev Tools.
  - For iOS: Use Xcode to launch a simulator, then click "Run on iOS simulator" (macOS only).

---


## 7. Building the App with EAS Build


Expo Application Services (EAS) allows you to build production-ready APKs (Android) and IPAs (iOS) in the cloud, suitable for app store submission or direct device installation.

### 1. Install EAS CLI (if not already installed)

```sh
npm install -g eas-cli
```

### 2. Log in to your Expo account

```sh
eas login
```

### 3. Configure EAS Build

If you haven't already, initialize EAS in your project root:

```sh
eas build:configure
```

This will create or update the `eas.json` file in your project root. Make sure your `eas.json` contains the correct build profiles for your needs (see [EAS Build configuration docs](https://docs.expo.dev/build/eas-json/)).

### 4. Update the App Version (Recommended)

Before building, update your app version and build number in `app.json` or `app.config.js`:

```
{
  "expo": {
    "version": "1.0.0", // Update this for each release
    "android": {
      "versionCode": 1 // Increment for each Android build
    },
    "ios": {
      "buildNumber": "1" // Increment for each iOS build
    }
  }
}
```

### 5. Run a Build

To build for Android (APK or AAB):

```sh
eas build --platform android
```

To build for iOS:

```sh
eas build --platform ios z
```

You can also use `--profile development` for internal testing builds. See your `eas.json` for available profiles.

After the build completes, EAS will provide a download link for your APK/AAB/IPA file.

For more options and details, see the [EAS Build documentation](https://docs.expo.dev/build/introduction/).

---

## 8. Troubleshooting

- If you encounter issues, refer to the [Expo Documentation](https://docs.expo.dev/) and [EAS Build Documentation](https://docs.expo.dev/build/introduction/).
- Ensure all prerequisites are installed and up to date.
- Delete `node_modules` and run `npm install` or `yarn install` again if you face dependency issues.


## 9. Additional Resources

- [Expo Documentation](https://docs.expo.dev/)
- [EAS Build Documentation](https://docs.expo.dev/build/introduction/)
- [React Native Documentation](https://reactnative.dev/)



