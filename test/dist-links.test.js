import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { JSDOM } from 'jsdom';
import OverTypeEsm from '../dist/overtype.esm.js';

const require = createRequire(import.meta.url);
const OverTypeCjs = require('../dist/overtype.cjs').default;
const source = '[document](/files/report.pdf "Report (42 MB)")';

function assertIssueLink(MarkdownParser) {
  const dom = new JSDOM(MarkdownParser.parse(source));
  const anchor = dom.window.document.querySelector('a');
  assert.equal(dom.window.document.body.textContent, source);
  assert.equal(anchor.getAttribute('href'), '/files/report.pdf');
  assert.equal(anchor.getAttribute('title'), 'Report (42 MB)');
}

assertIssueLink(OverTypeEsm.MarkdownParser);
assertIssueLink(OverTypeCjs.MarkdownParser);

const browserDom = new JSDOM('', { runScripts: 'dangerously' });
browserDom.window.eval(readFileSync(new URL('../dist/overtype.min.js', import.meta.url), 'utf8'));
assertIssueLink(browserDom.window.OverType.MarkdownParser);

console.log('✓ ESM, CommonJS, and browser bundles include the issue #122 fix');
