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
    { input: '# Title', expected: '<div><h1><span class="syntax-marker"># </span>Title</h1></div>' },
    { input: '## Subtitle', expected: '<div><h2><span class="syntax-marker">## </span>Subtitle</h2></div>' },
    { input: '### Section', expected: '<div><h3><span class="syntax-marker">### </span>Section</h3></div>' },
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

// Test: Strikethrough text
(() => {
  const tests = [
    { input: '~~strikethrough text~~', expected: '<div><del><span class="syntax-marker">~~</span>strikethrough text<span class="syntax-marker">~~</span></del></div>' },
    { input: '~strikethrough text~', expected: '<div><del><span class="syntax-marker">~</span>strikethrough text<span class="syntax-marker">~</span></del></div>' },
    { input: '~~Hi~~ Hello, ~there~ world!', expected: '<div><del><span class="syntax-marker">~~</span>Hi<span class="syntax-marker">~~</span></del> Hello, <del><span class="syntax-marker">~</span>there<span class="syntax-marker">~</span></del> world!</div>' },
    { input: '~~~not strikethrough~~~', expected: '<div>~~~not strikethrough~~~</div>' },
    { input: 'This will ~~~not~~~ strike.', expected: '<div>This will ~~~not~~~ strike.</div>' }
  ];
  
  tests.forEach(test => {
    const actual = MarkdownParser.parseLine(test.input);
    assert(htmlEqual(actual, test.expected), `Strikethrough: ${test.input}`, `Expected: ${test.expected}, Got: ${actual}`);
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
  const expected = '<div><a href="url" style="anchor-name: --link-0"><span class="syntax-marker">[</span>text<span class="syntax-marker url-part">](url)</span></a></div>';
  const actual = MarkdownParser.parseLine(input);
  assert(htmlEqual(actual, expected), 'Links', `Expected: ${expected}, Got: ${actual}`);
})();

// Test: Lists
(() => {
  const tests = [
    { input: '- Item', expected: '<div><li class="bullet-list"><span class="syntax-marker">- </span>Item</li></div>' },
    { input: '* Item', expected: '<div><li class="bullet-list"><span class="syntax-marker">* </span>Item</li></div>' },
    { input: '1. First', expected: '<div><li class="ordered-list"><span class="syntax-marker">1. </span>First</li></div>' }
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
      expected: '<div><li class="bullet-list"><span class="syntax-marker">- </span>This is <strong><span class="syntax-marker">**</span>bold<span class="syntax-marker">**</span></strong> text</li></div>' 
    },
    { 
      input: '- This is *italic* text', 
      expected: '<div><li class="bullet-list"><span class="syntax-marker">- </span>This is <em><span class="syntax-marker">*</span>italic<span class="syntax-marker">*</span></em> text</li></div>' 
    },
    { 
      input: '- Contains `code` here', 
      expected: '<div><li class="bullet-list"><span class="syntax-marker">- </span>Contains <code><span class="syntax-marker">`</span>code<span class="syntax-marker">`</span></code> here</li></div>' 
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
  assert(actual.includes('<h1>'), 'Full doc: header', 'Should contain header');
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
    },
    { 
      input: '~~strike `code_here` more strike~~', 
      expected: '<div><del><span class="syntax-marker">~~</span>strike <code><span class="syntax-marker">`</span>code_here<span class="syntax-marker">`</span></code> more strike<span class="syntax-marker">~~</span></del></div>',
      description: 'Should strikethrough text that spans across code blocks'
    },
    { 
      input: '~strike `with_underscores` still strike~', 
      expected: '<div><del><span class="syntax-marker">~</span>strike <code><span class="syntax-marker">`</span>with_underscores<span class="syntax-marker">`</span></code> still strike<span class="syntax-marker">~</span></del></div>',
      description: 'Should handle single tilde strikethrough spanning code'
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
      input: '~~strike~~ `code_here` **bold `spanning_code` bold**', 
      expected: '<div><del><span class="syntax-marker">~~</span>strike<span class="syntax-marker">~~</span></del> <code><span class="syntax-marker">`</span>code_here<span class="syntax-marker">`</span></code> <strong><span class="syntax-marker">**</span>bold <code><span class="syntax-marker">`</span>spanning_code<span class="syntax-marker">`</span></code> bold<span class="syntax-marker">**</span></strong></div>',
      description: 'Should handle strikethrough with other formatting types and code'
    }
    // TODO: Known issue - inline code inside link text gets replaced with placeholder
    // This is a complex issue with the placeholder system that needs to be fixed later
    // {
    //   input: '[Link `with_code` text](url) and `regular_code`',
    //   expected: '<div><a href="#" data-href="url" style="anchor-name: --link-0"><span class="syntax-marker">[</span>Link <code><span class="syntax-marker">`</span>with_code<span class="syntax-marker">`</span></code> text<span class="syntax-marker url-part">](url)</span></a> and <code><span class="syntax-marker">`</span>regular_code<span class="syntax-marker">`</span></code></div>',
    //   description: 'Should handle links spanning code blocks'
    // }
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
    },
    {
      input: '`~~not_strikethrough~~`',
      expected: '<div><code><span class="syntax-marker">`</span>~~not_strikethrough~~<span class="syntax-marker">`</span></code></div>',
      description: 'Should not process strikethrough markers inside code'
    },
    {
      input: '`~also_not_strikethrough~`',
      expected: '<div><code><span class="syntax-marker">`</span>~also_not_strikethrough~<span class="syntax-marker">`</span></code></div>',
      description: 'Should not process single tilde strikethrough markers inside code'
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
    assert(htmlEqual(actual, test.expected), `Multi-backtick: ${test.input}`, 'Should handle equal backtick matching');
  });
})();

