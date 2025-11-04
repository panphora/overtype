/**
 * Toolbar component for OverType editor
 * Provides markdown formatting buttons with support for custom buttons
 */

import * as markdownActions from 'markdown-actions';

export class Toolbar {
  constructor(editor, options = {}) {
    this.editor = editor;
    this.container = null;
    this.buttons = {};

    // Get toolbar buttons array
    this.toolbarButtons = options.toolbarButtons || [];
  }

  /**
   * Create and render toolbar
   */
  create() {
    this.container = document.createElement('div');
    this.container.className = 'overtype-toolbar';
    this.container.setAttribute('role', 'toolbar');
    this.container.setAttribute('aria-label', 'Formatting toolbar');

    // Create buttons from toolbarButtons array
    this.toolbarButtons.forEach(buttonConfig => {
      if (buttonConfig.name === 'separator') {
        const separator = this.createSeparator();
        this.container.appendChild(separator);
      } else {
        const button = this.createButton(buttonConfig);
        this.buttons[buttonConfig.name] = button;
        this.container.appendChild(button);
      }
    });

    this.editor.wrapper.insertBefore(this.container, this.editor.wrapper.firstChild);
  }

  /**
   * Create a toolbar separator
   */
  createSeparator() {
    const separator = document.createElement('div');
    separator.className = 'overtype-toolbar-separator';
    separator.setAttribute('role', 'separator');
    return separator;
  }

  /**
   * Create a toolbar button
   */
  createButton(buttonConfig) {
    const button = document.createElement('button');
    button.className = 'overtype-toolbar-button';
    button.type = 'button';
    button.setAttribute('data-button', buttonConfig.name);
    button.title = buttonConfig.title || '';
    button.setAttribute('aria-label', buttonConfig.title || buttonConfig.name);
    button.innerHTML = this.sanitizeSVG(buttonConfig.icon || '');

    // Special handling for viewMode dropdown
    if (buttonConfig.name === 'viewMode') {
      button.classList.add('has-dropdown');
      button.dataset.dropdown = 'true';
      button.addEventListener('click', (e) => {
        e.preventDefault();
        this.toggleViewModeDropdown(button);
      });
      return button;
    }

    // Standard button click handler
    button._clickHandler = async (e) => {
      e.preventDefault();

      // Focus textarea before action
      this.editor.textarea.focus();

      try {
        if (buttonConfig.action) {
          // Call action with consistent context object
          await buttonConfig.action({
            editor: this.editor,
            getValue: () => this.editor.getValue(),
            setValue: (value) => this.editor.setValue(value),
            event: e
          });
        }
      } catch (error) {
        console.error(`Button "${buttonConfig.name}" error:`, error);

        // Dispatch error event
        this.editor.wrapper.dispatchEvent(new CustomEvent('button-error', {
          detail: { buttonName: buttonConfig.name, error }
        }));

        // Visual feedback
        button.classList.add('button-error');
        button.style.animation = 'buttonError 0.3s';
        setTimeout(() => {
          button.classList.remove('button-error');
          button.style.animation = '';
        }, 300);
      }
    };

    button.addEventListener('click', button._clickHandler);
    return button;
  }

  /**
   * Sanitize SVG to prevent XSS
   */
  sanitizeSVG(svg) {
    if (typeof svg !== 'string') return '';

    // Remove script tags and on* event handlers
    const cleaned = svg
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/\son\w+\s*=\s*["'][^"']*["']/gi, '')
      .replace(/\son\w+\s*=\s*[^\s>]*/gi, '');

