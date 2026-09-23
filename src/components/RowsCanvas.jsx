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
        ${nested ? (isOver ? 'border-blue-400 bg-blue-50/60' : 'border-gray-300 bg-white/60') : (isOver && isEmpty ? 'bg-blue-50/60' : '')}`}
    >
      {isEmpty && (
        <div className={`flex-1 flex flex-col items-center justify-center gap-2 text-center transition-all duration-150
          ${nested ? 'py-6' : 'py-16'}`}>
          <div className={`rounded-2xl flex items-center justify-center transition-colors duration-150
            ${nested ? 'w-9 h-9' : 'w-14 h-14'}
            ${isOver ? 'bg-blue-100 scale-105' : 'bg-gray-100'}`}>
            <Rows2 size={nested ? 16 : 24} className={isOver ? 'text-blue-500' : 'text-gray-400'} />
          </div>
          <div>
            <p className={`font-medium ${nested ? 'text-xs' : 'text-sm'} ${isOver ? 'text-blue-600' : 'text-gray-500'}`}>
              {isOver ? 'Drop to add row' : nested ? 'Drag a layout here to start' : 'Drag a layout to start'}
            </p>
            {!nested && <p className="text-xs text-gray-400 mt-1">Choose a row layout from the sidebar</p>}
            {nested && <p className="text-[10px] text-gray-400 mt-1">Rows go here, not loose elements</p>}
          </div>
        </div>
      )}

      {rows.map((row) => (
        <RowContainer key={row.id} row={row} hops={hops} device={device} />
      ))}

      {!isEmpty && (
        <div className={`rounded-xl border-2 border-dashed flex items-center justify-center text-xs transition-all duration-150
          ${nested ? 'h-9' : 'h-12'}
          ${isOver ? 'border-blue-400 bg-blue-50 text-blue-400 scale-[1.01]' : 'border-gray-200 text-gray-300'}`}>
          {isOver ? 'Drop to add row here' : '+ Drop row layout'}
        </div>
      )}
    </div>
  );
}
