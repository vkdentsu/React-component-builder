import { useEffect, useMemo } from 'react';
import useBuilderStore from '../store/builderStore';
import {
  tokensToCssVars,
  normalizeThemeConfig,
  THEME_COLOR_TOKENS,
} from '../utils/themeDefaults';
import { loadGoogleFont } from '../utils/loadGoogleFont';
import { ThemeContext } from '../context/ThemeContext';

/**
 * ThemeProvider
 * Injects the active theme design tokens as dynamic CSS variables
 * (e.g., --theme-primary, --theme-font-heading, --theme-text, etc.)
 * both globally onto document.documentElement (:root) and on its wrapper element.
 * Also automatically loads any required Google Fonts when typography changes.
 */
export default function ThemeProvider({ children, theme, className = '', style = {} }) {
  const storeActiveTheme = useBuilderStore((state) => state.activeTheme);
  const selectTheme = useBuilderStore((state) => state.selectTheme);
  const availableThemes = useBuilderStore((state) => state.availableThemes);

  const currentTheme = theme || storeActiveTheme;
  const normalizedTokens = useMemo(
    () => normalizeThemeConfig(currentTheme?.configJson),
    [currentTheme?.configJson]
  );

  const themeVars = useMemo(
    () => tokensToCssVars(normalizedTokens),
    [normalizedTokens]
  );

  // Load Google Fonts whenever fonts in theme tokens change
  useEffect(() => {
    const fontsToLoad = [
      normalizedTokens?.typography?.fontFamily,
      normalizedTokens?.typography?.fontHeading,
      normalizedTokens?.typography?.fontBody,
    ].filter(Boolean);

    fontsToLoad.forEach((font) => {
      loadGoogleFont(font);
    });
  }, [
    normalizedTokens?.typography?.fontFamily,
    normalizedTokens?.typography?.fontHeading,
    normalizedTokens?.typography?.fontBody,
  ]);

  // Inject CSS variables globally to :root (document.documentElement) for dynamic global cascading
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;

    Object.entries(themeVars).forEach(([varName, value]) => {
      if (value !== undefined && value !== null) {
        root.style.setProperty(varName, String(value));
      }
    });

    // Also set theme dataset attribute for optional CSS scoping
    if (currentTheme?.slug) {
      root.dataset.theme = currentTheme.slug;
    }
  }, [themeVars, currentTheme?.slug]);

  const contextValue = useMemo(
    () => ({
      activeTheme: currentTheme,
      tokens: normalizedTokens,
      themeVars,
      selectTheme,
      availableThemes,
      colorTokens: THEME_COLOR_TOKENS,
    }),
    [currentTheme, normalizedTokens, themeVars, selectTheme, availableThemes]
  );

  return (
    <ThemeContext.Provider value={contextValue}>
      <div
        className={`theme-provider ${className}`}
        style={{
          fontFamily: 'var(--theme-font, inherit)',
          ...themeVars,
          ...style,
        }}
      >
        {children}
      </div>
    </ThemeContext.Provider>
  );
}
