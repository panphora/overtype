import assert from 'node:assert/strict';
import {
  markdownSource,
  overtypeRoot,
  referenceRoot,
  semanticText
} from '../../helpers/commonmark-harness.js';

function emphasisSignature(root) {
  return [...root.querySelectorAll('em, strong')].map(element => {
    const ancestors = [];
    let parent = element.parentElement;
    while (parent) {
      if (parent.matches('em, strong')) ancestors.unshift(parent.tagName.toLowerCase());
      parent = parent.parentElement;
    }
    return {
      type: element.tagName.toLowerCase(),
      ancestors,
      text: semanticText(element)
    };
  });
}

function hasMultilineCodeSpan(markdown) {
  for (let index = 0; index < markdown.length;) {
    if (markdown[index] !== '`') {
      index++;
      continue;
    }

    const start = index;
    while (markdown[index] === '`') index++;
    const length = index - start;
    let cursor = index;
    let matchedEnd = null;

    while (cursor < markdown.length) {
      if (markdown[cursor] !== '`') {
        cursor++;
        continue;
      }
      const closeStart = cursor;
      while (markdown[cursor] === '`') cursor++;
      if (cursor - closeStart === length) {
        if (markdown.slice(index, closeStart).includes('\n')) return true;
        matchedEnd = cursor;
        break;
      }
    }

    if (matchedEnd !== null) index = matchedEnd;
  }
  return false;
}

function normalizeCodeText(text) {
  const normalized = text.replace(/\n/g, ' ');
  if (/^ .* $/.test(normalized) && /[^ ]/.test(normalized)) return normalized.slice(1, -1);
  return normalized;
}

function codeSignature(root, normalize = false) {
  return [...root.querySelectorAll('code')]
    .filter(element => !element.closest('pre'))
    .map(element => normalize ? normalizeCodeText(semanticText(element)) : semanticText(element));
}

const opaqueBackticks = example => {
  const source = markdownSource(example);
  const hasOpaqueSource = /<[A-Za-z][^>\n]*`[^>\n]*>/.test(source) ||
    /<(?:https?:\/\/|mailto:)[^>\n]*`[^>\n]*>/.test(source);
  return hasOpaqueSource && codeSignature(referenceRoot(example)).length === 0;
};

export const codeSpanAdapter = {
  section: 'Code spans',
  count: 22,
  minimumAssertions: 16,
  rules: [
    { name: 'multiline-inline-unsupported', outcome: 'deviation', when: example => hasMultilineCodeSpan(markdownSource(example)) },
    { name: 'raw-html-or-autolink-precedence-unsupported', outcome: 'deviation', when: opaqueBackticks }
  ],
  assert(example, classification) {
    if (classification.outcome === 'deviation') return 0;
    const expected = codeSignature(referenceRoot(example));
    const actual = codeSignature(overtypeRoot(example), true);
    assert.deepEqual(actual, expected, `CommonMark code spans example ${example.number}`);
    return 1;
  }
};

const hasMultilineEmphasis = example => {
  const source = markdownSource(example);
  return source.includes('\n') && [...referenceRoot(example).querySelectorAll('em, strong')]
    .some(element => element.textContent.includes('\n'));
};

const hasRawHtmlDelimiter = example => /<[A-Za-z][^>\n]*[*_][^>\n]*>/.test(markdownSource(example));
const hasAutolinkDelimiter = example => /<(?:https?:\/\/|mailto:)[^>\n]*[*_][^>\n]*>/.test(markdownSource(example));

export const emphasisAdapter = {
  section: 'Emphasis and strong emphasis',
  count: 132,
  minimumAssertions: 123,
  rules: [
    { name: 'multiline-inline-unsupported', outcome: 'deviation', when: hasMultilineEmphasis },
    { name: 'autolink-precedence-unsupported', outcome: 'deviation', when: hasAutolinkDelimiter },
    { name: 'raw-html-precedence-unsupported', outcome: 'deviation', when: hasRawHtmlDelimiter }
  ],
  assert(example, classification) {
    if (classification.outcome === 'deviation') return 0;
    assert.deepEqual(
      emphasisSignature(overtypeRoot(example)),
      emphasisSignature(referenceRoot(example)),
      `CommonMark emphasis example ${example.number}`
    );
    return 1;
  }
};
