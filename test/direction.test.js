/**
 * Writing direction (the dir option)
 * Both layers must flow the same way for the overlay to line up, so the direction is set on the
 * container and the textarea together; the stylesheet turns alignment, lists and quotes around.
 */

import { JSDOM } from 'jsdom';

const dom = new JSDOM(`<!DOCTYPE html><html><body><div id="editor"></div></body></html>`, {
  pretendToBeVisual: true
});

global.window = dom.window;
global.document = dom.window.document;
global.HTMLElement = dom.window.HTMLElement;
global.Element = dom.window.Element;
global.Node = dom.window.Node;
global.CustomEvent = dom.window.CustomEvent;
global.CSS = { supports: () => false };
global.performance = { now: () => Date.now() };
global.requestAnimationFrame = (callback) => setTimeout(callback, 0);
window.matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {} });

const { OverType } = await import('../src/overtype.js');
const { generateStyles } = await import('../src/styles.js');

let passed = 0;
let failed = 0;

function assert(condition, testName, message = '') {
  if (condition) {
    passed++;
    console.log(`  ✅ ${testName}`);
  } else {
    failed++;
    console.error(`  ❌ ${testName}: ${message}`);
  }
}

function createEditor(options = {}, page = '<div id="editor"></div>') {
  document.body.innerHTML = page;
  return new OverType('#editor', { value: '# שלום\n- רשימה', ...options })[0];
}

const dirs = (editor) => [editor.container.getAttribute('dir'), editor.textarea.getAttribute('dir'), editor.preview.getAttribute('dir')].join(',');

console.log('🧪 Running direction tests...\n');

assert(dirs(createEditor()) === 'ltr,ltr,ltr', 'left to right by default', dirs(createEditor()));
assert(dirs(createEditor({ dir: 'rtl' })) === 'rtl,rtl,rtl', 'rtl on the container, the textarea and the preview');
assert(dirs(createEditor({ dir: 'auto' }, '<div dir="rtl"><div id="editor"></div></div>')) === 'rtl,rtl,rtl', 'auto follows the page');
assert(dirs(createEditor({ dir: 'auto' })) === 'ltr,ltr,ltr', 'auto on a left-to-right page');
assert(dirs(createEditor({ dir: 'sideways' })) === 'ltr,ltr,ltr', 'anything else is left to right');

const editor = createEditor({ dir: 'rtl' });
editor.reinit({ dir: 'ltr' });
assert(dirs(editor) === 'ltr,ltr,ltr', 'reinit changes it', dirs(editor));

const css = generateStyles();
assert(/\.overtype-container\[dir="rtl"\] \.overtype-wrapper \.overtype-input,\s*\.overtype-container\[dir="rtl"\] \.overtype-wrapper \.overtype-preview \{\s*direction: rtl !important;/.test(css),
  'the stylesheet flips both layers together');
assert(css.includes('direction: ltr !important'), 'left to right stays the base rule');
assert(/\[dir="rtl"\]\[data-mode="preview"\][^{]*\.blockquote \{[^}]*border-right/.test(css), 'quotes in preview mode get their bar on the right');

console.log(`\n✅ Passed: ${passed}`);
console.log(`❌ Failed: ${failed}`);

if (failed > 0) {
  process.exit(1);
} else {
  console.log('✨ All direction tests passed!');
}
