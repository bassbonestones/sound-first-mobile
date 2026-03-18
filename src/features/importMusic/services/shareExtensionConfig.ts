/**
 * Share Extension Configuration
 *
 * This file documents the app.json configuration needed for
 * share extension functionality on iOS and Android.
 *
 * IMPORTANT: The configurations below should be merged into app.json
 * when ready to implement native share extension support.
 */

/**
 * iOS Share Extension Configuration
 *
 * For iOS, we need to configure:
 * 1. Deep linking scheme for the app
 * 2. Document types the app can open
 * 3. Uniform Type Identifiers (UTIs) for file types
 *
 * Note: Full iOS Share Extension (appearing in the share sheet)
 * requires an app extension target and native code. For now,
 * we support "Open In" functionality via document types.
 */
export const IOS_CONFIG = {
  ios: {
    // Add this to existing iOS config
    infoPlist: {
      // URL schemes for deep linking
      CFBundleURLTypes: [
        {
          CFBundleURLName: "com.soundfirst.mobile",
          CFBundleURLSchemes: ["soundfirst"],
        },
      ],

      // Document types the app can open
      CFBundleDocumentTypes: [
        {
          CFBundleTypeName: "MusicXML",
          LSHandlerRank: "Alternate",
          LSItemContentTypes: [
            "public.xml",
            "com.recordare.musicxml",
            "public.musicxml",
          ],
        },
        {
          CFBundleTypeName: "Compressed MusicXML",
          LSHandlerRank: "Alternate",
          LSItemContentTypes: ["com.recordare.musicxml-package", "public.mxl"],
        },
        {
          CFBundleTypeName: "PDF Document",
          LSHandlerRank: "Alternate",
          LSItemContentTypes: ["com.adobe.pdf"],
        },
      ],

      // Exported UTIs (for MusicXML types not defined by system)
      UTExportedTypeDeclarations: [
        {
          UTTypeIdentifier: "public.musicxml",
          UTTypeDescription: "MusicXML Document",
          UTTypeConformsTo: ["public.xml"],
          UTTypeTagSpecification: {
            "public.filename-extension": ["musicxml", "xml"],
            "public.mime-type": ["application/vnd.recordare.musicxml+xml"],
          },
        },
        {
          UTTypeIdentifier: "public.mxl",
          UTTypeDescription: "Compressed MusicXML",
          UTTypeConformsTo: ["public.zip-archive"],
          UTTypeTagSpecification: {
            "public.filename-extension": ["mxl"],
            "public.mime-type": ["application/vnd.recordare.musicxml"],
          },
        },
      ],
    },
  },
};

/**
 * Android Intent Filter Configuration
 *
 * For Android, we configure intent filters to receive files
 * via ACTION_SEND and ACTION_VIEW intents.
 */
export const ANDROID_CONFIG = {
  android: {
    // Add this to existing Android config
    intentFilters: [
      // Handle files opened directly
      {
        action: "VIEW",
        data: [
          {
            scheme: "file",
            mimeType: "application/vnd.recordare.musicxml+xml",
          },
          {
            scheme: "file",
            mimeType: "application/vnd.recordare.musicxml",
          },
          {
            scheme: "content",
            mimeType: "application/xml",
          },
          {
            scheme: "content",
            mimeType: "text/xml",
          },
          {
            scheme: "content",
            mimeType: "application/pdf",
          },
        ],
        category: ["BROWSABLE", "DEFAULT"],
      },
      // Handle files shared via share menu
      {
        action: "SEND",
        data: [
          { mimeType: "application/vnd.recordare.musicxml+xml" },
          { mimeType: "application/vnd.recordare.musicxml" },
          { mimeType: "application/xml" },
          { mimeType: "text/xml" },
          { mimeType: "application/pdf" },
          { mimeType: "image/*" },
        ],
        category: ["DEFAULT"],
      },
      // Handle multiple files shared
      {
        action: "SEND_MULTIPLE",
        data: [{ mimeType: "image/*" }],
        category: ["DEFAULT"],
      },
    ],
  },
};

/**
 * Expo Plugins Configuration
 *
 * Additional plugins that may be needed:
 */
export const PLUGINS_CONFIG = {
  plugins: [
    // Existing plugins...
    "expo-linking", // For deep linking
    "expo-document-picker", // Enhanced document picker
    "expo-file-system", // File operations
  ],
};

/**
 * Full app.json merge instructions
 *
 * To enable share extension:
 *
 * 1. Add deep linking scheme:
 *    - Add "scheme": "soundfirst" to expo config
 *
 * 2. Add iOS document types:
 *    - Add CFBundleDocumentTypes to ios.infoPlist
 *    - Add UTExportedTypeDeclarations to ios.infoPlist
 *    - Add CFBundleURLTypes to ios.infoPlist
 *
 * 3. Add Android intent filters:
 *    - Add intentFilters array to android config
 *
 * 4. Run expo prebuild to generate native code:
 *    npx expo prebuild
 *
 * Example final app.json structure is shown below.
 */
export const FULL_EXAMPLE = {
  expo: {
    name: "Sound First",
    slug: "sound-first-mobile",
    scheme: "soundfirst", // <-- Add this
    version: "1.0.0",
    // ... other config

    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.soundfirst.mobile",
      infoPlist: {
        // Existing permissions
        NSMicrophoneUsageDescription: "...",
        NSCameraUsageDescription: "...",

        // Add document types
        CFBundleDocumentTypes: [
          /* ... see IOS_CONFIG above */
        ],

        // Add URL types
        CFBundleURLTypes: [
          {
            CFBundleURLName: "com.soundfirst.mobile",
            CFBundleURLSchemes: ["soundfirst"],
          },
        ],
      },
    },

    android: {
      adaptiveIcon: {
        /* ... */
      },
      package: "com.soundfirst.mobile",
      permissions: ["android.permission.RECORD_AUDIO"],

      // Add intent filters
      intentFilters: [
        /* ... see ANDROID_CONFIG above */
      ],
    },

    plugins: [
      // ... existing plugins
    ],
  },
};
