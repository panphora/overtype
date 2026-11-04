/**
 * Link Tooltip - Shows a clickable tooltip when cursor is within a link
 * Uses Floating UI for positioning across all browsers
 */

import { computePosition, offset, shift, flip } from '@floating-ui/dom';
import { MarkdownParser } from './parser.js';

export class LinkTooltip {
  constructor(editor) {
    this.editor = editor;
    this.tooltip = null;
    this.currentLink = null;
    this.hideTimeout = null;
    this.visibilityChangeHandler = null;
    this.isTooltipHovered = false;
    this.linkCacheText = null;
    this.linkCache = [];
    this.warnedPatterns = new Set();

    this.init();
  }

  init() {
    // Create tooltip element
    this.createTooltip();

    this.textareaListeners = {
      // Listen for cursor position changes
      selectionchange: () => this.checkCursorPosition(),
      keyup: e => {
        if (e.key.includes('Arrow') || e.key === 'Home' || e.key === 'End') {
          this.checkCursorPosition();
        }
      },
      // Hide tooltip when typing
      input: () => this.hide(),
      // Reposition tooltip when scrolling
      scroll: () => {
        if (this.currentLink) {
          this.positionTooltip(this.currentLink);
        }
      },
      // Hide tooltip when textarea loses focus (unless hovering tooltip)
      blur: () => {
        if (!this.isTooltipHovered) {
          this.hide();
        }
      }
    };
    for (const [type, handler] of Object.entries(this.textareaListeners)) {
      this.editor.textarea.addEventListener(type, handler);
    }

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
    this.tooltip = document.createElement('div');
    this.tooltip.className = 'overtype-link-tooltip';
    this.editor._markChrome(this.tooltip);

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
        if (this.currentLink.action) {
          try {
            this.currentLink.action.onClick(this.currentLink.match, this.editor);
          } catch (error) {
            console.error('linkActions onClick threw:', error);
          }
          this.hide();
          return;
        }
        const safeUrl = MarkdownParser.sanitizeUrl(this.currentLink.url);
        if (safeUrl !== '#') {
          window.open(safeUrl, '_blank');
        }
        this.hide();
      }
    });

    // Append tooltip to editor container
    this.editor.container.appendChild(this.tooltip);
  }

  checkCursorPosition() {
    const cursorPos = this.editor.textarea.selectionStart;
    const text = this.editor.textarea.value;

    // Find if cursor is within a markdown link or a custom action pattern
    const linkInfo = this.findLinkAtPosition(text, cursorPos) || this.findActionAtPosition(text, cursorPos);

    if (linkInfo) {
      if (!this.currentLink || this.currentLink.url !== linkInfo.url || this.currentLink.index !== linkInfo.index) {
        this.show(linkInfo);
      }
    } else {
      this.scheduleHide();
    }
  }

  findLinkAtPosition(text, position) {
    if (this.editor.options.showActiveLineRaw) return null;

    const fences = !MarkdownParser.resolveDisabled(this.editor.options.disable).has('code');
    if (this.linkCacheText !== text || this.linkCacheFences !== fences) {
      this.linkCacheText = text;
      this.linkCacheFences = fences;
      this.linkCache = MarkdownParser.findRenderableLinks(text, { fences });
    }
    const links = this.linkCache;

    for (const [linkIndex, link] of links.entries()) {
      const start = link.start;
      const end = link.end;

      if (position >= start && position <= end) {
        return {
          text: link.text.raw,
          url: this.transformUrl(link.destination.value),
          index: linkIndex,
          start,
          end
        };
      }
    }

    return null;
  }

  findActionAtPosition(text, position) {
    const actions = this.editor.options.linkActions;
    if (!Array.isArray(actions) || actions.length === 0) return null;

    const lineStart = text.lastIndexOf('\n', position - 1) + 1;
    let lineEnd = text.indexOf('\n', position);
    if (lineEnd === -1) lineEnd = text.length;
    const line = text.slice(lineStart, lineEnd);

    for (const action of actions) {
      const pattern = action && action.pattern;
      if (!(pattern instanceof RegExp) || !pattern.global) {
        if (pattern && typeof pattern === 'object' && !this.warnedPatterns.has(pattern)) {
          this.warnedPatterns.add(pattern);
          console.warn('linkActions patterns need the global (g) flag and are ignored without it.');
        }
        continue;
      }

      for (const match of line.matchAll(pattern)) {
        const start = lineStart + match.index;
        const end = start + match[0].length;
        if (position < start || position > end) continue;

        const range = this.rangeForOffsets(start, end);
        if (range) {
          const startNode = range.startContainer;
          const parent = startNode.nodeType === 1 ? startNode : startNode.parentElement;
          if (parent && parent.closest && parent.closest('code, pre, .code-block, .code-fence')) {
            continue;
          }
        }

        let labelText;
        try {
          labelText = action.label(match);
        } catch (error) {
          console.error('linkActions label threw:', error);
          continue;
        }
        if (!labelText) continue;

        return {
          url: labelText,
          index: -1 - start,
          start,
          end,
          match,
          action
        };
      }
    }

    return null;
  }

  transformUrl(url) {
    const transform = this.editor.options.transformLinkUrl;
    if (typeof transform !== 'function') return url;
    try {
      const result = transform(url);
      return typeof result === 'string' ? result : url;
    } catch (e) {
      console.warn('transformLinkUrl threw:', e);
      return url;
    }
  }

  async show(linkInfo) {
    this.currentLink = linkInfo;
    this.cancelHide();

    // Update tooltip content
    const urlSpan = this.tooltip.querySelector('.overtype-link-tooltip-url');
    urlSpan.textContent = linkInfo.url;

    // Position first (tooltip is always rendered but invisible, so Floating UI can measure it)
    await this.positionTooltip(linkInfo);

    // Only reveal if we're still showing this link
    if (this.currentLink === linkInfo) {
      this.tooltip.classList.add('visible');
    }
  }

  async positionTooltip(linkInfo) {
    let anchorElement;

    if (linkInfo.action) {
      const range = this.rangeForOffsets(linkInfo.start, linkInfo.end);
      if (!range) {
        return;
      }
      const rangeRect = range.getBoundingClientRect();
      if (rangeRect.width === 0 || rangeRect.height === 0) {
        return;
      }
      anchorElement = { getBoundingClientRect: () => range.getBoundingClientRect() };
    } else {
      anchorElement = this.findAnchorElement(linkInfo.index);

      if (!anchorElement) {
        return;
      }

      const rect = anchorElement.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) {
        return;
      }
    }

    try {
      const { x, y } = await computePosition(
        anchorElement,
        this.tooltip,
        {
          strategy: 'fixed',
          placement: 'bottom',
          middleware: [
            offset(8),
            shift({ padding: 8 }),
            flip()
          ]
        }
      );

      Object.assign(this.tooltip.style, {
        left: `${x}px`,
        top: `${y}px`,
        position: 'fixed'
      });
    } catch (error) {
      console.warn('Floating UI positioning failed:', error);
    }
  }

  findAnchorElement(linkIndex) {
    const preview = this.editor.preview;
    return preview.querySelector(`a[style*="--link-${linkIndex}"]`);
  }

  rangeForOffsets(start, end) {
    const preview = this.editor.preview;
    if (!preview) return null;

    const text = this.editor.textarea.value;
    const before = text.slice(0, start);
    const lineIndex = before.split('\n').length - 1;
    const lineStart = before.lastIndexOf('\n') + 1;
    const startColumn = start - lineStart;
    const endColumn = end - lineStart;
    if (endColumn < startColumn) return null;

    const lineInfo = this.findPreviewLineElement(lineIndex);
    if (!lineInfo) return null;

    const targetStart = lineInfo.offset + startColumn;
    const targetEnd = lineInfo.offset + endColumn;

    const walker = document.createTreeWalker(lineInfo.element, window.NodeFilter.SHOW_TEXT);
    let count = 0;
    let startNode = null;
    let startOffset = 0;
    let endNode = null;
    let endOffset = 0;
    let node;

    while ((node = walker.nextNode())) {
      const length = node.nodeValue.length;
      if (startNode === null && targetStart >= count && targetStart <= count + length) {
        startNode = node;
        startOffset = targetStart - count;
      }
      if (endNode === null && targetEnd >= count && targetEnd <= count + length) {
        endNode = node;
        endOffset = targetEnd - count;
      }
      if (startNode !== null && endNode !== null) break;
      count += length;
    }

    if (startNode === null || endNode === null) return null;

    const range = document.createRange();
    range.setStart(startNode, startOffset);
    range.setEnd(endNode, endOffset);
    if (typeof range.getBoundingClientRect !== 'function') return null;
    return range;
  }

  findPreviewLineElement(lineIndex) {
    const preview = this.editor.preview;
    if (!preview) return null;

    let index = 0;
    for (const child of preview.children) {
      if (child.tagName === 'PRE') {
        const codeLines = (child.textContent || '').split('\n');
        if (lineIndex < index + codeLines.length) {
          let offset = 0;
          for (let i = 0; i < lineIndex - index; i++) {
            offset += codeLines[i].length + 1;
          }
          return { element: child, offset };
        }
        index += codeLines.length;
      } else if (child.tagName === 'UL' || child.tagName === 'OL') {
        const items = child.children;
        if (lineIndex < index + items.length) {
          return { element: items[lineIndex - index], offset: 0 };
        }
        index += items.length;
      } else {
        if (lineIndex === index) return { element: child, offset: 0 };
        index++;
      }
    }

    return null;
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

    if (this.textareaListeners) {
      for (const [type, handler] of Object.entries(this.textareaListeners)) {
        this.editor.textarea.removeEventListener(type, handler);
      }
      this.textareaListeners = null;
    }

    if (this.visibilityChangeHandler) {
      document.removeEventListener('visibilitychange', this.visibilityChangeHandler);
      this.visibilityChangeHandler = null;
    }

    if (this.tooltip && this.tooltip.parentNode) {
      this.tooltip.parentNode.removeChild(this.tooltip);
    }
    this.tooltip = null;
    this.currentLink = null;
    this.isTooltipHovered = false;
  }
}
