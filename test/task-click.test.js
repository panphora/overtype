/**
 * Click-to-toggle task tests for OverType
 * Drives the delegated click listener with real MouseEvents and jsdom
 * client-rect fixtures, since jsdom does not lay out ranges itself.
 */

import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';

const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', { pretendToBeVisual: true });
const w = dom.window;

global.window = w;
global.document = w.document;
global.Element = w.Element;
global.NodeList = w.NodeList;
global.HTMLElement = w.HTMLElement;
global.customElements = w.customElements;
global.Node = w.Node;
global.Event = w.Event;
global.CustomEvent = w.CustomEvent;
global.MouseEvent = w.MouseEvent;
global.getComputedStyle = w.getComputedStyle.bind(w);
global.performance = { now: () => Date.now() };
global.CSS = { supports: () => false };
global.requestAnimationFrame = callback => setTimeout(callback, 0);

const CHAR_WIDTH = 8;
const LINE_HEIGHT = 20;

const layoutRows = new WeakMap();
const rangeQueries = [];

function layout(node, rows) {
  layoutRows.set(node, rows.map(row => ({
    start: 0,
    end: node.textContent.length,
    left: 0,
    top: 0,
    ...row
  })));
  return node;
}

function layoutLine(node, options = {}) {
  return layout(node, [options]);
}

function rectFor(container, offset) {
  const rows = layoutRows.get(container);
  if (!rows) return null;

  const row = rows.find(candidate => offset >= candidate.start && offset < candidate.end);
  if (!row) return null;

  const left = row.left + (offset - row.start) * CHAR_WIDTH;
  return { left, right: left + CHAR_WIDTH, top: row.top, bottom: row.top + LINE_HEIGHT };
}

w.Range.prototype.getClientRects = function () {
  rangeQueries.push({ container: this.startContainer, start: this.startOffset, end: this.endOffset });
  return (layoutRows.get(this.startContainer) || []).flatMap(row => {
    const start = Math.max(this.startOffset, row.start);
    const end = Math.min(this.endOffset, row.end);
    if (start >= end) return [];
    const left = row.left + (start - row.start) * CHAR_WIDTH;
    return [{ left, right: left + (end - start) * CHAR_WIDTH, top: row.top, bottom: row.top + LINE_HEIGHT }];
  });
};

const { OverType } = await import('../src/overtype.js');
await import('../src/overtype-webcomponent.js');

function createEditor(options = {}) {
  const element = document.createElement('div');
  document.body.appendChild(element);
  return new OverType(element, options)[0];
}

function createWebComponent() {
  const element = document.createElement('overtype-editor');
  document.body.appendChild(element);
  return element;
}

function taskMarker(editor, index = 0) {
  const item = editor.preview.querySelectorAll('li.task-list')[index];
  return item.querySelector(':scope > .syntax-marker').firstChild;
}

function rawLineText(editor, index = 0) {
  return editor.preview.querySelectorAll('div.raw-line')[index].firstChild;
}

function clickPoint(editor, x, y, button = 0, extra = {}) {
  editor.textarea.dispatchEvent(new w.MouseEvent('click', {
    bubbles: true,
    cancelable: true,
    button,
    ...extra,
    clientX: x,
    clientY: y
  }));
}

function clickNode(editor, node, options = {}) {
  if (!layoutRows.has(node)) layoutLine(node);

  const inside = node.textContent.indexOf('[') + 1;
  const rect = rectFor(node, inside + (options.shiftChars ?? 0));
  clickPoint(
    editor,
    rect.left + CHAR_WIDTH / 2,
    rect.top + LINE_HEIGHT / 2 + (options.shiftY ?? 0),
    options.button ?? 0,
    { composed: options.composed ?? false, shiftKey: options.shiftKey ?? false }
  );
}

function clickTask(editor, index = 0, options = {}) {
  clickNode(editor, taskMarker(editor, index), options);
}

function changedIndexes(before, after) {
  const indexes = [];
  for (let i = 0; i < Math.max(before.length, after.length); i++) {
    if (before[i] !== after[i]) indexes.push(i);
  }
  return indexes;
}

const tests = [];

function test(name, run) {
  tests.push({ name, run });
}

