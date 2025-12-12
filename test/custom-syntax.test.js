/**
 * Custom Syntax Tests
 * Tests the setCustomSyntax() API for extending markdown parsing
 */

import { JSDOM } from 'jsdom';
import { MarkdownParser } from '../src/parser.js';

console.log('\n🔧 Running Custom Syntax Tests...\n');

const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
global.document = dom.window.document;

// Helper: Convert HTML to text (like browser does)
function htmlToText(html) {
  const div = document.createElement('div');
  div.innerHTML = html;
  return div.textContent;
}

// Helper: Verify character alignment is preserved
function verifyAlignment(original, html, testName) {
  const rendered = htmlToText(html);
  if (rendered.length !== original.length) {
    throw new Error(
      `${testName}: Character count mismatch - original ${original.length}, rendered ${rendered.length}`
    );
  }
  if (rendered !== original) {
    for (let i = 0; i < Math.min(rendered.length, original.length); i++) {
      if (rendered[i] !== original[i]) {
        throw new Error(
          `${testName}: Content mismatch at position ${i}\n` +
          `  Original char: ${JSON.stringify(original[i])}\n` +
          `  Rendered char: ${JSON.stringify(rendered[i])}`
        );
      }
    }
  }
}

let passedTests = 0;
let totalTests = 0;

function runTest(name, fn) {
  totalTests++;
  try {
    fn();
    console.log(`  ✅ ${name}`);
    passedTests++;
  } catch (error) {
    console.log(`  ❌ ${name}`);
    console.log(`     Error: ${error.message}`);
  }
}

// Clean up before each test suite
function cleanup() {
  MarkdownParser.setCustomSyntax(null);
}

console.log('📋 Test Suite: Basic Custom Syntax\n');

runTest('Custom syntax processor is applied to parsed output', () => {
  cleanup();
  MarkdownParser.setCustomSyntax((html) => {
    return html.replace(/\[\^(\w+)\]/g, '<span class="footnote">$&</span>');
  });

  const markdown = 'Text with footnote[^1] here.';
  const html = MarkdownParser.parse(markdown);

  if (!html.includes('class="footnote"')) {
    throw new Error('Custom syntax not applied: ' + html);
  }
  if (!html.includes('[^1]')) {
    throw new Error('Original text should be preserved');
  }

  cleanup();
});

runTest('Custom syntax can be cleared with null', () => {
  cleanup();
  MarkdownParser.setCustomSyntax((html) => {
    return html.replace(/TEST/g, '<b>TEST</b>');
  });

  let html = MarkdownParser.parse('TEST');
  if (!html.includes('<b>TEST</b>')) throw new Error('Should apply custom syntax');

  MarkdownParser.setCustomSyntax(null);
  html = MarkdownParser.parse('TEST');
  if (html.includes('<b>TEST</b>')) throw new Error('Should not apply after clearing');

  cleanup();
});

runTest('Custom syntax does not apply inside code blocks', () => {
  cleanup();
  MarkdownParser.setCustomSyntax((html) => {
    return html.replace(/\[\^1\]/g, '<span class="fn">$&</span>');
  });

  const markdown = '```\n[^1]\n```';
  const html = MarkdownParser.parse(markdown);

  // Code blocks are not processed by custom syntax (they bypass parseLine)
  if (html.includes('class="fn"')) {
    throw new Error('Custom syntax should not apply inside code blocks');
  }

  cleanup();
});

console.log('\n📋 Test Suite: Character Alignment\n');

runTest('Footnote references preserve alignment', () => {
  cleanup();
  MarkdownParser.setCustomSyntax((html) => {
    return html.replace(/\[\^(\w+)\]/g, '<span class="fn">$&</span>');
  });

  const original = 'Here is text[^1] with footnote[^note] refs.';
  const html = MarkdownParser.parse(original);
  verifyAlignment(original, html, 'Footnote alignment');

  cleanup();
});

runTest('Hashtags preserve alignment', () => {
  cleanup();
  MarkdownParser.setCustomSyntax((html) => {
    return html.replace(/(^|[^&\w])#([\w-]+)/g, '$1<span class="tag">#$2</span>');
  });

  const original = 'Check out #overtype and #markdown tags.';
  const html = MarkdownParser.parse(original);
  verifyAlignment(original, html, 'Hashtag alignment');

  cleanup();
});

runTest('Mentions preserve alignment', () => {
  cleanup();
  MarkdownParser.setCustomSyntax((html) => {
    return html.replace(/(^|[^\w])@([\w-]+)/g, '$1<span class="mention">@$2</span>');
  });

  const original = 'Thanks to @david and @anthropic for help.';
  const html = MarkdownParser.parse(original);
  verifyAlignment(original, html, 'Mention alignment');

  cleanup();
});

runTest('Highlight marks preserve alignment', () => {
  cleanup();
  MarkdownParser.setCustomSyntax((html) => {
    return html.replace(/==([^=]+)==/g, '<mark>$&</mark>');
  });

  const original = 'This is ==very important== text.';
  const html = MarkdownParser.parse(original);
  verifyAlignment(original, html, 'Highlight alignment');

  cleanup();
});

runTest('Wiki links preserve alignment', () => {
  cleanup();
  MarkdownParser.setCustomSyntax((html) => {
    return html.replace(/\[\[([^\]]+)\]\]/g, '<span class="wiki">$&</span>');
  });

  const original = 'See [[Getting Started]] and [[API Reference]] pages.';
  const html = MarkdownParser.parse(original);
  verifyAlignment(original, html, 'Wiki link alignment');

  cleanup();
});

