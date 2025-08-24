/**
 * MarkdownParser - Parses markdown into HTML while preserving character alignment
 *
 * Key principles:
 * - Every character must occupy the exact same position as in the textarea
 * - No font-size changes, no padding/margin on inline elements
 * - Markdown tokens remain visible but styled
 */
export class MarkdownParser {
  // Track link index for anchor naming
  static linkIndex = 0;

  /**
   * Reset link index (call before parsing a new document)
   */
  static resetLinkIndex() {
    this.linkIndex = 0;
  }

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
      return `<h${level}><span class="syntax-marker">${hashes} </span>${content}</h${level}>`;
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
      return `${indent}<li class="bullet-list"><span class="syntax-marker">${marker} </span>${content}</li>`;
    });
  }

  /**
   * Parse numbered lists
   * @param {string} html - HTML line to parse
   * @returns {string} Parsed numbered list item
   */
  static parseNumberedList(html) {
    return html.replace(/^((?:&nbsp;)*)(\d+\.)\s(.+)$/, (match, indent, marker, content) => {
      return `${indent}<li class="ordered-list"><span class="syntax-marker">${marker} </span>${content}</li>`;
    });
  }

  /**
   * Parse code blocks (markers only)
   * @param {string} html - HTML line to parse
   * @returns {string|null} Parsed code fence or null
   */
  static parseCodeBlock(html) {
    // The line must start with three backticks and have no backticks after subsequent text
    const codeFenceRegex = /^`{3}[^`]*$/;
    if (codeFenceRegex.test(html)) {
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
    // Must have equal number of backticks before and after inline code
    //
    // Regex explainer:
    // (?<!`): A negative lookbehind ensuring the opening backticks are not preceded by another backtick.
    // (`+): A capturing group that matches and remembers the opening sequence of one or more backticks. This is Group 1.
    // ((?:(?!\1).)+?): A capturing group that greedily matches any character that is not the exact sequence of backticks captured in Group 1. This is Group 2.
    // (\1): A backreference to Group 1, ensuring the closing sequence has the exact same number of backticks as the opening sequence. This is Group 3.
    // (?!`): A negative lookahead ensuring the closing backticks are not followed by another backtick.
    return html.replace(/(?<!`)(`+)(?!`)((?:(?!\1).)+?)(\1)(?!`)/g, '<code><span class="syntax-marker">$1</span>$2<span class="syntax-marker">$3</span></code>');
  }

  /**
   * Sanitize URL to prevent XSS attacks
   * @param {string} url - URL to sanitize
   * @returns {string} Safe URL or '#' if dangerous
   */
  static sanitizeUrl(url) {
    // Trim whitespace and convert to lowercase for protocol check
    const trimmed = url.trim();
    const lower = trimmed.toLowerCase();

    // Allow safe protocols
    const safeProtocols = ['http://', 'https://', 'mailto:', 'ftp://', 'ftps://'];

    // Check if URL starts with a safe protocol
    const hasSafeProtocol = safeProtocols.some(protocol => lower.startsWith(protocol));

    // Allow relative URLs (starting with / or # or no protocol)
    const isRelative = trimmed.startsWith('/') || trimmed.startsWith('#') || trimmed.startsWith('?') || trimmed.startsWith('.') || (!trimmed.includes(':') && !trimmed.includes('//'));

    // If safe protocol or relative URL, return as-is
    if (hasSafeProtocol || isRelative) {
      return url;
    }

    // Block dangerous protocols (javascript:, data:, vbscript:, etc.)
    return '#';
  }

  /**
   * Parse links
   * @param {string} html - HTML with potential link markdown
   * @returns {string} HTML with link styling
   */
  static parseLinks(html) {
    return html.replace(/\[(.+?)\]\((.+?)\)/g, (match, text, url) => {
      const anchorName = `--link-${this.linkIndex++}`;
      // Sanitize URL to prevent XSS attacks
      const safeUrl = this.sanitizeUrl(url);
      // Use real href - pointer-events handles click prevention in normal mode
      return `<a href="${safeUrl}" style="anchor-name: ${anchorName}"><span class="syntax-marker">[</span>${text}<span class="syntax-marker url-part">](${url})</span></a>`;
    });
  }

  /**
   * Parse all inline elements in correct order
   * @param {string} text - Text with potential inline markdown
   * @returns {string} HTML with all inline styling
   */
  static parseInlineElements(text) {
    let html = text;
    // Order matters: parse code first
    html = this.parseInlineCode(html);

    // Use placeholders to protect inline code while preserving formatting spans
    // We use Unicode Private Use Area (U+E000-U+F8FF) as placeholders because:
    // 1. These characters are reserved for application-specific use
    // 2. They'll never appear in user text
    // 3. They maintain single-character width (important for alignment)
    // 4. They're invisible if accidentally rendered
    const sanctuaries = new Map();

    // Protect code blocks
    html = html.replace(/(<code>.*?<\/code>)/g, match => {
      const placeholder = `\uE000${sanctuaries.size}\uE001`;
      sanctuaries.set(placeholder, match);
      return placeholder;
    });

    // Parse links AFTER protecting code but BEFORE bold/italic
    // This ensures link URLs don't get processed as markdown
    html = this.parseLinks(html);

    // Protect entire link elements (not just the URL part)
    html = html.replace(/(<a[^>]*>.*?<\/a>)/g, match => {
      const placeholder = `\uE000${sanctuaries.size}\uE001`;
      sanctuaries.set(placeholder, match);
      return placeholder;
    });

    // Process other inline elements on text with placeholders
    html = this.parseBold(html);
    html = this.parseItalic(html);

    // Restore all sanctuaries
    sanctuaries.forEach((content, placeholder) => {
      html = html.replace(placeholder, content);
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
      // Intentionally use &nbsp; for empty lines to maintain vertical spacing
      // This causes a 0->1 character count difference but preserves visual alignment
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
    // Reset link counter for each parse
    this.resetLinkIndex();

    const lines = text.split('\n');
    let inCodeBlock = false;

    const parsedLines = lines.map((line, index) => {
      // Show raw markdown on active line if requested
      if (showActiveLineRaw && index === activeLine) {
        const content = this.escapeHtml(line) || '&nbsp;';
        return `<div class="raw-line">${content}</div>`;
      }

      // Check if this line is a code fence
      const codeFenceRegex = /^```[^`]*$/;
      if (codeFenceRegex.test(line)) {
        inCodeBlock = !inCodeBlock;
        // Parse fence markers normally to get styled output
        return this.parseLine(line);
      }

      // If we're inside a code block, don't parse as markdown
      if (inCodeBlock) {
        const escaped = this.escapeHtml(line);
        const indented = this.preserveIndentation(escaped, line);
        return `<div>${indented || '&nbsp;'}</div>`;
      }

      // Otherwise, parse the markdown normally
      return this.parseLine(line);
    });

    // Join without newlines to prevent extra spacing
    const html = parsedLines.join('');

    // Apply post-processing for list consolidation
    return this.postProcessHTML(html);
  }

  /**
   * Post-process HTML to consolidate lists and code blocks
   * @param {string} html - HTML to post-process
   * @returns {string} Post-processed HTML with consolidated lists and code blocks
   */
  static postProcessHTML(html) {
    // Check if we're in a browser environment
    if (typeof document === 'undefined' || !document) {
      // In Node.js environment - do manual post-processing
      return this.postProcessHTMLManual(html);
    }

    // Parse HTML string into DOM
    const container = document.createElement('div');
    container.innerHTML = html;

    let currentList = null;
    let listType = null;
    let currentCodeBlock = null;
    let inCodeBlock = false;

    // Process all direct children - need to be careful with live NodeList
    const children = Array.from(container.children);

    for (let i = 0; i < children.length; i++) {
      const child = children[i];

      // Skip if child was already processed/removed
      if (!child.parentNode) continue;

      // Check for code fence start/end
      const codeFence = child.querySelector('.code-fence');
      if (codeFence) {
        const fenceText = codeFence.textContent;
        if (fenceText.startsWith('```')) {
          if (!inCodeBlock) {
            // Start of code block - keep fence visible, then add pre/code
            inCodeBlock = true;

            // Create the code block that will follow the fence
            currentCodeBlock = document.createElement('pre');
            const codeElement = document.createElement('code');
            currentCodeBlock.appendChild(codeElement);
            currentCodeBlock.className = 'code-block';

            // Extract language if present
            const lang = fenceText.slice(3).trim();
            if (lang) {
              codeElement.className = `language-${lang}`;
            }

            // Insert code block after the fence div (don't remove the fence)
            container.insertBefore(currentCodeBlock, child.nextSibling);

            // Store reference to the code element for adding content
            currentCodeBlock._codeElement = codeElement;
            continue;
          } else {
            // End of code block - fence stays visible
            inCodeBlock = false;
            currentCodeBlock = null;
            continue;
          }
        }
      }

      // Check if we're in a code block - any div that's not a code fence
      if (inCodeBlock && currentCodeBlock && child.tagName === 'DIV' && !child.querySelector('.code-fence')) {
        const codeElement = currentCodeBlock._codeElement || currentCodeBlock.querySelector('code');
        // Determine if the visual line is truly empty (only nbsp)
        const raw = child.innerHTML.trim();
        const isOnlyNbsp = /^(&nbsp;)*$/.test(raw);
        const lineText = isOnlyNbsp ? '' : child.textContent.replace(/\u00A0/g, ' ');

        // Append newline when there is already content; ensure empty line preserved
        if (codeElement.textContent.length > 0) {
          codeElement.textContent += '\n';
        }
        codeElement.textContent += lineText;
        child.remove();
        continue;
      }

      // Check if this div contains a list item
      let listItem = null;
      if (child.tagName === 'DIV') {
        // Look for li inside the div
        listItem = child.querySelector('li');
      }

      if (listItem) {
        const isBullet = listItem.classList.contains('bullet-list');
        const isOrdered = listItem.classList.contains('ordered-list');

        if (!isBullet && !isOrdered) {
          currentList = null;
          listType = null;
          continue;
        }

        const newType = isBullet ? 'ul' : 'ol';

        // Start new list or continue current
        if (!currentList || listType !== newType) {
          currentList = document.createElement(newType);
          container.insertBefore(currentList, child);
          listType = newType;
        }

        // Move the list item to the current list
        currentList.appendChild(listItem);

        // Remove the now-empty div wrapper
        child.remove();
      } else {
        // Non-list element ends current list
        currentList = null;
        listType = null;
      }
    }

    return container.innerHTML;
  }

  /**
   * Manual post-processing for Node.js environments (without DOM)
   * @param {string} html - HTML to post-process
   * @returns {string} Post-processed HTML
   */
  static postProcessHTMLManual(html) {
    let processed = html;

    // Process unordered lists
    processed = processed.replace(/((?:<div>(?:&nbsp;)*<li class="bullet-list">.*?<\/li><\/div>\s*)+)/gs, match => {
      const items = match.match(/<li class="bullet-list">.*?<\/li>/gs) || [];
      if (items.length > 0) {
        return '<ul>' + items.join('') + '</ul>';
      }
      return match;
    });

    // Process ordered lists
    processed = processed.replace(/((?:<div>(?:&nbsp;)*<li class="ordered-list">.*?<\/li><\/div>\s*)+)/gs, match => {
      const items = match.match(/<li class="ordered-list">.*?<\/li>/gs) || [];
      if (items.length > 0) {
        return '<ol>' + items.join('') + '</ol>';
      }
      return match;
    });

    // Process code blocks - KEEP the fence markers for alignment AND use semantic pre/code
    const codeBlockRegex = /<div><span class="code-fence">(```[^<]*)<\/span><\/div>(.*?)<div><span class="code-fence">(```)<\/span><\/div>/gs;
    processed = processed.replace(codeBlockRegex, (match, openFence, content, closeFence) => {
      // Extract the content between fences
      const lines = content.match(/<div>(.*?)<\/div>/gs) || [];
      const codeContent = lines
        .map(line => {
          // Extract inner HTML for each line
          const inner = line.replace(/<div>(.*?)<\/div>/s, '$1');
          const isOnlyNbsp = /^(&nbsp;)*$/.test(inner.trim());
          // Treat lines of only &nbsp; as truly empty for alignment purposes
          const text = isOnlyNbsp ? '' : inner.replace(/&nbsp;/g, ' ');
          return text;
        })
        .join('\n');

      // Extract language from the opening fence
      const lang = openFence.slice(3).trim();
      const langClass = lang ? ` class="language-${lang}"` : '';

      // Keep fence markers visible as separate divs, with pre/code block between them
      let result = `<div><span class="code-fence">${openFence}</span></div>`;
      // Content is already escaped, don't double-escape
      result += `<pre class="code-block"><code${langClass}>${codeContent}</code></pre>`;
      result += `<div><span class="code-fence">${closeFence}</span></div>`;

      return result;
    });

    return processed;
  }

  /**
   * List pattern definitions
   */
  static LIST_PATTERNS = {
    bullet: /^(\s*)([-*+])\s+(.*)$/,
    numbered: /^(\s*)(\d+)\.\s+(.*)$/,
    checkbox: /^(\s*)-\s+\[([ x])\]\s+(.*)$/
  };

  /**
   * Get list context at cursor position
   * @param {string} text - Full text content
   * @param {number} cursorPosition - Current cursor position
   * @returns {Object} List context information
   */
  static getListContext(text, cursorPosition) {
    // Find the line containing the cursor
    const lines = text.split('\n');
    let currentPos = 0;
    let lineIndex = 0;
    let lineStart = 0;

    for (let i = 0; i < lines.length; i++) {
      const lineLength = lines[i].length;
      if (currentPos + lineLength >= cursorPosition) {
        lineIndex = i;
        lineStart = currentPos;
        break;
      }
      currentPos += lineLength + 1; // +1 for newline
    }

    const currentLine = lines[lineIndex];
    const lineEnd = lineStart + currentLine.length;

    // Check for checkbox first (most specific)
    const checkboxMatch = currentLine.match(this.LIST_PATTERNS.checkbox);
    if (checkboxMatch) {
      return {
        inList: true,
        listType: 'checkbox',
        indent: checkboxMatch[1],
        marker: '-',
        checked: checkboxMatch[2] === 'x',
        content: checkboxMatch[3],
        lineStart,
        lineEnd,
        markerEndPos: lineStart + checkboxMatch[1].length + checkboxMatch[2].length + 5 // indent + "- [ ] "
      };
    }

    // Check for bullet list
    const bulletMatch = currentLine.match(this.LIST_PATTERNS.bullet);
    if (bulletMatch) {
      return {
        inList: true,
        listType: 'bullet',
        indent: bulletMatch[1],
        marker: bulletMatch[2],
        content: bulletMatch[3],
        lineStart,
        lineEnd,
        markerEndPos: lineStart + bulletMatch[1].length + bulletMatch[2].length + 1 // indent + marker + space
      };
    }

    // Check for numbered list
    const numberedMatch = currentLine.match(this.LIST_PATTERNS.numbered);
    if (numberedMatch) {
      return {
        inList: true,
        listType: 'numbered',
        indent: numberedMatch[1],
        marker: parseInt(numberedMatch[2]),
        content: numberedMatch[3],
        lineStart,
        lineEnd,
        markerEndPos: lineStart + numberedMatch[1].length + numberedMatch[2].length + 2 // indent + number + ". "
      };
    }

    // Not in a list
    return {
      inList: false,
      listType: null,
      indent: '',
      marker: null,
      content: currentLine,
      lineStart,
      lineEnd,
      markerEndPos: lineStart
    };
  }

  /**
   * Create a new list item based on context
   * @param {Object} context - List context from getListContext
   * @returns {string} New list item text
   */
  static createNewListItem(context) {
    switch (context.listType) {
      case 'bullet':
        return `${context.indent}${context.marker} `;
      case 'numbered':
        return `${context.indent}${context.marker + 1}. `;
      case 'checkbox':
        return `${context.indent}- [ ] `;
      default:
        return '';
    }
  }

  /**
   * Renumber all numbered lists in text
   * @param {string} text - Text containing numbered lists
   * @returns {string} Text with renumbered lists
   */
  static renumberLists(text) {
    const lines = text.split('\n');
    const numbersByIndent = new Map();
    let inList = false;

    const result = lines.map(line => {
      const match = line.match(this.LIST_PATTERNS.numbered);

      if (match) {
        const indent = match[1];
        const indentLevel = indent.length;
        const content = match[3];

        // If we weren't in a list or indent changed, reset lower levels
        if (!inList) {
          numbersByIndent.clear();
        }

        // Get the next number for this indent level
        const currentNumber = (numbersByIndent.get(indentLevel) || 0) + 1;
        numbersByIndent.set(indentLevel, currentNumber);

        // Clear deeper indent levels
        for (const [level] of numbersByIndent) {
          if (level > indentLevel) {
            numbersByIndent.delete(level);
          }
        }

        inList = true;
        return `${indent}${currentNumber}. ${content}`;
      } else {
        // Not a numbered list item
        if (line.trim() === '' || !line.match(/^\s/)) {
          // Empty line or non-indented line breaks the list
          inList = false;
          numbersByIndent.clear();
        }
        return line;
      }
    });

    return result.join('\n');
  }
}
