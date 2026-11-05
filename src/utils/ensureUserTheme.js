import { authenticatedFetch } from './api';
import {
  normalizeThemeConfig,
  THEME_PRESETS,
  BUILT_IN_PRESET_THEMES,
} from './themeDefaults';
import useBuilderStore from '../store/builderStore';

async function fetchUserThemes() {
  const response = await authenticatedFetch('/api/themes');
  const result = await response.json();
  if (!response.ok) {
    throw new Error(result.error?.message || 'Failed to fetch themes.');
  }
  return result.data || [];
}

/**
 * Ensures a theme is persisted in the database for the current user.
 * If given a preset (or in-memory ID like preset-0), it creates/forks the preset for the current user,
 * updates the store, and returns the persisted Theme record with its database ID.
 *
 * @param {string|object} [presetOrTheme] - Theme object or themeId to ensure is persisted.
 * @returns {Promise<object>} The persisted database Theme record.
 */
export async function ensureUserTheme(presetOrTheme) {
  let target = null;
  const store = typeof useBuilderStore !== 'undefined' && useBuilderStore?.getState ? useBuilderStore.getState() : null;
  const storeThemes = store?.availableThemes || [];

  if (presetOrTheme && typeof presetOrTheme === 'object') {
    target = presetOrTheme;
  } else if (typeof presetOrTheme === 'string') {
    target = storeThemes.find((t) => t.id === presetOrTheme);
    if (!target) {
      const idxMatch = presetOrTheme.match(/^preset-(\d+)$/);
      if (idxMatch) {
        const idx = parseInt(idxMatch[1], 10);
        target = BUILT_IN_PRESET_THEMES[idx] || THEME_PRESETS[idx];
      }
    }
  }

  if (!target) {
    target = store?.activeTheme || BUILT_IN_PRESET_THEMES[0];
  }

  // If the target is ALREADY a persisted database theme (not a preset), return it!
  const isPreset = !target.id ||
    String(target.id).startsWith('preset-') ||
    Boolean(target.isPreset);

  if (!isPreset && target.id) {
    return target;
  }

  // Find corresponding preset data if configJson or name is missing
  let presetData = target;
  if (!presetData.name || !presetData.configJson) {
    const idxMatch = String(target.id || '').match(/^preset-(\d+)$/);
    const idx = idxMatch ? parseInt(idxMatch[1], 10) : 0;
    presetData = BUILT_IN_PRESET_THEMES[idx] || BUILT_IN_PRESET_THEMES[0];
  }

  const normalizedConfig = normalizeThemeConfig(presetData.configJson);

  // Check if user already has a persisted theme in the database matching this preset's slug or name
  const existingThemes = await fetchUserThemes();
  const existingMatch = existingThemes.find(
    (t) => t.slug === presetData.slug || t.name?.trim().toLowerCase() === presetData.name?.trim().toLowerCase()
  );

  if (existingMatch?.id) {
    const persisted = {
      ...existingMatch,
      configJson: normalizeThemeConfig(existingMatch.configJson),
      isPreset: false,
    };
    if (store?.availableThemes && !store.availableThemes.some((t) => t.id === persisted.id)) {
      useBuilderStore.setState((s) => ({
        availableThemes: [persisted, ...s.availableThemes],
      }));
    }
    return persisted;
  }

  // Otherwise, create/fork the preset theme for the current user in the database
  let slug = presetData.slug;
  if (!slug || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    slug = (presetData.name || 'theme')
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || 'theme';
  }

  let response = await authenticatedFetch('/api/themes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: presetData.name,
      slug,
      configJson: normalizedConfig,
    }),
  });
  let result = await response.json();

  if (response.ok && result.data?.id) {
    const persisted = {
      ...result.data,
      configJson: normalizeThemeConfig(result.data.configJson),
      isPreset: false,
    };
    if (store?.availableThemes) {
      useBuilderStore.setState((s) => ({
        availableThemes: [persisted, ...s.availableThemes.filter((t) => t.id !== persisted.id)],
      }));
    }
    return persisted;
  }

  // If conflict (409), check if the theme was created or find matching
  if (response.status === 409) {
    const themesAfterConflict = await fetchUserThemes();
    const conflictMatch = themesAfterConflict.find(
      (t) => t.slug === slug || t.name?.trim().toLowerCase() === presetData.name?.trim().toLowerCase()
    );
    if (conflictMatch?.id) {
      const persisted = {
        ...conflictMatch,
        configJson: normalizeThemeConfig(conflictMatch.configJson),
        isPreset: false,
      };
      if (store?.availableThemes && !store.availableThemes.some((t) => t.id === persisted.id)) {
        useBuilderStore.setState((s) => ({
          availableThemes: [persisted, ...s.availableThemes],
        }));
      }
      return persisted;
    }

    // Try creating with a disambiguated slug
    for (let attempt = 1; attempt <= 5; attempt += 1) {
      const altSlug = `${slug}-${attempt}`;
      response = await authenticatedFetch('/api/themes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `${presetData.name} ${attempt + 1}`,
          slug: altSlug,
          configJson: normalizedConfig,
        }),
      });
      result = await response.json();
      if (response.ok && result.data?.id) {
        const persisted = {
          ...result.data,
          configJson: normalizeThemeConfig(result.data.configJson),
          isPreset: false,
        };
        if (store?.availableThemes) {
          useBuilderStore.setState((s) => ({
            availableThemes: [persisted, ...s.availableThemes.filter((t) => t.id !== persisted.id)],
          }));
        }
        return persisted;
      }
    }
  }

  throw new Error(result.error?.message || 'Failed to create a theme for this page.');
}
