import RowsCanvas from './RowsCanvas';
import useBuilderStore from '../store/builderStore';
import ThemeProvider from './ThemeProvider';

const DEVICE_WIDTHS = {
  mobile:  '375px',
  tablet:  '768px',
  desktop: '100%',
};

export default function Canvas() {
  const { rows, device, deselect } = useBuilderStore();

  return (
    <div className="flex-1 min-h-0 overflow-auto bg-[#f1f5f9] flex justify-center p-6">
      <ThemeProvider
        scope=".theme-canvas"
        style={{
          width: DEVICE_WIDTHS[device],
          transition: 'width 0.3s ease',
          backgroundColor: 'var(--theme-bg, #ffffff)',
          color: 'var(--theme-text, #0f172a)',
          borderColor: 'var(--theme-border, #e2e8f0)',
        }}
        className="theme-canvas rounded-2xl shadow-sm border min-h-[520px] flex flex-col self-start transition-colors duration-200"
      >
        {/* Browser chrome dots */}
        <div
          className="flex items-center justify-center py-2 border-b gap-1.5 shrink-0"
          style={{ borderColor: 'var(--theme-border, rgba(0,0,0,0.06))' }}
        >
          <div className="w-2 h-2 rounded-full opacity-30" style={{ backgroundColor: 'var(--theme-text, #94a3b8)' }} />
          <div className="w-16 h-1.5 rounded-full opacity-20" style={{ backgroundColor: 'var(--theme-text, #94a3b8)' }} />
          <div className="w-2 h-2 rounded-full opacity-30" style={{ backgroundColor: 'var(--theme-text, #94a3b8)' }} />
        </div>

        <div onClick={deselect} className="flex-1 flex flex-col">
          <RowsCanvas rows={rows} hops={[]} device={device} nested={false} />
        </div>
      </ThemeProvider>
    </div>
  );
}
