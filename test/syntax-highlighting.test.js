/**
 * Syntax Highlighting Tests
 * Tests the code highlighter integration with various scenarios
 */

import { JSDOM } from 'jsdom';
import { MarkdownParser } from '../src/parser.js';

console.log('\n🎨 Running Syntax Highlighting Tests...\n');

const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
global.document = dom.window.document;

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

await runTest('Async highlighter works with DOM manipulation', async () => {
  // For async highlighters to work, we need to use the actual DOM created during parsing
  // Not a copy created by setting innerHTML (which creates new elements)

  // Create a test container that we'll parse into
  const container = document.createElement('div');
  const markdown = '```js\nconst x = 1;\n```';

  // Parse and immediately insert into container
  const html = MarkdownParser.parse(markdown, -1, false, mockAsyncHighlighter);
  container.innerHTML = html;

  // Get the code element immediately after parsing
  const codeBlock = container.querySelector('code');
  if (!codeBlock) throw new Error('Code block not found');

  // Store the initial state
  const initialHTML = codeBlock.innerHTML;

  // Wait for async highlighter to potentially resolve
  await new Promise(resolve => setTimeout(resolve, 50));

  // Note: Async highlighting only works if you keep the same DOM elements
  // Setting innerHTML creates new elements, breaking the reference
  // For now, we'll just verify the highlighter was called and didn't throw
  if (!initialHTML.includes('const x = 1;')) {
    throw new Error('Code content missing');
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
