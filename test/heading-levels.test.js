import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import { OverType, toolbarButtons, defaultToolbarButtons } from '../dist/overtype.esm.js';
import { MarkdownParser } from '../src/parser.js';
import { extractVisualLines, rootFromHtml, visibleLineText } from './helpers/dom.js';

const dom = new JSDOM('<!doctype html><body></body>', { pretendToBeVisual: true });
global.window = dom.window;
global.document = dom.window.document;
global.Element = dom.window.Element;
global.HTMLElement = dom.window.HTMLElement;
global.Node = dom.window.Node;
global.Event = dom.window.Event;
global.CustomEvent = dom.window.CustomEvent;
global.CSS = { supports: () => false };
global.performance = { now: () => Date.now() };
global.requestAnimationFrame = callback => setTimeout(callback, 0);

const source = '# One\n## Two\n### Three\n#### Four\n##### Five\n###### Six';
const tests = [];
const editors = [];

function test(name, run) {
  tests.push({ name, run });
}

function createEditor(options = {}) {
  const element = document.createElement('div');
  document.body.appendChild(element);
  const [editor] = new OverType(element, { value: source, ...options });
  editors.push(editor);
  return editor;
}

function headingLevels(html) {
  return Array.from(rootFromHtml(html).querySelectorAll('h1, h2, h3, h4, h5, h6'),
    heading => Number(heading.tagName[1]));
}

test('omitting allowedHeadingLevels preserves parser and editor defaults', () => {
  assert.deepEqual(headingLevels(MarkdownParser.parse(source)), [1, 2, 3]);
  assert.deepEqual(headingLevels(MarkdownParser.parseLine('# One')), [1]);
  assert.deepEqual(headingLevels(MarkdownParser.parseHeader('# One')), [1]);

  const editor = createEditor({ toolbar: true });
  assert.deepEqual(headingLevels(editor.getPreviewHTML()), [1, 2, 3]);
  for (const level of [1, 2, 3]) {
    assert.ok(editor.toolbar.buttons[`h${level}`]);
  }
});

for (const levels of [[2, 3], [3], []]) {
  test(`parser and all editor output paths respect ${JSON.stringify(levels)}`, () => {
    const html = MarkdownParser.parse(source, -1, false, undefined, false, levels);
    assert.deepEqual(headingLevels(html), levels);
    assert.deepEqual(extractVisualLines(html), source.split('\n'));

    for (const level of [1, 2, 3]) {
      const line = `${'#'.repeat(level)} Heading`;
      const expected = levels.includes(level) ? [level] : [];
      const parsedLine = MarkdownParser.parseLine(line, false, levels);
      assert.deepEqual(headingLevels(parsedLine), expected);
      assert.deepEqual(headingLevels(MarkdownParser.parseHeader(line, levels)), expected);
      assert.equal(visibleLineText(parsedLine, line), line);
      if (!levels.includes(level)) {
        assert.equal(rootFromHtml(parsedLine).querySelector('.syntax-marker'), null);
        assert.equal(MarkdownParser.parseHeader(line, levels), line);
      }
    }

    const editor = createEditor({ allowedHeadingLevels: levels });
    for (const mode of ['showNormalEditMode', 'showPreviewMode', 'showPlainTextarea']) {
      editor[mode]();
      assert.deepEqual(headingLevels(editor.getPreviewHTML()), levels);
      assert.deepEqual(headingLevels(editor.getRenderedHTML()), levels);
      assert.deepEqual(headingLevels(editor.getCleanHTML()), levels);
      assert.equal(editor.getValue(), source);
    }
  });
}

test('forbidden headings retain inline formatting, indentation and source characters', () => {
  for (const line of [
    '  # **Bold** *italic* [link](https://example.com) `code` ##  ',
    '##\tHeading ###',
    '#',
    '### '
  ]) {
    const html = MarkdownParser.parseLine(line, false, []);
    assert.deepEqual(headingLevels(html), []);
    assert.equal(visibleLineText(html, line), line);
  }

  const root = rootFromHtml(MarkdownParser.parseLine('# **Bold** *italic* [link](https://example.com) `code`', false, []));
  for (const selector of ['strong', 'em', 'a', 'code']) {
    assert.ok(root.querySelector(selector), selector);
  }
});

test('heading restrictions do not change unsupported syntax or code examples', () => {
  const markdown = [
    '#### Four', '##### Five', '###### Six',
    'Setext one', '===', 'Setext two', '---',
    '> # Quoted', '- ## Listed', '\\# Escaped', '#hashtag',
    '`# Inline code`', '<h1>HTML</h1>',
    '```markdown', '# Fenced', '```'
  ].join('\n');

  assert.equal(
    MarkdownParser.parse(markdown, -1, false, undefined, false, []),
    MarkdownParser.parse(markdown)
  );
});

