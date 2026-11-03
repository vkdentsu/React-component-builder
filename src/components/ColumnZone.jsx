import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import CanvasElement from './CanvasElement';
import useBuilderStore from '../store/builderStore';
import { colDroppableId } from '../utils/treeHelpers';

export default function ColumnZone({ row, col, colIndex, hops, isRowSelected, device }) {
  const { selectedId, selectedType } = useBuilderStore();

  const droppableId = colDroppableId(hops, row.id, col.id);

  const { setNodeRef, isOver } = useDroppable({
    id: droppableId,
    data: { hops, rowId: row.id, colId: col.id },
  });

  const isEmpty = col.elements.length === 0;
  const elementIds = col.elements.map((e) => e.id);
  const badges = col.elements.filter((el) => el.type === "badge");

  const normalElements = col.elements.filter(
    (el) => el.type !== "badge"
  );

  return (
    <div style={{ flex: col.flex || 1 }} className="flex flex-col min-w-0">
      <div className="flex items-center justify-between mb-1 px-1">
        <span className="text-[10px] font-medium opacity-60" style={{ color: 'var(--theme-text-muted, #94a3b8)' }}>Col {colIndex + 1}</span>
        <span className="text-[10px] opacity-40" style={{ color: 'var(--theme-text-muted, #94a3b8)' }}>flex-{col.flex || 1}</span>
      </div>

      <SortableContext items={elementIds} strategy={verticalListSortingStrategy}>
        <div
          ref={setNodeRef}
          className={`relative flex-1 flex flex-col gap-2 rounded-lg border-2 border-dashed p-2 min-h-[80px] transition-all duration-150
            ${isOver
              ? 'border-blue-400 bg-blue-500/10 scale-[1.01]'
              : isRowSelected
              ? 'border-blue-300/50 bg-blue-500/5'
              : ''
            }`}
          style={{
            borderColor: (isOver || isRowSelected) ? undefined : 'var(--theme-border, rgba(0,0,0,0.15))',
            backgroundColor: (isOver || isRowSelected) ? undefined : 'transparent',
          }}
        >
          {isEmpty && (
            <div
              className={`flex-1 flex items-center justify-center text-xs transition-colors duration-150
                ${isOver ? 'text-blue-500 font-medium' : 'opacity-40'}`}
              style={{ color: isOver ? undefined : 'var(--theme-text-muted, #94a3b8)' }}
            >
              {isOver ? 'Drop here' : 'Empty'}
            </div>
          )}

          {badges.map((el) => (
            <div
              key={el.id}
              className="absolute top-2 left-2 z-50"
            >
              <CanvasElement
                el={el}
                hops={hops}
                isSelected={selectedId === el.id && selectedType === "element"}
                device={device}
              />
            </div>
          ))}

          {normalElements.map((el) => (
            <CanvasElement
              key={el.id}
              el={el}
              hops={hops}
              isSelected={selectedId === el.id && selectedType === "element"}
              device={device}
            />
          ))}
        </div>
      </SortableContext>
    </div>
  );
}
