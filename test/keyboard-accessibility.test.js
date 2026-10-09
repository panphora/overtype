/**
 * Keyboard accessibility tests for OverType
 * Verifies Tab focus escape, selected-line indentation, and preview focus state.
 */

import { JSDOM } from 'jsdom';
import { OverType } from '../src/overtype.js';

const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', {
  pretendToBeVisual: true
});

global.window = dom.window;
global.document = dom.window.document;
global.Element = dom.window.Element;
global.NodeList = dom.window.NodeList;
global.HTMLElement = dom.window.HTMLElement;
global.Event = dom.window.Event;
global.KeyboardEvent = dom.window.KeyboardEvent;
global.CSS = { supports: () => false };
global.performance = { now: () => Date.now() };
global.requestAnimationFrame = (callback) => setTimeout(callback, 0);

Object.defineProperty(global, 'navigator', {
  configurable: true,
  value: dom.window.navigator
});

Object.defineProperty(dom.window.navigator, 'platform', {
  configurable: true,
  value: 'Win32'
});

const results = {
  passed: 0,
  failed: 0
};

function assert(condition, testName, message) {
  if (condition) {
    results.passed++;
    console.log(`✓ ${testName}`);
    return;
  }

  results.failed++;
  console.error(`✗ ${testName}: ${message}`);
}

function createEditor() {
  const element = document.createElement('div');
  document.body.appendChild(element);

  return new OverType(element)[0];
}

function dispatchKey(editor, key, options = {}) {
  const event = new KeyboardEvent('keydown', {
    key,
    bubbles: true,
    cancelable: true,
    ...options
  });

  editor.textarea.dispatchEvent(event);

  return event;
}

function selectedText(editor) {
  return editor.textarea.value.slice(editor.textarea.selectionStart, editor.textarea.selectionEnd);
}

console.log('🧪 Running Keyboard Accessibility Tests...\n');
console.log('━'.repeat(50));

console.log('\n⌨️  Tab focus escape\n');

(() => {
  const editor = createEditor();
  editor.setValue('One line');
  editor.textarea.setSelectionRange(3, 3);

  const event = dispatchKey(editor, 'Tab');

  assert(!event.defaultPrevented, 'Collapsed Tab is not prevented', 'Tab should use native focus traversal');
  assert(editor.getValue() === 'One line', 'Collapsed Tab does not edit content', 'Collapsed Tab should not insert spaces');
})();

(() => {
  const editor = createEditor();
  editor.setValue('One line');
  editor.textarea.setSelectionRange(3, 3);

  const event = dispatchKey(editor, 'Tab', { shiftKey: true });

  assert(!event.defaultPrevented, 'Collapsed Shift+Tab is not prevented', 'Shift+Tab should use native focus traversal');
  assert(editor.getValue() === 'One line', 'Collapsed Shift+Tab does not edit content', 'Collapsed Shift+Tab should not outdent');
})();

console.log('\n↹ Selected-line indentation\n');

(() => {
  const editor = createEditor();
  editor.setValue('one\ntwo\nthree');
  editor.textarea.setSelectionRange(0, 'one\ntwo'.length);

  const event = dispatchKey(editor, 'Tab');

  assert(event.defaultPrevented, 'Selected Tab is prevented', 'Selected Tab should become an edit command');
  assert(editor.getValue() === '  one\n  two\nthree', 'Selected Tab indents selected lines', 'Only selected lines should be indented');
  assert(selectedText(editor) === '  one\n  two', 'Selected Tab preserves selected lines', 'Indented lines should remain selected');
})();

(() => {
  const editor = createEditor();
  editor.setValue('  one\n  two\nthree');
  editor.textarea.setSelectionRange(0, '  one\n  two'.length);

  const event = dispatchKey(editor, 'Tab', { shiftKey: true });

  assert(event.defaultPrevented, 'Selected Shift+Tab is prevented', 'Selected Shift+Tab should become an edit command');
  assert(editor.getValue() === 'one\ntwo\nthree', 'Selected Shift+Tab outdents selected lines', 'Only selected lines should be outdented');
  assert(selectedText(editor) === 'one\ntwo', 'Selected Shift+Tab preserves selected lines', 'Outdented lines should remain selected');
})();

(() => {
  const editor = createEditor();
  editor.setValue('one\ntwo\nthree');
  editor.textarea.setSelectionRange(0, 'one\ntwo\n'.length);
  dispatchKey(editor, 'Tab');

  assert(
    editor.getValue() === '  one\n  two\nthree',
    'Selection ending at newline excludes next line',
    'The line after a trailing selected newline should not be indented'
  );
})();

console.log('\n⌘ Explicit indent shortcuts\n');

(() => {
  const editor = createEditor();
  editor.setValue('one\ntwo');
  editor.textarea.setSelectionRange('one\nt'.length, 'one\nt'.length);

  const event = dispatchKey(editor, ']', { ctrlKey: true });

  assert(event.defaultPrevented, 'Ctrl+] is prevented', 'Ctrl+] should become an edit command');
  assert(editor.getValue() === 'one\n  two', 'Ctrl+] indents current line', 'Current line should be indented');
})();

(() => {
  const editor = createEditor();
  editor.setValue('one\n  two');
  editor.textarea.setSelectionRange('one\n  t'.length, 'one\n  t'.length);

  const event = dispatchKey(editor, '[', { ctrlKey: true });

  assert(event.defaultPrevented, 'Ctrl+[ is prevented', 'Ctrl+[ should become an edit command');
  assert(editor.getValue() === 'one\ntwo', 'Ctrl+[ outdents current line', 'Current line should be outdented');
})();

