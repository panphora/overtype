/**
 * OverType - A lightweight markdown editor library with perfect WYSIWYG alignment
 * @version 1.0.0
 * @license MIT
 */

import { MarkdownParser } from './parser.js';
import { ShortcutsManager } from './shortcuts.js';
import { generateStyles } from './styles.js';
import { getTheme, mergeTheme, solar, themeToCSSVars } from './themes.js';
import { Toolbar } from './toolbar.js';
import { LinkTooltip } from './link-tooltip.js';
import { defaultToolbarButtons } from './toolbar-buttons.js';

/**
 * OverType Editor Class
 */
class OverType {
    // Static properties
    static instances = new WeakMap();
    static stylesInjected = false;
    static globalListenersInitialized = false;
    static instanceCount = 0;

    /**
     * Constructor - Always returns an array of instances
     * @param {string|Element|NodeList|Array} target - Target element(s)
     * @param {Object} options - Configuration options
     * @returns {Array} Array of OverType instances
     */
    constructor(target, options = {}) {
      // Convert target to array of elements
      let elements;
      
      if (typeof target === 'string') {
        elements = document.querySelectorAll(target);
        if (elements.length === 0) {
          throw new Error(`No elements found for selector: ${target}`);
        }
        elements = Array.from(elements);
      } else if (target instanceof Element) {
        elements = [target];
      } else if (target instanceof NodeList) {
        elements = Array.from(target);
      } else if (Array.isArray(target)) {
        elements = target;
      } else {
        throw new Error('Invalid target: must be selector string, Element, NodeList, or Array');
      }

      // Initialize all elements and return array
      const instances = elements.map(element => {
        // Check for existing instance
        if (element.overTypeInstance) {
          // Re-init existing instance
          element.overTypeInstance.reinit(options);
          return element.overTypeInstance;
        }

        // Create new instance
        const instance = Object.create(OverType.prototype);
        instance._init(element, options);
        element.overTypeInstance = instance;
        OverType.instances.set(element, instance);
        return instance;
      });

      return instances;
    }

