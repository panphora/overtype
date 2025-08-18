/**
 * OverType Library Tests
 * Simple test suite for the OverType markdown editor
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

// Helper to compare HTML strings
function htmlEqual(actual, expected) {
  return actual.trim() === expected.trim();
}

// Test Suite
console.log('🧪 Running OverType Tests...\n');
console.log('━'.repeat(50));

// ===== Parser Tests =====
console.log('\n📝 Parser Tests\n');

// Test: Escape HTML
(() => {
  const input = '<script>alert("XSS")</script>';
  const expected = '&lt;script&gt;alert(&quot;XSS&quot;)&lt;/script&gt;';
  const actual = MarkdownParser.escapeHtml(input);
  assert(actual === expected, 'escapeHtml', `Expected: ${expected}, Got: ${actual}`);
})();

// Test: Headers
(() => {
  const tests = [
    { input: '# Title', expected: '<div><span class="header h1"><span class="syntax-marker">#</span> Title</span></div>' },
    { input: '## Subtitle', expected: '<div><span class="header h2"><span class="syntax-marker">##</span> Subtitle</span></div>' },
    { input: '### Section', expected: '<div><span class="header h3"><span class="syntax-marker">###</span> Section</span></div>' },
    { input: '#### Too Deep', expected: '<div>#### Too Deep</div>' }
  ];
  
  tests.forEach(test => {
    const actual = MarkdownParser.parseLine(test.input);
    assert(htmlEqual(actual, test.expected), `Header: ${test.input}`, `Expected: ${test.expected}, Got: ${actual}`);
  });
})();

// Test: Bold text
(() => {
  const tests = [
    { input: '**bold text**', expected: '<div><strong><span class="syntax-marker">**</span>bold text<span class="syntax-marker">**</span></strong></div>' },
    { input: '__bold text__', expected: '<div><strong><span class="syntax-marker">__</span>bold text<span class="syntax-marker">__</span></strong></div>' }
  ];
  
  tests.forEach(test => {
    const actual = MarkdownParser.parseLine(test.input);
    assert(htmlEqual(actual, test.expected), `Bold: ${test.input}`, `Expected: ${test.expected}, Got: ${actual}`);
  });
})();

// Test: Italic text
(() => {
  const tests = [
    { input: '*italic text*', expected: '<div><em><span class="syntax-marker">*</span>italic text<span class="syntax-marker">*</span></em></div>' },
    { input: '_italic text_', expected: '<div><em><span class="syntax-marker">_</span>italic text<span class="syntax-marker">_</span></em></div>' }
  ];
  
  tests.forEach(test => {
    const actual = MarkdownParser.parseLine(test.input);
    assert(htmlEqual(actual, test.expected), `Italic: ${test.input}`, `Expected: ${test.expected}, Got: ${actual}`);
  });
})();

// Test: Inline code
(() => {
  const input = '`code`';
  const expected = '<div><code><span class="syntax-marker">`</span>code<span class="syntax-marker">`</span></code></div>';
  const actual = MarkdownParser.parseLine(input);
  assert(htmlEqual(actual, expected), 'Inline code', `Expected: ${expected}, Got: ${actual}`);
})();

// Test: Links
(() => {
  const input = '[text](url)';
  const expected = '<div><a href="url"><span class="syntax-marker">[</span>text<span class="syntax-marker">](</span><span class="syntax-marker">url</span><span class="syntax-marker">)</span></a></div>';
  const actual = MarkdownParser.parseLine(input);
  assert(htmlEqual(actual, expected), 'Links', `Expected: ${expected}, Got: ${actual}`);
})();

// Test: Lists
(() => {
  const tests = [
    { input: '- Item', expected: '<div><span class="syntax-marker">-</span> Item</div>' },
    { input: '* Item', expected: '<div><span class="syntax-marker">*</span> Item</div>' },
    { input: '1. First', expected: '<div><span class="syntax-marker">1.</span> First</div>' }
  ];
  
  tests.forEach(test => {
    const actual = MarkdownParser.parseLine(test.input);
    assert(htmlEqual(actual, test.expected), `List: ${test.input}`, `Expected: ${test.expected}, Got: ${actual}`);
  });
})();

// Test: Mixed markdown in lists
(() => {
  const tests = [
    { 
      input: '- This is **bold** text', 
      expected: '<div><span class="syntax-marker">-</span> This is <strong><span class="syntax-marker">**</span>bold<span class="syntax-marker">**</span></strong> text</div>' 
    },
    { 
      input: '- This is *italic* text', 
      expected: '<div><span class="syntax-marker">-</span> This is <em><span class="syntax-marker">*</span>italic<span class="syntax-marker">*</span></em> text</div>' 
    },
    { 
      input: '- Contains `code` here', 
      expected: '<div><span class="syntax-marker">-</span> Contains <code><span class="syntax-marker">`</span>code<span class="syntax-marker">`</span></code> here</div>' 
    }
  ];
  
  tests.forEach(test => {
    const actual = MarkdownParser.parseLine(test.input);
    assert(htmlEqual(actual, test.expected), `Mixed list: ${test.input}`, `Expected: ${test.expected}, Got: ${actual}`);
  });
})();

// Test: Blockquotes
(() => {
  const input = '> Quote';
  const expected = '<div><span class="blockquote"><span class="syntax-marker">&gt;</span> Quote</span></div>';
  const actual = MarkdownParser.parseLine(input);
  assert(htmlEqual(actual, expected), 'Blockquote', `Expected: ${expected}, Got: ${actual}`);
})();

// Test: Horizontal rule
(() => {
  const tests = [
    { input: '---', expected: '<div><span class="hr-marker">---</span></div>' },
    { input: '***', expected: '<div><span class="hr-marker">***</span></div>' },
    { input: '___', expected: '<div><span class="hr-marker">___</span></div>' }
  ];
  
  tests.forEach(test => {
    const actual = MarkdownParser.parseLine(test.input);
    assert(htmlEqual(actual, test.expected), `HR: ${test.input}`, `Expected: ${test.expected}, Got: ${actual}`);
  });
})();

// Test: Empty line
(() => {
  const input = '';
  const expected = '<div>&nbsp;</div>';
  const actual = MarkdownParser.parseLine(input);
  assert(htmlEqual(actual, expected), 'Empty line', `Expected: ${expected}, Got: ${actual}`);
})();

// Test: Indentation preservation
(() => {
  const input = '    Indented text';
  const actual = MarkdownParser.parseLine(input);
  assert(actual.includes('&nbsp;&nbsp;&nbsp;&nbsp;'), 'Indentation preservation', 'Should preserve spaces as nbsp');
})();

// Test: Full document parsing
(() => {
  const input = `# Title
This is **bold** and *italic*.

- List item 1
- List item 2`;
  
  const actual = MarkdownParser.parse(input);
  assert(actual.includes('class="header h1"'), 'Full doc: header', 'Should contain header');
  assert(actual.includes('<strong>'), 'Full doc: bold', 'Should contain bold');
  assert(actual.includes('<em>'), 'Full doc: italic', 'Should contain italic');
  assert(actual.includes('syntax-marker'), 'Full doc: markers', 'Should contain syntax markers');
})();

// Test: Raw line display
(() => {
  const input = '# Test\n**Bold**\n*Italic*';
  const actual = MarkdownParser.parse(input, 1, true);
  assert(actual.includes('class="raw-line"'), 'Raw line display', 'Should show raw line for active line');
})();

// Test: Inline code with underscores and stars
(() => {
  const tests = [
    { 
      input: '`OP_CAT_DOG`', 
      expected: '<div><code><span class="syntax-marker">`</span>OP_CAT_DOG<span class="syntax-marker">`</span></code></div>',
      description: 'Should not italicize underscores inside code'
    },
    { 
      input: '`OP_CAT` and *dog*', 
      expected: '<div><code><span class="syntax-marker">`</span>OP_CAT<span class="syntax-marker">`</span></code> and <em><span class="syntax-marker">*</span>dog<span class="syntax-marker">*</span></em></div>',
      description: 'Should italicize outside code but not inside'
    },
    { 
      input: '`function_name_here` _should work_', 
      expected: '<div><code><span class="syntax-marker">`</span>function_name_here<span class="syntax-marker">`</span></code> <em><span class="syntax-marker">_</span>should work<span class="syntax-marker">_</span></em></div>',
      description: 'Should handle mixed code and italic with underscores'
    },
    { 
      input: '`__init__` method', 
      expected: '<div><code><span class="syntax-marker">`</span>__init__<span class="syntax-marker">`</span></code> method</div>',
      description: 'Should not bold double underscores inside code'
    },
    { 
      input: 'Text `with_code` and **bold**', 
      expected: '<div>Text <code><span class="syntax-marker">`</span>with_code<span class="syntax-marker">`</span></code> and <strong><span class="syntax-marker">**</span>bold<span class="syntax-marker">**</span></strong></div>',
      description: 'Should handle code with underscores and separate bold'
    },
    { 
      input: '`*asterisk*` and _underscore_', 
      expected: '<div><code><span class="syntax-marker">`</span>*asterisk*<span class="syntax-marker">`</span></code> and <em><span class="syntax-marker">_</span>underscore<span class="syntax-marker">_</span></em></div>',
      description: 'Should not italicize asterisks inside code'
    }
  ];

  tests.forEach(test => {
    const actual = MarkdownParser.parseLine(test.input);
    assert(htmlEqual(actual, test.expected), `Inline code protection: ${test.input}`, `${test.description}. Expected: ${test.expected}, Got: ${actual}`);
  });
})();

// Test: Formatting that spans across code blocks
(() => {
  const tests = [
    { 
      input: '*cat `test` dog*', 
      expected: '<div><em><span class="syntax-marker">*</span>cat <code><span class="syntax-marker">`</span>test<span class="syntax-marker">`</span></code> dog<span class="syntax-marker">*</span></em></div>',
      description: 'Should italicize text that spans across code blocks'
    },
    { 
      input: '**bold `code_here` more bold**', 
      expected: '<div><strong><span class="syntax-marker">**</span>bold <code><span class="syntax-marker">`</span>code_here<span class="syntax-marker">`</span></code> more bold<span class="syntax-marker">**</span></strong></div>',
      description: 'Should bold text that spans across code blocks'
    },
    { 
      input: '_italic `with_underscores` still italic_', 
      expected: '<div><em><span class="syntax-marker">_</span>italic <code><span class="syntax-marker">`</span>with_underscores<span class="syntax-marker">`</span></code> still italic<span class="syntax-marker">_</span></em></div>',
      description: 'Should handle italic with underscores spanning code'
    },
    { 
      input: '__bold `code` and `more_code` bold__', 
      expected: '<div><strong><span class="syntax-marker">__</span>bold <code><span class="syntax-marker">`</span>code<span class="syntax-marker">`</span></code> and <code><span class="syntax-marker">`</span>more_code<span class="syntax-marker">`</span></code> bold<span class="syntax-marker">__</span></strong></div>',
      description: 'Should bold text spanning multiple code blocks'
    }
  ];

  tests.forEach(test => {
    const actual = MarkdownParser.parseLine(test.input);
    assert(htmlEqual(actual, test.expected), `Spanning code: ${test.input}`, `${test.description}. Expected: ${test.expected}, Got: ${actual}`);
  });
})();

// Test: Multiple inline code blocks with external formatting
(() => {
  const tests = [
    { 
      input: '`first_code` and `second_code` with *italic*', 
      expected: '<div><code><span class="syntax-marker">`</span>first_code<span class="syntax-marker">`</span></code> and <code><span class="syntax-marker">`</span>second_code<span class="syntax-marker">`</span></code> with <em><span class="syntax-marker">*</span>italic<span class="syntax-marker">*</span></em></div>',
      description: 'Should handle multiple code blocks with external formatting'
    },
    { 
      input: '*Before `__code__` between `_more_code_` after*', 
      expected: '<div><em><span class="syntax-marker">*</span>Before <code><span class="syntax-marker">`</span>__code__<span class="syntax-marker">`</span></code> between <code><span class="syntax-marker">`</span>_more_code_<span class="syntax-marker">`</span></code> after<span class="syntax-marker">*</span></em></div>',
      description: 'Should handle italic spanning multiple protected code blocks'
    },
    { 
      input: '**Text `code1` middle `code2` end**', 
      expected: '<div><strong><span class="syntax-marker">**</span>Text <code><span class="syntax-marker">`</span>code1<span class="syntax-marker">`</span></code> middle <code><span class="syntax-marker">`</span>code2<span class="syntax-marker">`</span></code> end<span class="syntax-marker">**</span></strong></div>',
      description: 'Should bold across multiple code blocks'
    }
  ];

  tests.forEach(test => {
    const actual = MarkdownParser.parseLine(test.input);
    assert(htmlEqual(actual, test.expected), `Multiple code + format: ${test.input}`, `${test.description}. Expected: ${test.expected}, Got: ${actual}`);
  });
})();

// Test: Complex nested scenarios
(() => {
  const tests = [
    { 
      input: 'Normal `code_block` and **bold `with_code` bold** text', 
      expected: '<div>Normal <code><span class="syntax-marker">`</span>code_block<span class="syntax-marker">`</span></code> and <strong><span class="syntax-marker">**</span>bold <code><span class="syntax-marker">`</span>with_code<span class="syntax-marker">`</span></code> bold<span class="syntax-marker">**</span></strong> text</div>',
      description: 'Should handle mixed standalone and spanning formatting'
    },
    { 
      input: '*italic* `code_here` **bold `spanning_code` bold**', 
      expected: '<div><em><span class="syntax-marker">*</span>italic<span class="syntax-marker">*</span></em> <code><span class="syntax-marker">`</span>code_here<span class="syntax-marker">`</span></code> <strong><span class="syntax-marker">**</span>bold <code><span class="syntax-marker">`</span>spanning_code<span class="syntax-marker">`</span></code> bold<span class="syntax-marker">**</span></strong></div>',
      description: 'Should handle multiple different formatting types with code'
    },
    {
      input: '[Link `with_code` text](url) and `regular_code`',
      expected: '<div><a href="url"><span class="syntax-marker">[</span>Link <code><span class="syntax-marker">`</span>with_code<span class="syntax-marker">`</span></code> text<span class="syntax-marker">](</span><span class="syntax-marker">url</span><span class="syntax-marker">)</span></a> and <code><span class="syntax-marker">`</span>regular_code<span class="syntax-marker">`</span></code></div>',
      description: 'Should handle links spanning code blocks'
    }
  ];

  tests.forEach(test => {
    const actual = MarkdownParser.parseLine(test.input);
    assert(htmlEqual(actual, test.expected), `Complex nested code: ${test.input}`, `${test.description}. Expected: ${test.expected}, Got: ${actual}`);
  });
})();

// Test: Edge cases that should NOT be formatted
(() => {
  const tests = [
    { 
      input: '`**not_bold**`', 
      expected: '<div><code><span class="syntax-marker">`</span>**not_bold**<span class="syntax-marker">`</span></code></div>',
      description: 'Should not process bold markers inside code'
    },
    { 
      input: '`__also_not_bold__`', 
      expected: '<div><code><span class="syntax-marker">`</span>__also_not_bold__<span class="syntax-marker">`</span></code></div>',
      description: 'Should not process underscore bold markers inside code'
    },
    { 
      input: '`*not_italic*`', 
      expected: '<div><code><span class="syntax-marker">`</span>*not_italic*<span class="syntax-marker">`</span></code></div>',
      description: 'Should not process asterisk italic markers inside code'
    },
    { 
      input: '`_not_italic_`', 
      expected: '<div><code><span class="syntax-marker">`</span>_not_italic_<span class="syntax-marker">`</span></code></div>',
      description: 'Should not process underscore italic markers inside code'
    },
    {
      input: '`[not_a_link](url)`',
      expected: '<div><code><span class="syntax-marker">`</span>[not_a_link](url)<span class="syntax-marker">`</span></code></div>',
      description: 'Should not process link markers inside code'
    }
  ];

  tests.forEach(test => {
    const actual = MarkdownParser.parseLine(test.input);
    assert(htmlEqual(actual, test.expected), `Code protection edge cases: ${test.input}`, `${test.description}. Expected: ${test.expected}, Got: ${actual}`);
  });
})();

// Test: Code fence improvements - reject invalid patterns
(() => {
  const tests = [
    { input: '```', expected: '<div><span class="code-fence">```</span></div>', description: 'Valid code fence' },
    { input: '```js`', expected: '<div>```js`</div>', description: 'Should reject fence with subsequent backtick' },
    { input: '```contains`backtick', expected: '<div>```contains`backtick</div>', description: 'Should reject fence with backtick in content' }
  ];

  tests.forEach(test => {
    const actual = MarkdownParser.parseCodeBlock(test.input) || `<div>${MarkdownParser.escapeHtml(test.input)}</div>`;
    assert(htmlEqual(actual, test.expected), `Code fence: ${test.input}`, `${test.description}`);
  });
})();

// Test: Multi-backtick inline code
(() => {
  const tests = [
    { input: '``code with `backtick` inside``', expected: '<div><code><span class="syntax-marker">``</span>code with `backtick` inside<span class="syntax-marker">``</span></code></div>' },
    { input: '`single` and ``double``', expected: '<div><code><span class="syntax-marker">`</span>single<span class="syntax-marker">`</span></code> and <code><span class="syntax-marker">``</span>double<span class="syntax-marker">``</span></code></div>' },
    { input: '```triple```', expected: '<div><code><span class="syntax-marker">```</span>triple<span class="syntax-marker">```</span></code></div>' },
    { input: '`unmatched``', expected: '<div>`unmatched``</div>' },
    { input: '``unmatched`', expected: '<div>``unmatched`</div>' },
    { input: '```unmatched``', expected: '<div>```unmatched``</div>' },
    { input: '``unmatched```', expected: '<div>``unmatched```</div>' },
  ];

  tests.forEach(test => {
    const actual = MarkdownParser.parseLine(test.input);
    assert(htmlEqual(actual, test.expected), `Multi-backtick: ${test.input} ${actual}`, 'Should handle equal backtick matching');
  });
})();

// ===== Integration Tests =====
console.log('\n🔧 Integration Tests\n');

// Test: Complex nested markdown
(() => {
  const input = '## This has **bold**, *italic*, `code`, and [links](url) all together!';
  const actual = MarkdownParser.parseLine(input);
  assert(actual.includes('class="header h2"'), 'Complex: header', 'Should parse header');
  assert(actual.includes('<strong>'), 'Complex: bold', 'Should parse bold');
  assert(actual.includes('<em>'), 'Complex: italic', 'Should parse italic');
  assert(actual.includes('<code>'), 'Complex: code', 'Should parse code');
  assert(actual.includes('<a href="url">'), 'Complex: link', 'Should parse link');
})();

// Test: XSS prevention
(() => {
  const tests = [
    '<img src=x onerror=alert(1)>',
    '<script>alert("XSS")</script>',
    'javascript:alert(1)',
    '<a href="javascript:alert(1)">Click</a>'
  ];
  
  tests.forEach(test => {
    const actual = MarkdownParser.parseLine(test);
    assert(!actual.includes('<script'), `XSS prevention: ${test.substring(0, 20)}...`, 'Should escape dangerous HTML');
    assert(!actual.includes('<img src=x onerror='), `XSS prevention events: ${test.substring(0, 20)}...`, 'Should escape event handlers');
    assert(actual.includes('&lt;') || !test.includes('<'), `XSS escaping: ${test.substring(0, 20)}...`, 'Should escape HTML tags');
  });
})();

// ===== Performance Tests =====
console.log('\n⚡ Performance Tests\n');

// Test: Large document parsing
(() => {
  const lines = 1000;
  const largeDoc = Array(lines).fill('# Heading\nThis is **bold** and *italic* text with `code` and [links](url).').join('\n');
  
  const startTime = performance.now();
  MarkdownParser.parse(largeDoc);
  const endTime = performance.now();
  const duration = endTime - startTime;
  
  assert(duration < 1000, `Parse ${lines} lines`, `Should parse in under 1 second, took ${duration.toFixed(2)}ms`);
  console.log(`  ⏱️  Parsed ${lines} lines in ${duration.toFixed(2)}ms`);
})();

// ===== Results Summary =====
console.log('\n━'.repeat(50));
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