/**
 * Syntax Highlighting Tests
 * Tests the code highlighter integration with various scenarios
 * Includes alignment verification tests for Shiki, Highlight.js, and Prism
 */

import { JSDOM } from 'jsdom';
import { MarkdownParser } from '../src/parser.js';
import { createHighlighter } from 'shiki';
import hljs from 'highlight.js';
import Prism from 'prismjs';

console.log('\n🎨 Running Syntax Highlighting Tests...\n');

const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
global.document = dom.window.document;

// Complex code fixtures for alignment testing
const fixtures = {
  javascript: `// Complex TypeScript with edge cases
interface Config {
  timeout: number;
  retry: boolean;
}

const API_URL = "https://api.example.com?param=1&other=2";
const REGEX = /^[a-z]+\\s+test$/gi;

async function fetchData<T>(url: string): Promise<T> {
  const response = await fetch(url, {
    headers: { "Content-Type": "application/json" }
  });

  if (!response.ok) {
    throw new Error(\`HTTP \${response.status}\`);
  }

  return response.json();
}

// Edge cases: trailing spaces, special chars
const obj = { key: "value", nested: { a: 1 } };
const str = 'single "quotes" with \\'escapes\\'';
`,

  python: `# Complex Python with indentation edge cases
from typing import Dict, List, Optional
import asyncio

class DataProcessor:
    """Process data with async operations"""

    def __init__(self, config: Dict[str, any]):
        self.config = config
        self.pattern = r'^\\d{3}-\\d{3}-\\d{4}$'

    async def process(self, items: List[str]) -> Optional[Dict]:
        """
        Multi-line docstring with code examples:
        >>> processor.process(['item1', 'item2'])
        """
        results = []

        for item in items:
            # Trailing space after colon:
            result = {
                "id": item,
                "value": f"processed_{item}",
                "meta": {'nested': True}
            }
            results.append(result)

        await asyncio.sleep(0.1)
        return {"data": results, "count": len(results)}
`,

  rust: `// Complex Rust with lifetime/macro edge cases
use std::collections::HashMap;

#[derive(Debug, Clone)]
pub struct Config<'a> {
    timeout_ms: u64,
    endpoint: &'a str;
}

impl<'a> Config<'a> {
    pub fn new(endpoint: &'a str) -> Self {
        Self {
            timeout_ms: 5000,
            endpoint,
        }
    }
}

macro_rules! log_error {
    ($($arg:tt)*) => {{
        eprintln!("[ERROR] {}", format!($($arg)*));
    }};
}

async fn fetch_data(url: &str) -> Result<String, Box<dyn std::error::Error>> {
    let response = reqwest::get(url).await?;
    let text = response.text().await?;

    if text.trim().is_empty() {
        log_error!("Empty response from {}", url);
        return Err("empty".into());
    }

    Ok(text)
}
`,

  css: `/* Complex CSS with edge cases */
:root {
  --primary-color: #007bff;
  --spacing: 1rem;
}

.container {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: var(--spacing);
  padding: 2rem;
}

.card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.card:hover {
  transform: translateY(-2px);
  transition: transform 0.2s ease;
}

@media (max-width: 768px) {
  .container {
    grid-template-columns: 1fr;
  }
}

/* Edge cases: URLs in content */
.bg-image {
  background: url("https://example.com?param=1&other=2");
}
`
};

// Helper: Convert HTML to text (like browser does)
function htmlToText(html) {
  const div = document.createElement('div');
  div.innerHTML = html;
  return div.textContent;
}

