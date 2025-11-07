# Floating UI Fallback Implementation Plan

## Overview
Add Floating UI as a dynamic fallback for browsers that don't support CSS Anchor Positioning, maintaining the existing behavior for modern browsers while extending support to older ones.

### Error Handling Philosophy
When any part of the Floating UI fallback fails (CDN load, element not found, positioning error), the tooltip simply doesn't show. This graceful degradation ensures no broken UI states - tooltips are a nice-to-have enhancement, not critical functionality.

---

## Phase 1: Feature Detection & Module Loading

### 1.1 Add browser support detection
- **File**: `src/link-tooltip.js`
- **Location**: `init()` method
- **Action**: Detect CSS anchor positioning support
  ```javascript
  const supportsAnchorPositioning = CSS.supports('position-anchor: --x') &&
                                    CSS.supports('position-area: center');
  ```

### 1.2 Conditional dynamic import
- **File**: `src/link-tooltip.js`
- **Location**: `init()` method
- **Action**: Import Floating UI only when needed
  ```javascript
  if (!supportsAnchorPositioning) {
    try {
      const { computePosition, offset, shift, flip } = await import(
        'https://cdn.jsdelivr.net/npm/@floating-ui/dom@1.7.4/+esm'
      );
      this.floatingUI = { computePosition, offset, shift, flip };
      this.useFloatingUI = true;
    } catch (error) {
      // If dynamic import fails, tooltips simply won't show
      console.warn('Failed to load Floating UI fallback:', error);
      this.floatingUI = null;
      this.useFloatingUI = false;
    }
  }
  ```

### 1.3 Store positioning strategy
- **File**: `src/link-tooltip.js`
- **Location**: Constructor properties
- **Action**: Add flags
  ```javascript
  this.useFloatingUI = false;
  this.floatingUI = null;
  ```

---

## Phase 2: Dual Positioning Logic

### 2.1 Refactor `show()` method
- **File**: `src/link-tooltip.js`
- **Location**: `show(linkInfo)` method
- **Action**: Branch based on positioning strategy
  ```javascript
  show(linkInfo) {
    this.currentLink = linkInfo;
    this.cancelHide();

    // Update tooltip content
    const urlSpan = this.tooltip.querySelector('.overtype-link-tooltip-url');
    urlSpan.textContent = linkInfo.url;

    if (this.useFloatingUI) {
      this.showWithFloatingUI(linkInfo);
    } else {
      this.showWithAnchorPositioning(linkInfo);
    }

    this.tooltip.classList.add('visible');
  }
  ```

### 2.2 Extract native anchor positioning logic
- **File**: `src/link-tooltip.js`
- **Location**: New method `showWithAnchorPositioning()`
- **Action**: Move existing logic
  ```javascript
  showWithAnchorPositioning(linkInfo) {
    // Set the CSS variable to point to the correct anchor
    this.tooltip.style.setProperty('--target-anchor', `--link-${linkInfo.index}`);
  }
  ```

### 2.3 Create Floating UI positioning logic
- **File**: `src/link-tooltip.js`
- **Location**: New method `showWithFloatingUI()`
- **Action**: Find anchor element and compute position
- **Note**: Tooltip only shows when cursor is within link text in editor (same as current behavior)
  ```javascript
  async showWithFloatingUI(linkInfo) {
    // Find the <a> element in preview that corresponds to this link
    const anchorElement = this.findAnchorElement(linkInfo.index);

    if (!anchorElement) {
      // If anchor element not found, don't show tooltip
      return;
    }

    // Check if anchor element is visible and in viewport
    const rect = anchorElement.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) {
      // Element is not visible, don't show tooltip
      return;
    }

    try {
      // Compute position using Floating UI
      const { x, y } = await this.floatingUI.computePosition(
        anchorElement,
        this.tooltip,
        {
          placement: 'bottom',
          middleware: [
            this.floatingUI.offset(8),
            this.floatingUI.shift({ padding: 8 }),
            this.floatingUI.flip()
          ]
        }
      );

      // Apply position
      Object.assign(this.tooltip.style, {
        left: `${x}px`,
        top: `${y}px`,
        position: 'absolute'
      });
    } catch (error) {
      // If Floating UI computation fails, don't show tooltip
      console.warn('Floating UI positioning failed:', error);
      return;
    }
  }
  ```

