/**
 * Toolbar button definitions for OverType editor
 * Export built-in buttons that can be used in custom toolbar configurations
 */

import * as icons from './icons.js';
import * as markdownActions from 'markdown-actions';

/**
 * Built-in toolbar button definitions
 * Each button has: name, actionId, icon, title, action
 * - name: DOM identifier for the button element
 * - actionId: Canonical action identifier used by performAction
 * Action signature: ({ editor, getValue, setValue, event }) => void
 */
export const toolbarButtons = {
  bold: {
    name: 'bold',
    actionId: 'toggleBold',
    icon: icons.boldIcon,
    title: 'Bold (Ctrl+B)',
    action: ({ editor }) => {
      markdownActions.toggleBold(editor.textarea);
      editor.textarea.dispatchEvent(new Event('input', { bubbles: true }));
    }
  },

  italic: {
    name: 'italic',
    actionId: 'toggleItalic',
    icon: icons.italicIcon,
    title: 'Italic (Ctrl+I)',
    action: ({ editor }) => {
      markdownActions.toggleItalic(editor.textarea);
      editor.textarea.dispatchEvent(new Event('input', { bubbles: true }));
    }
  },

  code: {
    name: 'code',
    actionId: 'toggleCode',
    icon: icons.codeIcon,
    title: 'Inline Code',
    action: ({ editor }) => {
      markdownActions.toggleCode(editor.textarea);
      editor.textarea.dispatchEvent(new Event('input', { bubbles: true }));
    }
  },

  separator: {
    name: 'separator'
    // No icon, title, or action - special separator element
  },

  link: {
    name: 'link',
    actionId: 'insertLink',
    icon: icons.linkIcon,
    title: 'Insert Link',
    action: ({ editor }) => {
      markdownActions.insertLink(editor.textarea);
      editor.textarea.dispatchEvent(new Event('input', { bubbles: true }));
    }
  },

  h1: {
    name: 'h1',
    actionId: 'toggleH1',
    icon: icons.h1Icon,
    title: 'Heading 1',
    action: ({ editor }) => {
      markdownActions.toggleH1(editor.textarea);
      editor.textarea.dispatchEvent(new Event('input', { bubbles: true }));
    }
  },

  h2: {
    name: 'h2',
    actionId: 'toggleH2',
    icon: icons.h2Icon,
    title: 'Heading 2',
    action: ({ editor }) => {
      markdownActions.toggleH2(editor.textarea);
      editor.textarea.dispatchEvent(new Event('input', { bubbles: true }));
    }
  },

  h3: {
    name: 'h3',
    actionId: 'toggleH3',
    icon: icons.h3Icon,
    title: 'Heading 3',
    action: ({ editor }) => {
      markdownActions.toggleH3(editor.textarea);
      editor.textarea.dispatchEvent(new Event('input', { bubbles: true }));
    }
  },

  bulletList: {
    name: 'bulletList',
    actionId: 'toggleBulletList',
    icon: icons.bulletListIcon,
    title: 'Bullet List',
    action: ({ editor }) => {
      markdownActions.toggleBulletList(editor.textarea);
      editor.textarea.dispatchEvent(new Event('input', { bubbles: true }));
    }
  },

  orderedList: {
    name: 'orderedList',
    actionId: 'toggleNumberedList',
    icon: icons.orderedListIcon,
    title: 'Numbered List',
    action: ({ editor }) => {
      markdownActions.toggleNumberedList(editor.textarea);
      editor.textarea.dispatchEvent(new Event('input', { bubbles: true }));
    }
  },

  taskList: {
    name: 'taskList',
    actionId: 'toggleTaskList',
    icon: icons.taskListIcon,
    title: 'Task List',
    action: ({ editor }) => {
      if (markdownActions.toggleTaskList) {
        markdownActions.toggleTaskList(editor.textarea);
        editor.textarea.dispatchEvent(new Event('input', { bubbles: true }));
      }
    }
  },

  quote: {
    name: 'quote',
    actionId: 'toggleQuote',
    icon: icons.quoteIcon,
    title: 'Quote',
    action: ({ editor }) => {
      markdownActions.toggleQuote(editor.textarea);
      editor.textarea.dispatchEvent(new Event('input', { bubbles: true }));
    }
  },

  upload: {
    name: 'upload',
    actionId: 'uploadFile',
    icon: icons.uploadIcon,
    title: 'Upload File',
    action: ({ editor }) => {
      if (!editor.options.fileUpload?.enabled) return;
      const input = document.createElement('input');
      input.type = 'file';
      input.multiple = true;
      if (editor.options.fileUpload.mimeTypes?.length > 0) {
        input.accept = editor.options.fileUpload.mimeTypes.join(',');
      }
      input.onchange = () => {
        if (!input.files?.length) return;
        const dt = new DataTransfer();
        for (const f of input.files) dt.items.add(f);
        editor._handleDataTransfer(dt);
      };
      input.click();
    }
  },

  viewMode: {
    name: 'viewMode',
    icon: icons.eyeIcon,
    title: 'View mode'
    // Special: handled internally by Toolbar class as dropdown
    // No action property - dropdown behavior is internal
  }
};

/**
 * Default toolbar button layout with separators
 * This is used when toolbar: true but no toolbarButtons provided
 */
export const defaultToolbarButtons = [
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
