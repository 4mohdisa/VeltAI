// PHASE4_ROWS.md row 12b: scripts/checkPrivacyManifest.js. The real app.json,
// PRIVACY_DATA.md and infoPlist locale files pass; each broken copy fails with
// one readable problem naming what is wrong.
import { readFileSync } from 'fs';
import { join } from 'path';

import { checkManifest } from '../../scripts/checkPrivacyManifest';

type Options = { privacyDoc: string; locales: Record<string, object | null>; tracking?: boolean; usedPermissions?: string[] };
type Config = {
  ios: { infoPlist: Record<string, unknown>; privacyManifests: Record<string, unknown> };
  plugins: unknown[];
  locales: Record<string, string>;
};

const ROOT = join(__dirname, '..', '..');

const readJson = <T>(file: string): T => JSON.parse(readFileSync(join(ROOT, file), 'utf8')) as T;
const appConfig = (): Config => readJson<{ expo: Config }>('app.json').expo;
const options = (config: Config): Options => ({
  privacyDoc: readFileSync(join(ROOT, 'PRIVACY_DATA.md'), 'utf8'),
  locales: { es: readJson(config.locales.es), fr: readJson(config.locales.fr) },
});

type ApiType = { NSPrivacyAccessedAPIType: string; NSPrivacyAccessedAPITypeReasons: string[] };
type DataType = { NSPrivacyCollectedDataType: string };

test('the real app.json passes', () => {
  const config = appConfig();
  expect(checkManifest(config, options(config))).toEqual([]);
});

test('tracking on fails when tracking is not allowed', () => {
  const config = appConfig();
  config.ios.privacyManifests.NSPrivacyTracking = true;
  expect(checkManifest(config, options(config))).toEqual(['NSPrivacyTracking must be false, found true']);
});

test('a tracking domain fails while tracking is off', () => {
  const config = appConfig();
  config.ios.privacyManifests.NSPrivacyTrackingDomains = ['metrics.invalid'];
  expect(checkManifest(config, options(config))).toEqual(['NSPrivacyTrackingDomains must be empty while tracking is off']);
});

test('a reason code Apple does not document fails', () => {
  const config = appConfig();
  const apis = config.ios.privacyManifests.NSPrivacyAccessedAPITypes as ApiType[];
  apis.find((a) => a.NSPrivacyAccessedAPIType === 'NSPrivacyAccessedAPICategoryUserDefaults')!.NSPrivacyAccessedAPITypeReasons = ['ZZZZ.9'];
  expect(checkManifest(config, options(config))).toEqual([
    'NSPrivacyAccessedAPICategoryUserDefaults reason ZZZZ.9 is not an Apple documented reason',
  ]);
});

test.each(['es', 'fr'])('a missing %s camera string fails', (lang) => {
  const config = appConfig();
  const opts = options(config);
  opts.locales[lang] = {};
  expect(checkManifest(config, opts)).toEqual([`${lang} locale file has no NSCameraUsageDescription`]);
});

test('a missing locale file fails', () => {
  const config = appConfig();
  const opts = options(config);
  opts.locales.fr = null;
  expect(checkManifest(config, opts)).toEqual([`fr locale file ${config.locales.fr} does not exist`]);
});

test('a collected data type not listed in PRIVACY_DATA.md fails', () => {
  const config = appConfig();
  const types = config.ios.privacyManifests.NSPrivacyCollectedDataTypes as DataType[];
  types.push({ ...types[0], NSPrivacyCollectedDataType: 'NSPrivacyCollectedDataTypePreciseLocation' });
  expect(checkManifest(config, options(config))).toEqual([
    'NSPrivacyCollectedDataTypePreciseLocation is not listed in PRIVACY_DATA.md',
  ]);
});

test('a Face ID prompt the app does not use fails, and passes once declared as used', () => {
  const config = appConfig();
  config.ios.infoPlist.NSFaceIDUsageDescription = 'Lume uses Face ID.';
  expect(checkManifest(config, options(config))).toEqual([
    'NSFaceIDUsageDescription would ship but the app does not use faceId',
  ]);
  expect(checkManifest(config, { ...options(config), usedPermissions: ['faceId'] })).toEqual([]);
});

test('dropping the plugin opt-out brings the default Motion prompt back and fails', () => {
  const config = appConfig();
  config.plugins = config.plugins.filter((p) => !(Array.isArray(p) && p[0] === 'expo-sensors'));
  expect(checkManifest(config, options(config))).toEqual([
    'NSMotionUsageDescription would ship but the app does not use motion',
  ]);
});
