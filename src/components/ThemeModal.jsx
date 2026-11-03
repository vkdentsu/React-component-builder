import { useEffect, useState } from 'react';
import {
  Check,
  Copy,
  Download,
  Maximize2,
  Palette,
  RotateCcw,
  Save,
  Sliders,
  Type,
  Upload,
  X,
  Paintbrush,
  Plus,
} from 'lucide-react';
import useBuilderStore from '../store/builderStore';
import { loadGoogleFont } from '../utils/loadGoogleFont';
import { registerFont } from '../utils/fontLoader';
import { DEFAULT_THEME_TOKENS, THEME_PRESETS, normalizeThemeConfig } from '../utils/themeDefaults';
import ThemeEditorFields from './ThemeEditorFields';
import ThemePreview from './ThemePreview';

const TABS = [
  { id: 'palette', label: 'Color Palette', Icon: Palette },
  { id: 'typography', label: 'Fonts & Text', Icon: Type },
  { id: 'spacing', label: 'Spacing & Radius', Icon: Maximize2 },
  { id: 'config', label: 'Config Groups', Icon: Sliders },
  { id: 'styles', label: 'Config Styles', Icon: Paintbrush },
];

const slugify = (value) => value.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'theme';

function uniqueSlug(name, themes, excludeId) {
  const base = slugify(name);
  const used = new Set(themes
    .filter((theme) => theme.id !== excludeId && !String(theme.id).startsWith('preset-'))
    .map((theme) => theme.slug?.toLowerCase()));
  if (!used.has(base)) return base;
  let suffix = 2;
  while (used.has(`${base}-${suffix}`)) suffix += 1;
  return `${base}-${suffix}`;
}

