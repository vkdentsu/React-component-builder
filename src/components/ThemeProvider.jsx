/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useMemo, useEffect } from 'react';
import useBuilderStore from '../store/builderStore';
import { tokensToCssRules, tokensToCssVars } from '../utils/themeDefaults';
import { loadGoogleFont } from '../utils/loadGoogleFont';

const ThemeContext = createContext({
  theme: null,
  tokens: null,
  themeVars: {},
});

export function useTheme() {
  return useContext(ThemeContext);
}

export default function ThemeProvider({
  children,
  theme: explicitTheme,
  className = '',
  style = {},
  as: Component = 'div',
  scope = '',
}) {
  const storeTheme = useBuilderStore((s) => s.activeTheme);
  const theme = explicitTheme || storeTheme;

  const themeVars = useMemo(() => {
    return tokensToCssVars(theme?.configJson);
  }, [theme]);

  const themeRules = useMemo(() => {
    return tokensToCssRules(theme?.configJson, scope);
  }, [theme, scope]);

  useEffect(() => {
    const typography = theme?.configJson?.typography;
    if (!typography) return;

    const fontsToLoad = new Set([
      typography.fontFamily,
      typography.fonts?.primary,
      typography.fonts?.heading,
      typography.fonts?.body,
      typography.fonts?.button,
    ].filter(Boolean));

    fontsToLoad.forEach((font) => {
      loadGoogleFont(font);
    });
  }, [theme?.configJson?.typography]);

  const contextValue = useMemo(() => ({
    theme,
    tokens: theme?.configJson,
    themeVars,
  }), [theme, themeVars]);

  return (
    <ThemeContext.Provider value={contextValue}>
      <Component
        className={`theme-provider ${className}`}
        style={{
          fontFamily: themeVars['--theme-font'] || 'inherit',
          ...themeVars,
          ...style,
        }}
      >
        {themeRules && <style>{themeRules}</style>}
        {children}
      </Component>
    </ThemeContext.Provider>
  );
}
