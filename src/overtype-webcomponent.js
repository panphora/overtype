/**
 * OverType Web Component
 * A custom element wrapper for the OverType markdown editor with Shadow DOM isolation
 * @version 1.0.0
 * @license MIT
 */

import OverType from './overtype.js';
import { generateStyles } from './styles.js';
import { getTheme } from './themes.js';

// Constants for better maintainability
const CONTAINER_CLASS = 'overtype-webcomponent-container';
const DEFAULT_PLACEHOLDER = 'Start typing...';
const OBSERVED_ATTRIBUTES = [
  'value', 'theme', 'toolbar', 'height', 'min-height', 'max-height', 
  'placeholder', 'font-size', 'line-height', 'padding', 'auto-resize', 
  'autofocus', 'show-stats', 'smart-lists', 'readonly', 'spellcheck'
];

/**
 * OverType Editor Web Component
 * Provides a declarative API with complete style isolation via Shadow DOM
 */
class OverTypeEditor extends HTMLElement {
  constructor() {
    super();

    // Create shadow root for style isolation
    this.attachShadow({ mode: 'open' });

    // Initialize instance variables
    this._editor = null;
    this._initialized = false;
    this._pendingOptions = {};
    this._styleVersion = 0;
    this._baseStyleElement = null; // Track the component's base stylesheet
    this._selectionChangeHandler = null; // Track selectionchange listener for cleanup

    // Track initialization state
    this._isConnected = false;

    // Bind methods to maintain context
    this._handleChange = this._handleChange.bind(this);
    this._handleKeydown = this._handleKeydown.bind(this);
  }

  /**
   * Decode common escape sequences from attribute string values
   * @private
   * @param {string|null|undefined} str
   * @returns {string}
   */
  _decodeValue(str) {
    if (typeof str !== 'string') return '';
    // Replace common escape sequences (keep order: \\ first)
    return str.replace(/\\r/g, '\r').replace(/\\n/g, '\n').replace(/\\t/g, '\t');
  }

  // Note: _encodeValue removed as it's currently unused
  // Can be re-added if needed for future attribute encoding

  /**
   * Define observed attributes for reactive updates
   */
  static get observedAttributes() {
    return OBSERVED_ATTRIBUTES;
  }

  /**
   * Component connected to DOM - initialize editor
   */
  connectedCallback() {
    this._isConnected = true;
    this._initializeEditor();
  }

  /**
   * Component disconnected from DOM - cleanup
   */
  disconnectedCallback() {
    this._isConnected = false;
    this._cleanup();
  }

