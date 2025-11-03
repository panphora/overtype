# Before Release Checklist

## Issue #59 - Parser API
- [ ] Comment on issue #59 with MarkdownParser export feature
  - Show `import { MarkdownParser } from 'overtype/parser'` usage
  - Link to README documentation section
  - Thank Ned for the feedback

## PR #62 - Toolbar reinit fix
- [ ] Test toolbar dynamic creation/destruction via reinit()
  - Multiple reinit() calls with toolbar: true/false
  - Verify no memory leaks with listener cleanup
- [ ] Comment on PR #62 thanking Kristián
  - Note: Applied with additional memory leak fix for event listeners

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

# FILES TO DELETE

- action-plan.md
- before-release.md
- issue-54-fix.md
- overtype-pr-35-review.md
- pr-40-assessment.md
