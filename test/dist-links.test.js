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

  const commonmarkDom = new JSDOM(MarkdownParser.parse('***nested***\n\n````js\nconst x = 1;\n`````'));
  assert.ok(commonmarkDom.window.document.querySelector('em strong'));
  assert.equal(commonmarkDom.window.document.querySelector('pre > code').className, 'language-js');
  assert.equal(commonmarkDom.window.document.querySelectorAll('.code-fence').length, 2);

  const transitionDom = new JSDOM(MarkdownParser.parse('*a***b**\n\n003. ok\n\n  ```js\n  alpha\n  ```'));
  const transitionDocument = transitionDom.window.document;
  assert.ok(transitionDocument.querySelector('em + strong'));
  assert.equal(transitionDocument.querySelector('ol').getAttribute('start'), '3');

  const code = transitionDocument.querySelector('pre > code');
  const semanticCode = code.cloneNode(true);
  for (const marker of semanticCode.querySelectorAll('.syntax-marker')) marker.remove();
  assert.equal(code.textContent, '  alpha');
  assert.equal(semanticCode.textContent, 'alpha');

  assert.equal(new JSDOM(MarkdownParser.parseLine('baa*` _`*b')).window.document.querySelector('em'), null);
  assert.equal(new JSDOM(MarkdownParser.parseLine(' **.*')).window.document.querySelectorAll('em').length, 1);

  let fenceRows = 0;
  MarkdownParser.setCustomSyntax(html => {
    if (html.includes('class="code-fence"')) fenceRows++;
    return html;
  });
  MarkdownParser.parse('```\nx\n```');
  MarkdownParser.setCustomSyntax(null);
  assert.equal(fenceRows, 2);
}

assertIssueLink(OverTypeEsm.MarkdownParser);
assertIssueLink(OverTypeCjs.MarkdownParser);

const browserBundle = readFileSync(new URL('../dist/overtype.min.js', import.meta.url), 'utf8');
assert.ok(!browserBundle.includes('.at('));

const legacyDom = new JSDOM('', { runScripts: 'dangerously' });
const NativeRegExp = legacyDom.window.RegExp;
let rejectedPropertyEscapes = 0;
legacyDom.window.RegExp = function RegExp(pattern, flags) {
  if (typeof pattern === 'string' && pattern.includes('\\p{')) {
    rejectedPropertyEscapes++;
    throw new SyntaxError('Unsupported property escape');
  }
  return new NativeRegExp(pattern, flags);
};
legacyDom.window.RegExp.prototype = NativeRegExp.prototype;
legacyDom.window.eval(browserBundle);
assert.ok(legacyDom.window.OverType);
assert.equal(rejectedPropertyEscapes, 1);

const browserDom = new JSDOM('', { runScripts: 'dangerously' });
browserDom.window.eval(browserBundle);
assertIssueLink(browserDom.window.OverType.MarkdownParser);

console.log('✓ ESM, CommonJS, and browser bundles include the link, emphasis, and fence fixes');
