import assert from 'node:assert/strict';
import {
  scanAtxHeading,
  scanBlockquote,
  scanFencedBlocks,
  scanListItem,
  scanThematicBreak
} from '../../../src/block-scanner.js';
import {
  markdownSource,
  normalizeInlineText,
  overtypeRoot,
  referenceRoot,
  semanticText
} from '../../helpers/commonmark-harness.js';

function sourceLines(example) {
  return markdownSource(example).split('\n');
}

function actualBreaks(example) {
  return [...overtypeRoot(example).querySelectorAll('.hr-marker')].map(element => element.textContent.replace(/^\u00a0{1,3}/, match => ' '.repeat(match.length)));
}

const breakContextMismatch = example => {
  const sourceCount = sourceLines(example).filter(scanThematicBreak).length;
  return sourceCount !== referenceRoot(example).querySelectorAll('hr').length;
};

export const thematicBreakAdapter = {
  section: 'Thematic breaks',
  count: 19,
  minimumAssertions: 17,
  rules: [{
    name: 'container-or-setext-precedence-unsupported',
    outcome: example => referenceRoot(example).querySelector('hr') && sourceLines(example).some(scanThematicBreak) ? 'partial' : 'deviation',
    when: breakContextMismatch
  }],
  assert(example, classification) {
    const source = sourceLines(example).filter(line => scanThematicBreak(line));
    assert.deepEqual(actualBreaks(example), source, `CommonMark thematic break source grammar example ${example.number}`);
    if (classification.outcome === 'conform') {
      assert.equal(source.length, referenceRoot(example).querySelectorAll('hr').length, `CommonMark thematic breaks example ${example.number}`);
    }
    return classification.outcome === 'deviation' ? 0 : 1;
  }
};

function sourceHeadingSignature(example) {
  return sourceLines(example).map(scanAtxHeading).filter(Boolean).map(heading => ({
    level: heading.level
  }));
}

function headingSignature(root) {
  return [...root.querySelectorAll('h1, h2, h3')].map(heading => ({
    level: Number(heading.tagName.slice(1)),
    text: semanticText(heading).replace(/^\u00a0{1,3}/, '').trim()
  }));
}

const headingContextMismatch = example =>
  sourceHeadingSignature(example).length !== headingSignature(referenceRoot(example)).length;

export const headingAdapter = {
  section: 'ATX headings',
  count: 18,
  minimumAssertions: 15,
  rules: [
    {
      name: 'heading-levels-four-through-six-unsupported',
      outcome: example => headingSignature(referenceRoot(example)).length > 0 ? 'partial' : 'deviation',
      when: example => referenceRoot(example).querySelector('h4, h5, h6') !== null
    },
    {
      name: 'block-context-unsupported',
      outcome: example => sourceHeadingSignature(example).length > 0 && headingSignature(referenceRoot(example)).length > 0 ? 'partial' : 'deviation',
      when: headingContextMismatch
    }
  ],
  assert(example, classification) {
    const source = sourceHeadingSignature(example);
    const actual = headingSignature(overtypeRoot(example));
    assert.deepEqual(actual.map(heading => ({ level: heading.level })), source, `CommonMark ATX source grammar example ${example.number}`);

    const expected = headingSignature(referenceRoot(example));
    if (classification.outcome === 'conform' || expected.length === source.length) {
      assert.deepEqual(actual, expected, `CommonMark ATX headings example ${example.number}`);
    }
    return source.length > 0 || expected.length === 0 ? 1 : 0;
  }
};

function semanticFenceContent(block) {
  const width = block.opening.indent.length;
  return block.content.map(line => {
    let remove = 0;
    while (remove < width && line[remove] === ' ') remove++;
    return line.slice(remove);
  }).join('\n');
}

function expectedFenceSignature(example) {
  return [...referenceRoot(example).querySelectorAll('pre > code')].map(code => ({
    info: [...code.classList].find(name => name.startsWith('language-'))?.slice(9) ?? '',
    content: code.textContent.endsWith('\n') ? code.textContent.slice(0, -1) : code.textContent
  }));
}

function sourceFenceSignature(example) {
  return scanFencedBlocks(markdownSource(example)).map(block => ({
    info: block.opening.info.split(/[\t ]/, 1)[0],
    content: semanticFenceContent(block),
    closed: block.closed
  }));
}

function actualFenceSignature(example) {
  const root = overtypeRoot(example);
  const code = [...root.querySelectorAll('pre > code')].map(element => ({
    info: [...element.classList].find(name => name.startsWith('language-'))?.slice(9) ?? '',
    content: semanticText(element)
  }));
  return {
    code,
    fences: root.querySelectorAll('.code-fence').length
  };
}

