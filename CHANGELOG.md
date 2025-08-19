# Changelog

All notable changes to OverType will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.4] - 2025-01-19

### Fixed
- Code blocks no longer render markdown formatting - `__init__` displays correctly (#14)
  - Post-processing strips all formatting from lines inside code blocks
  - Preserves plain text display for asterisks, underscores, backticks, etc.

## [1.1.3] - 2025-01-19

### Fixed
- Inline triple backticks no longer mistaken for code blocks (#15)
  - Code fences now only recognized when alone on a line or followed by language identifier
  - Prevents cascade failures where inline backticks break subsequent code blocks
- Android cursor misalignment on bold text (#16)
  - Updated font stack to avoid problematic `ui-monospace` on Android
  - Added explicit Android fonts: Roboto Mono, Noto Sans Mono, Droid Sans Mono
  - Added `font-synthesis: none` and `font-variant-ligatures: none` to prevent width drift

## [1.1.2] - 2025-01-19

### Added
- `textareaProps` option to pass native HTML attributes to textarea (required, maxLength, name, etc.) (#8)
- `autoResize` option for auto-expanding editor height based on content
- `minHeight` and `maxHeight` options for controlling auto-resize bounds
- Form integration example in README showing how to use with HTML form validation

### Fixed
- Height issue when toolbar and stats bar are enabled - container now uses CSS Grid properly (#9)
- Grid layout issue where editors without toolbars would collapse to min-height
- Added explicit grid-row positions for toolbar, wrapper, and stats elements
- Stats bar now positioned at bottom of container using grid (not absolute positioning)

### Changed
- Container uses CSS Grid layout (`grid-template-rows: auto 1fr auto`) for proper height distribution
- Toolbar takes auto height, editor wrapper takes remaining space (1fr), stats bar takes auto height
- Bundle size: 60.89 KB minified (16.8 KB gzipped)

## [1.1.1] - 2025-01-18

### Changed
- Link tooltips now use CSS Anchor Positioning for perfect placement
- Tooltips position directly below the rendered link text (not approximated)
- Removed Floating UI dependency, reducing bundle size from 73KB to 59KB minified
- Parser now adds anchor names to rendered links for CSS positioning
- Demo page redesigned to match dark terminal aesthetic
- Added "SEE ALL DEMOS" button to index.html

### Fixed
- Link tooltip positioning now accurate relative to rendered text

## [1.1.0] - 2025-01-18

### Added
- Gmail/Google Docs style link tooltips - cursor in link shows clickable URL tooltip (#4)
- Tab key support - inserts 2 spaces, supports multi-line indent/outdent with Shift+Tab (#3)
- Comprehensive "Limitations" section in README documenting design constraints (#5)
- @floating-ui/dom dependency for tooltip positioning

### Fixed
- Inline code with underscores/asterisks no longer incorrectly formatted (#2, PR #6 by @joshdoman)
- Code elements now properly inherit font-size, preventing alignment breaks (#1)
- Tab key no longer causes focus loss and cursor misalignment (#3)

### Changed
- Links now use tooltip interaction instead of Cmd/Ctrl+Click (better UX)
- README limitations section moved below Examples for better flow
- Build size increased to 73KB minified (from 45KB) due to Floating UI library

### Contributors
- Josh Doman (@joshdoman) - Fixed inline code formatting preservation

## [1.0.6] - 2024-08-17

### Added
- Initial public release on Hacker News
- Core transparent textarea overlay functionality
- Optional toolbar with markdown formatting buttons
- Keyboard shortcuts for common markdown operations
- Solar (light) and Cave (dark) themes
- DOM persistence and recovery
- Mobile optimization
- Stats bar showing word/character count

### Features at Launch
- 👻 Invisible textarea overlay for seamless editing
- 🎨 Global theming system
- ⌨️ Keyboard shortcuts (Cmd/Ctrl+B for bold, etc.)
- 📱 Mobile optimized with responsive design
- 🔄 DOM persistence aware (works with HyperClay)
- 🚀 Lightweight ~45KB minified
- 🎯 Optional toolbar
- ✨ Smart shortcuts with selection preservation
- 🔧 Framework agnostic

[1.1.4]: https://github.com/panphora/overtype/compare/v1.1.3...v1.1.4
[1.1.3]: https://github.com/panphora/overtype/compare/v1.1.2...v1.1.3
[1.1.2]: https://github.com/panphora/overtype/compare/v1.1.1...v1.1.2
[1.1.1]: https://github.com/panphora/overtype/compare/v1.1.0...v1.1.1
[1.1.0]: https://github.com/panphora/overtype/compare/v1.0.6...v1.1.0
[1.0.6]: https://github.com/panphora/overtype/releases/tag/v1.0.6