import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Edit3, Trash2 } from "lucide-react";
import { getApiUrl } from "../utils/api";

export default function ConfigurationAndThemes({ themes = [], onRefresh }) {
  const navigate = useNavigate();
  const [selectedThemeId, setSelectedThemeId] = useState("");
  const [editingField, setEditingField] = useState(null);
  const [nameDraft, setNameDraft] = useState("");
  const [slugDraft, setSlugDraft] = useState("");
  const [descriptionDraft, setDescriptionDraft] = useState("");
  const [configFormDraft, setConfigFormDraft] = useState({});
  const [configNameDrafts, setConfigNameDrafts] = useState({});
  const [addingConfigGroup, setAddingConfigGroup] = useState(false);
  const [configGroupName, setConfigGroupName] = useState("");
  const [addingConfigValueTo, setAddingConfigValueTo] = useState(null);
  const [configValueName, setConfigValueName] = useState("");
  const [configValueType, setConfigValueType] = useState("text");
  const [configValueDraft, setConfigValueDraft] = useState("");
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

  const getConfigNameDraftKey = (path, key) =>
    JSON.stringify([...path, key]);

  const deleteConfigKey = (parentPath, keyToDelete) => {
    setConfigFormDraft((current) => {
      const updated = { ...current };
      let parent = updated;
      for (const key of parentPath) {
        parent[key] = { ...parent[key] };
        parent = parent[key];
      }
      delete parent[keyToDelete];
      return updated;
    });
    setConfigNameDrafts((current) => {
      const updated = { ...current };
      delete updated[getConfigNameDraftKey(parentPath, keyToDelete)];
      return updated;
    });
    setMessage(null);
  };

  const renameConfigKey = (parentPath, currentKey) => {
    const draftKey = getConfigNameDraftKey(parentPath, currentKey);
    const rawName = configNameDrafts[draftKey];
    const nextKey =
      rawName === undefined || rawName === currentKey
        ? currentKey
        : configKeyFromLabel(rawName);
    if (!nextKey) {
      setMessage({ type: "error", text: "Configuration names cannot be empty." });
      return;
    }

    let parent = configFormDraft;
    for (const key of parentPath) parent = parent[key];
    if (nextKey !== currentKey && Object.hasOwn(parent, nextKey)) {
      setMessage({
        type: "error",
        text: `A configuration value named "${nextKey}" already exists here.`,
      });
      return;
    }

    if (nextKey !== currentKey) {
      setConfigFormDraft((current) => {
        const updated = { ...current };
        let updatedParent = updated;
        for (const key of parentPath) {
          updatedParent[key] = { ...updatedParent[key] };
          updatedParent = updatedParent[key];
        }
        const entries = Object.entries(updatedParent);
        const renamed = Object.fromEntries(
          entries.map(([key, value]) => [
            key === currentKey ? nextKey : key,
            value,
          ])
        );
        Object.keys(updatedParent).forEach((key) => delete updatedParent[key]);
        Object.assign(updatedParent, renamed);
        return updated;
      });
    }

    setConfigNameDrafts((current) => {
      const updated = { ...current };
      delete updated[draftKey];
      return updated;
    });
    setMessage(null);
  };

  const renderConfigNameEditor = (key, parentPath, { canDelete = true } = {}) => {
    const draftKey = getConfigNameDraftKey(parentPath, key);
    return (
      <div className="flex items-center gap-2">
        <input
          aria-label={`Configuration name ${key}`}
          value={configNameDrafts[draftKey] ?? key}
          onChange={(event) =>
            setConfigNameDrafts((current) => ({
              ...current,
              [draftKey]: event.target.value,
            }))
          }
          className="min-w-0 flex-1 rounded-lg border border-slate-300 px-2 py-1.5 text-xs font-medium text-slate-700 focus:border-blue-500 focus:outline-none"
        />
        <button
          type="button"
          onClick={() => renameConfigKey(parentPath, key)}
          className="shrink-0 rounded-lg border border-slate-200 px-2 py-1.5 text-[11px] font-semibold text-slate-600 hover:bg-white"
        >
          Rename
        </button>
        {canDelete && (
          <button
            type="button"
            onClick={() => deleteConfigKey(parentPath, key)}
            aria-label={`Delete configuration ${key}`}
            title={`Delete ${key}`}
            className="shrink-0 rounded-lg border border-rose-100 p-1.5 text-rose-600 hover:bg-rose-50"
          >
            <Trash2 size={14} />
          </button>
        )}
      </div>
    );
  };

  const configKeyFromLabel = (label) =>
    label
      .trim()
      .split(/\s+/)
      .map((part, index) =>
        index === 0
          ? part.toLowerCase()
          : part.charAt(0).toUpperCase() + part.slice(1)
      )
      .join("");

  const addConfigGroup = () => {
    const key = configKeyFromLabel(configGroupName);
    if (!key) {
      setMessage({ type: "error", text: "Enter a configuration group name." });
      return;
    }
    if (Object.hasOwn(configFormDraft, key)) {
      setMessage({
        type: "error",
        text: `The "${key}" configuration group already exists. Add a value to that group instead.`,
      });
      return;
    }

    setConfigFormDraft((current) => ({ ...current, [key]: {} }));
    setConfigGroupName("");
    setAddingConfigGroup(false);
    setAddingConfigValueTo(key);
    setMessage(null);
  };

  const addConfigValue = (groupName) => {
    const key = configKeyFromLabel(configValueName);
    if (!key) {
      setMessage({ type: "error", text: "Enter a value name." });
      return;
    }
    if (Object.hasOwn(configFormDraft[groupName], key)) {
      setMessage({
        type: "error",
        text: `The "${key}" value already exists in this group.`,
      });
      return;
    }

    let value = configValueDraft;
    if (configValueType === "number") {
      value = Number(configValueDraft);
      if (!configValueDraft.trim() || !Number.isFinite(value)) {
        setMessage({ type: "error", text: "Enter a valid number." });
        return;
      }
    }

    setConfigFormDraft((current) => ({
      ...current,
      [groupName]: { ...current[groupName], [key]: value },
    }));
    setConfigValueName("");
    setConfigValueDraft(configValueType === "color" ? "#000000" : "");
    setAddingConfigValueTo(null);
    setMessage(null);
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
            {renderConfigNameEditor(key, path)}
            {Object.entries(value).map(([childKey, childValue]) =>
              renderConfigValue(childKey, childValue, currentPath)
            )}
          </div>
        </details>
      );
    }

    return (
      <div
        key={currentPath.join(".")}
        className="space-y-1 text-xs font-medium text-slate-600"
      >
        <span className="block">{label}</span>
        {renderConfigNameEditor(key, path)}
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
              aria-label={`${label} value`}
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
      </div>
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

    const updatedConfig = configFormDraft;

    const body =
      field === "name"
        ? { name: nameDraft.trim() }
        : field === "slug"
          ? { slug: slugDraft.trim() }
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
          field === "configForm"
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

            <div className="mt-5 border-t border-slate-100 pt-4">
              <div className="mb-2 flex items-center gap-2">
                <h2 className="text-sm font-semibold text-slate-700">
                  Theme Configuration
                </h2>
                {editingField !== "configForm" && (
                  <button
                    type="button"
                    onClick={() => startEditing("configForm")}
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
                content. Add configuration groups and values using the controls
                below.
              </p>
              {editingField === "configForm" ? (
                <div className="space-y-3">
                  {Object.entries(configFormDraft)
                    .filter(([key]) => key !== "description")
                    .map(([groupName, groupValue]) => (
                      <details
                        key={groupName}
                        open
                        className="rounded-lg border border-slate-200 bg-white"
                      >
                        <summary className="cursor-pointer px-3 py-2 text-sm font-semibold text-slate-700">
                          {groupName}
                        </summary>
                        <div className="space-y-3 border-t border-slate-100 p-3">
                          {renderConfigNameEditor(groupName, [], {
                            canDelete: false,
                          })}
                          <button
                            type="button"
                            onClick={() => deleteConfigKey([], groupName)}
                            className="inline-flex items-center gap-1 rounded-lg border border-rose-100 px-2 py-1.5 text-[11px] font-semibold text-rose-600 hover:bg-rose-50"
                          >
                            <Trash2 size={13} />
                            Delete configuration group
                          </button>
                          {groupValue &&
                          typeof groupValue === "object" &&
                          !Array.isArray(groupValue) ? (
                            Object.entries(groupValue).map(([key, value]) =>
                              renderConfigValue(key, value, [groupName])
                            )
                          ) : (
                            renderConfigValue(groupName, groupValue)
                          )}

                          {addingConfigValueTo === groupName ? (
                            <div className="grid gap-3 rounded-lg bg-slate-50 p-3 sm:grid-cols-3">
                              <label className="space-y-1 text-xs font-medium text-slate-600">
                                Value type
                                <select
                                  value={configValueType}
                                  onChange={(event) => {
                                    const nextType = event.target.value;
                                    setConfigValueType(nextType);
                                    setConfigValueDraft(
                                      nextType === "color" ? "#000000" : ""
                                    );
                                  }}
                                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                                >
                                  <option value="text">Text</option>
                                  <option value="color">Color</option>
                                  <option value="number">Number</option>
                                </select>
                              </label>
                              <label className="space-y-1 text-xs font-medium text-slate-600">
                                Value name
                                <input
                                  value={configValueName}
                                  onChange={(event) =>
                                    setConfigValueName(event.target.value)
                                  }
                                  placeholder="e.g. primary, fontSize"
                                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                                />
                              </label>
                              <label className="space-y-1 text-xs font-medium text-slate-600">
                                Value
                                <div className="flex gap-2">
                                  {configValueType === "color" && (
                                    <input
                                      type="color"
                                      value={
                                        /^#[0-9a-f]{6}$/i.test(configValueDraft)
                                          ? configValueDraft
                                          : "#000000"
                                      }
                                      onChange={(event) =>
                                        setConfigValueDraft(event.target.value)
                                      }
                                      aria-label="Choose value color"
                                      className="h-10 w-12 cursor-pointer rounded border border-slate-300 p-1"
                                    />
                                  )}
                                  <input
                                    type={
                                      configValueType === "number"
                                        ? "number"
                                        : configValueType === "color"
                                          ? "text"
                                          : "text"
                                    }
                                    value={configValueDraft}
                                    onChange={(event) =>
                                      setConfigValueDraft(event.target.value)
                                    }
                                    placeholder={
                                      configValueType === "color"
                                        ? "#2563eb"
                                        : configValueType === "number"
                                          ? "16"
                                          : "Enter value"
                                    }
                                    className="min-w-0 flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm"
                                  />
                                </div>
                              </label>
                              <div className="flex gap-2 sm:col-span-3">
                                <button
                                  type="button"
                                  onClick={() => addConfigValue(groupName)}
                                  className="rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-700"
                                >
                                  Add value
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setAddingConfigValueTo(null);
                                    setMessage(null);
                                  }}
                                  className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-white"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                setAddingConfigValueTo(groupName);
                                setConfigValueName("");
                                setConfigValueType("text");
                                setConfigValueDraft("");
                                setMessage(null);
                              }}
                              className="rounded-lg border border-dashed border-slate-300 px-3 py-2 text-xs font-semibold text-slate-600 hover:border-blue-400 hover:text-blue-600"
                            >
                              + Add value to {groupName}
                            </button>
                          )}
                        </div>
                      </details>
                    ))}

                  {addingConfigGroup ? (
                    <div className="flex flex-wrap items-end gap-2 rounded-lg bg-slate-50 p-3">
                      <label className="min-w-48 flex-1 space-y-1 text-xs font-medium text-slate-600">
                        Configuration group name
                        <input
                          autoFocus
                          value={configGroupName}
                          onChange={(event) =>
                            setConfigGroupName(event.target.value)
                          }
                          placeholder="e.g. colors, typography, buttons"
                          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                        />
                      </label>
                      <button
                        type="button"
                        onClick={addConfigGroup}
                        className="rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-700"
                      >
                        Create group
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setAddingConfigGroup(false);
                          setMessage(null);
                        }}
                        className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-white"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setAddingConfigGroup(true);
                        setMessage(null);
                      }}
                      className="rounded-lg border border-dashed border-blue-300 px-3 py-2 text-xs font-semibold text-blue-600 hover:bg-blue-50"
                    >
                      + Add configuration
                    </button>
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