/**
 * Disable option tests for OverType
 * Disabled line-level features render as plain text, and their toolbar
 * buttons, shortcuts and editing helpers stay out of the way.
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
const { MarkdownParser } = await import('../src/parser.js');

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

function createEditor(options = {}) {
  document.body.innerHTML = '<div id="editor"></div>';
  return new OverType('#editor', options)[0];
}

function textOf(html) {
  const div = document.createElement('div');
  div.innerHTML = html;
  return div.textContent.replace(/ /g, ' ');
}

const parse = (text, disable) => MarkdownParser.parse(text, -1, false, null, false, { disable });

console.log('🧪 Running Disable Option Tests...\n');

console.log('📋 Parser');

assert(MarkdownParser.resolveDisabled(['headings']).has('h2'), 'headings expands to h1-h3');
assert(MarkdownParser.resolveDisabled(['lists']).has('tasks'), 'lists also disables tasks');
assert(MarkdownParser.resolveDisabled(undefined).size === 0, 'missing list disables nothing');

(() => {
  const html = parse('# One\n## Two\n### Three', ['h1', 'h3']);
  assert(!html.includes('<h1>') && !html.includes('<h3>'), 'Disabled heading levels render as plain text', html);
  assert(html.includes('<h2>'), 'Enabled heading level still renders', html);
  assert(textOf(html).includes('# One'), 'Disabled heading keeps its # characters', textOf(html));
})();

(() => {
  const html = parse('> quote', ['blockquote']);
  assert(!html.includes('class="blockquote"'), 'Disabled blockquote renders as plain text', html);
})();

(() => {
  const html = parse('- item\n1. first\n- [ ] task', ['lists']);
  assert(!html.includes('<li'), 'Disabled lists render no list items', html);
  assert(textOf(html).includes('- [ ] task'), 'Disabled task keeps its characters', textOf(html));
})();

(() => {
  const html = parse('- [ ] task\n- item', ['tasks']);
  assert(!html.includes('task-list'), 'Disabled tasks render no task items', html);
  assert(html.includes('bullet-list'), 'Disabled tasks leave bullet lists working', html);
})();

(() => {
  const html = parse('```\n# not a heading\n```', ['code']);
  assert(!html.includes('code-block') && !html.includes('code-fence'), 'Disabled code fences render as plain text', html);
  assert(html.includes('<h1>'), 'Lines between disabled fences parse normally', html);
})();

(() => {
  const html = parse('---', ['hr']);
  assert(!html.includes('hr-marker'), 'Disabled horizontal rule renders as plain text', html);
})();

(() => {
  const html = parse('# One\n> quote\n- item');
  assert(html.includes('<h1>') && html.includes('blockquote') && html.includes('bullet-list'), 'No disable list renders everything', html);
})();

console.log('\n📋 Editor');

(() => {
  const editor = createEditor({ value: '# Title', disable: ['headings'] });
  assert(!editor.preview.innerHTML.includes('<h1>'), 'Editor preview honors disable', editor.preview.innerHTML);
  assert(!editor.getRenderedHTML().includes('<h1>'), 'getRenderedHTML honors disable');
  editor.destroy();
})();

(() => {
  const editor = createEditor({ toolbar: true, disable: ['headings', 'lists', 'blockquote'] });
  const names = [...editor.toolbar.container.querySelectorAll('.overtype-toolbar-button')].map(b => b.dataset.button);
  assert(!names.some(n => ['h1', 'h2', 'h3', 'bulletList', 'orderedList', 'taskList', 'quote'].includes(n)), 'Disabled features hide their toolbar buttons', names.join(' '));
  assert(names.includes('bold') && names.includes('link'), 'Other toolbar buttons stay', names.join(' '));

  const items = [...editor.toolbar.container.children].map(el => el.classList.contains('overtype-toolbar-separator') ? '|' : 'b');
  const doubled = items.join('').includes('||');
  assert(!doubled && items[0] !== '|' && items[items.length - 1] !== '|', 'No doubled or edge separators remain', items.join(''));
  editor.destroy();
})();

await (async () => {
  const editor = createEditor({ value: 'Title', disable: ['h1'] });
  const result = await editor.performAction('toggleH1');
  assert(result === false && editor.getValue() === 'Title', 'performAction refuses a disabled action', `${result} ${JSON.stringify(editor.getValue())}`);
  editor.destroy();
})();

(() => {
  const editor = createEditor({ value: '- item', disable: ['lists'] });
  editor.textarea.setSelectionRange(6, 6);
  assert(editor.handleSmartListContinuation() === false, 'Smart list continuation is off when lists are disabled');
  assert(editor.getValue() === '- item', 'Enter does not continue a disabled list', JSON.stringify(editor.getValue()));
  editor.destroy();
})();

(() => {
  const editor = createEditor({ toolbar: true, disable: ['headings'] });
  editor.reinit({ disable: [] });
  const names = [...editor.toolbar.container.querySelectorAll('.overtype-toolbar-button')].map(b => b.dataset.button);
  assert(names.includes('h1'), 'reinit with a new disable list rebuilds the toolbar', names.join(' '));
  editor.destroy();
})();

(() => {
  const html = parse('- - -\n* * *', ['hr']);
  assert(!html.includes('<li'), 'Disabled horizontal rule does not become a bullet item', html);
})();

(() => {
  const context = MarkdownParser.getListContext('- [ ] task', 10, MarkdownParser.resolveDisabled(['tasks']));
  assert(context.listType === 'bullet', 'Disabled tasks continue as plain bullets', context.listType);
  const enabled = MarkdownParser.getListContext('- [ ] task', 10);
  assert(enabled.listType === 'checkbox', 'Enabled tasks still continue as tasks', enabled.listType);
})();

(() => {
  const value = '```\n[a](http://a)\n```\n[b](http://b)';
  const editor = createEditor({ value, disable: ['code'] });
  const link = editor.linkTooltip.findLinkAtPosition(value, value.indexOf('[b]') + 1);
  const anchors = editor.preview.querySelectorAll('a').length;
  assert(link?.index === 1 && anchors === 2, 'Link tooltip counts links inside disabled fences', `index ${link?.index}, anchors ${anchors}`);

  editor.reinit({ disable: [] });
  const fenced = editor.linkTooltip.findLinkAtPosition(value, value.indexOf('[b]') + 1);
  assert(fenced?.index === 0, 'Link tooltip skips fenced links again after re-enabling code', `index ${fenced?.index}`);
  editor.destroy();
})();

(() => {
  document.body.innerHTML = '<div id="saved"></div><div id="restored"></div>';
  new OverType('#saved', { theme: 'solar', value: 'hi' });
  const restored = document.getElementById('restored');
  restored.innerHTML = document.getElementById('saved').innerHTML;
  const editor = new OverType(restored, { theme: 'cave' })[0];
  const previewText = editor.container.style.getPropertyValue('--preview-text-default');
  assert(previewText === '#c5dde8', 'Restoring a saved editor applies its theme preview colors', previewText || '(unset)');
})();

console.log(`\n✅ Passed: ${passed}`);
console.log(`❌ Failed: ${failed}`);

if (failed > 0) {
  process.exit(1);
} else {
  console.log('✨ All disable option tests passed!');
}
