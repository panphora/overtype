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

// ===== URL Escaping (PR #64 - Fix Double-Escaping) =====
console.log('\n🔧 URL Escaping (Fix for Issue #63)\n');

// Test: URL with ampersands should not be double-escaped
(() => {
  const input = '[Google](https://google.com?a=1&b=2)';
  const parsed = MarkdownParser.parse(input);

  // The visible URL part should have &amp; (once escaped, for display)
  // But NOT &amp;amp; (double-escaped)
  assert(
    parsed.includes('](https://google.com?a=1&amp;b=2)</span>') &&
    !parsed.includes('&amp;amp;'),
    'URL with ampersands - no double-escaping',
    `URL should be escaped once, not twice. Got: ${parsed}`
  );
})();

// Test: URL with multiple ampersands
(() => {
  const input = '[Search](https://example.com?q=test&lang=en&filter=all)';
  const parsed = MarkdownParser.parse(input);

  // Count how many times &amp; appears in the visible URL part
  const urlPartMatch = parsed.match(/]\(https:\/\/example\.com\?q=test.*?\)<\/span>/);
  const urlPart = urlPartMatch ? urlPartMatch[0] : '';
  const ampCount = (urlPart.match(/&amp;/g) || []).length;
  const doubleAmpCount = (urlPart.match(/&amp;amp;/g) || []).length;

  assert(
    ampCount === 2 && doubleAmpCount === 0,
    'URL with multiple ampersands',
    `Should have 2 &amp; (not double-escaped). Found ${ampCount} &amp; and ${doubleAmpCount} &amp;amp;. Got: ${parsed}`
  );
})();

// Test: URL with angle brackets
(() => {
  const input = '[Test](https://example.com?tag=<test>)';
  const parsed = MarkdownParser.parse(input);

  assert(
    parsed.includes('](https://example.com?tag=&lt;test&gt;)</span>') &&
    !parsed.includes('&lt;lt;') && !parsed.includes('&gt;gt;'),
    'URL with angle brackets - no double-escaping',
    `Angle brackets should be escaped once. Got: ${parsed}`
  );
})();

// Test: URL with quotes
(() => {
  const input = '[Link](https://example.com?name="test")';
  const parsed = MarkdownParser.parse(input);

  assert(
    parsed.includes('](https://example.com?name=&quot;test&quot;)</span>') &&
    !parsed.includes('&quot;quot;'),
    'URL with quotes - no double-escaping',
    `Quotes should be escaped once. Got: ${parsed}`
  );
})();

// Test: URL with fragment and query parameters
(() => {
  const input = '[Link](https://example.com?a=1&b=2#section)';
  const parsed = MarkdownParser.parse(input);

  assert(
    parsed.includes('](https://example.com?a=1&amp;b=2#section)</span>') &&
    !parsed.includes('&amp;amp;'),
    'URL with fragment and parameters',
    `Should preserve fragment and not double-escape. Got: ${parsed}`
  );
})();

// Test: mailto URL with query parameters
(() => {
  const input = '[Email](mailto:test@example.com?subject=Hello&body=World)';
  const parsed = MarkdownParser.parse(input);

  assert(
    parsed.includes('](mailto:test@example.com?subject=Hello&amp;body=World)</span>') &&
    !parsed.includes('&amp;amp;'),
    'mailto URL with parameters',
    `mailto URLs should not be double-escaped. Got: ${parsed}`
  );
})();

// Test: Image link with special characters
(() => {
  const input = '![Image](https://example.com/img.png?w=100&h=200)';
  const parsed = MarkdownParser.parse(input);

  // Image links follow the same pattern as regular links
  assert(
    parsed.includes('](https://example.com/img.png?w=100&amp;h=200)</span>') &&
    !parsed.includes('&amp;amp;'),
    'Image URL with parameters',
    `Image URLs should not be double-escaped. Got: ${parsed}`
  );
})();

// Test: FTP URL with special characters
(() => {
  const input = '[FTP](ftp://server.com/path?user=test&pass=123)';
  const parsed = MarkdownParser.parse(input);

  assert(
    parsed.includes('](ftp://server.com/path?user=test&amp;pass=123)</span>') &&
    !parsed.includes('&amp;amp;'),
    'FTP URL with parameters',
    `FTP URLs should not be double-escaped. Got: ${parsed}`
  );
})();

// Test: Verify alignment preservation with special characters
(() => {
  const input = '[Link](https://example.com?a=1&b=2)';
  const parsed = MarkdownParser.parse(input);

  // The visible part should match the input character count
  // Original: [Link](https://example.com?a=1&b=2) = 39 chars
  // In the visible URL part, & becomes &amp; which is displayed as & (1 char)
  // So alignment is preserved
  const urlPartMatch = parsed.match(/]\(https:\/\/example\.com\?a=1&amp;b=2\)<\/span>/);

  assert(
    urlPartMatch !== null,
    'Alignment preserved with special chars',
    `URL escaping should preserve alignment. Got: ${parsed}`
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