  /**
   * Attribute changed callback - update editor options
   */
  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue === newValue) return;
    // Prevent recursive updates triggered by internal silent attribute sync
    if (this._silentUpdate) return;

    // Store pending changes if not initialized yet
    if (!this._initialized) {
      this._pendingOptions[name] = newValue;
      return;
    }

    // Apply changes to existing editor
    this._updateOption(name, newValue);
  }

  /**
   * Initialize the OverType editor inside shadow DOM
   * @private
   */
  _initializeEditor() {
    if (this._initialized || !this._isConnected) return;

    try {
      // Create container inside shadow root
      const container = document.createElement('div');
      container.className = CONTAINER_CLASS;

      // Set container height from attributes
      const height = this.getAttribute('height');
      const minHeight = this.getAttribute('min-height');
      const maxHeight = this.getAttribute('max-height');

      if (height) container.style.height = height;
      if (minHeight) container.style.minHeight = minHeight;
      if (maxHeight) container.style.maxHeight = maxHeight;

      // Create and inject styles into shadow DOM
      this._injectStyles();

      // Append container to shadow root
      this.shadowRoot.appendChild(container);

      // Prepare OverType options from attributes
      const options = this._getOptionsFromAttributes();

      // Initialize OverType editor
      const editorInstances = new OverType(container, options);
      this._editor = editorInstances[0]; // OverType returns an array

      this._initialized = true;

      // Set up event listeners for Shadow DOM
      // Global document listeners won't work in Shadow DOM, so we need local ones
      if (this._editor && this._editor.textarea) {
        // Scroll sync
        this._editor.textarea.addEventListener('scroll', () => {
          if (this._editor && this._editor.preview && this._editor.textarea) {
            this._editor.preview.scrollTop = this._editor.textarea.scrollTop;
            this._editor.preview.scrollLeft = this._editor.textarea.scrollLeft;
          }
        });

        // Input event for preview updates
        this._editor.textarea.addEventListener('input', (e) => {
          if (this._editor && this._editor.handleInput) {
            this._editor.handleInput(e);
          }
        });

        // Keydown event for keyboard shortcuts and special key handling
        this._editor.textarea.addEventListener('keydown', (e) => {
          if (this._editor && this._editor.handleKeydown) {
            this._editor.handleKeydown(e);
          }
        });

        // Selection change event for link tooltip and stats updates
        // selectionchange only fires on document, so we need to check if the active element is inside our shadow root
        this._selectionChangeHandler = () => {
          // Check if this web component is the active element (focused)
          if (document.activeElement === this) {
            // The selection is inside our shadow root
            const shadowActiveElement = this.shadowRoot.activeElement;
            if (shadowActiveElement && shadowActiveElement === this._editor.textarea) {
              // Update stats if enabled
              if (this._editor.options.showStats && this._editor.statsBar) {
                this._editor._updateStats();
              }

              // Trigger link tooltip check
              if (this._editor.linkTooltip && this._editor.linkTooltip.checkCursorPosition) {
                this._editor.linkTooltip.checkCursorPosition();
              }
            }
          }
        };
        document.addEventListener('selectionchange', this._selectionChangeHandler);
      }

      // Apply any pending option changes
      this._applyPendingOptions();

      // Dispatch ready event
      this._dispatchEvent('ready', { editor: this._editor });
    } catch (error) {
      const message = error && error.message ? error.message : String(error);
      // Avoid passing the raw Error object to console in jsdom to prevent recursive inspect issues
      console.warn('OverType Web Component initialization failed:', message);
      this._dispatchEvent('error', { error: { message } });
    }
  }

  /**
   * Inject styles into shadow DOM for complete isolation
   * @private
   */
  _injectStyles() {
    const style = document.createElement('style');

    // Get theme for style generation
    const themeAttr = this.getAttribute('theme') || 'solar';
    const theme = getTheme(themeAttr);

    // Generate styles with current options
    const options = this._getOptionsFromAttributes();
    const styles = generateStyles({ ...options, theme });

    // Add web component specific styles
    const webComponentStyles = `
      /* Web Component Host Styles */
      :host {
        display: block;
        position: relative;
        width: 100%;
        height: 100%;
        contain: layout style;
      }
      
      .overtype-webcomponent-container {
        width: 100%;
        height: 100%;
        position: relative;
      }
      
      /* Override container grid layout for web component */
      .overtype-container {
        height: 100% !important;
      }
    `;

    this._styleVersion += 1;
    const versionBanner = `\n/* overtype-webcomponent styles v${this._styleVersion} */\n`;
    style.textContent = versionBanner + styles + webComponentStyles;

    // Store reference to this base stylesheet so we can remove it specifically later
    this._baseStyleElement = style;
    this.shadowRoot.appendChild(style);
  }

  /**
   * Extract options from HTML attributes
   * @private
   * @returns {Object} OverType options object
   */
  _getOptionsFromAttributes() {
    const options = {
      // Allow authoring multi-line content via escaped sequences in attributes
      // and fall back to light DOM text content if attribute is absent
      value: this.getAttribute('value') !== null ? this._decodeValue(this.getAttribute('value')) : (this.textContent || '').trim(),
      placeholder: this.getAttribute('placeholder') || DEFAULT_PLACEHOLDER,
      toolbar: this.hasAttribute('toolbar'),
      autofocus: this.hasAttribute('autofocus'),
      autoResize: this.hasAttribute('auto-resize'),
      showStats: this.hasAttribute('show-stats'),
      smartLists: !this.hasAttribute('smart-lists') || this.getAttribute('smart-lists') !== 'false',
      spellcheck: this.hasAttribute('spellcheck') && this.getAttribute('spellcheck') !== 'false',
      onChange: this._handleChange,
      onKeydown: this._handleKeydown
    };

    // Font and layout options
    const fontSize = this.getAttribute('font-size');
    if (fontSize) options.fontSize = fontSize;

    const lineHeight = this.getAttribute('line-height');
    if (lineHeight) options.lineHeight = parseFloat(lineHeight) || 1.6;

    const padding = this.getAttribute('padding');
    if (padding) options.padding = padding;

    const minHeight = this.getAttribute('min-height');
    if (minHeight) options.minHeight = minHeight;

    const maxHeight = this.getAttribute('max-height');
    if (maxHeight) options.maxHeight = maxHeight;

    return options;
  }

  /**
   * Apply pending option changes after initialization
   * @private
   */
  _applyPendingOptions() {
    for (const [attr, value] of Object.entries(this._pendingOptions)) {
      this._updateOption(attr, value);
    }
    this._pendingOptions = {};
  }

  /**
   * Update a single editor option
   * @private
   * @param {string} attribute - Attribute name
   * @param {string} value - New value
   */
  _updateOption(attribute, value) {
    if (!this._editor) return;

    switch (attribute) {
      case 'value':
        {
          const decoded = this._decodeValue(value);
          if (this._editor.getValue() !== decoded) {
            this._editor.setValue(decoded || '');
          }
        }
        break;

      case 'theme':
        // Theme changes require re-injecting styles and updating the editor instance
        this._reinjectStyles();
        // Update the OverType instance's theme so it sets data-theme attribute
        if (this._editor && this._editor.setTheme) {
          this._editor.setTheme(value || 'solar');
        }
        break;

      case 'placeholder':
        if (this._editor) {
          this._editor.options.placeholder = value || '';
          if (this._editor.textarea) {
            this._editor.textarea.placeholder = value || '';
          }
          if (this._editor.placeholderEl) {
            this._editor.placeholderEl.textContent = value || '';
          }
        }
        break;

      case 'readonly':
        if (this._editor.textarea) {
          this._editor.textarea.readOnly = this.hasAttribute('readonly');
        }
        break;

      case 'height':
      case 'min-height':
      case 'max-height':
        this._updateContainerHeight();
        break;

      // For other options that require reinitialization
      case 'toolbar':
        // Only reinitialize if value actually changes
        if (!!this.hasAttribute('toolbar') === !!this._editor.options.toolbar) return;
        this._reinitializeEditor();
        break;
      case 'auto-resize':
        if (!!this.hasAttribute('auto-resize') === !!this._editor.options.autoResize) return;
        this._reinitializeEditor();
        break;
      case 'show-stats':
        if (!!this.hasAttribute('show-stats') === !!this._editor.options.showStats) return;
        this._reinitializeEditor();
        break;

      // Typography/layout style changes
      case 'font-size': {
        if (this._updateFontSize(value)) {
          // Only reinject styles once if direct update succeeded
          this._reinjectStyles();
        }
        break;
      }
      case 'line-height': {
        if (this._updateLineHeight(value)) {
          // Only reinject styles once if direct update succeeded  
          this._reinjectStyles();
        }
        break;
      }
      case 'padding':
        this._reinjectStyles();
        break;

      // Smart-lists affects editing behavior → requires reinitialization
      case 'smart-lists': {
        const newSmartLists = !this.hasAttribute('smart-lists') || this.getAttribute('smart-lists') !== 'false';
        if (!!this._editor.options.smartLists === !!newSmartLists) return;
        this._reinitializeEditor();
        break;
      }

      case 'spellcheck':
        if (this._editor) {
          const enabled = this.hasAttribute('spellcheck') && this.getAttribute('spellcheck') !== 'false';
          this._editor.options.spellcheck = enabled;
          if (this._editor.textarea) {
            this._editor.textarea.setAttribute('spellcheck', String(enabled));
          }
        }
        break;
    }
  }

  /**
   * Update container height from attributes
   * @private
   */
  _updateContainerHeight() {
    const container = this.shadowRoot.querySelector(`.${CONTAINER_CLASS}`);
    if (!container) return;

    const height = this.getAttribute('height');
    const minHeight = this.getAttribute('min-height');
    const maxHeight = this.getAttribute('max-height');

    container.style.height = height || '';
    container.style.minHeight = minHeight || '';
    container.style.maxHeight = maxHeight || '';
  }

  /**
   * Update font size efficiently
   * @private
   * @param {string} value - New font size value
   * @returns {boolean} True if direct update succeeded
   */
  _updateFontSize(value) {
    if (this._editor && this._editor.wrapper) {
      this._editor.options.fontSize = value || '';
      this._editor.wrapper.style.setProperty('--instance-font-size', this._editor.options.fontSize);
      this._editor.updatePreview();
      return true;
    }
    return false;
  }

  /**
   * Update line height efficiently
   * @private
   * @param {string} value - New line height value
   * @returns {boolean} True if direct update succeeded
   */
  _updateLineHeight(value) {
    if (this._editor && this._editor.wrapper) {
      const numeric = parseFloat(value);
      const lineHeight = Number.isFinite(numeric) ? numeric : this._editor.options.lineHeight;
      this._editor.options.lineHeight = lineHeight;
      this._editor.wrapper.style.setProperty('--instance-line-height', String(lineHeight));
      this._editor.updatePreview();
      return true;
    }
    return false;
  }

  /**
   * Re-inject styles (useful for theme changes)
   * @private
   */
  _reinjectStyles() {
    // Remove only the base stylesheet, not other style elements (e.g., tooltip styles)
    if (this._baseStyleElement && this._baseStyleElement.parentNode) {
      this._baseStyleElement.remove();
    }
    this._injectStyles();
  }

  /**
   * Reinitialize the entire editor (for major option changes)
   * @private
   */
  _reinitializeEditor() {
    const currentValue = this._editor ? this._editor.getValue() : '';
    this._cleanup();
    this._initialized = false;

    // Clear shadow root
    this.shadowRoot.innerHTML = '';

    // Preserve current value
    if (currentValue && !this.getAttribute('value')) {
      this.setAttribute('value', currentValue);
    }

    // Reinitialize
    this._initializeEditor();
  }

  /**
   * Handle content changes from OverType
   * @private
   * @param {string} value - New editor value
   */
  _handleChange(value) {
    // Update value attribute without triggering attribute change
    this._updateValueAttribute(value);

    // Avoid dispatching change before initialization completes
    if (!this._initialized || !this._editor) {
      return;
    }

    // Dispatch change event
    this._dispatchEvent('change', {
      value,
      editor: this._editor
    });
  }

  /**
   * Handle keydown events from OverType
   * @private
   * @param {KeyboardEvent} event - Keyboard event
   */
  _handleKeydown(event) {
    this._dispatchEvent('keydown', {
      event,
      editor: this._editor
    });
  }

  /**
   * Update value attribute without triggering observer
   * @private
   * @param {string} value - New value
   */
  _updateValueAttribute(value) {
    // Temporarily store the current value to avoid infinite loop
    const currentAttrValue = this.getAttribute('value');
    if (currentAttrValue !== value) {
      // Use a flag to prevent triggering the attribute observer
      this._silentUpdate = true;
      this.setAttribute('value', value);
      this._silentUpdate = false;
    }
  }

  /**
   * Dispatch custom events
   * @private
   * @param {string} eventName - Event name
   * @param {Object} detail - Event detail
   */
  _dispatchEvent(eventName, detail = {}) {
    const event = new CustomEvent(eventName, {
      detail,
      bubbles: true,
      composed: true
    });
    this.dispatchEvent(event);
  }

  /**
   * Cleanup editor and remove listeners
   * @private
   */
  _cleanup() {
    // Remove selectionchange listener
    if (this._selectionChangeHandler) {
      document.removeEventListener('selectionchange', this._selectionChangeHandler);
      this._selectionChangeHandler = null;
    }

    if (this._editor && typeof this._editor.destroy === 'function') {
      this._editor.destroy();
    }
    this._editor = null;
    this._initialized = false;

    // Clear shadow root to prevent stale containers on remount
    // This is critical for React/Vue/etc. that frequently mount/unmount components
    if (this.shadowRoot) {
      this.shadowRoot.innerHTML = '';
    }
  }

  // ===== PUBLIC API METHODS =====

  /**
   * Refresh theme styles (useful when theme object is updated without changing theme name)
   * @public
   */
  refreshTheme() {
    if (this._initialized) {
      this._reinjectStyles();
    }
  }

  /**
   * Get current editor value
   * @returns {string} Current markdown content
   */
  getValue() {
    return this._editor ? this._editor.getValue() : this.getAttribute('value') || '';
  }

  /**
   * Set editor value
   * @param {string} value - New markdown content
   */
  setValue(value) {
    if (this._editor) {
      this._editor.setValue(value);
    } else {
      this.setAttribute('value', value);
    }
  }

  /**
   * Get rendered HTML
   * @returns {string} Rendered HTML
   */
  getHTML() {
    // Bridge to core editor API (getRenderedHTML)
    return this._editor ? this._editor.getRenderedHTML(false) : '';
  }

  /**
   * Insert text at cursor position
   * @param {string} text - Text to insert
   */
  insertText(text) {
    if (!this._editor || typeof text !== 'string') {
      return;
    }
    this._editor.insertText(text);
  }

  /**
   * Focus the editor
   */
  focus() {
    if (this._editor && this._editor.textarea) {
      this._editor.textarea.focus();
    }
  }

  /**
   * Blur the editor
   */
  blur() {
    if (this._editor && this._editor.textarea) {
      this._editor.textarea.blur();
    }
  }

  /**
   * Get editor statistics
   * @returns {Object} Statistics object
   */
  getStats() {
    if (!this._editor || !this._editor.textarea) return null;

    const value = this._editor.textarea.value;
    const lines = value.split('\n');
    const chars = value.length;
    const words = value.split(/\s+/).filter(w => w.length > 0).length;

    // Calculate line and column from cursor position
    const selectionStart = this._editor.textarea.selectionStart;
    const beforeCursor = value.substring(0, selectionStart);
    const linesBefore = beforeCursor.split('\n');
    const currentLine = linesBefore.length;
    const currentColumn = linesBefore[linesBefore.length - 1].length + 1;

    return {
      characters: chars,
      words: words,
      lines: lines.length,
      line: currentLine,
      column: currentColumn
    };
  }

  /**
   * Check if editor is ready
   * @returns {boolean} True if editor is initialized
   */
  isReady() {
    return this._initialized && this._editor !== null;
  }

  /**
   * Get the internal OverType instance
   * @returns {OverType} The OverType editor instance
   */
  getEditor() {
    return this._editor;
  }
}

// Register the custom element
if (!customElements.get('overtype-editor')) {
  customElements.define('overtype-editor', OverTypeEditor);
}

export default OverTypeEditor;
