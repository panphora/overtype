/**
 * Toolbar component for OverType editor
 * Provides markdown formatting buttons with icons
 */

import * as icons from './icons.js';
import * as markdownActions from 'markdown-actions';

export class Toolbar {
  constructor(editor, buttonConfig = null) {
    this.editor = editor;
    this.container = null;
    this.buttons = {};
    this.buttonConfig = buttonConfig;
  }

  /**
   * Check if cursor/selection is inside a markdown link
   * @param {HTMLTextAreaElement} textarea - The textarea element
   * @returns {boolean} True if inside a link
   */
  isInsideLink(textarea) {
    const value = textarea.value;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    
    // Look backwards for [ and forwards for ](
    let insideLink = false;
    let openBracket = -1;
    let closeBracket = -1;
    
    // Find the nearest [ before cursor
    for (let i = start - 1; i >= 0; i--) {
      if (value[i] === '[') {
        openBracket = i;
        break;
      }
      if (value[i] === '\n') {
        break; // Links don't span lines
      }
    }
    
    // Find the nearest ]( after cursor
    if (openBracket >= 0) {
      for (let i = end; i < value.length - 1; i++) {
        if (value[i] === ']' && value[i + 1] === '(') {
          closeBracket = i;
          break;
        }
        if (value[i] === '\n') {
          break; // Links don't span lines
        }
      }
    }
    
    // Check if we're inside [...](...) 
    if (openBracket >= 0 && closeBracket >= 0) {
      // Also need to verify the ) exists after ](
      for (let i = closeBracket + 2; i < value.length; i++) {
        if (value[i] === ')') {
          insideLink = true;
          break;
        }
        if (value[i] === '\n' || value[i] === ' ') {
          break; // URLs typically don't have spaces or newlines
        }
      }
    }
    
    return insideLink;
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

    // Define toolbar buttons
    const buttonConfig = this.buttonConfig ?? [
      { name: 'bold', icon: icons.boldIcon, title: 'Bold (Ctrl+B)', action: 'toggleBold' },
      { name: 'italic', icon: icons.italicIcon, title: 'Italic (Ctrl+I)', action: 'toggleItalic' },
      { separator: true },
      { name: 'h1', icon: icons.h1Icon, title: 'Heading 1', action: 'insertH1' },
      { name: 'h2', icon: icons.h2Icon, title: 'Heading 2', action: 'insertH2' },
      { name: 'h3', icon: icons.h3Icon, title: 'Heading 3', action: 'insertH3' },
      { separator: true },
      { name: 'link', icon: icons.linkIcon, title: 'Insert Link (Ctrl+K)', action: 'insertLink' },
      { name: 'code', icon: icons.codeIcon, title: 'Code (Ctrl+`)', action: 'toggleCode' },
      { separator: true },
      { name: 'quote', icon: icons.quoteIcon, title: 'Quote', action: 'toggleQuote' },
      { separator: true },
      { name: 'bulletList', icon: icons.bulletListIcon, title: 'Bullet List', action: 'toggleBulletList' },
      { name: 'orderedList', icon: icons.orderedListIcon, title: 'Numbered List', action: 'toggleNumberedList' },
      { name: 'taskList', icon: icons.taskListIcon, title: 'Task List', action: 'toggleTaskList' },
      { separator: true },
      { name: 'viewMode', icon: icons.eyeIcon, title: 'View mode', action: 'toggle-view-menu', hasDropdown: true }
    ];

    // Create buttons
    buttonConfig.forEach(config => {
      if (config.separator) {
        const separator = document.createElement('div');
        separator.className = 'overtype-toolbar-separator';
        separator.setAttribute('role', 'separator');
        this.container.appendChild(separator);
      } else {
        const button = this.createButton(config);
        this.buttons[config.name] = button;
        this.container.appendChild(button);
      }
    });

    // Insert toolbar into container before editor wrapper
    const container = this.editor.element.querySelector('.overtype-container');
    const wrapper = this.editor.element.querySelector('.overtype-wrapper');
    if (container && wrapper) {
      container.insertBefore(this.container, wrapper);
    }

    return this.container;
  }

