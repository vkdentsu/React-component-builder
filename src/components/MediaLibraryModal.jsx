import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  Check,
  Eye,
  Folder,
  FolderPlus,
  Image as ImageIcon,
  LoaderCircle,
  RefreshCw,
  Search,
  Upload,
  X,
} from 'lucide-react';
import {
  ACCEPTED_MEDIA_TYPES,
  MAX_MEDIA_FILE_SIZE,
  createMediaFolder,
  fetchMediaAssets,
  fetchMediaFolders,
  formatMediaSize,
  getMediaContentUrl,
  uploadMediaFile,
} from '../utils/mediaApi';

export default function MediaLibraryModal({ open, onClose, onSelect, currentUrl = '' }) {
  const fileInputRef = useRef(null);
  const [assets, setAssets] = useState([]);
  const [mediaFolders, setMediaFolders] = useState([]);
  const [activeFolder, setActiveFolder] = useState(null);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [previewAsset, setPreviewAsset] = useState(null);

  // Quick folder creation inside modal
  const [newFolderOpen, setNewFolderOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [creatingFolder, setCreatingFolder] = useState(false);

  const loadLibrary = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [nextAssets, nextFolders] = await Promise.all([
        fetchMediaAssets(),
        fetchMediaFolders(),
      ]);
      setAssets(nextAssets);
      setMediaFolders(nextFolders);

      if (currentUrl) {
        const matched = nextAssets.find(
          (a) => getMediaContentUrl(a.id) === currentUrl || currentUrl.endsWith(`/api/media/${a.id}/content`)
        );
        if (matched) setSelectedAsset(matched);
      }
    } catch (err) {
      setError(err.message || 'Could not load media library.');
    } finally {
      setLoading(false);
    }
  }, [currentUrl]);

  useEffect(() => {
    if (!open) return undefined;
    let active = true;
    Promise.all([fetchMediaAssets(), fetchMediaFolders()])
      .then(([nextAssets, nextFolders]) => {
        if (!active) return;
        setAssets(nextAssets);
        setMediaFolders(nextFolders);
        if (currentUrl) {
          const matched = nextAssets.find(
            (a) => getMediaContentUrl(a.id) === currentUrl || currentUrl.endsWith(`/api/media/${a.id}/content`)
          );
          if (matched) setSelectedAsset(matched);
        }
      })
      .catch((err) => {
        if (active) setError(err.message || 'Could not load media library.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [open, currentUrl]);

  const folders = useMemo(() => {
    const paths = new Set(mediaFolders.map(({ path }) => path));
    assets.forEach(({ folderPath }) => {
      if (!folderPath) return;
      const segments = folderPath.split('/');
      segments.forEach((_, index) => paths.add(segments.slice(0, index + 1).join('/')));
    });
    return [...paths].sort((a, b) => a.localeCompare(b));
  }, [assets, mediaFolders]);

  const filteredAssets = useMemo(() => assets.filter((asset) => {
    const inFolder = activeFolder === null
      || (activeFolder === ''
        ? !asset.folderPath
        : asset.folderPath === activeFolder || asset.folderPath.startsWith(`${activeFolder}/`));
    const query = search.trim().toLowerCase();
    return inFolder && (!query || `${asset.name} ${asset.folderPath}`.toLowerCase().includes(query));
  }), [activeFolder, assets, search]);

  const folderCount = (folderPath) => folderPath
    ? assets.filter((asset) => asset.folderPath === folderPath || asset.folderPath.startsWith(`${folderPath}/`)).length
    : assets.filter((asset) => !asset.folderPath).length;

  const handleUploadFiles = async (event) => {
    const fileList = event.target.files;
    if (!fileList?.length) return;

    const files = [...fileList];
    event.target.value = '';

    setUploading(true);
    setError('');
    setNotice('');
    let lastUploaded = null;
    let uploadedCount = 0;
    const failures = [];

    const targetFolder = activeFolder !== null ? activeFolder : 'Common Media';

    for (let i = 0; i < files.length; i += 1) {
      const file = files[i];
      setUploadProgress(`Uploading ${i + 1} of ${files.length}: ${file.name}`);

      if (!ACCEPTED_MEDIA_TYPES.has(file.type)) {
        failures.push(`${file.name}: unsupported image format.`);
        continue;
      }
      if (file.size > MAX_MEDIA_FILE_SIZE) {
        failures.push(`${file.name}: exceeds 7 MB limit.`);
        continue;
      }

      try {
        const uploaded = await uploadMediaFile(file, targetFolder);
        lastUploaded = uploaded;
        uploadedCount += 1;
      } catch (uploadErr) {
        failures.push(`${file.name}: ${uploadErr.message}`);
      }
    }

    setUploading(false);
    setUploadProgress('');

    if (uploadedCount > 0) {
      await loadLibrary();
      if (lastUploaded) {
        setSelectedAsset(lastUploaded);
      }
      setNotice(`Uploaded ${uploadedCount} image${uploadedCount === 1 ? '' : 's'} to "${targetFolder || 'Root'}".`);
    }
    if (failures.length > 0) {
      setError(failures.join(' '));
    }
  };

  const handleCreateFolder = async (e) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;
    setCreatingFolder(true);
    setError('');
    try {
      const created = await createMediaFolder(newFolderName.trim(), activeFolder || '');
      await loadLibrary();
      setActiveFolder(created.path);
      setNewFolderName('');
      setNewFolderOpen(false);
      setNotice(`Folder "${created.path}" created.`);
    } catch (err) {
      setError(err.message || 'Could not create folder.');
    } finally {
      setCreatingFolder(false);
    }
  };

  const handleConfirmSelection = (assetToUse = selectedAsset) => {
    if (!assetToUse) return;
    const url = getMediaContentUrl(assetToUse.id);
    onSelect(url, assetToUse);
    onClose();
  };

  if (!open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-3 sm:p-6 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="flex flex-col w-full max-w-4xl h-[85vh] max-h-[680px] rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200 bg-slate-50/70 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-xs">
              <ImageIcon size={16} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-800">Choose from Media Library</h2>
              <p className="text-[11px] text-slate-500">
                Select an existing image from the shared repository or upload a new image.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-2xs"
            >
              <Upload size={13} />
              <span>Upload New</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/gif,image/webp,image/avif"
              multiple
              className="hidden"
              onChange={handleUploadFiles}
            />
            <button
              type="button"
              onClick={loadLibrary}
              disabled={loading || uploading}
              title="Refresh library"
              className="rounded-lg border border-slate-200 bg-white p-1.5 text-slate-500 hover:text-blue-600 disabled:opacity-50"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close media library"
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200/60 hover:text-slate-700"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Status Bar */}
        {(uploading || error || notice) && (
          <div className="px-5 pt-2.5 shrink-0 space-y-1.5">
            {uploading && (
              <div className="flex items-center gap-2 rounded-lg bg-blue-50 border border-blue-200 px-3 py-2 text-xs text-blue-700">
                <LoaderCircle size={14} className="animate-spin shrink-0" />
                <span>{uploadProgress}</span>
              </div>
            )}
            {error && (
              <div className="flex items-center justify-between gap-2 rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-xs text-red-700" role="alert">
                <span>{error}</span>
                <button type="button" onClick={() => setError('')} className="text-red-500 hover:text-red-700">
                  <X size={13} />
                </button>
              </div>
            )}
            {notice && (
              <div className="flex items-center justify-between gap-2 rounded-lg bg-emerald-50 border border-emerald-200 px-3 py-2 text-xs text-emerald-700" role="status">
                <span>{notice}</span>
                <button type="button" onClick={() => setNotice('')} className="text-emerald-500 hover:text-emerald-700">
                  <X size={13} />
                </button>
              </div>
            )}
          </div>
        )}

        {/* Body: Sidebar + Image Grid */}
        <div className="flex-1 min-h-0 grid grid-cols-1 md:grid-cols-[210px_1fr] divide-y md:divide-y-0 md:divide-x divide-slate-200 overflow-hidden">
          {/* Folders Column */}
          <aside className="p-3 bg-slate-50/50 flex flex-col gap-2 overflow-y-auto">
            <div className="flex items-center justify-between px-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Folders</span>
              <button
                type="button"
                onClick={() => setNewFolderOpen((v) => !v)}
                className="text-[11px] font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
              >
                <FolderPlus size={12} /> New
              </button>
            </div>

            {newFolderOpen && (
              <form onSubmit={handleCreateFolder} className="p-2 rounded-xl bg-white border border-slate-200 space-y-2 shadow-2xs">
                <input
                  type="text"
                  autoFocus
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  placeholder="Folder name..."
                  maxLength={100}
                  className="w-full rounded-lg border border-slate-200 px-2 py-1 text-xs outline-none focus:border-blue-400"
                />
                <div className="flex justify-end gap-1">
                  <button
                    type="button"
                    onClick={() => setNewFolderOpen(false)}
                    className="px-2 py-1 text-[10px] text-slate-500 hover:bg-slate-100 rounded"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={creatingFolder || !newFolderName.trim()}
                    className="px-2.5 py-1 text-[10px] font-semibold bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                  >
                    {creatingFolder ? '...' : 'Add'}
                  </button>
                </div>
              </form>
            )}

            <div className="space-y-0.5">
              <button
                type="button"
                onClick={() => setActiveFolder(null)}
                className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-xs transition-colors ${
                  activeFolder === null ? 'bg-blue-600 font-semibold text-white shadow-2xs' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <span className="flex items-center gap-2 truncate">
                  <ImageIcon size={13} />
                  <span>All Images</span>
                </span>
                <span className={`text-[10px] ${activeFolder === null ? 'text-blue-100' : 'text-slate-400'}`}>
                  {assets.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveFolder('')}
                className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-xs transition-colors ${
                  activeFolder === '' ? 'bg-blue-600 font-semibold text-white shadow-2xs' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <span className="flex items-center gap-2 truncate">
                  <Folder size={13} />
                  <span>Unfiled</span>
                </span>
                <span className={`text-[10px] ${activeFolder === '' ? 'text-blue-100' : 'text-slate-400'}`}>
                  {folderCount('')}
                </span>
              </button>

              {folders.map((folderPath) => {
                const isSelected = activeFolder === folderPath;
                const depth = folderPath.split('/').length - 1;
                const displayName = folderPath.split('/').pop();
                return (
                  <button
                    type="button"
                    key={folderPath}
                    onClick={() => setActiveFolder(folderPath)}
                    title={folderPath}
                    style={{ paddingLeft: `${Math.min(depth * 10 + 10, 42)}px` }}
                    className={`flex w-full items-center justify-between gap-2 rounded-lg pr-2.5 py-1.5 text-left text-xs transition-colors ${
                      isSelected ? 'bg-blue-600 font-semibold text-white shadow-2xs' : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <span className="flex min-w-0 items-center gap-1.5">
                      <Folder size={13} className={`shrink-0 ${isSelected ? 'text-white' : 'text-amber-500'}`} />
                      <span className="truncate">{displayName}</span>
                    </span>
                    <span className={`text-[10px] shrink-0 ${isSelected ? 'text-blue-100' : 'text-slate-400'}`}>
                      {folderCount(folderPath)}
                    </span>
                  </button>
                );
              })}
            </div>
          </aside>

          {/* Main Grid Column */}
          <div className="flex flex-col min-h-0 bg-white">
            {/* Search Bar */}
            <div className="flex items-center justify-between gap-3 px-4 py-2.5 border-b border-slate-100 shrink-0">
              <div className="text-xs text-slate-500 truncate">
                Showing <strong className="text-slate-700">{filteredAssets.length}</strong> image{filteredAssets.length === 1 ? '' : 's'}
                {activeFolder ? ` in "${activeFolder}"` : activeFolder === '' ? ' in Unfiled' : ''}
              </div>
              <div className="relative w-full max-w-xs">
                <Search size={13} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search images by name or folder..."
                  aria-label="Search images in media library"
                  className="w-full rounded-lg border border-slate-200 bg-slate-50/70 pl-7 pr-7 py-1.5 text-xs outline-none focus:border-blue-400 focus:bg-white"
                />
                {search && (
                  <button
                    type="button"
                    onClick={() => setSearch('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X size={12} />
                  </button>
                )}
              </div>
            </div>

            {/* Assets Grid */}
            <div className="flex-1 overflow-y-auto p-4">
              {loading ? (
                <div className="flex flex-col items-center justify-center h-full py-12 text-xs text-slate-400 gap-2">
                  <LoaderCircle size={22} className="animate-spin text-blue-600" />
                  <span>Loading images…</span>
                </div>
              ) : filteredAssets.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full py-12 text-center">
                  <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-2.5">
                    <ImageIcon size={20} />
                  </div>
                  <p className="text-sm font-semibold text-slate-700">
                    {search ? 'No matching images found' : 'No images in this folder'}
                  </p>
                  <p className="text-xs text-slate-400 mt-1 max-w-xs">
                    Upload an image from your device or select another folder.
                  </p>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-blue-700"
                  >
                    <Upload size={13} /> Upload Image
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                  {filteredAssets.map((asset) => {
                    const isSelected = selectedAsset?.id === asset.id;
                    const imageUrl = getMediaContentUrl(asset.id);
                    return (
                      <div
                        key={asset.id}
                        onClick={() => setSelectedAsset(asset)}
                        onDoubleClick={() => handleConfirmSelection(asset)}
                        className={`group relative rounded-xl border overflow-hidden cursor-pointer transition-all flex flex-col ${
                          isSelected
                            ? 'border-blue-600 ring-2 ring-blue-500/25 bg-blue-50/20 shadow-sm'
                            : 'border-slate-200 hover:border-blue-300 bg-white'
                        }`}
                      >
                        <div className="relative h-28 bg-slate-100 flex items-center justify-center overflow-hidden">
                          <img
                            src={imageUrl}
                            alt={asset.name}
                            loading="lazy"
                            className="w-full h-full object-cover"
                          />
                          {isSelected && (
                            <div className="absolute left-2 top-2 w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-sm">
                              <Check size={12} />
                            </div>
                          )}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setPreviewAsset(asset);
                            }}
                            title="Preview full image"
                            className="opacity-0 group-hover:opacity-100 absolute right-2 top-2 rounded-lg bg-white/90 p-1.5 text-slate-600 hover:text-blue-600 shadow-sm transition-opacity"
                          >
                            <Eye size={12} />
                          </button>
                        </div>
                        <div className="p-2">
                          <p className="truncate text-[11px] font-semibold text-slate-800" title={asset.name}>
                            {asset.name}
                          </p>
                          <p className="truncate text-[10px] text-slate-400 mt-0.5">
                            {asset.folderPath || 'Unfiled'} · {formatMediaSize(asset.size)}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between gap-3 px-5 py-3 border-t border-slate-200 bg-slate-50 shrink-0">
          <div className="min-w-0 flex-1">
            {selectedAsset ? (
              <div className="flex items-center gap-2 text-xs text-slate-700 truncate">
                <span className="font-semibold truncate">{selectedAsset.name}</span>
                <span className="text-slate-400">
                  ({selectedAsset.folderPath || 'Unfiled'} · {formatMediaSize(selectedAsset.size)})
                </span>
              </div>
            ) : (
              <span className="text-xs text-slate-400">Click an image to select, or double-click to insert immediately.</span>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={!selectedAsset}
              onClick={() => handleConfirmSelection(selectedAsset)}
              className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-xs"
            >
              Use Selected Image
            </button>
          </div>
        </div>
      </div>

      {/* Lightbox Preview inside Selection Modal */}
      {previewAsset && (
        <div
          className="fixed inset-0 z-[110] flex items-center justify-center bg-black/75 p-4"
          onClick={() => setPreviewAsset(null)}
        >
          <div
            className="max-w-2xl w-full rounded-2xl bg-white overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
              <div>
                <p className="text-xs font-bold text-slate-800">{previewAsset.name}</p>
                <p className="text-[10px] text-slate-400">
                  {previewAsset.folderPath || 'Unfiled'} · {formatMediaSize(previewAsset.size)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPreviewAsset(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X size={16} />
              </button>
            </div>
            <div className="bg-slate-900 p-6 flex items-center justify-center max-h-[65vh]">
              <img
                src={getMediaContentUrl(previewAsset.id)}
                alt={previewAsset.name}
                className="max-h-[55vh] max-w-full object-contain rounded"
              />
            </div>
            <div className="flex justify-end gap-2 px-4 py-3 border-t border-slate-100 bg-slate-50">
              <button
                type="button"
                onClick={() => setPreviewAsset(null)}
                className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100"
              >
                Close Preview
              </button>
              <button
                type="button"
                onClick={() => {
                  handleConfirmSelection(previewAsset);
                }}
                className="rounded-lg bg-blue-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-blue-700"
              >
                Select This Image
              </button>
            </div>
          </div>
        </div>
      )}
    </div>,
    document.body
  );
}

