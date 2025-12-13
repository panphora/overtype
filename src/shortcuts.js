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
    const isMac = navigator.platform.toLowerCase().includes('mac');
    const modKey = isMac ? event.metaKey : event.ctrlKey;

    if (!modKey) return false;

    let actionId = null;

    switch (event.key.toLowerCase()) {
      case 'b':
        if (!event.shiftKey) actionId = 'toggleBold';
        break;
      case 'i':
        if (!event.shiftKey) actionId = 'toggleItalic';
        break;
      case 'k':
        if (!event.shiftKey) actionId = 'insertLink';
        break;
      case '7':
        if (event.shiftKey) actionId = 'toggleNumberedList';
        break;
      case '8':
        if (event.shiftKey) actionId = 'toggleBulletList';
        break;
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
