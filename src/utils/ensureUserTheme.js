import { authenticatedFetch } from './api';
import { normalizeThemeConfig, THEME_PRESETS } from './themeDefaults';

async function fetchUserThemes() {
  const response = await authenticatedFetch('/api/themes');
  const result = await response.json();
  if (!response.ok) {
    throw new Error(result.error?.message || 'Failed to fetch themes.');
  }
  return result.data || [];
}

export async function ensureUserTheme(preferredTheme = null) {
  const themes = await fetchUserThemes();

  // If a valid existing database theme is preferred, return it
  if (preferredTheme?.id && !String(preferredTheme.id).startsWith('preset-')) {
    const match = themes.find((t) => t.id === preferredTheme.id);
    if (match) return match;
  }

  // If a preset theme is preferred, attempt to create/persist it as a custom theme
  if (preferredTheme && preferredTheme.configJson) {
    const existing = themes.find(
      (t) => t.name.toLowerCase() === preferredTheme.name.toLowerCase()
    );
    if (existing) return existing;

    try {
      const response = await authenticatedFetch('/api/themes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: preferredTheme.name,
          slug: preferredTheme.slug || `theme-${Date.now()}`,
          configJson: normalizeThemeConfig(preferredTheme.configJson),
        }),
      });
      const result = await response.json();
      if (response.ok && result.data?.id) return result.data;
    } catch {
      // Fall through to default theme resolution
    }
  }

  if (themes[0]?.id) return themes[0];

  const preset = THEME_PRESETS[0];
  const response = await authenticatedFetch('/api/themes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: preset.name,
      slug: preset.slug,
      configJson: normalizeThemeConfig(preset.configJson),
    }),
  });
  const result = await response.json();

  if (response.ok && result.data?.id) return result.data;
  if (response.status === 409) {
    const themesAfterConflict = await fetchUserThemes();
    if (themesAfterConflict[0]?.id) return themesAfterConflict[0];
  }

  throw new Error(result.error?.message || 'Failed to create a theme for this page.');
}

