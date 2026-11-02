import { createContext, useContext } from 'react';

export const ThemeContext = createContext({
  activeTheme: null,
  tokens: null,
  themeVars: {},
  selectTheme: () => {},
  availableThemes: [],
});

export const useTheme = () => useContext(ThemeContext);
