/**
 * Link Tests for OverType
 * Tests link parsing, rendering, and behavior
 */

import { MarkdownParser } from '../src/parser.js';

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

console.log('🔗 Link Tests\n');
console.log('━'.repeat(50));

// ===== Basic Link Parsing =====
console.log('\n📝 Basic Link Parsing\n');

// Test: Simple link
(() => {
  const input = '[Example](https://example.com)';
  const parsed = MarkdownParser.parse(input);
  
  assert(
    parsed.includes('href="https://example.com"'),
    'Simple link href',
    `Link should have real href. Got: ${parsed}`
  );
})();

// Test: Link structure
(() => {
  const input = '[Test Link](https://test.com)';
  const parsed = MarkdownParser.parse(input);
  
  assert(
    parsed.includes('<a href="https://test.com"') &&
    parsed.includes('<span class="syntax-marker">[</span>') &&
    parsed.includes('Test Link') &&
    parsed.includes('<span class="syntax-marker url-part">](https://test.com)</span>'),
    'Link structure',
    `Link should have correct structure. Got: ${parsed}`
  );
})();

// Test: No data-href attribute needed
(() => {
  const input = '[Link](https://example.com)';
  const parsed = MarkdownParser.parse(input);
  
  assert(
    !parsed.includes('data-href'),
    'No data-href attribute',
    `Links should not have data-href anymore. Got: ${parsed}`
  );
})();

// ===== URL Types =====
console.log('\n🌐 URL Types\n');

// Test: Relative URL
(() => {
  const input = '[Home](/)';
  const parsed = MarkdownParser.parse(input);
  
  assert(
    parsed.includes('href="/"'),
    'Relative URL',
    `Should have relative href. Got: ${parsed}`
  );
})();

// Test: Hash link
(() => {
  const input = '[Section](#heading)';
  const parsed = MarkdownParser.parse(input);
  
  assert(
    parsed.includes('href="#heading"'),
    'Hash link',
    `Should have hash href. Got: ${parsed}`
  );
})();

// Test: Mailto link
(() => {
  const input = '[Email](mailto:test@example.com)';
  const parsed = MarkdownParser.parse(input);
  
  assert(
    parsed.includes('href="mailto:test@example.com"'),
    'Mailto link',
    `Should have mailto href. Got: ${parsed}`
  );
})();

// Test: URL with query parameters
(() => {
  const input = '[Search](https://google.com?q=test&lang=en)';
  const parsed = MarkdownParser.parse(input);
  
  // Note: & might be escaped to &amp; which is correct
  assert(
    parsed.includes('href="https://google.com?q=test') &&
    parsed.includes('lang=en"'),
    'URL with query parameters',
    `Should preserve query parameters. Got: ${parsed}`
  );
})();

// ===== XSS Prevention =====
console.log('\n🛡️ XSS Prevention\n');

// Test: JavaScript URL sanitization
(() => {
  const input = '[XSS](javascript:alert("test"))';
  const parsed = MarkdownParser.parse(input);
  
  assert(
    parsed.includes('href="#"') && !parsed.includes('href="javascript:'),
    'JavaScript URL blocked',
    `Should sanitize javascript: URLs. Got: ${parsed}`
  );
})();

// Test: Data URL sanitization
(() => {
  const input = '[Data](data:text/html,<script>alert(1)</script>)';
  const parsed = MarkdownParser.parse(input);
  
  assert(
    parsed.includes('href="#"') && !parsed.includes('href="data:'),
    'Data URL blocked',
    `Should sanitize data: URLs. Got: ${parsed}`
  );
})();

// ===== Multiple Links =====
console.log('\n🔢 Multiple Links\n');

// Test: Multiple links with unique anchor names
(() => {
  const input = 'Check [first](https://first.com) and [second](https://second.com)';
  const parsed = MarkdownParser.parse(input);
  
  assert(
    parsed.includes('href="https://first.com"') &&
    parsed.includes('href="https://second.com"') &&
    parsed.includes('anchor-name: --link-0') &&
    parsed.includes('anchor-name: --link-1'),
    'Multiple links with anchors',
    `Should have multiple links with unique anchors. Got: ${parsed}`
  );
})();

// ===== Link Text Formatting =====
console.log('\n✨ Link Text Formatting\n');

// Test: Link with bold text
(() => {
  const input = '[**Bold Link**](https://example.com)';
  const parsed = MarkdownParser.parse(input);
  
  assert(
    parsed.includes('href="https://example.com"') &&
    parsed.includes('<strong>') &&
    parsed.includes('Bold Link') &&
    parsed.includes('</strong>'),
    'Link with bold text',
    `Should parse bold formatting inside link text. Got: ${parsed}`
  );
})();

// Test: Link with special characters
(() => {
  const input = '[Link & <Special>](https://example.com)';
  const parsed = MarkdownParser.parse(input);
  
  assert(
    parsed.includes('href="https://example.com"') &&
    parsed.includes('Link &amp; &lt;Special&gt;'),
    'Link with special characters',
    `Should escape special characters. Got: ${parsed}`
  );
})();

// ===== Edge Cases =====
console.log('\n⚠️ Edge Cases\n');

// Test: Empty link text
(() => {
  const input = '[](https://example.com)';
  const parsed = MarkdownParser.parse(input);
  
  // Should not create a link with empty text
  assert(
    !parsed.includes('href="https://example.com"'),
    'Empty link text rejected',
    `Should not create link with empty text. Got: ${parsed}`
  );
})();

// Test: Empty URL
(() => {
  const input = '[Link Text]()';
  const parsed = MarkdownParser.parse(input);
  
  // Should not create a link with empty URL
  assert(
    !parsed.includes('<a href'),
    'Empty URL rejected',
    `Should not create link with empty URL. Got: ${parsed}`
  );
})();

// Test: Link in list
(() => {
  const input = '- Item with [link](https://example.com)';
  const parsed = MarkdownParser.parse(input);
  
  assert(
    parsed.includes('<li class="bullet-list">') &&
    parsed.includes('href="https://example.com"'),
    'Link in list item',
    `Should work in list items. Got: ${parsed}`
  );
})();

// Test: Link in header
(() => {
  const input = '# Header with [link](https://example.com)';
  const parsed = MarkdownParser.parse(input);
  
  assert(
    parsed.includes('<h1>') &&
    parsed.includes('href="https://example.com"'),
    'Link in header',
    `Should work in headers. Got: ${parsed}`
  );
})();

// ===== Summary =====
console.log('\n' + '━'.repeat(50));
console.log('\n📊 Test Results Summary\n');
console.log(`✅ Passed: ${results.passed}`);
console.log(`❌ Failed: ${results.failed}`);
console.log(`📈 Total:  ${results.passed + results.failed}`);
console.log(`🎯 Success Rate: ${((results.passed / (results.passed + results.failed)) * 100).toFixed(1)}%`);

if (results.failed > 0) {
  console.log('\n❌ Failed Tests:');
  results.tests
    .filter(t => !t.passed)
    .forEach(t => console.log(`  - ${t.name}: ${t.message}`));
  process.exit(1);
} else {
  console.log('\n✨ All tests passed!');
  process.exit(0);
}