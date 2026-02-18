/**
 * Auto Theme Tests for OverType
 * Tests theme: 'auto' behavior for both instance and global setTheme
 */

import { JSDOM } from 'jsdom';

const dom = new JSDOM(`
  <!DOCTYPE html>
  <html>
    <body>
      <div id="editor"></div>
      <div id="editor2"></div>
    </body>
  </html>
`);

global.window = dom.window;
global.document = dom.window.document;
global.HTMLElement = dom.window.HTMLElement;
global.Element = dom.window.Element;
global.Node = dom.window.Node;
global.CSS = { supports: () => false };
global.performance = { now: () => Date.now() };
global.requestAnimationFrame = (callback) => setTimeout(callback, 0);

let _mqListeners = [];
let _mqMatches = false;

function mockMatchMedia(matches) {
  _mqMatches = matches;
  _mqListeners = [];
  global.window.matchMedia = () => ({
    matches: _mqMatches,
    addEventListener(event, fn) { _mqListeners.push(fn); },
    removeEventListener(event, fn) { _mqListeners = _mqListeners.filter(l => l !== fn); }
  });
}

function triggerSchemeChange(dark) {
  _mqMatches = dark;
  // Re-mock so subsequent matchMedia calls return updated value
  const currentListeners = [..._mqListeners];
  mockMatchMedia(dark);
  _mqListeners = currentListeners;
  currentListeners.forEach(fn => fn({ matches: dark }));
}

// Reset static state between tests
function resetOverType(OverType) {
  OverType._autoMediaQuery = null;
  OverType._autoMediaListener = null;
  OverType._autoInstances = new Set();
  OverType._globalAutoTheme = false;
  OverType.currentTheme = null;
  OverType.stylesInjected = false;
}

let passed = 0;
let failed = 0;

function assert(condition, testName, message) {
  if (condition) {
    passed++;
    console.log(`  ✅ ${testName}`);
  } else {
    failed++;
    console.error(`  ❌ ${testName}: ${message}`);
  }
}

console.log('🧪 Running Auto Theme Tests...\n');
console.log('━'.repeat(50));

// Import after globals are set up
const { OverType } = await import('../src/overtype.js');
const { resolveAutoTheme } = await import('../src/themes.js');

// --- resolveAutoTheme ---

console.log('\n📋 resolveAutoTheme()');

mockMatchMedia(false);
assert(resolveAutoTheme('solar') === 'solar', 'Non-auto theme passes through', `got ${resolveAutoTheme('solar')}`);
assert(resolveAutoTheme('cave') === 'cave', 'Non-auto theme passes through (cave)', `got ${resolveAutoTheme('cave')}`);
assert(resolveAutoTheme('auto') === 'solar', 'Auto resolves to solar in light mode', `got ${resolveAutoTheme('auto')}`);

mockMatchMedia(true);
assert(resolveAutoTheme('auto') === 'cave', 'Auto resolves to cave in dark mode', `got ${resolveAutoTheme('auto')}`);

// --- Constructor theme: 'auto' ---

console.log('\n📋 Constructor theme: "auto"');

mockMatchMedia(false);
resetOverType(OverType);

(() => {
  document.getElementById('editor').innerHTML = '';
  const editor = new OverType('#editor', { theme: 'auto' })[0];

  assert(editor.instanceTheme === 'auto', 'instanceTheme is "auto" from constructor', `got ${editor.instanceTheme}`);
  assert(OverType._autoInstances.has(editor), 'Instance is tracked in _autoInstances from constructor', '');
  assert(editor.container.getAttribute('data-theme') === 'solar', 'Constructor auto → solar in light mode', `got ${editor.container.getAttribute('data-theme')}`);

  triggerSchemeChange(true);
  assert(editor.container.getAttribute('data-theme') === 'cave', 'Constructor auto responds to OS change', `got ${editor.container.getAttribute('data-theme')}`);

  editor.destroy();
})();

mockMatchMedia(true);
resetOverType(OverType);

