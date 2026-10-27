import { useState, useMemo } from 'react';
import { X, Copy, Check, Download, FileJson, Layers, Database } from 'lucide-react';
import useBuilderStore from '../store/builderStore';
import { countElements } from '../utils/jsonImporter';

const toKebabOrPascal = (str) =>
  (str || 'component')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'component';

function ExportJsonDialog({ onClose }) {
  const { getExportJson, documents, activeDocId } = useBuilderStore();
  const [scope, setScope] = useState('current'); // 'current' | 'project'
  const [copied, setCopied] = useState(false);
  const [downloaded, setDownloaded] = useState(false);

  const activeDoc = documents.find((d) => d.id === activeDocId);
  const docName = activeDoc?.name || 'My Component';

  const exportData = useMemo(() => {
    return getExportJson(scope);
  }, [scope, getExportJson]);

  const jsonString = useMemo(() => {
    if (!exportData) return '';
    return JSON.stringify(exportData, null, 2);
  }, [exportData]);

  const stats = useMemo(() => {
    if (!exportData) return { rows: 0, elements: 0, sizeKb: '0' };
    const bytes = new Blob([jsonString]).size;
    const sizeKb = (bytes / 1024).toFixed(1);

    if (scope === 'current') {
      const rows = exportData.rows || [];
      return {
        rows: rows.length,
        elements: countElements(rows),
        sizeKb,
      };
    } else {
      const docs = exportData.state?.documents || [];
      const totalRows = docs.reduce((acc, d) => acc + (d.rows ? d.rows.length : 0), 0);
      const totalElements = docs.reduce((acc, d) => acc + countElements(d.rows || []), 0);
      return {
        rows: totalRows,
        elements: totalElements,
        componentsCount: docs.length,
        sizeKb,
      };
    }
  }, [exportData, jsonString, scope]);

  const handleCopy = async () => {
    if (!jsonString) return;
    await navigator.clipboard.writeText(jsonString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!jsonString) return;
    const filename = scope === 'current'
      ? `${toKebabOrPascal(docName)}.json`
      : 'component-builder-state.json';

    const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setDownloaded(true);
    setTimeout(() => setDownloaded(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden border border-gray-200 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100 bg-white">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <FileJson size={18} />
            </div>
            <div>
              <p className="font-semibold text-sm text-gray-800">
                Export JSON {scope === 'current' ? `(${docName})` : '(Full Project State)'}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">
                Download or copy structured JSON to save, share, or import later
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

        {/* Scope Selector Bar */}
        <div className="px-5 py-2.5 bg-gray-50 border-b border-gray-100 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center bg-gray-200/80 p-0.5 rounded-lg">
            <button
              onClick={() => setScope('current')}
              className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-md transition-all ${
                scope === 'current'
                  ? 'bg-white text-gray-800 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Layers size={12} />
              <span>Active Component</span>
            </button>
            <button
              onClick={() => setScope('project')}
              className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-md transition-all ${
                scope === 'project'
                  ? 'bg-white text-gray-800 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Database size={12} />
              <span>Full Project State</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownload}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-all duration-150 ${
                downloaded
                  ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm'
              }`}
            >
              {downloaded ? <Check size={13} /> : <Download size={13} />}
              <span>{downloaded ? 'Downloaded!' : 'Download .json'}</span>
            </button>
            <button
              onClick={handleCopy}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-all duration-150 ${
                copied
                  ? 'bg-green-100 text-green-700 border-green-200'
                  : 'bg-white hover:bg-gray-100 text-gray-700 border-gray-200'
              }`}
            >
              {copied ? <Check size={13} /> : <Copy size={13} />}
              <span>{copied ? 'Copied!' : 'Copy JSON'}</span>
            </button>
          </div>
        </div>

        {/* Code Content */}
        <div className="flex-1 overflow-auto bg-[#1e1e2e]">
          <pre className="p-5 text-[12px] leading-relaxed text-[#cdd6f4] font-mono whitespace-pre overflow-x-auto">
            {jsonString}
          </pre>
        </div>

        {/* Footer info stats */}
        <div className="px-5 py-2.5 border-t border-gray-100 bg-gray-50 flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center gap-4 flex-wrap">
            {scope === 'project' && (
              <span>
                <strong className="text-gray-700">{stats.componentsCount}</strong> component(s)
              </span>
            )}
            <span>
              <strong className="text-gray-700">{stats.rows}</strong> row(s)
            </span>
            <span>
              <strong className="text-gray-700">{stats.elements}</strong> element(s)
            </span>
            <span>
              Size: <strong className="text-gray-700">{stats.sizeKb} KB</strong>
            </span>
          </div>
          <span className="text-[11px] text-gray-400">Valid JSON · Ready for re-import</span>
        </div>
      </div>
    </div>
  );
}

export default function ExportJsonModal({ open, onClose }) {
  if (!open) return null;
  return <ExportJsonDialog onClose={onClose} />;
}
