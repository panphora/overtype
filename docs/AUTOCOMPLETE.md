# Autocomplete / Mention Popups (Recipe)

OverType does not ship an autocomplete engine. Trigger detection, suggestion
sources, filtering, list keyboard navigation, mobile autocorrect interplay, and
ARIA combobox semantics are a lot of permanent surface for a library whose whole
point is staying small and readable. See
[issue #96](https://github.com/panphora/overtype/issues/96) and
[WONT-DO.md](../WONT-DO.md).

You don't need core support to build it. OverType exposes everything a host app
needs: `editor.textarea` (the real `<textarea>`), `editor.container`, the
`onChange` option, and `getValue()` / `setValue()`. This recipe builds
GitHub-style `@mention` popups on top of that public surface, with zero changes
to OverType.

## What you get

- Type a trigger character (`@`) followed by letters to open a popup.
- The list filters as you type.
- `↑` / `↓` move the selection, `Enter` or `Tab` insert it, `Esc` dismisses.
- Insertion goes through `execCommand('insertText')`, so it stays on the native
  undo stack (`Ctrl/Cmd+Z` works).

## How it works

Three pieces:

1. **Detect the token.** On every `input`, read the text before the caret and
   match the trigger plus the word after it. No match means no popup.
2. **Position the popup at the caret.** A textarea has no caret rectangle API, so
   a small mirror-`div` helper measures where the caret sits and the popup is
   placed just below it.
3. **Own the keyboard while the popup is open.** OverType delegates its keydown
   handler on `document` (bubble phase), so a listener on the textarea always
   runs first. Calling `stopPropagation()` for `Enter` / `Tab` keeps OverType
   from treating them as smart-list / indent commands while a suggestion is
   highlighted.

## Full recipe

Drop this in after you create the editor. It depends only on the public API.

```js
function attachAutocomplete(editor, { trigger = '@', items = [], onQuery } = {}) {
  const textarea = editor.textarea;
  const menu = document.createElement('ul');
  menu.className = 'ac-menu';
  menu.setAttribute('role', 'listbox');
  menu.hidden = true;
  document.body.appendChild(menu);

  let matches = [];
  let active = 0;
  let tokenStart = -1;

  const triggerRe = new RegExp(
    '(?:^|\\s)' + trigger.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '(\\w*)$'
  );

  function currentToken() {
    const upto = textarea.value.slice(0, textarea.selectionStart);
    const m = upto.match(triggerRe);
    if (!m) return null;
    return { query: m[1], start: textarea.selectionStart - m[1].length - trigger.length };
  }

  function close() {
    menu.hidden = true;
    matches = [];
    tokenStart = -1;
  }

  function render() {
    menu.innerHTML = '';
    matches.forEach((label, i) => {
      const li = document.createElement('li');
      li.textContent = label;
      li.setAttribute('role', 'option');
      li.setAttribute('aria-selected', String(i === active));
      li.addEventListener('mousedown', (e) => { e.preventDefault(); choose(i); });
      menu.appendChild(li);
    });
    menu.hidden = false;
    position();
  }

  function position() {
    const coords = caretCoordinates(textarea, textarea.selectionStart);
    const rect = textarea.getBoundingClientRect();
    menu.style.left = (rect.left + coords.left - textarea.scrollLeft) + 'px';
    menu.style.top = (rect.top + coords.top - textarea.scrollTop + coords.height) + 'px';
  }

  function choose(i) {
    if (i < 0 || i >= matches.length) return;
    const replacement = trigger + matches[i] + ' ';
    textarea.focus();
    textarea.setSelectionRange(tokenStart, textarea.selectionStart);
    // execCommand keeps the insertion on the native undo stack.
    if (!document.execCommand('insertText', false, replacement)) {
      textarea.setRangeText(replacement, tokenStart, textarea.selectionStart, 'end');
      textarea.dispatchEvent(new Event('input', { bubbles: true }));
    }
    close();
  }

  function update() {
    const token = currentToken();
    if (!token) return close();
    const q = token.query.toLowerCase();
    matches = (onQuery
      ? onQuery(token.query)
      : items.filter(it => it.toLowerCase().startsWith(q))
    ).slice(0, 8);
    if (!matches.length) return close();
    tokenStart = token.start;
    active = 0;
    render();
  }

  textarea.addEventListener('input', update);
  textarea.addEventListener('blur', () => setTimeout(close, 100));
  textarea.addEventListener('scroll', () => { if (!menu.hidden) position(); });

  // OverType delegates keydown on `document` (bubble phase), so a listener on
  // the textarea always runs first; stopPropagation() then blocks OverType's
  // Tab/Enter handling when the menu is open.
  textarea.addEventListener('keydown', (e) => {
    if (menu.hidden) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); active = (active + 1) % matches.length; render(); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); active = (active - 1 + matches.length) % matches.length; render(); }
    else if (e.key === 'Enter' || e.key === 'Tab') { e.preventDefault(); e.stopPropagation(); choose(active); }
    else if (e.key === 'Escape') { e.preventDefault(); close(); }
  });

  return { destroy() { close(); menu.remove(); } };
}

// Minimal textarea caret-coordinates helper (mirror-div technique).
function caretCoordinates(textarea, position) {
  const div = document.createElement('div');
  const style = getComputedStyle(textarea);
  const props = ['boxSizing','width','height','overflowX','overflowY','borderTopWidth','borderRightWidth','borderBottomWidth','borderLeftWidth','paddingTop','paddingRight','paddingBottom','paddingLeft','fontStyle','fontVariant','fontWeight','fontStretch','fontSize','fontSizeAdjust','lineHeight','fontFamily','textAlign','textTransform','textIndent','textDecoration','letterSpacing','wordSpacing','tabSize','whiteSpace','wordWrap'];
  div.style.position = 'absolute';
  div.style.visibility = 'hidden';
  div.style.whiteSpace = 'pre-wrap';
  div.style.wordWrap = 'break-word';
  props.forEach(p => { div.style[p] = style[p]; });
  div.textContent = textarea.value.slice(0, position);
  const span = document.createElement('span');
  span.textContent = textarea.value.slice(position) || '.';
  div.appendChild(span);
  document.body.appendChild(div);
  const coords = {
    top: span.offsetTop + parseInt(style.borderTopWidth),
    left: span.offsetLeft + parseInt(style.borderLeftWidth),
    height: parseInt(style.lineHeight)
  };
  document.body.removeChild(div);
  return coords;
}
```

Minimal styling for the popup:

```css
.ac-menu {
  position: fixed; z-index: 1000; min-width: 160px; max-height: 200px;
  overflow-y: auto; background: #fff; border: 1px solid #d0d7de;
  border-radius: 6px; box-shadow: 0 8px 24px rgba(0,0,0,.12);
  padding: 4px; margin: 0; list-style: none;
}
.ac-menu li { padding: 4px 8px; border-radius: 4px; cursor: pointer; }
.ac-menu li[aria-selected="true"] { background: #0969da; color: #fff; }
```

Wire it up:

```js
const [editor] = OverType.init('#editor');

const ac = attachAutocomplete(editor, {
  trigger: '@',
  items: ['alice', 'bob', 'carol', 'dave']
});

// later, if you tear the editor down:
// ac.destroy();
// editor.destroy();
```

## Customizing

- **Different trigger.** Pass `trigger: '#'` (or any single character) for issue
  pickers, emoji, slash-commands, etc. Run `attachAutocomplete` once per trigger.
- **Async / remote sources.** Give `onQuery` a function that returns an array of
  labels. To fetch, keep a local cache and call `update()`-equivalent again when
  results arrive; guard against out-of-order responses by ignoring a result whose
  query no longer matches the current token.
- **Insert something other than the label.** Change the `replacement` string in
  `choose()` (for example `` `[@${matches[i]}](/u/${ids[i]})` ``).

## Caveats

- **Mobile.** On-screen keyboards fire `input` differently and the native
  suggestion bar can compete with the popup. Test on real devices; consider
  disabling the popup below a width breakpoint.
- **Accessibility.** This is a minimal `listbox`. For production, wire full ARIA
  combobox semantics (`aria-expanded`, `aria-activedescendant`, `aria-controls`)
  between the textarea and the menu.
- **Undo.** Insertion uses `execCommand('insertText')` specifically so the change
  lands on the textarea's native undo stack. The `setRangeText` fallback (for the
  rare environment without `execCommand`) does not preserve undo.
