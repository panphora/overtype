/**
 * Keyboard shortcuts handler for OverType editor
 * Delegates to editor.performAction for consistent behavior
 */

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
    const { modKey, matchesKey } = this.getShortcutInfo(event);

    if (!modKey) return false;

    if (!event.shiftKey && matchesKey(']', 'bracketright')) {
      event.preventDefault();
      this.editor.indentSelection();
      return true;
    }

    if (!event.shiftKey && matchesKey('[', 'bracketleft')) {
      event.preventDefault();
      this.editor.outdentSelection();
      return true;
    }

    let actionId = null;

    if (!event.shiftKey) {
      if (matchesKey('b', 'keyb')) actionId = 'toggleBold';
      if (matchesKey('e', 'keye')) actionId = 'toggleCode';
      if (matchesKey('i', 'keyi')) actionId = 'toggleItalic';
      if (matchesKey('k', 'keyk')) actionId = 'insertLink';
    }

    if (event.shiftKey) {
      if (matchesKey('7', '&', 'digit7')) actionId = 'toggleNumberedList';
      if (matchesKey('8', '*', 'digit8')) actionId = 'toggleBulletList';
      if (matchesKey('.', '>', 'period')) actionId = 'toggleQuote';
    }

    if (actionId) {
      event.preventDefault();
      this.editor.performAction(actionId, event);
      return true;
    }

    return false;
  }

  /**
   * Get normalized shortcut state for cross-platform matching.
   * @param {KeyboardEvent} event - The keyboard event
   * @returns {{modKey: boolean, matchesKey: Function}}
   */
  getShortcutInfo(event) {
    const isMac = navigator.platform.toLowerCase().includes('mac');
    const modKey = isMac ? event.metaKey : event.ctrlKey;

    const key = event.key.toLowerCase();
    const code = (event.code || '').toLowerCase();
    const matchesKey = (...values) => values.includes(key) || values.includes(code);

    return { modKey, matchesKey };
  }

  /**
   * Cleanup
   */
  destroy() {
    // Nothing to clean up since we don't add our own listener
  }
}
