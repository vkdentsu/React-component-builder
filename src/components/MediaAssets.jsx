import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Check,
  Copy,
  Edit2,
  Eye,
  Folder,
  FolderInput,
  FolderPlus,
  Image as ImageIcon,
  LoaderCircle,
  RefreshCw,
  Search,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import {
  ACCEPTED_MEDIA_TYPES,
  MAX_MEDIA_FILE_SIZE,
  createMediaFolder,
  deleteMediaAsset,
  deleteMediaFolder,
  fetchMediaAssets,
  fetchMediaFolders,
  formatMediaSize,
  getMediaContentUrl,
  renameMediaFolder,
  updateMediaAsset,
  uploadMediaFile,
} from '../utils/mediaApi';

function getFolderPath(file) {
  const relativePath = file.webkitRelativePath || '';
  return relativePath.split('/').slice(0, -1).join('/');
}

export default function MediaAssets() {
  const filesInputRef = useRef(null);
  const folderInputRef = useRef(null);
  const [assets, setAssets] = useState([]);
  const [mediaFolders, setMediaFolders] = useState([]);
  const [activeFolder, setActiveFolder] = useState(null);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');
  const [uploadTargetFolder, setUploadTargetFolder] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [deletingId, setDeletingId] = useState(null);

  // Create Folder Modal
  const [createFolderOpen, setCreateFolderOpen] = useState(false);
  const [folderName, setFolderName] = useState('');
  const [folderParentPath, setFolderParentPath] = useState('');
  const [creatingFolder, setCreatingFolder] = useState(false);

  // Rename Folder Modal
  const [renameFolderTarget, setRenameFolderTarget] = useState(null);
  const [renameFolderValue, setRenameFolderValue] = useState('');
  const [renamingFolder, setRenamingFolder] = useState(false);

  // Delete Folder Modal
  const [deleteFolderTarget, setDeleteFolderTarget] = useState(null);
  const [deleteFolderWithAssets, setDeleteFolderWithAssets] = useState(false);
  const [deletingFolder, setDeletingFolder] = useState(false);

  // Preview / Edit Asset Modal
  const [previewAsset, setPreviewAsset] = useState(null);
  const [moveTargetFolder, setMoveTargetFolder] = useState('');
  const [editAssetName, setEditAssetName] = useState('');
  const [updatingAsset, setUpdatingAsset] = useState(false);
  const [copiedId, setCopiedId] = useState(null);

  const loadAssets = useCallback(async () => {
    try {
      const [nextAssets, nextFolders] = await Promise.all([
        fetchMediaAssets(),
        fetchMediaFolders(),
      ]);
      setAssets(nextAssets);
      setMediaFolders(nextFolders);
    } catch (loadError) {
      setError(loadError.message || 'Could not load media assets.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    Promise.all([fetchMediaAssets(), fetchMediaFolders()])
      .then(([nextAssets, nextFolders]) => {
        if (active) {
          setAssets(nextAssets);
          setMediaFolders(nextFolders);
        }
      })
      .catch((loadError) => {
        if (active) setError(loadError.message || 'Could not load media assets.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const selectFolder = (folderPath) => {
    setActiveFolder(folderPath);
    if (folderPath !== null) {
      setUploadTargetFolder(folderPath);
    }
  };

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

  const uploadFiles = async (fileList) => {
    const rawFiles = [...fileList];
    if (rawFiles.length === 0) {
      setError('Choose image files to upload.');
      return;
    }

    setUploading(true);
    setError('');
    setNotice('');
    let uploaded = 0;
    const failures = [];

    const targetFolder = activeFolder !== null ? activeFolder : uploadTargetFolder;

    for (let index = 0; index < rawFiles.length; index += 1) {
      const file = rawFiles[index];
      setUploadProgress(`Uploading ${index + 1} of ${rawFiles.length}: ${file.name}`);

      if (!ACCEPTED_MEDIA_TYPES.has(file.type)) {
        failures.push(`${file.name}: unsupported file format (only PNG, JPEG, GIF, WebP, AVIF allowed).`);
        continue;
      }
      if (file.size > MAX_MEDIA_FILE_SIZE) {
        failures.push(`${file.name}: exceeds 7 MB limit (${formatMediaSize(file.size)}).`);
        continue;
      }

      try {
        const relativeDir = getFolderPath(file);
        const resolvedFolder = relativeDir
          ? (targetFolder ? `${targetFolder}/${relativeDir}` : relativeDir)
          : (targetFolder || '');
        await uploadMediaFile(file, resolvedFolder);
        uploaded += 1;
      } catch (uploadError) {
        failures.push(`${file.name}: ${uploadError.message}`);
      }
    }

    setUploading(false);
    setUploadProgress('');
    if (uploaded > 0) {
      setNotice(`${uploaded} image${uploaded === 1 ? '' : 's'} uploaded successfully.`);
      setLoading(true);
      await loadAssets();
    }
    if (failures.length > 0) {
      setError(`Some files could not be uploaded: ${failures.slice(0, 3).join(' ')}${failures.length > 3 ? ` And ${failures.length - 3} more.` : ''}`);
    }
  };

  const handleInputChange = (event) => {
    if (event.target.files?.length) uploadFiles(event.target.files);
    event.target.value = '';
  };

  const handleCreateFolder = async (event) => {
    event.preventDefault();
    if (!folderName.trim()) return;
    setCreatingFolder(true);
    setError('');
    setNotice('');
    try {
      const created = await createMediaFolder(folderName.trim(), folderParentPath);
      await loadAssets();
      selectFolder(created.path);
      setFolderName('');
      setCreateFolderOpen(false);
      setNotice(`Folder "${created.path}" created.`);
    } catch (createError) {
      setError(createError.message || 'Could not create the folder.');
    } finally {
      setCreatingFolder(false);
    }
  };

  const handleRenameFolder = async (event) => {
    event.preventDefault();
    if (!renameFolderTarget || !renameFolderValue.trim()) return;
    setRenamingFolder(true);
    setError('');
    setNotice('');
    try {
      const updated = await renameMediaFolder(renameFolderTarget, renameFolderValue.trim());
      await loadAssets();
      if (activeFolder === renameFolderTarget || activeFolder?.startsWith(`${renameFolderTarget}/`)) {
        selectFolder(updated.path);
      }
      setNotice(`Folder renamed to "${updated.path}".`);
      setRenameFolderTarget(null);
      setRenameFolderValue('');
    } catch (renameError) {
      setError(renameError.message || 'Could not rename the folder.');
    } finally {
      setRenamingFolder(false);
    }
  };

  const handleDeleteFolder = async () => {
    if (!deleteFolderTarget) return;
    setDeletingFolder(true);
    setError('');
    setNotice('');
    try {
      await deleteMediaFolder(deleteFolderTarget, deleteFolderWithAssets);
      if (activeFolder === deleteFolderTarget || activeFolder?.startsWith(`${deleteFolderTarget}/`)) {
        selectFolder(null);
      }
      await loadAssets();
      setNotice(`Folder "${deleteFolderTarget}" deleted.`);
      setDeleteFolderTarget(null);
      setDeleteFolderWithAssets(false);
    } catch (delError) {
      setError(delError.message || 'Could not delete the folder.');
    } finally {
      setDeletingFolder(false);
    }
  };

  const handleDeleteAsset = async (asset) => {
    if (!window.confirm(`Delete "${asset.name}" from the shared media library?`)) return;
    setDeletingId(asset.id);
    setError('');
    setNotice('');
    try {
      await deleteMediaAsset(asset.id);
      setAssets((current) => current.filter((item) => item.id !== asset.id));
      if (previewAsset?.id === asset.id) setPreviewAsset(null);
      setNotice(`"${asset.name}" deleted.`);
    } catch (deleteError) {
      setError(deleteError.message || 'Could not delete the image.');
    } finally {
      setDeletingId(null);
    }
  };

  const openAssetDetails = (asset) => {
    setPreviewAsset(asset);
    setEditAssetName(asset.name);
    setMoveTargetFolder(asset.folderPath || '');
  };

  const handleUpdateAsset = async (event) => {
    event.preventDefault();
    if (!previewAsset) return;
    setUpdatingAsset(true);
    setError('');
    setNotice('');
    try {
      const updated = await updateMediaAsset(previewAsset.id, {
        name: editAssetName.trim() || previewAsset.name,
        folderPath: moveTargetFolder,
      });
      await loadAssets();
      setPreviewAsset(updated);
      setNotice(`Updated "${updated.name}".`);
    } catch (updateErr) {
      setError(updateErr.message || 'Could not update image details.');
    } finally {
      setUpdatingAsset(false);
    }
  };

  const copyAssetUrl = async (asset) => {
    const url = getMediaContentUrl(asset.id);
    try {
      await navigator.clipboard.writeText(url);
      setCopiedId(asset.id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      // Ignore clipboard failure
    }
  };

  const folderCount = (folderPath) => folderPath
    ? assets.filter((asset) => asset.folderPath === folderPath || asset.folderPath.startsWith(`${folderPath}/`)).length
    : assets.filter((asset) => !asset.folderPath).length;

  return (
    <section className="space-y-6 animate-in fade-in duration-200">
      {/* Header & Actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Media Library</h1>
          <p className="mt-1 text-xs text-slate-500">
            Shared media repository across all authenticated users. Organize images into folders and reuse them in the Component Builder.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setFolderParentPath(activeFolder || '');
              setFolderName('');
              setCreateFolderOpen(true);
            }}
            disabled={uploading}
            className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:border-blue-300 hover:bg-slate-50 disabled:opacity-50 transition-colors"
          >
            <FolderPlus size={14} className="text-blue-600" /> New Folder
          </button>
          <button
            type="button"
            onClick={() => folderInputRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:border-blue-300 hover:bg-slate-50 disabled:opacity-50 transition-colors"
          >
            <Folder size={14} className="text-indigo-600" /> Upload Folder
          </button>
          <button
            type="button"
            onClick={() => filesInputRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-xs transition-colors hover:bg-blue-700 disabled:opacity-50"
          >
            <Upload size={14} /> Upload Images
          </button>
          <button
            type="button"
            onClick={() => {
              setError('');
              setLoading(true);
              loadAssets();
            }}
            disabled={loading || uploading}
            aria-label="Refresh media assets"
            title="Refresh media library"
            className="rounded-xl border border-slate-200 bg-white p-2 text-slate-500 hover:text-blue-600 disabled:opacity-50 transition-colors"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
        <input
          ref={folderInputRef}
          type="file"
          accept="image/png,image/jpeg,image/gif,image/webp,image/avif"
          multiple
          webkitdirectory=""
          directory=""
          className="hidden"
          onChange={handleInputChange}
        />
        <input
          ref={filesInputRef}
          type="file"
          accept="image/png,image/jpeg,image/gif,image/webp,image/avif"
          multiple
          className="hidden"
          onChange={handleInputChange}
        />
      </div>

      {/* Status banners */}
      {uploading && (
        <div className="flex items-center gap-2 rounded-xl bg-blue-50 border border-blue-200 px-4 py-3 text-xs text-blue-700" role="status">
          <LoaderCircle size={15} className="animate-spin shrink-0" />
          <span>{uploadProgress}</span>
        </div>
      )}
      {error && (
        <div className="flex items-center justify-between gap-2 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-xs text-red-700" role="alert">
          <span>{error}</span>
          <button type="button" onClick={() => setError('')} className="text-red-500 hover:text-red-700">
            <X size={14} />
          </button>
        </div>
      )}
      {notice && (
        <div className="flex items-center justify-between gap-2 rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3 text-xs text-emerald-700" role="status">
          <span>{notice}</span>
          <button type="button" onClick={() => setNotice('')} className="text-emerald-500 hover:text-emerald-700">
            <X size={14} />
          </button>
        </div>
      )}

      {/* Main Content Layout */}
      <div className="grid gap-5 lg:grid-cols-[260px_minmax(0,1fr)]">
        {/* Sidebar: Folder Navigation & Management */}
        <aside className="h-fit rounded-2xl border border-slate-200 bg-white p-3.5 shadow-2xs space-y-3">
          <div className="flex items-center justify-between px-1.5">
            <h2 className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Folders</h2>
            <button
              type="button"
              onClick={() => {
                setFolderParentPath(activeFolder || '');
                setFolderName('');
                setCreateFolderOpen(true);
              }}
              title="Create new folder"
              className="text-[11px] font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              <FolderPlus size={12} /> Add
            </button>
          </div>

          <div className="space-y-1 max-h-[460px] overflow-y-auto pr-0.5">
            <button
              type="button"
              onClick={() => selectFolder(null)}
              className={`flex w-full items-center justify-between rounded-xl px-2.5 py-2 text-left text-xs transition-colors ${
                activeFolder === null ? 'bg-blue-50 font-semibold text-blue-700' : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <span className="flex items-center gap-2">
                <ImageIcon size={14} className={activeFolder === null ? 'text-blue-600' : 'text-slate-400'} />
                <span>All Media</span>
              </span>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600">
                {assets.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => selectFolder('')}
              className={`flex w-full items-center justify-between rounded-xl px-2.5 py-2 text-left text-xs transition-colors ${
                activeFolder === '' ? 'bg-blue-50 font-semibold text-blue-700' : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <span className="flex items-center gap-2">
                <Folder size={14} className={activeFolder === '' ? 'text-blue-600' : 'text-slate-400'} />
                <span>Unfiled / Root</span>
              </span>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600">
                {folderCount('')}
              </span>
            </button>

            {folders.map((folderPath) => {
              const isSelected = activeFolder === folderPath;
              const depth = folderPath.split('/').length - 1;
              const displayName = folderPath.split('/').pop();
              return (
                <div
                  key={folderPath}
                  className={`group flex items-center justify-between gap-1 rounded-xl px-2.5 py-1.5 text-xs transition-colors ${
                    isSelected ? 'bg-blue-50 font-semibold text-blue-700' : 'text-slate-600 hover:bg-slate-50'
                  }`}
                  style={{ paddingLeft: `${Math.min(depth * 12 + 10, 46)}px` }}
                >
                  <button
                    type="button"
                    onClick={() => selectFolder(folderPath)}
                    title={folderPath}
                    className="flex min-w-0 flex-1 items-center gap-2 text-left py-0.5"
                  >
                    <Folder size={14} className={`shrink-0 ${isSelected ? 'text-blue-600' : 'text-amber-500'}`} />
                    <span className="truncate">{displayName}</span>
                  </button>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setRenameFolderTarget(folderPath);
                        setRenameFolderValue(displayName);
                      }}
                      title={`Rename ${folderPath}`}
                      aria-label={`Rename ${folderPath}`}
                      className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-slate-200/70 text-slate-400 hover:text-slate-700 transition-opacity"
                    >
                      <Edit2 size={11} />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteFolderTarget(folderPath);
                        setDeleteFolderWithAssets(false);
                      }}
                      title={`Delete ${folderPath}`}
                      aria-label={`Delete ${folderPath}`}
                      className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-rose-100 text-slate-400 hover:text-rose-600 transition-opacity"
                    >
                      <Trash2 size={11} />
                    </button>
                    <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-500 min-w-[20px] text-center">
                      {folderCount(folderPath)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </aside>

        {/* Main Panel: Filter Bar & Grid */}
        <div className="min-w-0 space-y-4">
          <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-3.5 shadow-2xs sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600">
              <span className="font-semibold text-slate-800">
                {filteredAssets.length} image{filteredAssets.length === 1 ? '' : 's'}
              </span>
              {activeFolder !== null && (
                <span className="inline-flex items-center gap-1 rounded-lg bg-blue-50 px-2.5 py-1 text-[11px] font-medium text-blue-700">
                  <Folder size={12} />
                  {activeFolder === '' ? 'Unfiled / Root' : activeFolder}
                </span>
              )}
              <span className="text-slate-400 hidden sm:inline">·</span>
              <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                <span>Upload target:</span>
                <select
                  value={activeFolder !== null ? activeFolder : uploadTargetFolder}
                  onChange={(e) => {
                    const val = e.target.value;
                    setUploadTargetFolder(val);
                    if (activeFolder !== null) setActiveFolder(val);
                  }}
                  aria-label="Target folder for uploads"
                  className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-medium text-slate-700 outline-none focus:border-blue-400"
                >
                  <option value="">Unfiled / Root</option>
                  {folders.map((path) => (
                    <option key={path} value={path}>{path}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="relative w-full sm:max-w-xs">
              <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search by filename or folder..."
                aria-label="Search media assets"
                className="w-full rounded-xl border border-slate-200 bg-slate-50/60 pl-8 pr-8 py-1.5 text-xs outline-none focus:border-blue-400 focus:bg-white transition-colors"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X size={13} />
                </button>
              )}
            </div>
          </div>

          {loading ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center text-xs text-slate-500 flex flex-col items-center justify-center gap-2">
              <LoaderCircle size={22} className="animate-spin text-blue-600" />
              <span>Loading shared media library…</span>
            </div>
          ) : filteredAssets.length === 0 ? (
            <div className="rounded-2xl border-2 border-dashed border-slate-300 bg-white px-6 py-14 text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <Upload size={20} />
              </div>
              <p className="text-sm font-semibold text-slate-700">
                {search
                  ? 'No images match your search'
                  : assets.length
                  ? 'No images in this folder'
                  : 'Upload your first images'}
              </p>
              <p className="mx-auto mt-1 max-w-md text-xs text-slate-400">
                Supported formats: PNG, JPEG, GIF, WebP, and AVIF up to 7 MB each. Uploaded images are available to all authenticated users.
              </p>
              <div className="mt-4 flex justify-center gap-2">
                <button
                  type="button"
                  onClick={() => filesInputRef.current?.click()}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700 transition-colors"
                >
                  <Upload size={13} /> Upload Images
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setFolderParentPath(activeFolder || '');
                    setFolderName('');
                    setCreateFolderOpen(true);
                  }}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  <FolderPlus size={13} /> Create Folder
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
              {filteredAssets.map((asset) => {
                const imageUrl = getMediaContentUrl(asset.id);
                return (
                  <article
                    key={asset.id}
                    className="group overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xs transition-all hover:border-blue-300 hover:shadow-md flex flex-col"
                  >
                    <div
                      onClick={() => openAssetDetails(asset)}
                      className="relative flex h-36 cursor-pointer items-center justify-center overflow-hidden bg-slate-100"
                    >
                      <img
                        src={imageUrl}
                        alt={asset.name}
                        loading="lazy"
                        className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-slate-900/0 group-hover:bg-slate-900/25 transition-colors flex items-center justify-center">
                        <span className="opacity-0 group-hover:opacity-100 inline-flex items-center gap-1 rounded-lg bg-white/95 px-2.5 py-1 text-[11px] font-semibold text-slate-800 shadow-sm transition-opacity">
                          <Eye size={12} /> Preview
                        </span>
                      </div>

                      <div
                        className="absolute right-2 top-2 flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          type="button"
                          onClick={() => copyAssetUrl(asset)}
                          title="Copy image URL"
                          aria-label={`Copy URL for ${asset.name}`}
                          className="rounded-lg bg-white/95 p-1.5 text-slate-600 shadow-sm hover:text-blue-600 transition-colors"
                        >
                          {copiedId === asset.id ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteAsset(asset)}
                          disabled={deletingId === asset.id}
                          title={`Delete ${asset.name}`}
                          aria-label={`Delete ${asset.name}`}
                          className="rounded-lg bg-white/95 p-1.5 text-slate-600 shadow-sm hover:text-red-600 transition-colors"
                        >
                          {deletingId === asset.id ? (
                            <LoaderCircle size={13} className="animate-spin" />
                          ) : (
                            <Trash2 size={13} />
                          )}
                        </button>
                      </div>
                    </div>

                    <div className="p-3 flex-1 flex flex-col justify-between">
                      <div>
                        <p className="truncate text-xs font-semibold text-slate-800" title={asset.name}>
                          {asset.name}
                        </p>
                        <p className="mt-1 truncate text-[10px] text-slate-400" title={asset.folderPath || 'Unfiled'}>
                          {asset.folderPath ? `📁 ${asset.folderPath}` : 'Unfiled'} · {formatMediaSize(asset.size)}
                        </p>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Create Folder Modal */}
      {createFolderOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 backdrop-blur-xs p-4">
          <form onSubmit={handleCreateFolder} className="w-full max-w-md space-y-4 rounded-2xl bg-white p-5 shadow-xl border border-slate-200">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-base font-semibold text-slate-800">Create New Folder</h2>
                <p className="mt-1 text-xs text-slate-500">
                  Organize images by page or section (e.g., Home Page, About Us, Common Media).
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setCreateFolderOpen(false);
                  setFolderName('');
                }}
                aria-label="Close create folder dialog"
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X size={18} />
              </button>
            </div>

            <label className="block space-y-1.5 text-xs font-medium text-slate-700">
              <span>Parent Folder (optional)</span>
              <select
                value={folderParentPath}
                onChange={(e) => setFolderParentPath(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs outline-none focus:border-blue-400"
              >
                <option value="">Root (Top level)</option>
                {folders.map((path) => (
                  <option key={path} value={path}>{path}</option>
                ))}
              </select>
            </label>

            <label className="block space-y-1.5 text-xs font-medium text-slate-700">
              <span>Folder Name</span>
              <input
                autoFocus
                value={folderName}
                onChange={(event) => setFolderName(event.target.value)}
                maxLength={100}
                required
                placeholder="e.g. Home Page, About Us, Common Media"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-400"
              />
            </label>

            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  setCreateFolderOpen(false);
                  setFolderName('');
                }}
                className="rounded-lg border border-slate-200 px-3.5 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={creatingFolder || !folderName.trim()}
                className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {creatingFolder ? 'Creating…' : 'Create Folder'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Rename Folder Modal */}
      {renameFolderTarget !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 backdrop-blur-xs p-4">
          <form onSubmit={handleRenameFolder} className="w-full max-w-md space-y-4 rounded-2xl bg-white p-5 shadow-xl border border-slate-200">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-base font-semibold text-slate-800">Rename Folder</h2>
                <p className="mt-1 text-xs text-slate-500">
                  Renaming <strong className="text-slate-700">"{renameFolderTarget}"</strong> will also update all images inside it.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setRenameFolderTarget(null);
                  setRenameFolderValue('');
                }}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X size={18} />
              </button>
            </div>

            <label className="block space-y-1.5 text-xs font-medium text-slate-700">
              <span>New Folder Name</span>
              <input
                autoFocus
                value={renameFolderValue}
                onChange={(event) => setRenameFolderValue(event.target.value)}
                maxLength={100}
                required
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-400"
              />
            </label>

            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  setRenameFolderTarget(null);
                  setRenameFolderValue('');
                }}
                className="rounded-lg border border-slate-200 px-3.5 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={renamingFolder || !renameFolderValue.trim()}
                className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {renamingFolder ? 'Renaming…' : 'Save Name'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Delete Folder Modal */}
      {deleteFolderTarget !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-md space-y-4 rounded-2xl bg-white p-5 shadow-xl border border-slate-200">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-base font-semibold text-slate-800">Delete Folder</h2>
                <p className="mt-1 text-xs text-slate-500">
                  Are you sure you want to delete folder <strong className="text-slate-700">"{deleteFolderTarget}"</strong>?
                </p>
              </div>
              <button
                type="button"
                onClick={() => setDeleteFolderTarget(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X size={18} />
              </button>
            </div>

            {folderCount(deleteFolderTarget) > 0 && (
              <label className="flex items-start gap-2.5 rounded-xl bg-amber-50 border border-amber-200 p-3 text-xs text-amber-900 cursor-pointer">
                <input
                  type="checkbox"
                  checked={deleteFolderWithAssets}
                  onChange={(e) => setDeleteFolderWithAssets(e.target.checked)}
                  className="mt-0.5 rounded border-amber-300 accent-rose-600"
                />
                <span>
                  Also permanently delete the <strong>{folderCount(deleteFolderTarget)}</strong> image(s) inside this folder.
                  <span className="block text-[11px] text-amber-700 mt-0.5">
                    If unchecked, images will be kept and moved to Unfiled / Root.
                  </span>
                </span>
              </label>
            )}

            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setDeleteFolderTarget(null)}
                className="rounded-lg border border-slate-200 px-3.5 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteFolder}
                disabled={deletingFolder}
                className="rounded-lg bg-rose-600 px-4 py-2 text-xs font-semibold text-white hover:bg-rose-700 disabled:opacity-50"
              >
                {deletingFolder ? 'Deleting…' : 'Delete Folder'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Image Preview & Organize Modal */}
      {previewAsset && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4"
          onClick={() => setPreviewAsset(null)}
        >
          <div
            className="w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl border border-slate-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3.5">
              <div className="min-w-0">
                <h3 className="truncate text-sm font-bold text-slate-800">{previewAsset.name}</h3>
                <p className="text-[11px] text-slate-400">
                  {previewAsset.mimeType} · {formatMediaSize(previewAsset.size)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPreviewAsset(null)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X size={18} />
              </button>
            </div>

            <div className="grid md:grid-cols-[1fr_260px]">
              <div className="flex items-center justify-center bg-slate-900/95 p-6 min-h-[260px] max-h-[420px]">
                <img
                  src={getMediaContentUrl(previewAsset.id)}
                  alt={previewAsset.name}
                  className="max-h-[370px] max-w-full rounded-lg object-contain"
                />
              </div>

              <form onSubmit={handleUpdateAsset} className="flex flex-col justify-between border-t md:border-t-0 md:border-l border-slate-100 p-4 space-y-4">
                <div className="space-y-3">
                  <label className="block space-y-1 text-xs font-medium text-slate-700">
                    <span>File Name</span>
                    <input
                      type="text"
                      value={editAssetName}
                      onChange={(e) => setEditAssetName(e.target.value)}
                      required
                      maxLength={255}
                      className="w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs outline-none focus:border-blue-400"
                    />
                  </label>

                  <label className="block space-y-1 text-xs font-medium text-slate-700">
                    <span className="flex items-center gap-1">
                      <FolderInput size={12} className="text-blue-600" /> Folder Location
                    </span>
                    <select
                      value={moveTargetFolder}
                      onChange={(e) => setMoveTargetFolder(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs outline-none focus:border-blue-400"
                    >
                      <option value="">Unfiled / Root</option>
                      {folders.map((path) => (
                        <option key={path} value={path}>{path}</option>
                      ))}
                    </select>
                  </label>

                  <div className="pt-1">
                    <span className="block text-[11px] font-medium text-slate-500 mb-1">Image URL</span>
                    <div className="flex items-center gap-1">
                      <input
                        type="text"
                        readOnly
                        value={getMediaContentUrl(previewAsset.id)}
                        className="w-full rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] text-slate-600 font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => copyAssetUrl(previewAsset)}
                        className="shrink-0 rounded-lg border border-slate-200 px-2.5 py-1 text-[11px] font-medium text-slate-700 hover:bg-slate-50"
                      >
                        {copiedId === previewAsset.id ? 'Copied' : 'Copy'}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2 border-t border-slate-100 pt-3">
                  <button
                    type="button"
                    onClick={() => handleDeleteAsset(previewAsset)}
                    disabled={deletingId === previewAsset.id}
                    className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-rose-600 hover:bg-rose-50"
                  >
                    <Trash2 size={13} /> Delete
                  </button>
                  <button
                    type="submit"
                    disabled={updatingAsset}
                    className="rounded-lg bg-blue-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                  >
                    {updatingAsset ? 'Saving…' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
