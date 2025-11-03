// Type definitions for OverType
// Project: https://github.com/panphora/overtype
// Definitions generated from JSDoc comments and implementation

export interface Theme {
  name: string;
  colors: {
    bgPrimary?: string;
    bgSecondary?: string;
    text?: string;
    textSecondary?: string;
    h1?: string;
    h2?: string;
    h3?: string;
    strong?: string;
    em?: string;
    link?: string;
    code?: string;
    codeBg?: string;
    blockquote?: string;
    hr?: string;
    syntaxMarker?: string;
    listMarker?: string;
    cursor?: string;
    selection?: string;
    rawLine?: string;
    // Toolbar theme colors
    toolbarBg?: string;
    toolbarIcon?: string;
    toolbarHover?: string;
    toolbarActive?: string;
    border?: string;
  };
}

export interface Stats {
  words: number;
  chars: number;
  lines: number;
  line: number;
  column: number;
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
  toolbar?: boolean | {
    buttons?: Array<{
      name?: string;
      icon?: string;
      title?: string;
      action?: string;
      separator?: boolean;
    }>;
  };
  smartLists?: boolean;       // v1.2.3+ Smart list continuation
  statsFormatter?: (stats: Stats) => string;

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
  instances: WeakMap<Element, OverTypeInstance>;
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