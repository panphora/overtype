# Changelog

All notable changes to OverType will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] - 2024-08-18

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

[1.1.0]: https://github.com/panphora/overtype/compare/v1.0.6...v1.1.0
[1.0.6]: https://github.com/panphora/overtype/releases/tag/v1.0.6