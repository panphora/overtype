import assert from 'node:assert/strict';
import { tests as commonmarkTests } from 'commonmark-spec';
import { MarkdownParser } from '../src/parser.js';
import { rootFromHtml } from './helpers/dom.js';
import { classify } from './helpers/commonmark-harness.js';
import { linksAdapter } from './commonmark/sections/links.js';

const linkExamples = commonmarkTests.filter(test => test.number >= 482 && test.number <= 526);

const matching = linkExamples.filter(example => classify(linksAdapter, example).outcome === 'conform');
const intentionalDeviations = linkExamples.filter(example => classify(linksAdapter, example).outcome !== 'conform');

assert.equal(matching.length, 34);
assert.equal(intentionalDeviations.length, 11);
assert.ok(linkExamples.every(example => example.section === 'Links'));

function decodeDestination(destination) {
  try {
    return decodeURIComponent(destination);
  } catch {
    return destination;
  }
}

function linksFromHtml(html) {
  return [...rootFromHtml(html).querySelectorAll('a')].map(anchor => ({
    destination: decodeDestination(anchor.getAttribute('href')),
    title: anchor.getAttribute('title')
  }));
}

for (const example of matching) {
  const expected = linksFromHtml(example.html);
  const recognized = MarkdownParser.findRenderableLinks(example.markdown.replace(/\n$/, '')).map(link => ({
    destination: link.destination.value,
    title: link.title?.value ?? null
  }));
  const actualRoot = rootFromHtml(MarkdownParser.parse(example.markdown.replace(/\n$/, '')));
  const actual = [...actualRoot.querySelectorAll('a')].map(anchor => ({
    destination: anchor.getAttribute('href'),
    title: anchor.getAttribute('title')
  }));
  const renderedExpected = expected.map(link => ({
    ...link,
    destination: MarkdownParser.sanitizeUrl(link.destination)
  }));

  assert.deepEqual(recognized, expected, `CommonMark recognition example ${example.number}`);
  assert.deepEqual(actual, renderedExpected, `CommonMark rendering example ${example.number}`);

  for (const line of example.markdown.replace(/\n$/, '').split('\n')) {
    const visibleText = rootFromHtml(MarkdownParser.parseLine(line)).textContent;
    assert.equal(visibleText === '\u00a0' ? '' : visibleText, line, `CommonMark source text example ${example.number}`);
  }
}

console.log(`✓ ${matching.length} CommonMark link examples match`);
console.log(`✓ ${intentionalDeviations.length} CommonMark link examples have rule based deviations`);