// Helper: Verify alignment preservation
function verifyAlignment(originalCode, highlightedHtml, libraryName) {
  const rendered = htmlToText(highlightedHtml);

  // Test 1: Character count must match exactly
  if (rendered.length !== originalCode.length) {
    throw new Error(
      `${libraryName}: Character count mismatch - ` +
      `original ${originalCode.length}, rendered ${rendered.length}`
    );
  }

  // Test 2: Content must match exactly (character-for-character)
  if (rendered !== originalCode) {
    // Find first mismatch for debugging
    for (let i = 0; i < Math.min(rendered.length, originalCode.length); i++) {
      if (rendered[i] !== originalCode[i]) {
        const context = 20;
        const start = Math.max(0, i - context);
        const end = Math.min(originalCode.length, i + context);
        throw new Error(
          `${libraryName}: Content mismatch at position ${i}\n` +
          `  Original: ${JSON.stringify(originalCode.substring(start, end))}\n` +
          `  Rendered: ${JSON.stringify(rendered.substring(start, end))}`
        );
      }
    }
  }

  // Test 3: Line count must match
  const originalLines = originalCode.split('\n').length;
  const renderedLines = rendered.split('\n').length;
  if (renderedLines !== originalLines) {
    throw new Error(
      `${libraryName}: Line count mismatch - ` +
      `original ${originalLines}, rendered ${renderedLines}`
    );
  }

  // Test 4: Check for alignment-breaking patterns
  if (highlightedHtml.includes('&nbsp;')) {
    throw new Error(`${libraryName}: Contains &nbsp; which breaks alignment`);
  }
  if (highlightedHtml.includes('&#x20;')) {
    throw new Error(`${libraryName}: Contains encoded spaces which break alignment`);
  }
}

let passedTests = 0;
let totalTests = 0;

async function runTest(name, fn) {
  totalTests++;
  try {
    await fn();
    console.log(`  ✅ ${name}`);
    passedTests++;
  } catch (error) {
    console.log(`  ❌ ${name}`);
    console.log(`     Error: ${error.message}`);
  }
}

// Mock synchronous highlighter
function mockSyncHighlighter(code, language) {
  if (!language) return null; // Return null for unknown languages
  const escaped = code.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  return `<span class="lang-${language}">${escaped}</span>`;
}

// Mock async highlighter
function mockAsyncHighlighter(code, language) {
  return new Promise((resolve) => {
    setTimeout(() => {
      if (!language) {
        resolve(null); // Return null for unknown languages
      } else {
        const escaped = code.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        resolve(`<span class="async-${language}">${escaped}</span>`);
      }
    }, 10);
  });
}

// Mock highlighter that returns falsy values
function mockFalsyHighlighter(code, language) {
  if (language === 'unknown') return null;
  if (language === 'empty') return '';
  if (language === 'whitespace') return '   ';
  return `<span>${code}</span>`;
}

