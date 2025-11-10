#!/usr/bin/env node

/**
 * Generate overtype.d.ts from themes.js and styles.js
 * This ensures TypeScript definitions stay in sync with actual implementation
 */

import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

// Read source files
const themesContent = readFileSync(join(projectRoot, 'src/themes.js'), 'utf-8');
const stylesContent = readFileSync(join(projectRoot, 'src/styles.js'), 'utf-8');

/**
 * Extract all unique color properties from themes.js
 */
function extractThemeProperties(themesContent) {
  const properties = new Set();

  // Match all properties in the colors objects
  const colorPropRegex = /colors:\s*{([^}]+)}/gs;
  const matches = themesContent.matchAll(colorPropRegex);

  for (const match of matches) {
    const colorBlock = match[1];
    // Extract property names (camelCase before the colon)
    const propMatches = colorBlock.matchAll(/\s+(\w+):/g);
    for (const propMatch of propMatches) {
      properties.add(propMatch[1]);
    }
  }

  return Array.from(properties).sort();
}

/**
 * Extract all CSS variables from styles.js
 */
function extractCSSVariables(stylesContent) {
  const variables = new Set();

  // Match all var(--variable-name) patterns (including digits)
  const varRegex = /var\(--([a-z0-9-]+)(?:,|\))/g;
  const matches = stylesContent.matchAll(varRegex);

  for (const match of matches) {
    const varName = match[1];
    // Convert kebab-case to camelCase
    const camelCase = varName.replace(/-([a-z0-9])/g, (_, letter) => letter.toUpperCase());

    // Skip instance-specific variables (these are not theme colors)
    if (!varName.startsWith('instance-') && !varName.startsWith('link-') && !varName.startsWith('target-')) {
      variables.add(camelCase);
    }
  }

  return Array.from(variables).sort();
}

/**
 * Generate TypeScript interface for Theme colors
 */
function generateThemeInterface(themeProps, cssVars) {
  // Combine both sources, preferring theme properties as they're more authoritative
  const allProps = new Set([...themeProps, ...cssVars]);

  const properties = Array.from(allProps)
    .sort()
    .map(prop => `    ${prop}?: string;`)
    .join('\n');

  return properties;
}

/**
 * Read the template and inject generated types
 */
