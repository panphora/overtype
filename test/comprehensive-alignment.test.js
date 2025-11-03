/**
 * Comprehensive alignment test suite for Issue #32
 * Tests various edge cases to ensure textarea/preview alignment is maintained
 */

import { MarkdownParser } from '../src/parser.js';
import { JSDOM } from 'jsdom';

// Helper to extract text respecting block elements
function extractVisualText(html) {
  const dom = new JSDOM(`<body>${html}</body>`);
  const body = dom.window.document.body;
  
  const lines = [];
  const blockTags = ['DIV', 'P', 'H1', 'H2', 'H3', 'UL', 'OL', 'LI'];
  
  function processNode(node) {
    if (node.nodeType === 3) { // Text node
      if (lines.length === 0) lines.push('');
      lines[lines.length - 1] += node.textContent;
    } else if (node.nodeType === 1) { // Element node
      // Special handling for PRE - its content should be treated as-is
      if (node.tagName === 'PRE') {
        // PRE content may have newlines that should be preserved
        const preText = node.textContent;
        const preLines = preText.split('\n');
        
        // Add a new line before PRE if needed
        if (lines.length > 0 && lines[lines.length - 1] !== '') {
          lines.push('');
        }
        
        // Add all lines from PRE content
        for (let i = 0; i < preLines.length; i++) {
          if (i === 0 && lines.length > 0) {
            lines[lines.length - 1] += preLines[i];
          } else {
            lines.push(preLines[i]);
          }
        }
        
        // Add a new line after PRE
        lines.push('');
        return; // Don't process children, we already got the text
      }
      
      const isBlock = blockTags.includes(node.tagName);
      if (isBlock && lines.length > 0 && lines[lines.length - 1] !== '') {
        lines.push('');
      }
      
      for (const child of node.childNodes) {
        processNode(child);
      }
      
      if (isBlock && lines[lines.length - 1] !== '') {
        lines.push('');
      }
    }
  }
  
  processNode(body);
  
  // Remove trailing empty lines but keep internal ones
  while (lines.length > 0 && lines[lines.length - 1] === '') {
    lines.pop();
  }
  
  return lines;
}

console.log('🧪 Comprehensive Alignment Test Suite\n');
console.log('=' .repeat(70) + '\n');

const testCases = [
  {
    name: 'Typing inside code block',
    description: 'Simulates typing inside panic!() as mentioned in issue',
    input: '```rust\nfn main() {\n  panic!("test");\n}\n```',
    expectedLines: 5,
    mustContainFences: true
  },
  {
    name: 'Incomplete table rows',
    description: 'Table with varying number of cells per row',
    input: '| A | B | C |\n| 1 |\n| 2 | 3 |\n| 4 | 5 | 6 | 7 |',
    expectedLines: 4,
    mustContainFences: false
  },
  {
    name: 'Code block with special characters',
    description: 'Code containing brackets, quotes, and other special chars',
    input: '```\n[{(<>)}] "test" \'string\' `template`\n```',
    expectedLines: 3,
    mustContainFences: true
  },
  {
    name: 'Multiple code blocks',
    description: 'Document with multiple code blocks',
    input: '```js\ncode1();\n```\n\nSome text\n\n```py\ncode2()\n```',
    expectedLines: 9,
    mustContainFences: true
  },
  {
    name: 'Nested markdown in table',
    description: 'Table cells with inline markdown',
    input: '| **Bold** | *Italic* |\n| `code` | [link](url) |',
    expectedLines: 2,
    mustContainFences: false
  },
  {
    name: 'Code fence with language on same line',
    description: 'Inline code block syntax',
    input: '```javascript console.log("test"); ```',
    expectedLines: 1,
    mustContainFences: true
  },
  {
    name: 'Empty code block',
    description: 'Code block with no content',
    input: '```\n\n```',
    expectedLines: 3,
    mustContainFences: true
  },
  {
    name: 'Table inside blockquote',
    description: 'Complex nested structure',
    input: '> | A | B |\n> | 1 | 2 |',
    expectedLines: 2,
    mustContainFences: false
  },
  {
    name: 'Code block at end of document',
    description: 'Ensures proper handling at document end',
    input: 'Text before\n\n```\ncode\n```',
    expectedLines: 5,
    mustContainFences: true
  },
  {
    name: 'Mixed content stress test',
    description: 'Various markdown elements together',
    input: '# Title\n\n| Table | Here |\n| --- | --- |\n\n```\ncode block\n```\n\n> Quote',
    expectedLines: 10,
    mustContainFences: true
  }
];

