# PR #35 Code Review: Syntax Highlighting Support

**Pull Request:** https://github.com/panphora/overtype/pull/35
**Review Date:** 2025-10-01
**Reviewer:** Claude Code
**Branch:** `syntax-highlighting`
**Status:** Pending Changes

## Overview

PR #35 adds syntax highlighting API support to OverType, allowing integration with libraries like Shiki, Prism, and highlight.js. The implementation adds ~54 lines of production code, 408 lines of documentation, and 3,857 lines of example code.

---

## Architecture & Design ✅

### Strengths
- **Library-agnostic design**: The API accepts any highlighter function, making it compatible with Shiki, Prism, highlight.js, or custom implementations
- **Two-level API**: Both global (`OverType.setCodeHighlighter()`) and per-instance (`editor.setCodeHighlighter()`) options provide excellent flexibility
- **Separation of concerns**: Highlighting logic is cleanly separated in `MarkdownParser` with instance-level overrides passed through

### Concerns
- No TypeScript definitions for the new API (`codeHighlighter` option, `setCodeHighlighter()` methods)

---

## Implementation Quality ⚠️

### parser.js (src/parser.js)

**Strengths:**
- Lines 13-14, 27-29: Global highlighter storage is clean
- Lines 545-557, 715-724: Proper try/catch error handling with fallback to plain text
- Lines 440, 479, 493, 716: Instance highlighter correctly passed through parse chain
- Lines 533-542: Language extraction from fence (line 530) is correct

**Concerns:**

1. **Alignment preservation not verified** (🚨 Critical)
   - Lines 548-552, 718-719 apply highlighting but don't verify character count preservation
   - Given OverType's core feature is character-level alignment, this is a critical oversight
   - A malicious or buggy highlighter could break the entire editor

2. **No validation of highlighter function**
   - No check that `highlighter` is actually a function before calling it
   - Could cause runtime errors

3. **Storage duplication**
   - Both `_codeContent` (line 541, 575) and `codeElement.textContent` (lines 578-581) store the same content
   - Minor inefficiency

### overtype.js (src/overtype.js)

**Strengths:**
- Line 167: `codeHighlighter` option properly added to defaults as `null`
- Lines 446, 779: Instance highlighter correctly passed to parser
- Lines 847-850: Instance method properly updates preview after setting
- Lines 1126-1136: Static method properly updates all instances

**Concerns:**

1. **Missing from options interface**
   - Line 167 adds it, but it's not documented in the JSDoc or visible in the merged options structure

2. **No validation**
   - Lines 847, 1126 don't validate the highlighter parameter

---

## Alignment Preservation 🚨 CRITICAL ISSUE

The implementation **does not verify** that the highlighter preserves character positions. This is OverType's defining feature.

### Evidence from code:
```javascript
// Line 548-552 in parser.js
const highlightedCode = highlighter(
  currentCodeBlock._codeContent,
  currentCodeBlock._language || ''
);
currentCodeBlock._codeElement.innerHTML = highlightedCode;
```

No character count verification occurs before or after applying highlighting.

### Recommendation:
Add alignment verification:

```javascript
const originalLength = currentCodeBlock._codeContent.length;
const originalLineCount = (currentCodeBlock._codeContent.match(/\n/g) || []).length;

try {
  const highlightedCode = highlighter(
    currentCodeBlock._codeContent,
    currentCodeBlock._language || ''
  );

  // Strip HTML tags and verify character count
  const strippedHtml = highlightedCode.replace(/<[^>]+>/g, '');
  const highlightedLength = strippedHtml.length;
  const highlightedLineCount = (strippedHtml.match(/\n/g) || []).length;

  if (strippedHtml !== currentCodeBlock._codeContent) {
    console.warn('Highlighter broke alignment, using fallback');
    console.warn('Expected:', currentCodeBlock._codeContent);
    console.warn('Got:', strippedHtml);
    currentCodeBlock._codeElement.textContent = currentCodeBlock._codeContent;
  } else {
    currentCodeBlock._codeElement.innerHTML = highlightedCode;
  }
} catch (error) {
  console.warn('Code highlighting failed:', error);
  currentCodeBlock._codeElement.textContent = currentCodeBlock._codeContent;
}
```

---

## Documentation 📚

### Strengths
- SYNTAX_HIGHLIGHTING.md is comprehensive (408 lines)
- Multiple integration examples (Shiki, Prism, highlight.js)
- Performance considerations covered (caching, debouncing)
- Best practices section included
- Well-organized with clear examples

### Concerns
- Line 71 in docs: "Preserve Character Positions" is listed as a requirement but **not enforced in code**
- No mention of what happens if highlighter breaks alignment
- No automated tests for the highlighting API
- Should add warning about alignment verification

---

## Testing Coverage ❌ MISSING

### Current Status
- **Zero test coverage** for syntax highlighting functionality
- Existing tests pass, but don't exercise new code paths

### Recommended Tests

```javascript
// test/syntax-highlighting.test.js (NEW FILE NEEDED)

describe('Syntax Highlighting API', () => {
  // Basic functionality
  test('Global highlighter applies to code blocks');
  test('Instance highlighter overrides global highlighter');
  test('Null highlighter disables highlighting');

  // Alignment preservation
  test('Highlighter that preserves alignment works correctly');
  test('Highlighter that breaks alignment falls back to plain text');
  test('Multi-line code blocks maintain line count');

  // Error handling
  test('Highlighter that throws error falls back to plain text');
  test('Invalid language is handled gracefully');
  test('Empty code block is handled correctly');

  // Edge cases
  test('Code block with HTML entities');
  test('Code block with special characters');
  test('Multiple code blocks with different languages');
  test('Switching between highlighters updates preview');
});
```

---

## Performance ⚡

### Concerns

