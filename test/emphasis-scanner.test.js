import assert from 'node:assert/strict';
import { findEmphasis, renderEmphasis } from '../src/emphasis-scanner.js';
import { MarkdownParser } from '../src/parser.js';
import { rootFromHtml } from './helpers/dom.js';

const cases = [
  ['*foo*', ['em']],
  ['**foo**', ['strong']],
  ['***foo***', ['em', 'strong']],
  ['**foo *bar* baz**', ['strong', 'em']],
  ['foo_bar_baz', []],
  ['foo*bar*baz', ['em']],
  ['**foo*', ['em']],
  ['\\*foo*', []],
  ['a***b**c*', ['em', 'strong']]
];

for (const [source, types] of cases) {
  assert.deepEqual(findEmphasis(source).map(match => match.type), types, `emphasis delimiters ${source}`);
  const root = rootFromHtml(renderEmphasis(source));
  assert.equal(root.textContent, source, `emphasis source text ${source}`);
}

assert.match(renderEmphasis('<del>*foo*</del>'), /<del><em>/);

const transition = rootFromHtml(renderEmphasis('*a***b**'));
assert.deepEqual(
  [...transition.children].map(element => element.tagName),
  ['EM', 'STRONG'],
  'a delimiter run can close emphasis and then open strong emphasis'
);

const codeBoundary = rootFromHtml(MarkdownParser.parseLine('baa*` _`*b'));
assert.equal(codeBoundary.querySelector('em, strong'), null, 'code span placeholders keep punctuation flanking');

const indented = rootFromHtml(MarkdownParser.parseLine(' **.*'));
assert.equal(indented.querySelectorAll('em').length, 1, 'leading indentation keeps whitespace flanking');

const astralSymbol = rootFromHtml(MarkdownParser.parseLine('a*😀 b*'));
assert.equal(astralSymbol.querySelector('em, strong'), null, 'astral Unicode symbols count as punctuation');

console.log('✓ emphasis delimiter runs cover nesting, flanking, escapes, and rule of three cases');
