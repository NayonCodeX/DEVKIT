plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
}

android {
    namespace = "com.nayoncodex.devkit"
    compileSdk = 34

    defaultConfig {
        applicationId = "com.nayoncodex.devkit"
        minSdk = 24
        targetSdk = 34
        versionCode = 4
        versionName = "1.0.3"
        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
    }

    signingConfigs {
        create("release") {
            storeFile = file("devkit-release.keystore")
            storePassword = "devkit1234"
            keyAlias = "devkit"
            keyPassword = "devkit1234"
        }
    }

    buildTypes {
        release {
            isMinifyEnabled = false
            proguardFiles(getDefaultProguardFile("proguard-android-optimize.txt"), "proguard-rules.pro")
            signingConfig = signingConfigs.getByName("release")
        }
        debug {
            isDebuggable = true
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    kotlinOptions {
        jvmTarget = "17"
    }

    buildFeatures {
        viewBinding = true
    }

    // By default, AGP excludes asset files / folders starting with `_`
    // (considered private). Our Next.js static export uses `_next/`
    // which holds all JS/CSS — must be included.
    androidResources {
        ignoreAssetsPattern = ""
    }
    aaptOptions {
        noCompress("html", "js", "css", "json", "svg", "woff2", "txt")
    }
}

dependencies {
    implementation("androidx.core:core-ktx:1.13.1")
    implementation("androidx.appcompat:appcompat:1.7.0")
    implementation("com.google.android.material:material:1.12.0")
    implementation("androidx.constraintlayout:constraintlayout:2.1.4")
    implementation("androidx.webkit:webkit:1.11.0")
    implementation("androidx.swiperefreshlayout:swiperefreshlayout:1.1.0")
}