test('clickToToggleTasks is off by default', () => {
  const editor = createEditor();
  editor.setValue('- [ ] default off');

  assert.equal(editor.options.clickToToggleTasks, false);
  clickTask(editor, 0);
  assert.equal(editor.getValue(), '- [ ] default off');
});

test('an enabled click toggles unchecked, checked and uppercase states', () => {
  const editor = createEditor({ clickToToggleTasks: true });
  editor.setValue('- [ ] open\n- [x] done\n- [X] loud');

  clickTask(editor, 0);
  assert.equal(editor.getValue(), '- [x] open\n- [x] done\n- [X] loud');

  clickTask(editor, 1);
  assert.equal(editor.getValue(), '- [x] open\n- [ ] done\n- [X] loud');

  clickTask(editor, 2);
  assert.equal(editor.getValue(), '- [x] open\n- [ ] done\n- [ ] loud');
});

test('the hit region covers the complete task marker', () => {
  const editor = createEditor({ clickToToggleTasks: true });
  editor.setValue('- [ ] exact');
  editor.textarea.setSelectionRange(0, 0);

  const node = taskMarker(editor, 0);
  layoutLine(node);
  rangeQueries.length = 0;
  clickTask(editor, 0);

  assert.equal(rangeQueries.length, 1);
  const [query] = rangeQueries;
  assert.equal(query.container, node);
  assert.equal(query.end - query.start, 3);
  assert.equal(query.start, node.textContent.indexOf('['));
  assert.equal(node.textContent.slice(query.start, query.end), '[ ]');

  assert.equal(editor.getValue(), '- [x] exact');
  assert.equal(editor.textarea.selectionStart, 0);
  assert.equal(editor.textarea.selectionEnd, 0);
});

test('clicks outside the task marker do not toggle', () => {
  const editor = createEditor({ clickToToggleTasks: true });
  editor.setValue('- [ ] outside');

  clickTask(editor, 0, { shiftChars: -2 });
  assert.equal(editor.getValue(), '- [ ] outside', 'the separator space before the box is outside the hit region');

  clickTask(editor, 0, { shiftChars: 2 });
  assert.equal(editor.getValue(), '- [ ] outside', 'the separator space after the box is outside the hit region');

  clickTask(editor, 0, { shiftChars: -3 });
  assert.equal(editor.getValue(), '- [ ] outside', 'the dash is outside the hit region');

  clickPoint(editor, 6 * CHAR_WIDTH + CHAR_WIDTH / 2, LINE_HEIGHT / 2);
  assert.equal(editor.getValue(), '- [ ] outside', 'the task label is outside the hit region');

  clickTask(editor, 0, { shiftY: -LINE_HEIGHT });
  assert.equal(editor.getValue(), '- [ ] outside', 'a point above the character is outside the hit region');

  clickTask(editor, 0, { shiftY: LINE_HEIGHT });
  assert.equal(editor.getValue(), '- [ ] outside', 'a point below the character is outside the hit region');

  const node = taskMarker(editor, 0);
  layoutLine(node);
  clickPoint(editor, 900, 10);
  assert.equal(editor.getValue(), '- [ ] outside', 'a point far to the right is outside the hit region');
});

test('either bracket toggles exactly once in both marker states', () => {
  const unchecked = '- [ ] brackets';
  const checked = '- [x] brackets';

  const run = (start, afterOpening) => {
    const editor = createEditor({ clickToToggleTasks: true });
    editor.setValue(start);
    editor.textarea.setSelectionRange(6, 11, 'backward');

    clickTask(editor, 0, { shiftChars: -1 });
    assert.equal(editor.getValue(), afterOpening, 'the opening bracket toggles once');
    assert.deepEqual(changedIndexes(start, editor.getValue()), [3]);
    assert.equal(editor.textarea.selectionStart, 6);
    assert.equal(editor.textarea.selectionEnd, 11);
    assert.equal(editor.textarea.selectionDirection, 'backward');

    clickTask(editor, 0, { shiftChars: 1 });
    assert.equal(editor.getValue(), start, 'the closing bracket toggles back once');
    assert.deepEqual(changedIndexes(afterOpening, editor.getValue()), [3]);
    assert.equal(editor.textarea.selectionStart, 6);
    assert.equal(editor.textarea.selectionEnd, 11);
    assert.equal(editor.textarea.selectionDirection, 'backward');
  };

  run(unchecked, checked);
  run(checked, unchecked);
});

