import assert from 'node:assert/strict';
import { tests as commonmarkTests } from 'commonmark-spec';
import { MarkdownParser } from '../src/parser.js';
import {
  extractVisualLines,
  rootFromHtml,
  visibleLineText
} from './helpers/dom.js';

const allowedTags = new Set([
  'A', 'CODE', 'DEL', 'DIV', 'EM', 'H1', 'H2', 'H3',
  'LI', 'OL', 'PRE', 'SPAN', 'STRONG', 'UL'
]);

function sourceLines(markdown) {
  return markdown.replace(/\n$/, '').split('\n');
}

function normalizeVisualLine(line, sourceLine) {
  if (sourceLine === '' && (line === '' || line === '\u00a0')) return '';

  const leadingSpaces = sourceLine.match(/^ */)[0].length;
  let normalized = line;
  for (let index = 0; index < leadingSpaces && normalized[index] === '\u00a0'; index++) {
    normalized = normalized.slice(0, index) + ' ' + normalized.slice(index + 1);
  }
  return normalized;
}

for (const example of commonmarkTests) {
  const lines = sourceLines(example.markdown);

  for (const line of lines) {
    assert.equal(
      visibleLineText(MarkdownParser.parseLine(line), line),
      line,
      `CommonMark source line example ${example.number}`
    );
  }

  const html = MarkdownParser.parse(lines.join('\n'));
  const visualLines = extractVisualLines(html).map((line, index) =>
    normalizeVisualLine(line, lines[index] ?? '')
  );
  assert.deepEqual(visualLines, lines, `CommonMark visual rows example ${example.number}`);

  const root = rootFromHtml(html);
  for (const element of root.querySelectorAll('*')) {
    assert.ok(allowedTags.has(element.tagName), `CommonMark safe tag example ${example.number}: ${element.tagName}`);
    for (const attribute of element.getAttributeNames()) {
      assert.ok(!attribute.toLowerCase().startsWith('on'), `CommonMark event attribute example ${example.number}: ${attribute}`);
    }
  }

  for (const anchor of root.querySelectorAll('a')) {
    const href = anchor.getAttribute('href');
    assert.equal(MarkdownParser.sanitizeUrl(href), href, `CommonMark safe href example ${example.number}`);
  }
}

const exclusionAssertions = {
  'Setext headings': root => root.querySelectorAll('h1, h2').length === 0,
  'Indented code blocks': root => root.querySelectorAll('pre').length === 0,
  'HTML blocks': root => [...root.querySelectorAll('*')].every(element => allowedTags.has(element.tagName)),
  'Link reference definitions': root => root.querySelectorAll('a').length === 0,
  Images: root => root.querySelectorAll('img').length === 0,
  Autolinks: root => root.querySelectorAll('a').length === 0,
  'Raw HTML': root => [...root.querySelectorAll('*')].every(element => allowedTags.has(element.tagName)),
  'Hard line breaks': root => root.querySelectorAll('br').length === 0
};

for (const [section, assertion] of Object.entries(exclusionAssertions)) {
  const examples = commonmarkTests.filter(example => example.section === section);
  assert.ok(examples.length > 0, `CommonMark exclusion section exists: ${section}`);

  for (const example of examples) {
    const root = rootFromHtml(MarkdownParser.parse(example.markdown.replace(/\n$/, '')));
    assert.ok(assertion(root), `CommonMark exclusion ${section} example ${example.number}`);
  }
}

assert.equal(commonmarkTests.length, 652);
console.log('✓ 652 CommonMark examples preserve source lines and visual rows');
console.log('✓ 652 CommonMark examples stay inside the safe DOM contract');
console.log('✓ unsupported CommonMark sections remain explicitly excluded');