// ===== Integration Tests =====
console.log('\n🔧 Integration Tests\n');

// Test: Complex nested markdown
(() => {
  const input = '## This has **bold**, *italic*, `code`, and [links](url) all together!';
  const actual = MarkdownParser.parseLine(input);
  assert(actual.includes('<h2>'), 'Complex: header', 'Should parse header');
  assert(actual.includes('<strong>'), 'Complex: bold', 'Should parse bold');
  assert(actual.includes('<em>'), 'Complex: italic', 'Should parse italic');
  assert(actual.includes('<code>'), 'Complex: code', 'Should parse code');
  assert(actual.includes('<a href="url"'), 'Complex: link', 'Should parse link');
})();

// Test: Complex nested markdown with strikethrough
(() => {
  const input = '## This has **bold**, *italic*, ~~strikethrough~~, `code`, and formatting!';
  const actual = MarkdownParser.parseLine(input);
  assert(actual.includes('<h2>'), 'Complex with strikethrough: header', 'Should parse header');
  assert(actual.includes('<strong>'), 'Complex with strikethrough: bold', 'Should parse bold');
  assert(actual.includes('<em>'), 'Complex with strikethrough: italic', 'Should parse italic');
  assert(actual.includes('<del>'), 'Complex with strikethrough: strikethrough', 'Should parse strikethrough');
  assert(actual.includes('<code>'), 'Complex with strikethrough: code', 'Should parse code');
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
    // Sanitize output to avoid terminal issues with "javascript:" URLs
    const safeLabel = test.substring(0, 20).replace(/:/g, '[:]');
    assert(!actual.includes('<script'), `XSS prevention: ${safeLabel}...`, 'Should escape dangerous HTML');
    assert(!actual.includes('<img src=x onerror='), `XSS prevention events: ${safeLabel}...`, 'Should escape event handlers');
    assert(actual.includes('&lt;') || !test.includes('<'), `XSS escaping: ${safeLabel}...`, 'Should escape HTML tags');
  });
})();

// ===== Character Alignment Tests =====
console.log('\n🔤 Character Alignment Tests\n');

// Test: HTML entities must NOT appear in visible text (breaks alignment)
(() => {
  const input = `Testing > and < and & characters`;
  const parsed = MarkdownParser.parse(input);
  
  // Create a temporary element to extract text content
  if (typeof document !== 'undefined') {
    const temp = document.createElement('div');
    temp.innerHTML = parsed;
    const visibleText = temp.textContent;
    
    assert(
      visibleText === input,
      'Special characters maintain 1:1 alignment',
      `Alignment broken! Input: "${input}" (${input.length} chars) vs Visible: "${visibleText}" (${visibleText.length} chars)`
    );
  } else {
    // In Node, we expect HTML entities in the output for safety
    // They will render as single characters in the browser
    assert(
      parsed.includes('&gt;') && parsed.includes('&lt;') && parsed.includes('&amp;'),
      'HTML entities should be escaped for safety',
      `Expected escaped entities in HTML: ${parsed}`
    );
  }
})();

// Test: Code blocks with < > & must maintain character alignment
(() => {
  const input = `\`\`\`
if (x > 5 && y < 10) {
  return x & y;
}
\`\`\``;
  
  const parsed = MarkdownParser.parse(input);
  
  // The VISIBLE characters must match input exactly
  // Even though the HTML might contain &gt; &lt; &amp; for safety,
  // the actual text nodes should contain the real characters
  // OR the entities should be rendered as single characters
  
  // Check that code block content is properly escaped in HTML
  const hasCodeBlock = parsed.includes('<code');
  const hasEscapedEntities = parsed.includes('&gt;') && parsed.includes('&lt;') && parsed.includes('&amp;');
  
  assert(
    hasCodeBlock && hasEscapedEntities,
    'Code blocks escape HTML entities for safety',
    `Code blocks should escape < > & for HTML safety. Got: ${parsed.substring(0, 200)}`
  );
  
  // But the critical test: when rendered, it must be the right character count
  if (typeof document !== 'undefined') {
    const temp = document.createElement('div');
    temp.innerHTML = parsed;
    const visibleText = temp.textContent;
    const inputLines = input.split('\n');
    const visibleLines = visibleText.split('\n');
    
    // Each line must have the same character count
    inputLines.forEach((inputLine, i) => {
      const visibleLine = visibleLines[i] || '';
      assert(
        inputLine.length === visibleLine.length,
        `Line ${i + 1} character alignment`,
        `Line ${i + 1} alignment broken! Input: "${inputLine}" (${inputLine.length}) vs Visible: "${visibleLine}" (${visibleLine.length})`
      );
    });
  }
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