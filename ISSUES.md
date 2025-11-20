# Open Issues

## Issue #75: Only the default event handling of Tab should prevented Shift-Tab not

**Author:** kozi
**Created:** 2025-11-13T07:18:09Z
**URL:** https://github.com/panphora/overtype/issues/75
**Labels:** None

### Description

Only the default event handling of Tab should prevented <kbd>Shift</kbd>+<kbd>Tab</kbd> not.

https://github.com/panphora/overtype/blob/b11b375d9b44998466f38426f81b2b1814088d5a/src/overtype.js#L563

With <kbd>Shift</kbd>+<kbd>Tab</kbd>, I want to "jump" from the field to the previous form element or possibly to the existing toolbar.

### Comments

No comments yet.

---

## Issue #74: Improve rendering of unordered lists

**Author:** 1951FDG
**Created:** 2025-11-12T13:49:11Z
**URL:** https://github.com/panphora/overtype/issues/74
**Labels:** None

### Description

In markdown, we can make an unordered list by preceding one or more lines of text with -, *, or +.

**Screenshot shows the following text formatted as unordered lists:**

```
* Ask a targeted, clarifying question that might help you find the missing piece
in the *existing* resources.
- Ask a targeted, clarifying question that might help you find the missing piece
in the *existing* resources.
+ Ask a targeted, clarifying question that might help you find the missing piece
in the existing* resources.
```

**The issue:** When using `*` as the list marker, the first sentence is italicized up to but not including `*existing*`. When using `-` as the list marker, all is ok. When using `+` as the list marker, all is ok but the `+` itself does not change color as the `-` does when used.

I'm not sure if this was mentioned before, maybe you could look into this.

Great project btw!

### Comments

No comments yet.

---

## Issue #73: Custom toolbarButtons is not defined

**Author:** nodesocket
**Created:** 2025-11-11T18:50:59Z
**URL:** https://github.com/panphora/overtype/issues/73
**Labels:** None

### Description

Version `2.0.5` and code is:

```javascript
...
    toolbar: true,
    toolbarButtons: [
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
        toolbarButtons.separator,
        toolbarButtons.quote,
        toolbarButtons.separator,
        toolbarButtons.viewMode,
    ]
...
```

Error:

```
Uncaught ReferenceError: toolbarButtons is not defined
```

Chrome: `142.0.7444.135`

### Comments

#### Comment by nodesocket (2025-11-11T22:36:07Z)

Little more details. Using `https://unpkg.com/overtype@2.0.5/dist/overtype.min.js`. See console showing not defined.

**Screenshot shows browser console error:**
```
Uncaught ReferenceError: toolbarButtons is not defined
```

#### Comment by nodesocket (2025-11-14T23:45:06Z)

@panphora did you see this issue? I even tried building myself instead of using the CDN and still get:

```
Uncaught ReferenceError: toolbarButtons is not defined
```

#### Comment by panphora (2025-11-15T04:45:08Z)

Yes, I see it! Very sorry about this issue. I will try to address it soon.

I have a full-time job, so it's hard to get to these issues right away. Thank you for bringing it yo my attention.

#### Comment by nodesocket (2025-11-15T05:16:58Z)

> Yes, I see it! Very sorry about this issue. I will try to address it soon.
>
> I have a full-time job, so it's hard to get to these issues right away. Thank you for bringing it yo my attention.

Absolutely just wasn't sure if you saw it. Thanks for this project, no worries. 🙏

---

## Issue #72: Error using keyboard shortcuts (CTRL + i) with active toolbar

**Author:** kozi
**Created:** 2025-11-11T11:18:45Z
**URL:** https://github.com/panphora/overtype/issues/72
**Labels:** None

### Description

**Screenshot shows browser console error:**
```
Uncaught TypeError: this.editor.toolbar handleaction is not a function
handleKeydown https://overtype.dev/dist/overtype.min.js:36
handleKeydown https://overtype.dev/dist/overtype.min.js:947
initgloballisteners https://overtype.dev/dist/overtype.min.js:959
[weitere Informationen]
```

The basic keyboard shortcut functionality should also be checked again.
It seems to work in the web component without a toolbar, but not in the other editors on the example page.

### Comments

No comments yet.
