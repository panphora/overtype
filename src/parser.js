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

  // Global code highlighter function
  static codeHighlighter = null;

  /**
   * Reset link index (call before parsing a new document)
   */
  static resetLinkIndex() {
    this.linkIndex = 0;
  }

  /**
   * Set global code highlighter function
   * @param {Function|null} highlighter - Function that takes (code, language) and returns highlighted HTML
   */
  static setCodeHighlighter(highlighter) {
    this.codeHighlighter = highlighter;
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
    // Single asterisk - must not be adjacent to other asterisks
    html = html.replace(/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/g, '<em><span class="syntax-marker">*</span>$1<span class="syntax-marker">*</span></em>');
    
    // Single underscore - must be at word boundaries to avoid matching inside words
    // This prevents matching underscores in the middle of words like "bold_with_underscore"
    html = html.replace(/(?<=^|\s)_(?!_)(.+?)(?<!_)_(?!_)(?=\s|$)/g, '<em><span class="syntax-marker">_</span>$1<span class="syntax-marker">_</span></em>');
    
    return html;
  }

  /**
   * Parse strikethrough text
   * Supports both single (~) and double (~~) tildes, but rejects 3+ tildes
   * @param {string} html - HTML with potential strikethrough markdown
   * @returns {string} HTML with strikethrough styling
   */
  static parseStrikethrough(html) {
    // Double tilde strikethrough: ~~text~~ (but not if part of 3+ tildes)
    html = html.replace(/(?<!~)~~(?!~)(.+?)(?<!~)~~(?!~)/g, '<del><span class="syntax-marker">~~</span>$1<span class="syntax-marker">~~</span></del>');
    // Single tilde strikethrough: ~text~ (but not if part of 2+ tildes on either side)
    html = html.replace(/(?<!~)~(?!~)(.+?)(?<!~)~(?!~)/g, '<del><span class="syntax-marker">~</span>$1<span class="syntax-marker">~</span></del>');
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
    const safeProtocols = [
      'http://',
      'https://',
      'mailto:',
      'ftp://',
      'ftps://'
    ];

    // Check if URL starts with a safe protocol
    const hasSafeProtocol = safeProtocols.some(protocol => lower.startsWith(protocol));

    // Allow relative URLs (starting with / or # or no protocol)
    const isRelative = trimmed.startsWith('/') ||
                      trimmed.startsWith('#') ||
                      trimmed.startsWith('?') ||
                      trimmed.startsWith('.') ||
                      (!trimmed.includes(':') && !trimmed.includes('//'));

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
   * Identify and protect sanctuaries (code and links) before parsing
   * @param {string} text - Text with potential markdown
   * @returns {Object} Object with protected text and sanctuary map
   */
  static identifyAndProtectSanctuaries(text) {
    const sanctuaries = new Map();
    let sanctuaryCounter = 0;
    let protectedText = text;
    
    // Create a map to track protected regions (URLs should not be processed)
    const protectedRegions = [];
    
    // First, find all links and mark their URL regions as protected
    const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
    let linkMatch;
    while ((linkMatch = linkRegex.exec(text)) !== null) {
      // Calculate the exact position of the URL part
      // linkMatch.index is the start of the match
      // We need to find where "](" starts, then add 2 to get URL start
      const bracketPos = linkMatch.index + linkMatch[0].indexOf('](');
      const urlStart = bracketPos + 2;
      const urlEnd = urlStart + linkMatch[2].length;
      protectedRegions.push({ start: urlStart, end: urlEnd });
    }
    
    // Now protect inline code, but skip if it's inside a protected region (URL)
    const codeRegex = /(?<!`)(`+)(?!`)((?:(?!\1).)+?)(\1)(?!`)/g;
    let codeMatch;
    const codeMatches = [];
    
    while ((codeMatch = codeRegex.exec(text)) !== null) {
      const codeStart = codeMatch.index;
      const codeEnd = codeMatch.index + codeMatch[0].length;
      
      // Check if this code is inside a protected URL region
      const inProtectedRegion = protectedRegions.some(region => 
        codeStart >= region.start && codeEnd <= region.end
      );
      
      if (!inProtectedRegion) {
        codeMatches.push({
          match: codeMatch[0],
          index: codeMatch.index,
          openTicks: codeMatch[1],
          content: codeMatch[2],
          closeTicks: codeMatch[3]
        });
      }
    }
    
    // Replace code matches from end to start to preserve indices
    codeMatches.sort((a, b) => b.index - a.index);
    codeMatches.forEach(codeInfo => {
      const placeholder = `\uE000${sanctuaryCounter++}\uE001`;
      sanctuaries.set(placeholder, {
        type: 'code',
        original: codeInfo.match,
        openTicks: codeInfo.openTicks,
        content: codeInfo.content,
        closeTicks: codeInfo.closeTicks
      });
      protectedText = protectedText.substring(0, codeInfo.index) + 
                     placeholder + 
                     protectedText.substring(codeInfo.index + codeInfo.match.length);
    });
    
    // Then protect links - they can contain sanctuary placeholders for code but not raw code
    protectedText = protectedText.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (match, linkText, url) => {
      const placeholder = `\uE000${sanctuaryCounter++}\uE001`;
      sanctuaries.set(placeholder, {
        type: 'link',
        original: match,
        linkText,
        url
      });
      return placeholder;
    });
    
    return { protectedText, sanctuaries };
  }
  
  /**
   * Restore and transform sanctuaries back to HTML
   * @param {string} html - HTML with sanctuary placeholders
   * @param {Map} sanctuaries - Map of sanctuaries to restore
   * @returns {string} HTML with sanctuaries restored and transformed
   */
  static restoreAndTransformSanctuaries(html, sanctuaries) {
    // Sort sanctuary placeholders by position to restore in order
    const placeholders = Array.from(sanctuaries.keys()).sort((a, b) => {
      const indexA = html.indexOf(a);
      const indexB = html.indexOf(b);
      return indexA - indexB;
    });
    
    placeholders.forEach(placeholder => {
      const sanctuary = sanctuaries.get(placeholder);
      let replacement;
      
      if (sanctuary.type === 'code') {
        // Transform code sanctuary to HTML
        replacement = `<code><span class="syntax-marker">${sanctuary.openTicks}</span>${sanctuary.content}<span class="syntax-marker">${sanctuary.closeTicks}</span></code>`;
      } else if (sanctuary.type === 'link') {
        // For links, we need to process the link text for markdown
        let processedLinkText = sanctuary.linkText;
        
        // First restore any sanctuary placeholders that were already in the link text
        // (e.g., inline code that was protected before the link)
        sanctuaries.forEach((innerSanctuary, innerPlaceholder) => {
          if (processedLinkText.includes(innerPlaceholder)) {
            if (innerSanctuary.type === 'code') {
              const codeHtml = `<code><span class="syntax-marker">${innerSanctuary.openTicks}</span>${innerSanctuary.content}<span class="syntax-marker">${innerSanctuary.closeTicks}</span></code>`;
              processedLinkText = processedLinkText.replace(innerPlaceholder, codeHtml);
            }
          }
        });
        
        // Now parse other markdown in the link text (bold, italic, etc)
        processedLinkText = this.parseStrikethrough(processedLinkText);
        processedLinkText = this.parseBold(processedLinkText);
        processedLinkText = this.parseItalic(processedLinkText);
        
        // Transform link sanctuary to HTML
        // URL should NOT be processed for markdown - use it as-is
        const anchorName = `--link-${this.linkIndex++}`;
        const safeUrl = this.sanitizeUrl(sanctuary.url);
        replacement = `<a href="${safeUrl}" style="anchor-name: ${anchorName}"><span class="syntax-marker">[</span>${processedLinkText}<span class="syntax-marker url-part">](${sanctuary.url})</span></a>`;
      }
      
      html = html.replace(placeholder, replacement);
    });
    
    return html;
  }
  
  /**
   * Parse all inline elements in correct order
   * @param {string} text - Text with potential inline markdown
   * @returns {string} HTML with all inline styling
   */
  static parseInlineElements(text) {
    // Step 1: Identify and protect sanctuaries (code and links)
    const { protectedText, sanctuaries } = this.identifyAndProtectSanctuaries(text);
    
    // Step 2: Parse other inline elements on protected text
    let html = protectedText;
    html = this.parseStrikethrough(html);
    html = this.parseBold(html);
    html = this.parseItalic(html);
    
    // Step 3: Restore and transform sanctuaries
    html = this.restoreAndTransformSanctuaries(html, sanctuaries);
    
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
   * @param {Function} instanceHighlighter - Instance-specific code highlighter (optional, overrides global if provided)
   * @returns {string} Parsed HTML
   */
  static parse(text, activeLine = -1, showActiveLineRaw = false, instanceHighlighter) {
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
    return this.postProcessHTML(html, instanceHighlighter);
  }

  /**
   * Post-process HTML to consolidate lists and code blocks
   * @param {string} html - HTML to post-process
   * @param {Function} instanceHighlighter - Instance-specific code highlighter (optional, overrides global if provided)
   * @returns {string} Post-processed HTML with consolidated lists and code blocks
   */
  static postProcessHTML(html, instanceHighlighter) {
    // Check if we're in a browser environment
    if (typeof document === 'undefined' || !document) {
      // In Node.js environment - do manual post-processing
      return this.postProcessHTMLManual(html, instanceHighlighter);
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
            currentCodeBlock._language = lang;
            currentCodeBlock._codeContent = '';
            continue;
          } else {
            // End of code block - apply highlighting if needed
            // Use instance highlighter if provided, otherwise fall back to global highlighter
            const highlighter = instanceHighlighter || this.codeHighlighter;
            if (currentCodeBlock && highlighter && currentCodeBlock._codeContent) {
              try {
                const result = highlighter(
                  currentCodeBlock._codeContent,
                  currentCodeBlock._language || ''
                );

                // Check if result is a Promise (async highlighter)
                if (result && typeof result.then === 'function') {
                  console.warn('Async highlighters are not supported in parse() because it returns an HTML string. The caller creates new DOM elements from that string, breaking references to the elements we would update. Use synchronous highlighters only.');
                  // Keep the plain text fallback that was already set
                } else {
                  // Synchronous highlighter
                  // Verify highlighter returned non-empty string
                  if (result && typeof result === 'string' && result.trim()) {
                    currentCodeBlock._codeElement.innerHTML = result;
                  }
                  // else: keep the plain text fallback that was already set
                }
              } catch (error) {
                console.warn('Code highlighting failed:', error);
                // Keep the plain text content as fallback
              }
            }

            inCodeBlock = false;
            currentCodeBlock = null;
            continue;
          }
        }
      }

      // Check if we're in a code block - any div that's not a code fence
      if (inCodeBlock && currentCodeBlock && child.tagName === 'DIV' && !child.querySelector('.code-fence')) {
        const codeElement = currentCodeBlock._codeElement || currentCodeBlock.querySelector('code');
        // Add the line content to the code block content (for highlighting)
        if (currentCodeBlock._codeContent.length > 0) {
          currentCodeBlock._codeContent += '\n';
        }
        // Get the actual text content, preserving spaces
        const lineText = child.textContent.replace(/\u00A0/g, ' '); // \u00A0 is nbsp
        currentCodeBlock._codeContent += lineText;

        // Also add to the code element (fallback if no highlighter)
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

        // Extract and preserve indentation from the div before moving the list item
        const indentationNodes = [];
        for (const node of child.childNodes) {
          if (node.nodeType === 3 && node.textContent.match(/^\u00A0+$/)) {
            // This is a text node containing only non-breaking spaces (indentation)
            indentationNodes.push(node.cloneNode(true));
          } else if (node === listItem) {
            break; // Stop when we reach the list item
          }
        }

        // Add indentation to the list item
        indentationNodes.forEach(node => {
          listItem.insertBefore(node, listItem.firstChild);
        });

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
   * @param {Function} instanceHighlighter - Instance-specific code highlighter (optional, overrides global if provided)
   * @returns {string} Post-processed HTML
   */
  static postProcessHTMLManual(html, instanceHighlighter) {
    let processed = html;

    // Process unordered lists
    processed = processed.replace(/((?:<div>(?:&nbsp;)*<li class="bullet-list">.*?<\/li><\/div>\s*)+)/gs, (match) => {
      const divs = match.match(/<div>(?:&nbsp;)*<li class="bullet-list">.*?<\/li><\/div>/gs) || [];
      if (divs.length > 0) {
        const items = divs.map(div => {
          // Extract indentation and list item
          const indentMatch = div.match(/<div>((?:&nbsp;)*)<li/);
          const listItemMatch = div.match(/<li class="bullet-list">.*?<\/li>/);

          if (indentMatch && listItemMatch) {
            const indentation = indentMatch[1];
            const listItem = listItemMatch[0];
            // Insert indentation at the start of the list item content
            return listItem.replace(/<li class="bullet-list">/, `<li class="bullet-list">${indentation}`);
          }
          return listItemMatch ? listItemMatch[0] : '';
        }).filter(Boolean);

        return '<ul>' + items.join('') + '</ul>';
      }
      return match;
    });

    // Process ordered lists
    processed = processed.replace(/((?:<div>(?:&nbsp;)*<li class="ordered-list">.*?<\/li><\/div>\s*)+)/gs, (match) => {
      const divs = match.match(/<div>(?:&nbsp;)*<li class="ordered-list">.*?<\/li><\/div>/gs) || [];
      if (divs.length > 0) {
        const items = divs.map(div => {
          // Extract indentation and list item
          const indentMatch = div.match(/<div>((?:&nbsp;)*)<li/);
          const listItemMatch = div.match(/<li class="ordered-list">.*?<\/li>/);

          if (indentMatch && listItemMatch) {
            const indentation = indentMatch[1];
            const listItem = listItemMatch[0];
            // Insert indentation at the start of the list item content
            return listItem.replace(/<li class="ordered-list">/, `<li class="ordered-list">${indentation}`);
          }
          return listItemMatch ? listItemMatch[0] : '';
        }).filter(Boolean);

        return '<ol>' + items.join('') + '</ol>';
      }
      return match;
    });

    // Process code blocks - KEEP the fence markers for alignment AND use semantic pre/code
    const codeBlockRegex = /<div><span class="code-fence">(```[^<]*)<\/span><\/div>(.*?)<div><span class="code-fence">(```)<\/span><\/div>/gs;
    processed = processed.replace(codeBlockRegex, (match, openFence, content, closeFence) => {
      // Extract the content between fences
      const lines = content.match(/<div>(.*?)<\/div>/gs) || [];
      const codeContent = lines.map(line => {
        // Extract text from each div - content is already escaped
        const text = line.replace(/<div>(.*?)<\/div>/s, '$1')
          .replace(/&nbsp;/g, ' ');
        return text;
      }).join('\n');

      // Extract language from the opening fence
      const lang = openFence.slice(3).trim();
      const langClass = lang ? ` class="language-${lang}"` : '';

      // Apply code highlighting if available
      let highlightedContent = codeContent;
      // Use instance highlighter if provided, otherwise fall back to global highlighter
      const highlighter = instanceHighlighter || this.codeHighlighter;
      if (highlighter) {
        try {
          // CRITICAL: Decode HTML entities before passing to highlighter
          // In the DOM path, textContent automatically decodes entities.
          // In the manual path, we need to decode explicitly to avoid double-escaping.
          const decodedCode = codeContent
            .replace(/&quot;/g, '"')
            .replace(/&#39;/g, "'")
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&amp;/g, '&');  // Must be last to avoid double-decoding

          const result = highlighter(decodedCode, lang);

          // Check if result is a Promise (async highlighter)
          // Note: In Node.js context, we can't easily defer rendering, so we warn
          if (result && typeof result.then === 'function') {
            console.warn('Async highlighters are not supported in Node.js (non-DOM) context. Use synchronous highlighters for server-side rendering.');
            // Fall back to escaped content
          } else {
            // Synchronous highlighter - verify returned non-empty string
            if (result && typeof result === 'string' && result.trim()) {
              highlightedContent = result;
            }
            // else: keep the escaped codeContent as fallback
          }
        } catch (error) {
          console.warn('Code highlighting failed:', error);
          // Fall back to original content
        }
      }

      // Keep fence markers visible as separate divs, with pre/code block between them
      let result = `<div><span class="code-fence">${openFence}</span></div>`;
      // Use highlighted content if available, otherwise use escaped content
      result += `<pre class="code-block"><code${langClass}>${highlightedContent}</code></pre>`;
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