const hasTildeFence = example => {
  let opening = null;
  for (const line of sourceLines(example)) {
    const match = /^( {0,3})(`{3,}|~{3,})(.*)$/.exec(line);
    if (!match) continue;
    const marker = match[2][0];
    const length = match[2].length;

    if (!opening) {
      if (marker === '`' && match[3].includes('`')) continue;
      if (marker === '~') return true;
      opening = { marker, length };
      continue;
    }

    if (marker === opening.marker && length >= opening.length && /^[\t ]*$/.test(match[3])) {
      opening = null;
    }
  }
  return false;
};
const hasContainerFence = example => /^(?: {0,3}>| {0,3}(?:[-*+] |\d+[.)] ))[^\n]*`{3,}/m.test(markdownSource(example));
const hasIndentedFence = example => sourceFenceSignature(example).length === 0 && /^ {4,}`{3,}/m.test(markdownSource(example));
const isLoneOpeningFence = example => {
  const blocks = scanFencedBlocks(markdownSource(example));
  return blocks.some(block => !block.closed && block.content.length === 0);
};

export const fencedCodeAdapter = {
  section: 'Fenced code blocks',
  count: 29,
  minimumAssertions: 17,
  rules: [
    {
      name: 'tilde-fences-unsupported',
      outcome: 'deviation',
      when: hasTildeFence
    },
    { name: 'container-fences-unsupported', outcome: 'deviation', when: hasContainerFence },
    { name: 'indented-code-precedence-unsupported', outcome: 'deviation', when: hasIndentedFence },
    { name: 'lone-opening-fence-has-no-empty-row', outcome: 'partial', when: isLoneOpeningFence },
    {
      name: 'block-context-unsupported',
      outcome: example => sourceFenceSignature(example).length > 0 ? 'partial' : 'deviation',
      when: example => sourceFenceSignature(example).length !== expectedFenceSignature(example).length
    }
  ],
  assert(example, classification) {
    const source = sourceFenceSignature(example);
    const actual = actualFenceSignature(example);
    assert.equal(
      actual.fences,
      source.length + source.filter(block => block.closed).length,
      `CommonMark fence markers example ${example.number}`
    );

    const displayable = source.filter(block => block.closed || block.content !== '');
    assert.deepEqual(
      actual.code,
      displayable.map(({ info, content }) => ({ info, content })),
      `CommonMark rendered fence blocks example ${example.number}`
    );

    if (classification.outcome === 'conform') {
      assert.deepEqual(
        source.map(({ info, content }) => ({ info, content })),
        expectedFenceSignature(example),
        `CommonMark fenced code example ${example.number}`
      );
    }
    return classification.outcome !== 'deviation' && source.length > 0 ? 1 : 0;
  }
};

function quoteRows(example) {
  return sourceLines(example).map(scanBlockquote).filter(Boolean);
}

const hasSimpleQuoteRows = example => quoteRows(example).length > 0;
const hasNestedQuotes = example => /^ {0,3}>[\t ]?>/m.test(markdownSource(example));
const hasBlankQuoteRows = example => /^ {0,3}>[\t ]*$/m.test(markdownSource(example));
const hasMultirowQuoteGroup = example => {
  const lines = sourceLines(example);
  return lines.some((line, index) => index > 0 && scanBlockquote(line) && scanBlockquote(lines[index - 1]));
};
const hasQuoteBlockChildren = example => /^ {0,3}>[\t ]?(?:#{1,6}(?:[\t ]|$)|[-*+] |\d+[.)] |`{3,}| {4})/m.test(markdownSource(example));
const hasLazyContinuation = example => {
  const lines = sourceLines(example);
  const quoteText = [...referenceRoot(example).querySelectorAll('blockquote')].map(element => element.textContent).join('\n');
  return lines.some((line, index) => index > 0 && scanBlockquote(lines[index - 1]) &&
    line.trim() !== '' && !scanBlockquote(line) && quoteText.includes(line.trim()));
};

export const blockquoteAdapter = {
  section: 'Block quotes',
  count: 25,
  minimumAssertions: 20,
  rules: [
    { name: 'nested-quotes-unsupported', outcome: example => hasSimpleQuoteRows(example) ? 'partial' : 'deviation', when: hasNestedQuotes },
    { name: 'lazy-continuation-unsupported', outcome: 'partial', when: hasLazyContinuation },
    { name: 'quote-block-children-unsupported', outcome: 'partial', when: hasQuoteBlockChildren },
    { name: 'quote-grouping-unsupported', outcome: 'partial', when: hasBlankQuoteRows },
    { name: 'multirow-quote-grouping-unsupported', outcome: 'partial', when: hasMultirowQuoteGroup }
  ],
  assert(example) {
    const rows = quoteRows(example);
    const actual = [...overtypeRoot(example).querySelectorAll('.blockquote')].map(element => semanticText(element));
    assert.deepEqual(
      actual,
      rows.map(row => normalizeInlineText(row.separator + row.content)),
      `CommonMark line local block quotes example ${example.number}`
    );
    return rows.length > 0 ? 1 : 0;
  }
};

function listItems(example) {
  return sourceLines(example).map((line, lineNumber) => ({ line, lineNumber, item: scanListItem(line) }))
    .filter(entry => entry.item);
}

function listGroupSignature(root) {
  return [...root.querySelectorAll(':scope > ul, :scope > ol')].map(list => ({
    type: list.tagName.toLowerCase(),
    start: list.tagName === 'OL' ? Number.parseInt(list.getAttribute('start') ?? '1', 10) : null,
    items: [...list.children].filter(child => child.tagName === 'LI').map(item => semanticText(item).replace(/^\u00a0+/, ''))
  }));
}

function sourceListGroups(example) {
  const groups = [];
  let current = null;
  let previousLine = -2;
  for (const entry of listItems(example)) {
    const type = entry.item.listType === 'bullet' ? 'ul' : 'ol';
    if (!current || current.type !== type || entry.lineNumber !== previousLine + 1) {
      current = {
        type,
        start: type === 'ol' ? Number.parseInt(entry.item.marker, 10) : null,
        items: []
      };
      groups.push(current);
    }
    current.items.push(normalizeInlineText(entry.item.content));
    previousLine = entry.lineNumber;
  }
  return groups;
}

const noListSyntax = example => listItems(example).length === 0;
const hasOrderedParenthesis = example => /^ *\d{1,9}\)[\t ]+/m.test(markdownSource(example));
const hasWideOrderedMarker = example => /^ *\d{10,}\.[\t ]+/m.test(markdownSource(example));
const hasDeepIndent = example => {
  const entries = listItems(example);
  if (entries.some(({ item }) => item.indent.length > 3)) return true;
  return entries.some((entry, index) => {
    if (index === 0 || entry.lineNumber !== entries[index - 1].lineNumber + 1) return false;
    const parent = entries[index - 1].item;
    return entry.item.indent.length >= parent.indent.length + parent.marker.length + 1;
  });
};
const hasBlockChild = example => listItems(example).some(({ item }) => /^(?:[-*+] |\d+[.)] |#{1,6}(?:[\t ]|$)|>|`{3,})/.test(item.content));
const changesBulletMarker = example => {
  const markers = listItems(example).filter(({ item }) => item.listType === 'bullet').map(({ item }) => item.marker);
  return new Set(markers).size > 1;
};
const hasOrderedParagraphInterruption = example => listItems(example).some(entry => {
  if (entry.item.listType !== 'ordered' || Number.parseInt(entry.item.marker, 10) === 1) return false;
  return entry.lineNumber > 0 && sourceLines(example)[entry.lineNumber - 1].trim() !== '' &&
    !scanListItem(sourceLines(example)[entry.lineNumber - 1]);
});
const hasLooseOrContinuationContent = example => {
  const lines = sourceLines(example);
  const entries = listItems(example);
  if (entries.length === 0) return false;
  const first = entries[0].lineNumber;
  return lines.slice(first).some((line, offset) => {
    const lineNumber = first + offset;
    if (line.trim() === '') return lineNumber < lines.length - 1;
    return !scanListItem(line);
  });
};

function makeListAdapter(section, count, minimumAssertions) {
  return {
    section,
    count,
    minimumAssertions,
    rules: [
      { name: 'no-flat-list-syntax', outcome: 'deviation', when: noListSyntax },
      { name: 'ordered-parenthesis-markers-unsupported', outcome: 'deviation', when: hasOrderedParenthesis },
      { name: 'ordered-marker-width-unsupported', outcome: 'deviation', when: hasWideOrderedMarker },
      { name: 'ordered-paragraph-interruption-unsupported', outcome: 'deviation', when: hasOrderedParagraphInterruption },
      { name: 'nested-lists-unsupported', outcome: 'deviation', when: hasDeepIndent },
      { name: 'block-children-unsupported', outcome: 'partial', when: hasBlockChild },
      { name: 'mixed-bullet-groups-unsupported', outcome: 'partial', when: changesBulletMarker },
      { name: 'loose-or-continuation-content-unsupported', outcome: 'partial', when: hasLooseOrContinuationContent }
    ],
    assert(example, classification) {
      const source = sourceListGroups(example);
      const actual = listGroupSignature(overtypeRoot(example));
      if (classification.outcome === 'conform') {
        assert.deepEqual(actual, source, `CommonMark flat list source grammar example ${example.number}`);
        assert.deepEqual(actual, listGroupSignature(referenceRoot(example)), `CommonMark flat lists example ${example.number}`);
      } else {
        const sourceItems = source.flatMap(group => group.items);
        const actualItems = actual.flatMap(group => group.items);
        let sourceIndex = 0;
        for (const item of actualItems) {
          while (sourceIndex < sourceItems.length && sourceItems[sourceIndex] !== item) sourceIndex++;
          assert.ok(sourceIndex < sourceItems.length, `CommonMark supported list subset example ${example.number}`);
          sourceIndex++;
        }
      }
      return classification.outcome !== 'deviation' && source.length > 0 ? 1 : 0;
    }
  };
}

export const listItemAdapter = makeListAdapter('List items', 48, 14);
export const listsAdapter = makeListAdapter('Lists', 26, 8);

export const blockAdapters = [
  thematicBreakAdapter,
  headingAdapter,
  fencedCodeAdapter,
  blockquoteAdapter,
  listItemAdapter,
  listsAdapter
];
