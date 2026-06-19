/**
 * Link paste tests for OverType.
 */

import { JSDOM } from 'jsdom';
import { OverType } from '../src/overtype.js';
import { MarkdownParser } from '../src/parser.js';

const dom = new JSDOM('<!DOCTYPE html><html><body><div id="editor"></div></body></html>', {
  pretendToBeVisual: true
});

global.window = dom.window;
global.document = dom.window.document;
global.Element = dom.window.Element;
global.Node = dom.window.Node;
global.NodeList = dom.window.NodeList;
global.HTMLElement = dom.window.HTMLElement;
global.Event = dom.window.Event;
global.CustomEvent = dom.window.CustomEvent;
global.KeyboardEvent = dom.window.KeyboardEvent;
global.customElements = dom.window.customElements;
global.CSS = { supports: () => false };
global.performance = { now: () => Date.now() };
global.requestAnimationFrame = (callback) => setTimeout(callback, 0);
global.cancelAnimationFrame = (id) => clearTimeout(id);

Object.defineProperty(global, 'navigator', {
  configurable: true,
  value: dom.window.navigator
});

Object.defineProperty(dom.window.navigator, 'platform', {
  configurable: true,
  value: 'Win32'
});

if (!document.execCommand) {
  document.execCommand = () => false;
}

let passed = 0;
let failed = 0;

function assert(condition, testName, message) {
  if (condition) {
    passed++;
    console.log(`✓ ${testName}`);
    return;
  }

  failed++;
  console.error(`✗ ${testName}: ${message}`);
}

function resetDOM(markup = '<div id="editor"></div>') {
  document.body.innerHTML = markup;
}

function createEditor(options = {}) {
  resetDOM();

  return new OverType('#editor', options)[0];
}

function dispatchPasteTo(target, text, { files = [] } = {}) {
  const event = new window.Event('paste', {
    bubbles: true,
    cancelable: true
  });

  Object.defineProperty(event, 'clipboardData', {
    value: {
      files,
      getData(type) {
        return type === 'text/plain' ? text : '';
      }
    }
  });

  target.dispatchEvent(event);

  return event;
}

function dispatchPaste(editor, text, options = {}) {
  return dispatchPasteTo(editor.textarea, text, options);
}

function dispatchPlainPasteShortcut(editor) {
  const event = new window.KeyboardEvent('keydown', {
    key: 'v',
    ctrlKey: true,
    shiftKey: true,
    bubbles: true,
    cancelable: true
  });

  editor.textarea.dispatchEvent(event);

  return event;
}

function selectText(editor, text) {
  const start = editor.getValue().indexOf(text);
  editor.textarea.setSelectionRange(start, start + text.length);
}

console.log('🔗 Running Link Paste Tests...\n');
console.log('━'.repeat(50));

console.log('\n📝 URL paste behavior\n');

(() => {
  const editor = createEditor({ value: 'See Example today' });
  selectText(editor, 'Example');

  const event = dispatchPaste(editor, ' https://example.com ');

  assert(event.defaultPrevented, 'Selected URL paste is handled', 'Expected URL paste to be prevented');
  assert(
    editor.getValue() === 'See [Example](https://example.com) today',
    'Selected URL paste wraps selected text',
    `Unexpected value: ${editor.getValue()}`
  );
})();

(() => {
  const editor = createEditor({ value: 'Visit ' });
  editor.textarea.setSelectionRange(6, 6);

  const event = dispatchPaste(editor, 'https://example.com');

  assert(!event.defaultPrevented, 'Collapsed URL paste is native', 'Expected URL paste to stay native');
  assert(
    editor.getValue() === 'Visit ',
    'Collapsed URL paste does not edit content in tests',
    `Unexpected value: ${editor.getValue()}`
  );
})();

(() => {
  const editor = createEditor({ value: 'Example' });
  selectText(editor, 'Example');
  dispatchPlainPasteShortcut(editor);

  const bypassedEvent = dispatchPaste(editor, 'https://example.com');
  const handledEvent = dispatchPaste(editor, 'https://example.com');

  assert(!bypassedEvent.defaultPrevented, 'Ctrl+Shift+V bypasses link paste once', 'Expected first paste to stay native');
  assert(handledEvent.defaultPrevented, 'Ctrl+Shift+V bypass is cleared after one paste', 'Expected second paste to be handled');
})();

console.log('\n🚫 Non-link paste behavior\n');

(() => {
  const editor = createEditor({ value: 'Example' });
  selectText(editor, 'Example');

  const event = dispatchPaste(editor, 'javascript:alert(1)');

  assert(!event.defaultPrevented, 'Dangerous scheme paste is native', 'Expected javascript: paste to remain native');
  assert(editor.getValue() === 'Example', 'Dangerous scheme paste does not edit content', 'Expected content to remain unchanged');
})();