test('heading levels are normalized without mutating caller arrays', () => {
  const levels = Object.freeze([3, 2, 2, 0, 4, 6, 1.5, '1', null]);
  const editor = createEditor({ allowedHeadingLevels: levels });
  assert.deepEqual(editor.options.allowedHeadingLevels, [2, 3]);
  assert.notEqual(editor.options.allowedHeadingLevels, levels);
  assert.deepEqual(levels, [3, 2, 2, 0, 4, 6, 1.5, '1', null]);

  editor.reinit({ allowedHeadingLevels: [0, 4, '2'] });
  assert.deepEqual(headingLevels(editor.getPreviewHTML()), []);
  for (const value of [undefined, null, false, '2,3']) {
    editor.reinit({ allowedHeadingLevels: value });
    assert.deepEqual(headingLevels(editor.getPreviewHTML()), [1, 2, 3]);
  }
});

test('toolbar filtering preserves custom buttons and caller configuration', async () => {
  let customCalls = 0;
  const custom = { name: 'custom', action: () => { customCalls++; } };
  const renamedHeading = { ...toolbarButtons.h1, name: 'renamed', actionId: 'renamed' };
  const buttons = Object.freeze([toolbarButtons.h1, toolbarButtons.h2, toolbarButtons.h3, renamedHeading, custom]);
  const editor = createEditor({ toolbar: true, toolbarButtons: buttons, allowedHeadingLevels: [3] });

  assert.deepEqual(Object.keys(editor.toolbar.buttons), ['h3', 'custom']);
  assert.equal(buttons.length, 5);
  assert.ok(defaultToolbarButtons.includes(toolbarButtons.h1));
  assert.equal(await editor.performAction('custom'), true);
  assert.equal(customCalls, 1);
  await editor.performAction('renamed');
  assert.equal(editor.getValue(), source);
});

test('built-in heading actions are blocked even without a toolbar', async () => {
  for (const levels of [[1, 2, 3], [2, 3], [3], []]) {
    const editor = createEditor({ allowedHeadingLevels: levels });
    let inputs = 0;
    editor.textarea.addEventListener('input', () => { inputs++; });

    for (const level of [1, 2, 3]) {
      editor.setValue('Heading');
      editor.textarea.setSelectionRange(0, 0);
      inputs = 0;
      assert.equal(await editor.performAction(`toggleH${level}`), levels.includes(level));
      assert.equal(editor.getValue(), levels.includes(level) ? `${'#'.repeat(level)} Heading` : 'Heading');
      assert.equal(inputs > 0, levels.includes(level));

      editor.setValue('Heading');
      editor.textarea.setSelectionRange(0, 0);
      inputs = 0;
      toolbarButtons[`h${level}`].action({ editor });
      assert.equal(editor.getValue(), levels.includes(level) ? `${'#'.repeat(level)} Heading` : 'Heading');
      assert.equal(inputs > 0, levels.includes(level));
    }
  }
});

test('reinit updates headings and toolbar without changing document, selection or events', async () => {
  const changes = [];
  const editor = createEditor({ toolbar: true, onChange: value => changes.push(value) });
  const textarea = editor.textarea;
  textarea.focus();
  textarea.setSelectionRange(2, 8, 'backward');
  let inputs = 0;
  textarea.addEventListener('input', () => { inputs++; });
  changes.length = 0;

  for (const levels of [[2, 3], [3], [], [1, 2, 3]]) {
    editor.reinit({ allowedHeadingLevels: levels });
    assert.deepEqual(headingLevels(editor.getPreviewHTML()), levels);
    for (const level of [1, 2, 3]) {
      assert.equal(Boolean(editor.toolbar.buttons[`h${level}`]), levels.includes(level));
      if (!levels.includes(level)) {
        assert.equal(await editor.performAction(`toggleH${level}`), false);
      }
    }
    assert.equal(editor.textarea, textarea);
    assert.equal(editor.getValue(), source);
    assert.equal(textarea.selectionStart, 2);
    assert.equal(textarea.selectionEnd, 8);
    assert.equal(textarea.selectionDirection, 'backward');
    assert.equal(document.activeElement, textarea);
    assert.equal(inputs, 0);
    assert.deepEqual(changes, []);
    assert.equal(editor.container.querySelectorAll('.overtype-toolbar').length, 1);
  }

  editor.reinit({ toolbar: false, allowedHeadingLevels: [] });
  editor.showToolbar();
  assert.equal(editor.toolbar.buttons.h1, undefined);
  assert.equal(editor.toolbar.buttons.h2, undefined);
  assert.equal(editor.toolbar.buttons.h3, undefined);
});

test('coexisting editors keep independent heading levels in either mounting order', () => {
  for (const policies of [[[2, 3], []], [[], [2, 3]]]) {
    const [first, second] = policies.map(levels => createEditor({ toolbar: true, allowedHeadingLevels: levels }));
    first.reinit({ allowedHeadingLevels: [3] });
    assert.deepEqual(headingLevels(first.getRenderedHTML()), [3]);
    assert.deepEqual(headingLevels(second.getRenderedHTML()), policies[1]);
    assert.equal(Boolean(second.toolbar.buttons.h2), policies[1].includes(2));
    assert.equal(first.getValue(), source);
    assert.equal(second.getValue(), source);
  }
});

let failed = 0;
for (const { name, run } of tests) {
  try {
    await run();
    console.log(`✓ ${name}`);
  } catch (error) {
    failed++;
    console.error(`✗ ${name}`);
    console.error(error);
  } finally {
    for (const editor of editors.splice(0)) editor.destroy();
    document.body.innerHTML = '';
  }
}

console.log(`\n${tests.length - failed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
