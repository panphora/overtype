#!/usr/bin/env node

/**
 * Test to verify no double-escaping occurs in PR #35's implementation
 */

import { JSDOM } from 'jsdom';

// Simulate the exact flow from PR #35
function testDoubleEscaping() {
  const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
  const document = dom.window.document;

  console.log('Testing PR #35 Code Block Processing Flow');
  console.log('==========================================\n');

  // Test case: Code with HTML-sensitive characters
  const originalCode = 'const URL = "api.com?a=1&b=2<test>";';
  console.log('Original code (what user types):');
  console.log(`  "${originalCode}"`);
  console.log(`  Length: ${originalCode.length}\n`);

  // STEP 1: Initial parsing - simulates line 467
  function escapeHtml(text) {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  const escaped = escapeHtml(originalCode);
  const initialHtml = `<div>${escaped}</div>`;
  console.log('STEP 1 - Initial parsing (line 467):');
  console.log(`  HTML: ${initialHtml}`);
  console.log(`  String length: ${initialHtml.length}\n`);

  // STEP 2: Post-processing collection - simulates line 574
  const container = document.createElement('div');
  container.innerHTML = initialHtml;
  const lineText = container.querySelector('div').textContent;

  console.log('STEP 2 - Collection via textContent (line 574):');
  console.log(`  Text: "${lineText}"`);
  console.log(`  Length: ${lineText.length}`);
  console.log(`  Matches original? ${lineText === originalCode}\n`);

  // STEP 3: Highlighter receives unescaped text
  // Simulate a highlighter that properly escapes its output
  function mockHighlighter(code) {
    // Highlighters like Shiki/Prism return properly escaped HTML
    const escaped = code
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');

    // Just wrap the whole thing (don't duplicate content)
    return `<span class="code">${escaped}</span>`;
  }

  const highlightedHtml = mockHighlighter(lineText);
  console.log('STEP 3 - Highlighter output:');
  console.log(`  HTML: ${highlightedHtml}`);
  console.log(`  String length: ${highlightedHtml.length}\n`);

  // STEP 4: Set via innerHTML - simulates line 552
  const codeElement = document.createElement('code');
  codeElement.innerHTML = highlightedHtml;

  const finalRendered = codeElement.textContent;
  console.log('STEP 4 - Final render via innerHTML (line 552):');
  console.log(`  Rendered text: "${finalRendered}"`);
  console.log(`  Length: ${finalRendered.length}`);
  console.log(`  Matches original? ${finalRendered === originalCode}\n`);

  // VERIFICATION
  console.log('==========================================');
  console.log('VERIFICATION:');
  console.log('==========================================\n');

  const tests = [
    {
      name: 'Character count preserved',
      pass: finalRendered.length === originalCode.length,
      original: originalCode.length,
      final: finalRendered.length
    },
    {
      name: 'Content matches exactly',
      pass: finalRendered === originalCode
    },
    {
      name: 'No double escaping',
      pass: !highlightedHtml.includes('&amp;amp;') &&
            !highlightedHtml.includes('&amp;lt;') &&
            !highlightedHtml.includes('&amp;gt;')
    }
  ];

  let allPassed = true;
  tests.forEach(test => {
    const status = test.pass ? '✓ PASS' : '✗ FAIL';
    const color = test.pass ? '\x1b[32m' : '\x1b[31m';
    console.log(`${color}${status}\x1b[0m ${test.name}`);

    if (test.original !== undefined) {
      console.log(`     Original: ${test.original}, Final: ${test.final}`);
    }

    if (!test.pass) allPassed = false;
  });

  console.log('');
  if (allPassed) {
    console.log('\x1b[32m\x1b[1m✓ All tests passed! No double-escaping occurs.\x1b[0m');
    process.exit(0);
  } else {
    console.log('\x1b[31m\x1b[1m✗ Some tests failed! Double-escaping detected.\x1b[0m');
    process.exit(1);
  }
}

testDoubleEscaping();
