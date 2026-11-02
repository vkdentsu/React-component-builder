import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Palette,
  Type,
  Maximize2,
  Box,
  Plus,
  Copy,
  Trash2,
  Check,
  Save,
  Code2,
  RefreshCw,
  Search,
  ExternalLink,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  Layers,
  CheckCheck,
} from 'lucide-react';
import useBuilderStore from '../store/builderStore';
import GOOGLE_FONTS from '../utils/googleFonts';
import { loadGoogleFont } from '../utils/loadGoogleFont';
import {
  THEME_PRESETS,
  normalizeThemeConfig,
  tokensToCssString,
} from '../utils/themeDefaults';
import FontUpload from '../components/FontUpload';

const TABS = [
  { id: 'palette', label: 'Color Palette', Icon: Palette, description: 'Brand colors, canvas backgrounds, surfaces and text' },
  { id: 'typography', label: 'Typography', Icon: Type, description: 'Font families, weights, and responsive size scales' },
  { id: 'spacing', label: 'Spacing Scale', Icon: Maximize2, description: 'Layout padding, margins, and component gaps' },
  { id: 'radius', label: 'Border Radius', Icon: Box, description: 'Corner curvature for buttons, cards, and inputs' },
  { id: 'css', label: 'CSS Variables', Icon: Code2, description: 'Generated CSS tokens & export code' },
];

const COLOR_FIELDS = [
  {
    key: 'primary',
    label: 'Primary Accent',
    category: 'Brand',
    desc: 'Main brand color for primary CTA buttons, active states, and highlights',
  },
  {
    key: 'secondary',
    label: 'Secondary Accent',
    category: 'Brand',
    desc: 'Supporting accent color for chips, badges, secondary actions, and gradients',
  },
  {
    key: 'background',
    label: 'Page Background',
    category: 'Canvas',
    desc: 'Main canvas and document background behind all rows and elements',
  },
  {
    key: 'surface',
    label: 'Surface / Card',
    category: 'Canvas',
    desc: 'Container background for cards, modals, navigation bars, and panels',
  },
  {
    key: 'text',
    label: 'Main Text',
    category: 'Content',
    desc: 'Primary color for headings, titles, and body paragraph copy',
  },
  {
    key: 'textMuted',
    label: 'Muted Text',
    category: 'Content',
    desc: 'Secondary color for subtitles, placeholder hints, and captions',
  },
  {
    key: 'border',
    label: 'Border / Divider',
    category: 'Structure',
    desc: 'Color for card strokes, input outlines, and separator dividers',
  },
];

const FONT_SIZE_LABELS = {
  xs: { label: 'Extra Small (xs)', default: '12px', desc: 'Captions, badges, and microcopy' },
  sm: { label: 'Small (sm)', default: '14px', desc: 'Secondary body, helper text, and compact inputs' },
  base: { label: 'Base / Body (base)', default: '16px', desc: 'Standard body text and form labels' },
  lg: { label: 'Large (lg)', default: '18px', desc: 'Subheadings, card titles, and featured text' },
  xl: { label: 'Extra Large (xl)', default: '20px', desc: 'Section sub-titles and modal titles' },
  '2xl': { label: '2X Large (2xl)', default: '24px', desc: 'Section headings (H3)' },
  '3xl': { label: '3X Large (3xl)', default: '30px', desc: 'Page titles and major headlines (H2)' },
  '4xl': { label: 'Hero (4xl)', default: '36px', desc: 'Hero headlines and display banners (H1)' },
};

const FONT_WEIGHT_OPTIONS = [
  { label: 'Light', value: 300 },
  { label: 'Regular', value: 400 },
  { label: 'Medium', value: 500 },
  { label: 'Semibold', value: 600 },
  { label: 'Bold', value: 700 },
  { label: 'Extrabold', value: 800 },
];

const SPACING_LABELS = {
  none: { label: 'None', desc: '0px — reset spacing' },
  xs: { label: 'Extra Small (xs)', desc: 'Micro gap, badge padding, icon spacing' },
  sm: { label: 'Small (sm)', desc: 'Compact button padding, form input inner gap' },
  md: { label: 'Medium (md)', desc: 'Standard component spacing, card padding' },
  lg: { label: 'Large (lg)', desc: 'Section margins, container gutter' },
  xl: { label: 'Extra Large (xl)', desc: 'Section dividers, major component padding' },
  '2xl': { label: '2X Large (2xl)', desc: 'Hero section vertical rhythm and page gutters' },
};

const RADIUS_LABELS = {
  none: { label: 'Sharp (none)', desc: '0px — completely squared corners' },
  sm: { label: 'Small (sm)', desc: 'Subtle rounding for inputs, badges, and chips' },
  md: { label: 'Medium (md)', desc: 'Standard curve for buttons and interactive controls' },
  lg: { label: 'Large (lg)', desc: 'Prominent rounding for cards, dialogs, and containers' },
  full: { label: 'Pill / Full (full)', desc: '9999px — pill buttons and circular badges' },
};

