/**
 * Tests for resuming an editor from its own saved DOM
 * (a self-saving page serializes the editor, reloads, and constructs OverType again)
 */

import { JSDOM } from 'jsdom';

function setDocument(html) {
  const dom = new JSDOM(html, { pretendToBeVisual: true });
  const w = dom.window;
  global.window = w;
  global.document = w.document;
  global.Element = w.Element;
  global.NodeList = w.NodeList;
  global.HTMLElement = w.HTMLElement;
  global.Node = w.Node;
  global.Event = w.Event;
  global.KeyboardEvent = w.KeyboardEvent;
  global.getComputedStyle = w.getComputedStyle.bind(w);
  global.performance = { now: () => Date.now() };
  global.CSS = { supports: () => false };
  global.requestAnimationFrame = (callback) => setTimeout(callback, 0);
}

setDocument('<!DOCTYPE html><html><head></head><body></body></html>');
const { OverType } = await import('../src/overtype.js');

const results = { passed: 0, failed: 0 };

function assert(condition, testName, message) {
  if (condition) {
    results.passed++;
    console.log(`✓ ${testName}`);
  } else {
    results.failed++;
    console.error(`✗ ${testName}: ${message}`);
  }
}

const EMPTY_PAGE = '<!DOCTYPE html><html><head></head><body><article id="e"></article></body></html>';
const MD = '# Entry\n\nSee [a link](https://example.com) and **bold** text.\n\n- one\n- two\n\n- [ ] a task\n- [x] done\n';

// A new page load: fresh document, and the module statics a real reload would reset
function reload(html) {
  setDocument(html);
  OverType.stylesInjected = false;
  OverType.globalListenersInitialized = false;
  OverType.instanceCount = 0;
  OverType.stylesChrome = false;
}

// Serialize the page the way ClayJS does: live textarea values become text content,
// and nodes marked clay="editor-ui" are left out
function saveLikeClay() {
  const clone = document.documentElement.cloneNode(true);
  const live = document.querySelectorAll('textarea');
  clone.querySelectorAll('textarea').forEach((textarea, i) => {
    textarea.textContent = live[i].value;
  });
  clone.querySelectorAll('[clay~="editor-ui"]').forEach(el => el.remove());
  return '<!DOCTYPE html>' + clone.outerHTML;
}

function open(options) {
  return new OverType(document.getElementById('e'), options)[0];
}

function count(selector) {
  return document.querySelectorAll(selector).length;
}

console.log('🧪 Running DOM Persistence Tests...\n');

// Resume twice from a save that kept every node
(() => {
  reload(EMPTY_PAGE);
  const options = { toolbar: true, showStats: true };
  let editor = open(options);
  editor.setValue(MD);

  for (let round = 1; round <= 2; round++) {
    reload(saveLikeClay());
    editor = open(options);
    const name = `full save, reload ${round}`;
    assert(editor.getValue() === MD, `${name}: text survives`, JSON.stringify(editor.getValue()));
    for (const selector of ['.overtype-toolbar', '.overtype-link-tooltip', '.overtype-stats', '.overtype-placeholder', '.overtype-preview', '.overtype-wrapper', 'textarea']) {
      assert(count(selector) === 1, `${name}: exactly one ${selector}`, `found ${count(selector)}`);
    }
  }

  assert(editor.statsBar && editor.statsBar.isConnected, 'resumed stats bar is the live one', 'statsBar is not in the document');
  const statsBefore = editor.statsBar.textContent;
  editor.setValue(MD + 'more words here\n');
  assert(editor.statsBar.textContent !== statsBefore, 'resumed stats bar updates', statsBefore);

  assert(editor.placeholderEl && editor.placeholderEl.isConnected, 'resumed placeholder is the live one', 'placeholderEl is not in the document');
  editor.setValue('');
  assert(editor.placeholderEl.style.display === '', 'resumed placeholder shows when empty', editor.placeholderEl.style.display);
  editor.setValue('text');
  assert(editor.placeholderEl.style.display === 'none', 'resumed placeholder hides with text', editor.placeholderEl.style.display);
})();

// A save that kept only container, wrapper and textarea
(() => {
  reload(EMPTY_PAGE);
  document.getElementById('e').innerHTML =
    '<div class="overtype-container"><div class="overtype-wrapper"><textarea class="overtype-input"></textarea></div></div>';
  document.querySelector('textarea').textContent = MD;
  const editor = open({ toolbar: true });
  assert(editor.getValue() === MD, 'textarea-only save: text survives', JSON.stringify(editor.getValue()));
  assert(count('.overtype-preview') === 1 && count('.overtype-placeholder') === 1 && count('.overtype-toolbar') === 1,
    'textarea-only save: preview, placeholder and toolbar rebuilt once',
    `${count('.overtype-preview')} ${count('.overtype-placeholder')} ${count('.overtype-toolbar')}`);
  assert(editor.preview.textContent.includes('Entry'), 'textarea-only save: preview renders the text', editor.preview.textContent.slice(0, 80));
})();

