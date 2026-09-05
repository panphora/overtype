import assert from 'node:assert/strict';
import { tests as commonmarkTests } from 'commonmark-spec';
import { rootFromHtml, textWithoutMarkers } from './dom.js';
import { MarkdownParser } from '../../src/parser.js';

export const corpus = commonmarkTests;

export function markdownSource(example) {
  return example.markdown.endsWith('\n') ? example.markdown.slice(0, -1) : example.markdown;
}

export function normalizeInlineText(text) {
  return text.replace(/\\([!"#$%&'()*+,\-./:;<=>?@[\\\]^_`{|}~])/g, '$1');
}

export function referenceRoot(example) {
  return rootFromHtml(example.html);
}

export function overtypeRoot(example) {
  return rootFromHtml(MarkdownParser.parse(markdownSource(example)));
}

export function semanticText(element) {
  return normalizeInlineText(textWithoutMarkers(element));
}

export function classify(adapter, example) {
  for (const rule of adapter.rules ?? []) {
    if (!rule.when(example)) continue;
    const outcome = typeof rule.outcome === 'function' ? rule.outcome(example) : rule.outcome;
    return { outcome, reason: rule.name };
  }
  return { outcome: 'conform', reason: null };
}

export function classificationSnapshot(adapters) {
  const snapshot = {};

  for (const adapter of adapters) {
    const groups = {};
    for (const example of corpus.filter(item => item.section === adapter.section)) {
      const result = classify(adapter, example);
      if (result.outcome === 'conform') continue;
      const key = `${result.outcome}:${result.reason}`;
      if (!groups[key]) groups[key] = [];
      groups[key].push(example.number);
    }
    if (Object.keys(groups).length > 0) snapshot[adapter.section] = groups;
  }

  return snapshot;
}

export function runAdapter(adapter) {
  const examples = corpus.filter(example => example.section === adapter.section);
  assert.equal(examples.length, adapter.count, `${adapter.section} fixture count`);

  let assertions = 0;
  const outcomes = { conform: 0, partial: 0, deviation: 0 };

  for (const example of examples) {
    const classification = classify(adapter, example);
    outcomes[classification.outcome]++;
    assertions += adapter.assert(example, classification) ?? 0;
  }

  assert.ok(
    assertions >= adapter.minimumAssertions,
    `${adapter.section} semantic floor: expected at least ${adapter.minimumAssertions}, got ${assertions}`
  );

  return { assertions, outcomes };
}