(() => {
  document.getElementById('editor').innerHTML = '';
  const editor = new OverType('#editor', { theme: 'auto' })[0];

  assert(editor.container.getAttribute('data-theme') === 'cave', 'Constructor auto → cave in dark mode', `got ${editor.container.getAttribute('data-theme')}`);

  editor.destroy();
})();

// --- Instance setTheme('auto') ---

console.log('\n📋 Instance setTheme("auto")');

mockMatchMedia(false);
resetOverType(OverType);

(() => {
  document.getElementById('editor').innerHTML = '';
  const editor = new OverType('#editor')[0];

  editor.setTheme('auto');
  assert(editor.instanceTheme === 'auto', 'instanceTheme is "auto"', `got ${editor.instanceTheme}`);
  assert(editor.container.getAttribute('data-theme') === 'solar', 'Light mode → data-theme="solar"', `got ${editor.container.getAttribute('data-theme')}`);
  assert(OverType._autoInstances.has(editor), 'Instance is tracked in _autoInstances', '');

  editor.destroy();
})();

mockMatchMedia(true);
resetOverType(OverType);

(() => {
  document.getElementById('editor').innerHTML = '';
  const editor = new OverType('#editor')[0];

  editor.setTheme('auto');
  assert(editor.container.getAttribute('data-theme') === 'cave', 'Dark mode → data-theme="cave"', `got ${editor.container.getAttribute('data-theme')}`);

  editor.destroy();
})();

// --- Switching away from auto cleans up ---

console.log('\n📋 Switching away from auto');

mockMatchMedia(false);
resetOverType(OverType);

(() => {
  document.getElementById('editor').innerHTML = '';
  const editor = new OverType('#editor')[0];

  editor.setTheme('auto');
  assert(OverType._autoInstances.has(editor), 'Tracked after setTheme("auto")', '');

  editor.setTheme('cave');
  assert(!OverType._autoInstances.has(editor), 'Removed from tracking after setTheme("cave")', '');
  assert(editor.container.getAttribute('data-theme') === 'cave', 'data-theme is "cave"', `got ${editor.container.getAttribute('data-theme')}`);
  assert(OverType._autoMediaQuery === null, 'Listener torn down (no auto consumers left)', '');

  editor.destroy();
})();

// --- matchMedia change triggers theme swap ---

console.log('\n📋 System theme change updates instances');

mockMatchMedia(false);
resetOverType(OverType);

(() => {
  document.getElementById('editor').innerHTML = '';
  const editor = new OverType('#editor')[0];

  editor.setTheme('auto');
  assert(editor.container.getAttribute('data-theme') === 'solar', 'Starts as solar', `got ${editor.container.getAttribute('data-theme')}`);

  triggerSchemeChange(true);
  assert(editor.container.getAttribute('data-theme') === 'cave', 'Switches to cave on dark mode', `got ${editor.container.getAttribute('data-theme')}`);

  triggerSchemeChange(false);
  assert(editor.container.getAttribute('data-theme') === 'solar', 'Switches back to solar on light mode', `got ${editor.container.getAttribute('data-theme')}`);

  editor.destroy();
})();

// --- destroy() cleans up ---

console.log('\n📋 destroy() removes auto tracking');

mockMatchMedia(false);
resetOverType(OverType);

(() => {
  document.getElementById('editor').innerHTML = '';
  const editor = new OverType('#editor')[0];

  editor.setTheme('auto');
  assert(OverType._autoInstances.size === 1, 'One instance tracked', `got ${OverType._autoInstances.size}`);

  editor.destroy();
  assert(OverType._autoInstances.size === 0, 'No instances tracked after destroy', `got ${OverType._autoInstances.size}`);
  assert(OverType._autoMediaQuery === null, 'Listener torn down after destroy', '');
})();

// --- Multiple instances ---

console.log('\n📋 Multiple instances with auto theme');

mockMatchMedia(false);
resetOverType(OverType);