async function runAllTests() {
  console.log('📋 Test Suite: Global Highlighter\n');

  await runTest('Global highlighter applies to code blocks', async () => {
  MarkdownParser.setCodeHighlighter(mockSyncHighlighter);
  const markdown = '```js\nconst x = 1;\n```';
  const html = MarkdownParser.parse(markdown);

  // Create DOM to check highlighting was applied
  const container = document.createElement('div');
  container.innerHTML = html;
  const codeBlock = container.querySelector('code');

  if (!codeBlock) throw new Error('Code block not found');

  // For sync highlighters, innerHTML is set synchronously
  await new Promise(resolve => setTimeout(resolve, 10));

  if (!codeBlock.innerHTML.includes('lang-js')) {
    throw new Error('Global highlighter not applied: ' + codeBlock.innerHTML);
  }
  if (!codeBlock.textContent.includes('const x = 1;')) throw new Error('Code content missing');

  MarkdownParser.setCodeHighlighter(null); // Clean up
});

await runTest('Can disable global highlighter with null', () => {
  MarkdownParser.setCodeHighlighter(mockSyncHighlighter);
  MarkdownParser.setCodeHighlighter(null);

  const markdown = '```js\nconst x = 1;\n```';
  const html = MarkdownParser.parse(markdown);

  if (html.includes('lang-js')) throw new Error('Highlighter should be disabled');
  if (!html.includes('const x = 1;')) throw new Error('Code content missing');
});

console.log('\n📋 Test Suite: Instance Highlighter\n');

await runTest('Instance highlighter overrides global highlighter', () => {
  MarkdownParser.setCodeHighlighter(mockSyncHighlighter);

  const instanceHighlighter = (code, lang) => `<span class="instance-${lang}">${code}</span>`;
  const markdown = '```js\nconst x = 1;\n```';
  const html = MarkdownParser.parse(markdown, -1, false, instanceHighlighter);

  if (!html.includes('instance-js')) throw new Error('Instance highlighter not applied');
  if (html.includes('lang-js')) throw new Error('Global highlighter should not apply');

  MarkdownParser.setCodeHighlighter(null); // Clean up
});

console.log('\n📋 Test Suite: Highlighter Fallback\n');

await runTest('Falls back to plain text when highlighter returns null', () => {
  const markdown = '```unknown\nsome code\n```';
  const html = MarkdownParser.parse(markdown, -1, false, mockFalsyHighlighter);

  if (!html.includes('some code')) throw new Error('Should fall back to plain text');
});

await runTest('Falls back to plain text when highlighter returns empty string', () => {
  const markdown = '```empty\nsome code\n```';
  const html = MarkdownParser.parse(markdown, -1, false, mockFalsyHighlighter);

  if (!html.includes('some code')) throw new Error('Should fall back to plain text');
});

await runTest('Falls back to plain text when highlighter returns whitespace', () => {
  const markdown = '```whitespace\nsome code\n```';
  const html = MarkdownParser.parse(markdown, -1, false, mockFalsyHighlighter);

  if (!html.includes('some code')) throw new Error('Should fall back to plain text');
});

console.log('\n📋 Test Suite: Async Highlighters\n');

await runTest('Async highlighters are not supported (logs warning)', async () => {
  // Async highlighters are not supported in parse() because it returns an HTML string.
  // Once the caller sets innerHTML with that string, new DOM elements are created,
  // breaking references to the elements that the async callback would update.

  // Capture console.warn calls
  const originalWarn = console.warn;
  let warningMessage = '';
  console.warn = (msg) => { warningMessage = msg; };

  const markdown = '```js\nconst x = 1;\n```';
  const html = MarkdownParser.parse(markdown, -1, false, mockAsyncHighlighter);

  // Restore console.warn
  console.warn = originalWarn;

  // Should have logged a warning
  if (!warningMessage.includes('Async highlighters are not supported')) {
    throw new Error('Expected warning about async highlighters not being supported');
  }

  // Should still render with plain text fallback
  if (!html.includes('const x = 1;')) {
    throw new Error('Code content missing - should fall back to plain text');
  }
});

console.log('\n📋 Test Suite: Special Characters\n');

await runTest('Highlighter receives raw text with special characters', () => {
  let receivedCode = null;
  const captureHighlighter = (code) => {
    receivedCode = code;
    return `<span>${code}</span>`;
  };

  const markdown = '```js\nconst url = "a&b<c>d";\n```';
  MarkdownParser.parse(markdown, -1, false, captureHighlighter);

  if (receivedCode !== 'const url = "a&b<c>d";') {
    throw new Error(`Highlighter should receive raw text, got: ${receivedCode}`);
  }
});

await runTest('Highlighter output is properly rendered (no double-escaping)', () => {
  const markdown = '```js\nconst url = "a&b";\n```';
  const html = MarkdownParser.parse(markdown, -1, false, mockSyncHighlighter);

  const container = document.createElement('div');
  container.innerHTML = html;
  const codeBlock = container.querySelector('code');

  if (!codeBlock) throw new Error('Code block not found');

  // textContent should show the original text
  const rendered = codeBlock.textContent;
  if (!rendered.includes('a&b')) {
    throw new Error(`Expected "a&b", got: ${rendered}`);
  }
});

  console.log('\n📋 Test Suite: Multiple Code Blocks\n');

  await runTest('Multiple code blocks are highlighted independently', () => {
    const markdown = '```js\nconst x = 1;\n```\n\n```python\nprint("hello")\n```';
    const html = MarkdownParser.parse(markdown, -1, false, mockSyncHighlighter);

    if (!html.includes('lang-js')) throw new Error('JavaScript block not highlighted');
    if (!html.includes('lang-python')) throw new Error('Python block not highlighted');
  });

  console.log('\n📋 Test Suite: Shiki Alignment Verification\n');

  await runTest('Shiki preserves alignment - JavaScript', async () => {
    const highlighter = await createHighlighter({
      themes: ['github-dark'],
      langs: ['javascript']
    });

    const shikiHighlighter = (code, lang) => {
      if (!lang) return null;
      try {
        return highlighter.codeToHtml(code, { lang, theme: 'github-dark' });
      } catch {
        return null;
      }
    };

    const highlighted = shikiHighlighter(fixtures.javascript, 'javascript');
    verifyAlignment(fixtures.javascript, highlighted, 'Shiki');
  });

  await runTest('Shiki preserves alignment - Python', async () => {
    const highlighter = await createHighlighter({
      themes: ['github-dark'],
      langs: ['python']
    });

    const shikiHighlighter = (code, lang) => {
      if (!lang) return null;
      try {
        return highlighter.codeToHtml(code, { lang, theme: 'github-dark' });
      } catch {
        return null;
      }
    };

    const highlighted = shikiHighlighter(fixtures.python, 'python');
    verifyAlignment(fixtures.python, highlighted, 'Shiki');
  });

  console.log('\n📋 Test Suite: Highlight.js Alignment Verification\n');

  await runTest('Highlight.js preserves alignment - JavaScript', () => {
    const hljsHighlighter = (code, lang) => {
      if (!lang) return null;
      try {
        const result = hljs.highlight(code, { language: lang });
        return result.value;
      } catch {
        return null;
      }
    };

    const highlighted = hljsHighlighter(fixtures.javascript, 'javascript');
    verifyAlignment(fixtures.javascript, highlighted, 'Highlight.js');
  });

  await runTest('Highlight.js preserves alignment - Rust', () => {
    const hljsHighlighter = (code, lang) => {
      if (!lang) return null;
      try {
        const result = hljs.highlight(code, { language: lang });
        return result.value;
      } catch {
        return null;
      }
    };

    const highlighted = hljsHighlighter(fixtures.rust, 'rust');
    verifyAlignment(fixtures.rust, highlighted, 'Highlight.js');
  });

  console.log('\n📋 Test Suite: Prism Alignment Verification\n');

  await runTest('Prism preserves alignment - JavaScript', () => {
    const prismHighlighter = (code, lang) => {
      if (!lang || !Prism.languages[lang]) return null;
      try {
        return Prism.highlight(code, Prism.languages[lang], lang);
      } catch {
        return null;
      }
    };

    const highlighted = prismHighlighter(fixtures.javascript, 'javascript');
    verifyAlignment(fixtures.javascript, highlighted, 'Prism');
  });

  await runTest('Prism preserves alignment - CSS', () => {
    const prismHighlighter = (code, lang) => {
      if (!lang || !Prism.languages[lang]) return null;
      try {
        return Prism.highlight(code, Prism.languages[lang], lang);
      } catch {
        return null;
      }
    };

    const highlighted = prismHighlighter(fixtures.css, 'css');
    verifyAlignment(fixtures.css, highlighted, 'Prism');
  });

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  console.log('📊 Test Results Summary\n');

  const successRate = ((passedTests / totalTests) * 100).toFixed(1);
  console.log(`✅ Passed: ${passedTests}`);
  console.log(`❌ Failed: ${totalTests - passedTests}`);
  console.log(`📈 Total:  ${totalTests}`);
  console.log(`🎯 Success Rate: ${successRate}%\n`);

  if (passedTests < totalTests) {
    console.log(`⚠️  ${totalTests - passedTests} test(s) failed.`);
    process.exit(1);
  } else {
    console.log('✨ All syntax highlighting tests passed!\n');
  }
}

runAllTests().catch(error => {
  console.error('Test suite error:', error);
  process.exit(1);
});
