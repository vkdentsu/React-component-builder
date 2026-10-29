import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Edit3 } from "lucide-react";
import { getApiUrl } from "../utils/api";

export default function ConfigurationAndThemes({ themes = [], onRefresh }) {
  const navigate = useNavigate();
  const [selectedThemeId, setSelectedThemeId] = useState("");
  const [editingField, setEditingField] = useState(null);
  const [nameDraft, setNameDraft] = useState("");
  const [slugDraft, setSlugDraft] = useState("");
  const [descriptionDraft, setDescriptionDraft] = useState("");
  const [configDraft, setConfigDraft] = useState("");
  const [configFormDraft, setConfigFormDraft] = useState({});
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  const selectedTheme =
    themes.length === 1
      ? themes[0]
      : themes.find((theme) => theme.id === selectedThemeId);

  const startEditing = (field) => {
    setMessage(null);
    setEditingField(field);
    if (field === "name") {
      setNameDraft(selectedTheme?.name || "");
    } else if (field === "slug") {
      setSlugDraft(selectedTheme?.slug || "");
    } else if (field === "configJson") {
      setConfigDraft(JSON.stringify(selectedTheme?.configJson ?? {}, null, 2));
    } else if (field === "configForm") {
      setConfigFormDraft(
        selectedTheme?.configJson &&
          typeof selectedTheme.configJson === "object" &&
          !Array.isArray(selectedTheme.configJson)
          ? selectedTheme.configJson
          : {}
      );
    } else {
      setDescriptionDraft(selectedTheme?.configJson?.description || "");
    }
  };

  const updateConfigValue = (path, value) => {
    setConfigFormDraft((current) => {
      const updated = { ...current };
      let target = updated;
      for (const key of path.slice(0, -1)) {
        target[key] = { ...target[key] };
        target = target[key];
      }
      target[path[path.length - 1]] = value;
      return updated;
    });
  };

  const renderConfigValue = (key, value, path = []) => {
    const currentPath = [...path, key];
    const label = key
      .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
      .replace(/^./, (character) => character.toUpperCase());
    const inputClass =
      "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 focus:border-blue-500 focus:outline-none";

    if (value && typeof value === "object" && !Array.isArray(value)) {
      return (
        <details
          key={currentPath.join(".")}
          className="rounded-lg border border-slate-200 bg-white"
        >
          <summary className="cursor-pointer px-3 py-2 text-sm font-semibold text-slate-700">
            {label}
          </summary>
          <div className="space-y-3 border-t border-slate-100 p-3">
            {Object.entries(value).map(([childKey, childValue]) =>
              renderConfigValue(childKey, childValue, currentPath)
            )}
          </div>
        </details>
      );
    }

    return (
      <label
        key={currentPath.join(".")}
        className="block space-y-1 text-xs font-medium text-slate-600"
      >
        <span>{label}</span>
        {typeof value === "boolean" ? (
          <input
            type="checkbox"
            checked={value}
            onChange={(event) =>
              updateConfigValue(currentPath, event.target.checked)
            }
            className="ml-2 h-4 w-4 accent-blue-600"
          />
        ) : Array.isArray(value) ? (
          <input
            type="text"
            value={value.join(", ")}
            onChange={(event) => {
              const items = event.target.value
                .split(",")
                .map((item) => item.trim());
              updateConfigValue(
                currentPath,
                value.every((item) => typeof item === "number")
                  ? items.filter(Boolean).map(Number)
                  : items
              );
            }}
            className={inputClass}
          />
        ) : (
          <div className="flex items-center gap-2">
            {typeof value === "string" &&
              currentPath.some((pathSegment) => /color/i.test(pathSegment)) &&
              /^#[0-9a-f]{6}$/i.test(value) && (
                <input
                  type="color"
                  value={value}
                  onChange={(event) =>
                    updateConfigValue(currentPath, event.target.value)
                  }
                  aria-label={`${label} color`}
                  className="h-10 w-12 cursor-pointer rounded border border-slate-300 p-1"
                />
              )}
            <input
              type={typeof value === "number" ? "number" : "text"}
              value={value ?? ""}
              onChange={(event) =>
                updateConfigValue(
                  currentPath,
                  typeof value === "number"
                    ? event.target.value === ""
                      ? ""
                      : Number(event.target.value)
                    : event.target.value
                )
              }
              className={inputClass}
            />
          </div>
        )}
      </label>
    );
  };

  const cancelEditing = () => {
    setEditingField(null);
    setMessage(null);
  };

  const saveField = async (field) => {
    if (!selectedTheme) return;
    if (field === "name" && !nameDraft.trim()) {
      setMessage({ type: "error", text: "Project name cannot be empty." });
      return;
    }
    if (field === "slug" && !slugDraft.trim()) {
      setMessage({ type: "error", text: "Theme slug cannot be empty." });
      return;
    }

    let updatedConfig;
    if (field === "configJson") {
      try {
        updatedConfig = JSON.parse(configDraft);
      } catch {
        setMessage({ type: "error", text: "Configuration must be valid JSON." });
        return;
      }
      if (
        updatedConfig === null ||
        typeof updatedConfig !== "object" ||
        Array.isArray(updatedConfig)
      ) {
        setMessage({
          type: "error",
          text: "Configuration must be a JSON object.",
        });
        return;
      }
    } else if (field === "configForm") {
      updatedConfig = configFormDraft;
    }

    const body =
      field === "name"
        ? { name: nameDraft.trim() }
        : field === "slug"
          ? { slug: slugDraft.trim() }
          : field === "configJson"
            ? { configJson: updatedConfig }
            : field === "configForm"
              ? { configJson: updatedConfig }
            : {
            configJson: {
              ...(selectedTheme.configJson &&
              typeof selectedTheme.configJson === "object" &&
              !Array.isArray(selectedTheme.configJson)
                ? selectedTheme.configJson
                : {}),
              description: descriptionDraft,
            },
          };

    setSaving(true);
    setMessage(null);
    try {
      const response = await fetch(getApiUrl(`/api/themes/${selectedTheme.id}`), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error?.message || "Failed to save project details.");
      }

      setEditingField(null);
      await onRefresh?.();
      setMessage({
        type: "success",
        text:
          field === "configJson" || field === "configForm"
            ? "Theme configuration saved."
            : `Project ${field === "name" ? "name" : field} saved.`,
      });
    } catch (error) {
      setMessage({
        type: "error",
        text: error.message || "Failed to save project details.",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            Configuration and Themes
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Configuration and themes data are stored in the database.
          </p>
        </div>

        <button
          onClick={() => navigate("/")}
          className="px-3.5 py-2 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-100 text-xs font-semibold transition-colors"
        >
          Configure New Theme
        </button>
      </div>

      {/* Project Details */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
        <div className="mb-4">
          <label
            htmlFor="project-theme"
            className="block text-sm font-semibold text-slate-700 mb-1"
          >
            Project record
          </label>
          {themes.length > 1 ? (
            <select
              id="project-theme"
              value={selectedTheme?.id || ""}
              onChange={(event) => {
                setSelectedThemeId(event.target.value);
                setEditingField(null);
                setMessage(null);
              }}
              disabled={saving}
              className="w-full max-w-sm rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:border-blue-500 focus:outline-none"
            >
              <option value="">Select a theme to edit as the project record</option>
              {themes.map((theme) => (
                <option key={theme.id} value={theme.id}>
                  {theme.name} (/{theme.slug})
                </option>
              ))}
            </select>
          ) : null}
        </div>

        {selectedTheme ? (
          <>
            <label className="block text-sm font-semibold text-slate-700 mb-1">
              Project Name
            </label>
            {editingField === "name" ? (
              <div className="flex flex-wrap items-center gap-2">
                <input
                  autoFocus
                  value={nameDraft}
                  onChange={(event) => setNameDraft(event.target.value)}
                  aria-label="Project name"
                  className="min-w-0 flex-1 rounded-lg border border-slate-300 px-3 py-2 text-lg font-bold text-slate-800 focus:border-blue-500 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => saveField("name")}
                  disabled={saving}
                  className="rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Save"}
                </button>
                <button
                  type="button"
                  onClick={cancelEditing}
                  disabled={saving}
                  className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <p className="text-lg font-bold text-slate-800">
                  {selectedTheme.name || "No project name available"}
                </p>
                <button
                  type="button"
                  onClick={() => startEditing("name")}
                  aria-label="Edit project name"
                  title="Edit project name"
                  className="rounded-md p-1 text-slate-400 hover:bg-blue-50 hover:text-blue-600"
                >
                  <Edit3 size={15} />
                </button>
              </div>
            )}

            <label className="block text-sm font-semibold text-slate-700 mb-1 mt-3">
              Theme Slug
            </label>
            {editingField === "slug" ? (
              <div className="flex flex-wrap items-center gap-2">
                <input
                  autoFocus
                  value={slugDraft}
                  onChange={(event) => setSlugDraft(event.target.value)}
                  aria-label="Theme slug"
                  className="min-w-0 flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 focus:border-blue-500 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => saveField("slug")}
                  disabled={saving}
                  className="rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Save"}
                </button>
                <button
                  type="button"
                  onClick={cancelEditing}
                  disabled={saving}
                  className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <p className="font-mono text-sm text-slate-700">
                  /{selectedTheme.slug}
                </p>
                <button
                  type="button"
                  onClick={() => startEditing("slug")}
                  aria-label="Edit theme slug"
                  title="Edit theme slug"
                  className="rounded-md p-1 text-slate-400 hover:bg-blue-50 hover:text-blue-600"
                >
                  <Edit3 size={15} />
                </button>
              </div>
            )}

            <label className="block text-sm font-semibold text-slate-700 mb-1 mt-3">
              Project Description
            </label>
            {editingField === "description" ? (
              <div className="space-y-2">
                <textarea
                  autoFocus
                  value={descriptionDraft}
                  onChange={(event) => setDescriptionDraft(event.target.value)}
                  aria-label="Project description"
                  rows={3}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 focus:border-blue-500 focus:outline-none"
                />
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => saveField("description")}
                    disabled={saving}
                    className="rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                  >
                    {saving ? "Saving..." : "Save"}
                  </button>
                  <button
                    type="button"
                    onClick={cancelEditing}
                    disabled={saving}
                    className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-2">
                <p className="whitespace-pre-wrap text-sm text-slate-700">
                  {selectedTheme.configJson?.description ||
                    "No project description available"}
                </p>
                <button
                  type="button"
                  onClick={() => startEditing("description")}
                  aria-label="Edit project description"
                  title="Edit project description"
                  className="shrink-0 rounded-md p-1 text-slate-400 hover:bg-blue-50 hover:text-blue-600"
                >
                  <Edit3 size={15} />
                </button>
              </div>
            )}

            <div className="mt-5 border-t border-slate-100 pt-4">
              <div className="mb-2 flex items-center gap-2">
                <h2 className="text-sm font-semibold text-slate-700">
                  Theme Configuration
                </h2>
                {editingField !== "configJson" && (
                  <button
                    type="button"
                    onClick={() => startEditing("configJson")}
                    aria-label="Edit theme configuration"
                    title="Edit theme configuration"
                    className="rounded-md p-1 text-slate-400 hover:bg-blue-50 hover:text-blue-600"
                  >
                    <Edit3 size={15} />
                  </button>
                )}
              </div>
              <p className="mb-2 text-xs text-slate-500">
                Edit individual values such as colors, typography, buttons, and
                content. Use the advanced JSON editor for complex values.
              </p>
              {editingField === "configForm" ? (
                <div className="space-y-3">
                  {Object.entries(configFormDraft).map(([key, value]) =>
                    renderConfigValue(key, value)
                  )}
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => saveField("configForm")}
                      disabled={saving}
                      className="rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                    >
                      {saving ? "Saving..." : "Save values"}
                    </button>
                    <button
                      type="button"
                      onClick={cancelEditing}
                      disabled={saving}
                      className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => startEditing("configJson")}
                      disabled={saving}
                      className="ml-auto rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                    >
                      Advanced JSON
                    </button>
                  </div>
                </div>
              ) : editingField === "configJson" ? (
                <div className="space-y-2">
                  <textarea
                    autoFocus
                    value={configDraft}
                    onChange={(event) => setConfigDraft(event.target.value)}
                    aria-label="Theme configuration JSON"
                    rows={12}
                    spellCheck={false}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-xs text-slate-800 focus:border-blue-500 focus:outline-none"
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => saveField("configJson")}
                      disabled={saving}
                      className="rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                    >
                      {saving ? "Saving..." : "Save"}
                    </button>
                    <button
                      type="button"
                      onClick={cancelEditing}
                      disabled={saving}
                      className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {Object.entries(selectedTheme.configJson ?? {}).map(
                    ([key, value]) => (
                      <div
                        key={key}
                        className="flex items-center justify-between gap-3 rounded-lg bg-slate-50 px-3 py-2"
                      >
                        <span className="text-xs font-semibold capitalize text-slate-600">
                          {key}
                        </span>
                        <span className="max-w-[70%] truncate font-mono text-xs text-slate-700">
                          {value && typeof value === "object"
                            ? `${Array.isArray(value) ? "Array" : "Object"} (${Object.keys(value).length} values)`
                            : String(value)}
                        </span>
                      </div>
                    )
                  )}
                  <button
                    type="button"
                    onClick={() => startEditing("configForm")}
                    aria-label="Edit theme configuration values"
                    className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                  >
                    Edit values
                  </button>
                  <button
                    type="button"
                    onClick={() => startEditing("configJson")}
                    aria-label="Edit theme configuration JSON"
                    className="ml-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                  >
                    Advanced JSON
                  </button>
                </div>
              )}
            </div>
          </>
        ) : (
          <p className="text-sm text-slate-500">
            {themes.length === 0
              ? "Create a theme to add project details."
              : "Select a theme above to view and edit its project details."}
          </p>
        )}

        {message && (
          <p
            role={message.type === "error" ? "alert" : "status"}
            className={`mt-3 text-sm ${
              message.type === "error" ? "text-rose-600" : "text-emerald-600"
            }`}
          >
            {message.text}
          </p>
        )}
      </div>

      {/* Theme Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {themes.map((theme) => {
          const colors = theme.configJson?.colors || {};

          return (
            <div
              key={theme.id}
              className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-bold text-slate-800">
                    {theme.name}
                  </h3>

                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-500">
                    /{theme.slug}
                  </span>
                </div>

                {/* Color Swatches */}
                <div className="flex items-center gap-2 mb-4">
                  {["primary", "secondary", "surface", "background"].map(
                    (colorName) =>
                      colors[colorName] && (
                        <span
                          key={colorName}
                          style={{ backgroundColor: colors[colorName] }}
                          className="w-6 h-6 rounded-md shadow-xs border border-black/10"
                          title={`${colorName}: ${colors[colorName]}`}
                        />
                      )
                  )}
                </div>

                <div className="space-y-1.5 text-[11px] text-slate-500">
                  <p>
                    <span className="text-slate-400">Font:</span>{" "}
                    <span className="font-medium text-slate-700">
                      {theme.configJson?.typography?.fontFamily ||
                        theme.configJson?.googleFont ||
                        "Inter"}
                    </span>
                  </p>

                  <p>
                    <span className="text-slate-400">Connected Pages:</span>{" "}
                    <span className="font-semibold text-blue-600">
                      {theme._count?.pages ?? 0}
                    </span>
                  </p>
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100 text-[10px] text-slate-400 flex items-center justify-between">
                <span>
                  Created {new Date(theme.createdAt).toLocaleDateString()}
                </span>
                <span className="text-emerald-600 font-medium">Ready</span>
              </div>
            </div>
          );
        })}

        {themes.length === 0 && (
          <div className="col-span-full bg-white rounded-2xl border border-slate-200 p-8 text-center text-sm text-slate-500">
            No themes found.
          </div>
        )}
      </div>
    </div>
  );
}