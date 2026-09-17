import { useDraggable } from '@dnd-kit/core';
import { LAYOUT_PALETTE, ELEMENT_PALETTE, BLOCK_PALETTE, DRAG_TYPES } from '../utils/palette';

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
