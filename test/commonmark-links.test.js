import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import { tests as commonmarkTests } from 'commonmark-spec';
import { MarkdownParser } from '../src/parser.js';

const supported = new Set([
  482, 483, 488, 489, 490, 491, 492, 493, 494, 495, 496, 497, 498,
  499, 500, 501, 502, 504, 505, 507, 508, 509, 511, 512, 513, 514,
  515, 516, 518, 519, 521, 522, 523, 525
]);

const intentionalDeviations = new Map([
  [484, 'OverType requires visible link text'],
  [485, 'OverType requires a nonempty destination'],
  [486, 'OverType requires a nonempty destination'],
  [487, 'OverType requires visible link text and a nonempty destination'],
  [503, 'OverType preserves character references instead of resolving them'],
  [506, 'OverType preserves character references instead of resolving them'],
  [510, 'OverType parses inline markup one source line at a time'],
  [517, 'OverType does not render Markdown image syntax as images'],
  [520, 'OverType does not render Markdown image syntax as images'],
  [524, 'OverType does not implement CommonMark raw HTML precedence'],
  [526, 'OverType does not implement CommonMark autolinks']
]);

const linkExamples = commonmarkTests.filter(test => test.number >= 482 && test.number <= 526);

assert.equal(linkExamples.length, supported.size + intentionalDeviations.size);
assert.ok(linkExamples.every(example => example.section === 'Links'));

for (const example of linkExamples) {
  assert.ok(
    supported.has(example.number) || intentionalDeviations.has(example.number),
    `CommonMark example ${example.number} is not classified`
  );
}

function decodeDestination(destination) {
  try {
    return decodeURIComponent(destination);
  } catch {
    return destination;
  }
}

function linksFromHtml(html) {
  const dom = new JSDOM(html);
  return [...dom.window.document.querySelectorAll('a')].map(anchor => ({
    destination: decodeDestination(anchor.getAttribute('href')),
    title: anchor.getAttribute('title')
  }));
}

for (const example of linkExamples.filter(test => supported.has(test.number))) {
  const expected = linksFromHtml(example.html);
  const recognized = MarkdownParser.findRenderableLinks(example.markdown.replace(/\n$/, '')).map(link => ({
    destination: link.destination.value,
    title: link.title?.value ?? null
  }));
  const actualDom = new JSDOM(MarkdownParser.parse(example.markdown.replace(/\n$/, '')));
  const actual = [...actualDom.window.document.querySelectorAll('a')].map(anchor => ({
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
    const lineDom = new JSDOM(MarkdownParser.parseLine(line));
    const visibleText = lineDom.window.document.body.textContent;
    assert.equal(visibleText === '\u00a0' ? '' : visibleText, line, `CommonMark source text example ${example.number}`);
  }
}

console.log(`✓ ${supported.size} CommonMark link examples match`);
console.log(`✓ ${intentionalDeviations.size} CommonMark link examples have explicit deviations`);
