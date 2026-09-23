# ShieldTX — Geometry in motion

The current ShieldTX website concept: a blue geometric design with a procedural 3D institution, rotating dollar, scroll-driven transaction flow, and animated product illustrations.

## Run locally

No build or dependency installation is required to view the website. From the repository root:

```sh
python3 -m http.server 4197 --directory dist
```

Open http://localhost:4197/ in your browser. Any static host can serve the `dist` directory.

## Project files

- `dist/index.html` — page content, navigation, FAQ and wallet exposure scan dialog.
- `dist/style.css` — base layout and typography.
- `dist/refinements.css` — illustration styles, hover treatments and responsive refinements.
- `dist/model.js` and `dist/dollar-shape.js` — procedural institution and rotating 3D dollar.
- `dist/app.js` — scroll choreography, transaction flow, account cycling and interactions.
- `dist/section-holds.js` — one-gesture pause at section 2 only.
- `dist/assets/` — bundled fonts and browser libraries.
- `tests/section-holds.cjs` — gesture-pause checks.
- `dist/card.html`, `scripts/` and `reference-snapshot/` — earlier concept material and export utilities. These are not required to run the website. The optional export scripts require `@shuding/opentype.js` and `three`.

## Current interactions

- The dollar rotates 360 degrees and is 18% wider than the earlier version.
- Returning upward restores the dollar, orbit and incoming rays in section 2.
- Section 2 pauses for one scroll gesture; the next separate gesture continues.
- Section 3's first trade follows scrolling, then repeats automatically. Scrolling back releases its additional scroll distance without reversing the trade.
- All four product cards invert to white with blue text and graphics on hover.
- The three API diagram blocks invert to white with blue text on hover.
- Primary API and wallet exposure scan buttons use white-and-blue hover states.
- Reduced-motion mode, responsive layouts and manual flow controls are supported.

## Checks

```sh
node --check dist/app.js
node --check dist/model.js
node --check dist/section-holds.js
node tests/section-holds.cjs
```

This is a front-end design preview. API requests and wallet scans open ShieldTX's official services; this website does not execute trades or collect wallet credentials.

[Public preview](https://shieldtx-geometry-in-motion.abheek-tripathy.chatgpt.site/)

Exported from the published source commit `410661bfa1d69d64c395482c0e9f0a5c9e6ac9d9`.
