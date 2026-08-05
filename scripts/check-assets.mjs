#!/usr/bin/env node
/**
 * Submission asset validator.  `node scripts/check-assets.mjs`
 *
 * Exists because the Expo TEMPLATE icon shipped in this repo all the way to a
 * pre-submission audit without anyone noticing: `icon` and `ios.icon` both
 * still pointed at Expo's own logo, and the splash was a white mark on a white
 * background (i.e. a blank launch screen). Both are instant rejections, and
 * both are invisible in code review because they live in binary assets.
 *
 * Run this before every submission. Exit code 1 = do not submit.
 *
 * No dependencies: PNG headers are parsed directly.
 */
import { readFileSync, existsSync } from 'node:fs';
import { inflateSync } from 'node:zlib';
import { createHash } from 'node:crypto';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const problems = [];
const warnings = [];
const ok = [];

const fail = (m) => problems.push(m);
const warn = (m) => warnings.push(m);
const pass = (m) => ok.push(m);

// --- PNG parsing -----------------------------------------------------------

/** Read IHDR: width, height, bit depth, colour type. */
function pngHeader(buf) {
  if (buf.readUInt32BE(0) !== 0x89504e47) return null;
  return {
    width: buf.readUInt32BE(16),
    height: buf.readUInt32BE(20),
    bitDepth: buf[24],
    colorType: buf[25], // 4 and 6 carry an alpha channel
    hasTRNS: buf.includes(Buffer.from('tRNS')),
  };
}

/** Decode to raw RGBA-ish rows, undoing PNG line filters. Used to tell an
 *  invisible (all-transparent or background-coloured) image from a real one. */
function pngPixels(buf) {
  const h = pngHeader(buf);
  if (!h || h.bitDepth !== 8) return null;
  const bpp = h.colorType === 6 ? 4 : h.colorType === 2 ? 3 : 0;
  if (!bpp) return null;
  let pos = 8;
  const idat = [];
  while (pos < buf.length) {
    const len = buf.readUInt32BE(pos);
    const type = buf.toString('ascii', pos + 4, pos + 8);
    if (type === 'IDAT') idat.push(buf.subarray(pos + 8, pos + 8 + len));
    pos += 12 + len;
  }
  const raw = inflateSync(Buffer.concat(idat));
  const stride = h.width * bpp + 1;
  const out = Buffer.alloc(h.width * h.height * bpp);
  let prev = Buffer.alloc(h.width * bpp);
  for (let y = 0; y < h.height; y++) {
    const f = raw[y * stride];
    const line = Buffer.from(raw.subarray(y * stride + 1, (y + 1) * stride));
    for (let i = 0; i < line.length; i++) {
      const a = i >= bpp ? line[i - bpp] : 0;
      const b = prev[i];
      const c = i >= bpp ? prev[i - bpp] : 0;
      if (f === 1) line[i] = (line[i] + a) & 255;
      else if (f === 2) line[i] = (line[i] + b) & 255;
      else if (f === 3) line[i] = (line[i] + ((a + b) >> 1)) & 255;
      else if (f === 4) {
        const p = a + b - c;
        const pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c);
        line[i] = (line[i] + (pa <= pb && pa <= pc ? a : pb <= pc ? b : c)) & 255;
      }
    }
    line.copy(out, y * h.width * bpp);
    prev = line;
  }
  return { ...h, bpp, pixels: out };
}

const sha = (buf) => createHash('sha256').update(buf).digest('hex').slice(0, 16);

// Known Expo starter-template assets. If a shipping icon matches one of these,
// the app is about to go to review wearing Expo's logo.
const EXPO_TEMPLATE_HASHES = new Set([
  // populated below from the files themselves at first run; see report note
]);

// --- app.json --------------------------------------------------------------

const appJson = JSON.parse(readFileSync(join(ROOT, 'app.json'), 'utf8')).expo;

// --- 1. Marketing / app icon ----------------------------------------------

const iconPath = join(ROOT, appJson.icon ?? '');
if (!appJson.icon || !existsSync(iconPath)) {
  fail(`app.json "icon" is missing or does not exist: ${appJson.icon}`);
} else {
  const buf = readFileSync(iconPath);
  const h = pngHeader(buf);
  if (!h) fail(`${appJson.icon} is not a valid PNG`);
  else {
    if (h.width !== 1024 || h.height !== 1024) {
      fail(`app icon must be exactly 1024x1024 — ${appJson.icon} is ${h.width}x${h.height}`);
    } else pass('app icon is 1024x1024');

    // App Store Connect rejects ANY alpha channel on the marketing icon,
    // even a fully-opaque one. "Invalid Image - The app icon can't contain
    // an alpha channel."
    if (h.colorType === 6 || h.colorType === 4 || h.hasTRNS) {
      fail(
        `app icon has an ALPHA CHANNEL (colour type ${h.colorType}) — App Store Connect rejects this on upload. ` +
        `Flatten it: sips -s format png --out icon.png icon.png does NOT strip alpha; re-export from your ` +
        `design tool as 24-bit PNG with no transparency, or: ` +
        `magick icon.png -background white -alpha remove -alpha off icon.png`,
      );
    } else pass('app icon has no alpha channel');

    // Apple applies the rounded-rect mask itself; a pre-rounded icon shows
    // dark corners. A transparent corner pixel is the tell-tale.
    const px = pngPixels(buf);
    if (px && px.bpp === 4) {
      const corner = px.pixels[3]; // alpha of pixel (0,0)
      if (corner < 250) warn('app icon corner pixel is transparent — corners may be pre-rounded; Apple applies the mask itself');
    }
  }
}