(() => {
  document.getElementById('editor').innerHTML = '';
  document.getElementById('editor2').innerHTML = '';
  const e1 = new OverType('#editor')[0];
  const e2 = new OverType('#editor2')[0];

  e1.setTheme('auto');
  e2.setTheme('auto');
  assert(OverType._autoInstances.size === 2, 'Two instances tracked', `got ${OverType._autoInstances.size}`);

  triggerSchemeChange(true);
  assert(e1.container.getAttribute('data-theme') === 'cave', 'First instance switched to cave', `got ${e1.container.getAttribute('data-theme')}`);
  assert(e2.container.getAttribute('data-theme') === 'cave', 'Second instance switched to cave', `got ${e2.container.getAttribute('data-theme')}`);

  e1.destroy();
  assert(OverType._autoInstances.size === 1, 'One instance remains after first destroy', `got ${OverType._autoInstances.size}`);
  assert(OverType._autoMediaQuery !== null, 'Listener still active (one consumer left)', '');

  e2.destroy();
  assert(OverType._autoInstances.size === 0, 'No instances after both destroyed', `got ${OverType._autoInstances.size}`);
  assert(OverType._autoMediaQuery === null, 'Listener torn down after all destroyed', '');
})();

// --- Static setTheme('auto') ---

console.log('\n📋 Static OverType.setTheme("auto")');

mockMatchMedia(false);
resetOverType(OverType);

(() => {
  document.getElementById('editor').innerHTML = '';
  const editor = new OverType('#editor')[0];

  OverType.setTheme('auto');
  assert(OverType._globalAutoTheme === true, '_globalAutoTheme is true', '');
  assert(editor.container.getAttribute('data-theme') === 'solar', 'Global auto → solar in light mode', `got ${editor.container.getAttribute('data-theme')}`);

  triggerSchemeChange(true);
  assert(editor.container.getAttribute('data-theme') === 'cave', 'Global auto switches to cave', `got ${editor.container.getAttribute('data-theme')}`);

  OverType.setTheme('solar');
  assert(OverType._globalAutoTheme === false, '_globalAutoTheme reset after fixed theme', '');

  editor.destroy();
})();

// --- Global auto theme with customColors ---

console.log('\n📋 Global auto theme with customColors');

mockMatchMedia(false);
resetOverType(OverType);

(() => {
  document.getElementById('editor').innerHTML = '';
  const editor = new OverType('#editor')[0];

  OverType.setTheme('auto', { h1: '#ff0000' });
  assert(OverType._globalAutoCustomColors !== null, 'customColors stored', '');

  triggerSchemeChange(true);
  assert(OverType._globalAutoCustomColors?.h1 === '#ff0000', 'customColors preserved after OS change', `got ${JSON.stringify(OverType._globalAutoCustomColors)}`);

  OverType.setTheme('solar');
  assert(OverType._globalAutoCustomColors === null, 'customColors cleared after fixed theme', `got ${JSON.stringify(OverType._globalAutoCustomColors)}`);

  editor.destroy();
})();

// --- Static setTheme('auto') listener cleanup ---

console.log('\n📋 Static auto theme listener cleanup');

mockMatchMedia(false);
resetOverType(OverType);

(() => {
  OverType.setTheme('auto');
  assert(OverType._autoMediaQuery !== null, 'Listener active for global auto', '');

  OverType.setTheme('cave');
  assert(OverType._autoMediaQuery === null, 'Listener torn down after switching to fixed theme', '');
})();

// --- Results ---

console.log('\n' + '━'.repeat(50));
console.log(`\n📊 Test Results Summary\n`);
console.log(`✅ Passed: ${passed}`);
console.log(`❌ Failed: ${failed}`);
console.log(`📈 Total:  ${passed + failed}`);
console.log(`🎯 Success Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%\n`);

if (failed > 0) {
  console.log('💥 Some tests failed!');
  process.exit(1);
} else {
  console.log('✨ All auto theme tests passed!');
}
