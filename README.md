# TwoPort website

One static page: `index.html` (CSS and JS inline) plus `assets/`. Deploy the folder to any static host (Netlify, Vercel, Cloudflare Pages, GitHub Pages).

## Before it goes live

- **Links.** Buttons with `href="#"` carry a `data-href` naming what goes there: `mac-download` (the notarized Mac build) and `checkout` (the Pro checkout; the India ₹999 price is sold only through Indian payment methods). Also set `Licensing.buyURL` in the Mac app to the checkout URL.
- **Domain and social preview.** Add `og:title`, `og:description` and `og:image` tags once there's a domain and a share image.

## Design

- v2 (2026-09-27): light by default, with a dark version. Two colours with a job each: blue `#2563EB` is the Mac side, green (`#0E8A4B` for text, `#22C55E` for fills) is the phone side, matching the app icon.
- Type: Geist and Geist Mono, from Google Fonts.
- The demo stage is plain HTML/CSS: five scenes whose animations run only while the stage has `.play`. `show(n)` in the script restarts a scene. Photos are drawn SVG symbols (`p1`–`p8`), not stock images.
- Speeds are measured (USB ≈ 30 MB/s; home Wi-Fi 5.7–9.7 MB/s in PLAN.md's test logs). Don't add numbers that weren't measured.