(() => {
  const editor = createEditor({ value: 'Example' });
  selectText(editor, 'Example');

  const relativeEvent = dispatchPaste(editor, '/relative/path');
  const bareDomainEvent = dispatchPaste(editor, 'example.com');

  assert(!relativeEvent.defaultPrevented, 'Relative URL paste is native', 'Expected relative URL paste to remain native');
  assert(!bareDomainEvent.defaultPrevented, 'Bare domain paste is native', 'Expected bare domain paste to remain native');
  assert(editor.getValue() === 'Example', 'Native non-link pastes do not edit content in tests', 'Expected content unchanged');
})();

(() => {
  const editor = createEditor({ value: 'Example', linkPaste: false });
  selectText(editor, 'Example');

  const event = dispatchPaste(editor, 'https://example.com');

  assert(!event.defaultPrevented, 'linkPaste false disables URL handling', 'Expected paste to stay native');
  assert(editor.getValue() === 'Example', 'linkPaste false does not edit content', 'Expected content unchanged');
})();

console.log('\n📎 File paste precedence\n');

(() => {
  const file = { name: 'photo.png', size: 100, type: 'image/png' };
  const editor = createEditor({
    value: 'Example',
    fileUpload: {
      enabled: true,
      onInsertFile: async () => '![photo.png](/uploads/photo.png)'
    }
  });

  selectText(editor, 'Example');

  const event = dispatchPaste(editor, 'https://example.com', { files: [file] });

  assert(event.defaultPrevented, 'File paste is handled by file upload', 'Expected file upload to prevent paste');
  assert(
    editor.getValue().includes('Uploading photo.png'),
    'File paste does not become a markdown link',
    `Expected upload placeholder. Got ${editor.getValue()}`
  );
})();

console.log('\n🔁 Lifecycle and declarative options\n');

(() => {
  const editor = createEditor({ value: 'Example' });

  editor.reinit({ linkPaste: false });
  selectText(editor, 'Example');
  const disabledEvent = dispatchPaste(editor, 'https://example.com');

  editor.reinit({ linkPaste: true });
  selectText(editor, 'Example');
  const enabledEvent = dispatchPaste(editor, 'https://example.com');

  assert(!disabledEvent.defaultPrevented, 'reinit can disable link paste', 'Expected disabled paste to stay native');
  assert(enabledEvent.defaultPrevented, 'reinit can enable link paste', 'Expected enabled paste to be handled');
})();

(() => {
  const editor = createEditor({ value: 'Example' });
  selectText(editor, 'Example');
  const textarea = editor.textarea;

  editor.destroy();

  const event = dispatchPasteTo(textarea, 'https://example.com');

  assert(!event.defaultPrevented, 'destroy removes link paste listener', 'Expected detached textarea paste to stay native');
  assert(textarea.value === 'Example', 'destroyed listener does not edit detached textarea', 'Expected content unchanged');
})();

(() => {
  resetDOM('<div class="editor" data-ot-link-paste="false">Example</div>');
  const editor = OverType.initFromData('.editor')[0];
  selectText(editor, 'Example');

  const event = dispatchPaste(editor, 'https://example.com');

  assert(editor.options.linkPaste === false, 'data-ot-link-paste false maps to option', 'Expected option to be false');
  assert(!event.defaultPrevented, 'data-ot-link-paste false disables behavior', 'Expected paste to stay native');
})();

await import('../src/overtype-webcomponent.js');

(() => {
  resetDOM('<overtype-editor id="web-component-editor" link-paste="false">Example</overtype-editor>');
  const component = document.getElementById('web-component-editor');
  const editor = component.getEditor();

  selectText(editor, 'Example');
  const event = dispatchPaste(editor, 'https://example.com');

  assert(editor.options.linkPaste === false, 'web component link-paste false maps to option', 'Expected option to be false');
  assert(!event.defaultPrevented, 'web component link-paste false disables behavior', 'Expected paste to stay native');
})();

console.log('\n🧼 URL sanitizer alignment\n');

(() => {
  const tel = MarkdownParser.parse('[Call](tel:+123456789)');
  const sms = MarkdownParser.parse('[Text](sms:+123456789)');

  assert(tel.includes('href="tel:+123456789"'), 'tel links render as safe hrefs', `Unexpected tel render: ${tel}`);
  assert(sms.includes('href="sms:+123456789"'), 'sms links render as safe hrefs', `Unexpected sms render: ${sms}`);
})();

console.log('\n' + '━'.repeat(50));
console.log('\n📊 Test Results Summary\n');
console.log(`✅ Passed: ${passed}`);
console.log(`❌ Failed: ${failed}`);
console.log(`📈 Total:  ${passed + failed}`);
console.log(`🎯 Success Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%`);

if (failed > 0) {
  console.error(`\n❌ ${failed} test(s) failed!`);
  process.exit(1);
}

console.log('\n✅ All tests passed!');
process.exit(0);
