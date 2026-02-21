# Changelog

## [2.3.0] - 2026-02-20

### Added
- Preview mode CSS variables for independent color customization

### Changed
- README.md documentation



## [2.2.0] - 2026-02-18

### Added
- Upload toolbar button when fileUpload is enabled
- File upload support via paste and drag-and-drop
- showToolbar/hideToolbar methods
- TypeScript type for performAction method
- Auto theme that follows system color scheme
- File upload and auto theme example pages

### Fixed
- Auto-theme example dark mode contrast and CSS specificity
- Upload button icon fill, action registration, and tooltip positioning
- insertAtCursor wraps execCommand in try/catch
- Batch file upload normalizes callback result to array
- Global auto-theme preserves customColors across OS theme changes
- Theme 'auto' in constructor now enables auto-theme tracking
- Bundle floating-ui, remove runtime CDN import
- Make spellcheck a configurable option, default off
- reinit({maxHeight}) now updates editor height
- Code block colors in preview mode now respect theme
- Placeholder text visible when editor is empty
- Italic rendering at start of list items and headers
- initFromData returns flat array instead of nested array



## [2.1.1] - 2025-12-13

### Added
- Centralized action dispatcher for keyboard shortcuts

### Changed
- Build dist files
- Update contributors for v2.1.0 features and fixes

### Fixed
- Link tooltip disappearing when clicking on it



## [2.1.0] - 2025-12-12