test('coordinates at the bracket cell edges toggle and just outside misses', () => {
  const unchecked = '- [ ] edge cells';
  const checked = '- [x] edge cells';
  const editor = createEditor({ clickToToggleTasks: true });
  editor.setValue(unchecked);

  const relayout = () => layoutLine(taskMarker(editor, 0));
  relayout();
  const y = LINE_HEIGHT / 2;

  clickPoint(editor, 2 * CHAR_WIDTH - 0.25, y);
  assert.equal(editor.getValue(), unchecked, 'a point just before the marker is outside the hit region');

  clickPoint(editor, 5 * CHAR_WIDTH + 0.25, y);
  assert.equal(editor.getValue(), unchecked, 'a point just after the marker is outside the hit region');

  clickPoint(editor, 2 * CHAR_WIDTH + 0.25, y);
  assert.equal(editor.getValue(), checked, 'the left edge of the opening bracket cell toggles');
  assert.deepEqual(changedIndexes(unchecked, editor.getValue()), [3]);

  relayout();
  clickPoint(editor, 3 * CHAR_WIDTH - 0.25, y);
  assert.equal(editor.getValue(), unchecked, 'the right edge of the opening bracket cell toggles back');

  relayout();
  clickPoint(editor, 4 * CHAR_WIDTH + 0.25, y);
  assert.equal(editor.getValue(), checked, 'the left edge of the closing bracket cell toggles');
  assert.deepEqual(changedIndexes(unchecked, editor.getValue()), [3]);

  relayout();
  clickPoint(editor, 5 * CHAR_WIDTH - 0.25, y);
  assert.equal(editor.getValue(), unchecked, 'the right edge of the closing bracket cell toggles back');
});

test('a non-primary button does not toggle', () => {
  const editor = createEditor({ clickToToggleTasks: true });
  editor.setValue('- [ ] right click');

  clickTask(editor, 0, { button: 2 });
  assert.equal(editor.getValue(), '- [ ] right click');
});

test('a shift click inside the box still toggles', () => {
  const editor = createEditor({ clickToToggleTasks: true });
  editor.setValue('- [ ] shift');

  clickTask(editor, 0, { shiftKey: true });
  assert.equal(editor.getValue(), '- [x] shift');
});

test('indented tasks toggle at their own layout position', () => {
  const editor = createEditor({ clickToToggleTasks: true });
  editor.setValue('  - [ ] indented');

  const node = taskMarker(editor, 0);
  layoutLine(node, { left: 2 * CHAR_WIDTH });
  clickPoint(editor, 0, LINE_HEIGHT / 2);
  assert.equal(editor.getValue(), '  - [ ] indented', 'the unindented position is outside the hit region');

  clickTask(editor, 0, { shiftChars: -1 });
  assert.equal(editor.getValue(), '  - [x] indented', 'the opening bracket toggles at the indented position');
});

test('extra spacing after the box toggles the same character', () => {
  const editor = createEditor({ clickToToggleTasks: true });
  editor.setValue('- [ ]   spaced');

  clickTask(editor, 0);
  assert.equal(editor.getValue(), '- [x]   spaced');
  assert.deepEqual(changedIndexes('- [ ]   spaced', editor.getValue()), [3]);
});

test('tab-indented lines are not tasks and stay unchanged', () => {
  const editor = createEditor({ clickToToggleTasks: true });
  editor.setValue('\t- [ ] tabbed\n- [ ] real');

  assert.equal(editor.preview.querySelectorAll('li.task-list').length, 1);

  clickTask(editor, 0);
  assert.equal(editor.getValue(), '\t- [ ] tabbed\n- [x] real');
});

test('duplicate task text toggles the clicked source line', () => {
  const editor = createEditor({ clickToToggleTasks: true });
  const source = '- [ ] same\n- [ ] same';
  editor.setValue(source);

  clickTask(editor, 1);

  const expected = '- [ ] same\n- [x] same';
  assert.equal(editor.getValue(), expected);
  assert.deepEqual(changedIndexes(source, expected), [source.indexOf('\n') + 1 + 3]);
});

