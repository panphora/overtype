import assert from 'node:assert/strict';
import { MarkdownParser } from '../src/parser.js';
import { rootFromHtml } from './helpers/dom.js';

function blockSignature(html) {
  const root = rootFromHtml(html);
  return {
    tags: [...root.querySelectorAll('h1, h2, h3, ul, ol, li, pre, code, .blockquote, .hr-marker')]
      .map(element => `${element.tagName}:${element.className}`),
    fences: [...root.querySelectorAll('.code-fence')].map(element => element.textContent),
    code: [...root.querySelectorAll('pre > code')].map(element => ({
      className: element.className,
      text: element.textContent
    }))
  };
}

const lone = rootFromHtml(MarkdownParser.parse('```'));
assert.equal(lone.querySelectorAll('.code-fence').length, 1);
assert.equal(lone.querySelectorAll('pre').length, 0);

const unmatched = rootFromHtml(MarkdownParser.parse('````js\nconst x = 1;\n```'));
assert.equal(unmatched.querySelectorAll('.code-fence').length, 1);
assert.equal(unmatched.querySelector('pre > code').textContent, 'const x = 1;\n```');

const closed = rootFromHtml(MarkdownParser.parse('````js\nconst x = 1;\n`````'));
assert.equal(closed.querySelectorAll('.code-fence').length, 2);
assert.equal(closed.querySelector('pre > code').textContent, 'const x = 1;');

const parsed = MarkdownParser.parse('```js\nconst x = 1;\n```');
assert.deepEqual(blockSignature(MarkdownParser.postProcessHTML(parsed)), blockSignature(parsed));
assert.equal(rootFromHtml(MarkdownParser.postProcessHTML(parsed)).querySelector('pre > code').textContent, 'const x = 1;');

const activeSource = '```js\nconst x = 1;\n```\nSome **text** and a [link](https://x.com).';
for (const activeLine of [0, 1, 2]) {
  const root = rootFromHtml(MarkdownParser.parse(activeSource, activeLine, true));
  assert.equal(root.querySelectorAll('.code-fence').length, 2);
  assert.equal(root.querySelector('pre > code').textContent, 'const x = 1;');
  assert.equal(root.querySelectorAll('.raw-line').length, 1);
  assert.equal(root.querySelector('strong').textContent, '**text**');
  assert.equal(root.querySelector('a').getAttribute('href'), 'https://x.com');
}

assert.equal(
  rootFromHtml(MarkdownParser.parse(activeSource, 1, true)).querySelector('pre .raw-line').textContent,
  'const x = 1;'
);

console.log('✓ block assembly is idempotent and active raw lines preserve fence state');
console.log('✓ lone, unmatched, and length matched backtick fences keep canonical behavior');