(() => {
  const editor = createEditor();
  editor.setValue('one\ntwo');
  editor.textarea.setSelectionRange(0, editor.getValue().length);
  dispatchKey(editor, ']', { ctrlKey: true });

  assert(editor.getValue() === '  one\n  two', 'Ctrl+] indents selected lines', 'Selected lines should be indented');
  assert(selectedText(editor) === '  one\n  two', 'Ctrl+] preserves selected lines', 'Indented selected lines should remain selected');
})();

console.log('\n⌘ GitHub markdown shortcuts\n');

(() => {
  const editor = createEditor();
  let actionId = null;
  editor.performAction = (id) => {
    actionId = id;
  };

  const event = dispatchKey(editor, 'e', { ctrlKey: true, code: 'KeyE' });

  assert(event.defaultPrevented, 'Ctrl+E is prevented', 'Ctrl+E should become a markdown command');
  assert(actionId === 'toggleCode', 'Ctrl+E toggles inline code', 'Ctrl+E should dispatch toggleCode');
})();

(() => {
  const editor = createEditor();
  let actionId = null;
  editor.performAction = (id) => {
    actionId = id;
  };

  const event = dispatchKey(editor, '>', { ctrlKey: true, shiftKey: true, code: 'Period' });

  assert(event.defaultPrevented, 'Ctrl+Shift+. is prevented', 'Ctrl+Shift+. should become a markdown command');
  assert(actionId === 'toggleQuote', 'Ctrl+Shift+. toggles quote', 'Ctrl+Shift+. should dispatch toggleQuote');
})();

(() => {
  const editor = createEditor();
  let actionId = null;
  editor.performAction = (id) => {
    actionId = id;
  };

  const event = dispatchKey(editor, '&', { ctrlKey: true, shiftKey: true, code: 'Digit7' });

  assert(event.defaultPrevented, 'Ctrl+Shift+7 is prevented with shifted key', 'Ctrl+Shift+7 should stay handled');
  assert(actionId === 'toggleNumberedList', 'Ctrl+Shift+7 toggles numbered list', 'Ctrl+Shift+7 should dispatch toggleNumberedList');
})();

(() => {
  const editor = createEditor();
  let actionId = null;
  editor.performAction = (id) => {
    actionId = id;
  };

  const event = dispatchKey(editor, '*', { ctrlKey: true, shiftKey: true, code: 'Digit8' });

  assert(event.defaultPrevented, 'Ctrl+Shift+8 is prevented with shifted key', 'Ctrl+Shift+8 should stay handled');
  assert(actionId === 'toggleBulletList', 'Ctrl+Shift+8 toggles bullet list', 'Ctrl+Shift+8 should dispatch toggleBulletList');
})();

console.log('\n🔒 Readonly and disabled no-op behavior\n');

(() => {
  const editor = createEditor();
  editor.setValue('one');
  editor.textarea.setSelectionRange(0, editor.getValue().length);
  editor.textarea.readOnly = true;

  const event = dispatchKey(editor, 'Tab');

  assert(!event.defaultPrevented, 'Readonly selected Tab is not prevented', 'Readonly Tab should be allowed to move focus');
  assert(editor.getValue() === 'one', 'Readonly selected Tab does not edit content', 'Readonly editor should not indent');
})();

(() => {
  const editor = createEditor();
  editor.setValue('one');
  editor.textarea.setSelectionRange(0, editor.getValue().length);
  editor.textarea.disabled = true;

  editor.indentSelection();
  editor.outdentSelection();

  assert(editor.getValue() === 'one', 'Disabled indent commands do not edit content', 'Disabled editor should not change');
})();

console.log('\n👁️ Preview focus state\n');

(() => {
  const editor = createEditor();
  editor.setValue('[Link](https://example.com)');

  assert(editor.preview.hasAttribute('inert'), 'Preview starts inert', 'Normal mode preview should be inert');
  assert(editor.preview.getAttribute('aria-hidden') === 'true', 'Preview starts aria-hidden', 'Normal mode preview should be hidden from AT');

  editor.showPreviewMode();

  assert(!editor.preview.hasAttribute('inert'), 'Preview mode removes inert', 'Preview mode should allow rendered content interaction');
  assert(!editor.preview.hasAttribute('aria-hidden'), 'Preview mode removes aria-hidden', 'Preview mode should expose rendered content');

  editor.showNormalEditMode();

  assert(editor.preview.hasAttribute('inert'), 'Normal mode restores inert', 'Normal mode preview should be inert again');
  assert(editor.preview.getAttribute('aria-hidden') === 'true', 'Normal mode restores aria-hidden', 'Normal mode preview should be hidden again');

  editor.showPreviewMode();
  editor.showPlainTextarea();

  assert(editor.preview.hasAttribute('inert'), 'Plain mode restores inert', 'Plain mode preview should be inert');
  assert(editor.preview.getAttribute('aria-hidden') === 'true', 'Plain mode restores aria-hidden', 'Plain mode preview should be hidden');
})();

console.log('\n' + '━'.repeat(50));
console.log('\n📊 Test Results Summary\n');
console.log(`✅ Passed: ${results.passed}`);
console.log(`❌ Failed: ${results.failed}`);
console.log(`📈 Total:  ${results.passed + results.failed}`);
console.log(`🎯 Success Rate: ${((results.passed / (results.passed + results.failed)) * 100).toFixed(1)}%`);

if (results.failed > 0) {
  console.error(`\n❌ ${results.failed} test(s) failed!`);
  process.exit(1);
}

console.log('\n✅ All tests passed!');
process.exit(0);
