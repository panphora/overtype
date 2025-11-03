/**
 * Mode Switching Tests for OverType
 * Tests synchronization between normal, plain, and preview modes
 * Related to issue #52 - layers getting out of sync
 */

import { JSDOM } from 'jsdom';
import { OverType } from '../src/overtype.js';

// Setup DOM
const dom = new JSDOM(`
  <!DOCTYPE html>
  <html>
    <body>
      <div id="editor"></div>
    </body>
  </html>
`);

global.window = dom.window;
global.document = dom.window.document;
global.HTMLElement = dom.window.HTMLElement;
global.Element = dom.window.Element;
global.Node = dom.window.Node;
global.CSS = { supports: () => false }; // Mock CSS.supports for link-tooltip
global.performance = { now: () => Date.now() };
global.requestAnimationFrame = (callback) => setTimeout(callback, 0); // Mock for Node.js

// Test results
let passed = 0;
let failed = 0;

function assert(condition, testName, message) {
  if (condition) {
    passed++;
    console.log(`✓ ${testName}`);
  } else {
    failed++;
    console.error(`✗ ${testName}: ${message}`);
  }
}

/**
 * Check if textarea and preview are aligned (character count matches per line)
 * @param {OverType} editor - The editor instance
 * @returns {Object} - { aligned: boolean, misalignedLines: Array }
 */
function checkAlignment(editor) {
  const textareaValue = editor.getValue();
  const inputLines = textareaValue.split('\n');

  // Get visible text from preview (strip HTML, get text content)
  const previewDivs = editor.preview.querySelectorAll('div');
  const visualLines = Array.from(previewDivs).map(div => div.textContent || '');

  const misalignedLines = [];

  for (let i = 0; i < Math.max(inputLines.length, visualLines.length); i++) {
    const inputLine = inputLines[i] || '';
    const visualLine = visualLines[i] || '';

    // Special case: empty lines get converted to &nbsp; (0 -> 1 char) intentionally
    // JSDOM converts &nbsp; to char code 160 (non-breaking space)
    const isEmptyLineWithNbsp = inputLine.length === 0 && visualLine.length === 1 && visualLine.charCodeAt(0) === 160;

    if (inputLine.length !== visualLine.length && !isEmptyLineWithNbsp) {
      misalignedLines.push({
        lineNum: i + 1,
        input: inputLine,
        inputLen: inputLine.length,
        visual: visualLine,
        visualLen: visualLine.length
      });
    }
  }

  return {
    aligned: misalignedLines.length === 0,
    misalignedLines,
    lineCountMatch: inputLines.length === visualLines.length
  };
}

console.log('🧪 Running Mode Switching Test...\n');
console.log('━'.repeat(50));
console.log('\n📝 Large Document with Heavy Editing & Mode Switching\n');

