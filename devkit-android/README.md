# DEVKIT Android (Kotlin WebView wrapper)

This is the native Android container for **DEVKIT**. It is a Kotlin app that hosts a `WebView` configured to behave like a real installable app:

- JavaScript + IndexedDB enabled (so the workspace, tool history, and favorites persist)
- Camera permission routing (for the QR Scanner tool)
- Pull-to-refresh
- Back button navigates WebView history instead of closing the app
- Edge-to-edge layout with navy status bar / nav bar matching the DEVKIT theme
- Material 3 theme with purple → cyan accent colors
- Adaptive launcher icons (purple → cyan "D" badge)

The WebView loads the DEVKIT PWA from a deployment URL. **You must deploy DEVKIT to a public HTTPS URL first**, then point this app to it.

---

## How to build the APK

### Prerequisites

- Android SDK (platform-tools, platforms;android-34, build-tools;34.0.0)
- JDK 17 with `jlink` (Temurin 17 recommended — JRE-only installs will fail at the JdkImageTransform step)
- Gradle 8.7+ (or just use the bundled `gradlew` wrapper once it's regenerated)

### Build

```bash
cd devkit-android

# Set up env (once per shell)
export ANDROID_HOME=/path/to/android-sdk
export JAVA_HOME=/path/to/jdk-17
export PATH=$JAVA_HOME/bin:$ANDROID_HOME/cmdline-tools/latest/bin:$ANDROID_HOME/platform-tools:$PATH

# Point the project at your SDK
echo "sdk.dir=$ANDROID_HOME" > local.properties

# Update the URL in MainActivity.kt (line ~140) to your deployment URL:
#   private const val DEVKIT_URL = "https://your-deployment.vercel.app"

# Build debug APK
./gradlew :app:assembleDebug
# Output: app/build/outputs/apk/debug/app-debug.apk

# Build signed release APK
./gradlew :app:assembleRelease
# Output: app/build/outputs/apk/release/app-release-unsigned.apk
# (you'll need to sign it with your own keystore for Play Store)
```

### Install on a phone

```bash
# Connect phone via USB with debugging enabled
adb install app/build/outputs/apk/debug/app-debug.apk
```

Or copy the APK to your phone and tap to install (enable "Install from unknown sources" in Android settings).

---

## Project structure

```
devkit-android/
├── app/
│   ├── build.gradle.kts
│   ├── proguard-rules.pro
│   └── src/main/
│       ├── AndroidManifest.xml
│       ├── java/com/nayoncodex/devkit/
│       │   └── MainActivity.kt
│       └── res/
│           ├── drawable/ic_error.xml
│           ├── layout/activity_main.xml
│           ├── mipmap-{mdpi,hdpi,xhdpi,xxhdpi,xxxhdpi}/ic_launcher*.png
│           ├── values/colors.xml · strings.xml · themes.xml
│           └── xml/network_security_config.xml
├── build.gradle.kts
├── gradle.properties
├── gradle/wrapper/gradle-wrapper.properties
├── settings.gradle.kts
└── README.md (this file)
```

---

## Security

- `usesCleartextTraffic="false"` — HTTPS only (no HTTP)
- `allowFileAccess="false"` + `allowContentAccess="false"` — web content cannot read local files
- `network_security_config.xml` enforces system-trusted CA only
- JavaScript `alert()` and `confirm()` are routed through native dialogs (used by the Workspace's delete/restore confirmations)
- Camera permission (for the QR Scanner) is requested on demand

---

## Credits

- **App name:** DEVKIT
- **Tagline:** Build Smarter. Code Better.
- **Version:** 1.0.0
- **Developer:** Nayon Ahamed
- **Brand:** NCX / NayonCodeX
- **License:** MIT

The web app being wrapped is in the parent directory (`../`). See `../README.md` for the full feature list.
