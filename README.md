# OverType

A lightweight markdown editor library with perfect WYSIWYG alignment using an invisible textarea overlay technique. Includes optional toolbar. ~86KB minified with all features.

## Live Examples

🎮 **Try it out**: [Interactive demos on overtype.dev](https://overtype.dev)
- [Basic Editor](https://overtype.dev/#basic-editor)
- [With Toolbar](https://overtype.dev/#toolbar)
- [Multiple Instances](https://overtype.dev/#multiple-instances)
- [View Modes](https://overtype.dev/#view-modes)
- [Custom Themes](https://overtype.dev/#custom-themes)
- [All Markdown Features](https://overtype.dev/#markdown-features)

## Features

- 👻 **Invisible textarea overlay** - Transparent input layer overlaid on styled preview for seamless editing
- 🎨 **Global theming** - Solar (light) and Cave (dark) themes that apply to all instances
- ⌨️ **Keyboard shortcuts** - Common markdown shortcuts (Cmd/Ctrl+B for bold, etc.)
- 📱 **Mobile optimized** - Responsive design with mobile-specific styles
- 🔄 **DOM persistence aware** - Recovers from existing DOM (perfect for HyperClay and similar platforms)
- 🚀 **Lightweight** - ~86KB minified
- 🎯 **Optional toolbar** - Clean, minimal toolbar with all essential formatting
- ✨ **Smart shortcuts** - Keyboard shortcuts with selection preservation
- 📝 **Smart list continuation** - GitHub-style automatic list continuation on Enter
- 🔧 **Framework agnostic** - Works with React, Vue, vanilla JS, and more

## How it works

![OverType Architecture Diagram](https://websharebox.s3.amazonaws.com/diagram.png)

We overlap an invisible textarea on top of styled output, giving the illusion of editing styled text using a plain textarea.

## Comparisons

| Feature | OverType | HyperMD | Milkdown | TUI Editor | EasyMDE |
|---------|----------|---------|----------|------------|---------|
| **Size** | ~86KB | 364.02 KB | 344.51 KB | 560.99 KB | 323.69 KB |
| **Dependencies** | Bundled | CodeMirror | ProseMirror + plugins | Multiple libs | CodeMirror |
| **Setup** | Single file | Complex config | Build step required | Complex config | Moderate |
| **Approach** | Invisible textarea | ContentEditable | ContentEditable | ContentEditable | CodeMirror |
| **Mobile** | Perfect native | Issues common | Issues common | Issues common | Limited |
| **Markdown syntax** | Visible | Hidden | Hidden | Toggle | Visible |
| **Advanced features** | Basic | Full | Full | Full | Moderate |
| **Best for** | Simple, fast, mobile | Full WYSIWYG | Modern frameworks | Enterprise apps | Classic editing |

**Choose OverType when you need:**
- Tiny bundle size (10x smaller than alternatives)
- Zero dependencies - single file that works immediately
- Perfect native browser features (undo/redo, mobile keyboards, spellcheck)
- Dead-simple integration without build tools
- Easy to understand, modify, and extend
- Excellent mobile support with visible markdown syntax

**Choose other editors when you need:**
- Full WYSIWYG with hidden markdown syntax
- Advanced features like tables, diagrams, or collaborative editing
- Rich plugin ecosystems
- Enterprise features and extensive customization
- Framework-specific integration (React, Vue, etc.)
- Complex multi-layered architecture for deep customization

## Installation

### NPM
```bash
npm install overtype
```

### CDN
```html
<script src="https://unpkg.com/overtype/dist/overtype.min.js"></script>
```

## Quick Start

```javascript
// Create a single editor
const [editor] = new OverType('#editor', {
  value: '# Hello World',
  theme: 'solar'
});

// Get/set content
editor.getValue();
editor.setValue('# New Content');

// Change theme
editor.setTheme('cave');
```

## Usage

### Basic Editor

```html
<div id="editor" style="height: 400px;"></div>

<script>
  const [editor] = new OverType('#editor', {
    placeholder: 'Start typing markdown...',
    value: '# Welcome\n\nStart writing **markdown** here!',
    onChange: (value, instance) => {
      console.log('Content changed:', value);
    }
  });
</script>
```

### Toolbar & View Modes

```javascript
// Enable the toolbar with view mode switcher
const [editor] = new OverType('#editor', {
  toolbar: true,  // Enables the toolbar
  value: '# Document\n\nSelect text and use the toolbar buttons!'
});

// Toolbar provides:
// - Bold, Italic formatting
// - Heading levels (H1, H2, H3)
// - Links, inline code, code blocks
// - Bullet and numbered lists
// - View mode switcher (eye icon dropdown)
// - All with keyboard shortcuts!

// Three view modes available via toolbar dropdown:
// 1. Normal Edit - Default WYSIWYG markdown editing
// 2. Plain Textarea - Shows raw markdown without preview overlay
// 3. Preview Mode - Read-only rendered preview with clickable links

// Programmatically switch modes:
editor.showPlainTextarea(true);   // Switch to plain textarea mode
editor.showPreviewMode(true);     // Switch to preview mode
```

### Keyboard Shortcuts

The toolbar and keyboard shortcuts work together seamlessly:

- **Cmd/Ctrl + B** - Bold
- **Cmd/Ctrl + I** - Italic
- **Cmd/Ctrl + K** - Insert link
- **Cmd/Ctrl + Shift + 7** - Numbered list
- **Cmd/Ctrl + Shift + 8** - Bullet list

All shortcuts preserve text selection, allowing you to apply multiple formats quickly.

### Multiple Editors

```javascript
// Initialize multiple editors at once
const editors = OverType.init('.markdown-editor', {
  theme: 'cave',
  fontSize: '16px'
});

// Each editor is independent
editors.forEach((editor, index) => {
  editor.setValue(`# Editor ${index + 1}`);
});
```

### Form Integration

```javascript
// Use with form validation
const [editor] = new OverType('#message', {
  placeholder: 'Your message...',
  textareaProps: {
    required: true,
    maxLength: 500,
    name: 'message'
  }
});

// The textarea will work with native form validation
document.querySelector('form').addEventListener('submit', (e) => {
  const content = editor.getValue();
  // Form will automatically validate required field
});
```

### Custom Theme

```javascript
const [editor] = new OverType('#editor', {
  theme: {
    name: 'my-theme',
    colors: {
      bgPrimary: '#faf0ca',
      bgSecondary: '#ffffff',
      text: '#0d3b66',
      h1: '#f95738',
      h2: '#ee964b',
      h3: '#3d8a51',
      strong: '#ee964b',
      em: '#f95738',
      link: '#0d3b66',
      code: '#0d3b66',
      codeBg: 'rgba(244, 211, 94, 0.2)',
      blockquote: '#5a7a9b',
      hr: '#5a7a9b',
      syntaxMarker: 'rgba(13, 59, 102, 0.52)',
      cursor: '#f95738',
      selection: 'rgba(244, 211, 94, 0.4)'
    }
  }
});
```

### Preview & HTML Export

Generate HTML previews or export the rendered content:

```javascript
const [editor] = new OverType('#editor', {
  value: '# Title\n\n**Bold** text with [links](https://example.com)'
});

// Get the raw markdown
const markdown = editor.getValue();
// Returns: "# Title\n\n**Bold** text with [links](https://example.com)"

// Get rendered HTML with syntax markers (for debugging/inspection)
const html = editor.getRenderedHTML();
// Returns HTML with <span class="syntax-marker"> elements visible

// Get clean HTML for export (no OverType-specific markup)
const cleanHTML = editor.getRenderedHTML({ cleanHTML: true });
// Returns clean HTML suitable for saving/exporting

// Convenience method for clean HTML
const exportHTML = editor.getCleanHTML();
// Same as getRenderedHTML({ cleanHTML: true })

// Get the current preview element's HTML (actual DOM content)
const previewHTML = editor.getPreviewHTML();
// Returns exactly what's shown in the editor's preview layer

// Example: Export clean HTML to server
const htmlToSave = editor.getCleanHTML();  // No syntax markers
// Example: Clone exact preview appearance
document.getElementById('clone').innerHTML = editor.getPreviewHTML();
```

### Stats Bar

Enable a built-in stats bar that shows character, word, and line counts:

```javascript
// Enable stats bar on initialization
const [editor] = new OverType('#editor', {
  showStats: true
});

// Show or hide stats bar dynamically
editor.showStats(true);  // Show
editor.showStats(false); // Hide

// Custom stats format
const [editor] = new OverType('#editor', {
  showStats: true,
  statsFormatter: (stats) => {
    // stats object contains: { chars, words, lines, line, column }
    return `<span>${stats.chars} characters</span>
            <span>${stats.words} words</span>
            <span>${stats.lines} lines</span>
            <span>Line ${stats.line}, Col ${stats.column}</span>`;
  }
});
```

The stats bar automatically adapts to your theme colors using CSS variables.

### React Component

```jsx
function MarkdownEditor({ value, onChange }) {
  const ref = useRef();
  const editorRef = useRef();
  
  useEffect(() => {
    const [instance] = OverType.init(ref.current, {
      value,
      onChange
    });
    editorRef.current = instance;
    
    return () => editorRef.current?.destroy();
  }, []);
  
  useEffect(() => {
    if (editorRef.current && value !== editorRef.current.getValue()) {
      editorRef.current.setValue(value);
    }
  }, [value]);
  
  return <div ref={ref} style={{ height: '400px' }} />;
}
```

## API

### Constructor

```javascript
new OverType(target, options)
```

**Parameters:**
- `target` - Selector string, Element, NodeList, or Array of elements
- `options` - Configuration object (see below)

**Returns:** Array of OverType instances (always an array, even for single element)

### Options

```javascript
{
  // Typography
  fontSize: '14px',
  lineHeight: 1.6,
  fontFamily: 'monospace',
  padding: '16px',
  
  // Theme - 'solar', 'cave', or custom theme object
  theme: 'solar',
  
  // Custom colors (override theme colors)
  colors: {
    h1: '#e63946',
    h2: '#457b9d',
    // ... any color variable
  },
  
  // Mobile styles (applied at <= 640px)
  mobile: {
    fontSize: '16px',
    padding: '12px',
    lineHeight: 1.5
  },
  
  // Behavior
  autofocus: false,
  placeholder: 'Start typing...',
  value: '',
  
  // Auto-resize
  autoResize: false,      // Auto-expand height with content
  minHeight: '100px',     // Minimum height when autoResize is enabled
  maxHeight: null,        // Maximum height (null = unlimited)
  
  // Native textarea properties
  textareaProps: {
    required: true,
    maxLength: 500,
    name: 'content',
    // Any HTML textarea attribute
  },
  
  // Toolbar
  toolbar: false,         // Enable/disable toolbar with formatting buttons
  
  // Smart lists
  smartLists: true,       // Enable GitHub-style list continuation on Enter
  
  // Stats bar
  showStats: false,       // Enable/disable stats bar
  statsFormatter: (stats) => {  // Custom stats format
    return `${stats.chars} chars | ${stats.words} words`;
  },
  
  // Callbacks
  onChange: (value, instance) => {},
  onKeydown: (event, instance) => {}
}
```

### Instance Methods

```javascript
// Get current markdown content
editor.getValue()

// Set markdown content
editor.setValue(markdown)

// Get rendered HTML of the current content
editor.getRenderedHTML()                    // With syntax markers (for debugging)
editor.getRenderedHTML({ cleanHTML: true }) // Clean HTML without OverType markup
editor.getCleanHTML()                       // Alias for getRenderedHTML({ cleanHTML: true })

// Get the current preview element's HTML
editor.getPreviewHTML()            // Actual DOM content from preview layer

// Change theme
editor.setTheme('cave')  // Built-in theme name
editor.setTheme(customThemeObject)  // Custom theme

// View modes
editor.showPlainTextarea(true)    // Switch to plain textarea mode
editor.showPlainTextarea(false)   // Switch back to normal mode
editor.showPreviewMode(true)      // Switch to preview mode
editor.showPreviewMode(false)     // Switch back to normal mode

// Focus/blur
editor.focus()
editor.blur()

// Show or hide stats bar
editor.showStats(true)   // Show stats
editor.showStats(false)  // Hide stats

// Check if initialized
editor.isInitialized()

// Re-initialize with new options
editor.reinit(options)

// Destroy the editor
editor.destroy()
```

### Static Methods

```javascript
// Set global theme (affects all instances)
OverType.setTheme('cave')  // Built-in theme
OverType.setTheme(customTheme)  // Custom theme object
OverType.setTheme('solar', { h1: '#custom' })  // Override specific colors

// Initialize multiple editors (same as constructor)
OverType.init(target, options)

// Get instance from element
OverType.getInstance(element)

// Destroy all instances
OverType.destroyAll()

// Access themes
OverType.themes.solar
OverType.themes.cave
```

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| Cmd/Ctrl + B | Toggle bold |
| Cmd/Ctrl + I | Toggle italic |
| Cmd/Ctrl + K | Wrap in code |
| Cmd/Ctrl + Shift + K | Insert link |
| Cmd/Ctrl + Shift + 7 | Toggle numbered list |
| Cmd/Ctrl + Shift + 8 | Toggle bullet list |

## Supported Markdown

- **Headers** - `# H1`, `## H2`, `### H3`
- **Bold** - `**text**` or `__text__`
- **Italic** - `*text*` or `_text_`
- **Code** - `` `inline code` ``
- **Links** - `[text](url)`
- **Lists** - `- item`, `* item`, `1. item`
- **Blockquotes** - `> quote`
- **Horizontal rule** - `---`, `***`, or `___`

Note: Markdown syntax remains visible but styled (e.g., `**bold**` shows with styled markers).

## DOM Persistence & Re-initialization

OverType is designed to work with platforms that persist DOM across page loads (like HyperClay):

```javascript
// Safe to call multiple times - will recover existing editors
OverType.init('.editor');

// The library will:
// 1. Check for existing OverType DOM structure
// 2. Recover content from existing textarea if found
// 3. Re-establish event bindings
// 4. Or create fresh editor if no existing DOM
```

## Examples

Check the `examples` folder for complete examples:

- `basic.html` - Simple single editor
- `multiple.html` - Multiple independent editors
- `custom-theme.html` - Theme customization
- `dynamic.html` - Dynamic creation/destruction

## Web Component

OverType provides a fully-featured native Web Component `<overtype-editor>` with complete style isolation and a declarative HTML API. Perfect for modern web development with zero configuration overhead.

### Features

- **🛡️ Complete style isolation**: Shadow DOM prevents CSS conflicts with host page
- **📝 Declarative API**: Configure via HTML attributes, zero JavaScript required
- **🔄 Reactive attributes**: All 15 attributes update the editor in real-time
- **🌐 Framework-agnostic**: Native Web Component works with any framework or vanilla JS
- **🎨 Built-in themes**: Solar (light) and Cave (dark) with perfect visual consistency
- **📱 Mobile-optimized**: Native mobile keyboards, selections, and gestures
- **⚡ High performance**: Efficient Shadow DOM rendering with minimal overhead
- **🧪 Thoroughly tested**: 100% test coverage including Shadow DOM, events, and API methods

### Install & Import

**NPM/Yarn Installation:**
```bash
npm install overtype
# or
yarn add overtype
```

**ESM Import (recommended for bundlers):**
```javascript
import 'overtype/webcomponent';
// Component is automatically registered as <overtype-editor>
```

**CDN via unpkg (no build step required):**
```html
<!-- IIFE Minified (recommended for production) -->
<script src="https://unpkg.com/overtype@latest/dist/overtype-webcomponent.min.js"></script>

<!-- ES Module -->
<script type="module" src="https://unpkg.com/overtype@latest/dist/overtype-webcomponent.esm.js"></script>

<!-- Development (unminified) -->
<script src="https://unpkg.com/overtype@latest/dist/overtype-webcomponent.js"></script>
```

All CDN imports automatically register the `<overtype-editor>` custom element globally.

### Minimal Usage

```html
<overtype-editor 
  value="# Hello OverType!"
  theme="solar"
  height="300px"
  toolbar>
</overtype-editor>
```

### Multi-line Content

You can provide multi-line content to the Web Component in two ways:

- Attribute with escaped sequences (recommended for inline HTML)

```html
<overtype-editor 
  value="# Hello\\n\\nThis content spans multiple lines using escaped newlines."
  height="220px">
</overtype-editor>
```

- Element text content (write actual multi-line text between tags)

```html
<overtype-editor height="220px">
# Hello

This content spans multiple lines using element text content.
</overtype-editor>
```

Notes:
- The `value` attribute accepts common escaped sequences such as `\\n` (newline), `\\t` (tab), and `\\r` (carriage return).
- When the `value` attribute is not present, the component uses its element `textContent` as the initial value.

### HTML Attributes (15 reactive attributes)

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `value` | string | '' | Initial Markdown content (supports escaped `\\n`; falls back to element text when omitted) |
| `theme` | 'solar' \| 'cave' | 'solar' | Editor theme (styles are isolated in Shadow DOM) |
| `placeholder` | string | 'Start typing...' | Placeholder text |
| `height` | string | - | Editor height (e.g. '300px') |
| `min-height` | string | '100px' | Minimum height (for auto-resize) |
| `max-height` | string | - | Maximum height (for auto-resize) |
| `font-size` | string | '14px' | Font size (monospace required) |
| `line-height` | string | '1.6' | Line height multiplier |
| `padding` | string | '16px' | Internal padding |
| `toolbar` | boolean | false | Show formatting toolbar |
| `show-stats` | boolean | false | Show word/character count bar |
| `auto-resize` | boolean | false | Auto adjust height to content |
| `autofocus` | boolean | false | Auto focus on connection |
| `readonly` | boolean | false | Read-only mode (disables editing) |
| `smart-lists` | boolean | true | Smart list continuation on Enter |

### JavaScript API (complete custom element methods)

```javascript
const editor = document.querySelector('overtype-editor');

// Content operations
const content = editor.getValue();           // Get current markdown
editor.setValue('# New content');            // Set new markdown content
const html = editor.getHTML();               // Get rendered HTML
editor.insertText('Added text');             // Insert text at cursor

// Focus and state management
editor.focus();                              // Focus the editor
editor.blur();                               // Remove focus
const ready = editor.isReady();              // Check if initialized

// Statistics and internal access
const stats = editor.getStats();             // Get word/char/line counts
const internal = editor.getEditor();         // Access internal OverType instance
```

**Return Values:**
- `getValue()` → `string` - Current markdown content
- `getHTML()` → `string` - Rendered HTML
- `isReady()` → `boolean` - Initialization state
- `getStats()` → `{chars, words, lines, line, column}` - Document statistics
- `getEditor()` → `OverType` - Internal editor instance (for advanced usage)

### Events (4 custom events with detailed payloads)

```javascript
const editor = document.querySelector('overtype-editor');

// Content change event (fires on every content modification)
editor.addEventListener('change', (e) => {
  console.log('New content:', e.detail.value);      // Current markdown
  console.log('Editor instance:', e.detail.editor); // OverType instance
  // Event bubbles and is composed (crosses Shadow DOM boundary)
});

// Keyboard event (fires on every key press)
editor.addEventListener('keydown', (e) => {
  console.log('Key pressed:', e.detail.event.key);  // Original KeyboardEvent
  console.log('Editor instance:', e.detail.editor); // OverType instance
  // Useful for custom keyboard shortcuts or input monitoring
});

// Initialization complete event (fires once when ready)
editor.addEventListener('ready', (e) => {
  console.log('Editor ready:', e.detail.editor);    // OverType instance
  console.log('Shadow DOM initialized');
  // Safe to call API methods after this event
});

// Initialization error event (fires on setup failure)
editor.addEventListener('error', (e) => {
  console.error('Setup failed:', e.detail.error.message); // Error details
  // Handle initialization failures gracefully
});
```

**Event Properties:**
- All events include `bubbles: true` and `composed: true` for maximum compatibility
- Events cross Shadow DOM boundaries and can be caught by parent elements
- Each event provides relevant context in the `detail` object

### Examples

Basic:

```html
<overtype-editor 
  value="# Basic Editor\n\nStart your Markdown writing journey!"
  height="200px">
</overtype-editor>
```

With toolbar and stats:

```html
<overtype-editor 
  value="# Full-Featured Editor\n\nSupports toolbar and statistics."
  theme="cave"
  height="400px"
  toolbar
  show-stats
  autofocus>
</overtype-editor>
```

Auto-resize:

```html
<overtype-editor 
  value="# Auto Height\n\nHeight adjusts to content!"
  auto-resize
  min-height="100px"
  max-height="500px">
</overtype-editor>
```

Dynamic attributes:

```html
<overtype-editor id="dynamic-editor" theme="solar"></overtype-editor>
<script>
  const editor = document.getElementById('dynamic-editor');
  editor.setAttribute('theme', 'cave');
  editor.setAttribute('height', '300px');
  editor.setAttribute('toolbar', '');
</script>
```

### Themes

Built-in themes:

- Solar (light)
- Cave (dark)

```html
<overtype-editor theme="solar"></overtype-editor>
<overtype-editor theme="cave"></overtype-editor>
```

### Framework Integration

React:

```jsx
function App() {
  const [content, setContent] = useState('# Hello React!');
  return (
    <overtype-editor
      value={content}
      onchange={(e) => setContent(e.detail.value)}
      theme="solar"
      toolbar
    />
  );
}
```

Vue:

```vue
<template>
  <overtype-editor
    :value="content"
    @change="handleChange"
    theme="cave"
    toolbar
  />
</template>

<script>
export default {
  data() {
    return { content: '# Hello Vue!' };
  },
  methods: {
    handleChange(e) {
      this.content = e.detail.value;
    }
  }
};
</script>
```

Angular:

```typescript
@Component({
  template: `
    <overtype-editor
      [value]="content"
      (change)="handleChange($event)"
      theme="solar"
      toolbar>
    </overtype-editor>
  `
})
export class AppComponent {
  content = '# Hello Angular!';
  handleChange(event: CustomEvent) {
    this.content = event.detail.value;
  }
}
```

### Build Files

| File | Format | Size | Description |
|------|--------|------|-------------|
| `overtype-webcomponent.js` | IIFE | 161.87 KB | Development (unminified) |
| `overtype-webcomponent.min.js` | IIFE | 92.53 KB | Production (minified) |
| `overtype-webcomponent.esm.js` | ESM | 154.11 KB | ES Module (for bundlers) |

**Recommended Usage:**
- **CDN/Direct use**: `overtype-webcomponent.min.js` (92.53 KB minified)
- **Bundlers/NPM**: Import from `overtype/webcomponent` (tree-shaking friendly)
- **Development**: `overtype-webcomponent.js` (unminified with source maps)

### Browser Support

- Chrome 62+
- Firefox 78+
- Safari 16+
- Edge (Chromium)

See `demo.html` for a full interactive demo (includes a Web Component section).

## Limitations

Due to the transparent textarea overlay approach, OverType has some intentional design limitations:

### Images Not Supported
Images (`![alt](url)`) are not rendered. Variable-height images would break the character alignment between textarea and preview.

### Monospace Font Required
All text must use a monospace font to maintain alignment. Variable-width fonts would cause the textarea cursor position to drift from the visual text position.

### Fixed Font Size
All content must use the same font size. Different sizes for headers or other elements would break vertical alignment.

### Visible Markdown Syntax
All markdown formatting characters remain visible (e.g., `**bold**` shows the asterisks). This is intentional - hiding them would break the 1:1 character mapping.

### Links Require Modifier Key
Links are clickable with Cmd/Ctrl+Click only. Direct clicking would interfere with text editing since clicks need to position the cursor in the textarea.

These limitations are what enable OverType's core benefits: perfect native textarea behavior, tiny size, and zero complexity.

## Development

```bash
# Install dependencies
npm install

# Development build with watch
npm run dev

# Production build
npm run build

# Run tests
npm test

# Check bundle size
npm run size
```

## Browser Support

- Chrome 62+
- Firefox 78+
- Safari 16+
- Edge (Chromium)

Requires support for:
- CSS Custom Properties
- ES6 features
- Lookbehind assertions in RegExp (for italic parsing)

## Architecture

OverType uses a unique invisible textarea overlay approach:

1. **Two perfectly aligned layers:**
   - Invisible textarea (top) - handles input and cursor
   - Styled preview div (bottom) - shows formatted markdown

2. **Character-perfect alignment:**
   - Monospace font required
   - No size changes in styling
   - Syntax markers remain visible

3. **Single source of truth:**
   - Textarea content drives everything
   - One-way data flow: textarea → parser → preview

## Contributors

Special thanks to:
- [Josh Doman](https://github.com/joshdoman) - Fixed inline code formatting preservation ([#6](https://github.com/panphora/overtype/pull/6)), improved code fence detection ([#19](https://github.com/panphora/overtype/pull/19))
- [kbhomes](https://github.com/kbhomes) - Fixed text selection desynchronization during overscroll ([#17](https://github.com/panphora/overtype/pull/17))
- [merlinz01](https://github.com/merlinz01) - Initial TypeScript definitions implementation ([#20](https://github.com/panphora/overtype/pull/20))
- [Max Bernstein](https://github.com/tekknolagi) - Fixed typo in website ([#11](https://github.com/panphora/overtype/pull/11))
- [davidlazar](https://github.com/davidlazar) - Suggested view mode feature for toggling overlay and preview modes ([#24](https://github.com/panphora/overtype/issues/24))

## License

MIT

## Related Projects

### Synesthesia

[Synesthesia](https://github.com/panphora/synesthesia) is a lightweight syntax highlighting editor library that extracted and refined the core textarea overlay technique from OverType. While OverType is focused on markdown editing with toolbar features, Synesthesia provides a more generalized code editing solution with:

- **Pluggable parser system** - Support for any programming language or syntax
- **Parser registry** - Automatic language detection by file extension or MIME type  
- **Cleaner separation** - Extracted the overlay technique without markdown-specific features
- **Smaller footprint** - ~86KB minified (vs OverType's ~78KB)

Key components extracted from OverType to Synesthesia:
- The transparent textarea overlay technique for perfect WYSIWYG alignment
- Theme system with CSS variable support
- DOM persistence and recovery mechanisms  
- Auto-resize functionality
- Event delegation for efficient multi-instance support

If you need a markdown editor with toolbar and formatting features, use OverType. If you need a lightweight code editor with custom syntax highlighting, check out Synesthesia.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

---

Ready for another radical idea?  
[Let's remove every layer of the web application stack.](https://hyperclay.com)
