/**
 * Link Tooltip - Gmail/Google Docs style link preview
 * Shows a clickable tooltip when cursor is within a link
 */

import { computePosition, flip, shift, offset } from '@floating-ui/dom';

export class LinkTooltip {
  constructor(editor) {
    this.editor = editor;
    this.tooltip = null;
    this.currentLink = null;
    this.hideTimeout = null;
    this.isMouseInTooltip = false;
    this.isMouseInLink = false;
    
    this.init();
  }
  
  init() {
    // Create tooltip element
    this.createTooltip();
    
    // Listen for cursor position changes
    this.editor.textarea.addEventListener('selectionchange', () => this.checkCursorPosition());
    this.editor.textarea.addEventListener('input', () => this.checkCursorPosition());
    this.editor.textarea.addEventListener('keyup', (e) => {
      // Arrow keys might move cursor
      if (e.key.includes('Arrow')) {
        this.checkCursorPosition();
      }
    });
    
    // Hide tooltip when scrolling
    this.editor.textarea.addEventListener('scroll', () => this.hide());
    
    // Mouse events for tooltip persistence
    this.tooltip.addEventListener('mouseenter', () => {
      this.isMouseInTooltip = true;
      this.cancelHide();
    });
    
    this.tooltip.addEventListener('mouseleave', () => {
      this.isMouseInTooltip = false;
      this.scheduleHide();
    });
  }
  
  createTooltip() {
    this.tooltip = document.createElement('div');
    this.tooltip.className = 'overtype-link-tooltip';
    this.tooltip.style.cssText = `
      position: absolute;
      background: #333;
      color: white;
      padding: 6px 10px;
      border-radius: 16px;
      font-size: 12px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      display: none;
      z-index: 10000;
      cursor: pointer;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      max-width: 300px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      transition: opacity 0.2s;
      opacity: 0;
    `;
    
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
    this.tooltip.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (this.currentLink) {
        window.open(this.currentLink.url, '_blank');
        this.hide();
      }
    });
    
    // Append to document body for proper positioning
    document.body.appendChild(this.tooltip);
  }
  
  checkCursorPosition() {
    const cursorPos = this.editor.textarea.selectionStart;
    const text = this.editor.textarea.value;
    
    // Find if cursor is within a markdown link
    const link = this.findLinkAtPosition(text, cursorPos);
    
    if (link) {
      this.isMouseInLink = true;
      if (!this.currentLink || 
          this.currentLink.start !== link.start || 
          this.currentLink.url !== link.url) {
        // New link or different link
        this.show(link);
      }
    } else {
      // Not in a link
      this.isMouseInLink = false;
      this.scheduleHide();
    }
  }
  
  findLinkAtPosition(text, position) {
    // Regex to find markdown links: [text](url)
    const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
    let match;
    
    while ((match = linkRegex.exec(text)) !== null) {
      const start = match.index;
      const end = match.index + match[0].length;
      
      if (position >= start && position <= end) {
        return {
          start: start,
          end: end,
          text: match[1],
          url: match[2],
          fullMatch: match[0]
        };
      }
    }
    
    return null;
  }
  
  async show(link) {
    this.currentLink = link;
    this.cancelHide();
    
    // Update tooltip content
    const urlSpan = this.tooltip.querySelector('.overtype-link-tooltip-url');
    urlSpan.textContent = link.url;
    
    // Get the position of the link in the preview
    const linkElement = this.findLinkElementInPreview(link);
    
    if (linkElement) {
      // Use the link element as reference
      await this.positionTooltip(linkElement);
    } else {
      // Fallback: position based on cursor
      await this.positionTooltipAtCursor(link);
    }
    
    // Show tooltip with animation
    this.tooltip.style.display = 'block';
    // Force reflow
    this.tooltip.offsetHeight;
    this.tooltip.style.opacity = '1';
  }
  
  findLinkElementInPreview(link) {
    // Find the corresponding link element in the preview
    const links = this.editor.preview.querySelectorAll('a');
    
    for (const linkEl of links) {
      // Check if this link contains our URL
      const urlSpans = linkEl.querySelectorAll('.syntax-marker');
      for (const span of urlSpans) {
        if (span.textContent === link.url) {
          return linkEl;
        }
      }
    }
    
    return null;
  }
  
  async positionTooltip(referenceEl) {
    const { x, y } = await computePosition(referenceEl, this.tooltip, {
      placement: 'bottom',
      middleware: [
        offset(6),
        flip(),
        shift({ padding: 10 })
      ]
    });
    
    Object.assign(this.tooltip.style, {
      left: `${x}px`,
      top: `${y}px`
    });
  }
  
  async positionTooltipAtCursor(link) {
    // Get cursor position in the textarea
    const textarea = this.editor.textarea;
    
    // Create a temporary element to measure text position
    const measurer = document.createElement('div');
    measurer.style.cssText = window.getComputedStyle(textarea).cssText;
    measurer.style.position = 'absolute';
    measurer.style.visibility = 'hidden';
    measurer.style.whiteSpace = 'pre-wrap';
    measurer.style.wordWrap = 'break-word';
    
    // Get text up to cursor
    const textBeforeCursor = textarea.value.substring(0, link.start + link.fullMatch.length / 2);
    measurer.textContent = textBeforeCursor;
    
    document.body.appendChild(measurer);
    const textHeight = measurer.offsetHeight;
    document.body.removeChild(measurer);
    
    // Get textarea position
    const rect = textarea.getBoundingClientRect();
    
    // Estimate position (this is approximate)
    const x = rect.left + rect.width / 2;
    const y = rect.top + Math.min(textHeight, rect.height - 50);
    
    Object.assign(this.tooltip.style, {
      left: `${x}px`,
      top: `${y}px`,
      transform: 'translateX(-50%)'
    });
  }
  
  hide() {
    this.tooltip.style.opacity = '0';
    setTimeout(() => {
      if (this.tooltip.style.opacity === '0') {
        this.tooltip.style.display = 'none';
        this.currentLink = null;
      }
    }, 200);
  }
  
  scheduleHide() {
    this.cancelHide();
    this.hideTimeout = setTimeout(() => {
      if (!this.isMouseInTooltip && !this.isMouseInLink) {
        this.hide();
      }
    }, 300);
  }
  
  cancelHide() {
    if (this.hideTimeout) {
      clearTimeout(this.hideTimeout);
      this.hideTimeout = null;
    }
  }
  
  destroy() {
    this.cancelHide();
    if (this.tooltip && this.tooltip.parentNode) {
      this.tooltip.parentNode.removeChild(this.tooltip);
    }
    this.tooltip = null;
    this.currentLink = null;
  }
}