/**
 * autoResize minHeight / maxHeight in CSS units
 * The limits were read with parseInt, so '60vh' meant 60 pixels and '10rem' 10.
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

// An editor whose content is `lines` lines of 20px
function heightWith(options, lines) {
  document.body.innerHTML = '<div id="editor"></div>';
  const editor = new OverType('#editor', { autoResize: true, ...options })[0];
  Object.defineProperty(editor.textarea, 'scrollHeight', { configurable: true, get: () => lines * 20 });
  editor._updateAutoHeight();
  return editor.wrapper.style.height;
}

console.log('🧪 Running autoResize unit tests...\n');

window.innerWidth = 1000;
window.innerHeight = 800;
document.documentElement.style.fontSize = '20px';

assert(heightWith({ maxHeight: '50vh' }, 100) === '400px', 'maxHeight in vh is a share of the window', heightWith({ maxHeight: '50vh' }, 100));
assert(heightWith({ maxHeight: '50vw' }, 100) === '500px', 'maxHeight in vw');
assert(heightWith({ maxHeight: '25vmin' }, 100) === '200px', 'maxHeight in vmin');
assert(heightWith({ maxHeight: '25vmax' }, 100) === '250px', 'maxHeight in vmax');
assert(heightWith({ minHeight: '10rem' }, 1) === '200px', 'minHeight in rem uses the root font size', heightWith({ minHeight: '10rem' }, 1));
assert(heightWith({ minHeight: '120px' }, 1) === '120px', 'px as before');
assert(heightWith({ minHeight: 90 }, 1) === '90px', 'a number is pixels');
assert(heightWith({ minHeight: '150' }, 1) === '150px', 'a unitless string is pixels, as before');
assert(heightWith({ maxHeight: null }, 100) === '2000px', 'no maxHeight: no limit');
assert(heightWith({ minHeight: '100px', maxHeight: '30vh' }, 3) === '100px', 'min and max together (min wins below max)');
assert(heightWith({ maxHeight: 'calc(50vh - 10px)' }, 100) === '2000px', 'an unsupported value is no limit, as before');
{
  document.body.innerHTML = '<div id="editor"></div>';
  const ed = new OverType('#editor', { autoResize: true, minHeight: '2em' })[0];
  ed.textarea.style.fontSize = '15px';
  Object.defineProperty(ed.textarea, 'scrollHeight', { configurable: true, get: () => 20 });
  ed._updateAutoHeight();
  assert(ed.wrapper.style.height === '30px', "em uses the editor's own font size", ed.wrapper.style.height);
}

window.innerHeight = 400;
document.body.innerHTML = '<div id="editor"></div>';
const editor = new OverType('#editor', { autoResize: true, maxHeight: '50vh' })[0];
Object.defineProperty(editor.textarea, 'scrollHeight', { configurable: true, get: () => 2000 });
editor._updateAutoHeight();
assert(editor.wrapper.style.height === '200px', 'vh follows the window when it changes', editor.wrapper.style.height);
const overflow = editor.textarea.style.getPropertyValue('overflow-y');
assert(overflow === 'auto', 'content taller than maxHeight scrolls', overflow);

console.log(`\n✅ Passed: ${passed}`);
console.log(`❌ Failed: ${failed}`);

if (failed > 0) {
  process.exit(1);
} else {
  console.log('✨ All autoResize unit tests passed!');
}
