/**
 * Toolbar button definitions for OverType editor
 * Export built-in buttons that can be used in custom toolbar configurations
 */

import * as icons from './icons.js';
import * as markdownActions from 'markdown-actions';

/**
 * Built-in toolbar button definitions
 * Each button has: name, icon, title, action
 * Action signature: ({ editor, getValue, setValue, event }) => void
 */
export const toolbarButtons = {
  bold: {
    name: 'bold',
    icon: icons.boldIcon,
    title: 'Bold (Ctrl+B)',
    action: ({ editor, event }) => {
      markdownActions.toggleBold(editor.textarea);
      editor.textarea.dispatchEvent(new Event('input', { bubbles: true }));
    }
  },

  italic: {
    name: 'italic',
    icon: icons.italicIcon,
    title: 'Italic (Ctrl+I)',
    action: ({ editor, event }) => {
      markdownActions.toggleItalic(editor.textarea);
      editor.textarea.dispatchEvent(new Event('input', { bubbles: true }));
    }
  },

  code: {
    name: 'code',
    icon: icons.codeIcon,
    title: 'Inline Code',
    action: ({ editor, event }) => {
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
    icon: icons.linkIcon,
    title: 'Insert Link',
    action: ({ editor, event }) => {
      markdownActions.insertLink(editor.textarea);
      editor.textarea.dispatchEvent(new Event('input', { bubbles: true }));
    }
  },

  h1: {
    name: 'h1',
    icon: icons.h1Icon,
    title: 'Heading 1',
    action: ({ editor, event }) => {
      markdownActions.toggleH1(editor.textarea);
      editor.textarea.dispatchEvent(new Event('input', { bubbles: true }));
    }
  },

  h2: {
    name: 'h2',
    icon: icons.h2Icon,
    title: 'Heading 2',
    action: ({ editor, event }) => {
      markdownActions.toggleH2(editor.textarea);
      editor.textarea.dispatchEvent(new Event('input', { bubbles: true }));
    }
  },

  h3: {
    name: 'h3',
    icon: icons.h3Icon,
    title: 'Heading 3',
    action: ({ editor, event }) => {
      markdownActions.toggleH3(editor.textarea);
      editor.textarea.dispatchEvent(new Event('input', { bubbles: true }));
    }
  },

  bulletList: {
    name: 'bulletList',
    icon: icons.bulletListIcon,
    title: 'Bullet List',
    action: ({ editor, event }) => {
      markdownActions.toggleBulletList(editor.textarea);
      editor.textarea.dispatchEvent(new Event('input', { bubbles: true }));
    }
  },

  orderedList: {
    name: 'orderedList',
    icon: icons.orderedListIcon,
    title: 'Numbered List',
    action: ({ editor, event }) => {
      markdownActions.toggleNumberedList(editor.textarea);
      editor.textarea.dispatchEvent(new Event('input', { bubbles: true }));
    }
  },

  taskList: {
    name: 'taskList',
    icon: icons.taskListIcon,
    title: 'Task List',
    action: ({ editor, event }) => {
      if (markdownActions.toggleTaskList) {
        markdownActions.toggleTaskList(editor.textarea);
        editor.textarea.dispatchEvent(new Event('input', { bubbles: true }));
      }
    }
  },

  quote: {
    name: 'quote',
    icon: icons.quoteIcon,
    title: 'Quote',
    action: ({ editor, event }) => {
      markdownActions.toggleQuote(editor.textarea);
      editor.textarea.dispatchEvent(new Event('input', { bubbles: true }));
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
