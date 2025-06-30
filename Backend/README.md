# Smart Tissue Dispenser - Full Stack Project

This repository contains both the **Backend API** (Django, Django REST Framework, Channels, PostgreSQL) and the **Frontend Mobile App** (React Native with Expo) for the Smart Tissue Dispenser project.

---

## Table of Contents
- [Backend (Django)](#backend-django)
- [Frontend (React Native/Expo)](#frontend-react-nativeexpo)
- [Project Structure](#project-structure)
- [Troubleshooting & Resources](#troubleshooting--resources)

---

## Backend (Django)

### Features
- JWT authentication (SimpleJWT)
- Google OAuth support
- WebSocket support via Django Channels and Redis
- CORS enabled for frontend integration
- Swagger/OpenAPI documentation
- Custom user model

### Prerequisites
- Python 3.9+
- PostgreSQL database
- Redis server (for Channels and caching)
- [pipenv](https://pipenv.pypa.io/en/latest/) or `pip` for dependency management

### Setup Instructions
1. **Clone the Repository**
   ```sh
   git clone <your-repo-url>
   cd Backend
   ```
2. **Create and Activate Virtual Environment**
   ```sh
   python -m venv myenv
   # On Windows:
   myenv\Scripts\activate
   # On Linux/Mac:
   source myenv/bin/activate
   ```
3. **Install Dependencies**
   ```sh
   pip install -r requirements.txt
   ```
4. **Configure Environment Variables**
   Create a `.env` file in the `Backend/` directory with the following content:
   ```env
   # Django
   SECRET_KEY=your-secret-key
   DEBUG=True
   ALLOWED_HOSTS=127.0.0.1,localhost

   # Database
   DB_NAME=your_db_name
   DB_USER=your_db_user
   DB_PASSWORD=your_db_password
   DB_HOST=localhost
   DB_PORT=5432

   # Redis
   REDIS_URL=redis://localhost:6379/1

   # Email
   EMAIL_HOST_USER=your_email@gmail.com
   EMAIL_HOST_PASSWORD=your_email_password

   # Google OAuth
   GOOGLE_WEB_CLIENT_ID=your-google-web-client-id
   GOOGLE_ANDROID_CLIENT_ID=your-google-android-client-id
   ```
5. **Database Setup**
   - Ensure PostgreSQL is running and the database/user exist as per your `.env`.
   - Run migrations:
     ```sh
     python manage.py migrate
     ```
6. **Create Superuser (for Django Admin)**
   ```sh
   python manage.py createsuperuser
   ```
7. **Run the Development Server**
   ```sh
   python manage.py runserver
   ```
   The API will be available at `http://127.0.0.1:8000/`.

### API Documentation
- Swagger/OpenAPI docs:
  - `http://127.0.0.1:8000/swagger/`
  - `http://127.0.0.1:8000/redoc/`

### Running Tests
```sh
python manage.py test
```

### Notes
- Make sure Redis and PostgreSQL are running before starting the server.
- For production, set `DEBUG=False` and use strong, unique values for all secrets.
- Do **not** commit your `.env` file or sensitive credentials to version control.

---

## Frontend (React Native/Expo)

### Prerequisites
- **Node.js**
- **npm** (comes with Node.js)
- **Git**
- **Expo CLI** (for React Native development)

### Setup Instructions
1. **Clone the Repository**
   ```sh
   git clone <repository-url>
   cd Smart_Dispenser
   ```
2. **Install Project Dependencies**
   - Using npm:
     ```sh
     npm install
     ```
   - Or using yarn:
     ```sh
     yarn install
     ```
3. **Install Expo CLI (if not already installed)**
   ```sh
   npm install -g expo-cli
   ```
4. **Configure Environment Variables (if needed)**
   - Update or create the necessary files in `Smart_Dispenser/config/config.js` as per your project requirements.
5. **Start the Development Server**
   ```sh
   npx expo start
   # or
   expo start
   ```
   This will open a new tab in your browser with the Expo Dev Tools.
6. **Run the App on Your Device or Emulator**
   - **On a physical device:**
     - Download the **Expo Go** app from the [Google Play Store](https://play.google.com/store/apps/details?id=host.exp.exponent) or [Apple App Store](https://apps.apple.com/app/expo-go/id982107779).
     - Scan the QR code displayed in the Expo Dev Tools or terminal.
   - **On an emulator:**
     - For Android: Use Android Studio to launch an emulator, then click "Run on Android device/emulator" in Expo Dev Tools.
     - For iOS: Use Xcode to launch a simulator, then click "Run on iOS simulator" (macOS only).

---

### Building the App with EAS Build

Expo Application Services (EAS) allows you to build production-ready APKs (Android) and IPAs (iOS) in the cloud, suitable for app store submission or direct device installation.

1. **Install EAS CLI (if not already installed)**
   ```sh
   npm install -g eas-cli
   ```
2. **Log in to your Expo account**
   ```sh
   eas login
   ```
3. **Configure EAS Build**
   ```sh
   eas build:configure
   ```
   This will create or update the `eas.json` file in your project root. Make sure your `eas.json` contains the correct build profiles for your needs (see [EAS Build configuration docs](https://docs.expo.dev/build/eas-json/)).
4. **Update the App Version (Recommended)**
   - Update your app version and build number in `app.json` or `app.config.js`:
     ```json
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
5. **Run a Build**
   - To build for Android (APK or AAB):
     ```sh
     eas build --platform android
     ```
   - To build for iOS:
     ```sh
     eas build --platform ios
     ```
   - You can also use `--profile development` for internal testing builds. See your `eas.json` for available profiles.
   - After the build completes, EAS will provide a download link for your APK/AAB/IPA file.
   - For more options and details, see the [EAS Build documentation](https://docs.expo.dev/build/introduction/).

---

## Project Structure
```
Backend/
├── backend/           # Django project settings
├── core/              # Core app
├── device/            # Device app
├── users/             # Users app
├── requirements.txt   # Python dependencies
├── manage.py          # Django management script
└── ...

Smart_Dispenser/
├── app/               # App screens and navigation
├── components/        # Reusable React components
├── config/            # App configuration
├── context/           # React context providers
├── hooks/             # Custom React hooks
├── services/          # API and utility services
├── store/             # State management
├── styles/            # Style definitions
├── themes/            # Theme files
├── utils/             # Utility functions
├── assets/            # Images, fonts, etc.
├── package.json       # NPM dependencies
├── app.json           # Expo app config
└── ...
```

---

## Troubleshooting & Resources

- If you encounter issues, refer to the [Expo Documentation](https://docs.expo.dev/) and [EAS Build Documentation](https://docs.expo.dev/build/introduction/).
- Ensure all prerequisites are installed and up to date.
- Delete `node_modules` and run `npm install` or `yarn install` again if you face dependency issues.
- For backend issues, check that PostgreSQL and Redis are running, and review your `.env` configuration.

### Additional Resources
- [Expo Documentation](https://docs.expo.dev/)
- [EAS Build Documentation](https://docs.expo.dev/build/introduction/)
- [React Native Documentation](https://reactnative.dev/)
- [Django Documentation](https://docs.djangoproject.com/)
- [Django REST Framework](https://www.django-rest-framework.org/)

---

