const ESCAPABLE = /[!"#$%&'()*+,\-./:;<=>?@[\\\]^_`{|}~]/;
const ENTITY = /^&(?:amp|lt|gt|quot|#39);/;
const DECODED_ENTITY = {
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&#39;': "'"
};

function makeReader(text, htmlEntities) {
  return function at(index) {
    if (index >= text.length) return [null, 0];

    if (htmlEntities && text.charCodeAt(index) === 38) {
      const match = ENTITY.exec(text.slice(index, index + 6));
      if (match) return [DECODED_ENTITY[match[0]], match[0].length];
    }

    return [text[index], 1];
  };
}

function isEscaped(text, index) {
  let slashes = 0;
  while (index > 0 && text[--index] === '\\') slashes++;
  return slashes % 2 === 1;
}

const isSpace = character => character === ' ' || character === '\t';
const isControl = character => character !== null &&
  (character.charCodeAt(0) < 0x20 || character.charCodeAt(0) === 0x7f);

function scanTail(text, index, at, maxParenDepth) {
  let [character, length] = at(index);
  if (character !== '(') return null;
  index += length;

  while (isSpace((character = at(index)[0]))) index += at(index)[1];

  let destination = null;
  [character, length] = at(index);

  if (character === '<') {
    const start = index;
    let value = '';
    index += length;

    for (;;) {
      [character, length] = at(index);
      if (character === null || character === '<' || character === '\n') return null;

      if (character === '\\') {
        const [next, nextLength] = at(index + length);
        if (next !== null && ESCAPABLE.test(next)) {
          value += next;
          index += length + nextLength;
          continue;
        }
      }

      if (character === '>') {
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
  } else if (character !== ')') {
    const start = index;
    let depth = 0;
    let value = '';

    for (;;) {
      [character, length] = at(index);
      if (character === null || character === '\n' || isSpace(character)) break;
      if (isControl(character)) return null;

      if (character === '\\') {
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

      if (character === '(') {
        depth++;
        if (depth > maxParenDepth) return null;
        value += character;
        index += length;
        continue;
      }

      if (character === ')') {
        if (depth === 0) break;
        depth--;
        value += character;
        index += length;
        continue;
      }

      value += character;
      index += length;
    }

    if (depth !== 0) return null;
    destination = {
      start,
      end: index,
      raw: text.slice(start, index),
      value
    };
  }

  const afterDestination = index;
  while (isSpace((character = at(index)[0]))) index += at(index)[1];

  let title = null;
  [character, length] = at(index);

  if (character === '"' || character === "'" || character === '(') {
    if (destination && index === afterDestination) return null;

    const close = character === '(' ? ')' : character;
    const start = index;
    let value = '';
    index += length;

    for (;;) {
      [character, length] = at(index);
      if (character === null || character === '\n') return null;

      if (character === '\\') {
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

      if (close === ')' && character === '(') return null;
      value += character;
      index += length;
    }

    title = {
      start,
      end: index,
      raw: text.slice(start, index),
      value,
      delimiter: close === ')' ? '(' : close
    };

    while (isSpace((character = at(index)[0]))) index += at(index)[1];
  }

  [character, length] = at(index);
  if (character !== ')') return null;

  return { end: index + length, destination, title };
}

function rangeAt(ranges, index, rangeIndex) {
  while (rangeIndex < ranges.length && ranges[rangeIndex].end <= index) rangeIndex++;
  const range = ranges[rangeIndex];
  return {
    range: range && range.start <= index && index < range.end ? range : null,
    rangeIndex
  };
}

export function findLinks(text, {
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

    if (character === '\\') {
      const [next, nextLength] = at(index + length);
      index += next !== null && ESCAPABLE.test(next) ? length + nextLength : length;
      continue;
    }

    if (character === '\n') {
      openers.length = 0;
      index += length;
      continue;
    }

    if (character === '[') {
      const imageMarker = index > 0 && text[index - 1] === '!' && !isEscaped(text, index - 1);
      openers.push({ index, image: imageMarker });
      index += length;
      continue;
    }

    if (character === ']') {
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

export function findCodeSpans(text, excludedRanges = []) {
  const runs = [];
  const spans = [];
  let index = 0;

  while (index < text.length) {
    if (text[index] !== '`') {
      index++;
      continue;
    }

    const start = index;
    while (text[index] === '`') index++;
    runs.push({ start, end: index, length: index - start });
  }

  const nextRun = new Array(runs.length);
  const lastRunByLength = new Map();
  for (let runIndex = runs.length - 1; runIndex >= 0; runIndex--) {
    const run = runs[runIndex];
    nextRun[runIndex] = lastRunByLength.get(run.length);
    lastRunByLength.set(run.length, runIndex);
  }

  for (let runIndex = 0; runIndex < runs.length;) {
    const open = runs[runIndex];
    const excluded = isEscaped(text, open.start) ||
      excludedRanges.some(range => open.start >= range.start && open.start < range.end);
    const closeIndex = nextRun[runIndex];

    if (excluded || closeIndex === undefined) {
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

function shiftLink(link, offset) {
  return {
    ...link,
    start: link.start + offset,
    end: link.end + offset,
    text: {
      ...link.text,
      start: link.text.start + offset,
      end: link.text.end + offset
    },
    destination: link.destination && {
      ...link.destination,
      start: link.destination.start + offset,
      end: link.destination.end + offset
    },
    title: link.title && {
      ...link.title,
      start: link.title.start + offset,
      end: link.title.end + offset
    }
  };
}

function findRenderableLineLinks(text, options) {
  if (!text.includes('[')) return [];

  let links = findLinks(text, options);
  const seen = new Set();

  for (;;) {
    const signature = links.map(link => `${link.start}:${link.end}`).join(',');
    if (seen.has(signature)) return links;
    seen.add(signature);

    const targetRanges = links.map(link => ({
      start: link.text.end,
      end: link.end
    }));
    const codeRanges = findCodeSpans(text, targetRanges);
    const next = findLinks(text, { ...options, ignoreRanges: codeRanges });
    const nextSignature = next.map(link => `${link.start}:${link.end}`).join(',');
    if (nextSignature === signature) return next;
    links = next;
  }
}

export function findRenderableLinks(text, options = {}) {
  const links = [];
  const lines = text.split('\n');
  let inCodeBlock = false;
  let offset = 0;

  for (const line of lines) {
    if (/^```[^`]*$/.test(line)) {
      inCodeBlock = !inCodeBlock;
    } else if (!inCodeBlock) {
      links.push(...findRenderableLineLinks(line, options).map(link => shiftLink(link, offset)));
    }

    offset += line.length + 1;
  }

  return links;
}
