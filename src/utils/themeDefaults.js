export const DEFAULT_THEME_TOKENS = {
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
    fontFamily: 'Inter',
    fontSource: 'google',
    fonts: {
      primary: 'Inter',
      secondary: 'Inter',
      heading: 'Inter',
      body: 'Inter',
      button: 'Inter',
      link: 'Inter',
    },
    sizes: {
      xs: '12px',
      sm: '14px',
      base: '16px',
      lg: '18px',
      xl: '20px',
      '2xl': '24px',
      '3xl': '30px',
      h1: '36px',
      h2: '30px',
      h3: '24px',
      h4: '20px',
      bodyLarge: '18px',
      bodyMedium: '16px',
      bodySmall: '14px',
      caption: '12px',
      label: '14px',
      button: '14px',
      h5: '18px',
      h6: '16px',
      paragraph: '16px',
      primaryButton: '14px',
      secondaryButton: '14px',
      link: '14px',
    },
    weights: [400, 500, 600, 700],
    fontWeights: { heading: 700, body: 400, button: 600 },
    textStyles: {
      h1: { lineHeight: 1.2, letterSpacing: '0px', fontStyle: 'normal', fontWeight: 700 },
      h2: { lineHeight: 1.25, letterSpacing: '0px', fontStyle: 'normal', fontWeight: 700 },
      h3: { lineHeight: 1.3, letterSpacing: '0px', fontStyle: 'normal', fontWeight: 600 },
      h4: { lineHeight: 1.35, letterSpacing: '0px', fontStyle: 'normal', fontWeight: 600 },
      h5: { lineHeight: 1.4, letterSpacing: '0px', fontStyle: 'normal', fontWeight: 600 },
      h6: { lineHeight: 1.4, letterSpacing: '0px', fontStyle: 'normal', fontWeight: 600 },
      paragraph: { lineHeight: 1.5, letterSpacing: '0px', fontStyle: 'normal', fontWeight: 400 },
      primaryButton: { lineHeight: 1.2, letterSpacing: '0px', fontStyle: 'normal', fontWeight: 600 },
      secondaryButton: { lineHeight: 1.2, letterSpacing: '0px', fontStyle: 'normal', fontWeight: 500 },
      link: { lineHeight: 1.4, letterSpacing: '0px', fontStyle: 'normal', fontWeight: 400 },
    },
    lineHeight: 1.5,
    letterSpacing: '0px',
    textTransform: 'none',
    textDecoration: 'none',
    fontStyle: 'normal',
    customTokens: {},
  },
  spacing: {
    none: '0px',
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px',
    '2xl': '48px',
    base: '8px',
    containerPadding: '24px',
    section: '48px',
    componentGap: '16px',
    gridGap: '16px',
  },
  borderRadius: {
    none: '0px',
    xs: '2px',
    sm: '4px',
    md: '8px',
    lg: '16px',
    xl: '24px',
    full: '9999px',
  },
  configGroups: [],
  configGroup: {},
  configStyles: [],
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
        fonts: { ...DEFAULT_THEME_TOKENS.typography.fonts, primary: 'Poppins' },
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
        fonts: { ...DEFAULT_THEME_TOKENS.typography.fonts, primary: 'Montserrat' },
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
        fonts: { ...DEFAULT_THEME_TOKENS.typography.fonts, primary: 'Nunito' },
      },
    },
  },
];

const asRecord = (value) =>
  value && typeof value === 'object' && !Array.isArray(value) ? value : {};

const colorKeyFromName = (name) => {
  const words = String(name || '').match(/[a-zA-Z0-9]+/g) || [];
  return words
    .map((word, index) => index === 0
      ? word.charAt(0).toLowerCase() + word.slice(1)
      : word.charAt(0).toUpperCase() + word.slice(1))
    .join('');
};

function normalizeColors(config) {
  const colors = { ...DEFAULT_THEME_TOKENS.colors, ...asRecord(config.colors) };
  const legacyCustomColors = Array.isArray(config.customColors) ? config.customColors : [];
  legacyCustomColors.forEach((color) => {
    if (!color || typeof color !== 'object' || typeof color.value !== 'string') return;
    const key = colorKeyFromName(color.name);
    if (key && !Object.prototype.hasOwnProperty.call(colors, key)) {
      colors[key] = color.value;
    }
  });
  return colors;
}

