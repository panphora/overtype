/**
 * Smart List Continuation Tests
 * Test suite for GitHub-style automatic list continuation
 */

import { MarkdownParser } from '../src/parser.js';

console.log('🧪 Smart List Continuation Tests\n');
console.log('━'.repeat(50) + '\n');

let passed = 0;
let failed = 0;

function assert(condition, testName, message = '') {
  if (condition) {
    console.log(`✓ ${testName}`);
    passed++;
  } else {
    console.log(`✗ ${testName}`);
    if (message) console.log(`  ${message}`);
    failed++;
  }
}

// ===== Parser List Detection Tests =====
console.log('📝 List Context Detection\n');

// Test: Detect bullet list with dash
(() => {
  const text = '- First item\n- Second item';
  const context = MarkdownParser.getListContext(text, 12); // End of first line
  
  assert(
    context && context.inList === true,
    'Detects bullet list',
    `Expected inList: true, got: ${context?.inList}`
  );
  
  assert(
    context && context.listType === 'bullet',
    'Identifies bullet type',
    `Expected listType: bullet, got: ${context?.listType}`
  );
  
  assert(
    context && context.marker === '-',
    'Extracts dash marker',
    `Expected marker: -, got: ${context?.marker}`
  );
})();

// Test: Detect bullet list with asterisk
(() => {
  const text = '* Item one\n* Item two';
  const context = MarkdownParser.getListContext(text, 10);
  
  assert(
    context && context.marker === '*',
    'Extracts asterisk marker'
  );
})();

// Test: Detect numbered list
(() => {
  const text = '1. First\n2. Second';
  const context = MarkdownParser.getListContext(text, 8);
  
  assert(
    context && context.listType === 'numbered',
    'Identifies numbered list'
  );
  
  assert(
    context && context.marker === 1,
    'Extracts number',
    `Expected marker: 1, got: ${context?.marker}`
  );
})();

// Test: Detect checkbox list
(() => {
  const text = '- [ ] Unchecked\n- [x] Checked';
  const context = MarkdownParser.getListContext(text, 15);
  
  assert(
    context && context.listType === 'checkbox',
    'Identifies checkbox list'
  );
  
  assert(
    context && context.checked === false,
    'Detects unchecked state'
  );
})();

// Test: Detect indented list
(() => {
  const text = '  - Indented item';
  const context = MarkdownParser.getListContext(text, 17);
  
  assert(
    context && context.indent === '  ',
    'Captures indentation',
    `Expected indent: "  ", got: "${context?.indent}"`
  );
})();

// Test: Not in list
(() => {
  const text = 'Regular paragraph text';
  const context = MarkdownParser.getListContext(text, 10);
  
  assert(
    context && context.inList === false,
    'Detects non-list text'
  );
})();

// Test: Renderer and continuation agree on list boundaries
(() => {
  for (const input of ['- - -', '\t- Item', '1234567890. Item']) {
    const context = MarkdownParser.getListContext(input, input.length);
    assert(
      context.inList === false,
      `Rejects non-rendered list: ${JSON.stringify(input)}`,
      `Expected inList: false, got: ${context.inList}`
    );
  }
})();

// Test: Get line boundaries
(() => {
  const text = 'Line 1\n- List item\nLine 3';
  const context = MarkdownParser.getListContext(text, 15); // In list item
  
  assert(
    context && context.lineStart === 7,
    'Finds line start',
    `Expected lineStart: 7, got: ${context?.lineStart}`
  );
  
  assert(
    context && context.lineEnd === 18,
    'Finds line end',
    `Expected lineEnd: 18, got: ${context?.lineEnd}`
  );
})();

// Test: Marker end position
(() => {
  const text = '- List item content';
  const context = MarkdownParser.getListContext(text, 10);
  
  assert(
    context && context.markerEndPos === 2,
    'Finds marker end position',
    `Expected markerEndPos: 2, got: ${context?.markerEndPos}`
  );
})();

// ===== List Item Creation Tests =====
console.log('\n🔨 List Item Creation\n');

// Test: Create bullet item
(() => {
  const context = {
    listType: 'bullet',
    indent: '',
    marker: '-'
  };
  
  const newItem = MarkdownParser.createNewListItem(context);
  
  assert(
    newItem === '- ',
    'Creates basic bullet item',
    `Expected: "- ", got: "${newItem}"`
  );
})();

// Test: Create indented bullet
(() => {
  const context = {
    listType: 'bullet',
    indent: '  ',
    marker: '*'
  };
  
  const newItem = MarkdownParser.createNewListItem(context);
  
  assert(
    newItem === '  * ',
    'Creates indented bullet',
    `Expected: "  * ", got: "${newItem}"`
  );
})();

// Test: Create numbered item
(() => {
  const context = {
    listType: 'numbered',
    indent: '',
    marker: 3
  };
  
  const newItem = MarkdownParser.createNewListItem(context);
  
  assert(
    newItem === '4. ',
    'Creates next number',
    `Expected: "4. ", got: "${newItem}"`
  );
})();

