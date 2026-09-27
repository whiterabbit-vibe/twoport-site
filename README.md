# TwoPort website

One static page: `index.html` (CSS and JS inline) plus `assets/`. Live at **https://twoport.app**, served by GitHub Pages from the public repo `whiterabbit-vibe/twoport-site` (this repo stays private). To publish: commit, then run `tools/deploy-website.sh`.

## Before it goes live

- **Links.** Buttons with `href="#"` carry a `data-href` naming what goes there: `mac-download` (the notarized Mac build) and `checkout` (the Pro checkout; the India ₹999 price is sold only through Indian payment methods). Also set `Licensing.buyURL` in the Mac app to the checkout URL.
- **Social preview.** og: tags are in; `og:image` is the 512px app icon. A 1200×630 share image would look better.

## Design

- v2 (2026-09-27): light by default, with a dark version. Two colours with a job each: blue `#2563EB` is the Mac side, green (`#0E8A4B` for text, `#22C55E` for fills) is the phone side, matching the app icon.
- Type: Geist and Geist Mono, from Google Fonts.
- The demo stage is plain HTML/CSS: eight scenes ("moments") whose animations run only while the stage has `.play`. `show(i)` in the script restarts a scene; the tab order is the play order, `data-scene` picks the scene. Photos are drawn SVG symbols (`p1`–`p8`), not stock images.
- Each moment is written as a real-life situation (title), how TwoPort handles it (description), a short label (`.short`, the chip on phones) and a Free/Pro badge. Don't describe the product as the phone "inside" the Mac: it reads as screen mirroring, which TwoPort doesn't do (the FAQ says so).
- The Mac is a MacBook: lid with the notch in the menu bar, the keyboard deck drawn with a 3D `rotateX` (keys are a gradient grid, not elements), and the front lip. Silver in light mode, space black in dark (`--alu*`, `--key` tokens).
- Sections sit on alternating bands so they read apart: grey (page) → white `band-surface` (Why TwoPort) → grey (details) → tinted `band-tint` (Pricing) → navy `band-deep` (Early access) → white (Requests) → grey (FAQ). Inside a white band, cards switch to the page grey.
- Up to 900px wide the stage stacks: the Mac full width, the phone below on the right, the active moment's caption beside it with previous/next and swipe. Tables turn into one card per row up to 640px (cells labelled from the header by the script); the benchmark shows two rows until "Show all".
- Speeds are measured (USB ≈ 30 MB/s; home Wi-Fi 5.7–9.7 MB/s in PLAN.md's test logs). Don't add numbers that weren't measured.