runTest('Directives preserve alignment', () => {
  cleanup();
  MarkdownParser.setCustomSyntax((html) => {
    return html.replace(/::([\w-]+)(\[[^\]]*\])?(\{[^}]*\})?/g, '<span class="directive">$&</span>');
  });

  const original = '::youtube[Video title]{#abc123}';
  const html = MarkdownParser.parse(original);
  verifyAlignment(original, html, 'Directive alignment');

  cleanup();
});

console.log('\n📋 Test Suite: Chained Processors\n');

runTest('Multiple patterns can be chained in one processor', () => {
  cleanup();
  MarkdownParser.setCustomSyntax((html) => {
    return html
      .replace(/\[\^(\w+)\]/g, '<span class="fn">$&</span>')
      .replace(/#(\w+)/g, '<span class="tag">$&</span>')
      .replace(/@(\w+)/g, '<span class="mention">$&</span>');
  });

  const markdown = 'Check #tag by @user with footnote[^1].';
  const html = MarkdownParser.parse(markdown);

  if (!html.includes('class="fn"')) throw new Error('Footnote not applied');
  if (!html.includes('class="tag"')) throw new Error('Tag not applied');
  if (!html.includes('class="mention"')) throw new Error('Mention not applied');

  cleanup();
});

console.log('\n📋 Test Suite: Interaction with Standard Markdown\n');

runTest('Custom syntax works alongside bold/italic', () => {
  cleanup();
  MarkdownParser.setCustomSyntax((html) => {
    return html.replace(/#(\w+)/g, '<span class="tag">$&</span>');
  });

  const markdown = 'Check **bold** and #hashtag and *italic*.';
  const html = MarkdownParser.parse(markdown);

  if (!html.includes('<strong>')) throw new Error('Bold not parsed');
  if (!html.includes('<em>')) throw new Error('Italic not parsed');
  if (!html.includes('class="tag"')) throw new Error('Custom tag not applied');

  cleanup();
});

runTest('Custom syntax works alongside links', () => {
  cleanup();
  MarkdownParser.setCustomSyntax((html) => {
    return html.replace(/\[\^(\w+)\]/g, '<span class="fn">$&</span>');
  });

  const markdown = 'See [link](https://example.com) and footnote[^1].';
  const html = MarkdownParser.parse(markdown);

  if (!html.includes('<a href=')) throw new Error('Link not parsed');
  if (!html.includes('class="fn"')) throw new Error('Footnote not applied');

  cleanup();
});

runTest('Custom syntax works on header lines', () => {
  cleanup();
  MarkdownParser.setCustomSyntax((html) => {
    return html.replace(/#(\w+)/g, '<span class="tag">#$1</span>');
  });

  const markdown = '# Heading with #tag';
  const html = MarkdownParser.parse(markdown);

  if (!html.includes('<h1>')) throw new Error('Header not parsed');
  // Note: the # in #tag should be tagged, not the header #
  if (!html.includes('class="tag"')) throw new Error('Tag in header not applied');

  cleanup();
});

console.log('\n📋 Test Suite: Edge Cases\n');

runTest('Empty processor function does not break parsing', () => {
  cleanup();
  MarkdownParser.setCustomSyntax((html) => html);

  const markdown = '# Hello **world**';
  const html = MarkdownParser.parse(markdown);

  if (!html.includes('<h1>')) throw new Error('Header not parsed');
  if (!html.includes('<strong>')) throw new Error('Bold not parsed');

  cleanup();
});

runTest('Processor receives HTML, not raw markdown', () => {
  cleanup();
  let receivedHtml = '';
  MarkdownParser.setCustomSyntax((html) => {
    receivedHtml = html;
    return html;
  });

  MarkdownParser.parse('**bold**');

  if (!receivedHtml.includes('<strong>')) {
    throw new Error('Processor should receive parsed HTML, got: ' + receivedHtml);
  }

  cleanup();
});

runTest('Multiline content each line processed', () => {
  cleanup();
  let lineCount = 0;
  MarkdownParser.setCustomSyntax((html) => {
    lineCount++;
    return html;
  });

  MarkdownParser.parse('Line 1\nLine 2\nLine 3');

  if (lineCount !== 3) {
    throw new Error(`Expected 3 lines processed, got ${lineCount}`);
  }

  cleanup();
});

// Summary
console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
console.log('📊 Test Results Summary\n');

const successRate = ((passedTests / totalTests) * 100).toFixed(1);
console.log(`✅ Passed: ${passedTests}`);
console.log(`❌ Failed: ${totalTests - passedTests}`);
console.log(`📈 Total:  ${totalTests}`);
console.log(`🎯 Success Rate: ${successRate}%\n`);

if (passedTests < totalTests) {
  console.log(`⚠️  ${totalTests - passedTests} test(s) failed.`);
  process.exit(1);
} else {
  console.log('✨ All custom syntax tests passed!\n');
}
