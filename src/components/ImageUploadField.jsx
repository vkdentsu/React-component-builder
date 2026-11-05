import { useEffect, useRef, useState } from 'react';
import { Folder, Image as ImageIcon, Link, LoaderCircle, Upload, X } from 'lucide-react';
import { fetchMediaFolders, uploadMediaFile } from '../utils/mediaApi';
import MediaLibraryModal from './MediaLibraryModal';

/**
 * Enhanced Image Upload & Selection control for Component Builder:
 * - Direct URL input (with backward compatibility for external URLs and base64)
 * - Option 1: Upload from Device (uploads via Media Upload API into selected folder or Common Media)
 * - Option 2: Choose from Media Library (opens reusable MediaLibraryModal)
 */
export default function ImageUploadField({ value, onChange, placeholder = 'https://...' }) {
  const fileRef = useRef(null);
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [targetFolder, setTargetFolder] = useState('Common Media');
  const [availableFolders, setAvailableFolders] = useState(['Common Media', 'Home Page', 'About Us']);
  const [showFolderSelect, setShowFolderSelect] = useState(false);

  useEffect(() => {
    let active = true;
    fetchMediaFolders()
      .then((folders) => {
        if (!active) return;
        const paths = new Set(['Common Media', 'Home Page', 'About Us']);
        folders.forEach((f) => {
          if (f.path) paths.add(f.path);
        });
        setAvailableFolders([...paths].sort((a, b) => a.localeCompare(b)));
      })
      .catch(() => {
        // Fallback silently if unauthenticated or offline
      });
    return () => {
      active = false;
    };
  }, [libraryOpen]);

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';

    setUploading(true);
    setUploadError('');
    try {
      const uploadedAsset = await uploadMediaFile(file, targetFolder || 'Common Media');
      onChange(uploadedAsset.url);
    } catch (err) {
      setUploadError(err.message || 'Could not upload image.');
    } finally {
      setUploading(false);
    }
  };

  const handleClear = () => {
    setUploadError('');
    onChange('');
  };

  return (
    <div className="flex flex-col gap-1.5">
      {/* URL input row */}
      <div className="flex items-center gap-1">
        <div className="relative flex-1">
          <Link size={11} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input
            type="text"
            value={value?.startsWith('data:') ? '' : (value || '')}
            onChange={(e) => {
              setUploadError('');
              onChange(e.target.value);
            }}
            placeholder={placeholder}
            className="w-full border border-gray-200 rounded-md pl-6 pr-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white"
          />
        </div>
        {value && (
          <button
            type="button"
            onClick={handleClear}
            title="Clear image"
            className="p-1.5 rounded-md border border-gray-200 text-gray-400 hover:text-red-500 hover:border-red-200 transition-colors"
          >
            <X size={11} />
          </button>
        )}
      </div>

      {/* Upload target folder selector */}
      <div className="flex items-center justify-between gap-1 text-[10px] text-gray-500">
        <button
          type="button"
          onClick={() => setShowFolderSelect((v) => !v)}
          className="inline-flex items-center gap-1 text-gray-500 hover:text-blue-600 transition-colors truncate"
          title="Change folder where device uploads are saved"
        >
          <Folder size={10} className="text-amber-500 shrink-0" />
          <span className="truncate">Save to: <strong>{targetFolder || 'Root'}</strong></span>
        </button>
        <button
          type="button"
          onClick={() => setShowFolderSelect((v) => !v)}
          className="text-[10px] text-blue-600 hover:underline shrink-0"
        >
          {showFolderSelect ? 'Hide' : 'Change'}
        </button>
      </div>

      {showFolderSelect && (
        <select
          value={targetFolder}
          onChange={(e) => setTargetFolder(e.target.value)}
          aria-label="Upload destination folder"
          className="w-full border border-gray-200 rounded-md px-2 py-1 text-[11px] bg-gray-50 text-gray-700 focus:outline-none focus:border-blue-400"
        >
          <option value="Common Media">Common Media</option>
          <option value="">Unfiled / Root</option>
          {availableFolders
            .filter((f) => f !== 'Common Media')
            .map((folderPath) => (
              <option key={folderPath} value={folderPath}>
                {folderPath}
              </option>
            ))}
        </select>
      )}

      {/* Option 1 & Option 2 Buttons */}
      <div className="grid grid-cols-1 gap-1.5">
        <button
          type="button"
          disabled={uploading}
          onClick={() => fileRef.current?.click()}
          className="flex items-center justify-center gap-1.5 w-full py-1.5 px-2 border border-dashed border-gray-300 rounded-md text-xs text-gray-600 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50/50 disabled:opacity-50 transition-colors"
        >
          {uploading ? (
            <>
              <LoaderCircle size={12} className="animate-spin text-blue-600" />
              <span>Uploading…</span>
            </>
          ) : (
            <>
              <Upload size={12} />
              <span>Upload from Device</span>
            </>
          )}
        </button>

        <button
          type="button"
          disabled={uploading}
          onClick={() => setLibraryOpen(true)}
          className="flex items-center justify-center gap-1.5 w-full py-1.5 px-2 border border-blue-200 bg-blue-50/60 rounded-md text-xs font-medium text-blue-700 hover:bg-blue-100/70 hover:border-blue-300 disabled:opacity-50 transition-colors"
        >
          <ImageIcon size={12} />
          <span>Choose from Media Library</span>
        </button>
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="image/png,image/jpeg,image/gif,image/webp,image/avif"
        className="hidden"
        onChange={handleFile}
      />

      {uploadError && (
        <p className="text-[10px] text-red-600 bg-red-50 border border-red-200 rounded px-2 py-1 leading-snug" role="alert">
          {uploadError}
        </p>
      )}

      {/* Preview thumbnail if value is set */}
      {value && (
        <div className="relative rounded-md overflow-hidden border border-gray-200 bg-gray-50 h-16 group">
          <img
            src={value}
            alt="preview"
            className="w-full h-full object-cover"
            onError={(e) => {
              e.target.style.display = 'none';
            }}
          />
          <div className="absolute bottom-0 left-0 right-0 bg-black/55 text-white text-[9px] px-1.5 py-0.5 truncate">
            {value.startsWith('data:')
              ? '📁 Local file (base64)'
              : value.includes('/api/media/')
              ? '🖼️ Media Library Asset'
              : value}
          </div>
        </div>
      )}

      <MediaLibraryModal
        open={libraryOpen}
        onClose={() => setLibraryOpen(false)}
        currentUrl={value}
        onSelect={(selectedUrl) => {
          setUploadError('');
          onChange(selectedUrl);
        }}
      />
    </div>
  );
}
