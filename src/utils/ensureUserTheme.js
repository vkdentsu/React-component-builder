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

export async function ensureUserTheme() {
  const themes = await fetchUserThemes();
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
