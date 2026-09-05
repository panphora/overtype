import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  classificationSnapshot,
  classify,
  corpus,
  runAdapter
} from './helpers/commonmark-harness.js';
import { blockAdapters } from './commonmark/sections/blocks.js';
import { codeSpanAdapter, emphasisAdapter } from './commonmark/sections/inline.js';
import { linksAdapter } from './commonmark/sections/links.js';
import { sectionPolicy } from './commonmark/sections/policy.js';

const adapters = [
  ...blockAdapters,
  codeSpanAdapter,
  emphasisAdapter,
  linksAdapter
];

assert.equal(sectionPolicy.length, 26, 'CommonMark section policy count');
assert.equal(sectionPolicy.reduce((sum, section) => sum + section.count, 0), 652, 'CommonMark policy fixture count');
assert.equal(sectionPolicy.filter(section => section.treatment === 'semantic').reduce((sum, section) => sum + section.count, 0), 409);
assert.equal(sectionPolicy.filter(section => section.treatment === 'excluded').reduce((sum, section) => sum + section.count, 0), 186);
assert.equal(sectionPolicy.filter(section => section.treatment === 'universal').reduce((sum, section) => sum + section.count, 0), 57);

for (const policy of sectionPolicy) {
  assert.equal(
    corpus.filter(example => example.section === policy.section).length,
    policy.count,
    `CommonMark policy section ${policy.section}`
  );
}

assert.deepEqual(
  adapters.map(adapter => adapter.section).sort(),
  sectionPolicy.filter(section => section.treatment === 'semantic').map(section => section.section).sort(),
  'Every semantic section has one adapter'
);

for (const adapter of adapters) {
  const result = runAdapter(adapter);
  console.log(`✓ ${adapter.section}: ${result.assertions} semantic assertions`);
}

const currentSnapshot = classificationSnapshot(adapters);
const committedSnapshot = JSON.parse(readFileSync(new URL('./fixtures/commonmark-deviations.json', import.meta.url)));
assert.deepEqual(currentSnapshot, committedSnapshot, 'CommonMark deviation snapshot');

const originalLinkExamples = corpus.filter(example => example.number >= 482 && example.number <= 526);
const originalLinkOutcomes = originalLinkExamples.map(example => classify(linksAdapter, example).outcome);
assert.equal(originalLinkOutcomes.filter(outcome => outcome === 'conform').length, 34);
assert.equal(originalLinkOutcomes.filter(outcome => outcome !== 'conform').length, 11);

console.log('✓ all 652 fixtures are assigned to one CommonMark policy section');
console.log('✓ all 409 advertised feature fixtures have a semantic outcome');
console.log('✓ the original 34 matching and 11 excluded inline link examples are unchanged');
