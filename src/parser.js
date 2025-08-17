/**
 * MarkdownParser - Parses markdown into HTML while preserving character alignment
 * 
 * Key principles:
 * - Every character must occupy the exact same position as in the textarea
 * - No font-size changes, no padding/margin on inline elements
 * - Markdown tokens remain visible but styled
 */
export class MarkdownParser {
  /**
   * Escape HTML special characters
   * @param {string} text - Raw text to escape
   * @returns {string} Escaped HTML-safe text
   */
  static escapeHtml(text) {
    const map = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
  }

  /**
   * Preserve leading spaces as non-breaking spaces
   * @param {string} html - HTML string
   * @param {string} originalLine - Original line with spaces
   * @returns {string} HTML with preserved indentation
   */
  static preserveIndentation(html, originalLine) {
    const leadingSpaces = originalLine.match(/^(\s*)/)[1];
    const indentation = leadingSpaces.replace(/ /g, '&nbsp;');
    return html.replace(/^\s*/, indentation);
  }

  /**
   * Parse headers (h1-h3 only)
   * @param {string} html - HTML line to parse
   * @returns {string} Parsed HTML with header styling
   */
  static parseHeader(html) {
    return html.replace(/^(#{1,3})\s(.+)$/, (match, hashes, content) => {
      const level = hashes.length;
      const levelClasses = ['h1', 'h2', 'h3'];
      return `<span class="header ${levelClasses[level-1]}"><span class="syntax-marker">${hashes}</span> ${content}</span>`;
    });
  }

  /**
   * Parse horizontal rules
   * @param {string} html - HTML line to parse
   * @returns {string|null} Parsed horizontal rule or null
   */
  static parseHorizontalRule(html) {
    if (html.match(/^(-{3,}|\*{3,}|_{3,})$/)) {
      return `<div><span class="hr-marker">${html}</span></div>`;
    }
    return null;
  }

  /**
   * Parse blockquotes
   * @param {string} html - HTML line to parse
   * @returns {string} Parsed blockquote
   */
  static parseBlockquote(html) {
    return html.replace(/^&gt; (.+)$/, (match, content) => {
      return `<span class="blockquote"><span class="syntax-marker">&gt;</span> ${content}</span>`;
    });
  }

  /**
   * Parse bullet lists
   * @param {string} html - HTML line to parse
   * @returns {string} Parsed bullet list item
   */
  static parseBulletList(html) {
    return html.replace(/^((?:&nbsp;)*)([-*])\s(.+)$/, (match, indent, marker, content) => {
      return `${indent}<span class="syntax-marker">${marker}</span> ${content}`;
    });
  }

  /**
   * Parse numbered lists
   * @param {string} html - HTML line to parse
   * @returns {string} Parsed numbered list item
   */
  static parseNumberedList(html) {
    return html.replace(/^((?:&nbsp;)*)(\d+\.)\s(.+)$/, (match, indent, marker, content) => {
      return `${indent}<span class="syntax-marker">${marker}</span> ${content}`;
    });
  }

  /**
   * Parse code blocks (markers only)
   * @param {string} html - HTML line to parse
   * @returns {string|null} Parsed code fence or null
   */
  static parseCodeBlock(html) {
    if (html.startsWith('```')) {
      return `<div><span class="code-fence">${html}</span></div>`;
    }
    return null;
  }

  /**
   * Parse bold text
   * @param {string} html - HTML with potential bold markdown
   * @returns {string} HTML with bold styling
   */
  static parseBold(html) {
    html = html.replace(/\*\*(.+?)\*\*/g, '<strong><span class="syntax-marker">**</span>$1<span class="syntax-marker">**</span></strong>');
    html = html.replace(/__(.+?)__/g, '<strong><span class="syntax-marker">__</span>$1<span class="syntax-marker">__</span></strong>');
    return html;
  }

