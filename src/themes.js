/**
 * Built-in themes for OverType editor
 * Each theme provides a complete color palette for the editor
 */

/**
 * Solar theme - Light, warm and bright
 */
export const solar = {
  name: 'solar',
  colors: {
    bgPrimary: '#faf0ca',        // Lemon Chiffon - main background
    bgSecondary: '#ffffff',      // White - editor background
    text: '#0d3b66',             // Yale Blue - main text
    textPrimary: '#0d3b66',      // Yale Blue - primary text (same as text)
    textSecondary: '#5a7a9b',    // Muted blue - secondary text
    h1: '#f95738',               // Tomato - h1 headers
    h2: '#ee964b',               // Sandy Brown - h2 headers
    h3: '#3d8a51',               // Forest green - h3 headers
    strong: '#ee964b',           // Sandy Brown - bold text
    em: '#f95738',               // Tomato - italic text
    del: '#ee964b',              // Sandy Brown - deleted text (same as strong)
    link: '#0d3b66',             // Yale Blue - links
    code: '#0d3b66',             // Yale Blue - inline code
    codeBg: 'rgba(244, 211, 94, 0.4)', // Naples Yellow with transparency
    blockquote: '#5a7a9b',       // Muted blue - blockquotes
    hr: '#5a7a9b',               // Muted blue - horizontal rules
    syntaxMarker: 'rgba(13, 59, 102, 0.52)', // Yale Blue with transparency
    syntax: '#999999',           // Gray - syntax highlighting fallback
    cursor: '#f95738',           // Tomato - cursor
    selection: 'rgba(244, 211, 94, 0.4)', // Naples Yellow with transparency
    listMarker: '#ee964b',       // Sandy Brown - list markers
    rawLine: '#5a7a9b',          // Muted blue - raw line indicators
    border: '#e0e0e0',           // Light gray - borders
    hoverBg: '#f0f0f0',          // Very light gray - hover backgrounds
    primary: '#0d3b66',          // Yale Blue - primary accent
    // Toolbar colors
    toolbarBg: '#ffffff',        // White - toolbar background
    toolbarIcon: '#0d3b66',      // Yale Blue - icon color
    toolbarHover: '#f5f5f5',     // Light gray - hover background
    toolbarActive: '#faf0ca',    // Lemon Chiffon - active button background
    placeholder: '#999999',      // Gray - placeholder text
  },
  previewColors: {
    text: '#1a1a1a',
    h1: '#1a1a1a',
    h2: '#2a2a2a',
    h3: '#3a3a3a',
    strong: 'inherit',
    em: 'inherit',
    link: '#0066cc',
    code: '#1a1a1a',
    codeBg: 'rgba(135, 131, 120, 0.15)',
    blockquote: '#555',
    hr: '#ddd',
    bg: 'transparent',
  }
};

/**
 * Cave theme - Dark ocean depths
 */
