# Assets

## The app icon and splash mark are PLACEHOLDERS

`assets/images/icon.png`, `splash-icon.png`, `favicon.png` and the
`android-icon-*.png` set are **generated placeholders, not final artwork.**

They are a geometric "L" in the app's own monochrome palette
(`src/lib/design/tokens.ts` — white on `#1C1C1E`). They are deliberate and
genuinely uploadable: correct dimensions, no alpha channel on the App Store
icon, no pre-rounded corners, real contrast on the splash. They are not a brand.

**Replace them before any public release.** They exist so a build is not blocked
on a designer, and so the three real defects that were here before could be
closed:

1. The 1024 icon carried an **alpha channel** (PNG colour type 6). App Store
   Connect rejects that at upload.
2. `app.json` pointed `ios.icon` at `assets/expo.icon/`, an **Expo template
   bundle** — the mark was Expo's own chevron on a blue gradient, with a
   design-guide grid still compositing over it as a live layer. That directory
   has been deleted and the key removed; the 1024 PNG is now the icon.
3. `splash-icon.png` was a **pure-white mark on the configured white
   background** — every visible pixel was `rgb(255,255,255)`, so the launch
   screen rendered blank.

## Regenerating

```bash
node scripts/make-icons.mjs
npm run check:assets     # must exit 0
```

The generator writes PNG bytes directly (`node:zlib` only). There is no
ImageMagick, PIL, cairosvg or rsvg-convert on this machine, and an image
toolchain is not worth adding to ship a placeholder.

## When you replace them

The only hard constraints, both enforced by `npm run check:assets`:

- **The 1024×1024 App Store icon must have no alpha channel.** Note that
  `sips -s format png` does **not** strip alpha — re-encode as 24-bit RGB, or
  `magick icon.png -background white -alpha remove -alpha off icon.png`.
- **The splash mark must contrast with `expo.plugins["expo-splash-screen"]
  .backgroundColor`** (currently `#FFFFFF`). Change either side, but check.

Do not pre-round the icon's corners — iOS applies its own mask, and a
pre-rounded icon is a rejection.

## Fonts

`assets/fonts/` holds SF Pro Rounded (Semibold/Bold/Heavy), loaded at startup by
`src/app/_layout.tsx`. These are Apple's fonts; they are licensed for use in
apps on Apple platforms.