const inferValueType = (option) => {
  if (['text', 'number', 'color'].includes(option.valueType)) return option.valueType;
  if (option.inputType === 'number' || option.inputType === 'range' || option.inputType === 'fontWeight') return 'number';
  if (option.inputType === 'color') return 'color';
  if (typeof option.value === 'number' || typeof option.defaultValue === 'number') return 'number';
  if (/^#[0-9a-f]{6}$/i.test(String(option.value ?? option.defaultValue ?? ''))) return 'color';
  return 'text';
};

function configGroupsFromValues(configGroup) {
  return Object.entries(asRecord(configGroup)).map(([name, values], groupIndex) => ({
    id: `config-group-${groupIndex}`,
    name,
    options: Object.entries(asRecord(values)).map(([optionName, value], optionIndex) => ({
      id: `config-option-${groupIndex}-${optionIndex}`,
      name: optionName,
      valueType: typeof value === 'number' ? 'number' : /^#[0-9a-f]{6}$/i.test(String(value)) ? 'color' : 'text',
      value,
    })),
  }));
}

function normalizeConfigGroups(groups, configGroup) {
  const source = Array.isArray(groups) ? groups : configGroupsFromValues(configGroup);
  return source
    .filter((group) => group && typeof group === 'object' && !Array.isArray(group))
    .map((group, groupIndex) => {
      const name = typeof group.name === 'string' ? group.name : `Configuration Group ${groupIndex + 1}`;
      const storedValues = asRecord(asRecord(configGroup)[name]);
      const options = Array.isArray(group.options) ? group.options : [];
      return {
        id: typeof group.id === 'string' ? group.id : `config-group-${groupIndex}`,
        name,
        options: options
          .filter((option) => option && typeof option === 'object' && !Array.isArray(option))
          .map((option, optionIndex) => {
            const optionName = typeof option.name === 'string' ? option.name : `option${optionIndex + 1}`;
            const valueType = inferValueType(option);
            const hasStoredValue = Object.prototype.hasOwnProperty.call(storedValues, optionName);
            const value = hasStoredValue
              ? storedValues[optionName]
              : Object.prototype.hasOwnProperty.call(option, 'value')
                ? option.value
                : option.defaultValue ?? '';
            return {
              id: typeof option.id === 'string' ? option.id : `config-option-${groupIndex}-${optionIndex}`,
              name: optionName,
              valueType,
              value: valueType === 'number' && value !== '' && Number.isFinite(Number(value))
                ? Number(value)
                : valueType === 'number' && value !== ''
                  ? ''
                  : String(value ?? ''),
            };
          }),
      };
    });
}

function normalizeConfigStyles(configStyles) {
  if (!Array.isArray(configStyles)) return [];
  return configStyles
    .filter((group) => group && typeof group === 'object' && !Array.isArray(group))
    .map((group, groupIndex) => ({
      id: typeof group.id === 'string' ? group.id : `config-style-${groupIndex}`,
      name: typeof group.name === 'string' ? group.name : `Style Group ${groupIndex + 1}`,
      selectorType: group.selectorType === 'id' ? 'id' : 'class',
      selector: typeof group.selector === 'string' ? group.selector.replace(/^[.#]/, '') : '',
      options: (Array.isArray(group.options) ? group.options : [])
        .filter((option) => option && typeof option === 'object' && !Array.isArray(option))
        .map((option, optionIndex) => ({
          id: typeof option.id === 'string' ? option.id : `config-style-option-${groupIndex}-${optionIndex}`,
          property: typeof option.property === 'string' ? option.property : '',
          value: typeof option.value === 'string' || typeof option.value === 'number' ? String(option.value) : '',
        })),
    }));
}

function configGroupFromGroups(groups) {
  return Object.fromEntries(groups.map((group) => [
    group.name,
    Object.fromEntries(group.options.map((option) => [
      option.name,
      option.valueType === 'number' && option.value !== '' ? Number(option.value) : option.value,
    ])),
  ]));
}

export function normalizeThemeConfig(config) {
  if (!config || typeof config !== 'object' || Array.isArray(config)) {
    return JSON.parse(JSON.stringify(DEFAULT_THEME_TOKENS));
  }

  const typography = asRecord(config.typography);
  const groups = normalizeConfigGroups(config.configGroups, config.configGroup);
  const configWithoutLegacyColors = { ...config };
  delete configWithoutLegacyColors.customColors;
  return {
    ...configWithoutLegacyColors,
    colors: normalizeColors(config),
    typography: {
      ...DEFAULT_THEME_TOKENS.typography,
      ...typography,
      fonts: {
        ...DEFAULT_THEME_TOKENS.typography.fonts,
        ...asRecord(typography.fonts),
        primary: asRecord(typography.fonts).primary || typography.fontFamily || 'Inter',
      },
      sizes: {
        ...DEFAULT_THEME_TOKENS.typography.sizes,
        ...asRecord(typography.sizes),
      },
      weights: Array.isArray(typography.weights) ? typography.weights : DEFAULT_THEME_TOKENS.typography.weights,
      fontWeights: {
        ...DEFAULT_THEME_TOKENS.typography.fontWeights,
        ...asRecord(typography.fontWeights),
      },
      textStyles: Object.fromEntries(Object.entries(DEFAULT_THEME_TOKENS.typography.textStyles).map(([key, defaults]) => [
        key,
        { ...defaults, ...asRecord(asRecord(typography.textStyles)[key]) },
      ])),
      customTokens: { ...asRecord(typography.customTokens) },
    },
    spacing: { ...DEFAULT_THEME_TOKENS.spacing, ...asRecord(config.spacing) },
    borderRadius: { ...DEFAULT_THEME_TOKENS.borderRadius, ...asRecord(config.borderRadius) },
    configGroups: groups,
    configGroup: configGroupFromGroups(groups),
    configStyles: normalizeConfigStyles(config.configStyles),
  };
}

const isSafeCssDeclaration = (property, value) =>
  /^(?:--[a-z][a-z0-9_-]*|-?[a-z][a-z0-9-]*)$/i.test(String(property || ''))
  && String(value ?? '').trim() !== ''
  && !/[;{}<>\\\r\n]/.test(String(value));

export function tokensToCssRules(tokens, scope = '') {
  const styles = normalizeThemeConfig(tokens).configStyles;
  return styles
    .filter((group) => /^[A-Za-z_][A-Za-z0-9_-]*$/.test(group.selector))
    .map((group) => {
      const selector = `${group.selectorType === 'id' ? '#' : '.'}${group.selector}`;
      const scopedSelector = scope ? `${scope} ${selector}` : selector;
      const declarations = group.options
        .filter((option) => isSafeCssDeclaration(option.property, option.value))
        .map((option) => `  ${option.property}: ${option.value};`);
      return declarations.length ? `${scopedSelector} {\n${declarations.join('\n')}\n}` : '';
    })
    .filter(Boolean)
    .join('\n\n');
}

export function tokensToCssVars(tokens) {
  const normalized = normalizeThemeConfig(tokens);
  const primaryFont = normalized.typography.fonts.primary || normalized.typography.fontFamily || 'Inter';
  const headingFont = normalized.typography.fonts.heading || primaryFont;
  const bodyFont = normalized.typography.fonts.body || primaryFont;
  const buttonFont = normalized.typography.fonts.button || primaryFont;

  const vars = {
    '--theme-primary': normalized.colors.primary,
    '--theme-secondary': normalized.colors.secondary,
    '--theme-bg': normalized.colors.background,
    '--theme-background': normalized.colors.background,
    '--theme-surface': normalized.colors.surface,
    '--theme-text': normalized.colors.text,
    '--theme-text-muted': normalized.colors.textMuted,
    '--theme-border': normalized.colors.border,
    '--theme-font': `'${primaryFont}', sans-serif`,
    '--theme-font-heading': `'${headingFont}', sans-serif`,
    '--theme-font-body': `'${bodyFont}', sans-serif`,
    '--theme-font-button': `'${buttonFont}', sans-serif`,
    '--theme-radius-none': normalized.borderRadius.none || '0px',
    '--theme-radius-xs': normalized.borderRadius.xs || '2px',
    '--theme-radius-sm': normalized.borderRadius.sm || '4px',
    '--theme-radius-md': normalized.borderRadius.md || '8px',
    '--theme-radius-lg': normalized.borderRadius.lg || '16px',
    '--theme-radius-xl': normalized.borderRadius.xl || '24px',
    '--theme-radius-full': normalized.borderRadius.full || '9999px',
    '--theme-space-none': normalized.spacing.none || '0px',
    '--theme-space-base': normalized.spacing.base || '8px',
    '--theme-space-xs': normalized.spacing.xs || '4px',
    '--theme-space-sm': normalized.spacing.sm || '8px',
    '--theme-space-md': normalized.spacing.md || '16px',
    '--theme-space-lg': normalized.spacing.lg || '24px',
    '--theme-space-xl': normalized.spacing.xl || '32px',
    '--theme-space-2xl': normalized.spacing['2xl'] || '48px',
  };
  const normalizeKey = (key) => String(key)
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/[^a-zA-Z0-9-]+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase();

  Object.entries(normalized.colors).forEach(([key, value]) => {
    vars[`--theme-color-${normalizeKey(key)}`] = value;
  });
  Object.entries(normalized.spacing).forEach(([key, value]) => {
    vars[`--theme-space-${normalizeKey(key)}`] = value;
  });
  Object.entries(normalized.borderRadius).forEach(([key, value]) => {
    vars[`--theme-radius-${normalizeKey(key)}`] = value;
  });
  Object.entries(normalized.typography.sizes).forEach(([key, value]) => {
    vars[`--theme-font-size-${normalizeKey(key)}`] = value;
  });
  Object.entries(normalized.typography.fonts).forEach(([key, value]) => {
    vars[`--theme-font-${normalizeKey(key)}`] = `'${value}', sans-serif`;
  });
  Object.entries(normalized.typography.textStyles).forEach(([key, style]) => {
    const token = `--theme-text-${normalizeKey(key)}`;
    vars[`${token}-line-height`] = String(style.lineHeight);
    vars[`${token}-letter-spacing`] = style.letterSpacing;
    vars[`${token}-font-style`] = style.fontStyle;
    vars[`${token}-font-weight`] = String(style.fontWeight);
  });
  Object.entries(normalized.configGroup).forEach(([groupName, values]) => {
    Object.entries(values).forEach(([key, value]) => {
      const variable = `--theme-config-${normalizeKey(groupName)}-${normalizeKey(key)}`;
      vars[variable] = typeof value === 'number' ? String(value) : value;
    });
  });
  return vars;
}

export function tokensToCssString(tokens) {
  return Object.entries(tokensToCssVars(tokens))
    .map(([key, value]) => `  ${key}: ${value};`)
    .join('\n');
}

export function resolveColor(value, defaultToken = '') {
  if (!value) return defaultToken;
  if (typeof value === 'string' && value.startsWith('var(--theme-')) return value;
  const tokenMap = {
    primary: 'var(--theme-primary)',
    secondary: 'var(--theme-secondary)',
    background: 'var(--theme-bg)',
    bg: 'var(--theme-bg)',
    surface: 'var(--theme-surface)',
    text: 'var(--theme-text)',
    textMuted: 'var(--theme-text-muted)',
    border: 'var(--theme-border)',
    '#3b82f6': 'var(--theme-primary)',
    '#2563eb': 'var(--theme-primary)',
    '#111827': 'var(--theme-text)',
    '#374151': 'var(--theme-text)',
    '#0f172a': 'var(--theme-text)',
    '#6b7280': 'var(--theme-text-muted)',
    '#64748b': 'var(--theme-text-muted)',
    '#f8fafc': 'var(--theme-surface)',
    '#e2e8f0': 'var(--theme-border)',
  };
  if (tokenMap[value]) return tokenMap[value];
  return value;
}

export function resolveRadius(rounded, defaultToken = '') {
  if (!rounded) return defaultToken;
  if (typeof rounded === 'string' && (rounded.startsWith('var(--theme-') || rounded.endsWith('px') || rounded.endsWith('rem') || rounded.endsWith('%'))) {
    return rounded;
  }
  const radiusMap = {
    none: 'var(--theme-radius-none, 0px)',
    xs: 'var(--theme-radius-xs, 2px)',
    sm: 'var(--theme-radius-sm, 4px)',
    md: 'var(--theme-radius-md, 8px)',
    lg: 'var(--theme-radius-lg, 16px)',
    xl: 'var(--theme-radius-xl, 24px)',
    full: 'var(--theme-radius-full, 9999px)',
  };
  return radiusMap[rounded] || defaultToken;
}
