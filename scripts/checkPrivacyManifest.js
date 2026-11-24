#!/usr/bin/env node
/**
 * Privacy manifest and plist check.  `node scripts/checkPrivacyManifest.js`
 *
 * Checks app.json's ios.privacyManifests and iOS usage strings: tracking stays
 * off, every required-reason code is one Apple documents for its category,
 * every collected data type is fully declared and listed in PRIVACY_DATA.md,
 * the camera prompt exists in English, Spanish and French, and no Face ID,
 * Motion or location prompt ships unless the app uses it.
 *
 * Exit code 1 = a problem. No dependencies.
 */
const { existsSync, readFileSync } = require('node:fs');
const { join } = require('node:path');

/** Reason codes Apple documents for each required-reason API category. */
const ALLOWED_REASONS = {
  NSPrivacyAccessedAPICategoryFileTimestamp: ['DDA9.1', 'C617.1', '3B52.1', '0A2A.1'],
  NSPrivacyAccessedAPICategorySystemBootTime: ['35F9.1', '8FFB.1', '3D61.1'],
  NSPrivacyAccessedAPICategoryDiskSpace: ['85F4.1', 'E174.1', '7D9E.1', 'B728.1'],
  NSPrivacyAccessedAPICategoryActiveKeyboards: ['3EC4.1', '54BD.1'],
  NSPrivacyAccessedAPICategoryUserDefaults: ['CA92.1', '1C8F.1', 'C56D.1', 'AC6B.1'],
};

/** Prompts that must not ship unless the app uses them. A plugin-backed key is
 *  present unless that plugin is listed with its permission option set to false,
 *  because those plugins add their default prompt even when not listed. */
const GUARDED_PERMISSIONS = {
  faceId: { keys: ['NSFaceIDUsageDescription'], plugin: ['expo-secure-store', 'faceIDPermission'] },
  motion: { keys: ['NSMotionUsageDescription'], plugin: ['expo-sensors', 'motionPermission'] },
  location: {
    keys: ['NSLocationWhenInUseUsageDescription', 'NSLocationAlwaysAndWhenInUseUsageDescription', 'NSLocationAlwaysUsageDescription'],
  },
};

const CAMERA_KEY = 'NSCameraUsageDescription';
const LOCALES = ['es', 'fr'];

const nonEmpty = (v) => typeof v === 'string' && v.trim() !== '';

function pluginOptions(plugins, name) {
  const entry = (plugins ?? []).find((p) => p === name || (Array.isArray(p) && p[0] === name));
  if (entry === undefined) return undefined;
  return Array.isArray(entry) ? (entry[1] ?? {}) : {};
}

function permissionPresent(config, { keys, plugin }) {
  const infoPlist = config.ios?.infoPlist ?? {};
  if (keys.some((k) => k in infoPlist)) return true;
  if (!plugin) return false;
  const [name, option] = plugin;
  const options = pluginOptions(config.plugins, name);
  return options?.[option] !== false;
}

/**
 * @param {object} config  The `expo` object from app.json.
 * @param {{ privacyDoc: string, locales: Record<string, object | null>, tracking?: boolean, usedPermissions?: string[] }} options
 *   privacyDoc is PRIVACY_DATA.md's text; locales maps each locale code to its parsed
 *   file, or null when the file is missing.
 * @returns {string[]} problems; empty means pass.
 */
function checkManifest(config, options) {
  const problems = [];
  const manifest = config.ios?.privacyManifests;
  if (!manifest) return ['app.json has no ios.privacyManifests'];

  const tracking = options.tracking === true;
  if (manifest.NSPrivacyTracking !== tracking) {
    problems.push(`NSPrivacyTracking must be ${tracking}, found ${JSON.stringify(manifest.NSPrivacyTracking)}`);
  }
  if (!tracking && (manifest.NSPrivacyTrackingDomains ?? []).length > 0) {
    problems.push('NSPrivacyTrackingDomains must be empty while tracking is off');
  }

  for (const api of manifest.NSPrivacyAccessedAPITypes ?? []) {
    const allowed = ALLOWED_REASONS[api.NSPrivacyAccessedAPIType];
    if (!allowed) {
      problems.push(`unknown required-reason API category ${api.NSPrivacyAccessedAPIType}`);
      continue;
    }
    const reasons = api.NSPrivacyAccessedAPITypeReasons ?? [];
    if (reasons.length === 0) problems.push(`${api.NSPrivacyAccessedAPIType} lists no reason code`);
    for (const code of reasons) {
      if (!allowed.includes(code)) problems.push(`${api.NSPrivacyAccessedAPIType} reason ${code} is not an Apple documented reason`);
    }
  }

  for (const item of manifest.NSPrivacyCollectedDataTypes ?? []) {
    const name = item.NSPrivacyCollectedDataType;
    if (typeof item.NSPrivacyCollectedDataTypeLinked !== 'boolean') problems.push(`${name} has no NSPrivacyCollectedDataTypeLinked`);
    if (item.NSPrivacyCollectedDataTypeTracking !== false) problems.push(`${name} must set NSPrivacyCollectedDataTypeTracking to false`);
    if (!Array.isArray(item.NSPrivacyCollectedDataTypePurposes) || item.NSPrivacyCollectedDataTypePurposes.length === 0) {
      problems.push(`${name} has no NSPrivacyCollectedDataTypePurposes`);
    }
    if (!options.privacyDoc.includes(name)) problems.push(`${name} is not listed in PRIVACY_DATA.md`);
  }

  if (!nonEmpty(config.ios?.infoPlist?.[CAMERA_KEY])) problems.push(`ios.infoPlist has no ${CAMERA_KEY}`);
  for (const lang of LOCALES) {
    if (!config.locales?.[lang]) {
      problems.push(`app.json locales has no ${lang} file`);
      continue;
    }
    const strings = options.locales[lang];
    if (!strings) problems.push(`${lang} locale file ${config.locales[lang]} does not exist`);
    else if (!nonEmpty(strings[CAMERA_KEY])) problems.push(`${lang} locale file has no ${CAMERA_KEY}`);
  }

  const used = options.usedPermissions ?? [];
  for (const [permission, spec] of Object.entries(GUARDED_PERMISSIONS)) {
    if (!used.includes(permission) && permissionPresent(config, spec)) {
      problems.push(`${spec.keys[0]} would ship but the app does not use ${permission}`);
    }
  }
  return problems;
}

module.exports = { checkManifest, ALLOWED_REASONS };

if (require.main === module) {
  const root = join(require.main.filename, '..', '..');
  const config = JSON.parse(readFileSync(join(root, 'app.json'), 'utf8')).expo;
  const locales = Object.fromEntries(
    LOCALES.map((lang) => {
      const file = config.locales?.[lang] && join(root, config.locales[lang]);
      return [lang, file && existsSync(file) ? JSON.parse(readFileSync(file, 'utf8')) : null];
    }),
  );
  const problems = checkManifest(config, { privacyDoc: readFileSync(join(root, 'PRIVACY_DATA.md'), 'utf8'), locales });
  if (problems.length > 0) {
    console.error(`privacy manifest check: ${problems.length} problem(s)`);
    for (const p of problems) console.error(`  ${p}`);
    process.exit(1);
  }
  console.log('privacy manifest check: OK');
}
