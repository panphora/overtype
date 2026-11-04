/**
 * Keyboard shortcuts handler for OverType editor
 * Delegates to editor.performAction for consistent behavior
 */

function isMacPlatform() {
  return navigator.platform.toLowerCase().includes('mac');
}

/**
 * Format a shortcut such as 'Mod+Shift+8' for the current platform: ⇧⌘8 on a Mac, Ctrl+Shift+8 elsewhere
 * @param {string} shortcut - Parts joined by +, where Mod is Cmd on a Mac and Ctrl elsewhere
 * @returns {string} The label to show
 */
export function formatShortcut(shortcut) {
  const parts = shortcut.split('+');
  const key = parts.pop();
  if (!isMacPlatform()) {
    return [...parts.map(part => (part === 'Mod' ? 'Ctrl' : part)), key].join('+');
  }
  const symbols = { Ctrl: '⌃', Alt: '⌥', Shift: '⇧', Mod: '⌘' };
  return Object.keys(symbols).filter(part => parts.includes(part)).map(part => symbols[part]).join('') + key;
}

/**
 * ShortcutsManager - Handles keyboard shortcuts for the editor
 */
export class ShortcutsManager {
  constructor(editor) {
    this.editor = editor;
  }

  /**
   * Handle keydown events - called by OverType
   * @param {KeyboardEvent} event - The keyboard event
   * @returns {boolean} Whether the event was handled
   */
  handleKeydown(event) {
    const modKey = isMacPlatform() ? event.metaKey : event.ctrlKey;

    if (!modKey) return false;

    if (event.key === ']') {
      event.preventDefault();
      this.editor.indentSelection();
      return true;
    }

    if (event.key === '[') {
      event.preventDefault();
      this.editor.outdentSelection();
      return true;
    }

    // Shift and Option change event.key (⇧⌘8 reports *, ⌥⌘1 reports ¡), so these keys read event.code.
    const physicalKeys = { Digit1: '1', Digit2: '2', Digit3: '3', Digit7: '7', Digit8: '8', Digit9: '9', Period: '.' };
    const key = physicalKeys[event.code] || event.key.toLowerCase();
    let actionId = null;

    if (event.altKey) {
      if (!event.shiftKey) {
        actionId = { 1: 'toggleH1', 2: 'toggleH2', 3: 'toggleH3' }[key] || null;
      }
    } else {
      switch (key) {
        case 'b':
          if (!event.shiftKey) actionId = 'toggleBold';
          break;
        case 'i':
          if (!event.shiftKey) actionId = 'toggleItalic';
          break;
        case 'k':
          if (!event.shiftKey) actionId = 'insertLink';
          break;
        case 'e':
          if (!event.shiftKey) actionId = 'toggleCode';
          break;
        case '7':
          if (event.shiftKey) actionId = 'toggleNumberedList';
          break;
        case '8':
          if (event.shiftKey) actionId = 'toggleBulletList';
          break;
        case '9':
          if (event.shiftKey) actionId = 'toggleTaskList';
          break;
        case '.':
          if (event.shiftKey) actionId = 'toggleQuote';
          break;
      }
    }

    if (actionId) {
      event.preventDefault();
      this.editor.performAction(actionId, event);
      return true;
    }

    return false;
  }

  /**
   * Cleanup
   */
  destroy() {
    // Nothing to clean up since we don't add our own listener
  }
}