test('fenced task text stays unchanged while a real task below toggles', () => {
  const editor = createEditor({ clickToToggleTasks: true });
  editor.setValue('```\n- [ ] fenced\n```\n- [ ] real');

  assert.equal(editor.preview.querySelectorAll('li.task-list').length, 1);
  assert.equal(editor.preview.querySelectorAll('div.raw-line').length, 0);

  clickTask(editor, 0);

  const value = editor.getValue();
  assert.equal(value, '```\n- [ ] fenced\n```\n- [x] real');
  assert.equal(value.slice(0, '```\n- [ ] fenced\n```'.length), '```\n- [ ] fenced\n```');
});

test('an active raw task line toggles through the raw line node', () => {
  const editor = createEditor({ clickToToggleTasks: true, showActiveLineRaw: true });
  editor.setValue('- [ ] raw\n- [x] other');
  editor.textarea.setSelectionRange(5, 5);
  editor.updatePreview();

  assert.equal(editor.preview.querySelectorAll('div.raw-line').length, 1);
  assert.equal(editor.preview.querySelectorAll('li.task-list').length, 1);

  clickNode(editor, rawLineText(editor, 0), { shiftChars: -1 });

  assert.equal(editor.getValue(), '- [x] raw\n- [x] other');

  clickNode(editor, rawLineText(editor, 0), { shiftChars: 1 });

  assert.equal(editor.getValue(), '- [ ] raw\n- [x] other');
});

test('wrapped layout spreads the hit region across both rows', () => {
  const unchecked = '- [ ] wrapped';
  const checked = '- [x] wrapped';
  const editor = createEditor({ clickToToggleTasks: true });
  editor.setValue(unchecked);

  const relayout = () => {
    const node = taskMarker(editor, 0);
    layout(node, [
      { start: 0, end: 3, left: 40, top: 12 },
      { start: 3, end: node.textContent.length, left: 8, top: 32 }
    ]);
  };

  relayout();

  clickPoint(editor, 40 + 3 * CHAR_WIDTH + CHAR_WIDTH / 2, 12 + LINE_HEIGHT / 2);
  assert.equal(editor.getValue(), unchecked, 'the first row beyond the marker is outside the hit region');

  clickPoint(editor, 40 + 2 * CHAR_WIDTH + CHAR_WIDTH / 2, 12 + LINE_HEIGHT / 2);
  assert.equal(editor.getValue(), checked, 'the opening bracket on the first row toggles');
  assert.deepEqual(changedIndexes(unchecked, editor.getValue()), [3]);

  relayout();

  clickPoint(editor, 8 + 6 * CHAR_WIDTH + CHAR_WIDTH / 2, 32 + LINE_HEIGHT / 2);
  assert.equal(editor.getValue(), checked, 'the task label on the second row does not toggle');

  clickPoint(editor, 8 + CHAR_WIDTH + CHAR_WIDTH / 2, 32 + LINE_HEIGHT / 2);
  assert.equal(editor.getValue(), unchecked, 'the closing bracket on the second row toggles the same task');
  assert.deepEqual(changedIndexes(checked, editor.getValue()), [3]);
});

test('scrolled layout is driven by the preview client rects', () => {
  const editor = createEditor({ clickToToggleTasks: true });
  editor.setValue('- [ ] scrolled');

  layoutLine(taskMarker(editor, 0), { left: 96, top: 640 });

  clickPoint(editor, 0, 0);
  assert.equal(editor.getValue(), '- [ ] scrolled', 'an unscrolled point is outside the hit region');

  clickTask(editor, 0);
  assert.equal(editor.getValue(), '- [x] scrolled');
});

test('disabled and readOnly textareas do not toggle', () => {
  const editor = createEditor({ clickToToggleTasks: true });
  editor.setValue('- [ ] locked');

  editor.textarea.disabled = true;
  clickTask(editor, 0);
  assert.equal(editor.getValue(), '- [ ] locked', 'a disabled textarea is not editable');

  editor.textarea.disabled = false;
  editor.textarea.readOnly = true;
  clickTask(editor, 0);
  assert.equal(editor.getValue(), '- [ ] locked', 'a readOnly textarea is not editable');

  editor.textarea.readOnly = false;
  clickTask(editor, 0);
  assert.equal(editor.getValue(), '- [x] locked');
});

