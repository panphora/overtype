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

console.log('\n📝 Enter at list boundaries\n');

(() => {
  const originalExecCommand = document.execCommand;
  document.execCommand = (command, _showUI, text = '') => {
    const textarea = document.activeElement;
    textarea.setRangeText(
      command === 'delete' ? '' : text,
      textarea.selectionStart,
      textarea.selectionEnd,
      'end'
    );
    return true;
  };

  try {
    const lines = ['-', '- ', '- Item', '* Item', '+ Item', '- [ ] ', '- [x] Done', '1.', '1. ', '10. Item', '  - Item', '  - [ ] Task', '  1. Item'];

    for (const prefix of ['', 'Previous line\n']) {
      for (const line of lines) {
        const editor = createEditor();
        const value = prefix + line;
        editor.setValue(value);
        editor.textarea.focus();
        editor.textarea.setSelectionRange(prefix.length, prefix.length);

        const event = dispatchKey(editor, 'Enter');
        const label = `${JSON.stringify(line)} at offset ${prefix.length}`;

        assert(!event.defaultPrevented, `Enter before ${label} uses native editing`, 'Enter should not continue the list');
        assert(editor.getValue() === value, `Enter before ${label} preserves the item`, 'The handler should not insert a duplicate marker');
        assert(
          editor.textarea.selectionStart === prefix.length && editor.textarea.selectionEnd === prefix.length,
          `Enter before ${label} preserves the cursor for native editing`,
          'The handler should leave the cursor before the existing marker'
        );
        assert(!editor.numberUpdateTimeout, `Enter before ${label} does not schedule renumbering`, 'Moving an item down should not renumber it');
        editor.destroy();
      }
    }

    for (const [value, cursor, expected, expectedCursor] of [
      ['- Item', 6, '- Item\n- ', 9],
      ['- [x] Done', 10, '- [x] Done\n- [ ] ', 17],
      ['1. Item', 7, '1. Item\n2. ', 11],
      ['- ', 2, '', 0],
      ['- [ ] ', 6, '', 0],
      ['1. ', 3, '', 0],
      ['- First second', 8, '- First \n- second', 11]
    ]) {
      const editor = createEditor();
      editor.setValue(value);
      editor.textarea.focus();
      editor.textarea.setSelectionRange(cursor, cursor);

      const event = dispatchKey(editor, 'Enter');
      const label = `${JSON.stringify(value)} at offset ${cursor}`;

      assert(event.defaultPrevented, `Enter in ${label} handles the list`, 'List continuation should still handle Enter');
      assert(editor.getValue() === expected, `Enter in ${label} produces the expected content`, JSON.stringify(editor.getValue()));
      assert(
        editor.textarea.selectionStart === expectedCursor && editor.textarea.selectionEnd === expectedCursor,
        `Enter in ${label} places the cursor correctly`,
        `Expected ${expectedCursor}, got ${editor.textarea.selectionStart}`
      );
      editor.destroy();
    }
  } finally {
    document.execCommand = originalExecCommand;
  }
})();

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