### 2.4 Add anchor element finder
- **File**: `src/link-tooltip.js`
- **Location**: New method `findAnchorElement()`
- **Action**: Query preview for specific link anchor
  ```javascript
  findAnchorElement(linkIndex) {
    // Find the <a> element with the matching anchor-name style
    const preview = this.editor.preview;
    // Direct query for the specific link - more efficient than iterating
    return preview.querySelector(`a[style*="--link-${linkIndex}"]`);
  }
  ```

---

## Phase 3: Handle Dynamic Updates

### 3.0 Tooltip Triggering Behavior
- **IMPORTANT**: The tooltip is triggered by **cursor position within link text in the editor**, NOT by mouse hover
- **Current behavior** (preserved):
  - User types/navigates in textarea
  - `checkCursorPosition()` detects if cursor is inside `[link text](url)` syntax
  - Tooltip shows near the corresponding rendered link in preview
  - This is NOT a hover tooltip - it's cursor-position based
- **Both positioning methods** (CSS anchor and Floating UI) maintain this same trigger mechanism

### 3.1 Ensure consistent hide behavior
- **File**: `src/link-tooltip.js`
- **Location**: `init()` method
- **Action**: **No changes needed** - existing hide listeners work for both positioning methods
- **Note**: The tooltip HIDES on scroll (not repositions) - this is intentional UX

**Existing hide triggers (already implemented):**
```javascript
// Hide tooltip when typing
this.editor.textarea.addEventListener('input', () => this.hide());

// Hide tooltip when scrolling
this.editor.textarea.addEventListener('scroll', () => this.hide());

// Hide tooltip when textarea loses focus
this.editor.textarea.addEventListener('blur', () => this.hide());

// Hide tooltip when page loses visibility (tab switch, minimize, etc.)
this.visibilityChangeHandler = () => {
  if (document.hidden) {
    this.hide();
  }
};
document.addEventListener('visibilitychange', this.visibilityChangeHandler);
```

These listeners are **position-agnostic** and work identically for both CSS anchor positioning and Floating UI.

### 3.2 Cleanup in destroy()
- **File**: `src/link-tooltip.js`
- **Location**: `destroy()` method
- **Action**: Clear Floating UI references
  ```javascript
  this.floatingUI = null;
  this.useFloatingUI = false;
  ```

---

## Phase 4: CSS Updates

### 4.1 Update tooltip base styles
- **File**: `src/styles.js`
- **Location**: `.overtype-link-tooltip` styles (line 840-870)
- **Action**: Move visual styles outside `@supports`, keep only positioning styles inside
- **IMPORTANT**: This fixes the bug where browsers without anchor positioning support have no tooltip styling at all

**Current structure (BROKEN):**
```css
/* Link Tooltip - CSS Anchor Positioning */
@supports (position-anchor: --x) and (position-area: center) {
  .overtype-link-tooltip {
    /* ALL styles including visual ones are trapped here */
    position: absolute;
    position-anchor: var(--target-anchor, --link-0);
    position-area: block-end center;
    background: #333 !important;
    color: white !important;
    /* ... etc */
  }
}
```

**New structure (CORRECT):**
```css
/* Link Tooltip - Base styles (all browsers) */
.overtype-link-tooltip {
  /* Visual styles that work for both positioning methods */
  background: #333 !important;
  color: white !important;
  padding: 6px 10px !important;
  border-radius: 16px !important;
  font-size: 12px !important;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif !important;
  display: none !important;
  z-index: 10000 !important;
  cursor: pointer !important;
  box-shadow: 0 2px 8px rgba(0,0,0,0.3) !important;
  max-width: 300px !important;
  white-space: nowrap !important;
  overflow: hidden !important;
  text-overflow: ellipsis !important;

  /* Base positioning for Floating UI fallback */
  position: absolute;
}

.overtype-link-tooltip.visible {
  display: flex !important;
}

/* CSS Anchor Positioning (modern browsers only) */
@supports (position-anchor: --x) and (position-area: center) {
  .overtype-link-tooltip {
    /* Only anchor positioning specific properties */
    position-anchor: var(--target-anchor, --link-0);
    position-area: block-end center;
    margin-top: 8px !important;
    position-try: most-width block-end inline-end, flip-inline, block-start center;
    position-visibility: anchors-visible;
  }
}
```

