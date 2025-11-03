# Overtype Action Plan

## 1. Issue #59 - Browser Extension Developer Feedback

**Source**: Developer of gitcasso browser extension who forked Overtype
**Issue URL**: https://github.com/panphora/overtype/issues/59

### Actions to Take:

#### ✅ Accept: Add Prettier Code Formatting
- Set up prettier in the project
- Add `.prettierrc` configuration file
- Add prettier to CI pipeline to enforce consistent formatting
- Format all existing code files
- Add pre-commit hook for automatic formatting

#### ✅ Accept: Improve Parser API Exposure
- Make MarkdownParser more easily importable as standalone module
- Add named export: `export { MarkdownParser } from './parser.js'`
- Update package.json exports to include parser path
- Document the parser API usage
- This addresses both Issue #59 and Issue #58

#### ❌ Reject: GitHub-Specific Features
- Do not add GitHub-style `#9` issue/PR links
- Do not add automatic https:// text linking
- Do not add HTML tag highlighting (`<img>`, `<details>`)
- These features are too specific to GitHub and belong in specialized forks
- Politely explain that these features are outside Overtype's scope

## 2. ✅ DONE - PR #62 - Fix Toolbar Option Being Ignored in reinit()

**Source**: Bug fix for toolbar lifecycle management
**PR URL**: https://github.com/panphora/overtype/pull/62
**Status**: ✅ COMPLETED - Applied with memory leak fix

### Implementation:
- ✅ Moved toolbar lifecycle to `_applyOptions()` method
- ✅ Added `_createToolbar()` helper method
- ✅ Added `_cleanupToolbarListeners()` to prevent memory leaks
- ✅ Stored listener references for proper cleanup
- ✅ Dynamic toolbar toggling now works via `reinit()`

## 3. ✅ DONE - Issue #65 - Code Block Alignment CSS Fixes

**Source**: User reporting alignment issues between textarea and code blocks
**Issue URL**: https://github.com/panphora/overtype/issues/65
**Status**: ✅ COMPLETED

### Implementation:
- ✅ Added `white-space: break-spaces !important;` to `.code-block` selector (styles.js:359)
  - Prevents horizontal scrollbar that breaks alignment
- ✅ Added `font-family: ${fontFamily} !important;` to `pre code` selector (styles.js:366)
  - Matches textarea font exactly for perfect alignment
- ✅ Skipped `line-height: 0px` suggestion as it would break visual rendering

## 4. ✅ DONE - PR #64 - Fix Double-Escaping of Links

**Source**: Fix for Issue #63 - URLs with query parameters get escaped twice
**PR URL**: https://github.com/panphora/overtype/pull/64
**Status**: ✅ COMPLETED - Fix applied with comprehensive test coverage

### Implementation:
- ✅ Applied PR #64 fix to `src/parser.js:358`
  - Removed redundant `escapeHtml()` call on sanctuary URLs
  - URLs already escaped at line 394, second escape caused `&amp;amp;`
- ✅ Added 9 comprehensive tests to `test/links.test.js`
  - URLs with ampersands, angle brackets, quotes
  - mailto, FTP, image URLs with parameters
  - Alignment preservation verification
- ✅ All tests passing (25/25 link tests, 154 total)
- ✅ Security verified: `sanitizeUrl()` still protects against XSS
- ✅ All URL types tested: regular links, images, mailto, FTP, fragments

## 5. ✅ ASSESSED - PR #40 - Web Component Implementation

**Source**: Implements `<overtype-editor>` custom element with Shadow DOM
**PR URL**: https://github.com/panphora/overtype/pull/40
**Assessment**: See pr-40-assessment.md for detailed analysis
**Status**: ✅ CONDITIONALLY ACCEPT - Meets all critical requirements with minor modifications needed

### Assessment Results:

