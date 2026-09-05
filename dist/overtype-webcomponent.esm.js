/**
 * OverType v2.4.2
 * A lightweight markdown editor library with perfect WYSIWYG alignment
 * @license MIT
 * @author David Miranda
 * https://github.com/panphora/overtype
 */
var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __publicField = (obj, key, value) => {
  __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
  return value;
};

// src/block-scanner.js
function scanAtxHeading(line) {
  var _a, _b;
  const match = /^( {0,3})(#{1,6})(?:([\t ]+)(.*)|$)/.exec(line);
  if (!match || match[2].length > 3)
    return null;
  const indent = match[1];
  const marker = match[2];
  const separator = (_a = match[3]) != null ? _a : "";
  const body = (_b = match[4]) != null ? _b : "";
  const onlyClosingMarker = /^(#+)[\t ]*$/.exec(body);
  const closingMatch = /([\t ]+)(#+)([\t ]*)$/.exec(body);
  const hasClosingMarker = onlyClosingMarker || closingMatch;
  return {
    type: "heading",
    level: marker.length,
    indent,
    marker,
    separator,
    content: onlyClosingMarker ? "" : hasClosingMarker ? body.slice(0, closingMatch.index) : body,
    closing: onlyClosingMarker ? body : hasClosingMarker ? closingMatch[0] : ""
  };
}
function scanThematicBreak(line) {
  const match = /^( {0,3})([*_-])([\t *_-]*)$/.exec(line);
  if (!match)
    return null;
  const marker = match[2];
  const rest = match[3];
  if ([...rest].some((character) => character !== marker && character !== " " && character !== "	")) {
    return null;
  }
  const markerCount = 1 + [...rest].filter((character) => character === marker).length;
  if (markerCount < 3)
    return null;
  return { type: "thematic-break", marker, source: line };
}
function scanBlockquote(line) {
  const match = /^( {0,3})>([\t ]?)(.*)$/.exec(line);
  if (!match || match[2] === "" && match[3].startsWith(">"))
    return null;
  return {
    type: "blockquote",
    indent: match[1],
    marker: ">",
    separator: match[2],
    content: match[3]
  };
}
function scanListItem(line) {
  const bullet = /^( *)([-*+])([\t ]+)(.*)$/.exec(line);
  if (bullet) {
    return {
      type: "list-item",
      listType: "bullet",
      indent: bullet[1],
      marker: bullet[2],
      separator: bullet[3],
      content: bullet[4]
    };
  }
  const emptyBullet = /^( *)([-*+])$/.exec(line);
  if (emptyBullet) {
    return {
      type: "list-item",
      listType: "bullet",
      indent: emptyBullet[1],
      marker: emptyBullet[2],
      separator: "",
      content: ""
    };
  }
  const ordered = /^( *)(\d{1,9}\.)([\t ]+)(.*)$/.exec(line);
  if (ordered) {
    return {
      type: "list-item",
      listType: "ordered",
      indent: ordered[1],
      marker: ordered[2],
      separator: ordered[3],
      content: ordered[4]
    };
  }
  const emptyOrdered = /^( *)(\d{1,9}\.)$/.exec(line);
  if (emptyOrdered) {
    return {
      type: "list-item",
      listType: "ordered",
      indent: emptyOrdered[1],
      marker: emptyOrdered[2],
      separator: "",
      content: ""
    };
  }
  return null;
}
function scanFenceOpen(line) {
  const match = /^( {0,3})(`{3,})([^`]*)$/.exec(line);
  if (!match)
    return null;
  return {
    type: "fence-open",
    indent: match[1],
    marker: match[2],
    length: match[2].length,
    info: match[3].trim(),
    source: line
  };
}
function scanFenceClose(line, opening) {
  const match = /^( {0,3})(`{3,})[\t ]*$/.exec(line);
  if (!match || match[2].length < opening.length)
    return null;
  return {
    type: "fence-close",
    indent: match[1],
    marker: match[2],
    length: match[2].length,
    source: line
  };
}

// src/link-scanner.js
var ESCAPABLE = /[!"#$%&'()*+,\-./:;<=>?@[\\\]^_`{|}~]/;
var ENTITY = /^&(?:amp|lt|gt|quot|#39);/;
var DECODED_ENTITY = {
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": '"',
  "&#39;": "'"
};
function makeReader(text, htmlEntities) {
  return function at(index) {
    if (index >= text.length)
      return [null, 0];
    if (htmlEntities && text.charCodeAt(index) === 38) {
      const match = ENTITY.exec(text.slice(index, index + 6));
      if (match)
        return [DECODED_ENTITY[match[0]], match[0].length];
    }
    return [text[index], 1];
  };
}
function isEscaped(text, index) {
  let slashes = 0;
  while (index > 0 && text[--index] === "\\")
    slashes++;
  return slashes % 2 === 1;
}
var isSpace = (character) => character === " " || character === "	";
var isControl = (character) => character !== null && (character.charCodeAt(0) < 32 || character.charCodeAt(0) === 127);
function scanTail(text, index, at, maxParenDepth) {
  let [character, length] = at(index);
  if (character !== "(")
    return null;
  index += length;
  while (isSpace(character = at(index)[0]))
    index += at(index)[1];
  let destination = null;
  [character, length] = at(index);
  if (character === "<") {
    const start = index;
    let value = "";
    index += length;
    for (; ; ) {
      [character, length] = at(index);
      if (character === null || character === "<" || character === "\n")
        return null;
      if (character === "\\") {
        const [next, nextLength] = at(index + length);
        if (next !== null && ESCAPABLE.test(next)) {
          value += next;
          index += length + nextLength;
          continue;
        }
      }
      if (character === ">") {
        index += length;
        break;
      }
      value += character;
      index += length;
    }
    destination = {
      start,
      end: index,
      raw: text.slice(start, index),
      value
    };
  } else if (character !== ")") {
    const start = index;
    let depth = 0;
    let value = "";
    for (; ; ) {
      [character, length] = at(index);
      if (character === null || character === "\n" || isSpace(character))
        break;
      if (isControl(character))
        return null;
      if (character === "\\") {
        const [next, nextLength] = at(index + length);
        if (next !== null && ESCAPABLE.test(next)) {
          value += next;
          index += length + nextLength;
          continue;
        }
        value += character;
        index += length;
        continue;
      }
      if (character === "(") {
        depth++;
        if (depth > maxParenDepth)
          return null;
        value += character;
        index += length;
        continue;
      }
      if (character === ")") {
        if (depth === 0)
          break;
        depth--;
        value += character;
        index += length;
        continue;
      }
      value += character;
      index += length;
    }
    if (depth !== 0)
      return null;
    destination = {
      start,
      end: index,
      raw: text.slice(start, index),
      value
    };
  }
  const afterDestination = index;
  while (isSpace(character = at(index)[0]))
    index += at(index)[1];
  let title = null;
  [character, length] = at(index);
  if (character === '"' || character === "'" || character === "(") {
    if (destination && index === afterDestination)
      return null;
    const close = character === "(" ? ")" : character;
    const start = index;
    let value = "";
    index += length;
    for (; ; ) {
      [character, length] = at(index);
      if (character === null || character === "\n")
        return null;
      if (character === "\\") {
        const [next, nextLength] = at(index + length);
        if (next !== null && ESCAPABLE.test(next)) {
          value += next;
          index += length + nextLength;
          continue;
        }
        value += character;
        index += length;
        continue;
      }
      if (character === close) {
        index += length;
        break;
      }
      if (close === ")" && character === "(")
        return null;
      value += character;
      index += length;
    }
    title = {
      start,
      end: index,
      raw: text.slice(start, index),
      value,
      delimiter: close === ")" ? "(" : close
    };
    while (isSpace(character = at(index)[0]))
      index += at(index)[1];
  }
  [character, length] = at(index);
  if (character !== ")")
    return null;
  return { end: index + length, destination, title };
}
function rangeAt(ranges, index, rangeIndex) {
  while (rangeIndex < ranges.length && ranges[rangeIndex].end <= index)
    rangeIndex++;
  const range = ranges[rangeIndex];
  return {
    range: range && range.start <= index && index < range.end ? range : null,
    rangeIndex
  };
}
function findLinks(text, {
  htmlEntities = false,
  maxParenDepth = 32,
  ignoreRanges = []
} = {}) {
  const at = makeReader(text, htmlEntities);
  const ranges = [...ignoreRanges].sort((a, b) => a.start - b.start);
  const links = [];
  const openers = [];
  let rangeIndex = 0;
  let index = 0;
  while (index < text.length) {
    const rangeResult = rangeAt(ranges, index, rangeIndex);
    rangeIndex = rangeResult.rangeIndex;
    if (rangeResult.range) {
      index = rangeResult.range.end;
      continue;
    }
    const [character, length] = at(index);
    if (character === "\\") {
      const [next, nextLength] = at(index + length);
      index += next !== null && ESCAPABLE.test(next) ? length + nextLength : length;
      continue;
    }
    if (character === "\n") {
      openers.length = 0;
      index += length;
      continue;
    }
    if (character === "[") {
      const imageMarker = index > 0 && text[index - 1] === "!" && !isEscaped(text, index - 1);
      openers.push({ index, image: imageMarker });
      index += length;
      continue;
    }
    if (character === "]") {
      const opener = openers.pop();
      if (opener) {
        const tail = scanTail(text, index + length, at, maxParenDepth);
        if (tail) {
          links.push({
            start: opener.index,
            end: tail.end,
            image: opener.image,
            text: {
              start: opener.index + 1,
              end: index,
              raw: text.slice(opener.index + 1, index)
            },
            destination: tail.destination,
            title: tail.title
          });
          openers.length = 0;
          index = tail.end;
          continue;
        }
      }
    }
    index += length;
  }
  return links;
}
function findCodeSpans(text, excludedRanges = []) {
  const runs = [];
  const spans = [];
  let index = 0;
  while (index < text.length) {
    if (text[index] !== "`") {
      index++;
      continue;
    }
    const start = index;
    while (text[index] === "`")
      index++;
    runs.push({ start, end: index, length: index - start });
  }
  const nextRun = new Array(runs.length);
  const lastRunByLength = /* @__PURE__ */ new Map();
  for (let runIndex = runs.length - 1; runIndex >= 0; runIndex--) {
    const run = runs[runIndex];
    nextRun[runIndex] = lastRunByLength.get(run.length);
    lastRunByLength.set(run.length, runIndex);
  }
  for (let runIndex = 0; runIndex < runs.length; ) {
    const open = runs[runIndex];
    const excluded = isEscaped(text, open.start) || excludedRanges.some((range) => open.start >= range.start && open.start < range.end);
    const closeIndex = nextRun[runIndex];
    if (excluded || closeIndex === void 0) {
      runIndex++;
      continue;
    }
    const close = runs[closeIndex];
    spans.push({
      start: open.start,
      end: close.end,
      raw: text.slice(open.start, close.end),
      openTicks: text.slice(open.start, open.end),
      content: text.slice(open.end, close.start),
      closeTicks: text.slice(close.start, close.end)
    });
    runIndex = closeIndex + 1;
  }
  return spans;
}
function shiftLink(link, offset3) {
  return {
    ...link,
    start: link.start + offset3,
    end: link.end + offset3,
    text: {
      ...link.text,
      start: link.text.start + offset3,
      end: link.text.end + offset3
    },
    destination: link.destination && {
      ...link.destination,
      start: link.destination.start + offset3,
      end: link.destination.end + offset3
    },
    title: link.title && {
      ...link.title,
      start: link.title.start + offset3,
      end: link.title.end + offset3
    }
  };
}
function findRenderableLineLinks(text, options) {
  if (!text.includes("["))
    return [];
  let links = findLinks(text, options);
  const seen = /* @__PURE__ */ new Set();
  for (; ; ) {
    const signature = links.map((link) => `${link.start}:${link.end}`).join(",");
    if (seen.has(signature))
      return links;
    seen.add(signature);
    const targetRanges = links.map((link) => ({
      start: link.text.end,
      end: link.end
    }));
    const codeRanges = findCodeSpans(text, targetRanges);
    const next = findLinks(text, { ...options, ignoreRanges: codeRanges });
    const nextSignature = next.map((link) => `${link.start}:${link.end}`).join(",");
    if (nextSignature === signature)
      return next;
    links = next;
  }
}
function findRenderableLinks(text, options = {}) {
  const links = [];
  const lines = text.split("\n");
  let opening = null;
  let offset3 = 0;
  for (const line of lines) {
    if (opening) {
      if (scanFenceClose(line, opening))
        opening = null;
    } else {
      const candidate = scanFenceOpen(line);
      if (candidate)
        opening = candidate;
      else {
        links.push(...findRenderableLineLinks(line, options).map((link) => shiftLink(link, offset3)));
      }
    }
    offset3 += line.length + 1;
  }
  return links;
}

// src/emphasis-scanner.js
var DECODED_ENTITY2 = {
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": '"',
  "&#39;": "'"
};
var ENTITY2 = /^&(amp|lt|gt|quot|#39);/;
var ASCII_PUNCTUATION = /^[!"#$%&'()*+,\-./:;<=>?@[\]\\^_`{|}~]$/;
var BMP_PUNCTUATION = /^[\u00a1-\u00a9\u00ab-\u00ac\u00ae-\u00b1\u00b4\u00b6-\u00b8\u00bb\u00bf\u00d7\u00f7\u02c2-\u02c5\u02d2-\u02df\u02e5-\u02eb\u02ed\u02ef-\u02ff\u0375\u037e\u0384-\u0385\u0387\u03f6\u0482\u055a-\u055f\u0589-\u058a\u058d-\u058f\u05be\u05c0\u05c3\u05c6\u05f3-\u05f4\u0606-\u060f\u061b\u061d-\u061f\u066a-\u066d\u06d4\u06de\u06e9\u06fd-\u06fe\u0700-\u070d\u07f6-\u07f9\u07fe-\u07ff\u0830-\u083e\u085e\u0888\u0964-\u0965\u0970\u09f2-\u09f3\u09fa-\u09fb\u09fd\u0a76\u0af0-\u0af1\u0b70\u0bf3-\u0bfa\u0c77\u0c7f\u0c84\u0d4f\u0d79\u0df4\u0e3f\u0e4f\u0e5a-\u0e5b\u0f01-\u0f17\u0f1a-\u0f1f\u0f34\u0f36\u0f38\u0f3a-\u0f3d\u0f85\u0fbe-\u0fc5\u0fc7-\u0fcc\u0fce-\u0fda\u104a-\u104f\u109e-\u109f\u10fb\u1360-\u1368\u1390-\u1399\u1400\u166d-\u166e\u169b-\u169c\u16eb-\u16ed\u1735-\u1736\u17d4-\u17d6\u17d8-\u17db\u1800-\u180a\u1940\u1944-\u1945\u19de-\u19ff\u1a1e-\u1a1f\u1aa0-\u1aa6\u1aa8-\u1aad\u1b4e-\u1b4f\u1b5a-\u1b6a\u1b74-\u1b7f\u1bfc-\u1bff\u1c3b-\u1c3f\u1c7e-\u1c7f\u1cc0-\u1cc7\u1cd3\u1fbd\u1fbf-\u1fc1\u1fcd-\u1fcf\u1fdd-\u1fdf\u1fed-\u1fef\u1ffd-\u1ffe\u2010-\u2027\u2030-\u205e\u207a-\u207e\u208a-\u208e\u20a0-\u20c0\u2100-\u2101\u2103-\u2106\u2108-\u2109\u2114\u2116-\u2118\u211e-\u2123\u2125\u2127\u2129\u212e\u213a-\u213b\u2140-\u2144\u214a-\u214d\u214f\u218a-\u218b\u2190-\u2429\u2440-\u244a\u249c-\u24e9\u2500-\u2775\u2794-\u2b73\u2b76-\u2b95\u2b97-\u2bff\u2ce5-\u2cea\u2cf9-\u2cfc\u2cfe-\u2cff\u2d70\u2e00-\u2e2e\u2e30-\u2e5d\u2e80-\u2e99\u2e9b-\u2ef3\u2f00-\u2fd5\u2ff0-\u2fff\u3001-\u3004\u3008-\u3020\u3030\u3036-\u3037\u303d-\u303f\u309b-\u309c\u30a0\u30fb\u3190-\u3191\u3196-\u319f\u31c0-\u31e5\u31ef\u3200-\u321e\u322a-\u3247\u3250\u3260-\u327f\u328a-\u32b0\u32c0-\u33ff\u4dc0-\u4dff\ua490-\ua4c6\ua4fe-\ua4ff\ua60d-\ua60f\ua673\ua67e\ua6f2-\ua6f7\ua700-\ua716\ua720-\ua721\ua789-\ua78a\ua828-\ua82b\ua836-\ua839\ua874-\ua877\ua8ce-\ua8cf\ua8f8-\ua8fa\ua8fc\ua92e-\ua92f\ua95f\ua9c1-\ua9cd\ua9de-\ua9df\uaa5c-\uaa5f\uaa77-\uaa79\uaade-\uaadf\uaaf0-\uaaf1\uab5b\uab6a-\uab6b\uabeb\ufb29\ufbb2-\ufbc2\ufd3e-\ufd4f\ufdcf\ufdfc-\ufdff\ufe10-\ufe19\ufe30-\ufe52\ufe54-\ufe66\ufe68-\ufe6b\uff01-\uff0f\uff1a-\uff20\uff3b-\uff40\uff5b-\uff65\uffe0-\uffe6\uffe8-\uffee\ufffc-\ufffd]$/;
var PLACEHOLDER = /^\uE000\d+\uE001/;
function createUnicodePunctuationPattern() {
  try {
    return new RegExp("^[\\p{P}\\p{S}]$", "u");
  } catch (e) {
    return BMP_PUNCTUATION;
  }
}
var UNICODE_PUNCTUATION = createUnicodePunctuationPattern();
function isPunctuation(character) {
  return character !== null && (ASCII_PUNCTUATION.test(character) || UNICODE_PUNCTUATION.test(character));
}
function characterAt(text, index, htmlEntities) {
  if (index >= text.length)
    return [null, 0];
  if (text[index] === "\uE000") {
    const placeholder = PLACEHOLDER.exec(text.slice(index));
    if (placeholder)
      return ["`", placeholder[0].length];
  }
  if (htmlEntities && text[index] === "&") {
    const match = ENTITY2.exec(text.slice(index, index + 6));
    if (match)
      return [DECODED_ENTITY2[match[0]], match[0].length];
  }
  const character = String.fromCodePoint(text.codePointAt(index));
  return [character, character.length];
}
function isEscaped2(text, index) {
  let slashes = 0;
  while (index > 0 && text[--index] === "\\")
    slashes++;
  return slashes % 2 === 1;
}
function skipHtmlTag(text, index) {
  if (text[index] !== "<")
    return index;
  const end = text.indexOf(">", index + 1);
  return end === -1 ? index : end + 1;
}
function nextVisibleCharacter(text, index, htmlEntities) {
  let position = index;
  while (position < text.length) {
    const afterTag = skipHtmlTag(text, position);
    if (afterTag !== position) {
      position = afterTag;
      continue;
    }
    return characterAt(text, position, htmlEntities)[0];
  }
  return "\n";
}
function delimiterFlags(marker, before, after) {
  const beforeWhitespace = /\s/u.test(before);
  const afterWhitespace = /\s/u.test(after);
  const beforePunctuation = isPunctuation(before);
  const afterPunctuation = isPunctuation(after);
  const leftFlanking = !afterWhitespace && (!afterPunctuation || beforeWhitespace || beforePunctuation);
  const rightFlanking = !beforeWhitespace && (!beforePunctuation || afterWhitespace || afterPunctuation);
  if (marker === "_") {
    return {
      canOpen: leftFlanking && (!rightFlanking || beforePunctuation),
      canClose: rightFlanking && (!leftFlanking || afterPunctuation)
    };
  }
  return { canOpen: leftFlanking, canClose: rightFlanking };
}
function scanDelimiters(text, htmlEntities) {
  const delimiters = [];
  let previousCharacter = "\n";
  let index = 0;
  while (index < text.length) {
    const afterTag = skipHtmlTag(text, index);
    if (afterTag !== index) {
      index = afterTag;
      continue;
    }
    const [character, length] = characterAt(text, index, htmlEntities);
    if ((character === "*" || character === "_") && !isEscaped2(text, index)) {
      const start = index;
      let count = 0;
      while (text[index] === character && !isEscaped2(text, index)) {
        count++;
        index++;
      }
      const flags = delimiterFlags(
        character,
        previousCharacter,
        nextVisibleCharacter(text, index, htmlEntities)
      );
      const delimiter = {
        marker: character,
        start,
        original: count,
        remaining: count,
        usedAsOpener: 0,
        usedAsCloser: 0,
        ...flags,
        previous: delimiters.length > 0 ? delimiters[delimiters.length - 1] : null,
        next: null
      };
      if (delimiter.previous)
        delimiter.previous.next = delimiter;
      delimiters.push(delimiter);
      previousCharacter = character;
      continue;
    }
    previousCharacter = character;
    index += length;
  }
  return delimiters;
}
function removeDelimiter(state, delimiter) {
  if (delimiter.previous)
    delimiter.previous.next = delimiter.next;
  else
    state.head = delimiter.next;
  if (delimiter.next)
    delimiter.next.previous = delimiter.previous;
  delimiter.previous = null;
  delimiter.next = null;
}
function removeBetween(opener, closer) {
  let delimiter = opener.next;
  while (delimiter && delimiter !== closer) {
    const next = delimiter.next;
    delimiter.previous = null;
    delimiter.next = null;
    delimiter = next;
  }
  opener.next = closer;
  closer.previous = opener;
}
function findEmphasis(text, { htmlEntities = false } = {}) {
  var _a;
  const delimiters = scanDelimiters(text, htmlEntities);
  const state = { head: (_a = delimiters[0]) != null ? _a : null };
  const matches = [];
  let closer = state.head;
  while (closer) {
    if (!closer.canClose) {
      closer = closer.next;
      continue;
    }
    let opener = closer.previous;
    while (opener) {
      const oddMatch = (closer.canOpen || opener.canClose) && (opener.original % 3 !== 0 || closer.original % 3 !== 0) && (opener.original + closer.original) % 3 === 0;
      if (opener.marker === closer.marker && opener.canOpen && !oddMatch)
        break;
      opener = opener.previous;
    }
    if (!opener) {
      const next2 = closer.next;
      if (!closer.canOpen)
        removeDelimiter(state, closer);
      closer = next2;
      continue;
    }
    const use = opener.remaining >= 2 && closer.remaining >= 2 ? 2 : 1;
    const openStart = opener.start + opener.original - opener.usedAsOpener - use;
    const closeStart = closer.start + closer.usedAsCloser;
    matches.push({
      type: use === 2 ? "strong" : "em",
      openStart,
      openEnd: openStart + use,
      closeStart,
      closeEnd: closeStart + use
    });
    opener.remaining -= use;
    closer.remaining -= use;
    opener.usedAsOpener += use;
    closer.usedAsCloser += use;
    removeBetween(opener, closer);
    const next = closer.next;
    if (opener.remaining === 0)
      removeDelimiter(state, opener);
    if (closer.remaining === 0) {
      removeDelimiter(state, closer);
      closer = next;
    }
  }
  return matches.sort((a, b) => a.openStart - b.openStart || b.closeEnd - a.closeEnd);
}
function renderEmphasis(text, options = {}) {
  const { includeEm = true, includeStrong = true } = options;
  const matches = findEmphasis(text, options).filter(
    (match) => match.type === "em" ? includeEm : includeStrong
  );
  if (matches.length === 0)
    return text;
  const boundaries = /* @__PURE__ */ new Map();
  const at = (position) => {
    if (!boundaries.has(position)) {
      boundaries.set(position, { openEnd: [], closeEnd: [], openStart: [], closeStart: [] });
    }
    return boundaries.get(position);
  };
  for (const match of matches) {
    const tag = match.type;
    at(match.openStart).openStart.push(`<${tag}><span class="syntax-marker">`);
    at(match.openEnd).openEnd.push("</span>");
    at(match.closeStart).closeStart.push('<span class="syntax-marker">');
    at(match.closeEnd).closeEnd.push(`</span></${tag}>`);
  }
  let result = "";
  let previous = 0;
  for (const position of [...boundaries.keys()].sort((a, b) => a - b)) {
    result += text.slice(previous, position);
    const events = boundaries.get(position);
    result += events.openEnd.join("");
    result += events.closeEnd.join("");
    result += events.openStart.join("");
    result += events.closeStart.join("");
    previous = position;
  }
  return result + text.slice(previous);
}

// src/parser.js
function decodeEscapedLine(html) {
  return html.replace(/&nbsp;/g, " ").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&");
}
var MarkdownParser = class {
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
    const heading = scanAtxHeading(decodeEscapedLine(html));
    if (!heading)
      return html;
    const indent = heading.indent.replace(/ /g, "&nbsp;");
    const opening = this.escapeHtml(heading.marker + heading.separator);
    const content = this.parseInlineElements(this.escapeHtml(heading.content));
    const closing = heading.closing ? `<span class="syntax-marker">${this.escapeHtml(heading.closing)}</span>` : "";
    return `<h${heading.level}>${indent}<span class="syntax-marker">${opening}</span>${content}${closing}</h${heading.level}>`;
  }
  /**
   * Parse horizontal rules
   * @param {string} html - HTML line to parse
   * @returns {string|null} Parsed horizontal rule or null
   */
  static parseHorizontalRule(html) {
    const source = decodeEscapedLine(html);
    if (!scanThematicBreak(source))
      return null;
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
    if (!blockquote)
      return html;
    const indent = blockquote.indent.replace(/ /g, "&nbsp;");
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
    if (scanThematicBreak(source))
      return html;
    const listItem = scanListItem(source);
    if (!listItem || listItem.listType !== "bullet")
      return html;
    const indent = listItem.indent.replace(/ /g, "&nbsp;");
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
      if (spacingAfterBox === "" && content !== "")
        return match;
      content = this.parseInlineElements(content);
      if (isPreviewMode) {
        const isChecked = checked.toLowerCase() === "x";
        return `${indent}<li class="task-list"><input type="checkbox" ${isChecked ? "checked" : ""}> ${content}</li>`;
      } else {
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
    if (!listItem || listItem.listType !== "ordered")
      return html;
    const indent = listItem.indent.replace(/ /g, "&nbsp;");
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
    const className = raw ? ' class="raw-line"' : "";
    return `<div${className}><span class="code-fence">${source}</span></div>`;
  }
  static renderCodeContent(lines, info, instanceHighlighter, indentation = 0, rawLineIndex = -1) {
    const semanticLines = lines.map((line) => {
      let width = 0;
      while (width < indentation && line[width] === " ")
        width++;
      return { source: line, prefix: line.slice(0, width), content: line.slice(width) };
    });
    const semanticContent = semanticLines.map((line) => line.content).join("\n");
    const renderPrefix = (prefix) => prefix ? `<span class="syntax-marker">${this.escapeHtml(prefix)}</span>` : "";
    const displayContent = semanticLines.map((line, index) => {
      if (index === rawLineIndex) {
        return `<span class="raw-line">${this.escapeHtml(line.source) || "&nbsp;"}</span>`;
      }
      if (line.prefix === "" && line.content === "")
        return '<span class="syntax-marker">&nbsp;</span>';
      return renderPrefix(line.prefix) + this.escapeHtml(line.content);
    }).join("\n");
    const language = info.split(/[\t ]/, 1)[0];
    const languageClass = language ? ` class="language-${this.escapeHtml(language)}"` : "";
    const highlighter = instanceHighlighter || this.codeHighlighter;
    let content = displayContent;
    if (highlighter) {
      try {
        const result = highlighter(semanticContent, language);
        if (result && typeof result.then === "function") {
          console.warn("Async highlighters are not supported in parse() because it returns an HTML string. Use synchronous highlighters only.");
        } else if (result && typeof result === "string" && result.trim()) {
          const highlightedLines = result.split("\n");
          if (highlightedLines.length === semanticLines.length + 1 && highlightedLines[highlightedLines.length - 1] === "") {
            highlightedLines.pop();
          }
          if (highlightedLines.length === semanticLines.length) {
            content = highlightedLines.map((line, index) => {
              if (index === rawLineIndex) {
                return `<span class="raw-line">${this.escapeHtml(semanticLines[index].source) || "&nbsp;"}</span>`;
              }
              return renderPrefix(semanticLines[index].prefix) + line;
            }).join("\n");
          } else {
            console.warn("Code highlighter output line count does not match the source. Using unhighlighted code to preserve alignment.");
          }
        }
      } catch (error) {
        console.warn("Code highlighting failed:", error);
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
    html = html.replace(new RegExp("(?<!~)~~(?!~)(.+?)(?<!~)~~(?!~)", "g"), '<del><span class="syntax-marker">~~</span>$1<span class="syntax-marker">~~</span></del>');
    html = html.replace(new RegExp("(?<!~)~(?!~)(.+?)(?<!~)~(?!~)", "g"), '<del><span class="syntax-marker">~</span>$1<span class="syntax-marker">~</span></del>');
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
    const trimmed = url.trim();
    const lower = trimmed.toLowerCase();
    const safeProtocols = [
      "http://",
      "https://",
      "mailto:",
      "ftp://",
      "ftps://"
    ];
    const hasSafeProtocol = safeProtocols.some((protocol) => lower.startsWith(protocol));
    const isRelative = trimmed.startsWith("/") || trimmed.startsWith("#") || trimmed.startsWith("?") || trimmed.startsWith(".") || !trimmed.includes(":") && !trimmed.includes("//");
    if (hasSafeProtocol || isRelative) {
      return url;
    }
    return "#";
  }
  static findLinks(text, options = {}) {
    const { allowEmptyText = false, ...scannerOptions } = options;
    return findLinks(text, scannerOptions).filter(
      (link) => (allowEmptyText || link.text.raw.length > 0) && link.destination !== null && link.destination.value.length > 0
    );
  }
  static findRenderableLinks(text, options = {}) {
    const { allowEmptyText = false, ...scannerOptions } = options;
    return findRenderableLinks(text, scannerOptions).filter(
      (link) => (allowEmptyText || link.text.raw.length > 0) && link.destination !== null && link.destination.value.length > 0
    );
  }
  /**
   * Parse links
   * @param {string} html - HTML with potential link markdown
   * @returns {string} HTML with link styling
   */
  static parseLinks(html) {
    const links = this.findLinks(html, { htmlEntities: true });
    links.forEach((link) => {
      link.anchorName = `--link-${this.linkIndex++}`;
    });
    for (const link of links.reverse()) {
      const safeUrl = this.escapeHtml(this.sanitizeUrl(link.destination.value));
      const title = link.title === null ? "" : ` title="${this.escapeHtml(link.title.value)}"`;
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
    const sanctuaries = /* @__PURE__ */ new Map();
    let sanctuaryCounter = 0;
    let protectedText = text;
    const links = text.includes("[") ? this.findRenderableLinks(text, { htmlEntities: true }) : [];
    const protectedRegions = links.map((link) => ({ start: link.text.end, end: link.end }));
    const codeMatches = findCodeSpans(text, protectedRegions);
    codeMatches.sort((a, b) => b.start - a.start);
    codeMatches.forEach((codeInfo) => {
      const placeholder = `\uE000${sanctuaryCounter++}\uE001`;
      sanctuaries.set(placeholder, {
        type: "code",
        original: codeInfo.raw,
        openTicks: codeInfo.openTicks,
        content: codeInfo.content,
        closeTicks: codeInfo.closeTicks
      });
      protectedText = protectedText.substring(0, codeInfo.start) + placeholder + protectedText.substring(codeInfo.end);
    });
    const codePlaceholders = [...sanctuaries.keys()];
    const protectedLinks = (protectedText.includes("[") ? this.findLinks(protectedText, { htmlEntities: true }) : []).filter((link) => {
      const tail = protectedText.slice(link.text.end, link.end);
      return codePlaceholders.every((placeholder) => !tail.includes(placeholder));
    });
    protectedLinks.sort((a, b) => b.start - a.start).forEach((link) => {
      var _a, _b;
      const placeholder = `\uE000${sanctuaryCounter++}\uE001`;
      sanctuaries.set(placeholder, {
        type: "link",
        original: protectedText.slice(link.start, link.end),
        linkText: protectedText.slice(link.text.start, link.text.end),
        tail: protectedText.slice(link.text.end, link.end),
        url: link.destination.value,
        title: (_b = (_a = link.title) == null ? void 0 : _a.value) != null ? _b : null
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
    const placeholders = Array.from(sanctuaries.keys()).sort((a, b) => {
      const indexA = html.indexOf(a);
      const indexB = html.indexOf(b);
      return indexA - indexB;
    });
    placeholders.forEach((placeholder) => {
      const sanctuary = sanctuaries.get(placeholder);
      let replacement;
      if (sanctuary.type === "code") {
        replacement = `<code><span class="syntax-marker">${sanctuary.openTicks}</span>${sanctuary.content}<span class="syntax-marker">${sanctuary.closeTicks}</span></code>`;
      } else if (sanctuary.type === "link") {
        let processedLinkText = sanctuary.linkText;
        processedLinkText = this.parseStrikethrough(processedLinkText);
        processedLinkText = this.parseEmphasis(processedLinkText);
        sanctuaries.forEach((innerSanctuary, innerPlaceholder) => {
          if (processedLinkText.includes(innerPlaceholder) && innerSanctuary.type === "code") {
            const codeHtml = `<code><span class="syntax-marker">${innerSanctuary.openTicks}</span>${innerSanctuary.content}<span class="syntax-marker">${innerSanctuary.closeTicks}</span></code>`;
            processedLinkText = processedLinkText.replace(innerPlaceholder, () => codeHtml);
          }
        });
        const anchorName = `--link-${this.linkIndex++}`;
        const safeUrl = this.escapeHtml(this.sanitizeUrl(sanctuary.url));
        const title = sanctuary.title === null ? "" : ` title="${this.escapeHtml(sanctuary.title)}"`;
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
    const { protectedText, sanctuaries } = this.identifyAndProtectSanctuaries(text);
    let html = protectedText;
    html = this.parseStrikethrough(html);
    html = this.parseEmphasis(html);
    html = this.restoreAndTransformSanctuaries(html, sanctuaries);
    return html;
  }
  /**
   * Parse a single line of markdown
   * @param {string} line - Raw markdown line
   * @returns {string} Parsed HTML line
   */
  static parseLine(line, isPreviewMode = false) {
    if (line === "")
      return "<div>&nbsp;</div>";
    const thematicBreak = scanThematicBreak(line);
    if (thematicBreak) {
      const source = this.preserveIndentation(this.escapeHtml(line), line);
      return `<div><span class="hr-marker">${source}</span></div>`;
    }
    const fence = scanFenceOpen(line);
    if (fence)
      return this.renderFence(fence);
    const heading = scanAtxHeading(line);
    if (heading) {
      const indent = heading.indent.replace(/ /g, "&nbsp;");
      const opening = this.escapeHtml(heading.marker + heading.separator);
      const content = this.parseInlineElements(this.escapeHtml(heading.content));
      const closing = heading.closing ? `<span class="syntax-marker">${this.escapeHtml(heading.closing)}</span>` : "";
      return `<div><h${heading.level}>${indent}<span class="syntax-marker">${opening}</span>${content}${closing}</h${heading.level}></div>`;
    }
    const blockquote = scanBlockquote(line);
    if (blockquote) {
      const indent = blockquote.indent.replace(/ /g, "&nbsp;");
      const marker = this.escapeHtml(blockquote.marker);
      const separator = this.escapeHtml(blockquote.separator);
      const content = this.parseInlineElements(this.escapeHtml(blockquote.content));
      return `<div>${indent}<span class="blockquote"><span class="syntax-marker">${marker}</span>${separator}${content}</span></div>`;
    }
    let html = this.preserveIndentation(this.escapeHtml(line), line);
    const taskList = this.parseTaskList(html, isPreviewMode);
    if (taskList !== html)
      return `<div>${taskList}</div>`;
    const listItem = scanListItem(line);
    if (listItem) {
      const indent = listItem.indent.replace(/ /g, "&nbsp;");
      const marker = this.escapeHtml(listItem.marker + listItem.separator);
      const content = this.parseInlineElements(this.escapeHtml(listItem.content));
      const className = listItem.listType === "bullet" ? "bullet-list" : "ordered-list";
      return `<div>${indent}<li class="${className}"><span class="syntax-marker">${marker}</span>${content}</li></div>`;
    }
    const leadingWhitespace = /^[\t ]*/.exec(line)[0];
    const indentation = leadingWhitespace.replace(/ /g, "&nbsp;");
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
    this.resetLinkIndex();
    const lines = text.split("\n");
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
          if (isRaw)
            rawCodeLine = codeLines.length;
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
        const content = this.escapeHtml(line) || "&nbsp;";
        parsedLines.push(`<div class="raw-line">${content}</div>`);
        continue;
      }
      parsedLines.push(this.applyCustomSyntax(this.parseLine(line, isPreviewMode)));
    }
    if (opening && codeLines.length > 0) {
      parsedLines.push(this.renderCodeContent(codeLines, opening.info, instanceHighlighter, opening.indent.length, rawCodeLine));
    }
    const html = parsedLines.join("");
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
    processed = processed.replace(/((?:<div(?:\s[^>]*)?>(?:&nbsp;)*<li class="bullet-list">.*?<\/li><\/div>\s*)+)/gs, (match) => {
      const divs = match.match(/<div(?:\s[^>]*)?>(?:&nbsp;)*<li class="bullet-list">.*?<\/li><\/div>/gs) || [];
      if (divs.length > 0) {
        const items = divs.map((div) => {
          const indentMatch = div.match(/<div(?:\s[^>]*)?>((?:&nbsp;)*)<li/);
          const listItemMatch = div.match(/<li class="bullet-list">.*?<\/li>/);
          if (indentMatch && listItemMatch) {
            const indentation = indentMatch[1];
            const listItem = listItemMatch[0];
            return listItem.replace(/<li class="bullet-list">/, `<li class="bullet-list">${indentation}`);
          }
          return listItemMatch ? listItemMatch[0] : "";
        }).filter(Boolean);
        return "<ul>" + items.join("") + "</ul>";
      }
      return match;
    });
    processed = processed.replace(/((?:<div(?:\s[^>]*)?>(?:&nbsp;)*<li class="ordered-list">.*?<\/li><\/div>\s*)+)/gs, (match) => {
      const divs = match.match(/<div(?:\s[^>]*)?>(?:&nbsp;)*<li class="ordered-list">.*?<\/li><\/div>/gs) || [];
      if (divs.length > 0) {
        const items = divs.map((div) => {
          const indentMatch = div.match(/<div(?:\s[^>]*)?>((?:&nbsp;)*)<li/);
          const listItemMatch = div.match(/<li class="ordered-list">.*?<\/li>/);
          if (indentMatch && listItemMatch) {
            const indentation = indentMatch[1];
            const listItem = listItemMatch[0];
            return listItem.replace(/<li class="ordered-list">/, `<li class="ordered-list">${indentation}`);
          }
          return listItemMatch ? listItemMatch[0] : "";
        }).filter(Boolean);
        const firstMarker = divs[0].match(/<span class="syntax-marker">(\d+)\./);
        const start = firstMarker ? Number.parseInt(firstMarker[1], 10) : 1;
        const startAttribute = start === 1 ? "" : ` start="${start}"`;
        return `<ol${startAttribute}>` + items.join("") + "</ol>";
      }
      return match;
    });
    const codeBlockRegex = /<div><span class="code-fence">(```[^<]*)<\/span><\/div>(.*?)<div><span class="code-fence">(```)<\/span><\/div>/gs;
    if (processCodeBlocks)
      processed = processed.replace(codeBlockRegex, (match, openFence, content, closeFence) => {
        if (content.includes('<pre class="code-block">'))
          return match;
        const lines = content.match(/<div>(.*?)<\/div>/gs) || [];
        const encodedLines = lines.map((line) => line.replace(/<div>(.*?)<\/div>/s, "$1"));
        const codeContent = encodedLines.map(
          (line) => line === "&nbsp;" ? "" : line.replace(/&nbsp;/g, " ")
        ).join("\n");
        const displayContent = encodedLines.join("\n");
        const lang = openFence.slice(3).trim();
        const langClass = lang ? ` class="language-${lang}"` : "";
        let highlightedContent = displayContent;
        const highlighter = instanceHighlighter || this.codeHighlighter;
        if (highlighter) {
          try {
            const decodedCode = codeContent.replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&");
            const result2 = highlighter(decodedCode, lang);
            if (result2 && typeof result2.then === "function") {
              console.warn("Async highlighters are not supported in Node.js (non-DOM) context. Use synchronous highlighters for server-side rendering.");
            } else {
              if (result2 && typeof result2 === "string" && result2.trim()) {
                highlightedContent = result2;
              }
            }
          } catch (error) {
            console.warn("Code highlighting failed:", error);
          }
        }
        let result = `<div><span class="code-fence">${openFence}</span></div>`;
        result += `<pre class="code-block"><code${langClass}>${highlightedContent}</code></pre>`;
        result += `<div><span class="code-fence">${closeFence}</span></div>`;
        return result;
      });
    return processed;
  }
  /**
   * Get list context at cursor position
   * @param {string} text - Full text content
   * @param {number} cursorPosition - Current cursor position
   * @returns {Object} List context information
   */
  static getListContext(text, cursorPosition) {
    const lines = text.split("\n");
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
      currentPos += lineLength + 1;
    }
    const currentLine = lines[lineIndex];
    const lineEnd = lineStart + currentLine.length;
    const plainContext = {
      inList: false,
      listType: null,
      indent: "",
      marker: null,
      content: currentLine,
      lineStart,
      lineEnd,
      markerEndPos: lineStart
    };
    if (scanThematicBreak(currentLine))
      return plainContext;
    const listItem = scanListItem(currentLine);
    if (!listItem)
      return plainContext;
    const checkboxMatch = listItem.listType === "bullet" && listItem.marker === "-" ? /^\[([ xX])\]([\t ]*)(.*)$/.exec(listItem.content) : null;
    if (checkboxMatch && (checkboxMatch[2] !== "" || checkboxMatch[3] === "")) {
      return {
        inList: true,
        listType: "checkbox",
        indent: listItem.indent,
        marker: "-",
        checked: checkboxMatch[1].toLowerCase() === "x",
        content: checkboxMatch[3],
        lineStart,
        lineEnd,
        markerEndPos: lineStart + listItem.indent.length + listItem.marker.length + listItem.separator.length + 3 + checkboxMatch[2].length
      };
    }
    if (listItem.listType === "bullet") {
      return {
        inList: true,
        listType: "bullet",
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
      listType: "numbered",
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
      case "bullet":
        return `${context.indent}${context.marker} `;
      case "numbered":
        return `${context.indent}${context.marker + 1}. `;
      case "checkbox":
        return `${context.indent}- [ ] `;
      default:
        return "";
    }
  }
  /**
   * Renumber all numbered lists in text
   * @param {string} text - Text containing numbered lists
   * @returns {string} Text with renumbered lists
   */
  static renumberLists(text) {
    const lines = text.split("\n");
    const numbersByIndent = /* @__PURE__ */ new Map();
    let inList = false;
    const result = lines.map((line) => {
      const match = line.match(this.LIST_PATTERNS.numbered);
      if (match) {
        const indent = match[1];
        const indentLevel = indent.length;
        const content = match[3];
        if (!inList) {
          numbersByIndent.clear();
        }
        const currentNumber = (numbersByIndent.get(indentLevel) || 0) + 1;
        numbersByIndent.set(indentLevel, currentNumber);
        for (const [level] of numbersByIndent) {
          if (level > indentLevel) {
            numbersByIndent.delete(level);
          }
        }
        inList = true;
        return `${indent}${currentNumber}. ${content}`;
      } else {
        if (line.trim() === "" || !line.match(/^\s/)) {
          inList = false;
          numbersByIndent.clear();
        }
        return line;
      }
    });
    return result.join("\n");
  }
};
// Track link index for anchor naming
__publicField(MarkdownParser, "linkIndex", 0);
// Global code highlighter function
__publicField(MarkdownParser, "codeHighlighter", null);
// Custom syntax processor function
__publicField(MarkdownParser, "customSyntax", null);
/**
 * List pattern definitions
 */
__publicField(MarkdownParser, "LIST_PATTERNS", {
  bullet: /^( *)([-*+])[\t ]+(.*)$/,
  numbered: /^( *)(\d{1,9})\.[\t ]+(.*)$/,
  checkbox: /^( *)-[\t ]+\[([ xX])\][\t ]+(.*)$/
});

// src/shortcuts.js
var ShortcutsManager = class {
  constructor(editor) {
    this.editor = editor;
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
    if (event.key === "]") {
      event.preventDefault();
      this.editor.indentSelection();
      return true;
    }
    if (event.key === "[") {
      event.preventDefault();
      this.editor.outdentSelection();
      return true;
    }
    let actionId = null;
    switch (event.key.toLowerCase()) {
      case "b":
        if (!event.shiftKey)
          actionId = "toggleBold";
        break;
      case "i":
        if (!event.shiftKey)
          actionId = "toggleItalic";
        break;
      case "k":
        if (!event.shiftKey)
          actionId = "insertLink";
        break;
      case "7":
        if (event.shiftKey)
          actionId = "toggleNumberedList";
        break;
      case "8":
        if (event.shiftKey)
          actionId = "toggleBulletList";
        break;
    }
    if (actionId) {
      event.preventDefault();
      this.editor.performAction(actionId, event);
      return true;
    }
    return false;
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
    textPrimary: "#0d3b66",
    // Yale Blue - primary text (same as text)
    textSecondary: "#5a7a9b",
    // Muted blue - secondary text
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
    del: "#ee964b",
    // Sandy Brown - deleted text (same as strong)
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
    syntax: "#999999",
    // Gray - syntax highlighting fallback
    cursor: "#f95738",
    // Tomato - cursor
    selection: "rgba(244, 211, 94, 0.4)",
    // Naples Yellow with transparency
    listMarker: "#ee964b",
    // Sandy Brown - list markers
    rawLine: "#5a7a9b",
    // Muted blue - raw line indicators
    border: "#e0e0e0",
    // Light gray - borders
    hoverBg: "#f0f0f0",
    // Very light gray - hover backgrounds
    primary: "#0d3b66",
    // Yale Blue - primary accent
    // Toolbar colors
    toolbarBg: "#ffffff",
    // White - toolbar background
    toolbarIcon: "#0d3b66",
    // Yale Blue - icon color
    toolbarHover: "#f5f5f5",
    // Light gray - hover background
    toolbarActive: "#faf0ca",
    // Lemon Chiffon - active button background
    placeholder: "#999999"
    // Gray - placeholder text
  },
  previewColors: {
    text: "#0d3b66",
    h1: "inherit",
    h2: "inherit",
    h3: "inherit",
    strong: "inherit",
    em: "inherit",
    link: "#0d3b66",
    code: "#0d3b66",
    codeBg: "rgba(244, 211, 94, 0.4)",
    blockquote: "#5a7a9b",
    hr: "#5a7a9b",
    bg: "transparent"
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
    textPrimary: "#c5dde8",
    // Light blue-gray - primary text (same as text)
    textSecondary: "#9fcfec",
    // Brighter blue - secondary text
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
    del: "#f6ae2d",
    // Hunyadi Yellow - deleted text (same as strong)
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
    syntax: "#7a8c98",
    // Muted gray-blue - syntax highlighting fallback
    cursor: "#f26419",
    // Orange Pantone - cursor
    selection: "rgba(51, 101, 138, 0.4)",
    // Lapis Lazuli with transparency
    listMarker: "#f6ae2d",
    // Hunyadi Yellow - list markers
    rawLine: "#9fcfec",
    // Brighter blue - raw line indicators
    border: "#2a3f52",
    // Dark blue-gray - borders
    hoverBg: "#243546",
    // Slightly lighter charcoal - hover backgrounds
    primary: "#9fcfec",
    // Brighter blue - primary accent
    // Toolbar colors for dark theme
    toolbarBg: "#1D2D3E",
    // Darker charcoal - toolbar background
    toolbarIcon: "#c5dde8",
    // Light blue-gray - icon color
    toolbarHover: "#243546",
    // Slightly lighter charcoal - hover background
    toolbarActive: "#2a3f52",
    // Even lighter - active button background
    placeholder: "#6a7a88"
    // Muted blue-gray - placeholder text
  },
  previewColors: {
    text: "#c5dde8",
    h1: "inherit",
    h2: "inherit",
    h3: "inherit",
    strong: "inherit",
    em: "inherit",
    link: "#9fcfec",
    code: "#c5dde8",
    codeBg: "#1a232b",
    blockquote: "#9fcfec",
    hr: "#c5dde8",
    bg: "transparent"
  }
};
var themes = {
  solar,
  cave,
  auto: solar,
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
function resolveAutoTheme(themeName) {
  if (themeName !== "auto")
    return themeName;
  const mq = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)");
  return (mq == null ? void 0 : mq.matches) ? "cave" : "solar";
}
function themeToCSSVars(colors, previewColors) {
  const vars = [];
  for (const [key, value] of Object.entries(colors)) {
    const varName = key.replace(/([A-Z])/g, "-$1").toLowerCase();
    vars.push(`--${varName}: ${value};`);
  }
  if (previewColors) {
    for (const [key, value] of Object.entries(previewColors)) {
      const varName = key.replace(/([A-Z])/g, "-$1").toLowerCase();
      vars.push(`--preview-${varName}-default: ${value};`);
    }
  }
  return vars.join("\n");
}
function mergeTheme(baseTheme, customColors = {}, customPreviewColors = {}) {
  return {
    ...baseTheme,
    colors: {
      ...baseTheme.colors,
      ...customColors
    },
    previewColors: {
      ...baseTheme.previewColors,
      ...customPreviewColors
    }
  };
}

// src/styles.js
function generateStyles(options = {}) {
  const {
    fontSize = "14px",
    lineHeight = 1.6,
    /* System-first, guaranteed monospaced; avoids Android 'ui-monospace' pitfalls */
    fontFamily = '"SF Mono", SFMono-Regular, Menlo, Monaco, "Cascadia Code", Consolas, "Roboto Mono", "Noto Sans Mono", "Droid Sans Mono", "Ubuntu Mono", "DejaVu Sans Mono", "Liberation Mono", "Courier New", Courier, monospace',
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
  const themeVars = theme && theme.colors ? themeToCSSVars(theme.colors, theme.previewColors) : "";
  return `
    /* OverType Editor Styles */
    
    /* Middle-ground CSS Reset - Prevent parent styles from leaking in */
    .overtype-container * {
      /* Box model - these commonly leak */
      margin: 0 !important;
      padding: 0 !important;
      border: 0 !important;
      
      /* Layout - these can break our layout */
      /* Don't reset position - it breaks dropdowns */
      float: none !important;
      clear: none !important;
      
      /* Typography - only reset decorative aspects */
      text-decoration: none !important;
      text-transform: none !important;
      letter-spacing: normal !important;
      
      /* Visual effects that can interfere */
      box-shadow: none !important;
      text-shadow: none !important;
      
      /* Ensure box-sizing is consistent */
      box-sizing: border-box !important;
      
      /* Keep inheritance for these */
      /* font-family, color, line-height, font-size - inherit */
    }
    
    /* Container base styles after reset */
    .overtype-container {
      display: flex !important;
      flex-direction: column !important;
      width: 100% !important;
      height: 100% !important;
      position: relative !important; /* Override reset - needed for absolute children */
      overflow: visible !important; /* Allow dropdown to overflow container */
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important;
      text-align: left !important;
      ${themeVars ? `
      /* Theme Variables */
      ${themeVars}` : ""}
    }
    
    /* Force left alignment for all elements in the editor */
    .overtype-container .overtype-wrapper * {
      text-align: left !important;
    }
    
    /* Auto-resize mode styles */
    .overtype-container.overtype-auto-resize {
      height: auto !important;
    }

    .overtype-container.overtype-auto-resize .overtype-wrapper {
      flex: 0 0 auto !important; /* Don't grow/shrink, use explicit height */
      height: auto !important;
      min-height: 60px !important;
      overflow: visible !important;
    }
    
    .overtype-wrapper {
      position: relative !important; /* Override reset - needed for absolute children */
      width: 100% !important;
      flex: 1 1 0 !important; /* Grow to fill remaining space, with flex-basis: 0 */
      min-height: 60px !important; /* Minimum usable height */
      overflow: hidden !important;
      background: var(--bg-secondary, #ffffff) !important;
      z-index: 1; /* Below toolbar and dropdown */
    }

    /* Critical alignment styles - must be identical for both layers */
    .overtype-wrapper .overtype-input,
    .overtype-wrapper .overtype-preview {
      /* Positioning - must be identical */
      position: absolute !important; /* Override reset - required for overlay */
      top: 0 !important;
      left: 0 !important;
      width: 100% !important;
      height: 100% !important;

      /* Font properties - any difference breaks alignment */
      font-family: var(--instance-font-family, ${fontFamily}) !important;
      font-variant-ligatures: none !important; /* keep metrics stable for code */
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
      /* overscroll-behavior removed to allow scroll-through to parent */
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
      
      /* Disable autofill */
      autocomplete: off !important;
      autocorrect: off !important;
      autocapitalize: off !important;
    }

    .overtype-wrapper .overtype-input::selection {
      background-color: var(--selection, rgba(244, 211, 94, 0.4));
    }

    /* Placeholder shim - visible when textarea is empty */
    .overtype-wrapper .overtype-placeholder {
      position: absolute !important;
      top: 0 !important;
      left: 0 !important;
      width: 100% !important;
      z-index: 0 !important;
      pointer-events: none !important;
      user-select: none !important;
      font-family: var(--instance-font-family, ${fontFamily}) !important;
      font-size: var(--instance-font-size, ${fontSize}) !important;
      line-height: var(--instance-line-height, ${lineHeight}) !important;
      padding: var(--instance-padding, ${padding}) !important;
      box-sizing: border-box !important;
      color: var(--placeholder, #999) !important;
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

    /* Prevent external resets (Tailwind, Bootstrap, etc.) from breaking alignment.
       Any element whose font metrics differ from the textarea causes the CSS "strut"
       to inflate line boxes, drifting the overlay. Force inheritance so every element
       inside the preview matches the textarea exactly. */
    .overtype-wrapper .overtype-preview * {
      font-family: inherit !important;
      font-size: inherit !important;
      line-height: inherit !important;
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

    /* Semantic headers - flatten in edit mode */
    .overtype-wrapper .overtype-preview h1,
    .overtype-wrapper .overtype-preview h2,
    .overtype-wrapper .overtype-preview h3 {
      font-size: inherit !important;
      font-weight: bold !important;
      margin: 0 !important;
      padding: 0 !important;
      display: inline !important;
      line-height: inherit !important;
    }

    /* Header colors for semantic headers */
    .overtype-wrapper .overtype-preview h1 { 
      color: var(--h1, #f95738) !important; 
    }
    .overtype-wrapper .overtype-preview h2 { 
      color: var(--h2, #ee964b) !important; 
    }
    .overtype-wrapper .overtype-preview h3 { 
      color: var(--h3, #3d8a51) !important; 
    }

    /* Lists - remove styling in edit mode */
    .overtype-wrapper .overtype-preview ul,
    .overtype-wrapper .overtype-preview ol {
      list-style: none !important;
      margin: 0 !important;
      padding: 0 !important;
      display: block !important; /* Lists need to be block for line breaks */
    }

    .overtype-wrapper .overtype-preview li {
      display: block !important; /* Each item on its own line */
      margin: 0 !important;
      padding: 0 !important;
      /* Don't set list-style here - let ul/ol control it */
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

    /* Strikethrough text */
    .overtype-wrapper .overtype-preview del {
      color: var(--del, #ee964b) !important;
      text-decoration: line-through !important;
      text-decoration-color: var(--del, #ee964b) !important;
      text-decoration-thickness: 1px !important;
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

    /* Code blocks - consolidated pre blocks */
    .overtype-wrapper .overtype-preview pre {
      padding: 0 !important;
      margin: 0 !important;
      border-radius: 4px !important;
      overflow-x: auto !important;
    }
    
    /* Code block styling in normal mode - yellow background */
    .overtype-wrapper .overtype-preview pre.code-block {
      background: var(--code-bg, rgba(244, 211, 94, 0.4)) !important;
      white-space: break-spaces !important; /* Prevent horizontal scrollbar that breaks alignment */
    }

    /* Code inside pre blocks - remove background */
    .overtype-wrapper .overtype-preview pre code {
      background: transparent !important;
      color: var(--code, #0d3b66) !important;
      font-family: var(--instance-font-family, ${fontFamily}) !important; /* Match textarea font exactly for alignment */
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
    
    /* Stats bar - positioned by flexbox */
    .overtype-stats {
      height: 40px !important;
      padding: 0 20px !important;
      background: var(--bg-secondary, #f8f9fa) !important;
      border-top: 1px solid var(--border, #e0e0e0) !important;
      display: flex !important;
      justify-content: space-between !important;
      align-items: center !important;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
      font-size: 0.85rem !important;
      color: var(--text-secondary, #666) !important;
      flex-shrink: 0 !important; /* Don't shrink */
      z-index: 10001 !important; /* Above link tooltip */
      position: relative !important; /* Enable z-index */
    }


    .overtype-stats .overtype-stat {
      display: flex !important;
      align-items: center !important;
      gap: 5px !important;
      white-space: nowrap !important;
    }
    
    .overtype-stats .live-dot {
      width: 8px !important;
      height: 8px !important;
      background: #4caf50 !important;
      border-radius: 50% !important;
      animation: overtype-pulse 2s infinite !important;
    }
    
    @keyframes overtype-pulse {
      0%, 100% { opacity: 1; transform: scale(1); }
      50% { opacity: 0.6; transform: scale(1.2); }
    }
    

    /* Toolbar Styles */
    .overtype-toolbar.overtype-toolbar-hidden {
      display: none !important;
    }

    .overtype-toolbar {
      display: flex !important;
      align-items: center !important;
      gap: 4px !important;
      padding: 8px !important; /* Override reset */
      background: var(--toolbar-bg, var(--bg-primary, #f8f9fa)) !important; /* Override reset */
      border-bottom: 1px solid var(--toolbar-border, transparent) !important; /* Override reset */
      overflow-x: auto !important; /* Allow horizontal scrolling */
      overflow-y: hidden !important; /* Hide vertical overflow */
      -webkit-overflow-scrolling: touch !important;
      flex-shrink: 0 !important;
      height: auto !important;
      position: relative !important; /* Override reset */
      z-index: 100 !important; /* Ensure toolbar is above wrapper */
      scrollbar-width: thin; /* Thin scrollbar on Firefox */
    }
    
    /* Thin scrollbar styling */
    .overtype-toolbar::-webkit-scrollbar {
      height: 4px;
    }
    
    .overtype-toolbar::-webkit-scrollbar-track {
      background: transparent;
    }
    
    .overtype-toolbar::-webkit-scrollbar-thumb {
      background: rgba(0, 0, 0, 0.2);
      border-radius: 2px;
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
    
    /* Plain mode - hide preview and show textarea text */
    .overtype-container[data-mode="plain"] .overtype-preview {
      display: none !important;
    }
    
    .overtype-container[data-mode="plain"] .overtype-input {
      color: var(--text, #0d3b66) !important;
      /* Use system font stack for better plain text readability */
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, 
                   "Helvetica Neue", Arial, sans-serif !important;
    }
    
    /* Ensure textarea remains transparent in overlay mode */
    .overtype-container:not([data-mode="plain"]) .overtype-input {
      color: transparent !important;
    }

    /* Dropdown menu styles */
    .overtype-toolbar-button {
      position: relative !important; /* Override reset - needed for dropdown */
    }

    .overtype-toolbar-button.dropdown-active {
      background: var(--toolbar-active, var(--hover-bg, #f0f0f0));
    }

    .overtype-dropdown-menu {
      position: fixed !important; /* Fixed positioning relative to viewport */
      background: var(--bg-secondary, white) !important; /* Override reset */
      border: 1px solid var(--border, #e0e0e0) !important; /* Override reset */
      border-radius: 6px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1) !important; /* Override reset */
      z-index: 10000; /* Very high z-index to ensure visibility */
      min-width: 150px;
      padding: 4px 0 !important; /* Override reset */
      /* Position will be set via JavaScript based on button position */
    }

    .overtype-dropdown-item {
      display: flex;
      align-items: center;
      width: 100%;
      padding: 8px 12px;
      border: none;
      background: none;
      text-align: left;
      cursor: pointer;
      font-size: 14px;
      color: var(--text, #333);
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    }

    .overtype-dropdown-item:hover {
      background: var(--hover-bg, #f0f0f0);
    }

    .overtype-dropdown-item.active {
      font-weight: 600;
    }

    .overtype-dropdown-check {
      width: 16px;
      margin-right: 8px;
      color: var(--h1, #007bff);
    }

    .overtype-dropdown-icon {
      width: 20px;
      margin-right: 8px;
      text-align: center;
    }

    /* Preview mode styles */
    .overtype-container[data-mode="preview"] .overtype-input {
      display: none !important;
    }

    .overtype-container[data-mode="preview"] .overtype-preview {
      pointer-events: auto !important;
      user-select: text !important;
      cursor: text !important;
    }

    .overtype-container.overtype-auto-resize[data-mode="preview"] .overtype-preview {
      position: static !important;
      height: auto !important;
    }

    /* Hide syntax markers in preview mode */
    .overtype-container[data-mode="preview"] .syntax-marker {
      display: none !important;
    }
    
    /* Hide URL part of links in preview mode - extra specificity */
    .overtype-container[data-mode="preview"] .syntax-marker.url-part,
    .overtype-container[data-mode="preview"] .url-part {
      display: none !important;
    }
    
    /* Hide all syntax markers inside links too */
    .overtype-container[data-mode="preview"] a .syntax-marker {
      display: none !important;
    }

    /* Headers - restore proper sizing in preview mode */
    .overtype-container[data-mode="preview"] .overtype-wrapper .overtype-preview h1,
    .overtype-container[data-mode="preview"] .overtype-wrapper .overtype-preview h2,
    .overtype-container[data-mode="preview"] .overtype-wrapper .overtype-preview h3 {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important;
      font-weight: 600 !important;
      margin: 0 !important;
      display: block !important;
      line-height: 1 !important;
    }

    .overtype-container[data-mode="preview"] .overtype-wrapper .overtype-preview h1 {
      font-size: 2em !important;
      color: var(--preview-h1, var(--preview-h1-default)) !important;
    }

    .overtype-container[data-mode="preview"] .overtype-wrapper .overtype-preview h2 {
      font-size: 1.5em !important;
      color: var(--preview-h2, var(--preview-h2-default)) !important;
    }

    .overtype-container[data-mode="preview"] .overtype-wrapper .overtype-preview h3 {
      font-size: 1.17em !important;
      color: var(--preview-h3, var(--preview-h3-default)) !important;
    }

    /* Lists - restore list styling in preview mode */
    .overtype-container[data-mode="preview"] .overtype-wrapper .overtype-preview ul {
      display: block !important;
      list-style: disc !important;
      padding-left: 2em !important;
      margin: 1em 0 !important;
    }

    .overtype-container[data-mode="preview"] .overtype-wrapper .overtype-preview ol {
      display: block !important;
      list-style: decimal !important;
      padding-left: 2em !important;
      margin: 1em 0 !important;
    }
    
    .overtype-container[data-mode="preview"] .overtype-wrapper .overtype-preview li {
      display: list-item !important;
      margin: 0 !important;
      padding: 0 !important;
    }

    /* Task list checkboxes - only in preview mode */
    .overtype-container[data-mode="preview"] .overtype-wrapper .overtype-preview li.task-list {
      list-style: none !important;
      position: relative !important;
    }

    .overtype-container[data-mode="preview"] .overtype-wrapper .overtype-preview li.task-list input[type="checkbox"] {
      margin-right: 0.5em !important;
      cursor: default !important;
      vertical-align: middle !important;
    }

    /* Task list in normal mode - keep syntax visible */
    .overtype-container:not([data-mode="preview"]) .overtype-wrapper .overtype-preview li.task-list {
      list-style: none !important;
    }

    .overtype-container:not([data-mode="preview"]) .overtype-wrapper .overtype-preview li.task-list .syntax-marker {
      color: var(--syntax, #999999) !important;
      font-weight: normal !important;
    }

    /* Links - make clickable in preview mode */
    .overtype-container[data-mode="preview"] .overtype-wrapper .overtype-preview a {
      pointer-events: auto !important;
      cursor: pointer !important;
      color: var(--preview-link, var(--preview-link-default)) !important;
      text-decoration: underline !important;
    }

    /* Code blocks - proper pre/code styling in preview mode */
    .overtype-container[data-mode="preview"] .overtype-wrapper .overtype-preview pre.code-block {
      background: var(--preview-code-bg, var(--preview-code-bg-default)) !important;
      color: var(--preview-code, var(--preview-code-default)) !important;
      padding: 1.2em !important;
      border-radius: 3px !important;
      overflow-x: auto !important;
      margin: 0 !important;
      display: block !important;
    }

    .overtype-container[data-mode="preview"] .overtype-wrapper .overtype-preview pre.code-block code {
      background: transparent !important;
      color: inherit !important;
      padding: 0 !important;
      font-family: ${fontFamily} !important;
      font-size: 0.9em !important;
      line-height: 1.4 !important;
    }

    /* Hide old code block lines and fences in preview mode */
    .overtype-container[data-mode="preview"] .overtype-wrapper .overtype-preview .code-block-line {
      display: none !important;
    }

    .overtype-container[data-mode="preview"] .overtype-wrapper .overtype-preview .code-fence {
      display: none !important;
    }

    /* Blockquotes - enhanced styling in preview mode */
    .overtype-container[data-mode="preview"] .overtype-wrapper .overtype-preview .blockquote {
      display: block !important;
      border-left: 4px solid var(--preview-blockquote, var(--preview-blockquote-default)) !important;
      color: var(--preview-blockquote, var(--preview-blockquote-default)) !important;
      padding-left: 1em !important;
      margin: 1em 0 !important;
      font-style: italic !important;
    }

    /* Typography improvements in preview mode */
    .overtype-container[data-mode="preview"] .overtype-wrapper .overtype-preview {
      font-family: Georgia, 'Times New Roman', serif !important;
      font-size: 16px !important;
      line-height: 1.8 !important;
      color: var(--preview-text, var(--preview-text-default)) !important;
      background: var(--preview-bg, var(--preview-bg-default)) !important;
    }

    /* Inline code in preview mode - keep monospace */
    .overtype-container[data-mode="preview"] .overtype-wrapper .overtype-preview code {
      font-family: ${fontFamily} !important;
      font-size: 0.9em !important;
      background: var(--preview-code-bg, var(--preview-code-bg-default)) !important;
      color: var(--preview-code, var(--preview-code-default)) !important;
      padding: 0.2em 0.4em !important;
      border-radius: 3px !important;
    }

    /* Strong and em elements in preview mode */
    .overtype-container[data-mode="preview"] .overtype-wrapper .overtype-preview strong {
      font-weight: 700 !important;
      color: var(--preview-strong, var(--preview-strong-default)) !important;
    }

    .overtype-container[data-mode="preview"] .overtype-wrapper .overtype-preview em {
      font-style: italic !important;
      color: var(--preview-em, var(--preview-em-default)) !important;
    }

    /* HR in preview mode */
    .overtype-container[data-mode="preview"] .overtype-wrapper .overtype-preview .hr-marker {
      display: block !important;
      border-top: 2px solid var(--preview-hr, var(--preview-hr-default)) !important;
      text-indent: -9999px !important;
      height: 2px !important;
    }

    /* Link Tooltip */
    .overtype-link-tooltip {
      background: #333 !important;
      color: white !important;
      padding: 6px 10px !important;
      border-radius: 16px !important;
      font-size: 12px !important;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif !important;
      display: flex !important;
      visibility: hidden !important;
      pointer-events: none !important;
      z-index: 10000 !important;
      cursor: pointer !important;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3) !important;
      max-width: 300px !important;
      white-space: nowrap !important;
      overflow: hidden !important;
      text-overflow: ellipsis !important;
      position: fixed;
      top: 0;
      left: 0;
    }

    .overtype-link-tooltip.visible {
      visibility: visible !important;
      pointer-events: auto !important;
    }

    ${mobileStyles}
  `;
}

// node_modules/markdown-actions/dist/markdown-actions.esm.js
var markdown_actions_esm_exports = {};
__export(markdown_actions_esm_exports, {
  applyCustomFormat: () => applyCustomFormat,
  default: () => src_default,
  expandSelection: () => expandSelection2,
  getActiveFormats: () => getActiveFormats2,
  getDebugMode: () => getDebugMode,
  hasFormat: () => hasFormat2,
  insertHeader: () => insertHeader,
  insertLink: () => insertLink,
  preserveSelection: () => preserveSelection,
  setDebugMode: () => setDebugMode,
  setUndoMethod: () => setUndoMethod,
  toggleBold: () => toggleBold,
  toggleBulletList: () => toggleBulletList,
  toggleCode: () => toggleCode,
  toggleH1: () => toggleH1,
  toggleH2: () => toggleH2,
  toggleH3: () => toggleH3,
  toggleItalic: () => toggleItalic,
  toggleNumberedList: () => toggleNumberedList,
  toggleQuote: () => toggleQuote,
  toggleTaskList: () => toggleTaskList
});
var __defProp2 = Object.defineProperty;
var __getOwnPropSymbols = Object.getOwnPropertySymbols;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __propIsEnum = Object.prototype.propertyIsEnumerable;
var __defNormalProp2 = (obj, key, value) => key in obj ? __defProp2(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __spreadValues = (a, b) => {
  for (var prop in b || (b = {}))
    if (__hasOwnProp.call(b, prop))
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
function setDebugMode(enabled) {
  debugMode = enabled;
}
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
function setUndoMethod(method) {
  switch (method) {
    case "native":
      canInsertText = true;
      break;
    case "manual":
      canInsertText = false;
      break;
    case "auto":
      canInsertText = null;
      break;
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
function preserveSelection(textarea, callback) {
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const scrollTop = textarea.scrollTop;
  callback();
  textarea.selectionStart = start;
  textarea.selectionEnd = end;
  textarea.scrollTop = scrollTop;
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
function hasFormat(textarea, format) {
  const activeFormats = getActiveFormats(textarea);
  return activeFormats.includes(format);
}
function expandSelection(textarea, options = {}) {
  if (!textarea)
    return;
  const { toWord, toLine, toFormat } = options;
  const { selectionStart, selectionEnd, value } = textarea;
  if (toLine) {
    const lines = value.split("\n");
    let lineStart = 0;
    let lineEnd = 0;
    let currentPos = 0;
    for (const line of lines) {
      if (selectionStart >= currentPos && selectionStart <= currentPos + line.length) {
        lineStart = currentPos;
        lineEnd = currentPos + line.length;
        break;
      }
      currentPos += line.length + 1;
    }
    textarea.selectionStart = lineStart;
    textarea.selectionEnd = lineEnd;
  } else if (toWord && selectionStart === selectionEnd) {
    let start = selectionStart;
    let end = selectionEnd;
    while (start > 0 && !/\s/.test(value[start - 1])) {
      start--;
    }
    while (end < value.length && !/\s/.test(value[end])) {
      end++;
    }
    textarea.selectionStart = start;
    textarea.selectionEnd = end;
  }
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
function hasFormat2(textarea, format) {
  return hasFormat(textarea, format);
}
function expandSelection2(textarea, options = {}) {
  expandSelection(textarea, options);
}
function applyCustomFormat(textarea, format) {
  if (!textarea || textarea.disabled || textarea.readOnly)
    return;
  const style = mergeWithDefaults(format);
  let result;
  if (style.multiline) {
    const selectedText = textarea.value.slice(textarea.selectionStart, textarea.selectionEnd);
    if (isMultipleLines(selectedText)) {
      result = multilineStyle(textarea, style);
    } else {
      result = blockStyle(textarea, style);
    }
  } else {
    result = blockStyle(textarea, style);
  }
  insertText(textarea, result);
}
var src_default = {
  toggleBold,
  toggleItalic,
  toggleCode,
  insertLink,
  toggleBulletList,
  toggleNumberedList,
  toggleQuote,
  toggleTaskList,
  insertHeader,
  toggleH1,
  toggleH2,
  toggleH3,
  getActiveFormats: getActiveFormats2,
  hasFormat: hasFormat2,
  expandSelection: expandSelection2,
  applyCustomFormat,
  preserveSelection,
  setUndoMethod,
  setDebugMode,
  getDebugMode
};

// src/toolbar.js
var Toolbar = class {
  constructor(editor, options = {}) {
    this.editor = editor;
    this.container = null;
    this.buttons = {};
    this.currentItemIndex = 0;
    this.handleDocumentClick = null;
    this.activeDropdown = null;
    this.activeDropdownButton = null;
    this.toolbarButtons = options.toolbarButtons || [];
  }
  /**
   * Create and render toolbar
   */
  create() {
    this.container = document.createElement("div");
    this.container.className = "overtype-toolbar";
    this.container.id = this.getInstanceElementId("toolbar");
    this.container.setAttribute("role", "toolbar");
    this.container.setAttribute("aria-label", "Formatting toolbar");
    this.container.setAttribute("aria-controls", this.editor.textarea.id);
    this.toolbarButtons.forEach((buttonConfig) => {
      if (buttonConfig.name === "separator") {
        const separator = this.createSeparator();
        this.container.appendChild(separator);
      } else {
        const button = this.createButton(buttonConfig);
        this.buttons[buttonConfig.name] = button;
        this.container.appendChild(button);
      }
    });
    this.setupRovingTabIndex();
    this.updateButtonStates();
    this.editor.container.insertBefore(this.container, this.editor.wrapper);
  }
  /**
   * Build a stable id from the owning OverType instance
   */
  getInstanceElementId(name) {
    return `overtype-${this.editor.instanceId}-${name}`;
  }
  /**
   * Configure toolbar focus management per the ARIA toolbar pattern
   */
  setupRovingTabIndex() {
    const toolbarItems = this.getToolbarItems();
    if (toolbarItems.length === 0) {
      return;
    }
    this.currentItemIndex = this.getValidItemIndex(this.currentItemIndex);
    this.updateTabIndexes();
    this.container.addEventListener("keydown", (e) => {
      this.onToolbarKeydown(e);
    });
    this.container.addEventListener("focusin", (e) => {
      this.onToolbarFocusin(e);
    });
  }
  /**
   * Get toolbar buttons in DOM order for keyboard navigation
   */
  getToolbarItems() {
    if (!this.container) {
      return [];
    }
    return Array.from(this.container.querySelectorAll(".overtype-toolbar-button"));
  }
  /**
   * Handle keyboard navigation within the toolbar
   */
  onToolbarKeydown(e) {
    const toolbarItems = this.getToolbarItems();
    if (!toolbarItems.includes(e.target)) {
      return;
    }
    switch (e.key) {
      case "ArrowRight":
        e.preventDefault();
        this.focusItem(this.currentItemIndex + 1);
        break;
      case "ArrowLeft":
        e.preventDefault();
        this.focusItem(this.currentItemIndex - 1);
        break;
      case "Home":
        e.preventDefault();
        this.focusItem(0);
        break;
      case "End":
        e.preventDefault();
        this.focusItem(toolbarItems.length - 1);
        break;
    }
  }
  /**
   * Remember the focused toolbar item as the toolbar tab stop
   */
  onToolbarFocusin(e) {
    const focusedItemIndex = this.getToolbarItems().indexOf(e.target);
    if (focusedItemIndex === -1) {
      return;
    }
    this.currentItemIndex = focusedItemIndex;
    this.updateTabIndexes();
  }
  /**
   * Move focus to a toolbar item and make it the only tab stop
   */
  focusItem(index) {
    const toolbarItems = this.getToolbarItems();
    if (toolbarItems.length === 0) {
      return;
    }
    this.currentItemIndex = this.getValidItemIndex(index, toolbarItems);
    this.updateTabIndexes();
    toolbarItems[this.currentItemIndex].focus();
  }
  /**
   * Normalize toolbar item indexes with wrapping
   */
  getValidItemIndex(index, toolbarItems = this.getToolbarItems()) {
    const itemCount = toolbarItems.length;
    if (itemCount === 0) {
      return 0;
    }
    if (index < 0) {
      return itemCount - 1;
    }
    if (index >= itemCount) {
      return 0;
    }
    return index;
  }
  /**
   * Keep exactly one toolbar item in the page tab sequence
   */
  updateTabIndexes() {
    this.getToolbarItems().forEach((item, index) => {
      item.tabIndex = index === this.currentItemIndex ? 0 : -1;
    });
  }
  /**
   * Create a toolbar separator
   */
  createSeparator() {
    const separator = document.createElement("div");
    separator.className = "overtype-toolbar-separator";
    separator.setAttribute("role", "separator");
    return separator;
  }
  /**
   * Create a toolbar button
   */
  createButton(buttonConfig) {
    const button = document.createElement("button");
    button.className = "overtype-toolbar-button";
    button.type = "button";
    button.setAttribute("data-button", buttonConfig.name);
    button.title = buttonConfig.title || "";
    button.setAttribute("aria-label", buttonConfig.title || buttonConfig.name);
    button.innerHTML = this.sanitizeSVG(buttonConfig.icon || "");
    if (buttonConfig.name === "viewMode") {
      button.classList.add("has-dropdown");
      button.dataset.dropdown = "true";
      button.setAttribute("aria-haspopup", "menu");
      button.setAttribute("aria-expanded", "false");
      button._clickHandler = (e) => {
        e.preventDefault();
        this.toggleViewModeDropdown(button);
      };
      button._keydownHandler = (e) => {
        if (!["ArrowDown", "ArrowUp", "Enter", " "].includes(e.key)) {
          return;
        }
        e.preventDefault();
        const placement = e.key === "ArrowUp" ? "last" : "current";
        this.openViewModeDropdown(button, placement);
      };
      button.addEventListener("click", button._clickHandler);
      button.addEventListener("keydown", button._keydownHandler);
      return button;
    }
    button._clickHandler = (e) => {
      e.preventDefault();
      const actionId = buttonConfig.actionId || buttonConfig.name;
      this.editor.performAction(actionId, e);
    };
    button.addEventListener("click", button._clickHandler);
    return button;
  }
  /**
   * Handle button action programmatically
   * Accepts either an actionId string or a buttonConfig object (backwards compatible)
   * @param {string|Object} actionIdOrConfig - Action identifier string or button config object
   * @returns {Promise<boolean>} Whether the action was executed
   */
  async handleAction(actionIdOrConfig) {
    if (actionIdOrConfig && typeof actionIdOrConfig === "object" && typeof actionIdOrConfig.action === "function") {
      this.editor.textarea.focus();
      try {
        await actionIdOrConfig.action({
          editor: this.editor,
          getValue: () => this.editor.getValue(),
          setValue: (value) => this.editor.setValue(value),
          event: null
        });
        return true;
      } catch (error) {
        console.error(`Action "${actionIdOrConfig.name}" error:`, error);
        this.editor.wrapper.dispatchEvent(new CustomEvent("button-error", {
          detail: { buttonName: actionIdOrConfig.name, error }
        }));
        return false;
      }
    }
    if (typeof actionIdOrConfig === "string") {
      return this.editor.performAction(actionIdOrConfig, null);
    }
    return false;
  }
  /**
   * Sanitize SVG to prevent XSS
   */
  sanitizeSVG(svg) {
    if (typeof svg !== "string")
      return "";
    const cleaned = svg.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "").replace(/\son\w+\s*=\s*["'][^"']*["']/gi, "").replace(/\son\w+\s*=\s*[^\s>]*/gi, "");
    return cleaned;
  }
  /**
   * Toggle view mode dropdown (internal implementation)
   * Not exposed to users - viewMode button behavior is fixed
   */
  toggleViewModeDropdown(button) {
    if (this.activeDropdown) {
      this.closeViewModeDropdown(button);
      return;
    }
    this.openViewModeDropdown(button);
  }
  /**
   * Open the view mode dropdown
   */
  openViewModeDropdown(button, focusPlacement = null) {
    this.closeViewModeDropdown(button);
    button.classList.add("dropdown-active");
    const dropdown = this.createViewModeDropdown(button);
    const rect = button.getBoundingClientRect();
    dropdown.style.position = "absolute";
    dropdown.style.top = `${rect.bottom + 5}px`;
    dropdown.style.left = `${rect.left}px`;
    document.body.appendChild(dropdown);
    this.activeDropdown = dropdown;
    this.activeDropdownButton = button;
    button.setAttribute("aria-controls", dropdown.id);
    button.setAttribute("aria-expanded", "true");
    this.handleDocumentClick = (e) => {
      if (!dropdown.contains(e.target) && !button.contains(e.target)) {
        this.closeViewModeDropdown(button);
      }
    };
    setTimeout(() => {
      document.addEventListener("click", this.handleDocumentClick);
    }, 0);
    if (focusPlacement) {
      this.focusViewModeMenuItem(dropdown, focusPlacement);
    }
  }
  /**
   * Close the view mode dropdown
   */
  closeViewModeDropdown(button = this.activeDropdownButton, returnFocus = false) {
    if (this.activeDropdown) {
      this.activeDropdown.remove();
      this.activeDropdown = null;
    }
    if (button) {
      button.classList.remove("dropdown-active");
      button.setAttribute("aria-expanded", "false");
    }
    if (this.handleDocumentClick) {
      document.removeEventListener("click", this.handleDocumentClick);
      this.handleDocumentClick = null;
    }
    this.activeDropdownButton = null;
    if (returnFocus && button) {
      button.focus();
    }
  }
  /**
   * Create view mode dropdown menu (internal implementation)
   */
  createViewModeDropdown(button) {
    const dropdown = document.createElement("div");
    dropdown.className = "overtype-dropdown-menu";
    dropdown.id = this.getInstanceElementId("toolbar-view-mode-menu");
    dropdown.setAttribute("role", "menu");
    dropdown.setAttribute("aria-label", "View mode");
    dropdown.addEventListener("keydown", (e) => {
      this.onViewModeMenuKeydown(e, button);
    });
    const items = [
      { id: "normal", label: "Normal Edit", icon: "\u2713" },
      { id: "plain", label: "Plain Textarea", icon: "\u2713" },
      { id: "preview", label: "Preview Mode", icon: "\u2713" }
    ];
    const currentMode = this.editor.container.dataset.mode || "normal";
    items.forEach((item) => {
      const menuItem = document.createElement("button");
      menuItem.className = "overtype-dropdown-item";
      menuItem.type = "button";
      menuItem.tabIndex = -1;
      menuItem.setAttribute("role", "menuitemradio");
      menuItem.setAttribute("aria-checked", String(item.id === currentMode));
      menuItem.textContent = item.label;
      if (item.id === currentMode) {
        menuItem.classList.add("active");
        const checkmark = document.createElement("span");
        checkmark.className = "overtype-dropdown-icon";
        checkmark.setAttribute("aria-hidden", "true");
        checkmark.textContent = item.icon;
        menuItem.prepend(checkmark);
      }
      menuItem.addEventListener("click", (e) => {
        e.preventDefault();
        switch (item.id) {
          case "plain":
            this.editor.showPlainTextarea();
            break;
          case "preview":
            this.editor.showPreviewMode();
            break;
          case "normal":
          default:
            this.editor.showNormalEditMode();
            break;
        }
        this.closeViewModeDropdown(button, true);
      });
      dropdown.appendChild(menuItem);
    });
    return dropdown;
  }
  /**
   * Handle keyboard navigation inside the view mode menu
   */
  onViewModeMenuKeydown(e, button) {
    const menuItems = this.getViewModeMenuItems();
    const currentIndex = menuItems.indexOf(e.target);
    if (currentIndex === -1) {
      return;
    }
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        this.focusViewModeMenuItem(this.activeDropdown, currentIndex + 1);
        break;
      case "ArrowUp":
        e.preventDefault();
        this.focusViewModeMenuItem(this.activeDropdown, currentIndex - 1);
        break;
      case "Home":
        e.preventDefault();
        this.focusViewModeMenuItem(this.activeDropdown, "first");
        break;
      case "End":
        e.preventDefault();
        this.focusViewModeMenuItem(this.activeDropdown, "last");
        break;
      case "Escape":
        e.preventDefault();
        this.closeViewModeDropdown(button, true);
        break;
    }
  }
  /**
   * Focus a view mode menu item by index or placement
   */
  focusViewModeMenuItem(dropdown, placement) {
    const menuItems = this.getViewModeMenuItems(dropdown);
    if (menuItems.length === 0) {
      return;
    }
    let index = placement;
    if (placement === "first") {
      index = 0;
    } else if (placement === "last") {
      index = menuItems.length - 1;
    } else if (placement === "current") {
      index = menuItems.findIndex((item) => item.getAttribute("aria-checked") === "true");
    }
    if (index < 0) {
      index = menuItems.length - 1;
    }
    if (index >= menuItems.length) {
      index = 0;
    }
    menuItems[index].focus();
  }
  /**
   * Get the current view mode menu items
   */
  getViewModeMenuItems(dropdown = this.activeDropdown) {
    if (!dropdown) {
      return [];
    }
    return Array.from(dropdown.querySelectorAll('[role="menuitemradio"]'));
  }
  /**
   * Update active states of toolbar buttons
   */
  updateButtonStates() {
    var _a;
    try {
      const activeFormats = ((_a = getActiveFormats2) == null ? void 0 : _a(
        this.editor.textarea,
        this.editor.textarea.selectionStart
      )) || [];
      Object.entries(this.buttons).forEach(([name, button]) => {
        if (name === "viewMode")
          return;
        const buttonConfig = this.toolbarButtons.find((buttonConfig2) => buttonConfig2.name === name);
        if (!(buttonConfig == null ? void 0 : buttonConfig.isActive)) {
          return;
        }
        const isActive = Boolean(buttonConfig.isActive({
          editor: this.editor,
          activeFormats
        }));
        button.classList.toggle("active", isActive);
        button.setAttribute("aria-pressed", isActive.toString());
      });
    } catch (error) {
    }
  }
  show() {
    if (this.container) {
      this.container.classList.remove("overtype-toolbar-hidden");
    }
  }
  hide() {
    if (this.container) {
      this.container.classList.add("overtype-toolbar-hidden");
    }
  }
  /**
   * Destroy toolbar and cleanup
   */
  destroy() {
    if (this.container) {
      if (this.activeDropdown) {
        this.closeViewModeDropdown();
      } else if (this.handleDocumentClick) {
        document.removeEventListener("click", this.handleDocumentClick);
        this.handleDocumentClick = null;
      }
      Object.values(this.buttons).forEach((button) => {
        if (button._clickHandler) {
          button.removeEventListener("click", button._clickHandler);
          delete button._clickHandler;
        }
        if (button._keydownHandler) {
          button.removeEventListener("keydown", button._keydownHandler);
          delete button._keydownHandler;
        }
      });
      this.container.remove();
      this.container = null;
      this.buttons = {};
    }
  }
};

// node_modules/@floating-ui/utils/dist/floating-ui.utils.mjs
var min = Math.min;
var max = Math.max;
var round = Math.round;
var createCoords = (v) => ({
  x: v,
  y: v
});
var oppositeSideMap = {
  left: "right",
  right: "left",
  bottom: "top",
  top: "bottom"
};
var oppositeAlignmentMap = {
  start: "end",
  end: "start"
};
function clamp(start, value, end) {
  return max(start, min(value, end));
}
function evaluate(value, param) {
  return typeof value === "function" ? value(param) : value;
}
function getSide(placement) {
  return placement.split("-")[0];
}
function getAlignment(placement) {
  return placement.split("-")[1];
}
function getOppositeAxis(axis) {
  return axis === "x" ? "y" : "x";
}
function getAxisLength(axis) {
  return axis === "y" ? "height" : "width";
}
var yAxisSides = /* @__PURE__ */ new Set(["top", "bottom"]);
function getSideAxis(placement) {
  return yAxisSides.has(getSide(placement)) ? "y" : "x";
}
function getAlignmentAxis(placement) {
  return getOppositeAxis(getSideAxis(placement));
}
function getAlignmentSides(placement, rects, rtl) {
  if (rtl === void 0) {
    rtl = false;
  }
  const alignment = getAlignment(placement);
  const alignmentAxis = getAlignmentAxis(placement);
  const length = getAxisLength(alignmentAxis);
  let mainAlignmentSide = alignmentAxis === "x" ? alignment === (rtl ? "end" : "start") ? "right" : "left" : alignment === "start" ? "bottom" : "top";
  if (rects.reference[length] > rects.floating[length]) {
    mainAlignmentSide = getOppositePlacement(mainAlignmentSide);
  }
  return [mainAlignmentSide, getOppositePlacement(mainAlignmentSide)];
}
function getExpandedPlacements(placement) {
  const oppositePlacement = getOppositePlacement(placement);
  return [getOppositeAlignmentPlacement(placement), oppositePlacement, getOppositeAlignmentPlacement(oppositePlacement)];
}
function getOppositeAlignmentPlacement(placement) {
  return placement.replace(/start|end/g, (alignment) => oppositeAlignmentMap[alignment]);
}
var lrPlacement = ["left", "right"];
var rlPlacement = ["right", "left"];
var tbPlacement = ["top", "bottom"];
var btPlacement = ["bottom", "top"];
function getSideList(side, isStart, rtl) {
  switch (side) {
    case "top":
    case "bottom":
      if (rtl)
        return isStart ? rlPlacement : lrPlacement;
      return isStart ? lrPlacement : rlPlacement;
    case "left":
    case "right":
      return isStart ? tbPlacement : btPlacement;
    default:
      return [];
  }
}
function getOppositeAxisPlacements(placement, flipAlignment, direction, rtl) {
  const alignment = getAlignment(placement);
  let list = getSideList(getSide(placement), direction === "start", rtl);
  if (alignment) {
    list = list.map((side) => side + "-" + alignment);
    if (flipAlignment) {
      list = list.concat(list.map(getOppositeAlignmentPlacement));
    }
  }
  return list;
}
function getOppositePlacement(placement) {
  return placement.replace(/left|right|bottom|top/g, (side) => oppositeSideMap[side]);
}
function expandPaddingObject(padding) {
  return {
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    ...padding
  };
}
function getPaddingObject(padding) {
  return typeof padding !== "number" ? expandPaddingObject(padding) : {
    top: padding,
    right: padding,
    bottom: padding,
    left: padding
  };
}
function rectToClientRect(rect) {
  const {
    x,
    y,
    width,
    height
  } = rect;
  return {
    width,
    height,
    top: y,
    left: x,
    right: x + width,
    bottom: y + height,
    x,
    y
  };
}

// node_modules/@floating-ui/core/dist/floating-ui.core.mjs
function computeCoordsFromPlacement(_ref, placement, rtl) {
  let {
    reference,
    floating
  } = _ref;
  const sideAxis = getSideAxis(placement);
  const alignmentAxis = getAlignmentAxis(placement);
  const alignLength = getAxisLength(alignmentAxis);
  const side = getSide(placement);
  const isVertical = sideAxis === "y";
  const commonX = reference.x + reference.width / 2 - floating.width / 2;
  const commonY = reference.y + reference.height / 2 - floating.height / 2;
  const commonAlign = reference[alignLength] / 2 - floating[alignLength] / 2;
  let coords;
  switch (side) {
    case "top":
      coords = {
        x: commonX,
        y: reference.y - floating.height
      };
      break;
    case "bottom":
      coords = {
        x: commonX,
        y: reference.y + reference.height
      };
      break;
    case "right":
      coords = {
        x: reference.x + reference.width,
        y: commonY
      };
      break;
    case "left":
      coords = {
        x: reference.x - floating.width,
        y: commonY
      };
      break;
    default:
      coords = {
        x: reference.x,
        y: reference.y
      };
  }
  switch (getAlignment(placement)) {
    case "start":
      coords[alignmentAxis] -= commonAlign * (rtl && isVertical ? -1 : 1);
      break;
    case "end":
      coords[alignmentAxis] += commonAlign * (rtl && isVertical ? -1 : 1);
      break;
  }
  return coords;
}
async function detectOverflow(state, options) {
  var _await$platform$isEle;
  if (options === void 0) {
    options = {};
  }
  const {
    x,
    y,
    platform: platform2,
    rects,
    elements,
    strategy
  } = state;
  const {
    boundary = "clippingAncestors",
    rootBoundary = "viewport",
    elementContext = "floating",
    altBoundary = false,
    padding = 0
  } = evaluate(options, state);
  const paddingObject = getPaddingObject(padding);
  const altContext = elementContext === "floating" ? "reference" : "floating";
  const element = elements[altBoundary ? altContext : elementContext];
  const clippingClientRect = rectToClientRect(await platform2.getClippingRect({
    element: ((_await$platform$isEle = await (platform2.isElement == null ? void 0 : platform2.isElement(element))) != null ? _await$platform$isEle : true) ? element : element.contextElement || await (platform2.getDocumentElement == null ? void 0 : platform2.getDocumentElement(elements.floating)),
    boundary,
    rootBoundary,
    strategy
  }));
  const rect = elementContext === "floating" ? {
    x,
    y,
    width: rects.floating.width,
    height: rects.floating.height
  } : rects.reference;
  const offsetParent = await (platform2.getOffsetParent == null ? void 0 : platform2.getOffsetParent(elements.floating));
  const offsetScale = await (platform2.isElement == null ? void 0 : platform2.isElement(offsetParent)) ? await (platform2.getScale == null ? void 0 : platform2.getScale(offsetParent)) || {
    x: 1,
    y: 1
  } : {
    x: 1,
    y: 1
  };
  const elementClientRect = rectToClientRect(platform2.convertOffsetParentRelativeRectToViewportRelativeRect ? await platform2.convertOffsetParentRelativeRectToViewportRelativeRect({
    elements,
    rect,
    offsetParent,
    strategy
  }) : rect);
  return {
    top: (clippingClientRect.top - elementClientRect.top + paddingObject.top) / offsetScale.y,
    bottom: (elementClientRect.bottom - clippingClientRect.bottom + paddingObject.bottom) / offsetScale.y,
    left: (clippingClientRect.left - elementClientRect.left + paddingObject.left) / offsetScale.x,
    right: (elementClientRect.right - clippingClientRect.right + paddingObject.right) / offsetScale.x
  };
}
var computePosition = async (reference, floating, config) => {
  const {
    placement = "bottom",
    strategy = "absolute",
    middleware = [],
    platform: platform2
  } = config;
  const validMiddleware = middleware.filter(Boolean);
  const rtl = await (platform2.isRTL == null ? void 0 : platform2.isRTL(floating));
  let rects = await platform2.getElementRects({
    reference,
    floating,
    strategy
  });
  let {
    x,
    y
  } = computeCoordsFromPlacement(rects, placement, rtl);
  let statefulPlacement = placement;
  let middlewareData = {};
  let resetCount = 0;
  for (let i = 0; i < validMiddleware.length; i++) {
    var _platform$detectOverf;
    const {
      name,
      fn
    } = validMiddleware[i];
    const {
      x: nextX,
      y: nextY,
      data,
      reset
    } = await fn({
      x,
      y,
      initialPlacement: placement,
      placement: statefulPlacement,
      strategy,
      middlewareData,
      rects,
      platform: {
        ...platform2,
        detectOverflow: (_platform$detectOverf = platform2.detectOverflow) != null ? _platform$detectOverf : detectOverflow
      },
      elements: {
        reference,
        floating
      }
    });
    x = nextX != null ? nextX : x;
    y = nextY != null ? nextY : y;
    middlewareData = {
      ...middlewareData,
      [name]: {
        ...middlewareData[name],
        ...data
      }
    };
    if (reset && resetCount <= 50) {
      resetCount++;
      if (typeof reset === "object") {
        if (reset.placement) {
          statefulPlacement = reset.placement;
        }
        if (reset.rects) {
          rects = reset.rects === true ? await platform2.getElementRects({
            reference,
            floating,
            strategy
          }) : reset.rects;
        }
        ({
          x,
          y
        } = computeCoordsFromPlacement(rects, statefulPlacement, rtl));
      }
      i = -1;
    }
  }
  return {
    x,
    y,
    placement: statefulPlacement,
    strategy,
    middlewareData
  };
};
var flip = function(options) {
  if (options === void 0) {
    options = {};
  }
  return {
    name: "flip",
    options,
    async fn(state) {
      var _middlewareData$arrow, _middlewareData$flip;
      const {
        placement,
        middlewareData,
        rects,
        initialPlacement,
        platform: platform2,
        elements
      } = state;
      const {
        mainAxis: checkMainAxis = true,
        crossAxis: checkCrossAxis = true,
        fallbackPlacements: specifiedFallbackPlacements,
        fallbackStrategy = "bestFit",
        fallbackAxisSideDirection = "none",
        flipAlignment = true,
        ...detectOverflowOptions
      } = evaluate(options, state);
      if ((_middlewareData$arrow = middlewareData.arrow) != null && _middlewareData$arrow.alignmentOffset) {
        return {};
      }
      const side = getSide(placement);
      const initialSideAxis = getSideAxis(initialPlacement);
      const isBasePlacement = getSide(initialPlacement) === initialPlacement;
      const rtl = await (platform2.isRTL == null ? void 0 : platform2.isRTL(elements.floating));
      const fallbackPlacements = specifiedFallbackPlacements || (isBasePlacement || !flipAlignment ? [getOppositePlacement(initialPlacement)] : getExpandedPlacements(initialPlacement));
      const hasFallbackAxisSideDirection = fallbackAxisSideDirection !== "none";
      if (!specifiedFallbackPlacements && hasFallbackAxisSideDirection) {
        fallbackPlacements.push(...getOppositeAxisPlacements(initialPlacement, flipAlignment, fallbackAxisSideDirection, rtl));
      }
      const placements2 = [initialPlacement, ...fallbackPlacements];
      const overflow = await platform2.detectOverflow(state, detectOverflowOptions);
      const overflows = [];
      let overflowsData = ((_middlewareData$flip = middlewareData.flip) == null ? void 0 : _middlewareData$flip.overflows) || [];
      if (checkMainAxis) {
        overflows.push(overflow[side]);
      }
      if (checkCrossAxis) {
        const sides2 = getAlignmentSides(placement, rects, rtl);
        overflows.push(overflow[sides2[0]], overflow[sides2[1]]);
      }
      overflowsData = [...overflowsData, {
        placement,
        overflows
      }];
      if (!overflows.every((side2) => side2 <= 0)) {
        var _middlewareData$flip2, _overflowsData$filter;
        const nextIndex = (((_middlewareData$flip2 = middlewareData.flip) == null ? void 0 : _middlewareData$flip2.index) || 0) + 1;
        const nextPlacement = placements2[nextIndex];
        if (nextPlacement) {
          const ignoreCrossAxisOverflow = checkCrossAxis === "alignment" ? initialSideAxis !== getSideAxis(nextPlacement) : false;
          if (!ignoreCrossAxisOverflow || // We leave the current main axis only if every placement on that axis
          // overflows the main axis.
          overflowsData.every((d) => getSideAxis(d.placement) === initialSideAxis ? d.overflows[0] > 0 : true)) {
            return {
              data: {
                index: nextIndex,
                overflows: overflowsData
              },
              reset: {
                placement: nextPlacement
              }
            };
          }
        }
        let resetPlacement = (_overflowsData$filter = overflowsData.filter((d) => d.overflows[0] <= 0).sort((a, b) => a.overflows[1] - b.overflows[1])[0]) == null ? void 0 : _overflowsData$filter.placement;
        if (!resetPlacement) {
          switch (fallbackStrategy) {
            case "bestFit": {
              var _overflowsData$filter2;
              const placement2 = (_overflowsData$filter2 = overflowsData.filter((d) => {
                if (hasFallbackAxisSideDirection) {
                  const currentSideAxis = getSideAxis(d.placement);
                  return currentSideAxis === initialSideAxis || // Create a bias to the `y` side axis due to horizontal
                  // reading directions favoring greater width.
                  currentSideAxis === "y";
                }
                return true;
              }).map((d) => [d.placement, d.overflows.filter((overflow2) => overflow2 > 0).reduce((acc, overflow2) => acc + overflow2, 0)]).sort((a, b) => a[1] - b[1])[0]) == null ? void 0 : _overflowsData$filter2[0];
              if (placement2) {
                resetPlacement = placement2;
              }
              break;
            }
            case "initialPlacement":
              resetPlacement = initialPlacement;
              break;
          }
        }
        if (placement !== resetPlacement) {
          return {
            reset: {
              placement: resetPlacement
            }
          };
        }
      }
      return {};
    }
  };
};
var originSides = /* @__PURE__ */ new Set(["left", "top"]);
async function convertValueToCoords(state, options) {
  const {
    placement,
    platform: platform2,
    elements
  } = state;
  const rtl = await (platform2.isRTL == null ? void 0 : platform2.isRTL(elements.floating));
  const side = getSide(placement);
  const alignment = getAlignment(placement);
  const isVertical = getSideAxis(placement) === "y";
  const mainAxisMulti = originSides.has(side) ? -1 : 1;
  const crossAxisMulti = rtl && isVertical ? -1 : 1;
  const rawValue = evaluate(options, state);
  let {
    mainAxis,
    crossAxis,
    alignmentAxis
  } = typeof rawValue === "number" ? {
    mainAxis: rawValue,
    crossAxis: 0,
    alignmentAxis: null
  } : {
    mainAxis: rawValue.mainAxis || 0,
    crossAxis: rawValue.crossAxis || 0,
    alignmentAxis: rawValue.alignmentAxis
  };
  if (alignment && typeof alignmentAxis === "number") {
    crossAxis = alignment === "end" ? alignmentAxis * -1 : alignmentAxis;
  }
  return isVertical ? {
    x: crossAxis * crossAxisMulti,
    y: mainAxis * mainAxisMulti
  } : {
    x: mainAxis * mainAxisMulti,
    y: crossAxis * crossAxisMulti
  };
}
var offset = function(options) {
  if (options === void 0) {
    options = 0;
  }
  return {
    name: "offset",
    options,
    async fn(state) {
      var _middlewareData$offse, _middlewareData$arrow;
      const {
        x,
        y,
        placement,
        middlewareData
      } = state;
      const diffCoords = await convertValueToCoords(state, options);
      if (placement === ((_middlewareData$offse = middlewareData.offset) == null ? void 0 : _middlewareData$offse.placement) && (_middlewareData$arrow = middlewareData.arrow) != null && _middlewareData$arrow.alignmentOffset) {
        return {};
      }
      return {
        x: x + diffCoords.x,
        y: y + diffCoords.y,
        data: {
          ...diffCoords,
          placement
        }
      };
    }
  };
};
var shift = function(options) {
  if (options === void 0) {
    options = {};
  }
  return {
    name: "shift",
    options,
    async fn(state) {
      const {
        x,
        y,
        placement,
        platform: platform2
      } = state;
      const {
        mainAxis: checkMainAxis = true,
        crossAxis: checkCrossAxis = false,
        limiter = {
          fn: (_ref) => {
            let {
              x: x2,
              y: y2
            } = _ref;
            return {
              x: x2,
              y: y2
            };
          }
        },
        ...detectOverflowOptions
      } = evaluate(options, state);
      const coords = {
        x,
        y
      };
      const overflow = await platform2.detectOverflow(state, detectOverflowOptions);
      const crossAxis = getSideAxis(getSide(placement));
      const mainAxis = getOppositeAxis(crossAxis);
      let mainAxisCoord = coords[mainAxis];
      let crossAxisCoord = coords[crossAxis];
      if (checkMainAxis) {
        const minSide = mainAxis === "y" ? "top" : "left";
        const maxSide = mainAxis === "y" ? "bottom" : "right";
        const min2 = mainAxisCoord + overflow[minSide];
        const max2 = mainAxisCoord - overflow[maxSide];
        mainAxisCoord = clamp(min2, mainAxisCoord, max2);
      }
      if (checkCrossAxis) {
        const minSide = crossAxis === "y" ? "top" : "left";
        const maxSide = crossAxis === "y" ? "bottom" : "right";
        const min2 = crossAxisCoord + overflow[minSide];
        const max2 = crossAxisCoord - overflow[maxSide];
        crossAxisCoord = clamp(min2, crossAxisCoord, max2);
      }
      const limitedCoords = limiter.fn({
        ...state,
        [mainAxis]: mainAxisCoord,
        [crossAxis]: crossAxisCoord
      });
      return {
        ...limitedCoords,
        data: {
          x: limitedCoords.x - x,
          y: limitedCoords.y - y,
          enabled: {
            [mainAxis]: checkMainAxis,
            [crossAxis]: checkCrossAxis
          }
        }
      };
    }
  };
};

// node_modules/@floating-ui/utils/dist/floating-ui.utils.dom.mjs
function hasWindow() {
  return typeof window !== "undefined";
}
function getNodeName(node) {
  if (isNode(node)) {
    return (node.nodeName || "").toLowerCase();
  }
  return "#document";
}
function getWindow(node) {
  var _node$ownerDocument;
  return (node == null || (_node$ownerDocument = node.ownerDocument) == null ? void 0 : _node$ownerDocument.defaultView) || window;
}
function getDocumentElement(node) {
  var _ref;
  return (_ref = (isNode(node) ? node.ownerDocument : node.document) || window.document) == null ? void 0 : _ref.documentElement;
}
function isNode(value) {
  if (!hasWindow()) {
    return false;
  }
  return value instanceof Node || value instanceof getWindow(value).Node;
}
function isElement(value) {
  if (!hasWindow()) {
    return false;
  }
  return value instanceof Element || value instanceof getWindow(value).Element;
}
function isHTMLElement(value) {
  if (!hasWindow()) {
    return false;
  }
  return value instanceof HTMLElement || value instanceof getWindow(value).HTMLElement;
}
function isShadowRoot(value) {
  if (!hasWindow() || typeof ShadowRoot === "undefined") {
    return false;
  }
  return value instanceof ShadowRoot || value instanceof getWindow(value).ShadowRoot;
}
var invalidOverflowDisplayValues = /* @__PURE__ */ new Set(["inline", "contents"]);
function isOverflowElement(element) {
  const {
    overflow,
    overflowX,
    overflowY,
    display
  } = getComputedStyle2(element);
  return /auto|scroll|overlay|hidden|clip/.test(overflow + overflowY + overflowX) && !invalidOverflowDisplayValues.has(display);
}
var tableElements = /* @__PURE__ */ new Set(["table", "td", "th"]);
function isTableElement(element) {
  return tableElements.has(getNodeName(element));
}
var topLayerSelectors = [":popover-open", ":modal"];
function isTopLayer(element) {
  return topLayerSelectors.some((selector) => {
    try {
      return element.matches(selector);
    } catch (_e) {
      return false;
    }
  });
}
var transformProperties = ["transform", "translate", "scale", "rotate", "perspective"];
var willChangeValues = ["transform", "translate", "scale", "rotate", "perspective", "filter"];
var containValues = ["paint", "layout", "strict", "content"];
function isContainingBlock(elementOrCss) {
  const webkit = isWebKit();
  const css = isElement(elementOrCss) ? getComputedStyle2(elementOrCss) : elementOrCss;
  return transformProperties.some((value) => css[value] ? css[value] !== "none" : false) || (css.containerType ? css.containerType !== "normal" : false) || !webkit && (css.backdropFilter ? css.backdropFilter !== "none" : false) || !webkit && (css.filter ? css.filter !== "none" : false) || willChangeValues.some((value) => (css.willChange || "").includes(value)) || containValues.some((value) => (css.contain || "").includes(value));
}
function getContainingBlock(element) {
  let currentNode = getParentNode(element);
  while (isHTMLElement(currentNode) && !isLastTraversableNode(currentNode)) {
    if (isContainingBlock(currentNode)) {
      return currentNode;
    } else if (isTopLayer(currentNode)) {
      return null;
    }
    currentNode = getParentNode(currentNode);
  }
  return null;
}
function isWebKit() {
  if (typeof CSS === "undefined" || !CSS.supports)
    return false;
  return CSS.supports("-webkit-backdrop-filter", "none");
}
var lastTraversableNodeNames = /* @__PURE__ */ new Set(["html", "body", "#document"]);
function isLastTraversableNode(node) {
  return lastTraversableNodeNames.has(getNodeName(node));
}
function getComputedStyle2(element) {
  return getWindow(element).getComputedStyle(element);
}
function getNodeScroll(element) {
  if (isElement(element)) {
    return {
      scrollLeft: element.scrollLeft,
      scrollTop: element.scrollTop
    };
  }
  return {
    scrollLeft: element.scrollX,
    scrollTop: element.scrollY
  };
}
function getParentNode(node) {
  if (getNodeName(node) === "html") {
    return node;
  }
  const result = (
    // Step into the shadow DOM of the parent of a slotted node.
    node.assignedSlot || // DOM Element detected.
    node.parentNode || // ShadowRoot detected.
    isShadowRoot(node) && node.host || // Fallback.
    getDocumentElement(node)
  );
  return isShadowRoot(result) ? result.host : result;
}
function getNearestOverflowAncestor(node) {
  const parentNode = getParentNode(node);
  if (isLastTraversableNode(parentNode)) {
    return node.ownerDocument ? node.ownerDocument.body : node.body;
  }
  if (isHTMLElement(parentNode) && isOverflowElement(parentNode)) {
    return parentNode;
  }
  return getNearestOverflowAncestor(parentNode);
}
function getOverflowAncestors(node, list, traverseIframes) {
  var _node$ownerDocument2;
  if (list === void 0) {
    list = [];
  }
  if (traverseIframes === void 0) {
    traverseIframes = true;
  }
  const scrollableAncestor = getNearestOverflowAncestor(node);
  const isBody = scrollableAncestor === ((_node$ownerDocument2 = node.ownerDocument) == null ? void 0 : _node$ownerDocument2.body);
  const win = getWindow(scrollableAncestor);
  if (isBody) {
    const frameElement = getFrameElement(win);
    return list.concat(win, win.visualViewport || [], isOverflowElement(scrollableAncestor) ? scrollableAncestor : [], frameElement && traverseIframes ? getOverflowAncestors(frameElement) : []);
  }
  return list.concat(scrollableAncestor, getOverflowAncestors(scrollableAncestor, [], traverseIframes));
}
function getFrameElement(win) {
  return win.parent && Object.getPrototypeOf(win.parent) ? win.frameElement : null;
}

// node_modules/@floating-ui/dom/dist/floating-ui.dom.mjs
function getCssDimensions(element) {
  const css = getComputedStyle2(element);
  let width = parseFloat(css.width) || 0;
  let height = parseFloat(css.height) || 0;
  const hasOffset = isHTMLElement(element);
  const offsetWidth = hasOffset ? element.offsetWidth : width;
  const offsetHeight = hasOffset ? element.offsetHeight : height;
  const shouldFallback = round(width) !== offsetWidth || round(height) !== offsetHeight;
  if (shouldFallback) {
    width = offsetWidth;
    height = offsetHeight;
  }
  return {
    width,
    height,
    $: shouldFallback
  };
}
function unwrapElement(element) {
  return !isElement(element) ? element.contextElement : element;
}
function getScale(element) {
  const domElement = unwrapElement(element);
  if (!isHTMLElement(domElement)) {
    return createCoords(1);
  }
  const rect = domElement.getBoundingClientRect();
  const {
    width,
    height,
    $
  } = getCssDimensions(domElement);
  let x = ($ ? round(rect.width) : rect.width) / width;
  let y = ($ ? round(rect.height) : rect.height) / height;
  if (!x || !Number.isFinite(x)) {
    x = 1;
  }
  if (!y || !Number.isFinite(y)) {
    y = 1;
  }
  return {
    x,
    y
  };
}
var noOffsets = /* @__PURE__ */ createCoords(0);
function getVisualOffsets(element) {
  const win = getWindow(element);
  if (!isWebKit() || !win.visualViewport) {
    return noOffsets;
  }
  return {
    x: win.visualViewport.offsetLeft,
    y: win.visualViewport.offsetTop
  };
}
function shouldAddVisualOffsets(element, isFixed, floatingOffsetParent) {
  if (isFixed === void 0) {
    isFixed = false;
  }
  if (!floatingOffsetParent || isFixed && floatingOffsetParent !== getWindow(element)) {
    return false;
  }
  return isFixed;
}
function getBoundingClientRect(element, includeScale, isFixedStrategy, offsetParent) {
  if (includeScale === void 0) {
    includeScale = false;
  }
  if (isFixedStrategy === void 0) {
    isFixedStrategy = false;
  }
  const clientRect = element.getBoundingClientRect();
  const domElement = unwrapElement(element);
  let scale = createCoords(1);
  if (includeScale) {
    if (offsetParent) {
      if (isElement(offsetParent)) {
        scale = getScale(offsetParent);
      }
    } else {
      scale = getScale(element);
    }
  }
  const visualOffsets = shouldAddVisualOffsets(domElement, isFixedStrategy, offsetParent) ? getVisualOffsets(domElement) : createCoords(0);
  let x = (clientRect.left + visualOffsets.x) / scale.x;
  let y = (clientRect.top + visualOffsets.y) / scale.y;
  let width = clientRect.width / scale.x;
  let height = clientRect.height / scale.y;
  if (domElement) {
    const win = getWindow(domElement);
    const offsetWin = offsetParent && isElement(offsetParent) ? getWindow(offsetParent) : offsetParent;
    let currentWin = win;
    let currentIFrame = getFrameElement(currentWin);
    while (currentIFrame && offsetParent && offsetWin !== currentWin) {
      const iframeScale = getScale(currentIFrame);
      const iframeRect = currentIFrame.getBoundingClientRect();
      const css = getComputedStyle2(currentIFrame);
      const left = iframeRect.left + (currentIFrame.clientLeft + parseFloat(css.paddingLeft)) * iframeScale.x;
      const top = iframeRect.top + (currentIFrame.clientTop + parseFloat(css.paddingTop)) * iframeScale.y;
      x *= iframeScale.x;
      y *= iframeScale.y;
      width *= iframeScale.x;
      height *= iframeScale.y;
      x += left;
      y += top;
      currentWin = getWindow(currentIFrame);
      currentIFrame = getFrameElement(currentWin);
    }
  }
  return rectToClientRect({
    width,
    height,
    x,
    y
  });
}
function getWindowScrollBarX(element, rect) {
  const leftScroll = getNodeScroll(element).scrollLeft;
  if (!rect) {
    return getBoundingClientRect(getDocumentElement(element)).left + leftScroll;
  }
  return rect.left + leftScroll;
}
function getHTMLOffset(documentElement, scroll) {
  const htmlRect = documentElement.getBoundingClientRect();
  const x = htmlRect.left + scroll.scrollLeft - getWindowScrollBarX(documentElement, htmlRect);
  const y = htmlRect.top + scroll.scrollTop;
  return {
    x,
    y
  };
}
function convertOffsetParentRelativeRectToViewportRelativeRect(_ref) {
  let {
    elements,
    rect,
    offsetParent,
    strategy
  } = _ref;
  const isFixed = strategy === "fixed";
  const documentElement = getDocumentElement(offsetParent);
  const topLayer = elements ? isTopLayer(elements.floating) : false;
  if (offsetParent === documentElement || topLayer && isFixed) {
    return rect;
  }
  let scroll = {
    scrollLeft: 0,
    scrollTop: 0
  };
  let scale = createCoords(1);
  const offsets = createCoords(0);
  const isOffsetParentAnElement = isHTMLElement(offsetParent);
  if (isOffsetParentAnElement || !isOffsetParentAnElement && !isFixed) {
    if (getNodeName(offsetParent) !== "body" || isOverflowElement(documentElement)) {
      scroll = getNodeScroll(offsetParent);
    }
    if (isHTMLElement(offsetParent)) {
      const offsetRect = getBoundingClientRect(offsetParent);
      scale = getScale(offsetParent);
      offsets.x = offsetRect.x + offsetParent.clientLeft;
      offsets.y = offsetRect.y + offsetParent.clientTop;
    }
  }
  const htmlOffset = documentElement && !isOffsetParentAnElement && !isFixed ? getHTMLOffset(documentElement, scroll) : createCoords(0);
  return {
    width: rect.width * scale.x,
    height: rect.height * scale.y,
    x: rect.x * scale.x - scroll.scrollLeft * scale.x + offsets.x + htmlOffset.x,
    y: rect.y * scale.y - scroll.scrollTop * scale.y + offsets.y + htmlOffset.y
  };
}
function getClientRects(element) {
  return Array.from(element.getClientRects());
}
function getDocumentRect(element) {
  const html = getDocumentElement(element);
  const scroll = getNodeScroll(element);
  const body = element.ownerDocument.body;
  const width = max(html.scrollWidth, html.clientWidth, body.scrollWidth, body.clientWidth);
  const height = max(html.scrollHeight, html.clientHeight, body.scrollHeight, body.clientHeight);
  let x = -scroll.scrollLeft + getWindowScrollBarX(element);
  const y = -scroll.scrollTop;
  if (getComputedStyle2(body).direction === "rtl") {
    x += max(html.clientWidth, body.clientWidth) - width;
  }
  return {
    width,
    height,
    x,
    y
  };
}
var SCROLLBAR_MAX = 25;
function getViewportRect(element, strategy) {
  const win = getWindow(element);
  const html = getDocumentElement(element);
  const visualViewport = win.visualViewport;
  let width = html.clientWidth;
  let height = html.clientHeight;
  let x = 0;
  let y = 0;
  if (visualViewport) {
    width = visualViewport.width;
    height = visualViewport.height;
    const visualViewportBased = isWebKit();
    if (!visualViewportBased || visualViewportBased && strategy === "fixed") {
      x = visualViewport.offsetLeft;
      y = visualViewport.offsetTop;
    }
  }
  const windowScrollbarX = getWindowScrollBarX(html);
  if (windowScrollbarX <= 0) {
    const doc = html.ownerDocument;
    const body = doc.body;
    const bodyStyles = getComputedStyle(body);
    const bodyMarginInline = doc.compatMode === "CSS1Compat" ? parseFloat(bodyStyles.marginLeft) + parseFloat(bodyStyles.marginRight) || 0 : 0;
    const clippingStableScrollbarWidth = Math.abs(html.clientWidth - body.clientWidth - bodyMarginInline);
    if (clippingStableScrollbarWidth <= SCROLLBAR_MAX) {
      width -= clippingStableScrollbarWidth;
    }
  } else if (windowScrollbarX <= SCROLLBAR_MAX) {
    width += windowScrollbarX;
  }
  return {
    width,
    height,
    x,
    y
  };
}
var absoluteOrFixed = /* @__PURE__ */ new Set(["absolute", "fixed"]);
function getInnerBoundingClientRect(element, strategy) {
  const clientRect = getBoundingClientRect(element, true, strategy === "fixed");
  const top = clientRect.top + element.clientTop;
  const left = clientRect.left + element.clientLeft;
  const scale = isHTMLElement(element) ? getScale(element) : createCoords(1);
  const width = element.clientWidth * scale.x;
  const height = element.clientHeight * scale.y;
  const x = left * scale.x;
  const y = top * scale.y;
  return {
    width,
    height,
    x,
    y
  };
}
function getClientRectFromClippingAncestor(element, clippingAncestor, strategy) {
  let rect;
  if (clippingAncestor === "viewport") {
    rect = getViewportRect(element, strategy);
  } else if (clippingAncestor === "document") {
    rect = getDocumentRect(getDocumentElement(element));
  } else if (isElement(clippingAncestor)) {
    rect = getInnerBoundingClientRect(clippingAncestor, strategy);
  } else {
    const visualOffsets = getVisualOffsets(element);
    rect = {
      x: clippingAncestor.x - visualOffsets.x,
      y: clippingAncestor.y - visualOffsets.y,
      width: clippingAncestor.width,
      height: clippingAncestor.height
    };
  }
  return rectToClientRect(rect);
}
function hasFixedPositionAncestor(element, stopNode) {
  const parentNode = getParentNode(element);
  if (parentNode === stopNode || !isElement(parentNode) || isLastTraversableNode(parentNode)) {
    return false;
  }
  return getComputedStyle2(parentNode).position === "fixed" || hasFixedPositionAncestor(parentNode, stopNode);
}
function getClippingElementAncestors(element, cache) {
  const cachedResult = cache.get(element);
  if (cachedResult) {
    return cachedResult;
  }
  let result = getOverflowAncestors(element, [], false).filter((el) => isElement(el) && getNodeName(el) !== "body");
  let currentContainingBlockComputedStyle = null;
  const elementIsFixed = getComputedStyle2(element).position === "fixed";
  let currentNode = elementIsFixed ? getParentNode(element) : element;
  while (isElement(currentNode) && !isLastTraversableNode(currentNode)) {
    const computedStyle = getComputedStyle2(currentNode);
    const currentNodeIsContaining = isContainingBlock(currentNode);
    if (!currentNodeIsContaining && computedStyle.position === "fixed") {
      currentContainingBlockComputedStyle = null;
    }
    const shouldDropCurrentNode = elementIsFixed ? !currentNodeIsContaining && !currentContainingBlockComputedStyle : !currentNodeIsContaining && computedStyle.position === "static" && !!currentContainingBlockComputedStyle && absoluteOrFixed.has(currentContainingBlockComputedStyle.position) || isOverflowElement(currentNode) && !currentNodeIsContaining && hasFixedPositionAncestor(element, currentNode);
    if (shouldDropCurrentNode) {
      result = result.filter((ancestor) => ancestor !== currentNode);
    } else {
      currentContainingBlockComputedStyle = computedStyle;
    }
    currentNode = getParentNode(currentNode);
  }
  cache.set(element, result);
  return result;
}
function getClippingRect(_ref) {
  let {
    element,
    boundary,
    rootBoundary,
    strategy
  } = _ref;
  const elementClippingAncestors = boundary === "clippingAncestors" ? isTopLayer(element) ? [] : getClippingElementAncestors(element, this._c) : [].concat(boundary);
  const clippingAncestors = [...elementClippingAncestors, rootBoundary];
  const firstClippingAncestor = clippingAncestors[0];
  const clippingRect = clippingAncestors.reduce((accRect, clippingAncestor) => {
    const rect = getClientRectFromClippingAncestor(element, clippingAncestor, strategy);
    accRect.top = max(rect.top, accRect.top);
    accRect.right = min(rect.right, accRect.right);
    accRect.bottom = min(rect.bottom, accRect.bottom);
    accRect.left = max(rect.left, accRect.left);
    return accRect;
  }, getClientRectFromClippingAncestor(element, firstClippingAncestor, strategy));
  return {
    width: clippingRect.right - clippingRect.left,
    height: clippingRect.bottom - clippingRect.top,
    x: clippingRect.left,
    y: clippingRect.top
  };
}
function getDimensions(element) {
  const {
    width,
    height
  } = getCssDimensions(element);
  return {
    width,
    height
  };
}
function getRectRelativeToOffsetParent(element, offsetParent, strategy) {
  const isOffsetParentAnElement = isHTMLElement(offsetParent);
  const documentElement = getDocumentElement(offsetParent);
  const isFixed = strategy === "fixed";
  const rect = getBoundingClientRect(element, true, isFixed, offsetParent);
  let scroll = {
    scrollLeft: 0,
    scrollTop: 0
  };
  const offsets = createCoords(0);
  function setLeftRTLScrollbarOffset() {
    offsets.x = getWindowScrollBarX(documentElement);
  }
  if (isOffsetParentAnElement || !isOffsetParentAnElement && !isFixed) {
    if (getNodeName(offsetParent) !== "body" || isOverflowElement(documentElement)) {
      scroll = getNodeScroll(offsetParent);
    }
    if (isOffsetParentAnElement) {
      const offsetRect = getBoundingClientRect(offsetParent, true, isFixed, offsetParent);
      offsets.x = offsetRect.x + offsetParent.clientLeft;
      offsets.y = offsetRect.y + offsetParent.clientTop;
    } else if (documentElement) {
      setLeftRTLScrollbarOffset();
    }
  }
  if (isFixed && !isOffsetParentAnElement && documentElement) {
    setLeftRTLScrollbarOffset();
  }
  const htmlOffset = documentElement && !isOffsetParentAnElement && !isFixed ? getHTMLOffset(documentElement, scroll) : createCoords(0);
  const x = rect.left + scroll.scrollLeft - offsets.x - htmlOffset.x;
  const y = rect.top + scroll.scrollTop - offsets.y - htmlOffset.y;
  return {
    x,
    y,
    width: rect.width,
    height: rect.height
  };
}
function isStaticPositioned(element) {
  return getComputedStyle2(element).position === "static";
}
function getTrueOffsetParent(element, polyfill) {
  if (!isHTMLElement(element) || getComputedStyle2(element).position === "fixed") {
    return null;
  }
  if (polyfill) {
    return polyfill(element);
  }
  let rawOffsetParent = element.offsetParent;
  if (getDocumentElement(element) === rawOffsetParent) {
    rawOffsetParent = rawOffsetParent.ownerDocument.body;
  }
  return rawOffsetParent;
}
function getOffsetParent(element, polyfill) {
  const win = getWindow(element);
  if (isTopLayer(element)) {
    return win;
  }
  if (!isHTMLElement(element)) {
    let svgOffsetParent = getParentNode(element);
    while (svgOffsetParent && !isLastTraversableNode(svgOffsetParent)) {
      if (isElement(svgOffsetParent) && !isStaticPositioned(svgOffsetParent)) {
        return svgOffsetParent;
      }
      svgOffsetParent = getParentNode(svgOffsetParent);
    }
    return win;
  }
  let offsetParent = getTrueOffsetParent(element, polyfill);
  while (offsetParent && isTableElement(offsetParent) && isStaticPositioned(offsetParent)) {
    offsetParent = getTrueOffsetParent(offsetParent, polyfill);
  }
  if (offsetParent && isLastTraversableNode(offsetParent) && isStaticPositioned(offsetParent) && !isContainingBlock(offsetParent)) {
    return win;
  }
  return offsetParent || getContainingBlock(element) || win;
}
var getElementRects = async function(data) {
  const getOffsetParentFn = this.getOffsetParent || getOffsetParent;
  const getDimensionsFn = this.getDimensions;
  const floatingDimensions = await getDimensionsFn(data.floating);
  return {
    reference: getRectRelativeToOffsetParent(data.reference, await getOffsetParentFn(data.floating), data.strategy),
    floating: {
      x: 0,
      y: 0,
      width: floatingDimensions.width,
      height: floatingDimensions.height
    }
  };
};
function isRTL(element) {
  return getComputedStyle2(element).direction === "rtl";
}
var platform = {
  convertOffsetParentRelativeRectToViewportRelativeRect,
  getDocumentElement,
  getClippingRect,
  getOffsetParent,
  getElementRects,
  getClientRects,
  getDimensions,
  getScale,
  isElement,
  isRTL
};
var offset2 = offset;
var shift2 = shift;
var flip2 = flip;
var computePosition2 = (reference, floating, options) => {
  const cache = /* @__PURE__ */ new Map();
  const mergedOptions = {
    platform,
    ...options
  };
  const platformWithCache = {
    ...mergedOptions.platform,
    _c: cache
  };
  return computePosition(reference, floating, {
    ...mergedOptions,
    platform: platformWithCache
  });
};

// src/link-tooltip.js
var LinkTooltip = class {
  constructor(editor) {
    this.editor = editor;
    this.tooltip = null;
    this.currentLink = null;
    this.hideTimeout = null;
    this.visibilityChangeHandler = null;
    this.isTooltipHovered = false;
    this.linkCacheText = null;
    this.linkCache = [];
    this.init();
  }
  init() {
    this.createTooltip();
    this.editor.textarea.addEventListener("selectionchange", () => this.checkCursorPosition());
    this.editor.textarea.addEventListener("keyup", (e) => {
      if (e.key.includes("Arrow") || e.key === "Home" || e.key === "End") {
        this.checkCursorPosition();
      }
    });
    this.editor.textarea.addEventListener("input", () => this.hide());
    this.editor.textarea.addEventListener("scroll", () => {
      if (this.currentLink) {
        this.positionTooltip(this.currentLink);
      }
    });
    this.editor.textarea.addEventListener("blur", () => {
      if (!this.isTooltipHovered) {
        this.hide();
      }
    });
    this.visibilityChangeHandler = () => {
      if (document.hidden) {
        this.hide();
      }
    };
    document.addEventListener("visibilitychange", this.visibilityChangeHandler);
    this.tooltip.addEventListener("mouseenter", () => {
      this.isTooltipHovered = true;
      this.cancelHide();
    });
    this.tooltip.addEventListener("mouseleave", () => {
      this.isTooltipHovered = false;
      this.scheduleHide();
    });
  }
  createTooltip() {
    this.tooltip = document.createElement("div");
    this.tooltip.className = "overtype-link-tooltip";
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
        const safeUrl = MarkdownParser.sanitizeUrl(this.currentLink.url);
        if (safeUrl !== "#") {
          window.open(safeUrl, "_blank");
        }
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
    if (this.editor.options.showActiveLineRaw)
      return null;
    if (this.linkCacheText !== text) {
      this.linkCacheText = text;
      this.linkCache = MarkdownParser.findRenderableLinks(text);
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
  transformUrl(url) {
    const transform = this.editor.options.transformLinkUrl;
    if (typeof transform !== "function")
      return url;
    try {
      const result = transform(url);
      return typeof result === "string" ? result : url;
    } catch (e) {
      console.warn("transformLinkUrl threw:", e);
      return url;
    }
  }
  async show(linkInfo) {
    this.currentLink = linkInfo;
    this.cancelHide();
    const urlSpan = this.tooltip.querySelector(".overtype-link-tooltip-url");
    urlSpan.textContent = linkInfo.url;
    await this.positionTooltip(linkInfo);
    if (this.currentLink === linkInfo) {
      this.tooltip.classList.add("visible");
    }
  }
  async positionTooltip(linkInfo) {
    const anchorElement = this.findAnchorElement(linkInfo.index);
    if (!anchorElement) {
      return;
    }
    const rect = anchorElement.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) {
      return;
    }
    try {
      const { x, y } = await computePosition2(
        anchorElement,
        this.tooltip,
        {
          strategy: "fixed",
          placement: "bottom",
          middleware: [
            offset2(8),
            shift2({ padding: 8 }),
            flip2()
          ]
        }
      );
      Object.assign(this.tooltip.style, {
        left: `${x}px`,
        top: `${y}px`,
        position: "fixed"
      });
    } catch (error) {
      console.warn("Floating UI positioning failed:", error);
    }
  }
  findAnchorElement(linkIndex) {
    const preview = this.editor.preview;
    return preview.querySelector(`a[style*="--link-${linkIndex}"]`);
  }
  hide() {
    this.tooltip.classList.remove("visible");
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
    if (this.visibilityChangeHandler) {
      document.removeEventListener("visibilitychange", this.visibilityChangeHandler);
      this.visibilityChangeHandler = null;
    }
    if (this.tooltip && this.tooltip.parentNode) {
      this.tooltip.parentNode.removeChild(this.tooltip);
    }
    this.tooltip = null;
    this.currentLink = null;
    this.isTooltipHovered = false;
  }
};

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
var uploadIcon = `<svg viewBox="0 0 18 18">
  <path stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.25 12.375v1.688A1.688 1.688 0 0 0 3.938 15.75h10.124a1.688 1.688 0 0 0 1.688-1.688V12.375"></path>
  <path stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5.063 6.188L9 2.25l3.938 3.938"></path>
  <path stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 2.25v10.125"></path>
</svg>`;
var eyeIcon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" fill="none"></path>
  <circle cx="12" cy="12" r="3" fill="none"></circle>
</svg>`;

// src/toolbar-buttons.js
var toolbarButtons = {
  bold: {
    name: "bold",
    actionId: "toggleBold",
    icon: boldIcon,
    title: "Bold (Ctrl+B)",
    isActive: ({ activeFormats }) => activeFormats.includes("bold"),
    action: ({ editor }) => {
      toggleBold(editor.textarea);
      editor.textarea.dispatchEvent(new Event("input", { bubbles: true }));
    }
  },
  italic: {
    name: "italic",
    actionId: "toggleItalic",
    icon: italicIcon,
    title: "Italic (Ctrl+I)",
    isActive: ({ activeFormats }) => activeFormats.includes("italic"),
    action: ({ editor }) => {
      toggleItalic(editor.textarea);
      editor.textarea.dispatchEvent(new Event("input", { bubbles: true }));
    }
  },
  code: {
    name: "code",
    actionId: "toggleCode",
    icon: codeIcon,
    title: "Inline Code",
    isActive: () => false,
    action: ({ editor }) => {
      toggleCode(editor.textarea);
      editor.textarea.dispatchEvent(new Event("input", { bubbles: true }));
    }
  },
  separator: {
    name: "separator"
    // No icon, title, or action - special separator element
  },
  link: {
    name: "link",
    actionId: "insertLink",
    icon: linkIcon,
    title: "Insert Link",
    action: ({ editor }) => {
      insertLink(editor.textarea);
      editor.textarea.dispatchEvent(new Event("input", { bubbles: true }));
    }
  },
  h1: {
    name: "h1",
    actionId: "toggleH1",
    icon: h1Icon,
    title: "Heading 1",
    isActive: ({ activeFormats }) => activeFormats.includes("header"),
    action: ({ editor }) => {
      toggleH1(editor.textarea);
      editor.textarea.dispatchEvent(new Event("input", { bubbles: true }));
    }
  },
  h2: {
    name: "h2",
    actionId: "toggleH2",
    icon: h2Icon,
    title: "Heading 2",
    isActive: ({ activeFormats }) => activeFormats.includes("header-2"),
    action: ({ editor }) => {
      toggleH2(editor.textarea);
      editor.textarea.dispatchEvent(new Event("input", { bubbles: true }));
    }
  },
  h3: {
    name: "h3",
    actionId: "toggleH3",
    icon: h3Icon,
    title: "Heading 3",
    isActive: ({ activeFormats }) => activeFormats.includes("header-3"),
    action: ({ editor }) => {
      toggleH3(editor.textarea);
      editor.textarea.dispatchEvent(new Event("input", { bubbles: true }));
    }
  },
  bulletList: {
    name: "bulletList",
    actionId: "toggleBulletList",
    icon: bulletListIcon,
    title: "Bullet List",
    isActive: ({ activeFormats }) => activeFormats.includes("bullet-list"),
    action: ({ editor }) => {
      toggleBulletList(editor.textarea);
      editor.textarea.dispatchEvent(new Event("input", { bubbles: true }));
    }
  },
  orderedList: {
    name: "orderedList",
    actionId: "toggleNumberedList",
    icon: orderedListIcon,
    title: "Numbered List",
    isActive: ({ activeFormats }) => activeFormats.includes("numbered-list"),
    action: ({ editor }) => {
      toggleNumberedList(editor.textarea);
      editor.textarea.dispatchEvent(new Event("input", { bubbles: true }));
    }
  },
  taskList: {
    name: "taskList",
    actionId: "toggleTaskList",
    icon: taskListIcon,
    title: "Task List",
    isActive: ({ activeFormats }) => activeFormats.includes("task-list"),
    action: ({ editor }) => {
      if (toggleTaskList) {
        toggleTaskList(editor.textarea);
        editor.textarea.dispatchEvent(new Event("input", { bubbles: true }));
      }
    }
  },
  quote: {
    name: "quote",
    actionId: "toggleQuote",
    icon: quoteIcon,
    title: "Quote",
    isActive: ({ activeFormats }) => activeFormats.includes("quote"),
    action: ({ editor }) => {
      toggleQuote(editor.textarea);
      editor.textarea.dispatchEvent(new Event("input", { bubbles: true }));
    }
  },
  upload: {
    name: "upload",
    actionId: "uploadFile",
    icon: uploadIcon,
    title: "Upload File",
    action: ({ editor }) => {
      var _a, _b;
      if (!((_a = editor.options.fileUpload) == null ? void 0 : _a.enabled))
        return;
      const input = document.createElement("input");
      input.type = "file";
      input.multiple = true;
      if (((_b = editor.options.fileUpload.mimeTypes) == null ? void 0 : _b.length) > 0) {
        input.accept = editor.options.fileUpload.mimeTypes.join(",");
      }
      input.onchange = () => {
        var _a2;
        if (!((_a2 = input.files) == null ? void 0 : _a2.length))
          return;
        const dt = new DataTransfer();
        for (const f of input.files)
          dt.items.add(f);
        editor._handleDataTransfer(dt);
      };
      input.click();
    }
  },
  viewMode: {
    name: "viewMode",
    icon: eyeIcon,
    title: "View mode"
    // Special: handled internally by Toolbar class as dropdown
    // No action property - dropdown behavior is internal
  }
};
var defaultToolbarButtons = [
  toolbarButtons.bold,
  toolbarButtons.italic,
  toolbarButtons.code,
  toolbarButtons.separator,
  toolbarButtons.link,
  toolbarButtons.separator,
  toolbarButtons.h1,
  toolbarButtons.h2,
  toolbarButtons.h3,
  toolbarButtons.separator,
  toolbarButtons.bulletList,
  toolbarButtons.orderedList,
  toolbarButtons.taskList,
  toolbarButtons.separator,
  toolbarButtons.quote,
  toolbarButtons.separator,
  toolbarButtons.viewMode
];

// src/overtype.js
var _isSafariCache;
function isSafariBrowser() {
  if (_isSafariCache !== void 0)
    return _isSafariCache;
  _isSafariCache = false;
  if (typeof navigator !== "undefined") {
    const ua = navigator.userAgent || "";
    _isSafariCache = /^((?!chrome|android|crios|fxios|edg|opr).)*safari/i.test(ua) || /iPad|iPhone|iPod/.test(ua) || navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1 && /Safari/.test(ua);
  }
  return _isSafariCache;
}
function buildActionsMap(buttons) {
  const map = {};
  (buttons || []).forEach((btn) => {
    if (!btn || btn.name === "separator")
      return;
    const id = btn.actionId || btn.name;
    if (btn.action) {
      map[id] = btn.action;
    }
  });
  return map;
}
function normalizeButtons(buttons) {
  const list = buttons || defaultToolbarButtons;
  if (!Array.isArray(list))
    return null;
  return list.map((btn) => ({
    name: (btn == null ? void 0 : btn.name) || null,
    actionId: (btn == null ? void 0 : btn.actionId) || (btn == null ? void 0 : btn.name) || null,
    icon: (btn == null ? void 0 : btn.icon) || null,
    title: (btn == null ? void 0 : btn.title) || null
  }));
}
function toolbarButtonsChanged(prevButtons, nextButtons) {
  const prev = normalizeButtons(prevButtons);
  const next = normalizeButtons(nextButtons);
  if (prev === null || next === null)
    return prev !== next;
  if (prev.length !== next.length)
    return true;
  for (let i = 0; i < prev.length; i++) {
    const a = prev[i];
    const b = next[i];
    if (a.name !== b.name || a.actionId !== b.actionId || a.icon !== b.icon || a.title !== b.title) {
      return true;
    }
  }
  return false;
}
var _OverType = class _OverType {
  /**
   * Constructor - Always returns an array of instances
   * @param {string|Element|NodeList|Array} target - Target element(s)
   * @param {Object} options - Configuration options
   * @returns {Array} Array of OverType instances
   */
  constructor(target, options = {}) {
    const elements = _OverType._resolveTargets(target);
    if (typeof target === "string" && elements.length === 0) {
      throw new Error(`No elements found for selector: ${target}`);
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
    this._isSafari = isSafariBrowser();
    this._safariReflowRaf = null;
    _OverType.injectStyles();
    _OverType.initGlobalListeners();
    const container = element.querySelector(".overtype-container");
    const wrapper = element.querySelector(".overtype-wrapper");
    if (container || wrapper) {
      this._recoverFromDOM(container, wrapper);
    } else {
      this._buildFromScratch();
    }
    if (this.instanceTheme === "auto") {
      this.setTheme("auto");
    }
    this.shortcuts = new ShortcutsManager(this);
    this._rebuildActionsMap();
    this.linkTooltip = new LinkTooltip(this);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        this.textarea.scrollTop = this.preview.scrollTop;
        this.textarea.scrollLeft = this.preview.scrollLeft;
      });
    });
    this.initialized = true;
    if (this.options.onChange) {
      this._notifyChange();
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
      /* System-first, guaranteed monospaced; avoids Android 'ui-monospace' pitfalls */
      fontFamily: '"SF Mono", SFMono-Regular, Menlo, Monaco, "Cascadia Code", Consolas, "Roboto Mono", "Noto Sans Mono", "Droid Sans Mono", "Ubuntu Mono", "DejaVu Sans Mono", "Liberation Mono", "Courier New", Courier, monospace',
      padding: "16px",
      // Mobile styles
      mobile: {
        fontSize: "16px",
        // Prevent zoom on iOS
        padding: "12px",
        lineHeight: 1.5
      },
      // Native textarea properties
      textareaProps: {},
      // Behavior
      autofocus: false,
      autoResize: false,
      // Auto-expand height with content
      minHeight: "100px",
      // Minimum height for autoResize mode
      maxHeight: null,
      // Maximum height for autoResize mode (null = unlimited)
      placeholder: "Start typing...",
      value: "",
      // Callbacks
      onChange: null,
      onKeydown: null,
      onRender: null,
      onFocus: null,
      onBlur: null,
      // Features
      showActiveLineRaw: false,
      showStats: false,
      toolbar: false,
      toolbarButtons: null,
      // Defaults to defaultToolbarButtons if toolbar: true
      statsFormatter: null,
      smartLists: true,
      // Enable smart list continuation
      codeHighlighter: null,
      // Per-instance code highlighter
      spellcheck: false,
      // Browser spellcheck (disabled by default)
      transformLinkUrl: null
      // Transform URLs shown/opened in the link tooltip
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
    this._applyInstanceCSSVars();
    this._configureTextarea();
    this._ensureTextareaId();
    this._syncPreviewInteractivity();
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
    this._applyInstanceCSSVars();
    this.wrapper._instance = this;
    this.textarea = document.createElement("textarea");
    this.textarea.className = "overtype-input";
    this.textarea.placeholder = this.options.placeholder;
    this._configureTextarea();
    if (this.options.textareaProps) {
      Object.entries(this.options.textareaProps).forEach(([key, value]) => {
        if (key === "className" || key === "class") {
          this.textarea.className += " " + value;
        } else if (key === "style" && typeof value === "object") {
          Object.assign(this.textarea.style, value);
        } else {
          this.textarea.setAttribute(key, value);
        }
      });
    }
    this._ensureTextareaId();
    this.preview = document.createElement("div");
    this.preview.className = "overtype-preview";
    this.preview.setAttribute("aria-hidden", "true");
    this.placeholderEl = document.createElement("div");
    this.placeholderEl.className = "overtype-placeholder";
    this.placeholderEl.setAttribute("aria-hidden", "true");
    this.placeholderEl.textContent = this.options.placeholder;
    this.wrapper.appendChild(this.textarea);
    this.wrapper.appendChild(this.preview);
    this.wrapper.appendChild(this.placeholderEl);
    this.container.appendChild(this.wrapper);
    if (this.options.showStats) {
      this.statsBar = document.createElement("div");
      this.statsBar.className = "overtype-stats";
      this.container.appendChild(this.statsBar);
      this._updateStats();
    }
    this.element.appendChild(this.container);
    if (this.options.autoResize) {
      this._setupAutoResize();
    } else {
      this.container.classList.remove("overtype-auto-resize");
    }
    this._syncPreviewInteractivity();
  }
  /**
   * Configure textarea attributes
   * @private
   */
  _configureTextarea() {
    this.textarea.setAttribute("autocomplete", "off");
    this.textarea.setAttribute("autocorrect", "off");
    this.textarea.setAttribute("autocapitalize", "off");
    this.textarea.setAttribute("spellcheck", String(this.options.spellcheck));
    this.textarea.setAttribute("data-gramm", "false");
    this.textarea.setAttribute("data-gramm_editor", "false");
    this.textarea.setAttribute("data-enable-grammarly", "false");
  }
  /**
   * Ensure the textarea can be referenced by aria-controls
   * @private
   */
  _ensureTextareaId() {
    if (!this.textarea.id) {
      this.textarea.id = `overtype-${this.instanceId}-input`;
    }
  }
  /**
   * Keep rendered preview content out of keyboard navigation until Preview mode.
   * @private
   */
  _syncPreviewInteractivity() {
    if (!this.preview || !this.container)
      return;
    const isPreviewMode = this.container.dataset.mode === "preview";
    this.preview.inert = !isPreviewMode;
    this.preview.toggleAttribute("inert", !isPreviewMode);
    if (isPreviewMode) {
      this.preview.removeAttribute("aria-hidden");
      return;
    }
    this.preview.setAttribute("aria-hidden", "true");
  }
  /**
   * Create and setup toolbar
   * @private
   */
  _createToolbar() {
    var _a;
    let toolbarButtons2 = this.options.toolbarButtons || defaultToolbarButtons;
    if (((_a = this.options.fileUpload) == null ? void 0 : _a.enabled) && !toolbarButtons2.some((b) => (b == null ? void 0 : b.name) === "upload")) {
      const viewModeIdx = toolbarButtons2.findIndex((b) => (b == null ? void 0 : b.name) === "viewMode");
      if (viewModeIdx !== -1) {
        toolbarButtons2 = [...toolbarButtons2];
        toolbarButtons2.splice(viewModeIdx, 0, toolbarButtons.separator, toolbarButtons.upload);
      } else {
        toolbarButtons2 = [...toolbarButtons2, toolbarButtons.separator, toolbarButtons.upload];
      }
    }
    this.toolbar = new Toolbar(this, { toolbarButtons: toolbarButtons2 });
    this.toolbar.create();
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
    this.textarea.addEventListener("selectionchange", this._toolbarSelectionListener);
    this.textarea.addEventListener("input", this._toolbarInputListener);
  }
  /**
   * Cleanup toolbar event listeners
   * @private
   */
  _cleanupToolbarListeners() {
    if (this._toolbarSelectionListener) {
      this.textarea.removeEventListener("selectionchange", this._toolbarSelectionListener);
      this._toolbarSelectionListener = null;
    }
    if (this._toolbarInputListener) {
      this.textarea.removeEventListener("input", this._toolbarInputListener);
      this._toolbarInputListener = null;
    }
  }
  /**
   * Rebuild the action map from current toolbar button configuration
   * Called during init and reinit to keep shortcuts in sync with toolbar buttons
   * @private
   */
  _rebuildActionsMap() {
    var _a;
    this.actionsById = buildActionsMap(defaultToolbarButtons);
    if (this.options.toolbarButtons) {
      Object.assign(this.actionsById, buildActionsMap(this.options.toolbarButtons));
    }
    if ((_a = this.options.fileUpload) == null ? void 0 : _a.enabled) {
      Object.assign(this.actionsById, buildActionsMap([toolbarButtons.upload]));
    }
  }
  /**
   * Apply instance-specific styles via CSS custom properties on the wrapper.
   * Called from init paths and from _applyOptions so reinit() propagates
   * font/padding changes.
   * @private
   */
  _applyInstanceCSSVars() {
    if (!this.wrapper)
      return;
    if (this.options.fontSize) {
      this.wrapper.style.setProperty("--instance-font-size", this.options.fontSize);
    }
    if (this.options.lineHeight) {
      this.wrapper.style.setProperty("--instance-line-height", String(this.options.lineHeight));
    }
    if (this.options.padding) {
      this.wrapper.style.setProperty("--instance-padding", this.options.padding);
    }
    if (this.options.fontFamily) {
      this.wrapper.style.setProperty("--instance-font-family", this.options.fontFamily);
    }
  }
  /**
   * Apply options to the editor
   * @private
   */
  _applyOptions() {
    this._applyInstanceCSSVars();
    if (this.options.autofocus) {
      this.textarea.focus();
    }
    if (this.options.autoResize) {
      if (!this.container.classList.contains("overtype-auto-resize")) {
        this._setupAutoResize();
      } else {
        this._updateAutoHeight();
      }
    } else {
      this.container.classList.remove("overtype-auto-resize");
    }
    if (this.options.toolbar && !this.toolbar) {
      this._createToolbar();
    } else if (!this.options.toolbar && this.toolbar) {
      this._cleanupToolbarListeners();
      this.toolbar.destroy();
      this.toolbar = null;
    }
    if (this.placeholderEl) {
      this.placeholderEl.textContent = this.options.placeholder;
    }
    if (this.options.fileUpload && !this.fileUploadInitialized) {
      this._initFileUpload();
    } else if (!this.options.fileUpload && this.fileUploadInitialized) {
      this._destroyFileUpload();
    }
    this.updatePreview();
  }
  _initFileUpload() {
    const options = this.options.fileUpload;
    if (!options || !options.enabled)
      return;
    options.maxSize = options.maxSize || 10 * 1024 * 1024;
    options.mimeTypes = options.mimeTypes || [];
    options.batch = options.batch || false;
    if (!options.onInsertFile || typeof options.onInsertFile !== "function") {
      console.warn("OverType: fileUpload.onInsertFile callback is required for file uploads.");
      return;
    }
    this._fileUploadCounter = 0;
    this._uploadedFiles = /* @__PURE__ */ new Map();
    this._boundHandleFilePaste = this._handleFilePaste.bind(this);
    this._boundHandleFileDrop = this._handleFileDrop.bind(this);
    this._boundHandleDragOver = this._handleDragOver.bind(this);
    this.textarea.addEventListener("paste", this._boundHandleFilePaste);
    this.textarea.addEventListener("drop", this._boundHandleFileDrop);
    this.textarea.addEventListener("dragover", this._boundHandleDragOver);
    this.fileUploadInitialized = true;
  }
  /**
   * Extract URLs from markdown link syntax: [text](url) or ![text](url).
   * @private
   */
  _extractMarkdownUrls(text) {
    return MarkdownParser.findLinks(text, { allowEmptyText: true }).map((link) => link.destination.value);
  }
  /**
   * Track URLs that were just inserted, pairing each with the source File.
   * If multiple URLs appear in one inserted block, all get associated with
   * the same file (rare; happens if onInsertFile returns several links).
   * @private
   */
  _trackInsertedUrls(insertedText, file) {
    if (!this._uploadedFiles || !file || !insertedText)
      return;
    const links = MarkdownParser.findLinks(insertedText, { allowEmptyText: true });
    for (const link of links) {
      this._uploadedFiles.set(link.destination.value, {
        filename: file.name,
        file,
        markdownDestination: link.destination.raw
      });
    }
  }
  /**
   * Diff the tracked-URL set against the current value and fire
   * fileUpload.onRemoveFile for any URL no longer present.
   * @private
   */
  _checkForRemovedUploads() {
    var _a;
    if (!this._uploadedFiles || this._uploadedFiles.size === 0)
      return;
    const cb = (_a = this.options.fileUpload) == null ? void 0 : _a.onRemoveFile;
    const value = this.textarea.value;
    const currentUrls = new Set(this._extractMarkdownUrls(this.textarea.value));
    const removed = [];
    for (const [url, info] of this._uploadedFiles) {
      const rawDestination = info.markdownDestination || url;
      if (!currentUrls.has(url) && !value.includes(rawDestination)) {
        removed.push({ url, info });
      }
    }
    for (const { url, info } of removed) {
      this._uploadedFiles.delete(url);
      if (cb)
        cb({ url, filename: info.filename, file: info.file });
    }
  }
  _handleFilePaste(e) {
    var _a, _b;
    if (!((_b = (_a = e == null ? void 0 : e.clipboardData) == null ? void 0 : _a.files) == null ? void 0 : _b.length))
      return;
    e.preventDefault();
    this._handleDataTransfer(e.clipboardData);
  }
  _handleFileDrop(e) {
    var _a, _b;
    if (!((_b = (_a = e == null ? void 0 : e.dataTransfer) == null ? void 0 : _a.files) == null ? void 0 : _b.length))
      return;
    e.preventDefault();
    this._handleDataTransfer(e.dataTransfer);
  }
  _handleDataTransfer(dataTransfer) {
    const files = [];
    for (const file of dataTransfer.files) {
      if (file.size > this.options.fileUpload.maxSize)
        continue;
      if (this.options.fileUpload.mimeTypes.length > 0 && !this.options.fileUpload.mimeTypes.includes(file.type))
        continue;
      const id = ++this._fileUploadCounter;
      const prefix = file.type.startsWith("image/") ? "!" : "";
      const placeholder = `${prefix}[Uploading ${file.name} (#${id})...]()`;
      this.insertAtCursor(`${placeholder}
`);
      if (this.options.fileUpload.batch) {
        files.push({ file, placeholder });
        continue;
      }
      this.options.fileUpload.onInsertFile(file).then((text) => {
        this.textarea.value = this.textarea.value.replace(placeholder, text);
        this._trackInsertedUrls(text, file);
        this.textarea.dispatchEvent(new Event("input", { bubbles: true }));
      }, (error) => {
        console.error("OverType: File upload failed", error);
        this.textarea.value = this.textarea.value.replace(placeholder, "[Upload failed]()");
        this.textarea.dispatchEvent(new Event("input", { bubbles: true }));
      });
    }
    if (this.options.fileUpload.batch && files.length > 0) {
      this.options.fileUpload.onInsertFile(files.map((f) => f.file)).then((result) => {
        const texts = Array.isArray(result) ? result : [result];
        texts.forEach((text, index) => {
          this.textarea.value = this.textarea.value.replace(files[index].placeholder, text);
          this._trackInsertedUrls(text, files[index].file);
        });
        this.textarea.dispatchEvent(new Event("input", { bubbles: true }));
      }, (error) => {
        console.error("OverType: File upload failed", error);
        files.forEach(({ placeholder }) => {
          this.textarea.value = this.textarea.value.replace(placeholder, "[Upload failed]()");
        });
        this.textarea.dispatchEvent(new Event("input", { bubbles: true }));
      });
    }
  }
  _handleDragOver(e) {
    e.preventDefault();
  }
  _destroyFileUpload() {
    this.textarea.removeEventListener("paste", this._boundHandleFilePaste);
    this.textarea.removeEventListener("drop", this._boundHandleFileDrop);
    this.textarea.removeEventListener("dragover", this._boundHandleDragOver);
    this._boundHandleFilePaste = null;
    this._boundHandleFileDrop = null;
    this._boundHandleDragOver = null;
    this._uploadedFiles = null;
    this.fileUploadInitialized = false;
  }
  insertAtCursor(text) {
    const start = this.textarea.selectionStart;
    const end = this.textarea.selectionEnd;
    let inserted = false;
    try {
      inserted = document.execCommand("insertText", false, text);
    } catch (_) {
    }
    if (!inserted) {
      const before = this.textarea.value.slice(0, start);
      const after = this.textarea.value.slice(end);
      this.textarea.value = before + text + after;
      this.textarea.setSelectionRange(start + text.length, start + text.length);
    }
    this.textarea.dispatchEvent(new Event("input", { bubbles: true }));
  }
  /**
   * Update preview with parsed markdown
   */
  updatePreview() {
    const text = this.textarea.value;
    const cursorPos = this.textarea.selectionStart;
    const activeLine = this._getCurrentLine(text, cursorPos);
    const isPreviewMode = this.container.dataset.mode === "preview";
    const html = MarkdownParser.parse(text, activeLine, this.options.showActiveLineRaw, this.options.codeHighlighter, isPreviewMode);
    this.preview.innerHTML = html;
    if (this.placeholderEl) {
      this.placeholderEl.style.display = text ? "none" : "";
    }
    this._applyCodeBlockBackgrounds();
    if (this.options.showStats && this.statsBar) {
      this._updateStats();
    }
    if (this.options.onRender) {
      this.options.onRender(this.preview, isPreviewMode ? "preview" : "normal", this);
    }
  }
  /**
   * Notify listeners that the editor value changed
   * @private
   */
  _notifyChange() {
    if (!this.initialized)
      return;
    this._checkForRemovedUploads();
    if (this.options.onChange) {
      this.options.onChange(this.textarea.value, this);
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
    this._notifyChange();
    this._scheduleSafariReflow();
  }
  /**
   * Force Safari to re-shape stale textarea text after an edit.
   * Safari can leave a textarea's glyph layout cached after incremental edits,
   * desyncing the caret/wrap from the styled preview overlay. Toggling
   * letter-spacing (with !important to beat the stylesheet rule) and reading
   * offsetHeight forces a synchronous re-shape. Safari-only, coalesced to one
   * run per animation frame.
   * @private
   */
  _scheduleSafariReflow() {
    if (!this._isSafari || this._safariReflowRaf)
      return;
    this._safariReflowRaf = requestAnimationFrame(() => {
      this._safariReflowRaf = null;
      const ta = this.textarea;
      if (!ta)
        return;
      ta.style.setProperty("letter-spacing", "-0.001px", "important");
      void ta.offsetHeight;
      ta.style.removeProperty("letter-spacing");
    });
  }
  /**
   * Handle focus events
   * @private
   */
  handleFocus(event) {
    if (this.options.onFocus) {
      this.options.onFocus(event, this);
    }
  }
  /**
   * Handle blur events
   * @private
   */
  handleBlur(event) {
    if (this.options.onBlur) {
      this.options.onBlur(event, this);
    }
  }
  /**
   * Handle keydown events
   * @private
   */
  handleKeydown(event) {
    if (event.key === "Tab") {
      const start = this.textarea.selectionStart;
      const end = this.textarea.selectionEnd;
      if (start !== end && this._canEditTextarea()) {
        event.preventDefault();
        event.shiftKey ? this.outdentSelection() : this.indentSelection();
        return;
      }
    }
    if (event.key === "Enter" && !event.shiftKey && !event.metaKey && !event.ctrlKey && this.options.smartLists) {
      if (this.handleSmartListContinuation()) {
        event.preventDefault();
        return;
      }
    }
    const handled = this.shortcuts.handleKeydown(event);
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
    if (!context || !context.inList)
      return false;
    if (context.content.trim() === "" && cursorPos >= context.markerEndPos) {
      this.deleteListMarker(context);
      return true;
    }
    if (cursorPos > context.markerEndPos && cursorPos < context.lineEnd) {
      this.splitListItem(context, cursorPos);
    } else {
      this.insertNewListItem(context);
    }
    if (context.listType === "numbered") {
      this.scheduleNumberedListUpdate();
    }
    return true;
  }
  /**
   * Delete list marker and exit list
   * @private
   */
  deleteListMarker(context) {
    this.textarea.setSelectionRange(context.lineStart, context.markerEndPos);
    document.execCommand("delete");
    this.textarea.dispatchEvent(new Event("input", { bubbles: true }));
  }
  /**
   * Insert new list item
   * @private
   */
  insertNewListItem(context) {
    const newItem = MarkdownParser.createNewListItem(context);
    document.execCommand("insertText", false, "\n" + newItem);
    this.textarea.dispatchEvent(new Event("input", { bubbles: true }));
  }
  /**
   * Split list item at cursor position
   * @private
   */
  splitListItem(context, cursorPos) {
    const textAfterCursor = context.content.substring(cursorPos - context.markerEndPos);
    this.textarea.setSelectionRange(cursorPos, context.lineEnd);
    document.execCommand("delete");
    const newItem = MarkdownParser.createNewListItem(context);
    document.execCommand("insertText", false, "\n" + newItem + textAfterCursor);
    const newCursorPos = this.textarea.selectionStart - textAfterCursor.length;
    this.textarea.setSelectionRange(newCursorPos, newCursorPos);
    this.textarea.dispatchEvent(new Event("input", { bubbles: true }));
  }
  /**
   * Schedule numbered list renumbering
   * @private
   */
  scheduleNumberedListUpdate() {
    if (this.numberUpdateTimeout) {
      clearTimeout(this.numberUpdateTimeout);
    }
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
      let offset3 = 0;
      const oldLines = value.split("\n");
      const newLines = newValue.split("\n");
      let charCount = 0;
      for (let i = 0; i < oldLines.length && charCount < cursorPos; i++) {
        if (oldLines[i] !== newLines[i]) {
          const diff = newLines[i].length - oldLines[i].length;
          if (charCount + oldLines[i].length < cursorPos) {
            offset3 += diff;
          }
        }
        charCount += oldLines[i].length + 1;
      }
      this.textarea.value = newValue;
      const newCursorPos = cursorPos + offset3;
      this.textarea.setSelectionRange(newCursorPos, newCursorPos);
      this.textarea.dispatchEvent(new Event("input", { bubbles: true }));
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
    const didChange = this.textarea.value !== value;
    this.textarea.value = value;
    this.updatePreview();
    if (this.options.autoResize) {
      this._updateAutoHeight();
    }
    if (didChange) {
      this._notifyChange();
      this._scheduleSafariReflow();
    }
  }
  /**
   * Execute an action by ID
   * Central dispatcher used by toolbar clicks, keyboard shortcuts, and programmatic calls
   * @param {string} actionId - The action identifier (e.g., 'toggleBold', 'insertLink')
   * @param {Event|null} event - Optional event that triggered the action
   * @returns {Promise<boolean>} Whether the action was executed successfully
   */
  async performAction(actionId, event = null) {
    var _a;
    const textarea = this.textarea;
    if (!textarea)
      return false;
    const action = (_a = this.actionsById) == null ? void 0 : _a[actionId];
    if (!action) {
      console.warn(`OverType: Unknown action "${actionId}"`);
      return false;
    }
    textarea.focus();
    try {
      await action({
        editor: this,
        getValue: () => this.getValue(),
        setValue: (value) => this.setValue(value),
        event
      });
      return true;
    } catch (error) {
      console.error(`OverType: Action "${actionId}" error:`, error);
      this.wrapper.dispatchEvent(new CustomEvent("button-error", {
        detail: { actionId, error }
      }));
      return false;
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
      html = html.replace(/<span class="syntax-marker[^"]*">.*?<\/span>/g, "");
      html = html.replace(/\sclass="(bullet-list|ordered-list|code-fence|hr-marker|blockquote|url-part)"/g, "");
      html = html.replace(/\sclass=""/g, "");
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
   * Indent the current line or selected lines by two spaces.
   */
  indentSelection() {
    this._replaceSelectedLines((line) => `  ${line}`);
  }
  /**
   * Outdent the current line or selected lines by up to two spaces or one tab.
   */
  outdentSelection() {
    this._replaceSelectedLines((line) => line.replace(/^( {1,2}|\t)/, ""));
  }
  /**
   * Replace full lines touched by the current selection.
   * @private
   */
  _replaceSelectedLines(transformLine) {
    if (!this._canEditTextarea())
      return false;
    const textarea = this.textarea;
    const { selectionStart, selectionEnd, value } = textarea;
    const lineStart = value.lastIndexOf("\n", selectionStart - 1) + 1;
    const effectiveEnd = this._effectiveSelectionEnd(value, selectionStart, selectionEnd);
    const lineEndOffset = value.indexOf("\n", effectiveEnd);
    const lineEnd = lineEndOffset === -1 ? value.length : lineEndOffset;
    const selectedLines = value.slice(lineStart, lineEnd);
    const replacement = selectedLines.split("\n").map(transformLine).join("\n");
    if (replacement === selectedLines)
      return false;
    textarea.setSelectionRange(lineStart, lineEnd);
    let inserted = false;
    try {
      inserted = document.execCommand("insertText", false, replacement);
    } catch (_) {
    }
    if (!inserted) {
      textarea.setRangeText(replacement, lineStart, lineEnd, "preserve");
    }
    textarea.setSelectionRange(lineStart, lineStart + replacement.length);
    textarea.dispatchEvent(new Event("input", { bubbles: true }));
    return true;
  }
  /**
   * @private
   */
  _effectiveSelectionEnd(value, selectionStart, selectionEnd) {
    if (selectionEnd > selectionStart && value[selectionEnd - 1] === "\n") {
      return selectionEnd - 1;
    }
    return selectionEnd;
  }
  /**
   * @private
   */
  _canEditTextarea() {
    return this.textarea && !this.textarea.disabled && !this.textarea.readOnly;
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
    var _a;
    const prevToolbarButtons = (_a = this.options) == null ? void 0 : _a.toolbarButtons;
    this.options = this._mergeOptions({ ...this.options, ...options });
    const toolbarNeedsRebuild = this.toolbar && this.options.toolbar && toolbarButtonsChanged(prevToolbarButtons, this.options.toolbarButtons);
    this._rebuildActionsMap();
    if (toolbarNeedsRebuild) {
      this._cleanupToolbarListeners();
      this.toolbar.destroy();
      this.toolbar = null;
      this._createToolbar();
    }
    if (this.fileUploadInitialized) {
      this._destroyFileUpload();
    }
    if (this.options.fileUpload) {
      this._initFileUpload();
    }
    this._applyOptions();
    this.updatePreview();
  }
  showToolbar() {
    if (this.toolbar) {
      this.toolbar.show();
    } else {
      this._createToolbar();
    }
  }
  hideToolbar() {
    if (this.toolbar) {
      this.toolbar.hide();
    }
  }
  /**
   * Set theme for this instance
   * @param {string|Object} theme - Theme name or custom theme object
   * @returns {this} Returns this for chaining
   */
  setTheme(theme) {
    _OverType._autoInstances.delete(this);
    this.instanceTheme = theme;
    if (theme === "auto") {
      _OverType._autoInstances.add(this);
      _OverType._startAutoListener();
      this._applyResolvedTheme(resolveAutoTheme("auto"));
    } else {
      const themeObj = typeof theme === "string" ? getTheme(theme) : theme;
      const themeName = typeof themeObj === "string" ? themeObj : themeObj.name;
      if (themeName) {
        this.container.setAttribute("data-theme", themeName);
      }
      if (themeObj && themeObj.colors) {
        const cssVars = themeToCSSVars(themeObj.colors, themeObj.previewColors);
        this.container.style.cssText += cssVars;
      }
      this.updatePreview();
    }
    _OverType._stopAutoListener();
    return this;
  }
  _applyResolvedTheme(themeName) {
    const themeObj = getTheme(themeName);
    this.container.setAttribute("data-theme", themeName);
    if (themeObj && themeObj.colors) {
      this.container.style.cssText = themeToCSSVars(themeObj.colors, themeObj.previewColors);
    }
    this.updatePreview();
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
   * Setup auto-resize functionality
   * @private
   */
  _setupAutoResize() {
    this.container.classList.add("overtype-auto-resize");
    this.previousHeight = null;
    this._updateAutoHeight();
    this.textarea.addEventListener("input", () => this._updateAutoHeight());
    window.addEventListener("resize", () => this._updateAutoHeight());
  }
  /**
   * Update height based on scrollHeight
   * @private
   */
  _updateAutoHeight() {
    if (!this.options.autoResize)
      return;
    const textarea = this.textarea;
    const preview = this.preview;
    const wrapper = this.wrapper;
    const isPreviewMode = this.container.dataset.mode === "preview";
    if (isPreviewMode) {
      wrapper.style.removeProperty("height");
      preview.style.removeProperty("height");
      preview.style.removeProperty("overflow-y");
      textarea.style.removeProperty("height");
      textarea.style.removeProperty("overflow-y");
      return;
    }
    const scrollTop = textarea.scrollTop;
    wrapper.style.setProperty("height", "auto", "important");
    textarea.style.setProperty("height", "auto", "important");
    let newHeight = textarea.scrollHeight;
    if (this.options.minHeight) {
      const minHeight = parseInt(this.options.minHeight);
      newHeight = Math.max(newHeight, minHeight);
    }
    let overflow = "hidden";
    if (this.options.maxHeight) {
      const maxHeight = parseInt(this.options.maxHeight);
      if (newHeight > maxHeight) {
        newHeight = maxHeight;
        overflow = "auto";
      }
    }
    const heightPx = newHeight + "px";
    textarea.style.setProperty("height", heightPx, "important");
    textarea.style.setProperty("overflow-y", overflow, "important");
    preview.style.setProperty("height", heightPx, "important");
    preview.style.setProperty("overflow-y", overflow, "important");
    wrapper.style.setProperty("height", heightPx, "important");
    textarea.scrollTop = scrollTop;
    preview.scrollTop = scrollTop;
    if (this.previousHeight !== newHeight) {
      this.previousHeight = newHeight;
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
      this.container.appendChild(this.statsBar);
      this._updateStats();
    } else if (show && this.statsBar) {
      this._updateStats();
    } else if (!show && this.statsBar) {
      this.statsBar.remove();
      this.statsBar = null;
    }
  }
  /**
   * Show normal edit mode (overlay with markdown preview)
   * @returns {this} Returns this for chaining
   */
  showNormalEditMode() {
    this.container.dataset.mode = "normal";
    this._syncPreviewInteractivity();
    this.updatePreview();
    this._updateAutoHeight();
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
    this.container.dataset.mode = "plain";
    this._syncPreviewInteractivity();
    this._updateAutoHeight();
    if (this.toolbar) {
      const toggleBtn = this.container.querySelector('[data-action="toggle-plain"]');
      if (toggleBtn) {
        toggleBtn.classList.remove("active");
        toggleBtn.title = "Show markdown preview";
      }
    }
    return this;
  }
  /**
   * Show preview mode (read-only view)
   * @returns {this} Returns this for chaining
   */
  showPreviewMode() {
    this.container.dataset.mode = "preview";
    this._syncPreviewInteractivity();
    this.updatePreview();
    this._updateAutoHeight();
    return this;
  }
  /**
   * Destroy the editor instance
   */
  destroy() {
    _OverType._autoInstances.delete(this);
    _OverType._stopAutoListener();
    if (this.fileUploadInitialized) {
      this._destroyFileUpload();
    }
    this.element.overTypeInstance = null;
    _OverType.instances.delete(this.element);
    if (this.shortcuts) {
      this.shortcuts.destroy();
    }
    if (this._safariReflowRaf) {
      cancelAnimationFrame(this._safariReflowRaf);
      this._safariReflowRaf = null;
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
   * Initialize editors with options from data-ot-* attributes
   * @param {string} selector - CSS selector for target elements
   * @param {Object} defaults - Default options (data attrs override these)
   * @returns {Array<OverType>} Array of OverType instances
   * @example
   * // HTML: <div class="editor" data-ot-toolbar="true" data-ot-theme="cave"></div>
   * OverType.initFromData('.editor', { fontSize: '14px' });
   */
  static initFromData(target, defaults = {}) {
    const elements = _OverType._resolveTargets(target);
    return elements.map((el) => {
      const options = { ...defaults };
      for (const attr of el.attributes) {
        if (!attr.name.startsWith("data-ot-"))
          continue;
        const kebab = attr.name.slice(8);
        if (kebab.startsWith("textarea-") && kebab !== "textarea-props") {
          const propKey = kebab.slice(9).replace(/-([a-z])/g, (_, c) => c.toUpperCase());
          options.textareaProps = { ...options.textareaProps || {}, [propKey]: _OverType._parseDataValue(attr.value) };
          continue;
        }
        const key = kebab.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
        options[key] = _OverType._parseDataValue(attr.value);
      }
      return new _OverType(el, options)[0];
    });
  }
  /**
   * Normalize various target shapes to an array of Elements
   * @private
   * @param {string|Element|NodeList|Element[]} target
   * @returns {Element[]}
   */
  static _resolveTargets(target) {
    if (target == null) {
      throw new Error("Invalid target: must be selector string, Element, NodeList, or Array");
    }
    if (typeof target === "string") {
      return Array.from(document.querySelectorAll(target));
    }
    if (target instanceof Element) {
      return [target];
    }
    if (target instanceof NodeList) {
      return Array.from(target);
    }
    if (Array.isArray(target)) {
      return target;
    }
    if (typeof target.length === "number") {
      return Array.from(target);
    }
    throw new Error("Invalid target: must be selector string, Element, NodeList, or Array");
  }
  /**
   * Parse a data attribute value to the appropriate type
   * @private
   */
  static _parseDataValue(value) {
    if (value === "true")
      return true;
    if (value === "false")
      return false;
    if (value === "null")
      return null;
    if (value !== "" && !isNaN(Number(value)))
      return Number(value);
    const trimmed = value.trim();
    if (trimmed[0] === "{" || trimmed[0] === "[") {
      try {
        return JSON.parse(trimmed);
      } catch (e) {
        return value;
      }
    }
    return value;
  }
  /**
   * Get instance from a target. Accepts the same shapes as the constructor;
   * for multi-element targets, returns the instance for the first matching
   * element, or null if none.
   * @param {string|Element|NodeList|Element[]} target
   * @returns {OverType|null}
   */
  static getInstance(target) {
    let element;
    if (target instanceof Element) {
      element = target;
    } else {
      const elements = _OverType._resolveTargets(target);
      element = elements[0];
    }
    if (!element)
      return null;
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
    _OverType._globalAutoTheme = false;
    _OverType._globalAutoCustomColors = null;
    if (theme === "auto") {
      _OverType._globalAutoTheme = true;
      _OverType._globalAutoCustomColors = customColors;
      _OverType._startAutoListener();
      _OverType._applyGlobalTheme(resolveAutoTheme("auto"), customColors);
      return;
    }
    _OverType._stopAutoListener();
    _OverType._applyGlobalTheme(theme, customColors);
  }
  static _applyGlobalTheme(theme, customColors = null) {
    let themeObj = typeof theme === "string" ? getTheme(theme) : theme;
    if (customColors) {
      themeObj = mergeTheme(themeObj, customColors);
    }
    _OverType.currentTheme = themeObj;
    _OverType.injectStyles(true);
    const themeName = typeof themeObj === "string" ? themeObj : themeObj.name;
    document.querySelectorAll(".overtype-container").forEach((container) => {
      if (themeName) {
        container.setAttribute("data-theme", themeName);
      }
    });
    document.querySelectorAll(".overtype-wrapper").forEach((wrapper) => {
      if (!wrapper.closest(".overtype-container")) {
        if (themeName) {
          wrapper.setAttribute("data-theme", themeName);
        }
      }
      const instance = wrapper._instance;
      if (instance) {
        instance.updatePreview();
      }
    });
    document.querySelectorAll("overtype-editor").forEach((webComponent) => {
      if (themeName && typeof webComponent.setAttribute === "function") {
        webComponent.setAttribute("theme", themeName);
      }
      if (typeof webComponent.refreshTheme === "function") {
        webComponent.refreshTheme();
      }
    });
  }
  static _startAutoListener() {
    if (_OverType._autoMediaQuery)
      return;
    if (!window.matchMedia)
      return;
    _OverType._autoMediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    _OverType._autoMediaListener = (e) => {
      const resolved = e.matches ? "cave" : "solar";
      if (_OverType._globalAutoTheme) {
        _OverType._applyGlobalTheme(resolved, _OverType._globalAutoCustomColors);
      }
      _OverType._autoInstances.forEach((inst) => inst._applyResolvedTheme(resolved));
    };
    _OverType._autoMediaQuery.addEventListener("change", _OverType._autoMediaListener);
  }
  static _stopAutoListener() {
    if (_OverType._autoInstances.size > 0 || _OverType._globalAutoTheme)
      return;
    if (!_OverType._autoMediaQuery)
      return;
    _OverType._autoMediaQuery.removeEventListener("change", _OverType._autoMediaListener);
    _OverType._autoMediaQuery = null;
    _OverType._autoMediaListener = null;
  }
  /**
   * Set global code highlighter for all OverType instances
   * @param {Function|null} highlighter - Function that takes (code, language) and returns highlighted HTML
   */
  static setCodeHighlighter(highlighter) {
    MarkdownParser.setCodeHighlighter(highlighter);
    document.querySelectorAll(".overtype-wrapper").forEach((wrapper) => {
      const instance = wrapper._instance;
      if (instance && instance.updatePreview) {
        instance.updatePreview();
      }
    });
    document.querySelectorAll("overtype-editor").forEach((webComponent) => {
      if (typeof webComponent.getEditor === "function") {
        const instance = webComponent.getEditor();
        if (instance && instance.updatePreview) {
          instance.updatePreview();
        }
      }
    });
  }
  /**
   * Set custom syntax processor for extending markdown parsing
   * @param {Function|null} processor - Function that takes (html) and returns modified HTML
   * @example
   * OverType.setCustomSyntax((html) => {
   *   // Highlight footnote references [^1]
   *   return html.replace(/\[\^(\w+)\]/g, '<span class="footnote-ref">$&</span>');
   * });
   */
  static setCustomSyntax(processor) {
    MarkdownParser.setCustomSyntax(processor);
    document.querySelectorAll(".overtype-wrapper").forEach((wrapper) => {
      const instance = wrapper._instance;
      if (instance && instance.updatePreview) {
        instance.updatePreview();
      }
    });
    document.querySelectorAll("overtype-editor").forEach((webComponent) => {
      if (typeof webComponent.getEditor === "function") {
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
    const globalScope = typeof window !== "undefined" ? window : globalThis;
    const globalListenersKey = "__overtypeGlobalListenersInitialized";
    if (_OverType.globalListenersInitialized || globalScope[globalListenersKey]) {
      _OverType.globalListenersInitialized = true;
      return;
    }
    globalScope[globalListenersKey] = true;
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
    document.addEventListener("focus", (e) => {
      if (e.target && e.target.classList && e.target.classList.contains("overtype-input")) {
        const wrapper = e.target.closest(".overtype-wrapper");
        const instance = wrapper == null ? void 0 : wrapper._instance;
        if (instance)
          instance.handleFocus(e);
      }
    }, true);
    document.addEventListener("blur", (e) => {
      if (e.target && e.target.classList && e.target.classList.contains("overtype-input")) {
        const wrapper = e.target.closest(".overtype-wrapper");
        const instance = wrapper == null ? void 0 : wrapper._instance;
        if (instance)
          instance.handleBlur(e);
      }
    }, true);
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
__publicField(_OverType, "_autoMediaQuery", null);
__publicField(_OverType, "_autoMediaListener", null);
__publicField(_OverType, "_autoInstances", /* @__PURE__ */ new Set());
__publicField(_OverType, "_globalAutoTheme", false);
__publicField(_OverType, "_globalAutoCustomColors", null);
var OverType = _OverType;
OverType.MarkdownParser = MarkdownParser;
OverType.ShortcutsManager = ShortcutsManager;
OverType.themes = { solar, cave: getTheme("cave") };
OverType.getTheme = getTheme;
OverType.currentTheme = solar;
var overtype_default = OverType;

// src/overtype-webcomponent.js
var CONTAINER_CLASS = "overtype-webcomponent-container";
var DEFAULT_PLACEHOLDER = "Start typing...";
var OBSERVED_ATTRIBUTES = [
  "value",
  "theme",
  "toolbar",
  "height",
  "min-height",
  "max-height",
  "placeholder",
  "font-size",
  "line-height",
  "padding",
  "auto-resize",
  "autofocus",
  "show-stats",
  "smart-lists",
  "readonly",
  "spellcheck"
];
var OverTypeEditor = class extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._editor = null;
    this._initialized = false;
    this._pendingOptions = {};
    this._styleVersion = 0;
    this._baseStyleElement = null;
    this._selectionChangeHandler = null;
    this._isConnected = false;
    this._handleChange = this._handleChange.bind(this);
    this._handleKeydown = this._handleKeydown.bind(this);
    this._handleRender = this._handleRender.bind(this);
  }
  /**
   * Decode common escape sequences from attribute string values
   * @private
   * @param {string|null|undefined} str
   * @returns {string}
   */
  _decodeValue(str) {
    if (typeof str !== "string")
      return "";
    return str.replace(/\\r/g, "\r").replace(/\\n/g, "\n").replace(/\\t/g, "	");
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
    if (oldValue === newValue)
      return;
    if (this._silentUpdate)
      return;
    if (!this._initialized) {
      this._pendingOptions[name] = newValue;
      return;
    }
    this._updateOption(name, newValue);
  }
  /**
   * Initialize the OverType editor inside shadow DOM
   * @private
   */
  _initializeEditor() {
    if (this._initialized || !this._isConnected)
      return;
    try {
      const container = document.createElement("div");
      container.className = CONTAINER_CLASS;
      const height = this.getAttribute("height");
      const minHeight = this.getAttribute("min-height");
      const maxHeight = this.getAttribute("max-height");
      if (height)
        container.style.height = height;
      if (minHeight)
        container.style.minHeight = minHeight;
      if (maxHeight)
        container.style.maxHeight = maxHeight;
      this._injectStyles();
      this.shadowRoot.appendChild(container);
      const options = this._getOptionsFromAttributes();
      const editorInstances = new overtype_default(container, options);
      this._editor = editorInstances[0];
      this._initialized = true;
      if (this._editor && this._editor.textarea) {
        this._editor.textarea.addEventListener("scroll", () => {
          if (this._editor && this._editor.preview && this._editor.textarea) {
            this._editor.preview.scrollTop = this._editor.textarea.scrollTop;
            this._editor.preview.scrollLeft = this._editor.textarea.scrollLeft;
          }
        });
        this._editor.textarea.addEventListener("input", (e) => {
          if (this._editor && this._editor.handleInput) {
            this._editor.handleInput(e);
          }
        });
        this._editor.textarea.addEventListener("keydown", (e) => {
          if (this._editor && this._editor.handleKeydown) {
            this._editor.handleKeydown(e);
          }
        });
        this._selectionChangeHandler = () => {
          if (document.activeElement === this) {
            const shadowActiveElement = this.shadowRoot.activeElement;
            if (shadowActiveElement && shadowActiveElement === this._editor.textarea) {
              if (this._editor.options.showStats && this._editor.statsBar) {
                this._editor._updateStats();
              }
              if (this._editor.linkTooltip && this._editor.linkTooltip.checkCursorPosition) {
                this._editor.linkTooltip.checkCursorPosition();
              }
            }
          }
        };
        document.addEventListener("selectionchange", this._selectionChangeHandler);
      }
      this._applyPendingOptions();
      this._dispatchEvent("ready", { editor: this._editor });
    } catch (error) {
      const message = error && error.message ? error.message : String(error);
      console.warn("OverType Web Component initialization failed:", message);
      this._dispatchEvent("error", { error: { message } });
    }
  }
  /**
   * Inject styles into shadow DOM for complete isolation
   * @private
   */
  _injectStyles() {
    const style = document.createElement("style");
    const themeAttr = this.getAttribute("theme") || "solar";
    const theme = getTheme(themeAttr);
    const options = this._getOptionsFromAttributes();
    const styles = generateStyles({ ...options, theme });
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
    const versionBanner = `
/* overtype-webcomponent styles v${this._styleVersion} */
`;
    style.textContent = versionBanner + styles + webComponentStyles;
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
      value: this.getAttribute("value") !== null ? this._decodeValue(this.getAttribute("value")) : (this.textContent || "").trim(),
      placeholder: this.getAttribute("placeholder") || DEFAULT_PLACEHOLDER,
      toolbar: this.hasAttribute("toolbar"),
      autofocus: this.hasAttribute("autofocus"),
      autoResize: this.hasAttribute("auto-resize"),
      showStats: this.hasAttribute("show-stats"),
      smartLists: !this.hasAttribute("smart-lists") || this.getAttribute("smart-lists") !== "false",
      spellcheck: this.hasAttribute("spellcheck") && this.getAttribute("spellcheck") !== "false",
      onChange: this._handleChange,
      onKeydown: this._handleKeydown,
      onRender: this._handleRender
    };
    const fontSize = this.getAttribute("font-size");
    if (fontSize)
      options.fontSize = fontSize;
    const lineHeight = this.getAttribute("line-height");
    if (lineHeight)
      options.lineHeight = parseFloat(lineHeight) || 1.6;
    const padding = this.getAttribute("padding");
    if (padding)
      options.padding = padding;
    const minHeight = this.getAttribute("min-height");
    if (minHeight)
      options.minHeight = minHeight;
    const maxHeight = this.getAttribute("max-height");
    if (maxHeight)
      options.maxHeight = maxHeight;
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
    if (!this._editor)
      return;
    switch (attribute) {
      case "value":
        {
          const decoded = this._decodeValue(value);
          if (this._editor.getValue() !== decoded) {
            this._editor.setValue(decoded || "");
          }
        }
        break;
      case "theme":
        this._reinjectStyles();
        if (this._editor && this._editor.setTheme) {
          this._editor.setTheme(value || "solar");
        }
        break;
      case "placeholder":
        if (this._editor) {
          this._editor.options.placeholder = value || "";
          if (this._editor.textarea) {
            this._editor.textarea.placeholder = value || "";
          }
          if (this._editor.placeholderEl) {
            this._editor.placeholderEl.textContent = value || "";
          }
        }
        break;
      case "readonly":
        if (this._editor.textarea) {
          this._editor.textarea.readOnly = this.hasAttribute("readonly");
        }
        break;
      case "height":
      case "min-height":
      case "max-height":
        this._updateContainerHeight();
        break;
      case "toolbar":
        if (!!this.hasAttribute("toolbar") === !!this._editor.options.toolbar)
          return;
        this._reinitializeEditor();
        break;
      case "auto-resize":
        if (!!this.hasAttribute("auto-resize") === !!this._editor.options.autoResize)
          return;
        this._reinitializeEditor();
        break;
      case "show-stats":
        if (!!this.hasAttribute("show-stats") === !!this._editor.options.showStats)
          return;
        this._reinitializeEditor();
        break;
      case "font-size": {
        if (this._updateFontSize(value)) {
          this._reinjectStyles();
        }
        break;
      }
      case "line-height": {
        if (this._updateLineHeight(value)) {
          this._reinjectStyles();
        }
        break;
      }
      case "padding":
        this._reinjectStyles();
        break;
      case "smart-lists": {
        const newSmartLists = !this.hasAttribute("smart-lists") || this.getAttribute("smart-lists") !== "false";
        if (!!this._editor.options.smartLists === !!newSmartLists)
          return;
        this._reinitializeEditor();
        break;
      }
      case "spellcheck":
        if (this._editor) {
          const enabled = this.hasAttribute("spellcheck") && this.getAttribute("spellcheck") !== "false";
          this._editor.options.spellcheck = enabled;
          if (this._editor.textarea) {
            this._editor.textarea.setAttribute("spellcheck", String(enabled));
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
    if (!container)
      return;
    const height = this.getAttribute("height");
    const minHeight = this.getAttribute("min-height");
    const maxHeight = this.getAttribute("max-height");
    container.style.height = height || "";
    container.style.minHeight = minHeight || "";
    container.style.maxHeight = maxHeight || "";
  }
  /**
   * Update font size efficiently
   * @private
   * @param {string} value - New font size value
   * @returns {boolean} True if direct update succeeded
   */
  _updateFontSize(value) {
    if (this._editor && this._editor.wrapper) {
      this._editor.options.fontSize = value || "";
      this._editor.wrapper.style.setProperty("--instance-font-size", this._editor.options.fontSize);
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
      this._editor.wrapper.style.setProperty("--instance-line-height", String(lineHeight));
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
    const currentValue = this._editor ? this._editor.getValue() : "";
    this._cleanup();
    this._initialized = false;
    this.shadowRoot.innerHTML = "";
    if (currentValue && !this.getAttribute("value")) {
      this.setAttribute("value", currentValue);
    }
    this._initializeEditor();
  }
  /**
   * Handle content changes from OverType
   * @private
   * @param {string} value - New editor value
   */
  _handleChange(value) {
    this._updateValueAttribute(value);
    if (!this._initialized || !this._editor) {
      return;
    }
    this._dispatchEvent("change", {
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
    this._dispatchEvent("keydown", {
      event,
      editor: this._editor
    });
  }
  /**
   * Handle render events from OverType
   * @private
   * @param {HTMLElement} preview - The preview DOM element
   * @param {string} mode - Current mode ('normal' or 'preview')
   */
  _handleRender(preview, mode) {
    this._dispatchEvent("render", {
      preview,
      mode,
      editor: this._editor
    });
  }
  /**
   * Update value attribute without triggering observer
   * @private
   * @param {string} value - New value
   */
  _updateValueAttribute(value) {
    const currentAttrValue = this.getAttribute("value");
    if (currentAttrValue !== value) {
      this._silentUpdate = true;
      this.setAttribute("value", value);
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
    if (this._selectionChangeHandler) {
      document.removeEventListener("selectionchange", this._selectionChangeHandler);
      this._selectionChangeHandler = null;
    }
    if (this._editor && typeof this._editor.destroy === "function") {
      this._editor.destroy();
    }
    this._editor = null;
    this._initialized = false;
    if (this.shadowRoot) {
      this.shadowRoot.innerHTML = "";
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
    return this._editor ? this._editor.getValue() : this.getAttribute("value") || "";
  }
  /**
   * Set editor value
   * @param {string} value - New markdown content
   */
  setValue(value) {
    if (this._editor) {
      this._editor.setValue(value);
    } else {
      this.setAttribute("value", value);
    }
  }
  /**
   * Get rendered HTML
   * @returns {string} Rendered HTML
   */
  getHTML() {
    return this._editor ? this._editor.getRenderedHTML(false) : "";
  }
  /**
   * Insert text at cursor position
   * @param {string} text - Text to insert
   */
  insertText(text) {
    if (!this._editor || typeof text !== "string") {
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
    if (!this._editor || !this._editor.textarea)
      return null;
    const value = this._editor.textarea.value;
    const lines = value.split("\n");
    const chars = value.length;
    const words = value.split(/\s+/).filter((w) => w.length > 0).length;
    const selectionStart = this._editor.textarea.selectionStart;
    const beforeCursor = value.substring(0, selectionStart);
    const linesBefore = beforeCursor.split("\n");
    const currentLine = linesBefore.length;
    const currentColumn = linesBefore[linesBefore.length - 1].length + 1;
    return {
      characters: chars,
      words,
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
  showToolbar() {
    if (this._editor) {
      this._editor.showToolbar();
    }
  }
  hideToolbar() {
    if (this._editor) {
      this._editor.hideToolbar();
    }
  }
};
if (!customElements.get("overtype-editor")) {
  customElements.define("overtype-editor", OverTypeEditor);
}
var overtype_webcomponent_default = OverTypeEditor;
export {
  overtype_webcomponent_default as default
};
/**
 * OverType - A lightweight markdown editor library with perfect WYSIWYG alignment
 * @version 1.0.0
 * @license MIT
 */
/**
 * OverType Web Component
 * A custom element wrapper for the OverType markdown editor with Shadow DOM isolation
 * @version 1.0.0
 * @license MIT
 */
//# sourceMappingURL=overtype-webcomponent.esm.js.map