test('preview mode ignores clicks even when task markup is present', () => {
  const editor = createEditor({ clickToToggleTasks: true });
  editor.setValue('- [ ] preview');

  const node = taskMarker(editor, 0);
  layoutLine(node);
  editor.container.dataset.mode = 'preview';

  clickTask(editor, 0);
  assert.equal(editor.getValue(), '- [ ] preview');

  editor.container.dataset.mode = 'normal';
  clickTask(editor, 0);
  assert.equal(editor.getValue(), '- [x] preview');
});

test('the public preview mode renders checkboxes and ignores textarea clicks', () => {
  const editor = createEditor({ clickToToggleTasks: true });
  editor.setValue('- [ ] checkbox');

  editor.showPreviewMode();

  assert.equal(editor.container.dataset.mode, 'preview');
  assert.equal(editor.preview.querySelectorAll('li.task-list input[type="checkbox"]').length, 1);
  clickPoint(editor, 12, 10);
  assert.equal(editor.getValue(), '- [ ] checkbox');

  editor.showNormalEditMode();
  clickTask(editor, 0);
  assert.equal(editor.getValue(), '- [x] checkbox');
});

test('onChange fires once per toggle and not for a miss', () => {
  const seen = [];
  const editor = createEditor({ clickToToggleTasks: true, onChange: value => seen.push(value) });
  editor.setValue('- [ ] notify');
  seen.length = 0;

  clickTask(editor, 0);
  assert.deepEqual(seen, ['- [x] notify']);

  clickTask(editor, 0, { shiftChars: -2 });
  assert.deepEqual(seen, ['- [x] notify']);
});

test('the toggled value persists in the textarea', () => {
  const editor = createEditor({ clickToToggleTasks: true, persist: true });
  editor.setValue('- [ ] persist');

  clickTask(editor, 0);

  assert.equal(editor.textarea.value, '- [x] persist');
  assert.equal(editor.getValue(), '- [x] persist');
  assert.equal(editor.wrapper.querySelector('.overtype-input').value, '- [x] persist');
});

test('reinit turns the option off and on again', () => {
  const editor = createEditor({ clickToToggleTasks: false });
  editor.setValue('- [ ] reinit');

  clickTask(editor, 0);
  assert.equal(editor.getValue(), '- [ ] reinit');

  editor.reinit({ clickToToggleTasks: true });
  clickTask(editor, 0);
  assert.equal(editor.getValue(), '- [x] reinit');

  editor.reinit({ clickToToggleTasks: false });
  clickTask(editor, 0);
  assert.equal(editor.getValue(), '- [x] reinit');
});

test('a destroyed instance does not respond', () => {
  const editor = createEditor({ clickToToggleTasks: true, persist: true });
  editor.setValue('- [ ] destroyed');
  editor.destroy();

  assert.equal(editor.wrapper._instance, null);
  assert.equal(editor.wrapper.querySelector('.overtype-input').value, '- [ ] destroyed');

  clickPoint(editor, 12, 10);
  assert.equal(editor.wrapper.querySelector('.overtype-input').value, '- [ ] destroyed');
});

test('the web component toggles tasks from clicks inside its shadow DOM', () => {
  const component = createWebComponent();
  const editor = component.getEditor();
  assert.ok(editor, 'the component initializes an editor');

  editor.setValue('- [ ] shadow');
  editor.reinit({ clickToToggleTasks: true });

  const changes = [];
  component.addEventListener('change', e => changes.push(e.detail.value));

  clickTask(editor, 0, { composed: true, shiftChars: -1 });
  assert.equal(editor.getValue(), '- [x] shadow');
  assert.deepEqual(changes, ['- [x] shadow'], 'exactly one change event per toggle');

  clickTask(editor, 0, { composed: true, shiftChars: 1 });
  assert.equal(editor.getValue(), '- [ ] shadow');
  assert.deepEqual(changes, ['- [x] shadow', '- [ ] shadow']);

  editor.reinit({ clickToToggleTasks: false });
  clickTask(editor, 0, { composed: true });
  assert.equal(editor.getValue(), '- [ ] shadow', 'a disabled option ignores shadow DOM clicks');
  assert.deepEqual(changes, ['- [x] shadow', '- [ ] shadow']);

  component.remove();
});

