const { withAppBuildGradle } = require('@expo/config-plugins');

/**
 * Expo Config Plugin to automatically rename Android release APK to papertrail.apk
 * and ensure output is placed at: android/app/build/outputs/apk/release/papertrail.apk
 */
module.exports = function withRenameReleaseApk(config) {
  return withAppBuildGradle(config, (modConfig) => {
    let contents = modConfig.modResults.contents;
    if (!contents.includes('papertrail.apk')) {
      const codeToInject = `
    // Preserve existing release build configuration and automatically name output APK to papertrail.apk
    applicationVariants.all { variant ->
        if (variant.buildType.name == 'release') {
            variant.outputs.all { output ->
                outputFileName = "papertrail.apk"
            }
        }
    }
`;
      if (contents.includes('androidResources {')) {
        contents = contents.replace('androidResources {', `${codeToInject}\n    androidResources {`);
      } else {
        contents += `\n${codeToInject}\n`;
      }
      modConfig.modResults.contents = contents;
    }
    return modConfig;
  });
};
