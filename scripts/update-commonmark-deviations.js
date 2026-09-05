import { writeFileSync } from 'node:fs';
import { classificationSnapshot } from '../test/helpers/commonmark-harness.js';
import { blockAdapters } from '../test/commonmark/sections/blocks.js';
import { codeSpanAdapter, emphasisAdapter } from '../test/commonmark/sections/inline.js';
import { linksAdapter } from '../test/commonmark/sections/links.js';

const snapshot = classificationSnapshot([
  ...blockAdapters,
  codeSpanAdapter,
  emphasisAdapter,
  linksAdapter
]);
const target = new URL('../test/fixtures/commonmark-deviations.json', import.meta.url);
const json = JSON.stringify(snapshot, null, 2).replace(/\[\n((?:\s+\d+,?\n)+)\s+\]/g, array =>
  `[${[...array.matchAll(/\d+/g)].map(match => match[0]).join(', ')}]`
);
writeFileSync(target, `${json}\n`);
console.log('Updated test/fixtures/commonmark-deviations.json');
