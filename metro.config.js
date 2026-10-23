const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);
// Reference checkouts and build artifacts are not application modules. Watching
// the Telegram source tree also overwhelms the Windows file watcher.
config.resolver.blockList = [/[\\/]artifacts[\\/].*/, /[\\/]\.git[\\/].*/];

module.exports = config;
