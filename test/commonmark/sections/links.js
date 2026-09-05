import assert from 'node:assert/strict';
import { MarkdownParser } from '../../../src/parser.js';
import {
  markdownSource,
  overtypeRoot,
  referenceRoot
} from '../../helpers/commonmark-harness.js';

function decodeDestination(destination) {
  try {
    return decodeURIComponent(destination);
  } catch {
    return destination;
  }
}

function linksFromRoot(root, sanitize = false) {
  return [...root.querySelectorAll('a')].map(anchor => {
    const destination = decodeDestination(anchor.getAttribute('href'));
    return {
      destination: sanitize ? MarkdownParser.sanitizeUrl(destination) : destination,
      title: anchor.getAttribute('title')
    };
  });
}

function scannedLinks(example) {
  return MarkdownParser.findRenderableLinks(markdownSource(example)).map(link => ({
    destination: link.destination.value,
    title: link.title?.value ?? null
  }));
}

const hasReferenceDefinitions = example => /^ {0,3}.*\]:[\t ]/m.test(markdownSource(example));

export const linksAdapter = {
  section: 'Links',
  count: 90,
  minimumAssertions: 36,
  rules: [
    {
      name: 'reference-links-unsupported',
      outcome: example => scannedLinks(example).length > 0 ? 'partial' : 'deviation',
      when: hasReferenceDefinitions
    },
    {
      name: 'images-unsupported',
      outcome: 'deviation',
      when: example => referenceRoot(example).querySelector('img') !== null
    },
    {
      name: 'empty-link-text-unsupported',
      outcome: 'deviation',
      when: example => [...referenceRoot(example).querySelectorAll('a')].some(anchor => anchor.textContent === '')
    },
    {
      name: 'empty-destination-unsupported',
      outcome: 'deviation',
      when: example => [...referenceRoot(example).querySelectorAll('a')].some(anchor => anchor.getAttribute('href') === '')
    },
    {
      name: 'character-reference-normalization-unsupported',
      outcome: 'deviation',
      when: example => /\([^\n)]*&(?:#\d+|#x[\da-f]+|[a-z][\da-z]+);[^\n)]*\)/i.test(markdownSource(example))
    },
    {
      name: 'multiline-inline-unsupported',
      outcome: 'deviation',
      when: example => referenceRoot(example).querySelector('a') !== null && /\[[^\]]*\]\([^)]*\n[^)]*\)/.test(markdownSource(example))
    },
    {
      name: 'raw-html-precedence-unsupported',
      outcome: 'deviation',
      when: example => /<[A-Za-z][^>\n]*[\t ][A-Za-z][^>\n]*>/.test(markdownSource(example))
    },
    {
      name: 'autolink-precedence-unsupported',
      outcome: 'deviation',
      when: example => /<(?:https?:\/\/|mailto:)[^>\n]*>/.test(markdownSource(example))
    }
  ],
  assert(example, classification) {
    if (classification.outcome === 'deviation') return 0;

    const recognized = scannedLinks(example);
    const actual = linksFromRoot(overtypeRoot(example));

    if (classification.outcome === 'partial') {
      const rendered = recognized.map(link => ({
        ...link,
        destination: MarkdownParser.sanitizeUrl(link.destination)
      }));
      assert.deepEqual(actual, rendered, `CommonMark inline portion of reference link example ${example.number}`);
      return 1;
    }

    const expected = linksFromRoot(referenceRoot(example));
    assert.deepEqual(recognized, expected, `CommonMark link recognition example ${example.number}`);
    assert.deepEqual(
      actual,
      expected.map(link => ({ ...link, destination: MarkdownParser.sanitizeUrl(link.destination) })),
      `CommonMark link rendering example ${example.number}`
    );
    return 1;
  }
};
