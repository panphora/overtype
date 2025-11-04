/**
 * Toolbar component for OverType editor
 * Provides markdown formatting buttons with icons and support for custom buttons
 */

import * as icons from './icons.js';
import * as markdownActions from 'markdown-actions';

// Store all available built-in buttons
const BUILTIN_BUTTONS = [
  'bold', 'italic', 'strikethrough', 'code',
  'link', 'h1', 'h2', 'h3',
  'bulletList', 'orderedList',
  'quote',
  'viewMode'  // Special dropdown button
];

export class Toolbar {
  constructor(editor, options = {}) {
    this.editor = editor;
    this.container = null;
    this.buttons = {};

    // Backward compatibility: support old buttonConfig
    this.buttonConfig = options.buttonConfig || null;

    // Extract custom toolbar options (new API)
    this.customButtons = options.customToolbarButtons || [];
    this.hideButtons = options.hideButtons || [];
    this.buttonOrder = options.buttonOrder || null;

    // Build button registry on initialization
    this.buttonRegistry = this.buildButtonRegistry();
  }

  /**
   * Build registry of all buttons (built-in + custom)
   */
  buildButtonRegistry() {
    const registry = new Map();

    // Check for naming conflicts
    this.customButtons.forEach(button => {
      if (BUILTIN_BUTTONS.includes(button.name)) {
        console.warn(`Custom button "${button.name}" conflicts with built-in button. Using "custom-${button.name}" instead.`);
        button.name = `custom-${button.name}`;
      }
    });

    // Add built-in buttons (unless hidden)
    BUILTIN_BUTTONS.forEach(name => {
      if (!this.hideButtons.includes(name)) {
        registry.set(name, {
          type: 'builtin',
          name,
          ...this.getBuiltinButtonConfig(name)
        });
      }
    });

    // Add custom buttons
    this.customButtons.forEach(button => {
      registry.set(button.name, { type: 'custom', ...button });
    });

    return registry;
  }

  /**
   * Get configuration for built-in buttons
   */
  getBuiltinButtonConfig(name) {
    const configs = {
      bold: {
        icon: icons.boldIcon,
        title: 'Bold (Ctrl+B)',
        action: (editor) => {
          markdownActions.toggleBold(editor.textarea);
          editor.textarea.dispatchEvent(new Event('input', { bubbles: true }));
        }
      },
      italic: {
        icon: icons.italicIcon,
        title: 'Italic (Ctrl+I)',
        action: (editor) => {
          markdownActions.toggleItalic(editor.textarea);
          editor.textarea.dispatchEvent(new Event('input', { bubbles: true }));
        }
      },
      strikethrough: {
        icon: icons.strikethroughIcon || '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 4H9a3 3 0 0 0 0 6h11a3 3 0 0 0 0-6h-1M8 20h7M4 12h16"/></svg>',
        title: 'Strikethrough',
        action: (editor) => {
          if (markdownActions.toggleStrikethrough) {
            markdownActions.toggleStrikethrough(editor.textarea);
          }
          editor.textarea.dispatchEvent(new Event('input', { bubbles: true }));
        }
      },
      code: {
        icon: icons.codeIcon,
        title: 'Code (Ctrl+`)',
        action: (editor) => {
          markdownActions.toggleCode(editor.textarea);
          editor.textarea.dispatchEvent(new Event('input', { bubbles: true }));
        }
      },
      link: {
        icon: icons.linkIcon,
        title: 'Insert Link (Ctrl+K)',
        action: (editor) => {
          markdownActions.insertLink(editor.textarea);
          editor.textarea.dispatchEvent(new Event('input', { bubbles: true }));
        }
      },
      h1: {
        icon: icons.h1Icon,
        title: 'Heading 1',
        action: (editor) => {
          markdownActions.toggleH1(editor.textarea);
          editor.textarea.dispatchEvent(new Event('input', { bubbles: true }));
        }
      },
      h2: {
        icon: icons.h2Icon,
        title: 'Heading 2',
        action: (editor) => {
          markdownActions.toggleH2(editor.textarea);
          editor.textarea.dispatchEvent(new Event('input', { bubbles: true }));
        }
      },
      h3: {
        icon: icons.h3Icon,
        title: 'Heading 3',
        action: (editor) => {
          markdownActions.toggleH3(editor.textarea);
          editor.textarea.dispatchEvent(new Event('input', { bubbles: true }));
        }
      },
      bulletList: {
        icon: icons.bulletListIcon,
        title: 'Bullet List',
        action: (editor) => {
          markdownActions.toggleBulletList(editor.textarea);
          editor.textarea.dispatchEvent(new Event('input', { bubbles: true }));
        }
      },
      orderedList: {
        icon: icons.orderedListIcon,
        title: 'Numbered List',
        action: (editor) => {
          markdownActions.toggleNumberedList(editor.textarea);
          editor.textarea.dispatchEvent(new Event('input', { bubbles: true }));
        }
      },
      quote: {
        icon: icons.quoteIcon,
        title: 'Quote',
        action: (editor) => {
          markdownActions.toggleQuote(editor.textarea);
          editor.textarea.dispatchEvent(new Event('input', { bubbles: true }));
        }
      },
      viewMode: {
        icon: icons.eyeIcon,
        title: 'View mode',
        type: 'dropdown',
        dropdownItems: [
          { id: 'normal', label: 'Normal Edit', icon: '✓' },
          { id: 'plain', label: 'Plain Textarea', icon: '✓' },
          { id: 'preview', label: 'Preview Mode', icon: '✓' }
        ],
        action: (editor, item) => {
          // Handle view mode changes
          switch(item.id) {
            case 'plain':
              editor.showPlainTextarea();
              break;
            case 'preview':
              editor.showPreviewMode();
              break;
            case 'normal':
            default:
              editor.showNormalEditMode();
              break;
          }
        }
      }
    };

    return configs[name] || {};
  }