  /**
   * Parse italic text
   * Note: Uses lookbehind assertions - requires modern browsers
   * @param {string} html - HTML with potential italic markdown
   * @returns {string} HTML with italic styling
   */
  static parseItalic(html) {
    html = html.replace(/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/g, '<em><span class="syntax-marker">*</span>$1<span class="syntax-marker">*</span></em>');
    html = html.replace(/(?<!_)_(?!_)(.+?)(?<!_)_(?!_)/g, '<em><span class="syntax-marker">_</span>$1<span class="syntax-marker">_</span></em>');
    return html;
  }

  /**
   * Parse inline code
   * @param {string} html - HTML with potential code markdown
   * @returns {string} HTML with code styling
   */
  static parseInlineCode(html) {
    return html.replace(/`(.+?)`/g, '<code><span class="syntax-marker">`</span>$1<span class="syntax-marker">`</span></code>');
  }

  /**
   * Parse links
   * @param {string} html - HTML with potential link markdown
   * @returns {string} HTML with link styling
   */
  static parseLinks(html) {
    return html.replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2"><span class="syntax-marker">[</span>$1<span class="syntax-marker">](</span><span class="syntax-marker">$2</span><span class="syntax-marker">)</span></a>');
  }

  /**
   * Parse all inline elements in correct order
   * @param {string} text - Text with potential inline markdown
   * @returns {string} HTML with all inline styling
   */
  static parseInlineElements(text) {
    let html = text;
    // Order matters: parse code first to avoid conflicts
    html = this.parseInlineCode(html);
    // Use placeholders to protect inline code while preserving formatting spans
    const codeBlocks = new Map();
    html = html.replace(/(<code>.*?<\/code>)/g, (match) => {
      // Prevent conflicts with private use area Unicode
      const placeholder = `\uE000${codeBlocks.size}\uE001`;
      codeBlocks.set(placeholder, match);
      return placeholder;
    });
    // Process other inline elements on text with placeholders
    html = this.parseLinks(html);
    html = this.parseBold(html);
    html = this.parseItalic(html);
    // Restore code blocks
    codeBlocks.forEach((codeBlock, placeholder) => {
      html = html.replace(placeholder, codeBlock);
    });
    return html;
  }

  /**
   * Parse a single line of markdown
   * @param {string} line - Raw markdown line
   * @returns {string} Parsed HTML line
   */
  static parseLine(line) {
    let html = this.escapeHtml(line);
    
    // Preserve indentation
    html = this.preserveIndentation(html, line);
    
    // Check for block elements first
    const horizontalRule = this.parseHorizontalRule(html);
    if (horizontalRule) return horizontalRule;
    
    const codeBlock = this.parseCodeBlock(html);
    if (codeBlock) return codeBlock;
    
    // Parse block elements
    html = this.parseHeader(html);
    html = this.parseBlockquote(html);
    html = this.parseBulletList(html);
    html = this.parseNumberedList(html);
    
    // Parse inline elements
    html = this.parseInlineElements(html);
    
    // Wrap in div to maintain line structure
    if (html.trim() === '') {
      return '<div>&nbsp;</div>';
    }
    
    return `<div>${html}</div>`;
  }

  /**
   * Parse full markdown text
   * @param {string} text - Full markdown text
   * @param {number} activeLine - Currently active line index (optional)
   * @param {boolean} showActiveLineRaw - Show raw markdown on active line
   * @returns {string} Parsed HTML
   */
  static parse(text, activeLine = -1, showActiveLineRaw = false) {
    const lines = text.split('\n');
    const parsedLines = lines.map((line, index) => {
      // Show raw markdown on active line if requested
      if (showActiveLineRaw && index === activeLine) {
        const content = this.escapeHtml(line) || '&nbsp;';
        return `<div class="raw-line">${content}</div>`;
      }
      
      // Otherwise, parse the markdown normally
      return this.parseLine(line);
    });
    
    // Join without newlines to prevent extra spacing
    return parsedLines.join('');
  }
}