export default function ConfigurationAndThemes({ themes: initialThemes = [], onRefresh }) {
  const navigate = useNavigate();
  const {
    activeTheme,
    availableThemes,
    selectTheme,
    createTheme,
    updateTheme,
    cloneTheme,
    deleteTheme,
    fetchThemes,
    addCustomFont,
  } = useBuilderStore();

  // Combine store availableThemes and initialThemes passed from dashboard
  const allThemes = useMemo(() => {
    const list = [...(initialThemes.length > 0 ? initialThemes : availableThemes)];
    // Ensure presets are available if list is empty
    if (list.length === 0) {
      return THEME_PRESETS.map((p, idx) => ({
        id: `preset-${idx}`,
        name: p.name,
        slug: p.slug,
        configJson: normalizeThemeConfig(p.configJson),
        _count: { pages: 0 },
      }));
    }
    return list;
  }, [initialThemes, availableThemes]);

  // Selected Theme to Edit
  const [selectedThemeId, setSelectedThemeId] = useState(() => {
    return activeTheme?.id || allThemes[0]?.id || 'preset-0';
  });

  const currentTheme = useMemo(() => {
    return allThemes.find((t) => t.id === selectedThemeId) || allThemes[0] || THEME_PRESETS[0];
  }, [allThemes, selectedThemeId]);

  // Editor State
  const [themeName, setThemeName] = useState(currentTheme?.name || 'Modern Blue');
  const [tokens, setTokens] = useState(() => normalizeThemeConfig(currentTheme?.configJson));
  const [activeTab, setActiveTab] = useState('palette');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);
  const [copyCodeSuccess, setCopyCodeSuccess] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [newThemeModalOpen, setNewThemeModalOpen] = useState(false);
  const [newThemeNameDraft, setNewThemeNameDraft] = useState('');
  const [selectedPresetForNew, setSelectedPresetForNew] = useState(THEME_PRESETS[0].name);

  // Sync state whenever selectedThemeId changes
  const [prevSelectedId, setPrevSelectedId] = useState(selectedThemeId);
  if (prevSelectedId !== selectedThemeId) {
    setPrevSelectedId(selectedThemeId);
    if (currentTheme) {
      setThemeName(currentTheme.name);
      setTokens(normalizeThemeConfig(currentTheme.configJson));
      setStatusMessage(null);
    }
  }

  // Dynamic Google font loader
  useEffect(() => {
    if (tokens?.typography?.fontFamily) {
      loadGoogleFont(tokens.typography.fontFamily);
    }
    if (tokens?.typography?.fontHeading) {
      loadGoogleFont(tokens.typography.fontHeading);
    }
    if (tokens?.typography?.fontBody) {
      loadGoogleFont(tokens.typography.fontBody);
    }
  }, [tokens?.typography?.fontFamily, tokens?.typography?.fontHeading, tokens?.typography?.fontBody]);

  // Handle Token Updates
  const updateColor = (key, val) => {
    setTokens((prev) => ({
      ...prev,
      colors: {
        ...prev.colors,
        [key]: val,
      },
    }));
  };

  const updateTypography = (field, val) => {
    setTokens((prev) => ({
      ...prev,
      typography: {
        ...prev.typography,
        [field]: val,
      },
    }));
  };

  const updateFontSize = (scaleKey, val) => {
    setTokens((prev) => ({
      ...prev,
      typography: {
        ...prev.typography,
        sizes: {
          ...prev.typography?.sizes,
          [scaleKey]: val,
        },
      },
    }));
  };

  const toggleWeight = (weight) => {
    setTokens((prev) => {
      const currentWeights = prev.typography?.weights || [400, 600];
      const has = currentWeights.includes(weight);
      const next = has
        ? currentWeights.filter((w) => w !== weight)
        : [...currentWeights, weight].sort((a, b) => a - b);
      return {
        ...prev,
        typography: {
          ...prev.typography,
          weights: next.length > 0 ? next : [400],
        },
      };
    });
  };

  const updateSpacing = (key, val) => {
    setTokens((prev) => ({
      ...prev,
      spacing: {
        ...prev.spacing,
        [key]: val,
      },
    }));
  };

  const updateRadius = (key, val) => {
    setTokens((prev) => ({
      ...prev,
      borderRadius: {
        ...prev.borderRadius,
        [key]: val,
      },
    }));
  };

  // Save changes to backend
  const handleSaveTheme = async () => {
    if (!themeName.trim()) {
      setStatusMessage({ type: 'error', text: 'Theme name cannot be empty.' });
      return;
    }

    setIsSaving(true);
    setStatusMessage(null);

    try {
      const isPreset = String(selectedThemeId).startsWith('preset-');
      let savedTheme;

      if (isPreset) {
        // Create new real theme in DB
        savedTheme = await createTheme({
          name: themeName.trim(),
          configJson: tokens,
        });
        setSelectedThemeId(savedTheme.id);
      } else {
        savedTheme = await updateTheme(selectedThemeId, {
          name: themeName.trim(),
          configJson: tokens,
        });
      }

      await onRefresh?.();
      await fetchThemes?.();

      setStatusMessage({
        type: 'success',
        text: `Theme "${themeName}" saved successfully!`,
      });
      setTimeout(() => setStatusMessage(null), 3500);
    } catch (err) {
      setStatusMessage({
        type: 'error',
        text: err.message || 'Failed to save theme.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Set as Active Theme for Canvas
  const handleSetActive = (theme) => {
    selectTheme(theme.id);
    setStatusMessage({
      type: 'success',
      text: `"${theme.name}" is now the active theme for the builder canvas.`,
    });
    setTimeout(() => setStatusMessage(null), 3000);
  };

  // Clone Theme
  const handleCloneTheme = async (themeToClone) => {
    const target = themeToClone || currentTheme;
    setIsSaving(true);
    setStatusMessage(null);
    try {
      const cloned = await cloneTheme(target.id, `${target.name} (Copy)`);
      await onRefresh?.();
      await fetchThemes?.();
      setSelectedThemeId(cloned.id);
      setStatusMessage({
        type: 'success',
        text: `Created clone "${cloned.name}".`,
      });
      setTimeout(() => setStatusMessage(null), 3000);
    } catch (err) {
      setStatusMessage({
        type: 'error',
        text: err.message || 'Failed to clone theme.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Create New Theme from Preset / Modal
  const handleCreateNewTheme = async (e) => {
    e?.preventDefault();
    const name = newThemeNameDraft.trim();
    if (!name) {
      setStatusMessage({ type: 'error', text: 'Please enter a name for the new theme.' });
      return;
    }

    const preset = THEME_PRESETS.find((p) => p.name === selectedPresetForNew) || THEME_PRESETS[0];
    setIsSaving(true);
    setStatusMessage(null);

    try {
      const created = await createTheme({
        name,
        configJson: normalizeThemeConfig(preset.configJson),
      });
      await onRefresh?.();
      await fetchThemes?.();
      setNewThemeModalOpen(false);
      setNewThemeNameDraft('');
      setSelectedThemeId(created.id);
      setStatusMessage({
        type: 'success',
        text: `Created new theme "${created.name}"!`,
      });
      setTimeout(() => setStatusMessage(null), 3500);
    } catch (err) {
      setStatusMessage({
        type: 'error',
        text: err.message || 'Failed to create new theme.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Delete Theme
  const handleDeleteTheme = async (id) => {
    setIsSaving(true);
    setStatusMessage(null);
    try {
      await deleteTheme(id);
      await onRefresh?.();
      await fetchThemes?.();
      setDeleteConfirmId(null);
      // Switch selected to first available
      const remaining = allThemes.filter((t) => t.id !== id);
      if (remaining.length > 0) {
        setSelectedThemeId(remaining[0].id);
      }
      setStatusMessage({
        type: 'success',
        text: 'Theme deleted successfully.',
      });
      setTimeout(() => setStatusMessage(null), 3000);
    } catch (err) {
      setStatusMessage({
        type: 'error',
        text: err.message || 'Cannot delete theme. Pages might still be linked.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Copy CSS Variables to Clipboard
  const handleCopyCss = () => {
    const css = tokensToCssString(tokens);
    navigator.clipboard.writeText(`:root {\n${css}\n}`);
    setCopyCodeSuccess(true);
    setTimeout(() => setCopyCodeSuccess(false), 2000);
  };

  // Filtered themes list
  const filteredThemes = useMemo(() => {
    if (!searchQuery.trim()) return allThemes;
    const q = searchQuery.toLowerCase();
    return allThemes.filter(
      (t) =>
        t.name?.toLowerCase().includes(q) ||
        t.slug?.toLowerCase().includes(q) ||
        t.configJson?.typography?.fontFamily?.toLowerCase().includes(q)
    );
  }, [allThemes, searchQuery]);

  const isCurrentActive = activeTheme?.id === currentTheme?.id;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-sm">
              <Palette size={18} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-800 tracking-tight">
                Theme Studio & Token Configurator
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Centralized token management for Color Palettes, Typography scales, Spacing, and Border Radius.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={() => {
              setNewThemeNameDraft('');
              setNewThemeModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-all cursor-pointer"
          >
            <Plus size={14} />
            <span>Create New Theme</span>
          </button>

          <button
            onClick={() => navigate('/custom-builder')}
            title="Open canvas builder with active theme"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 hover:border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-medium transition-colors"
          >
            <span>Open Builder</span>
            <ExternalLink size={13} className="text-slate-400" />
          </button>
        </div>
      </div>

      {/* Status Notifications */}
      {statusMessage && (
        <div
          className={`flex items-center justify-between p-3.5 rounded-xl border text-xs font-medium animate-in slide-in-from-top-1 ${
            statusMessage.type === 'error'
              ? 'bg-rose-50 border-rose-200 text-rose-700'
              : 'bg-emerald-50 border-emerald-200 text-emerald-800'
          }`}
        >
          <div className="flex items-center gap-2">
            {statusMessage.type === 'error' ? (
              <AlertCircle size={16} className="text-rose-500 shrink-0" />
            ) : (
              <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
            )}
            <span>{statusMessage.text}</span>
          </div>
          <button
            onClick={() => setStatusMessage(null)}
            className="text-[11px] underline opacity-70 hover:opacity-100"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Main Studio Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Theme Management Explorer (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Layers size={14} className="text-blue-600" />
                Theme Explorer ({allThemes.length})
              </span>

              <button
                onClick={() => {
                  setNewThemeNameDraft('');
                  setNewThemeModalOpen(true);
                }}
                className="text-xs text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1"
              >
                <Plus size={12} /> New
              </button>
            </div>

            {/* Search Input */}
            <div className="relative mb-3">
              <Search size={13} className="absolute left-2.5 top-2.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search themes by name or font..."
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-slate-50/50 text-slate-700 focus:bg-white focus:border-blue-500 focus:outline-none transition-colors"
              />
            </div>

            {/* Themes List */}
            <div className="space-y-2 max-h-[440px] overflow-y-auto pr-1">
              {filteredThemes.map((theme) => {
                const isSelected = theme.id === selectedThemeId;
                const isActiveForCanvas = activeTheme?.id === theme.id;
                const tColors = theme.configJson?.colors || {};
                const tFont = theme.configJson?.typography?.fontFamily || 'Inter';

                return (
                  <div
                    key={theme.id}
                    onClick={() => setSelectedThemeId(theme.id)}
                    className={`group relative p-3 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-blue-50/60 border-blue-400 shadow-xs'
                        : 'bg-white hover:bg-slate-50/80 border-slate-200/90'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-bold text-slate-800 truncate">
                            {theme.name}
                          </h4>
                          {isActiveForCanvas && (
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-blue-600 text-white shadow-2xs">
                              Active
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-400">
                          <span className="truncate">{tFont}</span>
                          <span>•</span>
                          <span>{theme._count?.pages ?? 0} pages</span>
                        </div>
                      </div>

                      {/* Swatches preview */}
                      <div className="flex items-center -space-x-1 shrink-0 pt-0.5">
                        <span
                          className="w-3.5 h-3.5 rounded-full border border-white shadow-2xs"
                          style={{ backgroundColor: tColors.primary || '#2563eb' }}
                          title={`Primary: ${tColors.primary}`}
                        />
                        <span
                          className="w-3.5 h-3.5 rounded-full border border-white shadow-2xs"
                          style={{ backgroundColor: tColors.secondary || '#7c3aed' }}
                          title={`Secondary: ${tColors.secondary}`}
                        />
                        <span
                          className="w-3.5 h-3.5 rounded-full border border-white shadow-2xs"
                          style={{ backgroundColor: tColors.surface || '#f8fafc' }}
                          title={`Surface: ${tColors.surface}`}
                        />
                      </div>
                    </div>

                    {/* Quick action buttons on card */}
                    <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSetActive(theme);
                        }}
                        className={`font-semibold flex items-center gap-1 ${
                          isActiveForCanvas
                            ? 'text-emerald-600'
                            : 'text-slate-500 hover:text-blue-600'
                        }`}
                      >
                        {isActiveForCanvas ? (
                          <>
                            <CheckCheck size={12} /> Canvas Active
                          </>
                        ) : (
                          <>
                            <Check size={12} /> Set Active
                          </>
                        )}
                      </button>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCloneTheme(theme);
                          }}
                          title="Clone theme"
                          className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors"
                        >
                          <Copy size={12} />
                        </button>

                        {!String(theme.id).startsWith('preset-') && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteConfirmId(theme.id);
                            }}
                            title="Delete theme"
                            className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          >
                            <Trash2 size={12} />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

              {filteredThemes.length === 0 && (
                <div className="p-6 text-center text-xs text-slate-400">
                  No themes match your search query.
                </div>
              )}
            </div>
          </div>

          {/* Starter Presets Shelf */}
          <div className="bg-slate-900 text-white rounded-2xl p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-2 text-xs font-bold text-slate-200 uppercase tracking-wider">
              <Sparkles size={13} className="text-amber-400" />
              Starter Design Presets
            </div>
            <p className="text-[11px] text-slate-400 mb-3">
              Click a preset to quickly apply its design tokens to this editor or create a custom clone.
            </p>

            <div className="grid grid-cols-2 gap-2">
              {THEME_PRESETS.map((preset) => (
                <button
                  key={preset.name}
                  onClick={() => {
                    setTokens(normalizeThemeConfig(preset.configJson));
                    setStatusMessage({
                      type: 'success',
                      text: `Loaded preset "${preset.name}". Click "Save Changes" to persist.`,
                    });
                  }}
                  className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 text-left transition-all hover:border-slate-500"
                >
                  <span className="block text-xs font-semibold text-slate-200 truncate">
                    {preset.name}
                  </span>
                  <div className="flex items-center gap-1 mt-1.5">
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: preset.configJson.colors.primary }}
                    />
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: preset.configJson.colors.secondary }}
                    />
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: preset.configJson.colors.surface }}
                    />
                    <span className="text-[10px] text-slate-400 ml-1">
                      {preset.configJson.typography.fontFamily}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Main Area: Token Configurator & Live Preview (8 cols) */}
        <div className="lg:col-span-8 space-y-5">
          {/* Theme Meta & Control Bar */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div className="flex-1 max-w-md">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Editing Theme Name
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={themeName}
                    onChange={(e) => setThemeName(e.target.value)}
                    className="flex-1 px-3 py-1.5 text-base font-bold text-slate-800 rounded-xl border border-slate-200 focus:border-blue-500 focus:bg-white focus:outline-none transition-all"
                    placeholder="e.g. Modern Blue"
                  />
                  <span className="text-[11px] font-mono text-slate-400 bg-slate-100 px-2.5 py-1 rounded-lg shrink-0">
                    /{currentTheme?.slug || 'theme'}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => handleSetActive(currentTheme)}
                  className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-all flex items-center gap-1.5 ${
                    isCurrentActive
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-white text-slate-700 hover:bg-slate-50 border-slate-200'
                  }`}
                >
                  <Check size={14} className={isCurrentActive ? 'text-emerald-600' : 'text-slate-400'} />
                  <span>{isCurrentActive ? 'Active in Builder' : 'Set as Active'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleCloneTheme(currentTheme)}
                  title="Duplicate this theme"
                  className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  <Copy size={15} />
                </button>

                <button
                  type="button"
                  disabled={isSaving}
                  onClick={handleSaveTheme}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isSaving ? (
                    <RefreshCw size={14} className="animate-spin" />
                  ) : (
                    <Save size={14} />
                  )}
                  <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
                </button>
              </div>
            </div>

            {/* Configurator Category Tabs */}
            <div className="flex items-center gap-1 pt-3 overflow-x-auto">
              {TABS.map(({ id, label, Icon }) => {
                const isTabActive = activeTab === id;
                return (
                  <button
                    key={id}
                    onClick={() => setActiveTab(id)}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                      isTabActive
                        ? 'bg-blue-600 text-white shadow-xs shadow-blue-500/20'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    <Icon size={14} />
                    <span>{label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Configurator Body with Live Preview */}
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
            {/* Editor Controls Section (7 cols on xl) */}
            <div className="xl:col-span-7 space-y-4">
              {/* TAB 1: COLOR PALETTE */}
              {activeTab === 'palette' && (
                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <div>
                      <h3 className="text-sm font-bold text-slate-800">Color Palette Tokens</h3>
                      <p className="text-[11px] text-slate-500">
                        Customize primary brand accents, backgrounds, surfaces, and text contrast.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    {COLOR_FIELDS.map(({ key, label, desc, category }) => {
                      const colorVal = tokens.colors?.[key] || '#000000';
                      return (
                        <div
                          key={key}
                          className="p-3 rounded-xl border border-slate-200/80 bg-slate-50/40 hover:bg-white hover:border-blue-200 transition-all flex flex-col justify-between space-y-2"
                        >
                          <div>
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-slate-700">{label}</span>
                              <span className="text-[9px] font-semibold uppercase tracking-wider text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                                {category}
                              </span>
                            </div>
                            <p className="text-[10px] text-slate-400 leading-tight mt-0.5">
                              {desc}
                            </p>
                          </div>

                          <div className="flex items-center gap-2 pt-1">
                            {/* Color Picker Swatch */}
                            <label className="relative w-8 h-8 rounded-lg border border-slate-200 shadow-2xs cursor-pointer overflow-hidden shrink-0">
                              <input
                                type="color"
                                value={colorVal}
                                onChange={(e) => updateColor(key, e.target.value)}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                              />
                              <span
                                className="block w-full h-full"
                                style={{ backgroundColor: colorVal }}
                              />
                            </label>

                            {/* Hex Text Field */}
                            <input
                              type="text"
                              value={colorVal}
                              onChange={(e) => updateColor(key, e.target.value)}
                              className="flex-1 px-2.5 py-1 text-xs font-mono font-medium rounded-lg border border-slate-200 bg-white text-slate-700 focus:border-blue-500 focus:outline-none uppercase"
                              maxLength={7}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* TAB 2: TYPOGRAPHY */}
              {activeTab === 'typography' && (
                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-5">
                  <div className="pb-2 border-b border-slate-100">
                    <h3 className="text-sm font-bold text-slate-800">Typography Settings</h3>
                    <p className="text-[11px] text-slate-500">
                      Select font family, configure supported weights, and fine-tune font size scales.
                    </p>
                  </div>

                  {/* Font Family Dropdown */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Font Family (Google Fonts)
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <select
                        value={tokens.typography?.fontFamily || 'Inter'}
                        onChange={(e) => updateTypography('fontFamily', e.target.value)}
                        className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 bg-white text-slate-800 focus:border-blue-500 focus:outline-none"
                      >
                        {GOOGLE_FONTS.map((font) => (
                          <option key={font.value} value={font.value}>
                            {font.label}
                          </option>
                        ))}
                      </select>

                      <div
                        className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center text-sm font-medium text-slate-800 truncate"
                        style={{ fontFamily: tokens.typography?.fontFamily || 'Inter' }}
                      >
                        {tokens.typography?.fontFamily || 'Inter'} Typeface Preview
                      </div>
                    </div>

                    {/* Font Heading & Font Body Tokens */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3 pt-3 border-t border-slate-100">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          Heading Font Token (<code className="text-blue-600">--theme-font-heading</code>)
                        </label>
                        <select
                          value={tokens.typography?.fontHeading || tokens.typography?.fontFamily || 'Inter'}
                          onChange={(e) => updateTypography('fontHeading', e.target.value)}
                          className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 bg-white text-slate-800 focus:border-blue-500 focus:outline-none"
                        >
                          {GOOGLE_FONTS.map((font) => (
                            <option key={font.value} value={font.value}>
                              {font.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          Body Font Token (<code className="text-blue-600">--theme-font-body</code>)
                        </label>
                        <select
                          value={tokens.typography?.fontBody || tokens.typography?.fontFamily || 'Inter'}
                          onChange={(e) => updateTypography('fontBody', e.target.value)}
                          className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 bg-white text-slate-800 focus:border-blue-500 focus:outline-none"
                        >
                          {GOOGLE_FONTS.map((font) => (
                            <option key={font.value} value={font.value}>
                              {font.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="mt-3">
                      <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                        Or upload custom web font:
                      </label>
                      <FontUpload
                        onFontUpload={(file) => {
                          const name = file.name.replace(/\.[^/.]+$/, '');
                          const url = URL.createObjectURL(file);
                          const fontFace = new FontFace(name, `url(${url})`);
                          fontFace.load().then((loaded) => {
                            document.fonts.add(loaded);
                            addCustomFont?.({ name, url });
                            updateTypography('fontFamily', name);
                            setStatusMessage({
                              type: 'success',
                              text: `Custom font "${name}" loaded successfully!`,
                            });
                          });
                        }}
                      />
                    </div>
                  </div>

                  {/* Font Weights Multi-Select */}
                  <div className="pt-2 border-t border-slate-100">
                    <label className="block text-xs font-bold text-slate-700 mb-2">
                      Available Font Weights
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {FONT_WEIGHT_OPTIONS.map(({ label, value }) => {
                        const isSelected = (tokens.typography?.weights || []).includes(value);
                        return (
                          <button
                            key={value}
                            type="button"
                            onClick={() => toggleWeight(value)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                              isSelected
                                ? 'bg-blue-50 border-blue-400 text-blue-700 font-bold'
                                : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                            }`}
                          >
                            <span>{label}</span> ({value})
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Font Size Scales */}
                  <div className="pt-2 border-t border-slate-100 space-y-2.5">
                    <label className="block text-xs font-bold text-slate-700">
                      Font Size Scale Tokens
                    </label>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {Object.entries(FONT_SIZE_LABELS).map(([scaleKey, { label, desc }]) => {
                        const currentSize = tokens.typography?.sizes?.[scaleKey] || '16px';
                        return (
                          <div
                            key={scaleKey}
                            className="p-2.5 rounded-xl border border-slate-200 bg-slate-50/30 flex items-center justify-between gap-2"
                          >
                            <div className="min-w-0">
                              <span className="block text-[11px] font-bold text-slate-700 truncate">
                                {label}
                              </span>
                              <span className="block text-[9px] text-slate-400 truncate">
                                {desc}
                              </span>
                            </div>

                            <input
                              type="text"
                              value={currentSize}
                              onChange={(e) => updateFontSize(scaleKey, e.target.value)}
                              className="w-18 px-2 py-1 text-xs font-mono font-semibold text-right rounded-lg border border-slate-200 bg-white text-slate-700 focus:border-blue-500 focus:outline-none"
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: SPACING SCALE */}
              {activeTab === 'spacing' && (
                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
                  <div className="pb-2 border-b border-slate-100">
                    <h3 className="text-sm font-bold text-slate-800">Spacing Scale Tokens</h3>
                    <p className="text-[11px] text-slate-500">
                      Control the layout rhythm, component gaps, margins, and section padding.
                    </p>
                  </div>

                  <div className="space-y-2.5">
                    {Object.entries(SPACING_LABELS).map(([key, { label, desc }]) => {
                      const spaceVal = tokens.spacing?.[key] || '0px';
                      const numPx = parseInt(spaceVal, 10) || 0;
                      return (
                        <div
                          key={key}
                          className="p-3 rounded-xl border border-slate-200 bg-slate-50/40 flex items-center justify-between gap-4"
                        >
                          <div className="min-w-[120px]">
                            <span className="block text-xs font-bold text-slate-700">{label}</span>
                            <span className="block text-[10px] text-slate-400">{desc}</span>
                          </div>

                          {/* Visual spacing bar */}
                          <div className="flex-1 h-3 bg-slate-200 rounded-full overflow-hidden max-w-[200px]">
                            <div
                              className="h-full bg-blue-600 rounded-full transition-all"
                              style={{ width: `${Math.min(numPx * 3, 100)}%` }}
                            />
                          </div>

                          <input
                            type="text"
                            value={spaceVal}
                            onChange={(e) => updateSpacing(key, e.target.value)}
                            className="w-20 px-2.5 py-1 text-xs font-mono font-semibold text-right rounded-lg border border-slate-200 bg-white text-slate-700 focus:border-blue-500 focus:outline-none"
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* TAB 4: BORDER RADIUS */}
              {activeTab === 'radius' && (
                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
                  <div className="pb-2 border-b border-slate-100">
                    <h3 className="text-sm font-bold text-slate-800">Border Radius Tokens</h3>
                    <p className="text-[11px] text-slate-500">
                      Define rounded corner styles for buttons, containers, cards, and modal windows.
                    </p>
                  </div>

                  <div className="space-y-3">
                    {Object.entries(RADIUS_LABELS).map(([key, { label, desc }]) => {
                      const radVal = tokens.borderRadius?.[key] || '0px';
                      return (
                        <div
                          key={key}
                          className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/40 flex items-center justify-between gap-4"
                        >
                          <div className="flex items-center gap-3">
                            {/* Visual shape preview */}
                            <div
                              className="w-10 h-10 border-2 border-blue-500 bg-blue-50 shrink-0 transition-all shadow-2xs"
                              style={{ borderRadius: radVal }}
                            />
                            <div>
                              <span className="block text-xs font-bold text-slate-700">{label}</span>
                              <span className="block text-[10px] text-slate-400">{desc}</span>
                            </div>
                          </div>

                          <input
                            type="text"
                            value={radVal}
                            onChange={(e) => updateRadius(key, e.target.value)}
                            className="w-24 px-2.5 py-1 text-xs font-mono font-semibold text-right rounded-lg border border-slate-200 bg-white text-slate-700 focus:border-blue-500 focus:outline-none"
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* TAB 5: CSS VARIABLES */}
              {activeTab === 'css' && (
                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <div>
                      <h3 className="text-sm font-bold text-slate-800">Generated CSS Variables</h3>
                      <p className="text-[11px] text-slate-500">
                        Automatically exported CSS variables injected across your components and pages.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={handleCopyCss}
                      className="px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                    >
                      {copyCodeSuccess ? <Check size={14} /> : <Copy size={14} />}
                      <span>{copyCodeSuccess ? 'Copied!' : 'Copy Tokens'}</span>
                    </button>
                  </div>

                  <pre className="p-4 rounded-xl bg-slate-900 text-slate-200 text-[11px] font-mono overflow-x-auto leading-relaxed max-h-[360px]">
                    {tokensToCssString(tokens)}
                  </pre>
                </div>
              )}
            </div>

            {/* Live Theme Preview Panel (5 cols on xl) */}
            <div className="xl:col-span-5 space-y-4">
              <div
                className="p-5 rounded-2xl border shadow-sm transition-all sticky top-6"
                style={{
                  backgroundColor: tokens.colors.surface || '#f8fafc',
                  borderColor: tokens.colors.border || '#e2e8f0',
                  borderRadius: tokens.borderRadius.lg || '16px',
                  fontFamily: tokens.typography?.fontFamily || 'Inter',
                }}
              >
                <div className="flex items-center justify-between mb-4 pb-2 border-b border-black/10">
                  <span
                    className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5"
                    style={{ color: tokens.colors.text || '#0f172a' }}
                  >
                    <Sparkles size={14} style={{ color: tokens.colors.primary }} />
                    Live Theme Preview
                  </span>

                  <span
                    className="text-[10px] font-medium px-2 py-0.5 rounded-full"
                    style={{
                      backgroundColor: `${tokens.colors.primary}18`,
                      color: tokens.colors.primary,
                    }}
                  >
                    Real-time
                  </span>
                </div>

                {/* Sample Headings & Text */}
                <div className="space-y-1 mb-4">
                  <h2
                    className="font-bold leading-tight"
                    style={{
                      fontSize: tokens.typography?.sizes?.['2xl'] || '24px',
                      color: tokens.colors.text || '#0f172a',
                    }}
                  >
                    Surface Container
                  </h2>
                  <p
                    className="leading-normal"
                    style={{
                      fontSize: tokens.typography?.sizes?.sm || '14px',
                      color: tokens.colors.textMuted || '#64748b',
                    }}
                  >
                    Nested surface container demonstrating real-time primary and secondary color tokens.
                  </p>
                </div>

                {/* Sample Buttons */}
                <div className="space-y-2.5 mb-4">
                  <button
                    type="button"
                    className="w-full py-2.5 px-4 font-semibold text-xs text-white shadow-xs transition-transform active:scale-[0.98]"
                    style={{
                      backgroundColor: tokens.colors.primary || '#2563eb',
                      borderRadius: tokens.borderRadius.md || '8px',
                    }}
                  >
                    Primary Button Action
                  </button>

                  <button
                    type="button"
                    className="w-full py-2.5 px-4 font-semibold text-xs text-white shadow-xs transition-transform active:scale-[0.98]"
                    style={{
                      backgroundColor: tokens.colors.secondary || '#7c3aed',
                      borderRadius: tokens.borderRadius.md || '8px',
                    }}
                  >
                    Secondary Action Button
                  </button>

                  <button
                    type="button"
                    className="w-full py-2 px-4 font-medium text-xs transition-colors"
                    style={{
                      color: tokens.colors.text || '#0f172a',
                      border: `1px solid ${tokens.colors.border || '#e2e8f0'}`,
                      backgroundColor: tokens.colors.background || '#ffffff',
                      borderRadius: tokens.borderRadius.md || '8px',
                    }}
                  >
                    Outlined Surface Button
                  </button>
                </div>

                {/* Sample Input */}
                <div className="mb-4">
                  <label
                    className="block text-[11px] font-semibold mb-1"
                    style={{ color: tokens.colors.text || '#0f172a' }}
                  >
                    Sample Tokenized Input
                  </label>
                  <input
                    type="text"
                    readOnly
                    value="Input styled with theme tokens"
                    className="w-full px-3 py-2 text-xs font-medium focus:outline-none"
                    style={{
                      backgroundColor: tokens.colors.background || '#ffffff',
                      color: tokens.colors.text || '#0f172a',
                      border: `1px solid ${tokens.colors.border || '#e2e8f0'}`,
                      borderRadius: tokens.borderRadius.sm || '4px',
                    }}
                  />
                </div>

                {/* Helpful Tip */}
                <div
                  className="p-3 rounded-xl border text-[11px] leading-relaxed"
                  style={{
                    backgroundColor: `${tokens.colors.primary}0c`,
                    borderColor: `${tokens.colors.primary}25`,
                    color: tokens.colors.text || '#0f172a',
                  }}
                >
                  <span className="font-bold">Tip: </span>
                  Saving updates this theme in the database and applies all CSS variables across the builder canvas automatically.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal: Create New Theme */}
      {newThemeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200 p-6 shadow-2xl space-y-4">
            <div>
              <h3 className="text-base font-bold text-slate-800">Create New Design Theme</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Start with a preset configuration and customize design tokens.
              </p>
            </div>

            <form onSubmit={handleCreateNewTheme} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Theme Name
                </label>
                <input
                  type="text"
                  required
                  value={newThemeNameDraft}
                  onChange={(e) => setNewThemeNameDraft(e.target.value)}
                  placeholder="e.g. Acme Brand Theme"
                  className="w-full px-3 py-2 text-xs font-medium rounded-xl border border-slate-300 focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Start from Starter Preset
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {THEME_PRESETS.map((preset) => (
                    <button
                      key={preset.name}
                      type="button"
                      onClick={() => setSelectedPresetForNew(preset.name)}
                      className={`p-2.5 rounded-xl border text-left transition-all ${
                        selectedPresetForNew === preset.name
                          ? 'border-blue-500 bg-blue-50/70 text-blue-900 font-bold'
                          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <span className="block text-xs truncate">{preset.name}</span>
                      <div className="flex items-center gap-1 mt-1">
                        <span
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: preset.configJson.colors.primary }}
                        />
                        <span
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: preset.configJson.colors.secondary }}
                        />
                        <span className="text-[10px] text-slate-400">
                          {preset.configJson.typography.fontFamily}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setNewThemeModalOpen(false)}
                  className="px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-colors disabled:opacity-50"
                >
                  {isSaving ? 'Creating...' : 'Create Theme'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-sm bg-white rounded-2xl border border-slate-200 p-5 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                <AlertCircle size={20} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-800">Delete Theme?</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  This action cannot be undone. Make sure no pages are using this theme.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setDeleteConfirmId(null)}
                className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDeleteTheme(deleteConfirmId)}
                className="px-3.5 py-1.5 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs transition-colors"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}