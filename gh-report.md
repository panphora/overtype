# GitHub Issues & PRs Report for OverType

Generated: 2025-08-17

## Summary
- **Open PRs**: 1
- **Open Issues**: 5  
- **Closed PRs**: 0
- **Closed Issues**: 0

The project just launched (142 HN points in 5 hours!) and is already receiving valuable community contributions and feedback.

---

## Pull Requests

### PR #6: fix(parser): Protect inline code from formatting while allowing spans
- **Author**: Josh Doman (@joshdoman)
- **Created**: 2025-08-17 (Today!)
- **Status**: OPEN, MERGEABLE (Clean)
- **Files Changed**: 2 (src/parser.js +13 lines, test/overtype.test.js +160 lines)

**What it fixes:**
- Solves Issue #2 where inline code with underscores/asterisks was incorrectly formatted
- Examples fixed:
  - `__init__` was being bolded → now displays correctly
  - `OP_CAT` followed by italics was breaking → now works
  - `*asterisk*` in code was being italicized → now protected

**How it works:**
- Replaces code blocks with Unicode private use area placeholders (`\uE000{index}\uE001`)
- Applies formatting (bold/italic/links) to the text
- Restores code blocks afterward
- Still allows formatting that spans across code (e.g., `*text `code` text*` correctly italicizes everything)

**My Recommendation:** ✅ **MERGE THIS**
- High-quality PR with comprehensive test coverage (160 lines of tests!)
- Fixes a real bug reported by a user
- Elegant solution using placeholder technique
- Author clearly understands the codebase
- Tests cover edge cases including nested formatting and spanning scenarios

---

## Issues (Priority Order)

### 🔴 HIGH PRIORITY

#### Issue #3: Hitting tab inside the editor breaks the cursor
- **Author**: mwerezak
- **Impact**: Critical UX bug - cursor misalignment after tab

**Problem**: Tab key moves focus away from editor, and returning breaks cursor alignment

**Recommended Fix:**
```javascript
textarea.addEventListener('keydown', (e) => {
  if (e.key === 'Tab') {
    e.preventDefault();
    // Insert 2 spaces at cursor position
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const value = textarea.value;
    textarea.value = value.substring(0, start) + '  ' + value.substring(end);
    textarea.selectionStart = textarea.selectionEnd = start + 2;
    // Trigger input event to update preview
    textarea.dispatchEvent(new Event('input'));
  }
});
```

**Priority**: Fix immediately - this breaks core editing functionality

---

#### Issue #1: `code` tag does not inherit font size
- **Author**: Sascha Ißbrücker (@sissbruecker)
- **Impact**: Alignment breaks when user CSS sets different font-size for code

**Problem**: External CSS like `code { font-size: 85%; }` breaks the perfect alignment

**Recommended Fix:**
```css
/* In overtype styles, force code to match text size */
.overtype-container code {
  font-size: inherit !important;
  line-height: inherit !important;
}
```

**Priority**: High - this is a common CSS pattern that will affect many integrations

---

### 🟡 MEDIUM PRIORITY

#### Issue #2: Incorrectly renders inline code containing an underscore
- **Author**: Josh Doman (@joshdoman)
- **Status**: **FIXED BY PR #6** ✅

**Action**: Merge PR #6 to close this issue

---

#### Issue #4: Unable to open/navigate to links
- **Author**: David Fiala (@davidfiala)
- **Impact**: Feature request - links aren't clickable

**Analysis**: This is tricky because the textarea captures all clicks. Options:
1. Make links clickable with modifier key (Cmd/Ctrl+Click)
2. Add a preview-only mode toggle
3. Show link preview on hover with "click to open" hint

**Recommended Approach:**
```javascript
// Add to preview element
preview.addEventListener('click', (e) => {
  if (e.target.tagName === 'A' && (e.metaKey || e.ctrlKey)) {
    e.preventDefault();
    window.open(e.target.href, '_blank');
  }
});
```

**Priority**: Medium - nice to have but not critical for editing

---

### 🟢 LOW PRIORITY

#### Issue #5: Image support
- **Author**: David Fiala (@davidfiala)
- **Impact**: Feature request - images don't display

**Analysis**: Images would break the alignment concept since they have variable height. This might be fundamentally incompatible with the transparent textarea approach.

**Options:**
1. Document that images are unsupported by design
2. Show image URLs as styled links
3. Add image preview on hover (won't work on mobile)

**Recommended Approach:**
- Add to README/docs: "Images are not supported as they would break the character-perfect alignment that makes OverType work"
- Consider showing image alt text in brackets: `[Image: alt text]`

**Priority**: Low - document as intentional limitation

---

## Recommended Action Plan

### Immediate (Today):
1. **Merge PR #6** - It's ready and fixes a reported bug
2. **Fix Issue #3** (Tab key) - Critical UX bug
3. **Fix Issue #1** (Code font-size) - Common integration issue

### This Week:
4. Add Cmd/Ctrl+Click for links (Issue #4)
5. Update documentation about image limitations (Issue #5)

### Future Considerations:
- Add CONTRIBUTING.md to guide future contributors (given the high-quality PR received)
- Consider adding GitHub Actions for automated testing
- Add a "Known Limitations" section to README

---

## Community Engagement Notes

The project is getting excellent engagement:
- High-quality PR within hours of launch
- Issues are well-written with clear examples
- Users are trying to integrate OverType into real projects
- The transparent textarea concept is resonating with developers

Keep this momentum by:
- Responding quickly to issues
- Thanking contributors
- Being transparent about design limitations
- Maintaining the "simple and minimal" philosophy