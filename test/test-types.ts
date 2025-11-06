// Test file to verify TypeScript definitions work correctly
// Run: npx tsc --noEmit test-types.ts
import OverType, { Theme, Options, Stats, OverType as OverTypeInstance } from '../src/overtype';

// Test basic initialization - constructor returns array
const editors1: OverTypeInstance[] = new OverType('#editor');
const editors2: OverTypeInstance[] = new OverType(document.getElementById('editor')!);
const editors3: OverTypeInstance[] = new OverType('.editor-class');

// Test with comprehensive options
const editorsWithOptions: OverTypeInstance[] = new OverType('#editor', {
  // Typography
  fontSize: '16px',
  lineHeight: 1.8,
  fontFamily: 'monospace',
  padding: '20px',

  // Mobile responsive
  mobile: {
    fontSize: '18px',
    padding: '10px',
    lineHeight: 1.5
  },

  // Native textarea attributes (v1.1.2+)
  textareaProps: {
    required: true,
    maxLength: 500,
    name: 'markdown-content',
    'data-form-field': 'content'
  },

  // Behavior
  autofocus: true,
  autoResize: true,      // v1.1.2+
  minHeight: '200px',    // v1.1.2+
  maxHeight: '800px',    // v1.1.2+
  placeholder: 'Type here...',
  value: '# Initial content',

  // Features
  showActiveLineRaw: true,
  showStats: true,
  toolbar: true,
  statsFormatter: (stats: Stats) => `${stats.words} words, ${stats.chars} chars`,

  // Callbacks
  onChange: (value: string, instance: OverTypeInstance) => {
    console.log('Changed:', value);
    console.log('Instance:', instance.getValue());
  },
  onKeydown: (event: KeyboardEvent, instance: OverTypeInstance) => {
    if (event.key === 'Enter') {
      console.log('Enter pressed');
    }
  }
});

// Test instance methods
if (editorsWithOptions.length > 0) {
  const instance = editorsWithOptions[0];
  const value: string = instance.getValue();
  instance.setValue('# New content');
  const stats: Stats = instance.getStats();
  const container: HTMLElement = instance.getContainer();
  instance.focus();
  instance.blur();
  instance.updatePreview();
  instance.showStats(true);
  instance.setTheme('cave');
  instance.reinit({ fontSize: '18px' });
  const isInit: boolean = instance.isInitialized();
  instance.destroy();
}

// Test static methods - init returns array
const instances: OverTypeInstance[] = OverType.init('.editors', { toolbar: true });
const foundInstance: OverTypeInstance | null = OverType.getInstance(document.getElementById('editor')!);
OverType.destroyAll();
OverType.setTheme('solar');
OverType.setTheme('cave', { text: '#fff', bgPrimary: '#000' });

// Test theme object
const customTheme: Theme = {
  name: 'custom',
  colors: {
    bgPrimary: '#ffffff',
    bgSecondary: '#f0f0f0',
    text: '#333333',
    textSecondary: '#666666',
    h1: '#000000',
    h2: '#111111',
    h3: '#222222',
    strong: '#444444',
    em: '#555555',
    link: '#0066cc',
    code: '#666666',
    codeBg: '#f5f5f5',
    blockquote: '#777777',
    hr: '#888888',
    syntaxMarker: '#999999',
    listMarker: '#aaaaaa',
    cursor: '#ff0000',
    selection: 'rgba(0, 0, 255, 0.3)',
    rawLine: '#bbbbbb',
    toolbarBg: '#eeeeee',
    toolbarIcon: '#333333',
    toolbarHover: '#dddddd',
    toolbarActive: '#cccccc',
    border: '#dddddd'
  }
};
OverType.setTheme(customTheme);

// Test accessing built-in themes
const solarTheme: Theme = OverType.themes.solar;
const caveTheme: Theme = OverType.themes.cave;
console.log('Solar theme:', solarTheme);
console.log('Cave theme:', caveTheme);

// Test Stats interface
const statsExample: Stats = {
  words: 100,
  chars: 500,
  lines: 10,
  line: 5,
  column: 20
};

// Test accessing properties
if (editors1.length > 0) {
  const editor = editors1[0];
  console.log('Container:', editor.container);
  console.log('Textarea:', editor.textarea);
  console.log('Preview:', editor.preview);
  console.log('Options:', editor.options);
  console.log('Initialized:', editor.initialized);
  console.log('Element:', editor.element);
}

// Test using static getTheme
const fetchedTheme: Theme = OverType.getTheme('solar');
console.log('Fetched theme:', fetchedTheme);

// Test accessing static properties
console.log('Current theme:', OverType.currentTheme);
console.log('Instance count:', OverType.instanceCount);

console.log('TypeScript definitions test completed successfully!');