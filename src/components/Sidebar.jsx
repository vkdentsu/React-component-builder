import { useEffect, useState } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { AlertCircle, Database, RefreshCw, Save } from 'lucide-react';
import { LAYOUT_PALETTE, ELEMENT_PALETTE, BLOCK_PALETTE, DRAG_TYPES } from '../utils/palette';
import useBuilderStore from '../store/builderStore';
import { authenticatedFetch } from '../utils/api';

function PaletteItem({ label, Icon, dragData, dragId }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: dragId,
    data: dragData,
  });

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-grab text-sm select-none transition-all duration-150
        ${isDragging
          ? 'opacity-40 bg-blue-50 border border-blue-200 scale-95'
          : 'hover:bg-gray-100 hover:translate-x-0.5 border border-transparent'
        }`}
    >
      <Icon size={15} className="text-gray-500 shrink-0" />
      <span className="text-gray-700">{label}</span>
    </div>
  );
}

function SavedComponentItem({ component, isActive, isLoading, onLoad }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `saved-component-${component.id}`,
    data: {
      dragType: DRAG_TYPES.SAVED_COMPONENT,
      componentId: component.id,
      componentName: component.name,
      rows: component.contentJson?.rows,
    },
  });

  return (
    <button
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      type="button"
      onClick={onLoad}
      disabled={isLoading}
      title={`Drag ${component.name} onto the page, or click to open it`}
      className={`flex w-full items-center gap-2 rounded-lg border px-3 py-2 text-left text-sm select-none transition-colors disabled:cursor-wait disabled:opacity-60 ${
        isDragging
          ? 'border-emerald-200 bg-emerald-50 opacity-50'
          : isActive
            ? 'border-emerald-100 bg-emerald-50'
            : 'border-transparent hover:bg-gray-100'
      }`}
    >
      <Database size={15} className="shrink-0 text-emerald-600" />
      <span className={`flex-1 truncate ${isActive ? 'font-medium text-emerald-800' : 'text-gray-700'}`}>
        {isLoading ? 'Loading...' : component.name}
      </span>
      <span className="shrink-0 text-[10px] text-gray-400">v{component.version}</span>
    </button>
  );
}

export default function Sidebar({ onSaveComponent, isSavingComponent }) {
  const [savedComponents, setSavedComponents] = useState([]);
  const [savedComponentsLoading, setSavedComponentsLoading] = useState(true);
  const [savedComponentsError, setSavedComponentsError] = useState('');
  const [loadingComponentId, setLoadingComponentId] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const loadComponentFromDb = useBuilderStore((state) => state.loadComponentFromDb);
  const activeDocument = useBuilderStore((state) =>
    state.documents.find((document) => document.id === state.activeDocId)
  );

  useEffect(() => {
    let cancelled = false;
    const fetchSavedComponents = async () => {
      setSavedComponentsLoading(true);
      setSavedComponentsError('');
      try {
        const response = await authenticatedFetch('/api/components');
        const result = await response.json();
        if (!response.ok) {
          throw new Error(result.error?.message || 'Could not load saved components.');
        }
        if (!cancelled) setSavedComponents(result.data || []);
      } catch (error) {
        if (!cancelled) setSavedComponentsError(error.message);
      } finally {
        if (!cancelled) setSavedComponentsLoading(false);
      }
    };

    fetchSavedComponents();
    window.addEventListener('components:saved', fetchSavedComponents);
    return () => {
      cancelled = true;
      window.removeEventListener('components:saved', fetchSavedComponents);
    };
  }, [refreshKey]);

  const retrieveSavedComponent = async (componentId) => {
    setLoadingComponentId(componentId);
    setSavedComponentsError('');
    try {
      const response = await authenticatedFetch(`/api/components/${componentId}`);
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error?.message || 'Could not retrieve this component.');
      }
      loadComponentFromDb(result.data);
    } catch (error) {
      setSavedComponentsError(error.message);
    } finally {
      setLoadingComponentId(null);
    }
  };

  return (
    <aside className="w-48 shrink-0 bg-white border-r border-gray-200 flex flex-col overflow-hidden min-h-0">
      <div className="flex-1 overflow-y-auto">
        <div className="px-3 pt-4 pb-2">
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-1">Layout</p>
          <div className="flex flex-col gap-0.5">
            {LAYOUT_PALETTE.map((item) => (
              <PaletteItem
                key={item.type}
                dragId={`palette-${item.type}`}
                label={item.label}
                Icon={item.icon}
                dragData={{ dragType: DRAG_TYPES.LAYOUT, cols: item.cols }}
              />
            ))}
          </div>
        </div>

        <div className="border-t border-gray-100 px-3 pt-4 pb-2">
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-1">Blocks</p>
          <div className="flex flex-col gap-0.5">
            {BLOCK_PALETTE.map((item) => (
              <PaletteItem
                key={item.type}
                dragId={`palette-${item.type}`}
                label={item.label}
                Icon={item.icon}
                dragData={{ dragType: DRAG_TYPES.ELEMENT, elementType: item.type }}
              />
            ))}
          </div>
        </div>

        <div className="border-t border-gray-100 px-3 pt-4 pb-4">
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-1">Elements</p>
          <div className="flex flex-col gap-0.5">
            {ELEMENT_PALETTE.map((item) => (
              <PaletteItem
                key={item.type}
                dragId={`palette-${item.type}`}
                label={item.label}
                Icon={item.icon}
                dragData={{ dragType: DRAG_TYPES.ELEMENT, elementType: item.type }}
              />
            ))}
          </div>
        </div>

        <div className="border-t border-gray-100 px-3 pt-4 pb-4">
          <div className="mb-1 flex items-center justify-between">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">
              Saved Components
            </p>
            <button
              type="button"
              onClick={() => setRefreshKey((key) => key + 1)}
              disabled={savedComponentsLoading}
              title="Refresh saved components"
              className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 disabled:opacity-50"
            >
              <RefreshCw size={12} className={savedComponentsLoading ? 'animate-spin' : ''} />
            </button>
          </div>
          {savedComponentsLoading && (
            <p className="px-1 py-2 text-xs text-gray-400">Loading components...</p>
          )}
          {!savedComponentsLoading && savedComponents.length === 0 && !savedComponentsError && (
            <p className="px-1 py-2 text-xs text-gray-400">No saved components yet.</p>
          )}
          <div className="flex flex-col gap-0.5">
            {savedComponents.map((component) => (
              <SavedComponentItem
                key={component.id}
                component={component}
                isActive={activeDocument?.dbComponentId === component.id}
                isLoading={loadingComponentId !== null}
                onLoad={() => retrieveSavedComponent(component.id)}
              />
            ))}
          </div>
          {savedComponentsError && (
            <p role="alert" className="mt-1 flex items-start gap-1 px-1 text-xs text-rose-600">
              <AlertCircle size={13} className="mt-0.5 shrink-0" />
              <span>{savedComponentsError}</span>
            </p>
          )}
        </div>
      </div>
      {onSaveComponent && (
        <div className="shrink-0 border-t border-gray-200 p-3">
          <button
            type="button"
            onClick={onSaveComponent}
            disabled={isSavingComponent}
            title="Save this component to your reusable component library"
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 transition-colors hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Save size={14} />
            <span>{isSavingComponent ? 'Saving...' : 'Save Component'}</span>
          </button>
        </div>
      )}
    </aside>
  );
}
