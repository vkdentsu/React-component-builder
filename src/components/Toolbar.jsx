import { useNavigate } from 'react-router-dom';
import { Monitor, Tablet, Smartphone, Trash2, Code2, Undo2, Redo2, Eye, Upload, FileJson, ArrowLeft, Save, Globe, ExternalLink } from 'lucide-react';
import useBuilderStore from '../store/builderStore';
import DocumentSwitcher from './DocumentSwitcher';

const DEVICES = [
  { id: 'desktop', label: 'Desktop', Icon: Monitor },
  { id: 'tablet', label: 'Tablet', Icon: Tablet },
  { id: 'mobile', label: 'Mobile', Icon: Smartphone },
];

export default function Toolbar({
  onExport,
  onExportJson,
  onImportJson,
  onPreview,
  onDeployVercel,
  vercelConnected,
  isDeploying,
  canUndo,
  canRedo,
  onSavePage,
  isSaving,
  pageMeta,
  onPublishPage,
  onChangeToDraft,
  onOpenPublishedUrl,
  isPublishingPage,
  showExportJsx = false,
}) {
  const navigate = useNavigate();
  const { device, setDevice, clearAll, undo, redo } = useBuilderStore();
  const isPublished = pageMeta?.status === 'PUBLISHED';

  return (
    <header className="h-12 bg-white border-b border-gray-200 flex items-center justify-between px-3 sm:px-4 shrink-0 gap-2 min-w-0">
      {/* Brand + document switcher */}
      <div className="flex items-center gap-1.5 min-w-0 shrink">
        <button
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors shrink-0"
          title="Return to Dashboard"
        >
          <ArrowLeft size={13} />
          <span className="hidden sm:inline">Dashboard</span>
        </button>
        <div className="w-6 h-6 rounded-md bg-gradient-to-br from-blue-500 to-violet-600 hidden sm:flex items-center justify-center shrink-0">
          <Code2 size={13} className="text-white" />
        </div>
        <span className="font-semibold text-sm text-gray-800 hidden xl:inline shrink-0">Compify</span>
        <div className="ml-0.5 flex items-center min-w-0">
          <DocumentSwitcher />
        </div>
      </div>

      {/* Device switcher */}
      <div className="flex items-center gap-0.5 bg-gray-100 rounded-lg p-0.5 shrink-0">
        {DEVICES.map(({ id, label, Icon }) => (
          <button
            key={id}
            onClick={() => setDevice(id)}
            title={label}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all duration-150
              ${device === id
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
              }`}
          >
            <Icon size={13} />
            <span className="hidden lg:inline">{label}</span>
          </button>
        ))}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
        {/* Undo / Redo */}
        <div className="flex items-center gap-0.5">
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
          title="Clear canvas"
          className="flex items-center gap-1 px-2 py-1.5 text-xs text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg border border-gray-200 hover:border-red-200 transition-all duration-150"
        >
          <Trash2 size={13} />
          <span className="hidden xl:inline">Clear</span>
        </button>

        {/* 1. Preview */}
        <button
          onClick={onPreview}
          title="Preview in Builder"
          className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-gray-700 bg-white hover:bg-gray-50 rounded-lg border border-gray-200 transition-colors duration-150"
        >
          <Eye size={13} />
          <span>Preview</span>
        </button>

        {/* 2. Publish / Unpublish */}
        {onPublishPage && (
          <button
            type="button"
            onClick={() => {
              if (isPublished) {
                if (onChangeToDraft) onChangeToDraft(false);
              } else {
                onPublishPage(false);
              }
            }}
            disabled={isPublishingPage || isSaving}
            title={isPublished ? 'Unpublish this page' : 'Publish this page'}
            className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-colors disabled:opacity-50 shadow-2xs ${isPublished
                ? 'bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white'
              }`}
          >
            <Globe size={13} className="shrink-0" />
            <span>
              {isPublishingPage
                ? isPublished
                  ? 'Unpublishing...'
                  : 'Publishing...'
                : isPublished
                  ? 'Unpublish'
                  : 'Publish'}
            </span>
          </button>
        )}

        {/* 3. Open Page */}
        {onOpenPublishedUrl && (
          <button
            type="button"
            onClick={onOpenPublishedUrl}
            disabled={isPublishingPage || isSaving}
            title={
              isPublished
                ? `Open published page at /${pageMeta?.slug || ''}`
                : 'Publish this page first to open the published URL'
            }
            className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-colors disabled:opacity-50 ${isPublished
                ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200'
                : 'bg-gray-50 hover:bg-gray-100 text-gray-500 border border-gray-200'
              }`}
          >
            <ExternalLink size={13} className="shrink-0" />
            <span>Open Page</span>
          </button>
        )}

        {/* Import JSON CTA */}
        <button
          onClick={onImportJson}
          title="Import JSON to render component"
          className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors duration-150 shadow-xs"
        >
          <Upload size={13} className="text-blue-600 shrink-0" />
          <span className="hidden xl:inline">Import JSON</span>
          <span className="hidden md:inline xl:hidden">Import</span>
        </button>

        {/* Export JSON CTA */}
        <button
          onClick={onExportJson}
          title="Export component or project JSON"
          className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors duration-150 shadow-xs"
        >
          <FileJson size={13} className="text-emerald-600 shrink-0" />
          <span className="hidden xl:inline">Export JSON</span>
          <span className="hidden md:inline xl:hidden">Export</span>
        </button>

        {/* Save Page */}
        {onSavePage && (
          <button
            onClick={onSavePage}
            disabled={isSaving}
            title="Save page structure and components to database"
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-lg transition-colors duration-150 shadow-xs"
          >
            <Save size={13} />
            <span>{isSaving ? 'Saving...' : 'Save'}</span>
          </button>
        )}

        {/* Export JSX — Temporarily hidden so it can be re-enabled later */}
        {showExportJsx && (
          <button
            onClick={onExport}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors duration-150 shadow-xs"
          >
            <Code2 size={13} />
            <span className="hidden md:inline">Export JSX</span>
            <span className="md:hidden">JSX</span>
          </button>
        )}

        {/* Export JSX */}
        <button
          onClick={onExport}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors duration-150 shadow-xs"
        >
          <Code2 size={13} />
          <span className="hidden md:inline">Export JSX</span>
          <span className="md:hidden">JSX</span>
        </button>
        {onDeployVercel && (
          <button
            onClick={onDeployVercel}
            disabled={!vercelConnected || isDeploying}
            title={vercelConnected ? 'Deploy the current Builder project directly to Vercel' : 'Add a Vercel token in Dashboard > Settings'}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-white bg-black hover:bg-gray-800 disabled:opacity-50 rounded-lg transition-colors duration-150"
          >
            <span>{isDeploying ? 'Deploying...' : 'Deploy to Vercel'}</span>
          </button>
        )}
      </div>
    </header>
  );
}
