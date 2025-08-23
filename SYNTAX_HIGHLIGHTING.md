# OverType Syntax Highlighting API

OverType provides a simple yet powerful API for integrating custom syntax highlighting libraries with your markdown editor. This document explains how to use the highlighting API and provides examples for popular highlighting libraries.

## Overview

The OverType syntax highlighting API allows you to:

- **Global Highlighting**: Set a highlighter that applies to all OverType instances
- **Per-Instance Highlighting**: Set a highlighter for specific editor instances
- **Library Agnostic**: Works with any highlighting library (Shiki, Prism, highlight.js, etc.)
- **Real-time**: Highlights code as you type
- **Preserves Alignment**: Maintains perfect character positioning for the WYSIWYG experience

## Basic Usage

### Global Code Highlighter

```javascript
// Set a global highlighter that applies to all OverType instances
OverType.setCodeHighlighter((code, language) => {
    // Your highlighting logic here
    return highlightedHtml;
});
```

### Per-Instance Code Highlighter

```javascript
// Option 1: Set during initialization
const [editor] = new OverType('#editor', {
    codeHighlighter: (code, language) => {
        return highlightedHtml;
    }
});

// Option 2: Set after initialization
editor.setCodeHighlighter((code, language) => {
    return highlightedHtml;
});
```

### Disable Highlighting

```javascript
// Disable global highlighting
OverType.setCodeHighlighter(null);

// Disable per-instance highlighting
editor.setCodeHighlighter(null);
```

## API Contract

### Highlighter Function Signature

```javascript
function highlighter(code, language) {
    // Parameters:
    // - code: string - The raw code content to highlight
    // - language: string - Language extracted from fence (e.g., 'javascript', 'python', '')

    // Returns:
    // - string - HTML with syntax highlighting
}
```

### Requirements

1. **Preserve Character Positions**: The returned HTML must maintain the same character positions as the input
2. **Handle Unknown Languages**: Should gracefully handle languages not supported by your highlighter
3. **Escape HTML**: Must return properly escaped HTML if the highlighter doesn't handle escaping
4. **Performance**: Should be fast enough for real-time highlighting (consider debouncing for heavy highlighters)
5. **Error Handling**: Should not throw errors; fallback to plain text if highlighting fails

## Examples

### 1. Simple Pattern-Based Highlighter

```javascript
function simpleHighlighter(code, language) {
    return code
        // Keywords
        .replace(/\b(function|const|let|var|if|else|for|while|return|class)\b/g,
            '<span style="color: #0066cc; font-weight: bold;">$1</span>')
        // Strings
        .replace(/(["'])((?:\\.|(?!\1)[^\\])*?)\1/g,
            '<span style="color: #008800;">$1$2$1</span>')
        // Comments
        .replace(/(\/\/.*$|#.*$)/gm,
            '<span style="color: #808080; font-style: italic;">$1</span>')
        // Numbers
        .replace(/\b(\d+(?:\.\d+)?)\b/g,
            '<span style="color: #ff6600;">$1</span>');
}

OverType.setCodeHighlighter(simpleHighlighter);
```

### 2. Shiki.js Integration (v3.0+)

```javascript
import { codeToHtml } from 'shiki';

// Async highlighter function
async function shikiHighlighter(code, language) {
    try {
        // Map common aliases
        const langMap = {
            'js': 'javascript',
            'ts': 'typescript',
            'py': 'python',
            'rs': 'rust'
        };

        const normalizedLang = langMap[language] || language || 'text';

        const highlighted = await codeToHtml(code, {
            lang: normalizedLang,
            theme: 'github-light'
        });

        // Extract inner HTML from pre>code element
        const match = highlighted.match(/<code[^>]*>([\s\S]*?)<\/code>/);
        return match ? match[1] : code;

    } catch (error) {
        console.warn('Shiki highlighting failed:', error);
        return code; // Fallback to plain text
    }
}

// Synchronous wrapper with caching for real-time highlighting
const highlightCache = new Map();

function syncShikiHighlighter(code, language) {
    const cacheKey = `${language}:${code.substring(0, 100)}`;

    if (highlightCache.has(cacheKey)) {
        return highlightCache.get(cacheKey);
    }

    // Start async highlighting
    shikiHighlighter(code, language).then(result => {
        highlightCache.set(cacheKey, result);
        // Trigger re-render
        OverType.setCodeHighlighter(syncShikiHighlighter);
    });

    return code; // Return plain code while highlighting
}

OverType.setCodeHighlighter(syncShikiHighlighter);
```

### 2b. Shiki.js Legacy (v0.14)

```javascript
import { getHighlighter } from 'shiki@0.14.7';

let shikiHighlighter = null;

async function initShiki() {
    shikiHighlighter = await getHighlighter({
        themes: ['github-light', 'github-dark'],
        langs: ['javascript', 'typescript', 'python', 'rust', 'go']
    });

    OverType.setCodeHighlighter((code, language) => {
        if (!shikiHighlighter) return code;

        try {
            const langMap = {
                'js': 'javascript',
                'ts': 'typescript',
                'py': 'python',
                'rs': 'rust'
            };

            const normalizedLang = langMap[language] || language || 'text';

            if (!shikiHighlighter.getLoadedLanguages().includes(normalizedLang)) {
                return code;
            }

            const highlighted = shikiHighlighter.codeToHtml(code, {
                lang: normalizedLang,
                theme: 'github-light'
            });

            const match = highlighted.match(/<code[^>]*>([\s\S]*?)<\/code>/);
            return match ? match[1] : code;

        } catch (error) {
            console.warn('Shiki highlighting failed:', error);
            return code;
        }
    });
}

initShiki();
```

