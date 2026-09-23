import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Trash2, GripVertical, Box, Copy } from 'lucide-react';
import ElementPreview from './ElementPreview';
import RowsCanvas from './RowsCanvas';
import useBuilderStore from '../store/builderStore';

const roundedMap = { none: '', sm: 'rounded-sm', md: 'rounded-md', lg: 'rounded-lg' };
const paddingMap = { sm: 'p-2', md: 'p-4', lg: 'p-6' };

export default function CanvasElement({ el, hops, isSelected, device }) {
  const { select, removeElement, duplicateElement } = useBuilderStore();

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: el.id,
    data: { elementId: el.id },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: transition || 'transform 150ms ease, opacity 150ms ease, box-shadow 150ms ease',
    opacity: isDragging ? 0.35 : 1,
  };
  
  const isContainer = el.type === 'container';
  const isModal = el.type === 'modal';
  const isNestWrapper = isContainer && el.isNestWrapper;

  if (isNestWrapper) {
    return (
      <div
        ref={setNodeRef}
        style={style}
        className={`group relative rounded-lg transition-all duration-150
          ${isSelected ? 'ring-2 ring-blue-300' : ''}`}
      >
        <div
          onClick={(e) => { e.stopPropagation(); select(el.id, 'element'); }}
          className={`absolute -top-2.5 left-1 z-10 flex items-center gap-1 px-1.5 py-0.5 rounded bg-violet-100 border border-violet-200 cursor-pointer transition-opacity duration-150
            ${isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
        >
          <button
            {...attributes}
            {...listeners}
            onClick={(e) => e.stopPropagation()}
            className="cursor-grab text-violet-500"
          >
            <GripVertical size={10} />
          </button>
          <span className="text-[9px] font-semibold text-violet-600 uppercase tracking-wider">Nested layout</span>


          {isSelected && (
            <div className="absolute -top-2 -right-2 flex items-center gap-1 z-10">

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  duplicateElement(el.id);
                }}
                className="w-5 h-5 rounded-full bg-blue-500 hover:bg-blue-600 text-white flex items-center justify-center shadow transition-colors duration-150"
                title="Duplicate"
              >
                <Copy size={10} />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); removeElement(el.id); }}
                className="w-5 h-5 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center shadow transition-colors duration-150"
              >
                <Trash2 size={11} />
              </button>
            </div>
          )}
        </div>

        <div onClick={(e) => e.stopPropagation()}>
          <RowsCanvas rows={el.rows || []} hops={[...hops, el.id]} device={device} nested />
        </div>
      </div>
    );
  }

  if (isModal) {
    return (
      <div
        ref={setNodeRef}
        style={style}
        onClick={(e) => {
          e.stopPropagation();
          select(el.id, 'element');
        }}
        className={`group relative rounded-lg border transition-all duration-150 cursor-pointer
          ${
            isSelected
              ? 'border-blue-400 shadow-[0_0_0_2px_rgba(59,130,246,0.15)] bg-blue-50/30'
              : 'border-transparent hover:border-gray-300 hover:bg-gray-50/40'
          }`}
      >
        <div
          {...attributes}
          {...listeners}
          className="absolute -left-5 top-1/2 -translate-y-1/2 p-0.5 rounded cursor-grab opacity-0 group-hover:opacity-60 hover:!opacity-100 transition-opacity duration-150 text-gray-400 hover:text-gray-600 z-10"
          onClick={(e) => e.stopPropagation()}
        >
          <GripVertical size={14} />
        </div>

        {isSelected && (
          <div className="absolute -top-2 -right-2 flex items-center gap-1 z-10">
            <button
              onClick={(e) => {
                e.stopPropagation();
                duplicateElement(el.id);
              }}
              className="w-5 h-5 rounded-full bg-blue-500 hover:bg-blue-600 text-white flex items-center justify-center shadow transition-colors duration-150"
            >
              <Copy size={10} />
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                removeElement(el.id);
              }}
              className="w-5 h-5 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center shadow transition-colors duration-150"
            >
              <Trash2 size={10} />
            </button>
          </div>
        )}

        <div className="p-2">
          <ElementPreview
            el={el}
            isSelected={isSelected}
            device={device}
          />
        </div>
      </div>
    );
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={(e) => { e.stopPropagation(); select(el.id, 'element'); }}
      className={`group relative rounded-lg border transition-all duration-150 cursor-pointer
        ${isSelected
          ? 'border-blue-400 shadow-[0_0_0_2px_rgba(59,130,246,0.15)] bg-blue-50/30'
          : 'border-transparent hover:border-gray-300 hover:bg-gray-50/40'
        }`}
    >
      {/* Drag handle */}
      <div
        {...attributes}
        {...listeners}
        className="absolute -left-5 top-1/2 -translate-y-1/2 p-0.5 rounded cursor-grab opacity-0 group-hover:opacity-60 hover:!opacity-100 transition-opacity duration-150 text-gray-400 hover:text-gray-600 z-10"
        onClick={(e) => e.stopPropagation()}
      >
        <GripVertical size={14} />
      </div>

      {/* Delete button */}
      {isSelected && (
        <div className="absolute -top-2 -right-2 flex items-center gap-1 z-10">

          <button
            onClick={(e) => {
              e.stopPropagation();
              duplicateElement(el.id);
            }}
            className="w-5 h-5 rounded-full bg-blue-500 hover:bg-blue-600 text-white flex items-center justify-center shadow transition-colors duration-150"
            title="Duplicate"
          >
            <Copy size={10} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); removeElement(el.id); }}
            className="w-5 h-5 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center shadow transition-colors duration-150"
          >
            <Trash2 size={10} />
          </button>
        </div>
      )}

      <div className="p-2">
        <ElementPreview el={el} isSelected={isSelected} device={device} />
      </div>
    </div>
  );
}