// A container holding a textarea but no wrapper is not resumable, but the text must survive the rebuild
(() => {
  reload(EMPTY_PAGE);
  document.getElementById('e').innerHTML =
    '<div class="overtype-container"><textarea class="overtype-input"></textarea></div>';
  document.querySelector('textarea').textContent = MD;
  const editor = open({});
  assert(editor.getValue() === MD, 'wrapperless save: text survives the rebuild', JSON.stringify(editor.getValue()));
  assert(count('.overtype-container') === 1 && count('textarea') === 1, 'wrapperless save: one container, one textarea',
    `${count('.overtype-container')} ${count('textarea')}`);
})();

// A page saved in an earlier session already holds overtype-1-input
(() => {
  reload(EMPTY_PAGE);
  document.body.insertAdjacentHTML('afterbegin',
    '<article id="old"><div class="overtype-container"><div class="overtype-wrapper"><textarea class="overtype-input" id="overtype-1-input">old</textarea></div></div></article>');
  const editor = open({ toolbar: true });
  const id = editor.textarea.id;
  assert(id !== 'overtype-1-input' && count(`[id="${id}"]`) === 1, 'new editor avoids a saved textarea id', id);
  const controls = editor.toolbar.container.getAttribute('aria-controls');
  assert(document.getElementById(controls) === editor.textarea, 'toolbar aria-controls resolves to its own textarea', controls);
})();

// Two saved entries that already share a generated id: resuming one repairs it
(() => {
  const saved = '<div class="overtype-container"><div class="overtype-wrapper"><textarea class="overtype-input" id="overtype-1-input">x</textarea></div></div>';
  reload(`<!DOCTYPE html><html><head></head><body><article id="a">${saved}</article><article id="e">${saved}</article></body></html>`);
  const editor = open({});
  assert(count(`[id="${editor.textarea.id}"]`) === 1, 'resume repairs a duplicated generated id', editor.textarea.id);
})();

// autoResize keeps working after a reload
(() => {
  reload(EMPTY_PAGE);
  const options = { autoResize: true };
  open(options).setValue(MD);
  reload(saveLikeClay());
  const editor = open(options);
  let calls = 0;
  const original = editor._updateAutoHeight;
  editor._updateAutoHeight = function () {
    calls++;
    return original.call(this);
  };
  editor.textarea.value += 'x';
  editor.textarea.dispatchEvent(new window.Event('input', { bubbles: true }));
  assert(calls >= 1, 'autoResize listens after a reload', `_updateAutoHeight calls: ${calls}`);
})();

// destroy() releases the link tooltip's document listener
(() => {
  reload(EMPTY_PAGE);
  const editor = open({ toolbar: true });
  const removed = [];
  const original = document.removeEventListener.bind(document);
  document.removeEventListener = (type, ...rest) => {
    removed.push(type);
    return original(type, ...rest);
  };
  editor.destroy();
  delete document.removeEventListener;
  assert(removed.includes('visibilitychange'), 'destroy removes the link tooltip listener', removed.join(', '));
})();

// A global theme change leaves editors without a live instance alone
(() => {
  reload(EMPTY_PAGE);
  document.body.insertAdjacentHTML('beforeend',
    '<article id="static"><div class="overtype-container" data-theme="solar"><div class="overtype-wrapper"><textarea class="overtype-input">x</textarea></div></div></article>');
  const editor = open({});
  OverType.setTheme('cave');
  const staticTheme = document.querySelector('#static .overtype-container').getAttribute('data-theme');
  assert(staticTheme === 'solar', 'setTheme leaves a static saved editor alone', staticTheme);
  assert(editor.container.getAttribute('data-theme') === 'cave', 'setTheme still themes a live editor', editor.container.getAttribute('data-theme'));
  OverType.setTheme('solar');
})();

// Without persist, nothing is marked
(() => {
  reload(EMPTY_PAGE);
  open({ toolbar: true, showStats: true });
  assert(count('[clay]') === 0 && count('[persist]') === 0, 'without persist no node is marked',
    `${count('[clay]')} clay, ${count('[persist]')} persist`);
})();