// The one comprehensive test: Large document with multiple editing iterations and mode switches
(() => {
  const editor = new OverType('#editor')[0];

  // Start with a large document (avoid code blocks - they get consolidated into <pre>)
  const initialDoc = `# Main Title

## Introduction
This is a **bold** statement with *italic* text and ~~strikethrough~~.

### Code Examples
Here's some inline \`code\` in a sentence.
You can also have \`more code\` on another line.
And even \`more inline code\` here too.

### More Content
Line 12
Line 13
Line 14
Line 15
Line 16
Line 17
Line 18
Line 19
Line 20

### Section 2
Line 22
Line 23
Line 24
Line 25

## Conclusion
Final paragraph here.`;

  editor.setValue(initialDoc);

  console.log('Starting test with large document (28 lines)...\n');

  let allIterationsPassed = true;
  const iterationResults = [];

  // ===== ITERATION 1 =====
  console.log('Iteration 1: Heavy editing on multiple lines...');
  let lines = editor.getValue().split('\n');
  lines[3] = 'This is a **bold** statement with *italic* text and ~~strikethrough~~ EDIT1EDIT1EDIT1';
  lines[7] = 'Here\'s some inline `code` in a sentence. ADDED EXTRA TEXT HERE FOR ITERATION 1';
  lines[12] = 'Line 12 MODIFIED WITH LOTS OF EXTRA CHARACTERS xxxxxxxxxxxxxxxxx';
  lines[13] = 'Line 13 ALSO MODIFIED yyyyyyyyyyyyyyyy';
  lines[17] = 'Line 17 CHANGED zzzzzzzzzzzzzz';
  lines[22] = 'Line 22 NOW HAS MORE STUFF wwwwwwwwwwww';
  lines[24] = 'Line 24 TOTALLY DIFFERENT NOW qqqqqqqqqqq';
  editor.textarea.value = lines.join('\n');
  editor.textarea.dispatchEvent(new dom.window.Event('input', { bubbles: true }));

  // Mode switches
  editor.showPlainTextarea();
  editor.showNormalEditMode();
  editor.showPreviewMode();
  editor.showNormalEditMode();

  // Check alignment
  let alignment = checkAlignment(editor);
  iterationResults.push({ iteration: 1, aligned: alignment.aligned, misaligned: alignment.misalignedLines });
  console.log(`  Alignment after iteration 1: ${alignment.aligned ? '✅' : '❌'}`);
  if (!alignment.aligned) {
    console.log(`    Misaligned lines: ${alignment.misalignedLines.slice(0, 3).map(l => `Line ${l.lineNum}`).join(', ')}`);
    allIterationsPassed = false;
  }

  // ===== ITERATION 2 =====
  console.log('Iteration 2: More heavy editing...');
  lines = editor.getValue().split('\n');
  lines[1] = '';  // Make line 2 empty
  lines[10] = '  return 42; // ADDED COMMENT HERE WITH MORE STUFF';
  lines[11] = '}  // CLOSING BRACE WITH COMMENT';
  lines[17] = 'Line 17 COMPLETELY REWRITTEN WITH NEW CONTENT aaaaaaaaaaaaa';
  lines[18] = 'Line 18 ALSO GETS NEW STUFF bbbbbbbbbbbbb';
  lines[19] = 'Line 19 MORE CHANGES ccccccccccccc';
  lines[23] = 'Line 23 UPDATED AGAIN ddddddddddddd';
  lines[25] = 'Line 25 NEW TEXT HERE eeeeeeeeeeeee';
  editor.textarea.value = lines.join('\n');
  editor.textarea.dispatchEvent(new dom.window.Event('input', { bubbles: true }));

  // Mode switches
  editor.showPreviewMode();
  editor.showNormalEditMode();
  editor.showPlainTextarea();
  editor.showNormalEditMode();

  // Check alignment
  alignment = checkAlignment(editor);
  iterationResults.push({ iteration: 2, aligned: alignment.aligned, misaligned: alignment.misalignedLines });
  console.log(`  Alignment after iteration 2: ${alignment.aligned ? '✅' : '❌'}`);
  if (!alignment.aligned) {
    console.log(`    Misaligned lines: ${alignment.misalignedLines.slice(0, 3).map(l => `Line ${l.lineNum}`).join(', ')}`);
    allIterationsPassed = false;
  }

  // ===== ITERATION 3 =====
  console.log('Iteration 3: Even more editing...');
  lines = editor.getValue().split('\n');
  lines[0] = '# Main Title EDITED IN ITERATION 3 fffffffffffff';
  lines[4] = '';  // Another empty line
  lines[7] = 'Here\'s some inline `code` in a sentence. ITERATION 3 CHANGES ggggggggggg';
  lines[15] = 'Line 15 CHANGED AGAIN IN ITER 3 hhhhhhhhhhhhh';
  lines[16] = 'Line 16 MORE ITERATION 3 EDITS iiiiiiiiiiiii';
  lines[20] = 'Line 20 ITER 3 VERSION jjjjjjjjjjjjj';
  lines[22] = 'Line 22 ITERATION THREE kkkkkkkkkkkkk';
  lines[24] = 'Line 24 THIRD ITERATION lllllllllllll';
  lines[27] = 'Final paragraph here. EDITED IN ITERATION 3 mmmmmmmmmmmmm';
  editor.textarea.value = lines.join('\n');
  editor.textarea.dispatchEvent(new dom.window.Event('input', { bubbles: true }));

  // Mode switches
  editor.showPlainTextarea();
  editor.showPreviewMode();
  editor.showNormalEditMode();
  editor.showNormalEditMode();

  // Check alignment
  alignment = checkAlignment(editor);
  iterationResults.push({ iteration: 3, aligned: alignment.aligned, misaligned: alignment.misalignedLines });
  console.log(`  Alignment after iteration 3: ${alignment.aligned ? '✅' : '❌'}`);
  if (!alignment.aligned) {
    console.log(`    Misaligned lines: ${alignment.misalignedLines.slice(0, 3).map(l => `Line ${l.lineNum}`).join(', ')}`);
    allIterationsPassed = false;
  }

  // ===== ITERATION 4 =====
  console.log('Iteration 4: Continuing with more edits...');
  lines = editor.getValue().split('\n');
  lines[3] = 'This is a **bold** statement with *italic* text ITERATION 4 nnnnnnnnnnnnn';
  lines[10] = '  return 42; // ITERATION 4 COMMENT ooooooooooooo';
  lines[15] = 'Line 15 VERSION 4 ppppppppppppp';
  lines[16] = 'Line 16 ITER FOUR qqqqqqqqqqqqq';
  lines[17] = 'Line 17 FOURTH ITERATION rrrrrrrrrrrrr';
  lines[18] = 'Line 18 ITER 4 CHANGES sssssssssssss';
  lines[22] = 'Line 22 FOURTH VERSION ttttttttttttt';
  lines[23] = 'Line 23 ITERATION FOUR uuuuuuuuuuuuu';
  lines[24] = 'Line 24 ITER 4 vvvvvvvvvvvvv';
  editor.textarea.value = lines.join('\n');
  editor.textarea.dispatchEvent(new dom.window.Event('input', { bubbles: true }));

  // Mode switches
  editor.showPreviewMode();
  editor.showPlainTextarea();
  editor.showNormalEditMode();
  editor.showNormalEditMode();

  // Check alignment
  alignment = checkAlignment(editor);
  iterationResults.push({ iteration: 4, aligned: alignment.aligned, misaligned: alignment.misalignedLines });
  console.log(`  Alignment after iteration 4: ${alignment.aligned ? '✅' : '❌'}`);
  if (!alignment.aligned) {
    console.log(`    Misaligned lines: ${alignment.misalignedLines.slice(0, 3).map(l => `Line ${l.lineNum}`).join(', ')}`);
    allIterationsPassed = false;
  }

  // ===== ITERATION 5 =====
  console.log('Iteration 5: Final round of heavy editing...');
  lines = editor.getValue().split('\n');
  lines[0] = '# Main Title FINAL ITERATION 5 wwwwwwwwwwwww';
  lines[3] = 'This is a **bold** statement ITERATION 5 xxxxxxxxxxxxxx';
  lines[7] = 'Here\'s some inline `code` ITER 5 yyyyyyyyyyyyyyyy';
  lines[10] = '  return 42; // FINAL ITERATION zzzzzzzzzzzzz';
  lines[15] = 'Line 15 ITERATION FIVE aaaaaaaaaaaaaaaa';
  lines[16] = 'Line 16 ITER 5 bbbbbbbbbbbbbbbb';
  lines[17] = 'Line 17 FIFTH ITERATION cccccccccccccccc';
  lines[18] = 'Line 18 FINAL VERSION dddddddddddddddd';
  lines[19] = 'Line 19 ITER 5 eeeeeeeeeeeeeeee';
  lines[20] = 'Line 20 FIFTH VERSION ffffffffffffffff';
  lines[22] = 'Line 22 ITERATION 5 gggggggggggggggg';
  lines[23] = 'Line 23 ITER FIVE hhhhhhhhhhhhhhhh';
  lines[24] = 'Line 24 FINAL EDIT iiiiiiiiiiiiiiii';
  lines[27] = 'Final paragraph here. ITERATION 5 COMPLETE jjjjjjjjjjjjjjjj';
  editor.textarea.value = lines.join('\n');
  editor.textarea.dispatchEvent(new dom.window.Event('input', { bubbles: true }));

  // Mode switches (extra aggressive)
  editor.showPlainTextarea();
  editor.showNormalEditMode();
  editor.showPreviewMode();
  editor.showNormalEditMode();
  editor.showPlainTextarea();
  editor.showPreviewMode();
  editor.showNormalEditMode();
  editor.showNormalEditMode();

  // Check alignment
  alignment = checkAlignment(editor);
  iterationResults.push({ iteration: 5, aligned: alignment.aligned, misaligned: alignment.misalignedLines });
  console.log(`  Alignment after iteration 5: ${alignment.aligned ? '✅' : '❌'}`);
  if (!alignment.aligned) {
    console.log(`    Misaligned lines: ${alignment.misalignedLines.slice(0, 3).map(l => `Line ${l.lineNum}`).join(', ')}`);
    allIterationsPassed = false;
  }

  // Final summary
  console.log('\n━'.repeat(50));
  console.log('Test Summary:\n');

  let failedIterations = [];
  iterationResults.forEach(result => {
    const status = result.aligned ? '✅' : '❌';
    console.log(`  Iteration ${result.iteration}: ${status}`);
    if (!result.aligned) {
      failedIterations.push(result.iteration);
    }
  });

  if (allIterationsPassed) {
    assert(true, 'Large document with heavy editing and mode switching', 'All iterations passed');
  } else {
    const errorMsg = `Failed iterations: ${failedIterations.join(', ')}`;
    assert(false, 'Large document with heavy editing and mode switching', errorMsg);
  }

  editor.destroy();
})();

console.log('\n━'.repeat(50));
console.log('\n📊 Test Results Summary\n');
console.log(`✅ Passed: ${passed}`);
console.log(`❌ Failed: ${failed}`);
console.log(`📈 Total:  ${passed + failed}`);
console.log(`🎯 Success Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%`);

if (failed === 0) {
  console.log('\n✨ All tests passed!');
} else {
  console.log(`\n⚠️  ${failed} test(s) failed.`);
  process.exit(1);
}
