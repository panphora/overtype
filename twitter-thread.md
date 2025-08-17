# Twitter Thread: OverType Launch

I got so frustrated with WYSIWYG editors that I built my own.

The twist? It's just a textarea.

OverType: A transparent <textarea> layered over rendered markdown. You type plain text, but see rich formatting.

45KB total. No virtual DOM. No magic.

🧵 1/9

---

The problem: I needed to add editors to dozens of places on the same page. Initializing a 500KB editor library each time? No thanks.

Plain markdown in a <textarea> works great for devs, but clients hate looking at raw markdown syntax.

🧵 2/9

---

After years fighting ContentEditable, I had a dumb idea:

What if we just... put a transparent textarea on top of a rendered preview?

If they're perfectly aligned, you'd be typing plain text but *seeing* formatted text.

🧵 3/9

---

Version 1 failed spectacularly. Turns out perfect alignment is HARD:

• Bullet points throw off character counts
• "Monospace" fonts sometimes aren't truly monospace for bold/italic
• Page CSS can shift alignment by 1px and ruin everything

🧵 4/9

---

The solution? Obsessive normalization.

Replace bullets with HTML entities (•). Override EVERY piece of CSS that could affect spacing. Test on every browser, every font, every zoom level.

It's tedious. But once it works, it REALLY works.

🧵 5/9

---

Here's the entire trick in 10 lines:

```javascript
// Make textarea invisible but keep cursor
textarea.style.background = 'transparent'
textarea.style.color = 'transparent'
textarea.style.caretColor = 'black'

// Sync with preview
textarea.oninput = () => {
  preview.innerHTML = parseMarkdown(textarea.value)
}
```

🧵 6/9

---

Because it's a real textarea, you get everything for free:

✓ Undo/redo
✓ Mobile keyboards
✓ Spell check
✓ Browser autofill
✓ Native performance
✓ Accessibility

No reimplementing browser features. No virtual DOM. Just... a textarea.

🧵 7/9

---

The constraints:
- Monospace font only
- Same font size everywhere
- Markdown syntax stays visible

But for a 45KB editor that just works? I'll take those tradeoffs any day.

🧵 8/9

---

OverType is now live and open source.

Try it: https://overtype.dev
GitHub: https://github.com/panphora/overtype

Sometimes the dumbest ideas are the best ones. 🤷‍♂️

🧵 9/9