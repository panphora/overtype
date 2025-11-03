# Syntax Highlighting Alignment Tests

This directory contains tests to verify whether popular syntax highlighting libraries preserve character-for-character alignment, which is **critical** for OverType's core feature.

## What This Tests

OverType requires that:
1. **Character count** remains identical before/after highlighting
2. **Character content** matches exactly (no trimming, no entity conversion)
3. **Line count** remains unchanged
4. **No alignment-breaking patterns** (like `&nbsp;`, encoded spaces, etc.)

## Libraries Tested

- **Shiki v3.0** - VS Code-powered highlighter
- **Highlight.js** - Classic syntax highlighter
- **Prism.js** - Lightweight highlighter

## Test Fixtures

Complex code examples in 3 languages with edge cases:
- **JavaScript/TypeScript**: Template literals, regex, URLs with query params, nested quotes
- **Python**: F-strings, regex patterns, docstrings, nested dictionaries, trailing spaces
- **Rust**: Lifetime annotations, macros, trait objects, async/await chains

## Running the Tests

```bash
# Install dependencies
cd syntax-highlighting-tests
npm install

# Run alignment tests
npm test
```

## Expected Output

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Syntax Highlighter Alignment Verification Tests
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Testing Shiki v3.0

✓ Shiki v3.0 - javascript (45ms)
✓ Shiki v3.0 - python (32ms)
✓ Shiki v3.0 - rust (38ms)

Testing Highlight.js

✓ Highlight.js - javascript (8ms)
✓ Highlight.js - python (6ms)
✓ Highlight.js - rust (7ms)

Testing Prism.js

✓ Prism.js - javascript (4ms)
✓ Prism.js - python (3ms)
✓ Prism.js - rust (5ms)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Summary

  Total tests: 9
  Passed: 9
  Failed: 0

  ✓ All highlighters preserve alignment!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

## Interpreting Results

### ✓ PASS
Library preserves alignment and is **safe for OverType**.

### ✗ FAIL
Library breaks alignment and is **NOT safe for OverType**.

Common failure modes:
- Trimming trailing whitespace
- Converting spaces to `&nbsp;`
- Adding/removing newlines
- HTML entity encoding that changes character positions

## Why This Matters

OverType's core feature is the invisible textarea overlay technique. The textarea and preview must have **identical character positions** for the cursor to align properly. If a highlighter changes even a single space, the alignment breaks and the cursor appears in the wrong position.

## Next Steps

After running these tests:
1. Review which libraries pass alignment verification
2. Decide if syntax highlighting is worth the maintenance burden
3. If accepting PR #35, require alignment verification in the implementation
4. Document safe libraries in the API documentation