export const cave = {
  name: 'cave',
  colors: {
    bgPrimary: '#141E26',        // Deep ocean - main background
    bgSecondary: '#1D2D3E',      // Darker charcoal - editor background
    text: '#c5dde8',             // Light blue-gray - main text
    textPrimary: '#c5dde8',      // Light blue-gray - primary text (same as text)
    textSecondary: '#9fcfec',    // Brighter blue - secondary text
    h1: '#d4a5ff',               // Rich lavender - h1 headers
    h2: '#f6ae2d',               // Hunyadi Yellow - h2 headers
    h3: '#9fcfec',               // Brighter blue - h3 headers
    strong: '#f6ae2d',           // Hunyadi Yellow - bold text
    em: '#9fcfec',               // Brighter blue - italic text
    del: '#f6ae2d',              // Hunyadi Yellow - deleted text (same as strong)
    link: '#9fcfec',             // Brighter blue - links
    code: '#c5dde8',             // Light blue-gray - inline code
    codeBg: '#1a232b',           // Very dark blue - code background
    blockquote: '#9fcfec',       // Brighter blue - same as italic
    hr: '#c5dde8',               // Light blue-gray - horizontal rules
    syntaxMarker: 'rgba(159, 207, 236, 0.73)', // Brighter blue semi-transparent
    syntax: '#7a8c98',           // Muted gray-blue - syntax highlighting fallback
    cursor: '#f26419',           // Orange Pantone - cursor
    selection: 'rgba(51, 101, 138, 0.4)', // Lapis Lazuli with transparency
    listMarker: '#f6ae2d',       // Hunyadi Yellow - list markers
    rawLine: '#9fcfec',          // Brighter blue - raw line indicators
    border: '#2a3f52',           // Dark blue-gray - borders
    hoverBg: '#243546',          // Slightly lighter charcoal - hover backgrounds
    primary: '#9fcfec',          // Brighter blue - primary accent
    // Toolbar colors for dark theme
    toolbarBg: '#1D2D3E',        // Darker charcoal - toolbar background
    toolbarIcon: '#c5dde8',      // Light blue-gray - icon color
    toolbarHover: '#243546',     // Slightly lighter charcoal - hover background
    toolbarActive: '#2a3f52',    // Even lighter - active button background
    placeholder: '#6a7a88',      // Muted blue-gray - placeholder text
  },
  previewColors: {
    text: '#c5dde8',
    h1: '#e0e0e0',
    h2: '#d0d0d0',
    h3: '#c0c0c0',
    strong: 'inherit',
    em: 'inherit',
    link: '#6cb6e0',
    code: '#c5dde8',
    codeBg: 'rgba(255, 255, 255, 0.08)',
    blockquote: '#9aa8b4',
    hr: 'rgba(255, 255, 255, 0.15)',
    bg: 'transparent',
  }
};

/**
 * Default themes registry
 */
export const themes = {
  solar,
  cave,
  auto: solar,
  // Aliases for backward compatibility
  light: solar,
  dark: cave
};

/**
 * Get theme by name or return custom theme object
 * @param {string|Object} theme - Theme name or custom theme object
 * @returns {Object} Theme configuration
 */
export function getTheme(theme) {
  if (typeof theme === 'string') {
    const themeObj = themes[theme] || themes.solar;
    // Preserve the requested theme name (important for 'light' and 'dark' aliases)
    return { ...themeObj, name: theme };
  }
  return theme;
}

/**
 * Resolve auto theme to actual theme based on system color scheme
 * @param {string} themeName - Theme name to resolve
 * @returns {string} Resolved theme name ('solar' or 'cave' if auto, otherwise unchanged)
 */
export function resolveAutoTheme(themeName) {
  if (themeName !== 'auto') return themeName;
  const mq = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)');
  return mq?.matches ? 'cave' : 'solar';
}

/**
 * Apply theme colors to CSS variables
 * @param {Object} colors - Theme colors object
 * @returns {string} CSS custom properties string
 */
export function themeToCSSVars(colors, previewColors) {
  const vars = [];
  for (const [key, value] of Object.entries(colors)) {
    const varName = key.replace(/([A-Z])/g, '-$1').toLowerCase();
    vars.push(`--${varName}: ${value};`);
  }
  if (previewColors) {
    for (const [key, value] of Object.entries(previewColors)) {
      const varName = key.replace(/([A-Z])/g, '-$1').toLowerCase();
      vars.push(`--preview-${varName}: ${value};`);
    }
  }
  return vars.join('\n');
}

/**
 * Merge custom colors with base theme
 * @param {Object} baseTheme - Base theme object
 * @param {Object} customColors - Custom color overrides
 * @returns {Object} Merged theme object
 */
export function mergeTheme(baseTheme, customColors = {}, customPreviewColors = {}) {
  return {
    ...baseTheme,
    colors: {
      ...baseTheme.colors,
      ...customColors
    },
    previewColors: {
      ...baseTheme.previewColors,
      ...customPreviewColors
    }
  };
}