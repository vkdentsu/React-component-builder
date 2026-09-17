import { useState, useEffect, useCallback } from 'react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  pointerWithin,
  rectIntersection,
} from '@dnd-kit/core';

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
import PreviewModal from '../components/PreviewModal';
import ElementPreview from '../components/ElementPreview';
import { loadGoogleFont } from "../utils/loadGoogleFont";

export default function CustomBuilder() {
  const [exportOpen, setExportOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [activeDrag, setActiveDrag] = useState(null);

  const {
    rows,
    addRow,
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
  } = useBuilderStore();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

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
      <div className="flex flex-col h-screen overflow-hidden bg-gray-50" style={{fontFamily: globalFont,}}>
        <Toolbar onExport={() => setExportOpen(true)} onPreview={() => setPreviewOpen(true)} canUndo={canUndo()} canRedo={canRedo()} />
        <div className="flex flex-1 min-h-0">
          <Sidebar />
          <Canvas />
          <PropsPanel />
        </div>
      </div>

      <DragOverlay dropAnimation={{ duration: 180, easing: 'cubic-bezier(0.18, 0.67, 0.6, 1.22)' }}>
        {overlayContent()}
      </DragOverlay>

      <ExportModal open={exportOpen} onClose={() => setExportOpen(false)} />
      <PreviewModal open={previewOpen} onClose={() => setPreviewOpen(false)} />
    </DndContext>
  );
}
