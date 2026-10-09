/**
 * Toolbar accessibility tests for OverType
 */

import { JSDOM } from 'jsdom';
import { OverType } from '../src/overtype.js';

const dom = new JSDOM(`
  <!DOCTYPE html>
  <html>
    <body>
      <button id="before">Before</button>
      <div id="editor"></div>
      <button id="after">After</button>
    </body>
  </html>
`, {
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

const results = {
  passed: 0,
  failed: 0
};

function assert(condition, testName, message) {
  if (condition) {
    results.passed++;
    console.log(`✓ ${testName}`);
  } else {
    results.failed++;
    console.error(`✗ ${testName}: ${message}`);
  }
}

function resetDOM() {
  document.body.innerHTML = `
    <button id="before">Before</button>
    <div id="editor"></div>
    <button id="after">After</button>
  `;
}

function createEditor(options = {}) {
  resetDOM();

  return new OverType('#editor', {
    toolbar: true,
    value: '# Toolbar test',
    ...options
  })[0];
}

function getToolbarButtons(editor) {
  return Array.from(editor.toolbar.container.querySelectorAll('.overtype-toolbar-button'));
}

function dispatchKeydown(target, key) {
  const event = new window.KeyboardEvent('keydown', {
    key,
    bubbles: true,
    cancelable: true
  });

  target.dispatchEvent(event);
}

function assertSingleToolbarTabStop(buttons, expectedButton, testName) {
  const tabStops = buttons.filter(button => button.tabIndex === 0);

  assert(
    tabStops.length === 1 && tabStops[0] === expectedButton,
    testName,
    `Expected one tab stop on ${expectedButton.dataset.button}; got ${tabStops.map(button => button.dataset.button).join(', ')}`
  );
}

function assertFocusedToolbarButton(buttons, expectedButton, testName) {
  const tabStops = buttons.filter(button => button.tabIndex === 0);

  assert(
    document.activeElement === expectedButton && tabStops.length === 1 && tabStops[0] === expectedButton,
    testName,
    `Expected focus and tab stop on ${expectedButton.dataset.button}; got focus on ${document.activeElement?.dataset?.button || document.activeElement?.tagName}`
  );
}

console.log('🧪 Running Toolbar Accessibility Tests...\n');
console.log('━'.repeat(50));

// Test: Toolbar has APG semantics and one initial tab stop
(() => {
  const editor = createEditor();
  const toolbar = editor.toolbar.container;
  const buttons = getToolbarButtons(editor);

  assert(
    toolbar.getAttribute('role') === 'toolbar' &&
      toolbar.getAttribute('aria-label') === 'Formatting toolbar' &&
      editor.textarea.id &&
      toolbar.getAttribute('aria-controls') === editor.textarea.id,
    'Toolbar APG semantics',
    'Expected named toolbar that controls the textarea'
  );
  assert(buttons.length > 1, 'Toolbar buttons exist', 'Expected multiple toolbar buttons');
  assertSingleToolbarTabStop(buttons, buttons[0], 'Initial roving tabindex');
  assert(
    editor.toolbar.buttons.bold.getAttribute('aria-pressed') === 'false' &&
      !editor.toolbar.buttons.link.hasAttribute('aria-pressed') &&
      toolbar.querySelector('[role="separator"]').tabIndex === -1,
    'Toolbar item semantics',
    'Expected toggle state only on toggle buttons and separators outside tab order'
  );
  assert(
    Array.from(toolbar.querySelectorAll('.overtype-toolbar-button svg')).every(icon =>
      icon.getAttribute('aria-hidden') === 'true' && icon.getAttribute('focusable') === 'false'
    ),
    'Toolbar icons are decorative',
    'Expected every toolbar SVG icon to be hidden from assistive technology and removed from SVG focus'
  );

  editor.destroy();
})();

// Test: Custom textarea IDs are preserved for aria-controls
(() => {
  const editor = createEditor({
    textareaProps: {
      id: 'custom-textarea-id'
    }
  });

  assert(
    editor.textarea.id === 'custom-textarea-id' &&
      editor.toolbar.container.getAttribute('aria-controls') === 'custom-textarea-id',
    'Custom textarea id is preserved',
    'Expected toolbar aria-controls to reference the custom textarea id'
  );

  editor.destroy();
})();

// Test: Left and Right arrows move through toolbar controls with wrapping
(() => {
  const editor = createEditor();
  const buttons = getToolbarButtons(editor);

  buttons[0].focus();
  dispatchKeydown(buttons[0], 'ArrowRight');
  assertFocusedToolbarButton(buttons, buttons[1], 'Right Arrow moves to next button');

  dispatchKeydown(buttons[1], 'ArrowLeft');
  assertFocusedToolbarButton(buttons, buttons[0], 'Left Arrow moves to previous button');

  dispatchKeydown(buttons[0], 'ArrowLeft');
  assertFocusedToolbarButton(buttons, buttons[buttons.length - 1], 'Left Arrow wraps to last button');

  dispatchKeydown(buttons[buttons.length - 1], 'ArrowRight');
  assertFocusedToolbarButton(buttons, buttons[0], 'Right Arrow wraps to first button');

  editor.destroy();
})();

// Test: Home, End, and direct focus update the remembered tab stop
(() => {
  const editor = createEditor();
  const buttons = getToolbarButtons(editor);
  const middleButton = buttons[5];

  middleButton.focus();
  assertSingleToolbarTabStop(buttons, middleButton, 'Focused toolbar item becomes tab stop');

  dispatchKeydown(middleButton, 'End');
  assertFocusedToolbarButton(buttons, buttons[buttons.length - 1], 'End moves to last button');

  dispatchKeydown(buttons[buttons.length - 1], 'Home');
  assertFocusedToolbarButton(buttons, buttons[0], 'Home moves to first button');

  editor.destroy();
})();

// Test: View mode dropdown follows menu button semantics
(() => {
  const editor = createEditor();
  const viewModeButton = editor.toolbar.buttons.viewMode;

  assert(
    viewModeButton.getAttribute('aria-haspopup') === 'menu' &&
      viewModeButton.getAttribute('aria-expanded') === 'false',
    'View mode button is a menu button',
    'Expected menu popup semantics in collapsed state'
  );

  viewModeButton.focus();
  dispatchKeydown(viewModeButton, 'ArrowUp');

  const dropdown = document.querySelector('.overtype-dropdown-menu');
  const menuItems = dropdown ? Array.from(dropdown.querySelectorAll('[role="menuitemradio"]')) : [];

  assert(
    dropdown?.getAttribute('role') === 'menu' &&
      viewModeButton.getAttribute('aria-expanded') === 'true' &&
      viewModeButton.getAttribute('aria-controls') === dropdown.id,
    'ArrowUp opens view mode menu',
    'Expected expanded menu controlled by the view mode button'
  );
  assert(
    menuItems.length === 3 &&
      menuItems[0].getAttribute('aria-checked') === 'true' &&
      menuItems.every(item => item.tabIndex === -1),
    'View mode menu items use managed radio focus',
    'Expected checked radio menu items outside the page tab order'
  );
  assert(document.activeElement === menuItems[2], 'ArrowUp opens menu on last item', 'Expected last menu item to receive focus');

  dispatchKeydown(menuItems[2], 'ArrowDown');
  assert(document.activeElement === menuItems[0], 'Menu ArrowDown wraps to first item', 'Expected first item to receive focus');

  dispatchKeydown(menuItems[0], 'Escape');
  assert(
    !document.querySelector('.overtype-dropdown-menu') &&
      viewModeButton.getAttribute('aria-expanded') === 'false' &&
      document.activeElement === viewModeButton,
    'Escape closes view mode menu',
    'Expected collapsed menu button to regain focus'
  );

  editor.destroy();
})();

// Test: Custom toolbar buttons can opt into toggle semantics
(() => {
  const editor = createEditor({
    toolbarButtons: [
      {
        name: 'customToggle',
        icon: '<span>T</span>',
        title: 'Custom Toggle',
        isActive: ({ editor }) => editor.getValue().includes('active'),
        action: () => {}
      },
      {
        name: 'customAction',
        icon: '<span>A</span>',
        title: 'Custom Action',
        action: () => {}
      }
    ],
    value: 'active'
  });

  const customToggle = editor.toolbar.buttons.customToggle;
  const customAction = editor.toolbar.buttons.customAction;

  assert(
    customToggle.getAttribute('aria-pressed') === 'true' &&
      customToggle.classList.contains('active'),
    'Custom toggle starts pressed',
    'Expected custom toggle to set pressed state and active class'
  );
  assert(!customAction.hasAttribute('aria-pressed'), 'Custom action is not a toggle', 'Expected custom action to omit aria-pressed');

  editor.setValue('disabled');
  editor.toolbar.updateButtonStates();

  assert(
    customToggle.getAttribute('aria-pressed') === 'false' &&
      !customToggle.classList.contains('active'),
    'Custom toggle can update pressed state',
    'Expected custom toggle to clear pressed state and active class'
  );

  editor.destroy();
})();

console.log(`\n${'━'.repeat(50)}`);
console.log('\n📊 Test Results Summary\n');
console.log(`✅ Passed: ${results.passed}`);
console.log(`❌ Failed: ${results.failed}`);
console.log(`📈 Total:  ${results.passed + results.failed}`);
console.log(`🎯 Success Rate: ${((results.passed / (results.passed + results.failed)) * 100).toFixed(1)}%`);

if (results.failed > 0) {
  console.error(`\n❌ ${results.failed} test(s) failed!`);
  process.exit(1);
} else {
  console.log('\n✅ All tests passed!');
  process.exit(0);
}
