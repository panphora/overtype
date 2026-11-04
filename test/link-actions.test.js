/**
 * Link action tests for OverType
 * Verifies custom linkActions patterns show and run the link tooltip.
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
global.CustomEvent = dom.window.CustomEvent;
global.MouseEvent = dom.window.MouseEvent;
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

function createEditor(options = {}) {
  const element = document.createElement('div');
  document.body.appendChild(element);

  return new OverType(element, options)[0];
}

function tick() {
  return new Promise(resolve => setTimeout(resolve, 0));
}

async function placeCursor(editor, position) {
  editor.textarea.setSelectionRange(position, position);
  editor.linkTooltip.checkCursorPosition();
  await tick();
}

function tooltipText(editor) {
  return editor.linkTooltip.tooltip.querySelector('.overtype-link-tooltip-url').textContent;
}

function isVisible(editor) {
  return editor.linkTooltip.tooltip.classList.contains('visible');
}

const datePattern = /\[\[(\d{4}-\d{2}-\d{2})\]\]/g;

console.log('🧪 Running Link Action Tests...\n');
console.log('━'.repeat(50));

console.log('\n📝 Custom action tooltip\n');

(async () => {
  {
    const calls = [];
    const editor = createEditor({
      value: 'see [[2026-10-06]] now',
      linkActions: [{
        pattern: datePattern,
        label: match => `Go to ${match[1]}`,
        onClick: (match, instance) => calls.push({ date: match[1], instance })
      }]
    });

    await placeCursor(editor, 12);

    assert(editor.linkTooltip.currentLink !== null, 'Action shows a tooltip', 'currentLink should be set');
    assert(tooltipText(editor) === 'Go to 2026-10-06', 'Action tooltip shows the label', `got "${tooltipText(editor)}"`);
    assert(isVisible(editor), 'Action tooltip is visible', 'tooltip should have the visible class');

    editor.linkTooltip.tooltip.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));

    assert(calls.length === 1, 'Click calls onClick once', `called ${calls.length} times`);
    assert(calls[0] && calls[0].date === '2026-10-06', 'onClick receives the match capture', 'match[1] should be the date');
    assert(calls[0] && calls[0].instance === editor, 'onClick receives the editor', 'second argument should be the editor');
    assert(!isVisible(editor), 'Click hides the tooltip', 'visible class should be removed');

    editor.destroy();
  }

  console.log('\n📝 Token boundaries\n');

  {
    const value = 'x [[2026-10-06]] y';
    const start = value.indexOf('[[');
    const end = start + '[[2026-10-06]]'.length;
    const editor = createEditor({
      value,
      linkActions: [{
        pattern: datePattern,
        label: match => `Go to ${match[1]}`,
        onClick: () => {}
      }]
    });

    await placeCursor(editor, start);
    assert(editor.linkTooltip.currentLink !== null, 'Cursor at the first boundary shows the tooltip', 'currentLink should be set');

    await placeCursor(editor, end);
    assert(editor.linkTooltip.currentLink !== null, 'Cursor at the last boundary shows the tooltip', 'currentLink should be set');

    editor.linkTooltip.hide();
    await placeCursor(editor, end + 1);
    assert(editor.linkTooltip.currentLink === null, 'Cursor one character outside does not set currentLink', 'currentLink should be null');

    editor.destroy();
  }

  console.log('\n📝 Rejected and throwing labels\n');

  {
    const editor = createEditor({
      value: 'see [[2026-10-06]] now',
      linkActions: [{
        pattern: datePattern,
        label: () => null,
        onClick: () => {}
      }]
    });

    await placeCursor(editor, 12);
    assert(editor.linkTooltip.currentLink === null, 'A null label shows nothing', 'currentLink should be null');
    assert(!isVisible(editor), 'A null label keeps the tooltip hidden', 'tooltip should not be visible');

    editor.destroy();
  }

  {
    const originalError = console.error;
    const errors = [];
    console.error = (...args) => errors.push(args);

    const editor = createEditor({
      value: 'see [[2026-10-06]] now',
      linkActions: [{
        pattern: datePattern,
        label: () => { throw new Error('label failed'); },
        onClick: () => {}
      }]
    });

    await placeCursor(editor, 12);
    assert(editor.linkTooltip.currentLink === null, 'A throwing label shows nothing', 'currentLink should be null');
    assert(errors.length === 1, 'A throwing label logs with console.error', `logged ${errors.length} times`);

    editor.textarea.setSelectionRange(0, 0);
    editor.linkTooltip.checkCursorPosition();
    await tick();
    assert(editor.getValue() === 'see [[2026-10-06]] now', 'The editor keeps working after a throwing label', 'value should be unchanged');

    console.error = originalError;
    editor.destroy();
  }

  console.log('\n📝 Real links take priority\n');

  {
    const opened = [];
    const clicked = [];
    const originalOpen = window.open;
    window.open = (url, target) => { opened.push({ url, target }); };

    const editor = createEditor({
      value: '[example](https://example.com)',
      linkActions: [{
        pattern: /\[example\]/g,
        label: () => 'Custom example',
        onClick: () => clicked.push(true)
      }]
    });

    await placeCursor(editor, 2);
    assert(editor.linkTooltip.currentLink !== null, 'A real link shows the tooltip', 'currentLink should be set');
    assert(editor.linkTooltip.currentLink.action === undefined, 'A real link wins over an action', 'currentLink should not have an action');
    assert(tooltipText(editor) === 'https://example.com', 'A real link shows its URL', `got "${tooltipText(editor)}"`);

    editor.linkTooltip.tooltip.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));

    assert(opened.length === 1 && opened[0].url === 'https://example.com', 'A real link calls window.open', 'window.open should be called');
    assert(clicked.length === 0, 'A real link does not call onClick', 'onClick should not be called');

    window.open = originalOpen;
    editor.destroy();
  }

  console.log('\n📝 Pattern without the g flag\n');

  {
    const originalWarn = console.warn;
    const warnings = [];
    console.warn = (...args) => warnings.push(args);

    const editor = createEditor({
      value: 'see [[2026-10-06]] now',
      linkActions: [{
        pattern: /\[\[(\d{4}-\d{2}-\d{2})\]\]/,
        label: () => 'Should not show',
        onClick: () => {}
      }]
    });

    await placeCursor(editor, 12);
    assert(editor.linkTooltip.currentLink === null, 'A pattern without g shows nothing', 'currentLink should be null');
    assert(warnings.length === 1, 'A pattern without g warns once', `warned ${warnings.length} times`);

    console.warn = originalWarn;
    editor.destroy();
  }

  console.log('\n📝 Throwing onClick\n');

  {
    const originalError = console.error;
    const errors = [];
    console.error = (...args) => errors.push(args);

    const editor = createEditor({
      value: 'see [[2026-10-06]] now',
      linkActions: [{
        pattern: datePattern,
        label: match => `Go to ${match[1]}`,
        onClick: () => { throw new Error('onClick failed'); }
      }]
    });

    await placeCursor(editor, 12);
    assert(isVisible(editor), 'Tooltip is visible before a throwing click', 'tooltip should be visible');

    editor.linkTooltip.tooltip.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));

    assert(errors.length === 1, 'A throwing onClick logs with console.error', `logged ${errors.length} times`);
    assert(!isVisible(editor), 'A throwing onClick still hides the tooltip', 'visible class should be removed');

    console.error = originalError;
    editor.destroy();
  }

  console.log('\n📝 No linkActions option\n');

  {
    const editor = createEditor({ value: 'see [[2026-10-06]] now' });

    await placeCursor(editor, 12);
    assert(editor.linkTooltip.currentLink === null, 'No linkActions option shows nothing', 'currentLink should be null');
    assert(!isVisible(editor), 'No linkActions option keeps the tooltip hidden', 'tooltip should not be visible');
    assert(editor.getValue() === 'see [[2026-10-06]] now', 'No linkActions option leaves the value alone', 'value should be unchanged');

    editor.destroy();
  }

  console.log('\n📝 Two tokens on one line\n');

  {
    const editor = createEditor({
      value: 'see [[2026-10-06]] and [[2026-10-07]] now',
      linkActions: [{
        pattern: datePattern,
        label: match => `Go to ${match[1]}`,
        onClick: () => {}
      }]
    });

    const secondStart = editor.getValue().indexOf('[[2026-10-07]]');
    await placeCursor(editor, secondStart + 5);

    assert(tooltipText(editor) === 'Go to 2026-10-07', 'The cursor in the second token reports the second match', `got "${tooltipText(editor)}"`);
    assert(editor.linkTooltip.currentLink.start === secondStart, 'The second match reports its own start', `got ${editor.linkTooltip.currentLink.start}`);

    editor.destroy();
  }

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
})();
