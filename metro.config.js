const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

// Only apply NativeWind in development/local builds
// EAS Build will use default config
try {
  const { withNativeWind } = require("nativewind/metro");
  module.exports = withNativeWind(config, {
    input: "./global.css",
  });
} catch (error) {
  // Fallback to default config if NativeWind fails to load
  module.exports = config;
}
