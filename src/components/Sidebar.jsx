import { useDraggable } from '@dnd-kit/core';
import { Plus } from 'lucide-react';
import { LAYOUT_PALETTE, ELEMENT_PALETTE, BLOCK_PALETTE, DRAG_TYPES } from '../utils/palette';
import useBuilderStore from '../store/builderStore';

function PaletteItem({ label, Icon, dragData, dragId }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: dragId,
    data: dragData,
  });

  const addRow = useBuilderStore((s) => s.addRow);
  const addElement = useBuilderStore((s) => s.addElement);
  const rows = useBuilderStore((s) => s.rows);
  const selectedId = useBuilderStore((s) => s.selectedId);
  const selectedType = useBuilderStore((s) => s.selectedType);

  const handleClick = () => {
    // If not dragging, allow single click to add directly to canvas
    if (dragData.dragType === DRAG_TYPES.LAYOUT) {
      addRow(dragData.cols);
    } else if (dragData.dragType === DRAG_TYPES.ELEMENT) {
      // Find suitable target column
      let targetColId = null;
      if (selectedType === 'col') {
        targetColId = selectedId;
      } else if (selectedType === 'element') {
        for (const row of rows) {
          for (const col of row.cols || []) {
            if (col.elements?.some((el) => el.id === selectedId)) {
              targetColId = col.id;
              break;
            }
          }
          if (targetColId) break;
        }
      }

      if (!targetColId) {
        if (rows.length === 0) {
          addRow(1);
          // Wait for state or pick the first col
          setTimeout(() => {
            const currentRows = useBuilderStore.getState().rows;
            const firstCol = currentRows[0]?.cols?.[0];
            if (firstCol) {
              addElement(firstCol.id, dragData.elementType);
            }
          }, 0);
          return;
        } else {
          // Add to last column of last row
          const lastRow = rows[rows.length - 1];
          const lastCol = lastRow?.cols?.[lastRow.cols.length - 1];
          if (lastCol) {
            targetColId = lastCol.id;
          }
        }
      }

      if (targetColId) {
        addElement(targetColId, dragData.elementType);
      }
    }
  };

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      onClick={handleClick}
      title={`Drag or click to add ${label}`}
      className={`group flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer text-sm select-none transition-all duration-150
        ${isDragging
          ? 'opacity-40 bg-blue-50 border border-blue-200 scale-95'
          : 'hover:bg-blue-50/60 hover:text-blue-700 hover:translate-x-0.5 border border-transparent'
        }`}
    >
      <div className="flex items-center gap-2 min-w-0">
        <Icon size={15} className="text-gray-500 shrink-0 group-hover:text-blue-600" />
        <span className="text-gray-700 truncate group-hover:text-blue-800">{label}</span>
      </div>
      <button
        type="button"
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => {
          e.stopPropagation();
          handleClick(e);
        }}
        title={`Add ${label}`}
        className="opacity-0 group-hover:opacity-100 p-0.5 rounded text-blue-600 hover:bg-blue-100 transition-opacity shrink-0"
      >
        <Plus size={13} />
      </button>
    </div>
  );
}

export default function Sidebar() {
  return (
    <aside className="w-48 shrink-0 bg-white border-r border-gray-200 flex flex-col overflow-y-auto min-h-0">
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
    </aside>
  );
}