function validateTheme(name, slug, tokens, themes, selectedId) {
  if (!name.trim()) return 'Project name is required.';
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) return 'Slug must use lowercase letters, numbers, and single hyphens only.';
  if (themes.some((theme) => theme.id !== selectedId && !String(theme.id).startsWith('preset-') && theme.slug?.toLowerCase() === slug.toLowerCase())) return 'This slug is already in use.';

  const invalidColor = Object.entries(tokens.colors).find(([, value]) => !/^#[0-9a-f]{6}$/i.test(value));
  if (invalidColor) return `Enter a valid HEX value for ${invalidColor[0]}.`;
  if (!Object.values(tokens.spacing).every((value) => /^-?(?:\d+\.?\d*|\.\d+)(?:px|rem|%)$/.test(String(value)))) return 'Spacing values must use px, rem, or % units.';
  if (!Object.values(tokens.borderRadius).every((value) => /^-?(?:\d+\.?\d*|\.\d+)(?:px|rem|em|%)$/.test(String(value)))) return 'Corner radii must use px, rem, em, or % units.';
  if (!Number.isFinite(Number(tokens.typography.lineHeight)) || Number(tokens.typography.lineHeight) <= 0) return 'Enter a positive line height.';
  if (!/^-?(?:\d+\.?\d*|\.\d+)(?:px|rem|em)$/.test(String(tokens.typography.letterSpacing))) return 'Letter spacing must use px, rem, or em units.';
  for (const [styleName, style] of Object.entries(tokens.typography.textStyles)) {
    if (!Number.isFinite(Number(style.lineHeight)) || Number(style.lineHeight) <= 0) return `Enter a positive line height for ${styleName}.`;
    if (!/^-?(?:\d+\.?\d*|\.\d+)(?:px|rem|em)$/.test(String(style.letterSpacing))) return `Letter spacing for ${styleName} must use px, rem, or em units.`;
    if (![100, 300, 400, 500, 600, 700, 800].includes(Number(style.fontWeight))) return `Select a valid font weight for ${styleName}.`;
    if (!['normal', 'italic', 'oblique'].includes(style.fontStyle)) return `Select a valid font style for ${styleName}.`;
  }

  const groupNames = new Set();
  for (const group of tokens.configGroups) {
    const normalizedName = group.name.trim().toLowerCase();
    if (!normalizedName) return 'Group name is required.';
    if (groupNames.has(normalizedName)) return `The group "${group.name}" already exists.`;
    groupNames.add(normalizedName);
    const optionNames = new Set();
    for (const option of group.options) {
      const optionName = option.name.trim();
      if (!/^[A-Za-z][A-Za-z0-9_-]*$/.test(optionName)) return `Enter a valid configuration key for "${option.name || 'unnamed option'}".`;
      if (optionNames.has(optionName.toLowerCase())) return `The option "${optionName}" already exists in "${group.name}".`;
      optionNames.add(optionName.toLowerCase());
      if (option.value === '' || option.value === null || option.value === undefined) return `A value is required for "${optionName}".`;
      if (option.valueType === 'number' && !Number.isFinite(Number(option.value))) return `Enter a valid number for "${optionName}".`;
      if (option.valueType === 'color' && !/^#[0-9a-f]{6}$/i.test(String(option.value))) return `Enter a valid HEX color for "${optionName}".`;
    }
  }
  const styleSelectors = new Set();
  for (const group of tokens.configStyles) {
    if (!group.name.trim()) return 'Style group name is required.';
    if (!/^[A-Za-z_][A-Za-z0-9_-]*$/.test(group.selector)) return `Enter a valid ${group.selectorType} name for "${group.name}".`;
    const selectorKey = `${group.selectorType}:${group.selector}`;
    if (styleSelectors.has(selectorKey)) return `The selector "${group.selector}" is already used by another style group.`;
    styleSelectors.add(selectorKey);
    for (const option of group.options) {
      if (!/^(?:--[a-z][a-z0-9_-]*|-?[a-z][a-z0-9-]*)$/i.test(option.property)) return `Enter a valid CSS property in "${group.name}".`;
      if (!String(option.value).trim() || /[;{}<>\\\r\n]/.test(String(option.value))) return `Enter a single CSS value for "${option.property}".`;
    }
  }
  return '';
}

export default function ThemeModal({ onClose, initialThemeId, onSaved }) {
  const {
    activeTheme,
    availableThemes,
    isThemeModalOpen,
    themeModalInitialTab,
    closeThemeModal,
    selectTheme,
    setDefaultTheme,
    applyThemeDraft,
    createTheme,
    updateTheme,
    cloneTheme,
    themeLoading,
    themeError,
    addCustomFont,
    customFonts,
  } = useBuilderStore();
  const creatingInitially = initialThemeId === 'new';
  const initialTheme = availableThemes.find((theme) => theme.id === initialThemeId)
    || availableThemes.find((theme) => theme.id === activeTheme?.id)
    || activeTheme
    || { id: 'preset-0', name: THEME_PRESETS[0].name, slug: THEME_PRESETS[0].slug, configJson: THEME_PRESETS[0].configJson };

  const [activeTab, setActiveTab] = useState(themeModalInitialTab || 'palette');
  const [selectedThemeId, setSelectedThemeId] = useState(creatingInitially ? 'new' : initialThemeId || initialTheme.id || 'preset-0');
  const [projectName, setProjectName] = useState(creatingInitially ? 'My Custom Theme' : initialTheme.name || 'Modern Blue');
  const [slugName, setSlugName] = useState(creatingInitially ? uniqueSlug('My Custom Theme', availableThemes) : initialTheme.slug || slugify(initialTheme.name || 'Modern Blue'));
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);
  const [description, setDescription] = useState(initialTheme.configJson?.description || '');
  const [tokens, setTokens] = useState(() => normalizeThemeConfig(creatingInitially ? DEFAULT_THEME_TOKENS : initialTheme.configJson));
  const [isNewTheme, setIsNewTheme] = useState(creatingInitially);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [localError, setLocalError] = useState('');

  useEffect(() => {
    const fonts = new Set([
      tokens.typography.fontFamily,
      ...Object.values(tokens.typography.fonts || {}),
    ]);
    const customNames = new Set((customFonts || []).map((font) => font.name));
    fonts.forEach((font) => {
      if (font && !customNames.has(font)) loadGoogleFont(font);
    });
  }, [tokens.typography, customFonts]);

  useEffect(() => {
    (customFonts || []).forEach((font) => {
      if (font.name && (font.url || font.sources?.length)) registerFont(font.name, font);
    });
  }, [customFonts]);

  if (!isThemeModalOpen && !onClose) return null;

  const handleClose = () => {
    setLocalError('');
    setSaveSuccess(false);
    if (onClose) onClose();
    else closeThemeModal();
  };

  const handleProjectNameChange = (value) => {
    setProjectName(value);
    if (isNewTheme && !slugManuallyEdited) setSlugName(uniqueSlug(value, availableThemes));
  };

  const handleStartNew = (config = DEFAULT_THEME_TOKENS, name = 'My Custom Theme') => {
    const nextName = name;
    setIsNewTheme(true);
    setSelectedThemeId('new');
    setProjectName(nextName);
    setSlugManuallyEdited(false);
    setSlugName(uniqueSlug(nextName, availableThemes));
    setDescription('');
    setTokens(normalizeThemeConfig(config));
    setLocalError('');
    setSaveSuccess(false);
  };

  const handleSelectPreset = (presetName) => {
    const preset = THEME_PRESETS.find((item) => item.name === presetName);
    if (preset) handleStartNew(preset.configJson, `${preset.name} Copy`);
  };

  const configForSave = () => normalizeThemeConfig({
    ...tokens,
    description: description.trim(),
  });

  const handleApply = () => {
    const config = configForSave();
    if (isNewTheme) {
      applyThemeDraft({
        id: 'draft-theme',
        name: projectName.trim() || 'Theme Draft',
        slug: slugName,
        configJson: config,
      });
    } else {
      selectTheme(selectedThemeId);
      setDefaultTheme(selectedThemeId);
      applyThemeDraft({
        id: selectedThemeId,
        name: projectName.trim(),
        slug: slugName,
        configJson: config,
      });
    }
    setSaveSuccess(true);
    window.setTimeout(() => setSaveSuccess(false), 2000);
  };

  const handleSave = async () => {
    setLocalError('');
    setSaveSuccess(false);
    const configJson = configForSave();
    const validationError = validateTheme(projectName, slugName, configJson, availableThemes, selectedThemeId);
    if (validationError) {
      setLocalError(validationError);
      return;
    }

    try {
      let savedTheme;
      if (isNewTheme || String(selectedThemeId).startsWith('preset-')) {
        savedTheme = await createTheme({ name: projectName.trim(), slug: slugName, configJson });
        setSelectedThemeId(savedTheme.id);
        setIsNewTheme(false);
      } else {
        savedTheme = await updateTheme(selectedThemeId, { name: projectName.trim(), slug: slugName, configJson });
      }
      if (savedTheme?.id) {
        selectTheme(savedTheme.id);
        setDefaultTheme(savedTheme.id);
      }
      setProjectName(savedTheme?.name || projectName.trim());
      setSlugName(savedTheme?.slug || slugName);
      setSlugManuallyEdited(false);
      setTokens(normalizeThemeConfig(savedTheme?.configJson || configJson));
      setDescription(savedTheme?.configJson?.description || description.trim());
      await onSaved?.();
      setSaveSuccess(true);
      window.setTimeout(() => setSaveSuccess(false), 2500);
    } catch (error) {
      setLocalError(error.message || 'Failed to save theme.');
    }
  };

  const handleReset = () => {
    if (isNewTheme) {
      handleStartNew(DEFAULT_THEME_TOKENS);
      return;
    }
    const source = availableThemes.find((theme) => theme.id === selectedThemeId) || initialTheme;
    setProjectName(source.name || 'Modern Blue');
    setSlugName(source.slug || slugify(source.name || 'Modern Blue'));
    setSlugManuallyEdited(false);
    setDescription(source.configJson?.description || '');
    setTokens(normalizeThemeConfig(source.configJson));
    setLocalError('');
    setSaveSuccess(false);
  };

  const handleDuplicate = async () => {
    const name = `${projectName.trim() || 'Theme'} Copy`;
    if (isNewTheme || String(selectedThemeId).startsWith('preset-')) {
      handleStartNew(configForSave(), name);
      return;
    }
    try {
      const duplicate = await cloneTheme(selectedThemeId, name);
      if (duplicate) {
        setIsNewTheme(false);
        setSelectedThemeId(duplicate.id);
        setProjectName(duplicate.name);
        setSlugName(duplicate.slug);
        setSlugManuallyEdited(false);
        setDescription(duplicate.configJson?.description || '');
        setTokens(normalizeThemeConfig(duplicate.configJson));
      }
    } catch (error) {
      setLocalError(error.message || 'Failed to duplicate theme.');
    }
  };

  const handleExport = () => {
    const data = {
      name: projectName,
      slug: slugName,
      configJson: configForSave(),
      customFonts: (customFonts || []).filter((font) =>
        [tokens.typography.fontFamily, ...Object.values(tokens.typography.fonts || {})].includes(font.name)),
    };
    const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }));
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${slugify(projectName)}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setLocalError('');
    try {
      const imported = JSON.parse(await file.text());
      const importedConfig = imported.configJson || imported;
      if (!importedConfig || typeof importedConfig !== 'object' || Array.isArray(importedConfig)) throw new Error('The selected file does not contain a valid theme configuration.');
      setTokens(normalizeThemeConfig(importedConfig));
      setProjectName(typeof imported.name === 'string' ? imported.name : projectName);
      setSlugName(typeof imported.slug === 'string' ? imported.slug.toLowerCase() : uniqueSlug(imported.name || projectName, availableThemes));
      setSlugManuallyEdited(typeof imported.slug === 'string');
      setDescription(typeof importedConfig.description === 'string' ? importedConfig.description : '');
      if (Array.isArray(imported.customFonts)) imported.customFonts.forEach((font) => {
        if (font && typeof font.name === 'string' && typeof font.url === 'string' && font.url.startsWith('data:')) addCustomFont(font);
      });
      setIsNewTheme(true);
      setSelectedThemeId('new');
    } catch (error) {
      setLocalError(error.message || 'Could not import this theme JSON.');
    } finally {
      event.target.value = '';
    }
  };

  const handleFontUpload = async (fontName, format, files) => {
    const safeFontName = fontName.replace(/[^a-zA-Z0-9 _-]/g, '').trim();
    const extensions = { woff2: '.woff2', woff: '.woff', truetype: '.ttf', opentype: '.otf' };
    const expectedExtension = extensions[format];
    if (!safeFontName) throw new Error('Font family names may contain letters, numbers, spaces, underscores, and hyphens.');
    if (!expectedExtension || !files.length) throw new Error('Select at least one supported font file.');
    const invalidFile = files.find((file) => !file.name.toLowerCase().endsWith(expectedExtension));
    if (invalidFile) throw new Error(`All selected files must use the ${expectedExtension} extension.`);
    try {
      const sources = await Promise.all(files.map((file) => new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve({ url: reader.result, format });
        reader.onerror = () => reject(new Error(`Could not read "${file.name}".`));
        reader.readAsDataURL(file);
      })));
      const face = await new FontFace(safeFontName, `url(${sources[0].url})`).load();
      document.fonts.add(face);
      const customFont = { name: safeFontName, url: sources[0].url, sources };
      addCustomFont(customFont);
      registerFont(safeFontName, customFont);
      setTokens((current) => ({
        ...current,
        typography: {
          ...current.typography,
          fontFamily: safeFontName,
          fontSource: 'custom',
          fonts: { ...current.typography.fonts, primary: safeFontName },
        },
      }));
    } catch (error) {
      setLocalError(error.message || 'Could not load the custom font.');
      throw error;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-2 backdrop-blur-xs animate-[fadeIn_0.15s_ease] sm:p-4">
      <div className="flex h-[96vh] w-full max-w-[1500px] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
        <header className="flex shrink-0 items-center justify-between border-b border-slate-200 bg-slate-50/60 px-5 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 text-white"><Palette size={17} /></div>
            <div>
              <h2 className="text-sm font-semibold text-slate-900">Theme Studio</h2>
              <p className="text-xs text-slate-500">Manage design tokens, color palette, typography & spacing.</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <select
              aria-label="Select Theme to Edit"
              value={isNewTheme ? 'new' : selectedThemeId}
              onChange={(e) => {
                const val = e.target.value;
                if (val === 'new') {
                  handleStartNew();
                } else {
                  const found = availableThemes.find((t) => t.id === val);
                  if (found) {
                    setIsNewTheme(false);
                    setSelectedThemeId(found.id);
                    setProjectName(found.name || 'Modern Blue');
                    setSlugName(found.slug || slugify(found.name || 'Modern Blue'));
                    setSlugManuallyEdited(false);
                    setDescription(found.configJson?.description || '');
                    setTokens(normalizeThemeConfig(found.configJson));
                    setLocalError('');
                    setSaveSuccess(false);
                  }
                }
              }}
              className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 max-w-[180px] truncate"
            >
              <option value="new">+ Create New Theme</option>
              <optgroup label="Available Themes">
                {availableThemes.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} {t.id === activeTheme?.id ? '(Active)' : ''}
                  </option>
                ))}
              </optgroup>
            </select>

            {!isNewTheme && (
              <button
                type="button"
                onClick={() => handleStartNew()}
                className="inline-flex items-center gap-1 rounded-lg border border-blue-200 bg-blue-50 px-2 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-100 transition-colors"
                title="Create a new theme"
              >
                <Plus size={13} />
                <span className="hidden sm:inline">New</span>
              </button>
            )}

            <button type="button" onClick={handleClose} aria-label="Close Theme Studio" className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 ml-1"><X size={18} /></button>
          </div>
        </header>

        {localError || themeError ? <div role="alert" className="flex items-center justify-between border-b border-rose-200 bg-rose-50 px-5 py-2 text-xs text-rose-700"><span>{localError || themeError}</span><button type="button" onClick={() => setLocalError('')}>×</button></div> : null}
        {saveSuccess && <div role="status" className="flex items-center gap-1.5 border-b border-emerald-200 bg-emerald-50 px-5 py-2 text-xs text-emerald-700"><Check size={14} /> Changes saved and applied to canvas.</div>}

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden lg:flex-row">
          <main className="flex min-h-0 min-w-0 flex-col overflow-hidden lg:w-[60%]">
            <div className="flex shrink-0 flex-col gap-3 border-b border-slate-200 bg-white p-4 sm:p-5">
              <div className="grid w-full min-w-0 gap-3 md:grid-cols-3">
                <label className="block space-y-1 text-[11px] font-medium text-slate-600"><span>Project Name</span><input value={projectName} onChange={(event) => handleProjectNameChange(event.target.value)} placeholder="Project name" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-900 focus:border-blue-500 focus:outline-none" /></label>
                <label className="block space-y-1 text-[11px] font-medium text-slate-600"><span>Slug Name</span><input value={slugName} onChange={(event) => { setSlugManuallyEdited(true); setSlugName(event.target.value.toLowerCase()); }} placeholder="project-name" className="w-full rounded-lg border border-slate-200 px-3 py-2 font-mono text-sm text-slate-800 focus:border-blue-500 focus:outline-none" /></label>
                <label className="block space-y-1 text-[11px] font-medium text-slate-600"><span>Description</span><input value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Optional project description" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-700 focus:border-blue-500 focus:outline-none" /></label>
                {isNewTheme && <label className="block space-y-1 text-[11px] font-medium text-slate-600 md:col-span-3"><span>Start from a preset</span><select defaultValue="" onChange={(event) => handleSelectPreset(event.target.value)} className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs focus:border-blue-500 focus:outline-none"><option value="">Keep current configuration</option>{THEME_PRESETS.map((preset) => <option key={preset.slug} value={preset.name}>{preset.name}</option>)}</select></label>}
              </div>
              <div className="flex w-full flex-wrap items-center justify-end gap-1.5 border-t border-slate-100 pt-3">
                <button type="button" onClick={handleReset} className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-2 text-[10px] font-medium text-slate-600 hover:bg-slate-50 sm:text-xs"><RotateCcw size={12} /> Reset</button>
                <button type="button" onClick={handleDuplicate} disabled={themeLoading} className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-2 text-[10px] font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50 sm:text-xs"><Copy size={12} /> Duplicate</button>
                <button type="button" onClick={handleExport} className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-2 text-[10px] font-medium text-slate-600 hover:bg-slate-50 sm:text-xs"><Download size={12} /> Export</button>
                <label className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-2 text-[10px] font-medium text-slate-600 hover:bg-slate-50 sm:text-xs"><Upload size={12} /> Import<input type="file" accept=".json,application/json" onChange={handleImport} className="sr-only" /></label>
                <button type="button" onClick={handleApply} className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-2 text-[10px] font-medium text-slate-700 hover:bg-slate-50 sm:text-xs"><Check size={12} className="text-blue-600" /> Apply to Canvas</button>
                <button type="button" onClick={handleSave} disabled={themeLoading} className="inline-flex items-center gap-1 rounded-lg bg-blue-600 px-3 py-2 text-[10px] font-semibold text-white hover:bg-blue-700 disabled:opacity-50 sm:text-xs"><Save size={12} />{themeLoading ? 'Saving…' : 'Save Changes'}</button>
              </div>
            </div>

            <nav aria-label="Theme configuration" className="flex shrink-0 overflow-x-auto border-b border-slate-200 bg-slate-50/60 px-3 sm:px-5">
              {TABS.map(({ id, label, Icon }) => <button key={id} type="button" aria-current={activeTab === id ? 'page' : undefined} onClick={() => setActiveTab(id)} className={`flex shrink-0 items-center gap-1.5 border-b-2 px-2.5 py-2.5 text-[10px] font-medium transition-colors sm:gap-2 sm:px-3.5 sm:text-xs ${activeTab === id ? 'border-blue-600 bg-white text-blue-600' : 'border-transparent text-slate-600 hover:text-slate-900'}`}><Icon size={14} />{label}</button>)}
            </nav>

            <section className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-5">
              <ThemeEditorFields activeTab={activeTab} tokens={tokens} onChange={setTokens} customFonts={customFonts} onFontUpload={handleFontUpload} />
            </section>
          </main>
          <ThemePreview tokens={tokens} />
        </div>
      </div>
    </div>
  );
}