1. **No debouncing**
   - Highlighter is called on every `updatePreview()` (line 446)
   - This happens on every keystroke
   - Expensive highlighters (like Shiki) will cause lag

2. **No caching**
   - Same code is re-highlighted repeatedly
   - No cache invalidation strategy

3. **Blocking**
   - Synchronous highlighters block the main thread
   - No async highlighter support pattern

### Recommendations
- Add debouncing for expensive highlighters (documented but not built-in)
- Consider adding optional caching layer
- Document async highlighter patterns better with working examples
- Add performance monitoring in development mode

---

## Security 🔒

### Strengths
- Lines 547, 718: Error handling prevents exceptions from breaking the editor
- Highlighted HTML goes through normal DOM insertion (innerHTML), which provides some XSS protection

### Concerns
- **No sanitization of highlighter output**
  - Malicious highlighter could inject arbitrary HTML/scripts
  - No validation that output is safe
- Documentation (line 73) mentions "properly escaped HTML" but doesn't enforce it

### Recommendation
Add output sanitization or at least document the security implications:

```javascript
// Validate that highlighter output doesn't contain dangerous patterns
function validateHighlighterOutput(html) {
  // Check for script tags, event handlers, etc.
  const dangerousPatterns = [
    /<script/i,
    /javascript:/i,
    /on\w+\s*=/i  // onclick, onerror, etc.
  ];

  return !dangerousPatterns.some(pattern => pattern.test(html));
}
```

---

## API Completeness 📋

### Missing TypeScript Definitions

The following should be added to `src/overtype.d.ts`:

```typescript
export interface Options {
  // ... existing options ...

  /**
   * Per-instance code highlighter function
   * @param code - Raw code content to highlight
   * @param language - Language identifier from code fence (e.g., 'javascript', 'python')
   * @returns HTML string with syntax highlighting
   * @since 1.3.0
   */
  codeHighlighter?: ((code: string, language: string) => string) | null;
}

export interface OverTypeInstance {
  // ... existing methods ...

  /**
   * Set instance-specific code highlighter
   * @param highlighter - Function that takes (code, language) and returns highlighted HTML, or null to disable
   * @since 1.3.0
   */
  setCodeHighlighter(highlighter: ((code: string, language: string) => string) | null): void;
}

export interface OverTypeConstructor {
  // ... existing static members ...

  /**
   * Set global code highlighter for all OverType instances
   * @param highlighter - Function that takes (code, language) and returns highlighted HTML, or null to disable
   * @since 1.3.0
   */
  setCodeHighlighter(highlighter: ((code: string, language: string) => string) | null): void;
}
```

---

## File Size Impact 📦

| Component | Lines Added | Notes |
|-----------|-------------|-------|
| Core implementation | +54 | parser.js: ~40, overtype.js: ~14 |
| Documentation | +408 | SYNTAX_HIGHLIGHTING.md |
| Examples | +3,857 | shiki-integration.html, highlightjs-integration.html |
| **Total production** | **+54** | Minimal impact on bundle size |
| **Total with docs** | **+4,319** | Significant documentation addition |

---

## Summary & Ratings

| Aspect | Rating | Notes |
|--------|--------|-------|
| **Architecture** | ✅ Good | Clean, library-agnostic design |
| **Implementation** | ⚠️ Fair | Works but missing critical validation |
| **Alignment Safety** | 🚨 Poor | No verification that alignment is preserved |
| **Documentation** | ✅ Good | Comprehensive docs, good examples |
| **Testing** | ❌ Missing | Zero test coverage |
| **TypeScript** | ❌ Missing | No type definitions |
| **Performance** | ⚠️ Fair | No optimization for expensive highlighters |
| **Security** | ⚠️ Fair | No output sanitization |

---

## Recommendations

### Must Fix (Blocking) 🚨

1. **Add alignment verification**
   - Verify highlighter output preserves character positions
   - Fall back to plain text if alignment is broken
   - Location: `src/parser.js` lines 548-552 and 718-719

2. **Add TypeScript definitions**
   - Add `codeHighlighter` to Options interface
   - Add `setCodeHighlighter()` to instance and constructor interfaces
   - Location: `src/overtype.d.ts`

3. **Add test coverage**
   - Basic functionality tests
   - Alignment preservation tests
   - Error handling tests
   - Location: Create `test/syntax-highlighting.test.js`

### Should Fix (Important) ⚠️

4. **Add input validation**
   - Check highlighter is a function before calling
   - Validate language parameter
   - Location: `src/parser.js` lines 545, 716

5. **Add performance optimization guidance**
   - Document debouncing patterns with working code
   - Provide caching example implementation
   - Location: `SYNTAX_HIGHLIGHTING.md` performance section

6. **Enhance documentation**
   - Make alignment preservation requirement more prominent
   - Document what happens when alignment is broken
   - Add security considerations section
   - Location: `SYNTAX_HIGHLIGHTING.md`

### Nice to Have (Optional) 💡

7. **Add development-mode warnings**
   - Warn when highlighter breaks alignment (development only)
   - Log performance metrics for slow highlighters
   - Location: `src/parser.js`

8. **Add performance monitoring**
   - Track highlighting duration
   - Warn about slow highlighters
   - Location: `src/parser.js`

9. **Consider output sanitization**
   - Sanitize highlighter output to prevent XSS
   - At minimum, document security implications
   - Location: `src/parser.js` or new utility file

---

## Conclusion

PR #35 adds a valuable feature with a clean API design and excellent documentation. However, it has critical gaps in alignment verification and testing that must be addressed before merging. The implementation works for well-behaved highlighters but doesn't protect against highlighters that break OverType's core character-alignment feature.

**Recommendation:** Request changes focusing on alignment verification, TypeScript definitions, and test coverage before approval.
