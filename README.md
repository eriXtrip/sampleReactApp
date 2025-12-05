# SampleReactApp

An Expo Router React Native application with route groups for auth, dashboard, and profile flows. The app uses a themed component system, React Context for user and profile state, local SQLite storage, and push/local notifications.

## Features
- Expo Router navigation (file-based routing)
- Themed UI components (ThemedView/Text/Button/etc.)
- User and Profile contexts
- API base URL configurable at runtime (persisted with AsyncStorage)
- Notifications via expo-notifications
- Local database via expo-sqlite
- Android, iOS, and Web targets

## Tech Stack
- React Native: 0.79.3
- React: 19.0.0
- Expo SDK: ~53.0.11
- Expo Router: ~5.1.0
- Key Expo libs: expo-notifications, expo-sqlite, expo-secure-store, expo-status-bar, expo-navigation-bar, expo-crypto, expo-linking

## Getting Started

### Prerequisites
- Node.js LTS (>= 18)
- npm (bundled with Node)
- For Android: Android Studio + a device/emulator
- For iOS (macOS only): Xcode + a device/simulator
- Optional: physical device with Expo Go installed (Android/iOS)

### Install dependencies
```
npm install
```

### Run the app (development)
Start the Metro bundler:
```
npm run start
```
Then in the terminal UI:
- Press "a" to launch on Android emulator/device
- Press "i" to launch on iOS simulator (macOS)
- Press "w" to launch on Web

Alternatively, build and install a development client directly:
- Android:
```
npm run android
```
- iOS (macOS):
```
npm run ios
```

> Notes
> - Ensure your device and development machine are on the same network when using a physical device.
> - If network discovery is restricted, switch the Expo connection mode to "Tunnel" in the CLI UI.

## API Configuration
The app expects a backend API base URL that you can set at runtime.

How to set the API URL:
1. Run the app.
2. Navigate to the "Contact" screen (this is the in-app API configuration screen).
3. Enter your API base URL, e.g. `http://192.168.0.112:3001/api`.
4. Tap "Save and Continue". The app will verify connectivity before saving.

Details:
- Storage: The URL is persisted using AsyncStorage (see utils/apiManager.js).
- Reachability check: The URL is validated via a connectivity test before saving.
- Clearing the URL: If you need to clear/reset the API URL, reinstall the app or use any in-app action that clears it (login flow may include a clear action).

Tips for device testing:
- Do not use `localhost` or `127.0.0.1` for the API on a physical device. Use your computer's LAN IP (e.g. `http://192.168.x.x:PORT`).
- Ensure your firewall allows inbound connections to the API port.

## Project Scripts
Defined in package.json:
- `npm run start` — Start the Expo dev server
- `npm run android` — Build and run on Android device/emulator
- `npm run ios` — Build and run on iOS simulator (macOS)
- `npm run web` — Start web build/dev server

## Project Structure
High-level directories:
- `app/` — Expo Router routes and layouts
  - `_layout.jsx` — Root layout and providers (notifications, contexts, SQLite)
  - `index.jsx` — Root route
  - `(auth)/` — Auth screens and layout
  - `(dashboard)/` — Dashboard screens and layout
  - `(profile)/` — Profile screens and layout
  - `contact.jsx` — API configuration screen
  - `TestSQLInjectionScreen.jsx` — Testing screen
- `components/` — Reusable themed UI components (ThemedView/Text/Button/etc.)
- `constants/` — Static config (e.g. Colors)
- `contexts/` — React Context providers (UserContext, ProfileContext)
- `hooks/` — Custom hooks (user helpers, resend timer)
- `utils/` — Helpers (API manager, notifications helpers)
- `assets/` — Images/fonts (if applicable)
- `android/` — Native Android project (present if you built locally)
- `backend/`, `my-app-backend/` — Backend-related code (if used alongside this app)
- Root scripts: `rateLimiter.js`, `testConnection.js`, `testMailtrap.js`, `testRegister.js` (utility/testing scripts)

## Notable Implementation Details
- Notifications: Configured in `app/_layout.jsx` using `expo-notifications`. The app requests notification permission on startup and shows foreground banners.
- Providers: `UserProvider` and `ProfileProvider` wrap the app, and `SQLiteProvider` initializes local database access.
- Theming: Color scheme is derived from the device color scheme and `constants/Colors.js`. Themed components in `components/` should be preferred for consistent styling.

## Building Production Binaries
You can use EAS to create production builds:
1. Install the EAS CLI (if not installed)
```
npm install -g eas-cli
```
2. Log in and configure your project
```
eas login
```
3. Trigger a build
```
eas build -p android
# or
eas build -p ios
```
See `eas.json` for profiles and configuration.

## Build a Development Build (build your debug APK without launching it.)
To build a development build, run the following command:
```
npx expo prebuild          #regenerates native code to include it.
cd android
./gradlew assembleDebug    # on Windows PowerShell / CMD 
```
This will create a `android\app\build\outputs\apk\debug\app-debug.apk` directory with the production build files.

## Build a APK (build your APK without launching it.)
To build a APK build, run the following command:
```
npx expo prebuild          #regenerates native code to include it.
cd android
./gradlew assembleRelease    # on Windows PowerShell / CMD 
```
This will create a `android/app/build/outputs/apk/release/app-release.apk` directory with the app build files.

## Build a ABB (build your ABB to be launch in Playstore.)
To build a ABB build, run the following command:
```
npx expo prebuild          #regenerates native code to include it.
cd android
./gradlew bundleRelease    # on Windows PowerShell / CMD 
```
This will create a `android/app/build/outputs/bundle/release/app-release.aab` directory with the app build files.

## Troubleshooting
- API not reachable
  - Verify the backend is running and reachable at the configured URL
  - Use LAN IP instead of localhost for physical devices
  - Check firewall rules and ensure the port is open

- Device cannot connect to Metro
  - Ensure both device and computer are on the same network
  - Switch Expo connection mode to Tunnel
  - Try restarting Metro: stop and re-run `npm run start`

- Notifications not appearing
  - Ensure permissions are granted on the device
  - On Android, check system settings for app notifications

- SQLite related issues
  - If schema changes, reinstalling the app can help reset the local DB

## License
No license specified. Treat as private/internal unless a license is added.

## Acknowledgements
Built with Expo, React Native, and Expo Router.
