import { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';

import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  pointerWithin,
  rectIntersection,
} from '@dnd-kit/core';

import { CheckCircle2, AlertCircle, X, FileText } from 'lucide-react';
import useBuilderStore, { makeElement } from '../store/builderStore';
import { DRAG_TYPES } from '../utils/palette';
import {
  parseColDroppableId,
  parseRootDroppableId,
  getRowsAtHops,
} from '../utils/treeHelpers';
import Sidebar from '../components/Sidebar';
import Canvas from '../components/Canvas';
import PropsPanel from '../components/PropsPanel';
import Toolbar from '../components/Toolbar';
import ExportModal from '../components/ExportModal';
import ExportJsonModal from '../components/ExportJsonModal';
import ImportJsonModal from '../components/ImportJsonModal';
import PreviewModal from '../components/PreviewModal';
import ThemeModal from '../components/ThemeModal';
import ElementPreview from '../components/ElementPreview';
import { loadGoogleFont } from "../utils/loadGoogleFont";
import { authenticatedFetch } from '../utils/api';
import { ensureUserTheme } from '../utils/ensureUserTheme';

export default function CustomBuilder() {
  const [searchParams] = useSearchParams();
  const pageIdFromUrl = searchParams.get('pageId');
  const [exportOpen, setExportOpen] = useState(false);
  const [exportJsonOpen, setExportJsonOpen] = useState(false);
  const [importJsonOpen, setImportJsonOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [pageSettingsOpen, setPageSettingsOpen] = useState(false);
  const [activeDrag, setActiveDrag] = useState(null);
  // Saving & Toast states
  const [isSaving, setIsSaving] = useState(false);
  const [saveComponentOpen, setSaveComponentOpen] = useState(false);
  const [componentName, setComponentName] = useState('');
  const [isSavingComponent, setIsSavingComponent] = useState(false);
  const [toast, setToast] = useState(null);
  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const handleClose = () => setExportOpen(false);

  const {
    rows,
    addRow,
    insertRows,
    addElement,
    updateElement,
    reorderElements,
    moveElement,
    findElementLocation,
    removeElement,
    removeRow,
    selectedId,
    selectedType,
    undo,
    redo,
    canUndo,
    canRedo,
    globalFont,
    builderMode,
    activeDbPageId,
    documents,
    activeDocId,
    pageMeta,
    setPageMeta,
    setActiveDbPageId,
    loadPageFromDb,
    initNewDbPage,
    markComponentSaved,
    fetchThemes,
    activeTheme,
    availableThemes,
    selectTheme,
    isThemeModalOpen,
    closeThemeModal,
  } = useBuilderStore();
  const isComponentMode = !pageIdFromUrl && builderMode === 'component';
  const loadedPageIdRef = useRef(null);

  // Load database page if pageId is in URL
  useEffect(() => {
    if (!pageIdFromUrl) {
      loadedPageIdRef.current = null;
      return;
    }

    if (pageIdFromUrl === 'new') {
      if (loadedPageIdRef.current !== 'new') {
        loadedPageIdRef.current = 'new';
        const name = searchParams.get('name') || 'New Page';
        const slug = searchParams.get('slug') || 'new-page';
        const themeId = searchParams.get('themeId') || '';
        initNewDbPage({ name, slug, themeId });
      }
      return;
    }

    // Only load if not already loaded by this instance to prevent overwriting in-memory edits
    if (loadedPageIdRef.current === pageIdFromUrl) return;

    let cancelled = false;
    const fetchPage = async () => {
      try {
        const res = await authenticatedFetch(`/api/pages/${pageIdFromUrl}`);
        if (!res.ok) throw new Error('Page was not found in database');
        const json = await res.json();
        if (!cancelled && json.data) {
          loadedPageIdRef.current = pageIdFromUrl;
          await loadPageFromDb(json.data);
          showToast(`Loaded page "${json.data.name}" from database.`);
        }
      } catch (err) {
        if (!cancelled) {
          showToast(err.message, 'error');
        }
      }
    };

    fetchPage();
    return () => {
      cancelled = true;
    };
  }, [pageIdFromUrl, initNewDbPage, loadPageFromDb, searchParams]);

  // Save Page to Database Handler
  const handleSavePage = async (overrideMeta) => {
    const meta = overrideMeta || pageMeta;
    if (!meta?.name?.trim()) {
      setPageSettingsOpen(true);
      return;
    }
    if (!meta?.slug?.trim()) {
      setPageSettingsOpen(true);
      return;
    }

    try {
      setIsSaving(true);

      // Ensure preset themes are persisted before saving the page
      let themeIdToUse = overrideMeta?.themeId || activeTheme?.id || meta.themeId;
      const themeObj = availableThemes.find((t) => t.id === themeIdToUse) || activeTheme;
      const isPreset = !themeIdToUse ||
        String(themeIdToUse).startsWith('preset-') ||
        Boolean(themeObj?.isPreset);

      if (isPreset) {
        const persistedTheme = await ensureUserTheme(themeObj || themeIdToUse);
        if (!persistedTheme?.id) {
          throw new Error('Failed to persist theme for this page.');
        }
        themeIdToUse = persistedTheme.id;

        // Replace in-memory ID with the persisted theme ID before saving
        setPageMeta({ themeId: persistedTheme.id });
        selectTheme(persistedTheme.id);
      } else {
        setPageMeta({ themeId: themeIdToUse });
      }

      const contentJson = {
        rows,
        globalFont,
        customFonts: useBuilderStore.getState().customFonts,
        device: useBuilderStore.getState().device,
        themeId: themeIdToUse,
      };

      if (activeDbPageId) {
        if (!themeIdToUse) {
          throw new Error('Please select a theme before saving.');
        }
        // Update existing page in database
        const res = await authenticatedFetch(`/api/pages/${activeDbPageId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: meta.name.trim(),
            slug: meta.slug.trim(),
            contentJson,
            themeId: themeIdToUse,
            status: meta.status || 'DRAFT',
          }),
        });

        const json = await res.json();
        if (!res.ok) {
          throw new Error(json.error?.message || 'Failed to update page in database');
        }

        setPageMeta({ ...json.data, themeId: themeIdToUse });
        showToast(`Page "${json.data.name}" saved to database!`);
      } else {
        const res = await authenticatedFetch('/api/pages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: meta.name.trim(),
            slug: meta.slug.trim(),
            themeId: themeIdToUse,
            contentJson,
            status: meta.status || 'DRAFT',
          }),
        });

        const json = await res.json();
        if (!res.ok) {
          throw new Error(json.error?.message || 'Failed to create page in database');
        }

        loadedPageIdRef.current = json.data.id;
        setActiveDbPageId(json.data.id);
        setPageMeta({ ...json.data, themeId: themeIdToUse });
        window.history.replaceState(null, '', `/custom-builder?pageId=${json.data.id}`);
        showToast(`Page "${json.data.name}" created and saved!`);
      }

      setPageSettingsOpen(false);
    } catch (err) {
      console.error('Save page error:', err);
      showToast(err.message, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    fetchThemes();
  }, [fetchThemes]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const handleSaveComponent = async (event) => {
    event.preventDefault();
    const name = componentName.trim();
    if (!name) return;

    const activeDocument = documents.find((document) => document.id === activeDocId);
    if (!activeDocument) {
      showToast('Create a component before saving.', 'error');
      return;
    }

    try {
      setIsSavingComponent(true);
      const contentJson = {
        rows,
        globalFont,
        customFonts: useBuilderStore.getState().customFonts,
        device: useBuilderStore.getState().device,
      };
      const isExistingComponent = Boolean(activeDocument.dbComponentId);
      const response = await authenticatedFetch(
        isExistingComponent ? `/api/components/${activeDocument.dbComponentId}` : '/api/components',
        {
          method: isExistingComponent ? 'PATCH' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, contentJson }),
        },
      );
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error?.message || 'Failed to save component.');
      }

      markComponentSaved(result.data);
      setSaveComponentOpen(false);
      window.dispatchEvent(new Event('components:saved'));
      showToast(`Component "${result.data.name}" saved to your library.`);
    } catch (error) {
      console.error('Save component error:', error);
      showToast(error.message, 'error');
    } finally {
      setIsSavingComponent(false);
    }
  };

  // Collision detection: prefer column / root drop zones 
  const collisionDetection = (args) => {
    const pointerCollisions = pointerWithin(args);
    if (pointerCollisions.length > 0) {
      const candidates = pointerCollisions
        .map((c) => {
          const id = String(c.id);
          const colParsed = id.startsWith('col::') ? parseColDroppableId(id) : null;
          const rootParsed = (id === 'canvas-root' || id.startsWith('root::')) ? parseRootDroppableId(id) : null;
          const parsed = colParsed || rootParsed;
          if (!parsed) return null;
          return { collision: c, depth: parsed.hops.length, isCol: !!colParsed };
        })
        .filter(Boolean);

      if (candidates.length > 0) {
        candidates.sort((a, b) => {
          if (b.depth !== a.depth) return b.depth - a.depth;
          return (b.isCol ? 1 : 0) - (a.isCol ? 1 : 0);
        });
        return [candidates[0].collision];
      }
    }
    return rectIntersection(args);
  };

  const handleDragStart = ({ active }) => {
    setActiveDrag({ id: active.id, data: active.data.current });
  };

  const handleDragEnd = ({ active, over }) => {
    setActiveDrag(null);
    if (!over) return;

    const activeData = active.data.current;
    const overId = String(over.id);

    if (activeData?.dragType === DRAG_TYPES.LAYOUT) {
      const rootParsed = parseRootDroppableId(overId);
      if (rootParsed) { addRow(activeData.cols, rootParsed.hops); return; }

      const colParsed = parseColDroppableId(overId);
      if (colParsed) {
        const wrapperId = addElement(colParsed.colId, 'container');
        if (wrapperId) {
          updateElement(wrapperId, { bg: 'transparent', bordered: false, padding: 'sm', isNestWrapper: true });
          addRow(activeData.cols, [...colParsed.hops, wrapperId]);
        }
        return;
      }
      return;
    }

    if (activeData?.dragType === DRAG_TYPES.SAVED_COMPONENT) {
      const colParsed = parseColDroppableId(overId);
      const rootParsed = parseRootDroppableId(overId);
      const insertedCount = colParsed
        ? insertRows(activeData.rows, colParsed.hops, colParsed.rowId)
        : rootParsed
          ? insertRows(activeData.rows, rootParsed.hops)
          : 0;

      if (insertedCount > 0) {
        showToast(`Added "${activeData.componentName}" to the page.`);
      } else {
        showToast('This saved component has no rows to add.', 'error');
      }
      return;
    }

    // 2. Element / block palette → column 
    if (activeData?.dragType === DRAG_TYPES.ELEMENT) {
      const colParsed = parseColDroppableId(overId);
      if (colParsed) { addElement(colParsed.colId, activeData.elementType); return; }

      const rootParsed = parseRootDroppableId(overId);
      if (rootParsed) {
        const localRows = getRowsAtHops(rows, rootParsed.hops);
        if (localRows.length > 0) {
          const lastRow = localRows[localRows.length - 1];
          addElement(lastRow.cols[0].id, activeData.elementType);
        }
      }
      return;
    }

    // 3. Canvas element reorder / move (any depth)
    if (activeData?.elementId) {
      const elId = activeData.elementId;

      const colParsed = parseColDroppableId(overId);
      if (colParsed) {
        moveElement(elId, colParsed.colId, -1);
        return;
      }

      // Dropped over another element
      const toId = over.id;
      if (toId === elId) return;

      const fromLoc = findElementLocation(elId);
      const toLoc = findElementLocation(toId);
      if (!fromLoc || !toLoc) return;

      if (fromLoc.colId === toLoc.colId) {
        const localRows = getRowsAtHops(rows, fromLoc.hops);
        const row = localRows.find((r) => r.id === fromLoc.rowId);
        const col = row?.cols.find((c) => c.id === fromLoc.colId);
        if (!col) return;
        const oldIdx = col.elements.findIndex((e) => e.id === elId);
        const newIdx = col.elements.findIndex((e) => e.id === toId);
        if (oldIdx !== -1 && newIdx !== -1 && oldIdx !== newIdx) {
          reorderElements(fromLoc.colId, oldIdx, newIdx);
        }
      } else {
        const localRows = getRowsAtHops(rows, toLoc.hops);
        const row = localRows.find((r) => r.id === toLoc.rowId);
        const col = row?.cols.find((c) => c.id === toLoc.colId);
        const toIdx = col?.elements.findIndex((e) => e.id === toId) ?? -1;
        moveElement(elId, toLoc.colId, toIdx);
      }
    }
  };

  // Keyboard shortcuts: undo / redo / delete
  const handleKeyDown = useCallback((e) => {
    const tag = e.target.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || e.target.isContentEditable) return;

    const isMeta = e.ctrlKey || e.metaKey;

    if (isMeta && e.key.toLowerCase() === 'z' && !e.shiftKey) {
      e.preventDefault();
      undo();
      return;
    }
    if (isMeta && (e.key.toLowerCase() === 'y' || (e.key.toLowerCase() === 'z' && e.shiftKey))) {
      e.preventDefault();
      redo();
      return;
    }
    if ((e.key === 'Delete' || e.key === 'Backspace') && selectedId) {
      e.preventDefault();
      if (selectedType === 'element') removeElement(selectedId);
      else if (selectedType === 'row') removeRow(selectedId);
    }
  }, [selectedId, selectedType, undo, redo, removeElement, removeRow]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  useEffect(() => {
    loadGoogleFont(globalFont);
  }, [globalFont]);

  // Drag overlay preview
  const overlayContent = () => {
    if (!activeDrag) return null;
    const { data } = activeDrag;

    if (data?.dragType === DRAG_TYPES.ELEMENT) {
      const el = makeElement(data.elementType);
      return (
        <div className="bg-white border border-blue-400 rounded-lg shadow-xl p-3 opacity-90 min-w-[140px] scale-[1.02]">
          <ElementPreview el={el} isSelected={false} device="desktop" />
        </div>
      );
    }

    if (data?.dragType === DRAG_TYPES.LAYOUT) {
      return (
        <div className="bg-blue-50 border border-blue-400 rounded-lg shadow-xl px-4 py-2.5 opacity-90">
          <span className="text-sm text-blue-700 font-medium">{data.cols}-column row</span>
        </div>
      );
    }

    if (data?.dragType === DRAG_TYPES.SAVED_COMPONENT) {
      return (
        <div className="flex items-center gap-2 rounded-lg border border-emerald-300 bg-white px-4 py-3 shadow-xl opacity-90">
          <span className="text-sm font-medium text-emerald-700">{data.componentName}</span>
          <span className="text-xs text-gray-400">Component</span>
        </div>
      );
    }

    if (data?.elementId) {
      const findDeep = (rowsArr) => {
        for (const r of rowsArr) for (const c of r.cols) {
          for (const e of c.elements) {
            if (e.id === data.elementId) return e;
            if (e.rows) {
              const found = findDeep(e.rows);
              if (found) return found;
            }
          }
        }
        return null;
      };
      const foundEl = findDeep(rows);
      if (foundEl) return (
        <div className="bg-white border border-blue-400 rounded-lg shadow-xl p-3 opacity-90 min-w-[140px] scale-[1.02]">
          <ElementPreview el={foundEl} isSelected={false} device="desktop" />
        </div>
      );
    }

    return null;
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={collisionDetection}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex flex-col h-screen overflow-hidden bg-gray-50" style={{ fontFamily: globalFont, }}>
        <Toolbar
          onExport={() => setExportOpen(true)}
          onExportJson={() => setExportJsonOpen(true)}
          onImportJson={() => setImportJsonOpen(true)}
          onPreview={() => setPreviewOpen(true)}
          canUndo={canUndo()}
          canRedo={canRedo()}
          onSavePage={!isComponentMode ? () => handleSavePage() : undefined}
          isSaving={!isComponentMode && isSaving}
          pageMeta={pageMeta}
          onEditPageSettings={() => setPageSettingsOpen(true)}

        />
        <div className="flex flex-1 min-h-0">
          <Sidebar
            onSaveComponent={isComponentMode ? () => {
              const activeDocument = documents.find((document) => document.id === activeDocId);
              setComponentName(activeDocument?.name || 'My Component');
              setSaveComponentOpen(true);
            } : undefined}
            isSavingComponent={isComponentMode && isSavingComponent}
          />
          <Canvas />
          <PropsPanel />
        </div>
      </div>

      <DragOverlay dropAnimation={{ duration: 180, easing: 'cubic-bezier(0.18, 0.67, 0.6, 1.22)' }}>
        {overlayContent()}
      </DragOverlay>

      <ExportModal
        key={exportOpen ? 'export-open' : 'export-closed'}
        open={exportOpen}
        onClose={handleClose}
      />
      <ExportJsonModal open={exportJsonOpen} onClose={() => setExportJsonOpen(false)} />
      <ImportJsonModal open={importJsonOpen} onClose={() => setImportJsonOpen(false)} />
      <PreviewModal open={previewOpen} onClose={() => setPreviewOpen(false)} />

      {/* Floating Toast Notification */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-2xl text-xs font-semibold text-white animate-in fade-in slide-in-from-bottom-3 ${toast.type === 'error' ? 'bg-rose-600' : 'bg-emerald-600'
            }`}
        >
          {toast.type === 'error' ? <AlertCircle size={16} /> : <CheckCircle2 size={16} />}
          <span>{toast.message}</span>
          <button onClick={() => setToast(null)} className="ml-2 text-white/80 hover:text-white">
            <X size={13} />
          </button>
        </div>
      )}

      {/* Page Settings Modal */}
      {pageSettingsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden border border-slate-200">
            <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <FileText size={16} className="text-blue-600" />
                <h3 className="font-bold text-sm text-slate-800">Page Properties</h3>
              </div>
              <button
                onClick={() => setPageSettingsOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X size={15} />
              </button>
            </div>

            <div className="p-5 space-y-3.5">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Page Name *
                </label>
                <input
                  type="text"
                  value={pageMeta?.name || ''}
                  onChange={(e) => {
                    const name = e.target.value;
                    const slug = name
                      .toLowerCase()
                      .trim()
                      .replace(/[^a-z0-9]+/g, '-')
                      .replace(/^-|-$/g, '');
                    setPageMeta({ name, slug });
                  }}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  URL Route Slug *
                </label>
                <div className="flex items-center rounded-lg border border-slate-300 overflow-hidden bg-slate-50">
                  <span className="px-2.5 py-2 text-xs text-slate-400 font-mono bg-slate-100 border-r border-slate-200">
                    /
                  </span>
                  <input
                    type="text"
                    value={pageMeta?.slug || ''}
                    onChange={(e) => setPageMeta({ slug: e.target.value })}
                    className="flex-1 px-3 py-2 text-xs bg-white font-mono focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Page Theme
                </label>
                <select
                  value={pageMeta?.themeId || activeTheme?.id || ''}
                  onChange={(e) => {
                    const chosenId = e.target.value;
                    if (chosenId) {
                      selectTheme(chosenId);
                      setPageMeta({ themeId: chosenId });
                    }
                  }}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                >
                  {availableThemes.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} {t.isPreset ? '(Preset)' : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setPageSettingsOpen(false)}
                  className="px-3.5 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleSavePage()}
                  disabled={isSaving}
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs"
                >
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {saveComponentOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <form
            onSubmit={handleSaveComponent}
            className="w-full max-w-sm overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
          >
            <div className="border-b border-slate-100 bg-slate-50 px-5 py-4">
              <h3 className="text-sm font-semibold text-slate-800">
                {documents.find((document) => document.id === activeDocId)?.dbComponentId
                  ? 'Save Component Changes'
                  : 'Save Component'}
              </h3>
              <p className="mt-1 text-xs text-slate-500">
                Save this component to your reusable component library.
              </p>
            </div>
            <div className="p-5">
              <label htmlFor="saved-component-name" className="mb-1 block text-xs font-medium text-slate-700">
                Component name
              </label>
              <input
                id="saved-component-name"
                autoFocus
                required
                maxLength={120}
                value={componentName}
                onChange={(event) => setComponentName(event.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>
            <div className="flex items-center justify-end gap-2 border-t border-slate-100 px-5 py-3">
              <button
                type="button"
                onClick={() => setSaveComponentOpen(false)}
                disabled={isSavingComponent}
                className="rounded-lg px-3.5 py-2 text-xs text-slate-600 hover:bg-slate-100 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSavingComponent || !componentName.trim()}
                className="rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
              >
                {isSavingComponent ? 'Saving...' : 'Save Component'}
              </button>
            </div>
          </form>
        </div>
      )}

      {isThemeModalOpen && <ThemeModal onClose={closeThemeModal} />}
    </DndContext>
  );
}
