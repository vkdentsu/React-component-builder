import { Monitor, Tablet, Smartphone, Trash2, Code2, Undo2, Redo2, Eye } from 'lucide-react';
import useBuilderStore from '../store/builderStore';
import DocumentSwitcher from './DocumentSwitcher';

const DEVICES = [
  { id: 'desktop', label: 'Desktop', Icon: Monitor  },
  { id: 'tablet',  label: 'Tablet',  Icon: Tablet   },
  { id: 'mobile',  label: 'Mobile',  Icon: Smartphone },
];

export default function Toolbar({ onExport, onPreview, canUndo, canRedo }) {
  const { device, setDevice, rows, clearAll, undo, redo } = useBuilderStore();

  const elCount = rows.reduce((acc, r) => acc + r.cols.reduce((a, c) => a + c.elements.length, 0), 0);

  return (
    <header className="h-12 bg-white border-b border-gray-200 flex items-center justify-between px-4 shrink-0 gap-4">
      {/* Brand + document switcher */}
      <div className="flex items-center gap-2 shrink-0">
        <div className="w-6 h-6 rounded-md bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center">
          <Code2 size={13} className="text-white" />
        </div>
        <span className="font-semibold text-sm text-gray-800 hidden lg:inline">Compify</span>
        <div className="ml-1">
          <DocumentSwitcher />
        </div>
        <span className="hidden xl:inline text-xs text-gray-400 ml-1">
          {rows.length} row{rows.length !== 1 ? 's' : ''} · {elCount} element{elCount !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Device switcher */}
      <div className="flex items-center gap-0.5 bg-gray-100 rounded-lg p-0.5">
        {DEVICES.map(({ id, label, Icon }) => (
          <button
            key={id}
            onClick={() => setDevice(id)}
            title={label}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-150
              ${device === id
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
              }`}
          >
            <Icon size={13} />
            <span className="hidden md:inline">{label}</span>
          </button>
        ))}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1.5 shrink-0">
        {/* Undo / Redo */}
        <div className="flex items-center gap-0.5 mr-1">
          <button
            onClick={undo}
            disabled={!canUndo}
            title="Undo (Ctrl+Z)"
            className={`p-1.5 rounded-lg border transition-colors duration-150
              ${canUndo
                ? 'border-gray-200 text-gray-600 hover:bg-gray-100'
                : 'border-transparent text-gray-300 cursor-not-allowed'
              }`}
          >
            <Undo2 size={14} />
          </button>
          <button
            onClick={redo}
            disabled={!canRedo}
            title="Redo (Ctrl+Y)"
            className={`p-1.5 rounded-lg border transition-colors duration-150
              ${canRedo
                ? 'border-gray-200 text-gray-600 hover:bg-gray-100'
                : 'border-transparent text-gray-300 cursor-not-allowed'
              }`}
          >
            <Redo2 size={14} />
          </button>
        </div>

        <button
          onClick={clearAll}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg border border-gray-200 hover:border-red-200 transition-all duration-150"
        >
          <Trash2 size={13} />
          <span className="hidden sm:inline">Clear</span>
        </button>

        <button
          onClick={onPreview}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 bg-white hover:bg-gray-50 rounded-lg border border-gray-200 transition-colors duration-150"
        >
          <Eye size={13} />
          <span>Preview</span>
        </button>

        <button
          onClick={onExport}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors duration-150"
        >
          <Code2 size={13} />
          <span>Export JSX</span>
        </button>
      </div>
    </header>
  );
}
