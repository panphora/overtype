/**
 * Link Tooltip - CSS Anchor Positioning with Floating UI fallback
 * Shows a clickable tooltip when cursor is within a link
 * Uses CSS anchor positioning for modern browsers, Floating UI for older browsers
 */

export class LinkTooltip {
  constructor(editor) {
    this.editor = editor;
    this.tooltip = null;
    this.currentLink = null;
    this.hideTimeout = null;
    this.visibilityChangeHandler = null;
    this.useFloatingUI = false;
    this.floatingUI = null;
    this.isTooltipHovered = false;

    this.init();
  }

  async init() {
    // Detect CSS anchor positioning support
    const supportsAnchorPositioning = CSS.supports('position-anchor: --x') &&
                                      CSS.supports('position-area: center');

    // Load Floating UI if needed
    if (!supportsAnchorPositioning) {
      try {
        // Use indirect eval to prevent bundler from processing the import
        const importFn = new Function('url', 'return import(url)');
        const { computePosition, offset, shift, flip } = await importFn(
          'https://cdn.jsdelivr.net/npm/@floating-ui/dom@1.7.4/+esm'
        );
        this.floatingUI = { computePosition, offset, shift, flip };
        this.useFloatingUI = true;
      } catch (error) {
        // If dynamic import fails, tooltips simply won't show
        console.warn('Failed to load Floating UI fallback:', error);
        this.floatingUI = null;
        this.useFloatingUI = false;
      }
    }

    // Create tooltip element
    // Note: Styles are now in the main stylesheet (styles.js) with @supports wrapper
    this.createTooltip();

    // Listen for cursor position changes
    this.editor.textarea.addEventListener('selectionchange', () => this.checkCursorPosition());
    this.editor.textarea.addEventListener('keyup', e => {
      if (e.key.includes('Arrow') || e.key === 'Home' || e.key === 'End') {
        this.checkCursorPosition();
      }
    });

    // Hide tooltip when typing
    this.editor.textarea.addEventListener('input', () => this.hide());

    // Reposition or hide tooltip when scrolling
    this.editor.textarea.addEventListener('scroll', () => {
      if (this.useFloatingUI && this.currentLink) {
        // Reposition the tooltip for Floating UI
        this.showWithFloatingUI(this.currentLink);
      } else {
        // Hide for CSS anchor positioning (native browser behavior handles this)
        this.hide();
      }
    });

    // Hide tooltip when textarea loses focus (unless hovering tooltip)
    this.editor.textarea.addEventListener('blur', () => {
      if (!this.isTooltipHovered) {
        this.hide();
      }
    });

    // Hide tooltip when page loses visibility (tab switch, minimize, etc.)
    this.visibilityChangeHandler = () => {
      if (document.hidden) {
        this.hide();
      }
    };
    document.addEventListener('visibilitychange', this.visibilityChangeHandler);

    // Track hover state to prevent hiding when clicking tooltip
    this.tooltip.addEventListener('mouseenter', () => {
      this.isTooltipHovered = true;
      this.cancelHide();
    });
    this.tooltip.addEventListener('mouseleave', () => {
      this.isTooltipHovered = false;
      this.scheduleHide();
    });
  }

  createTooltip() {
    // Create tooltip element
    // Styles are now included in the main stylesheet (styles.js)
    this.tooltip = document.createElement('div');
    this.tooltip.className = 'overtype-link-tooltip';

    // Add link icon and text container
    this.tooltip.innerHTML = `
      <span style="display: flex; align-items: center; gap: 6px;">
        <svg width="12" height="12" viewBox="0 0 20 20" fill="currentColor" style="flex-shrink: 0;">
          <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z"></path>
          <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z"></path>
        </svg>
        <span class="overtype-link-tooltip-url"></span>
      </span>
    `;

    // Click handler to open link
    this.tooltip.addEventListener('click', e => {
      e.preventDefault();
      e.stopPropagation();
      if (this.currentLink) {
        window.open(this.currentLink.url, '_blank');
        this.hide();
      }
    });

    // Append tooltip to editor container
    this.editor.container.appendChild(this.tooltip);
  }

