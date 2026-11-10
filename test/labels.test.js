/**
 * Translated toolbar labels
 * The toolbar's titles, its accessible name and the view mode menu come from `labels`;
 * anything left out keeps its English.
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
global.Event = dom.window.Event;
global.KeyboardEvent = dom.window.KeyboardEvent;
global.CSS = { supports: () => false };
global.performance = { now: () => Date.now() };
global.requestAnimationFrame = (callback) => setTimeout(callback, 0);
window.matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {} });

const { OverType, defaultLabels, toolbarButtons } = await import('../src/overtype.js');

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
  return new OverType('#editor', { toolbar: true, ...options })[0];
}

const button = (editor, name) => editor.toolbar.container.querySelector(`[data-button="${name}"]`);
const titleOf = (editor, name) => button(editor, name)?.title;

console.log('🧪 Running toolbar label tests...\n');

const german = {
  toolbar: 'Formatierung',
  viewMode: 'Ansicht',
  viewModes: { normal: 'Bearbeiten', preview: 'Vorschau' },
  buttons: { bold: 'Fett', italic: 'Kursiv', bulletList: 'Aufzählung' }
};

// English stays the default
let editor = createEditor();
assert(editor.toolbar.container.getAttribute('aria-label') === 'Formatting toolbar', 'English by default');
assert(titleOf(editor, 'bold').startsWith('Bold ('), 'built-in titles by default', titleOf(editor, 'bold'));
assert(defaultLabels.viewModes.preview === 'Preview Mode' && OverType.defaultLabels === defaultLabels, 'defaultLabels exported, also on OverType');
assert(Object.isFrozen(defaultLabels) && Object.isFrozen(defaultLabels.viewModes), 'defaultLabels cannot be changed by accident');
assert(defaultLabels.buttons.bold === 'Bold' && defaultLabels.buttons.bulletList === toolbarButtons.bulletList.title, "the built-in buttons' English titles");
assert(Object.isFrozen(defaultLabels.buttons), 'their titles too');

// Translated
editor = createEditor({ labels: german });
assert(editor.toolbar.container.getAttribute('aria-label') === 'Formatierung', "the toolbar's accessible name");
assert(/^Fett \(.+\)$/.test(titleOf(editor, 'bold')), 'a translated title keeps its shortcut', titleOf(editor, 'bold'));
assert(button(editor, 'bold').getAttribute('aria-label') === titleOf(editor, 'bold'), 'the button reads the same to a screen reader');
assert(titleOf(editor, 'bulletList').startsWith('Aufzählung'), 'any built-in button by name', titleOf(editor, 'bulletList'));
assert(titleOf(editor, 'quote').startsWith('Quote'), 'a button left out keeps its English', titleOf(editor, 'quote'));

// The view mode menu
button(editor, 'viewMode').click();
const menu = document.querySelector('.overtype-dropdown-menu');
const items = menu ? Array.from(menu.querySelectorAll('.overtype-dropdown-item')).map(item => item.textContent.replace('✓', '').trim()) : [];
assert(menu?.getAttribute('aria-label') === 'Ansicht', "the menu's accessible name", menu?.getAttribute('aria-label'));
assert(JSON.stringify(items) === JSON.stringify(['Bearbeiten', 'Plain Textarea', 'Vorschau']), 'menu items, the missing one in English', JSON.stringify(items));
document.body.click();

// Custom buttons can be labelled the same way
editor = createEditor({
  toolbarButtons: [toolbarButtons.bold, { name: 'save', title: 'Save', icon: '<svg></svg>', action() {} }],
  labels: { buttons: { save: 'Speichern' } }
});
assert(titleOf(editor, 'save') === 'Speichern', 'a custom button by name');
editor = createEditor({ toolbarButtons: [{ ...toolbarButtons.bold, title: 'Strong' }] });
assert(/^Strong/.test(titleOf(editor, 'bold')), "a button's own title stays when labels don't name it", titleOf(editor, 'bold'));

// reinit with other labels rebuilds the toolbar
editor = createEditor({ labels: german });
editor.reinit({ labels: { buttons: { bold: 'Gras' } } });
assert(/^Gras \(/.test(titleOf(editor, 'bold')), 'reinit applies new labels', titleOf(editor, 'bold'));
assert(editor.toolbar.container.getAttribute('aria-label') === 'Formatting toolbar', 'what the new labels leave out is English again');

// labels are the object's own keys: a button named after an Object.prototype member keeps its title
editor = createEditor({ toolbarButtons: ['toString', 'constructor', '__proto__'].map(name => ({ name, title: 'Mine ' + name, icon: '<svg></svg>', action() {} })),
                        labels: { buttons: {} } });
assert(['toString', 'constructor', '__proto__'].every(n => titleOf(editor, n) === 'Mine ' + n), 'inherited names are not labels',
       ['toString', 'constructor', '__proto__'].map(n => titleOf(editor, n)).join(' / '));
const own = JSON.parse('{"buttons": {"__proto__": "Eigen"}}');
editor = createEditor({ toolbarButtons: [{ name: '__proto__', title: 'Mine', icon: '<svg></svg>', action() {} }], labels: own });
assert(titleOf(editor, '__proto__') === 'Eigen', 'an own key of that name is a label', titleOf(editor, '__proto__'));

// a view mode label left undefined keeps its English
editor = createEditor({ labels: { viewModes: { normal: undefined, preview: 'Vorschau' } } });
button(editor, 'viewMode').click();
const modes = Array.from(document.querySelectorAll('.overtype-dropdown-menu .overtype-dropdown-item')).map(i => i.textContent.replace('✓', '').trim());
assert(JSON.stringify(modes) === JSON.stringify(['Normal Edit', 'Plain Textarea', 'Vorschau']), 'undefined keeps its English', JSON.stringify(modes));
document.body.click();

// the same labels object changed in place, then reinit: the toolbar shows the change
const shared = { buttons: { bold: 'Fett' } };
editor = createEditor({ labels: shared });
shared.buttons.bold = 'Dick';
editor.reinit({ labels: shared });
assert(/^Dick \(/.test(titleOf(editor, 'bold')), 'changes in place are picked up', titleOf(editor, 'bold'));
editor.reinit({ placeholder: 'y' });
assert(/^Dick \(/.test(titleOf(editor, 'bold')), 'and kept');

// a toolbar shown with showToolbar() on an editor created without one survives reinit, also a labels rebuild
editor = createEditor({ toolbar: false });
editor.showToolbar();
editor.reinit({ labels: german });
assert(editor.toolbar && document.contains(editor.toolbar.container), 'showToolbar() then reinit({ labels }): the toolbar stays');
assert(/^Fett \(/.test(titleOf(editor, 'bold')), '...in the new language', titleOf(editor, 'bold'));
editor.reinit({ placeholder: 'x' });
assert(editor.toolbar && document.contains(editor.toolbar.container), '...and through any other reinit');
editor.reinit({ toolbar: false });
assert(!editor.toolbar, 'reinit({ toolbar: false }) still removes it');
// a hidden toolbar stays hidden when new labels rebuild it
editor = createEditor({ labels: german });
editor.hideToolbar();
editor.reinit({ labels: { buttons: { bold: 'Gras' } } });
assert(editor.toolbar.container.classList.contains('overtype-toolbar-hidden'), 'hideToolbar() holds through a labels rebuild');

console.log(`\n✅ Passed: ${passed}`);
console.log(`❌ Failed: ${failed}`);

if (failed > 0) {
  process.exit(1);
} else {
  console.log('✨ All toolbar label tests passed!');
}