let passed = 0;
let failed = 0;
const results = [];

testCases.forEach((test, index) => {
  console.log(`Test ${index + 1}: ${test.name}`);
  console.log(`Description: ${test.description}`);
  
  const inputLines = test.input.split('\n');
  const parsed = MarkdownParser.parse(test.input);
  const visualLines = extractVisualText(parsed);
  
  // Check line count
  const lineCountMatch = inputLines.length === visualLines.length;
  
  // Check fence preservation
  let fenceCheck = true;
  if (test.mustContainFences) {
    const inputFences = (test.input.match(/```/g) || []).length;
    const outputFences = visualLines.join('\n').match(/```/g)?.length || 0;
    fenceCheck = inputFences === outputFences;
  }
  
  // Check character alignment per line
  let charAlignment = true;
  const misalignedLines = [];
  
  for (let i = 0; i < Math.max(inputLines.length, visualLines.length); i++) {
    const inputLine = inputLines[i] || '';
    const visualLine = visualLines[i] || '';
    
    // Special case: empty lines get converted to &nbsp; (0 -> 1 char) intentionally
    // JSDOM converts &nbsp; to char code 160 (non-breaking space)
    // Also handle other invisible/whitespace characters that may result from processing
    const isEmptyLineWithNbsp = inputLine.length === 0 && visualLine.length === 1 && (
      visualLine.charCodeAt(0) === 160 ||  // &nbsp;
      visualLine.charCodeAt(0) === 32 ||   // regular space
      visualLine.charCodeAt(0) === 0 ||    // null character
      /^\s$/.test(visualLine)              // any whitespace character
    );
    
    if (inputLine.length !== visualLine.length && !isEmptyLineWithNbsp) {
      charAlignment = false;
      misalignedLines.push({
        lineNum: i + 1,
        input: inputLine,
        inputLen: inputLine.length,
        visual: visualLine,
        visualLen: visualLine.length
      });
    }
  }
  
  const testPassed = lineCountMatch && fenceCheck && charAlignment;
  
  console.log(`  Lines: ${inputLines.length} → ${visualLines.length} ${lineCountMatch ? '✅' : '❌'}`);
  if (test.mustContainFences) {
    console.log(`  Fences preserved: ${fenceCheck ? '✅' : '❌'}`);
  }
  console.log(`  Character alignment: ${charAlignment ? '✅' : '❌'}`);
  
  if (!charAlignment && misalignedLines.length > 0) {
    console.log('  Misaligned lines:');
    misalignedLines.slice(0, 3).forEach(line => {
      console.log(`    Line ${line.lineNum}: ${line.inputLen} vs ${line.visualLen} chars`);
    });
  }
  
  console.log(`  Result: ${testPassed ? '✅ PASS' : '❌ FAIL'}`);
  
  if (testPassed) {
    passed++;
  } else {
    failed++;
    results.push({
      test: test.name,
      issues: {
        lineCount: !lineCountMatch,
        fences: !fenceCheck,
        alignment: !charAlignment,
        details: misalignedLines
      }
    });
  }
  
  console.log('');
});

// Summary
console.log('=' .repeat(70));
console.log('\n📊 Test Summary:\n');
console.log(`✅ Passed: ${passed}/${testCases.length}`);
console.log(`❌ Failed: ${failed}/${testCases.length}`);

if (failed > 0) {
  console.log('\n❌ Failed tests:');
  results.forEach(result => {
    console.log(`  - ${result.test}`);
    if (result.issues.lineCount) console.log('    • Line count mismatch');
    if (result.issues.fences) console.log('    • Fence markers not preserved');
    if (result.issues.alignment) console.log('    • Character alignment issues');
  });
}

const successRate = ((passed / testCases.length) * 100).toFixed(1);
console.log(`\nSuccess rate: ${successRate}%`);

if (passed === testCases.length) {
  console.log('\n✨ All alignment tests passed! Issue #32 is fully resolved.');
} else {
  console.log('\n⚠️  Some alignment issues remain. Review failed tests above.');
}

export default { passed, failed, total: testCases.length };