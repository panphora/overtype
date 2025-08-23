/**
 * Tests for list indentation alignment issues
 * Tests the fix for virtual overlay list item alignment
 */

import { MarkdownParser } from '../src/parser.js';

console.log('🧪 List Indentation Alignment Tests\n');
console.log('=' .repeat(70) + '\n');

// Helper to check if indentation is preserved in parsed HTML
function checkIndentationPreserved(input, parsed) {
  // Count leading spaces in original input lines that are list items
  const inputLines = input.split('\n');
  const inputIndentations = [];

  inputLines.forEach(line => {
    // Only check lines that are actually list items
    if (line.match(/^\s*[-*+]\s/) || line.match(/^\s*\d+\.\s/)) {
      const match = line.match(/^( *)/);
      const indentCount = match ? match[1].length : 0;
      inputIndentations.push(indentCount);
    }
  });

  // Count &nbsp; sequences at the start of list item content in parsed HTML
  const parsedIndentations = [];
  const listItemRegex = /<li[^>]*>((?:&nbsp;)*)/g;
  let match;

  while ((match = listItemRegex.exec(parsed)) !== null) {
    const nbspCount = (match[1].match(/&nbsp;/g) || []).length;
    parsedIndentations.push(nbspCount);
  }

  // Compare
  if (inputIndentations.length !== parsedIndentations.length) {
    return {
      passed: false,
      reason: `Different number of list items: expected ${inputIndentations.length}, got ${parsedIndentations.length}`
    };
  }

  for (let i = 0; i < inputIndentations.length; i++) {
    if (inputIndentations[i] !== parsedIndentations[i]) {
      return {
        passed: false,
        reason: `List item ${i + 1}: expected ${inputIndentations[i]} spaces, got ${parsedIndentations[i]}`
      };
    }
  }

  return { passed: true };
}

const testCases = [
  {
    name: 'Simple unindented bullet list',
    input: '- First item\n- Second item',
    shouldPreserveIndentation: true
  },
  {
    name: 'Indented bullet list (2 spaces)',
    input: '  - Indented item\n  - Another indented item',
    shouldPreserveIndentation: true
  },
  {
    name: 'Nested bullet list',
    input: '- First level\n  - Second level\n    - Third level',
    shouldPreserveIndentation: true
  },
  {
    name: 'Mixed indentation numbered list',
    input: '1. First item\n  2. Indented item\n3. Back to first level',
    shouldPreserveIndentation: true
  },
  {
    name: 'Deeply indented numbered list (4 spaces)',
    input: '    1. Deep item\n    2. Another deep item',
    shouldPreserveIndentation: true
  },
  {
    name: 'Complex nested mixed list',
    input: '- First\n  1. Nested numbered\n  2. Another numbered\n    - Deep bullet',
    shouldPreserveIndentation: true
  }
];

let passed = 0;
let failed = 0;

testCases.forEach((test, index) => {
  console.log(`Test ${index + 1}: ${test.name}`);

  const parsed = MarkdownParser.parse(test.input);
  const indentationCheck = checkIndentationPreserved(test.input, parsed);

  console.log(`Input:\n${test.input.split('\n').map(line => `  "${line.replace(/ /g, '·')}"`).join('\n')}`);
  console.log(`\nParsed: ${parsed}`);

  const testPassed = indentationCheck.passed === test.shouldPreserveIndentation;

  if (testPassed) {
    console.log(`✅ PASS - Indentation correctly preserved`);
    passed++;
  } else {
    console.log(`❌ FAIL - ${indentationCheck.reason || 'Indentation check failed'}`);
    failed++;
  }

  console.log('');
});

// Summary
console.log('=' .repeat(70));
console.log('\n📊 Test Summary:\n');
console.log(`✅ Passed: ${passed}/${testCases.length}`);
console.log(`❌ Failed: ${failed}/${testCases.length}`);

const successRate = ((passed / testCases.length) * 100).toFixed(1);
console.log(`\nSuccess rate: ${successRate}%`);

if (passed === testCases.length) {
  console.log('\n✨ All list indentation tests passed! Virtual overlay alignment is fixed.');
} else {
  console.log('\n⚠️  Some indentation alignment issues remain.');
}

export default { passed, failed, total: testCases.length };
