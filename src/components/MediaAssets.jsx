import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Folder,
  FolderPlus,
  Image as ImageIcon,
  LoaderCircle,
  RefreshCw,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import { authenticatedFetch } from '../utils/api';

const maxFileSize = 7 * 1024 * 1024;
const acceptedTypes = new Set([
  'image/avif',
  'image/gif',
  'image/jpeg',
  'image/png',
  'image/webp',
]);

function formatSize(bytes) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function readAsBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result !== 'string') {
        reject(new Error(`Could not read ${file.name}.`));
        return;
      }
      resolve(result.slice(result.indexOf(',') + 1));
    };
    reader.onerror = () => reject(new Error(`Could not read ${file.name}.`));
    reader.readAsDataURL(file);
  });
}

function getFolderPath(file) {
  const relativePath = file.webkitRelativePath || '';
  return relativePath.split('/').slice(0, -1).join('/');
}

function getErrorMessage(result, fallback) {
  return result?.error?.message || fallback;
}

export default function MediaAssets() {
  const filesInputRef = useRef(null);
  const folderInputRef = useRef(null);
  const [assets, setAssets] = useState([]);
  const [mediaFolders, setMediaFolders] = useState([]);
  const [previews, setPreviews] = useState({});
  const [previewErrors, setPreviewErrors] = useState({});
  const [activeFolder, setActiveFolder] = useState(null);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [deletingId, setDeletingId] = useState(null);
  const [createFolderOpen, setCreateFolderOpen] = useState(false);
  const [folderName, setFolderName] = useState('');
  const [creatingFolder, setCreatingFolder] = useState(false);

  const fetchAssets = useCallback(async () => {
    const response = await authenticatedFetch('/api/media');
    const result = await response.json();
    if (!response.ok) throw new Error(getErrorMessage(result, 'Could not load media assets.'));
    return result.data || [];
  }, []);

  const fetchFolders = useCallback(async () => {
    const response = await authenticatedFetch('/api/media/folders');
    const result = await response.json();
    if (!response.ok) throw new Error(getErrorMessage(result, 'Could not load media folders.'));
    return result.data || [];
  }, []);

  const loadAssets = useCallback(async () => {
    try {
      const [nextAssets, nextFolders] = await Promise.all([fetchAssets(), fetchFolders()]);
      setAssets(nextAssets);
      setMediaFolders(nextFolders);
    } catch (loadError) {
      setError(loadError.message || 'Could not load media assets.');
    } finally {
      setLoading(false);
    }
  }, [fetchAssets, fetchFolders]);

  useEffect(() => {
    let active = true;
    Promise.all([fetchAssets(), fetchFolders()])
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
  }, [fetchAssets, fetchFolders]);

  useEffect(() => {
    let active = true;
    const objectUrls = [];

    Promise.all(assets.map(async (asset) => {
      try {
        const response = await authenticatedFetch(`/api/media/${asset.id}/content`);
        if (!response.ok) throw new Error('Could not load image preview.');
        const objectUrl = URL.createObjectURL(await response.blob());
        objectUrls.push(objectUrl);
        return [asset.id, objectUrl];
      } catch (previewError) {
        return [asset.id, '', previewError.message || 'Image preview could not be loaded.'];
      }
    })).then((entries) => {
      if (active) {
        setPreviews(Object.fromEntries(entries.map(([id, url]) => [id, url])));
        setPreviewErrors(Object.fromEntries(entries
          .filter(([, , message]) => message)
          .map(([id, , message]) => [id, message])));
      }
      else objectUrls.forEach((url) => URL.revokeObjectURL(url));
    });

    return () => {
      active = false;
      objectUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [assets]);

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
      || (activeFolder === '' ? !asset.folderPath : asset.folderPath === activeFolder);
    const query = search.trim().toLowerCase();
    return inFolder && (!query || `${asset.name} ${asset.folderPath}`.toLowerCase().includes(query));
  }), [activeFolder, assets, search]);

  const uploadFiles = async (fileList) => {
    const files = [...fileList].filter((file) => file.type.startsWith('image/'));
    if (files.length === 0) {
      setError('Choose image files to upload.');
      return;
    }

    setUploading(true);
    setError('');
    setNotice('');
    let uploaded = 0;
    const failures = [];

    for (let index = 0; index < files.length; index += 1) {
      const file = files[index];
      setUploadProgress(`Uploading ${index + 1} of ${files.length}: ${file.name}`);
      if (!acceptedTypes.has(file.type)) {
        failures.push(`${file.name}: unsupported image format.`);
        continue;
      }
      if (file.size > maxFileSize) {
        failures.push(`${file.name}: images must be 7 MB or smaller.`);
        continue;
      }

      try {
        const response = await authenticatedFetch('/api/media', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: file.name,
            folderPath: getFolderPath(file) || activeFolder || '',
            mimeType: file.type,
            contentBase64: await readAsBase64(file),
          }),
        });
        const result = await response.json();
        if (!response.ok) throw new Error(getErrorMessage(result, 'Upload failed.'));
        uploaded += 1;
      } catch (uploadError) {
        failures.push(`${file.name}: ${uploadError.message}`);
      }
    }

    setUploading(false);
    setUploadProgress('');
    if (uploaded > 0) {
      setNotice(`${uploaded} image${uploaded === 1 ? '' : 's'} uploaded.`);
      setLoading(true);
      await loadAssets();
    }
    if (failures.length > 0) {
      setError(`Some images could not be uploaded: ${failures.slice(0, 3).join(' ')}${failures.length > 3 ? ` And ${failures.length - 3} more.` : ''}`);
    }
  };

  const handleInputChange = (event) => {
    if (event.target.files?.length) uploadFiles(event.target.files);
    event.target.value = '';
  };

  const createFolder = async (event) => {
    event.preventDefault();
    setCreatingFolder(true);
    setError('');
    setNotice('');
    try {
      const response = await authenticatedFetch('/api/media/folders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: folderName,
          parentPath: activeFolder || '',
        }),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(getErrorMessage(result, 'Could not create the folder.'));
      }
      setMediaFolders((current) => [...current, result.data].sort((a, b) => a.path.localeCompare(b.path)));
      setActiveFolder(result.data.path);
      setFolderName('');
      setCreateFolderOpen(false);
      setNotice(`Folder "${result.data.path}" created. Upload images to add files.`);
    } catch (createError) {
      setError(createError.message || 'Could not create the folder.');
    } finally {
      setCreatingFolder(false);
    }
  };

  const deleteAsset = async (asset) => {
    if (!window.confirm(`Delete "${asset.name}"?`)) return;
    setDeletingId(asset.id);
    setError('');
    setNotice('');
    try {
      const response = await authenticatedFetch(`/api/media/${asset.id}`, { method: 'DELETE' });
      if (!response.ok) {
        const result = await response.json();
        throw new Error(getErrorMessage(result, 'Could not delete the image.'));
      }
      setAssets((current) => current.filter((item) => item.id !== asset.id));
      setNotice(`${asset.name} deleted.`);
    } catch (deleteError) {
      setError(deleteError.message || 'Could not delete the image.');
    } finally {
      setDeletingId(null);
    }
  };

  const folderCount = (folderPath) => folderPath
    ? assets.filter((asset) => asset.folderPath === folderPath || asset.folderPath.startsWith(`${folderPath}/`)).length
    : assets.filter((asset) => !asset.folderPath).length;

  return (
    <section className="space-y-6 animate-in fade-in duration-200">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Media Assets</h1>
          <p className="mt-1 text-xs text-slate-500">
            Upload images or an entire folder. Folder paths are kept with each asset.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setCreateFolderOpen(true)}
            disabled={uploading}
            className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:border-blue-300 disabled:opacity-50"
          >
            <FolderPlus size={14} /> New folder
          </button>
          <button
            type="button"
            onClick={() => folderInputRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:border-blue-300 disabled:opacity-50"
          >
            <Folder size={14} /> Upload folder
          </button>
          <button
            type="button"
            onClick={() => filesInputRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-xs transition-colors hover:bg-blue-700 disabled:opacity-50"
          >
            <Upload size={14} /> Upload images
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
            className="rounded-xl border border-slate-200 bg-white p-2 text-slate-500 hover:text-blue-600 disabled:opacity-50"
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

      {uploading && (
        <div className="flex items-center gap-2 rounded-xl bg-blue-50 px-4 py-3 text-xs text-blue-700" role="status">
          <LoaderCircle size={15} className="animate-spin" />
          <span>{uploadProgress}</span>
        </div>
      )}
      {error && <p className="rounded-xl bg-red-50 px-4 py-3 text-xs text-red-700" role="alert">{error}</p>}
      {notice && <p className="rounded-xl bg-emerald-50 px-4 py-3 text-xs text-emerald-700" role="status">{notice}</p>}

      {createFolderOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
          <form onSubmit={createFolder} className="w-full max-w-md space-y-4 rounded-2xl bg-white p-5 shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-base font-semibold text-slate-800">Create a folder</h2>
                <p className="mt-1 text-xs text-slate-500">
                  {activeFolder ? `Create inside ${activeFolder}` : 'Create in the media library root.'}
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
              Folder name
              <input
                autoFocus
                value={folderName}
                onChange={(event) => setFolderName(event.target.value)}
                maxLength={100}
                required
                placeholder="e.g. Product photos"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-400"
              />
            </label>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setCreateFolderOpen(false);
                  setFolderName('');
                }}
                className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={creatingFolder || !folderName.trim()}
                className="rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {creatingFolder ? 'Creating…' : 'Create folder'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-[230px_minmax(0,1fr)]">
        <aside className="h-fit rounded-2xl border border-slate-200 bg-white p-3">
          <h2 className="px-2 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">Folders</h2>
          <div className="space-y-1">
            <button
              type="button"
              onClick={() => setActiveFolder(null)}
              className={`flex w-full items-center justify-between rounded-lg px-2 py-2 text-left text-xs ${activeFolder === null ? 'bg-blue-50 font-semibold text-blue-700' : 'text-slate-600 hover:bg-slate-50'}`}
            >
              <span className="flex items-center gap-2"><ImageIcon size={14} /> All images</span>
              <span>{assets.length}</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveFolder('')}
              className={`flex w-full items-center justify-between rounded-lg px-2 py-2 text-left text-xs ${activeFolder === '' ? 'bg-blue-50 font-semibold text-blue-700' : 'text-slate-600 hover:bg-slate-50'}`}
            >
              <span className="flex items-center gap-2"><Folder size={14} /> Unfiled</span>
              <span>{folderCount('')}</span>
            </button>
            {folders.map((folderPath) => (
              <button
                type="button"
                key={folderPath}
                onClick={() => setActiveFolder(folderPath)}
                title={folderPath}
                className={`flex w-full items-center justify-between gap-2 rounded-lg px-2 py-2 text-left text-xs ${activeFolder === folderPath ? 'bg-blue-50 font-semibold text-blue-700' : 'text-slate-600 hover:bg-slate-50'}`}
              >
                <span className="flex min-w-0 items-center gap-2"><Folder size={14} className="shrink-0" /><span className="truncate">{folderPath}</span></span>
                <span>{folderCount(folderPath)}</span>
              </button>
            ))}
          </div>
        </aside>

        <div className="min-w-0 space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-slate-500">
              {filteredAssets.length} image{filteredAssets.length === 1 ? '' : 's'}
              {activeFolder !== null && activeFolder !== '' ? ` in ${activeFolder}` : ''}
              {activeFolder !== null && <> {' · '}individual uploads go to this folder</>}
              {' · '}PNG, JPEG, GIF, WebP or AVIF, up to 7 MB each
            </p>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search images and folders"
              aria-label="Search media assets"
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs outline-none focus:border-blue-400 sm:max-w-64"
            />
          </div>

          {loading ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-xs text-slate-500">
              Loading media assets…
            </div>
          ) : filteredAssets.length === 0 ? (
            <div className="rounded-2xl border-2 border-dashed border-slate-300 bg-white px-6 py-12 text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <Upload size={20} />
              </div>
              <p className="text-sm font-semibold text-slate-700">
                {assets.length ? 'No images in this folder' : 'Upload your first images'}
              </p>
              <p className="mx-auto mt-1 max-w-md text-xs text-slate-400">
                Select a folder to preserve its directory structure, or upload individual image files.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
              {filteredAssets.map((asset) => (
                <article key={asset.id} className="group overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs">
                  <div className="relative flex h-32 items-center justify-center overflow-hidden bg-slate-100">
                    {previews[asset.id] ? (
                      <img src={previews[asset.id]} alt={asset.name} className="h-full w-full object-cover" />
                    ) : previewErrors[asset.id] ? (
                      <span className="px-3 text-center text-[10px] text-slate-500">{previewErrors[asset.id]}</span>
                    ) : (
                      <ImageIcon size={24} className="text-slate-300" />
                    )}
                    <button
                      type="button"
                      onClick={() => deleteAsset(asset)}
                      disabled={deletingId === asset.id}
                      aria-label={`Delete ${asset.name}`}
                      className="absolute right-2 top-2 rounded-lg bg-white/90 p-2 text-slate-500 opacity-100 shadow-sm transition-colors hover:text-red-600 sm:opacity-0 sm:group-hover:opacity-100"
                    >
                      {deletingId === asset.id ? <LoaderCircle size={14} className="animate-spin" /> : <Trash2 size={14} />}
                    </button>
                  </div>
                  <div className="p-3">
                    <p className="truncate text-xs font-semibold text-slate-800" title={asset.name}>{asset.name}</p>
                    <p className="mt-1 truncate text-[10px] text-slate-400" title={asset.folderPath || 'Unfiled'}>
                      {asset.folderPath || 'Unfiled'} · {formatSize(asset.size)}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
