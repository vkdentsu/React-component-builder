import { useDroppable } from '@dnd-kit/core';
import { Rows2 } from 'lucide-react';
import RowContainer from './RowContainer';
import { rootDroppableId } from '../utils/treeHelpers';

export default function RowsCanvas({ rows, hops = [], device, nested = false }) {
  const droppableId = rootDroppableId(hops);
  const { setNodeRef, isOver } = useDroppable({
    id: droppableId,
    data: { isRoot: true, hops },
  });

  const isEmpty = rows.length === 0;

  return (
    <div
      ref={setNodeRef}
      className={`flex flex-col gap-3 transition-colors duration-150 rounded-lg
        ${nested ? 'p-2 min-h-[100px] border-2 border-dashed' : 'flex-1 p-4 min-h-[480px]'}
        ${nested ? (isOver ? 'border-blue-400 bg-blue-500/10' : 'border-dashed') : (isOver && isEmpty ? 'bg-blue-500/10' : '')}`}
      style={{
        borderColor: nested && !isOver ? 'var(--theme-border, rgba(0,0,0,0.15))' : undefined,
      }}
    >
      {isEmpty && (
        <div className={`flex-1 flex flex-col items-center justify-center gap-2 text-center transition-all duration-150
          ${nested ? 'py-6' : 'py-16'}`}>
          <div className={`rounded-2xl flex items-center justify-center transition-colors duration-150
            ${nested ? 'w-9 h-9' : 'w-14 h-14'}
            ${isOver ? 'bg-blue-500/20 scale-105' : 'bg-black/5'}`}>
            <Rows2 size={nested ? 16 : 24} className={isOver ? 'text-blue-500' : 'opacity-40'} style={{ color: isOver ? undefined : 'var(--theme-text-muted, #94a3b8)' }} />
          </div>
          <div>
            <p className={`font-medium ${nested ? 'text-xs' : 'text-sm'} ${isOver ? 'text-blue-600' : ''}`} style={{ color: isOver ? undefined : 'var(--theme-text, #0f172a)' }}>
              {isOver ? 'Drop to add row' : nested ? 'Drag a layout here to start' : 'Drag a layout to start'}
            </p>
            {!nested && <p className="text-xs opacity-60 mt-1" style={{ color: 'var(--theme-text-muted, #94a3b8)' }}>Choose a row layout from the sidebar</p>}
            {nested && <p className="text-[10px] opacity-60 mt-1" style={{ color: 'var(--theme-text-muted, #94a3b8)' }}>Rows go here, not loose elements</p>}
          </div>
        </div>
      )}

      {rows.map((row) => (
        <RowContainer key={row.id} row={row} hops={hops} device={device} />
      ))}

      {!isEmpty && (
        <div
          className={`rounded-xl border-2 border-dashed flex items-center justify-center text-xs transition-all duration-150
            ${nested ? 'h-9' : 'h-12'}
            ${isOver ? 'border-blue-400 bg-blue-500/10 text-blue-500 scale-[1.01]' : 'opacity-60'}`}
          style={{
            borderColor: isOver ? undefined : 'var(--theme-border, rgba(0,0,0,0.12))',
            color: isOver ? undefined : 'var(--theme-text-muted, #94a3b8)',
          }}
        >
          {isOver ? 'Drop to add row here' : '+ Drop row layout'}
        </div>
      )}
    </div>
  );
}
