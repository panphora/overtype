export function scanAtxHeading(line) {
  const match = /^( {0,3})(#{1,6})(?:([\t ]+)(.*)|$)/.exec(line);
  if (!match || match[2].length > 3) return null;

  const indent = match[1];
  const marker = match[2];
  const separator = match[3] ?? '';
  const body = match[4] ?? '';
  const onlyClosingMarker = /^(#+)[\t ]*$/.exec(body);
  const closingMatch = /([\t ]+)(#+)([\t ]*)$/.exec(body);
  const hasClosingMarker = onlyClosingMarker || closingMatch;

  return {
    type: 'heading',
    level: marker.length,
    indent,
    marker,
    separator,
    content: onlyClosingMarker ? '' : hasClosingMarker ? body.slice(0, closingMatch.index) : body,
    closing: onlyClosingMarker ? body : hasClosingMarker ? closingMatch[0] : ''
  };
}

export function scanThematicBreak(line) {
  const match = /^( {0,3})([*_-])([\t *_-]*)$/.exec(line);
  if (!match) return null;

  const marker = match[2];
  const rest = match[3];
  if ([...rest].some(character => character !== marker && character !== ' ' && character !== '\t')) {
    return null;
  }

  const markerCount = 1 + [...rest].filter(character => character === marker).length;
  if (markerCount < 3) return null;

  return { type: 'thematic-break', marker, source: line };
}

export function scanBlockquote(line) {
  const match = /^( {0,3})>([\t ]?)(.*)$/.exec(line);
  if (!match || (match[2] === '' && match[3].startsWith('>'))) return null;

  return {
    type: 'blockquote',
    indent: match[1],
    marker: '>',
    separator: match[2],
    content: match[3]
  };
}

export function scanListItem(line) {
  const bullet = /^( *)([-*+])([\t ]+)(.*)$/.exec(line);
  if (bullet) {
    return {
      type: 'list-item',
      listType: 'bullet',
      indent: bullet[1],
      marker: bullet[2],
      separator: bullet[3],
      content: bullet[4]
    };
  }

  const emptyBullet = /^( *)([-*+])$/.exec(line);
  if (emptyBullet) {
    return {
      type: 'list-item',
      listType: 'bullet',
      indent: emptyBullet[1],
      marker: emptyBullet[2],
      separator: '',
      content: ''
    };
  }

  const ordered = /^( *)(\d{1,9}\.)([\t ]+)(.*)$/.exec(line);
  if (ordered) {
    return {
      type: 'list-item',
      listType: 'ordered',
      indent: ordered[1],
      marker: ordered[2],
      separator: ordered[3],
      content: ordered[4]
    };
  }

  const emptyOrdered = /^( *)(\d{1,9}\.)$/.exec(line);
  if (emptyOrdered) {
    return {
      type: 'list-item',
      listType: 'ordered',
      indent: emptyOrdered[1],
      marker: emptyOrdered[2],
      separator: '',
      content: ''
    };
  }

  return null;
}

export function scanFenceOpen(line) {
  const match = /^( {0,3})(`{3,})([^`]*)$/.exec(line);
  if (!match) return null;

  return {
    type: 'fence-open',
    indent: match[1],
    marker: match[2],
    length: match[2].length,
    info: match[3].trim(),
    source: line
  };
}

export function scanFenceClose(line, opening) {
  const match = /^( {0,3})(`{3,})[\t ]*$/.exec(line);
  if (!match || match[2].length < opening.length) return null;

  return {
    type: 'fence-close',
    indent: match[1],
    marker: match[2],
    length: match[2].length,
    source: line
  };
}

export function scanFencedBlocks(markdown) {
  const lines = markdown.split('\n');
  const blocks = [];
  let opening = null;
  let content = [];

  for (let index = 0; index < lines.length; index++) {
    const line = lines[index];
    if (!opening) {
      const candidate = scanFenceOpen(line);
      if (candidate) {
        opening = { ...candidate, line: index };
        content = [];
      }
      continue;
    }

    const closing = scanFenceClose(line, opening);
    if (closing) {
      blocks.push({
        opening,
        closing: { ...closing, line: index },
        content,
        closed: true
      });
      opening = null;
      content = [];
      continue;
    }

    content.push(line);
  }

  if (opening) {
    blocks.push({ opening, closing: null, content, closed: false });
  }

  return blocks;
}
