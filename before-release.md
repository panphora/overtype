# Before Release Checklist

## Version Bump Strategy
- This release should be a MINOR version bump (new features, backward compatible)
- Consider jumping to v1.5.0 or v1.6.0 instead of v1.3.0 to signal the significance of the web component architecture addition
- Web components represent a major enhancement in capabilities while maintaining full backward compatibility

## Issue #59 - Browser Extension Developer Feedback
- [ ] Comment on issue #59 and close
  - Thank Ned for the feedback
  - ✅ Parser API is already exportable: `import { MarkdownParser } from 'overtype/parser'`
  - ❌ GitHub-specific features: Better suited for specialized forks
  - ❌ Prettier: Keeping build process simple, consistent code style already in place
  - Close issue as partially addressed (parser API already available)

## PR #62 - Toolbar reinit fix
- [ ] Test toolbar dynamic creation/destruction via reinit()
  - Multiple reinit() calls with toolbar: true/false
  - Verify no memory leaks with listener cleanup
- [ ] Comment on PR #62 thanking Kristián
  - Note: Applied with additional memory leak fix for event listeners

## PR #40 - Web Component Implementation
- [x] Merged with modifications applied locally
  - Removed `.prettierrc` file (belongs in Issue #59)
  - Moved web component docs to `docs/WEB-COMPONENT.md`
  - Fixed TypeScript compilation error
- [ ] Comment on PR #40 thanking ChasLui
  - Thank for the excellent web component implementation
  - Note: Applied with organizational improvements (docs structure)
  - Mention: All 178 tests passing including web component tests
  - Close PR as merged

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
- [ ] Comment on PR #64 thanking Lyric
  - PR applied as-is (architecturally correct fix)
  - Added extensive test coverage to prevent regression
  - Closes Issue #63

## README.md Updates

- [ ] Document web component feature in main README.md
  - Add brief overview section with key benefits (Shadow DOM, declarative API)
  - Link to detailed docs: `docs/WEB-COMPONENT.md`
  - Include quick example showing `<overtype-editor>` usage
- [ ] Document syntax highlighting feature in main README.md
  - Add section explaining library-agnostic API
  - Link to detailed docs: `docs/SYNTAX_HIGHLIGHTING.md`
  - Include quick example showing `setCodeHighlighter()` usage
  - Note: Supports Shiki, Highlight.js, Prism.js, and any custom highlighter

# FILES TO DELETE

- action-plan.md
- before-release.md
- issue-54-fix.md
- overtype-pr-35-review.md
- pr-40-assessment.md
- PR-35-MERGE-STRATEGY.md