    /**
     * Internal initialization
     * @private
     */
    _init(element, options = {}) {
      this.element = element;
      
      // Store the original theme option before merging
      this.instanceTheme = options.theme || null;
      
      this.options = this._mergeOptions(options);
      this.instanceId = ++OverType.instanceCount;
      this.initialized = false;

      // Inject styles if needed
      OverType.injectStyles();

      // Initialize global listeners
      OverType.initGlobalListeners();

      // Check for existing OverType DOM structure
      const container = element.querySelector('.overtype-container');
      const wrapper = element.querySelector('.overtype-wrapper');
      if (container || wrapper) {
        this._recoverFromDOM(container, wrapper);
      } else {
        this._buildFromScratch();
      }

      // Setup shortcuts manager
      this.shortcuts = new ShortcutsManager(this);

      // Setup link tooltip
      this.linkTooltip = new LinkTooltip(this);

      // Sync scroll positions on initial render
      // This ensures textarea matches preview scroll if page is reloaded while scrolled
      // Double requestAnimationFrame waits for browser to restore scroll position
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          this.textarea.scrollTop = this.preview.scrollTop;
          this.textarea.scrollLeft = this.preview.scrollLeft;
        });
      });

      // Mark as initialized
      this.initialized = true;

      // Call onChange if provided
      if (this.options.onChange) {
        this.options.onChange(this.getValue(), this);
      }
    }

    /**
     * Merge user options with defaults
     * @private
     */
    _mergeOptions(options) {
      const defaults = {
        // Typography
        fontSize: '14px',
        lineHeight: 1.6,
        /* System-first, guaranteed monospaced; avoids Android 'ui-monospace' pitfalls */
        fontFamily: '"SF Mono", SFMono-Regular, Menlo, Monaco, "Cascadia Code", Consolas, "Roboto Mono", "Noto Sans Mono", "Droid Sans Mono", "Ubuntu Mono", "DejaVu Sans Mono", "Liberation Mono", "Courier New", Courier, monospace',
        padding: '16px',
        
        // Mobile styles
        mobile: {
          fontSize: '16px',  // Prevent zoom on iOS
          padding: '12px',
          lineHeight: 1.5
        },
        
        // Native textarea properties
        textareaProps: {},
        
        // Behavior
        autofocus: false,
        autoResize: false,  // Auto-expand height with content
        minHeight: '100px', // Minimum height for autoResize mode
        maxHeight: null,    // Maximum height for autoResize mode (null = unlimited)
        placeholder: 'Start typing...',
        value: '',
        
        // Callbacks
        onChange: null,
        onKeydown: null,
        
        // Features
        showActiveLineRaw: false,
        showStats: false,
        toolbar: false,
        toolbarButtons: null,  // Defaults to defaultToolbarButtons if toolbar: true
        statsFormatter: null,
        smartLists: true,  // Enable smart list continuation
        codeHighlighter: null  // Per-instance code highlighter
      };
      
      // Remove theme and colors from options - these are now global
      const { theme, colors, ...cleanOptions } = options;
      
      return {
        ...defaults,
        ...cleanOptions
      };
    }

    /**
     * Recover from existing DOM structure
     * @private
     */
    _recoverFromDOM(container, wrapper) {
      // Handle old structure (wrapper only) or new structure (container + wrapper)
      if (container && container.classList.contains('overtype-container')) {
        this.container = container;
        this.wrapper = container.querySelector('.overtype-wrapper');
      } else if (wrapper) {
        // Old structure - just wrapper, no container
        this.wrapper = wrapper;
        // Wrap it in a container for consistency
        this.container = document.createElement('div');
        this.container.className = 'overtype-container';
        // Use instance theme if provided, otherwise use global theme
        const themeToUse = this.instanceTheme || OverType.currentTheme || solar;
        const themeName = typeof themeToUse === 'string' ? themeToUse : themeToUse.name;
        if (themeName) {
          this.container.setAttribute('data-theme', themeName);
        }
        
        // If using instance theme, apply CSS variables to container
        if (this.instanceTheme) {
          const themeObj = typeof this.instanceTheme === 'string' ? getTheme(this.instanceTheme) : this.instanceTheme;
          if (themeObj && themeObj.colors) {
            const cssVars = themeToCSSVars(themeObj.colors);
            this.container.style.cssText += cssVars;
          }
        }
        wrapper.parentNode.insertBefore(this.container, wrapper);
        this.container.appendChild(wrapper);
      }
      
      if (!this.wrapper) {
        // No valid structure found
        if (container) container.remove();
        if (wrapper) wrapper.remove();
        this._buildFromScratch();
        return;
      }
      
      this.textarea = this.wrapper.querySelector('.overtype-input');
      this.preview = this.wrapper.querySelector('.overtype-preview');

      if (!this.textarea || !this.preview) {
        // Partial DOM - clear and rebuild
        this.container.remove();
        this._buildFromScratch();
        return;
      }

      // Store reference on wrapper
      this.wrapper._instance = this;
      
      // Apply instance-specific styles via CSS custom properties
      if (this.options.fontSize) {
        this.wrapper.style.setProperty('--instance-font-size', this.options.fontSize);
      }
      if (this.options.lineHeight) {
        this.wrapper.style.setProperty('--instance-line-height', String(this.options.lineHeight));
      }
      if (this.options.padding) {
        this.wrapper.style.setProperty('--instance-padding', this.options.padding);
      }

      // Disable autofill, spellcheck, and extensions
      this._configureTextarea();

      // Apply any new options
      this._applyOptions();
    }

    /**
     * Build editor from scratch
     * @private
     */
    _buildFromScratch() {
      // Extract any existing content
      const content = this._extractContent();

      // Clear element
      this.element.innerHTML = '';

      // Create DOM structure
      this._createDOM();

      // Set initial content
      if (content || this.options.value) {
        this.setValue(content || this.options.value);
      }

      // Apply options
      this._applyOptions();
    }

    /**
     * Extract content from element
     * @private
     */
    _extractContent() {
      // Look for existing OverType textarea
      const textarea = this.element.querySelector('.overtype-input');
      if (textarea) return textarea.value;

      // Use element's text content as fallback
      return this.element.textContent || '';
    }

    /**
     * Create DOM structure
     * @private
     */
    _createDOM() {
      // Create container that will hold toolbar and editor
      this.container = document.createElement('div');
      this.container.className = 'overtype-container';
      
      // Set theme on container - use instance theme if provided
      const themeToUse = this.instanceTheme || OverType.currentTheme || solar;
      const themeName = typeof themeToUse === 'string' ? themeToUse : themeToUse.name;
      if (themeName) {
        this.container.setAttribute('data-theme', themeName);
      }
      
      // If using instance theme, apply CSS variables to container
      if (this.instanceTheme) {
        const themeObj = typeof this.instanceTheme === 'string' ? getTheme(this.instanceTheme) : this.instanceTheme;
        if (themeObj && themeObj.colors) {
          const cssVars = themeToCSSVars(themeObj.colors);
          this.container.style.cssText += cssVars;
        }
      }
      
      // Create wrapper for editor
      this.wrapper = document.createElement('div');
      this.wrapper.className = 'overtype-wrapper';
      
      
      // Apply instance-specific styles via CSS custom properties
      if (this.options.fontSize) {
        this.wrapper.style.setProperty('--instance-font-size', this.options.fontSize);
      }
      if (this.options.lineHeight) {
        this.wrapper.style.setProperty('--instance-line-height', String(this.options.lineHeight));
      }
      if (this.options.padding) {
        this.wrapper.style.setProperty('--instance-padding', this.options.padding);
      }
      
      this.wrapper._instance = this;

      // Create textarea
      this.textarea = document.createElement('textarea');
      this.textarea.className = 'overtype-input';
      this.textarea.placeholder = this.options.placeholder;
      this._configureTextarea();
      
      // Apply any native textarea properties
      if (this.options.textareaProps) {
        Object.entries(this.options.textareaProps).forEach(([key, value]) => {
          if (key === 'className' || key === 'class') {
            this.textarea.className += ' ' + value;
          } else if (key === 'style' && typeof value === 'object') {
            Object.assign(this.textarea.style, value);
          } else {
            this.textarea.setAttribute(key, value);
          }
        });
      }

      // Create preview div
      this.preview = document.createElement('div');
      this.preview.className = 'overtype-preview';
      this.preview.setAttribute('aria-hidden', 'true');

      // Assemble DOM
      this.wrapper.appendChild(this.textarea);
      this.wrapper.appendChild(this.preview);
      
      // No need to prevent link clicks - pointer-events handles this
      
      // Add wrapper to container first
      this.container.appendChild(this.wrapper);
      
      // Add stats bar at the end (bottom) if enabled
      if (this.options.showStats) {
        this.statsBar = document.createElement('div');
        this.statsBar.className = 'overtype-stats';
        this.container.appendChild(this.statsBar);
        this._updateStats();
      }
      
      // Add container to element
      this.element.appendChild(this.container);
      
      // Setup auto-resize if enabled
      if (this.options.autoResize) {
        this._setupAutoResize();
      } else {
        // Ensure auto-resize class is removed if not using auto-resize
        this.container.classList.remove('overtype-auto-resize');
      }
    }

    /**
     * Configure textarea attributes
     * @private
     */
    _configureTextarea() {
      this.textarea.setAttribute('autocomplete', 'off');
      this.textarea.setAttribute('autocorrect', 'off');
      this.textarea.setAttribute('autocapitalize', 'off');
      this.textarea.setAttribute('spellcheck', 'false');
      this.textarea.setAttribute('data-gramm', 'false');
      this.textarea.setAttribute('data-gramm_editor', 'false');
      this.textarea.setAttribute('data-enable-grammarly', 'false');
    }

    /**
     * Create and setup toolbar
     * @private
     */
    _createToolbar() {
      // Use provided toolbarButtons or default to defaultToolbarButtons
      const toolbarButtons = this.options.toolbarButtons || defaultToolbarButtons;

      this.toolbar = new Toolbar(this, { toolbarButtons });
      this.toolbar.create();

      // Store listener references for cleanup
      this._toolbarSelectionListener = () => {
        if (this.toolbar) {
          this.toolbar.updateButtonStates();
        }
      };
      this._toolbarInputListener = () => {
        if (this.toolbar) {
          this.toolbar.updateButtonStates();
        }
      };

      // Add listeners
      this.textarea.addEventListener('selectionchange', this._toolbarSelectionListener);
      this.textarea.addEventListener('input', this._toolbarInputListener);
    }

    /**
     * Cleanup toolbar event listeners
     * @private
     */
    _cleanupToolbarListeners() {
      if (this._toolbarSelectionListener) {
        this.textarea.removeEventListener('selectionchange', this._toolbarSelectionListener);
        this._toolbarSelectionListener = null;
      }
      if (this._toolbarInputListener) {
        this.textarea.removeEventListener('input', this._toolbarInputListener);
        this._toolbarInputListener = null;
      }
    }

    /**
     * Apply options to the editor
     * @private
     */
    _applyOptions() {
      // Apply autofocus
      if (this.options.autofocus) {
        this.textarea.focus();
      }

      // Setup or remove auto-resize
      if (this.options.autoResize) {
        if (!this.container.classList.contains('overtype-auto-resize')) {
          this._setupAutoResize();
        }
      } else {
        // Ensure auto-resize class is removed
        this.container.classList.remove('overtype-auto-resize');
      }

      // Handle toolbar option changes
      if (this.options.toolbar && !this.toolbar) {
        // Create toolbar if enabled and doesn't exist
        this._createToolbar();
      } else if (!this.options.toolbar && this.toolbar) {
        // Destroy toolbar if disabled and exists
        this._cleanupToolbarListeners();
        this.toolbar.destroy();
        this.toolbar = null;
      }

      // Update preview with initial content
      this.updatePreview();
    }

    /**
     * Update preview with parsed markdown
     */
    updatePreview() {
      const text = this.textarea.value;
      const cursorPos = this.textarea.selectionStart;
      const activeLine = this._getCurrentLine(text, cursorPos);

      // Detect if we're in preview mode
      const isPreviewMode = this.container.dataset.mode === 'preview';

      // Parse markdown
      const html = MarkdownParser.parse(text, activeLine, this.options.showActiveLineRaw, this.options.codeHighlighter, isPreviewMode);
      this.preview.innerHTML = html || '<span style="color: #808080;">Start typing...</span>';
      
      // Apply code block backgrounds
      this._applyCodeBlockBackgrounds();
      
      // Links always have real hrefs now - no need to update them
      
      // Update stats if enabled
      if (this.options.showStats && this.statsBar) {
        this._updateStats();
      }
      
      // Trigger onChange callback
      if (this.options.onChange && this.initialized) {
        this.options.onChange(text, this);
      }
    }

    /**
     * Apply background styling to code blocks
     * @private
     */
    _applyCodeBlockBackgrounds() {
      // Find all code fence elements
      const codeFences = this.preview.querySelectorAll('.code-fence');
      
      // Process pairs of code fences
      for (let i = 0; i < codeFences.length - 1; i += 2) {
        const openFence = codeFences[i];
        const closeFence = codeFences[i + 1];
        
        // Get parent divs
        const openParent = openFence.parentElement;
        const closeParent = closeFence.parentElement;
        
        if (!openParent || !closeParent) continue;
        
        // Make fences display: block
        openFence.style.display = 'block';
        closeFence.style.display = 'block';
        
        // Apply class to parent divs
        openParent.classList.add('code-block-line');
        closeParent.classList.add('code-block-line');
        
        // With the new structure, there's a <pre> block between fences, not DIVs
        // We don't need to process anything between the fences anymore
        // The <pre><code> structure already handles the content correctly
      }
    }

    /**
     * Get current line number from cursor position
     * @private
     */
    _getCurrentLine(text, cursorPos) {
      const lines = text.substring(0, cursorPos).split('\n');
      return lines.length - 1;
    }

    /**
     * Handle input events
     * @private
     */
    handleInput(event) {
      this.updatePreview();
    }

    /**
     * Handle keydown events
     * @private
     */
    handleKeydown(event) {
      // Handle Tab key to prevent focus loss and insert spaces
      if (event.key === 'Tab') {
        const start = this.textarea.selectionStart;
        const end = this.textarea.selectionEnd;
        const value = this.textarea.value;

        // If Shift+Tab without a selection, allow default behavior (navigate to previous element)
        if (event.shiftKey && start === end) {
          return;
        }

        event.preventDefault();

        // If there's a selection, indent/outdent based on shift key
        if (start !== end && event.shiftKey) {
          // Outdent: remove 2 spaces from start of each selected line
          const before = value.substring(0, start);
          const selection = value.substring(start, end);
          const after = value.substring(end);
          
          const lines = selection.split('\n');
          const outdented = lines.map(line => line.replace(/^  /, '')).join('\n');
          
          // Try to use execCommand first to preserve undo history
          if (document.execCommand) {
            // Select the text that needs to be replaced
            this.textarea.setSelectionRange(start, end);
            document.execCommand('insertText', false, outdented);
          } else {
            // Fallback to direct manipulation
            this.textarea.value = before + outdented + after;
            this.textarea.selectionStart = start;
            this.textarea.selectionEnd = start + outdented.length;
          }
        } else if (start !== end) {
          // Indent: add 2 spaces to start of each selected line
          const before = value.substring(0, start);
          const selection = value.substring(start, end);
          const after = value.substring(end);
          
          const lines = selection.split('\n');
          const indented = lines.map(line => '  ' + line).join('\n');
          
          // Try to use execCommand first to preserve undo history
          if (document.execCommand) {
            // Select the text that needs to be replaced
            this.textarea.setSelectionRange(start, end);
            document.execCommand('insertText', false, indented);
          } else {
            // Fallback to direct manipulation
            this.textarea.value = before + indented + after;
            this.textarea.selectionStart = start;
            this.textarea.selectionEnd = start + indented.length;
          }
        } else {
          // No selection: just insert 2 spaces
          // Use execCommand to preserve undo history
          if (document.execCommand) {
            document.execCommand('insertText', false, '  ');
          } else {
            // Fallback to direct manipulation
            this.textarea.value = value.substring(0, start) + '  ' + value.substring(end);
            this.textarea.selectionStart = this.textarea.selectionEnd = start + 2;
          }
        }
        
        // Trigger input event to update preview
        this.textarea.dispatchEvent(new Event('input', { bubbles: true }));
        return;
      }
      
      // Handle Enter key for smart list continuation
      if (event.key === 'Enter' && !event.shiftKey && !event.metaKey && !event.ctrlKey && this.options.smartLists) {
        if (this.handleSmartListContinuation()) {
          event.preventDefault();
          return;
        }
      }
      
      // Let shortcuts manager handle other keys
      const handled = this.shortcuts.handleKeydown(event);
      
      // Call user callback if provided
      if (!handled && this.options.onKeydown) {
        this.options.onKeydown(event, this);
      }
    }

    /**
     * Handle smart list continuation
     * @returns {boolean} Whether the event was handled
     */
    handleSmartListContinuation() {
      const textarea = this.textarea;
      const cursorPos = textarea.selectionStart;
      const context = MarkdownParser.getListContext(textarea.value, cursorPos);
      
      if (!context || !context.inList) return false;
      
      // Handle empty list item (exit list)
      if (context.content.trim() === '' && cursorPos >= context.markerEndPos) {
        this.deleteListMarker(context);
        return true;
      }
      
      // Handle text splitting if cursor is in middle of content
      if (cursorPos > context.markerEndPos && cursorPos < context.lineEnd) {
        this.splitListItem(context, cursorPos);
      } else {
        // Just add new item after current line
        this.insertNewListItem(context);
      }
      
      // Handle numbered list renumbering
      if (context.listType === 'numbered') {
        this.scheduleNumberedListUpdate();
      }
      
      return true;
    }
    
    /**
     * Delete list marker and exit list
     * @private
     */
    deleteListMarker(context) {
      // Select from line start to marker end
      this.textarea.setSelectionRange(context.lineStart, context.markerEndPos);
      document.execCommand('delete');
      
      // Trigger input event
      this.textarea.dispatchEvent(new Event('input', { bubbles: true }));
    }
    
    /**
     * Insert new list item
     * @private
     */
    insertNewListItem(context) {
      const newItem = MarkdownParser.createNewListItem(context);
      document.execCommand('insertText', false, '\n' + newItem);
      
      // Trigger input event
      this.textarea.dispatchEvent(new Event('input', { bubbles: true }));
    }
    
    /**
     * Split list item at cursor position
     * @private
     */
    splitListItem(context, cursorPos) {
      // Get text after cursor
      const textAfterCursor = context.content.substring(cursorPos - context.markerEndPos);
      
      // Delete text after cursor
      this.textarea.setSelectionRange(cursorPos, context.lineEnd);
      document.execCommand('delete');
      
      // Insert new list item with remaining text
      const newItem = MarkdownParser.createNewListItem(context);
      document.execCommand('insertText', false, '\n' + newItem + textAfterCursor);
      
      // Position cursor after new list marker
      const newCursorPos = this.textarea.selectionStart - textAfterCursor.length;
      this.textarea.setSelectionRange(newCursorPos, newCursorPos);
      
      // Trigger input event
      this.textarea.dispatchEvent(new Event('input', { bubbles: true }));
    }
    
    /**
     * Schedule numbered list renumbering
     * @private
     */
    scheduleNumberedListUpdate() {
      // Clear any pending update
      if (this.numberUpdateTimeout) {
        clearTimeout(this.numberUpdateTimeout);
      }
      
      // Schedule update after current input cycle
      this.numberUpdateTimeout = setTimeout(() => {
        this.updateNumberedLists();
      }, 10);
    }
    
    /**
     * Update/renumber all numbered lists
     * @private
     */
    updateNumberedLists() {
      const value = this.textarea.value;
      const cursorPos = this.textarea.selectionStart;
      
      const newValue = MarkdownParser.renumberLists(value);
      
      if (newValue !== value) {
        // Calculate cursor offset
        let offset = 0;
        const oldLines = value.split('\n');
        const newLines = newValue.split('\n');
        let charCount = 0;
        
        for (let i = 0; i < oldLines.length && charCount < cursorPos; i++) {
          if (oldLines[i] !== newLines[i]) {
            const diff = newLines[i].length - oldLines[i].length;
            if (charCount + oldLines[i].length < cursorPos) {
              offset += diff;
            }
          }
          charCount += oldLines[i].length + 1; // +1 for newline
        }
        
        // Update textarea
        this.textarea.value = newValue;
        const newCursorPos = cursorPos + offset;
        this.textarea.setSelectionRange(newCursorPos, newCursorPos);
        
        // Trigger update
        this.textarea.dispatchEvent(new Event('input', { bubbles: true }));
      }
    }

    /**
     * Handle scroll events
     * @private
     */
    handleScroll(event) {
      // Sync preview scroll with textarea
      this.preview.scrollTop = this.textarea.scrollTop;
      this.preview.scrollLeft = this.textarea.scrollLeft;
    }

    /**
     * Get editor content
     * @returns {string} Current markdown content
     */
    getValue() {
      return this.textarea.value;
    }

    /**
     * Set editor content
     * @param {string} value - Markdown content to set
     */
    setValue(value) {
      this.textarea.value = value;
      this.updatePreview();
      
      // Update height if auto-resize is enabled
      if (this.options.autoResize) {
        this._updateAutoHeight();
      }
    }


    /**
     * Get the rendered HTML of the current content
     * @param {Object} options - Rendering options
     * @param {boolean} options.cleanHTML - If true, removes syntax markers and OverType-specific classes
     * @returns {string} Rendered HTML
     */
    getRenderedHTML(options = {}) {
      const markdown = this.getValue();
      let html = MarkdownParser.parse(markdown, -1, false, this.options.codeHighlighter);

      if (options.cleanHTML) {
        // Remove all syntax marker spans for clean HTML export
        html = html.replace(/<span class="syntax-marker[^"]*">.*?<\/span>/g, '');
        // Remove OverType-specific classes
        html = html.replace(/\sclass="(bullet-list|ordered-list|code-fence|hr-marker|blockquote|url-part)"/g, '');
        // Clean up empty class attributes
        html = html.replace(/\sclass=""/g, '');
      }
      
      return html;
    }

    /**
     * Get the current preview element's HTML
     * This includes all syntax markers and OverType styling
     * @returns {string} Current preview HTML (as displayed)
     */
    getPreviewHTML() {
      return this.preview.innerHTML;
    }
    
    /**
     * Get clean HTML without any OverType-specific markup
     * Useful for exporting to other formats or storage
     * @returns {string} Clean HTML suitable for export
     */
    getCleanHTML() {
      return this.getRenderedHTML({ cleanHTML: true });
    }

    /**
     * Focus the editor
     */
    focus() {
      this.textarea.focus();
    }

    /**
     * Blur the editor
     */
    blur() {
      this.textarea.blur();
    }

    /**
     * Check if editor is initialized
     * @returns {boolean}
     */
    isInitialized() {
      return this.initialized;
    }

    /**
     * Re-initialize with new options
     * @param {Object} options - New options to apply
     */
    reinit(options = {}) {
      this.options = this._mergeOptions({ ...this.options, ...options });
      this._applyOptions();
      this.updatePreview();
    }

    /**
     * Set theme for this instance
     * @param {string|Object} theme - Theme name or custom theme object
     * @returns {this} Returns this for chaining
     */
    setTheme(theme) {
      // Update instance theme
      this.instanceTheme = theme;

      // Get theme object
      const themeObj = typeof theme === 'string' ? getTheme(theme) : theme;
      const themeName = typeof themeObj === 'string' ? themeObj : themeObj.name;

      // Update container theme attribute
      if (themeName) {
        this.container.setAttribute('data-theme', themeName);
      }

      // Apply CSS variables to container for instance override
      if (themeObj && themeObj.colors) {
        const cssVars = themeToCSSVars(themeObj.colors);
        this.container.style.cssText += cssVars;
      }

      // Update preview to reflect new theme
      this.updatePreview();

      return this;
    }

    /**
     * Set instance-specific code highlighter
     * @param {Function|null} highlighter - Function that takes (code, language) and returns highlighted HTML
     */
    setCodeHighlighter(highlighter) {
      this.options.codeHighlighter = highlighter;
      this.updatePreview();
    }

    /**
     * Update stats bar
     * @private
     */
    _updateStats() {
      if (!this.statsBar) return;
      
      const value = this.textarea.value;
      const lines = value.split('\n');
      const chars = value.length;
      const words = value.split(/\s+/).filter(w => w.length > 0).length;
      
      // Calculate line and column
      const selectionStart = this.textarea.selectionStart;
      const beforeCursor = value.substring(0, selectionStart);
      const linesBeforeCursor = beforeCursor.split('\n');
      const currentLine = linesBeforeCursor.length;
      const currentColumn = linesBeforeCursor[linesBeforeCursor.length - 1].length + 1;
      
      // Use custom formatter if provided
      if (this.options.statsFormatter) {
        this.statsBar.innerHTML = this.options.statsFormatter({
          chars,
          words,
          lines: lines.length,
          line: currentLine,
          column: currentColumn
        });
      } else {
        // Default format with live dot
        this.statsBar.innerHTML = `
          <div class="overtype-stat">
            <span class="live-dot"></span>
            <span>${chars} chars, ${words} words, ${lines.length} lines</span>
          </div>
          <div class="overtype-stat">Line ${currentLine}, Col ${currentColumn}</div>
        `;
      }
    }
    
    /**
     * Setup auto-resize functionality
     * @private
     */
    _setupAutoResize() {
      // Add auto-resize class for styling
      this.container.classList.add('overtype-auto-resize');
      
      // Store previous height for comparison
      this.previousHeight = null;
      
      // Initial height update
      this._updateAutoHeight();
      
      // Listen for input events
      this.textarea.addEventListener('input', () => this._updateAutoHeight());
      
      // Listen for window resize
      window.addEventListener('resize', () => this._updateAutoHeight());
    }
    
    /**
     * Update height based on scrollHeight
     * @private
     */
    _updateAutoHeight() {
      if (!this.options.autoResize) return;
      
      const textarea = this.textarea;
      const preview = this.preview;
      const wrapper = this.wrapper;
      
      // Get computed styles
      const computed = window.getComputedStyle(textarea);
      const paddingTop = parseFloat(computed.paddingTop);
      const paddingBottom = parseFloat(computed.paddingBottom);
      
      // Store scroll positions
      const scrollTop = textarea.scrollTop;
      
      // Reset height to get accurate scrollHeight
      textarea.style.setProperty('height', 'auto', 'important');
      
      // Calculate new height based on scrollHeight
      let newHeight = textarea.scrollHeight;
      
      // Apply min height constraint
      if (this.options.minHeight) {
        const minHeight = parseInt(this.options.minHeight);
        newHeight = Math.max(newHeight, minHeight);
      }
      
      // Apply max height constraint
      let overflow = 'hidden';
      if (this.options.maxHeight) {
        const maxHeight = parseInt(this.options.maxHeight);
        if (newHeight > maxHeight) {
          newHeight = maxHeight;
          overflow = 'auto';
        }
      }
      
      // Apply the new height to all elements with !important to override base styles
      const heightPx = newHeight + 'px';
      textarea.style.setProperty('height', heightPx, 'important');
      textarea.style.setProperty('overflow-y', overflow, 'important');
      
      preview.style.setProperty('height', heightPx, 'important');
      preview.style.setProperty('overflow-y', overflow, 'important');
      
      wrapper.style.setProperty('height', heightPx, 'important');
      
      // Restore scroll position
      textarea.scrollTop = scrollTop;
      preview.scrollTop = scrollTop;
      
      // Track if height changed
      if (this.previousHeight !== newHeight) {
        this.previousHeight = newHeight;
        // Could dispatch a custom event here if needed
      }
    }
    
    /**
     * Show or hide stats bar
     * @param {boolean} show - Whether to show stats
     */
    showStats(show) {
      this.options.showStats = show;
      
      if (show && !this.statsBar) {
        // Create stats bar (add to container, not wrapper)
        this.statsBar = document.createElement('div');
        this.statsBar.className = 'overtype-stats';
        this.container.appendChild(this.statsBar);
        this._updateStats();
      } else if (!show && this.statsBar) {
        // Remove stats bar
        this.statsBar.remove();
        this.statsBar = null;
      }
    }
    
    /**
     * Show normal edit mode (overlay with markdown preview)
     * @returns {this} Returns this for chaining
     */
    showNormalEditMode() {
      this.container.dataset.mode = 'normal';
      this.updatePreview(); // Re-render with normal mode (e.g., show syntax markers)

      // Always sync scroll from preview to textarea
      requestAnimationFrame(() => {
        this.textarea.scrollTop = this.preview.scrollTop;
        this.textarea.scrollLeft = this.preview.scrollLeft;
      });

      return this;
    }

    /**
     * Show plain textarea mode (no overlay)
     * @returns {this} Returns this for chaining
     */
    showPlainTextarea() {
      this.container.dataset.mode = 'plain';

      // Update toolbar button if exists
      if (this.toolbar) {
        const toggleBtn = this.container.querySelector('[data-action="toggle-plain"]');
        if (toggleBtn) {
          toggleBtn.classList.remove('active');
          toggleBtn.title = 'Show markdown preview';
        }
      }

      return this;
    }

    /**
     * Show preview mode (read-only view)
     * @returns {this} Returns this for chaining
     */
    showPreviewMode() {
      this.container.dataset.mode = 'preview';
      this.updatePreview(); // Re-render with preview mode (e.g., checkboxes)
      return this;
    }

    /**
     * Destroy the editor instance
     */
    destroy() {
      // Remove instance reference
      this.element.overTypeInstance = null;
      OverType.instances.delete(this.element);

      // Cleanup shortcuts
      if (this.shortcuts) {
        this.shortcuts.destroy();
      }

      // Remove DOM if created by us
      if (this.wrapper) {
        const content = this.getValue();
        this.wrapper.remove();
        
        // Restore original content
        this.element.textContent = content;
      }

      this.initialized = false;
    }

    // ===== Static Methods =====

    /**
     * Initialize multiple editors (static convenience method)
     * @param {string|Element|NodeList|Array} target - Target element(s)
     * @param {Object} options - Configuration options
     * @returns {Array} Array of OverType instances
     */
    static init(target, options = {}) {
      return new OverType(target, options);
    }

    /**
     * Get instance from element
     * @param {Element} element - DOM element
     * @returns {OverType|null} OverType instance or null
     */
    static getInstance(element) {
      return element.overTypeInstance || OverType.instances.get(element) || null;
    }

    /**
     * Destroy all instances
     */
    static destroyAll() {
      const elements = document.querySelectorAll('[data-overtype-instance]');
      elements.forEach(element => {
        const instance = OverType.getInstance(element);
        if (instance) {
          instance.destroy();
        }
      });
    }

    /**
     * Inject styles into the document
     * @param {boolean} force - Force re-injection
     */
    static injectStyles(force = false) {
      if (OverType.stylesInjected && !force) return;

      // Remove any existing OverType styles
      const existing = document.querySelector('style.overtype-styles');
      if (existing) {
        existing.remove();
      }

      // Generate and inject new styles with current theme
      const theme = OverType.currentTheme || solar;
      const styles = generateStyles({ theme });
      const styleEl = document.createElement('style');
      styleEl.className = 'overtype-styles';
      styleEl.textContent = styles;
      document.head.appendChild(styleEl);

      OverType.stylesInjected = true;
    }
    
    /**
     * Set global theme for all OverType instances
     * @param {string|Object} theme - Theme name or custom theme object
     * @param {Object} customColors - Optional color overrides
     */
    static setTheme(theme, customColors = null) {
      // Process theme
      let themeObj = typeof theme === 'string' ? getTheme(theme) : theme;

      // Apply custom colors if provided
      if (customColors) {
        themeObj = mergeTheme(themeObj, customColors);
      }

      // Store as current theme
      OverType.currentTheme = themeObj;

      // Re-inject styles with new theme
      OverType.injectStyles(true);

      // Update all existing instances - update container theme attribute
      document.querySelectorAll('.overtype-container').forEach(container => {
        const themeName = typeof themeObj === 'string' ? themeObj : themeObj.name;
        if (themeName) {
          container.setAttribute('data-theme', themeName);
        }
      });

      // Also handle any old-style wrappers without containers
      document.querySelectorAll('.overtype-wrapper').forEach(wrapper => {
        if (!wrapper.closest('.overtype-container')) {
          const themeName = typeof themeObj === 'string' ? themeObj : themeObj.name;
          if (themeName) {
            wrapper.setAttribute('data-theme', themeName);
          }
        }

        // Trigger preview update for the instance
        const instance = wrapper._instance;
        if (instance) {
          instance.updatePreview();
        }
      });

      // Update web components (shadow DOM instances)
      const themeName = typeof themeObj === 'string' ? themeObj : themeObj.name;
      document.querySelectorAll('overtype-editor').forEach(webComponent => {
        // Set the theme attribute to update the theme name
        if (themeName && typeof webComponent.setAttribute === 'function') {
          webComponent.setAttribute('theme', themeName);
        }
        // Also call refreshTheme() to handle cases where the theme name stays the same
        // but the theme object's properties have changed
        if (typeof webComponent.refreshTheme === 'function') {
          webComponent.refreshTheme();
        }
      });
    }

    /**
     * Set global code highlighter for all OverType instances
     * @param {Function|null} highlighter - Function that takes (code, language) and returns highlighted HTML
     */
    static setCodeHighlighter(highlighter) {
      MarkdownParser.setCodeHighlighter(highlighter);

      // Update all existing instances in light DOM
      document.querySelectorAll('.overtype-wrapper').forEach(wrapper => {
        const instance = wrapper._instance;
        if (instance && instance.updatePreview) {
          instance.updatePreview();
        }
      });

      // Update web components (shadow DOM instances)
      document.querySelectorAll('overtype-editor').forEach(webComponent => {
        if (typeof webComponent.getEditor === 'function') {
          const instance = webComponent.getEditor();
          if (instance && instance.updatePreview) {
            instance.updatePreview();
          }
        }
      });
    }

    /**
     * Initialize global event listeners
     */
    static initGlobalListeners() {
      if (OverType.globalListenersInitialized) return;

      // Input event
      document.addEventListener('input', (e) => {
        if (e.target && e.target.classList && e.target.classList.contains('overtype-input')) {
          const wrapper = e.target.closest('.overtype-wrapper');
          const instance = wrapper?._instance;
          if (instance) instance.handleInput(e);
        }
      });

      // Keydown event
      document.addEventListener('keydown', (e) => {
        if (e.target && e.target.classList && e.target.classList.contains('overtype-input')) {
          const wrapper = e.target.closest('.overtype-wrapper');
          const instance = wrapper?._instance;
          if (instance) instance.handleKeydown(e);
        }
      });

      // Scroll event
      document.addEventListener('scroll', (e) => {
        if (e.target && e.target.classList && e.target.classList.contains('overtype-input')) {
          const wrapper = e.target.closest('.overtype-wrapper');
          const instance = wrapper?._instance;
          if (instance) instance.handleScroll(e);
        }
      }, true);

      // Selection change event
      document.addEventListener('selectionchange', (e) => {
        const activeElement = document.activeElement;
        if (activeElement && activeElement.classList.contains('overtype-input')) {
          const wrapper = activeElement.closest('.overtype-wrapper');
          const instance = wrapper?._instance;
          if (instance) {
            // Update stats bar for cursor position
            if (instance.options.showStats && instance.statsBar) {
              instance._updateStats();
            }
            // Debounce updates
            clearTimeout(instance._selectionTimeout);
            instance._selectionTimeout = setTimeout(() => {
              instance.updatePreview();
            }, 50);
          }
        }
      });

      OverType.globalListenersInitialized = true;
    }
}

// Export classes for advanced usage
OverType.MarkdownParser = MarkdownParser;
OverType.ShortcutsManager = ShortcutsManager;

// Export theme utilities
OverType.themes = { solar, cave: getTheme('cave') };
OverType.getTheme = getTheme;

// Set default theme
OverType.currentTheme = solar;

// Export for module systems
export default OverType;
export { OverType };

// Export toolbar buttons for custom toolbar configurations
export { toolbarButtons, defaultToolbarButtons } from './toolbar-buttons.js';