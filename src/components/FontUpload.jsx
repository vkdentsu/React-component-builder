import { useRef, useState } from 'react';
import { Upload } from 'lucide-react';

const FONT_FORMATS = [
  { value: 'woff2', label: 'WOFF2', accept: '.woff2' },
  { value: 'woff', label: 'WOFF', accept: '.woff' },
  { value: 'truetype', label: 'TTF', accept: '.ttf' },
  { value: 'opentype', label: 'OTF', accept: '.otf' },
];

const fieldClass = 'w-full rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-xs text-slate-800 focus:border-blue-500 focus:outline-none';

export default function FontUpload({ onFontUpload, variant = 'theme' }) {
  const inputRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [format, setFormat] = useState(FONT_FORMATS[0].value);
  const [files, setFiles] = useState([]);
  const [error, setError] = useState('');
  const selectedFormat = FONT_FORMATS.find((item) => item.value === format) || FONT_FORMATS[0];

  if (variant === 'simple') {
    const handleFile = (event) => {
      const file = event.target.files?.[0];
      if (!file) return;
      const extension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
      if (!['.ttf', '.otf', '.woff', '.woff2'].includes(extension)) {
        window.alert('Only TTF, OTF, WOFF and WOFF2 fonts are supported.');
      } else {
        onFontUpload?.(file);
      }
      event.target.value = '';
    };
    return <div><button type="button" onClick={() => inputRef.current?.click()} className="flex w-full items-center justify-center rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-[11px] font-medium text-blue-700 hover:bg-blue-100"><Upload size={13} className="mr-1.5" /> Choose font file</button><input ref={inputRef} type="file" accept=".ttf,.otf,.woff,.woff2" onChange={handleFile} className="hidden" /></div>;
  }

  const upload = async () => {
    if (!name.trim()) { setError('Enter a font family name.'); return; }
    if (files.length === 0) { setError('Select at least one font file.'); return; }
    setError('');
    try {
      await onFontUpload?.(name.trim(), format, files);
      setName('');
      setFiles([]);
      setOpen(false);
    } catch (uploadError) {
      setError(uploadError.message || 'Could not upload the selected font files.');
    }
  };

  return (
    <div className="mt-2">
      {!open ? <button type="button" onClick={() => setOpen(true)} className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-[11px] font-medium text-blue-700 hover:bg-blue-100"><Upload size={13} /> Upload Custom Font</button> : (
        <div className="space-y-2 rounded-lg border border-dashed border-slate-300 bg-slate-50 p-3">
          <label className="block space-y-1 text-[11px] font-medium text-slate-600"><span>Font family name</span><input autoFocus value={name} onChange={(event) => { setName(event.target.value); setError(''); }} placeholder="e.g. Brand Sans" className={fieldClass} /></label>
          <div className="grid gap-2 sm:grid-cols-[120px_minmax(0,1fr)]">
            <label className="block space-y-1 text-[11px] font-medium text-slate-600"><span>Font type</span><select value={format} onChange={(event) => { setFormat(event.target.value); setFiles([]); }} className={fieldClass}>{FONT_FORMATS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label>
            <label className="block space-y-1 text-[11px] font-medium text-slate-600"><span>Select font file(s)</span><input type="file" accept={selectedFormat.accept} multiple onChange={(event) => { setFiles(Array.from(event.target.files || [])); setError(''); }} className={`${fieldClass} file:mr-2 file:rounded file:border-0 file:bg-blue-50 file:px-2 file:py-1 file:text-[10px] file:font-medium file:text-blue-700`} /></label>
          </div>
          <p className="text-[10px] text-slate-500">Choose multiple {selectedFormat.label} files for this font family.</p>
          {error && <p role="alert" className="text-xs text-rose-600">{error}</p>}
          <div className="flex justify-end gap-2"><button type="button" onClick={() => { setOpen(false); setError(''); }} className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-600 hover:bg-white">Cancel</button><button type="button" onClick={upload} className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700">Upload Font</button></div>
        </div>
      )}
    </div>
  );
}
