export const DEFAULT_THEME_TOKENS = {
  colors: {
    primary: '#2563eb',       // Blue 600
    secondary: '#7c3aed',     // Violet 600
    background: '#ffffff',
    surface: '#f8fafc',       // Slate 50
    text: '#0f172a',          // Slate 900
    textMuted: '#64748b',     // Slate 500
    border: '#e2e8f0',        // Slate 200
  },
  typography: {
    fontFamily: 'Inter',
    fontHeading: 'Inter',
    fontBody: 'Inter',
    fontSource: 'google',
    sizes: {
      xs: '12px',
      sm: '14px',
      base: '16px',
      lg: '18px',
      xl: '20px',
      '2xl': '24px',
      '3xl': '30px',
    },
    weights: [400, 500, 600, 700],
  },
  spacing: {
    none: '0px',
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px',
    '2xl': '48px',
  },
  borderRadius: {
    none: '0px',
    sm: '4px',
    md: '8px',
    lg: '16px',
    full: '9999px',
  },
};

export const THEME_COLOR_TOKENS = [
  { key: 'primary', varName: 'var(--theme-primary)', tokenName: '--theme-primary', label: 'Primary', description: 'Primary action & brand accent' },
  { key: 'secondary', varName: 'var(--theme-secondary)', tokenName: '--theme-secondary', label: 'Secondary', description: 'Secondary accent & highlights' },
  { key: 'text', varName: 'var(--theme-text)', tokenName: '--theme-text', label: 'Text', description: 'Headings & high-contrast text' },
  { key: 'textMuted', varName: 'var(--theme-text-muted)', tokenName: '--theme-text-muted', label: 'Muted', description: 'Subtitles & secondary text' },
  { key: 'surface', varName: 'var(--theme-surface)', tokenName: '--theme-surface', label: 'Surface', description: 'Cards, panels, & elevated surfaces' },
  { key: 'background', varName: 'var(--theme-bg)', tokenName: '--theme-bg', label: 'Background', description: 'Page & canvas background' },
  { key: 'border', varName: 'var(--theme-border)', tokenName: '--theme-border', label: 'Border', description: 'Dividers & container borders' },
];

export const THEME_PRESETS = [
  {
    name: 'Modern Blue',
    slug: 'modern-blue',
    configJson: {
      ...DEFAULT_THEME_TOKENS,
      colors: {
        primary: '#2563eb',
        secondary: '#7c3aed',
        background: '#ffffff',
        surface: '#f8fafc',
        text: '#0f172a',
        textMuted: '#64748b',
        border: '#e2e8f0',
      },
      typography: {
        ...DEFAULT_THEME_TOKENS.typography,
        fontFamily: 'Inter',
        fontHeading: 'Inter',
        fontBody: 'Inter',
      },
    },
  },
  {
    name: 'Midnight Dark',
    slug: 'midnight-dark',
    configJson: {
      ...DEFAULT_THEME_TOKENS,
      colors: {
        primary: '#38bdf8',
        secondary: '#818cf8',
        background: '#0f172a',
        surface: '#1e293b',
        text: '#f8fafc',
        textMuted: '#94a3b8',
        border: '#334155',
      },
      typography: {
        ...DEFAULT_THEME_TOKENS.typography,
        fontFamily: 'Poppins',
        fontHeading: 'Poppins',
        fontBody: 'Poppins',
      },
    },
  },
  {
    name: 'Emerald Garden',
    slug: 'emerald-garden',
    configJson: {
      ...DEFAULT_THEME_TOKENS,
      colors: {
        primary: '#059669',
        secondary: '#0d9488',
        background: '#ffffff',
        surface: '#f0fdf4',
        text: '#064e3b',
        textMuted: '#047857',
        border: '#bbf7d0',
      },
      typography: {
        ...DEFAULT_THEME_TOKENS.typography,
        fontFamily: 'Montserrat',
        fontHeading: 'Montserrat',
        fontBody: 'Montserrat',
      },
    },
  },
  {
    name: 'Sunset Coral',
    slug: 'sunset-coral',
    configJson: {
      ...DEFAULT_THEME_TOKENS,
      colors: {
        primary: '#f43f5e',
        secondary: '#f97316',
        background: '#fffbfb',
        surface: '#fff1f2',
        text: '#4c0519',
        textMuted: '#9f1239',
        border: '#fecdd3',
      },
      typography: {
        ...DEFAULT_THEME_TOKENS.typography,
        fontFamily: 'Nunito',
        fontHeading: 'Nunito',
        fontBody: 'Nunito',
      },
    },
  },
];