function generateTypeDefinitions() {
  const themeProps = extractThemeProperties(themesContent);
  const cssVars = extractCSSVariables(stylesContent);

  console.log('Theme properties found:', themeProps.length);
  console.log('CSS variables found:', cssVars.length);

  // Properties that are in CSS but not in themes
  const missingInThemes = cssVars.filter(v => !themeProps.includes(v));
  if (missingInThemes.length > 0) {
    console.log('⚠️  CSS variables missing from themes:', missingInThemes.join(', '));
  }

  // Properties that are in themes but not used in CSS
  const unusedInCSS = themeProps.filter(p => !cssVars.includes(p));
  if (unusedInCSS.length > 0) {
    console.log('⚠️  Theme properties not used in CSS:', unusedInCSS.join(', '));
  }

  const colorProperties = generateThemeInterface(themeProps, cssVars);

  const typeDefinitions = `// Type definitions for OverType
// Project: https://github.com/panphora/overtype
// Definitions generated from themes.js and styles.js
// DO NOT EDIT MANUALLY - Run 'npm run generate:types' to regenerate

export interface Theme {
  name: string;
  colors: {
${colorProperties}
  };
}

export interface Stats {
  words: number;
  chars: number;
  lines: number;
  line: number;
  column: number;
}

/**
 * Toolbar button definition
 */
export interface ToolbarButton {
  /** Unique button identifier */
  name: string;

  /** SVG icon markup (optional for separator) */
  icon?: string;

  /** Button tooltip text (optional for separator) */
  title?: string;

  /** Button action callback (optional for separator) */
  action?: (context: {
    editor: OverType;
    getValue: () => string;
    setValue: (value: string) => void;
    event: MouseEvent;
  }) => void | Promise<void>;
}

export interface MobileOptions {
  fontSize?: string;
  padding?: string;
  lineHeight?: string | number;
}

export interface Options {
  // Typography
  fontSize?: string;
  lineHeight?: string | number;
  fontFamily?: string;
  padding?: string;

  // Mobile responsive
  mobile?: MobileOptions;

  // Native textarea attributes (v1.1.2+)
  textareaProps?: Record<string, any>;

  // Behavior
  autofocus?: boolean;
  autoResize?: boolean;      // v1.1.2+ Auto-expand height with content
  minHeight?: string;         // v1.1.2+ Minimum height for autoResize mode
  maxHeight?: string | null;  // v1.1.2+ Maximum height for autoResize mode
  placeholder?: string;
  value?: string;

  // Features
  showActiveLineRaw?: boolean;
  showStats?: boolean;
  toolbar?: boolean;
  toolbarButtons?: ToolbarButton[];  // Custom toolbar button configuration
  smartLists?: boolean;       // v1.2.3+ Smart list continuation
  statsFormatter?: (stats: Stats) => string;
  codeHighlighter?: ((code: string, language: string) => string) | null;  // Per-instance code highlighter

  // Theme (deprecated in favor of global theme)
  theme?: string | Theme;
  colors?: Partial<Theme['colors']>;

  // Callbacks
  onChange?: (value: string, instance: OverTypeInstance) => void;
  onKeydown?: (event: KeyboardEvent, instance: OverTypeInstance) => void;
}

// Interface for constructor that returns array
export interface OverTypeConstructor {
  new(target: string | Element | NodeList | Element[], options?: Options): OverTypeInstance[];
  // Static members
  instances: any;
  stylesInjected: boolean;
  globalListenersInitialized: boolean;
  instanceCount: number;
  currentTheme: Theme;
  themes: {
    solar: Theme;
    cave: Theme;
  };
  MarkdownParser: any;
  ShortcutsManager: any;
  init(target: string | Element | NodeList | Element[], options?: Options): OverTypeInstance[];
  getInstance(element: Element): OverTypeInstance | null;
  destroyAll(): void;
  injectStyles(force?: boolean): void;
  setTheme(theme: string | Theme, customColors?: Partial<Theme['colors']>): void;
  setCodeHighlighter(highlighter: ((code: string, language: string) => string) | null): void;
  initGlobalListeners(): void;
  getTheme(name: string): Theme;
}

export interface RenderOptions {
  cleanHTML?: boolean;
}

export interface OverTypeInstance {
  // Public properties
  container: HTMLElement;
  wrapper: HTMLElement;
  textarea: HTMLTextAreaElement;
  preview: HTMLElement;
  statsBar?: HTMLElement;
  toolbar?: any; // Toolbar instance
  shortcuts?: any; // ShortcutsManager instance
  linkTooltip?: any; // LinkTooltip instance
  options: Options;
  initialized: boolean;
  instanceId: number;
  element: Element;

  // Public methods
  getValue(): string;
  setValue(value: string): void;
  getStats(): Stats;
  getContainer(): HTMLElement;
  focus(): void;
  blur(): void;
  destroy(): void;
  isInitialized(): boolean;
  reinit(options: Options): void;
  showStats(show: boolean): void;
  setTheme(theme: string | Theme): this;
  setCodeHighlighter(highlighter: ((code: string, language: string) => string) | null): void;
  updatePreview(): void;

  // HTML output methods
  getRenderedHTML(options?: RenderOptions): string;
  getCleanHTML(): string;
  getPreviewHTML(): string;

  // View mode methods
  showNormalEditMode(): this;
  showPlainTextarea(): this;
  showPreviewMode(): this;
}

// Declare the constructor as a constant with proper typing
declare const OverType: OverTypeConstructor;

// Export the instance type under a different name for clarity
export type OverType = OverTypeInstance;

// Module exports - default export is the constructor
export default OverType;

/**
 * Pre-defined toolbar buttons
 */
export const toolbarButtons: {
  bold: ToolbarButton;
  italic: ToolbarButton;
  code: ToolbarButton;
  separator: ToolbarButton;
  link: ToolbarButton;
  h1: ToolbarButton;
  h2: ToolbarButton;
  h3: ToolbarButton;
  bulletList: ToolbarButton;
  orderedList: ToolbarButton;
  taskList: ToolbarButton;
  quote: ToolbarButton;
  viewMode: ToolbarButton;
};

/**
 * Default toolbar button layout with separators
 */
export const defaultToolbarButtons: ToolbarButton[];
`;

  return typeDefinitions;
}

// Generate and write the type definitions
const types = generateTypeDefinitions();
const outputPath = join(projectRoot, 'src/overtype.d.ts');
writeFileSync(outputPath, types, 'utf-8');

console.log('✅ Generated overtype.d.ts successfully');
console.log('   Output:', outputPath);