---

## Phase 5: Testing

### 5.1 Add unit tests
- **File**: `test/links.test.js`
- **Action**: Add tests for tooltip positioning
  - Test: Tooltip appears on cursor entering link
  - Test: Tooltip shows correct URL
  - Test: Tooltip hides on cursor leaving link
  - Test: Tooltip positions correctly (visual/integration test)

### 5.2 Browser compatibility testing
- **Manual testing required**:
  - ✅ Chrome 125+ (native anchor positioning)
  - ✅ Firefox (Floating UI fallback)
  - ✅ Safari (Floating UI fallback)
  - ✅ Edge 125+ (native anchor positioning)
  - ✅ Older Chrome/Edge versions (Floating UI fallback)

### 5.3 Add feature detection logging (dev only)
- **File**: `src/link-tooltip.js`
- **Location**: `init()` method
- **Action**: Optional console log for debugging
  ```javascript
  if (this.useFloatingUI) {
    console.debug('OverType: Using Floating UI fallback for link tooltips');
  } else {
    console.debug('OverType: Using native CSS anchor positioning for link tooltips');
  }
  ```

---

## Phase 6: Documentation

### 6.1 Update code comments
- **File**: `src/link-tooltip.js`
- **Location**: Class-level comment
- **Action**: Document dual-strategy approach

### 6.2 Update CHANGELOG
- **File**: `CHANGELOG.md`
- **Action**: Add entry for improved browser support

### 6.3 Update developer docs
- **File**: `docs/DEVELOPER.md` (if exists)
- **Action**: Document positioning strategies and browser support

---

## Success Criteria

- ✅ Tooltips work in modern browsers using native anchor positioning
- ✅ Tooltips work in older browsers using Floating UI fallback
- ✅ Zero bundle size increase for modern browsers
- ✅ Smooth transition between positioning strategies
- ✅ No visual regression in existing behavior
- ✅ Tests pass in all target browsers
- ✅ No console errors or warnings

---

## Estimated Complexity

- **Lines of code**: ~150-200 new/modified lines
- **Files modified**: 2 (link-tooltip.js, styles.js)
- **Files created**: 0
- **Breaking changes**: None
- **Risk level**: Low (additive feature with fallback)

---

## Implementation Notes

### How Current Anchor Positioning Works

1. **Parser creates anchors** (`parser.js:253,257`): Each `<a>` element in the preview gets an inline style `anchor-name: --link-0`, `--link-1`, etc.
   ```html
   <a href="..." style="anchor-name: --link-3">
     <span class="syntax-marker">[</span>
     Click here
     <span class="syntax-marker url-part">](https://...)</span>
   </a>
   ```

2. **Tooltip references anchor** (`link-tooltip.js:132`): The tooltip dynamically sets which anchor to track:
   ```javascript
   this.tooltip.style.setProperty('--target-anchor', `--link-3`);
   ```

3. **CSS positions tooltip** (`styles.js:847-848`): Native CSS anchor positioning:
   ```css
   position-anchor: var(--target-anchor, --link-0);
   position-area: block-end center;
   ```

### Why Floating UI Integration is Clean

- ✅ The anchor elements already exist in the DOM (in `.overtype-preview`)
- ✅ They're already positioned correctly in the preview layer
- ✅ No need to create additional invisible elements
- ✅ The same link index system works for both approaches
- ✅ Reference elements can be queried directly: `preview.querySelector('a[style*="--link-3"]')`