test('removing the web component tears down the forwarded click listener', () => {
  const component = createWebComponent();
  const editor = component.getEditor();
  assert.ok(editor, 'the component initializes an editor');

  editor.setValue('- [ ] detached');
  editor.reinit({ clickToToggleTasks: true });

  const changes = [];
  component.addEventListener('change', e => changes.push(e.detail.value));

  clickTask(editor, 0, { composed: true });
  assert.equal(editor.getValue(), '- [x] detached');

  component.remove();

  assert.equal(component.getEditor(), null);
  assert.equal(component.shadowRoot.childElementCount, 0);

  clickTask(editor, 0, { composed: true });
  assert.equal(editor.getValue(), '- [x] detached', 'a disconnected textarea no longer toggles');
  assert.deepEqual(changes, ['- [x] detached'], 'no change event fires after removal');
});

function inputCounter(editor) {
  let count = 0;
  editor.wrapper.addEventListener('input', () => { count++; });
  return () => count;
}

function withExecCommand(stub, run) {
  const original = document.execCommand;
  document.execCommand = stub;
  try {
    run();
  } finally {
    document.execCommand = original;
  }
}

test('a native execCommand input event is not duplicated', () => {
  const seen = [];
  const editor = createEditor({ clickToToggleTasks: true, onChange: value => seen.push(value) });
  editor.setValue('- [ ] native');
  const inputs = inputCounter(editor);
  editor.textarea.setSelectionRange(2, 5, 'backward');
  seen.length = 0;

  withExecCommand((command, _ui, value) => {
    assert.equal(command, 'insertText');
    editor.textarea.setRangeText(value, editor.textarea.selectionStart, editor.textarea.selectionEnd, 'preserve');
    editor.textarea.dispatchEvent(new w.InputEvent('input', { bubbles: true }));
    return true;
  }, () => clickTask(editor, 0));

  assert.equal(editor.getValue(), '- [x] native');
  assert.deepEqual(changedIndexes('- [ ] native', editor.getValue()), [3]);
  assert.deepEqual(seen, ['- [x] native']);
  assert.equal(inputs(), 1, 'the native input event is the only notification');
  assert.equal(editor.textarea.selectionStart, 2);
  assert.equal(editor.textarea.selectionEnd, 5);
  assert.equal(editor.textarea.selectionDirection, 'backward');
});

test('execCommand that returns true without an input event still reports one change', () => {
  const seen = [];
  const editor = createEditor({ clickToToggleTasks: true, onChange: value => seen.push(value) });
  editor.setValue('- [ ] silent');
  const inputs = inputCounter(editor);
  seen.length = 0;

  withExecCommand((_command, _ui, value) => {
    editor.textarea.setRangeText(value, editor.textarea.selectionStart, editor.textarea.selectionEnd, 'preserve');
    return true;
  }, () => clickTask(editor, 0));

  assert.equal(editor.getValue(), '- [x] silent');
  assert.deepEqual(changedIndexes('- [ ] silent', editor.getValue()), [3]);
  assert.deepEqual(seen, ['- [x] silent']);
  assert.equal(inputs(), 1, 'exactly one synthesized input event');
});

test('execCommand returning false falls back and reports one change', () => {
  const seen = [];
  const editor = createEditor({ clickToToggleTasks: true, onChange: value => seen.push(value) });
  editor.setValue('- [x] refused');
  const inputs = inputCounter(editor);
  seen.length = 0;

  withExecCommand(() => false, () => clickTask(editor, 0));

  assert.equal(editor.getValue(), '- [ ] refused');
  assert.deepEqual(changedIndexes('- [x] refused', editor.getValue()), [3]);
  assert.deepEqual(seen, ['- [ ] refused']);
  assert.equal(inputs(), 1, 'exactly one synthesized input event');
});