### Added
- Comprehensive tests for setCustomSyntax() API
- npm run release script
- Examples link to website footer
- setCustomSyntax() for extending markdown parsing (#79)
- initFromData() for data attribute configuration (#76)
- Release automation script

### Changed
- showStats() to refresh stats when already visible (#77)
- Pipe test output through cat in release script

### Fixed
- Release script dumping test output to CHANGELOG
- Test output breaking release script
- XSS test output to use simple labels
- Back link color on examples page
- toolbarButtons export not being exposed on window (#78)



All notable changes to OverType will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [2.0.6] - 2025-11-19

### 🐛 Bug Fixes

- Fixed Shift+Tab navigation (#75)
  - Shift+Tab without text selection now properly allows navigation to previous form elements
  - Only Tab key (without Shift) is prevented from default behavior for indentation

- Fixed unordered list rendering issues (#74)
  - Asterisk (`*`) list markers no longer cause incorrect italicization of subsequent text
  - Plus (`+`) list markers now properly receive syntax highlighting like minus (`-`) markers
  - All three bullet list markers (`-`, `*`, `+`) now work consistently

- Fixed toolbarButtons not accessible globally (#73)
  - `toolbarButtons` and `defaultToolbarButtons` now exposed as global variables in IIFE builds
  - Users can now access `toolbarButtons.bold`, `toolbarButtons.italic`, etc. when using CDN

- Fixed keyboard shortcuts error with toolbar (#72)
  - Added missing `handleAction` method to Toolbar class
  - Keyboard shortcuts (Ctrl+I, Ctrl+B, etc.) now work properly when toolbar is enabled
  - Fixed "this.editor.toolbar.handleAction is not a function" error

### 🙏 Thanks

- @kozi for reporting issues #75 and #72
- @1951FDG for reporting issue #74
- @nodesocket for reporting issue #73

## [2.0.5] - 2025-01-10

### 🐛 Bug Fixes

- Fixed web component status bar not updating theme colors (#70, #71)
  - Web component now calls `setTheme()` on the internal OverType instance when theme attribute changes
  - This ensures the `data-theme` attribute is set on the container for theme-specific CSS selectors
  - Status bar now properly switches between light and dark themes

### 🔧 Improvements

- **Automatic TypeScript Definition Generation** (#71)
  - Added `scripts/generate-types.js` to auto-generate `overtype.d.ts` from `themes.js` and `styles.js`
  - TypeScript definitions now automatically stay in sync with theme properties and CSS variables
  - Added `generate:types` npm script (runs automatically before builds)
  - Eliminates manual maintenance and prevents drift between themes, CSS, and types

- **Enhanced Theme System** (#71)
  - Added missing theme properties for better dark theme support: `del`, `rawLine`, `border`, `hoverBg`, `primary`, `syntax`, `textPrimary`, `textSecondary`
  - Cave (dark) theme now has proper dark colors for borders, hovers, and UI elements
  - Toolbar border now defaults to transparent unless explicitly set by user via `toolbarBorder` color option
  - All 30 theme properties now fully synced across themes.js, styles.js, and TypeScript definitions

### 📚 Documentation

- Updated demo page web component to use consistent 14px font size (matching other editors)

### 🙏 Thanks

- @kozi for reporting theme synchronization issues (#70, #71) and providing detailed analysis

## [2.0.4] - 2025-01-07

### 🐛 Bug Fixes

- Fixed stats bar z-index to appear above link tooltips
- Fixed scroll position desync on page reload - textarea now syncs to preview scroll position after browser restoration

## [2.0.3] - 2025-01-07

### 🔧 Improvements

- Fixed build banner to show correct author (David Miranda) and GitHub URL

## [2.0.2] - 2025-01-06

### 🐛 Bug Fixes

- Fixed link tooltips not working in Firefox and browsers without CSS Anchor Positioning support (#68)
  - Implemented Floating UI as a dynamic fallback for older browsers
  - Tooltips now work in Firefox, Safari, and older Chrome/Edge versions
  - Zero bundle size increase for modern browsers (Chrome 125+, Edge 125+)
  - Floating UI loads dynamically only when needed via CDN

### 🔧 Improvements

- Fixed toolbar positioning to not overlap content (#69)
- Improved tooltip behavior in Firefox: tooltips now reposition on scroll instead of hiding
- Removed debug console.log statements from production builds
- Added graceful error handling for tooltip failures

### 🙏 Thanks

- @kozi for reporting issues #68 and #69

## [2.0.1] - 2025-01-06

### 🐛 Bug Fixes

- Fixed checkbox rendering in preview mode - task list checkboxes now properly render as interactive `<input type="checkbox">` elements when switching to preview mode
- Fixed mode switching not triggering preview re-render - `showPreviewMode()` and `showNormalEditMode()` now call `updatePreview()` to regenerate HTML with correct mode
- Removed `disabled` attribute from checkboxes in preview mode - checkboxes are now interactive

### 🔧 Improvements

- Simplified website architecture - moved `assets/` and `examples/` into `website/` directory, removed symlinks
- Build script now automatically copies `dist/` to `website/dist/`
- Massively simplified DEVELOPER.md documentation
- Added comprehensive alignment verification tests for Shiki, Highlight.js, and Prism with complex code fixtures
- Moved build scripts to `./scripts/` directory for better organization
- Moved `test-types.ts` to `./test/` directory for consistency

## [2.0.0] - 2025-01-05

### 🚨 Breaking Changes

**Toolbar API Redesigned**
- Removed: `customToolbarButtons`, `hideButtons`, `buttonOrder` options
- New: Single `toolbarButtons` array for explicit button configuration
- Import built-in buttons: `import { toolbarButtons } from 'overtype'`
- Migration: See README "Migration from v1.x" section
- If using default toolbar (`toolbar: true` only), no changes needed

### ✨ New Features

**Task Lists (GFM)**
- Task list syntax (`- [ ]` and `- [x]`) now renders as actual checkboxes in preview mode
- Edit mode shows syntax for alignment, preview mode shows interactive checkboxes
- Thanks @dido739 (#60)

**Syntax Highlighting**
- New `codeHighlighter` option for per-instance code highlighting
- New `OverType.setCodeHighlighter()` for global highlighting
- Library-agnostic: works with Shiki, Highlight.js, Prism, or custom highlighters
- See docs/SYNTAX_HIGHLIGHTING.md

**Web Component**
- Native `<overtype-editor>` custom element with Shadow DOM
- 15 reactive HTML attributes
- Framework-agnostic (React, Vue, Angular)
- Thanks @ChasLui (#40)

### 🐛 Bug Fixes

- Fixed double-escaping of URLs with special characters - @lyricat (#63, #64)
- Fixed toolbar option being ignored in reinit() - @kristiankostecky (#62)
- Added proper event listener cleanup in toolbar destroy()
- Fixed web component preview not updating due to Shadow DOM event boundary
  - Added local input and keydown event listeners inside Shadow DOM
  - Fixes toolbar operations, keyboard shortcuts, deletions, and all text modifications
- Fixed scroll sync not working in web component due to Shadow DOM event boundary
- Fixed link tooltip always visible in web component
  - `_reinjectStyles()` was accidentally removing tooltip stylesheet instead of base stylesheet
  - Now tracks base stylesheet explicitly to preserve dynamically-added styles
- Fixed link tooltip not appearing in web component
  - Added Shadow DOM-aware `selectionchange` listener
  - `document.activeElement` returns shadow host, not elements inside shadow root
  - Also fixes stats bar cursor position updates in Shadow DOM
- Fixed link tooltip styles not applying in web component
  - Moved tooltip styles from separate injection into main stylesheet
  - Eliminates style ordering issues on reinject
  - Single unified stylesheet in Shadow DOM
- Link tooltip now hides when editor loses focus or page visibility changes
- Fixed web component `getStats()` method - now calculates stats directly from textarea
- Fixed Shiki syntax highlighting cache not invalidating on edits
  - Cache key now uses full code content instead of first 100 characters
  - Edits beyond position 100 now properly trigger re-highlighting
  - Fixed highlighter variable not being set, causing onChange to never trigger
  - Async highlighter completion now triggers preview re-render

### 📚 Documentation

- Complete README rewrite with v2.0 features
- New migration guide for v1.x users
- examples/custom-toolbar.html with 4 complete examples
- docs/SYNTAX_HIGHLIGHTING.md guide
- docs/WEB-COMPONENT.md guide

## [1.2.7] - 2025-09-30

### Fixed
- **Issue #55: Double-escaping of HTML entities in code blocks** - HTML special characters (`<`, `>`, `&`, `"`) inside inline code spans are now properly escaped once instead of twice
  - Removed redundant `escapeHtml()` calls when rendering code sanctuaries
  - Fixes issue where `` `<angle brackets>` `` would display as `&amp;lt;angle brackets&amp;gt;` instead of `&lt;angle brackets&gt;`
  - Also fixed the same issue for inline code within link text
  - Thanks to [@lyricat](https://github.com/lyricat) for identifying and fixing this issue (PR #56)

### Added
- Comprehensive test suite for HTML entity escaping in code blocks

## [1.2.6] - 2025-09-08

### Fixed
- **Re-enabled code button inside links** - Now that the sanctuary pattern properly handles inline code within link text, the code button works correctly without Unicode placeholder issues
- **Removed unnecessary code** - Deleted the `isInsideLink` function that was no longer needed, reducing bundle size

### Changed
- **README update** - Replaced Synesthesia section with Hyperclay information

## [1.2.5] - 2025-09-08

### Fixed
- **URL formatting protection** - Markdown formatting characters in URLs are now preserved as literal text
  - Implemented "protected regions" strategy for URL portions of links
  - Backticks, asterisks, underscores, and tildes in URLs remain unchanged
  - Link text can still contain formatted content (bold, italic, code, etc.)
  - Fixes issue where `[Link](https://example.com/`path`/file)` would break the URL
- **Italic underscore handling** - Underscores now require word boundaries for italic formatting
  - Prevents false matches in words like `bold_with_underscore`
  - Single underscores only create italic at word boundaries

### Added
- Comprehensive sanctuary parsing test suite for URL protection
- Release process documentation in contrib_docs/

## [1.2.4] - 2025-09-04

### Fixed
- **Issue #48: Code formatting inside links** - Code button now disabled when cursor is inside a link
  - Added `isInsideLink()` detection to toolbar to prevent placeholder issues
  - Prevents Unicode placeholders from appearing when trying to format code within link text
- **Issue #47: Tailwind CSS animation conflict** - Renamed keyframe to avoid clashes
  - Changed `@keyframes pulse` to `@keyframes overtype-pulse` 
  - Fixes conflict with Tailwind's `animate-pulse` utility class
- **Issue #45: HTML output methods confusion** - Methods now have distinct purposes
  - `getRenderedHTML()` returns HTML with syntax markers (for debugging)
  - `getRenderedHTML({ cleanHTML: true })` returns clean HTML without OverType markup
  - `getCleanHTML()` added as convenience alias for clean HTML
  - `getPreviewHTML()` returns actual DOM content from preview layer
- **Issue #43: TypeScript support** - Added comprehensive TypeScript definitions
  - TypeScript definitions included in package (`dist/overtype.d.ts`)
  - Added `types` field to package.json
  - Definitions automatically tested during build process
  - Full type support for all OverType features including themes, options, and methods
- **Toolbar configuration** - Made toolbar button config more robust
  - Fixed missing semicolon in toolbar.js
  - Added proper fallback for undefined buttonConfig

### Added  
- TypeScript definition testing integrated into build process
  - `test-types.ts` validates all type definitions
  - Build fails if TypeScript definitions have errors
  - Added `test:types` npm script for standalone testing

### Changed
- Link tooltip styles now use `!important` to prevent CSS reset overrides
  - Ensures tooltip remains visible even with aggressive parent styles

## [1.2.3] - 2025-08-23

### Added
- **Smart List Continuation** (Issue #26) - GitHub-style automatic list continuation
  - Press Enter at the end of a list item to create a new one
  - Press Enter on an empty list item to exit the list
  - Press Enter in the middle of text to split it into two items
  - Supports bullet lists (`-`, `*`, `+`), numbered lists, and checkboxes
  - Numbered lists automatically renumber when items are added or removed
  - Enabled by default with `smartLists: true` option

## [1.2.2] - 2025-08-23

### Fixed
- **Issue #32: Alignment problems with tables and code blocks**
  - Code fences (```) are now preserved and visible in the preview
  - Content inside code blocks is no longer parsed as markdown
  - Used semantic `<pre><code>` blocks while keeping fences visible
- **Fixed double-escaping of HTML entities in code blocks**
  - Changed from using `innerHTML` to `textContent` when extracting code block content
  - Removed unnecessary text manipulation in `_applyCodeBlockBackgrounds()`
  - Special characters like `>`, `<`, `&` now display correctly in code blocks

## [1.2.1] - 2025-08-23

### Fixed
- Tab indentation can now be properly undone with Ctrl/Cmd+Z
  - Previously, tabbing operations were not tracked in the undo history
  - Users can now undo/redo tab insertions and multi-line indentations

## [1.2.0] - 2025-08-21

### Added
- **View Modes** - Three distinct editing/viewing modes accessible via toolbar dropdown
  - Normal Edit Mode: Default WYSIWYG markdown editing with syntax highlighting
  - Plain Textarea Mode: Shows raw markdown without preview overlay  
  - Preview Mode: Read-only rendered preview with proper typography and clickable links
- **API Methods for HTML Export**
  - `getRenderedHTML(processForPreview)`: Get rendered HTML of current content
  - `getPreviewHTML()`: Get the exact HTML displayed in preview layer
  - Enables external preview generation and HTML export functionality
- **View Mode API Methods**
  - `showPlainTextarea(boolean)`: Programmatically switch to/from plain textarea mode
  - `showPreviewMode(boolean)`: Programmatically switch to/from preview mode
- **Enhanced Link Handling**
  - Links now always have real hrefs (pointer-events controls clickability)
  - Links properly hidden in preview mode (no more visible `](url)` syntax)
  - Simplified implementation without dynamic href updates
- **CSS Isolation Improvements**
  - Middle-ground CSS reset prevents parent styles from leaking into editor
  - Protects against inherited margins, padding, borders, and decorative styles
  - Maintains proper inheritance for fonts and colors
- **Dropdown Menu System**
  - Fixed positioning dropdown menus that work with scrollable toolbar
  - Dropdown appends to document.body to avoid overflow clipping
  - Proper z-index management for reliable visibility
- **Comprehensive Test Suite**
  - Added tests for preview mode functionality
  - Added tests for link parsing and XSS prevention
  - Added tests for new API methods (getValue, getRenderedHTML, getPreviewHTML)
  - Test coverage includes view mode switching, HTML rendering, and post-processing

### Fixed
- **Preview Mode Link Rendering** - URL syntax parts now properly hidden in preview mode
- **Code Block Backgrounds** - Restored pale yellow background in normal mode
- **Dropdown Menu Positioning** - Fixed dropdown being cut off by toolbar overflow
- **Cave Theme Styling**
  - Eye icon button now has proper contrast when active (dropdown-active state)
  - Code blocks in preview mode use appropriate dark background (#11171F)
- **Toolbar Scrolling** - Toolbar now scrolls horizontally on all screen sizes as intended
- **CSS Conflicts** - Parent page styles no longer interfere with editor styling

### Changed
- Link implementation simplified - always uses real hrefs with CSS controlling interaction
- Post-processing for lists and code blocks now works in both browser and Node.js environments
- Toolbar overflow changed from hidden to auto for horizontal scrolling
- Dropdown menus use fixed positioning instead of absolute
- **Removed `overscroll-behavior: none`** to restore scroll-through behavior
  - Users can now continue scrolling the parent page when reaching editor boundaries
  - Trade-off: Minor visual desync during Safari elastic bounce vs trapped scrolling

## [1.1.8] - 2025-01-20

### Fixed
- Android bold/italic rendering regression from v1.1.3
  - Removed `font-synthesis: none` to restore synthetic bold/italic on Android devices
  - Updated font stack to avoid 'ui-monospace' pitfalls while maintaining Android support
  - Font stack now properly includes: SF Mono, Roboto Mono, Noto Sans Mono, Droid Sans Mono
  - Fixes issue where Android users could not see bold or italic text formatting

## [1.1.7] - 2025-01-20

### Security
- Fixed XSS vulnerability where javascript: protocol links could execute arbitrary code (#25)
  - Added URL sanitization to block dangerous protocols (javascript:, data:, vbscript:, etc.)
  - Safe protocols allowed: http://, https://, mailto:, ftp://, ftps://
  - Relative URLs and hash links continue to work normally
  - Dangerous URLs are neutralized to "#" preventing code execution

## [1.1.6] - 2025-01-20

### Fixed
- URLs with markdown characters (underscores, asterisks) no longer break HTML structure (#23)
  - Implemented "URL Sanctuary" pattern to protect link URLs from markdown processing
  - Links are now treated as protected zones where markdown syntax is literal text
  - Fixes malformed HTML when URLs contain `_`, `__`, `*`, `**` characters
  - Preserves proper href attributes and visual rendering

## [1.1.5] - 2025-01-20

### Added
- TypeScript definitions file (`src/overtype.d.ts`) with complete type definitions (#20)
- TypeScript test file (`test-types.ts`) for type validation

### Fixed
- Text selection desynchronization during overscroll on browsers with elastic scrolling (#17)
  - Added `overscroll-behavior: none` to prevent bounce animation at scroll boundaries
  - Ensures text selection stays synchronized between textarea and preview layers

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

[1.1.5]: https://github.com/panphora/overtype/compare/v1.1.4...v1.1.5
[1.1.4]: https://github.com/panphora/overtype/compare/v1.1.3...v1.1.4
[1.1.3]: https://github.com/panphora/overtype/compare/v1.1.2...v1.1.3
[1.1.2]: https://github.com/panphora/overtype/compare/v1.1.1...v1.1.2
[1.1.1]: https://github.com/panphora/overtype/compare/v1.1.0...v1.1.1
[1.1.0]: https://github.com/panphora/overtype/compare/v1.0.6...v1.1.0
[1.0.6]: https://github.com/panphora/overtype/releases/tag/v1.0.6
