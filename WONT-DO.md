# OverType: Features We Won't Implement

This document outlines features that are intentionally excluded from OverType to maintain its core philosophy of simplicity, performance, and perfect alignment.

## Open to Elegant Solutions

These features could be considered if someone proposes a performant, elegant solution that doesn't break existing functionality:

### Syntax Highlighting in Code Blocks
**Why it's challenging:**
- Multi-line tokens can span across OverType's line-by-line DOM structure
- Each line is in a separate `<div>` element
- Syntax highlighters expect continuous text blocks
- Would need to maintain character-perfect alignment

**What we'd need:**
- Solution that works with line-by-line DOM structure
- No impact on editing performance
- Maintains perfect character alignment
- Lightweight (< 10KB added)
- Works with existing architecture

### Autocompletion / Suggestion Popups
**Today's answer:** build it in the host app, not in core. OverType exposes everything needed (`editor.textarea`, `onChange`, `getValue`/`setValue`), and there is a complete, tested recipe for GitHub-style `@mention` / `#issue` popups: [docs/AUTOCOMPLETE.md](docs/AUTOCOMPLETE.md). The door stays open to a clean, opt-in core implementation if one proves itself in the wild first.

**Why it's challenging:**
- Needs to feel snappy on every keystroke; trigger detection runs in the input hot path
- Trigger configuration (`@`, `#`, custom patterns) must not fight the host app's own input handling
- Mobile keyboards and accessibility tools need deliberate behavior, not an afterthought
- The visual/keyboard interaction model (open, navigate, select, dismiss) is non-trivial to get right

**What we'd need:**
- Opt-in API: disabled by default, host app supplies trigger pattern and suggestion source
- Reuses the existing Floating UI positioning pattern that `LinkTooltip` uses
- Hides on the same signals as `LinkTooltip` (cursor moves out of trigger context, scroll, blur)
- Zero measurable typing impact when the feature is disabled
- Negligible typing impact when enabled with no popup open
- Plays well with native mobile autocorrect/suggestion bars
- Keyboard navigation (↑↓/Enter/Esc) without breaking native textarea behavior elsewhere

---

## Will Not Implement

These features are fundamentally incompatible with OverType's design philosophy and architecture:

### 🚫 Images
**Why not:**
- Images break the character grid alignment
- Would require placeholder characters or break the overlay model
- Many excellent rich editors already handle images well

**Alternative:** Use OverType for text editing, preview rendered markdown elsewhere for images.

### 🚫 Tables
**Why not:**
- Variable column widths break monospace grid assumptions
- Table navigation (Tab between cells) conflicts with textarea behavior
- Would require significant architecture changes

**Alternative:** Use formatted code blocks for simple ASCII tables.

### 🚫 Split Pane Preview
**Why not:**
- OverType IS the preview (that's the whole point)
- Split pane defeats the overlay innovation
- Plenty of other editors offer split preview

**Alternative:** Use the proposed preview mode toggle for a clean reading view.

### 🚫 File Tree / Project Management
**Why not:**
- OverType is an editor component, not an IDE
- File management is the host application's responsibility
- Would massively expand scope

**Alternative:** Integrate OverType into existing IDEs or editors that have file management.

### 🚫 Vim/Emacs Keybindings
**Why not:**
- Modal editing breaks textarea native behavior
- Complexity explosion for minority use case
- Better served by actual Vim/Emacs or plugins

**Alternative:** Use browser extensions that add Vim keybindings to all textareas.

### 🚫 Nested Lists
**Why not:**
- Tab key naturally inserts `\t` in textareas, Markdown needs spaces for indentation
- Different indent levels with varying marker widths break character grid alignment
- Parser runs per keystroke causing visual "jumping" when typing indentation
- Would require complex state management contradicting the "transparent textarea" philosophy

**Alternative:** Use single-level lists with clear headings to organize content hierarchically.

---

## Design Philosophy

OverType intentionally stays small and focused. Every feature has a cost in:
- **Code complexity** - More code means more bugs
- **Performance** - Every feature adds overhead
- **Maintenance** - Features need updates and bug fixes forever
- **Learning curve** - More features make it harder to understand
- **Testing surface** - More combinations to test

By saying "no" to these features, OverType can remain:
- **Fast** - Instant response, no lag
- **Small** - ~60KB minified
- **Reliable** - Fewer features = fewer bugs
- **Understandable** - You can read the entire source in an hour
- **Maintainable** - One person can maintain it

