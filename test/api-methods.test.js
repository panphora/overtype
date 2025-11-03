/**
 * Tests for OverType API methods
 * Tests getValue(), getRenderedHTML(), and getPreviewHTML() methods
 */

import { OverType } from '../src/overtype.js';
import { JSDOM } from 'jsdom';

// Set up DOM environment
const dom = new JSDOM('<!DOCTYPE html><html><body><div id="editor"></div></body></html>');
global.window = dom.window;
global.document = dom.window.document;
global.Element = dom.window.Element;
global.NodeList = dom.window.NodeList;
global.HTMLElement = dom.window.HTMLElement;
global.performance = { now: () => Date.now() };
global.CSS = { supports: () => false }; // Mock CSS.supports for link-tooltip
global.requestAnimationFrame = (callback) => setTimeout(callback, 0); // Mock for Node.js

// Test results storage
const results = {
  passed: 0,
  failed: 0,
  tests: []
};

// Helper function for assertions
function assert(condition, testName, message) {
  if (condition) {
    results.passed++;
    results.tests.push({ name: testName, passed: true });
    console.log(`✓ ${testName}`);
  } else {
    results.failed++;
    results.tests.push({ name: testName, passed: false, message });
    console.error(`✗ ${testName}: ${message}`);
  }
}

// Test Suite
console.log('🧪 Running API Methods Tests...\n');
console.log('━'.repeat(50));

// ===== API Methods Tests =====
console.log('\n📚 API Methods Tests\n');

// Test: getValue() method
(() => {
  const editor = new OverType('#editor')[0];
  const testContent = '# Hello World\n\nThis is **bold** text.';
  editor.setValue(testContent);
  
  const value = editor.getValue();
  assert(value === testContent, 'getValue()', `Should return current markdown content`);
})();

// Test: setValue() method
(() => {
  const editor = new OverType('#editor')[0];
  const testContent = '## Test Header\n\n*Italic* text here.';
  editor.setValue(testContent);
  
  assert(editor.textarea.value === testContent, 'setValue()', `Should update textarea value`);
  assert(editor.preview.innerHTML.includes('<h2>'), 'setValue() updates preview', `Should update preview HTML`);
})();

// Test: getRenderedHTML() without post-processing
(() => {
  const editor = new OverType('#editor')[0];
  const markdown = '# Title\n\n**Bold** and *italic*';
  editor.setValue(markdown);
  
  const html = editor.getRenderedHTML(false);
  assert(html.includes('<h1>'), 'getRenderedHTML() has h1', `Should render h1 tag`);
  assert(html.includes('<strong>'), 'getRenderedHTML() has strong', `Should render strong tag`);
  assert(html.includes('<em>'), 'getRenderedHTML() has em', `Should render em tag`);
  assert(!html.includes('<pre class="code-block">'), 'getRenderedHTML() no post-processing', `Should not have consolidated code blocks`);
})();

// Test: getRenderedHTML() with post-processing
(() => {
  const editor = new OverType('#editor')[0];
  const markdown = '```\ncode block\n```';
  editor.setValue(markdown);
  
  const html = editor.getRenderedHTML(true);
  assert(html.includes('<pre class="code-block">'), 'getRenderedHTML(true) post-processes', `Should have consolidated code blocks`);
})();

// Test: getPreviewHTML() method
(() => {
  const editor = new OverType('#editor')[0];
  const markdown = '### Header 3\n\n[Link](https://example.com)';
  editor.setValue(markdown);
  
  const previewHTML = editor.getPreviewHTML();
  assert(previewHTML.includes('<h3>'), 'getPreviewHTML() has h3', `Should contain h3 from preview`);
  assert(previewHTML.includes('<a href="https://example.com"'), 'getPreviewHTML() has link', `Should contain link from preview`);
})();

// Test: Complex markdown with all methods
(() => {
  const editor = new OverType('#editor')[0];
  const markdown = `# Main Title

## Subtitle

This has **bold**, *italic*, and \`inline code\`.

\`\`\`javascript
const x = 42;
\`\`\`

- List item 1
- List item 2

[Link text](https://test.com)`;
  
  editor.setValue(markdown);
  
  const value = editor.getValue();
  const renderedHTML = editor.getRenderedHTML(false);
  const renderedHTMLProcessed = editor.getRenderedHTML(true);
  const previewHTML = editor.getPreviewHTML();
  
  // Test getValue returns original markdown
  assert(value === markdown, 'Complex: getValue()', `Should return original markdown`);
  
  // Test rendered HTML contains expected elements
  assert(renderedHTML.includes('<h1>'), 'Complex: rendered has h1', `Should have h1`);
  assert(renderedHTML.includes('<h2>'), 'Complex: rendered has h2', `Should have h2`);
  assert(renderedHTML.includes('<strong>'), 'Complex: rendered has strong', `Should have strong`);
  assert(renderedHTML.includes('<em>'), 'Complex: rendered has em', `Should have em`);
  assert(renderedHTML.includes('<code>'), 'Complex: rendered has code', `Should have code`);
  assert(renderedHTML.includes('<ul>'), 'Complex: rendered has ul', `Should have ul`);
  assert(renderedHTML.includes('<a href="https://test.com"'), 'Complex: rendered has link', `Should have link`);
  
  // Test post-processed HTML
  assert(renderedHTMLProcessed.includes('<pre class="code-block">'), 'Complex: processed has code block', `Should have consolidated code block`);
  
  // Test preview HTML
  assert(previewHTML.length > 0, 'Complex: preview not empty', `Preview should have content`);
})();

// Test: Methods work in different view modes
(() => {
  const editor = new OverType('#editor')[0];
  const markdown = '# Test in different modes';
  editor.setValue(markdown);
  
  // Test in normal mode
  editor.showNormalEditMode();
  const normalValue = editor.getValue();
  const normalHTML = editor.getRenderedHTML();

  // Test in plain mode
  editor.showPlainTextarea();
  const plainValue = editor.getValue();
  const plainHTML = editor.getRenderedHTML();

  // Test in preview mode
  editor.showPreviewMode();
  const previewValue = editor.getValue();
  const previewHTML = editor.getRenderedHTML();
  
  assert(normalValue === markdown, 'Modes: normal getValue', `getValue works in normal mode`);
  assert(plainValue === markdown, 'Modes: plain getValue', `getValue works in plain mode`);
  assert(previewValue === markdown, 'Modes: preview getValue', `getValue works in preview mode`);
  
  assert(normalHTML === plainHTML && plainHTML === previewHTML, 'Modes: consistent HTML', `getRenderedHTML consistent across modes`);
})();

// ===== Results Summary =====
console.log('\n━'.repeat(50));
console.log('\n📊 Test Results Summary\n');
console.log(`✅ Passed: ${results.passed}`);
console.log(`❌ Failed: ${results.failed}`);
console.log(`📈 Total:  ${results.passed + results.failed}`);
console.log(`🎯 Success Rate: ${((results.passed / (results.passed + results.failed)) * 100).toFixed(1)}%`);

// Exit with appropriate code
if (results.failed > 0) {
  console.error(`\n❌ ${results.failed} test(s) failed!`);
  process.exit(1);
} else {
  console.log('\n✅ All tests passed!');
  process.exit(0);
}