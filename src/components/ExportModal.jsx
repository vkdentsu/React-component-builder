import { useState } from 'react';
import { X, Copy, Check, Download, Code, Palette } from 'lucide-react';
import { generateJSX } from '../utils/codeGen';
import useBuilderStore from '../store/builderStore';
import { tokensToCssString } from '../utils/themeDefaults';

const toPascalCase = (str) =>
  (str || 'MyComponent')
    .replace(/[^a-zA-Z0-9 ]/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join('') || 'MyComponent';

export default function ExportModal({ open, onClose }) {
  const { rows, documents, activeDocId, globalFont, activeTheme } = useBuilderStore();
  const [activeTab, setActiveTab] = useState('jsx'); // 'jsx' | 'css'
  const [copied, setCopied] = useState(false);
  const [downloaded, setDownloaded] = useState(false);

  const activeDoc = documents.find((d) => d.id === activeDocId);
  const componentName = toPascalCase(activeDoc?.name);
  const code = generateJSX(rows, componentName, globalFont);

  const themeCss = `:root {\n${tokensToCssString(activeTheme?.configJson)}\n}`;
  const displayContent = activeTab === 'jsx' ? code : themeCss;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(displayContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const filename = activeTab === 'jsx' ? `${componentName}.jsx` : `${activeTheme?.slug || 'theme'}-styles.css`;
    const blob = new Blob([displayContent], { type: 'text/plain;charset=utf-8' });
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

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col overflow-hidden border border-gray-200">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
          <div>
            <p className="font-semibold text-sm text-gray-800">
              Export {activeTab === 'jsx' ? `${componentName}.jsx` : 'Theme Styles (CSS)'}
            </p>
            <p className="text-xs text-gray-400 mt-0.5">
              {activeTab === 'jsx'
                ? 'Ready to paste into your React project with Tailwind CSS'
                : 'Theme styles ready to paste into your stylesheet or global CSS'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownload}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-all duration-150
                ${downloaded
                  ? 'bg-green-100 text-green-700 border border-green-200'
                  : 'bg-blue-600 hover:bg-blue-700 text-white border border-blue-600'
                }`}
            >
              {downloaded ? <Check size={13} /> : <Download size={13} />}
              {downloaded ? 'Downloaded!' : `Download ${activeTab === 'jsx' ? '.jsx' : '.css'}`}
            </button>
            <button
              onClick={handleCopy}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-all duration-150
                ${copied
                  ? 'bg-green-100 text-green-700 border border-green-200'
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-200'
                }`}
            >
              {copied ? <Check size={13} /> : <Copy size={13} />}
              {copied ? 'Copied!' : 'Copy code'}
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors duration-150"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Tab switcher */}
        <div className="flex border-b border-gray-200 bg-gray-50 px-5 gap-2">
          <button
            onClick={() => setActiveTab('jsx')}
            className={`flex items-center gap-1.5 py-2 px-3 text-xs font-medium border-b-2 transition-colors
              ${activeTab === 'jsx'
                ? 'border-blue-600 text-blue-600 bg-white shadow-2xs'
                : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          >
            <Code size={13} />
            Component JSX
          </button>
          <button
            onClick={() => setActiveTab('css')}
            className={`flex items-center gap-1.5 py-2 px-3 text-xs font-medium border-b-2 transition-colors
              ${activeTab === 'css'
                ? 'border-blue-600 text-blue-600 bg-white shadow-2xs'
                : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          >
            <Palette size={13} />
            Theme Styles (CSS)
          </button>
        </div>

        {/* Code */}
        <div className="flex-1 overflow-auto bg-[#1e1e2e]">
          <pre className="p-5 text-[12.5px] leading-relaxed text-[#cdd6f4] font-mono whitespace-pre overflow-x-auto">
            {displayContent}
          </pre>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-gray-100 bg-gray-50 flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-blue-400" />
            <span className="text-xs text-gray-500">Tailwind CSS classes</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-violet-400" />
            <span className="text-xs text-gray-500">Responsive breakpoints included</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-green-400" />
            <span className="text-xs text-gray-500">Nested containers supported</span>
          </div>
        </div>
      </div>
    </div>
  );
}
