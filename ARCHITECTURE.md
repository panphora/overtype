# OverType Architecture Documentation

## Core Concept: The Transparent Overlay Technique

OverType achieves perfect WYSIWYG markdown editing through a deceptively simple yet powerful technique: overlaying a transparent textarea on top of a styled preview div. This document provides a comprehensive overview of the architecture, enabling reimplementation from scratch.

## Fundamental Architecture

### The Two-Layer System

The core innovation involves two perfectly aligned layers:

1. **Input Layer (textarea)**: Completely transparent text, handles all user input, cursor management, and selection
2. **Preview Layer (div)**: Styled markdown rendering positioned exactly beneath the textarea

The breakthrough is maintaining **pixel-perfect alignment** between these layers through meticulous style synchronization:
- Identical font properties (family, size, weight, variant, synthesis, kerning, ligatures)
- Identical box model (padding, margin, border, box-sizing)
- Identical text layout (white-space, word-wrap, word-break, tab-size, line-height, letter-spacing)
- Identical positioning and dimensions (absolute positioning, matching width/height)
- Identical overflow and scrolling behavior

### DOM Structure

```
.overtype-container
  ├── .overtype-toolbar (optional)
  ├── .overtype-wrapper
  │   ├── textarea.overtype-input
  │   └── div.overtype-preview
  └── .overtype-stats (optional)
```

The container uses CSS Grid for layout control, enabling proper toolbar and stats positioning while maintaining the core overlay functionality.

## Component Architecture

### 1. Main Controller (OverType Class)

**Primary Responsibilities:**
- Instance lifecycle management (creation, initialization, destruction)
- DOM construction and structure recovery
- Event orchestration and delegation
- Mode switching (normal, plain, preview)
- Global style injection and theme management
- Multi-instance coordination

**Key Architectural Patterns:**
- **WeakMap Instance Tracking**: Prevents memory leaks while maintaining instance references
- **Array Return Pattern**: Constructor always returns arrays for consistent multi-instance handling
- **DOM Recovery**: Can reinitialize from existing DOM structures for page persistence
- **Global Event Delegation**: Single document-level listeners manage all instances efficiently

**Edge Cases Handled:**
- Multiple instances on same page
- Dynamic instance creation/destruction
- Browser back/forward navigation persistence
- Theme changes affecting all instances
- Responsive behavior and mobile optimization

### 2. Markdown Parser

**Primary Responsibilities:**
- Character-aligned markdown-to-HTML conversion
- XSS prevention and URL sanitization
- Syntax marker preservation (not hiding markdown characters)
- Post-processing for semantic HTML structure

**Key Architectural Patterns:**
- **Sanctuary Pattern**: Uses Unicode Private Use Area characters (U+E000-U+E001) as placeholders to protect parsed content during multi-pass processing
- **Line-by-Line Processing**: Maintains line boundaries for proper alignment
- **Syntax Marker Wrapping**: Markdown characters wrapped in `<span class="syntax-marker">` for CSS-based hiding in preview mode
- **Link Indexing**: Assigns unique anchor names for CSS anchor positioning

**Processing Pipeline:**
1. HTML entity escaping
2. Protected region identification (URL portions of links)
3. Selective inline code protection (excluding URL regions)
4. Link sanctuary creation with preserved URLs
5. Bold/italic parsing (with word-boundary underscore handling)
6. Link restoration with separate text/URL processing
7. List item detection
8. Header transformation
9. Post-processing (list consolidation, code block formatting)

