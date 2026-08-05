// Generate Lume's PLACEHOLDER app icon and splash mark.
//
// These are not final art. They are a clean, deliberate, genuinely uploadable
// stand-in in the app's own design language (monochrome, per
// src/lib/design/tokens.ts) so the build is not blocked on a designer. Replace
// them before a public release — see assets/README.md.
//
// Dependency-free on purpose: there is no ImageMagick, PIL, cairosvg or
// rsvg-convert on this machine, and adding an image toolchain to ship one
// placeholder is not worth it. This writes the PNG bytes directly.
//
// The App Store icon MUST be 24-bit RGB with NO alpha channel — App Store
// Connect rejects the upload otherwise, and `sips` does NOT strip alpha
// (re-encoding is the only reliable way, which is what this does).
//
//   node scripts/make-icons.mjs
//
import { deflateSync } from 'node:zlib';
import { writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

// --- palette (src/lib/design/tokens.ts) --------------------------------------
const NEAR_BLACK = [0x1c, 0x1c, 0x1e]; // color.gray1 — near-black
const WHITE = [0xff, 0xff, 0xff];

// --- minimal PNG writer ------------------------------------------------------

function crc32(buf) {
  let c = ~0;
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i];
    for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1));
  }
  return ~c >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, 'latin1'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}

/**
 * Write a PNG. colorType 2 = RGB (no alpha, what the App Store icon needs),
 * 6 = RGBA (fine for the splash mark, which composites over a background).
 * Every scanline uses filter 0 (None) — these images are flat colour, so a
 * cleverer filter would save nothing worth the code.
 */
function writePNG(path, width, height, colorType, pixels) {
  const channels = colorType === 6 ? 4 : 3;
  const stride = width * channels;
  const raw = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y++) {
    raw[y * (stride + 1)] = 0;
    pixels.copy(raw, y * (stride + 1) + 1, y * stride, (y + 1) * stride);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = colorType;
  writeFileSync(
    path,
    Buffer.concat([
      Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
      chunk('IHDR', ihdr),
      chunk('IDAT', deflateSync(raw, { level: 9 })),
      chunk('IEND', Buffer.alloc(0)),
    ]),
  );
}

// --- the mark ----------------------------------------------------------------

// A geometric "L", centred, drawn from two rectangles in a 1000-unit square.
// Sharp terminals and a full-bleed background: iOS applies its own corner mask,
// and a pre-rounded icon is a rejection.
const STEM = { x0: 347, y0: 273, x1: 474, y1: 727 };
const FOOT = { x0: 347, y0: 600, x1: 653, y1: 727 };

const inMark = (u, v) =>
  (u >= STEM.x0 && u < STEM.x1 && v >= STEM.y0 && v < STEM.y1) ||
  (u >= FOOT.x0 && u < FOOT.x1 && v >= FOOT.y0 && v < FOOT.y1);

/**
 * Render the mark. `fg` paints the L, `bg` the field; a null bg means
 * transparent (RGBA output). 2x2 supersampling keeps the edges clean at any
 * size — the rectangles are axis-aligned, but the scale factor is not integral.
 */
function render(size, fg, bg) {
  const alpha = bg === null;
  const channels = alpha ? 4 : 3;
  const out = Buffer.alloc(size * size * channels);
  const S = 2; // subsamples per axis
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let hits = 0;
      for (let sy = 0; sy < S; sy++) {
        for (let sx = 0; sx < S; sx++) {
          const u = ((x + (sx + 0.5) / S) / size) * 1000;
          const v = ((y + (sy + 0.5) / S) / size) * 1000;
          if (inMark(u, v)) hits++;
        }
      }
      const cov = hits / (S * S);
      const o = (y * size + x) * channels;
      if (alpha) {
        out[o] = fg[0];
        out[o + 1] = fg[1];
        out[o + 2] = fg[2];
        out[o + 3] = Math.round(cov * 255);
      } else {
        for (let c = 0; c < 3; c++) out[o + c] = Math.round(bg[c] + (fg[c] - bg[c]) * cov);
      }
    }
  }
  return out;
}

// App Store / home-screen icon: white L on near-black, RGB, NO ALPHA.
writePNG(join(root, 'assets/images/icon.png'), 1024, 1024, 2, render(1024, WHITE, NEAR_BLACK));

// Splash mark: near-black L on transparency, composited over the configured
// white splash background. Alpha is fine (and needed) here.
writePNG(join(root, 'assets/images/splash-icon.png'), 512, 512, 6, render(512, NEAR_BLACK, null));

// Web favicon: same mark, small, opaque.
writePNG(join(root, 'assets/images/favicon.png'), 48, 48, 2, render(48, WHITE, NEAR_BLACK));

// Android adaptive foreground (safe zone is the middle ~66%, so the mark is
// rendered smaller inside a transparent field) and its solid background.
writePNG(join(root, 'assets/images/android-icon-foreground.png'), 512, 512, 6, render(512, WHITE, null));
writePNG(
  join(root, 'assets/images/android-icon-background.png'),
  512,
  512,
  2,
  Buffer.alloc(512 * 512 * 3).map((_, i) => NEAR_BLACK[i % 3]),
);
writePNG(join(root, 'assets/images/android-icon-monochrome.png'), 512, 512, 6, render(512, WHITE, null));

console.log('wrote icon.png (1024, RGB no-alpha), splash-icon.png, favicon.png, android-icon-*.png');