// persist marks every UI node and nothing else
(() => {
  reload(EMPTY_PAGE);
  const editor = open({ persist: true, toolbar: true, showStats: true });
  editor.setValue(MD);
  for (const selector of ['style.overtype-styles', '.overtype-toolbar', '.overtype-link-tooltip', '.overtype-stats', '.overtype-placeholder', '.overtype-preview']) {
    const el = document.querySelector(selector);
    assert(el && el.getAttribute('clay') === 'editor-ui', `persist marks ${selector}`, el ? String(el.getAttribute('clay')) : 'missing');
  }
  for (const selector of ['.overtype-container', '.overtype-wrapper', 'textarea']) {
    assert(!document.querySelector(selector).hasAttribute('clay'), `persist leaves ${selector} unmarked`, document.querySelector(selector).getAttribute('clay'));
  }
  assert(editor.textarea.hasAttribute('persist'), 'persist adds the persist attribute to the textarea', editor.textarea.outerHTML.slice(0, 120));

  const viewModeButton = editor.toolbar.buttons.viewMode;
  if (viewModeButton) {
    editor.toolbar.openViewModeDropdown(viewModeButton);
    const dropdown = document.querySelector('.overtype-dropdown-menu');
    assert(dropdown && dropdown.getAttribute('clay') === 'editor-ui', 'persist marks the view mode dropdown', dropdown ? String(dropdown.getAttribute('clay')) : 'missing');
    editor.toolbar.closeViewModeDropdown(viewModeButton);
  }
})();

// persist: the saved entry is the text plus a small shell, across two reloads
(() => {
  reload(EMPTY_PAGE);
  const options = { persist: true, toolbar: true, showStats: true };
  let editor = open(options);
  editor.setValue(MD);

  for (let round = 1; round <= 2; round++) {
    const html = saveLikeClay();
    const saved = new JSDOM(html).window.document;
    const size = saved.getElementById('e').innerHTML.length;
    assert(size < MD.length + 800, `persist reload ${round}: saved entry is small`, `${size} bytes for ${MD.length} bytes of markdown`);
    assert(!saved.querySelector('style.overtype-styles, svg, .overtype-toolbar, .overtype-link-tooltip, .overtype-stats, .overtype-placeholder, .overtype-preview'),
      `persist reload ${round}: no UI nodes saved`, saved.getElementById('e').innerHTML.slice(0, 200));

    reload(html);
    editor = open(options);
    assert(editor.getValue() === MD, `persist reload ${round}: text survives`, JSON.stringify(editor.getValue()));
    assert(count('.overtype-toolbar') === 1 && count('.overtype-preview') === 1 && count('.overtype-stats') === 1,
      `persist reload ${round}: UI rebuilt once`, `${count('.overtype-toolbar')} ${count('.overtype-preview')} ${count('.overtype-stats')}`);
  }
})();

// persist: destroy leaves a resumable shell
(() => {
  reload(EMPTY_PAGE);
  const options = { persist: true, toolbar: true, showStats: true };
  const editor = open(options);
  editor.setValue(MD);
  editor.destroy();
  const article = document.getElementById('e');
  const textarea = article.querySelector('.overtype-container > .overtype-wrapper > textarea.overtype-input');
  assert(textarea && textarea.value === MD, 'persist destroy keeps container, wrapper and textarea', article.innerHTML.slice(0, 200));
  assert(!article.querySelector('.overtype-toolbar, .overtype-link-tooltip, .overtype-stats, .overtype-placeholder, .overtype-preview'),
    'persist destroy removes the UI nodes', article.innerHTML.slice(0, 200));
  const errors = [];
  const onError = e => errors.push(e.message || String(e.error));
  window.addEventListener('error', onError);
  for (const type of ['input', 'blur', 'keyup', 'scroll', 'selectionchange']) {
    textarea.dispatchEvent(new window.Event(type));
  }
  window.removeEventListener('error', onError);
  assert(errors.length === 0, 'persist destroy leaves no link tooltip listeners on the textarea', errors.join('; '));
  const again = open(options);
  assert(again.getValue() === MD && count('.overtype-toolbar') === 1, 'reopening after destroy resumes cleanly',
    `${JSON.stringify(again.getValue())} toolbars ${count('.overtype-toolbar')}`);
})();

// Instance CSS vars are written only when they differ from the stylesheet
(() => {
  reload(EMPTY_PAGE);
  const editor = open({});
  const style = editor.wrapper.style;
  assert(style.getPropertyValue('--instance-font-family') === '' && style.getPropertyValue('--instance-font-size') === '' && style.getPropertyValue('--instance-line-height') === '',
    'default options write no font vars', editor.wrapper.getAttribute('style'));
  assert(style.getPropertyValue('--instance-padding') === '16px', 'default padding still differs from the stylesheet and is written', editor.wrapper.getAttribute('style'));

  editor.reinit({ fontSize: '18px', fontFamily: 'Georgia, serif' });
  assert(style.getPropertyValue('--instance-font-size') === '18px' && style.getPropertyValue('--instance-font-family') === 'Georgia, serif',
    'a custom font writes its vars', editor.wrapper.getAttribute('style'));

  editor.reinit({ fontSize: '14px' });
  assert(style.getPropertyValue('--instance-font-size') === '', 'going back to the default removes the var', editor.wrapper.getAttribute('style'));
})();

console.log(`\n✅ Passed: ${results.passed}`);
console.log(`❌ Failed: ${results.failed}`);

if (results.failed > 0) {
  console.error(`\n❌ ${results.failed} test(s) failed!`);
  process.exit(1);
} else {
  console.log('\n✅ All tests passed!');
  process.exit(0);
}
