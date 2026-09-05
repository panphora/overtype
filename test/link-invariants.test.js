import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import { LinkTooltip } from '../src/link-tooltip.js';
import { OverType } from '../src/overtype.js';
import { MarkdownParser } from '../src/parser.js';

const issueSource = 'this is my [best document](/path/to/my/file.pdf "PDF document of 42 MB (very nice)")';
const issueDom = new JSDOM(MarkdownParser.parse(issueSource));
const issueAnchor = issueDom.window.document.querySelector('a');

assert.equal(issueDom.window.document.body.textContent, issueSource);
assert.equal(issueAnchor.getAttribute('href'), '/path/to/my/file.pdf');
assert.equal(issueAnchor.getAttribute('title'), 'PDF document of 42 MB (very nice)');

const source = [
  '`[not a link](bad)` [first](one)',
  '[backtick](u`v) and `code` [after](after)',
  '```js',
  '[not a link either](bad)',
  '```',
  '- [x](task-url)',
  '[second](two "Second title")'
].join('\n');
const recognized = MarkdownParser.findRenderableLinks(source);
const renderedDom = new JSDOM(MarkdownParser.parse(source));
const rendered = [...renderedDom.window.document.querySelectorAll('a')];

assert.deepEqual(recognized.map(link => link.destination.value), ['one', 'u`v', 'after', 'task-url', 'two']);
assert.deepEqual(rendered.map(anchor => anchor.getAttribute('href')), ['one', 'u`v', 'after', 'task-url', 'two']);
assert.deepEqual(rendered.map(anchor => anchor.getAttribute('title')), [null, null, null, null, 'Second title']);

for (const [index, anchor] of rendered.entries()) {
  assert.match(anchor.getAttribute('style'), new RegExp(`anchor-name: --link-${index}(?:;|$)`));
}

for (const fenceSource of [
  '````\n[hidden](bad)\n````\n[visible](four)',
  '   ```js\n[hidden](bad)\n   `````\n[visible](indented)'
]) {
  const fenceLinks = MarkdownParser.findRenderableLinks(fenceSource);
  const fenceDom = new JSDOM(MarkdownParser.parse(fenceSource));
  const fenceAnchors = [...fenceDom.window.document.querySelectorAll('a')];

  assert.deepEqual(fenceLinks.map(link => link.destination.value), fenceAnchors.map(anchor => anchor.getAttribute('href')));
  assert.deepEqual(fenceLinks.map((link, index) => index), fenceAnchors.map(anchor => {
    const match = /anchor-name: --link-(\d+)/.exec(anchor.getAttribute('style'));
    return Number.parseInt(match[1], 10);
  }));
}

const tooltip = Object.create(LinkTooltip.prototype);
tooltip.editor = { options: { transformLinkUrl: null } };

for (const [index, link] of recognized.entries()) {
  const info = tooltip.findLinkAtPosition(source, link.text.start);
  assert.deepEqual(
    { index: info.index, url: info.url, start: info.start, end: info.end },
    { index, url: link.destination.value, start: link.start, end: link.end }
  );
}

assert.equal(tooltip.findLinkAtPosition(source, source.indexOf('not a link')), null);

const extracted = OverType.prototype._extractMarkdownUrls.call({}, source);
assert.deepEqual(extracted, ['bad', 'one', 'u`v', 'after', 'bad', 'task-url', 'two']);

const uploadEditor = Object.create(OverType.prototype);
const escapedUpload = '[report](/uploads/report\\(final\\).pdf)';
const emptyAltUpload = '![](/uploads/image.png)';
const removed = [];
uploadEditor._uploadedFiles = new Map();
uploadEditor.options = { fileUpload: { onRemoveFile: file => removed.push(file) } };
uploadEditor.textarea = { value: `${escapedUpload} ${emptyAltUpload}` };

uploadEditor._trackInsertedUrls(escapedUpload, { name: 'report.pdf' });
uploadEditor._trackInsertedUrls(emptyAltUpload, { name: 'image.png' });
assert.deepEqual([...uploadEditor._uploadedFiles.keys()], [
  '/uploads/report(final).pdf',
  '/uploads/image.png'
]);

uploadEditor._checkForRemovedUploads();
assert.equal(removed.length, 0);

uploadEditor.textarea.value = `\`\`\`\n${escapedUpload}\n\`\`\` ${emptyAltUpload}`;
uploadEditor._checkForRemovedUploads();
assert.equal(removed.length, 0);

uploadEditor.textarea.value = `${escapedUpload} "unfinished title ${emptyAltUpload}`;
uploadEditor._checkForRemovedUploads();
assert.equal(removed.length, 0);

uploadEditor.textarea.value = emptyAltUpload;
uploadEditor._checkForRemovedUploads();
assert.deepEqual(removed.map(file => file.url), ['/uploads/report(final).pdf']);

const replacementSource = '[x](/a?value=$& "title $& value")';
const replacementDom = new JSDOM(MarkdownParser.parse(replacementSource));
const replacementAnchor = replacementDom.window.document.querySelector('a');
assert.equal(replacementDom.window.document.body.textContent, replacementSource);
assert.equal(replacementAnchor.getAttribute('href'), '/a?value=$&');
assert.equal(replacementAnchor.getAttribute('title'), 'title $& value');

const codeReplacementSource = '[a `$&` b](c)';
const codeReplacementDom = new JSDOM(MarkdownParser.parse(codeReplacementSource));
assert.equal(codeReplacementDom.window.document.body.textContent, codeReplacementSource);

const placeholderSource = '[a `]` b](c`d`)';
const placeholderDom = new JSDOM(MarkdownParser.parse(placeholderSource));
assert.equal(placeholderDom.window.document.body.textContent, placeholderSource);
assert.equal(placeholderDom.window.document.querySelector('a').getAttribute('href'), 'c`d`');

const invalidSource = '[bad](`not a url`) [good](/ok)';
const invalidDom = new JSDOM(MarkdownParser.parse(invalidSource));
assert.equal(invalidDom.window.document.body.textContent, invalidSource);
assert.deepEqual(
  [...invalidDom.window.document.querySelectorAll('a')].map(anchor => anchor.getAttribute('href')),
  ['/ok']
);

const convergingSource = '[a `]` b](c`d) [f](g) x`';
const convergingLinks = MarkdownParser.findRenderableLinks(convergingSource);
const convergingDom = new JSDOM(MarkdownParser.parse(convergingSource));
assert.deepEqual(convergingLinks.map(link => link.destination.value), ['c`d', 'g']);
assert.deepEqual(
  [...convergingDom.window.document.querySelectorAll('a')].map(anchor => anchor.getAttribute('href')),
  ['c`d', 'g']
);

console.log('✓ parser, tooltip, and upload tracking agree on recognized links');
console.log('✓ issue #122 preserves source text, destination, and title');
console.log('✓ upload tracking preserves empty labels and escaped destinations');
