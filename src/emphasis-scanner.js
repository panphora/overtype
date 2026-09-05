const DECODED_ENTITY = {
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&#39;': "'"
};

const ENTITY = /^&(amp|lt|gt|quot|#39);/;
const ASCII_PUNCTUATION = /^[!"#$%&'()*+,\-./:;<=>?@[\]\\^_`{|}~]$/;
const BMP_PUNCTUATION = /^[\u00a1-\u00a9\u00ab-\u00ac\u00ae-\u00b1\u00b4\u00b6-\u00b8\u00bb\u00bf\u00d7\u00f7\u02c2-\u02c5\u02d2-\u02df\u02e5-\u02eb\u02ed\u02ef-\u02ff\u0375\u037e\u0384-\u0385\u0387\u03f6\u0482\u055a-\u055f\u0589-\u058a\u058d-\u058f\u05be\u05c0\u05c3\u05c6\u05f3-\u05f4\u0606-\u060f\u061b\u061d-\u061f\u066a-\u066d\u06d4\u06de\u06e9\u06fd-\u06fe\u0700-\u070d\u07f6-\u07f9\u07fe-\u07ff\u0830-\u083e\u085e\u0888\u0964-\u0965\u0970\u09f2-\u09f3\u09fa-\u09fb\u09fd\u0a76\u0af0-\u0af1\u0b70\u0bf3-\u0bfa\u0c77\u0c7f\u0c84\u0d4f\u0d79\u0df4\u0e3f\u0e4f\u0e5a-\u0e5b\u0f01-\u0f17\u0f1a-\u0f1f\u0f34\u0f36\u0f38\u0f3a-\u0f3d\u0f85\u0fbe-\u0fc5\u0fc7-\u0fcc\u0fce-\u0fda\u104a-\u104f\u109e-\u109f\u10fb\u1360-\u1368\u1390-\u1399\u1400\u166d-\u166e\u169b-\u169c\u16eb-\u16ed\u1735-\u1736\u17d4-\u17d6\u17d8-\u17db\u1800-\u180a\u1940\u1944-\u1945\u19de-\u19ff\u1a1e-\u1a1f\u1aa0-\u1aa6\u1aa8-\u1aad\u1b4e-\u1b4f\u1b5a-\u1b6a\u1b74-\u1b7f\u1bfc-\u1bff\u1c3b-\u1c3f\u1c7e-\u1c7f\u1cc0-\u1cc7\u1cd3\u1fbd\u1fbf-\u1fc1\u1fcd-\u1fcf\u1fdd-\u1fdf\u1fed-\u1fef\u1ffd-\u1ffe\u2010-\u2027\u2030-\u205e\u207a-\u207e\u208a-\u208e\u20a0-\u20c0\u2100-\u2101\u2103-\u2106\u2108-\u2109\u2114\u2116-\u2118\u211e-\u2123\u2125\u2127\u2129\u212e\u213a-\u213b\u2140-\u2144\u214a-\u214d\u214f\u218a-\u218b\u2190-\u2429\u2440-\u244a\u249c-\u24e9\u2500-\u2775\u2794-\u2b73\u2b76-\u2b95\u2b97-\u2bff\u2ce5-\u2cea\u2cf9-\u2cfc\u2cfe-\u2cff\u2d70\u2e00-\u2e2e\u2e30-\u2e5d\u2e80-\u2e99\u2e9b-\u2ef3\u2f00-\u2fd5\u2ff0-\u2fff\u3001-\u3004\u3008-\u3020\u3030\u3036-\u3037\u303d-\u303f\u309b-\u309c\u30a0\u30fb\u3190-\u3191\u3196-\u319f\u31c0-\u31e5\u31ef\u3200-\u321e\u322a-\u3247\u3250\u3260-\u327f\u328a-\u32b0\u32c0-\u33ff\u4dc0-\u4dff\ua490-\ua4c6\ua4fe-\ua4ff\ua60d-\ua60f\ua673\ua67e\ua6f2-\ua6f7\ua700-\ua716\ua720-\ua721\ua789-\ua78a\ua828-\ua82b\ua836-\ua839\ua874-\ua877\ua8ce-\ua8cf\ua8f8-\ua8fa\ua8fc\ua92e-\ua92f\ua95f\ua9c1-\ua9cd\ua9de-\ua9df\uaa5c-\uaa5f\uaa77-\uaa79\uaade-\uaadf\uaaf0-\uaaf1\uab5b\uab6a-\uab6b\uabeb\ufb29\ufbb2-\ufbc2\ufd3e-\ufd4f\ufdcf\ufdfc-\ufdff\ufe10-\ufe19\ufe30-\ufe52\ufe54-\ufe66\ufe68-\ufe6b\uff01-\uff0f\uff1a-\uff20\uff3b-\uff40\uff5b-\uff65\uffe0-\uffe6\uffe8-\uffee\ufffc-\ufffd]$/;
const PLACEHOLDER = /^\uE000\d+\uE001/;

function createUnicodePunctuationPattern() {
  try {
    return new RegExp('^[\\p{P}\\p{S}]$', 'u');
  } catch {
    return BMP_PUNCTUATION;
  }
}

const UNICODE_PUNCTUATION = createUnicodePunctuationPattern();

function isPunctuation(character) {
  return character !== null &&
    (ASCII_PUNCTUATION.test(character) || UNICODE_PUNCTUATION.test(character));
}

function characterAt(text, index, htmlEntities) {
  if (index >= text.length) return [null, 0];

  if (text[index] === '\uE000') {
    const placeholder = PLACEHOLDER.exec(text.slice(index));
    if (placeholder) return ['`', placeholder[0].length];
  }

  if (htmlEntities && text[index] === '&') {
    const match = ENTITY.exec(text.slice(index, index + 6));
    if (match) return [DECODED_ENTITY[match[0]], match[0].length];
  }

  const character = String.fromCodePoint(text.codePointAt(index));
  return [character, character.length];
}

function isEscaped(text, index) {
  let slashes = 0;
  while (index > 0 && text[--index] === '\\') slashes++;
  return slashes % 2 === 1;
}

function skipHtmlTag(text, index) {
  if (text[index] !== '<') return index;
  const end = text.indexOf('>', index + 1);
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
  return '\n';
}

function delimiterFlags(marker, before, after) {
  const beforeWhitespace = /\s/u.test(before);
  const afterWhitespace = /\s/u.test(after);
  const beforePunctuation = isPunctuation(before);
  const afterPunctuation = isPunctuation(after);
  const leftFlanking = !afterWhitespace && (!afterPunctuation || beforeWhitespace || beforePunctuation);
  const rightFlanking = !beforeWhitespace && (!beforePunctuation || afterWhitespace || afterPunctuation);

  if (marker === '_') {
    return {
      canOpen: leftFlanking && (!rightFlanking || beforePunctuation),
      canClose: rightFlanking && (!leftFlanking || afterPunctuation)
    };
  }

  return { canOpen: leftFlanking, canClose: rightFlanking };
}

function scanDelimiters(text, htmlEntities) {
  const delimiters = [];
  let previousCharacter = '\n';
  let index = 0;

  while (index < text.length) {
    const afterTag = skipHtmlTag(text, index);
    if (afterTag !== index) {
      index = afterTag;
      continue;
    }

    const [character, length] = characterAt(text, index, htmlEntities);
    if ((character === '*' || character === '_') && !isEscaped(text, index)) {
      const start = index;
      let count = 0;

      while (text[index] === character && !isEscaped(text, index)) {
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
      if (delimiter.previous) delimiter.previous.next = delimiter;
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
  if (delimiter.previous) delimiter.previous.next = delimiter.next;
  else state.head = delimiter.next;
  if (delimiter.next) delimiter.next.previous = delimiter.previous;
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

export function findEmphasis(text, { htmlEntities = false } = {}) {
  const delimiters = scanDelimiters(text, htmlEntities);
  const state = { head: delimiters[0] ?? null };
  const matches = [];
  let closer = state.head;

  while (closer) {
    if (!closer.canClose) {
      closer = closer.next;
      continue;
    }

    let opener = closer.previous;
    while (opener) {
      const oddMatch = (closer.canOpen || opener.canClose) &&
        (opener.original % 3 !== 0 || closer.original % 3 !== 0) &&
        (opener.original + closer.original) % 3 === 0;
      if (opener.marker === closer.marker && opener.canOpen && !oddMatch) break;
      opener = opener.previous;
    }

    if (!opener) {
      const next = closer.next;
      if (!closer.canOpen) removeDelimiter(state, closer);
      closer = next;
      continue;
    }

    const use = opener.remaining >= 2 && closer.remaining >= 2 ? 2 : 1;
    const openStart = opener.start + opener.original - opener.usedAsOpener - use;
    const closeStart = closer.start + closer.usedAsCloser;
    matches.push({
      type: use === 2 ? 'strong' : 'em',
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
    if (opener.remaining === 0) removeDelimiter(state, opener);
    if (closer.remaining === 0) {
      removeDelimiter(state, closer);
      closer = next;
    }
  }

  return matches.sort((a, b) => a.openStart - b.openStart || b.closeEnd - a.closeEnd);
}

export function renderEmphasis(text, options = {}) {
  const { includeEm = true, includeStrong = true } = options;
  const matches = findEmphasis(text, options).filter(match =>
    match.type === 'em' ? includeEm : includeStrong
  );
  if (matches.length === 0) return text;

  const boundaries = new Map();
  const at = position => {
    if (!boundaries.has(position)) {
      boundaries.set(position, { openEnd: [], closeEnd: [], openStart: [], closeStart: [] });
    }
    return boundaries.get(position);
  };

  for (const match of matches) {
    const tag = match.type;
    at(match.openStart).openStart.push(`<${tag}><span class="syntax-marker">`);
    at(match.openEnd).openEnd.push('</span>');
    at(match.closeStart).closeStart.push('<span class="syntax-marker">');
    at(match.closeEnd).closeEnd.push(`</span></${tag}>`);
  }

  let result = '';
  let previous = 0;
  for (const position of [...boundaries.keys()].sort((a, b) => a - b)) {
    result += text.slice(previous, position);
    const events = boundaries.get(position);
    result += events.openEnd.join('');
    result += events.closeEnd.join('');
    result += events.openStart.join('');
    result += events.closeStart.join('');
    previous = position;
  }
  return result + text.slice(previous);
}