**Protected Regions Strategy:**
The parser uses a "protected regions" approach for URLs to prevent markdown processing:
- First pass identifies all link URLs and marks their byte positions as protected
- Inline code detection skips any patterns within protected regions
- URLs are restored verbatim while link text receives full markdown processing
- This ensures special characters in URLs (`**`, `_`, `` ` ``, `~`) remain literal

**Edge Cases Handled:**
- Nested formatting (bold within italic, links with formatting)
- Underscores in code not triggering emphasis
- URLs containing markdown characters (protected region strategy)
- Underscores requiring word boundaries for italic (prevents `word_with_underscore` issues)
- Mixed list types and indentation levels
- Code blocks with markdown-like content
- XSS attack vectors in URLs
- Inline code within link text but not URLs

### 3. Style System

**Primary Responsibilities:**
- Critical alignment CSS generation
- Theme application and custom property management
- Mode-specific styling (edit, plain, preview)
- Parent style isolation and defensive CSS

**Key Architectural Patterns:**
- **CSS Custom Properties**: All theme colors and instance settings as CSS variables
- **Dynamic Style Injection**: Styles generated in JavaScript and injected once globally
- **Instance-Specific Properties**: Per-editor customization through inline CSS variables
- **High Specificity Defense**: Prevents parent styles from breaking alignment

**Style Categories:**
1. **Alignment Critical**: Font, spacing, positioning properties that must match exactly
2. **Visual Enhancement**: Colors, backgrounds, borders for appearance
3. **Mode Specific**: Different rules for plain/preview/edit modes
4. **Mobile Optimization**: Touch-specific adjustments and responsive behavior

**Edge Cases Handled:**
- Parent CSS interference (aggressive resets)
- Browser font rendering differences
- Android monospace font issues
- Safari elastic scroll desynchronization
- High-DPI display rendering

### 4. Toolbar System

**Primary Responsibilities:**
- Markdown formatting action execution
- Button state synchronization with cursor position
- View mode switching (dropdown menu)
- Keyboard shortcut coordination

**Key Architectural Patterns:**
- **Action Delegation**: Uses external markdown-actions library for formatting
- **State Polling**: Updates button active states on selection changes
- **Fixed Positioning Dropdowns**: Menus append to body to avoid clipping
- **Icon System**: Inline SVG icons for zero external dependencies

**Integration Points:**
- Coordinates with shortcuts manager for consistent behavior
- Updates on global selection change events
- Triggers preview updates after actions
- Manages focus restoration after button clicks

### 5. Event System

**Global Event Strategy:**
The architecture uses document-level event delegation for efficiency:

1. **Input Events**: Single listener handles all textarea inputs across instances
2. **Selection Changes**: Debounced global listener updates toolbar and stats
3. **Keyboard Events**: Keydown captured for shortcuts and special behaviors
4. **Scroll Synchronization**: Ensures preview scrolls with textarea

**Event Flow:**
1. User action triggers browser event
2. Global listener identifies affected instance
3. Instance method processes event
4. Update cycle triggered if needed
5. Callbacks fired for external integration

**Debouncing Strategy:**
- Selection changes: 50ms delay
- Preview updates: Synchronous on input
- Stats updates: Throttled to 100ms
- Toolbar state: 50ms after selection

### 6. Update Cycle

**Primary Update Flow:**
1. User types in textarea
2. Input event triggered
3. Parser converts markdown to HTML
4. Preview innerHTML updated
5. Special processing applied (code backgrounds)
6. Stats recalculated
7. onChange callback fired

**Optimization Strategies:**
- Active line detection for partial updates
- Cached parser results for unchanged content
- Batched DOM updates
- Deferred non-critical updates

### 7. View Modes

**Three Distinct Modes:**

1. **Normal Mode**: Standard overlay editing
   - Transparent textarea visible
   - Preview shows styled markdown
   - Syntax markers visible
   
2. **Plain Mode**: Raw markdown editing
   - Preview hidden
   - Textarea fully visible
   - System font for true plain text

3. **Preview Mode**: Read-only rendering
   - Textarea hidden
   - Preview interactive (clickable links)
   - Syntax markers hidden via CSS
   - Typography enhanced

**Mode Switching:**
- CSS class-based switching
- Minimal JavaScript involvement
- Instant visual feedback
- State preservation across switches

## Reusable Patterns

### Instance Management Pattern
Every component that needs instance tracking uses WeakMap to prevent memory leaks while maintaining references. This pattern appears in the main class, toolbar, and tooltip systems.

### Sanctuary Protection Pattern
Complex multi-pass parsing uses placeholder characters from Unicode Private Use Area to protect already-parsed content. This prevents recursive parsing and maintains content integrity.

### CSS Variable Integration Pattern
All customizable values flow through CSS custom properties, enabling both global and instance-specific theming without JavaScript style manipulation.

### Event Delegation Pattern
Instead of instance-specific listeners, global document listeners identify affected instances through DOM traversal, reducing memory usage and simplifying cleanup.

### Post-Processing Pattern
Raw parser output undergoes post-processing for semantic HTML structure (like list consolidation), separating parsing concerns from presentation.

## Critical Implementation Details

### Achieving Perfect Alignment

The most critical aspect is ensuring the textarea and preview div render text identically:

1. **Font Stack Matching**: Both elements must use identical font families, including fallbacks
2. **Font Synthesis Control**: Disable synthetic bold/italic to prevent width changes
3. **Ligature Disabling**: Prevents character combinations from changing widths
4. **Whitespace Handling**: Both must handle spaces, tabs, and line breaks identically
5. **Box Model Alignment**: Padding, borders, and margins must match exactly
6. **Scroll Synchronization**: Overflow and scroll positions must stay locked

### Browser-Specific Considerations

**Chrome/Edge:**
- Generally most consistent
- Supports all modern features
- CSS anchor positioning works

**Firefox:**
- Requires explicit font-synthesis settings
- Different selection event timing

**Safari:**
- Elastic scrolling can cause desync
- Requires special touch handling
- Font rendering differs slightly

**Mobile (iOS/Android):**
- 16px minimum font prevents zoom
- Touch-action manipulation needed
- Android monospace font issues
- Virtual keyboard handling

### Performance Optimization

**Parsing Performance:**
- Line-by-line processing limits scope
- Sanctuary pattern prevents re-parsing
- Simple regex over complex parsing

**DOM Performance:**
- innerHTML updates over incremental changes
- Batched updates where possible
- Deferred non-critical updates

**Memory Management:**
- WeakMap for instance tracking
- Event delegation over instance listeners
- Cleanup on destroy

## Extension Points

### Custom Themes
Themes are objects with color definitions that convert to CSS custom properties. The system supports:
- Complete theme definitions
- Partial overrides
- Per-instance themes
- Dynamic theme switching

### Toolbar Customization
The toolbar accepts button configurations with:
- Custom icons (SVG strings)
- Action callbacks
- State detection functions
- Dropdown menus

### Parser Extensions
The parser can be extended by:
- Adding new sanctuary types
- Introducing new syntax patterns
- Modifying post-processing
- Custom HTML generation

### Event Hooks
Integration points include:
- onChange callbacks
- onKeydown intercepts
- Custom stats formatters
- Initialization callbacks

## Security Considerations

### XSS Prevention
- All user content HTML-escaped before parsing
- URL sanitization blocks dangerous protocols
- No eval or innerHTML of user content
- Sanctuary system prevents injection during parsing

### Content Security
- Links use data-href in edit mode
- Preview mode enables links safely
- No external resource loading
- Self-contained implementation

## Testing Strategy

### Critical Test Areas

1. **Alignment Tests**: Verify pixel-perfect overlay alignment
2. **Parser Tests**: Comprehensive markdown edge cases
3. **XSS Tests**: Security vulnerability testing
4. **Performance Tests**: Large document handling
5. **Browser Tests**: Cross-browser compatibility
6. **Mobile Tests**: Touch and responsive behavior

### Test Patterns
- Unit tests for parser functions
- Integration tests for update cycle
- E2E tests for user interactions
- Performance benchmarks for large documents
- Security audits for XSS vectors

## Common Pitfalls and Solutions

### Pitfall: Font Rendering Differences
**Solution**: Comprehensive font stack with explicit fallbacks and synthesis control

### Pitfall: Parent Style Interference
**Solution**: Aggressive CSS reset with high specificity and !important flags

### Pitfall: Scroll Desynchronization
**Solution**: Explicit scroll event handling and position synchronization

### Pitfall: Mobile Keyboard Issues
**Solution**: Viewport management and resize detection

### Pitfall: Memory Leaks
**Solution**: WeakMap references and proper cleanup on destroy

## Implementation Checklist

To reimplement OverType from scratch:

1. ✅ Create two-layer DOM structure with absolute positioning
2. ✅ Implement style synchronization system
3. ✅ Build line-by-line markdown parser with sanctuary pattern
4. ✅ Add post-processing for semantic HTML
5. ✅ Implement global event delegation system
6. ✅ Create theme system with CSS variables
7. ✅ Add toolbar with markdown-actions integration
8. ✅ Implement view mode switching
9. ✅ Add XSS protection and URL sanitization
10. ✅ Handle browser-specific edge cases
11. ✅ Optimize for mobile devices
12. ✅ Add destroy and cleanup methods
13. ✅ Implement auto-resize functionality
14. ✅ Add comprehensive error handling

## Conclusion

OverType's architecture demonstrates that complex WYSIWYG editing can be achieved through elegant simplicity. The transparent overlay technique, combined with careful style synchronization and smart parsing, creates a powerful yet maintainable editor. The modular architecture allows for extension while the core concept remains simple: two perfectly aligned layers creating the illusion of styled text input.

The key insight is that by accepting the constraint of monospace fonts and exact alignment, we can avoid the complexity of contentEditable while providing a superior editing experience. This architecture proves that sometimes the best solution is not to fight the browser but to work with its native capabilities in creative ways.