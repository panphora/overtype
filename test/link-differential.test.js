import assert from 'node:assert/strict';
import { Parser } from 'commonmark';
import { MarkdownParser } from '../src/parser.js';

const parser = new Parser();
let state = 0x1220cafe;

function random() {
  state = (state * 1664525 + 1013904223) >>> 0;
  return state / 0x100000000;
}

function pick(values) {
  return values[Math.floor(random() * values.length)];
}

function word() {
  const alphabet = 'abcdefghijklmnopqrstuvwxyz';
  const length = 2 + Math.floor(random() * 8);
  let value = '';
  for (let index = 0; index < length; index++) value += pick(alphabet);
  return value;
}

function referenceLinks(markdown) {
  const links = [];
  const walker = parser.parse(markdown).walker();
  let event;

  while ((event = walker.next())) {
    if (event.entering && event.node.type === 'link') {
      links.push({
        destination: decodeURIComponent(event.node.destination),
        title: event.node.title || null
      });
    }
  }

  return links;
}

function sourceLink() {
  const first = word();
  const second = word();
  const label = `${first} ${second}`;
  const destination = pick([
    `/${first}/${second}.pdf`,
    `${first}(${second})`,
    `${first}\\(${second}\\)`,
    `<${first} ${second}>`,
    `https://example.test/${first}?a=1&b=${second}`,
    `${first}\\)${second}`
  ]);
  const title = pick([
    '',
    ` "${first} (${second})"`,
    ` '${first} "${second}"'`,
    ` (${first} ${second})`
  ]);
  return `[${label}](${destination}${title})`;
}

for (let index = 0; index < 500; index++) {
  const markdown = `${word()} ${sourceLink()} ${word()}`;
  const expected = referenceLinks(markdown);
  const actual = MarkdownParser.findRenderableLinks(markdown).map(link => ({
    destination: link.destination.value,
    title: link.title?.value ?? null
  }));

  assert.deepEqual(actual, expected, `generated case ${index}: ${markdown}`);
}

console.log('✓ 500 generated link cases match the CommonMark reference parser');
