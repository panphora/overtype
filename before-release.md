# Before Release Checklist

## Version Bump Strategy
- ⚠️ **BREAKING CHANGES**: This must be a MAJOR version bump to v2.0.0
- Toolbar API has breaking changes:
  - Removed `customToolbarButtons`, `hideButtons`, `buttonOrder` options
  - Removed old `toolbar: { buttons: [...] }` format
  - New `toolbarButtons` option with explicit button array
- All breaking changes documented in `toolbar-refactor-plan.md`
- Despite breaking changes, benefits are significant:
  - Simpler API (390 lines of code removed)
  - Smaller bundle (91KB, down from 98KB)
  - More explicit and predictable behavior

## Issue #59 - Browser Extension Developer Feedback
- [ ] Comment on issue #59 and close
  - Thank Ned for the feedback
  - ✅ Parser API is already exportable: `import { MarkdownParser } from 'overtype/parser'`
  - ❌ GitHub-specific features: Better suited for specialized forks
  - ❌ Prettier: Keeping build process simple, consistent code style already in place
  - **Action**: Thank and close issue as partially addressed (parser API already available)

## PR #62 - Toolbar reinit fix
- [ ] Test toolbar dynamic creation/destruction via reinit()
  - Multiple reinit() calls with toolbar: true/false
  - Verify no memory leaks with listener cleanup
- [ ] Comment on PR #62 thanking Kristián
  - Note: Applied with additional memory leak fix for event listeners
  - **Action**: Thank Kristián and close PR as merged

## PR #40 - Web Component Implementation
- [x] Merged with modifications applied locally
  - Removed `.prettierrc` file (belongs in Issue #59)
  - Moved web component docs to `docs/WEB-COMPONENT.md`
  - Fixed TypeScript compilation error
- [ ] Comment on PR #40 thanking ChasLui
  - Thank for the excellent web component implementation
  - Note: Applied with organizational improvements (docs structure)
  - Mention: All 178 tests passing including web component tests
  - **Action**: Thank ChasLui and close PR as merged

## Issue #63 / PR #64 - Fix Double-Escaping of URLs
- [x] Fix applied to `src/parser.js:358`
  - Removed redundant `escapeHtml()` call on sanctuary URLs
  - URLs already escaped at line 394, second escape caused `&amp;amp;`
- [x] Comprehensive tests added (9 new tests in `test/links.test.js`)
  - URLs with ampersands, angle brackets, quotes
  - mailto, FTP, image URLs with parameters
  - Alignment preservation verification
- [ ] Comment on Issue #63 confirming fix
  - Explain: URLs escaped once at entry, sanctuary preserves escaped form
  - Note: All security (XSS) protections remain in place via `sanitizeUrl()`
  - Mention: Added comprehensive test coverage for all special characters
  - Thank Lyric for the detailed bug report with exact line numbers
  - **Action**: Thank Lyric and close issue as fixed
- [ ] Comment on PR #64 thanking Lyric
  - PR applied as-is (architecturally correct fix)
  - Added extensive test coverage to prevent regression
  - Closes Issue #63
  - **Action**: Thank Lyric and close PR as merged

## Issue #61 - Custom Toolbar Button API (MAJOR REFACTOR)
- [ ] Comment on Issue #61 thanking the person who suggested this feature
  - Note: Full implementation complete with major simplification
  - **Breaking changes in v2.0**: Old API removed, new simpler API implemented
  - Key improvements:
    - 390 lines of code removed (net)
    - 5KB smaller bundle size
    - Single `toolbarButtons` option - explicit button array
    - Built-in buttons exported: `import { toolbarButtons } from 'overtype'`
    - Separators included as special buttons
    - Consistent action signature for all buttons
  - Migration guide available in `toolbar-refactor-plan.md`
  - Link to updated examples: `examples/custom-toolbar.html`
  - **Action**: Thank the contributor, explain v2.0 breaking changes, and close as implemented

## Issue #60 - Checkbox Rendering in Preview Mode
- [ ] Comment on Issue #60 thanking the person who suggested this feature
  - Note: Task list checkboxes now render as actual checkboxes in preview mode
  - Mention: Syntax remains visible in normal edit mode for alignment
  - **Action**: Thank the contributor and close issue as implemented

## README.md Updates

- [ ] **Document new toolbar API in main README.md (v2.0 BREAKING CHANGES)**
  - Add "Toolbar Customization" section with new API
  - Document the `toolbarButtons` option
  - Show how to import `toolbarButtons` and `defaultToolbarButtons`
  - Include examples:
    - Default toolbar: `toolbar: true`
    - Custom buttons: Mix built-in + custom buttons in array
    - Separators: Use `toolbarButtons.separator`
    - Action signature: `({ editor, getValue, setValue, event }) => {}`
  - Add "Migration from v1.x" subsection:
    - Old API removed: `customToolbarButtons`, `hideButtons`, `buttonOrder`
    - How to migrate: Use explicit `toolbarButtons` array instead
    - Link to `toolbar-refactor-plan.md` for detailed migration guide
  - Link to examples: `examples/custom-toolbar.html`
  - Benefits section: Simpler API, smaller bundle, more explicit

- [ ] Document task list checkbox feature in README.md
  - Add "Task Lists (GFM)" section
  - Explain `- [ ]` and `- [x]` syntax
  - Note: Renders as actual checkboxes in preview mode only
  - Mention: Syntax visible in normal edit mode for alignment

- [ ] Document web component feature in main README.md
  - Add brief overview section with key benefits (Shadow DOM, declarative API)
  - Link to detailed docs: `docs/WEB-COMPONENT.md`
  - Include quick example showing `<overtype-editor>` usage

- [ ] Document syntax highlighting feature in main README.md
  - Add section explaining library-agnostic API
  - Link to detailed docs: `docs/SYNTAX_HIGHLIGHTING.md`
  - Include quick example showing `setCodeHighlighter()` usage
  - Note: Supports Shiki, Highlight.js, Prism.js, and any custom highlighter

- [ ] Update CHANGELOG.md for v2.0.0
  - Document all breaking changes
  - List new features and improvements
  - Include migration guide reference

# FILES TO DELETE

- action-plan.md
- before-release.md
- issue-54-fix.md
- overtype-pr-35-review.md
- pr-40-assessment.md
- PR-35-MERGE-STRATEGY.md
- SYNTAX_HIGHLIGHTING.md