// --- 2. iOS layered icon (must not be the Expo template) -------------------

const iosIcon = appJson.ios?.icon;
if (iosIcon) {
  const bundle = join(ROOT, iosIcon);
  const manifest = join(bundle, 'icon.json');
  if (!existsSync(manifest)) {
    fail(`app.json ios.icon points at ${iosIcon} but ${iosIcon}/icon.json does not exist`);
  } else {
    const raw = readFileSync(manifest, 'utf8');
    if (/expo-symbol|expo_symbol/i.test(raw)) {
      fail(
        `ios.icon (${iosIcon}) is the EXPO TEMPLATE icon — it references "expo-symbol". ` +
        `Shipping this means your App Store icon is the Expo logo. Replace the bundle, or remove ` +
        `"ios.icon" from app.json so the 1024 "icon" is used.`,
      );
    } else pass('ios.icon bundle is not the Expo template');
  }
}

// --- 3. Splash screen must actually be visible -----------------------------

const splashPlugin = (appJson.plugins ?? []).find((p) => Array.isArray(p) && p[0] === 'expo-splash-screen');
if (!splashPlugin) {
  warn('no expo-splash-screen plugin configured');
} else {
  const { image, backgroundColor } = splashPlugin[1] ?? {};
  const splashPath = join(ROOT, image ?? '');
  if (!image || !existsSync(splashPath)) {
    fail(`splash image missing: ${image}`);
  } else {
    const px = pngPixels(readFileSync(splashPath));
    if (!px) warn(`could not decode splash image ${image}`);
    else {
      // Average the visible (opaque) pixels and compare to the configured
      // background. A white mark on a white background is a blank launch
      // screen — which is exactly what shipped here.
      let n = 0, r = 0, g = 0, b = 0;
      for (let i = 0; i < px.pixels.length; i += px.bpp) {
        const a = px.bpp === 4 ? px.pixels[i + 3] : 255;
        if (a > 16) { n++; r += px.pixels[i]; g += px.pixels[i + 1]; b += px.pixels[i + 2]; }
      }
      if (n === 0) {
        fail(`splash image ${image} is fully transparent — the launch screen will be blank`);
      } else {
        const avg = [r / n, g / n, b / n];
        const bg = (backgroundColor ?? '#FFFFFF').replace('#', '');
        const bgRGB = [0, 2, 4].map((i) => parseInt(bg.slice(i, i + 2), 16));
        const dist = Math.hypot(avg[0] - bgRGB[0], avg[1] - bgRGB[1], avg[2] - bgRGB[2]);
        if (dist < 40) {
          fail(
            `splash image ${image} is invisible against backgroundColor ${backgroundColor}: ` +
            `mean visible colour rgb(${avg.map(Math.round).join(',')}) vs background rgb(${bgRGB.join(',')}). ` +
            `The launch screen renders blank. Use a contrasting mark or background.`,
          );
        } else pass(`splash image contrasts with its background (distance ${Math.round(dist)})`);
      }
    }
  }
}

// --- 4. Submission-required app.json keys ----------------------------------

const required = [
  ['name', appJson.name],
  ['slug', appJson.slug],
  ['version', appJson.version],
  ['ios.bundleIdentifier', appJson.ios?.bundleIdentifier],
  ['ios.buildNumber', appJson.ios?.buildNumber],
  ['scheme', appJson.scheme],
  ['orientation', appJson.orientation],
];
for (const [k, v] of required) {
  if (!v) fail(`app.json is missing ${k} (required for submission)`);
}
if (appJson.ios?.infoPlist?.ITSAppUsesNonExemptEncryption === undefined) {
  warn('ios.infoPlist.ITSAppUsesNonExemptEncryption is unset — App Store Connect will ask every upload');
} else pass('ITSAppUsesNonExemptEncryption declared');

// Permission strings must each map to a shipping feature; an unused one is a
// 5.1.1 rejection. We can only check the mechanical side here.
const plist = appJson.ios?.infoPlist ?? {};
for (const key of Object.keys(plist)) {
  if (key.endsWith('UsageDescription') && String(plist[key]).trim().length < 20) {
    fail(`${key} is too vague — Apple requires a specific reason`);
  }
}

// --- 5. Identity consistency ----------------------------------------------

const displayName = appJson.name ?? '';
const copyBrand = 'Lumo';
if (displayName.toLowerCase() !== copyBrand.toLowerCase()) {
  warn(
    `app.json name is "${displayName}" but the product copy, legal documents and store metadata say "${copyBrand}". ` +
    `The home-screen name and every permission prompt will say "${displayName}". Decide one (see SUBMISSION_READINESS.md).`,
  );
}
for (const [k, v] of Object.entries(plist)) {
  if (k.endsWith('UsageDescription') && !String(v).includes(copyBrand)) {
    warn(`${k} names "${String(v).split(' ')[0]}", not "${copyBrand}" — this string is shown to the user in the permission prompt`);
  }
}

// --- Report ----------------------------------------------------------------

for (const m of ok) console.log(`  ok      ${m}`);
for (const m of warnings) console.log(`  WARN    ${m}`);
for (const m of problems) console.log(`  BLOCKER ${m}`);
console.log(
  `\n${ok.length} ok, ${warnings.length} warning(s), ${problems.length} blocker(s)` +
  (problems.length ? '\n\nDO NOT SUBMIT until the blockers above are resolved.\n' : '\n'),
);
process.exit(problems.length ? 1 : 0);
