# Syntax Highlighting Alignment Test Results

**Test Date:** 2025-11-03
**Node Version:** v24.5.0

## Executive Summary

**⚠️ CRITICAL FINDING: 7 out of 9 tests FAILED**

Only **2 out of 9 tests** (22%) preserved alignment. **All three libraries break alignment** in various ways, making them **UNSAFE for OverType without additional safeguards**.

## Detailed Results

### Shiki v3.0

| Language   | Result | Time  | Issue |
|------------|--------|-------|-------|
| JavaScript | ❌ FAIL | 196ms | `&` → `&#x26;` (HTML entity encoding) |
| Python     | ✅ PASS | 19ms  | ✓ Preserved alignment |
| Rust       | ❌ FAIL | 7ms   | `<` → `&#x3C;`, `>` (angle brackets encoded) |

**Problem:** Shiki encodes special HTML characters (`&`, `<`, `>`) as entities, changing character count.

### Highlight.js

| Language   | Result | Time | Issue |
|------------|--------|------|-------|
| JavaScript | ❌ FAIL | 8ms  | `"` → `&quot;` (quote encoding) |
| Python     | ❌ FAIL | 8ms  | `"` → `&quot;` (quote encoding) |
| Rust       | ❌ FAIL | 2ms  | `<` → `&lt;`, `>` → `&gt;`, `'` → `&#x27;` |

**Problem:** Highlight.js encodes ALL HTML-sensitive characters, breaking alignment everywhere.

### Prism.js

| Language   | Result | Time | Issue |
|------------|--------|------|-------|
| JavaScript | ❌ FAIL | 5ms  | `&` → `&amp;` (ampersand encoding) |
| Python     | ✅ PASS | 2ms  | ✓ Preserved alignment |
| Rust       | ❌ FAIL | 1ms  | `<` → `&lt;` (angle bracket encoding) |

**Problem:** Prism.js encodes ampersands and angle brackets, but not consistently.

## Root Cause Analysis

All three libraries encode HTML special characters for **security reasons** (XSS prevention), but this **breaks OverType's character alignment**:

```
Original:  const URL = "http://api.com?a=1&b=2";
After HL:  const URL = "http://api.com?a=1&#x26;b=2";

Position:  0123456789...                  (expected)
Actual:    0123456789...      (5 extra chars from &#x26;)

Result: ✗ Cursor misalignment
```

## Why This Matters

OverType's invisible textarea overlay requires **exact 1:1 character mapping**:
- Input character at position N must align with display character at position N
- **One extra character** breaks the entire editor
- HTML entities like `&#x26;` (6 chars) vs `&` (1 char) = **5 character offset**

## Specific Failure Examples

### JavaScript URL Encoding
```
Original: "https://api.example.com?param=1&other=2"
Shiki:    "https://api.example.com?param=1&#x26;other=2"
          Position 146: Expected '&', Got '&#x26;'
```

### Rust Generic Types
```
Original: Config<'a>
Shiki:    Config&#x3C;'a>
          '<' becomes 6 characters instead of 1
```

### Highlight.js Quote Encoding
```
Original: const API_URL = "https://...
Hljs:     const API_URL = &quot;https://...
          Position 113: '"' becomes '&quot;'
```

## Performance Notes

- **Shiki:** Slowest (196ms initial), fast after cache (7-19ms)
- **Highlight.js:** Fast (2-8ms)
- **Prism.js:** Fastest (1-5ms)

Performance is good, but **irrelevant if alignment is broken**.

## Conclusion

### ❌ None of these libraries are safe for OverType "out of the box"

All three popular syntax highlighting libraries:
1. **Break character alignment** by encoding HTML entities
2. **Cannot be trusted** without post-processing
3. **Would require** additional validation layer to strip/decode entities

### Implications for PR #35

1. **Without alignment verification:** PR #35 would silently break OverType for users
2. **With alignment verification:** Most highlighters would fail validation and fall back to plain text
3. **With entity decoding:** Adds complexity and potential XSS risks

### Recommendations

**Option A:** Reject PR #35 entirely
- Syntax highlighting fundamentally conflicts with OverType's architecture
- All major libraries require post-processing to work safely
- Maintenance burden too high

**Option B:** Accept with strict safeguards
- Require alignment verification (strip HTML, compare)
- Document that most highlighters need entity decoding
- Provide working examples with pre-decoded output
- Add comprehensive tests

**Option C:** Document as "Advanced/Experimental"
- Mark the feature as experimental
- Warn that most highlighters break alignment
- Let advanced users implement their own solutions
- No official support

## Test Artifacts

- Fixtures: `fixtures.js` (3 languages, edge cases)
- Test suite: `test-alignment.js` (alignment verification)
- Run: `npm test` to reproduce

## Why Python Passed Sometimes

Python code had fewer HTML-sensitive characters in the test fixture:
- No URLs with `&`
- No generic types with `<>`
- Limited quote usage

**This is NOT an endorsement** - Python code with these characters would also fail.
