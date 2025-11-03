# OverType Web Component

OverType provides a fully-featured native Web Component `<overtype-editor>` with complete style isolation and a declarative HTML API. Perfect for modern web development with zero configuration overhead.

## Features

- **🛡️ Complete style isolation**: Shadow DOM prevents CSS conflicts with host page
- **📝 Declarative API**: Configure via HTML attributes, zero JavaScript required
- **🔄 Reactive attributes**: All 15 attributes update the editor in real-time
- **🌐 Framework-agnostic**: Native Web Component works with any framework or vanilla JS
- **🎨 Built-in themes**: Solar (light) and Cave (dark) with perfect visual consistency
- **📱 Mobile-optimized**: Native mobile keyboards, selections, and gestures
- **⚡ High performance**: Efficient Shadow DOM rendering with minimal overhead
- **🧪 Thoroughly tested**: 100% test coverage including Shadow DOM, events, and API methods

## Install & Import

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

## Minimal Usage

```html
<overtype-editor
  value="# Hello OverType!"
  theme="solar"
  height="300px"
  toolbar>
</overtype-editor>
```

## Multi-line Content

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

## HTML Attributes (15 reactive attributes)

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

## JavaScript API (complete custom element methods)

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

## Events (4 custom events with detailed payloads)

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

## Examples

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

## Themes

Built-in themes:

- Solar (light)
- Cave (dark)

```html
<overtype-editor theme="solar"></overtype-editor>
<overtype-editor theme="cave"></overtype-editor>
```

## Framework Integration

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

## Build Files

| File | Format | Size | Description |
|------|--------|------|-------------|
| `overtype-webcomponent.js` | IIFE | 161.87 KB | Development (unminified) |
| `overtype-webcomponent.min.js` | IIFE | 92.53 KB | Production (minified) |
| `overtype-webcomponent.esm.js` | ESM | 154.11 KB | ES Module (for bundlers) |

**Recommended Usage:**
- **CDN/Direct use**: `overtype-webcomponent.min.js` (92.53 KB minified)
- **Bundlers/NPM**: Import from `overtype/webcomponent` (tree-shaking friendly)
- **Development**: `overtype-webcomponent.js` (unminified with source maps)

## Browser Support

- Chrome 62+
- Firefox 78+
- Safari 16+
- Edge (Chromium)

See `demo.html` for a full interactive demo (includes a Web Component section).