  checkCursorPosition() {
    const cursorPos = this.editor.textarea.selectionStart;
    const text = this.editor.textarea.value;

    // Find if cursor is within a markdown link
    const linkInfo = this.findLinkAtPosition(text, cursorPos);

    if (linkInfo) {
      if (!this.currentLink || this.currentLink.url !== linkInfo.url || this.currentLink.index !== linkInfo.index) {
        this.show(linkInfo);
      }
    } else {
      this.scheduleHide();
    }
  }

  findLinkAtPosition(text, position) {
    // Regex to find markdown links: [text](url)
    const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
    let match;
    let linkIndex = 0;

    while ((match = linkRegex.exec(text)) !== null) {
      const start = match.index;
      const end = match.index + match[0].length;

      if (position >= start && position <= end) {
        return {
          text: match[1],
          url: match[2],
          index: linkIndex,
          start: start,
          end: end
        };
      }
      linkIndex++;
    }

    return null;
  }

  show(linkInfo) {
    this.currentLink = linkInfo;
    this.cancelHide();

    // Update tooltip content
    const urlSpan = this.tooltip.querySelector('.overtype-link-tooltip-url');
    urlSpan.textContent = linkInfo.url;

    if (this.useFloatingUI) {
      this.showWithFloatingUI(linkInfo);
    } else {
      this.showWithAnchorPositioning(linkInfo);
    }

    this.tooltip.classList.add('visible');
  }

  showWithAnchorPositioning(linkInfo) {
    // Set the CSS variable to point to the correct anchor
    this.tooltip.style.setProperty('--target-anchor', `--link-${linkInfo.index}`);
  }

  async showWithFloatingUI(linkInfo) {
    // Find the <a> element in preview that corresponds to this link
    const anchorElement = this.findAnchorElement(linkInfo.index);

    if (!anchorElement) {
      return;
    }

    // Check if anchor element is visible and in viewport
    const rect = anchorElement.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) {
      return;
    }

    try {
      // Compute position using Floating UI
      const { x, y } = await this.floatingUI.computePosition(
        anchorElement,
        this.tooltip,
        {
          placement: 'bottom',
          middleware: [
            this.floatingUI.offset(8),
            this.floatingUI.shift({ padding: 8 }),
            this.floatingUI.flip()
          ]
        }
      );

      // Apply position
      Object.assign(this.tooltip.style, {
        left: `${x}px`,
        top: `${y}px`,
        position: 'absolute'
      });
    } catch (error) {
      // If Floating UI computation fails, don't show tooltip
      console.warn('Floating UI positioning failed:', error);
      return;
    }
  }

  findAnchorElement(linkIndex) {
    // Find the <a> element with the matching anchor-name style
    const preview = this.editor.preview;
    // Direct query for the specific link - more efficient than iterating
    return preview.querySelector(`a[style*="--link-${linkIndex}"]`);
  }

  hide() {
    this.tooltip.classList.remove('visible');
    this.currentLink = null;
    this.isTooltipHovered = false;
  }

  scheduleHide() {
    this.cancelHide();
    this.hideTimeout = setTimeout(() => this.hide(), 300);
  }

  cancelHide() {
    if (this.hideTimeout) {
      clearTimeout(this.hideTimeout);
      this.hideTimeout = null;
    }
  }

  destroy() {
    this.cancelHide();

    // Remove visibility change listener
    if (this.visibilityChangeHandler) {
      document.removeEventListener('visibilitychange', this.visibilityChangeHandler);
      this.visibilityChangeHandler = null;
    }

    if (this.tooltip && this.tooltip.parentNode) {
      this.tooltip.parentNode.removeChild(this.tooltip);
    }
    this.tooltip = null;
    this.currentLink = null;
    this.floatingUI = null;
    this.useFloatingUI = false;
    this.isTooltipHovered = false;
  }
}
