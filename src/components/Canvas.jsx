import { useMemo, useEffect } from 'react';
import RowsCanvas from './RowsCanvas';
import useBuilderStore from '../store/builderStore';
import { tokensToCssVars } from '../utils/themeDefaults';
import { loadGoogleFont } from '../utils/loadGoogleFont';

const DEVICE_WIDTHS = {
  mobile:  '375px',
  tablet:  '768px',
  desktop: '100%',
};

export default function Canvas() {
  const { rows, device, deselect, activeTheme } = useBuilderStore();

  const themeVars = useMemo(() => {
    return tokensToCssVars(activeTheme?.configJson);
  }, [activeTheme]);

  useEffect(() => {
    const fonts = [
      activeTheme?.configJson?.typography?.fontFamily,
      activeTheme?.configJson?.typography?.fontHeading,
      activeTheme?.configJson?.typography?.fontBody,
    ].filter(Boolean);

    fonts.forEach((font) => loadGoogleFont(font));
  }, [
    activeTheme?.configJson?.typography?.fontFamily,
    activeTheme?.configJson?.typography?.fontHeading,
    activeTheme?.configJson?.typography?.fontBody,
  ]);

  return (
    <div className="flex-1 min-h-0 overflow-auto bg-[#f1f5f9] flex justify-center p-6">
      <div
        style={{
          width: DEVICE_WIDTHS[device],
          transition: 'width 0.3s ease, background-color 0.2s ease, border-color 0.2s ease, color 0.2s ease',
          fontFamily: 'var(--theme-font-body, var(--theme-font, inherit))',
          backgroundColor: 'var(--theme-bg, #ffffff)',
          color: 'var(--theme-text, #0f172a)',
          borderColor: 'var(--theme-border, #e2e8f0)',
          ...themeVars,
        }}
        /* Inner content grows naturally with dynamic theme tokens */
        className="rounded-2xl shadow-sm border min-h-[520px] flex flex-col self-start transition-colors duration-200"
      >
        {/* Browser chrome dots */}
        <div
          className="flex items-center justify-center py-2 border-b gap-1.5 shrink-0"
          style={{ borderColor: 'var(--theme-border, #f1f5f9)', opacity: 0.8 }}
        >
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--theme-border, #e2e8f0)' }} />
          <div className="w-16 h-1.5 rounded-full" style={{ backgroundColor: 'var(--theme-border, #e2e8f0)' }} />
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--theme-border, #e2e8f0)' }} />
        </div>

        <div onClick={deselect} className="flex-1 flex flex-col">
          <RowsCanvas rows={rows} hops={[]} device={device} nested={false} />
        </div>
      </div>
    </div>
  );
}
