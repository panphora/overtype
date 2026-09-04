import assert from 'node:assert/strict';
import { findLinks, findRenderableLinks } from '../src/link-scanner.js';
import { MarkdownParser } from '../src/parser.js';

const tests = [];

function test(name, run) {
  tests.push({ name, run });
}

test('scans a destination followed by a parenthesized title', () => {
  const source = '[best document](/path/to/my/file.pdf "PDF document of 42 MB (very nice)")';
  const [link] = findLinks(source);

  assert.equal(link.text.raw, 'best document');
  assert.equal(link.destination.value, '/path/to/my/file.pdf');
  assert.equal(link.title.value, 'PDF document of 42 MB (very nice)');
  assert.equal(source.slice(link.start, link.end), source);
});

test('keeps raw indices while reading parser escaped entities', () => {
  const source = '[x](https://example.com?a=1&amp;b=2 &quot;A &amp; B&quot;)';
  const [link] = findLinks(source, { htmlEntities: true });

  assert.equal(link.destination.value, 'https://example.com?a=1&b=2');
  assert.equal(link.title.value, 'A & B');
  assert.equal(source.slice(link.destination.start, link.destination.end), 'https://example.com?a=1&amp;b=2');
});

test('supports nested and escaped destination parentheses', () => {
  const [nested] = findLinks('[x](docs/(draft)/file.pdf)');
  const [escaped] = findLinks('[x](docs/\(draft\)/file.pdf)');

  assert.equal(nested.destination.value, 'docs/(draft)/file.pdf');
  assert.equal(escaped.destination.value, 'docs/(draft)/file.pdf');
});

test('supports angle bracket destinations and all title delimiters', () => {
  const links = findLinks('[a](<a path> "one") [b](b \'two\') [c](c (three))');

  assert.deepEqual(
    links.map(link => [link.destination.value, link.title.value]),
    [['a path', 'one'], ['b', 'two'], ['c', 'three']]
  );
});

test('rejects malformed link tails', () => {
  assert.equal(findLinks('[x](a b)').length, 0);
  assert.equal(findLinks('[x](a "unterminated)').length, 0);
  assert.equal(findLinks('[x](a(and)').length, 0);
  assert.equal(findLinks('[x] (/a)').length, 0);
});

test('keeps OverType empty link behavior explicit', () => {
  assert.equal(findLinks('[](target)').length, 1);
  assert.equal(findLinks('[label]()').length, 1);
  assert.equal(MarkdownParser.findLinks('[](target)').length, 0);
  assert.equal(MarkdownParser.findLinks('[label]()').length, 0);
});

test('ignores links in inline and fenced code', () => {
  const source = '`[inline](bad)` [first](one)\n```js\n[fenced](bad)\n```\n[second](two)';
  const links = findRenderableLinks(source);

  assert.deepEqual(links.map(link => link.destination.value), ['one', 'two']);
});

test('preserves inline code inside link labels', () => {
  const [link] = findRenderableLinks('[`code` label](target)');

  assert.equal(link.text.raw, '`code` label');
  assert.equal(link.destination.value, 'target');
});

test('does not treat backticks inside a destination as code delimiters', () => {
  const source = '[x](a`b) and `code` [y](z)';
  const links = findRenderableLinks(source);

  assert.deepEqual(links.map(link => link.destination.value), ['a`b', 'z']);
});

test('handles escaped brackets in and before labels', () => {
  assert.equal(findRenderableLinks('\\[not](x)').length, 0);
  assert.equal(findRenderableLinks('[a\\]b](c)')[0].text.raw, 'a\\]b');
});

test('matches code spans by maximal backtick run length', () => {
  const source = '`x``[not a link](secret)`';

  assert.equal(findRenderableLinks(source).length, 0);
});

test('does not open code spans from escaped backticks', () => {
  const source = '\\`not code` [link](target)';

  assert.deepEqual(findRenderableLinks(source).map(link => link.destination.value), ['target']);
});

test('converges when code inside a label exposes a later link', () => {
  const source = '[a `]` b](c`d) [f](g) x`';

  assert.deepEqual(findRenderableLinks(source).map(link => link.destination.value), ['c`d', 'g']);
});

let failed = 0;
for (const { name, run } of tests) {
  try {
    run();
    console.log(`✓ ${name}`);
  } catch (error) {
    failed++;
    console.error(`✗ ${name}`);
    console.error(error);
  }
}

console.log(`\n${tests.length - failed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
