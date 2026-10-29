/**
 * Markdown spelling tests for OverType
 * The toolbar and shortcuts write the italic, bold and bullet spelling the
 * options choose, or match the document when an option is left out.
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
global.Event = dom.window.Event;
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

async function apply(options, text, actionId) {
  document.body.innerHTML = '<div id="editor"></div>';
  const editor = new OverType('#editor', { toolbar: true, ...options })[0];
  const caret = text.indexOf('|');
  editor.setValue(text.replace('|', ''));
  editor.textarea.focus();
  editor.textarea.setSelectionRange(caret, caret);
  await editor.performAction(actionId);
  return editor.getValue();
}

async function check(options, text, actionId, expected, testName) {
  const result = await apply(options, text, actionId);
  assert(result === expected, testName, `got ${JSON.stringify(result)}`);
}

console.log('🧪 Running Markdown Spelling Tests...\n');

console.log('📋 Defaults');
await check({}, 'a wo|rd', 'toggleItalic', 'a _word_', 'italic defaults to underscores');
await check({}, 'a wo|rd', 'toggleBold', 'a **word**', 'bold defaults to stars');
await check({}, 'it|em', 'toggleBulletList', '- item', 'bullets default to dashes');

console.log('\n📋 Options');
await check({ italicUsesAsterisk: true }, 'a wo|rd', 'toggleItalic', 'a *word*', 'italicUsesAsterisk writes stars');
await check({ italicUsesAsterisk: false }, '*x* a wo|rd', 'toggleItalic', '*x* a _word_', 'italicUsesAsterisk: false wins over the document');
await check({ boldUsesUnderscore: true }, 'a wo|rd', 'toggleBold', 'a __word__', 'boldUsesUnderscore writes underscores');
await check({ bulletMarker: '+' }, 'it|em', 'toggleBulletList', '+ item', 'bulletMarker writes its marker');
await check({ italicUsesAsterisk: true }, 'Otters **ho|ld**', 'toggleItalic', 'Otters ***hold***', 'star italic keeps bold intact');

console.log('\n📋 Matching the document');
await check({}, '*one* and tw|o', 'toggleItalic', '*one* and *two*', 'italic matches existing stars');
await check({}, '__one__ and tw|o', 'toggleBold', '__one__ and __two__', 'bold matches existing underscores');
await check({}, '* one\n\ntw|o', 'toggleBulletList', '* one\n\n* two', 'bullets match existing stars');

console.log('\n📋 Removing either spelling');
await check({ italicUsesAsterisk: true }, 'a _wo|rd_', 'toggleItalic', 'a word', 'star option still removes underscores');
await check({}, 'a __wo|rd__', 'toggleBold', 'a word', 'bold removes underscores');
await check({ bulletMarker: '-' }, '+ it|em', 'toggleBulletList', 'item', 'any bullet is removed');

console.log('\n📋 Keyboard shortcut');
{
  document.body.innerHTML = '<div id="editor"></div>';
  const editor = new OverType('#editor', { italicUsesAsterisk: true })[0];
  editor.setValue('a word');
  editor.textarea.focus();
  editor.textarea.setSelectionRange(3, 3);
  editor.textarea.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'i', ctrlKey: true, metaKey: true, bubbles: true, cancelable: true }));
  await new Promise(resolve => setTimeout(resolve, 0));
  assert(editor.getValue() === 'a *word*', 'Ctrl+I uses the option without a toolbar', `got ${JSON.stringify(editor.getValue())}`);
}

console.log(`\n✅ Passed: ${passed}`);
console.log(`❌ Failed: ${failed}`);

if (failed > 0) {
  process.exit(1);
} else {
  console.log('✨ All markdown spelling tests passed!');
}
