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
      },
    },
  },
];

export function normalizeThemeConfig(config) {
  if (!config || typeof config !== 'object') {
    return JSON.parse(JSON.stringify(DEFAULT_THEME_TOKENS));
  }

  return {
    colors: {
      ...DEFAULT_THEME_TOKENS.colors,
      ...(config.colors || {}),
    },
    typography: {
      ...DEFAULT_THEME_TOKENS.typography,
      ...(config.typography || {}),
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
  return {
    '--theme-primary': normalized.colors.primary,
    '--theme-secondary': normalized.colors.secondary,
    '--theme-bg': normalized.colors.background,
    '--theme-surface': normalized.colors.surface,
    '--theme-text': normalized.colors.text,
    '--theme-text-muted': normalized.colors.textMuted,
    '--theme-border': normalized.colors.border,
    '--theme-font': normalized.typography.fontFamily ? `'${normalized.typography.fontFamily}', sans-serif` : 'inherit',
    '--theme-radius-sm': normalized.borderRadius.sm,
    '--theme-radius-md': normalized.borderRadius.md,
    '--theme-radius-lg': normalized.borderRadius.lg,
    '--theme-radius-full': normalized.borderRadius.full,
    '--theme-space-xs': normalized.spacing.xs,
    '--theme-space-sm': normalized.spacing.sm,
    '--theme-space-md': normalized.spacing.md,
    '--theme-space-lg': normalized.spacing.lg,
    '--theme-space-xl': normalized.spacing.xl,
    '--theme-space-2xl': normalized.spacing['2xl'],
  };
}

export function tokensToCssString(tokens) {
  const vars = tokensToCssVars(tokens);
  return Object.entries(vars)
    .map(([key, val]) => `  ${key}: ${val};`)
    .join('\n');
}
