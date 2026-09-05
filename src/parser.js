import {
  findCodeSpans,
  findLinks as scanLinks,
  findRenderableLinks as scanRenderableLinks
} from './link-scanner.js';
import { renderEmphasis } from './emphasis-scanner.js';
import {
  scanAtxHeading,
  scanBlockquote,
  scanFenceClose,
  scanFenceOpen,
  scanListItem,
  scanThematicBreak
} from './block-scanner.js';

function decodeEscapedLine(html) {
  return html
    .replace(/&nbsp;/g, ' ')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');
}

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

  // Custom syntax processor function
  static customSyntax = null;

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
   * Set custom syntax processor function
   * @param {Function|null} processor - Function that takes (html) and returns modified HTML
   */
  static setCustomSyntax(processor) {
    this.customSyntax = processor;
  }

  /**
   * Apply custom syntax processor to parsed HTML
   * @param {string} html - Parsed HTML line
   * @returns {string} HTML with custom syntax applied
   */
  static applyCustomSyntax(html) {
    if (this.customSyntax) {
      return this.customSyntax(html);
    }
    return html;
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
    const heading = scanAtxHeading(decodeEscapedLine(html));
    if (!heading) return html;

    const indent = heading.indent.replace(/ /g, '&nbsp;');
    const opening = this.escapeHtml(heading.marker + heading.separator);
    const content = this.parseInlineElements(this.escapeHtml(heading.content));
    const closing = heading.closing
      ? `<span class="syntax-marker">${this.escapeHtml(heading.closing)}</span>`
      : '';
    return `<h${heading.level}>${indent}<span class="syntax-marker">${opening}</span>${content}${closing}</h${heading.level}>`;
  }

  /**
   * Parse horizontal rules
   * @param {string} html - HTML line to parse
   * @returns {string|null} Parsed horizontal rule or null
   */
  static parseHorizontalRule(html) {
    const source = decodeEscapedLine(html);
    if (!scanThematicBreak(source)) return null;

    const rendered = this.preserveIndentation(this.escapeHtml(source), source);
    return `<div><span class="hr-marker">${rendered}</span></div>`;
  }

  /**
   * Parse blockquotes
   * @param {string} html - HTML line to parse
   * @returns {string} Parsed blockquote
   */
  static parseBlockquote(html) {
    const blockquote = scanBlockquote(decodeEscapedLine(html));
    if (!blockquote) return html;

    const indent = blockquote.indent.replace(/ /g, '&nbsp;');
    const marker = this.escapeHtml(blockquote.marker);
    const separator = this.escapeHtml(blockquote.separator);
    const content = this.parseInlineElements(this.escapeHtml(blockquote.content));
    return `${indent}<span class="blockquote"><span class="syntax-marker">${marker}</span>${separator}${content}</span>`;
  }

  /**
   * Parse bullet lists
   * @param {string} html - HTML line to parse
   * @returns {string} Parsed bullet list item
   */
  static parseBulletList(html) {
    const source = decodeEscapedLine(html);
    if (scanThematicBreak(source)) return html;

    const listItem = scanListItem(source);
    if (!listItem || listItem.listType !== 'bullet') return html;

    const indent = listItem.indent.replace(/ /g, '&nbsp;');
    const marker = this.escapeHtml(listItem.marker + listItem.separator);
    const content = this.parseInlineElements(this.escapeHtml(listItem.content));
    return `${indent}<li class="bullet-list"><span class="syntax-marker">${marker}</span>${content}</li>`;
  }

  /**
   * Parse task lists (GitHub Flavored Markdown checkboxes)
   * @param {string} html - HTML line to parse
   * @param {boolean} isPreviewMode - Whether to render actual checkboxes (preview) or keep syntax visible (normal)
   * @returns {string} Parsed task list item
   */
  static parseTaskList(html, isPreviewMode = false) {
    return html.replace(/^((?:&nbsp;)*)-(\s+)\[([ xX])\](\s*)(.*)$/, (match, indent, spacingBeforeBox, checked, spacingAfterBox, content) => {
      if (spacingAfterBox === '' && content !== '') return match;
      content = this.parseInlineElements(content);
      if (isPreviewMode) {
        // Preview mode: render actual checkbox
        const isChecked = checked.toLowerCase() === 'x';
        return `${indent}<li class="task-list"><input type="checkbox" ${isChecked ? 'checked' : ''}> ${content}</li>`;
      } else {
        // Normal mode: keep syntax (including user spacing) visible for alignment
        return `${indent}<li class="task-list"><span class="syntax-marker">-${spacingBeforeBox}[${checked}]${spacingAfterBox}</span>${content}</li>`;
      }
    });
  }

  /**
   * Parse numbered lists
   * @param {string} html - HTML line to parse
   * @returns {string} Parsed numbered list item
   */
  static parseNumberedList(html) {
    const listItem = scanListItem(decodeEscapedLine(html));
    if (!listItem || listItem.listType !== 'ordered') return html;

    const indent = listItem.indent.replace(/ /g, '&nbsp;');
    const marker = this.escapeHtml(listItem.marker + listItem.separator);
    const content = this.parseInlineElements(this.escapeHtml(listItem.content));
    return `${indent}<li class="ordered-list"><span class="syntax-marker">${marker}</span>${content}</li>`;
  }

  /**
   * Parse code blocks (markers only)
   * @param {string} html - HTML line to parse
   * @returns {string|null} Parsed code fence or null
   */
  static parseCodeBlock(html) {
    const descriptor = scanFenceOpen(decodeEscapedLine(html));
    return descriptor ? this.renderFence(descriptor) : null;
  }

  static renderFence(descriptor, raw = false) {
    const source = this.preserveIndentation(this.escapeHtml(descriptor.source), descriptor.source);
    const className = raw ? ' class="raw-line"' : '';
    return `<div${className}><span class="code-fence">${source}</span></div>`;
  }

  static renderCodeContent(lines, info, instanceHighlighter, indentation = 0, rawLineIndex = -1) {
    const semanticLines = lines.map(line => {
      let width = 0;
      while (width < indentation && line[width] === ' ') width++;
      return { source: line, prefix: line.slice(0, width), content: line.slice(width) };
    });
    const semanticContent = semanticLines.map(line => line.content).join('\n');
    const renderPrefix = prefix => prefix
      ? `<span class="syntax-marker">${this.escapeHtml(prefix)}</span>`
      : '';
    const displayContent = semanticLines.map((line, index) => {
      if (index === rawLineIndex) {
        return `<span class="raw-line">${this.escapeHtml(line.source) || '&nbsp;'}</span>`;
      }
      if (line.prefix === '' && line.content === '') return '<span class="syntax-marker">&nbsp;</span>';
      return renderPrefix(line.prefix) + this.escapeHtml(line.content);
    }).join('\n');
    const language = info.split(/[\t ]/, 1)[0];
    const languageClass = language ? ` class="language-${this.escapeHtml(language)}"` : '';
    const highlighter = instanceHighlighter || this.codeHighlighter;
    let content = displayContent;

    if (highlighter) {
      try {
        const result = highlighter(semanticContent, language);
        if (result && typeof result.then === 'function') {
          console.warn('Async highlighters are not supported in parse() because it returns an HTML string. Use synchronous highlighters only.');
        } else if (result && typeof result === 'string' && result.trim()) {
          const highlightedLines = result.split('\n');
          if (highlightedLines.length === semanticLines.length + 1 && highlightedLines[highlightedLines.length - 1] === '') {
            highlightedLines.pop();
          }
          if (highlightedLines.length === semanticLines.length) {
            content = highlightedLines.map((line, index) => {
              if (index === rawLineIndex) {
                return `<span class="raw-line">${this.escapeHtml(semanticLines[index].source) || '&nbsp;'}</span>`;
              }
              return renderPrefix(semanticLines[index].prefix) + line;
            }).join('\n');
          } else {
            console.warn('Code highlighter output line count does not match the source. Using unhighlighted code to preserve alignment.');
          }
        }
      } catch (error) {
        console.warn('Code highlighting failed:', error);
      }
    }

    return `<pre class="code-block"><code${languageClass}>${content}</code></pre>`;
  }

  /**
   * Parse bold text
   * @param {string} html - HTML with potential bold markdown
   * @returns {string} HTML with bold styling
   */
  static parseBold(html) {
    return renderEmphasis(html, { htmlEntities: true, includeEm: false });
  }

  /**
   * Parse italic text
   * @param {string} html - HTML with potential italic markdown
   * @returns {string} HTML with italic styling
   */
  static parseItalic(html) {
    return renderEmphasis(html, { htmlEntities: true, includeStrong: false });
  }

  static parseEmphasis(html) {
    return renderEmphasis(html, { htmlEntities: true });
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
    const spans = findCodeSpans(html);
    for (const span of spans.reverse()) {
      const replacement = `<code><span class="syntax-marker">${span.openTicks}</span>${span.content}<span class="syntax-marker">${span.closeTicks}</span></code>`;
      html = html.slice(0, span.start) + replacement + html.slice(span.end);
    }
    return html;
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

  static findLinks(text, options = {}) {
    const { allowEmptyText = false, ...scannerOptions } = options;
    return scanLinks(text, scannerOptions).filter(link =>
      (allowEmptyText || link.text.raw.length > 0) &&
      link.destination !== null &&
      link.destination.value.length > 0
    );
  }

  static findRenderableLinks(text, options = {}) {
    const { allowEmptyText = false, ...scannerOptions } = options;
    return scanRenderableLinks(text, scannerOptions).filter(link =>
      (allowEmptyText || link.text.raw.length > 0) &&
      link.destination !== null &&
      link.destination.value.length > 0
    );
  }

  /**
   * Parse links
   * @param {string} html - HTML with potential link markdown
   * @returns {string} HTML with link styling
   */
  static parseLinks(html) {
    const links = this.findLinks(html, { htmlEntities: true });
    links.forEach(link => {
      link.anchorName = `--link-${this.linkIndex++}`;
    });

    for (const link of links.reverse()) {
      const safeUrl = this.escapeHtml(this.sanitizeUrl(link.destination.value));
      const title = link.title === null ? '' : ` title="${this.escapeHtml(link.title.value)}"`;
      const linkText = html.slice(link.text.start, link.text.end);
      const tail = html.slice(link.text.end, link.end);
      const replacement = `<a href="${safeUrl}"${title} style="anchor-name: ${link.anchorName}"><span class="syntax-marker">[</span>${linkText}<span class="syntax-marker url-part">${tail}</span></a>`;
      html = html.slice(0, link.start) + replacement + html.slice(link.end);
    }

    return html;
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
    
    const links = text.includes('[')
      ? this.findRenderableLinks(text, { htmlEntities: true })
      : [];
    const protectedRegions = links.map(link => ({ start: link.text.end, end: link.end }));
    const codeMatches = findCodeSpans(text, protectedRegions);
    
    // Replace code matches from end to start to preserve indices
    codeMatches.sort((a, b) => b.start - a.start);
    codeMatches.forEach(codeInfo => {
      const placeholder = `\uE000${sanctuaryCounter++}\uE001`;
      sanctuaries.set(placeholder, {
        type: 'code',
        original: codeInfo.raw,
        openTicks: codeInfo.openTicks,
        content: codeInfo.content,
        closeTicks: codeInfo.closeTicks
      });
      protectedText = protectedText.substring(0, codeInfo.start) +
                     placeholder + 
                     protectedText.substring(codeInfo.end);
    });
    
    const codePlaceholders = [...sanctuaries.keys()];
    const protectedLinks = (protectedText.includes('[')
      ? this.findLinks(protectedText, { htmlEntities: true })
      : [])
      .filter(link => {
        const tail = protectedText.slice(link.text.end, link.end);
        return codePlaceholders.every(placeholder => !tail.includes(placeholder));
      });
    protectedLinks.sort((a, b) => b.start - a.start).forEach(link => {
      const placeholder = `\uE000${sanctuaryCounter++}\uE001`;
      sanctuaries.set(placeholder, {
        type: 'link',
        original: protectedText.slice(link.start, link.end),
        linkText: protectedText.slice(link.text.start, link.text.end),
        tail: protectedText.slice(link.text.end, link.end),
        url: link.destination.value,
        title: link.title?.value ?? null
      });
      protectedText = protectedText.slice(0, link.start) + placeholder + protectedText.slice(link.end);
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
        
        processedLinkText = this.parseStrikethrough(processedLinkText);
        processedLinkText = this.parseEmphasis(processedLinkText);

        sanctuaries.forEach((innerSanctuary, innerPlaceholder) => {
          if (processedLinkText.includes(innerPlaceholder) && innerSanctuary.type === 'code') {
            const codeHtml = `<code><span class="syntax-marker">${innerSanctuary.openTicks}</span>${innerSanctuary.content}<span class="syntax-marker">${innerSanctuary.closeTicks}</span></code>`;
            processedLinkText = processedLinkText.replace(innerPlaceholder, () => codeHtml);
          }
        });
        
        // Transform link sanctuary to HTML
        // URL should NOT be processed for markdown - use it as-is
        const anchorName = `--link-${this.linkIndex++}`;
        const safeUrl = this.escapeHtml(this.sanitizeUrl(sanctuary.url));
        const title = sanctuary.title === null ? '' : ` title="${this.escapeHtml(sanctuary.title)}"`;
        replacement = `<a href="${safeUrl}"${title} style="anchor-name: ${anchorName}"><span class="syntax-marker">[</span>${processedLinkText}<span class="syntax-marker url-part">${sanctuary.tail}</span></a>`;
      }
      
      html = html.replace(placeholder, () => replacement);
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
    html = this.parseEmphasis(html);
    
    // Step 3: Restore and transform sanctuaries
    html = this.restoreAndTransformSanctuaries(html, sanctuaries);
    
    return html;
  }

  /**
   * Parse a single line of markdown
   * @param {string} line - Raw markdown line
   * @returns {string} Parsed HTML line
   */
  static parseLine(line, isPreviewMode = false) {
    if (line === '') return '<div>&nbsp;</div>';

    const thematicBreak = scanThematicBreak(line);
    if (thematicBreak) {
      const source = this.preserveIndentation(this.escapeHtml(line), line);
      return `<div><span class="hr-marker">${source}</span></div>`;
    }

    const fence = scanFenceOpen(line);
    if (fence) return this.renderFence(fence);

    const heading = scanAtxHeading(line);
    if (heading) {
      const indent = heading.indent.replace(/ /g, '&nbsp;');
      const opening = this.escapeHtml(heading.marker + heading.separator);
      const content = this.parseInlineElements(this.escapeHtml(heading.content));
      const closing = heading.closing
        ? `<span class="syntax-marker">${this.escapeHtml(heading.closing)}</span>`
        : '';
      return `<div><h${heading.level}>${indent}<span class="syntax-marker">${opening}</span>${content}${closing}</h${heading.level}></div>`;
    }

    const blockquote = scanBlockquote(line);
    if (blockquote) {
      const indent = blockquote.indent.replace(/ /g, '&nbsp;');
      const marker = this.escapeHtml(blockquote.marker);
      const separator = this.escapeHtml(blockquote.separator);
      const content = this.parseInlineElements(this.escapeHtml(blockquote.content));
      return `<div>${indent}<span class="blockquote"><span class="syntax-marker">${marker}</span>${separator}${content}</span></div>`;
    }

    let html = this.preserveIndentation(this.escapeHtml(line), line);
    const taskList = this.parseTaskList(html, isPreviewMode);
    if (taskList !== html) return `<div>${taskList}</div>`;

    const listItem = scanListItem(line);
    if (listItem) {
      const indent = listItem.indent.replace(/ /g, '&nbsp;');
      const marker = this.escapeHtml(listItem.marker + listItem.separator);
      const content = this.parseInlineElements(this.escapeHtml(listItem.content));
      const className = listItem.listType === 'bullet' ? 'bullet-list' : 'ordered-list';
      return `<div>${indent}<li class="${className}"><span class="syntax-marker">${marker}</span>${content}</li></div>`;
    }

    const leadingWhitespace = /^[\t ]*/.exec(line)[0];
    const indentation = leadingWhitespace.replace(/ /g, '&nbsp;');
    html = indentation + this.parseInlineElements(this.escapeHtml(line.slice(leadingWhitespace.length)));
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
  static parse(text, activeLine = -1, showActiveLineRaw = false, instanceHighlighter, isPreviewMode = false) {
    // Reset link counter for each parse
    this.resetLinkIndex();

    const lines = text.split('\n');
    const parsedLines = [];
    let opening = null;
    let codeLines = [];
    let rawCodeLine = -1;

    for (let index = 0; index < lines.length; index++) {
      const line = lines[index];
      const isRaw = showActiveLineRaw && index === activeLine;

      if (opening) {
        const closing = scanFenceClose(line, opening);
        if (closing) {
          parsedLines.push(this.renderCodeContent(codeLines, opening.info, instanceHighlighter, opening.indent.length, rawCodeLine));
          const renderedFence = this.renderFence(closing, isRaw);
          parsedLines.push(isRaw ? renderedFence : this.applyCustomSyntax(renderedFence));
          opening = null;
          codeLines = [];
          rawCodeLine = -1;
        } else {
          if (isRaw) rawCodeLine = codeLines.length;
          codeLines.push(line);
        }
        continue;
      }

      const candidate = scanFenceOpen(line);
      if (candidate) {
        opening = candidate;
        const renderedFence = this.renderFence(candidate, isRaw);
        parsedLines.push(isRaw ? renderedFence : this.applyCustomSyntax(renderedFence));
        continue;
      }

      if (isRaw) {
        const content = this.escapeHtml(line) || '&nbsp;';
        parsedLines.push(`<div class="raw-line">${content}</div>`);
        continue;
      }

      parsedLines.push(this.applyCustomSyntax(this.parseLine(line, isPreviewMode)));
    }

    if (opening && codeLines.length > 0) {
      parsedLines.push(this.renderCodeContent(codeLines, opening.info, instanceHighlighter, opening.indent.length, rawCodeLine));
    }

    // Join without newlines to prevent extra spacing
    const html = parsedLines.join('');

    // Apply post-processing for list consolidation
    return this.postProcessHTML(html, instanceHighlighter, false);
  }

  /**
   * Post-process HTML to consolidate lists and code blocks
   * @param {string} html - HTML to post-process
   * @param {Function} instanceHighlighter - Instance-specific code highlighter (optional, overrides global if provided)
   * @returns {string} Post-processed HTML with consolidated lists and code blocks
   */
  static postProcessHTML(html, instanceHighlighter, processCodeBlocks = true) {
    return this.postProcessHTMLManual(html, instanceHighlighter, processCodeBlocks);
  }

  /**
   * Manual post-processing for Node.js environments (without DOM)
   * @param {string} html - HTML to post-process
   * @param {Function} instanceHighlighter - Instance-specific code highlighter (optional, overrides global if provided)
   * @returns {string} Post-processed HTML
   */
  static postProcessHTMLManual(html, instanceHighlighter, processCodeBlocks = true) {
    let processed = html;

    // Process unordered lists
    processed = processed.replace(/((?:<div(?:\s[^>]*)?>(?:&nbsp;)*<li class="bullet-list">.*?<\/li><\/div>\s*)+)/gs, (match) => {
      const divs = match.match(/<div(?:\s[^>]*)?>(?:&nbsp;)*<li class="bullet-list">.*?<\/li><\/div>/gs) || [];
      if (divs.length > 0) {
        const items = divs.map(div => {
          // Extract indentation and list item
          const indentMatch = div.match(/<div(?:\s[^>]*)?>((?:&nbsp;)*)<li/);
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
    processed = processed.replace(/((?:<div(?:\s[^>]*)?>(?:&nbsp;)*<li class="ordered-list">.*?<\/li><\/div>\s*)+)/gs, (match) => {
      const divs = match.match(/<div(?:\s[^>]*)?>(?:&nbsp;)*<li class="ordered-list">.*?<\/li><\/div>/gs) || [];
      if (divs.length > 0) {
        const items = divs.map(div => {
          // Extract indentation and list item
          const indentMatch = div.match(/<div(?:\s[^>]*)?>((?:&nbsp;)*)<li/);
          const listItemMatch = div.match(/<li class="ordered-list">.*?<\/li>/);

          if (indentMatch && listItemMatch) {
            const indentation = indentMatch[1];
            const listItem = listItemMatch[0];
            // Insert indentation at the start of the list item content
            return listItem.replace(/<li class="ordered-list">/, `<li class="ordered-list">${indentation}`);
          }
          return listItemMatch ? listItemMatch[0] : '';
        }).filter(Boolean);

        const firstMarker = divs[0].match(/<span class="syntax-marker">(\d+)\./);
        const start = firstMarker ? Number.parseInt(firstMarker[1], 10) : 1;
        const startAttribute = start === 1 ? '' : ` start="${start}"`;
        return `<ol${startAttribute}>` + items.join('') + '</ol>';
      }
      return match;
    });

    // Process code blocks - KEEP the fence markers for alignment AND use semantic pre/code
    const codeBlockRegex = /<div><span class="code-fence">(```[^<]*)<\/span><\/div>(.*?)<div><span class="code-fence">(```)<\/span><\/div>/gs;
    if (processCodeBlocks) processed = processed.replace(codeBlockRegex, (match, openFence, content, closeFence) => {
      if (content.includes('<pre class="code-block">')) return match;

      // Extract the content between fences
      const lines = content.match(/<div>(.*?)<\/div>/gs) || [];
      const encodedLines = lines.map(line => line.replace(/<div>(.*?)<\/div>/s, '$1'));
      const codeContent = encodedLines.map(line =>
        line === '&nbsp;' ? '' : line.replace(/&nbsp;/g, ' ')
      ).join('\n');
      const displayContent = encodedLines.join('\n');

      // Extract language from the opening fence
      const lang = openFence.slice(3).trim();
      const langClass = lang ? ` class="language-${lang}"` : '';

      // Apply code highlighting if available
      let highlightedContent = displayContent;
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
    bullet: /^( *)([-*+])[\t ]+(.*)$/,
    numbered: /^( *)(\d{1,9})\.[\t ]+(.*)$/,
    checkbox: /^( *)-[\t ]+\[([ xX])\][\t ]+(.*)$/
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
    const plainContext = {
      inList: false,
      listType: null,
      indent: '',
      marker: null,
      content: currentLine,
      lineStart,
      lineEnd,
      markerEndPos: lineStart
    };

    if (scanThematicBreak(currentLine)) return plainContext;

    const listItem = scanListItem(currentLine);
    if (!listItem) return plainContext;

    const checkboxMatch = listItem.listType === 'bullet' && listItem.marker === '-'
      ? /^\[([ xX])\]([\t ]*)(.*)$/.exec(listItem.content)
      : null;
    if (checkboxMatch && (checkboxMatch[2] !== '' || checkboxMatch[3] === '')) {
      return {
        inList: true,
        listType: 'checkbox',
        indent: listItem.indent,
        marker: '-',
        checked: checkboxMatch[1].toLowerCase() === 'x',
        content: checkboxMatch[3],
        lineStart,
        lineEnd,
        markerEndPos: lineStart + listItem.indent.length + listItem.marker.length +
          listItem.separator.length + 3 + checkboxMatch[2].length
      };
    }

    if (listItem.listType === 'bullet') {
      return {
        inList: true,
        listType: 'bullet',
        indent: listItem.indent,
        marker: listItem.marker,
        content: listItem.content,
        lineStart,
        lineEnd,
        markerEndPos: lineStart + listItem.indent.length + listItem.marker.length + listItem.separator.length
      };
    }

    return {
      inList: true,
      listType: 'numbered',
      indent: listItem.indent,
      marker: Number.parseInt(listItem.marker, 10),
      content: listItem.content,
      lineStart,
      lineEnd,
      markerEndPos: lineStart + listItem.indent.length + listItem.marker.length + listItem.separator.length
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