export function normalizeThemeConfig(config) {
  if (!config || typeof config !== 'object') {
    return JSON.parse(JSON.stringify(DEFAULT_THEME_TOKENS));
  }

  const fontFamily = config.typography?.fontFamily || DEFAULT_THEME_TOKENS.typography.fontFamily;
  const fontHeading = config.typography?.fontHeading || fontFamily || DEFAULT_THEME_TOKENS.typography.fontHeading;
  const fontBody = config.typography?.fontBody || fontFamily || DEFAULT_THEME_TOKENS.typography.fontBody;

  return {
    ...config,
    colors: {
      ...DEFAULT_THEME_TOKENS.colors,
      ...(config.colors || {}),
    },
    typography: {
      ...DEFAULT_THEME_TOKENS.typography,
      ...(config.typography || {}),
      fontFamily,
      fontHeading,
      fontBody,
      sizes: {
        ...DEFAULT_THEME_TOKENS.typography.sizes,
        ...(config.typography?.sizes || {}),
      },
      weights: Array.isArray(config.typography?.weights)
        ? config.typography.weights
        : DEFAULT_THEME_TOKENS.typography.weights,
    },
    spacing: {
      ...DEFAULT_THEME_TOKENS.spacing,
      ...(config.spacing || {}),
    },
    borderRadius: {
      ...DEFAULT_THEME_TOKENS.borderRadius,
      ...(config.borderRadius || {}),
    },
  };
}

export function tokensToCssVars(tokens) {
  const normalized = normalizeThemeConfig(tokens);
  const baseFont = normalized.typography.fontFamily;
  const headingFont = normalized.typography.fontHeading || baseFont;
  const bodyFont = normalized.typography.fontBody || baseFont;

  return {
    '--theme-primary': normalized.colors.primary,
    '--theme-secondary': normalized.colors.secondary,
    '--theme-bg': normalized.colors.background,
    '--theme-background': normalized.colors.background,
    '--theme-surface': normalized.colors.surface,
    '--theme-text': normalized.colors.text,
    '--theme-text-muted': normalized.colors.textMuted,
    '--theme-border': normalized.colors.border,
    '--theme-font': baseFont ? `'${baseFont}', sans-serif` : 'inherit',
    '--theme-font-heading': headingFont ? `'${headingFont}', sans-serif` : 'inherit',
    '--theme-font-body': bodyFont ? `'${bodyFont}', sans-serif` : 'inherit',
    '--theme-radius-none': normalized.borderRadius?.none || '0px',
    '--theme-radius-sm': normalized.borderRadius?.sm || '4px',
    '--theme-radius-md': normalized.borderRadius?.md || '8px',
    '--theme-radius-lg': normalized.borderRadius?.lg || '16px',
    '--theme-radius-full': normalized.borderRadius?.full || '9999px',
    '--theme-space-none': normalized.spacing?.none || '0px',
    '--theme-space-xs': normalized.spacing?.xs || '4px',
    '--theme-space-sm': normalized.spacing?.sm || '8px',
    '--theme-space-md': normalized.spacing?.md || '16px',
    '--theme-space-lg': normalized.spacing?.lg || '24px',
    '--theme-space-xl': normalized.spacing?.xl || '32px',
    '--theme-space-2xl': normalized.spacing?.['2xl'] || '48px',
    '--theme-font-size-xs': normalized.typography.sizes?.xs || '12px',
    '--theme-font-size-sm': normalized.typography.sizes?.sm || '14px',
    '--theme-font-size-base': normalized.typography.sizes?.base || '16px',
    '--theme-font-size-lg': normalized.typography.sizes?.lg || '18px',
    '--theme-font-size-xl': normalized.typography.sizes?.xl || '20px',
    '--theme-font-size-2xl': normalized.typography.sizes?.['2xl'] || '24px',
    '--theme-font-size-3xl': normalized.typography.sizes?.['3xl'] || '30px',
  };
}

export function tokensToCssString(tokens) {
  const vars = tokensToCssVars(tokens);
  return Object.entries(vars)
    .map(([key, val]) => `  ${key}: ${val};`)
    .join('\n');
}

/**
 * Resolves a token variable (e.g. 'var(--theme-primary)') to its actual hex/color value in the given theme config
 */
export function resolveColorTokenHex(tokenOrValue, themeConfig) {
  if (!tokenOrValue) return '#000000';
  const norm = normalizeThemeConfig(themeConfig);
  if (tokenOrValue === 'var(--theme-primary)') return norm.colors.primary;
  if (tokenOrValue === 'var(--theme-secondary)') return norm.colors.secondary;
  if (tokenOrValue === 'var(--theme-bg)' || tokenOrValue === 'var(--theme-background)') return norm.colors.background;
  if (tokenOrValue === 'var(--theme-surface)') return norm.colors.surface;
  if (tokenOrValue === 'var(--theme-text)') return norm.colors.text;
  if (tokenOrValue === 'var(--theme-text-muted)') return norm.colors.textMuted;
  if (tokenOrValue === 'var(--theme-border)') return norm.colors.border;
  return tokenOrValue;
}
