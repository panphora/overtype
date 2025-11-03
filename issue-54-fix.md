# Issue #54 - Theme API Fix

## Current State
- Instance themes ARE supported via constructor: `new OverType('#editor', { theme: 'cave' })`
- But there's no instance method to change theme after initialization
- `OverType.setTheme()` is static and affects ALL instances globally

## Simple Fix - Add Instance Method

```javascript
// Add this instance method to overtype.js (around line 770 after reinit)

/**
 * Set theme for this instance
 * @param {string|Object} theme - Theme name or custom theme object
 */
setTheme(theme) {
  // Update instance theme
  this.instanceTheme = theme;

  // Get theme object
  const themeObj = typeof theme === 'string' ? getTheme(theme) : theme;
  const themeName = typeof themeObj === 'string' ? themeObj : themeObj.name;

  // Update container theme attribute
  if (themeName) {
    this.container.setAttribute('data-theme', themeName);
  }

  // Apply CSS variables to container for instance override
  if (themeObj && themeObj.colors) {
    const cssVars = themeToCSSVars(themeObj.colors);
    this.container.style.cssText += cssVars;
  }

  // Update preview to reflect new theme
  this.updatePreview();

  return this;
}
```

## Why This Works
- Instance themes already work via CSS variables on container
- We just need to expose the ability to change them
- No breaking changes to existing global theme system
- Both APIs can coexist:
  - `OverType.setTheme('cave')` - changes all instances without instance themes
  - `editor.setTheme('cave')` - changes just this instance

## Documentation Update

```javascript
// Global theme (affects all instances without instance themes)
OverType.setTheme('cave');

// Instance theme (overrides global for this instance)
const [editor] = new OverType('#editor', { theme: 'solar' });
editor.setTheme('cave'); // Now this works!
```

## Complexity: TRIVIAL
- ~20 lines of code
- No architectural changes
- Uses existing infrastructure
- Maintains backward compatibility