  /**
   * Create individual toolbar button
   */
  createButton(config) {
    const button = document.createElement('button');
    button.className = 'overtype-toolbar-button';
    button.type = 'button';
    button.title = config.title;
    button.setAttribute('aria-label', config.title);
    button.setAttribute('data-action', config.action);
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
      this.handleAction(config.action, button);
    });

    return button;
  }

  /**
   * Handle toolbar button actions
   */
  async handleAction(action, button) {
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
          // Don't allow code formatting inside links
          if (this.isInsideLink(textarea)) {
            return;
          }
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
        case 'toggle-plain':
          // Toggle between plain textarea and overlay mode
          const isPlain = this.editor.container.classList.contains('plain-mode');
          this.editor.showPlainTextarea(!isPlain);
          break;
      }

      // Trigger input event to update preview
      textarea.dispatchEvent(new Event('input', { bubbles: true }));
    } catch (error) {
      console.error('Error loading markdown-actions:', error);
    }
  }

  /**
   * Update toolbar button states based on current selection
   */
  async updateButtonStates() {
    const textarea = this.editor.textarea;
    if (!textarea) return;

    try {
      const activeFormats = markdownActions.getActiveFormats(textarea);

      // Update button states
      Object.entries(this.buttons).forEach(([name, button]) => {
        let isActive = false;
        
        switch (name) {
          case 'bold':
            isActive = activeFormats.includes('bold');
            break;
          case 'italic':
            isActive = activeFormats.includes('italic');
            break;
          case 'code':
            // Disabled: code detection is unreliable in code blocks
            // isActive = activeFormats.includes('code');
            isActive = false;
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
          case 'taskList':
            isActive = activeFormats.includes('task-list');
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
          case 'togglePlain':
            // Button is active when in overlay mode (not plain mode)
            isActive = !this.editor.container.classList.contains('plain-mode');
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
   * Toggle view mode dropdown menu
   */
  toggleViewDropdown(button) {
    // Close any existing dropdown
    const existingDropdown = document.querySelector('.overtype-dropdown-menu');
    if (existingDropdown) {
      existingDropdown.remove();
      button.classList.remove('dropdown-active');
      document.removeEventListener('click', this.handleDocumentClick);
      return;
    }

    // Create dropdown menu
    const dropdown = this.createViewDropdown();
    
    // Position dropdown relative to button
    const rect = button.getBoundingClientRect();
    dropdown.style.top = `${rect.bottom + 4}px`;
    dropdown.style.left = `${rect.left}px`;
    
    // Append to body instead of button
    document.body.appendChild(dropdown);
    button.classList.add('dropdown-active');
    
    // Store reference for document click handler
    this.handleDocumentClick = (e) => {
      if (!button.contains(e.target) && !dropdown.contains(e.target)) {
        dropdown.remove();
        button.classList.remove('dropdown-active');
        document.removeEventListener('click', this.handleDocumentClick);
      }
    };
    
    // Close on click outside
    setTimeout(() => {
      document.addEventListener('click', this.handleDocumentClick);
    }, 0);
  }

  /**
   * Create view mode dropdown menu
   */
  createViewDropdown() {
    const dropdown = document.createElement('div');
    dropdown.className = 'overtype-dropdown-menu';
    
    // Determine current mode
    const isPlain = this.editor.container.classList.contains('plain-mode');
    const isPreview = this.editor.container.classList.contains('preview-mode');
    const currentMode = isPreview ? 'preview' : (isPlain ? 'plain' : 'normal');
    
    // Create menu items
    const modes = [
      { id: 'normal', label: 'Normal Edit', icon: '✓' },
      { id: 'plain', label: 'Plain Textarea', icon: '✓' },
      { id: 'preview', label: 'Preview Mode', icon: '✓' }
    ];
    
    modes.forEach(mode => {
      const item = document.createElement('button');
      item.className = 'overtype-dropdown-item';
      item.type = 'button';
      
      const check = document.createElement('span');
      check.className = 'overtype-dropdown-check';
      check.textContent = currentMode === mode.id ? mode.icon : '';
      
      const label = document.createElement('span');
      label.textContent = mode.label;
      
      item.appendChild(check);
      item.appendChild(label);
      
      if (currentMode === mode.id) {
        item.classList.add('active');
      }
      
      item.addEventListener('click', (e) => {
        e.stopPropagation();
        this.setViewMode(mode.id);
        dropdown.remove();
        this.viewModeButton.classList.remove('dropdown-active');
        document.removeEventListener('click', this.handleDocumentClick);
      });
      
      dropdown.appendChild(item);
    });
    
    return dropdown;
  }

  /**
   * Set view mode
   */
  setViewMode(mode) {
    // Clear all mode classes
    this.editor.container.classList.remove('plain-mode', 'preview-mode');
    
    switch(mode) {
      case 'plain':
        this.editor.showPlainTextarea(true);
        break;
      case 'preview':
        this.editor.showPreviewMode(true);
        break;
      case 'normal':
      default:
        // Normal edit mode
        this.editor.showPlainTextarea(false);
        if (typeof this.editor.showPreviewMode === 'function') {
          this.editor.showPreviewMode(false);
        }
        break;
    }
  }

  /**
   * Destroy toolbar
   */
  destroy() {
    if (this.container) {
      // Clean up event listeners
      if (this.handleDocumentClick) {
        document.removeEventListener('click', this.handleDocumentClick);
      }
      this.container.remove();
      this.container = null;
      this.buttons = {};
    }
  }
}