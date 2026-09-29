# TwoPort website

Three static pages sharing `assets/site.css` and `assets/site.js`:

- `index.html`: the landing page. One plain promise, the demo, Clipboard, Always connected, three setup steps, three reasons, pricing, the waitlist, six questions.
- `compare.html`: TwoPort next to AirDrop/Quick Share and the other Android-to-Mac apps, and what they charge.
- `requests.html`: the feature-request board (vote or suggest).

Live at **https://twoport.app**, served by GitHub Pages from the public repo `whiterabbit-vibe/twoport-site` (this repo stays private). To publish: commit, then run `tools/deploy-website.sh`.

## Before it goes live

- **Download and checkout.** The pages only collect the waitlist for now. At launch, add the Mac download and the Pro checkout (the India ₹999 price is sold only through Indian payment methods), and set `Licensing.buyURL` in the Mac app to the checkout URL.
- **Social preview.** og: tags are in; `og:image` is the 512px app icon. A 1200×630 share image would look better.

## Design

- v6 (2026-09-27): rewritten after relatives couldn't tell what the app does from v5. **The home page answers one question: what does it do for me?** Plain words, one sentence per idea, no jargon, no competitor names. Detail lives on `compare.html` and `requests.html`, linked from the page and the footer. Keep it that way: add to the sub-pages, not the home page.
- v9 (2026-09-29): **Crowned headline.** The first word rotates (See, Send, Search, Open, Back up; Send reads "to your Mac", the rest "on your Mac") and a gold SVG crown (a Mac-blue and a phone-green jewel joined by a blue-to-green gem) hops onto each new word. "on your Mac" is a solid blue highlight. Screen readers get one plain sentence (`.sr-only`). **Chapters:** every section after the demo is a folder laid on the one above (`.chapter` + `.ch-white/-deep/-green/-tint/-grey`): rounded top edge, its own colour, and a tab with its number and name (`.ch-tab`, 01 What it does … 07 Questions). Neighbours never share a colour. Kickers were dropped where the tab says the same thing. **Phones (≤700px):** the scroll story doesn't pin, its steps become plain cards (icons and Wi-Fi/Cable speed bars only there); the demo doesn't auto-advance under 900px; the playground is smaller and its link and plug share one row.
- v10 (2026-09-29): **The story doesn't pin any more** (a visitor thought the page was stuck): on wide screens its steps scroll by as normal text and the picture beside them stays put (`position: sticky`) and plays the step crossing the middle of the screen; up to 900px the steps are plain cards. **"Try it right here" is gone** (people scrolled past it, and a toy doesn't prove anything about the real app); chapters are now 01–06. **A guide instead of a mascot:** the nav shows which numbered part you're in and opens a list of all parts (phones had no section menu), plus a line under the nav that fills as you read. On phones it takes the logo's place once you scroll. **Forms:** they saved but never confirmed on the home page, because v8's playground declared its own `say`, which replaced the forms' one. The helper is now `formSay`, and a sent form steps aside for a confirmation panel (`.form-done`: tick, headline, the email, "Add another email").
- Light by default, with a dark version. Two colours with a job each: blue `#2563EB` is the Mac side, green (`#0E8A4B` for text, `#22C55E` for fills) is the phone side, matching the app icon.
- Type: Geist and Geist Mono, from Google Fonts.
- The demo stage is plain HTML/CSS: five scenes (Photos on your Mac, Phone to Mac, Mac to phone, Copy and paste, Back up photos) whose animations run only while the stage has `.play`. `show(i)` in `site.js` restarts a scene; the chip order is the play order, `data-scene` picks the scene and `data-caption` is the one line shown with it. It plays on its own until the visitor picks a chip, then stays on their choice. Photos are drawn SVG symbols (`p1`–`p8`), not stock images.
- The Mac is a MacBook: lid with the notch in the menu bar, the keyboard deck drawn with a 3D `rotateX` (keys are a gradient grid, not elements), and the front lip. Silver in light mode, space black in dark (`--alu*`, `--key` tokens).
- Up to 900px wide the stage stacks: the Mac full width, the phone below on the right, the caption beside it with previous/next and swipe; the chips become a sideways row. Tables turn into one card per row up to 640px (cells labelled from the header by the script); the benchmark shows two rows until "Show all".
- Clipboard section: a 7s CSS loop (select a link on the phone → Copy → it crosses → ⌘V into a Mac email → top of the history). Always connected: one MacBook, three phones; the USB one gets a solid cable, the Wi-Fi ones flowing dotted lines (an SVG overlay, `.mm-links`, stretched with `preserveAspectRatio="none"` and `non-scaling-stroke`), and the Mac's TwoPort menu lists all three. Class names are global: the lines are `.wl`, not `.air` (that's the demo's Wi-Fi label, and its transform moved them).
- Sections alternate bands so they read apart: grey page, white `band-surface`, tinted `band-tint` (Pricing), navy `band-deep` (Early access). Inside a white band, cards switch to the page grey.
- Don't describe the product as the phone "inside" the Mac: it reads as screen mirroring, which TwoPort doesn't do (the FAQ says so).
- Speeds are measured (USB ≈ 30 MB/s; home Wi-Fi 5.7–9.7 MB/s in PLAN.md's test logs). Don't add numbers that weren't measured.