### 3. Prism.js Integration

```javascript
import Prism from 'prismjs';
// Import languages you need
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-rust';

function prismHighlighter(code, language) {
    try {
        // Map aliases
        const langMap = {
            'js': 'javascript',
            'py': 'python',
            'rs': 'rust'
        };

        const normalizedLang = langMap[language] || language;

        if (Prism.languages[normalizedLang]) {
            return Prism.highlight(code, Prism.languages[normalizedLang], normalizedLang);
        }

        return code; // Fallback for unsupported languages
    } catch (error) {
        console.warn('Prism highlighting failed:', error);
        return code;
    }
}

OverType.setCodeHighlighter(prismHighlighter);
```

### 4. highlight.js Integration

```javascript
import hljs from 'highlight.js';

function hljsHighlighter(code, language) {
    try {
        if (language && hljs.getLanguage(language)) {
            const result = hljs.highlight(code, { language });
            return result.value;
        } else {
            // Auto-detect language
            const result = hljs.highlightAuto(code);
            return result.value;
        }
    } catch (error) {
        console.warn('highlight.js highlighting failed:', error);
        return hljs.util.escapeHtml(code);
    }
}

OverType.setCodeHighlighter(hljsHighlighter);
```

### 5. Language-Specific Highlighters

```javascript
// Different highlighters for different languages
function multiHighlighter(code, language) {
    switch (language) {
        case 'json':
            return highlightJson(code);
        case 'sql':
            return highlightSql(code);
        case 'javascript':
        case 'js':
            return highlightJavaScript(code);
        default:
            return simpleHighlighter(code, language);
    }
}

function highlightJson(code) {
    return code
        .replace(/(["'])((?:\\.|(?!\1)[^\\])*?)(\1)(\s*:\s*)/g,
            '<span style="color: #9cdcfe;">$1$2$3</span>$4')
        .replace(/:\s*(["'])((?:\\.|(?!\1)[^\\])*?)\1/g,
            ': <span style="color: #ce9178;">$1$2$1</span>')
        .replace(/:\s*(\d+(?:\.\d+)?)/g,
            ': <span style="color: #b5cea8;">$1</span>')
        .replace(/:\s*(true|false|null)/g,
            ': <span style="color: #569cd6;">$1</span>');
}

OverType.setCodeHighlighter(multiHighlighter);
```

## Performance Considerations

### Debouncing for Heavy Highlighters

```javascript
let highlightTimeout;

function debouncedHighlighter(code, language) {
    return new Promise((resolve) => {
        clearTimeout(highlightTimeout);
        highlightTimeout = setTimeout(() => {
            resolve(heavyHighlighter(code, language));
        }, 150); // 150ms debounce
    });
}

// For async highlighters, you might need a synchronous wrapper
let highlightCache = new Map();

function cachedAsyncHighlighter(code, language) {
    const cacheKey = `${language}:${code}`;

    if (highlightCache.has(cacheKey)) {
        return highlightCache.get(cacheKey);
    }

    // Start async highlighting
    heavyAsyncHighlighter(code, language).then(result => {
        highlightCache.set(cacheKey, result);
        // Trigger re-render if needed
        OverType.setCodeHighlighter(cachedAsyncHighlighter);
    });

    // Return plain text while highlighting is in progress
    return code;
}
```

### Language Detection

```javascript
function detectLanguage(code, suggestedLanguage) {
    // Use suggested language if valid
    if (suggestedLanguage && supportedLanguages.includes(suggestedLanguage)) {
        return suggestedLanguage;
    }

    // Simple heuristics for common languages
    if (/^\s*{[\s\S]*}\s*$/.test(code.trim())) {
        return 'json';
    }
    if (/\b(SELECT|FROM|WHERE|INSERT|UPDATE|DELETE)\b/i.test(code)) {
        return 'sql';
    }
    if (/\b(function|const|let|var|=&gt;)\b/.test(code)) {
        return 'javascript';
    }
    if (/\b(def|import|from|class|if __name__)\b/.test(code)) {
        return 'python';
    }

    return 'text';
}

function smartHighlighter(code, language) {
    const detectedLanguage = detectLanguage(code, language);
    return actualHighlighter(code, detectedLanguage);
}
```

## Best Practices

1. **Always provide fallbacks**: If highlighting fails, return the original code
2. **Handle edge cases**: Empty strings, very large code blocks, unsupported languages
3. **Consider performance**: Use caching, debouncing, or web workers for heavy highlighting
4. **Test thoroughly**: Test with various languages, edge cases, and large documents
5. **Provide user feedback**: Show loading states or errors when appropriate

## Troubleshooting

### Common Issues

1. **Characters not aligning**: Make sure your highlighter preserves all whitespace and character positions
2. **Performance problems**: Consider debouncing or caching for expensive highlighting operations
3. **Languages not working**: Check that your highlighter library supports the requested language
4. **HTML escaping issues**: Ensure proper HTML escaping to prevent XSS vulnerabilities

### Debug Mode

```javascript
function debugHighlighter(code, language) {
    console.log('Highlighting:', { language, codeLength: code.length });

    try {
        const result = yourHighlighter(code, language);
        console.log('Highlight success:', { resultLength: result.length });
        return result;
    } catch (error) {
        console.error('Highlight failed:', error);
        return code;
    }
}

OverType.setCodeHighlighter(debugHighlighter);
```

## Integration Examples

Complete integration examples are available in the `examples/` directory:

- `examples/syntax-highlighting-api.html` - Basic API demonstration
- `examples/shiki-integration.html` - Full Shiki.js integration with themes and language support

These examples show real-world usage patterns and can serve as starting points for your own implementations.