    return cleaned;
  }

  /**
   * Toggle view mode dropdown (internal implementation)
   * Not exposed to users - viewMode button behavior is fixed
   */
  toggleViewModeDropdown(button) {
    // Close any existing dropdown
    const existingDropdown = document.querySelector('.overtype-dropdown-menu');
    if (existingDropdown) {
      existingDropdown.remove();
      button.classList.remove('dropdown-active');
      return;
    }

    button.classList.add('dropdown-active');

    const dropdown = this.createViewModeDropdown(button);

    // Position dropdown relative to button
    const rect = button.getBoundingClientRect();
    dropdown.style.position = 'absolute';
    dropdown.style.top = `${rect.bottom + 5}px`;
    dropdown.style.left = `${rect.left}px`;

    document.body.appendChild(dropdown);

    // Click outside to close
    this.handleDocumentClick = (e) => {
      if (!dropdown.contains(e.target) && !button.contains(e.target)) {
        dropdown.remove();
        button.classList.remove('dropdown-active');
        document.removeEventListener('click', this.handleDocumentClick);
      }
    };

    setTimeout(() => {
      document.addEventListener('click', this.handleDocumentClick);
    }, 0);
  }

  /**
   * Create view mode dropdown menu (internal implementation)
   */
  createViewModeDropdown(button) {
    const dropdown = document.createElement('div');
    dropdown.className = 'overtype-dropdown-menu';

    const items = [
      { id: 'normal', label: 'Normal Edit', icon: '✓' },
      { id: 'plain', label: 'Plain Textarea', icon: '✓' },
      { id: 'preview', label: 'Preview Mode', icon: '✓' }
    ];

    const currentMode = this.editor.container.dataset.mode || 'normal';

    items.forEach(item => {
      const menuItem = document.createElement('button');
      menuItem.className = 'overtype-dropdown-item';
      menuItem.type = 'button';
      menuItem.textContent = item.label;

      if (item.id === currentMode) {
        menuItem.classList.add('active');
        menuItem.setAttribute('aria-current', 'true');
        const checkmark = document.createElement('span');
        checkmark.className = 'overtype-dropdown-icon';
        checkmark.textContent = item.icon;
        menuItem.prepend(checkmark);
      }

      menuItem.addEventListener('click', (e) => {
        e.preventDefault();

        // Handle view mode changes
        switch(item.id) {
          case 'plain':
            this.editor.showPlainTextarea();
            break;
          case 'preview':
            this.editor.showPreviewMode();
            break;
          case 'normal':
          default:
            this.editor.showNormalEditMode();
            break;
        }

        dropdown.remove();
        button.classList.remove('dropdown-active');
        document.removeEventListener('click', this.handleDocumentClick);
      });

      dropdown.appendChild(menuItem);
    });

    return dropdown;
  }

  /**
   * Update active states of toolbar buttons
   */
  updateButtonStates() {
    try {
      const activeFormats = markdownActions.getActiveFormats?.(
        this.editor.textarea,
        this.editor.textarea.selectionStart
      ) || [];

      Object.entries(this.buttons).forEach(([name, button]) => {
        if (name === 'viewMode') return; // Skip dropdown button

        let isActive = false;

        switch(name) {
          case 'bold':
            isActive = activeFormats.includes('bold');
            break;
          case 'italic':
            isActive = activeFormats.includes('italic');
            break;
          case 'code':
            isActive = false; // Disabled: unreliable in code blocks
            break;
          case 'bulletList':
            isActive = activeFormats.includes('bullet-list');
            break;
          case 'orderedList':
            isActive = activeFormats.includes('numbered-list');
            break;
          case 'taskList':
            isActive = activeFormats.includes('task-list');
            break;
          case 'quote':
            isActive = activeFormats.includes('quote');
            break;
          case 'h1':
            isActive = activeFormats.includes('header');
            break;
          case 'h2':
            isActive = activeFormats.includes('header-2');
            break;
          case 'h3':
            isActive = activeFormats.includes('header-3');
            break;
        }

        button.classList.toggle('active', isActive);
        button.setAttribute('aria-pressed', isActive.toString());
      });
    } catch (error) {
      // Silently fail if markdown-actions not available
    }
  }

  /**
   * Destroy toolbar and cleanup
   */
  destroy() {
    if (this.container) {
      // Clean up event listeners
      if (this.handleDocumentClick) {
        document.removeEventListener('click', this.handleDocumentClick);
      }

      // Clean up button listeners
      Object.values(this.buttons).forEach(button => {
        if (button._clickHandler) {
          button.removeEventListener('click', button._clickHandler);
          delete button._clickHandler;
        }
      });

      // Remove container
      this.container.remove();
      this.container = null;
      this.buttons = {};
    }
  }
}
