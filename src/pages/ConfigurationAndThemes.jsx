import { useState } from "react";
import {
  Edit3,
  Plus,
  Trash2,
  Copy,
  Check,
  Palette,
  ShieldCheck,
} from "lucide-react";
import useBuilderStore from "../store/builderStore";
import ThemeModal from "../components/ThemeModal";

export default function ConfigurationAndThemes({ themes = [], onRefresh }) {
  const {
    activeTheme,
    defaultThemeId,
    selectTheme,
    setDefaultTheme,
    cloneTheme,
    deleteTheme,
  } = useBuilderStore();

  const [editingThemeId, setEditingThemeId] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);
  const [actionLoadingId, setActionLoadingId] = useState(null);

  const showToast = (text, type = "success") => {
    setToastMessage({ text, type });
    window.setTimeout(() => setToastMessage(null), 3000);
  };

  const allThemes = themes.length > 0 ? themes : useBuilderStore.getState().availableThemes;

  const currentDefaultId = defaultThemeId || activeTheme?.id || allThemes[0]?.id;

  const handleSelectTheme = (theme) => {
    selectTheme(theme.id);
    setDefaultTheme(theme.id);
    showToast(`"${theme.name}" set as active theme & default for new pages.`);
  };

  const handleCloneTheme = async (theme) => {
    setActionLoadingId(theme.id);
    try {
      const cloned = await cloneTheme(theme.id, `${theme.name} (Copy)`);
      showToast(`Cloned "${theme.name}" as "${cloned?.name || 'New Theme'}".`);
      await onRefresh?.();
      if (cloned?.id) {
        setEditingThemeId(cloned.id);
      }
    } catch (err) {
      showToast(err.message || "Failed to clone theme", "error");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDeleteTheme = async (theme) => {
    if (String(theme.id).startsWith("preset-")) {
      showToast("Default preset themes cannot be deleted.", "error");
      return;
    }
    if (!window.confirm(`Are you sure you want to delete the theme "${theme.name}"?`)) {
      return;
    }
    setActionLoadingId(theme.id);
    try {
      await deleteTheme(theme.id);
      showToast(`Deleted theme "${theme.name}".`);
      await onRefresh?.();
    } catch (err) {
      showToast(err.message || "Failed to delete theme", "error");
    } finally {
      setActionLoadingId(null);
    }
  };

  const currentActive = allThemes.find((t) => t.id === activeTheme?.id) || allThemes[0];
  const activeColors = currentActive?.configJson?.colors || {};

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          role="status"
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-xl px-4 py-3 text-xs font-semibold shadow-xl border animate-[fadeIn_0.15s_ease] ${
            toastMessage.type === "error"
              ? "bg-rose-50 text-rose-700 border-rose-200"
              : "bg-emerald-50 text-emerald-800 border-emerald-200"
          }`}
        >
          {toastMessage.type === "error" ? (
            <span className="w-2 h-2 rounded-full bg-rose-500" />
          ) : (
            <Check size={14} className="text-emerald-600" />
          )}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight flex items-center gap-2.5">
            <Palette className="text-blue-600" size={24} />
            <span>Theme Management</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1 max-w-xl">
            Design tokens cascade globally across all pages and components. Create, edit,
            clone, and select themes for your workspace.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setEditingThemeId("new")}
          className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white shadow-xs transition-colors hover:bg-blue-700 self-start sm:self-auto"
        >
          <Plus size={15} />
          <span>Create New Theme</span>
        </button>
      </div>

      {/* Active Theme Spotlight Card */}
      {currentActive && (
        <div className="relative overflow-hidden rounded-2xl border border-blue-200/80 bg-gradient-to-br from-blue-50/60 via-white to-indigo-50/40 p-5 shadow-xs">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                  <ShieldCheck size={12} /> Active & Default Theme
                </span>
                <span className="text-[11px] font-mono text-slate-400">
                  /{currentActive.slug}
                </span>
              </div>
              <h2 className="text-lg font-bold text-slate-900">{currentActive.name}</h2>
              <p className="text-xs text-slate-500 max-w-lg">
                Automatically applied when new pages are created, and dynamically feeds CSS
                variables (<code className="text-blue-600 font-mono text-[11px]">--theme-primary</code>, <code className="text-blue-600 font-mono text-[11px]">--theme-font-heading</code>) across the canvas.
              </p>

              {/* Token Previews */}
              <div className="flex flex-wrap items-center gap-4 pt-1 text-xs text-slate-600">
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] text-slate-400 font-medium">Palette:</span>
                  <div className="flex items-center -space-x-1.5">
                    {["primary", "secondary", "background", "surface", "text"].map(
                      (key) =>
                        activeColors[key] && (
                          <span
                            key={key}
                            style={{ backgroundColor: activeColors[key] }}
                            className="w-5 h-5 rounded-full border-2 border-white shadow-xs"
                            title={`${key}: ${activeColors[key]}`}
                          />
                        )
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] text-slate-400 font-medium">Font:</span>
                  <span className="font-semibold text-slate-800">
                    {currentActive.configJson?.typography?.fontFamily || "Inter"}
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] text-slate-400 font-medium">Radius:</span>
                  <span className="font-mono text-slate-700 text-[11px]">
                    {currentActive.configJson?.borderRadius?.md || "8px"} (md)
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start md:self-auto shrink-0">
              <button
                type="button"
                onClick={() => setEditingThemeId(currentActive.id)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 border border-slate-200 shadow-2xs hover:bg-slate-50 transition-colors"
              >
                <Edit3 size={13} className="text-blue-600" />
                <span>Edit Tokens</span>
              </button>
              <button
                type="button"
                onClick={() => handleCloneTheme(currentActive)}
                disabled={actionLoadingId === currentActive.id}
                className="inline-flex items-center gap-1.5 rounded-xl bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 border border-slate-200 shadow-2xs hover:bg-slate-50 transition-colors"
              >
                <Copy size={13} className="text-indigo-600" />
                <span>Clone Theme</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Grid of All Themes */}
      <div>
        <div className="flex items-center justify-between mb-3.5">
          <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider text-[11px]">
            Available Themes ({allThemes.length})
          </h2>
          <span className="text-xs text-slate-400">
            Click &ldquo;Set Active&rdquo; to apply theme to canvas & new pages
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {allThemes.map((theme) => {
            const colors = theme.configJson?.colors || {};
            const typography = theme.configJson?.typography || {};
            const borderRadius = theme.configJson?.borderRadius || {};
            const isActive = theme.id === activeTheme?.id;
            const isDefault = theme.id === currentDefaultId;
            const isPreset = String(theme.id).startsWith("preset-");

            return (
              <div
                key={theme.id}
                className={`bg-white rounded-2xl border p-5 shadow-xs flex flex-col justify-between transition-all hover:shadow-md ${
                  isActive
                    ? "border-blue-400 ring-2 ring-blue-500/20"
                    : "border-slate-200/80 hover:border-slate-300"
                }`}
              >
                <div>
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h3 className="text-sm font-bold text-slate-800 truncate">
                          {theme.name}
                        </h3>
                        {isActive && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                            Active
                          </span>
                        )}
                        {isDefault && (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            Default
                          </span>
                        )}
                        {isPreset && (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-medium bg-slate-100 text-slate-500">
                            Preset
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] font-mono text-slate-400">
                        /{theme.slug}
                      </span>
                    </div>

                    {/* Quick Active Check */}
                    {isActive ? (
                      <span className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-xs shrink-0">
                        <Check size={14} />
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleSelectTheme(theme)}
                        title="Set as Active & Default Theme"
                        className="text-[11px] font-semibold text-slate-500 hover:text-blue-600 px-2 py-1 rounded-lg border border-slate-200 hover:border-blue-200 hover:bg-blue-50/50 transition-colors shrink-0"
                      >
                        Set Active
                      </button>
                    )}
                  </div>

                  {/* Color Palette Swatches */}
                  <div className="mb-4">
                    <span className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                      Color Palette Tokens
                    </span>
                    <div className="grid grid-cols-5 gap-1.5">
                      {[
                        ["primary", "Primary", colors.primary || "#2563eb"],
                        ["secondary", "Secondary", colors.secondary || "#7c3aed"],
                        ["surface", "Surface", colors.surface || "#f8fafc"],
                        ["background", "Background", colors.background || "#ffffff"],
                        ["text", "Text", colors.text || "#0f172a"],
                      ].map(([key, label, val]) => (
                        <div key={key} className="text-center" title={`${label}: ${val}`}>
                          <div
                            style={{ backgroundColor: val }}
                            className="w-full h-7 rounded-lg border border-slate-200 shadow-2xs mb-1"
                          />
                          <span className="block text-[9px] text-slate-400 truncate">
                            {label}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Typography & Metrics */}
                  <div className="space-y-1.5 rounded-xl bg-slate-50/70 p-3 text-[11px] text-slate-600 border border-slate-100">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Font Family:</span>
                      <span
                        className="font-semibold text-slate-800"
                        style={{ fontFamily: typography.fontFamily || "Inter" }}
                      >
                        {typography.fontFamily || "Inter"}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Corner Radius:</span>
                      <span className="font-mono text-[10px] text-slate-700">
                        md: {borderRadius.md || "8px"} · lg: {borderRadius.lg || "16px"}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Connected Pages:</span>
                      <span className="font-semibold text-blue-600">
                        {theme._count?.pages ?? 0}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card Footer Actions */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setEditingThemeId(theme.id)}
                      title={`Edit tokens for ${theme.name}`}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-700 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                    >
                      <Edit3 size={13} />
                      <span>Edit Tokens</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleCloneTheme(theme)}
                      disabled={actionLoadingId === theme.id}
                      title={`Clone ${theme.name}`}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                    >
                      <Copy size={13} />
                      <span>Clone</span>
                    </button>
                  </div>

                  {!isPreset && (
                    <button
                      type="button"
                      onClick={() => handleDeleteTheme(theme)}
                      disabled={actionLoadingId === theme.id}
                      title={`Delete theme ${theme.name}`}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Theme Studio Modal */}
      {editingThemeId && (
        <ThemeModal
          key={editingThemeId}
          initialThemeId={editingThemeId}
          onClose={() => {
            setEditingThemeId(null);
            onRefresh?.();
          }}
          onSaved={async () => {
            await onRefresh?.();
          }}
        />
      )}
    </div>
  );
}
