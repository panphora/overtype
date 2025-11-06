# Before Release Checklist

## Version Bump Strategy
- ⚠️ **BREAKING CHANGES**: This must be a MAJOR version bump to v2.0.0
- Toolbar API has breaking changes:
  - Removed `customToolbarButtons`, `hideButtons`, `buttonOrder` options
  - Removed old `toolbar: { buttons: [...] }` format
  - New `toolbarButtons` option with explicit button array
- Benefits:
  - Simpler API (390 lines of code removed)
  - Smaller bundle (91KB, down from 98KB)
  - More explicit and predictable behavior

## README.md Updates

- [x] **Document new toolbar API** - Completed
  - Added "Toolbar" section with default and custom examples
  - Documented `toolbarButtons` import and usage
  - Custom button examples with action signature
  - Link to examples/custom-toolbar.html

- [x] **Migration from v1.x** - Completed
  - Added "Migration from v1.x" section
  - Old vs new API comparison
  - Clear migration steps
  - Note for default toolbar users (no changes needed)

- [x] **Task Lists** - Completed
  - Added "Task Lists" section
  - Syntax examples
  - Edit vs preview mode behavior

- [x] **Syntax Highlighting** - Completed
  - Added "Syntax Highlighting" section
  - Global and per-instance examples
  - Link to docs/SYNTAX_HIGHLIGHTING.md

- [x] **Supported Markdown** - Completed
  - Added strikethrough, code blocks, task lists
  - Updated note about edit vs preview modes

- [x] **API Documentation** - Completed
  - Added `toolbarButtons` option to Options
  - Added `codeHighlighter` option to Options
  - Added `setCodeHighlighter()` to Instance Methods
  - Added `OverType.setCodeHighlighter()` to Static Methods

- [x] **Examples section** - Completed
  - Added custom-toolbar.html reference

- [ ] **Update CHANGELOG.md for v2.0.0**

**CHANGELOG.md entry:**
```markdown
## v2.0.0 - 2025-01-XX

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

### 📦 Bundle Size

- **91KB** minified (down from 98KB in v1.x)
- 390 lines of code removed from toolbar implementation
- Simpler, more maintainable codebase

### 📚 Documentation

- Complete README rewrite with v2.0 features
- New migration guide for v1.x users
- examples/custom-toolbar.html with 4 complete examples
- docs/SYNTAX_HIGHLIGHTING.md guide
- docs/WEB-COMPONENT.md guide
```

# FILES TO DELETE BEFORE RELEASE

- action-plan.md
- before-release.md (this file)
- issue-54-fix.md
- overtype-pr-35-review.md
- pr-40-assessment.md
- PR-35-MERGE-STRATEGY.md
- SYNTAX_HIGHLIGHTING.md (content moved to docs/)
- readme-v2-update-plan.md
- toolbar-refactor-plan.md (optional - could keep as historical reference)
