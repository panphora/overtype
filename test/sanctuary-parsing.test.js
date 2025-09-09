/**
 * Test cases for sanctuary pattern parsing with nested markdown
 */

import { JSDOM } from 'jsdom';
import { MarkdownParser } from '../src/parser.js';

// Test cases for complex nested markdown scenarios
const testCases = [
  {
    name: 'Link with inline code in text',
    input: '[`code` link](https://example.com)',
    shouldContain: [
      '<a href="https://example.com"',
      '<code>',
      'code',
      '</code>',
      'link',
      '</a>'
    ],
    shouldNotContain: ['\uE000', '\uE001', '0 link']
  },
  {
    name: 'Link with multiple inline code segments',
    input: '[`first` and `second` code](https://example.com)',
    shouldContain: [
      '<a href="https://example.com"',
      '<code>',
      'first',
      'second',
      '</code>',
      '</a>'
    ],
    shouldNotContain: ['\uE000', '\uE001']
  },
  {
    name: 'Inline code containing link syntax',
    input: '`[text](url)` should not be a link',
    shouldContain: [
      '<code>',
      '[text](url)',
      '</code>'
    ],
    shouldNotContain: ['<a href=', '</a>']
  },
  {
    name: 'Link with bold text',
    input: '[**bold** link](https://example.com)',
    shouldContain: [
      '<a href="https://example.com"',
      '<strong>',
      'bold',
      '</strong>',
      'link',
      '</a>'
    ],
    shouldNotContain: ['\uE000', '\uE001']
  },
  {
    name: 'Link with italic text',
    input: '[*italic* link](https://example.com)',
    shouldContain: [
      '<a href="https://example.com"',
      '<em>',
      'italic',
      '</em>',
      'link',
      '</a>'
    ],
    shouldNotContain: ['\uE000', '\uE001']
  },
  {
    name: 'Complex nested: link with code and bold',
    input: '[`code` and **bold** text](https://example.com)',
    shouldContain: [
      '<a href="https://example.com"',
      '<code>',
      'code',
      '</code>',
      '<strong>',
      'bold',
      '</strong>',
      '</a>'
    ],
    shouldNotContain: ['\uE000', '\uE001']
  },
  {
    name: 'Code with backticks inside using double backticks',
    input: '`` `nested` ``',
    shouldContain: [
      '<code>',
      '`nested`',
      '</code>'
    ],
    shouldNotContain: ['\uE000', '\uE001']
  },
  {
    name: 'Bold text containing underscore',
    input: '**bold_with_underscore**',
    shouldContain: [
      '<strong>',
      'bold_with_underscore',
      '</strong>'
    ],
    shouldNotContain: ['<em>']
  },
  {
    name: 'Multiple inline elements in sequence',
    input: '`code` then [link](url) then **bold**',
    shouldContain: [
      '<code>',
      'code',
      '</code>',
      '<a href="url"',
      'link',
      '</a>',
      '<strong>',
      'bold',
      '</strong>'
    ],
    shouldNotContain: ['\uE000', '\uE001']
  },
  {
    name: 'URL with asterisks should not create bold',
    input: '[text](https://example.com/**path**/file)',
    shouldContain: [
      '<a href="https://example.com/**path**/file"',
      '](https://example.com/**path**/file)',
      'text'
    ],
    shouldNotContain: ['<strong>', '</strong>']
  },
  {
    name: 'URL with underscores should not create italic',
    input: '[text](https://example.com/_path_/file)',
    shouldContain: [
      '<a href="https://example.com/_path_/file"',
      '](https://example.com/_path_/file)',
      'text'
    ],
    shouldNotContain: ['<em>', '</em>']
  },
  {
    name: 'URL with backticks should not create code',
    input: '[text](https://example.com/`path`/file)',
    shouldContain: [
      '<a href="https://example.com/`path`/file"',
      '](https://example.com/`path`/file)',
      'text'
    ],
    shouldNotContain: ['<code>', '</code>']
  },
  {
    name: 'URL with tildes should not create strikethrough',
    input: '[text](https://example.com/~path~/file)',
    shouldContain: [
      '<a href="https://example.com/~path~/file"',
      '](https://example.com/~path~/file)',
      'text'
    ],
    shouldNotContain: ['<del>', '</del>']
  },
  {
    name: 'URL with mixed formatting characters',
    input: '[text](https://example.com/**bold**/_italic_/`code`)',
    shouldContain: [
      '<a href="https://example.com/**bold**/_italic_/`code`"',
      '](https://example.com/**bold**/_italic_/`code`)',
      'text'
    ],
    shouldNotContain: ['<strong>', '</strong>', '<em>', '</em>', '<code>', '</code>']
  },
  {
    name: 'URL with square brackets should not create nested link',
    input: '[text](https://example.com/[test]/file)',
    shouldContain: [
      '<a href="https://example.com/[test]/file"',
      '](https://example.com/[test]/file)',
      'text'
    ],
    shouldNotContain: ['<a href="test"']
  }
];

// Run tests
console.log('Running sanctuary pattern parsing tests...\n');

let passed = 0;
let failed = 0;

testCases.forEach(testCase => {
  // Parse the markdown
  const parsed = MarkdownParser.parseLine(testCase.input);
  
  let testPassed = true;
  const errors = [];
  
  // Check that expected content is present
  testCase.shouldContain.forEach(expected => {
    if (!parsed.includes(expected)) {
      testPassed = false;
      errors.push(`  ✗ Missing expected content: "${expected}"`);
    }
  });
  
  // Check that unwanted content is absent
  testCase.shouldNotContain.forEach(unwanted => {
    if (parsed.includes(unwanted)) {
      testPassed = false;
      errors.push(`  ✗ Contains unwanted content: "${unwanted}"`);
    }
  });
  
  if (testPassed) {
    console.log(`✓ ${testCase.name}`);
    passed++;
  } else {
    console.log(`✗ ${testCase.name}`);
    console.log(`  Input: ${testCase.input}`);
    console.log(`  Output: ${parsed}`);
    errors.forEach(error => console.log(error));
    console.log();
    failed++;
  }
});

console.log(`\n${passed} passed, ${failed} failed`);

if (failed > 0) {
  process.exit(1);
}