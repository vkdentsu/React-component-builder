import { useRef } from 'react';
import { Upload, Link, X } from 'lucide-react';

/**
 * Dual-mode image input: URL text field + local file picker.
 * Converts local files to base64 data URLs so they work without a server.
 */
export default function ImageUploadField({ value, onChange, placeholder = 'https://...' }) {
  const fileRef = useRef(null);

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => onChange(reader.result); // base64 data URL
    reader.readAsDataURL(file);
    // Reset so the same file can be re-picked
    e.target.value = '';
  };

  const handleClear = () => onChange('');

  return (
    <div className="flex flex-col gap-1.5">
      {/* URL input row */}
      <div className="flex items-center gap-1">
        <div className="relative flex-1">
          <Link size={11} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input
            type="text"
            value={value?.startsWith('data:') ? '' : (value || '')}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="w-full border border-gray-200 rounded-md pl-6 pr-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white"
          />
        </div>
        {value && (
          <button
            onClick={handleClear}
            title="Clear image"
            className="p-1.5 rounded-md border border-gray-200 text-gray-400 hover:text-red-500 hover:border-red-200 transition-colors"
          >
            <X size={11} />
          </button>
        )}
      </div>

      {/* File picker button */}
      <button
        onClick={() => fileRef.current?.click()}
        className="flex items-center justify-center gap-1.5 w-full py-1.5 border border-dashed border-gray-300 rounded-md text-xs text-gray-500 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50/50 transition-colors"
      >
        <Upload size={12} />
        Upload from device
      </button>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFile}
      />

      {/* Preview thumbnail if value is set */}
      {value && (
        <div className="relative rounded-md overflow-hidden border border-gray-200 bg-gray-50 h-16">
          <img
            src={value}
            alt="preview"
            className="w-full h-full object-cover"
            onError={(e) => { e.target.style.display = 'none'; }}
          />
          <div className="absolute bottom-0 left-0 right-0 bg-black/40 text-white text-[9px] px-1.5 py-0.5 truncate">
            {value.startsWith('data:') ? '📁 Local file (base64)' : value}
          </div>
        </div>
      )}
    </div>
  );
}
