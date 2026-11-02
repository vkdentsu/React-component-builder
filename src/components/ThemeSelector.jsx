import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, Check, ArrowUpRight, Palette } from 'lucide-react';
import useBuilderStore from '../store/builderStore';

export default function ThemeSelector() {
  const navigate = useNavigate();
  const {
    activeTheme,
    availableThemes,
    selectTheme,
  } = useBuilderStore();

  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const onClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const colors = activeTheme?.configJson?.colors || {};

  return (
    <div className="relative" ref={ref}>
      <button
        id="theme-selector-button"
        type="button"
        onClick={() => setOpen((o) => !o)}
        title="Active Theme: Click to switch theme"
        className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-100 rounded-lg border border-gray-200 transition-colors duration-150 max-w-[170px]"
      >
        <div className="flex items-center -space-x-1 shrink-0">
          <span
            className="w-2.5 h-2.5 rounded-full border border-white shadow-xs"
            style={{ backgroundColor: colors.primary || '#3b82f6' }}
          />
          <span
            className="w-2.5 h-2.5 rounded-full border border-white shadow-xs"
            style={{ backgroundColor: colors.secondary || '#8b5cf6' }}
          />
        </div>
        <span className="truncate">{activeTheme?.name || 'Theme'}</span>
        <ChevronDown
          size={13}
          className={`text-gray-400 shrink-0 transition-transform duration-150 ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1.5 w-72 bg-white rounded-xl border border-gray-200 shadow-xl z-50 overflow-hidden animate-[fadeIn_0.12s_ease]">
          {/* Header */}
          <div className="px-3 py-2 border-b border-gray-100 flex items-center justify-between bg-gray-50/70">
            <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
              <Palette size={12} className="text-blue-600" />
              Theme Selector
            </span>
            <span className="text-[10px] text-gray-400 font-medium">
              {availableThemes.length} available
            </span>
          </div>

          {/* Theme list */}
          <div className="max-h-64 overflow-y-auto py-1 divide-y divide-gray-50">
            {availableThemes.map((theme) => {
              const isActive = theme.id === activeTheme?.id;
              const themeColors = theme.configJson?.colors || {};

              return (
                <button
                  type="button"
                  id={`theme-option-${theme.id}`}
                  key={theme.id}
                  onClick={() => {
                    selectTheme(theme.id);
                    setOpen(false);
                  }}
                  className={`w-full group flex items-center justify-between px-3 py-2 text-xs cursor-pointer transition-colors duration-100 text-left
                    ${isActive ? 'bg-blue-50/70 text-blue-900 font-medium' : 'hover:bg-gray-50 text-gray-700'}`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    {/* Color swatches */}
                    <div className="flex items-center -space-x-1 shrink-0">
                      <span
                        className="w-3 h-3 rounded-full border border-white shadow-xs"
                        style={{ backgroundColor: themeColors.primary || '#3b82f6' }}
                      />
                      <span
                        className="w-3 h-3 rounded-full border border-white shadow-xs"
                        style={{ backgroundColor: themeColors.secondary || '#8b5cf6' }}
                      />
                      <span
                        className="w-3 h-3 rounded-full border border-white shadow-xs"
                        style={{ backgroundColor: themeColors.surface || '#f8fafc' }}
                      />
                    </div>

                    <div className="truncate">
                      <span className="block truncate font-medium">{theme.name}</span>
                      <span className="block text-[10px] text-gray-400 font-normal">
                        {theme.configJson?.typography?.fontFamily || 'Inter'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    {isActive && <Check size={14} className="text-blue-600 mr-1" />}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Footer - Link to Dashboard Configuration & Themes */}
          <div className="p-2 border-t border-gray-100 bg-gray-50/80">
            <button
              onClick={() => {
                setOpen(false);
                navigate('/themes');
              }}
              className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-medium text-slate-600 hover:text-blue-600 bg-white hover:bg-blue-50 border border-gray-200 hover:border-blue-200 transition-colors"
            >
              <span>Manage Themes in Dashboard</span>
              <ArrowUpRight size={12} className="text-slate-400" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