test('execCommand throwing falls back and reports one change', () => {
  const seen = [];
  const editor = createEditor({ clickToToggleTasks: true, onChange: value => seen.push(value) });
  editor.setValue('- [ ] throwing');
  const inputs = inputCounter(editor);
  seen.length = 0;

  withExecCommand(() => { throw new Error('execCommand unavailable'); }, () => clickTask(editor, 0));

  assert.equal(editor.getValue(), '- [x] throwing');
  assert.deepEqual(changedIndexes('- [ ] throwing', editor.getValue()), [3]);
  assert.deepEqual(seen, ['- [x] throwing']);
  assert.equal(inputs(), 1, 'exactly one synthesized input event');
});

function errorRecorder() {
  const errors = [];
  const onError = event => errors.push(event);
  window.addEventListener('error', onError);
  return {
    errors,
    stop: () => window.removeEventListener('error', onError)
  };
}

function assertSplitMarkerIsInert() {
  const before = '- [ ] above\n- [x] split\n- [ ] below';
  const seen = [];
  const editor = createEditor({ clickToToggleTasks: true, onChange: value => seen.push(value) });
  editor.setValue(before);
  const inputs = inputCounter(editor);
  seen.length = 0;

  assert.equal(taskMarker(editor, 1).textContent, '- [x', 'the checkbox marker is split after x');

  clickTask(editor, 1);
  assert.equal(editor.getValue(), before, 'the split marker itself does not toggle');
  assert.deepEqual(seen, []);

  const node = taskMarker(editor, 2);
  assert.equal(node.textContent, '- [ ] ', 'the later task keeps its own intact marker');
  layoutLine(node);
  clickPoint(editor, 2 * CHAR_WIDTH + CHAR_WIDTH / 4, LINE_HEIGHT / 2);

  assert.equal(editor.getValue(), '- [ ] above\n- [x] split\n- [x] below');
  assert.deepEqual(changedIndexes(before, editor.getValue()), [27]);
  assert.deepEqual(seen, ['- [ ] above\n- [x] split\n- [x] below']);
  assert.equal(inputs(), 1, 'exactly one input event per toggle');
}

test('a custom syntax processor that wraps the checkbox does not break later task clicks', () => {
  const recorder = errorRecorder();
  OverType.setCustomSyntax(html => html.replace(/\[x\]/g, '<span class="done">[x]</span>'));
  try {
    const before = '- [ ] above\n- [x] split\n- [ ] below';
    const seen = [];
    const editor = createEditor({ clickToToggleTasks: true, onChange: value => seen.push(value) });
    editor.setValue(before);
    const inputs = inputCounter(editor);
    seen.length = 0;

    assert.equal(taskMarker(editor, 1).textContent, '- ', 'the checkbox marker is split before the bracket');

    const node = taskMarker(editor, 2);
    assert.equal(node.textContent, '- [ ] ', 'the later task keeps its own intact marker');
    layoutLine(node);
    clickPoint(editor, 2 * CHAR_WIDTH + CHAR_WIDTH / 4, LINE_HEIGHT / 2);

    assert.equal(editor.getValue(), '- [ ] above\n- [x] split\n- [x] below');
    assert.deepEqual(changedIndexes(before, editor.getValue()), [27]);
    assert.deepEqual(seen, ['- [ ] above\n- [x] split\n- [x] below']);
    assert.equal(inputs(), 1, 'exactly one input event per toggle');
    assert.equal(recorder.errors.length, 0, 'no window error event');
  } finally {
    OverType.setCustomSyntax(null);
    recorder.stop();
  }
});

test('a custom syntax processor that splits the marker after x does not overrun the range', () => {
  const recorder = errorRecorder();
  try {
    OverType.setCustomSyntax(html => html.replace(/x\]/g, 'x<span class="done"></span>]'));
    assertSplitMarkerIsInert();

    OverType.setCustomSyntax(html => html.replace(/x\]/g, 'x<span class="done">[x]</span>]'));
    assertSplitMarkerIsInert();

    assert.equal(recorder.errors.length, 0, 'no window error event');
  } finally {
    OverType.setCustomSyntax(null);
    recorder.stop();
  }
});

let failed = 0;
for (const { name, run } of tests) {
  try {
    run();
    console.log(`✓ ${name}`);
  } catch (error) {
    failed++;
    console.error(`✗ ${name}`);
    console.error(error);
  }
}

console.log(`\n${tests.length - failed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
