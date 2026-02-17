const { getDefaultConfig } = require("expo/metro-config");

// Use plain Expo metro config
// NativeWind styles are pre-compiled, so we don't need the metro plugin for production builds
module.exports = getDefaultConfig(__dirname);
