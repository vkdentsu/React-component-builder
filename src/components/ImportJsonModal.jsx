import { useState, useRef, useMemo } from 'react';
import {
  X,
  Upload,
  FileJson,
  CheckCircle2,
  AlertCircle,
  FileCode,
  Layers,
  Sparkles,
  ArrowRight,
  FolderOpen,
} from 'lucide-react';
import useBuilderStore from '../store/builderStore';
import { validateImportJson } from '../utils/jsonImporter';

function ImportJsonDialog({ onClose }) {
  const { importJson, getExportJson } = useBuilderStore();
  const [jsonInput, setJsonInput] = useState('');
  const [mode, setMode] = useState('replace'); // 'replace' | 'new'
  const [customName, setCustomName] = useState('');
  const [fileName, setFileName] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [importSuccessMessage, setImportSuccessMessage] = useState('');
  const fileInputRef = useRef(null);

  // Real-time validation
  const validation = useMemo(() => {
    if (!jsonInput.trim()) return null;
    return validateImportJson(jsonInput);
  }, [jsonInput]);

  const handleFile = (file) => {
    if (!file) return;
    if (!file.name.endsWith('.json') && file.type !== 'application/json') {
      alert('Please select a valid .json file.');
      return;
    }
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result;
      if (typeof text === 'string') {
        setJsonInput(text);
      }
    };
    reader.readAsText(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleLoadCurrentSample = () => {
    const currentData = getExportJson('current');
    setJsonInput(JSON.stringify(currentData, null, 2));
    setFileName('current-canvas-sample.json');
  };

  const handleImport = () => {
    if (!validation || !validation.isValid) return;

    try {
      const result = importJson(validation.data, {
        mode,
        docName: customName.trim() || undefined,
      });

      setImportSuccessMessage(result.message || 'Component successfully rendered!');
      setTimeout(() => {
        onClose();
      }, 700);
    } catch (err) {
      alert(`Import failed: ${err.message}`);
    }
  };

  const isFullProject = validation?.type === 'full-project';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[88vh] flex flex-col overflow-hidden border border-gray-200 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100 bg-white">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Upload size={18} />
            </div>
            <div>
              <p className="font-semibold text-sm text-gray-800">Import Component JSON</p>
              <p className="text-xs text-gray-400 mt-0.5">
                Upload or paste JSON to render layout and elements immediately on the canvas
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors duration-150"
          >
            <X size={16} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 flex-1 overflow-y-auto space-y-4">
          {/* Success Banner */}
          {importSuccessMessage && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2.5 text-xs text-emerald-700 animate-in fade-in duration-150">
              <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
              <span className="font-medium">{importSuccessMessage}</span>
            </div>
          )}

          {/* Drag & Drop Upload Zone */}
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all duration-150 flex flex-col items-center justify-center gap-2 ${
              isDragging
                ? 'border-blue-500 bg-blue-50/70 scale-[0.99]'
                : fileName
                ? 'border-emerald-300 bg-emerald-50/40 hover:bg-emerald-50/60'
                : 'border-gray-200 hover:border-blue-400 hover:bg-gray-50/60'
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              accept=".json,application/json"
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleFile(e.target.files[0]);
                }
              }}
            />

            <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
              {fileName ? <FileCode size={20} className="text-emerald-600" /> : <FolderOpen size={20} />}
            </div>

            <div>
              <p className="text-xs font-medium text-gray-700">
                {fileName ? (
                  <span className="text-emerald-700 font-semibold">{fileName} loaded</span>
                ) : (
                  <>
                    <span className="text-blue-600 hover:underline">Click to upload .json file</span> or drag and drop
                  </>
                )}
              </p>
              <p className="text-[11px] text-gray-400 mt-0.5">Supports exported component JSON or full project state</p>
            </div>
          </div>

          {/* Paste JSON Textarea */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-gray-700 flex items-center gap-1.5">
                <FileJson size={13} className="text-gray-400" />
                Or Paste JSON directly:
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleLoadCurrentSample}
                  className="text-[11px] text-blue-600 hover:text-blue-700 flex items-center gap-1 hover:underline font-medium"
                >
                  <Sparkles size={11} /> Load current canvas JSON
                </button>
                {jsonInput && (
                  <button
                    type="button"
                    onClick={() => {
                      setJsonInput('');
                      setFileName('');
                    }}
                    className="text-[11px] text-gray-400 hover:text-red-500 hover:underline"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>

            <textarea
              rows={8}
              value={jsonInput}
              onChange={(e) => setJsonInput(e.target.value)}
              placeholder={`Paste JSON here...\nExample:\n{\n  "name": "My Component",\n  "rows": [\n    ...\n  ]\n}`}
              className="w-full font-mono text-xs p-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-gray-50/50 resize-y leading-relaxed text-gray-800"
            />
          </div>

          {/* Live Validation Feedback */}
          {validation && (
            <div
              className={`p-3 rounded-xl border text-xs flex items-start gap-2.5 transition-all ${
                validation.isValid
                  ? 'bg-emerald-50/70 border-emerald-200 text-emerald-800'
                  : 'bg-red-50/70 border-red-200 text-red-700'
              }`}
            >
              {validation.isValid ? (
                <CheckCircle2 size={16} className="text-emerald-500 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle size={16} className="text-red-500 shrink-0 mt-0.5" />
              )}
              <div className="flex-1 space-y-1">
                <div className="font-semibold flex items-center gap-2">
                  <span>{validation.isValid ? 'Valid JSON Detected' : 'JSON Validation Error'}</span>
                  {validation.isValid && (
                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full text-[10px] uppercase font-bold tracking-wider">
                      {validation.summary.type}
                    </span>
                  )}
                </div>
                {validation.isValid ? (
                  <div className="text-gray-600 flex flex-wrap gap-x-4 gap-y-1 text-[11.5px] mt-1">
                    {validation.summary.name && (
                      <span>
                        Name: <strong className="text-gray-800">{validation.summary.name}</strong>
                      </span>
                    )}
                    {validation.summary.documentsCount !== undefined && (
                      <span>
                        Components: <strong className="text-gray-800">{validation.summary.documentsCount}</strong>
                      </span>
                    )}
                    <span>
                      Rows: <strong className="text-gray-800">{validation.summary.rowsCount}</strong>
                    </span>
                    <span>
                      Elements: <strong className="text-gray-800">{validation.summary.elementsCount}</strong>
                    </span>
                  </div>
                ) : (
                  <p className="text-[11.5px] text-red-600">{validation.error}</p>
                )}
              </div>
            </div>
          )}

          {/* Import Mode (for single component imports) */}
          {validation?.isValid && !isFullProject && (
            <div className="p-3 bg-gray-50 rounded-xl border border-gray-200/80 space-y-2">
              <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider block">
                Target Canvas
              </span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setMode('replace')}
                  className={`p-2.5 rounded-lg border text-left text-xs transition-all ${
                    mode === 'replace'
                      ? 'bg-white border-blue-500 shadow-sm text-blue-700 font-medium'
                      : 'border-gray-200 bg-white/50 text-gray-600 hover:bg-white'
                  }`}
                >
                  <div className="font-semibold flex items-center gap-1.5">
                    <Layers size={13} />
                    Replace current canvas
                  </div>
                  <p className="text-[10px] text-gray-400 mt-0.5">Overwrites active document with imported rows</p>
                </button>

                <button
                  type="button"
                  onClick={() => setMode('new')}
                  className={`p-2.5 rounded-lg border text-left text-xs transition-all ${
                    mode === 'new'
                      ? 'bg-white border-blue-500 shadow-sm text-blue-700 font-medium'
                      : 'border-gray-200 bg-white/50 text-gray-600 hover:bg-white'
                  }`}
                >
                  <div className="font-semibold flex items-center gap-1.5">
                    <FileCode size={13} />
                    Add as new component
                  </div>
                  <p className="text-[10px] text-gray-400 mt-0.5">Creates a new tab so current work is kept</p>
                </button>
              </div>

              {mode === 'new' && (
                <div className="pt-2">
                  <label className="text-[11px] text-gray-500 block mb-1">Component Name (optional):</label>
                  <input
                    type="text"
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    placeholder={validation.summary.name || 'Imported Component'}
                    className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                  />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-3 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleImport}
            disabled={!validation?.isValid || !!importSuccessMessage}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg shadow-sm transition-all duration-150 ${
              validation?.isValid && !importSuccessMessage
                ? 'bg-blue-600 hover:bg-blue-700 text-white cursor-pointer active:scale-95'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            <span>{isFullProject ? 'Import & Restore Project' : 'Import & Render Component'}</span>
            <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ImportJsonModal({ open, onClose }) {
  if (!open) return null;
  return <ImportJsonDialog onClose={onClose} />;
}
