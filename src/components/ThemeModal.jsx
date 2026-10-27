import { useState, useEffect } from 'react';
import {
  X,
  Palette,
  Type,
  Maximize2,
  Box,
  Plus,
  Copy,
  Trash2,
  Check,
  Save,
} from 'lucide-react';
import useBuilderStore from '../store/builderStore';
import GOOGLE_FONTS from '../utils/googleFonts';
import { loadGoogleFont } from '../utils/loadGoogleFont';
import { THEME_PRESETS, normalizeThemeConfig } from '../utils/themeDefaults';
import FontUpload from './FontUpload';

const TABS = [
  { id: 'palette', label: 'Color Palette', Icon: Palette },
  { id: 'typography', label: 'Fonts & Text', Icon: Type },
  { id: 'spacing', label: 'Spacing', Icon: Maximize2 },
  { id: 'radius', label: 'Corner Radius', Icon: Box },
];

const COLOR_FIELDS = [
  { key: 'primary', label: 'Primary Brand Color', desc: 'Main color for buttons, active states, and highlights' },
  { key: 'secondary', label: 'Secondary Accent Color', desc: 'Supporting accent color for badges, chips, and secondary elements' },
  { key: 'background', label: 'Page Background', desc: 'Main background color for the page and canvas' },
  { key: 'surface', label: 'Card & Surface', desc: 'Background color for cards, panels, and modals' },
  { key: 'text', label: 'Main Text', desc: 'Primary color for headings and body content' },
  { key: 'textMuted', label: 'Muted Text', desc: 'Color for subtitles, secondary text, and hints' },
  { key: 'border', label: 'Borders & Lines', desc: 'Color for outlines, dividing lines, and input borders' },
];

const FONT_SIZE_LABELS = {
  xs: 'Extra Small (XS)',
  sm: 'Small (SM)',
  base: 'Body / Base',
  lg: 'Large (LG)',
  xl: 'Extra Large (XL)',
  '2xl': '2X Large (2XL)',
  '3xl': '3X Large (3XL)',
  '4xl': 'Hero (4XL)',
};

const SPACING_LABELS = {
  xs: 'Extra Small (XS)',
  sm: 'Small (SM)',
  md: 'Medium (MD)',
  lg: 'Large (LG)',
  xl: 'Extra Large (XL)',
};

const RADIUS_LABELS = {
  none: 'Sharp (0px)',
  sm: 'Small Rounding',
  md: 'Medium Rounding',
  lg: 'Large Rounding',
  full: 'Pill / Full',
};

const FONT_WEIGHT_OPTIONS = [
  { label: 'Light', value: 300 },
  { label: 'Regular', value: 400 },
  { label: 'Medium', value: 500 },
  { label: 'Semibold', value: 600 },
  { label: 'Bold', value: 700 },
];