// Test: Create checkbox item
(() => {
  const context = {
    listType: 'checkbox',
    indent: '    ',
    checked: true // Previous state doesn't matter
  };
  
  const newItem = MarkdownParser.createNewListItem(context);
  
  assert(
    newItem === '    - [ ] ',
    'Creates unchecked checkbox',
    `Expected: "    - [ ] ", got: "${newItem}"`
  );
})();

// ===== Integration Tests (Mock) =====
console.log('\n🔄 List Continuation Behavior\n');

// Helper to create mock editor
function createMockEditor(text, cursorPos) {
  return {
    textarea: {
      value: text,
      selectionStart: cursorPos,
      selectionEnd: cursorPos,
      setSelectionRange: function(start, end) {
        this.selectionStart = start;
        this.selectionEnd = end;
      }
    },
    options: { smartLists: true },
    execCommandCalls: [],
    // Mock handleSmartListContinuation
    handleSmartListContinuation: function() {
      const context = MarkdownParser.getListContext(
        this.textarea.value, 
        this.textarea.selectionStart
      );
      
      if (!context || !context.inList) return false;
      
      // Empty item exits list
      if (context.content.trim() === '' && 
          this.textarea.selectionStart >= context.markerEndPos) {
        this.execCommandCalls.push({
          action: 'exit-list',
          position: context.lineStart
        });
        return true;
      }
      
      // Create new item
      const newItem = MarkdownParser.createNewListItem(context);
      this.execCommandCalls.push({
        action: 'insert',
        text: '\n' + newItem
      });
      
      return true;
    }
  };
}

// Test: Continue bullet list
(() => {
  const editor = createMockEditor('- First item', 12);
  const handled = editor.handleSmartListContinuation();
  
  assert(
    handled === true,
    'Handles bullet continuation'
  );
  
  assert(
    editor.execCommandCalls[0]?.text === '\n- ',
    'Inserts new bullet',
    `Expected: "\\n- ", got: "${editor.execCommandCalls[0]?.text}"`
  );
})();

// Test: Exit list on empty item
(() => {
  const editor = createMockEditor('- First\n- ', 10);
  const handled = editor.handleSmartListContinuation();
  
  assert(
    handled === true,
    'Handles empty list item'
  );
  
  assert(
    editor.execCommandCalls[0]?.action === 'exit-list',
    'Exits list on empty item'
  );
})();

// Test: Continue numbered list
(() => {
  const editor = createMockEditor('1. First\n2. Second', 18);
  const handled = editor.handleSmartListContinuation();
  
  assert(
    handled === true,
    'Handles numbered continuation'
  );
  
  assert(
    editor.execCommandCalls[0]?.text === '\n3. ',
    'Increments number',
    `Expected: "\\n3. ", got: "${editor.execCommandCalls[0]?.text}"`
  );
})();

// Test: Not in list returns false
(() => {
  const editor = createMockEditor('Regular text', 12);
  const handled = editor.handleSmartListContinuation();
  
  assert(
    handled === false,
    'Returns false when not in list'
  );
})();

// ===== Numbered List Renumbering Tests =====
console.log('\n🔢 Numbered List Renumbering\n');

// Test: Basic renumbering
(() => {
  const input = '1. First\n3. Second\n5. Third';
  const expected = '1. First\n2. Second\n3. Third';
  const result = MarkdownParser.renumberLists(input);
  
  assert(
    result === expected,
    'Renumbers sequential list',
    `Expected: "${expected}", got: "${result}"`
  );
})();

// Test: Renumbering with break
(() => {
  const input = '1. First\n3. Second\n\nRegular text\n\n1. New list\n5. Item';
  const expected = '1. First\n2. Second\n\nRegular text\n\n1. New list\n2. Item';
  const result = MarkdownParser.renumberLists(input);
  
  assert(
    result === expected,
    'Resets numbering after break',
    `Got: "${result}"`
  );
})();

// Test: Preserve indentation in renumbering
(() => {
  const input = '1. First\n  2. Nested\n  5. Nested2\n3. Back';
  const expected = '1. First\n  1. Nested\n  2. Nested2\n2. Back';
  const result = MarkdownParser.renumberLists(input);
  
  assert(
    result === expected,
    'Handles nested list renumbering',
    `Got: "${result}"`
  );
})();

// ===== Summary =====
console.log('\n' + '━'.repeat(50));
console.log('\n📊 Test Results Summary\n');
console.log(`✅ Passed: ${passed}`);
console.log(`❌ Failed: ${failed}`);
console.log(`📈 Total:  ${passed + failed}`);
console.log(`🎯 Success Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%`);

if (failed === 0) {
  console.log('\n✨ All tests passed!');
  process.exit(0);
} else {
  console.log('\n⚠️  Some tests failed. Please review the output above.');
  process.exit(1);
}