#### ✅ Critical Requirements Status:
1. **Separate Optional Builds** - ✅ PASS
   - Creates completely separate build artifacts (overtype-webcomponent.js/esm/min)
   - Main bundle remains unchanged
   - Opt-in only

2. **Zero Impact on Core Library** - ✅ PASS
   - Pure wrapper using public API only
   - No core parser, editor, or theme changes
   - No private method access

3. **Maintenance Burden** - ⚠️ MODERATE (ACCEPTABLE)
   - Simple wrapper pattern (manageable)
   - 322 lines of README docs (substantial but acceptable)
   - 15 reactive attributes to maintain
   - Includes tests and examples

4. **Uses Current API Only** - ✅ PASS
   - Confirmed public API usage only
   - Future-proof implementation
   - No special hooks needed

### Issues Found:

⚠️ **Scope Creep**: PR includes `.prettierrc` file unrelated to web components (belongs in Issue #59)

### Recommendation:

**CONDITIONALLY ACCEPT** with modifications:
1. Remove `.prettierrc` from this PR (handle separately in Issue #59)
2. Consider splitting web component docs into separate `WEB-COMPONENT.md`
3. Ensure comprehensive test coverage
4. Verify build process doesn't impact main builds

### Benefits:
- Framework-agnostic integration (React, Vue, Angular)
- Shadow DOM encapsulation
- Declarative HTML API
- No core library changes

### Decision:
- ✅ Technically sound and meets all requirements
- ⚠️ Moderate maintenance burden acceptable if willing to support
- 🔧 Request modifications before merge

### Actions to Take:

#### 🔧 Request Changes from Author (ChasLui)

**Required modifications before merge**:

1. **Remove `.prettierrc` from this PR**
   - This file is unrelated to web components
   - Should be handled separately in Issue #59 (Prettier setup)
   - Keeps PR focused on single concern

2. **Split extensive documentation**
   - Current: 322 lines added to README.md
   - Proposed: Create separate `docs/WEB-COMPONENT.md`
   - Keep README.md focused on core library
   - Link to web component docs from main README

**Comment to post on PR #40**:
```markdown
Thanks for this contribution! The web component implementation looks solid and meets all our requirements:

✅ Separate build artifacts (no impact on main bundle)
✅ Pure wrapper using public API only
✅ No core library changes
✅ Includes tests and examples

However, before we can merge, we need two changes:

1. **Remove `.prettierrc`** - This should be in a separate PR addressing Issue #59 (code formatting setup)
2. **Split documentation** - Please move the web component docs to a new `docs/WEB-COMPONENT.md` file and just add a brief mention + link in the main README. This keeps the main README focused on core features.

Once these changes are made, we'll be happy to merge! The implementation itself is excellent work.
```

## 6. PR #35 - Syntax Highlighting Support (ASSESSMENT ONLY)

**Source**: Adds code highlighter API for Shiki, highlight.js, etc.
**PR URL**: https://github.com/panphora/overtype/pull/35
**Existing Review**: See overtype-pr-35-review.md for detailed code analysis

### 🚨 CRITICAL ISSUES IDENTIFIED:

#### Must Fix Before Even Considering:
1. **No Alignment Verification** (BLOCKING)
   - Highlighter output is not verified to preserve character positions
   - This breaks OverType's core feature - character-level alignment
   - A buggy highlighter could break the entire editor

2. **Zero Test Coverage**
   - No tests for the highlighting functionality
   - No alignment preservation tests
   - No error handling tests

3. **Missing TypeScript Definitions**
   - New API methods not typed
   - `codeHighlighter` option not in interface

### Assessment Criteria:

#### 🔍 Critical Requirements (ALL MUST PASS):
1. **Alignment Preservation**
   - Must verify highlighter output preserves exact character count
   - Must verify line count remains unchanged
   - Must fall back to plain text if alignment is broken
   - Must log warnings when alignment breaks

2. **Performance Impact**
   - Must not cause lag on every keystroke
   - Should provide debouncing/caching patterns
   - Must handle expensive highlighters gracefully

3. **Security**
   - Must not allow XSS through highlighter output
   - Should validate/sanitize HTML output

4. **Testing**
   - Must have comprehensive test coverage
   - Must test alignment preservation scenarios
   - Must test error cases

### Decision Framework:
- ❌ **CURRENT STATUS: NOT READY**
- Required changes too extensive for simple merge
- Alignment verification is non-negotiable
- Consider requesting contributor to fix critical issues
- Alternative: Extract useful patterns but implement differently

### If Contributor Fixes Issues:
- Reassess with focus on alignment preservation
- Require proof that no highlighter can break alignment
- Demand extensive testing of various highlighters

## 7. Custom Toolbar Button API

**Source**: Address Issue #61 - Users want to add custom buttons (save, etc.)
**Issue URL**: https://github.com/panphora/overtype/issues/61

### Actions to Take:

#### ✅ Create Custom Button API
- **Design API for adding custom toolbar buttons**:
  ```javascript
  new OverType('#editor', {
    toolbar: true,
    customToolbarButtons: [
      {
        name: 'save',
        icon: '<svg>...</svg>', // or use existing icon name
        title: 'Save document',
        position: 'end', // 'start', 'end', or after specific button
        action: (editor) => {
          const content = editor.getValue();
          // User's custom save logic
        }
      }
    ]
  });
  ```

#### Implementation Details:
- Allow custom SVG icons or reference to existing icons
- Support positioning (start, end, or relative to other buttons)
- Pass editor instance to action callback
- Ensure buttons integrate seamlessly with existing toolbar
- Support dividers/separators between button groups
- Allow buttons to be enabled/disabled dynamically

#### Documentation:
- Create comprehensive examples for common use cases:
  - Save button
  - Export button
  - Custom formatting buttons
  - Integration with external services
- Show how to style custom buttons to match theme
- Document keyboard shortcut integration

#### Benefits:
- Solves Issue #61 without adding application-specific logic
- Keeps OverType focused while being extensible
- Users can add any custom functionality they need
- No bloat for users who don't need custom buttons

## 8. Fix Checkbox Rendering in Preview Mode

**Source**: Issue #60 - Checkbox syntax not rendering as checkboxes
**Issue URL**: https://github.com/panphora/overtype/issues/60

### Actions to Take:

#### ✅ Implement Checkbox Rendering
- **Current behavior**: `- [ ]` and `- [x]` display as plain text in preview
- **Fix**: Render as actual HTML checkboxes in preview mode

#### Implementation:
- Parser already detects checkbox patterns in `LIST_PATTERNS` (line 699 of parser.js)
- Add rendering logic to generate proper HTML:
  ```html
  <!-- For - [ ] -->
  <li><input type="checkbox" disabled> Task item</li>

  <!-- For - [x] or - [X] -->
  <li><input type="checkbox" disabled checked> Completed task</li>
  ```

#### Technical Details:
- Make checkboxes non-interactive (`disabled`) in preview mode
- Preserve alignment by ensuring checkbox width is consistent
- Style checkboxes to match theme colors
- Handle various checkbox formats:
  - `- [ ]` (unchecked)
  - `- [x]` (checked, lowercase)
  - `- [X]` (checked, uppercase)

#### Testing:
- Test alignment with mixed checkbox/non-checkbox lists
- Verify checkboxes render correctly in all themes
- Test with nested lists containing checkboxes
- Ensure raw markdown value preserves original syntax

#### Note:
- This is GitHub Flavored Markdown (GFM) feature
- Keep checkboxes read-only in preview (no interaction)
- Consider future enhancement: interactive checkboxes that update markdown

## 9. ✅ DONE - Export MarkdownParser for Standalone Use

**Source**: Issue #58 - Make MarkdownParser importable without OverType instance
**Issue URL**: https://github.com/panphora/overtype/issues/58
**Status**: ✅ ALREADY IMPLEMENTED - Verified working

### Implementation Status:
- ✅ Parser exported as `export class MarkdownParser` (src/parser.js:9)
- ✅ Package.json exports configured for "./parser" (lines 18-21)
- ✅ README documentation complete (lines 304-334)
- ✅ Import verified working: `import { MarkdownParser } from 'overtype/parser'`

### Usage:
```javascript
// Import just the parser
import { MarkdownParser } from 'overtype/parser';

// Parse markdown to HTML
const html = MarkdownParser.parse('# Hello World\n\nThis is **bold** text.');
```

### Benefits:
- ✅ Server-side rendering without DOM dependency
- ✅ Static site generation support
- ✅ Markdown preview in other contexts
- ✅ No breaking changes - pure addition
- ✅ Already documented with comprehensive examples

## 10. ✅ DONE - Fix Mode Switching Scroll Sync Bug (CRITICAL)

**Source**: Issue #52 - Layers get out of sync after switching modes
**Issue URL**: https://github.com/panphora/overtype/issues/52
**Status**: ✅ COMPLETED - Implemented with cleaner API and data-mode attributes

### Implementation:
- ✅ Added `showNormalEditMode()` method with automatic scroll sync (src/overtype.js:1025-1036)
- ✅ Refactored `showPlainTextarea()` and `showPreviewMode()` to remove boolean params
- ✅ Migrated from CSS classes to `data-mode` attribute for state management
- ✅ Updated all 30+ CSS selectors in src/styles.js to use `[data-mode="..."]`
- ✅ Simplified toolbar mode switching logic (src/toolbar.js:327-340)
- ✅ Updated TypeScript definitions (src/overtype.d.ts:158-160)
- ✅ Updated all test files with new API (20+ method calls)
- ✅ Added `requestAnimationFrame` mocks for Node.js test environment
- ✅ All 155 tests passing (100% success rate)

### Original Problem:
- When user switches to preview mode, scrolls, then switches back to normal mode
- Textarea and preview layers are misaligned
- Happens because textarea is hidden (`display: none`) in preview mode and can't scroll

### Root Cause:
- `showPreviewMode()` and `showPlainTextarea()` don't sync scroll positions
- When textarea is hidden in preview mode, it can't scroll with preview
- When returning to normal mode, textarea has stale scroll position

### Why This Fix Works:
- **Single source of truth**: `data-mode` attribute replaces multiple CSS classes
- **Always syncs scroll**: `showNormalEditMode()` unconditionally syncs from preview to textarea
- **Cleaner API**: Three explicit methods instead of boolean parameters
- **Method chaining**: All methods return `this` for chainability

## 11. ✅ DONE - Fix Theme API Confusion (Add Instance setTheme Method)

**Source**: Issue #54 - Users expect editor.setTheme() to work
**Issue URL**: https://github.com/panphora/overtype/issues/54
**Status**: ✅ COMPLETED - Instance theme method added

### Implementation:
- ✅ Added `setTheme(theme)` instance method (src/overtype.js:882-910)
- ✅ Updated TypeScript definitions to return `this` for chaining (src/overtype.d.ts:149)
- ✅ Updated README documentation (Quick Start, Instance Methods, Static Methods)
- ✅ All 155 tests passing (100% success rate)

### Original Problem:
- Users expect `editor.setTheme()` to work but it doesn't exist
- Only `OverType.setTheme()` exists (global/static)
- Instance themes ARE supported in constructor but can't be changed later

### Why This Works:
- **Reuses existing infrastructure**: Instance themes already work via CSS variables
- **Dual API**: Both global and instance theme methods coexist:
  - `OverType.setTheme()` - sets global theme for all instances
  - `editor.setTheme()` - sets theme for specific instance only
- **Method chaining**: Returns `this` for fluent API
- **No breaking changes**: Pure addition to the API