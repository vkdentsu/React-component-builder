import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Plus, Pencil, Copy, Trash2, Check, FileText } from 'lucide-react';
import useBuilderStore from '../store/builderStore';

export default function DocumentSwitcher() {
  const {
    documents,
    activeDocId,
    switchDocument,
    newDocument,
    renameDocument,
    deleteDocument,
    duplicateDocument,
  } = useBuilderStore();

  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editValue, setEditValue] = useState('');
  const ref = useRef(null);

  const activeDoc = documents.find((d) => d.id === activeDocId) || documents[0];

  useEffect(() => {
    const onClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
        setEditingId(null);
      }
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const startRename = (doc) => {
    setEditingId(doc.id);
    setEditValue(doc.name);
  };

  const commitRename = () => {
    if (editingId && editValue.trim()) {
      renameDocument(editingId, editValue.trim());
    }
    setEditingId(null);
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-100 rounded-lg border border-gray-200 transition-colors duration-150 max-w-[160px]"
      >
        <FileText size={13} className="text-gray-400 shrink-0" />
        <span className="truncate">{activeDoc?.name || 'Component'}</span>
        <ChevronDown size={13} className={`text-gray-400 shrink-0 transition-transform duration-150 ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1.5 w-64 bg-white rounded-xl border border-gray-200 shadow-lg z-50 overflow-hidden animate-[fadeIn_0.12s_ease]">
          <div className="px-3 py-2 border-b border-gray-100 flex items-center justify-between">
            <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">Components</span>
            <button
              onClick={() => { newDocument(); setOpen(false); }}
              className="flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700"
            >
              <Plus size={13} /> New
            </button>
          </div>

          <div className="max-h-64 overflow-y-auto py-1">
            {documents.map((doc) => {
              const isActive = doc.id === activeDocId;
              const elCount = doc.rows.reduce((acc, r) => acc + r.cols.reduce((a, c) => a + c.elements.length, 0), 0);

              return (
                <div
                  key={doc.id}
                  className={`group flex items-center gap-2 px-3 py-2 text-xs transition-colors duration-100
                    ${isActive ? 'bg-blue-50' : 'hover:bg-gray-50'}`}
                >
                  {editingId === doc.id ? (
                    <input
                      autoFocus
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onBlur={commitRename}
                      onKeyDown={(e) => { if (e.key === 'Enter') commitRename(); if (e.key === 'Escape') setEditingId(null); }}
                      className="flex-1 border border-blue-300 rounded px-1.5 py-0.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-400"
                    />
                  ) : (
                    <button
                      onClick={() => { switchDocument(doc.id); setOpen(false); }}
                      className="flex-1 flex items-center gap-2 text-left min-w-0"
                    >
                      {isActive
                        ? <Check size={13} className="text-blue-500 shrink-0" />
                        : <span className="w-[13px] shrink-0" />}
                      <span className={`truncate ${isActive ? 'text-blue-700 font-medium' : 'text-gray-700'}`}>{doc.name}</span>
                      <span className="text-[10px] text-gray-300 shrink-0">{elCount} el</span>
                    </button>
                  )}

                  <div className="hidden group-hover:flex items-center gap-0.5 shrink-0">
                    <button onClick={() => startRename(doc)} title="Rename" className="p-1 rounded hover:bg-gray-200 text-gray-400 hover:text-gray-600">
                      <Pencil size={11} />
                    </button>
                    <button onClick={() => duplicateDocument(doc.id)} title="Duplicate" className="p-1 rounded hover:bg-gray-200 text-gray-400 hover:text-gray-600">
                      <Copy size={11} />
                    </button>
                    {documents.length > 1 && (
                      <button onClick={() => deleteDocument(doc.id)} title="Delete" className="p-1 rounded hover:bg-red-100 text-gray-400 hover:text-red-500">
                        <Trash2 size={11} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
