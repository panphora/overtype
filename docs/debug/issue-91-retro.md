# Issue #91 — Misaligned Text on Longer Lines

## Retro: CSS Strut + Font Mismatch on `<pre>`

**Date:** 2026-03-13
**Issue:** https://github.com/panphora/overtype/issues/91
**Status:** Fixed

---

## Timeline

- **2026-01-05** — @ddarfantasy opens the issue. Chromium 142, 400x683 viewport. Overlay drifts from textarea on longer lines. Screenshot provided.
- **2026-01-17** — @panphora unable to reproduce. Requests more detail.
- **2026-02-18** — Issue closed as unreproducible.
- **2026-03-05** — @ThaUnknown reopens. Same bug on Tailwind 4. Reports that DevTools shows identical `line-height` on both elements, yet rendering clearly differs. Discovers that `line-height: 1 !important` on `.overtype-preview pre.code-block code` fixes it. Provides computed style dumps.
- **2026-03-13** — Root cause identified and fix shipped.

## Root Cause

**The CSS strut mechanism combined with a font-family mismatch on `<pre>` elements.**

Overtype works by overlaying a transparent `<textarea>` on top of a `<div>` that renders the styled markdown preview. Every pixel must match between the two layers. The alignment depends on every element inside the preview having identical font metrics to the textarea.

Here's the chain that broke it:

1. Tailwind 4's preflight includes `code, pre { font-family: ui-monospace, ... }`.
2. Overtype's CSS hardened `font-family` on `<code>` (inline code) and `pre code` (code inside blocks), but **not on the `<pre>` element itself**.
3. The `<pre>` element silently picked up Tailwind's font-family instead of inheriting from the preview container.
4. In CSS, every block element has an invisible zero-width character called a **strut** that participates in line box height calculation using the block's own font metrics. When `<pre>` had a different font than `<code>`, the strut's ascent/descent metrics differed from the actual text content.
5. This inflated each line box inside the code block by ~1px. Over 4 lines of code, the overlay drifted ~4px. All text after the code block was permanently offset from the textarea cursor.
6. `getComputedStyle().lineHeight` reported **identically** for both elements because the CSS `line-height` value was the same — the drift came from font metric interaction at the rendering level, making the bug invisible in DevTools.

## Why It Was Hard to Find

- **DevTools lies (sort of).** Computed `line-height` showed the same value on both elements. The actual rendered line box height differed due to the strut, but no DevTools panel exposes this.
- **Platform-dependent.** On macOS, `ui-monospace` and `"SF Mono"` resolve to the same font, so there's no mismatch. On Linux/Windows (or when another framework's font stack resolves differently), the fonts differ and the bug appears.
- **The wrong element was suspected.** Everyone looked at `<code>` — which was already protected. The `<pre>` wrapper was the actual culprit, and it had no font-related CSS at all.
- **Not reproducible without an external CSS framework.** The bug only manifests when something sets `font-family` directly on `pre` elements. Vanilla HTML doesn't do this.

## The Fix

Added a single defensive CSS rule to `src/styles.js`:

```css
.overtype-wrapper .overtype-preview * {
  font-family: inherit !important;
  font-size: inherit !important;
  line-height: inherit !important;
}
```

This forces every element inside the preview to inherit font metrics from the preview container, which matches the textarea exactly. No external stylesheet can override these properties because:
- The rule uses `!important`
- It's unlayered (beats any `@layer`-wrapped framework styles)
- Overtype's own more-specific rules (e.g., preview mode `h1 { font-size: 2em }`) still win due to higher specificity

## What We Learned

1. **The CSS strut is real and sneaky.** Even if all visible text uses the correct font, the block container's own font metrics still participate in line height calculation. Any element that wraps text (`pre`, `blockquote`, `li`, etc.) needs its font properties explicitly controlled.

2. **`inherit` is not the default.** CSS inheritance only works when no rule targets the element directly. A bare `pre { font-family: ... }` from any framework breaks inheritance. You have to explicitly set `font-family: inherit !important` to defend against this.

3. **Wildcard resets need to cover font properties.** The existing `.overtype-container *` reset deliberately left `font-family`, `font-size`, and `line-height` to natural inheritance (with a comment explaining why). That was the gap — inheritance is fragile when external stylesheets are present.

4. **Visual bugs need visual testing.** Unit tests (which run in jsdom) can't catch rendering-level issues like strut inflation. The Playwright-based test page (`docs/debug/test-tailwind4-issue91.html`) was essential for confirming the bug and verifying the fix.

## Test Artifacts

- `docs/debug/test-tailwind4-issue91.html` — Standalone test page that loads Tailwind 4 + Overtype and measures code block alignment drift with three scenarios (bug repro, fix applied, default).