export default function ThemeModal({ onClose }) {
  const {
    activeTheme,
    availableThemes,
    isThemeModalOpen,
    themeModalInitialTab,
    closeThemeModal,
    selectTheme,
    createTheme,
    updateTheme,
    cloneTheme,
    deleteTheme,
    themeLoading,
    themeError,
    addCustomFont,
  } = useBuilderStore();

  const initialTheme =
    availableThemes.find((t) => t.id === activeTheme?.id) || activeTheme || THEME_PRESETS[0];
  const [activeTab, setActiveTab] = useState(themeModalInitialTab || 'palette');
  const [selectedThemeId, setSelectedThemeId] = useState(initialTheme?.id || 'preset-0');
  const [themeName, setThemeName] = useState(initialTheme?.name || 'Modern Blue');
  const [tokens, setTokens] = useState(() => normalizeThemeConfig(initialTheme?.configJson));
  const [isNewTheme, setIsNewTheme] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [localError, setLocalError] = useState(null);

  const handleSelectTheme = (theme) => {
    setIsNewTheme(false);
    setSelectedThemeId(theme.id);
    setThemeName(theme.name);
    setTokens(normalizeThemeConfig(theme.configJson));
    setLocalError(null);
  };

  // Load font dynamically if it's a google font
  useEffect(() => {
    if (tokens?.typography?.fontFamily) {
      loadGoogleFont(tokens.typography.fontFamily);
    }
  }, [tokens?.typography?.fontFamily]);

  if (!isThemeModalOpen && !onClose) return null;

  const handleClose = () => {
    setLocalError(null);
    setSaveSuccess(false);
    if (onClose) onClose();
    else closeThemeModal();
  };

  const updateColor = (key, val) => {
    setTokens((prev) => ({
      ...prev,
      colors: { ...prev.colors, [key]: val },
    }));
  };

  const updateTypography = (field, val) => {
    setTokens((prev) => ({
      ...prev,
      typography: { ...prev.typography, [field]: val },
    }));
  };

  const updateFontSize = (scaleKey, val) => {
    setTokens((prev) => ({
      ...prev,
      typography: {
        ...prev.typography,
        sizes: { ...prev.typography.sizes, [scaleKey]: val },
      },
    }));
  };

  const toggleWeight = (weight) => {
    setTokens((prev) => {
      const currentWeights = prev.typography.weights || [];
      const has = currentWeights.includes(weight);
      const next = has
        ? currentWeights.filter((w) => w !== weight)
        : [...currentWeights, weight].sort((a, b) => a - b);
      return {
        ...prev,
        typography: { ...prev.typography, weights: next },
      };
    });
  };

  const updateSpacing = (key, val) => {
    setTokens((prev) => ({
      ...prev,
      spacing: { ...prev.spacing, [key]: val },
    }));
  };

  const updateRadius = (key, val) => {
    setTokens((prev) => ({
      ...prev,
      borderRadius: { ...prev.borderRadius, [key]: val },
    }));
  };

  const applyPreset = (preset) => {
    setTokens(normalizeThemeConfig(preset.configJson));
    if (isNewTheme) {
      setThemeName(`${preset.name} Copy`);
    }
  };

  const handleSave = async (e) => {
    e?.preventDefault();
    setLocalError(null);
    setSaveSuccess(false);

    if (!themeName.trim()) {
      setLocalError('Please enter a theme name');
      return;
    }

    try {
      if (isNewTheme || String(selectedThemeId).startsWith('preset-')) {
        const created = await createTheme({
          name: themeName.trim(),
          configJson: tokens,
        });
        setSelectedThemeId(created.id);
        setThemeName(created.name);
        setTokens(normalizeThemeConfig(created.configJson));
        setIsNewTheme(false);
      } else {
        await updateTheme(selectedThemeId, {
          name: themeName.trim(),
          configJson: tokens,
        });
      }
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    } catch (err) {
      setLocalError(err.message || 'Failed to save theme');
    }
  };

  const handleStartNew = () => {
    setIsNewTheme(true);
    setSelectedThemeId('new');
    setThemeName('My Custom Theme');
    setTokens(normalizeThemeConfig(activeTheme?.configJson || THEME_PRESETS[0].configJson));
    setLocalError(null);
  };

  const handleCustomFontUpload = (file) => {
    const fontName = file.name.replace(/\.[^/.]+$/, '');
    const fontUrl = URL.createObjectURL(file);
    const fontFace = new FontFace(fontName, `url(${fontUrl})`);

    fontFace.load().then((loadedFace) => {
      document.fonts.add(loadedFace);
      addCustomFont({ name: fontName, url: fontUrl });
      updateTypography('fontFamily', fontName);
      updateTypography('fontSource', 'custom');
    });
  };

  const handleCloneTheme = async (themeId) => {
    try {
      const cloned = await cloneTheme(themeId);
      if (cloned) {
        handleSelectTheme(cloned);
      }
    } catch (err) {
      setLocalError(err.message || 'Failed to clone theme');
    }
  };

  const handleDeleteTheme = async (theme) => {
    if (confirm(`Delete theme "${theme.name}"?`)) {
      try {
        await deleteTheme(theme.id);
        const remaining = availableThemes.filter((t) => t.id !== theme.id);
        if (remaining.length > 0) {
          handleSelectTheme(remaining[0]);
        }
      } catch (err) {
        setLocalError(err.message || 'Failed to delete theme');
      }
    }
  };

  const isPreset = String(selectedThemeId).startsWith('preset-');
  const displayedError = localError || themeError;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-[fadeIn_0.15s_ease]">
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-5xl h-[88vh] flex flex-col overflow-hidden">
        {/* Top Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between shrink-0 bg-gray-50/60">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-xs">
              <Palette size={18} />
            </div>
            <div>
              <h2 className="text-base font-semibold text-gray-900 leading-tight">
                Theme Studio
              </h2>
              <p className="text-xs text-gray-500">
                Manage themes and customize design styles.
              </p>
            </div>
          </div>

          <button
            onClick={handleClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Error / Success Toast Banner */}
        {displayedError && (
          <div className="px-6 py-2 bg-red-50 border-b border-red-200 text-xs text-red-700 flex items-center justify-between">
            <span>{displayedError}</span>
            <button onClick={() => setLocalError(null)} className="font-bold">×</button>
          </div>
        )}
        {saveSuccess && (
          <div className="px-6 py-2 bg-emerald-50 border-b border-emerald-200 text-xs text-emerald-700 flex items-center gap-1.5">
            <Check size={14} /> Theme saved and applied to canvas successfully!
          </div>
        )}

        {/* Main Body */}
        <div className="flex-1 min-h-0 flex overflow-hidden">
          {/* Left Sidebar - Theme List */}
          <aside className="w-64 border-r border-gray-200 bg-gray-50/40 flex flex-col shrink-0">
            <div className="p-3 border-b border-gray-200 flex items-center justify-between">
              <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                Themes ({availableThemes.length})
              </span>
              <button
                onClick={handleStartNew}
                className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors"
              >
                <Plus size={13} /> New Theme
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {availableThemes.map((theme) => {
                const isSelected = !isNewTheme && theme.id === selectedThemeId;
                const isCurrentlyActive = theme.id === activeTheme?.id;
                const c = theme.configJson?.colors || {};

                return (
                  <div
                    key={theme.id}
                    onClick={() => handleSelectTheme(theme)}
                    className={`group relative flex items-center justify-between p-2.5 rounded-xl text-xs cursor-pointer transition-all border
                      ${isSelected
                        ? 'bg-white border-blue-200 shadow-xs ring-1 ring-blue-500/20'
                        : 'border-transparent hover:bg-white/80 hover:border-gray-200'}`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      {/* Swatch dots */}
                      <div className="flex items-center -space-x-1 shrink-0">
                        <span
                          className="w-3.5 h-3.5 rounded-full border border-white shadow-2xs"
                          style={{ backgroundColor: c.primary || '#2563eb' }}
                        />
                        <span
                          className="w-3.5 h-3.5 rounded-full border border-white shadow-2xs"
                          style={{ backgroundColor: c.secondary || '#7c3aed' }}
                        />
                      </div>

                      <div className="truncate">
                        <div className="flex items-center gap-1">
                          <span className={`truncate font-medium ${isSelected ? 'text-blue-900' : 'text-gray-800'}`}>
                            {theme.name}
                          </span>
                        </div>
                        <span className="text-[10px] text-gray-400">
                          {theme._count?.pages ? `${theme._count.pages} page(s)` : '0 pages'}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 shrink-0">
                      {isCurrentlyActive && (
                        <span className="px-1.5 py-0.5 text-[9px] font-semibold bg-blue-100 text-blue-700 rounded-full">
                          Active
                        </span>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCloneTheme(theme.id);
                        }}
                        title="Duplicate theme"
                        className="p-1 rounded text-gray-400 hover:text-gray-700 hover:bg-gray-100 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Copy size={12} />
                      </button>
                      {!String(theme.id).startsWith('preset-') && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteTheme(theme);
                          }}
                          title="Delete theme"
                          className="p-1 rounded text-gray-400 hover:text-red-600 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 size={12} />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}

              {isNewTheme && (
                <div className="p-2.5 rounded-xl text-xs bg-blue-50 border border-blue-300 shadow-xs flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-blue-600 animate-pulse" />
                    <span className="font-semibold text-blue-900 truncate">
                      {themeName || 'New Theme'}
                    </span>
                  </div>
                  <span className="text-[10px] text-blue-600 font-medium uppercase">Creating</span>
                </div>
              )}
            </div>

            {/* Presets Quick Picker */}
            <div className="p-3 border-t border-gray-200 bg-white">
              <span className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">
                Starter Presets
              </span>
              <div className="grid grid-cols-2 gap-1.5">
                {THEME_PRESETS.map((preset) => (
                  <button
                    key={preset.name}
                    type="button"
                    onClick={() => applyPreset(preset)}
                    className="flex items-center gap-1.5 p-1.5 rounded-lg border border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-[11px] text-gray-700 text-left transition-colors"
                  >
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: preset.configJson.colors.primary }}
                    />
                    <span className="truncate">{preset.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </aside>

          {/* Right Area - Configurator */}
          <main className="flex-1 flex flex-col min-w-0 bg-white">
            {/* Top Toolbar / Theme Meta Bar */}
            <div className="px-6 py-3 border-b border-gray-200 flex flex-wrap items-center justify-between gap-3 bg-white shrink-0">
              <div className="flex items-center gap-3 flex-1 min-w-[200px]">
                <input
                  type="text"
                  value={themeName}
                  onChange={(e) => setThemeName(e.target.value)}
                  placeholder="Theme Name"
                  className="font-semibold text-gray-900 text-sm px-2.5 py-1.5 border border-gray-200 rounded-lg hover:border-gray-300 focus:border-blue-500 focus:outline-hidden w-full max-w-xs transition-colors"
                />
                {isPreset && (
                  <span className="text-[11px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200 shrink-0">
                    Starter Preset (edits save as a new theme)
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => selectTheme(selectedThemeId)}
                  disabled={isNewTheme}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 bg-white hover:bg-gray-50 border border-gray-200 rounded-lg transition-colors disabled:opacity-40"
                >
                  <Check size={13} className="text-blue-600" />
                  Apply to Canvas
                </button>

                <button
                  type="button"
                  onClick={handleSave}
                  disabled={themeLoading}
                  className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-xs disabled:opacity-50"
                >
                  <Save size={13} />
                  {isNewTheme || isPreset ? 'Save as New' : 'Save Changes'}
                </button>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="px-6 border-b border-gray-200 flex items-center gap-1 bg-gray-50/50 shrink-0">
              {TABS.map(({ id, label, Icon }) => {
                const isActive = activeTab === id;
                return (
                  <button
                    key={id}
                    onClick={() => setActiveTab(id)}
                    className={`flex items-center gap-2 px-3.5 py-2.5 text-xs font-medium border-b-2 transition-all
                      ${isActive
                        ? 'border-blue-600 text-blue-600 bg-white shadow-2xs'
                        : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-200'}`}
                  >
                    <Icon size={14} />
                    {label}
                  </button>
                );
              })}
            </div>

            {/* Configurator Content & Live Preview Split */}
            <div className="flex-1 min-h-0 flex overflow-hidden">
              {/* Form Controls Column */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* TAB 1: COLOR PALETTE */}
                {activeTab === 'palette' && (
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900">Color Palette</h3>
                      <p className="text-xs text-gray-500">
                        Customize brand colors, surfaces, backgrounds, and text.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {COLOR_FIELDS.map(({ key, label, desc }) => (
                        <div
                          key={key}
                          className="p-3 rounded-xl border border-gray-200 bg-gray-50/40 hover:bg-white hover:border-gray-300 transition-colors min-w-0 overflow-hidden"
                        >
                          <div className="flex items-center justify-between mb-1.5 min-w-0">
                            <label className="text-xs font-semibold text-gray-800 truncate mr-2">{label}</label>
                            <span className="text-[10px] font-mono text-gray-400 uppercase shrink-0">
                              {tokens.colors[key]}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 min-w-0">
                            <div className="relative w-8 h-8 shrink-0 rounded-lg overflow-hidden border border-gray-300 shadow-2xs">
                              <input
                                type="color"
                                value={tokens.colors[key] || '#000000'}
                                onChange={(e) => updateColor(key, e.target.value)}
                                className="absolute -inset-2 w-12 h-12 cursor-pointer border-0 p-0"
                              />
                            </div>
                            <input
                              type="text"
                              value={tokens.colors[key] || ''}
                              maxLength={7}
                              onChange={(e) => updateColor(key, e.target.value)}
                              placeholder="#000000"
                              className="w-full min-w-0 flex-1 px-2.5 py-1 text-xs font-mono border border-gray-200 rounded-lg focus:border-blue-500 focus:outline-hidden"
                            />
                          </div>

                          <p className="mt-1 text-[10px] text-gray-500 truncate">{desc}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* TAB 2: TYPOGRAPHY */}
                {activeTab === 'typography' && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900">Fonts & Text Sizes</h3>
                      <p className="text-xs text-gray-500">
                        Choose your font family, customize font sizes, and select font weights.
                      </p>
                    </div>

                    {/* Font Family Picker */}
                    <div className="p-4 rounded-xl border border-gray-200 bg-gray-50/50 space-y-3">
                      <label className="text-xs font-semibold text-gray-800 block">
                        Font Family
                      </label>

                      <div className="flex gap-2">
                        <select
                          value={tokens.typography.fontFamily}
                          onChange={(e) => updateTypography('fontFamily', e.target.value)}
                          className="flex-1 px-3 py-2 text-xs border border-gray-200 rounded-lg bg-white focus:border-blue-500 focus:outline-hidden"
                        >
                          {GOOGLE_FONTS.map((font) => (
                            <option key={font.value} value={font.value}>
                              {font.label} (Google Font)
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="pt-2">
                        <span className="text-[11px] font-medium text-gray-600 block mb-1">
                          Or upload custom font:
                        </span>
                        <FontUpload onFontUpload={handleCustomFontUpload} />
                      </div>
                    </div>

                    {/* Font Weights */}
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-gray-800 block">
                        Font Weights
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {FONT_WEIGHT_OPTIONS.map(({ label, value }) => {
                          const isChecked = (tokens.typography.weights || []).includes(value);
                          return (
                            <button
                              key={value}
                              type="button"
                              onClick={() => toggleWeight(value)}
                              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors
                                ${isChecked
                                  ? 'bg-blue-50 border-blue-300 text-blue-700 shadow-2xs'
                                  : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                            >
                              {label} ({value})
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Size Scales */}
                    <div className="space-y-3">
                      <label className="text-xs font-semibold text-gray-800 block">
                        Font Sizes
                      </label>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                        {Object.entries(tokens.typography.sizes || {}).map(([scaleKey, val]) => (
                          <div key={scaleKey} className="p-2.5 rounded-lg border border-gray-200 bg-white min-w-0">
                            <span className="text-[10px] font-semibold text-gray-600 block mb-1 truncate" title={FONT_SIZE_LABELS[scaleKey] || scaleKey.toUpperCase()}>
                              {FONT_SIZE_LABELS[scaleKey] || scaleKey.toUpperCase()}
                            </span>
                            <input
                              type="text"
                              value={val}
                              onChange={(e) => updateFontSize(scaleKey, e.target.value)}
                              className="w-full min-w-0 px-2 py-1 text-xs border border-gray-200 rounded-md focus:border-blue-500 focus:outline-hidden font-mono"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 3: SPACING SCALE */}
                {activeTab === 'spacing' && (
                  <div className="space-y-5">
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900">Spacing & Layout</h3>
                      <p className="text-xs text-gray-500">
                        Adjust spacing values for margins, container padding, and gaps between elements.
                      </p>
                    </div>

                    <div className="space-y-3">
                      {Object.entries(tokens.spacing || {}).map(([key, val]) => (
                        <div
                          key={key}
                          className="flex items-center gap-4 p-3 rounded-xl border border-gray-200 bg-white hover:border-gray-300 transition-colors min-w-0"
                        >
                          <div className="w-28 font-medium text-xs text-gray-700 shrink-0">
                            {SPACING_LABELS[key] || key.toUpperCase()}
                          </div>

                          <div className="w-28 min-w-0 shrink-0">
                            <input
                              type="text"
                              value={val}
                              onChange={(e) => updateSpacing(key, e.target.value)}
                              className="w-full min-w-0 px-2.5 py-1 text-xs font-mono border border-gray-200 rounded-lg focus:border-blue-500 focus:outline-hidden"
                            />
                          </div>

                          {/* Visual Indicator Bar */}
                          <div className="flex-1 bg-gray-100 rounded-md h-5 p-1 flex items-center overflow-hidden min-w-0">
                            <div
                              className="h-full bg-blue-500 rounded-xs transition-all duration-150"
                              style={{ width: val }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* TAB 4: BORDER RADIUS */}
                {activeTab === 'radius' && (
                  <div className="space-y-5">
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900">Corner Radius</h3>
                      <p className="text-xs text-gray-500">
                        Adjust corner roundness for buttons, cards, badges, and input fields.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                      {Object.entries(tokens.borderRadius || {}).map(([key, val]) => (
                        <div
                          key={key}
                          className="p-4 rounded-xl border border-gray-200 bg-white flex flex-col items-center text-center gap-3 min-w-0"
                        >
                          <span className="text-xs font-semibold text-gray-700">
                            {RADIUS_LABELS[key] || key.toUpperCase()}
                          </span>

                          {/* Shape visualizer */}
                          <div
                            className="w-16 h-16 bg-blue-100 border-2 border-blue-500 transition-all duration-150 flex items-center justify-center text-[10px] text-blue-700 font-mono"
                            style={{ borderRadius: val }}
                          >
                            {val}
                          </div>

                          <input
                            type="text"
                            value={val}
                            onChange={(e) => updateRadius(key, e.target.value)}
                            className="w-full min-w-0 px-2 py-1 text-xs text-center font-mono border border-gray-200 rounded-lg focus:border-blue-500 focus:outline-hidden"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Live Interactive Preview Card Sidebar */}
              <div className="w-80 border-l border-gray-200 bg-gray-50/50 p-5 flex flex-col overflow-y-auto shrink-0">
                <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-3">
                  Live Style Preview
                </span>

                <div
                  className="p-4 rounded-xl shadow-xs border transition-all space-y-4"
                  style={{
                    backgroundColor: tokens.colors.background,
                    borderColor: tokens.colors.border,
                    fontFamily: `'${tokens.typography.fontFamily}', sans-serif`,
                    color: tokens.colors.text,
                  }}
                >
                  {/* Card Header */}
                  <div>
                    <h4
                      className="font-bold leading-tight"
                      style={{
                        fontSize: tokens.typography.sizes['xl'],
                        color: tokens.colors.text,
                      }}
                    >
                      Theme Preview
                    </h4>
                    <p
                      className="mt-0.5"
                      style={{
                        fontSize: tokens.typography.sizes['xs'],
                        color: tokens.colors.textMuted,
                      }}
                    >
                      Real-time style preview
                    </p>
                  </div>

                  {/* Surface Box */}
                  <div
                    className="p-3 border transition-all"
                    style={{
                      backgroundColor: tokens.colors.surface,
                      borderColor: tokens.colors.border,
                      borderRadius: tokens.borderRadius.md,
                    }}
                  >
                    <span
                      className="block font-medium"
                      style={{
                        fontSize: tokens.typography.sizes['sm'],
                        color: tokens.colors.text,
                      }}
                    >
                      Content Card
                    </span>
                    <span
                      className="block mt-1"
                      style={{
                        fontSize: tokens.typography.sizes['xs'],
                        color: tokens.colors.textMuted,
                      }}
                    >
                      Nested box styled with your chosen colors and border roundness.
                    </span>
                  </div>

                  {/* Buttons */}
                  <div className="space-y-2">
                    <button
                      type="button"
                      className="w-full py-2 px-3 font-medium transition-all shadow-2xs"
                      style={{
                        backgroundColor: tokens.colors.primary,
                        color: '#ffffff',
                        borderRadius: tokens.borderRadius.md,
                        fontSize: tokens.typography.sizes['sm'],
                      }}
                    >
                      Primary Button
                    </button>

                    <button
                      type="button"
                      className="w-full py-2 px-3 font-medium transition-all"
                      style={{
                        backgroundColor: tokens.colors.secondary,
                        color: '#ffffff',
                        borderRadius: tokens.borderRadius.md,
                        fontSize: tokens.typography.sizes['sm'],
                      }}
                    >
                      Secondary Button
                    </button>
                  </div>

                  {/* Sample Input */}
                  <div>
                    <label
                      className="block mb-1 text-[11px] font-medium"
                      style={{ color: tokens.colors.textMuted }}
                    >
                      Sample Input Field
                    </label>
                    <input
                      type="text"
                      disabled
                      value="Sample input text"
                      className="w-full px-2.5 py-1.5 border text-xs"
                      style={{
                        backgroundColor: tokens.colors.background,
                        borderColor: tokens.colors.border,
                        borderRadius: tokens.borderRadius.sm,
                        color: tokens.colors.text,
                      }}
                    />
                  </div>
                </div>

                <div className="mt-4 p-3 rounded-lg bg-blue-50/70 border border-blue-100 text-[11px] text-blue-800 leading-relaxed">
                  💡 <strong>Tip:</strong> Saving this theme updates it across your project and automatically applies all styles to the canvas.
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
