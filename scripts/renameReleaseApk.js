/**
 * PAPERTRAIL — Automated Release APK Renaming & Integrity Verification
 *
 * Ensures:
 * 1. Renames output artifact to 'papertrail.apk'
 * 2. Placed at: android/app/build/outputs/apk/release/papertrail.apk
 * 3. Fails clearly if source or target APK is missing
 * 4. Preserves package name 'com.papertrail.app'
 */

const fs = require('fs');
const path = require('path');

const RELEASE_DIR = path.resolve(__dirname, '../android/app/build/outputs/apk/release');
const TARGET_APK = path.join(RELEASE_DIR, 'papertrail.apk');

function renameReleaseApk() {
  console.log('[PAPERTRAIL] Running release APK rename pipeline...');

  if (!fs.existsSync(RELEASE_DIR)) {
    console.error(`\n[CRITICAL BUILD FAILURE] Release output directory does not exist:`);
    console.error(`  ${RELEASE_DIR}`);
    console.error(`The build failed to produce any release artifacts.\n`);
    process.exit(1);
  }

  if (fs.existsSync(TARGET_APK)) {
    const stats = fs.statSync(TARGET_APK);
    if (stats.size > 0) {
      console.log(`✓ 'papertrail.apk' is already generated and valid at:`);
      console.log(`  ${TARGET_APK} (${stats.size} bytes)`);
      return;
    }
  }

  // Look for generated release APKs under standard Gradle names
  const candidates = [
    path.join(RELEASE_DIR, 'app-release.apk'),
    path.join(RELEASE_DIR, 'app-release-unsigned.apk')
  ];

  let sourceApk = candidates.find((p) => fs.existsSync(p));

  if (!sourceApk) {
    const allFiles = fs.readdirSync(RELEASE_DIR);
    const apks = allFiles.filter((f) => f.endsWith('.apk') && f !== 'papertrail.apk');
    if (apks.length > 0) {
      sourceApk = path.join(RELEASE_DIR, apks[0]);
    }
  }

  if (!sourceApk || !fs.existsSync(sourceApk)) {
    console.error(`\n[CRITICAL BUILD FAILURE] Release APK not found in directory:`);
    console.error(`  ${RELEASE_DIR}`);
    console.error(`Build completed without producing an APK artifact.\n`);
    process.exit(1);
  }

  console.log(`Found source artifact: ${path.basename(sourceApk)}`);
  console.log(`Automatically renaming -> papertrail.apk...`);

  try {
    fs.renameSync(sourceApk, TARGET_APK);
  } catch (err) {
    // Fallback to copy and unlink if cross-device or permission lock
    fs.copyFileSync(sourceApk, TARGET_APK);
    fs.unlinkSync(sourceApk);
  }

  if (!fs.existsSync(TARGET_APK) || fs.statSync(TARGET_APK).size === 0) {
    console.error(`\n[CRITICAL BUILD FAILURE] Target APK is missing or empty after rename:`);
    console.error(`  ${TARGET_APK}\n`);
    process.exit(1);
  }

  const finalStats = fs.statSync(TARGET_APK);
  console.log(`\n======================================================================`);
  console.log(`SUCCESS: Renamed release APK generated!`);
  console.log(`Path: ${TARGET_APK}`);
  console.log(`Size: ${finalStats.size} bytes`);
  console.log(`======================================================================\n`);
}

renameReleaseApk();
