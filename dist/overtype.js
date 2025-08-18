/**
 * OverType v1.1.0
 * A lightweight markdown editor library with perfect WYSIWYG alignment
 * @license MIT
 * @author Demo User
 * https://github.com/demo/overtype
 */
var OverType = (() => {
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
  var __publicField = (obj, key, value) => {
    __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
    return value;
  };

  // src/overtype.js
  var overtype_exports = {};
  __export(overtype_exports, {
    OverType: () => OverType,
    default: () => overtype_default
  });

  // src/parser.js
  var MarkdownParser = class {
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
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
      };
      return text.replace(/[&<>"']/g, (m) => map[m]);
    }
    /**
     * Preserve leading spaces as non-breaking spaces
     * @param {string} html - HTML string
     * @param {string} originalLine - Original line with spaces
     * @returns {string} HTML with preserved indentation
     */
    static preserveIndentation(html, originalLine) {
      const leadingSpaces = originalLine.match(/^(\s*)/)[1];
      const indentation = leadingSpaces.replace(/ /g, "&nbsp;");
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
        const levelClasses = ["h1", "h2", "h3"];
        return `<span class="header ${levelClasses[level - 1]}"><span class="syntax-marker">${hashes}</span> ${content}</span>`;
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
      if (html.startsWith("```")) {
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
      html = html.replace(new RegExp("(?<!\\*)\\*(?!\\*)(.+?)(?<!\\*)\\*(?!\\*)", "g"), '<em><span class="syntax-marker">*</span>$1<span class="syntax-marker">*</span></em>');
      html = html.replace(new RegExp("(?<!_)_(?!_)(.+?)(?<!_)_(?!_)", "g"), '<em><span class="syntax-marker">_</span>$1<span class="syntax-marker">_</span></em>');
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
      return html.replace(/\[(.+?)\]\((.+?)\)/g, (match, text, url) => {
        const anchorName = `--link-${this.linkIndex++}`;
        return `<a href="${url}" style="anchor-name: ${anchorName}"><span class="syntax-marker">[</span>${text}<span class="syntax-marker">](</span><span class="syntax-marker">${url}</span><span class="syntax-marker">)</span></a>`;
      });
    }
    /**
     * Parse all inline elements in correct order
     * @param {string} text - Text with potential inline markdown
     * @returns {string} HTML with all inline styling
     */
    static parseInlineElements(text) {
      let html = text;
      html = this.parseInlineCode(html);
      const codeBlocks = /* @__PURE__ */ new Map();
      html = html.replace(/(<code>.*?<\/code>)/g, (match) => {
        const placeholder = `\uE000${codeBlocks.size}\uE001`;
        codeBlocks.set(placeholder, match);
        return placeholder;
      });
      html = this.parseLinks(html);
      html = this.parseBold(html);
      html = this.parseItalic(html);
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
      html = this.preserveIndentation(html, line);
      const horizontalRule = this.parseHorizontalRule(html);
      if (horizontalRule)
        return horizontalRule;
      const codeBlock = this.parseCodeBlock(html);
      if (codeBlock)
        return codeBlock;
      html = this.parseHeader(html);
      html = this.parseBlockquote(html);
      html = this.parseBulletList(html);
      html = this.parseNumberedList(html);
      html = this.parseInlineElements(html);
      if (html.trim() === "") {
        return "<div>&nbsp;</div>";
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
      this.resetLinkIndex();
      const lines = text.split("\n");
      const parsedLines = lines.map((line, index) => {
        if (showActiveLineRaw && index === activeLine) {
          const content = this.escapeHtml(line) || "&nbsp;";
          return `<div class="raw-line">${content}</div>`;
        }
        return this.parseLine(line);
      });
      return parsedLines.join("");
    }
  };
  // Track link index for anchor naming
  __publicField(MarkdownParser, "linkIndex", 0);

  // node_modules/markdown-actions/dist/markdown-actions.esm.js
  var __defProp2 = Object.defineProperty;
  var __getOwnPropSymbols = Object.getOwnPropertySymbols;
  var __hasOwnProp2 = Object.prototype.hasOwnProperty;
  var __propIsEnum = Object.prototype.propertyIsEnumerable;
  var __defNormalProp2 = (obj, key, value) => key in obj ? __defProp2(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __spreadValues = (a, b) => {
    for (var prop in b || (b = {}))
      if (__hasOwnProp2.call(b, prop))
        __defNormalProp2(a, prop, b[prop]);
    if (__getOwnPropSymbols)
      for (var prop of __getOwnPropSymbols(b)) {
        if (__propIsEnum.call(b, prop))
          __defNormalProp2(a, prop, b[prop]);
      }
    return a;
  };
  var FORMATS = {
    bold: {
      prefix: "**",
      suffix: "**",
      trimFirst: true
    },
    italic: {
      prefix: "_",
      suffix: "_",
      trimFirst: true
    },
    code: {
      prefix: "`",
      suffix: "`",
      blockPrefix: "```",
      blockSuffix: "```"
    },
    link: {
      prefix: "[",
      suffix: "](url)",
      replaceNext: "url",
      scanFor: "https?://"
    },
    bulletList: {
      prefix: "- ",
      multiline: true,
      unorderedList: true
    },
    numberedList: {
      prefix: "1. ",
      multiline: true,
      orderedList: true
    },
    quote: {
      prefix: "> ",
      multiline: true,
      surroundWithNewlines: true
    },
    taskList: {
      prefix: "- [ ] ",
      multiline: true,
      surroundWithNewlines: true
    },
    header1: { prefix: "# " },
    header2: { prefix: "## " },
    header3: { prefix: "### " },
    header4: { prefix: "#### " },
    header5: { prefix: "##### " },
    header6: { prefix: "###### " }
  };
  function getDefaultStyle() {
    return {
      prefix: "",
      suffix: "",
      blockPrefix: "",
      blockSuffix: "",
      multiline: false,
      replaceNext: "",
      prefixSpace: false,
      scanFor: "",
      surroundWithNewlines: false,
      orderedList: false,
      unorderedList: false,
      trimFirst: false
    };
  }
  function mergeWithDefaults(format) {
    return __spreadValues(__spreadValues({}, getDefaultStyle()), format);
  }
  var debugMode = false;
  function getDebugMode() {
    return debugMode;
  }
  function debugLog(funcName, message, data) {
    if (!debugMode)
      return;
    console.group(`\u{1F50D} ${funcName}`);
    console.log(message);
    if (data) {
      console.log("Data:", data);
    }
    console.groupEnd();
  }
  function debugSelection(textarea, label) {
    if (!debugMode)
      return;
    const selected = textarea.value.slice(textarea.selectionStart, textarea.selectionEnd);
    console.group(`\u{1F4CD} Selection: ${label}`);
    console.log("Position:", `${textarea.selectionStart}-${textarea.selectionEnd}`);
    console.log("Selected text:", JSON.stringify(selected));
    console.log("Length:", selected.length);
    const before = textarea.value.slice(Math.max(0, textarea.selectionStart - 10), textarea.selectionStart);
    const after = textarea.value.slice(textarea.selectionEnd, Math.min(textarea.value.length, textarea.selectionEnd + 10));
    console.log("Context:", JSON.stringify(before) + "[SELECTION]" + JSON.stringify(after));
    console.groupEnd();
  }
  function debugResult(result) {
    if (!debugMode)
      return;
    console.group("\u{1F4DD} Result");
    console.log("Text to insert:", JSON.stringify(result.text));
    console.log("New selection:", `${result.selectionStart}-${result.selectionEnd}`);
    console.groupEnd();
  }
  var canInsertText = null;
  function insertText(textarea, { text, selectionStart, selectionEnd }) {
    const debugMode2 = getDebugMode();
    if (debugMode2) {
      console.group("\u{1F527} insertText");
      console.log("Current selection:", `${textarea.selectionStart}-${textarea.selectionEnd}`);
      console.log("Text to insert:", JSON.stringify(text));
      console.log("New selection to set:", selectionStart, "-", selectionEnd);
    }
    textarea.focus();
    const originalSelectionStart = textarea.selectionStart;
    const originalSelectionEnd = textarea.selectionEnd;
    const before = textarea.value.slice(0, originalSelectionStart);
    const after = textarea.value.slice(originalSelectionEnd);
    if (debugMode2) {
      console.log("Before text (last 20):", JSON.stringify(before.slice(-20)));
      console.log("After text (first 20):", JSON.stringify(after.slice(0, 20)));
      console.log("Selected text being replaced:", JSON.stringify(textarea.value.slice(originalSelectionStart, originalSelectionEnd)));
    }
    const originalValue = textarea.value;
    const hasSelection = originalSelectionStart !== originalSelectionEnd;
    if (canInsertText === null || canInsertText === true) {
      textarea.contentEditable = "true";
      try {
        canInsertText = document.execCommand("insertText", false, text);
        if (debugMode2)
          console.log("execCommand returned:", canInsertText, "for text with", text.split("\n").length, "lines");
      } catch (error) {
        canInsertText = false;
        if (debugMode2)
          console.log("execCommand threw error:", error);
      }
      textarea.contentEditable = "false";
    }
    if (debugMode2) {
      console.log("canInsertText before:", canInsertText);
      console.log("execCommand result:", canInsertText);
    }
    if (canInsertText) {
      const expectedValue = before + text + after;
      const actualValue = textarea.value;
      if (debugMode2) {
        console.log("Expected length:", expectedValue.length);
        console.log("Actual length:", actualValue.length);
      }
      if (actualValue !== expectedValue) {
        if (debugMode2) {
          console.log("execCommand changed the value but not as expected");
          console.log("Expected:", JSON.stringify(expectedValue.slice(0, 100)));
          console.log("Actual:", JSON.stringify(actualValue.slice(0, 100)));
        }
      }
    }
    if (!canInsertText) {
      if (debugMode2)
        console.log("Using manual insertion");
      if (textarea.value === originalValue) {
        if (debugMode2)
          console.log("Value unchanged, doing manual replacement");
        try {
          document.execCommand("ms-beginUndoUnit");
        } catch (e) {
        }
        textarea.value = before + text + after;
        try {
          document.execCommand("ms-endUndoUnit");
        } catch (e) {
        }
        textarea.dispatchEvent(new CustomEvent("input", { bubbles: true, cancelable: true }));
      } else {
        if (debugMode2)
          console.log("Value was changed by execCommand, skipping manual insertion");
      }
    }
    if (debugMode2)
      console.log("Setting selection range:", selectionStart, selectionEnd);
    if (selectionStart != null && selectionEnd != null) {
      textarea.setSelectionRange(selectionStart, selectionEnd);
    } else {
      textarea.setSelectionRange(originalSelectionStart, textarea.selectionEnd);
    }
    if (debugMode2) {
      console.log("Final value length:", textarea.value.length);
      console.groupEnd();
    }
  }
  function isMultipleLines(string) {
    return string.trim().split("\n").length > 1;
  }
  function wordSelectionStart(text, i) {
    let index = i;
    while (text[index] && text[index - 1] != null && !text[index - 1].match(/\s/)) {
      index--;
    }
    return index;
  }
  function wordSelectionEnd(text, i, multiline) {
    let index = i;
    const breakpoint = multiline ? /\n/ : /\s/;
    while (text[index] && !text[index].match(breakpoint)) {
      index++;
    }
    return index;
  }
  function expandSelectionToLine(textarea) {
    const lines = textarea.value.split("\n");
    let counter = 0;
    for (let index = 0; index < lines.length; index++) {
      const lineLength = lines[index].length + 1;
      if (textarea.selectionStart >= counter && textarea.selectionStart < counter + lineLength) {
        textarea.selectionStart = counter;
      }
      if (textarea.selectionEnd >= counter && textarea.selectionEnd < counter + lineLength) {
        if (index === lines.length - 1) {
          textarea.selectionEnd = Math.min(counter + lines[index].length, textarea.value.length);
        } else {
          textarea.selectionEnd = counter + lineLength - 1;
        }
      }
      counter += lineLength;
    }
  }
  function expandSelectedText(textarea, prefixToUse, suffixToUse, multiline = false) {
    if (textarea.selectionStart === textarea.selectionEnd) {
      textarea.selectionStart = wordSelectionStart(textarea.value, textarea.selectionStart);
      textarea.selectionEnd = wordSelectionEnd(textarea.value, textarea.selectionEnd, multiline);
    } else {
      const expandedSelectionStart = textarea.selectionStart - prefixToUse.length;
      const expandedSelectionEnd = textarea.selectionEnd + suffixToUse.length;
      const beginsWithPrefix = textarea.value.slice(expandedSelectionStart, textarea.selectionStart) === prefixToUse;
      const endsWithSuffix = textarea.value.slice(textarea.selectionEnd, expandedSelectionEnd) === suffixToUse;
      if (beginsWithPrefix && endsWithSuffix) {
        textarea.selectionStart = expandedSelectionStart;
        textarea.selectionEnd = expandedSelectionEnd;
      }
    }
    return textarea.value.slice(textarea.selectionStart, textarea.selectionEnd);
  }
  function newlinesToSurroundSelectedText(textarea) {
    const beforeSelection = textarea.value.slice(0, textarea.selectionStart);
    const afterSelection = textarea.value.slice(textarea.selectionEnd);
    const breaksBefore = beforeSelection.match(/\n*$/);
    const breaksAfter = afterSelection.match(/^\n*/);
    const newlinesBeforeSelection = breaksBefore ? breaksBefore[0].length : 0;
    const newlinesAfterSelection = breaksAfter ? breaksAfter[0].length : 0;
    let newlinesToAppend = "";
    let newlinesToPrepend = "";
    if (beforeSelection.match(/\S/) && newlinesBeforeSelection < 2) {
      newlinesToAppend = "\n".repeat(2 - newlinesBeforeSelection);
    }
    if (afterSelection.match(/\S/) && newlinesAfterSelection < 2) {
      newlinesToPrepend = "\n".repeat(2 - newlinesAfterSelection);
    }
    return { newlinesToAppend, newlinesToPrepend };
  }
  function applyLineOperation(textarea, operation, options = {}) {
    const originalStart = textarea.selectionStart;
    const originalEnd = textarea.selectionEnd;
    const noInitialSelection = originalStart === originalEnd;
    const value = textarea.value;
    let lineStart = originalStart;
    while (lineStart > 0 && value[lineStart - 1] !== "\n") {
      lineStart--;
    }
    if (noInitialSelection) {
      let lineEnd = originalStart;
      while (lineEnd < value.length && value[lineEnd] !== "\n") {
        lineEnd++;
      }
      textarea.selectionStart = lineStart;
      textarea.selectionEnd = lineEnd;
    } else {
      expandSelectionToLine(textarea);
    }
    const result = operation(textarea);
    if (options.adjustSelection) {
      const selectedText = textarea.value.slice(textarea.selectionStart, textarea.selectionEnd);
      const isRemoving = selectedText.startsWith(options.prefix);
      const adjusted = options.adjustSelection(isRemoving, originalStart, originalEnd, lineStart);
      result.selectionStart = adjusted.start;
      result.selectionEnd = adjusted.end;
    } else if (options.prefix) {
      const selectedText = textarea.value.slice(textarea.selectionStart, textarea.selectionEnd);
      const isRemoving = selectedText.startsWith(options.prefix);
      if (noInitialSelection) {
        if (isRemoving) {
          result.selectionStart = Math.max(originalStart - options.prefix.length, lineStart);
          result.selectionEnd = result.selectionStart;
        } else {
          result.selectionStart = originalStart + options.prefix.length;
          result.selectionEnd = result.selectionStart;
        }
      } else {
        if (isRemoving) {
          result.selectionStart = Math.max(originalStart - options.prefix.length, lineStart);
          result.selectionEnd = Math.max(originalEnd - options.prefix.length, lineStart);
        } else {
          result.selectionStart = originalStart + options.prefix.length;
          result.selectionEnd = originalEnd + options.prefix.length;
        }
      }
    }
    return result;
  }
  function blockStyle(textarea, style) {
    let newlinesToAppend;
    let newlinesToPrepend;
    const { prefix, suffix, blockPrefix, blockSuffix, replaceNext, prefixSpace, scanFor, surroundWithNewlines, trimFirst } = style;
    const originalSelectionStart = textarea.selectionStart;
    const originalSelectionEnd = textarea.selectionEnd;
    let selectedText = textarea.value.slice(textarea.selectionStart, textarea.selectionEnd);
    let prefixToUse = isMultipleLines(selectedText) && blockPrefix && blockPrefix.length > 0 ? `${blockPrefix}
` : prefix;
    let suffixToUse = isMultipleLines(selectedText) && blockSuffix && blockSuffix.length > 0 ? `
${blockSuffix}` : suffix;
    if (prefixSpace) {
      const beforeSelection = textarea.value[textarea.selectionStart - 1];
      if (textarea.selectionStart !== 0 && beforeSelection != null && !beforeSelection.match(/\s/)) {
        prefixToUse = ` ${prefixToUse}`;
      }
    }
    selectedText = expandSelectedText(textarea, prefixToUse, suffixToUse, style.multiline);
    let selectionStart = textarea.selectionStart;
    let selectionEnd = textarea.selectionEnd;
    const hasReplaceNext = replaceNext && replaceNext.length > 0 && suffixToUse.indexOf(replaceNext) > -1 && selectedText.length > 0;
    if (surroundWithNewlines) {
      const ref = newlinesToSurroundSelectedText(textarea);
      newlinesToAppend = ref.newlinesToAppend;
      newlinesToPrepend = ref.newlinesToPrepend;
      prefixToUse = newlinesToAppend + prefix;
      suffixToUse += newlinesToPrepend;
    }
    if (selectedText.startsWith(prefixToUse) && selectedText.endsWith(suffixToUse)) {
      const replacementText = selectedText.slice(prefixToUse.length, selectedText.length - suffixToUse.length);
      if (originalSelectionStart === originalSelectionEnd) {
        let position = originalSelectionStart - prefixToUse.length;
        position = Math.max(position, selectionStart);
        position = Math.min(position, selectionStart + replacementText.length);
        selectionStart = selectionEnd = position;
      } else {
        selectionEnd = selectionStart + replacementText.length;
      }
      return { text: replacementText, selectionStart, selectionEnd };
    } else if (!hasReplaceNext) {
      let replacementText = prefixToUse + selectedText + suffixToUse;
      selectionStart = originalSelectionStart + prefixToUse.length;
      selectionEnd = originalSelectionEnd + prefixToUse.length;
      const whitespaceEdges = selectedText.match(/^\s*|\s*$/g);
      if (trimFirst && whitespaceEdges) {
        const leadingWhitespace = whitespaceEdges[0] || "";
        const trailingWhitespace = whitespaceEdges[1] || "";
        replacementText = leadingWhitespace + prefixToUse + selectedText.trim() + suffixToUse + trailingWhitespace;
        selectionStart += leadingWhitespace.length;
        selectionEnd -= trailingWhitespace.length;
      }
      return { text: replacementText, selectionStart, selectionEnd };
    } else if (scanFor && scanFor.length > 0 && selectedText.match(scanFor)) {
      suffixToUse = suffixToUse.replace(replaceNext, selectedText);
      const replacementText = prefixToUse + suffixToUse;
      selectionStart = selectionEnd = selectionStart + prefixToUse.length;
      return { text: replacementText, selectionStart, selectionEnd };
    } else {
      const replacementText = prefixToUse + selectedText + suffixToUse;
      selectionStart = selectionStart + prefixToUse.length + selectedText.length + suffixToUse.indexOf(replaceNext);
      selectionEnd = selectionStart + replaceNext.length;
      return { text: replacementText, selectionStart, selectionEnd };
    }
  }
  function multilineStyle(textarea, style) {
    const { prefix, suffix, surroundWithNewlines } = style;
    let text = textarea.value.slice(textarea.selectionStart, textarea.selectionEnd);
    let selectionStart = textarea.selectionStart;
    let selectionEnd = textarea.selectionEnd;
    const lines = text.split("\n");
    const undoStyle = lines.every((line) => line.startsWith(prefix) && (!suffix || line.endsWith(suffix)));
    if (undoStyle) {
      text = lines.map((line) => {
        let result = line.slice(prefix.length);
        if (suffix) {
          result = result.slice(0, result.length - suffix.length);
        }
        return result;
      }).join("\n");
      selectionEnd = selectionStart + text.length;
    } else {
      text = lines.map((line) => prefix + line + (suffix || "")).join("\n");
      if (surroundWithNewlines) {
        const { newlinesToAppend, newlinesToPrepend } = newlinesToSurroundSelectedText(textarea);
        selectionStart += newlinesToAppend.length;
        selectionEnd = selectionStart + text.length;
        text = newlinesToAppend + text + newlinesToPrepend;
      }
    }
    return { text, selectionStart, selectionEnd };
  }
  function undoOrderedListStyle(text) {
    const lines = text.split("\n");
    const orderedListRegex = /^\d+\.\s+/;
    const shouldUndoOrderedList = lines.every((line) => orderedListRegex.test(line));
    let result = lines;
    if (shouldUndoOrderedList) {
      result = lines.map((line) => line.replace(orderedListRegex, ""));
    }
    return {
      text: result.join("\n"),
      processed: shouldUndoOrderedList
    };
  }
  function undoUnorderedListStyle(text) {
    const lines = text.split("\n");
    const unorderedListPrefix = "- ";
    const shouldUndoUnorderedList = lines.every((line) => line.startsWith(unorderedListPrefix));
    let result = lines;
    if (shouldUndoUnorderedList) {
      result = lines.map((line) => line.slice(unorderedListPrefix.length));
    }
    return {
      text: result.join("\n"),
      processed: shouldUndoUnorderedList
    };
  }
  function makePrefix(index, unorderedList) {
    if (unorderedList) {
      return "- ";
    } else {
      return `${index + 1}. `;
    }
  }
  function clearExistingListStyle(style, selectedText) {
    let undoResult;
    let undoResultOppositeList;
    let pristineText;
    if (style.orderedList) {
      undoResult = undoOrderedListStyle(selectedText);
      undoResultOppositeList = undoUnorderedListStyle(undoResult.text);
      pristineText = undoResultOppositeList.text;
    } else {
      undoResult = undoUnorderedListStyle(selectedText);
      undoResultOppositeList = undoOrderedListStyle(undoResult.text);
      pristineText = undoResultOppositeList.text;
    }
    return [undoResult, undoResultOppositeList, pristineText];
  }
  function listStyle(textarea, style) {
    const noInitialSelection = textarea.selectionStart === textarea.selectionEnd;
    let selectionStart = textarea.selectionStart;
    let selectionEnd = textarea.selectionEnd;
    expandSelectionToLine(textarea);
    const selectedText = textarea.value.slice(textarea.selectionStart, textarea.selectionEnd);
    const [undoResult, undoResultOppositeList, pristineText] = clearExistingListStyle(style, selectedText);
    const prefixedLines = pristineText.split("\n").map((value, index) => {
      return `${makePrefix(index, style.unorderedList)}${value}`;
    });
    const totalPrefixLength = prefixedLines.reduce((previousValue, _currentValue, currentIndex) => {
      return previousValue + makePrefix(currentIndex, style.unorderedList).length;
    }, 0);
    const totalPrefixLengthOppositeList = prefixedLines.reduce((previousValue, _currentValue, currentIndex) => {
      return previousValue + makePrefix(currentIndex, !style.unorderedList).length;
    }, 0);
    if (undoResult.processed) {
      if (noInitialSelection) {
        selectionStart = Math.max(selectionStart - makePrefix(0, style.unorderedList).length, 0);
        selectionEnd = selectionStart;
      } else {
        selectionStart = textarea.selectionStart;
        selectionEnd = textarea.selectionEnd - totalPrefixLength;
      }
      return { text: pristineText, selectionStart, selectionEnd };
    }
    const { newlinesToAppend, newlinesToPrepend } = newlinesToSurroundSelectedText(textarea);
    const text = newlinesToAppend + prefixedLines.join("\n") + newlinesToPrepend;
    if (noInitialSelection) {
      selectionStart = Math.max(selectionStart + makePrefix(0, style.unorderedList).length + newlinesToAppend.length, 0);
      selectionEnd = selectionStart;
    } else {
      if (undoResultOppositeList.processed) {
        selectionStart = Math.max(textarea.selectionStart + newlinesToAppend.length, 0);
        selectionEnd = textarea.selectionEnd + newlinesToAppend.length + totalPrefixLength - totalPrefixLengthOppositeList;
      } else {
        selectionStart = Math.max(textarea.selectionStart + newlinesToAppend.length, 0);
        selectionEnd = textarea.selectionEnd + newlinesToAppend.length + totalPrefixLength;
      }
    }
    return { text, selectionStart, selectionEnd };
  }
  function applyListStyle(textarea, style) {
    const result = applyLineOperation(
      textarea,
      (ta) => listStyle(ta, style),
      {
        // Custom selection adjustment for lists
        adjustSelection: (isRemoving, selStart, selEnd, lineStart) => {
          const currentLine = textarea.value.slice(lineStart, textarea.selectionEnd);
          const orderedListRegex = /^\d+\.\s+/;
          const unorderedListRegex = /^- /;
          const hasOrderedList = orderedListRegex.test(currentLine);
          const hasUnorderedList = unorderedListRegex.test(currentLine);
          const isRemovingCurrent = style.orderedList && hasOrderedList || style.unorderedList && hasUnorderedList;
          if (selStart === selEnd) {
            if (isRemovingCurrent) {
              const prefixMatch = currentLine.match(style.orderedList ? orderedListRegex : unorderedListRegex);
              const prefixLength = prefixMatch ? prefixMatch[0].length : 0;
              return {
                start: Math.max(selStart - prefixLength, lineStart),
                end: Math.max(selStart - prefixLength, lineStart)
              };
            } else if (hasOrderedList || hasUnorderedList) {
              const oldPrefixMatch = currentLine.match(hasOrderedList ? orderedListRegex : unorderedListRegex);
              const oldPrefixLength = oldPrefixMatch ? oldPrefixMatch[0].length : 0;
              const newPrefixLength = style.unorderedList ? 2 : 3;
              const adjustment = newPrefixLength - oldPrefixLength;
              return {
                start: selStart + adjustment,
                end: selStart + adjustment
              };
            } else {
              const prefixLength = style.unorderedList ? 2 : 3;
              return {
                start: selStart + prefixLength,
                end: selStart + prefixLength
              };
            }
          } else {
            if (isRemovingCurrent) {
              const prefixMatch = currentLine.match(style.orderedList ? orderedListRegex : unorderedListRegex);
              const prefixLength = prefixMatch ? prefixMatch[0].length : 0;
              return {
                start: Math.max(selStart - prefixLength, lineStart),
                end: Math.max(selEnd - prefixLength, lineStart)
              };
            } else if (hasOrderedList || hasUnorderedList) {
              const oldPrefixMatch = currentLine.match(hasOrderedList ? orderedListRegex : unorderedListRegex);
              const oldPrefixLength = oldPrefixMatch ? oldPrefixMatch[0].length : 0;
              const newPrefixLength = style.unorderedList ? 2 : 3;
              const adjustment = newPrefixLength - oldPrefixLength;
              return {
                start: selStart + adjustment,
                end: selEnd + adjustment
              };
            } else {
              const prefixLength = style.unorderedList ? 2 : 3;
              return {
                start: selStart + prefixLength,
                end: selEnd + prefixLength
              };
            }
          }
        }
      }
    );
    insertText(textarea, result);
  }
  function getActiveFormats(textarea) {
    if (!textarea)
      return [];
    const formats = [];
    const { selectionStart, selectionEnd, value } = textarea;
    const lines = value.split("\n");
    let lineStart = 0;
    let currentLine = "";
    for (const line of lines) {
      if (selectionStart >= lineStart && selectionStart <= lineStart + line.length) {
        currentLine = line;
        break;
      }
      lineStart += line.length + 1;
    }
    if (currentLine.startsWith("- ")) {
      if (currentLine.startsWith("- [ ] ") || currentLine.startsWith("- [x] ")) {
        formats.push("task-list");
      } else {
        formats.push("bullet-list");
      }
    }
    if (/^\d+\.\s/.test(currentLine)) {
      formats.push("numbered-list");
    }
    if (currentLine.startsWith("> ")) {
      formats.push("quote");
    }
    if (currentLine.startsWith("# "))
      formats.push("header");
    if (currentLine.startsWith("## "))
      formats.push("header-2");
    if (currentLine.startsWith("### "))
      formats.push("header-3");
    const lookBehind = Math.max(0, selectionStart - 10);
    const lookAhead = Math.min(value.length, selectionEnd + 10);
    const surrounding = value.slice(lookBehind, lookAhead);
    if (surrounding.includes("**")) {
      const beforeCursor = value.slice(Math.max(0, selectionStart - 100), selectionStart);
      const afterCursor = value.slice(selectionEnd, Math.min(value.length, selectionEnd + 100));
      const lastOpenBold = beforeCursor.lastIndexOf("**");
      const nextCloseBold = afterCursor.indexOf("**");
      if (lastOpenBold !== -1 && nextCloseBold !== -1) {
        formats.push("bold");
      }
    }
    if (surrounding.includes("_")) {
      const beforeCursor = value.slice(Math.max(0, selectionStart - 100), selectionStart);
      const afterCursor = value.slice(selectionEnd, Math.min(value.length, selectionEnd + 100));
      const lastOpenItalic = beforeCursor.lastIndexOf("_");
      const nextCloseItalic = afterCursor.indexOf("_");
      if (lastOpenItalic !== -1 && nextCloseItalic !== -1) {
        formats.push("italic");
      }
    }
    if (surrounding.includes("`")) {
      const beforeCursor = value.slice(Math.max(0, selectionStart - 100), selectionStart);
      const afterCursor = value.slice(selectionEnd, Math.min(value.length, selectionEnd + 100));
      if (beforeCursor.includes("`") && afterCursor.includes("`")) {
        formats.push("code");
      }
    }
    if (surrounding.includes("[") && surrounding.includes("]")) {
      const beforeCursor = value.slice(Math.max(0, selectionStart - 100), selectionStart);
      const afterCursor = value.slice(selectionEnd, Math.min(value.length, selectionEnd + 100));
      const lastOpenBracket = beforeCursor.lastIndexOf("[");
      const nextCloseBracket = afterCursor.indexOf("]");
      if (lastOpenBracket !== -1 && nextCloseBracket !== -1) {
        const afterBracket = value.slice(selectionEnd + nextCloseBracket + 1, selectionEnd + nextCloseBracket + 10);
        if (afterBracket.startsWith("(")) {
          formats.push("link");
        }
      }
    }
    return formats;
  }
  function toggleBold(textarea) {
    if (!textarea || textarea.disabled || textarea.readOnly)
      return;
    debugLog("toggleBold", "Starting");
    debugSelection(textarea, "Before");
    const style = mergeWithDefaults(FORMATS.bold);
    const result = blockStyle(textarea, style);
    debugResult(result);
    insertText(textarea, result);
    debugSelection(textarea, "After");
  }
  function toggleItalic(textarea) {
    if (!textarea || textarea.disabled || textarea.readOnly)
      return;
    const style = mergeWithDefaults(FORMATS.italic);
    const result = blockStyle(textarea, style);
    insertText(textarea, result);
  }
  function toggleCode(textarea) {
    if (!textarea || textarea.disabled || textarea.readOnly)
      return;
    const style = mergeWithDefaults(FORMATS.code);
    const result = blockStyle(textarea, style);
    insertText(textarea, result);
  }
  function insertLink(textarea, options = {}) {
    if (!textarea || textarea.disabled || textarea.readOnly)
      return;
    const selectedText = textarea.value.slice(textarea.selectionStart, textarea.selectionEnd);
    let style = mergeWithDefaults(FORMATS.link);
    const isURL = selectedText && selectedText.match(/^https?:\/\//);
    if (isURL && !options.url) {
      style.suffix = `](${selectedText})`;
      style.replaceNext = "";
    } else if (options.url) {
      style.suffix = `](${options.url})`;
      style.replaceNext = "";
    }
    if (options.text && !selectedText) {
      const pos = textarea.selectionStart;
      textarea.value = textarea.value.slice(0, pos) + options.text + textarea.value.slice(pos);
      textarea.selectionStart = pos;
      textarea.selectionEnd = pos + options.text.length;
    }
    const result = blockStyle(textarea, style);
    insertText(textarea, result);
  }
  function toggleBulletList(textarea) {
    if (!textarea || textarea.disabled || textarea.readOnly)
      return;
    const style = mergeWithDefaults(FORMATS.bulletList);
    applyListStyle(textarea, style);
  }
  function toggleNumberedList(textarea) {
    if (!textarea || textarea.disabled || textarea.readOnly)
      return;
    const style = mergeWithDefaults(FORMATS.numberedList);
    applyListStyle(textarea, style);
  }
  function toggleQuote(textarea) {
    if (!textarea || textarea.disabled || textarea.readOnly)
      return;
    debugLog("toggleQuote", "Starting");
    debugSelection(textarea, "Initial");
    const style = mergeWithDefaults(FORMATS.quote);
    const result = applyLineOperation(
      textarea,
      (ta) => multilineStyle(ta, style),
      { prefix: style.prefix }
    );
    debugResult(result);
    insertText(textarea, result);
    debugSelection(textarea, "Final");
  }
  function toggleTaskList(textarea) {
    if (!textarea || textarea.disabled || textarea.readOnly)
      return;
    const style = mergeWithDefaults(FORMATS.taskList);
    const result = applyLineOperation(
      textarea,
      (ta) => multilineStyle(ta, style),
      { prefix: style.prefix }
    );
    insertText(textarea, result);
  }
  function insertHeader(textarea, level = 1, toggle = false) {
    if (!textarea || textarea.disabled || textarea.readOnly)
      return;
    if (level < 1 || level > 6)
      level = 1;
    debugLog("insertHeader", `============ START ============`);
    debugLog("insertHeader", `Level: ${level}, Toggle: ${toggle}`);
    debugLog("insertHeader", `Initial cursor: ${textarea.selectionStart}-${textarea.selectionEnd}`);
    const headerKey = `header${level === 1 ? "1" : level}`;
    const style = mergeWithDefaults(FORMATS[headerKey] || FORMATS.header1);
    debugLog("insertHeader", `Style prefix: "${style.prefix}"`);
    const value = textarea.value;
    const originalStart = textarea.selectionStart;
    const originalEnd = textarea.selectionEnd;
    let lineStart = originalStart;
    while (lineStart > 0 && value[lineStart - 1] !== "\n") {
      lineStart--;
    }
    let lineEnd = originalEnd;
    while (lineEnd < value.length && value[lineEnd] !== "\n") {
      lineEnd++;
    }
    const currentLineContent = value.slice(lineStart, lineEnd);
    debugLog("insertHeader", `Current line (before): "${currentLineContent}"`);
    const existingHeaderMatch = currentLineContent.match(/^(#{1,6})\s*/);
    const existingLevel = existingHeaderMatch ? existingHeaderMatch[1].length : 0;
    const existingPrefixLength = existingHeaderMatch ? existingHeaderMatch[0].length : 0;
    debugLog("insertHeader", `Existing header check:`);
    debugLog("insertHeader", `  - Match: ${existingHeaderMatch ? `"${existingHeaderMatch[0]}"` : "none"}`);
    debugLog("insertHeader", `  - Existing level: ${existingLevel}`);
    debugLog("insertHeader", `  - Existing prefix length: ${existingPrefixLength}`);
    debugLog("insertHeader", `  - Target level: ${level}`);
    const shouldToggleOff = toggle && existingLevel === level;
    debugLog("insertHeader", `Should toggle OFF: ${shouldToggleOff} (toggle=${toggle}, existingLevel=${existingLevel}, level=${level})`);
    const result = applyLineOperation(
      textarea,
      (ta) => {
        const currentLine = ta.value.slice(ta.selectionStart, ta.selectionEnd);
        debugLog("insertHeader", `Line in operation: "${currentLine}"`);
        const cleanedLine = currentLine.replace(/^#{1,6}\s*/, "");
        debugLog("insertHeader", `Cleaned line: "${cleanedLine}"`);
        let newLine;
        if (shouldToggleOff) {
          debugLog("insertHeader", "ACTION: Toggling OFF - removing header");
          newLine = cleanedLine;
        } else if (existingLevel > 0) {
          debugLog("insertHeader", `ACTION: Replacing H${existingLevel} with H${level}`);
          newLine = style.prefix + cleanedLine;
        } else {
          debugLog("insertHeader", "ACTION: Adding new header");
          newLine = style.prefix + cleanedLine;
        }
        debugLog("insertHeader", `New line: "${newLine}"`);
        return {
          text: newLine,
          selectionStart: ta.selectionStart,
          selectionEnd: ta.selectionEnd
        };
      },
      {
        prefix: style.prefix,
        // Custom selection adjustment for headers
        adjustSelection: (isRemoving, selStart, selEnd, lineStartPos) => {
          debugLog("insertHeader", `Adjusting selection:`);
          debugLog("insertHeader", `  - isRemoving param: ${isRemoving}`);
          debugLog("insertHeader", `  - shouldToggleOff: ${shouldToggleOff}`);
          debugLog("insertHeader", `  - selStart: ${selStart}, selEnd: ${selEnd}`);
          debugLog("insertHeader", `  - lineStartPos: ${lineStartPos}`);
          if (shouldToggleOff) {
            const adjustment = Math.max(selStart - existingPrefixLength, lineStartPos);
            debugLog("insertHeader", `  - Removing header, adjusting by -${existingPrefixLength}`);
            return {
              start: adjustment,
              end: selStart === selEnd ? adjustment : Math.max(selEnd - existingPrefixLength, lineStartPos)
            };
          } else if (existingPrefixLength > 0) {
            const prefixDiff = style.prefix.length - existingPrefixLength;
            debugLog("insertHeader", `  - Replacing header, adjusting by ${prefixDiff}`);
            return {
              start: selStart + prefixDiff,
              end: selEnd + prefixDiff
            };
          } else {
            debugLog("insertHeader", `  - Adding header, adjusting by +${style.prefix.length}`);
            return {
              start: selStart + style.prefix.length,
              end: selEnd + style.prefix.length
            };
          }
        }
      }
    );
    debugLog("insertHeader", `Final result: text="${result.text}", cursor=${result.selectionStart}-${result.selectionEnd}`);
    debugLog("insertHeader", `============ END ============`);
    insertText(textarea, result);
  }
  function toggleH1(textarea) {
    insertHeader(textarea, 1, true);
  }
  function toggleH2(textarea) {
    insertHeader(textarea, 2, true);
  }
  function toggleH3(textarea) {
    insertHeader(textarea, 3, true);
  }
  function getActiveFormats2(textarea) {
    return getActiveFormats(textarea);
  }

  // src/shortcuts.js
  var ShortcutsManager = class {
    constructor(editor) {
      this.editor = editor;
      this.textarea = editor.textarea;
    }
    /**
     * Handle keydown events - called by OverType
     * @param {KeyboardEvent} event - The keyboard event
     * @returns {boolean} Whether the event was handled
     */
    handleKeydown(event) {
      const isMac = navigator.platform.toLowerCase().includes("mac");
      const modKey = isMac ? event.metaKey : event.ctrlKey;
      if (!modKey)
        return false;
      let action = null;
      switch (event.key.toLowerCase()) {
        case "b":
          if (!event.shiftKey) {
            action = "toggleBold";
          }
          break;
        case "i":
          if (!event.shiftKey) {
            action = "toggleItalic";
          }
          break;
        case "k":
          if (!event.shiftKey) {
            action = "insertLink";
          }
          break;
        case "7":
          if (event.shiftKey) {
            action = "toggleNumberedList";
          }
          break;
        case "8":
          if (event.shiftKey) {
            action = "toggleBulletList";
          }
          break;
      }
      if (action) {
        event.preventDefault();
        if (this.editor.toolbar) {
          this.editor.toolbar.handleAction(action);
        } else {
          this.handleAction(action);
        }
        return true;
      }
      return false;
    }
    /**
     * Handle action - fallback when no toolbar exists
     * This duplicates toolbar.handleAction for consistency
     */
    async handleAction(action) {
      const textarea = this.textarea;
      if (!textarea)
        return;
      textarea.focus();
      try {
        switch (action) {
          case "toggleBold":
            toggleBold(textarea);
            break;
          case "toggleItalic":
            toggleItalic(textarea);
            break;
          case "insertLink":
            insertLink(textarea);
            break;
          case "toggleBulletList":
            toggleBulletList(textarea);
            break;
          case "toggleNumberedList":
            toggleNumberedList(textarea);
            break;
        }
        textarea.dispatchEvent(new Event("input", { bubbles: true }));
      } catch (error) {
        console.error("Error in markdown action:", error);
      }
    }
    /**
     * Cleanup
     */
    destroy() {
    }
  };

  // src/themes.js
  var solar = {
    name: "solar",
    colors: {
      bgPrimary: "#faf0ca",
      // Lemon Chiffon - main background
      bgSecondary: "#ffffff",
      // White - editor background
      text: "#0d3b66",
      // Yale Blue - main text
      h1: "#f95738",
      // Tomato - h1 headers
      h2: "#ee964b",
      // Sandy Brown - h2 headers  
      h3: "#3d8a51",
      // Forest green - h3 headers
      strong: "#ee964b",
      // Sandy Brown - bold text
      em: "#f95738",
      // Tomato - italic text
      link: "#0d3b66",
      // Yale Blue - links
      code: "#0d3b66",
      // Yale Blue - inline code
      codeBg: "rgba(244, 211, 94, 0.4)",
      // Naples Yellow with transparency
      blockquote: "#5a7a9b",
      // Muted blue - blockquotes
      hr: "#5a7a9b",
      // Muted blue - horizontal rules
      syntaxMarker: "rgba(13, 59, 102, 0.52)",
      // Yale Blue with transparency
      cursor: "#f95738",
      // Tomato - cursor
      selection: "rgba(244, 211, 94, 0.4)",
      // Naples Yellow with transparency
      listMarker: "#ee964b",
      // Sandy Brown - list markers
      // Toolbar colors
      toolbarBg: "#ffffff",
      // White - toolbar background
      toolbarBorder: "rgba(13, 59, 102, 0.15)",
      // Yale Blue border
      toolbarIcon: "#0d3b66",
      // Yale Blue - icon color
      toolbarHover: "#f5f5f5",
      // Light gray - hover background
      toolbarActive: "#faf0ca"
      // Lemon Chiffon - active button background
    }
  };
  var cave = {
    name: "cave",
    colors: {
      bgPrimary: "#141E26",
      // Deep ocean - main background
      bgSecondary: "#1D2D3E",
      // Darker charcoal - editor background
      text: "#c5dde8",
      // Light blue-gray - main text
      h1: "#d4a5ff",
      // Rich lavender - h1 headers
      h2: "#f6ae2d",
      // Hunyadi Yellow - h2 headers
      h3: "#9fcfec",
      // Brighter blue - h3 headers
      strong: "#f6ae2d",
      // Hunyadi Yellow - bold text
      em: "#9fcfec",
      // Brighter blue - italic text
      link: "#9fcfec",
      // Brighter blue - links
      code: "#c5dde8",
      // Light blue-gray - inline code
      codeBg: "#1a232b",
      // Very dark blue - code background
      blockquote: "#9fcfec",
      // Brighter blue - same as italic
      hr: "#c5dde8",
      // Light blue-gray - horizontal rules
      syntaxMarker: "rgba(159, 207, 236, 0.73)",
      // Brighter blue semi-transparent
      cursor: "#f26419",
      // Orange Pantone - cursor
      selection: "rgba(51, 101, 138, 0.4)",
      // Lapis Lazuli with transparency
      listMarker: "#f6ae2d",
      // Hunyadi Yellow - list markers
      // Toolbar colors for dark theme
      toolbarBg: "#1D2D3E",
      // Darker charcoal - toolbar background
      toolbarBorder: "rgba(197, 221, 232, 0.1)",
      // Light blue-gray border
      toolbarIcon: "#c5dde8",
      // Light blue-gray - icon color
      toolbarHover: "#243546",
      // Slightly lighter charcoal - hover background
      toolbarActive: "#2a3f52"
      // Even lighter - active button background
    }
  };
  var themes = {
    solar,
    cave,
    // Aliases for backward compatibility
    light: solar,
    dark: cave
  };
  function getTheme(theme) {
    if (typeof theme === "string") {
      const themeObj = themes[theme] || themes.solar;
      return { ...themeObj, name: theme };
    }
    return theme;
  }
  function themeToCSSVars(colors) {
    const vars = [];
    for (const [key, value] of Object.entries(colors)) {
      const varName = key.replace(/([A-Z])/g, "-$1").toLowerCase();
      vars.push(`--${varName}: ${value};`);
    }
    return vars.join("\n");
  }
  function mergeTheme(baseTheme, customColors = {}) {
    return {
      ...baseTheme,
      colors: {
        ...baseTheme.colors,
        ...customColors
      }
    };
  }

  // src/styles.js
  function generateStyles(options = {}) {
    const {
      fontSize = "14px",
      lineHeight = 1.6,
      fontFamily = "ui-monospace, 'SFMono-Regular', 'Menlo', 'Consolas', 'Liberation Mono', monospace",
      padding = "20px",
      theme = null,
      mobile = {}
    } = options;
    const mobileStyles = Object.keys(mobile).length > 0 ? `
    @media (max-width: 640px) {
      .overtype-wrapper .overtype-input,
      .overtype-wrapper .overtype-preview {
        ${Object.entries(mobile).map(([prop, val]) => {
      const cssProp = prop.replace(/([A-Z])/g, "-$1").toLowerCase();
      return `${cssProp}: ${val} !important;`;
    }).join("\n        ")}
      }
    }
  ` : "";
    const themeVars = theme && theme.colors ? themeToCSSVars(theme.colors) : "";
    return `
    /* OverType Editor Styles */
    .overtype-container {
      position: relative !important;
      width: 100% !important;
      height: 100% !important;
      ${themeVars ? `
      /* Theme Variables */
      ${themeVars}` : ""}
    }
    
    .overtype-wrapper {
      position: relative !important;
      width: 100% !important;
      height: 100% !important;
      overflow: hidden !important;
      background: var(--bg-secondary, #ffffff) !important;
    }

    /* Critical alignment styles - must be identical for both layers */
    .overtype-wrapper .overtype-input,
    .overtype-wrapper .overtype-preview {
      /* Positioning - must be identical */
      position: absolute !important;
      top: 0 !important;
      left: 0 !important;
      width: 100% !important;
      height: 100% !important;
      
      /* Font properties - any difference breaks alignment */
      font-family: ${fontFamily} !important;
      font-size: var(--instance-font-size, ${fontSize}) !important;
      line-height: var(--instance-line-height, ${lineHeight}) !important;
      font-weight: normal !important;
      font-style: normal !important;
      font-variant: normal !important;
      font-stretch: normal !important;
      font-kerning: none !important;
      font-feature-settings: normal !important;
      
      /* Box model - must match exactly */
      padding: var(--instance-padding, ${padding}) !important;
      margin: 0 !important;
      border: none !important;
      outline: none !important;
      box-sizing: border-box !important;
      
      /* Text layout - critical for character positioning */
      white-space: pre-wrap !important;
      word-wrap: break-word !important;
      word-break: normal !important;
      overflow-wrap: break-word !important;
      tab-size: 2 !important;
      -moz-tab-size: 2 !important;
      text-align: left !important;
      text-indent: 0 !important;
      letter-spacing: normal !important;
      word-spacing: normal !important;
      
      /* Text rendering */
      text-transform: none !important;
      text-rendering: auto !important;
      -webkit-font-smoothing: auto !important;
      -webkit-text-size-adjust: 100% !important;
      
      /* Direction and writing */
      direction: ltr !important;
      writing-mode: horizontal-tb !important;
      unicode-bidi: normal !important;
      text-orientation: mixed !important;
      
      /* Visual effects that could shift perception */
      text-shadow: none !important;
      filter: none !important;
      transform: none !important;
      zoom: 1 !important;
      
      /* Vertical alignment */
      vertical-align: baseline !important;
      
      /* Size constraints */
      min-width: 0 !important;
      min-height: 0 !important;
      max-width: none !important;
      max-height: none !important;
      
      /* Overflow */
      overflow-y: auto !important;
      overflow-x: auto !important;
      scrollbar-width: auto !important;
      scrollbar-gutter: auto !important;
      
      /* Animation/transition - disabled to prevent movement */
      animation: none !important;
      transition: none !important;
    }

    /* Input layer styles */
    .overtype-wrapper .overtype-input {
      /* Layer positioning */
      z-index: 1 !important;
      
      /* Text visibility */
      color: transparent !important;
      caret-color: var(--cursor, #f95738) !important;
      background-color: transparent !important;
      
      /* Textarea-specific */
      resize: none !important;
      appearance: none !important;
      -webkit-appearance: none !important;
      -moz-appearance: none !important;
      
      /* Prevent mobile zoom on focus */
      touch-action: manipulation !important;
      
      /* Disable autofill and spellcheck */
      autocomplete: off !important;
      autocorrect: off !important;
      autocapitalize: off !important;
      spellcheck: false !important;
    }

    .overtype-wrapper .overtype-input::selection {
      background-color: var(--selection, rgba(244, 211, 94, 0.4));
    }

    /* Preview layer styles */
    .overtype-wrapper .overtype-preview {
      /* Layer positioning */
      z-index: 0 !important;
      pointer-events: none !important;
      color: var(--text, #0d3b66) !important;
      background-color: transparent !important;
      
      /* Prevent text selection */
      user-select: none !important;
      -webkit-user-select: none !important;
      -moz-user-select: none !important;
      -ms-user-select: none !important;
    }

    /* Defensive styles for preview child divs */
    .overtype-wrapper .overtype-preview div {
      /* Reset any inherited styles */
      margin: 0 !important;
      padding: 0 !important;
      border: none !important;
      text-align: left !important;
      text-indent: 0 !important;
      display: block !important;
      position: static !important;
      transform: none !important;
      min-height: 0 !important;
      max-height: none !important;
      line-height: inherit !important;
      font-size: inherit !important;
      font-family: inherit !important;
    }

    /* Markdown element styling - NO SIZE CHANGES */
    .overtype-wrapper .overtype-preview .header {
      font-weight: bold !important;
    }

    /* Header colors */
    .overtype-wrapper .overtype-preview .h1 { 
      color: var(--h1, #f95738) !important; 
    }
    .overtype-wrapper .overtype-preview .h2 { 
      color: var(--h2, #ee964b) !important; 
    }
    .overtype-wrapper .overtype-preview .h3 { 
      color: var(--h3, #3d8a51) !important; 
    }

    /* Bold text */
    .overtype-wrapper .overtype-preview strong {
      color: var(--strong, #ee964b) !important;
      font-weight: bold !important;
    }

    /* Italic text */
    .overtype-wrapper .overtype-preview em {
      color: var(--em, #f95738) !important;
      text-decoration-color: var(--em, #f95738) !important;
      text-decoration-thickness: 1px !important;
      font-style: italic !important;
    }

    /* Inline code */
    .overtype-wrapper .overtype-preview code {
      background: var(--code-bg, rgba(244, 211, 94, 0.4)) !important;
      color: var(--code, #0d3b66) !important;
      padding: 0 !important;
      border-radius: 2px !important;
      font-family: inherit !important;
      font-size: inherit !important;
      line-height: inherit !important;
      font-weight: normal !important;
    }

    /* Code blocks */
    .overtype-wrapper .overtype-preview pre {
      background: #1e1e1e !important;
      padding: 0 !important;
      margin: 0 !important;
      border-radius: 4px !important;
      overflow-x: auto !important;
    }

    .overtype-wrapper .overtype-preview pre code {
      background: none !important;
    }

    /* Blockquotes */
    .overtype-wrapper .overtype-preview .blockquote {
      color: var(--blockquote, #5a7a9b) !important;
      padding: 0 !important;
      margin: 0 !important;
      border: none !important;
    }

    /* Links */
    .overtype-wrapper .overtype-preview a {
      color: var(--link, #0d3b66) !important;
      text-decoration: underline !important;
      font-weight: normal !important;
    }

    .overtype-wrapper .overtype-preview a:hover {
      text-decoration: underline !important;
      color: var(--link, #0d3b66) !important;
    }

    /* Lists - no list styling */
    .overtype-wrapper .overtype-preview ul,
    .overtype-wrapper .overtype-preview ol {
      list-style: none !important;
      margin: 0 !important;
      padding: 0 !important;
    }

    .overtype-wrapper .overtype-preview li {
      margin: 0 !important;
      padding: 0 !important;
      list-style: none !important;
    }

    /* Horizontal rules */
    .overtype-wrapper .overtype-preview hr {
      border: none !important;
      color: var(--hr, #5a7a9b) !important;
      margin: 0 !important;
      padding: 0 !important;
    }

    .overtype-wrapper .overtype-preview .hr-marker {
      color: var(--hr, #5a7a9b) !important;
      opacity: 0.6 !important;
    }

    /* Code fence markers - with background when not in code block */
    .overtype-wrapper .overtype-preview .code-fence {
      color: var(--code, #0d3b66) !important;
      background: var(--code-bg, rgba(244, 211, 94, 0.4)) !important;
    }
    
    /* Code block lines - background for entire code block */
    .overtype-wrapper .overtype-preview .code-block-line {
      background: var(--code-bg, rgba(244, 211, 94, 0.4)) !important;
    }
    
    /* Remove background from code fence when inside code block line */
    .overtype-wrapper .overtype-preview .code-block-line .code-fence {
      background: transparent !important;
    }

    /* Raw markdown line */
    .overtype-wrapper .overtype-preview .raw-line {
      color: var(--raw-line, #5a7a9b) !important;
      font-style: normal !important;
      font-weight: normal !important;
    }

    /* Syntax markers */
    .overtype-wrapper .overtype-preview .syntax-marker {
      color: var(--syntax-marker, rgba(13, 59, 102, 0.52)) !important;
      opacity: 0.7 !important;
    }

    /* List markers */
    .overtype-wrapper .overtype-preview .list-marker {
      color: var(--list-marker, #ee964b) !important;
    }

    /* Stats bar */
    .overtype-wrapper.with-stats {
      padding-bottom: 40px !important;
    }
    
    .overtype-wrapper .overtype-stats {
      position: absolute !important;
      bottom: 0 !important;
      left: 0 !important;
      right: 0 !important;
      height: 40px !important;
      padding: 0 20px !important;
      background: #f8f9fa !important;
      border-top: 1px solid #e0e0e0 !important;
      display: flex !important;
      justify-content: space-between !important;
      align-items: center !important;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
      font-size: 0.85rem !important;
      color: #666 !important;
      z-index: 2 !important;
    }
    
    /* Dark theme stats bar */
    .overtype-wrapper[data-theme="cave"] .overtype-stats {
      background: var(--bg-secondary, #1D2D3E) !important;
      border-top: 1px solid rgba(197, 221, 232, 0.1) !important;
      color: var(--text, #c5dde8) !important;
    }
    
    .overtype-wrapper .overtype-stats .overtype-stat {
      display: flex !important;
      align-items: center !important;
      gap: 5px !important;
      white-space: nowrap !important;
    }
    
    .overtype-wrapper .overtype-stats .live-dot {
      width: 8px !important;
      height: 8px !important;
      background: #4caf50 !important;
      border-radius: 50% !important;
      animation: pulse 2s infinite !important;
    }
    
    @keyframes pulse {
      0%, 100% { opacity: 1; transform: scale(1); }
      50% { opacity: 0.6; transform: scale(1.2); }
    }
    
    /* Adjust textarea and preview for stats bar */
    .overtype-wrapper.with-stats .overtype-input,
    .overtype-wrapper.with-stats .overtype-preview {
      height: calc(100% - 40px) !important;
    }

    /* Toolbar Styles */
    .overtype-toolbar {
      display: flex;
      align-items: center;
      gap: 4px;
      padding: 8px;
      background: var(--toolbar-bg, var(--bg-primary, #f8f9fa));
      overflow-x: auto;
      -webkit-overflow-scrolling: touch;
    }

    .overtype-toolbar-button {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 32px;
      height: 32px;
      padding: 0;
      border: none;
      border-radius: 6px;
      background: transparent;
      color: var(--toolbar-icon, var(--text-secondary, #666));
      cursor: pointer;
      transition: all 0.2s ease;
      flex-shrink: 0;
    }

    .overtype-toolbar-button svg {
      width: 20px;
      height: 20px;
      fill: currentColor;
    }

    .overtype-toolbar-button:hover {
      background: var(--toolbar-hover, var(--bg-secondary, #e9ecef));
      color: var(--toolbar-icon, var(--text-primary, #333));
    }

    .overtype-toolbar-button:active {
      transform: scale(0.95);
    }

    .overtype-toolbar-button.active {
      background: var(--toolbar-active, var(--primary, #007bff));
      color: var(--toolbar-icon, var(--text-primary, #333));
    }

    .overtype-toolbar-button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .overtype-toolbar-separator {
      width: 1px;
      height: 24px;
      background: var(--border, #e0e0e0);
      margin: 0 4px;
      flex-shrink: 0;
    }

    /* Adjust wrapper when toolbar is present */
    .overtype-container .overtype-toolbar + .overtype-wrapper {
    }

    /* Mobile toolbar adjustments */
    @media (max-width: 640px) {
      .overtype-toolbar {
        padding: 6px;
        gap: 2px;
      }

      .overtype-toolbar-button {
        width: 36px;
        height: 36px;
      }

      .overtype-toolbar-separator {
        margin: 0 2px;
      }
    }

    ${mobileStyles}
  `;
  }

  // src/icons.js
  var boldIcon = `<svg viewBox="0 0 18 18">
  <path stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5,4H9.5A2.5,2.5,0,0,1,12,6.5v0A2.5,2.5,0,0,1,9.5,9H5A0,0,0,0,1,5,9V4A0,0,0,0,1,5,4Z"></path>
  <path stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5,9h5.5A2.5,2.5,0,0,1,13,11.5v0A2.5,2.5,0,0,1,10.5,14H5a0,0,0,0,1,0,0V9A0,0,0,0,1,5,9Z"></path>
</svg>`;
  var italicIcon = `<svg viewBox="0 0 18 18">
  <line stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" x1="7" x2="13" y1="4" y2="4"></line>
  <line stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" x1="5" x2="11" y1="14" y2="14"></line>
  <line stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" x1="8" x2="10" y1="14" y2="4"></line>
</svg>`;
  var h1Icon = `<svg viewBox="0 0 18 18">
  <path fill="currentColor" d="M10,4V14a1,1,0,0,1-2,0V10H3v4a1,1,0,0,1-2,0V4A1,1,0,0,1,3,4V8H8V4a1,1,0,0,1,2,0Zm6.06787,9.209H14.98975V7.59863a.54085.54085,0,0,0-.605-.60547h-.62744a1.01119,1.01119,0,0,0-.748.29688L11.645,8.56641a.5435.5435,0,0,0-.022.8584l.28613.30762a.53861.53861,0,0,0,.84717.0332l.09912-.08789a1.2137,1.2137,0,0,0,.2417-.35254h.02246s-.01123.30859-.01123.60547V13.209H12.041a.54085.54085,0,0,0-.605.60547v.43945a.54085.54085,0,0,0,.605.60547h4.02686a.54085.54085,0,0,0,.605-.60547v-.43945A.54085.54085,0,0,0,16.06787,13.209Z"></path>
</svg>`;
  var h2Icon = `<svg viewBox="0 0 18 18">
  <path fill="currentColor" d="M16.73975,13.81445v.43945a.54085.54085,0,0,1-.605.60547H11.855a.58392.58392,0,0,1-.64893-.60547V14.0127c0-2.90527,3.39941-3.42187,3.39941-4.55469a.77675.77675,0,0,0-.84717-.78125,1.17684,1.17684,0,0,0-.83594.38477c-.2749.26367-.561.374-.85791.13184l-.4292-.34082c-.30811-.24219-.38525-.51758-.1543-.81445a2.97155,2.97155,0,0,1,2.45361-1.17676,2.45393,2.45393,0,0,1,2.68408,2.40918c0,2.45312-3.1792,2.92676-3.27832,3.93848h2.79443A.54085.54085,0,0,1,16.73975,13.81445ZM9,3A.99974.99974,0,0,0,8,4V8H3V4A1,1,0,0,0,1,4V14a1,1,0,0,0,2,0V10H8v4a1,1,0,0,0,2,0V4A.99974.99974,0,0,0,9,3Z"></path>
</svg>`;
  var h3Icon = `<svg viewBox="0 0 18 18">
  <path fill="currentColor" d="M16.65186,12.30664a2.6742,2.6742,0,0,1-2.915,2.68457,3.96592,3.96592,0,0,1-2.25537-.6709.56007.56007,0,0,1-.13232-.83594L11.64648,13c.209-.34082.48389-.36328.82471-.1543a2.32654,2.32654,0,0,0,1.12256.33008c.71484,0,1.12207-.35156,1.12207-.78125,0-.61523-.61621-.86816-1.46338-.86816H13.2085a.65159.65159,0,0,1-.68213-.41895l-.05518-.10937a.67114.67114,0,0,1,.14307-.78125l.71533-.86914a8.55289,8.55289,0,0,1,.68213-.7373V8.58887a3.93913,3.93913,0,0,1-.748.05469H11.9873a.54085.54085,0,0,1-.605-.60547V7.59863a.54085.54085,0,0,1,.605-.60547h3.75146a.53773.53773,0,0,1,.60547.59375v.17676a1.03723,1.03723,0,0,1-.27539.748L14.74854,10.0293A2.31132,2.31132,0,0,1,16.65186,12.30664ZM9,3A.99974.99974,0,0,0,8,4V8H3V4A1,1,0,0,0,1,4V14a1,1,0,0,0,2,0V10H8v4a1,1,0,0,0,2,0V4A.99974.99974,0,0,0,9,3Z"></path>
</svg>`;
  var linkIcon = `<svg viewBox="0 0 18 18">
  <line stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" x1="7" x2="11" y1="7" y2="11"></line>
  <path stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.9,4.577a3.476,3.476,0,0,1,.36,4.679A3.476,3.476,0,0,1,4.577,8.9C3.185,7.5,2.035,6.4,4.217,4.217S7.5,3.185,8.9,4.577Z"></path>
  <path stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.423,9.1a3.476,3.476,0,0,0-4.679-.36,3.476,3.476,0,0,0,.36,4.679c1.392,1.392,2.5,2.542,4.679.36S14.815,10.5,13.423,9.1Z"></path>
</svg>`;
  var codeIcon = `<svg viewBox="0 0 18 18">
  <polyline stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" points="5 7 3 9 5 11"></polyline>
  <polyline stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" points="13 7 15 9 13 11"></polyline>
  <line stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" x1="10" x2="8" y1="5" y2="13"></line>
</svg>`;
  var bulletListIcon = `<svg viewBox="0 0 18 18">
  <line stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" x1="6" x2="15" y1="4" y2="4"></line>
  <line stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" x1="6" x2="15" y1="9" y2="9"></line>
  <line stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" x1="6" x2="15" y1="14" y2="14"></line>
  <line stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" x1="3" x2="3" y1="4" y2="4"></line>
  <line stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" x1="3" x2="3" y1="9" y2="9"></line>
  <line stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" x1="3" x2="3" y1="14" y2="14"></line>
</svg>`;
  var orderedListIcon = `<svg viewBox="0 0 18 18">
  <line stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" x1="7" x2="15" y1="4" y2="4"></line>
  <line stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" x1="7" x2="15" y1="9" y2="9"></line>
  <line stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" x1="7" x2="15" y1="14" y2="14"></line>
  <line stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round" stroke-width="1" x1="2.5" x2="4.5" y1="5.5" y2="5.5"></line>
  <path fill="currentColor" d="M3.5,6A0.5,0.5,0,0,1,3,5.5V3.085l-0.276.138A0.5,0.5,0,0,1,2.053,3c-0.124-.247-0.023-0.324.224-0.447l1-.5A0.5,0.5,0,0,1,4,2.5v3A0.5,0.5,0,0,1,3.5,6Z"></path>
  <path stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M4.5,10.5h-2c0-.234,1.85-1.076,1.85-2.234A0.959,0.959,0,0,0,2.5,8.156"></path>
  <path stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M2.5,14.846a0.959,0.959,0,0,0,1.85-.109A0.7,0.7,0,0,0,3.75,14a0.688,0.688,0,0,0,.6-0.736,0.959,0.959,0,0,0-1.85-.109"></path>
</svg>`;
  var quoteIcon = `<svg viewBox="2 2 20 20">
  <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 10.8182L9 10.8182C8.80222 10.8182 8.60888 10.7649 8.44443 10.665C8.27998 10.5651 8.15181 10.4231 8.07612 10.257C8.00043 10.0909 7.98063 9.90808 8.01922 9.73174C8.0578 9.55539 8.15304 9.39341 8.29289 9.26627C8.43275 9.13913 8.61093 9.05255 8.80491 9.01747C8.99889 8.98239 9.19996 9.00039 9.38268 9.0692C9.56541 9.13801 9.72159 9.25453 9.83147 9.40403C9.94135 9.55353 10 9.72929 10 9.90909L10 12.1818C10 12.664 9.78929 13.1265 9.41421 13.4675C9.03914 13.8084 8.53043 14 8 14"></path>
  <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 10.8182L15 10.8182C14.8022 10.8182 14.6089 10.7649 14.4444 10.665C14.28 10.5651 14.1518 10.4231 14.0761 10.257C14.0004 10.0909 13.9806 9.90808 14.0192 9.73174C14.0578 9.55539 14.153 9.39341 14.2929 9.26627C14.4327 9.13913 14.6109 9.05255 14.8049 9.01747C14.9989 8.98239 15.2 9.00039 15.3827 9.0692C15.5654 9.13801 15.7216 9.25453 15.8315 9.40403C15.9414 9.55353 16 9.72929 16 9.90909L16 12.1818C16 12.664 15.7893 13.1265 15.4142 13.4675C15.0391 13.8084 14.5304 14 14 14"></path>
</svg>`;
  var taskListIcon = `<svg viewBox="0 0 18 18">
  <line stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" x1="8" x2="16" y1="4" y2="4"></line>
  <line stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" x1="8" x2="16" y1="9" y2="9"></line>
  <line stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" x1="8" x2="16" y1="14" y2="14"></line>
  <rect stroke="currentColor" fill="none" stroke-width="1.5" x="2" y="3" width="3" height="3" rx="0.5"></rect>
  <rect stroke="currentColor" fill="none" stroke-width="1.5" x="2" y="13" width="3" height="3" rx="0.5"></rect>
  <polyline stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" points="2.65 9.5 3.5 10.5 5 8.5"></polyline>
</svg>`;

  // src/toolbar.js
  var Toolbar = class {
    constructor(editor) {
      this.editor = editor;
      this.container = null;
      this.buttons = {};
    }
    /**
     * Create and attach toolbar to editor
     */
    create() {
      this.container = document.createElement("div");
      this.container.className = "overtype-toolbar";
      this.container.setAttribute("role", "toolbar");
      this.container.setAttribute("aria-label", "Text formatting");
      const buttonConfig = [
        { name: "bold", icon: boldIcon, title: "Bold (Ctrl+B)", action: "toggleBold" },
        { name: "italic", icon: italicIcon, title: "Italic (Ctrl+I)", action: "toggleItalic" },
        { separator: true },
        { name: "h1", icon: h1Icon, title: "Heading 1", action: "insertH1" },
        { name: "h2", icon: h2Icon, title: "Heading 2", action: "insertH2" },
        { name: "h3", icon: h3Icon, title: "Heading 3", action: "insertH3" },
        { separator: true },
        { name: "link", icon: linkIcon, title: "Insert Link (Ctrl+K)", action: "insertLink" },
        { name: "code", icon: codeIcon, title: "Code (Ctrl+`)", action: "toggleCode" },
        { separator: true },
        { name: "quote", icon: quoteIcon, title: "Quote", action: "toggleQuote" },
        { separator: true },
        { name: "bulletList", icon: bulletListIcon, title: "Bullet List", action: "toggleBulletList" },
        { name: "orderedList", icon: orderedListIcon, title: "Numbered List", action: "toggleNumberedList" },
        { name: "taskList", icon: taskListIcon, title: "Task List", action: "toggleTaskList" }
      ];
      buttonConfig.forEach((config) => {
        if (config.separator) {
          const separator = document.createElement("div");
          separator.className = "overtype-toolbar-separator";
          separator.setAttribute("role", "separator");
          this.container.appendChild(separator);
        } else {
          const button = this.createButton(config);
          this.buttons[config.name] = button;
          this.container.appendChild(button);
        }
      });
      const container = this.editor.element.querySelector(".overtype-container");
      const wrapper = this.editor.element.querySelector(".overtype-wrapper");
      if (container && wrapper) {
        container.insertBefore(this.container, wrapper);
      }
      return this.container;
    }
    /**
     * Create individual toolbar button
     */
    createButton(config) {
      const button = document.createElement("button");
      button.className = "overtype-toolbar-button";
      button.type = "button";
      button.title = config.title;
      button.setAttribute("aria-label", config.title);
      button.setAttribute("data-action", config.action);
      button.innerHTML = config.icon;
      button.addEventListener("click", (e) => {
        e.preventDefault();
        this.handleAction(config.action);
      });
      return button;
    }
    /**
     * Handle toolbar button actions
     */
    async handleAction(action) {
      const textarea = this.editor.textarea;
      if (!textarea)
        return;
      textarea.focus();
      try {
        switch (action) {
          case "toggleBold":
            toggleBold(textarea);
            break;
          case "toggleItalic":
            toggleItalic(textarea);
            break;
          case "insertH1":
            toggleH1(textarea);
            break;
          case "insertH2":
            toggleH2(textarea);
            break;
          case "insertH3":
            toggleH3(textarea);
            break;
          case "insertLink":
            insertLink(textarea);
            break;
          case "toggleCode":
            toggleCode(textarea);
            break;
          case "toggleBulletList":
            toggleBulletList(textarea);
            break;
          case "toggleNumberedList":
            toggleNumberedList(textarea);
            break;
          case "toggleQuote":
            toggleQuote(textarea);
            break;
          case "toggleTaskList":
            toggleTaskList(textarea);
            break;
        }
        textarea.dispatchEvent(new Event("input", { bubbles: true }));
      } catch (error) {
        console.error("Error loading markdown-actions:", error);
      }
    }
    /**
     * Update toolbar button states based on current selection
     */
    async updateButtonStates() {
      const textarea = this.editor.textarea;
      if (!textarea)
        return;
      try {
        const activeFormats = getActiveFormats2(textarea);
        Object.entries(this.buttons).forEach(([name, button]) => {
          let isActive = false;
          switch (name) {
            case "bold":
              isActive = activeFormats.includes("bold");
              break;
            case "italic":
              isActive = activeFormats.includes("italic");
              break;
            case "code":
              isActive = false;
              break;
            case "bulletList":
              isActive = activeFormats.includes("bullet-list");
              break;
            case "orderedList":
              isActive = activeFormats.includes("numbered-list");
              break;
            case "quote":
              isActive = activeFormats.includes("quote");
              break;
            case "taskList":
              isActive = activeFormats.includes("task-list");
              break;
            case "h1":
              isActive = activeFormats.includes("header");
              break;
            case "h2":
              isActive = activeFormats.includes("header-2");
              break;
            case "h3":
              isActive = activeFormats.includes("header-3");
              break;
          }
          button.classList.toggle("active", isActive);
          button.setAttribute("aria-pressed", isActive.toString());
        });
      } catch (error) {
      }
    }
    /**
     * Destroy toolbar
     */
    destroy() {
      if (this.container) {
        this.container.remove();
        this.container = null;
        this.buttons = {};
      }
    }
  };

  // src/link-tooltip.js
  var LinkTooltip = class {
    constructor(editor) {
      this.editor = editor;
      this.tooltip = null;
      this.currentLink = null;
      this.hideTimeout = null;
      this.init();
    }
    init() {
      const supportsAnchor = CSS.supports("position-anchor: --x") && CSS.supports("position-area: center");
      if (!supportsAnchor) {
        return;
      }
      this.createTooltip();
      this.editor.textarea.addEventListener("selectionchange", () => this.checkCursorPosition());
      this.editor.textarea.addEventListener("keyup", (e) => {
        if (e.key.includes("Arrow") || e.key === "Home" || e.key === "End") {
          this.checkCursorPosition();
        }
      });
      this.editor.textarea.addEventListener("input", () => this.hide());
      this.editor.textarea.addEventListener("scroll", () => this.hide());
      this.tooltip.addEventListener("mouseenter", () => this.cancelHide());
      this.tooltip.addEventListener("mouseleave", () => this.scheduleHide());
    }
    createTooltip() {
      this.tooltip = document.createElement("div");
      this.tooltip.className = "overtype-link-tooltip";
      const tooltipStyles = document.createElement("style");
      tooltipStyles.textContent = `
      @supports (position-anchor: --x) and (position-area: center) {
        .overtype-link-tooltip {
          position: absolute;
          position-anchor: var(--target-anchor, --link-0);
          position-area: block-end center;
          margin-top: 8px;
          
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
          
          position-try: most-width block-end inline-end, flip-inline, block-start center;
          position-visibility: anchors-visible;
        }
        
        .overtype-link-tooltip.visible {
          display: flex;
        }
      }
    `;
      document.head.appendChild(tooltipStyles);
      this.tooltip.innerHTML = `
      <span style="display: flex; align-items: center; gap: 6px;">
        <svg width="12" height="12" viewBox="0 0 20 20" fill="currentColor" style="flex-shrink: 0;">
          <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z"></path>
          <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z"></path>
        </svg>
        <span class="overtype-link-tooltip-url"></span>
      </span>
    `;
      this.tooltip.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (this.currentLink) {
          window.open(this.currentLink.url, "_blank");
          this.hide();
        }
      });
      this.editor.container.appendChild(this.tooltip);
    }
    checkCursorPosition() {
      const cursorPos = this.editor.textarea.selectionStart;
      const text = this.editor.textarea.value;
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
            start,
            end
          };
        }
        linkIndex++;
      }
      return null;
    }
    show(linkInfo) {
      this.currentLink = linkInfo;
      this.cancelHide();
      const urlSpan = this.tooltip.querySelector(".overtype-link-tooltip-url");
      urlSpan.textContent = linkInfo.url;
      this.tooltip.style.setProperty("--target-anchor", `--link-${linkInfo.index}`);
      this.tooltip.classList.add("visible");
    }
    hide() {
      this.tooltip.classList.remove("visible");
      this.currentLink = null;
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
      if (this.tooltip && this.tooltip.parentNode) {
        this.tooltip.parentNode.removeChild(this.tooltip);
      }
      this.tooltip = null;
      this.currentLink = null;
    }
  };

  // src/overtype.js
  var _OverType = class _OverType {
    /**
     * Constructor - Always returns an array of instances
     * @param {string|Element|NodeList|Array} target - Target element(s)
     * @param {Object} options - Configuration options
     * @returns {Array} Array of OverType instances
     */
    constructor(target, options = {}) {
      let elements;
      if (typeof target === "string") {
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
        throw new Error("Invalid target: must be selector string, Element, NodeList, or Array");
      }
      const instances = elements.map((element) => {
        if (element.overTypeInstance) {
          element.overTypeInstance.reinit(options);
          return element.overTypeInstance;
        }
        const instance = Object.create(_OverType.prototype);
        instance._init(element, options);
        element.overTypeInstance = instance;
        _OverType.instances.set(element, instance);
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
      this.instanceTheme = options.theme || null;
      this.options = this._mergeOptions(options);
      this.instanceId = ++_OverType.instanceCount;
      this.initialized = false;
      _OverType.injectStyles();
      _OverType.initGlobalListeners();
      const container = element.querySelector(".overtype-container");
      const wrapper = element.querySelector(".overtype-wrapper");
      if (container || wrapper) {
        this._recoverFromDOM(container, wrapper);
      } else {
        this._buildFromScratch();
      }
      this.shortcuts = new ShortcutsManager(this);
      this.linkTooltip = new LinkTooltip(this);
      if (this.options.toolbar) {
        this.toolbar = new Toolbar(this);
        this.toolbar.create();
        this.textarea.addEventListener("selectionchange", () => {
          this.toolbar.updateButtonStates();
        });
        this.textarea.addEventListener("input", () => {
          this.toolbar.updateButtonStates();
        });
      }
      this.initialized = true;
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
        fontSize: "14px",
        lineHeight: 1.6,
        fontFamily: "ui-monospace, 'SFMono-Regular', 'Menlo', 'Consolas', 'Liberation Mono', monospace",
        padding: "16px",
        // Mobile styles
        mobile: {
          fontSize: "16px",
          // Prevent zoom on iOS
          padding: "12px",
          lineHeight: 1.5
        },
        // Behavior
        autofocus: false,
        placeholder: "Start typing...",
        value: "",
        // Callbacks
        onChange: null,
        onKeydown: null,
        // Features
        showActiveLineRaw: false,
        showStats: false,
        toolbar: false,
        statsFormatter: null
      };
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
      if (container && container.classList.contains("overtype-container")) {
        this.container = container;
        this.wrapper = container.querySelector(".overtype-wrapper");
      } else if (wrapper) {
        this.wrapper = wrapper;
        this.container = document.createElement("div");
        this.container.className = "overtype-container";
        const themeToUse = this.instanceTheme || _OverType.currentTheme || solar;
        const themeName = typeof themeToUse === "string" ? themeToUse : themeToUse.name;
        if (themeName) {
          this.container.setAttribute("data-theme", themeName);
        }
        if (this.instanceTheme) {
          const themeObj = typeof this.instanceTheme === "string" ? getTheme(this.instanceTheme) : this.instanceTheme;
          if (themeObj && themeObj.colors) {
            const cssVars = themeToCSSVars(themeObj.colors);
            this.container.style.cssText += cssVars;
          }
        }
        wrapper.parentNode.insertBefore(this.container, wrapper);
        this.container.appendChild(wrapper);
      }
      if (!this.wrapper) {
        if (container)
          container.remove();
        if (wrapper)
          wrapper.remove();
        this._buildFromScratch();
        return;
      }
      this.textarea = this.wrapper.querySelector(".overtype-input");
      this.preview = this.wrapper.querySelector(".overtype-preview");
      if (!this.textarea || !this.preview) {
        this.container.remove();
        this._buildFromScratch();
        return;
      }
      this.wrapper._instance = this;
      if (this.options.fontSize) {
        this.wrapper.style.setProperty("--instance-font-size", this.options.fontSize);
      }
      if (this.options.lineHeight) {
        this.wrapper.style.setProperty("--instance-line-height", String(this.options.lineHeight));
      }
      if (this.options.padding) {
        this.wrapper.style.setProperty("--instance-padding", this.options.padding);
      }
      this._configureTextarea();
      this._applyOptions();
    }
    /**
     * Build editor from scratch
     * @private
     */
    _buildFromScratch() {
      const content = this._extractContent();
      this.element.innerHTML = "";
      this._createDOM();
      if (content || this.options.value) {
        this.setValue(content || this.options.value);
      }
      this._applyOptions();
    }
    /**
     * Extract content from element
     * @private
     */
    _extractContent() {
      const textarea = this.element.querySelector(".overtype-input");
      if (textarea)
        return textarea.value;
      return this.element.textContent || "";
    }
    /**
     * Create DOM structure
     * @private
     */
    _createDOM() {
      this.container = document.createElement("div");
      this.container.className = "overtype-container";
      const themeToUse = this.instanceTheme || _OverType.currentTheme || solar;
      const themeName = typeof themeToUse === "string" ? themeToUse : themeToUse.name;
      if (themeName) {
        this.container.setAttribute("data-theme", themeName);
      }
      if (this.instanceTheme) {
        const themeObj = typeof this.instanceTheme === "string" ? getTheme(this.instanceTheme) : this.instanceTheme;
        if (themeObj && themeObj.colors) {
          const cssVars = themeToCSSVars(themeObj.colors);
          this.container.style.cssText += cssVars;
        }
      }
      this.wrapper = document.createElement("div");
      this.wrapper.className = "overtype-wrapper";
      if (this.options.showStats) {
        this.wrapper.classList.add("with-stats");
      }
      if (this.options.fontSize) {
        this.wrapper.style.setProperty("--instance-font-size", this.options.fontSize);
      }
      if (this.options.lineHeight) {
        this.wrapper.style.setProperty("--instance-line-height", String(this.options.lineHeight));
      }
      if (this.options.padding) {
        this.wrapper.style.setProperty("--instance-padding", this.options.padding);
      }
      this.wrapper._instance = this;
      this.textarea = document.createElement("textarea");
      this.textarea.className = "overtype-input";
      this.textarea.placeholder = this.options.placeholder;
      this._configureTextarea();
      this.preview = document.createElement("div");
      this.preview.className = "overtype-preview";
      this.preview.setAttribute("aria-hidden", "true");
      this.wrapper.appendChild(this.textarea);
      this.wrapper.appendChild(this.preview);
      if (this.options.showStats) {
        this.statsBar = document.createElement("div");
        this.statsBar.className = "overtype-stats";
        this.wrapper.appendChild(this.statsBar);
        this._updateStats();
      }
      this.container.appendChild(this.wrapper);
      this.element.appendChild(this.container);
    }
    /**
     * Configure textarea attributes
     * @private
     */
    _configureTextarea() {
      this.textarea.setAttribute("autocomplete", "off");
      this.textarea.setAttribute("autocorrect", "off");
      this.textarea.setAttribute("autocapitalize", "off");
      this.textarea.setAttribute("spellcheck", "false");
      this.textarea.setAttribute("data-gramm", "false");
      this.textarea.setAttribute("data-gramm_editor", "false");
      this.textarea.setAttribute("data-enable-grammarly", "false");
    }
    /**
     * Apply options to the editor
     * @private
     */
    _applyOptions() {
      if (this.options.autofocus) {
        this.textarea.focus();
      }
      this.updatePreview();
    }
    /**
     * Update preview with parsed markdown
     */
    updatePreview() {
      const text = this.textarea.value;
      const cursorPos = this.textarea.selectionStart;
      const activeLine = this._getCurrentLine(text, cursorPos);
      const html = MarkdownParser.parse(text, activeLine, this.options.showActiveLineRaw);
      this.preview.innerHTML = html || '<span style="color: #808080;">Start typing...</span>';
      this._applyCodeBlockBackgrounds();
      if (this.options.showStats && this.statsBar) {
        this._updateStats();
      }
      if (this.options.onChange && this.initialized) {
        this.options.onChange(text, this);
      }
    }
    /**
     * Apply background styling to code blocks
     * @private
     */
    _applyCodeBlockBackgrounds() {
      const codeFences = this.preview.querySelectorAll(".code-fence");
      for (let i = 0; i < codeFences.length - 1; i += 2) {
        const openFence = codeFences[i];
        const closeFence = codeFences[i + 1];
        const openParent = openFence.parentElement;
        const closeParent = closeFence.parentElement;
        if (!openParent || !closeParent)
          continue;
        openFence.style.display = "block";
        closeFence.style.display = "block";
        openParent.classList.add("code-block-line");
        closeParent.classList.add("code-block-line");
        let currentDiv = openParent.nextElementSibling;
        while (currentDiv && currentDiv !== closeParent) {
          if (currentDiv.tagName === "DIV") {
            currentDiv.classList.add("code-block-line");
          }
          currentDiv = currentDiv.nextElementSibling;
          if (!currentDiv)
            break;
        }
      }
    }
    /**
     * Get current line number from cursor position
     * @private
     */
    _getCurrentLine(text, cursorPos) {
      const lines = text.substring(0, cursorPos).split("\n");
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
      if (event.key === "Tab") {
        event.preventDefault();
        const start = this.textarea.selectionStart;
        const end = this.textarea.selectionEnd;
        const value = this.textarea.value;
        if (start !== end && event.shiftKey) {
          const before = value.substring(0, start);
          const selection = value.substring(start, end);
          const after = value.substring(end);
          const lines = selection.split("\n");
          const outdented = lines.map((line) => line.replace(/^  /, "")).join("\n");
          this.textarea.value = before + outdented + after;
          this.textarea.selectionStart = start;
          this.textarea.selectionEnd = start + outdented.length;
        } else if (start !== end) {
          const before = value.substring(0, start);
          const selection = value.substring(start, end);
          const after = value.substring(end);
          const lines = selection.split("\n");
          const indented = lines.map((line) => "  " + line).join("\n");
          this.textarea.value = before + indented + after;
          this.textarea.selectionStart = start;
          this.textarea.selectionEnd = start + indented.length;
        } else {
          this.textarea.value = value.substring(0, start) + "  " + value.substring(end);
          this.textarea.selectionStart = this.textarea.selectionEnd = start + 2;
        }
        this.textarea.dispatchEvent(new Event("input", { bubbles: true }));
        return;
      }
      const handled = this.shortcuts.handleKeydown(event);
      if (!handled && this.options.onKeydown) {
        this.options.onKeydown(event, this);
      }
    }
    /**
     * Handle scroll events
     * @private
     */
    handleScroll(event) {
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
     * Update stats bar
     * @private
     */
    _updateStats() {
      if (!this.statsBar)
        return;
      const value = this.textarea.value;
      const lines = value.split("\n");
      const chars = value.length;
      const words = value.split(/\s+/).filter((w) => w.length > 0).length;
      const selectionStart = this.textarea.selectionStart;
      const beforeCursor = value.substring(0, selectionStart);
      const linesBeforeCursor = beforeCursor.split("\n");
      const currentLine = linesBeforeCursor.length;
      const currentColumn = linesBeforeCursor[linesBeforeCursor.length - 1].length + 1;
      if (this.options.statsFormatter) {
        this.statsBar.innerHTML = this.options.statsFormatter({
          chars,
          words,
          lines: lines.length,
          line: currentLine,
          column: currentColumn
        });
      } else {
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
     * Show or hide stats bar
     * @param {boolean} show - Whether to show stats
     */
    showStats(show) {
      this.options.showStats = show;
      if (show && !this.statsBar) {
        this.statsBar = document.createElement("div");
        this.statsBar.className = "overtype-stats";
        this.wrapper.appendChild(this.statsBar);
        this.wrapper.classList.add("with-stats");
        this._updateStats();
      } else if (!show && this.statsBar) {
        this.statsBar.remove();
        this.statsBar = null;
        this.wrapper.classList.remove("with-stats");
      }
    }
    /**
     * Destroy the editor instance
     */
    destroy() {
      this.element.overTypeInstance = null;
      _OverType.instances.delete(this.element);
      if (this.shortcuts) {
        this.shortcuts.destroy();
      }
      if (this.wrapper) {
        const content = this.getValue();
        this.wrapper.remove();
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
      return new _OverType(target, options);
    }
    /**
     * Get instance from element
     * @param {Element} element - DOM element
     * @returns {OverType|null} OverType instance or null
     */
    static getInstance(element) {
      return element.overTypeInstance || _OverType.instances.get(element) || null;
    }
    /**
     * Destroy all instances
     */
    static destroyAll() {
      const elements = document.querySelectorAll("[data-overtype-instance]");
      elements.forEach((element) => {
        const instance = _OverType.getInstance(element);
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
      if (_OverType.stylesInjected && !force)
        return;
      const existing = document.querySelector("style.overtype-styles");
      if (existing) {
        existing.remove();
      }
      const theme = _OverType.currentTheme || solar;
      const styles = generateStyles({ theme });
      const styleEl = document.createElement("style");
      styleEl.className = "overtype-styles";
      styleEl.textContent = styles;
      document.head.appendChild(styleEl);
      _OverType.stylesInjected = true;
    }
    /**
     * Set global theme for all OverType instances
     * @param {string|Object} theme - Theme name or custom theme object
     * @param {Object} customColors - Optional color overrides
     */
    static setTheme(theme, customColors = null) {
      let themeObj = typeof theme === "string" ? getTheme(theme) : theme;
      if (customColors) {
        themeObj = mergeTheme(themeObj, customColors);
      }
      _OverType.currentTheme = themeObj;
      _OverType.injectStyles(true);
      document.querySelectorAll(".overtype-container").forEach((container) => {
        const themeName = typeof themeObj === "string" ? themeObj : themeObj.name;
        if (themeName) {
          container.setAttribute("data-theme", themeName);
        }
      });
      document.querySelectorAll(".overtype-wrapper").forEach((wrapper) => {
        if (!wrapper.closest(".overtype-container")) {
          const themeName = typeof themeObj === "string" ? themeObj : themeObj.name;
          if (themeName) {
            wrapper.setAttribute("data-theme", themeName);
          }
        }
        const instance = wrapper._instance;
        if (instance) {
          instance.updatePreview();
        }
      });
    }
    /**
     * Initialize global event listeners
     */
    static initGlobalListeners() {
      if (_OverType.globalListenersInitialized)
        return;
      document.addEventListener("input", (e) => {
        if (e.target && e.target.classList && e.target.classList.contains("overtype-input")) {
          const wrapper = e.target.closest(".overtype-wrapper");
          const instance = wrapper == null ? void 0 : wrapper._instance;
          if (instance)
            instance.handleInput(e);
        }
      });
      document.addEventListener("keydown", (e) => {
        if (e.target && e.target.classList && e.target.classList.contains("overtype-input")) {
          const wrapper = e.target.closest(".overtype-wrapper");
          const instance = wrapper == null ? void 0 : wrapper._instance;
          if (instance)
            instance.handleKeydown(e);
        }
      });
      document.addEventListener("scroll", (e) => {
        if (e.target && e.target.classList && e.target.classList.contains("overtype-input")) {
          const wrapper = e.target.closest(".overtype-wrapper");
          const instance = wrapper == null ? void 0 : wrapper._instance;
          if (instance)
            instance.handleScroll(e);
        }
      }, true);
      document.addEventListener("selectionchange", (e) => {
        const activeElement = document.activeElement;
        if (activeElement && activeElement.classList.contains("overtype-input")) {
          const wrapper = activeElement.closest(".overtype-wrapper");
          const instance = wrapper == null ? void 0 : wrapper._instance;
          if (instance) {
            if (instance.options.showStats && instance.statsBar) {
              instance._updateStats();
            }
            clearTimeout(instance._selectionTimeout);
            instance._selectionTimeout = setTimeout(() => {
              instance.updatePreview();
            }, 50);
          }
        }
      });
      _OverType.globalListenersInitialized = true;
    }
  };
  // Static properties
  __publicField(_OverType, "instances", /* @__PURE__ */ new WeakMap());
  __publicField(_OverType, "stylesInjected", false);
  __publicField(_OverType, "globalListenersInitialized", false);
  __publicField(_OverType, "instanceCount", 0);
  var OverType = _OverType;
  OverType.MarkdownParser = MarkdownParser;
  OverType.ShortcutsManager = ShortcutsManager;
  OverType.themes = { solar, cave: getTheme("cave") };
  OverType.getTheme = getTheme;
  OverType.currentTheme = solar;
  var overtype_default = OverType;
  return __toCommonJS(overtype_exports);
})();
/**
 * OverType - A lightweight markdown editor library with perfect WYSIWYG alignment
 * @version 1.0.0
 * @license MIT
 */
window.OverType = OverType.OverType || OverType.default || OverType;
//# sourceMappingURL=overtype.js.map
