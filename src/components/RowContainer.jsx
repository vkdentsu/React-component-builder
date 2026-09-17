import { Trash2, GripVertical, Copy } from 'lucide-react';
import ColumnZone from './ColumnZone';
import useBuilderStore from '../store/builderStore';

export default function RowContainer({ row, hops, device }) {
  const { selectedId, selectedType, select, removeRow, duplicateRow } = useBuilderStore();

  const isRowSelected = selectedId === row.id && selectedType === 'row';
  const stackClass = row.stackOnMobile ? 'flex-col sm:flex-row' : 'flex-row';
  const gapClass = `gap-${row.gap || 4}`;

  return (
    <div
      onClick={(e) => { e.stopPropagation(); select(row.id, 'row'); }}
      className={`group relative rounded-xl border transition-all duration-150 cursor-pointer
        ${isRowSelected
          ? 'border-blue-400 shadow-[0_0_0_2px_rgba(59,130,246,0.1)]'
          : 'border-gray-200 hover:border-gray-300'
        }`}
    >
      {/* Row header */}
      <div className={`flex items-center justify-between px-3 py-1.5 rounded-t-xl text-xs font-medium transition-colors duration-150
        ${isRowSelected ? 'bg-blue-50 text-blue-600' : 'bg-gray-50 text-gray-400'}`}
      >
        <div className="flex items-center gap-1.5">
          <GripVertical size={12} className="text-gray-300" />
          <span>Row — {row.cols.length} col{row.cols.length !== 1 ? 's' : ''}</span>
          {row.stackOnMobile && (
            <span className="ml-2 px-1.5 py-0.5 bg-amber-100 text-amber-600 rounded text-[10px]">
              stacks mobile
            </span>
          )}
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100">

          <button
            onClick={(e) => {
              e.stopPropagation();
              duplicateRow(row.id);
            }}
            className="p-1 rounded hover:bg-blue-100 hover:text-blue-500 transition-colors duration-150"
            title="Duplicate Row"
          >
            <Copy size={12} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); removeRow(row.id); }}
            className="p-1 rounded hover:bg-red-100 hover:text-red-500 transition-colors duration-150 opacity-0 group-hover:opacity-100"
          >
            <Trash2 size={12} />
          </button>
        </div>
      </div>

      {/* Columns */}
      <div className={`flex ${stackClass} ${gapClass} p-3`} style={{ paddingTop: `${(row.paddingY || 2) * 4}px`, paddingBottom: `${(row.paddingY || 2) * 4}px` }}>
        {row.cols.map((col, colIndex) => (
          <ColumnZone
            key={col.id}
            row={row}
            col={col}
            colIndex={colIndex}
            hops={hops}
            isRowSelected={isRowSelected}
            device={device}
          />
        ))}
      </div>
    </div>
  );
}