  /**
   * Sanitize SVG to prevent XSS
   */
  sanitizeSVG(svgString) {
    if (typeof svgString !== 'string') {
      throw new Error('Icon must be a string');
    }

    // Remove script tags and event handlers
    const clean = svgString
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/on\w+\s*=\s*"[^"]*"/gi, '')
      .replace(/on\w+\s*=\s*'[^']*'/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/data:text\/html/gi, '');

    // Ensure it's actually SVG
    if (!clean.trim().startsWith('<svg')) {
      console.warn('Icon should start with <svg> tag');
    }

    return clean;
  }

  /**
   * Create and attach toolbar to editor
   */
  create() {
    // Create toolbar container
    this.container = document.createElement('div');
    this.container.className = 'overtype-toolbar';
    this.container.setAttribute('role', 'toolbar');
    this.container.setAttribute('aria-label', 'Text formatting');

    // Use old buttonConfig if provided (backward compatibility)
    if (this.buttonConfig) {
      // Old API: use provided button config array
      this.createOldStyleButtons(this.buttonConfig);
    } else {
      // New API: use button registry
      const buttonsToCreate = this.getButtonsToCreate();

      // Create and add buttons
      buttonsToCreate.forEach(config => {
        const button = this.createButton(config);
        this.buttons[config.name] = button;

        // Position button according to config
        this.positionButton(button, config);
      });

      // Initialize state updates for custom buttons
      this.initializeCustomButtonStates();
    }

    // Insert toolbar into container before editor wrapper
    const container = this.editor.element.querySelector('.overtype-container');
    const wrapper = this.editor.element.querySelector('.overtype-wrapper');
    if (container && wrapper) {
      container.insertBefore(this.container, wrapper);
    }

    return this.container;
  }

  /**
   * Create buttons using old buttonConfig format (backward compatibility)
   */
  createOldStyleButtons(buttonConfig) {
    buttonConfig.forEach(config => {
      if (config.separator) {
        const separator = document.createElement('div');
        separator.className = 'overtype-toolbar-separator';
        separator.setAttribute('role', 'separator');
        this.container.appendChild(separator);
      } else {
        const button = this.createOldStyleButton(config);
        this.buttons[config.name] = button;
        this.container.appendChild(button);
      }
    });
  }

  /**
   * Create button using old format (backward compatibility)
   */
  createOldStyleButton(config) {
    const button = document.createElement('button');
    button.className = 'overtype-toolbar-button';
    button.type = 'button';
    button.title = config.title;
    button.setAttribute('aria-label', config.title);
    button.setAttribute('data-action', config.action);
    button.setAttribute('data-button', config.name);
    button.innerHTML = config.icon;

    // Add dropdown if needed
    if (config.hasDropdown) {
      button.classList.add('has-dropdown');
      // Store reference for dropdown
      if (config.name === 'viewMode') {
        this.viewModeButton = button;
      }
    }

    // Add click handler
    button.addEventListener('click', (e) => {
      e.preventDefault();
      this.handleOldAction(config.action, button);
    });

    return button;
  }

  /**
   * Handle old-style toolbar button actions (backward compatibility)
   */
  async handleOldAction(action, button) {
    const textarea = this.editor.textarea;
    if (!textarea) return;

    // Handle dropdown toggle
    if (action === 'toggle-view-menu') {
      this.toggleViewDropdown(button);
      return;
    }

    // Focus textarea for other actions
    textarea.focus();

    try {
      switch (action) {
        case 'toggleBold':
          markdownActions.toggleBold(textarea);
          break;
        case 'toggleItalic':
          markdownActions.toggleItalic(textarea);
          break;
        case 'insertH1':
          markdownActions.toggleH1(textarea);
          break;
        case 'insertH2':
          markdownActions.toggleH2(textarea);
          break;
        case 'insertH3':
          markdownActions.toggleH3(textarea);
          break;
        case 'insertLink':
          markdownActions.insertLink(textarea);
          break;
        case 'toggleCode':
          markdownActions.toggleCode(textarea);
          break;
        case 'toggleBulletList':
          markdownActions.toggleBulletList(textarea);
          break;
        case 'toggleNumberedList':
          markdownActions.toggleNumberedList(textarea);
          break;
        case 'toggleQuote':
          markdownActions.toggleQuote(textarea);
          break;
        case 'toggleTaskList':
          markdownActions.toggleTaskList(textarea);
          break;
      }

      // Trigger input event to update preview
      textarea.dispatchEvent(new Event('input', { bubbles: true }));
    } catch (error) {
      console.error('Error loading markdown-actions:', error);
    }
  }

  /**
   * Toggle view mode dropdown (old API compatibility)
   */
  toggleViewDropdown(button) {
    // Use the same dropdown logic but with old-style handling
    const buttonConfig = {
      name: 'viewMode',
      type: 'dropdown',
      dropdownItems: [
        { id: 'normal', label: 'Normal Edit', icon: '✓' },
        { id: 'plain', label: 'Plain Textarea', icon: '✓' },
        { id: 'preview', label: 'Preview Mode', icon: '✓' }
      ],
      action: (editor, item) => {
        switch(item.id) {
          case 'plain':
            editor.showPlainTextarea();
            break;
          case 'preview':
            editor.showPreviewMode();
            break;
          case 'normal':
          default:
            editor.showNormalEditMode();
            break;
        }
      }
    };

    this.toggleDropdown(button, buttonConfig);
  }

  /**
   * Get ordered list of buttons to create
   */
  getButtonsToCreate() {
    if (this.buttonOrder) {
      // Use custom order
      const ordered = [];
      this.buttonOrder.forEach(name => {
        const config = this.buttonRegistry.get(name);
        if (config) {
          ordered.push(config);
        } else {
          console.warn(`Button "${name}" in buttonOrder not found in registry`);
        }
      });

      // Add any remaining buttons not in order
      this.buttonRegistry.forEach((config, name) => {
        if (!this.buttonOrder.includes(name)) {
          ordered.push(config);
        }
      });

      return ordered;
    } else {
      // Default order: all buttons in registry order
      return Array.from(this.buttonRegistry.values());
    }
  }

  /**
   * Create individual toolbar button (unified for built-in and custom)
   */
  createButton(buttonConfig) {
    const button = document.createElement('button');
    button.className = 'overtype-toolbar-button';
    button.type = 'button';
    button.setAttribute('data-button', buttonConfig.name);
    button.title = buttonConfig.title;
    button.setAttribute('aria-label', buttonConfig.title);

    // Add icon (sanitized for custom buttons)
    if (buttonConfig.type === 'custom') {
      button.innerHTML = this.sanitizeSVG(buttonConfig.icon);
      button.dataset.custom = 'true';
    } else {
      button.innerHTML = buttonConfig.icon;
      button.dataset.builtin = 'true';
    }

    // Add dropdown class if needed
    if (buttonConfig.type === 'dropdown' || buttonConfig.dropdownItems) {
      button.classList.add('has-dropdown');
      button.dataset.dropdown = 'true';
    }

    // Add click handler
    const clickHandler = (event) => {
      event.preventDefault();

      // Handle dropdown toggle
      if (buttonConfig.type === 'dropdown' || buttonConfig.dropdownItems) {
        this.toggleDropdown(button, buttonConfig);
        return;
      }

      // Focus textarea for non-dropdown actions
      if (this.editor.textarea) {
        this.editor.textarea.focus();
      }

      // Execute action
      try {
        if (buttonConfig.type === 'custom') {
          // Custom button with context object
          buttonConfig.action({
            editor: this.editor,
            getValue: () => this.editor.getValue(),
            setValue: (value) => this.editor.setValue(value),
            event
          });
        } else {
          // Built-in button with simple editor param
          buttonConfig.action(this.editor);
        }
      } catch (error) {
        console.error(`Button "${buttonConfig.name}" error:`, error);

        // Dispatch error event
        this.editor.wrapper.dispatchEvent(new CustomEvent('button-error', {
          detail: { buttonName: buttonConfig.name, error }
        }));

        // Visual feedback
        button.classList.add('error');
        setTimeout(() => button.classList.remove('error'), 300);
      }
    };

    button.addEventListener('click', clickHandler);
    button._clickHandler = clickHandler;  // Store for cleanup

    // Handle isEnabled callback
    if (typeof buttonConfig.isEnabled === 'function') {
      button._isEnabled = buttonConfig.isEnabled;
      button._buttonConfig = buttonConfig;
    }

    return button;
  }

  /**
   * Position button in toolbar
   */
  positionButton(button, config) {
    if (!config.position || config.position === 'end') {
      this.container.appendChild(button);
    } else if (config.position === 'start') {
      this.container.insertBefore(button, this.container.firstChild);
    } else if (config.position.startsWith('after:')) {
      const targetName = config.position.substring(6);
      const targetButton = this.container.querySelector(`[data-button="${targetName}"]`);
      if (targetButton && targetButton.nextSibling) {
        this.container.insertBefore(button, targetButton.nextSibling);
      } else if (targetButton) {
        this.container.appendChild(button);
      } else {
        console.warn(`Position target "${targetName}" not found, appending to end`);
        this.container.appendChild(button);
      }
    } else {
      this.container.appendChild(button);
    }
  }

  /**
   * Toggle dropdown menu for a button
   */
  toggleDropdown(button, buttonConfig) {
    // Close any existing dropdown
    const existingDropdown = document.querySelector('.overtype-dropdown-menu');
    if (existingDropdown) {
      existingDropdown.remove();
      document.querySelector('.dropdown-active')?.classList.remove('dropdown-active');
      document.removeEventListener('click', this.handleDocumentClick);
    }

    // If clicking the same button, just close
    if (button.classList.contains('dropdown-active')) {
      button.classList.remove('dropdown-active');
      return;
    }

    // Create dropdown menu (pass button to fix scope issue)
    const dropdown = this.createDropdown(button, buttonConfig);

    // Position dropdown relative to button
    const rect = button.getBoundingClientRect();
    dropdown.style.top = `${rect.bottom + 4}px`;
    dropdown.style.left = `${rect.left}px`;

    // Append to body
    document.body.appendChild(dropdown);
    button.classList.add('dropdown-active');

    // Setup click handler to close dropdown
    this.handleDocumentClick = (e) => {
      if (!button.contains(e.target) && !dropdown.contains(e.target)) {
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
   * Create dropdown menu
   */
  createDropdown(button, buttonConfig) {
    const dropdown = document.createElement('div');
    dropdown.className = 'overtype-dropdown-menu';

    const items = buttonConfig.dropdownItems || [];

    // Special handling for viewMode button
    if (buttonConfig.name === 'viewMode') {
      const currentMode = this.editor.container.dataset.mode || 'normal';

      items.forEach(item => {
        const menuItem = document.createElement('button');
        menuItem.className = 'overtype-dropdown-item';
        menuItem.type = 'button';

        const check = document.createElement('span');
        check.className = 'overtype-dropdown-check';
        check.textContent = currentMode === item.id ? item.icon : '';

        const label = document.createElement('span');
        label.textContent = item.label;

        menuItem.appendChild(check);
        menuItem.appendChild(label);

        if (currentMode === item.id) {
          menuItem.classList.add('active');
        }

        menuItem.addEventListener('click', (e) => {
          e.stopPropagation();
          buttonConfig.action(this.editor, item);
          dropdown.remove();
          button.classList.remove('dropdown-active');
          document.removeEventListener('click', this.handleDocumentClick);
        });

        dropdown.appendChild(menuItem);
      });
    } else {
      // Handle custom dropdown buttons
      items.forEach(item => {
        const menuItem = document.createElement('button');
        menuItem.className = 'overtype-dropdown-item';
        menuItem.type = 'button';

        if (item.icon) {
          const icon = document.createElement('span');
          icon.className = 'overtype-dropdown-icon';
          icon.textContent = item.icon;
          menuItem.appendChild(icon);
        }

        const label = document.createElement('span');
        label.textContent = item.label;
        menuItem.appendChild(label);

        menuItem.addEventListener('click', (e) => {
          e.stopPropagation();

          // Execute action with dropdown item context
          try {
            if (buttonConfig.type === 'custom') {
              buttonConfig.action({
                editor: this.editor,
                getValue: () => this.editor.getValue(),
                setValue: (value) => this.editor.setValue(value),
                item,
                event: e
              });
            } else {
              // Built-in dropdown
              buttonConfig.action(this.editor, item);
            }
          } catch (error) {
            console.error(`Dropdown item "${item.id}" error:`, error);
            this.editor.wrapper.dispatchEvent(new CustomEvent('button-error', {
              detail: { buttonName: buttonConfig.name, item, error }
            }));
          }

          // Close dropdown
          dropdown.remove();
          document.querySelector('.dropdown-active')?.classList.remove('dropdown-active');
          document.removeEventListener('click', this.handleDocumentClick);
        });

        dropdown.appendChild(menuItem);
      });
    }

    return dropdown;
  }

  /**
   * Update button states (including custom buttons)
   */
  updateButtonState(button) {
    if (button._isEnabled && button._buttonConfig) {
      const enabled = button._isEnabled(this.editor);
      button.disabled = !enabled;
      button.classList.toggle('disabled', !enabled);
    }
  }

  /**
   * Initialize state management for custom buttons
   */
  initializeCustomButtonStates() {
    // Debounced update function
    this.updateCustomButtonStates = this.debounce(() => {
      Object.values(this.buttons).forEach(button => {
        if (button.dataset.custom === 'true') {
          this.updateButtonState(button);
        }
      });
    }, 100);

    // Listen for content changes
    this.editor.textarea?.addEventListener('input', () => {
      this.updateCustomButtonStates();
    });
  }

  /**
   * Debounce utility
   */
  debounce(func, wait) {
    let timeout;
    const debounced = function(...args) {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(this, args), wait);
    };
    debounced.cancel = () => clearTimeout(timeout);
    return debounced;
  }

  /**
   * Update toolbar button states based on current selection
   */
  async updateButtonStates() {
    const textarea = this.editor.textarea;
    if (!textarea) return;

    try {
      const activeFormats = markdownActions.getActiveFormats(textarea);

      // Update built-in button states
      Object.entries(this.buttons).forEach(([name, button]) => {
        if (button.dataset.builtin !== 'true') return;

        let isActive = false;

        switch (name) {
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

    // Update custom button states
    if (this.updateCustomButtonStates) {
      this.updateCustomButtonStates();
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

      // Clean up custom button listeners
      Object.values(this.buttons).forEach(button => {
        if (button._clickHandler) {
          button.removeEventListener('click', button._clickHandler);
          delete button._clickHandler;
        }
        if (button._isEnabled) {
          delete button._isEnabled;
        }
        if (button._buttonConfig) {
          delete button._buttonConfig;
        }
      });

      // Cancel any pending state updates
      if (this.updateCustomButtonStates?.cancel) {
        this.updateCustomButtonStates.cancel();
      }

      // Remove the container
      this.container.remove();
      this.container = null;
      this.buttons = {};
      this.buttonRegistry.clear();
    }
  }
}