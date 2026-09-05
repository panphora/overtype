import { JSDOM } from 'jsdom';

const dom = new JSDOM('<!doctype html><body></body>');

export const document = dom.window.document;

export function rootFromHtml(html) {
  const root = document.createElement('div');
  root.innerHTML = html;
  return root;
}

export function textWithoutMarkers(element) {
  const clone = element.cloneNode(true);
  for (const marker of clone.querySelectorAll('.syntax-marker')) marker.remove();
  return clone.textContent;
}

export function visibleLineText(html, sourceLine) {
  let text = rootFromHtml(html).textContent;
  if (sourceLine === '' && text === '\u00a0') return '';

  const leadingSpaces = sourceLine.match(/^ */)[0].length;
  for (let index = 0; index < leadingSpaces && text[index] === '\u00a0'; index++) {
    text = text.slice(0, index) + ' ' + text.slice(index + 1);
  }

  return text;
}

export function extractVisualLines(html) {
  const root = rootFromHtml(html);
  const lines = [];
  const blockTags = new Set(['DIV', 'P', 'H1', 'H2', 'H3', 'UL', 'OL', 'LI']);

  function processNode(node) {
    if (node.nodeType === 3) {
      if (lines.length === 0) lines.push('');
      lines[lines.length - 1] += node.textContent;
      return;
    }

    if (node.nodeType !== 1) return;

    if (node.tagName === 'PRE') {
      const preLines = node.textContent.split('\n');
      if (preLines.length === 1 && preLines[0] === '') return;
      if (lines.length > 0 && lines[lines.length - 1] !== '') lines.push('');

      for (let index = 0; index < preLines.length; index++) {
        if (index === 0 && lines.length > 0) lines[lines.length - 1] += preLines[index];
        else lines.push(preLines[index]);
      }

      lines.push('');
      return;
    }

    const isBlock = blockTags.has(node.tagName);
    if (isBlock && lines.length > 0 && lines[lines.length - 1] !== '') lines.push('');

    for (const child of node.childNodes) processNode(child);

    if (isBlock && lines.at(-1) !== '') lines.push('');
  }

  processNode(root);
  while (lines.length > 0 && lines.at(-1) === '') lines.pop();
  return lines;
}
